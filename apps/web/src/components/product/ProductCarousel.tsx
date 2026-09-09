"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/catalog";

/**
 * Horizontal product rail (FR-021c).
 *
 * Built on native CSS scroll-snap rather than a carousel library: the browser
 * does the scrolling, so touch, trackpad and momentum all behave natively and
 * the page ships no carousel JavaScript. The small amount of script here only
 * drives the arrow buttons and their disabled state.
 *
 * - Partial next card visible at every breakpoint, so it is obvious more exists
 * - Arrows on desktop, disabled at each end, hidden when nothing overflows
 * - Cards are ordinary links, reachable by Tab in document order — no
 *   `role="listbox"` theatre that would break expectations
 * - Never autoplays
 */
export function ProductCarousel({
  products,
  label,
}: {
  products: Product[];
  label: string;
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflows(max > 4);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card
      ? card.getBoundingClientRect().width + 20
      : el.clientWidth * 0.8;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * step * 2,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {overflows && (
        <div className="absolute -top-12 right-0 hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label="Scroll products left"
            className="grid size-9 place-items-center rounded-md border border-line text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label="Scroll products right"
            className="grid size-9 place-items-center rounded-md border border-line text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <ul
        ref={railRef}
        // Focusable so keyboard users can scroll the rail with arrow keys
        tabIndex={0}
        aria-label={label}
        className="rail gap-5 pb-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {products.map((p) => (
          <li
            key={p.id}
            // Widths leave a partial next card visible at every breakpoint
            className="rail-item w-[42vw] max-w-[15rem] sm:w-[30vw] md:w-[26vw] lg:w-[19rem]"
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
