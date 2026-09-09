/**
 * The catalogue service — what pages call.
 *
 * This is the async replacement for `data/catalog.ts`. Names and return shapes
 * match the thirteen functions the frontend consumes today
 * (docs/CURRENT-ARCHITECTURE.md §6.2), so the Phase 8 cutover is
 * `productsByCategory(slug)` becoming `await listByCategory(slug)` and nothing
 * else. Components keep their props; the rendered HTML must be identical.
 *
 * Layering (docs/SYSTEM-DESIGN.md §2): a page may call this, this may call a
 * repository, a repository may call the database. Never skip, never reverse.
 * There is no Drizzle import in this file and there never should be.
 *
 * Why a service at all, when several of these are one-line pass-throughs:
 * because the ones that are not — `getTrail`, `search`, `listTypesWithProducts`
 * — are business rules, and a page should not have to know which is which.
 */
import "server-only";
import * as categoryRepository from "@/server/repositories/categoryRepository";
import * as productRepository from "@/server/repositories/productRepository";
import type {
  Category,
  CategorySummary,
  Product,
  ProductTrail,
  SearchResults,
} from "@/types/catalog";

// --- taxonomy ---------------------------------------------------------------

/** The ten top-level categories, in display order. */
export function listCategories(): Promise<Category[]> {
  return categoryRepository.listTopLevel();
}

/** Categories with their product counts — for the category grid. */
export function listCategoriesWithCounts(): Promise<CategorySummary[]> {
  return categoryRepository.listTopLevelWithCounts();
}

export function getCategory(slug: string): Promise<Category | undefined> {
  return categoryRepository.findBySlug(slug);
}

export function listTypes(categorySlug: string): Promise<Category[]> {
  return categoryRepository.listTypes(categorySlug);
}

export function getType(
  categorySlug: string,
  typeSlug: string,
): Promise<Category | undefined> {
  return categoryRepository.findType(categorySlug, typeSlug);
}

export function listAllTypes(): Promise<Category[]> {
  return categoryRepository.listAllTypes();
}

// --- products ---------------------------------------------------------------

export function listProducts(): Promise<Product[]> {
  return productRepository.listAll();
}

export function getProduct(slug: string): Promise<Product | undefined> {
  return productRepository.findBySlug(slug);
}

export function listByCategory(categorySlug: string): Promise<Product[]> {
  return productRepository.listByCategory(categorySlug);
}

export function listByType(
  categorySlug: string,
  typeSlug: string,
): Promise<Product[]> {
  return productRepository.listByType(categorySlug, typeSlug);
}

export function listFeatured(limit = 12): Promise<Product[]> {
  return productRepository.listFeatured(limit);
}

/** Same type first, then the rest of the category. Never the product itself. */
export function listRelated(product: Product, limit = 4): Promise<Product[]> {
  return productRepository.listRelated(
    product.id,
    product.categorySlug,
    product.typeSlug,
    limit,
  );
}

// --- composed reads ---------------------------------------------------------

/**
 * Breadcrumb context for a product: Home / Category / Type / Product.
 *
 * Two lookups in parallel rather than in sequence — they do not depend on each
 * other, and a product page should not pay for two round trips to render a
 * breadcrumb.
 */
export async function getTrail(product: Product): Promise<ProductTrail> {
  const [category, type] = await Promise.all([
    categoryRepository.findBySlug(product.categorySlug),
    product.typeSlug
      ? categoryRepository.findType(product.categorySlug, product.typeSlug)
      : Promise.resolve(undefined),
  ]);

  return { category, type };
}

/**
 * Everything a product page needs, in one call.
 *
 * The product, its breadcrumb trail and its related products, fetched with the
 * two independent halves in parallel. Related products need the product first,
 * so that dependency is real; the trail and the related list are not dependent
 * on each other and run together.
 *
 * Returns undefined for an unknown or unpublished slug, which the page turns
 * into a 404 — never a 403, which would confirm the row exists.
 */
export async function getProductPage(slug: string): Promise<
  | {
      product: Product;
      trail: ProductTrail;
      related: Product[];
    }
  | undefined
> {
  const product = await productRepository.findBySlug(slug);
  if (!product) return undefined;

  const [trail, related] = await Promise.all([
    getTrail(product),
    listRelated(product),
  ]);

  return { product, trail, related };
}

/**
 * A category page: the category, its types, and its products.
 *
 * All three in parallel. Undefined when the category does not exist, so the
 * caller can 404 without a second query to find out why.
 */
export async function getCategoryPage(slug: string): Promise<
  | {
      category: Category;
      types: Category[];
      products: Product[];
    }
  | undefined
> {
  const [category, types, list] = await Promise.all([
    categoryRepository.findBySlug(slug),
    categoryRepository.listTypes(slug),
    productRepository.listByCategory(slug),
  ]);

  if (!category) return undefined;
  return { category, types, products: list };
}

/**
 * A type page: the parent category, the type, its siblings and its products.
 */
export async function getTypePage(
  categorySlug: string,
  typeSlug: string,
): Promise<
  | {
      category: Category;
      type: Category;
      siblings: Category[];
      products: Product[];
    }
  | undefined
> {
  const [category, type, siblings, list] = await Promise.all([
    categoryRepository.findBySlug(categorySlug),
    categoryRepository.findType(categorySlug, typeSlug),
    categoryRepository.listTypes(categorySlug),
    productRepository.listByType(categorySlug, typeSlug),
  ]);

  if (!category || !type) return undefined;
  return { category, type, siblings, products: list };
}

// --- search -----------------------------------------------------------------

/**
 * Search across products and category names.
 *
 * A query under two characters returns an empty result rather than an error:
 * the search overlay fires on every keystroke, and the first letter is not a
 * mistake the user should be told about.
 *
 * Only published rows, regardless of who is asking.
 */
export async function search(
  query: string,
  limit = 20,
): Promise<SearchResults> {
  const term = query.trim();

  if (term.length < 2) {
    return { query: term, products: [], categories: [], total: 0 };
  }

  const [matchedProducts, allCategories] = await Promise.all([
    productRepository.search(term, limit),
    categoryRepository.listTopLevel(),
  ]);

  // Category matching is a substring test over ten rows already in memory.
  // A query for that would be a round trip to filter a list we hold.
  const needle = term.toLowerCase();
  const matchedCategories = allCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(needle) ||
      category.shortName.toLowerCase().includes(needle),
  );

  return {
    query: term,
    products: matchedProducts,
    categories: matchedCategories,
    total: matchedProducts.length + matchedCategories.length,
  };
}

// --- routing helpers --------------------------------------------------------

/** Published product slugs, for `generateStaticParams` and the sitemap. */
export function listProductSlugs(): Promise<string[]> {
  return productRepository.listPublishedSlugs();
}

/**
 * Type pages worth indexing: those holding more than one product.
 *
 * A type with a single product is a page navigation skips straight past, and
 * indexing it creates a near-duplicate of the product page (`SITEMAP.md`).
 * The rule lives here rather than in `sitemap.ts` so the sitemap and any
 * future canonical logic cannot disagree.
 */
export async function listIndexableTypePaths(): Promise<
  { categorySlug: string; typeSlug: string }[]
> {
  const [types, counts] = await Promise.all([
    categoryRepository.listAllTypes(),
    productRepository.countByType(),
  ]);

  return types
    .filter((type) => {
      const parentSlug = type.parentSlug;
      if (!parentSlug) return false;
      return (counts.get(`${parentSlug}/${type.slug}`) ?? 0) > 1;
    })
    .map((type) => ({
      categorySlug: type.parentSlug!,
      typeSlug: type.slug,
    }));
}
