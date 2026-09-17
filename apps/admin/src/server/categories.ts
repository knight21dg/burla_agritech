import "server-only";
import { and, asc, count, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@burla/core/db";
import { categories, media, products } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import { webAddressFrom } from "@/lib/productForm";
import {
  discard,
  photoUrl,
  prepareUpload,
  recordUpload,
  releaseIfUnused,
  PhotoError,
} from "@/server/photos";
import { revalidateStorefront } from "@/server/storefront";

/**
 * Categories and subcategories, as the owner sees them.
 *
 * Underneath, one table with a parent column — a subcategory is a category
 * with a parent — but the owner never needs to know that. They see a list of
 * categories, each with its photo, its number of products, and, where it has
 * them, its subcategories.
 *
 * Web addresses are made from the name when a category is created and then
 * left alone: renaming "Pickles" to "Homemade Pickles" must not break every
 * link to it.
 */

// --- reading ----------------------------------------------------------------

export interface SubcategoryRow {
  id: string;
  name: string;
  visible: boolean;
  productCount: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  visible: boolean;
  photoUrl: string | null;
  productCount: number;
  subcategories: SubcategoryRow[];
}

/**
 * Product counts, in two grouped queries rather than a subquery per row
 * (which Drizzle can render ambiguously — see the note in products.ts).
 * Deleted products are not counted: to the owner they are gone.
 */
async function counts(): Promise<{ byCategory: Map<string, number>; bySubcategory: Map<string, number> }> {
  const [direct, sub] = await Promise.all([
    db
      .select({ id: products.categoryId, n: count() })
      .from(products)
      .where(ne(products.status, "archived"))
      .groupBy(products.categoryId),
    db
      .select({ id: products.typeId, n: count() })
      .from(products)
      .where(and(ne(products.status, "archived"), isNotNull(products.typeId)))
      .groupBy(products.typeId),
  ]);
  return {
    byCategory: new Map(direct.map((row) => [row.id, row.n])),
    bySubcategory: new Map(sub.flatMap((row) => (row.id ? [[row.id, row.n] as const] : []))),
  };
}

export async function listCategories(): Promise<CategoryRow[]> {
  const [rows, tallies] = await Promise.all([
    db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        name: categories.name,
        status: categories.status,
        photoKey: media.r2Key,
      })
      .from(categories)
      .leftJoin(media, eq(media.id, categories.heroImageId))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    counts(),
  ]);

  return rows
    .filter((row) => row.parentId === null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      visible: row.status === "published",
      photoUrl: row.photoKey ? photoUrl(row.photoKey) || null : null,
      productCount: tallies.byCategory.get(row.id) ?? 0,
      subcategories: rows
        .filter((sub) => sub.parentId === row.id)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          visible: sub.status === "published",
          productCount: tallies.bySubcategory.get(sub.id) ?? 0,
        })),
    }));
}

export interface EditableCategory {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  photoUrl: string | null;
  webAddress: string;
  updatedAt: string;
  productCount: number;
  subcategories: SubcategoryRow[];
}

export async function getCategory(id: string): Promise<EditableCategory | undefined> {
  const all = await listCategories();
  const summary = all.find((row) => row.id === id);
  if (!summary) return undefined;

  const [row] = await db
    .select({ description: categories.description, slug: categories.slug, updatedAt: categories.updatedAt })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!row) return undefined;

  return {
    ...summary,
    description: row.description ?? "",
    webAddress: row.slug,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// --- saving -----------------------------------------------------------------

export type Result =
  | { ok: true; id: string; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export const categoryFormSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the category name.").max(80, "Please keep the name shorter."),
    description: z.string().trim().max(2000, "Please keep the description shorter."),
    visible: z.boolean(),
    removePhoto: z.boolean(),
    expectedUpdatedAt: z.string().optional(),
  })
  .strict();

export type CategoryForm = z.infer<typeof categoryFormSchema>;

export const subcategoryNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a name for the subcategory.")
  .max(80, "Please keep the name shorter.");

