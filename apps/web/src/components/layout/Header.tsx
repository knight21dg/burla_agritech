"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cartStore";
import { Logo } from "@/components/ui/Logo";
import { categories } from "@/data/catalog";
import { mainNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Header, built to the client's final mockup (2026-09-10).
 *
 * One band, two rows, with the stacked logo spanning both on the left:
 *
 *   logo  |                    About Us  Quality  Contact Us   search  account  cart
 *         |  Home  Powders & Flakes  Dehydrated Fruits  Pickles  ...
 *
 * The category row is where a customer spends attention, so it gets the long
 * line; company links are small and quiet above it. Categories are never
 * hidden behind a dropdown — below `lg` the row scrolls horizontally on
 * native scroll-snap rather than collapsing, so every category stays one tap
 * away.
 */

/** The company links read as the mockup labels them. */
const COMPANY_LABEL: Record<string, string> = {
  "/about": "About Us",
  "/contact": "Contact Us",
};

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
  // Units in the cart, live: it moves the moment a card or product page adds.
  const cartCount = useCart().count;

  const iconButton =
    "relative grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface hover:text-green-700";

  const navLink = (active: boolean) =>
    cn(
      "relative block whitespace-nowrap px-2 py-2 text-[0.78rem] transition-colors",
      "after:absolute after:inset-x-2 after:bottom-0.5 after:h-0.5 after:rounded-full after:transition-colors",
      active
        ? "font-semibold text-green-700 after:bg-green-700"
        : "text-ink after:bg-transparent hover:text-green-700 hover:after:bg-green-700/30",
    );

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-green-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header
        data-site-chrome
        className="sticky top-0 z-50 border-b border-line/70 bg-white"
      >
        <Container>
          <div className="flex items-center gap-6 py-2 lg:gap-10 lg:py-2.5">
            <Link
              href="/"
              className="shrink-0"
              aria-label={`${site.name} — home`}
            >
              <span className="block lg:hidden">
                <Logo variant="full" height={46} priority alt="" />
              </span>
              <span className="hidden lg:block">
                <Logo variant="full" height={66} priority alt="" />
              </span>
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              {/* Row 1 — company links and the icons */}
              <div className="flex items-center justify-end gap-1">
                <nav
                  className="mr-3 hidden items-center md:flex"
                  aria-label="Company"
                >
                  {mainNav
                    .filter((i) => i.href !== "/")
                    .map((item) => {
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "px-3 py-1.5 text-[0.75rem] transition-colors",
                            active
                              ? "font-semibold text-green-700"
                              : "text-ink-2 hover:text-green-700",
                          )}
                        >
                          {COMPANY_LABEL[item.href] ?? item.label}
                        </Link>
                      );
                    })}
                </nav>

                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className={iconButton}
                  aria-label="Search products"
                >
                  <Search className="size-[1.2rem]" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <Link href="/account" className={iconButton} aria-label="Your account">
                  <User className="size-[1.2rem]" strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <Link
                  href="/cart"
                  className={iconButton}
                  aria-label={`Your cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                >
                  <ShoppingCart className="size-[1.2rem]" strokeWidth={1.75} aria-hidden="true" />
                  <span
                    // Keyed on the count, so each change replays the bump.
                    key={cartCount}
                    aria-hidden="true"
                    className="animate-cart-bump absolute right-0.5 top-0.5 grid h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full bg-green-700 px-1 text-[0.625rem] font-semibold leading-none text-white tabular-nums"
                  >
                    {cartCount}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={cn(iconButton, "lg:hidden")}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                >
                  <Menu className="size-[1.35rem]" aria-hidden="true" />
                </button>
              </div>

              {/* Row 2 — Home and the ten categories */}
              <nav
                className="hidden min-w-0 lg:block"
                aria-label="Product categories"
              >
                <ul className="rail -mx-2">
                  <li className="rail-item">
                    <Link
                      href="/"
                      aria-current={pathname === "/" ? "page" : undefined}
                      className={navLink(pathname === "/")}
                    >
                      Home
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li key={c.slug} className="rail-item">
                      <Link
                        href={`/products/${c.slug}`}
                        aria-current={catActive(c.slug) ? "page" : undefined}
                        className={navLink(catActive(c.slug))}
                      >
                        {c.shortName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </Container>
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
