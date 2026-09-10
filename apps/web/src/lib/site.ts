/**
 * Site configuration.
 *
 * Every business value lives here, never in a component (NFR-094).
 * Values marked PLACEHOLDER are tracked in docs/CONTENT-INVENTORY.md and
 * must be replaced with client-supplied facts before launch.
 *
 * Environment-dependent values come from `env.client.ts`, which validates
 * them. This file does not read `process.env` — only the two env modules do,
 * so a typo is a startup failure rather than a silent `undefined`.
 * docs/ENVIRONMENT.md §2.
 *
 * Business identity below (address, GSTIN, partners) moves to the
 * `site_settings` table at Phase 8, so the client can edit it without a
 * deploy. docs/DATA-OWNERSHIP.md §3.
 */
import { clientEnv } from "./env.client";

export const site = {
  name: "Burla Global Agri Products",
  shortName: "Burla",
  tagline: "From Nature to Your Table",
  subTagline: "Pure Products · Healthy People · A Greener Tomorrow",
  description:
    "Indian agricultural produce carefully processed into everyday foods — dehydrated powders and flakes, dehydrated fruits, pickles, dal powders, crisps, dry fruits, millet powders, tea and coffee, masala powders and spices.",
  url: clientEnv.NEXT_PUBLIC_SITE_URL,

  /**
   * From the client's business card, 2026-09-09.
   * The same number as the published phone line — CONFIRM this is the number
   * that actually receives WhatsApp before launch (OQ-004).
   */
  whatsapp: clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,

  contact: {
    phone: "+91 97040 32555",
    phoneRaw: "+919704032555",
    email: "burlaglobalagriproducts@gmail.com",
    hours: "[Business hours to be confirmed]", // OQ-024
  },

  /**
   * Legal identity. GSTIN, address and partners come from the business card.
   *
   * Still outstanding and legally required before a food business can trade
   * online in India:
   *   - FSSAI licence number (OQ-003) — blocking
   *   - The registered firm name as it appears on the GST certificate (OQ-002)
   *   - A named grievance officer (OQ-005)
   */
  legal: {
    entityName: "[Registered firm name to be confirmed]",
    address:
      "Nellore, Iskoncity, SPSR Nellore District, Andhra Pradesh 524003, India",
    city: "Nellore",
    state: "Andhra Pradesh",
    postalCode: "524003",
    country: "IN",
    fssai: "[FSSAI licence number to be confirmed]",
    gstin: "37ABHFB2458F1ZH",
    grievanceOfficer: "[Grievance officer to be confirmed]",
    partners: [
      { name: "Burla Krishna Reddy", role: "Managing Partner" },
      { name: "Burla Jeevan Reddy", role: "Partner" },
    ],
  },

  social: {
    facebook: "#", // PLACEHOLDER — OQ-025
    instagram: "#",
    youtube: "#",
  },
} as const;

/**
 * Primary navigation.
 *
 * Locations is deliberately absent — the client asked for it out of the main
 * nav (2026-09-09). It remains a real, indexable page linked from the footer
 * and About. Product categories are not here either: they live in their own
 * persistent bar beneath the header, so all ten stay visible on every page.
 */
export const mainNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Quality", href: "/quality" },
  { label: "Contact", href: "/contact" },
] as const;

export const policyNav = [
  { label: "Return & Refund Policy", href: "/policies/return-and-refund" },
  { label: "Delivery Policy", href: "/policies/delivery" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
] as const;

export const companyNav = [
  { label: "About Us", href: "/about" },
  { label: "Quality Control & Standards", href: "/quality" },
  { label: "Our Locations", href: "/locations" },
  { label: "Bulk & Wholesale", href: "/wholesale" },
  { label: "Contact Us", href: "/contact" },
] as const;

/**
 * Builds a wa.me deep link. Number comes from config, message is encoded.
 * Analytics event fires at the call site (ANALYTICS.md §2.3).
 */
export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * The pre-filled WhatsApp message for a product. The pack size is optional:
 * none have been supplied yet. The link is the product's real page,
 * /products/p/{slug} — it previously pointed at /products/{slug}, which is a
 * category URL and returned 404 for every product.
 */
export function productEnquiry(name: string, packSize: string | undefined, slug: string) {
  const what = packSize ? `${name} (${packSize})` : name;
  return `Hi Burla, I'd like to know more about ${what}.\n${site.url}/products/p/${slug}`;
}
