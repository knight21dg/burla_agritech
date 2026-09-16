import { z } from "zod";

/**
 * What the category and type forms may send.
 *
 * Strict, for the same reason every schema in this application is: a payload
 * carrying `parentId`, `isSample` or `id` is refused rather than absorbed.
 * Where a row sits in the tree is decided by the route being used, never by a
 * field in the body — otherwise a type could be re-parented, or promoted to a
 * category, by editing a form in a browser.
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

/** The tints behind the illustrated placeholders. Presentational only. */
export const TONES = [
  "turmeric",
  "mango",
  "chilli",
  "leaf",
  "grain",
  "berry",
  "earth",
  "cream",
] as const;

export const categorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter a name.")
      .max(80, "Keep the name under 80 characters."),
    slug,
    /** Shown in the header rail, where the full name does not fit. */
    shortName: z.string().trim().max(40, "Keep the short name under 40 characters.").default(""),
    heroHeadline: z.string().trim().max(120).default(""),
    description: z.string().trim().max(2000).default(""),
    seoTitle: z.string().trim().max(70).default(""),
    seoDescription: z.string().trim().max(160).default(""),
    tone: z.enum(TONES).default("cream"),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export type CategoryInput = z.infer<typeof categorySchema>;

/** Creating has no row to be stale against, and no ordering decision yet. */
export const newCategorySchema = categorySchema
  .omit({ expectedUpdatedAt: true })
  .extend({
    /** Empty creates a top-level range; a uuid creates a type inside it. */
    parentId: z.union([z.string().uuid(), z.literal("")]).transform((v) => (v === "" ? null : v)),
  })
  .strict();

export type NewCategoryInput = z.infer<typeof newCategorySchema>;

export const categoryStatusSchema = z.enum(["draft", "published", "hidden"]);

/**
 * A slug suggestion, offered while typing a name — never applied on its own.
 *
 * Renaming a category must not silently change its public URL: the URL is
 * what people have bookmarked and what search engines have indexed. So this
 * fills the field when it is empty and leaves it alone otherwise.
 */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
