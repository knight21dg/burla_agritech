import { money } from "./format";

/**
 * The order confirmation sent to a customer on WhatsApp.
 *
 * The admin cannot send WhatsApp messages by itself — that needs Meta's
 * WhatsApp Business Platform, which is not set up. Instead the owner taps a
 * button, WhatsApp opens with this message already written to the customer,
 * and the owner presses send. Nothing here promises anything the order does
 * not say: no delivery dates, no offers.
 */

export interface ConfirmationOrder {
  orderNumber: string;
  contactName: string;
  paymentMethod: "upi" | "card" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalMinor: number;
  items: { productName: string; size: string; quantity: number }[];
  shippingAddress: { city?: string; pincode?: string };
}

/** Digits for wa.me, or null when the number cannot be a phone number. */
export function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return /^[6-9]/.test(digits) ? `91${digits}` : null;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // A number from another country, written with its country code.
  return digits.length >= 11 && digits.length <= 15 && !digits.startsWith("0") ? digits : null;
}

export function confirmationText(order: ConfirmationOrder): string {
  const firstName = order.contactName.trim().split(/\s+/)[0] ?? "";
  const items = order.items.map((item) => `• ${item.productName} (${item.size}) × ${item.quantity}`);
  const payment =
    order.paymentMethod === "cod"
      ? `${money(order.totalMinor)}, cash on delivery`
      : order.paymentStatus === "paid"
        ? `${money(order.totalMinor)}, paid online`
        : money(order.totalMinor);
  const place = [order.shippingAddress.city, order.shippingAddress.pincode].filter(Boolean).join(" ");

  return [
    `Hello ${firstName},`,
    "",
    `Your order ${order.orderNumber} with Burla Global Agri Products is confirmed.`,
    "",
    ...items,
    "",
    `Total: ${payment}`,
    ...(place ? [`Delivering to: ${place}`] : []),
    "",
    "We are preparing your order now and will let you know when it is on its way.",
    "",
    "Thank you for shopping with us.",
  ].join("\n");
}

/** The link that opens WhatsApp with the confirmation written, or null. */
export function confirmationLink(order: ConfirmationOrder & { contactPhone: string }): string | null {
  const number = whatsappNumber(order.contactPhone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(confirmationText(order))}` : null;
}
