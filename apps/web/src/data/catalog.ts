/**
 * BURLA PRODUCT CATALOGUE — as supplied by the client, 2026-09-10.
 *
 * Every category, type and product name below is exactly as written in the
 * client's catalogue. Nothing has been corrected or added. The only renames
 * are the client's own: the Millet Powders and Tea / Coffee products carry the
 * fuller names from the client's product sheet of 2026-09-10, noted at each.
 *
 * What the catalogue does NOT provide is left empty rather than invented:
 *   - prices and pack sizes      → SAMPLE rates, at the client's request, until
 *                                  real ones arrive: see SAMPLE_PACKS below
 *   - descriptions               → `""`; the UI shows a placeholder
 *   - images                     → only the client-supplied photographs in
 *                                  `lib/imagery.ts`; otherwise the illustrated
 *                                  placeholder
 *   - ingredients, shelf life, certifications and every other legal field
 *                                → rendered as "To be confirmed" on the product page
 *
 * Items the client marked "confirmation required", and items whose meaning is
 * ambiguous as written, carry a `confirmation` note (TODO) and are kept
 * exactly as written.
 *
 * `tone` is presentational only — the tint of the placeholder illustration —
 * and is set per category, so it implies nothing about how a product looks.
 *
 * This module's shape mirrors the production schema (docs/DATABASE-DESIGN.md)
 * so the move to database queries stays a one-file change (Phase 8).
 */

/**
 * The site is still a demo: the names are real, but the prices and pack sizes
 * are samples, and no descriptions or legally required product details have
 * been supplied, so nothing here may be published as a live, orderable
 * catalogue.
 */
export const IS_SAMPLE_DATA = true;

export type Availability = "in_stock" | "low_stock" | "out_of_stock" | "enquire_only";

export interface Variant {
  id: string;
  label: string;
  sku: string;
  /** Minor units (paise). Never floats. */
  priceMinor: number;
  mrpMinor?: number;
  netWeightGrams: number;
  availability: Availability;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  /** Exactly as written in the client's catalogue. */
  name: string;
  /** Always the top-level category, so breadcrumbs never need a recursive walk. */
  categorySlug: string;
  /** The type within that category, where one exists. */
  typeSlug?: string;
  /** Not supplied yet — empty until the client provides it. */
  shortDescriptor: string;
  /** Not supplied yet — empty until the client provides it. */
  description: string;
  /** Pack sizes and prices. Empty until the client provides them. */
  variants: Variant[];
  featured?: boolean;
  /** Placeholder illustration tint; set per category. */
  tone: Tone;
  /** TODO — why this item needs the client's confirmation. */
  confirmation?: string;
}

export type Tone =
  | "turmeric"
  | "mango"
  | "chilli"
  | "leaf"
  | "grain"
  | "berry"
  | "earth"
  | "cream";

export interface Category {
  slug: string;
  /** Exactly as written in the client's catalogue. */
  name: string;
  /** Header navigation label, where the full name does not fit. */
  shortName: string;
  order: number;
  /** Not supplied yet. */
  heroHeadline: string;
  /** Not supplied yet — empty until the client provides it. */
  description: string;
  tone: Tone;
  /** Present = this row is a TYPE sitting under that category. */
  parentSlug?: string;
  /** TODO — why this item needs the client's confirmation. */
  confirmation?: string;
}

/* --------------------------------------------------------------------------
   Categories — the ten in the client's catalogue, in its order.
   -------------------------------------------------------------------------- */

function category(
  slug: string,
  name: string,
  order: number,
  tone: Tone,
  shortName = name,
): Category {
  return { slug, name, shortName, order, heroHeadline: "", description: "", tone };
}

export const categories: Category[] = [
  // "Powders & Flakes" in the header, where the full name does not fit.
  category("dehydrated-powders-flakes", "Dehydrated Powders & Flakes", 1, "turmeric", "Powders & Flakes"),
  category("dehydrated-fruits", "Dehydrated Fruits", 2, "mango"),
  category("pickles", "Pickles", 3, "chilli"),
  category("dal-powders", "Dal Powders", 4, "earth"),
  category("crisps", "Crisps", 5, "cream"),
  category("dry-fruits", "Dry Fruits", 6, "berry"),
  category("millet-powders", "Millet Powders", 7, "grain"),
  category("tea-coffee", "Tea / Coffee", 8, "leaf"),
  category("masala-powders", "Masala Powders", 9, "chilli"),
  category("spices", "Spices", 10, "earth"),
];

