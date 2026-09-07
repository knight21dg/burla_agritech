import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { productsByCategory, type Category } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * Category card — a category is a destination, so the card is sized
 * generously and image-led (DESIGN-SYSTEM §7.3).
 */
export function CategoryCard({
  category,
  seed = 0,
  size = "md",
}: {
  category: Category;
  seed?: number;
  size?: "md" | "lg";
}) {
  const count = productsByCategory(category.slug).length;

  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="overflow-hidden bg-ivory-warm">
        <ProductImage
          tone={category.tone}
          seed={seed}
          ratio={size === "lg" ? "portrait" : "square"}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-start justify-between gap-3 pt-3.5">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-semibold leading-snug text-ink transition-colors group-hover:text-green-text",
              size === "lg" ? "text-[1.125rem]" : "text-[0.9375rem]",
            )}
          >
            {category.name}
          </h3>
          {count > 0 && (
            <p className="mt-0.5 text-[0.8125rem] text-ink-faint">
              {count} {count === 1 ? "product" : "products"}
            </p>
          )}
        </div>
        <ArrowRight
          className="mt-1 size-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-green-text"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
