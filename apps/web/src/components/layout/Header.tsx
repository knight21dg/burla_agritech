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
 * Header, following the client's mockup.
 *
 * Row 1 — a thin utility strip: company links and the search, account and bag
 *         icons, set small and quiet.
 * Row 2 — the working navigation: logo, then Home and all ten categories
 *         inline. This is where a customer spends their attention, so it gets
 *         the space.
 *
 * Categories are never hidden behind a dropdown. Below `lg` the row scrolls
 * horizontally on native scroll-snap rather than collapsing into a menu, so
 * every category stays one tap away.
 */
export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

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

  const catActive = (slug: string) => pathname.startsWith(`/products/${slug}`);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-green-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header data-site-chrome className="sticky top-0 z-50 bg-white">
        {/* Row 1 — utility strip */}
        <div className="border-b border-line/70">
          <Container>
            <div className="flex h-10 items-center justify-end gap-1">
              <nav className="hidden md:flex md:items-center" aria-label="Company">
                {mainNav
                  .filter((i) => i.href !== "/")
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        pathname.startsWith(item.href) ? "page" : undefined
                      }
                      className={cn(
                        "px-3 py-1.5 text-[0.8125rem] transition-colors",
                        pathname.startsWith(item.href)
                          ? "font-semibold text-green-700"
                          : "text-ink-2 hover:text-green-700",
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
                  className="rounded-md p-2 text-ink-2 transition-colors hover:bg-surface hover:text-green-700"
                  aria-label="Search products"
                >
                  <Search className="size-[1.05rem]" aria-hidden="true" />
                </button>
                <Link
                  href="/account"
                  className="rounded-md p-2 text-ink-2 transition-colors hover:bg-surface hover:text-green-700"
                  aria-label="Your account"
                >
                  <User className="size-[1.05rem]" aria-hidden="true" />
                </Link>
                <Link
                  href="/cart"
                  className="rounded-md p-2 text-ink-2 transition-colors hover:bg-surface hover:text-green-700"
                  aria-label="Your bag"
                >
                  <ShoppingBag className="size-[1.05rem]" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Container>
        </div>

        {/* Row 2 — logo and the product navigation */}
        <div className="border-b border-line">
          <Container>
            <div className="flex items-center gap-6 py-2.5">
              <Link
                href="/"
                className="shrink-0"
                aria-label={`${site.name} — home`}
              >
                <Logo variant="full" height={44} priority alt="" />
              </Link>

              <nav
                className="hidden min-w-0 flex-1 lg:block"
                aria-label="Product categories"
              >
                <ul className="rail gap-0.5">
                  <li className="rail-item">
                    <Link
                      href="/"
                      aria-current={pathname === "/" ? "page" : undefined}
                      className={cn(
                        "block whitespace-nowrap border-b-2 px-2.5 py-2 text-[0.8125rem] transition-colors",
                        pathname === "/"
                          ? "border-green-700 font-semibold text-green-700"
                          : "border-transparent text-ink hover:text-green-700",
                      )}
                    >
                      Home
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li key={c.slug} className="rail-item">
                      <Link
                        href={`/products/${c.slug}`}
                        aria-current={catActive(c.slug) ? "page" : undefined}
                        className={cn(
                          "block whitespace-nowrap border-b-2 px-2.5 py-2 text-[0.8125rem] transition-colors",
                          catActive(c.slug)
                            ? "border-green-700 font-semibold text-green-700"
                            : "border-transparent text-ink hover:text-green-700",
                        )}
                      >
                        {c.shortName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="ml-auto rounded-md p-2 text-ink transition-colors hover:bg-surface lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="size-[1.35rem]" aria-hidden="true" />
              </button>
            </div>
          </Container>
        </div>
      </header>

      {/* Mobile drawer — products first, flat, no accordion */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
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
              <Logo variant="wordmark" height={28} alt="" />
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
                {[
                  { label: "Home", href: "/" },
                  ...mainNav.filter((i) => i.href !== "/"),
                  { label: "Locations", href: "/locations" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block border-b border-line px-1 py-3 text-[0.9375rem] text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
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

function Container({ children }: { children: React.ReactNode }) {
  return <div className="container-page">{children}</div>;
}
