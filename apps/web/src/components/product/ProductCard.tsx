import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  availabilityLabel,
  defaultVariant,
  productHref,
  type Product,
} from "@/data/catalog";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * Product card, following the client's mockup: image, name, the pack sizes
 * listed together, price, and an add-to-bag button.
 *
 * ## Why the card is not simply wrapped in a link
 *
 * The mockup puts a cart button inside the card, and the whole card is also
 * clickable. Nesting a button inside an anchor is invalid HTML and behaves
 * unpredictably for keyboard and screen-reader users.
 *
 * So the product name is the real link and it carries a stretched `::after`
 * that covers the card, making the whole area clickable. The cart button is a
 * sibling raised above it. One tab stop for the product, one for the button,
 * and no nesting.
 *
 * No star rating: the mockups show one, but no reviews exist. Inventing social
 * proof is both a policy violation and a consumer-law problem, so it is left
 * out until there is something real to show.
 */
export function ProductCard({ product }: { product: Product }) {
  const variant = defaultVariant(product);
  const soldOut = variant.availability === "out_of_stock";
  const sizes = product.variants.map((v) => v.label).join(" | ");

  return (
    <article className="group relative flex h-full flex-col rounded-md border border-line bg-white transition-shadow duration-200 hover:shadow-[0_2px_14px_-6px_rgba(23,23,23,0.25)]">
      <div className="relative overflow-hidden rounded-t-md">
        <ProductImage
          name={product.name}
          className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-center text-[0.75rem] font-semibold text-ink-2">
            {availabilityLabel.out_of_stock}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink">
          <Link
            href={productHref(product)}
            className="after:absolute after:inset-0 after:content-[''] hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-[0.8125rem] text-ink-3">{sizes}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-[1.0625rem] font-semibold tabular-nums text-ink">
            {formatPrice(variant.priceMinor)}
          </p>
          <button
            type="button"
            disabled={soldOut}
            aria-label={`Add ${product.name} to bag`}
            // Raised above the stretched link so it stays independently clickable
            className="relative z-10 grid size-11 shrink-0 place-items-center rounded-md border border-line text-green-700 transition-colors hover:border-green-700 hover:bg-green-50 disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent"
          >
            <ShoppingCart className="size-[1.05rem]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
