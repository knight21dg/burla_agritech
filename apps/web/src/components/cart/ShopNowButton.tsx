"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultVariant, productHref } from "@/lib/catalog";
import type { Product } from "@/types/catalog";
import { addToCart, useCart } from "./cartStore";
import { cn } from "@/lib/utils";

/**
 * "Shop now" on a product card: buy it straight away.
 *
 * Puts the default pack size in the cart — only if it is not there already,
 * so a second press never doubles it — and goes to checkout, which asks a
 * signed-out shopper to sign in and brings them back.
 *
 * A product with no pack size or price yet cannot be bought, so the button
 * opens its page instead; an out-of-stock one shows the button disabled.
 * Raised above the card's stretched link so it stays independently clickable.
 */
export function ShopNowButton({ product, className }: { product: Product; className?: string }) {
  const router = useRouter();
  const { qtyOf } = useCart();
  const variant = defaultVariant(product);
  const soldOut = variant?.availability === "out_of_stock";

  const look = cn(
    "relative z-10 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-forest px-3.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-3",
    className,
  );

  if (!variant) {
    return (
      <Link href={productHref(product)} className={look} aria-label={`Shop now: see ${product.name}`}>
        Shop now
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-label={soldOut ? `${product.name} is out of stock` : `Shop now: buy ${product.name}`}
      className={look}
      onClick={() => {
        if (qtyOf(product.slug, variant.id) === 0) addToCart(product.slug, variant.id);
        router.push("/checkout");
      }}
    >
      Shop now
    </button>
  );
}
