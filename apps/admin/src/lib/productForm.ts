import { z } from "zod";
import { PACK_SIZE_HELP, parsePackSize } from "./packSize";

/**
 * What the product screen sends when the owner presses "Save".
 *
 * One form, one save: the photo, the name, the category, the pack sizes and
 * whether it is on the website all go together, because that is how the
 * owner thinks about a product — not as four separate records.
 *
 * Every schema is `.strict()`: a request carrying anything not listed here is
 * refused rather than quietly ignored, so nothing can be set through this form
 * that the form does not show.
 *
 * The messages are written for the owner, not for a developer.
 */

const uuid = z.string().uuid("Please choose from the list.");

export const packSchema = z
  .object({
    /** An existing pack's id, or "new". */
    id: z.union([z.string().uuid(), z.literal("new")]),
    size: z
      .string()
      .trim()
      .min(1, "Enter the pack size.")
      .refine((value) => parsePackSize(value) !== undefined, PACK_SIZE_HELP),
    price: z.coerce
      .number({ message: "Enter the price." })
      .gt(0, "Enter a price above ₹0.")
      .max(1_000_000, "That price looks too high."),
    available: z.boolean(),
  })
  .strict();

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter the product name.")
      .max(120, "Please keep the name shorter."),
    categoryId: uuid,
    subcategoryId: z.union([z.string().uuid(), z.literal("")]),
    description: z.string().trim().max(5000, "Please keep the description shorter."),
    visible: z.boolean(),
    packs: z
      .array(packSchema)
      .max(12, "That is a lot of pack sizes — twelve at most.")
      .superRefine((packs, ctx) => {
        const seen = new Map<string, number>();
        for (const [index, pack] of packs.entries()) {
          const parsed = parsePackSize(pack.size);
          if (!parsed) continue;
          const earlier = seen.get(parsed.label);
          if (earlier !== undefined) {
            ctx.addIssue({
              code: "custom",
              path: [index, "size"],
              message: `You have ${parsed.label} twice.`,
            });
          }
          seen.set(parsed.label, index);
        }
      }),
    /** Hidden by default under "More options". */
    advanced: z
      .object({
        shortLine: z.string().trim().max(90, "Keep this to one short line."),
        webAddress: z
          .string()
          .trim()
          .max(80)
          .refine(
            (v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
            "Use small letters, numbers and dashes only.",
          ),
        onHomepage: z.boolean(),
      })
      .strict(),
    removePhoto: z.boolean(),
    /** When the form was drawn, so two people cannot overwrite each other. */
    expectedUpdatedAt: z.string().optional(),
  })
  .strict()
  .superRefine((form, ctx) => {
    if (form.visible && !form.packs.some((pack) => pack.available)) {
      ctx.addIssue({
        code: "custom",
        path: ["visible"],
        message:
          "To show this product on the website, add a pack size with a price and mark it available.",
      });
    }
  });

export type ProductForm = z.infer<typeof productFormSchema>;
export type PackForm = z.infer<typeof packSchema>;

/** Rupees as typed, paise as stored. Rounding, never truncating. */
export const toPaise = (rupees: number): number => Math.round(rupees * 100);

/** A web address from a name: "Mango Pickle" → "mango-pickle". */
export function webAddressFrom(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Turns field paths into the flat keys the form shows errors against. */
export function errorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
