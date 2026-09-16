import "server-only";
import { and, asc, count, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import { db } from "@burla/core/db";
import { categories, products, type CategoryStatus } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import type { CategoryInput, NewCategoryInput } from "@/lib/taxonomy";
import { revalidateStorefront } from "@/server/storefront";
import type { WriteResult } from "./catalogueService";

/**
 * Categories and types.
 *
 * They are one table and one set of functions, because a type *is* a category
 * with a parent (docs/PRODUCT-DOMAIN.md §2). Two near-identical modules would
 * drift, and the database would not care which one wrote the row.
 *
 * Where a row sits in the tree is set when it is created and never afterwards.
 * Re-parenting a type would move every product under it and break every link
 * to it at once; if that is ever genuinely wanted it should be a deliberate
 * migration, not a select box.
 */

export interface TaxonomyRow {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  shortName: string | null;
  description: string | null;
  heroHeadline: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tone: string;
  status: CategoryStatus;
  sortOrder: number;
  isSample: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  /** Products filed directly here. A range's own count excludes its types'. */
  productCount: number;
}

const rowColumns = {
  id: categories.id,
  parentId: categories.parentId,
  name: categories.name,
  slug: categories.slug,
  shortName: categories.shortName,
  description: categories.description,
  heroHeadline: categories.heroHeadline,
  seoTitle: categories.seoTitle,
  seoDescription: categories.seoDescription,
  tone: categories.tone,
  status: categories.status,
  sortOrder: categories.sortOrder,
  isSample: categories.isSample,
  publishedAt: categories.publishedAt,
  updatedAt: categories.updatedAt,
} as const;

/**
 * How many products sit in each category, counted separately.
 *
 * Two grouped queries rather than a correlated subquery inside the select.
 * That is not a style preference: a correlated `where p.category_id = <outer
 * id>` written by hand renders the outer column *unqualified* when the query
 * has no join, Postgres then resolves it against the subquery's own table —
 * `p.category_id = p.id` — and every count silently comes back zero. Wrong
 * numbers with no error is the worst failure a report can have, so the counts
 * are computed where they cannot be ambiguous.
 */
async function countsByCategory(): Promise<Map<string, number>> {
  const [direct, byType] = await Promise.all([
    db
      .select({ id: products.categoryId, n: count() })
      .from(products)
      .groupBy(products.categoryId),
    db
      .select({ id: products.typeId, n: count() })
      .from(products)
      .where(isNotNull(products.typeId))
      .groupBy(products.typeId),
  ]);

  const counts = new Map<string, number>();
  for (const row of [...direct, ...byType]) {
    if (!row.id) continue;
    counts.set(row.id, (counts.get(row.id) ?? 0) + row.n);
  }
  return counts;
}

/** Everything, both levels, in display order. */
export async function listAll(): Promise<TaxonomyRow[]> {
  const [rows, counts] = await Promise.all([
    db.select(rowColumns).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    countsByCategory(),
  ]);

  return rows.map((row) => ({ ...row, productCount: counts.get(row.id) ?? 0 }));
}

export async function find(id: string): Promise<TaxonomyRow | undefined> {
  const [row] = await db.select(rowColumns).from(categories).where(eq(categories.id, id)).limit(1);
  if (!row) return undefined;

  const [tally] = await db
    .select({ n: count() })
    .from(products)
    .where(or(eq(products.categoryId, id), eq(products.typeId, id)));

  return { ...row, productCount: tally?.n ?? 0 };
}

/** The parent's slug, for the revalidation call — a type invalidates its range. */
async function slugsFor(row: TaxonomyRow): Promise<string> {
  if (!row.parentId) return row.slug;
  const [parent] = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, row.parentId))
    .limit(1);
  return parent?.slug ?? row.slug;
}

async function tellStorefront(categorySlug: string): Promise<string | undefined> {
  const result = await revalidateStorefront({ catalogue: true, categorySlug });
  return result.ok
    ? undefined
    : `Saved, but the public site was not told to refresh (${result.reason}). It will catch up within five minutes.`;
}

/** Slugs are unique within a parent, not globally — so the check must be too. */
async function slugTaken(
  slug: string,
  parentId: string | null,
  exceptId?: string,
): Promise<boolean> {
  const where = and(
    eq(categories.slug, slug),
    parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId),
    exceptId ? ne(categories.id, exceptId) : undefined,
  );
  const [row] = await db.select({ id: categories.id }).from(categories).where(where).limit(1);
  return Boolean(row);
}

export async function createCategory(
  actor: Actor,
  input: NewCategoryInput,
): Promise<WriteResult & { id?: string }> {
  requireCapability(actor, "catalogue.write");

  if (input.parentId) {
    // A type cannot have a type. The database enforces this with a trigger;
    // catching it here turns a constraint violation into a sentence.
    const parent = await find(input.parentId);
    if (!parent) return { ok: false, code: "NOT_FOUND", message: "That range no longer exists." };
    if (parent.parentId) {
      return {
        ok: false,
        code: "BLOCKED",
        message: "A type cannot sit inside another type. The catalogue is two levels deep.",
      };
    }
  }

  if (await slugTaken(input.slug, input.parentId)) {
    return {
      ok: false,
      code: "CONFLICT",
      message: input.parentId
        ? "That range already has a type with this slug."
        : "Another range already uses that slug.",
    };
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(categories)
      .values({
        parentId: input.parentId,
        name: input.name,
        slug: input.slug,
        shortName: input.shortName || null,
        heroHeadline: input.heroHeadline || null,
        description: input.description || null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        tone: input.tone,
        sortOrder: input.sortOrder,
        // Created out of sight. Someone decides it is ready, separately.
        status: "draft",
      })
      .returning({ id: categories.id });

    await writeAudit(tx, actor, {
      action: input.parentId ? "type.created" : "category.created",
      entityType: "category",
      entityId: row!.id,
      changes: { name: input.name, slug: input.slug, parentId: input.parentId },
    });

    return row!.id;
  });

  return { ok: true, message: "Created as a draft.", id: created };
}

