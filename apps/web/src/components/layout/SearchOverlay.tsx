"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { categories, categoryBySlug, searchProducts } from "@/data/catalog";
import { formatPrice } from "@/lib/utils";
import { defaultVariant } from "@/data/catalog";

/**
 * Search overlay (FR-081, FR-085).
 * Keyboard: "/" opens, arrows move, Enter selects, Esc closes, focus restored.
 */
export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const results = useMemo(() => searchProducts(q).slice(0, 6), [q]);

  useEffect(() => {
    if (open) {
      restoreTo.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Focus after paint so the element exists
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
      setQ("");
      setActive(0);
      restoreTo.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const submit = (index?: number) => {
    const chosen = results[index ?? active];
    if (chosen) {
      router.push(`/products/p/${chosen.slug}`);
    } else if (q.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="absolute inset-x-0 top-0 border-b border-line bg-white"
      >
        <div className="container-page py-5">
          <div className="flex items-center gap-3">
            <Search className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search products and categories"
              aria-label="Search products and categories"
              aria-controls="search-results"
              className="h-11 flex-1 border-0 bg-transparent text-lg text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2.5 text-ink hover:bg-ink/[0.05]"
              aria-label="Close search"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div id="search-results" className="mt-5" aria-live="polite">
            {q.trim().length < 2 ? (
              <div>
                <p className="t-label mb-3 text-ink-3">Browse categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products/${c.slug}`}
                      onClick={onClose}
                      className="rounded-sm border border-line bg-white px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-green hover:text-green-700"
                    >
                      {c.shortName}
                    </Link>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="py-6">
                <p className="text-ink">
                  No products match <span className="font-semibold">“{q}”</span>.
                </p>
                <p className="mt-1 text-[0.9375rem] text-ink-2">
                  Try a category below, or ask us on WhatsApp — we may still be
                  able to help.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products/${c.slug}`}
                      onClick={onClose}
                      className="rounded-sm border border-line bg-white px-3 py-1.5 text-[0.8125rem] text-ink hover:border-green hover:text-green-700"
                    >
                      {c.shortName}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line/70">
                {results.map((p, i) => {
                  const variant = defaultVariant(p);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/products/p/${p.slug}`}
                        onClick={onClose}
                        onMouseEnter={() => setActive(i)}
                        aria-current={i === active ? "true" : undefined}
                        className={`flex items-center gap-4 px-2 py-3 transition-colors ${
                          i === active ? "bg-surface" : ""
                        }`}
                      >
                        <ProductImage
                          name={p.name}
                          className="size-12 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">
                            {p.name}
                          </span>
                          <span className="block truncate text-[0.8125rem] text-ink-2">
                            {categoryBySlug(p.categorySlug)?.name}
                          </span>
                        </span>
                        {variant && (
                          <span className="shrink-0 text-[0.875rem] tabular-nums text-ink-2">
                            {formatPrice(variant.priceMinor)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
