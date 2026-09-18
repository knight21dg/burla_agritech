"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Headset, Info, Menu, Package, Search, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cartStore";
import { Logo } from "@/components/ui/Logo";
import type { Category } from "@/types/catalog";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Header, built to the client's mockup of 2026-09-17, without the green top
 * bar (removed at the client's request the same day). Two bands:
 *
 *     logo*       BURLA GLOBAL AGRI PRODUCTS          [ Search products… ]   account   cart
 *                 ——  GOOD FOOD  •  BETTER LIVING  ——
 *            Home   Powders & Flakes   Dehydrated Fruits   Pickles   …   Spices
 *
 * *The logo is the sprout and BURLA only (the client's instruction), not the
 * lockup with "GLOBAL AGRI PRODUCTS" beneath.
 *
 * The whole header stays at the top of the screen. The search box opens the
 * live search. Categories are never hidden behind a dropdown on a laptop;
 * below that they are in the menu, and the name and motto get their own line.
 * About Us, Quality and Contact Us are in the footer, and in the menu on
 * tablets and phones.
 */

/** The drawer's own list, from the client's sketch (2026-09-18). */
const MENU = [
  { href: "/account", label: "Account", note: "Sign in, addresses, details", Icon: User },
  { href: "/account/orders", label: "Orders", note: "What you have ordered", Icon: Package },
  { href: "/contact", label: "Customer Care", note: "Call, WhatsApp or write to us", Icon: Headset },
  { href: "/about", label: "About Us", note: "Who Burla is", Icon: Info },
];

/** "——  GOOD FOOD  •  BETTER LIVING  ——" */
function Motto({ className }: { className?: string }) {
  return (
    <p aria-hidden="true" className={cn("flex items-center justify-center gap-3 text-ink-3", className)}>
      <span className="h-px w-6 bg-line-strong lg:w-12" />
      <span className="whitespace-nowrap font-brand font-medium uppercase tracking-[0.3em] lg:tracking-[0.42em]">
        {site.motto[0]}
        <span className="mx-[0.6em] tracking-normal">•</span>
        {site.motto[1]}
      </span>
      <span className="h-px w-6 bg-line-strong lg:w-12" />
    </p>
  );
}

export function Header({ categories }: { categories: Category[] }) {
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
      // Escape closes the menu drawer, as it closes the search.
      if (e.key === "Escape") setMobileOpen(false);
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
    "relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface hover:text-green-700";

  const navLink = (active: boolean) =>
    cn(
      "relative block whitespace-nowrap px-0.5 pb-3.5 pt-2 text-[0.8125rem] transition-colors xl:text-[0.875rem] min-[1440px]:text-[0.9375rem] 2xl:text-[1rem]",
      "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-colors",
      active
        ? "font-medium text-green-700 after:bg-green-700"
        : "text-ink after:bg-transparent hover:text-green-700",
    );

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-green-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header data-site-chrome className="sticky top-0 z-50 border-b border-line bg-white">
        <Container>
          {/* Band 2 — logo, name and motto, search, account, cart */}
          <div className="flex items-center gap-4 py-2.5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:py-3">
            <div className="flex shrink-0 items-center gap-2 justify-self-start lg:gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={iconButton}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="site-menu"
              >
                <Menu className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </button>

              <Link href="/" className="shrink-0" aria-label={`${site.name} — home`}>
                <span className="block lg:hidden">
                  <Logo variant="mark" height={42} priority alt="" />
                </span>
                <span className="hidden lg:block">
                  <Logo variant="mark" height={76} priority alt="" />
                </span>
              </Link>
            </div>

            <div aria-hidden="true" className="hidden text-center md:block md:flex-1 lg:flex-none">
              <p className="whitespace-nowrap font-brand text-[1.1rem] font-bold uppercase leading-tight text-green-700 min-[880px]:text-[1.35rem] lg:text-[2rem] min-[1400px]:text-[2.25rem]">
                {site.name}
              </p>
              <Motto className="mt-2 text-[0.75rem] lg:text-[0.95rem]" />
            </div>

            <div className="ml-auto flex items-center justify-self-end gap-1 lg:ml-0 lg:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-12 w-64 items-center gap-3 rounded-full bg-surface-2 px-4 text-left text-[0.9375rem] text-ink-3 transition-colors hover:bg-line min-[1400px]:flex min-[1400px]:w-72"
                aria-label="Search products"
              >
                <Search className="size-5 text-ink" strokeWidth={1.75} aria-hidden="true" />
                Search products…
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={cn(iconButton, "min-[1400px]:hidden")}
                aria-label="Search products"
              >
                <Search className="size-[1.35rem]" strokeWidth={1.75} aria-hidden="true" />
              </button>
              <Link href="/account" className={iconButton} aria-label="Your account">
                <User className="size-[1.5rem]" strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <Link
                href="/cart"
                className={iconButton}
                aria-label={`Your cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              >
                <ShoppingCart className="size-[1.6rem]" strokeWidth={1.5} aria-hidden="true" />
                <span
                  // Keyed on the count, so each change replays the bump.
                  key={cartCount}
                  aria-hidden="true"
                  className="animate-cart-bump absolute -right-0.5 -top-0.5 grid h-[1.35rem] min-w-[1.35rem] place-items-center rounded-full bg-green-700 px-1 text-[0.75rem] font-semibold leading-none text-white tabular-nums"
                >
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Phones: the name and motto on their own lines under the logo row. */}
          <div aria-hidden="true" className="pb-2.5 text-center md:hidden">
            <p className="font-brand text-[1.05rem] font-bold uppercase leading-tight text-green-700 min-[400px]:text-[1.15rem]">
              {site.name}
            </p>
            <Motto className="mt-1 text-[0.625rem]" />
          </div>

          {/* Band 3 — Home and the ten categories, centred */}
          <nav className="hidden min-w-0 lg:block" aria-label="Product categories">
            <ul className="flex items-end justify-center-safe gap-x-2 overflow-x-auto [scrollbar-width:none] xl:gap-x-5 2xl:gap-x-8">
              <li>
                <Link
                  href="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={navLink(pathname === "/")}
                >
                  Home
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
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
        </Container>
      </header>

      {/* The menu drawer, to the client's sketch (2026-09-18): Account,
          Orders, Customer Care and About Us, each with its own picture. The
          product categories join it below laptop width, where the category
          row is not shown and this is the way around the shop. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-[0_0_40px_-10px_rgba(15,74,44,0.35)]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <Link href="/" aria-label={`${site.name} — home`}>
                <Logo variant="mark" height={30} alt="" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface hover:text-green-700"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">
              <ul>
                {MENU.map(({ href, label, note, Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3.5 rounded-lg px-2.5 py-3 transition-colors hover:bg-green-50"
                    >
                      <Icon className="size-[1.375rem] shrink-0 text-green-700" strokeWidth={1.75} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-semibold text-ink">{label}</span>
                        <span className="block text-[0.75rem] text-ink-3">{note}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Below laptop width the categories live here too. */}
              <div className="mt-4 border-t border-line pt-4 lg:hidden">
                <p className="t-label px-2.5 text-ink-3">Products</p>
                <ul className="mt-1">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/products/${c.slug}`}
                        aria-current={catActive(c.slug) ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-2.5 py-2.5 text-[0.9375rem] transition-colors hover:bg-green-50",
                          catActive(c.slug) ? "font-semibold text-green-700" : "text-ink",
                        )}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/products"
                      className="block rounded-lg px-2.5 py-2.5 text-[0.9375rem] font-semibold text-green-700 hover:bg-green-50"
                    >
                      View all products →
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>

            {/* The brand's own line, as in the sketch. */}
            <div aria-hidden="true" className="shrink-0 border-t border-line bg-green-50/60 px-5 py-4">
              <p className="t-script text-[1.35rem] leading-[1.05] text-forest">
                Good Food
                <br />
                <span className="ml-5">Better Living</span>
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-snug text-ink-3">
                From Our Farms
                <br />
                To Your Table
              </p>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={categories}
      />
    </>
  );
}

/**
 * Wider than the page column: in the mockup the header's bands run nearly
 * edge to edge on a large screen, while the page content below stays narrower.
 */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 xl:px-14">{children}</div>;
}
