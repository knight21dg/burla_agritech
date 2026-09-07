/**
 * Site configuration.
 *
 * Every business value lives here, never in a component (NFR-094).
 * Values marked PLACEHOLDER are tracked in docs/CONTENT-INVENTORY.md and
 * must be replaced with client-supplied facts before launch.
 */

export const site = {
  name: "Burla Global Agri Products",
  shortName: "Burla",
  tagline: "From Nature to Your Table",
  subTagline: "Pure Products · Healthy People · A Greener Tomorrow",
  description:
    "Indian agricultural produce carefully processed into everyday foods — dehydrated powders and flakes, pickles, spiced dal powders, sun-dried crisps, dry fruits, millets, herbal infusions and masalas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** PLACEHOLDER — OQ-004. Read from env in production, never hard-coded. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919876543210",

  contact: {
    phone: "+91 98765 43210", // PLACEHOLDER — OQ-024
    email: "hello@burlaagri.com", // PLACEHOLDER — OQ-024
    exportEmail: "export@burlaagri.com", // PLACEHOLDER — OQ-043
    hours: "Monday to Saturday, 9:00 AM – 6:00 PM IST", // PLACEHOLDER
  },

  /** PLACEHOLDER — OQ-002, OQ-003, OQ-005. Legally required in the footer. */
  legal: {
    entityName: "[Legal entity name to be confirmed]",
    address: "[Registered address to be confirmed]",
    fssai: "[FSSAI licence number to be confirmed]",
    gstin: "[GSTIN to be confirmed]",
    grievanceOfficer: "[Grievance officer to be confirmed]",
  },

  social: {
    facebook: "#", // PLACEHOLDER — OQ-025
    instagram: "#",
    youtube: "#",
  },
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop", hasMegaMenu: true },
  { label: "About", href: "/about" },
  { label: "Quality", href: "/quality" },
  { label: "Locations", href: "/locations" },
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

export function productEnquiry(name: string, packSize: string, slug: string) {
  return `Hi Burla, I'd like to know more about ${name} (${packSize}).\n${site.url}/products/${slug}`;
}
