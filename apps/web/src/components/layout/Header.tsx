"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { categories } from "@/data/catalog";
import { mainNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Two-row header (DESIGN-SYSTEM §8, SITEMAP §3).
 *
 * Row 1 — deep green: brand, company pages, utilities.
 * Row 2 — mid green: the product bar. All ten categories, always visible, one
 *         click from anywhere. Below md it scrolls horizontally rather than
 *         wrapping or hiding behind a menu.
 *
 * The colour sits here, on the chrome, in the Amazon/Flipkart pattern — a
 * strong branded bar above content that stays white. White on green-900 is
 * 11.1:1 and on green-700 is 5.33:1, so both rows clear AA comfortably.
 *
 * The logo sits on a white plate because the supplied artwork is a JPEG on
 * white with no transparency. A reversed logo would remove the plate.
 */
export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // "/" opens search, unless the user is typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? "");
      if (e.key === "/" && !typing && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-green-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header data-site-chrome className="sticky top-0 z-50">
        {/* Row 1 — brand and company */}
        <div className="bg-green-900 text-white">
          <div className="container-page">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link href="/" className="shrink-0" aria-label={`${site.name} — home`}>
                <Logo variant="wordmark" height={30} priority alt="" plate />
              </Link>

              <nav
                className="hidden md:flex md:items-center md:gap-1"
                aria-label="Main"
              >
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-[0.9375rem] transition-colors",
                      isActive(item.href)
                        ? "bg-white/15 font-semibold text-white"
                        : "font-medium text-white/90 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-md p-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Search products"
                >
                  <Search className="size-[1.15rem]" aria-hidden="true" />
                </button>
                <Link
                  href="/account"
                  className="hidden rounded-md p-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:block"
                  aria-label="Your account"
                >
                  <User className="size-[1.15rem]" aria-hidden="true" />
                </Link>
                <Link
                  href="/cart"
                  className="rounded-md p-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Your bag"
                >
                  <ShoppingBag className="size-[1.15rem]" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-md p-2.5 text-white/90 transition-colors hover:bg-white/10 md:hidden"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                >
                  <Menu className="size-[1.35rem]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — the product bar. Hidden on mobile, where the drawer carries it. */}
        <div className="hidden bg-green-700 text-white md:block">
          <div className="container-page">
            <nav aria-label="Product categories">
              <ul className="rail -mx-1 gap-0.5 py-0.5">
                <li className="rail-item">
                  <Link
                    href="/products"
                    aria-current={pathname === "/products" ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap border-b-2 px-3 py-2.5 text-[0.875rem] transition-colors",
                      pathname === "/products"
                        ? "border-white font-semibold text-white"
                        : "border-transparent text-white/85 hover:border-white/40 hover:text-white",
                    )}
                  >
                    All products
                  </Link>
                </li>
                {categories.map((c) => {
                  const active = pathname.startsWith(`/products/${c.slug}`);
                  return (
                    <li key={c.slug} className="rail-item">
                      <Link
                        href={`/products/${c.slug}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block whitespace-nowrap border-b-2 px-3 py-2.5 text-[0.875rem] transition-colors",
                          active
                            ? "border-white font-semibold text-white"
                            : "border-transparent text-white/85 hover:border-white/40 hover:text-white",
                        )}
                      >
                        {c.shortName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer — products first, listed flat, no accordion */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <Logo variant="wordmark" height={30} alt="" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2.5 text-ink hover:bg-surface"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile">
              <p className="t-label px-1 text-ink-3">Products</p>
              <ul className="mt-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/products/${c.slug}`}
                      className="block border-b border-line px-1 py-3 text-[0.9375rem] text-ink"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/products"
                    className="block border-b border-line px-1 py-3 text-[0.9375rem] font-semibold text-green-700"
                  >
                    View all products →
                  </Link>
                </li>
              </ul>

              <ul className="mt-6">
                {[...mainNav, { label: "Locations", href: "/locations" }].map(
                  (item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block border-b border-line px-1 py-3 text-[0.9375rem] text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
                <li>
                  <Link
                    href="/account"
                    className="block px-1 py-3 text-[0.9375rem] text-ink"
                  >
                    Sign in / Sign up
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
