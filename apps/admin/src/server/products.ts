import "server-only";
import { and, asc, count, eq, ilike, inArray, ne, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@burla/core/db";
import {
  categories,
  media,
  productImages,
  productVariants,
  products,
} from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import { parsePackSize } from "@/lib/packSize";
import { toPaise, webAddressFrom, type ProductForm } from "@/lib/productForm";
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
 * Products, as the owner sees them: a photo, a name, a category, pack sizes
 * with prices, and whether it is on the website.
 *
 * Underneath, the same normalised tables as ever — `products`,
 * `product_variants`, `product_images`, `media` — and this module is the only
 * thing that translates between the two. Words like SKU, slug, variant and
 * status never leave it.
 *
 * The rules every write follows, in order: permission first; everything in
 * one transaction with its audit entry; refuse a save if someone else changed
 * the product since the form was opened; tell the shop afterwards.
 */

const categoryAlias = alias(categories, "category");
const subcategoryAlias = alias(categories, "subcategory");

// --- reading ----------------------------------------------------------------

export interface ProductCard {
  id: string;
  name: string;
  categoryName: string;
  subcategoryName: string | null;
  photoUrl: string | null;
  onWebsite: boolean;
  /** The cheapest available pack, which is what the shop leads with. */
  price: { rupees: number; size: string } | null;
  packCount: number;
  available: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  page?: number;
}

export const PAGE_SIZE = 24;

export async function listProducts(
  filters: ProductFilters,
): Promise<{ cards: ProductCard[]; total: number }> {
  const clauses: SQL[] = [ne(products.status, "archived")];
  if (filters.categoryId) clauses.push(eq(products.categoryId, filters.categoryId));
  if (filters.search) {
    const like = `%${filters.search}%`;
    const match = or(ilike(products.name, like), ilike(categoryAlias.name, like));
    if (match) clauses.push(match);
  }
  const where = and(...clauses);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        status: products.status,
        categoryName: categoryAlias.name,
        subcategoryName: subcategoryAlias.name,
      })
      .from(products)
      .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
      .leftJoin(subcategoryAlias, eq(subcategoryAlias.id, products.typeId))
      .where(where)
      .orderBy(asc(categoryAlias.sortOrder), asc(products.sortOrder), asc(products.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(products)
      .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
      .where(where),
  ]);

  const ids = rows.map((row) => row.id);
  const [packs, photos] = ids.length
    ? await Promise.all([
        db
          .select({
            productId: productVariants.productId,
            label: productVariants.label,
            priceMinor: productVariants.priceMinor,
            status: productVariants.status,
          })
          .from(productVariants)
          .where(and(inArray(productVariants.productId, ids), ne(productVariants.status, "removed"))),
        db
          .select({ productId: productImages.productId, key: media.r2Key })
          .from(productImages)
          .innerJoin(media, eq(media.id, productImages.mediaId))
          .where(and(inArray(productImages.productId, ids), eq(productImages.isPrimary, true))),
      ])
    : [[], []];

  const cards = rows.map((row): ProductCard => {
    const mine = packs.filter((pack) => pack.productId === row.id);
    const available = mine.filter((pack) => pack.status === "active");
    const cheapest = [...(available.length ? available : mine)].sort(
      (a, b) => a.priceMinor - b.priceMinor,
    )[0];
    const photo = photos.find((p) => p.productId === row.id);

    return {
      id: row.id,
      name: row.name,
      categoryName: row.categoryName,
      subcategoryName: row.subcategoryName,
      photoUrl: photo ? photoUrl(photo.key) || null : null,
      onWebsite: row.status === "published",
      price: cheapest ? { rupees: cheapest.priceMinor / 100, size: cheapest.label } : null,
      packCount: mine.length,
      available: available.length > 0,
    };
  });

  return { cards, total: totals[0]?.n ?? 0 };
}

export interface EditableProduct {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  visible: boolean;
  photoUrl: string | null;
  packs: { id: string; size: string; price: number; available: boolean }[];
  advanced: { shortLine: string; webAddress: string; onHomepage: boolean };
  updatedAt: string;
}

