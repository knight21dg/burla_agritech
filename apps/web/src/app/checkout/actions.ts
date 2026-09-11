"use server";

import { productBySlug } from "@/data/catalog";
import {
  addressErrors,
  orderRequestSchema,
  parseAddressInput,
  type Address,
  type AddressField,
} from "@/lib/checkout";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; code: "SIGNED_OUT"; message: string }
  | {
      ok: false;
      code: "INVALID";
      message: string;
      fieldErrors: Partial<Record<AddressField, string>>;
    }
  | {
      ok: false;
      code: "UNAVAILABLE" | "OUT_OF_STOCK" | "PRICES_PENDING";
      message: string;
      items: string[];
    }
  | { ok: false; code: "ONLINE_PAYMENT_SOON" | "ERROR"; message: string };

const MESSAGES = {
  UNAVAILABLE: "Some items in your cart are no longer available. Remove them to continue.",
  OUT_OF_STOCK: "There isn't enough stock for some items. Lower the quantity or remove them.",
  PRICES_PENDING: "Prices for these items have not been confirmed yet, so the order can't be placed.",
} as const;

/**
 * Places an order for the signed-in customer. Everything the browser sends
 * is re-checked; everything that decides the order — prices, delivery,
 * total, stock — is read from the server's records (orderService).
 *
 * Cash on delivery is placed now. UPI and cards are refused, before anything
 * is written, until the Razorpay step exists: an order must never wait on a
 * payment the site cannot take.
 *
 * Errors are reported to the shopper in plain words; details go nowhere,
 * and nothing personal is logged.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const { currentUser } = await import("@/server/auth/session");
  const user = await currentUser();
  if (!user) {
    return { ok: false, code: "SIGNED_OUT", message: "Please sign in again to place your order." };
  }

  const parsed = orderRequestSchema.safeParse(input);
  const addressInput = parseAddressInput(
    typeof input === "object" && input !== null ? (input as { address?: unknown }).address : undefined,
  );
  if (!parsed.success || !addressInput.success) {
    const fieldErrors = addressInput.success ? {} : addressErrors(addressInput.error);
    return {
      ok: false,
      code: "INVALID",
      message:
        Object.keys(fieldErrors).length > 0
          ? "Some of the delivery details need correcting."
          : "Something in this order didn't look right. Refresh the page and try again.",
      fieldErrors,
    };
  }
  const request = parsed.data;

  const unpriced = request.lines
    .filter((line) => !line.variantId)
    .map((line) => productBySlug(line.slug)?.name ?? line.slug);
  if (unpriced.length > 0) {
    return { ok: false, code: "PRICES_PENDING", message: MESSAGES.PRICES_PENDING, items: unpriced };
  }

  if (request.paymentMethod !== "cod") {
    return {
      ok: false,
      code: "ONLINE_PAYMENT_SOON",
      message: "UPI and card payments are being set up. Choose Cash on delivery to order now.",
    };
  }

  const { findAddress, placeCodOrder } = await import("@/server/services/orderService");

  let address: { value: Address; savedId?: string };
  if ("savedId" in addressInput.data) {
    const saved = await findAddress(user.id, addressInput.data.savedId);
    if (!saved) {
      return {
        ok: false,
        code: "INVALID",
        message: "That saved address is no longer available. Choose another or add a new one.",
        fieldErrors: {},
      };
    }
    const { id, ...value } = saved;
    address = { value, savedId: id };
  } else {
    address = { value: addressInput.data };
  }

  try {
    const result = await placeCodOrder(user.id, request, address);
    if (result.ok) return result;
    if (result.code === "ADDRESS_NOT_FOUND") {
      return { ok: false, code: "INVALID", message: "Choose a delivery address.", fieldErrors: {} };
    }
    return { ok: false, code: result.code, message: MESSAGES[result.code], items: result.items };
  } catch (error) {
    // Two identical requests at once: the idempotency key's unique index let
    // one through. The other finds that order.
    if (isUniqueViolation(error)) {
      const { db } = await import("@/server/db");
      const { findByIdempotencyKey } = await import("@/server/repositories/orderRepository");
      const existing = await findByIdempotencyKey(db, user.id, request.idempotencyKey);
      if (existing) return { ok: true, orderNumber: existing.orderNumber };
    }
    // Only the database's error code and constraint: the error's message
    // carries the query's parameters, which include the customer's address.
    const cause = (error as { cause?: { code?: string; constraint_name?: string } })?.cause;
    console.error("placeOrder failed:", cause?.code ?? "no code", cause?.constraint_name ?? "");
    return {
      ok: false,
      code: "ERROR",
      message: "Something went wrong placing your order. Nothing was charged. Please try again.",
    };
  }
}

function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause;
  return (error as { code?: string })?.code === "23505" || cause?.code === "23505";
}

/** A customer cancels their own order before it ships. */
export async function cancelMyOrder(orderNumber: string): Promise<{ ok: boolean; message?: string }> {
  if (typeof orderNumber !== "string" || !/^BGA-\d{4}-\d{5,}$/.test(orderNumber)) {
    return { ok: false, message: "That order could not be found." };
  }
  const { currentUser } = await import("@/server/auth/session");
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { cancelOrder } = await import("@/server/services/orderService");
  const result = await cancelOrder(user.id, orderNumber);
  if (result.ok) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/account/orders/${orderNumber}`);
    return { ok: true };
  }
  return {
    ok: false,
    message:
      result.code === "NOT_FOUND"
        ? "That order could not be found."
        : "This order can no longer be cancelled.",
  };
}
