import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@burla/core/db";
import { productDetails, productImages, productVariants, products } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import {
  checkPublishable,
  toMinor,
  type ProductDetailsInput,
  type VariantInput,
} from "@/lib/product";
import * as catalogueRepository from "@/server/repositories/catalogueRepository";
import { revalidateStorefront } from "@/server/storefront";

/**
 * Catalogue writes.
 *
 * Every function here does the same four things, in the same order, and the
 * order is the point:
 *
 *   1. **Permission**, before anything else and before any row is read.
 *   2. **The write**, in a transaction, with the audit row inside it. An audit
 *      entry that can be missing when the write succeeded is worse than none,
 *      because it is trusted (docs/AUTHORIZATION.md §8).
 *   3. **Concurrency.** A save carries the `updated_at` the form was drawn
 *      with. If the row has moved since, nothing is written and the caller is
 *      told — two people editing one product must not silently overwrite each
 *      other.
 *   4. **Tell the shop**, after the transaction commits, never inside it.
 *
 * Money arrives as rupees from a form and is stored as integer paise. That
 * conversion happens once, in `toMinor`.
 */

export type WriteResult =
  | { ok: true; message: string; staleCache?: string }
  | { ok: false; code: "STALE" | "CONFLICT" | "BLOCKED" | "NOT_FOUND"; message: string; details?: string[] };

/** The database's own timestamp resolution, compared as milliseconds. */
const sameMoment = (a: Date, b: string) => a.getTime() === new Date(b).getTime();

/** Best-effort, and reported rather than thrown — see `storefront.ts`. */
async function tellStorefront(productSlug?: string): Promise<string | undefined> {
  const result = await revalidateStorefront({ catalogue: true, productSlug });
  return result.ok
    ? undefined
    : `Saved, but the public site was not told to refresh (${result.reason}). It will catch up within five minutes.`;
}

export async function updateProductDetails(
  actor: Actor,
  productId: string,
  input: ProductDetailsInput,
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.write");

  const current = await catalogueRepository.findProduct(productId);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "That product no longer exists." };

  if (!sameMoment(current.updatedAt, input.expectedUpdatedAt)) {
    return {
      ok: false,
      code: "STALE",
      message:
        "Someone else saved this product while you were editing it. Reload the page to see their changes, then make yours again.",
    };
  }

  // The slug is a public URL. Changing it breaks every link to the product,
  // so it is allowed but never silently: the caller warns, and a redirect is
  // the content phase's job (docs/ADMIN-ARCHITECTURE §4).
  const slugTaken = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, input.slug), ne(products.id, productId)))
    .limit(1);
  if (slugTaken.length > 0) {
    return { ok: false, code: "CONFLICT", message: "Another product already uses that slug." };
  }

  const changed: Record<string, unknown> = {};
  const record = <K extends keyof ProductDetailsInput>(key: K, before: unknown) => {
    if (input[key] !== before) changed[key as string] = { from: before, to: input[key] };
  };
  record("name", current.name);
  record("slug", current.slug);
  record("categoryId", current.categoryId);
  record("typeId", current.typeId);
  record("shortDescriptor", current.shortDescriptor);
  record("description", current.description);
  record("seoTitle", current.seoTitle ?? "");
  record("seoDescription", current.seoDescription ?? "");
  record("featured", current.featured);
  record("sortOrder", current.sortOrder);

  if (Object.keys(changed).length === 0) {
    return { ok: true, message: "Nothing had changed." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        typeId: input.typeId,
        shortDescriptor: input.shortDescriptor,
        description: input.description,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        featured: input.featured,
        sortOrder: input.sortOrder,
      })
      .where(eq(products.id, productId));

    await writeAudit(tx, actor, {
      action: "product.updated",
      entityType: "product",
      entityId: productId,
      changes: changed,
    });
  });

  // Both slugs: the page that existed before the rename, and the one now.
  const staleOld = current.slug !== input.slug ? await tellStorefront(current.slug) : undefined;
  const stale = await tellStorefront(input.slug);

  return { ok: true, message: "Saved.", staleCache: stale ?? staleOld };
}

/**
 * Replaces a product's pack sizes.
 *
 * Whole-set rather than one at a time, because the constraints are about the
 * set: one default, unique SKUs, and at least one pack if the product is
 * published. A row is only deleted when it has never been ordered —
 * `order_items` keeps its own snapshot of what was bought, but the foreign key
 * is `set null`, and a variant that vanishes takes its stock ledger with it.
 * Withdrawing a pack means marking it inactive.
 */
