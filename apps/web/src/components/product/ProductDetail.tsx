"use client";

import { useState } from "react";
import { Minus, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  availabilityLabel,
  defaultVariant,
  type Product,
} from "@/data/catalog";
import { productEnquiry, whatsappLink } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";

const TABS = ["About", "Product information", "Storage", "Quality"] as const;
type Tab = (typeof TABS)[number];

/** Fields that are legally required for online food sale in India. */
const INFO_FIELDS = [
  "Ingredients",
  "Allergens",
  "Net quantity",
  "Shelf life",
  "Storage instructions",
  "Country of origin",
  "Manufacturer / packer",
  "FSSAI licence number",
  "Consumer care",
  "Veg / Non-veg",
];

export function ProductDetail({ product }: { product: Product }) {
  const [variant, setVariant] = useState(defaultVariant(product));
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(0);
  const [tab, setTab] = useState<Tab>("About");

  const soldOut = variant.availability === "out_of_stock";
  const gallery = [0, 1, 2, 3];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* ------------------------------------------------------------ Gallery */}
      <div className="lg:col-span-7">
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          <ul className="flex gap-3 sm:flex-col" aria-label="Product images">
            {gallery.map((g) => (
              <li key={g}>
                <button
                  type="button"
                  onClick={() => setImage(g)}
                  aria-label={`View image ${g + 1} of ${gallery.length}`}
                  aria-current={image === g}
                  className={cn(
                    "block size-16 overflow-hidden border transition-colors sm:size-20",
                    image === g
                      ? "border-green-900"
                      : "border-line hover:border-ink-3",
                  )}
                >
                  <ProductImage name={product.name} />
                </button>
              </li>
            ))}
          </ul>

          <div className="min-w-0 flex-1 border border-line bg-white">
            <ProductImage
              name={product.name}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- Buy panel */}
      <div className="lg:col-span-5">
        <h1 className="t-h1 text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)]">
          {product.name}
        </h1>
        <p className="t-lead mt-3">{product.shortDescriptor}</p>

        {/* No star rating: there are no real reviews, and inventing them is
            both a policy violation and a consumer-law problem. */}

        <div className="mt-6 flex items-baseline gap-3">
          <p className="text-[1.75rem] font-semibold tabular-nums text-green-900">
            {formatPrice(variant.priceMinor)}
          </p>
          <p className="text-[0.875rem] text-ink-2">
            {variant.label} · inclusive of all taxes
          </p>
        </div>

        {product.variants.length > 1 && (
          <fieldset className="mt-7">
            <legend className="t-label mb-3 text-ink-3">Pack size</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={v.id === variant.id}
                  disabled={v.availability === "out_of_stock"}
                  className={cn(
                    "rounded-sm border px-4 py-2 text-[0.875rem] font-medium transition-colors",
                    v.id === variant.id
                      ? "border-green-900 bg-green-900 text-white"
                      : "border-line bg-white text-ink hover:border-ink-3",
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
              soldOut
                ? "bg-ink-3"
                : variant.availability === "low_stock"
                  ? "bg-warning"
                  : "bg-success",
            )}
            aria-hidden="true"
          />
          <span className={soldOut ? "text-ink-2" : "text-ink"}>
            {availabilityLabel[variant.availability]}
          </span>
          <span className="text-ink-3">· SKU {variant.sku}</span>
        </p>

        {/* Quantity + actions */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center rounded-md border border-line bg-white">
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

          <Button disabled={soldOut} className="flex-1 min-w-[10rem]">
            <ShoppingBag className="size-4" aria-hidden="true" />
            Add to bag
          </Button>
        </div>

        <ButtonLink
          href={whatsappLink(
            productEnquiry(product.name, variant.label, product.slug),
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
          WhatsApp — see <code className="text-ink-2">OQ-001</code>.
        </p>

        {/* ------------------------------------------------------------- Tabs */}
        <div className="mt-10 border-t border-line pt-6">
          <div
            role="tablist"
            aria-label="Product details"
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`panel-${t}`}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 pb-2 text-[0.9375rem] font-medium transition-colors",
                  tab === t
                    ? "border-green-900 text-green-900"
                    : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="pt-5 text-[0.9375rem] leading-relaxed text-ink-2"
          >
            {tab === "About" && <p className="measure">{product.description}</p>}

            {tab === "Product information" && (
              <div>
                <dl className="divide-y divide-line border-y border-line">
                  {INFO_FIELDS.map((f) => (
                    <div
                      key={f}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <dt className="text-ink">{f}</dt>
                      <dd className="text-right text-[0.875rem] text-ink-3">
                        To be confirmed
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-[0.8125rem]">
                  These fields are legally required for online food sale in
                  India. The admin blocks publishing a product until every one
                  is populated — so no incomplete product page can go live.
                </p>
              </div>
            )}

            {tab === "Storage" && (
              <p className="measure">
                Storage instructions and shelf life are published only once
                confirmed by Burla. Nothing is inferred.
              </p>
            )}

            {tab === "Quality" && (
              <p className="measure">
                Every batch moves through the same sequence — sourcing,
                inspection, processing, quality control, packaging and dispatch.
                The detail of each stage is published once verified.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
