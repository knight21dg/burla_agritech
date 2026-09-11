import type { ReactNode } from "react";
import { formatPrice } from "@/lib/utils";

/**
 * The "Price details" box, as Flipkart titles it: items, subtotal, delivery,
 * and whatever action follows. The same box on the cart and checkout pages,
 * so the numbers never differ between them. Sticky beside the lines on
 * desktop.
 *
 * The subtotal is shown only once every line has a price; until then it says
 * so rather than adding up the lines that happen to have one.
 */
export function PriceDetails({
  count,
  unpriced,
  subtotalMinor,
  delivery,
  children,
}: {
  count: number;
  unpriced: number;
  subtotalMinor: number;
  delivery: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 lg:sticky lg:top-[calc(var(--site-chrome)+1.5rem)]">
      <h2 id="price-details" className="t-label text-ink-3">
        Price details
      </h2>
      <dl className="mt-4 space-y-3 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Items</dt>
          <dd className="tabular-nums text-ink">{count}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-ink">
            {unpriced === 0 ? formatPrice(subtotalMinor) : "To be confirmed"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Delivery</dt>
          <dd className="text-ink-3">{delivery}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
