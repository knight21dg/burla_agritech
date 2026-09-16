import "server-only";
import { unstable_cache } from "next/cache";
import { catalogService } from "@/server/services";
import type { Category, CategorySummary, Product } from "@/types/catalog";

/**
 * The catalogue as the storefront reads it: the service, wrapped in a cache
 * that the admin can invalidate.
 *
 * ## Why this file exists
 *
 * Pages used to import a TypeScript file, so "the catalogue" cost nothing to
 * read and could not change without a deployment. Now it is rows in Postgres,
 * which are two new problems: a page must not query on every request for data
 * that changes a few times a month, and an edit in the admin must appear
 * without a deployment. Both are solved here rather than in twelve pages.
 *
 * Every read is cached under a tag. When the admin changes a product it calls
 * `revalidateTag(CATALOGUE_TAG)` (and the per-entity tag), the cached entries
 * are dropped, and the affected pages re-render on the next request. Nothing
 * is rebuilt or redeployed.
 *
 * ## The rules
 *
 * - **Only cache what is public.** Everything here is published catalogue data,
 *   identical for every visitor. A customer's cart, order or address must never
 *   pass through this file — a shared cache keyed by nothing is how one
 *   person's data reaches another.
 * - **Tags, not timers.** `revalidate` below is a safety net for a tag we
 *   forgot to call, not the mechanism. Correctness comes from the tag.
 * - Search is not cached: the query is the input, the result set is unbounded,
 *   and it must reflect a withdrawal immediately.
 */

/** Everything catalogue-shaped. Any catalogue write invalidates this. */
export const CATALOGUE_TAG = "catalogue";

/** One product's own pages. */
export const productTag = (slug: string) => `product:${slug}`;

/** A category or type page, and the listings under it. */
export const categoryTag = (slug: string) => `category:${slug}`;

/**
 * A backstop, not the mechanism: if a tag is ever missed, the catalogue is at
 * most five minutes stale rather than stale until the next deployment.
 */
const SAFETY_NET_SECONDS = 300;

const cached = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string,
  tags: (...args: Args) => string[],
) =>
  ((...args: Args) =>
    unstable_cache(() => fn(...args), [key, ...args.map((a) => JSON.stringify(a))], {
      tags: tags(...args),
      revalidate: SAFETY_NET_SECONDS,
    })()) as (...args: Args) => Promise<Result>;

// --- taxonomy ---------------------------------------------------------------

export const listCategories = cached(
  () => catalogService.listCategories(),
  "categories",
  () => [CATALOGUE_TAG],
);

export const listCategoriesWithCounts = cached(
  () => catalogService.listCategoriesWithCounts(),
  "categories-with-counts",
  () => [CATALOGUE_TAG],
) as () => Promise<CategorySummary[]>;

export const listAllTypes = cached(
  () => catalogService.listAllTypes(),
  "all-types",
  () => [CATALOGUE_TAG],
) as () => Promise<Category[]>;

export const listTypes = cached(
  (categorySlug: string) => catalogService.listTypes(categorySlug),
  "types",
  (categorySlug) => [CATALOGUE_TAG, categoryTag(categorySlug)],
);

// --- products ---------------------------------------------------------------

export const listProducts = cached(
  () => catalogService.listProducts(),
  "products",
  () => [CATALOGUE_TAG],
) as () => Promise<Product[]>;

export const listFeatured = cached(
  (limit?: number) => catalogService.listFeatured(limit),
  "featured",
  () => [CATALOGUE_TAG],
);

export const listByCategory = cached(
  (categorySlug: string) => catalogService.listByCategory(categorySlug),
  "by-category",
  (categorySlug) => [CATALOGUE_TAG, categoryTag(categorySlug)],
);

export const listByType = cached(
  (categorySlug: string, typeSlug: string) =>
    catalogService.listByType(categorySlug, typeSlug),
  "by-type",
  (categorySlug) => [CATALOGUE_TAG, categoryTag(categorySlug)],
);

export const listProductSlugs = cached(
  () => catalogService.listProductSlugs(),
  "product-slugs",
  () => [CATALOGUE_TAG],
) as () => Promise<string[]>;

/** Type pages worth indexing — those holding more than one product. */
export const listIndexableTypePaths = cached(
  () => catalogService.listIndexableTypePaths(),
  "indexable-types",
  () => [CATALOGUE_TAG],
);

// --- composed page reads ----------------------------------------------------

export const getProductPage = cached(
  (slug: string) => catalogService.getProductPage(slug),
  "product-page",
  (slug) => [CATALOGUE_TAG, productTag(slug)],
);

export const getCategoryPage = cached(
  (slug: string) => catalogService.getCategoryPage(slug),
  "category-page",
  (slug) => [CATALOGUE_TAG, categoryTag(slug)],
);

export const getTypePage = cached(
  (categorySlug: string, typeSlug: string) =>
    catalogService.getTypePage(categorySlug, typeSlug),
  "type-page",
  (categorySlug) => [CATALOGUE_TAG, categoryTag(categorySlug)],
);

export const getCategory = cached(
  (slug: string) => catalogService.getCategory(slug),
  "category",
  (slug) => [CATALOGUE_TAG, categoryTag(slug)],
);

export const getType = cached(
  (categorySlug: string, typeSlug: string) =>
    catalogService.getType(categorySlug, typeSlug),
  "type",
  (categorySlug) => [CATALOGUE_TAG, categoryTag(categorySlug)],
);

// --- uncached ---------------------------------------------------------------

/** Searching is not cached: see the note at the top of this file. */
export const search = catalogService.search;

/** The cart's products. Read live — a price must not come from a stale entry. */
export const listBySlugs = catalogService.listBySlugs;
