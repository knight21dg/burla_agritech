import type { ReactNode } from "react";
import { DELIVERY_RULE, deliveryFeeMinor } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";

/**
 * The "Price details" box, as Flipkart titles it: items, subtotal, delivery,
 * total, and whatever action follows. The same box on the cart and checkout
 * pages, so the numbers never differ between them. Sticky beside the lines
 * on desktop.
 *
 * The delivery charge comes from the one rule the server also applies
 * (lib/delivery.ts); the server recomputes everything when the order is
 * placed, so this is what the shopper will be charged, not a promise of it.
 * Until every line has a price, the totals say so rather than adding up the
 * lines that happen to have one.
 */
export function PriceDetails({
  count,
  unpriced,
  subtotalMinor,
  children,
}: {
  count: number;
  unpriced: number;
  subtotalMinor: number;
  children?: ReactNode;
}) {
  const priced = unpriced === 0;
  const delivery = deliveryFeeMinor(subtotalMinor);
  const toFree = DELIVERY_RULE.freeFromMinor - subtotalMinor;

  return (
    <div className="rounded-lg border border-line bg-white p-5 lg:sticky lg:top-[calc(var(--site-chrome)+1.5rem)]">
      <h2 id="price-details" className="t-label text-ink-3">
        Price details
      </h2>
      <dl className="mt-4 space-y-3 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">
            Items ({count})
          </dt>
          <dd className="tabular-nums text-ink">
            {priced ? formatPrice(subtotalMinor) : "To be confirmed"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Delivery</dt>
          <dd className="tabular-nums text-ink">
            {!priced ? "To be confirmed" : delivery === 0 ? (
              <span className="font-medium text-green-700">Free</span>
            ) : (
              formatPrice(delivery)
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between gap-4 border-t border-line pt-4 text-[1rem] font-semibold text-ink">
        <span>Total</span>
        <span className="tabular-nums">
          {priced ? formatPrice(subtotalMinor + delivery) : "To be confirmed"}
        </span>
      </div>
      {priced && toFree > 0 && (
        <p className="mt-2 text-[0.8125rem] text-ink-3">
          Add {formatPrice(toFree)} more for free delivery.
        </p>
      )}
      {children}
    </div>
  );
}