/** A web address free among its siblings: slugs are unique per parent. */
async function freeAddress(name: string, parentId: string | null): Promise<string> {
  const base = webAddressFrom(name) || "category";
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const [taken] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.slug, candidate),
          parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId),
        ),
      )
      .limit(1);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function nameTaken(name: string, parentId: string | null, exceptId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId));
  return rows.some((row) => row.id !== exceptId && row.name.toLowerCase() === name.toLowerCase());
}

export async function saveCategory(
  actor: Actor,
  categoryId: string | null,
  form: CategoryForm,
  photo: File | undefined,
): Promise<Result> {
  requireCapability(actor, "catalogue.write");
  requireCapability(actor, "catalogue.publish");

  const existing = categoryId ? await getCategory(categoryId) : undefined;
  if (categoryId && !existing) return { ok: false, message: "This category no longer exists." };
  if (existing && form.expectedUpdatedAt && existing.updatedAt !== form.expectedUpdatedAt) {
    return {
      ok: false,
      message: "Someone else changed this category while you were editing it. Please reload the page and try again.",
    };
  }
  if (await nameTaken(form.name, null, categoryId ?? undefined)) {
    const message = "There is already a category with that name.";
    return { ok: false, message, fieldErrors: { name: message } };
  }

  let stored: Awaited<ReturnType<typeof prepareUpload>> | undefined;
  if (photo) {
    try {
      stored = await prepareUpload(photo);
    } catch (error) {
      const message = error instanceof PhotoError ? error.message : "That photo could not be used. Please try another.";
      return { ok: false, message, fieldErrors: { photo: message } };
    }
  }

  let oldPhoto: string | null = null;
  let savedId = categoryId ?? "";
  let slug = existing?.webAddress ?? "";

  try {
    await db.transaction(async (tx) => {
      let heroImageId: string | null | undefined;
      if (stored || form.removePhoto) {
        if (categoryId) {
          const [row] = await tx
            .select({ heroImageId: categories.heroImageId })
            .from(categories)
            .where(eq(categories.id, categoryId))
            .limit(1);
          oldPhoto = row?.heroImageId ?? null;
        }
        heroImageId = stored
          ? await recordUpload(tx, stored, photo?.name ?? "photo", actor.kind === "user" ? actor.userId : null)
          : null;
      }

      const status = form.visible ? ("published" as const) : ("hidden" as const);

      if (categoryId) {
        const [row] = await tx
          .select({ publishedAt: categories.publishedAt })
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);
        await tx
          .update(categories)
          .set({
            name: form.name,
            description: form.description || null,
            status,
            publishedAt: form.visible ? (row?.publishedAt ?? new Date()) : row?.publishedAt,
            ...(heroImageId !== undefined ? { heroImageId } : {}),
          })
          .where(eq(categories.id, categoryId));
      } else {
        slug = await freeAddress(form.name, null);
        const [last] = await tx
          .select({ sortOrder: categories.sortOrder })
          .from(categories)
          .where(isNull(categories.parentId))
          .orderBy(desc(categories.sortOrder))
          .limit(1);
        const [created] = await tx
          .insert(categories)
          .values({
            name: form.name,
            slug,
            description: form.description || null,
            status,
            publishedAt: form.visible ? new Date() : null,
            // New categories go to the end of the list.
            sortOrder: (last?.sortOrder ?? 0) + 100,
            ...(heroImageId ? { heroImageId } : {}),
          })
          .returning({ id: categories.id });
        savedId = created!.id;
      }

      await writeAudit(tx, actor, {
        action: categoryId ? "category.saved" : "category.added",
        entityType: "category",
        entityId: savedId,
        changes: {
          name: form.name,
          ...(existing && existing.name !== form.name ? { renamedFrom: existing.name } : {}),
          onWebsite: form.visible,
          ...(stored ? { photo: "changed" } : form.removePhoto ? { photo: "removed" } : {}),
        },
      });
    });
  } catch (error) {
    await discard(stored);
    throw error;
  }

  await releaseIfUnused(oldPhoto);
  await revalidateStorefront({ catalogue: true, categorySlug: slug });
  return { ok: true, id: savedId, message: categoryId ? "Saved." : "Category added." };
}

