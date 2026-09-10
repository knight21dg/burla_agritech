/**
 * Catalogue read models — the shapes the interface renders.
 *
 * Types only, and no imports. A client component can pull from here without
 * dragging a database driver into the browser bundle, and a service can return
 * these without the UI knowing what a Drizzle row looks like.
 *
 * They mirror the interfaces in `data/catalog.ts` deliberately: the Phase 8
 * cutover must not change a single component prop, and the acceptance test is
 * that the rendered HTML is identical (docs/MIGRATIONS.md §13). When
 * `catalog.ts` is deleted, this file is what remains.
 *
 * These are READ models. They are not the database schema, and they are not
 * write payloads — those are Zod schemas, added in Phase 9.
 */

/** The tint behind a card. Maps to the --color-tint-* tokens. */
export type Tone =
  | "turmeric"
  | "mango"
  | "chilli"
  | "leaf"
  | "grain"
  | "berry"
  | "earth"
  | "cream";

/**
 * Derived from stock at read time, never stored — docs/PRODUCT-DOMAIN.md §8.
 * `enquire_only` is what the whole catalogue shows if `OQ-001` lands on
 * enquiry-only.
 */
export type Availability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "enquire_only";

export interface Variant {
  id: string;
  label: string;
  sku: string;
  /** Minor units (paise). Never floats. */
  priceMinor: number;
  mrpMinor?: number;
  netWeightGrams: number;
  availability: Availability;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Always the top-level category, so breadcrumbs never need a recursive walk. */
  categorySlug: string;
  /** The type within that category, where one exists. */
  typeSlug?: string;
  shortDescriptor: string;
  description: string;
  variants: Variant[];
  featured?: boolean;
  tone: Tone;
  /**
   * TODO note for an item awaiting the client's confirmation. Carried by the
   * catalogue module only — the database has no column for it, so it is not
   * served from Postgres.
   */
  confirmation?: string;
}

export interface Category {
  slug: string;
  name: string;
  shortName: string;
  order: number;
  heroHeadline: string;
  description: string;
  tone: Tone;
  /** Present = this row is a TYPE sitting under that category. */
  parentSlug?: string;
  /** TODO note; catalogue module only (see Product.confirmation). */
  confirmation?: string;
}

/**
 * A category plus the number of published products in it.
 *
 * Exists because `CategoryCard` currently calls `productsByCategory().length`
 * during render. Against a database that is one query per card — an N+1 that
 * only appears once the data moves. The count comes back with the category
 * instead, from a single grouped query.
 */
export interface CategorySummary extends Category {
  productCount: number;
}

/** Breadcrumb context for a product. */
export interface ProductTrail {
  category?: Category;
  type?: Category;
}

/** What the search endpoint and the search page render. */
export interface SearchResults {
  query: string;
  products: Product[];
  categories: Category[];
  total: number;
}
