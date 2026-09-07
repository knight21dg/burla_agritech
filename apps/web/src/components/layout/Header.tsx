"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ProductImage } from "@/components/ui/ProductImage";
import { categories, featuredProducts } from "@/data/catalog";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on navigation
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Esc closes the mega menu; "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(false);
      const el = e.target as HTMLElement | null;
      const typing =
        el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? "");
      if (e.key === "/" && !typing && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  // Lock scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  const featured = featuredProducts().slice(0, 2);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-green-deep focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-200",
          scrolled
            ? "border-sand bg-ivory/95 backdrop-blur-sm"
            : "border-transparent bg-ivory",
        )}
      >
        <div className="container-page">
          <div className="flex h-[4.5rem] items-center justify-between gap-4 lg:h-[5.25rem]">
            <Link
              href="/"
              className="shrink-0"
              aria-label={`${"Burla Global Agri Products"} — home`}
            >
              <Logo className="text-[1.75rem] lg:text-[2rem]" />
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex lg:items-center lg:gap-1"
              aria-label="Main"
            >
              {mainNav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                if ("hasMegaMenu" in item && item.hasMegaMenu) {
                  return (
                    <div
                      key={item.href}
                      onMouseEnter={openMega}
                      onMouseLeave={scheduleClose}
                    >
                      <Link
                        href={item.href}
                        aria-expanded={megaOpen}
                        aria-controls="shop-mega-menu"
                        onClick={(e) => {
                          if (!megaOpen) {
                            e.preventDefault();
                            setMegaOpen(true);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                          active
                            ? "text-green-text"
                            : "text-ink hover:text-green-text",
                        )}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            megaOpen && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                      active
                        ? "text-green-text"
                        : "text-ink hover:text-green-text",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Utilities */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-md p-2.5 text-ink transition-colors hover:bg-ink/[0.05] hover:text-green-text"
                aria-label="Search products"
              >
                <Search className="size-[1.15rem]" aria-hidden="true" />
              </button>
              <Link
                href="/account"
                className="hidden rounded-md p-2.5 text-ink transition-colors hover:bg-ink/[0.05] hover:text-green-text sm:block"
                aria-label="Your account"
              >
                <User className="size-[1.15rem]" aria-hidden="true" />
              </Link>
              <Link
                href="/cart"
                className="rounded-md p-2.5 text-ink transition-colors hover:bg-ink/[0.05] hover:text-green-text"
                aria-label="Your bag"
              >
                <ShoppingBag className="size-[1.15rem]" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2.5 text-ink transition-colors hover:bg-ink/[0.05] lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="size-[1.35rem]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        {megaOpen && (
          <div
            id="shop-mega-menu"
            ref={megaRef}
            onMouseEnter={openMega}
            onMouseLeave={scheduleClose}
            className="absolute inset-x-0 top-full hidden border-b border-sand bg-paper shadow-[0_18px_40px_-24px_rgba(31,33,28,0.35)] lg:block"
          >
            <div className="container-page py-10">
              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-7">
                  <p className="t-label mb-5 text-ink-faint">By category</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/shop/${c.slug}`}
                          className="block rounded-md py-2 text-[0.9375rem] text-ink transition-colors hover:text-green-text"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-span-2">
                  <p className="t-label mb-5 text-ink-faint">Explore</p>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/shop"
                        className="block py-2 text-[0.9375rem] text-ink hover:text-green-text"
                      >
                        All products
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/shop/combo-packs"
                        className="block py-2 text-[0.9375rem] text-ink hover:text-green-text"
                      >
                        Combo packs
                      </Link>
                    </li>
                    <li className="pt-3">
                      <Link
                        href="/wholesale"
                        className="block py-2 text-[0.9375rem] font-medium text-green-text hover:underline underline-offset-4"
                      >
                        Bulk &amp; wholesale →
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="col-span-3">
                  <p className="t-label mb-5 text-ink-faint">Featured</p>
                  <div className="grid grid-cols-2 gap-4">
                    {featured.map((p, i) => (
                      <Link key={p.id} href={`/products/${p.slug}`} className="group">
                        <ProductImage tone={p.tone} seed={i + 3} />
                        <p className="mt-2 text-[0.8125rem] font-medium text-ink group-hover:text-green-text">
                          {p.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
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
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-ivory shadow-xl"
          >
            <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-sand px-5">
              <Logo className="text-[1.5rem]" showSubline={false} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2.5 text-ink hover:bg-ink/[0.05]"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile">
              <details className="group border-b border-sand pb-3">
                <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-lg font-medium text-ink marker:hidden">
                  Shop
                  <ChevronDown
                    className="size-5 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="mt-1 space-y-0.5 pb-2 pl-1">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/shop/${c.slug}`}
                        className="block py-2 text-[0.9375rem] text-ink-muted"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/shop"
                      className="block py-2 text-[0.9375rem] font-medium text-green-text"
                    >
                      View all products →
                    </Link>
                  </li>
                </ul>
              </details>

              {mainNav
                .filter((i) => i.label !== "Shop")
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block border-b border-sand py-3.5 text-lg font-medium text-ink"
                  >
                    {item.label}
                  </Link>
                ))}

              <Link
                href="/wholesale"
                className="block border-b border-sand py-3.5 text-lg font-medium text-green-text"
              >
                Bulk &amp; Wholesale
              </Link>
              <Link
                href="/account"
                className="block py-3.5 text-lg font-medium text-ink"
              >
                Sign in / Sign up
              </Link>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
