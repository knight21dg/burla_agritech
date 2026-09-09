"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Filter and sort controls.
 *
 * State lives in the URL so results are shareable and back-button safe
 * (FR-045). Filtered URLs carry noindex via the page's metadata, which keeps
 * facet combinations out of the index (SEO.md §5).
 */
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

const availabilityOptions = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In stock" },
] as const;

export function CategoryToolbar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const sort = params.get("sort") ?? "featured";
  const availability = params.get("availability") ?? "all";
  const hasFilters = sort !== "featured" || availability !== "all";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "featured" || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    });
  };

  const reset = () =>
    startTransition(() => {
      router.replace("?", { scroll: false });
    });

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-line py-4 transition-opacity",
        pending && "opacity-60",
      )}
    >
      <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-ink-2">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Refine
      </span>

      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">Availability</legend>
        {availabilityOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => update("availability", o.value)}
            aria-pressed={availability === o.value}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-[0.8125rem] transition-colors",
              availability === o.value
                ? "border-green-900 bg-green-900 text-white"
                : "border-line bg-white text-ink hover:border-ink-3",
            )}
          >
            {o.label}
          </button>
        ))}
      </fieldset>

      <div className="flex items-center gap-2">
        <label
          htmlFor="sort"
          className="text-[0.8125rem] font-medium text-ink-2"
        >
          Sort
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="rounded-sm border border-line bg-white px-3 py-1.5 text-[0.875rem] text-ink"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={reset}
          className="text-[0.8125rem] text-green-700 underline underline-offset-4"
        >
          Clear all
        </button>
      )}

      <p className="ml-auto text-[0.875rem] text-ink-2" aria-live="polite">
        {resultCount} {resultCount === 1 ? "product" : "products"}
      </p>
    </div>
  );
}
