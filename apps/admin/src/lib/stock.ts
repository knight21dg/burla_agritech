import { z } from "zod";

/**
 * Stock, in the owner's words.
 *
 * Each pack size either has its packets counted or not. Counted: the website
 * shows "Only 3 left" when few remain and stops selling at none. Not counted:
 * it is simply on sale, or out of stock when the owner says so.
 */

export interface PackStock {
  counted: boolean;
  quantity: number;
  lowLevel: number;
  /** false when the owner marked the pack "Out of stock" by hand. */
  onSale: boolean;
}

export type StockState = "in_stock" | "running_low" | "none_left" | "marked_out" | "not_counted";

export function stockState(pack: PackStock): StockState {
  if (!pack.onSale) return "marked_out";
  if (!pack.counted) return "not_counted";
  if (pack.quantity <= 0) return "none_left";
  if (pack.quantity <= pack.lowLevel) return "running_low";
  return "in_stock";
}

export const STOCK_LABEL: Record<StockState, string> = {
  in_stock: "In stock",
  running_low: "Running low",
  none_left: "None left",
  marked_out: "Marked out of stock",
  not_counted: "Not counted",
};

export const STOCK_TONE: Record<StockState, "pill-on" | "pill-warn" | "pill-bad" | "pill-off"> = {
  in_stock: "pill-on",
  running_low: "pill-warn",
  none_left: "pill-bad",
  marked_out: "pill-bad",
  not_counted: "pill-off",
};

/** What a customer sees on the website for this pack. */
export function websiteSays(pack: PackStock): string {
  switch (stockState(pack)) {
    case "running_low":
      return `Only ${pack.quantity} left`;
    case "none_left":
    case "marked_out":
      return "Out of stock";
    default:
      return "In stock";
  }
}

/**
 * The new count after "Set count". If orders came in while the form was open,
 * they still count: the change the owner made is applied to today's figure.
 */
export function countAfterSet(current: number, seen: number | undefined, wanted: number): number {
  if (seen === undefined) return wanted;
  return Math.max(0, current + (wanted - seen));
}

export const MAX_PACKETS = 100_000;

export const packetsSchema = z.coerce
  .number({ message: "Enter a number." })
  .int("Enter a whole number, like 12.")
  .min(0, "The number cannot be below 0.")
  .max(MAX_PACKETS, "That number is too large.");