export async function getProduct(id: string): Promise<EditableProduct | undefined> {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), ne(products.status, "archived")))
    .limit(1);
  if (!row) return undefined;

  const [packs, [photo]] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, id), ne(productVariants.status, "removed")))
      .orderBy(asc(productVariants.netWeightGrams), asc(productVariants.sortOrder)),
    db
      .select({ key: media.r2Key })
      .from(productImages)
      .innerJoin(media, eq(media.id, productImages.mediaId))
      .where(and(eq(productImages.productId, id), eq(productImages.isPrimary, true)))
      .limit(1),
  ]);

  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    subcategoryId: row.typeId ?? "",
    description: row.description,
    visible: row.status === "published",
    photoUrl: photo ? photoUrl(photo.key) || null : null,
    packs: packs.map((pack) => ({
      id: pack.id,
      size: pack.label,
      price: pack.priceMinor / 100,
      available: pack.status === "active",
    })),
    advanced: {
      shortLine: row.shortDescriptor,
      webAddress: row.slug,
      onHomepage: row.featured,
    },
    updatedAt: row.updatedAt.toISOString(),
  };
}

// --- saving -----------------------------------------------------------------

export type SaveResult =
  | { ok: true; id: string; message: string; note?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** A web address nobody else uses: "mango-pickle", then "mango-pickle-2". */
async function freeWebAddress(wanted: string, exceptId?: string): Promise<string> {
  const base = wanted || "product";
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const [taken] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        exceptId
          ? and(eq(products.slug, candidate), ne(products.id, exceptId))
          : eq(products.slug, candidate),
      )
      .limit(1);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** An internal code for a pack, unique across the shop. Never shown. */
async function freeCode(webAddress: string, amount: number, taken: Set<string>): Promise<string> {
  const stem = `BGA-${webAddress.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 32)}-${amount}`;
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? stem : `${stem}-${n}`;
    if (taken.has(candidate)) continue;
    const [exists] = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.sku, candidate))
      .limit(1);
    if (!exists) {
      taken.add(candidate);
      return candidate;
    }
  }
  return `${stem}-${Date.now()}`;
}