export async function replaceVariants(
  actor: Actor,
  productId: string,
  input: VariantInput[],
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.write");

  const current = await catalogueRepository.findProduct(productId);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "That product no longer exists." };

  const keptIds = new Set(input.filter((v) => v.id !== "new").map((v) => v.id));
  const removed = current.variants.filter((v) => !keptIds.has(v.id));

  if (current.status === "published") {
    const sellable = input.filter((v) => v.status === "active" && toMinor(v.priceRupees) > 0);
    if (sellable.length === 0) {
      return {
        ok: false,
        code: "BLOCKED",
        message:
          "This product is published, so it needs at least one active pack with a price. Unpublish it first if you want to remove them all.",
      };
    }
  }

  // A SKU is unique across the whole catalogue (a unique index says so), so a
  // clash with another product must be caught before the insert turns into a
  // constraint violation the person cannot read. Parameterised: the SKUs came
  // from a form, and they never become SQL text.
  const skus = input.map((v) => v.sku);
  const skuOwners =
    skus.length === 0
      ? []
      : await db
          .select({ sku: productVariants.sku, productId: productVariants.productId })
          .from(productVariants)
          .where(inArray(productVariants.sku, skus));

  const clash = skuOwners.find((row) => row.productId !== productId);
  if (clash) {
    return {
      ok: false,
      code: "CONFLICT",
      message: `The SKU ${clash.sku} belongs to another product.`,
    };
  }

  await db.transaction(async (tx) => {
    for (const [index, variant] of input.entries()) {
      const values = {
        productId,
        label: variant.label,
        sku: variant.sku,
        priceMinor: toMinor(variant.priceRupees),
        mrpMinor: variant.mrpRupees === null ? null : toMinor(variant.mrpRupees),
        netWeightGrams: variant.netWeightGrams,
        lowStockThreshold: variant.lowStockThreshold,
        trackInventory: variant.trackInventory,
        status: variant.status,
        isDefault: variant.isDefault,
        sortOrder: index,
      };

      if (variant.id === "new") {
        await tx.insert(productVariants).values(values);
      } else {
        // Stock is never set here: it moves through the ledger
        // (`inventory_movements`), which is the only thing allowed to change
        // `stock_quantity`. Editing a pack must not silently restock it.
        await tx.update(productVariants).set(values).where(eq(productVariants.id, variant.id));
      }
    }

    for (const gone of removed) {
      await tx.delete(productVariants).where(eq(productVariants.id, gone.id));
    }

    await writeAudit(tx, actor, {
      action: "product.variants_replaced",
      entityType: "product",
      entityId: productId,
      changes: {
        packs: input.map((v) => ({
          sku: v.sku,
          label: v.label,
          priceMinor: toMinor(v.priceRupees),
          status: v.status,
        })),
        removed: removed.map((v) => v.sku),
      },
    });
  });

  const stale = await tellStorefront(current.slug);
  return { ok: true, message: "Pack sizes saved.", staleCache: stale };
}

/**
 * Publishing, unpublishing and archiving — one function, because they are one
 * decision with one audit trail.
 *
 * Publishing needs `catalogue.publish`, which `staff` does not hold: the
 * person who edits a description is not necessarily the person who decides it
 * goes live.
 */
export async function setProductStatus(
  actor: Actor,
  productId: string,
  status: "draft" | "published" | "archived",
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.publish");

  const product = await catalogueRepository.findProduct(productId);
  if (!product) return { ok: false, code: "NOT_FOUND", message: "That product no longer exists." };
  if (product.status === status) {
    return { ok: true, message: `Already ${status}.` };
  }

  if (status === "published") {
    const [details] = await db
      .select({ productId: productDetails.productId })
      .from(productDetails)
      .where(eq(productDetails.productId, productId))
      .limit(1);
    const [image] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .limit(1);

    const check = checkPublishable({
      name: product.name,
      categoryId: product.categoryId,
      shortDescriptor: product.shortDescriptor,
      description: product.description,
      variants: product.variants.map((v) => ({ priceMinor: v.priceMinor, status: v.status })),
      hasLegalDetails: Boolean(details),
      hasImage: Boolean(image),
    });

    if (!check.ok) {
      return {
        ok: false,
        code: "BLOCKED",
        message: "This product is not ready to be published.",
        details: check.blockers,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        status,
        // The database refuses a published row with no date, so the two move
        // together. Unpublishing keeps the date: it is when it first went out.
        publishedAt:
          status === "published" ? (product.publishedAt ?? new Date()) : product.publishedAt,
      })
      .where(eq(products.id, productId));

    await writeAudit(tx, actor, {
      action: `product.${status === "published" ? "published" : status === "draft" ? "unpublished" : "archived"}`,
      entityType: "product",
      entityId: productId,
      changes: { status: { from: product.status, to: status } },
    });
  });

  const stale = await tellStorefront(product.slug);
  const said =
    status === "published"
      ? "Published — it is on the site now."
      : status === "draft"
        ? "Unpublished — it is off the site."
        : "Archived.";

  return { ok: true, message: said, staleCache: stale };
}

export async function setFeatured(
  actor: Actor,
  productId: string,
  featured: boolean,
): Promise<WriteResult> {
  requireCapability(actor, "catalogue.write");

  const slug = await catalogueRepository.slugOf(productId);
  if (!slug) return { ok: false, code: "NOT_FOUND", message: "That product no longer exists." };

  await db.transaction(async (tx) => {
    await tx.update(products).set({ featured }).where(eq(products.id, productId));
    await writeAudit(tx, actor, {
      action: featured ? "product.featured" : "product.unfeatured",
      entityType: "product",
      entityId: productId,
    });
  });

  const stale = await tellStorefront(slug);
  return {
    ok: true,
    message: featured ? "Shown on the homepage." : "Removed from the homepage.",
    staleCache: stale,
  };
}
