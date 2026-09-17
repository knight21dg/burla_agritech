/**
 * "500 g", "1 kg", "250g", "1.5 kg" — pack sizes as people write them.
 *
 * The owner types a pack size the way it is printed on the packet. The
 * database needs a number too, for ordering packs from small to large, so
 * this reads the number out of what they typed and writes the label back in
 * one consistent form ("1 kg", not "1KG" on one pack and "1000g" on the next).
 *
 * Millilitres and litres are accepted for anything sold by volume; the number
 * stored is only ever used to put packs in order, and a litre sits after 500 ml
 * either way.
 */

export interface PackSize {
  /** What the site shows: "500 g", "1 kg". */
  label: string;
  /** Grams (or millilitres), for ordering. */
  amount: number;
}

const UNITS: Record<string, { factor: number; label: string }> = {
  g: { factor: 1, label: "g" },
  gm: { factor: 1, label: "g" },
  gms: { factor: 1, label: "g" },
  gram: { factor: 1, label: "g" },
  grams: { factor: 1, label: "g" },
  kg: { factor: 1000, label: "kg" },
  kgs: { factor: 1000, label: "kg" },
  ml: { factor: 1, label: "ml" },
  l: { factor: 1000, label: "L" },
  ltr: { factor: 1000, label: "L" },
  litre: { factor: 1000, label: "L" },
  liter: { factor: 1000, label: "L" },
};

export const PACK_SIZE_HELP = "Write it like 250 g, 500 g or 1 kg.";

export function parsePackSize(input: string): PackSize | undefined {
  const match = input
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*([a-z]*)$/);
  if (!match) return undefined;

  const value = Number(match[1]);
  // A bare number is grams: nobody sells a 250 kg packet of pickle.
  const unit = UNITS[match[2] || "g"];
  if (!unit || !Number.isFinite(value) || value <= 0) return undefined;

  const amount = Math.round(value * unit.factor);
  if (amount < 1 || amount > 100_000) return undefined;

  // "1.50" reads as "1.5"; whole numbers never grow a decimal point.
  const shown = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
  return { label: `${shown} ${unit.label}`, amount };
}
