import Link from "next/link";
import {
  availabilityLabel,
  categoryBySlug,
  defaultVariant,
  type Product,
} from "@/data/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * Product card — DESIGN-SYSTEM §7.2.
 *
 * At most five pieces of information. No badge stacks, no star ratings
 * (no real reviews exist), no fake urgency. Price is omitted entirely rather
 * than shown blank when a product has none.
 *
 * The whole card is one link; pack-size chips are display-only here so the
 * card never nests an interactive element inside a link.
 */
export function ProductCard({
  product,
  seed = 0,
  showCategory = true,
}: {
  product: Product;
  seed?: number;
  showCategory?: boolean;
}) {
  const variant = defaultVariant(product);
  const category = categoryBySlug(product.categorySlug);
  const soldOut = variant.availability === "out_of_stock";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="relative overflow-hidden bg-ivory-warm">
        <ProductImage
          tone={product.tone}
          seed={seed}
          className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {variant.availability === "low_stock" && (
          <span className="absolute left-3 top-3 rounded-sm bg-paper/95 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-warning">
            Low stock
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-ivory/75 text-[0.8125rem] font-semibold uppercase tracking-wider text-ink-muted">
            {availabilityLabel.out_of_stock}
          </span>
        )}
      </div>

      <div className="pt-4">
        {showCategory && category && (
          <p className="t-label text-ink-faint">{category.shortName}</p>
        )}
        <h3 className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-ink transition-colors group-hover:text-green-text">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-muted">
          {product.shortDescriptor}
        </p>
        <p
          className={cn(
            "mt-2.5 text-[0.875rem] tabular-nums",
            soldOut ? "text-ink-faint" : "text-ink",
          )}
        >
          <span className="text-ink-muted">{variant.label}</span>
          <span className="mx-2 text-sand-deep" aria-hidden="true">
            ·
          </span>
          <span className="font-semibold">{formatPrice(variant.priceMinor)}</span>
        </p>
      </div>
    </Link>
  );
}