/* --------------------------------------------------------------------------
   Types — only where the catalogue groups products. Categories without a
   type layer show their products directly.
   -------------------------------------------------------------------------- */

function type(
  parentSlug: string,
  slug: string,
  name: string,
  order: number,
  confirmation?: string,
): Category {
  const parent = categories.find((c) => c.slug === parentSlug)!;
  return {
    slug,
    name,
    shortName: name,
    order,
    heroHeadline: "",
    description: "",
    tone: parent.tone,
    parentSlug,
    ...(confirmation ? { confirmation } : {}),
  };
}

export const productTypes: Category[] = [
  type("dehydrated-powders-flakes", "powders", "Powders", 1),
  type("dehydrated-powders-flakes", "flakes", "Flakes", 2),

  type("pickles", "veg-pickles", "Veg Pickles", 1),
  type("pickles", "non-veg-pickles", "Non-Veg Pickles", 2),

  // The catalogue's required hierarchy: Millet Powders → Foxtail / Korralu →
  // Product. Each millet is a type holding its powder.
  type("millet-powders", "foxtail-korralu", "Foxtail / Korralu", 1),
  type("millet-powders", "little-samalu", "Little / Samalu", 2),
  type("millet-powders", "kodo-arikalu", "Kodo / Arikalu", 3),
  type("millet-powders", "barnyard-udalu", "Barnyard / Udalu", 4),
  type("millet-powders", "andukorralu", "Andukorralu", 5),
];

/** Top-level categories only — what the nav and the category grid show. */
export const topCategories = () => categories;

/** The types beneath a category, in display order. Empty when it has none. */
export const typesOf = (categorySlug: string) =>
  productTypes
    .filter((x) => x.parentSlug === categorySlug)
    .sort((a, b) => a.order - b.order);

export const typeBySlug = (categorySlug: string, typeSlug: string) =>
  productTypes.find(
    (x) => x.parentSlug === categorySlug && x.slug === typeSlug,
  );

export const categoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);

/* --------------------------------------------------------------------------
   Products — names exactly as in the client's catalogue.

   Slugs are the name in URL form. Where a name is a single generic word that
   only has meaning inside its category ("Apple", "Non-Veg"), the
   slug carries the category too, so a URL is never ambiguous on its own. The
   product's name is unchanged either way.
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   SAMPLE PACK SIZES AND PRICES — NOT THE CLIENT'S.

   TODO (client): replace every row with Burla's real pack sizes and prices.

   Added at the client's request (2026-09-11) so the cart and checkout can be
   exercised end to end before real prices exist. They are approximate Indian
   retail rates for comparable products, set by us from general market
   knowledge, not researched or quoted from any seller, and they are not
   Burla's prices. No MRP is set, so no discount is ever shown. Stock is
   "in stock" throughout for the same reason.

   Everything seeded from this module is flagged is_sample, and a production
   boot refuses to serve it (server/db/guards.ts), so these cannot go live.

   [grams, rupees] per pack size; the first is the default.
   -------------------------------------------------------------------------- */

type Pack = readonly [grams: number, rupees: number];

