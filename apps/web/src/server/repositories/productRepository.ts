/**
 * Every query against `products` and `product_variants`.
 *
 * The rule this file exists to keep: **twelve products must never mean
 * twenty-five queries.** A product is only useful with its variants, so every
 * read here fetches both in one round trip and assembles them in memory —
 * docs/SYSTEM-DESIGN.md §6.
 *
 * Public methods filter to `status = 'published'` themselves. There is no
 * `includeUnpublished` flag to forget: a draft product is invisible here
 * regardless of who is asking (docs/AUTHORIZATION.md §6).
 */
import "server-only";
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { deriveAvailability } from "@/lib/catalog";
import { db } from "@/server/db";
import { categories, productVariants, products } from "@/server/db/schema";
import type { Product, Variant } from "@/types/catalog";

const categoryAlias = alias(categories, "category");
const typeAlias = alias(categories, "type");

/**
 * The product columns, plus the two slugs the read model carries.
 *
 * `categorySlug` and `typeSlug` are joined rather than stored on the row, but
 * the join is to the same table twice and costs nothing — and it keeps the
 * denormalised ids out of the read model, where a component might be tempted
 * to use one as a URL.
 */
const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  shortDescriptor: products.shortDescriptor,
  description: products.description,
  featured: products.featured,
  sortOrder: products.sortOrder,
  tone: products.tone,
  categorySlug: categoryAlias.slug,
  typeSlug: typeAlias.slug,
} as const;

const variantColumns = {
  id: productVariants.id,
  productId: productVariants.productId,
  label: productVariants.label,
  sku: productVariants.sku,
  priceMinor: productVariants.priceMinor,
  mrpMinor: productVariants.mrpMinor,
  netWeightGrams: productVariants.netWeightGrams,
  stockQuantity: productVariants.stockQuantity,
  lowStockThreshold: productVariants.lowStockThreshold,
  trackInventory: productVariants.trackInventory,
  isDefault: productVariants.isDefault,
  sortOrder: productVariants.sortOrder,
} as const;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  shortDescriptor: string;
  description: string;
  featured: boolean;
  sortOrder: number;
  tone: Product["tone"];
  categorySlug: string | null;
  typeSlug: string | null;
};

type VariantRow = {
  id: string;
  productId: string;
  label: string;
  sku: string;
  priceMinor: number;
  mrpMinor: number | null;
  netWeightGrams: number;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  isDefault: boolean;
  sortOrder: number;
};

function toVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    label: row.label,
    sku: row.sku,
    priceMinor: row.priceMinor,
    ...(row.mrpMinor !== null ? { mrpMinor: row.mrpMinor } : {}),
    netWeightGrams: row.netWeightGrams,
    availability: deriveAvailability(row),
    // Always emitted, never omitted when false. `isDefault` is a property
    // every variant has, and a key that appears only sometimes makes two
    // equivalent variants compare unequal.
    isDefault: row.isDefault,
  };
}

/**
 * Joins products to their variants.
 *
 * Two queries, not one: a join would repeat every product column once per
 * variant, and assembling the variant rows into their products in JavaScript
 * is cheaper than shipping the duplication over the wire. It is still O(1)
 * queries regardless of how many products come back, which is the thing that
 * matters.
 *
 * Order is preserved from the product query — `IN` does not guarantee an
 * ordering, so the variants are indexed by product id rather than zipped.
 */
async function withVariants(rows: ProductRow[]): Promise<Product[]> {
  if (rows.length === 0) return [];

  const variantRows = await db
    .select(variantColumns)
    .from(productVariants)
    .where(
      and(
        inArray(
          productVariants.productId,
          rows.map((row) => row.id),
        ),
        eq(productVariants.status, "active"),
      ),
    )
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.label));

  const byProduct = new Map<string, Variant[]>();
  for (const row of variantRows) {
    const list = byProduct.get(row.productId);
    if (list) list.push(toVariant(row));
    else byProduct.set(row.productId, [toVariant(row)]);
  }

  // Products with no active variant are returned, with `variants: []`, not
  // filtered out. The client's catalogue (2026-09-10) names every product but
  // supplies no pack sizes or prices yet, so dropping variant-less products
  // would serve an empty site. The interface shows "price to be confirmed"
  // and disables ordering for them; the publish guard still keeps anything
  // without a price and its legal fields from going live.
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    // Non-null: `products.category_id` is NOT NULL and a trigger holds it to
    // a top-level category, so the join always matches.
    categorySlug: row.categorySlug!,
    ...(row.typeSlug ? { typeSlug: row.typeSlug } : {}),
    shortDescriptor: row.shortDescriptor,
    description: row.description,
    variants: byProduct.get(row.id) ?? [],
    ...(row.featured ? { featured: true } : {}),
    tone: row.tone,
  }));
}

/** The base select, joined to both taxonomy levels and filtered to published. */
function publishedProducts() {
  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(eq(products.status, "published"));
}

