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

// --- offer strip ---------------------------------------------------------------

/**
 * The scrolling strip of offers under the website's header — bulk orders,
 * discounts, delivery, partnerships, quotes — edited by the owner under
 * Website in the admin.
 *
 * Kept in the same settings row as the homepage words, under its own key, and
 * written on its own, so saving one never touches the other.
 *
 * Icons and destinations are chosen from fixed lists rather than typed: an
 * icon name or a web address the owner types is one they can mistype, and a
 * typed address could send customers anywhere.
 */

export const OFFER_ICONS = ["truck", "percent", "package", "handshake", "phone", "leaf", "gift", "star"] as const;
export type OfferIcon = (typeof OFFER_ICONS)[number];

/** Where an offer can lead: a page of this website, or nowhere. */
export const OFFER_LINKS = {
  none: { label: "Nowhere (just a message)", href: null },
  wholesale: { label: "Bulk & Wholesale page", href: "/wholesale" },
  contact: { label: "Contact page", href: "/contact" },
  products: { label: "All products", href: "/products" },
  delivery: { label: "Delivery Policy", href: "/policies/delivery" },
  about: { label: "About Us", href: "/about" },
  quality: { label: "Quality page", href: "/quality" },
} as const;
export type OfferLink = keyof typeof OFFER_LINKS;

export const offerSchema = z
  .object({
    icon: z.enum(OFFER_ICONS),
    title: z.string().trim().min(2, "Write a short title.").max(40, "Keep the title under 40 characters."),
    text: z.string().trim().max(60, "Keep this line under 60 characters."),
    link: z.enum(Object.keys(OFFER_LINKS) as [OfferLink, ...OfferLink[]]),
  })
  .strict();

export const offerStripSchema = z
  .object({
    visible: z.boolean(),
    offers: z.array(offerSchema).min(1, "Add at least one offer.").max(8, "Up to 8 offers."),
  })
  .strict();

export type Offer = z.infer<typeof offerSchema>;
export type OfferStrip = z.infer<typeof offerStripSchema>;

/**
 * The strip as the client supplied it in their mockup (2026-09-17). These are
 * the business's own claims; the owner can change or remove any of them.
 */
export const OFFER_STRIP_DEFAULTS: OfferStrip = {
  visible: true,
  offers: [
    { icon: "truck", title: "Bulk Orders Welcome", text: "For retailers, distributors & businesses", link: "wholesale" },
    { icon: "percent", title: "Special Discounts on Bulk Supply", text: "Better prices for larger quantities", link: "wholesale" },
    { icon: "package", title: "Pan India Delivery", text: "Safe, reliable and on time", link: "delivery" },
    { icon: "handshake", title: "Partner With Us", text: "Let's grow together", link: "wholesale" },
    { icon: "phone", title: "Get a Quote", text: "Contact us for bulk enquiries", link: "wholesale" },
  ],
};

/** The stored strip, made safe to render; anything malformed gives the defaults. */
export function readOfferStrip(stored: unknown): OfferStrip {
  const parsed = offerStripSchema.safeParse(stored);
  return parsed.success ? parsed.data : OFFER_STRIP_DEFAULTS;
}
