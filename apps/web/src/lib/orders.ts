/**
 * How order states read to a customer. Shared by the account pages.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed"
  | "refunded";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Being prepared",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment failed",
  refunded: "Refunded",
};

/** The milestones shown as a progress line, Flipkart-style. */
export const ORDER_MILESTONES: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

const PROGRESS: Partial<Record<OrderStatus, number>> = {
  confirmed: 0,
  processing: 0,
  packed: 1,
  shipped: 2,
  delivered: 3,
};

/** How far along the milestones an order is; -1 when it left the path. */
export function milestoneIndex(status: OrderStatus): number {
  return PROGRESS[status] ?? -1;
}

export const statusTone = (status: OrderStatus) =>
  status === "cancelled" || status === "failed"
    ? "bg-danger/10 text-danger"
    : status === "delivered"
      ? "bg-green-50 text-green-700"
      : "bg-surface text-ink-2";