export async function updateCategory(
  actor: Actor,
  id: string,
  input: CategoryInput,
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.write");

  const current = await find(id);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "That range no longer exists." };

  if (current.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
    return {
      ok: false,
      code: "STALE",
      message:
        "Someone else saved this while you were editing it. Reload the page to see their changes, then make yours again.",
    };
  }

  if (await slugTaken(input.slug, current.parentId, id)) {
    return { ok: false, code: "CONFLICT", message: "That slug is already taken here." };
  }

  const changed: Record<string, unknown> = {};
  const note = (key: string, before: unknown, after: unknown) => {
    if (before !== after) changed[key] = { from: before, to: after };
  };
  note("name", current.name, input.name);
  note("slug", current.slug, input.slug);
  note("shortName", current.shortName ?? "", input.shortName);
  note("heroHeadline", current.heroHeadline ?? "", input.heroHeadline);
  note("description", current.description ?? "", input.description);
  note("seoTitle", current.seoTitle ?? "", input.seoTitle);
  note("seoDescription", current.seoDescription ?? "", input.seoDescription);
  note("tone", current.tone, input.tone);
  note("sortOrder", current.sortOrder, input.sortOrder);

  if (Object.keys(changed).length === 0) return { ok: true, message: "Nothing had changed." };

  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({
        name: input.name,
        slug: input.slug,
        shortName: input.shortName || null,
        heroHeadline: input.heroHeadline || null,
        description: input.description || null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        tone: input.tone,
        sortOrder: input.sortOrder,
      })
      .where(eq(categories.id, id));

    await writeAudit(tx, actor, {
      action: current.parentId ? "type.updated" : "category.updated",
      entityType: "category",
      entityId: id,
      changes: changed,
    });
  });

  const stale = await tellStorefront(await slugsFor(current));
  return { ok: true, message: "Saved.", staleCache: stale };
}

/**
 * Publishing a range, or taking it out of the navigation.
 *
 * `hidden` is not `draft`: a hidden range keeps its page for anyone holding
 * the link, but leaves the header and the listings. That is what a seasonal
 * range wants, and deleting one would take its products with it.
 */
export async function setCategoryStatus(
  actor: Actor,
  id: string,
  status: CategoryStatus,
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.publish");

  const current = await find(id);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "That range no longer exists." };
  if (current.status === status) return { ok: true, message: `Already ${status}.` };

  if (status === "published" && current.parentId) {
    // A type in an unpublished range would be reachable by URL and invisible
    // in navigation — a page with no way in.
    const parent = await find(current.parentId);
    if (parent && parent.status !== "published") {
      return {
        ok: false,
        code: "BLOCKED",
        message: `Publish ${parent.name} first — a type cannot be public while the range it belongs to is not.`,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({
        status,
        publishedAt:
          status === "published" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(categories.id, id));

    await writeAudit(tx, actor, {
      action: `category.${status}`,
      entityType: "category",
      entityId: id,
      changes: { status: { from: current.status, to: status } },
    });
  });

  const stale = await tellStorefront(await slugsFor(current));
  return {
    ok: true,
    message:
      status === "published"
        ? "Published — it is in the navigation now."
        : status === "hidden"
          ? "Hidden from the navigation. The page still works for anyone with the link."
          : "Back to draft.",
    staleCache: stale,
  };
}

/**
 * Deleting — only ever an empty one.
 *
 * The database refuses to delete a category that products point at
 * (`on delete restrict`), which is correct and produces an error nobody can
 * read. So the count is checked first and the answer is a sentence. A range
 * with products is hidden, never deleted: deleting would either orphan them
 * or take them with it, and an order that happened must not change.
 */
export async function deleteCategory(actor: Actor, id: string): Promise<WriteResult> {
  requireCapability(actor, "catalogue.write");

  const current = await find(id);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "That range no longer exists." };

  const [children] = await db
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.parentId, id));

  if (current.productCount > 0 || (children?.n ?? 0) > 0) {
    return {
      ok: false,
      code: "BLOCKED",
      message:
        current.productCount > 0
          ? `This holds ${current.productCount} ${current.productCount === 1 ? "product" : "products"}. Move or archive them first, or hide this instead of deleting it.`
          : "This has types inside it. Delete or move those first.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(categories).where(eq(categories.id, id));
    await writeAudit(tx, actor, {
      action: current.parentId ? "type.deleted" : "category.deleted",
      entityType: "category",
      entityId: id,
      changes: { name: current.name, slug: current.slug },
    });
  });

  const stale = await tellStorefront(await slugsFor(current));
  return { ok: true, message: `${current.name} deleted.`, staleCache: stale };
}
