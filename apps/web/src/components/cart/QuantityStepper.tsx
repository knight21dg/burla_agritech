"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_QTY, stepCartQty } from "./cartStore";

/**
 * − qty + for a line in the cart — the control Amazon Fresh and Flipkart
 * Grocery put wherever a product is already in the cart. At one, the minus
 * becomes a bin, as on Amazon: the next press removes the item, and the icon
 * says so first.
 */
export function QuantityStepper({
  slug,
  variantId,
  qty,
  name,
  size = "md",
  className,
}: {
  slug: string;
  variantId?: string;
  qty: number;
  /** The product, for the buttons' accessible names. */
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";
  const button = cn(
    "grid h-full place-items-center transition-colors disabled:opacity-35",
    sm ? "w-8" : "w-10",
  );
  const icon = sm ? "size-3.5" : "size-4";

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-green-700 bg-white text-green-700",
        sm ? "h-9" : "h-11",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => stepCartQty(slug, variantId, -1)}
        aria-label={qty <= 1 ? `Remove ${name} from cart` : `Decrease ${name} quantity`}
        className={cn(button, "rounded-l-full hover:bg-green-50")}
      >
        {qty <= 1 ? (
          <Trash2 className={icon} aria-hidden="true" />
        ) : (
          <Minus className={icon} aria-hidden="true" />
        )}
      </button>
      <span
        className={cn(
          "text-center font-semibold tabular-nums text-ink",
          sm ? "min-w-6 text-[0.8125rem]" : "min-w-8 text-[0.9375rem]",
        )}
        aria-live="polite"
        aria-label={`${qty} in cart`}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => stepCartQty(slug, variantId, 1)}
        disabled={qty >= MAX_QTY}
        aria-label={`Increase ${name} quantity`}
        className={cn(button, "rounded-r-full hover:bg-green-50")}
      >
        <Plus className={icon} aria-hidden="true" />
      </button>
    </div>
  );
}
