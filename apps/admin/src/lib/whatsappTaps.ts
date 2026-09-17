/**
 * A WhatsApp tap, in the owner's words: which page, which button.
 * Web addresses never reach the screen.
 */

const PAGES: Record<string, string> = {
  "/": "Home page",
  "/contact": "Contact page",
  "/wholesale": "Wholesale page",
  "/search": "Search page",
  "/about": "About page",
  "/quality": "Quality page",
  "/locations": "Locations page",
  "/products": "All products page",
  "/cart": "Cart",
  "/checkout": "Checkout",
};

export function pageName(
  path: string,
  productName: string | null,
  categoryNames: Map<string, string>,
): string {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (productName) return productName;
  if (PAGES[clean]) return PAGES[clean];

  const category = clean.match(/^\/products\/([a-z0-9-]+)$/)?.[1];
  if (category && categoryNames.has(category)) return `${categoryNames.get(category)} page`;
  if (clean.startsWith("/products/p/")) return "A product that has since been deleted";
  if (clean.startsWith("/account")) return "Customer's account page";
  if (clean.startsWith("/policies")) return "Policy page";
  return "Another page on the website";
}

const PLACES: Record<string, string> = {
  floating: "Green WhatsApp button",
  footer: "WhatsApp link at the bottom of the page",
  contact: "WhatsApp button on the Contact page",
  wholesale: "WhatsApp button on the Wholesale page",
  search: "WhatsApp button in search results",
};

export function placeName(place: string): string {
  return PLACES[place] ?? "WhatsApp button";
}
