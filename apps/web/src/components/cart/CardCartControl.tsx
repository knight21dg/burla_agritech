"use client";

import { ShoppingCart } from "lucide-react";
import { defaultVariant, type Product } from "@/data/catalog";
import { addToCart, useCart } from "./cartStore";
import { QuantityStepper } from "./QuantityStepper";

/**
 * The product card's cart control, as on Amazon Fresh and Flipkart Grocery:
 * a cart button until the product is in the cart, then a − qty + stepper in
 * its place, so the card itself shows what the cart holds. No pop-up and no
 * page change — the header's count moves with it.
 *
 * Adds the default pack size. A product with several pack sizes is chosen on
 * its own page; one with none yet (price to be confirmed) is added as it is.
 *
 * Raised above the card's stretched link so it stays independently clickable.
 */
export function CardCartControl({ product }: { product: Product }) {
  const { qtyOf } = useCart();
  const variant = defaultVariant(product);
  const soldOut = variant?.availability === "out_of_stock";
  const qty = qtyOf(product.slug, variant?.id);

  if (qty > 0) {
    return (
      <QuantityStepper
        size="sm"
        slug={product.slug}
        variantId={variant?.id}
        qty={qty}
        name={product.name}
        className="relative z-10 shrink-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart(product.slug, variant?.id)}
      disabled={soldOut}
      aria-label={`Add ${product.name} to cart`}
      className="relative z-10 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-green-700 transition-colors hover:bg-green-50 disabled:opacity-35 disabled:hover:bg-transparent"
    >
      <ShoppingCart className="size-[1.2rem]" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
