"use client";

import { useEffect, useState } from "react";
import { resolveCart } from "@/app/cart/actions";
import { useCart } from "./cartStore";
import type { ResolvedLine } from "./lines";

/**
 * The cart, with each line's product read back from the server.
 *
 * The cart page and checkout both need this, and both used to get it for free
 * from a catalogue that sat in the browser. Now it is one request per change
 * to the cart, which is a handful of requests in a session.
 *
 * Three states, and they are different on purpose:
 *
 *   `ready: false`  — the browser's cart has not been read yet, or the first
 *                     resolve is in flight. Callers show a quiet placeholder,
 *                     never "your cart is empty", which would flash on every
 *                     visit and is a lie while the answer is unknown.
 *   `lines: []`     — resolved, and there is genuinely nothing in it.
 *   `lines: [...]`  — resolved.
 *
 * A reply that is no longer the latest is discarded, so removing two items
 * quickly cannot leave the first reply on screen.
 */
export function useResolvedCart() {
  const { items, count } = useCart();
  const [lines, setLines] = useState<ResolvedLine[]>();

  // The cart's contents, not its identity: `items` is a new array on every
  // store notification, and an effect keyed on the array itself would loop.
  const key = JSON.stringify(items);

  useEffect(() => {
    if (items.length === 0) {
      setLines([]);
      return;
    }

    let current = true;
    resolveCart(items)
      .then((resolved) => {
        if (current) setLines(resolved);
      })
      .catch(() => {
        // The page stays on its placeholder rather than claiming an empty
        // cart because a request failed.
        if (current) setLines(undefined);
      });

    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on contents
  }, [key]);

  return { items, count, lines: lines ?? [], ready: lines !== undefined };
}
