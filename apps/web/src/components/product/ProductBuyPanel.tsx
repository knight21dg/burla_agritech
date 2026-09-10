"use client";

import { useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductPhoto } from "./ProductPhoto";
import {
  availabilityLabel,
  defaultVariant,
  type Product,
} from "@/data/catalog";
import { productEnquiry, whatsappLink } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Gallery, pack size and actions — the only interactive part of the product
 * page. Everything else is static and stays in the server component, so the
 * page ships very little JavaScript.
 *
 * The gallery adapts to however many images exist. With one image it shows
 * one, with no thumbnail strip and no empty slots — because most products will
 * start with a single photograph (IMAGE-ASSET-REQUIREMENTS §3).
 */
export function ProductBuyPanel({
  product,
  imageCount = 1,
}: {
  product: Product;
  imageCount?: number;
}) {
  const [variant, setVariant] = useState(defaultVariant(product));
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  // No pack sizes or prices have been supplied yet, so there may be no
  // variant at all: the price, pack size and availability then read "to be
  // confirmed", and only the WhatsApp enquiry is offered.
  const soldOut = variant?.availability === "out_of_stock";
  const orderable = Boolean(variant) && !soldOut;
  const images = Array.from({ length: Math.max(1, imageCount) });

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Gallery */}
      <div className="lg:col-span-7">
        <div className="border border-line">
          <ProductPhoto product={product} priority />
        </div>

        {images.length > 1 && (
          <ul className="mt-3 flex gap-3" aria-label="Product images">
            {images.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1} of ${images.length}`}
                  aria-current={active === i}
                  className={cn(
                    "block size-16 overflow-hidden border transition-colors sm:size-20",
                    active === i
                      ? "border-green-700"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <ProductImage name={product.name} showLabel={false} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Buy panel */}
      <div className="lg:col-span-5">
        <h1 className="t-h1">{product.name}</h1>
        {product.shortDescriptor && (
          <p className="t-lead mt-3">{product.shortDescriptor}</p>
        )}

        {/* No star rating: no real reviews exist, and inventing them is both a
            policy violation and a consumer-law problem. */}

        {variant ? (
          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-[1.625rem] font-semibold tabular-nums text-ink">
              {formatPrice(variant.priceMinor)}
            </span>
            <span className="text-[0.875rem] text-ink-3">
              {variant.label} · inclusive of all taxes
            </span>
          </p>
        ) : (
          <p className="mt-6 text-[1.0625rem] font-medium text-ink-3">
            Price and pack sizes to be confirmed
          </p>
        )}

        {product.variants.length > 1 && (
          <fieldset className="mt-7">
            <legend className="t-label mb-3 text-ink-3">Pack size</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={v.id === variant?.id}
                  disabled={v.availability === "out_of_stock"}
                  className={cn(
                    "rounded-sm border px-4 py-2 text-[0.875rem] font-medium transition-colors",
                    v.id === variant?.id
                      ? "border-green-700 bg-green-50 text-green-700"
                      : "border-line bg-white text-ink hover:border-line-strong",
                    v.availability === "out_of_stock" &&
                      "cursor-not-allowed opacity-40",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <p className="mt-5 flex items-center gap-2 text-[0.875rem]">
          <span
            className={cn(
              "size-2 rounded-full",
              soldOut || !variant ? "bg-ink-3" : "bg-green-700",
            )}
            aria-hidden="true"
          />
          <span className={soldOut || !variant ? "text-ink-2" : "text-ink"}>
            {variant ? availabilityLabel[variant.availability] : "Availability to be confirmed"}
          </span>
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center rounded-md border border-line">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="grid h-full w-10 place-items-center text-ink disabled:opacity-35"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span
              className="w-10 text-center text-[0.9375rem] font-semibold tabular-nums"
              aria-live="polite"
              aria-label={`Quantity ${qty}`}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              disabled={qty >= 20}
              aria-label="Increase quantity"
              className="grid h-full w-10 place-items-center text-ink disabled:opacity-35"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          <Button disabled={!orderable} className="min-w-[10rem] flex-1">
            <ShoppingBag className="size-4" aria-hidden="true" />
            Add to bag
          </Button>
        </div>

        <ButtonLink
          href={whatsappLink(
            productEnquiry(product.name, variant?.label, product.slug),
          )}
          external
          variant="whatsapp"
          size="lg"
          className="mt-3 w-full"
          data-analytics="whatsapp_click"
          data-source="pdp"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Ask about this product
        </ButtonLink>

        <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">
          Checkout is not enabled in this demo. Ordering currently runs through
          WhatsApp — see <code>OQ-001</code>.
        </p>
      </div>
    </div>
  );
}