const SAMPLE_PACKS: Record<string, readonly Pack[]> = {
  // Dehydrated Powders & Flakes → Powders
  "moringa-powder": [[100, 179], [250, 399]],
  "banana-powder": [[100, 149], [250, 329]],
  "lemon-powder": [[100, 199], [250, 449]],
  "tomato-powder": [[100, 179], [250, 399]],
  "ginger-powder": [[100, 169], [250, 379]],
  "garlic-powder": [[100, 159], [250, 349]],
  "onion-powder": [[100, 149], [250, 329]],
  "carrot-powder": [[100, 199], [250, 449]],
  "beetroot-powder": [[100, 199], [250, 449]],
  "curry-leaves": [[100, 129], [250, 289]],
  "amla-powder": [[100, 129], [250, 289]],
  "abc-powder": [[200, 299], [500, 699]],
  "spinach-powder": [[100, 189], [250, 419]],
  // Dehydrated Powders & Flakes → Flakes
  "mango-flakes": [[100, 199], [250, 449]],
  "tomato-flakes": [[100, 179], [250, 399]],
  "ginger-flakes": [[100, 179], [250, 399]],
  "garlic-flakes": [[100, 169], [250, 379]],
  "onion-flakes": [[100, 149], [250, 329]],
  "carrot-flakes": [[100, 179], [250, 399]],
  "beetroot-flakes": [[100, 189], [250, 419]],
  // Dehydrated Fruits
  "dehydrated-fruits-apple": [[100, 249], [200, 469]],
  "dehydrated-fruits-papaya": [[100, 199], [200, 369]],
  "dehydrated-fruits-mango": [[100, 229], [200, 429]],
  "dehydrated-fruits-pineapple": [[100, 219], [200, 409]],
  "dehydrated-fruits-sapota": [[100, 219], [200, 409]],
  "dehydrated-fruits-honey": [[250, 249], [500, 449]],
  // Pickles → Veg Pickles
  "tomato-pickle": [[250, 149], [500, 279]],
  "gongura-pickle": [[250, 179], [500, 329]],
  "garlic-pickle": [[250, 179], [500, 329]],
  "mango-pickle": [[250, 169], [500, 309]],
  // Pickles → Non-Veg Pickles
  "chicken-pickle": [[250, 399], [500, 749]],
  "prawns-pickle": [[250, 499], [500, 949]],
  "mutton-pickle": [[250, 549], [500, 1049]],
  // Dal Powders
  "kandi-powder": [[200, 129], [500, 299]],
  "chana-powder": [[200, 119], [500, 279]],
  "avise-powder": [[200, 139], [500, 319]],
  "sesame-seed-nuvvulu": [[200, 149], [500, 339]],
  // Crisps
  "rice-vadialu": [[200, 129], [500, 289]],
  "gummadi-vadialu": [[200, 149], [500, 339]],
  saggubiyyam: [[200, 139], [500, 309]],
  "minapa-vadialu": [[200, 159], [500, 359]],
  // Dry Fruits
  badam: [[250, 349], [500, 679]],
  pista: [[250, 449], [500, 879]],
  cashews: [[250, 329], [500, 639]],
  dates: [[250, 179], [500, 339]],
  // Millet Powders
  "foxtail-korralu-powder": [[500, 129], [1000, 239]],
  "little-samalu-powder": [[500, 139], [1000, 259]],
  "kodo-arikalu-powder": [[500, 129], [1000, 239]],
  "barnyard-udalu-powder": [[500, 149], [1000, 279]],
  "andukorralu-powder": [[500, 169], [1000, 319]],
  // Tea / Coffee
  "herbal-tea-powder": [[100, 199], [250, 449]],
  "masala-tea-powder": [[100, 179], [250, 399]],
  "lemon-tea-powder": [[100, 169], [250, 379]],
  "green-tea-powder": [[100, 199], [250, 449]],
  // Masala Powders
  "masala-powders-non-veg": [[100, 79], [200, 149]],
  "masala-powders-chicken-biryani": [[100, 89], [200, 169]],
  "masala-powders-mutton-biryani": [[100, 99], [200, 189]],
  "masala-powders-fish-curry": [[100, 89], [200, 169]],
  // Spices
  "turmeric-powder": [[200, 79], [500, 179]],
  "red-chilli-powder": [[200, 99], [500, 229]],
  "coriander-powder": [[200, 69], [500, 159]],
  "black-pepper-powder": [[100, 149], [250, 349]],
  "rasam-powder": [[100, 69], [200, 129]],
};