async function checkCategories(
  categoryId: string,
  subcategoryId: string,
): Promise<string | undefined> {
  const [category] = await db
    .select({ id: categories.id, parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!category || category.parentId) return "Please choose a category from the list.";

  if (subcategoryId) {
    const [sub] = await db
      .select({ parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, subcategoryId))
      .limit(1);
    if (!sub || sub.parentId !== categoryId) {
      return "That subcategory belongs to a different category. Please choose again.";
    }
  }
  return undefined;
}

export async function saveProduct(
  actor: Actor,
  productId: string | null,
  form: ProductForm,
  photo: File | undefined,
): Promise<SaveResult> {
  requireCapability(actor, "catalogue.write");
  // Showing or hiding a product on the website is its own permission; staff
  // who may edit a description may not decide what customers see.
  requireCapability(actor, "catalogue.publish");

  const categoryProblem = await checkCategories(form.categoryId, form.subcategoryId);
  if (categoryProblem) {
    return { ok: false, message: categoryProblem, fieldErrors: { categoryId: categoryProblem } };
  }

  const existing = productId ? await getProduct(productId) : undefined;
  if (productId && !existing) {
    return { ok: false, message: "This product no longer exists. It may have been deleted." };
  }
  if (existing && form.expectedUpdatedAt && existing.updatedAt !== form.expectedUpdatedAt) {
    return {
      ok: false,
      message:
        "Someone else changed this product while you were editing it. Please reload the page and make your change again.",
    };
  }

  // Packs being kept must belong to this product: an id from another
  // product's form must not be able to rewrite that product's prices.
  const keptIds = form.packs.flatMap((pack) => (pack.id === "new" ? [] : [pack.id]));
  if (existing) {
    const mine = new Set(existing.packs.map((pack) => pack.id));
    if (keptIds.some((id) => !mine.has(id))) {
      return { ok: false, message: "The pack sizes on this page are out of date. Please reload and try again." };
    }
  } else if (keptIds.length > 0) {
    return { ok: false, message: "The pack sizes on this page are out of date. Please reload and try again." };
  }

  const wantedAddress = form.advanced.webAddress || existing?.advanced.webAddress || webAddressFrom(form.name);
  const webAddress = await freeWebAddress(wantedAddress, productId ?? undefined);

  let stored: Awaited<ReturnType<typeof prepareUpload>> | undefined;
  if (photo) {
    try {
      stored = await prepareUpload(photo);
    } catch (error) {
      const message =
        error instanceof PhotoError ? error.message : "That photo could not be used. Please try another.";
      return { ok: false, message, fieldErrors: { photo: message } };
    }
  }

  // Old photo ids to tidy up after the commit.
  const oldPhotoIds: string[] = [];
  const codes = new Set<string>();
  let savedId = productId ?? "";

  try {
    await db.transaction(async (tx) => {
      const values = {
        name: form.name,
        slug: webAddress,
        categoryId: form.categoryId,
        typeId: form.subcategoryId || null,
        description: form.description,
        shortDescriptor: form.advanced.shortLine,
        featured: form.advanced.onHomepage,
        status: form.visible ? ("published" as const) : ("draft" as const),
        // Once the owner has saved a product it is theirs, not sample data.
        isSample: false,
      };

      if (productId) {
        const [current] = await tx
          .select({ publishedAt: products.publishedAt })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
        await tx
          .update(products)
          .set({
            ...values,
            publishedAt: form.visible ? (current?.publishedAt ?? new Date()) : current?.publishedAt,
          })
          .where(eq(products.id, productId));
      } else {
        const [created] = await tx
          .insert(products)
          .values({ ...values, publishedAt: form.visible ? new Date() : null })
          .returning({ id: products.id });
        savedId = created!.id;
      }

      // --- pack sizes ------------------------------------------------------
      const keep = new Set(keptIds);
      const gone = (existing?.packs ?? []).filter((pack) => !keep.has(pack.id));
      if (gone.length) {
        // Never a hard delete: past orders and the stock history refer to
        // packs by id. A removed pack disappears from the site and the admin.
        await tx
          .update(productVariants)
          .set({ status: "removed", isDefault: false })
          .where(inArray(productVariants.id, gone.map((pack) => pack.id)));
      }

      // Smallest first, and the first available one is the default the shop
      // opens on.
      const ordered = [...form.packs]
        .map((pack) => ({ pack, size: parsePackSize(pack.size)! }))
        .sort((a, b) => a.size.amount - b.size.amount);
      const defaultIndex = Math.max(0, ordered.findIndex(({ pack }) => pack.available));

      // Clear defaults first: one default per product is enforced by a unique
      // index, and rows are updated one at a time.
      await tx
        .update(productVariants)
        .set({ isDefault: false })
        .where(eq(productVariants.productId, savedId));

      for (const [index, { pack, size }] of ordered.entries()) {
        const packValues = {
          label: size.label,
          netWeightGrams: size.amount,
          priceMinor: toPaise(pack.price),
          status: pack.available ? ("active" as const) : ("inactive" as const),
          trackInventory: false,
          isDefault: index === defaultIndex,
          sortOrder: index,
        };
        if (pack.id === "new") {
          await tx.insert(productVariants).values({
            ...packValues,
            productId: savedId,
            sku: await freeCode(webAddress, size.amount, codes),
          });
        } else {
          await tx
            .update(productVariants)
            .set(packValues)
            .where(and(eq(productVariants.id, pack.id), eq(productVariants.productId, savedId)));
        }
      }

      // --- photo -----------------------------------------------------------
      if (stored || form.removePhoto) {
        const current = await tx
          .select({ id: productImages.id, mediaId: productImages.mediaId })
          .from(productImages)
          .where(eq(productImages.productId, savedId));
        oldPhotoIds.push(...current.map((row) => row.mediaId));
        if (current.length) {
          await tx.delete(productImages).where(eq(productImages.productId, savedId));
        }
        if (stored) {
          const mediaId = await recordUpload(tx, stored, photo?.name ?? "photo", actor.kind === "user" ? actor.userId : null);
          await tx.insert(productImages).values({
            productId: savedId,
            mediaId,
            altText: form.name,
            isPrimary: true,
            sortOrder: 0,
          });
        }
      }

      await writeAudit(tx, actor, {
        action: productId ? "product.saved" : "product.added",
        entityType: "product",
        entityId: savedId,
        changes: {
          name: form.name,
          ...(existing && existing.name !== form.name ? { renamedFrom: existing.name } : {}),
          onWebsite: form.visible,
          packs: ordered.map(({ pack, size }) => ({
            size: size.label,
            price: pack.price,
            available: pack.available,
          })),
          ...(stored ? { photo: "changed" } : form.removePhoto ? { photo: "removed" } : {}),
        },
      });
    });
  } catch (error) {
    await discard(stored);
    throw error;
  }

  for (const id of oldPhotoIds) await releaseIfUnused(id);

  const told = await revalidateStorefront({ catalogue: true, productSlug: webAddress });
  if (existing && existing.advanced.webAddress !== webAddress) {
    await revalidateStorefront({ catalogue: false, productSlug: existing.advanced.webAddress });
  }

  return {
    ok: true,
    id: savedId,
    message: productId ? "Saved." : "Product added.",
    note: told.ok ? undefined : "Saved. The website may take up to five minutes to show the change.",
  };
}

/**
 * "Delete" — the product leaves the website and the admin.
 *
 * Kept underneath, because past orders refer to it. The owner never needs to
 * know that; to them it is gone.
 */
export async function deleteProduct(actor: Actor, productId: string): Promise<SaveResult> {
  requireCapability(actor, "catalogue.publish");

  const product = await getProduct(productId);
  if (!product) return { ok: false, message: "This product no longer exists." };

  await db.transaction(async (tx) => {
    await tx.update(products).set({ status: "archived", featured: false }).where(eq(products.id, productId));
    await writeAudit(tx, actor, {
      action: "product.deleted",
      entityType: "product",
      entityId: productId,
      changes: { name: product.name },
    });
  });

  await revalidateStorefront({ catalogue: true, productSlug: product.advanced.webAddress });
  return { ok: true, id: productId, message: `${product.name} deleted.` };
}

/** Quick show/hide from the product list, without opening the editor. */
export async function setOnWebsite(
  actor: Actor,
  productId: string,
  visible: boolean,
): Promise<SaveResult> {
  requireCapability(actor, "catalogue.publish");

  const product = await getProduct(productId);
  if (!product) return { ok: false, message: "This product no longer exists." };
  if (visible && product.packs.length === 0) {
    return {
      ok: false,
      message: `${product.name} has no pack size yet. Open it, add a price, then show it on the website.`,
    };
  }

  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ publishedAt: products.publishedAt })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    await tx
      .update(products)
      .set({
        status: visible ? "published" : "draft",
        publishedAt: visible ? (row?.publishedAt ?? new Date()) : row?.publishedAt,
      })
      .where(eq(products.id, productId));
    await writeAudit(tx, actor, {
      action: visible ? "product.shown" : "product.hidden",
      entityType: "product",
      entityId: productId,
      changes: { name: product.name },
    });
  });

  await revalidateStorefront({ catalogue: true, productSlug: product.advanced.webAddress });
  return {
    ok: true,
    id: productId,
    message: visible ? `${product.name} is on the website.` : `${product.name} is hidden from the website.`,
  };
}

