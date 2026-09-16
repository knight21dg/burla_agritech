import { z } from "zod";

/**
 * The homepage words the owner can change from the admin.
 *
 * Four strings, each with a fixed place in the design. The admin validates
 * against this schema before saving; the storefront parses with it again on
 * the way out, so a malformed row renders the defaults below rather than a
 * broken homepage.
 *
 * Line breaks the owner types are kept: the hero heading is set on three
 * lines in the design, and a textarea is the plain way to say where they go.
 */

export const homepageSchema = z
  .object({
    heroHeading: z
      .string()
      .trim()
      .min(3, "Write a heading.")
      .max(120, "Keep the heading under 120 characters."),
    heroText: z
      .string()
      .trim()
      .min(3, "Write a line under the heading.")
      .max(300, "Keep this under 300 characters."),
    aboutHeading: z
      .string()
      .trim()
      .min(3, "Write a heading.")
      .max(120, "Keep the heading under 120 characters."),
    aboutText: z
      .string()
      .trim()
      .min(3, "Write a few words about Burla.")
      .max(800, "Keep this under 800 characters."),
  })
  .strict();

export type Homepage = z.infer<typeof homepageSchema>;

/** Exactly what the homepage said before any of this was editable. */
export const HOMEPAGE_DEFAULTS: Homepage = {
  heroHeading: "Pure Goodness from\nIndia’s Soil\nTo Your Table",
  heroText:
    "Wholesome agricultural products, carefully processed for a healthier, happier tomorrow.",
  aboutHeading: "Rooted in Values.\nGrowing for Tomorrow.",
  aboutText:
    "Burla Global Agri Products brings the everyday foods of Indian farming — dried, cured, roasted and milled — from the field to your table, with careful grading and honest packing at every step.",
};

/** What is stored, made safe to render: each field falls back on its own. */
export function readHomepage(stored: unknown): Homepage {
  if (typeof stored !== "object" || stored === null) return HOMEPAGE_DEFAULTS;
  const record = stored as Record<string, unknown>;
  const out = { ...HOMEPAGE_DEFAULTS };
  for (const key of Object.keys(HOMEPAGE_DEFAULTS) as (keyof Homepage)[]) {
    const field = homepageSchema.shape[key].safeParse(record[key]);
    if (field.success) out[key] = field.data;
  }
  return out;
}

/** Lines, for rendering with a break between each. */
export function linesOf(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