function sampleVariants(slug: string): Variant[] {
  const packs = SAMPLE_PACKS[slug];
  if (!packs) throw new Error(`catalog.ts: no sample pack sizes for "${slug}"`);
  return packs.map(([grams, rupees], index) => ({
    id: `${slug}-${grams}g`,
    label: grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`,
    sku: `SAMPLE-${slug.toUpperCase()}-${grams}G`,
    priceMinor: rupees * 100,
    netWeightGrams: grams,
    availability: "in_stock",
    isDefault: index === 0,
  }));
}

function product(
  categorySlug: string,
  slug: string,
  name: string,
  options: { typeSlug?: string; featured?: boolean; confirmation?: string } = {},
): Product {
  const parent = categories.find((c) => c.slug === categorySlug)!;
  return {
    id: slug,
    slug,
    name,
    categorySlug,
    ...(options.typeSlug ? { typeSlug: options.typeSlug } : {}),
    shortDescriptor: "",
    description: "",
    variants: sampleVariants(slug),
    ...(options.featured ? { featured: true } : {}),
    tone: parent.tone,
    ...(options.confirmation ? { confirmation: options.confirmation } : {}),
  };
}

const CONFIRMATION_REQUIRED = "Marked “confirmation required” in the client catalogue.";

const powders = (slug: string, name: string, confirmation?: string) =>
  product("dehydrated-powders-flakes", slug, name, { typeSlug: "powders", confirmation });
const flakes = (slug: string, name: string) =>
  product("dehydrated-powders-flakes", slug, name, { typeSlug: "flakes" });

/**
 * Featured on the homepage: the products that appear both in this catalogue
 * and on the client's Featured Products sheet (2026-09-10) — Mango, Mango
 * Pickle, Gongura Pickle and Red Chilli Powder. The sheet's other two items
 * (Dehydrated Banana, Ragi Flour) are not in this catalogue.
 */
const FEATURED = { featured: true } as const;

export const products: Product[] = [
  // 1. Dehydrated Powders & Flakes → Powders
  powders("moringa-powder", "Moringa Powder"),
  powders("banana-powder", "Banana Powder"),
  powders("lemon-powder", "Lemon Powder"),
  powders("tomato-powder", "Tomato Powder"),
  powders("ginger-powder", "Ginger Powder"),
  powders("garlic-powder", "Garlic Powder"),
  powders("onion-powder", "Onion Powder"),
  powders("carrot-powder", "Carrot Powder"),
  powders("beetroot-powder", "Beetroot Powder"),
  // TODO: written as "Curry Leaves" (without "Powder") under Powders — kept as written.
  powders("curry-leaves", "Curry Leaves"),
  powders("amla-powder", "Amla Powder"),
  powders("abc-powder", "ABC Powder", CONFIRMATION_REQUIRED),
  powders("spinach-powder", "Spinach Powder"),

  // 1. Dehydrated Powders & Flakes → Flakes
  flakes("mango-flakes", "Mango Flakes"),
  flakes("tomato-flakes", "Tomato Flakes"),
  flakes("ginger-flakes", "Ginger Flakes"),
  flakes("garlic-flakes", "Garlic Flakes"),
  flakes("onion-flakes", "Onion Flakes"),
  flakes("carrot-flakes", "Carrot Flakes"),
  flakes("beetroot-flakes", "Beetroot Flakes"),

  // 2. Dehydrated Fruits
  product("dehydrated-fruits", "dehydrated-fruits-apple", "Apple"),
  product("dehydrated-fruits", "dehydrated-fruits-papaya", "Papaya"),
  product("dehydrated-fruits", "dehydrated-fruits-mango", "Mango", FEATURED),
  product("dehydrated-fruits", "dehydrated-fruits-pineapple", "Pineapple"),
  product("dehydrated-fruits", "dehydrated-fruits-sapota", "Sapota"),
  product("dehydrated-fruits", "dehydrated-fruits-honey", "Honey", {
    confirmation: CONFIRMATION_REQUIRED,
  }),

  // 3. Pickles → Veg Pickles
  product("pickles", "tomato-pickle", "Tomato Pickle", { typeSlug: "veg-pickles" }),
  product("pickles", "gongura-pickle", "Gongura Pickle", { typeSlug: "veg-pickles", ...FEATURED }),
  product("pickles", "garlic-pickle", "Garlic Pickle", { typeSlug: "veg-pickles" }),
  product("pickles", "mango-pickle", "Mango Pickle", { typeSlug: "veg-pickles", ...FEATURED }),

  // 3. Pickles → Non-Veg Pickles
  product("pickles", "chicken-pickle", "Chicken Pickle", { typeSlug: "non-veg-pickles" }),
  product("pickles", "prawns-pickle", "Prawns Pickle", { typeSlug: "non-veg-pickles" }),
  product("pickles", "mutton-pickle", "Mutton Pickle", { typeSlug: "non-veg-pickles" }),

  // 4. Dal Powders
  product("dal-powders", "kandi-powder", "Kandi Powder"),
  product("dal-powders", "chana-powder", "Chana Powder"),
  product("dal-powders", "avise-powder", "Avise Powder"),
  product("dal-powders", "sesame-seed-nuvvulu", "Sesame Seed / Nuvvulu"),

  // 5. Crisps
  product("crisps", "rice-vadialu", "Rice Vadialu"),
  product("crisps", "gummadi-vadialu", "Gummadi Vadialu"),
  product("crisps", "saggubiyyam", "Saggubiyyam"),
  product("crisps", "minapa-vadialu", "Minapa Vadialu"),

  // 6. Dry Fruits
  product("dry-fruits", "badam", "Badam"),
  product("dry-fruits", "pista", "Pista"),
  product("dry-fruits", "cashews", "Cashews"),
  product("dry-fruits", "dates", "Dates"),

  // 7. Millet Powders — one powder in each millet's type. The catalogue wrote
  // each millet's name alone ("Foxtail / Korralu"); the client's product
  // sheet (2026-09-10) names the product "Foxtail / Korralu Powder".
  product("millet-powders", "foxtail-korralu-powder", "Foxtail / Korralu Powder", {
    typeSlug: "foxtail-korralu",
  }),
  product("millet-powders", "little-samalu-powder", "Little / Samalu Powder", {
    typeSlug: "little-samalu",
  }),
  product("millet-powders", "kodo-arikalu-powder", "Kodo / Arikalu Powder", {
    typeSlug: "kodo-arikalu",
  }),
  product("millet-powders", "barnyard-udalu-powder", "Barnyard / Udalu Powder", {
    typeSlug: "barnyard-udalu",
  }),
  product("millet-powders", "andukorralu-powder", "Andukorralu Powder", {
    typeSlug: "andukorralu",
  }),

  // 8. Tea / Coffee — the catalogue wrote "Herbal", "Masala", "Lemon" and
  // "Green"; the client's product sheet (2026-09-10) names them as teas.
  product("tea-coffee", "herbal-tea-powder", "Herbal Tea Powder"),
  product("tea-coffee", "masala-tea-powder", "Masala Tea Powder"),
  product("tea-coffee", "lemon-tea-powder", "Lemon Tea Powder"),
  product("tea-coffee", "green-tea-powder", "Green Tea Powder"),

  // 9. Masala Powders
  product("masala-powders", "masala-powders-non-veg", "Non-Veg", {
    confirmation:
      "The client catalogue asks to confirm whether “Non-Veg” is a product or " +
      "a grouping of the items that follow it. Kept as a product, as written.",
  }),
  product("masala-powders", "masala-powders-chicken-biryani", "Chicken Biryani"),
  product("masala-powders", "masala-powders-mutton-biryani", "Mutton Biryani"),
  product("masala-powders", "masala-powders-fish-curry", "Fish Curry"),

  // 10. Spices
  product("spices", "turmeric-powder", "Turmeric Powder"),
  product("spices", "red-chilli-powder", "Red Chilli Powder", FEATURED),
  product("spices", "coriander-powder", "Coriander Powder"),
  product("spices", "black-pepper-powder", "Black Pepper Powder"),
  product("spices", "rasam-powder", "Rasam Powder"),
];

/* ---------------------------------- queries -------------------------------- */

export const productBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

/** Everything in a category, including products filed under its types. */
export const productsByCategory = (slug: string) =>
  products.filter((p) => p.categorySlug === slug);

/** Just the products of one type. */
export const productsByType = (categorySlug: string, typeSlug: string) =>
  products.filter(
    (p) => p.categorySlug === categorySlug && p.typeSlug === typeSlug,
  );

/** The canonical URL for a product. Flat, so it survives recategorisation. */
export const productHref = (p: Product) => `/products/p/${p.slug}`;

/** Breadcrumb trail: Home / Category / Type / Product. */
export function trailFor(p: Product) {
  const category = categoryBySlug(p.categorySlug);
  const type = p.typeSlug ? typeBySlug(p.categorySlug, p.typeSlug) : undefined;
  return { category, type };
}

export const featuredProducts = () => products.filter((p) => p.featured);

/**
 * The pack size a product page opens on — undefined while a product has no
 * pack sizes, which is every product until the client supplies them.
 */
export const defaultVariant = (p: Product): Variant | undefined =>
  p.variants.find((x) => x.isDefault) ?? p.variants[0];

/** Same type first, then the rest of the category. Never the product itself. */
export const relatedProducts = (p: Product, limit = 4) => {
  const pool = products.filter((x) => x.id !== p.id);
  const sameType = p.typeSlug
    ? pool.filter(
        (x) => x.categorySlug === p.categorySlug && x.typeSlug === p.typeSlug,
      )
    : [];
  const sameCategory = pool.filter(
    (x) => x.categorySlug === p.categorySlug && !sameType.includes(x),
  );
  return [...sameType, ...sameCategory].slice(0, limit);
};

/**
 * Search over the product name, its category and its type, so "non-veg" finds
 * the non-veg pickles and "millet" finds the millet powders.
 */
export function searchProducts(q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  return products.filter((p) => {
    const { category, type } = trailFor(p);
    return `${p.name} ${p.shortDescriptor} ${category?.name ?? ""} ${type?.name ?? ""}`
      .toLowerCase()
      .includes(term);
  });
}

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  enquire_only: "Enquire",
};
