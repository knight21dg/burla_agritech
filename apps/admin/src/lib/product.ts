import { z } from "zod";

/**
 * What the product editor may send.
 *
 * Every schema here is `.strict()`. That is the mass-assignment guard
 * (docs/AUTHORIZATION.md §10, test 10): a form post carrying `isSample`,
 * `publishedAt` or `id` is rejected outright rather than parsed and quietly
 * dropped. The fields a person may edit are exactly the fields listed.
 *
 * Status is deliberately **not** editable here. Publishing is its own action
 * with its own rules and its own audit entry, because "I changed the name"
 * and "I put this in front of customers" are different decisions.
 */

const slug = z
  .string()
  .trim()
  .min(2, "A slug needs at least two characters.")
  .max(80, "Keep the slug under 80 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Lowercase letters, numbers and single hyphens only.",
  );

const uuid = z.string().uuid("Choose one from the list.");

export const productDetailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter the product name.")
      .max(120, "Keep the name under 120 characters."),
    slug,
    categoryId: uuid,
    // "" from the select means "no type", which is legitimate: most ranges
    // list products directly.
    typeId: z.union([uuid, z.literal("")]).transform((v) => (v === "" ? null : v)),
    shortDescriptor: z
      .string()
      .trim()
      .max(90, "The short descriptor must fit in 90 characters.")
      .default(""),
    description: z.string().trim().max(5000).default(""),
    seoTitle: z.string().trim().max(70).default(""),
    seoDescription: z.string().trim().max(160).default(""),
    featured: z.coerce.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    /**
     * The row's `updated_at` as the form was drawn. Two people editing one
     * product must not silently overwrite each other — the later save is
     * refused and re-shown (docs/ADMIN-ARCHITECTURE.md §10).
     */
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export type ProductDetailsInput = z.infer<typeof productDetailsSchema>;

/**
 * A pack size.
 *
 * Money is integer paise, everywhere, always. The form takes rupees because
 * that is what a person types, and converts once, here — never a float in the
 * database and never a float in arithmetic.
 */
export const variantSchema = z
  .object({
    id: z.union([uuid, z.literal("new")]),
    label: z
      .string()
      .trim()
      .min(1, "Give the pack a label, such as “250 g”.")
      .max(60),
    sku: z
      .string()
      .trim()
      .min(2, "Enter a SKU.")
      .max(60)
      .regex(/^[A-Za-z0-9._-]+$/, "Letters, numbers, dots, dashes and underscores."),
    priceRupees: z.coerce
      .number()
      .min(0, "A price cannot be negative.")
      .max(1_000_000, "That price looks wrong."),
    /**
     * Optional, and empty means absent — not zero.
     *
     * The emptiness is decided *before* any coercion, deliberately:
     * `Number("")` is 0, so coercing first would turn a blank MRP field into
     * "MRP ₹0", which then fails the "MRP cannot be below the price" rule with
     * a message about a number nobody typed.
     */
    mrpRupees: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? null : value),
      z.union([z.null(), z.coerce.number().min(0).max(1_000_000)]),
    ),
    netWeightGrams: z.coerce
      .number()
      .int()
      .min(1, "Enter the pack weight in grams.")
      .max(100_000),
    lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(5),
    trackInventory: z.coerce.boolean().default(true),
    status: z.enum(["active", "inactive"]).default("active"),
    isDefault: z.coerce.boolean().default(false),
  })
  .strict()
  .refine((v) => v.mrpRupees === null || v.mrpRupees >= v.priceRupees, {
    message: "The MRP cannot be lower than the price.",
    path: ["mrpRupees"],
  });

export type VariantInput = z.infer<typeof variantSchema>;

export const variantsSchema = z
  .array(variantSchema)
  .max(12, "Twelve pack sizes is already a lot.")
  .superRefine((variants, ctx) => {
    const skus = new Set<string>();
    for (const [index, variant] of variants.entries()) {
      const key = variant.sku.toLowerCase();
      if (skus.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "sku"],
          message: "Two packs cannot share a SKU.",
        });
      }
      skus.add(key);
    }

    const defaults = variants.filter((v) => v.isDefault).length;
    if (defaults > 1) {
      ctx.addIssue({
        code: "custom",
        path: [0, "isDefault"],
        message: "Only one pack can be the default.",
      });
    }
  });

/** Rupees in the form, paise in the database. One conversion, in one place. */
export const toMinor = (rupees: number): number => Math.round(rupees * 100);
export const toRupees = (minor: number): number => minor / 100;

/**
 * Whether a product may go in front of customers.
 *
 * Deliberately narrow: a customer must be able to buy it, and it must sit
 * somewhere in the catalogue. Everything else — a description, a photograph,
 * the legal food fields — is reported as a warning rather than a bar.
 *
 * Why the legal fields do not block: none of the 63 products has them yet, so
 * enforcing it here would make the admin unusable on day one without making
 * the site any more compliant. It is a launch gate, not an editing gate; the
 * warning names every missing field so nobody has to remember the list, and
 * `docs/ADMIN-ARCHITECTURE.md` records that publishing the site for real is
 * blocked until they are filled in.
 */
export interface PublishCheck {
  ok: boolean;
  blockers: string[];
  warnings: string[];
}

export function checkPublishable(product: {
  name: string;
  categoryId: string;
  shortDescriptor: string;
  description: string;
  variants: { priceMinor: number; status: string }[];
  hasLegalDetails: boolean;
  hasImage: boolean;
}): PublishCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!product.name.trim()) blockers.push("The product needs a name.");
  if (!product.categoryId) blockers.push("The product needs a category.");

  const sellable = product.variants.filter(
    (v) => v.status === "active" && v.priceMinor > 0,
  );
  if (sellable.length === 0) {
    blockers.push("Add at least one active pack size with a price.");
  }

  if (!product.shortDescriptor.trim()) {
    warnings.push("No short descriptor — the listing and search results read thin.");
  }
  if (!product.description.trim()) {
    warnings.push("No description on the product page.");
  }
  if (!product.hasLegalDetails) {
    warnings.push(
      "No food label details (ingredients, shelf life, FSSAI licence and the rest). " +
        "These are legally required before the site sells to the public.",
    );
  }
  if (!product.hasImage) {
    warnings.push("No photograph in the database yet.");
  }

  return { ok: blockers.length === 0, blockers, warnings };
}
