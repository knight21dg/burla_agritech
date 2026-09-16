/**
 * Formatting for the admin.
 *
 * Money is integer paise everywhere in this codebase, and becomes a string
 * exactly here. Nothing divides by 100 inline, because that is how a rounding
 * error reaches an invoice.
 */

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const rupeesWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

/** ₹1,250 — or ₹1,250.50 when the paise are not zero. */
export function money(minor: number): string {
  return minor % 100 === 0 ? rupees.format(minor / 100) : rupeesWithPaise.format(minor / 100);
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

/** Always IST: the business is in Nellore, and so is everyone reading this. */
export function when(value: Date | string): string {
  return dateTime.format(typeof value === "string" ? new Date(value) : value);
}
