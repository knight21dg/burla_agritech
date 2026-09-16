import type { Product, Variant } from "@/types/catalog";
import type { CartLine } from "./cartStore";

/** A cart line with the product and pack size it refers to, for display. */
export interface ResolvedLine {
  line: CartLine;
  product: Product;
  variant?: Variant;
  /** Where the product sits, for the line's second row of text. */
  trail: { categoryName?: string; typeName?: string };
}

/**
 * Totals for display.
 *
 * `resolveLines` used to live here too, reading the catalogue straight out of
 * the browser bundle. The catalogue is in Postgres now, so resolving is a
 * server action (`app/cart/actions.ts`) and this file keeps only the part
 * that is pure arithmetic over what came back.
 *
 * What an order costs is still decided by the server when it is placed, from
 * its own records. These numbers are what the shopper sees, not what they
 * are charged.
 */
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