/** Every published product, in display order. */
export async function listAll(): Promise<Product[]> {
  const rows = await publishedProducts().orderBy(
    asc(products.sortOrder),
    asc(products.name),
  );

  return withVariants(rows);
}

export async function findBySlug(slug: string): Promise<Product | undefined> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .limit(1);

  const [product] = await withVariants(rows);
  return product;
}

/** Everything in a category, including products filed under its types. */
export async function listByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(
      and(eq(categoryAlias.slug, categorySlug), eq(products.status, "published")),
    )
    .orderBy(asc(products.sortOrder), asc(products.name));

  return withVariants(rows);
}

/** Just the products of one type. Both slugs, because a type slug is not global. */
export async function listByType(
  categorySlug: string,
  typeSlug: string,
): Promise<Product[]> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .innerJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(
      and(
        eq(categoryAlias.slug, categorySlug),
        eq(typeAlias.slug, typeSlug),
        eq(products.status, "published"),
      ),
    )
    .orderBy(asc(products.sortOrder), asc(products.name));

  return withVariants(rows);
}

export async function listFeatured(limit = 12): Promise<Product[]> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(and(eq(products.featured, true), eq(products.status, "published")))
    .orderBy(asc(products.sortOrder), asc(products.name))
    .limit(limit);

  return withVariants(rows);
}

/**
 * Same type first, then the rest of the category. Never the product itself.
 *
 * The ordering is done in SQL rather than by fetching the category and
 * slicing: a category with two hundred products should not travel over the
 * wire to produce four cards.
 */
export async function listRelated(
  productId: string,
  categorySlug: string,
  typeSlug: string | undefined,
  limit = 4,
): Promise<Product[]> {
  // Built conditionally rather than falling back to a constant. In Postgres,
  // `ORDER BY 1` is a POSITIONAL reference to the first selected column, not
  // the literal one — a constant here silently sorted by product id, which is
  // a UUID, so "related products" came back in random order for every product
  // without a type. Caught by the parity check, not by review.
  const ordering = typeSlug
    ? [
        asc(
          sql<number>`CASE WHEN ${typeAlias.slug} = ${typeSlug} THEN 0 ELSE 1 END`,
        ),
        asc(products.sortOrder),
        asc(products.name),
      ]
    : [asc(products.sortOrder), asc(products.name)];

  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(
      and(
        eq(categoryAlias.slug, categorySlug),
        ne(products.id, productId),
        eq(products.status, "published"),
      ),
    )
    .orderBy(...ordering)
    .limit(limit);

  return withVariants(rows);
}

/**
 * Full-text search, with a trigram fallback.
 *
 * Two things Postgres full-text alone will not do, both of which matter here:
 *
 *   - Category and type names are not in `search_vector`, because a generated
 *     column cannot see another table. They are matched through the join.
 *   - Stemming will not connect "vadiyalu" to "vadialu". Trigram similarity
 *     will, which is why `pg_trgm` is installed.
 *
 * Ranking puts a full-text hit above a fuzzy one, so an exact match is never
 * buried under a near-miss.
 */
export async function search(query: string, limit = 20): Promise<Product[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const tsQuery = sql`plainto_tsquery('english', ${term})`;
  const pattern = `%${term}%`;

  const textMatch = sql`${products.searchVector} @@ ${tsQuery}`;
  const nameSimilar = sql`${products.name} % ${term}`;

  const rank = sql<number>`
    GREATEST(
      ts_rank(${products.searchVector}, ${tsQuery}),
      similarity(${products.name}, ${term})
    )
  `;

  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .leftJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(
      and(
        eq(products.status, "published"),
        or(
          textMatch,
          nameSimilar,
          // The taxonomy names, which the generated vector cannot reach.
          sql`${categoryAlias.name} ILIKE ${pattern}`,
          sql`${typeAlias.name} ILIKE ${pattern}`,
        ),
      ),
    )
    .orderBy(desc(rank), asc(products.sortOrder))
    .limit(limit);

  return withVariants(rows);
}

/**
 * Slugs of every published product, for `generateStaticParams` and the sitemap.
 * Deliberately not the full product: those callers need one column.
 */
export async function listPublishedSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.status, "published"))
    .orderBy(asc(products.slug));

  return rows.map((row) => row.slug);
}

/**
 * How many published products sit under each type, keyed by
 * `"{categorySlug}/{typeSlug}"`.
 *
 * The sitemap excludes type pages holding one product, because navigation
 * skips straight past them and indexing them creates near-duplicates
 * (`SITEMAP.md`). One grouped query rather than one per type.
 */
export async function countByType(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      categorySlug: categoryAlias.slug,
      typeSlug: typeAlias.slug,
      total: sql<number>`count(*)::int`,
    })
    .from(products)
    .innerJoin(categoryAlias, eq(categoryAlias.id, products.categoryId))
    .innerJoin(typeAlias, eq(typeAlias.id, products.typeId))
    .where(eq(products.status, "published"))
    .groupBy(categoryAlias.slug, typeAlias.slug);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(`${row.categorySlug}/${row.typeSlug}`, row.total);
  }
  return counts;
}
