import type { OrderStatus, PaymentStatus } from "@burla/core/db/schema";

/**
 * Orders, in the owner's words.
 *
 * The database keeps its own states, and customers see their own wording on
 * the shop ("Confirmed", "Being prepared"…). The owner sees what each state
 * means for them — what has come in and what they need to do next.
 *
 * A new order is waiting for the owner's answer: Accept (it moves to
 * Preparing) or Reject (it is cancelled). Later, while it has not left,
 * "Cancel order" is still possible.
 *
 * Only the moves listed here are possible. An order cannot jump from New to
 * Delivered, or come back from Cancelled; the server refuses anything else,
 * whatever a page sends.
 */

export const ORDER_LABEL: Record<OrderStatus, string> = {
  pending: "Waiting for payment",
  confirmed: "New order",
  processing: "Preparing",
  packed: "Ready",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment failed",
  refunded: "Refunded",
};

export const ORDER_TONE: Record<OrderStatus, "pill-warn" | "pill-on" | "pill-off" | "pill-bad"> = {
  pending: "pill-off",
  confirmed: "pill-warn",
  processing: "pill-warn",
  packed: "pill-warn",
  shipped: "pill-on",
  delivered: "pill-on",
  cancelled: "pill-bad",
  failed: "pill-bad",
  refunded: "pill-off",
};

export interface Step {
  to: OrderStatus;
  label: string;
  /** Said under the button, so its effect is never a surprise. */
  explain?: string;
}

export const NEXT_STEPS: Partial<Record<OrderStatus, Step[]>> = {
  confirmed: [{ to: "processing", label: "Accept order", explain: "It moves to Preparing." }],
  processing: [{ to: "packed", label: "Mark ready" }],
  packed: [
    {
      to: "delivered",
      label: "Mark delivered",
      explain: "For cash on delivery, this also records that the payment was received.",
    },
    { to: "shipped", label: "Sent with a courier" },
  ],
  shipped: [
    {
      to: "delivered",
      label: "Mark delivered",
      explain: "For cash on delivery, this also records that the payment was received.",
    },
  ],
};

export const CAN_CANCEL: readonly OrderStatus[] = ["pending", "confirmed", "processing", "packed"];

/** A new order is rejected; one already accepted is cancelled. */
export function isRejection(from: OrderStatus): boolean {
  return from === "confirmed";
}

/** Paid online: rejecting or cancelling does not send the money back by itself. */
export function needsRefund(method: "upi" | "card" | "cod", status: PaymentStatus): boolean {
  return method !== "cod" && status === "paid";
}

export function canMove(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "cancelled") return CAN_CANCEL.includes(from);
  return (NEXT_STEPS[from] ?? []).some((step) => step.to === to);
}

/** The groups shown as filter buttons above the order list. */
export const ORDER_GROUPS = {
  new: { label: "New", statuses: ["confirmed", "pending"] as OrderStatus[] },
  preparing: { label: "Preparing", statuses: ["processing"] as OrderStatus[] },
  ready: { label: "Ready", statuses: ["packed", "shipped"] as OrderStatus[] },
  delivered: { label: "Delivered", statuses: ["delivered"] as OrderStatus[] },
  cancelled: { label: "Cancelled", statuses: ["cancelled", "failed", "refunded"] as OrderStatus[] },
} as const;

export type OrderGroup = keyof typeof ORDER_GROUPS;

export function paymentLabel(method: "upi" | "card" | "cod", status: PaymentStatus): string {
  if (method === "cod") {
    return status === "paid" ? "Cash on delivery — paid" : "Cash on delivery — not paid yet";
  }
  const how = method === "upi" ? "UPI" : "Card";
  switch (status) {
    case "paid":
      return `Paid by ${how}`;
    case "failed":
      return `${how} payment failed`;
    case "refunded":
      return `${how} payment refunded`;
    default:
      return `${how} — waiting for payment`;
  }
}
