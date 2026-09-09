import Link from "next/link";
import {
  availabilityLabel,
  defaultVariant,
  type Product,
} from "@/data/catalog";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * Product card — DESIGN-SYSTEM §7.2.
 *
 * Four pieces of information, maximum: image, name, pack size, price. No
 * shadow, no border, no badge stack, no rating, no descriptor. The image is
 * roughly 78% of the card, which is the whole point — the product is the card.
 *
 * Price is omitted entirely rather than shown blank when a product has none;
 * an empty price slot reads as "unavailable".
 */
export function ProductCard({ product }: { product: Product }) {
  const variant = defaultVariant(product);
  const soldOut = variant.availability === "out_of_stock";

  return (
    <Link
      href={`/products/p/${product.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          name={product.name}
          className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-center text-[0.75rem] font-semibold text-ink-2">
            {availabilityLabel.out_of_stock}
          </span>
        )}
      </div>

      <div className="pt-3">
        <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink transition-colors group-hover:text-green-700">
          {product.name}
        </h3>
        <p className="mt-1 text-[0.8125rem] tabular-nums text-ink-3">
          {variant.label}
          {variant.priceMinor > 0 && (
            <>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-ink">
                {formatPrice(variant.priceMinor)}
              </span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
