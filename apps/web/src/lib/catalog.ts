/**
 * Catalogue helpers that need no database.
 *
 * Pure functions over the read models in `@/types/catalog`. They live here,
 * not in a service, because client components use them — `ProductBuyPanel`
 * picks a variant, `SearchOverlay` formats a price — and a client component
 * must never import from `server/`.
 *
 * Nothing here queries. If a function needs a row it does not already have,
 * it belongs in a service.
 */
import type { Availability, Product, Variant } from "@/types/catalog";

/** The canonical URL for a product. Flat, so it survives recategorisation. */
export function productHref(product: Pick<Product, "slug">): string {
  return `/products/p/${product.slug}`;
}

export function categoryHref(slug: string): string {
  return `/products/${slug}`;
}

export function typeHref(categorySlug: string, typeSlug: string): string {
  return `/products/${categorySlug}/${typeSlug}`;
}

/**
 * The variant a product page opens on.
 *
 * The database enforces at most one default per product (a partial unique
 * index), but not that there is one — a product may legitimately have a single
 * variant nobody flagged. Falling back to the first is correct, and the
 * non-null assertion is safe only because callers hold a product that came
 * from a service, and a product with no variants cannot be published.
 */
export function defaultVariant(product: Product): Variant {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0]!;
}

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  enquire_only: "Enquire",
};

/**
 * Turns stock into the label a customer sees.
 *
 * Availability is derived at read time rather than stored, so there is exactly
 * one definition of what "low stock" means and it cannot go stale.
 * docs/PRODUCT-DOMAIN.md §8.
 */
export function deriveAvailability(input: {
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}): Availability {
  if (!input.trackInventory) return "enquire_only";
  if (input.stockQuantity <= 0) return "out_of_stock";
  if (input.stockQuantity <= input.lowStockThreshold) return "low_stock";
  return "in_stock";
}

/** True when at least one variant can actually be bought. */
export function isPurchasable(product: Product): boolean {
  return product.variants.some(
    (v) => v.availability === "in_stock" || v.availability === "low_stock",
  );
}
