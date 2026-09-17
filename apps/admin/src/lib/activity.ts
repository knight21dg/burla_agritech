/**
 * The activity log, in sentences.
 *
 * Underneath, each entry is an action code and a small record of what
 * changed. The owner reads "Changed the price of Mango Pickle", not
 * `product.variants_replaced`. Anything this does not recognise still gets a
 * readable line rather than a code.
 */

export interface ActivityEntry {
  action: string;
  changes: unknown;
}

const ORDER_WORDS: Record<string, string> = {
  processing: "started preparing",
  packed: "marked ready",
  shipped: "marked on the way",
  delivered: "marked delivered",
  cancelled: "cancelled",
};

function field(changes: unknown, key: string): string | undefined {
  if (typeof changes !== "object" || changes === null) return undefined;
  const value = (changes as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export function describe(entry: ActivityEntry): string {
  const name = field(entry.changes, "name");
  const product = name ? ` ${name}` : " a product";
  const [area, what] = entry.action.split(".");

  switch (entry.action) {
    case "session.signed_in":
      return "Signed in";
    case "session.signed_out":
      return "Signed out";
    case "session.sign_in_failed":
      return "Someone tried to sign in with a wrong password";
    case "account.password_changed":
      return "Changed their password";
    case "user.email_changed":
      return "Changed the admin account's email";
    case "product.added":
      return `Added the product${product}`;
    case "product.saved":
    case "product.updated": {
      const renamedFrom = field(entry.changes, "renamedFrom");
      return renamedFrom ? `Renamed ${renamedFrom} to ${name}` : `Edited${product}`;
    }
    case "product.variants_replaced":
      return "Changed a product's prices or pack sizes";
    case "product.deleted":
      return `Deleted${product}`;
    case "product.shown":
    case "product.published":
      return `Showed${product} on the website`;
    case "product.hidden":
    case "product.unpublished":
      return `Hid${product} from the website`;
    case "product.archived":
      return `Deleted${product}`;
    case "product.available":
      return `Marked${product} available`;
    case "product.out_of_stock":
      return `Marked${product} out of stock`;
    case "product.on_homepage":
    case "product.featured":
      return `Put${product} on the homepage`;
    case "product.off_homepage":
    case "product.unfeatured":
      return `Took${product} off the homepage`;
    case "category.added":
    case "category.created":
      return `Added the category ${name ?? ""}`.trim();
    case "category.saved":
    case "category.updated": {
      const renamedFrom = field(entry.changes, "renamedFrom");
      return renamedFrom ? `Renamed the category ${renamedFrom} to ${name}` : `Edited the category ${name ?? ""}`.trim();
    }
    case "category.published":
      return "Showed a category on the website";
    case "category.hidden":
    case "category.draft":
      return "Hid a category from the website";
    case "category.deleted":
      return `Deleted the category ${name ?? ""}`.trim();
    case "subcategory.added": {
      const inside = field(entry.changes, "in");
      return `Added the subcategory ${name ?? ""}${inside ? ` to ${inside}` : ""}`;
    }
    case "subcategory.saved":
      return `Edited the subcategory ${name ?? ""}`.trim();
    case "subcategory.deleted":
      return `Deleted the subcategory ${name ?? ""}`.trim();
    case "customer.deactivated":
      return `Deactivated ${name ?? "a customer"}'s account`;
    case "customer.activated":
      return `Activated ${name ?? "a customer"}'s account again`;
    case "enquiry.marked": {
      const to = field(entry.changes, "to");
      return `Marked the enquiry from ${name ?? "a customer"} as ${to?.toLowerCase() ?? "updated"}`;
    }
    case "website.homepage_saved":
      return "Changed the homepage words";
    case "settings.business_saved":
      return "Changed the business information";
  }

  if (area === "order" && what) {
    const orderNumber = field(entry.changes, "orderNumber");
    const status = (entry.changes as { status?: { from?: unknown } } | null)?.status;
    if (status?.from === "confirmed" && what === "processing") return `Accepted order ${orderNumber ?? ""}`.trim();
    if (status?.from === "confirmed" && what === "cancelled") return `Rejected order ${orderNumber ?? ""}`.trim();
    return `${(ORDER_WORDS[what] ?? "updated").replace(/^./, (c) => c.toUpperCase())} order ${orderNumber ?? ""}`.trim();
  }

  return "Made a change";
}
