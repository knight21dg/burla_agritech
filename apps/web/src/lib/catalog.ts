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
import type { Availability, Category, Product, Variant } from "@/types/catalog";

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
 * variant nobody flagged, so the first is the fallback. Undefined when a
 * product has no pack sizes yet.
 */
export function defaultVariant(product: Product): Variant | undefined {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

/** A type as the chips render it: its name, how many products, where it goes. */
export interface TypeChip {
  slug: string;
  name: string;
  count: number;
  href: string;
}

/**
 * Types with their product counts, worked out from a list the caller already
 * has.
 *
 * Deliberately a pure function over loaded products rather than a query per
 * chip: a category page holds its products anyway, and seven chips must not
 * become seven round trips once the catalogue is in a database.
 *
 * A type holding exactly one product links straight to that product, so
 * nobody lands on a page containing a single card (PRODUCT-TAXONOMY §1.1).
 */
export function typeChips(
  categorySlug: string,
  types: Category[],
  products: Product[],
): TypeChip[] {
  return types.map((type) => {
    const inType = products.filter((p) => p.typeSlug === type.slug);
    const only = inType.length === 1 ? inType[0] : undefined;
    return {
      slug: type.slug,
      name: type.name,
      count: inType.length,
      href: only ? productHref(only) : typeHref(categorySlug, type.slug),
    };
  });
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
  status: "active" | "inactive" | "removed";
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}): Availability {
  // The owner said "not available" in the admin. Shown, not hidden: a
  // customer who knows the pack exists is told it is out, rather than
  // wondering where it went.
  if (input.status !== "active") return "out_of_stock";
  // Stock is not being counted for this pack, so it is simply on sale.
  // (Stock counting is internal, and off for anything the owner manages by
  // hand: nothing runs out behind their back with no screen to restock it.)
  if (!input.trackInventory) return "in_stock";
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
