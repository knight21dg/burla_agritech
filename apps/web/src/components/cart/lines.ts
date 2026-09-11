import { productBySlug, type Product, type Variant } from "@/data/catalog";
import type { CartLine } from "./cartStore";

/** A cart line with the product and pack size it refers to, for display. */
export interface ResolvedLine {
  line: CartLine;
  product: Product;
  variant?: Variant;
}

/**
 * The cart's lines, read against the catalogue for display — the cart and
 * checkout pages both show them. What an order costs is decided on the
 * server (`placeOrder`), never from these.
 */
export function resolveLines(items: readonly CartLine[]): ResolvedLine[] {
  return items.flatMap((line) => {
    const product = productBySlug(line.slug);
    if (!product) return [];
    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId)
      : undefined;
    return [{ line, product, variant }];
  });
}

export function cartTotals(lines: readonly ResolvedLine[]) {
  return {
    /** Total units. */
    count: lines.reduce((n, { line }) => n + line.qty, 0),
    /** Lines with no price yet. The subtotal means nothing until this is 0. */
    unpriced: lines.filter(({ variant }) => !variant).length,
    subtotalMinor: lines.reduce(
      (sum, { line, variant }) => sum + (variant ? variant.priceMinor * line.qty : 0),
      0,
    ),
  };
}