async function parentOf(id: string) {
  const [row] = await db
    .select({ id: categories.id, parentId: categories.parentId, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return row;
}

export async function addSubcategory(actor: Actor, parentId: string, rawName: string): Promise<Result> {
  requireCapability(actor, "catalogue.write");

  const name = subcategoryNameSchema.safeParse(rawName);
  if (!name.success) return { ok: false, message: name.error.issues[0]!.message };

  const parent = await parentOf(parentId);
  if (!parent || parent.parentId) return { ok: false, message: "That category no longer exists." };
  if (await nameTaken(name.data, parentId)) {
    return { ok: false, message: `${parent.name} already has a subcategory called ${name.data}.` };
  }

  const slug = await freeAddress(name.data, parentId);
  let id = "";
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(categories)
      .values({ parentId, name: name.data, slug, status: "published", publishedAt: new Date() })
      .returning({ id: categories.id });
    id = created!.id;
    await writeAudit(tx, actor, {
      action: "subcategory.added",
      entityType: "category",
      entityId: id,
      changes: { name: name.data, in: parent.name },
    });
  });

  await revalidateStorefront({ catalogue: true, categorySlug: parent.slug });
  return { ok: true, id, message: `${name.data} added.` };
}

export async function updateSubcategory(
  actor: Actor,
  id: string,
  change: { name?: string; visible?: boolean },
): Promise<Result> {
  requireCapability(actor, "catalogue.write");
  if (change.visible !== undefined) requireCapability(actor, "catalogue.publish");

  const sub = await parentOf(id);
  if (!sub?.parentId) return { ok: false, message: "That subcategory no longer exists." };
  const parent = await parentOf(sub.parentId);

  let name: string | undefined;
  if (change.name !== undefined) {
    const parsed = subcategoryNameSchema.safeParse(change.name);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
    if (await nameTaken(parsed.data, sub.parentId, id)) {
      return { ok: false, message: `There is already a subcategory called ${parsed.data}.` };
    }
    name = parsed.data;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({
        ...(name ? { name } : {}),
        ...(change.visible !== undefined
          ? { status: change.visible ? ("published" as const) : ("hidden" as const), publishedAt: new Date() }
          : {}),
      })
      .where(eq(categories.id, id));
    await writeAudit(tx, actor, {
      action: "subcategory.saved",
      entityType: "category",
      entityId: id,
      changes: {
        ...(name && name !== sub.name ? { name, renamedFrom: sub.name } : { name: sub.name }),
        ...(change.visible !== undefined ? { onWebsite: change.visible } : {}),
      },
    });
  });

  await revalidateStorefront({ catalogue: true, categorySlug: parent?.slug });
  return { ok: true, id, message: "Saved." };
}

export async function deleteSubcategory(actor: Actor, id: string): Promise<Result> {
  requireCapability(actor, "catalogue.write");

  const sub = await parentOf(id);
  if (!sub?.parentId) return { ok: false, message: "That subcategory no longer exists." };

  const [inUse] = await db.select({ n: count() }).from(products).where(eq(products.typeId, id));
  if ((inUse?.n ?? 0) > 0) {
    return {
      ok: false,
      message: `${sub.name} still has ${inUse!.n} ${inUse!.n === 1 ? "product" : "products"}. Move them to another subcategory first, or hide it instead.`,
    };
  }

  const parent = await parentOf(sub.parentId);
  await db.transaction(async (tx) => {
    await tx.delete(categories).where(eq(categories.id, id));
    await writeAudit(tx, actor, {
      action: "subcategory.deleted",
      entityType: "category",
      entityId: id,
      changes: { name: sub.name, in: parent?.name },
    });
  });

  await revalidateStorefront({ catalogue: true, categorySlug: parent?.slug });
  return { ok: true, id, message: `${sub.name} deleted.` };
}
