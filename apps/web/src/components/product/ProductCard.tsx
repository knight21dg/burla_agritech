import Link from "next/link";
import { CardCartControl } from "@/components/cart/CardCartControl";
import {
  availabilityLabel,
  defaultVariant,
  productHref,
  type Product,
} from "@/data/catalog";
import { formatPrice } from "@/lib/utils";
import { ProductPhoto } from "./ProductPhoto";

/**
 * Product card, following the client's final mockup: image, name, every pack
 * size on one line, the price, and a green cart icon at the right.
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
 * The cart icon is drawn bare, as in the mockup, but its hit area is still a
 * full 44px square. Once the product is in the cart it becomes a − qty +
 * stepper (`CardCartControl`) — the only interactive part, so the card itself
 * stays a server component.
 *
 * A product with no pack sizes or prices yet keeps its place in the grid,
 * says "Price to be confirmed", and can still go in the cart: the price is
 * confirmed before checkout, never at the card.
 *
 * No star rating: no reviews exist, and inventing social proof is both a
 * policy violation and a consumer-law problem.
 */
export function ProductCard({ product }: { product: Product }) {
  const variant = defaultVariant(product);
  const soldOut = variant?.availability === "out_of_stock";
  const sizes = product.variants.map((v) => v.label).join(" | ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition duration-300 ease-out hover:-translate-y-0.5 hover:border-green-700/30 hover:shadow-[0_14px_30px_-16px_rgba(15,74,44,0.38)]">
      <div className="relative overflow-hidden">
        <ProductPhoto
          product={product}
          decorative
          className="transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-center text-[0.75rem] font-semibold text-ink-2">
            {availabilityLabel.out_of_stock}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-2 pt-2.5">
        <h3 className="text-[0.875rem] font-semibold leading-snug text-ink">
          <Link
            href={productHref(product)}
            className="after:absolute after:inset-0 after:content-[''] hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {product.name}
          </Link>
        </h3>

        {sizes && <p className="mt-0.5 text-[0.75rem] text-ink-3">{sizes}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          {variant ? (
            <p className="text-[1rem] font-bold tabular-nums text-ink">
              {formatPrice(variant.priceMinor)}
            </p>
          ) : (
            <p className="text-[0.8125rem] font-medium text-ink-3">
              Price to be confirmed
            </p>
          )}
          <CardCartControl product={product} />
        </div>
      </div>
    </article>
  );
}
