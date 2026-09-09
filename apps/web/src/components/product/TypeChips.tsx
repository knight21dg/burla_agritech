import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  productHref,
  productsByType,
  type Category,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * The type layer, shown as a row of links beneath a category header.
 *
 * Chips link to a type's own page rather than filtering the grid in place.
 * One mechanism instead of two, and every type gets an indexable URL — which
 * matters, because "mango pickle" has far more search volume than "pickles"
 * (SEO.md §1).
 *
 * A type holding a single product links straight to that product, so nobody
 * lands on a page containing one card (PRODUCT-TAXONOMY §1.1).
 */
export function TypeChips({
  categorySlug,
  types,
  activeType,
}: {
  categorySlug: string;
  types: Category[];
  activeType?: string;
}) {
  if (types.length === 0) return null;

  return (
    <nav aria-label="Product types">
      <ul className="rail -mx-1 gap-2 py-1">
        {types.map((type) => {
          const inType = productsByType(categorySlug, type.slug);
          const single = inType.length === 1 ? inType[0] : undefined;
          const href = single
            ? productHref(single)
            : `/products/${categorySlug}/${type.slug}`;
          const active = activeType === type.slug;

          return (
            <li key={type.slug} className="rail-item">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-sm border px-4 py-2.5 text-[0.875rem] transition-colors",
                  active
                    ? "border-green-700 bg-green-50 font-semibold text-green-700"
                    : "border-line bg-white text-ink hover:border-green-700 hover:text-green-700",
                )}
              >
                {type.name}
                {inType.length > 0 && (
                  <span className="ml-1.5 text-ink-3">{inType.length}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sibling navigation shown on a type page, so a dead end is impossible. */
export function TypeSiblings({
  categorySlug,
  categoryName,
  types,
  activeType,
}: {
  categorySlug: string;
  categoryName: string;
  types: Category[];
  activeType: string;
}) {
  const others = types.filter((x) => x.slug !== activeType);
  if (others.length === 0) return null;

  return (
    <div className="border-t border-line pt-8">
      <h2 className="t-label text-ink-3">More {categoryName.toLowerCase()}</h2>
      <div className="mt-4">
        <TypeChips
          categorySlug={categorySlug}
          types={others}
          activeType={undefined}
        />
      </div>
      <Link
        href={`/products/${categorySlug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-green-700 underline-offset-4 hover:underline"
      >
        All {categoryName}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
