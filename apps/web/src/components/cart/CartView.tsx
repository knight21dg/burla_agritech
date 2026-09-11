"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Lock, ShoppingCart } from "lucide-react";
import { ProductPhoto } from "@/components/product/ProductPhoto";
import { ButtonLink } from "@/components/ui/Button";
import { productHref, trailFor } from "@/data/catalog";
import { formatPrice } from "@/lib/utils";
import { removeFromCart, useCart } from "./cartStore";
import { cartTotals, resolveLines } from "./lines";
import { PriceDetails } from "./PriceDetails";
import { QuantityStepper } from "./QuantityStepper";

const noop = () => () => {};

/**
 * The cart's contents, laid out as Amazon and Flipkart lay theirs: the lines
 * on the left, each with its picture, pack size, price, a − qty + stepper and
 * Remove; a "Price details" summary on the right, sticky on desktop.
 *
 * Prices are read from the catalogue here, never stored in the cart. Most
 * products have none yet, so a line says "Price to be confirmed" and the
 * subtotal is only shown once every line has a price. Checkout is open to
 * walk through; the server prices the order itself when it is placed, and
 * refuses one with unpriced items.
 */
export function CartView() {
  const { items, count } = useCart();
  // The cart lives in the browser, so the server renders it empty. Until the
  // browser's copy is read, show nothing rather than a flash of "empty".
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return <div className="min-h-[40vh]" aria-busy="true" />;

  const lines = resolveLines(items);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto size-10 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="t-h3 mt-4">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-ink-2">
          Add products from any of our ranges and they will wait here.
        </p>
        <ButtonLink href="/products" className="mt-6">
          Explore our products
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    );
  }

  const { unpriced, subtotalMinor } = cartTotals(lines);

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
      <section aria-label="Items in your cart" className="lg:col-span-8">
        <p className="text-[0.875rem] text-ink-3">
          {count} {count === 1 ? "item" : "items"}
        </p>
        <ul className="mt-3 border-t border-line">
          {lines.map(({ line, product, variant }) => {
            const { category, type } = trailFor(product);
            const href = productHref(product);
            return (
              <li
                key={`${line.slug}:${line.variantId ?? ""}`}
                className="flex gap-4 border-b border-line py-5"
              >
                <Link
                  href={href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="w-24 shrink-0 overflow-hidden rounded-md border border-line sm:w-28"
                >
                  <ProductPhoto product={product} decorative />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <h2 className="text-[0.9375rem] font-semibold leading-snug text-ink">
                        <Link href={href} className="hover:text-green-700">
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-3">
                        {type ? `${category?.name} · ${type.name}` : category?.name}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-3">
                        {variant ? variant.label : "Pack size to be confirmed"}
                      </p>
                    </div>
                    {variant ? (
                      <p className="text-[1rem] font-semibold tabular-nums text-ink">
                        {formatPrice(variant.priceMinor * line.qty)}
                      </p>
                    ) : (
                      <p className="text-[0.8125rem] font-medium text-ink-3">
                        Price to be confirmed
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-5 pt-3">
                    <QuantityStepper
                      size="sm"
                      slug={line.slug}
                      variantId={line.variantId}
                      qty={line.qty}
                      name={product.name}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.slug, line.variantId)}
                      className="text-[0.8125rem] font-medium text-ink-2 underline-offset-4 transition-colors hover:text-green-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside aria-labelledby="price-details" className="lg:col-span-4">
        <PriceDetails
          count={count}
          unpriced={unpriced}
          subtotalMinor={subtotalMinor}
        >
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
            <Lock className="size-4" aria-hidden="true" />
            Proceed to checkout
          </ButtonLink>
          {unpriced > 0 && (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
              {unpriced === lines.length
                ? "Prices for these products are still being confirmed"
                : `${unpriced} of these products are still awaiting prices`}
              . Orders can be placed once they are.
            </p>
          )}

          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-green-700 hover:underline"
          >
            Continue shopping
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </PriceDetails>
      </aside>
    </div>
  );
}
