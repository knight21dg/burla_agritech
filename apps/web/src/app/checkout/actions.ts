"use server";

import { productBySlug } from "@/data/catalog";
import { addressErrors, orderRequestSchema, type AddressField } from "@/lib/checkout";

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      code: "INVALID";
      message: string;
      fieldErrors: Partial<Record<AddressField, string>>;
    }
  | { ok: false; code: "UNAVAILABLE" | "PRICES_PENDING"; message: string; items: string[] }
  | { ok: false; code: "NOT_ENABLED"; message: string };

/**
 * Places an order. Everything the browser sends is re-checked here.
 *
 *   1. The request is parsed against the same strict schema as the form: a
 *      malformed address, an unknown field or an impossible quantity is
 *      refused, and nothing unparsed goes further.
 *   2. Every line is priced from the catalogue, the server's own records.
 *      The request carries no prices, and a price the browser invented could
 *      not change what an order costs.
 *   3. A line whose product is gone, whose pack size is gone or sold out, or
 *      which has no price yet stops the order, naming the items.
 *
 * Only a request that passes all three reaches the point of recording the
 * order and taking payment — which is not built yet: the orders tables,
 * Razorpay for UPI and cards (the payment confirmed on the server, by its
 * signature and webhook, never by the browser saying it succeeded), and
 * cash-on-delivery confirmation. Until it is, the order is refused, saying so.
 *
 * No personal details are logged.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = addressErrors(parsed.error);
    return {
      ok: false,
      code: "INVALID",
      // Address problems are shown by their fields. Anything else — the
      // cart or the payment method — the form cannot have sent, so the
      // request is stale or was altered: say so plainly, and no more.
      message:
        Object.keys(fieldErrors).length > 0
          ? "Some of the delivery details need correcting."
          : "Something in this order didn't look right. Refresh the page and try again.",
      fieldErrors,
    };
  }

  const unavailable: string[] = [];
  const unpriced: string[] = [];
  let subtotalMinor = 0;

  for (const line of parsed.data.lines) {
    const product = productBySlug(line.slug);
    if (!product) {
      unavailable.push(line.slug);
      continue;
    }
    if (!line.variantId) {
      // Added before the product had pack sizes, or while it has none.
      unpriced.push(product.name);
      continue;
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    if (!variant || variant.availability === "out_of_stock") {
      unavailable.push(product.name);
      continue;
    }
    subtotalMinor += variant.priceMinor * line.qty;
  }

  if (unavailable.length > 0) {
    return {
      ok: false,
      code: "UNAVAILABLE",
      message: "Some items in your cart are no longer available. Remove them to continue.",
      items: unavailable,
    };
  }
  if (unpriced.length > 0) {
    return {
      ok: false,
      code: "PRICES_PENDING",
      message:
        "Prices for these items have not been confirmed yet, so the order can't be placed.",
      items: unpriced,
    };
  }

  // Every line is valid and priced; subtotalMinor is the server's total.
  // Recording the order and taking payment is the next build step (above).
  void subtotalMinor;
  return {
    ok: false,
    code: "NOT_ENABLED",
    message: "Online ordering isn't switched on yet.",
  };
}
