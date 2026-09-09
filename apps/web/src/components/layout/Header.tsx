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
 * Row 1 — brand, company pages, utilities.
 * Row 2 — the product bar: all ten categories, always visible, one click from
 *         anywhere. Below 1280px it scrolls horizontally rather than wrapping
 *         or hiding behind a menu.
 *
 * The v0.2 "Shop" mega-menu is withdrawn. It hid the categories behind a
 * hover, which is the opposite of what the client asked for.
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

      <header data-site-chrome className="sticky top-0 z-50 bg-white">
        {/* Row 1 — brand and company */}
        <div className="border-b border-line">
          <div className="container-page">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link href="/" className="shrink-0" aria-label={`${site.name} — home`}>
                <Logo variant="wordmark" height={34} priority alt="" />
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
                        ? "font-semibold text-green-700"
                        : "font-medium text-ink hover:text-green-700",
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
                  className="rounded-md p-2.5 text-ink transition-colors hover:bg-surface hover:text-green-700"
                  aria-label="Search products"
                >
                  <Search className="size-[1.15rem]" aria-hidden="true" />
                </button>
                <Link
                  href="/account"
                  className="hidden rounded-md p-2.5 text-ink transition-colors hover:bg-surface hover:text-green-700 sm:block"
                  aria-label="Your account"
                >
                  <User className="size-[1.15rem]" aria-hidden="true" />
                </Link>
                <Link
                  href="/cart"
                  className="rounded-md p-2.5 text-ink transition-colors hover:bg-surface hover:text-green-700"
                  aria-label="Your bag"
                >
                  <ShoppingBag className="size-[1.15rem]" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-md p-2.5 text-ink transition-colors hover:bg-surface md:hidden"
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
        <div className="hidden border-b border-line md:block">
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
                        ? "border-green-700 font-semibold text-green-700"
                        : "border-transparent text-ink hover:text-green-700",
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
                            ? "border-green-700 font-semibold text-green-700"
                            : "border-transparent text-ink hover:text-green-700",
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
