import { useSyncExternalStore } from "react";
import { productBySlug } from "@/data/catalog";

/**
 * The shopping cart, kept in the browser — as Amazon and Flipkart keep a
 * signed-out shopper's cart — so it survives a reload and follows the shopper
 * across tabs.
 *
 * It holds references only: which product, which pack size, how many. Never a
 * price or a name. Those are read from the catalogue whenever the cart is
 * shown, and at checkout the server prices the order from its own records, so
 * a cart edited in the browser cannot change what anything costs.
 *
 * A module-level store behind `useSyncExternalStore` rather than a context
 * provider: every component that calls `useCart()` sees the same lines, with
 * nothing to mount in the layout. On the server, and during hydration, the
 * cart is empty; the browser's copy is read after, so server and client HTML
 * always match.
 */

export interface CartLine {
  slug: string;
  /** The pack size. Absent while a product has no pack sizes (price to be confirmed). */
  variantId?: string;
  qty: number;
}

/** The most of one line a shopper can hold — the product page's limit too. */
export const MAX_QTY = 20;

const STORAGE_KEY = "burla:cart:v1";
const EMPTY: readonly CartLine[] = [];
const ID = /^[A-Za-z0-9_-]{1,120}$/;

let lines: readonly CartLine[] | null = null;
const listeners = new Set<() => void>();

/**
 * Whatever is in storage is untrusted: it may be from an older version of the
 * site, edited by hand, or name a product since removed. Only well-formed
 * lines for products (and pack sizes) that still exist survive.
 */
function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const out: CartLine[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const { slug, variantId, qty } = item as Record<string, unknown>;
    if (typeof slug !== "string" || !ID.test(slug)) continue;
    if (variantId !== undefined && (typeof variantId !== "string" || !ID.test(variantId))) {
      continue;
    }
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;

    const product = productBySlug(slug);
    if (!product) continue;
    if (variantId && !product.variants.some((v) => v.id === variantId)) continue;
    if (out.some((l) => sameLine(l, slug, variantId))) continue;

    out.push({ slug, ...(variantId ? { variantId } : {}), qty: Math.min(qty, MAX_QTY) });
  }
  return out;
}

function read(): CartLine[] {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage blocked (private mode, a strict browser setting): the cart
    // still works for this page view.
    return [];
  }
}

function sameLine(line: CartLine, slug: string, variantId?: string) {
  return line.slug === slug && (line.variantId ?? "") === (variantId ?? "");
}

function notify() {
  for (const listener of listeners) listener();
}

function commit(next: readonly CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // See read().
  }
  notify();
}

function onStorage(event: StorageEvent) {
  // Another tab changed the cart.
  if (event.key !== STORAGE_KEY) return;
  lines = parse(event.newValue);
  notify();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function snapshot(): readonly CartLine[] {
  if (lines === null) lines = read();
  return lines;
}

function serverSnapshot(): readonly CartLine[] {
  return EMPTY;
}

const current = () => snapshot();

export function addToCart(slug: string, variantId?: string, qty = 1) {
  const existing = current().find((l) => sameLine(l, slug, variantId));
  if (existing) {
    setCartQty(slug, variantId, existing.qty + qty);
    return;
  }
  commit([
    ...current(),
    { slug, ...(variantId ? { variantId } : {}), qty: Math.min(Math.max(1, qty), MAX_QTY) },
  ]);
}

/** Sets a line's quantity; zero or less removes it. */
export function setCartQty(slug: string, variantId: string | undefined, qty: number) {
  if (qty <= 0) {
    removeFromCart(slug, variantId);
    return;
  }
  commit(
    current().map((l) =>
      sameLine(l, slug, variantId) ? { ...l, qty: Math.min(qty, MAX_QTY) } : l,
    ),
  );
}

/**
 * One step up or down from the quantity in the store — not from the one the
 * button last rendered — so rapid presses never collapse into one.
 */
export function stepCartQty(slug: string, variantId: string | undefined, delta: 1 | -1) {
  const existing = current().find((l) => sameLine(l, slug, variantId));
  setCartQty(slug, variantId, (existing?.qty ?? 0) + delta);
}

export function removeFromCart(slug: string, variantId?: string) {
  commit(current().filter((l) => !sameLine(l, slug, variantId)));
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return {
    items,
    /** Total units, as the header badge shows it. */
    count: items.reduce((n, l) => n + l.qty, 0),
    qtyOf: (slug: string, variantId?: string) =>
      items.find((l) => sameLine(l, slug, variantId))?.qty ?? 0,
  };
}
