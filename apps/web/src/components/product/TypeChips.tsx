import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TypeChip } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * The type layer, shown as a row of links beneath a category header.
 *
 * Chips link to a type's own page rather than filtering the grid in place.
 * One mechanism instead of two, and every type gets an indexable URL — which
 * matters, because "mango pickle" has far more search volume than "pickles"
 * (SEO.md §1).
 *
 * The chips arrive ready-made (`typeChips` in `lib/catalog`), counted from
 * products the page has already loaded. This component used to count them
 * itself by calling into the catalogue module, which was free while the
 * catalogue was a TypeScript file and would be one query per chip now that it
 * is a database.
 */
export function TypeChips({
  chips,
  activeType,
}: {
  chips: TypeChip[];
  activeType?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <nav aria-label="Product types">
      <ul className="rail -mx-1 gap-2 py-1">
        {chips.map((chip) => {
          const active = activeType === chip.slug;

          return (
            <li key={chip.slug} className="rail-item">
              <Link
                href={chip.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-sm border px-4 py-2.5 text-[0.875rem] transition-colors",
                  active
                    ? "border-green-700 bg-green-50 font-semibold text-green-700"
                    : "border-line bg-white text-ink hover:border-green-700 hover:text-green-700",
                )}
              >
                {chip.name}
                {chip.count > 0 && (
                  <span className="ml-1.5 text-ink-3">{chip.count}</span>
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
  chips,
  activeType,
}: {
  categorySlug: string;
  categoryName: string;
  chips: TypeChip[];
  activeType: string;
}) {
  const others = chips.filter((chip) => chip.slug !== activeType);
  if (others.length === 0) return null;

  return (
    <div className="border-t border-line pt-8">
      <h2 className="t-label text-ink-3">More {categoryName.toLowerCase()}</h2>
      <div className="mt-4">
        <TypeChips chips={others} activeType={undefined} />
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
