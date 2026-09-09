import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { productsByCategory, type Category, type Tone } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * Category tile — DESIGN-SYSTEM §7.3.
 *
 * Each category carries a light produce-derived tint behind its image, which
 * is where the site's colour lives. Product grids stay white; a coloured
 * ground behind a grid of food photographs fights the products.
 *
 * The tints are light enough that --color-ink stays above 12:1 on them, so a
 * tile label is never the weak link. Once real photography lands the tint sits
 * behind the image as a frame rather than filling the tile.
 */
const TINTS: Record<Tone, string> = {
  turmeric: "bg-tint-turmeric",
  mango: "bg-tint-mango",
  chilli: "bg-tint-chilli",
  leaf: "bg-tint-leaf",
  grain: "bg-tint-grain",
  berry: "bg-tint-berry",
  earth: "bg-tint-earth",
  cream: "bg-tint-cream",
};

export function CategoryCard({ category }: { category: Category }) {
  const count = productsByCategory(category.slug).length;

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div
        className={cn(
          "overflow-hidden rounded-md transition-transform duration-200 group-hover:-translate-y-0.5",
          TINTS[category.tone],
        )}
      >
        <ProductImage
          name={category.name}
          ratio="landscape"
          className="bg-transparent"
        />
      </div>
      <h3 className="mt-3 text-[0.9375rem] font-semibold leading-snug text-ink transition-colors group-hover:text-green-700">
        {category.name}
      </h3>
      {count > 0 && (
        <p className="mt-0.5 text-[0.8125rem] text-ink-3">
          {count} {count === 1 ? "product" : "products"}
        </p>
      )}
    </Link>
  );
}
