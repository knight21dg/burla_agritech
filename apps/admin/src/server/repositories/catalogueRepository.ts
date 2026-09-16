import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@burla/core/db";
import {
  categories,
  productVariants,
  products,
  type ProductStatus,
} from "@burla/core/db/schema";

/**
 * Catalogue reads for the admin.
 *
 * Separate from the storefront's repository on purpose. Every public query
 * there filters to `status = 'published'` with no flag to forget; the admin
 * must see drafts and archived rows, so it gets its own queries rather than a
 * shared one with an `includeUnpublished` argument that a public caller could
 * one day pass (docs/AUTHORIZATION.md §6).
 *
 * Nothing here checks permissions. That happens one layer up, in the service,
 * before this file is reached — these functions assume the decision is made.
 */

const categoryAlias = alias(categories, "category");
const typeAlias = alias(categories, "type");

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  status: ProductStatus;
  featured: boolean;
  isSample: boolean;
  categoryName: string;
  typeName: string | null;
  updatedAt: Date;
  variantCount: number;
  /** Cheapest active pack, in paise. Null when the product has no packs. */
  fromPriceMinor: number | null;
  stock: number;
}

export interface ProductFilters {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  featured?: boolean;
  page?: number;
  perPage?: number;
}

const PER_PAGE = 25;

function whereFor(filters: ProductFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    // Name or SKU: the two things staff have in front of them. `ilike` with a
    // leading wildcard cannot use the b-tree index, but the trigram index on
    // name can, and 63 products is not a scan worth optimising further.
    const like = `%${filters.q}%`;
    const match = or(
      ilike(products.name, like),
      ilike(products.slug, like),
      // Built rather than hand-written, for the reason in listProducts below:
      // a correlated subquery written as SQL text can bind to the wrong table
      // and quietly match nothing.
      inArray(
        products.id,
        db
          .select({ id: productVariants.productId })
          .from(productVariants)
          .where(ilike(productVariants.sku, like)),
      ),
    );
    if (match) clauses.push(match);
  }
  if (filters.status) clauses.push(eq(products.status, filters.status));
  if (filters.categoryId) clauses.push(eq(products.categoryId, filters.categoryId));
  if (filters.featured !== undefined) {
    clauses.push(eq(products.featured, filters.featured));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * One page of products, with everything the table shows.
 *
 * Two queries and a join in the application, not a correlated subquery per
 * column. Writing `where v.product_id = <outer id>` by hand inside a `sql`
 * template is only safe while the outer query happens to have a join —
 * without one, Drizzle renders the outer column unqualified, Postgres binds
 * it to the subquery's own table, and every number silently comes back zero.
 * The pack counts are aggregated for the page's ids instead, where nothing is
 * ambiguous.
 */
export async function listProducts(
  filters: ProductFilters,
): Promise<{ rows: ProductRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, filters.perPage ?? PER_PAGE);
  const where = whereFor(filters);

  const rowsQuery = db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      status: products.status,
      featured: products.featured,
      isSample: products.isSample,
      categoryName: categoryAlias.name,
      typeName: typeAlias.name,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .orderBy(desc(products.updatedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const totalQuery = db.select({ n: count() }).from(products);

  const [rows, totalRows] = await Promise.all([
    where ? rowsQuery.where(where) : rowsQuery,
    where ? totalQuery.where(where) : totalQuery,
  ]);

  const ids = rows.map((row) => row.id);
  const packs =
    ids.length === 0
      ? []
      : await db
          .select({
            productId: productVariants.productId,
            variantCount: count(),
            fromPriceMinor: sql<number | null>`min(${productVariants.priceMinor}) filter (where ${productVariants.status} = 'active')::int`,
            stock: sql<number>`coalesce(sum(${productVariants.stockQuantity}), 0)::int`,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, ids))
          .groupBy(productVariants.productId);

  const byProduct = new Map(packs.map((row) => [row.productId, row]));

  return {
    rows: rows.map((row) => {
      const tally = byProduct.get(row.id);
      return {
        ...row,
        variantCount: tally?.variantCount ?? 0,
        fromPriceMinor: tally?.fromPriceMinor ?? null,
        stock: tally?.stock ?? 0,
      };
    }),
    total: totalRows[0]?.n ?? 0,
  };
}

export interface AdminVariant {
  id: string;
  label: string;
  sku: string;
  priceMinor: number;
  mrpMinor: number | null;
  netWeightGrams: number;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  status: "active" | "inactive";
  isDefault: boolean;
  sortOrder: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  typeId: string | null;
  shortDescriptor: string;
  description: string;
  status: ProductStatus;
  featured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  searchKeywords: string[] | null;
  publishedAt: Date | null;
  isSample: boolean;
  updatedAt: Date;
  variants: AdminVariant[];
}

export async function findProduct(id: string): Promise<AdminProduct | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return undefined;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.netWeightGrams));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.categoryId,
    typeId: row.typeId,
    shortDescriptor: row.shortDescriptor,
    description: row.description,
    status: row.status,
    featured: row.featured,
    sortOrder: row.sortOrder,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    searchKeywords: row.searchKeywords,
    publishedAt: row.publishedAt,
    isSample: row.isSample,
    updatedAt: row.updatedAt,
    variants: variants.map((v) => ({
      id: v.id,
      label: v.label,
      sku: v.sku,
      priceMinor: v.priceMinor,
      mrpMinor: v.mrpMinor,
      netWeightGrams: v.netWeightGrams,
      stockQuantity: v.stockQuantity,
      lowStockThreshold: v.lowStockThreshold,
      trackInventory: v.trackInventory,
      status: v.status,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
    })),
  };
}

/** The slug of a product, for the revalidation call after a write. */
export async function slugOf(id: string): Promise<string | undefined> {
  const [row] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return row?.slug;
}

export interface TaxonomyOption {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
}

/**
 * Categories and their types, for the editor's two selects.
 *
 * One query, both levels: the taxonomy is exactly two deep and enforced as
 * such by a trigger, so there is no tree to walk.
 */
export async function listTaxonomy(): Promise<TaxonomyOption[]> {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(asc(categories.parentId), asc(categories.sortOrder), asc(categories.name));
}