/**
 * Quick "Available" / "Out of stock" from the product list: every pack size of
 * the product at once. For one pack size only, the owner opens the editor.
 */
export async function setAvailable(
  actor: Actor,
  productId: string,
  available: boolean,
): Promise<SaveResult> {
  requireCapability(actor, "catalogue.write");

  const product = await getProduct(productId);
  if (!product) return { ok: false, message: "This product no longer exists." };
  if (product.packs.length === 0) {
    return { ok: false, message: `${product.name} has no pack size yet. Open it and add a price first.` };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(productVariants)
      .set({ status: available ? "active" : "inactive", updatedAt: new Date() })
      .where(and(eq(productVariants.productId, productId), ne(productVariants.status, "removed")));
    // An editor left open on this product must not quietly undo this.
    await tx.update(products).set({ updatedAt: new Date() }).where(eq(products.id, productId));
    await writeAudit(tx, actor, {
      action: available ? "product.available" : "product.out_of_stock",
      entityType: "product",
      entityId: productId,
      changes: { name: product.name },
    });
  });

  await revalidateStorefront({ catalogue: true, productSlug: product.advanced.webAddress });
  return {
    ok: true,
    id: productId,
    message: available ? `${product.name} is available.` : `${product.name} is marked out of stock.`,
  };
}

/** Everything the category and subcategory pickers need, in one query. */
export async function categoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

