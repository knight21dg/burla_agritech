import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { productsByCategory, type Category } from "@/data/catalog";

/**
 * Category card — DESIGN-SYSTEM §7.3.
 *
 * Authentic photography, name, product count. No icons, no illustrations,
 * no abstract tiles. A category is a destination, so the image is generous.
 */
export function CategoryCard({ category }: { category: Category }) {
  const count = productsByCategory(category.slug).length;

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="overflow-hidden">
        <ProductImage
          name={category.name}
          ratio="landscape"
          className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
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
