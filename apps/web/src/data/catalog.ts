/**
 * DEMO CATALOGUE — SAMPLE DATA ONLY.
 *
 * ⚠️  Every product name, price, weight and description below is a
 *     PLACEHOLDER for demonstration purposes. Nothing here is client-supplied.
 *     No ingredients, shelf life, origin, nutrition or certification data is
 *     included, because inventing those for a food product is not acceptable
 *     (see docs/CONTENT-INVENTORY.md §3 and docs/OPEN-QUESTIONS.md OQ-016).
 *
 * This module's shape mirrors the production schema in docs/DATABASE.md so the
 * swap to real database queries is a one-file change.
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
  name: string;
  /** Always the top-level category, so breadcrumbs never need a recursive walk. */
  categorySlug: string;
  /** The type within that category, where one exists. */
  typeSlug?: string;
  shortDescriptor: string;
  description: string;
  variants: Variant[];
  featured?: boolean;
  /** Visual seed for the placeholder image treatment. */
  tone: Tone;
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
  name: string;
  shortName: string;
  order: number;
  heroHeadline: string;
  description: string;
  tone: Tone;
  /**
   * Present = this row is a TYPE sitting under that category.
   *
   * Types are modelled as categories with a parent rather than as a separate
   * entity, so a category can gain or lose a type layer without a migration
   * and staff see one concept, not two (PRODUCT-TAXONOMY §4).
   */
  parentSlug?: string;
}

/* --------------------------------------------------------------------------
   Categories — the ten from the client's handwritten sheet, in their order.
   Names and slugs are PROVISIONAL pending OQ-011 / OQ-012 / OQ-013.
   -------------------------------------------------------------------------- */

export const categories: Category[] = [
  {
    slug: "dehydrated-powders-flakes",
    name: "Dehydrated Powders & Flakes",
    shortName: "Powders & Flakes",
    order: 1,
    heroHeadline: "Concentrated by sunlight, not by shortcuts.",
    description:
      "Vegetables and greens dried at low temperature and milled to a fine, even powder. Long shelf life, quick to use, and made to keep the colour and character of the raw ingredient intact.",
    tone: "turmeric",
  },
  {
    slug: "dehydrated-fruits",
    name: "Dehydrated Fruits",
    shortName: "Dehydrated Fruits",
    order: 2,
    heroHeadline: "Nature, preserved beautifully.",
    description:
      "Ripe fruit, sliced and gently dried to hold its natural sweetness and colour. Nothing added to make it look better than it is.",
    tone: "mango",
  },
  {
    slug: "pickles",
    name: "Pickles",
    shortName: "Pickles",
    order: 3,
    heroHeadline: "Cured slowly, the way it has always been done.",
    description:
      "Seasonal produce, salt, spice and time. Made in small batches to traditional regional recipes.",
    tone: "chilli",
  },
  {
    slug: "spiced-dal-powders",
    name: "Spiced Dal Powders",
    shortName: "Dal Powders",
    order: 4,
    heroHeadline: "The everyday podi, done properly.",
    description:
      "Roasted lentils ground with spice — the accompaniment that turns rice, idli or dosa into a meal.",
    tone: "earth",
  },
  {
    slug: "sun-dried-crisps",
    name: "Sun-Dried Crisps (Vadiyalu)",
    shortName: "Vadiyalu",
    order: 5,
    heroHeadline: "Vadiyalu — sun and patience.",
    description:
      "Shaped by hand, dried in open sun over several days, ready to fry. A regional staple that no machine has improved on.",
    tone: "cream",
  },
  {
    slug: "dry-fruits",
    name: "Dry Fruits",
    shortName: "Dry Fruits",
    order: 6,
    heroHeadline: "Selected, graded, packed.",
    description:
      "Whole nuts and dried fruit, sorted by size and quality, packed to keep them fresh.",
    tone: "berry",
  },
  {
    slug: "millets",
    name: "Millets",
    shortName: "Millets",
    order: 7,
    heroHeadline: "The grains that came first.",
    description:
      "Cleaned, graded millets — the everyday grains of Indian farming, back on the everyday table.",
    tone: "grain",
  },
  {
    slug: "herbal-tea-coffee",
    name: "Herbal Tea & Coffee",
    shortName: "Tea & Coffee",
    order: 8,
    heroHeadline: "Leaves, roots and roast.",
    description:
      "Herbal infusions and coffee blends built from whole ingredients rather than flavouring.",
    tone: "leaf",
  },
  {
    slug: "masala-powders",
    name: "Masala Powders",
    shortName: "Masala Powders",
    order: 9,
    heroHeadline: "Ground for a dish, not for a shelf.",
    description:
      "Spice blends roasted and ground in small batches, so what reaches you still smells of what it is.",
    tone: "chilli",
  },
  {
    slug: "combo-packs",
    name: "Combo Packs",
    shortName: "Combo Packs",
    order: 10,
    heroHeadline: "A good place to begin.",
    description:
      "Curated sets across our range — for a first order, a full pantry, or a gift.",
    tone: "cream",
  },
];

/**
 * SAMPLE type layer — shape only.
 *
 * These demonstrate the Category > Type > Product browsing the client asked
 * for. The real list per category is blocked on OQ-049; nothing here is
 * client-supplied. Categories not listed simply have no types, which the
 * interface handles by showing products directly.
 */
export const productTypes: Category[] = [
  t("pickles", "mango", "Mango", 1, "Raw mango, cured in season.", "chilli"),
  t("pickles", "lemon", "Lemon", 2, "Cured in salt over weeks.", "turmeric"),
  t("pickles", "gongura", "Gongura", 3, "Sorrel leaves, sharp and tart.", "leaf"),

  t("dehydrated-fruits", "mango", "Mango", 1, "Ripe mango, gently dried.", "mango"),
  t("dehydrated-fruits", "pineapple", "Pineapple", 2, "Bright and tart.", "turmeric"),
  t("dehydrated-fruits", "banana", "Banana", 3, "Sliced ripe banana.", "cream"),
  t("dehydrated-fruits", "guava", "Guava", 4, "Soft, fragrant, seasonal.", "leaf"),

  t("millets", "ragi", "Ragi", 1, "Finger millet, cleaned and graded.", "grain"),
  t("millets", "foxtail", "Foxtail", 2, "Cleaned and graded.", "grain"),
  t("millets", "little", "Little Millet", 3, "Small grain, quick to cook.", "grain"),
];

function t(
  parentSlug: string,
  slug: string,
  name: string,
  order: number,
  description: string,
  tone: Tone,
): Category {
  return {
    slug,
    name,
    shortName: name,
    order,
    heroHeadline: "",
    description,
    tone,
    parentSlug,
  };
}

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
   Products — SAMPLE. See warning at the top of this file.
   -------------------------------------------------------------------------- */

let seq = 0;
const v = (
  label: string,
  priceMinor: number,
  grams: number,
  availability: Availability = "in_stock",
  isDefault = false,
): Variant => ({
  id: `var_${++seq}`,
  label,
  sku: `BGA-SAMPLE-${String(seq).padStart(4, "0")}`,
  priceMinor,
  netWeightGrams: grams,
  availability,
  isDefault,
});

export const products: Product[] = [
  {
    id: "p1",
    slug: "turmeric-powder",
    name: "Turmeric Powder",
    categorySlug: "masala-powders",
    shortDescriptor: "Stone-ground, deep colour, unmistakable aroma",
    description:
      "Whole turmeric fingers, cleaned and ground in small batches. Colour and aroma come from the root itself — nothing is added to brighten it.",
    variants: [v("100g", 25000, 100, "in_stock", true), v("250g", 55000, 250)],
    featured: true,
    tone: "turmeric",
  },
  {
    id: "p2",
    slug: "dehydrated-mango",
    name: "Dehydrated Mango",
    categorySlug: "dehydrated-fruits",
    typeSlug: "mango",
    shortDescriptor: "Ripe mango, sliced and gently dried",
    description:
      "Fruit is sliced at peak ripeness and dried slowly so the sugars concentrate without scorching. Soft, chewy, and the colour of the fruit it came from.",
    variants: [v("100g", 32000, 100, "in_stock", true), v("250g", 74000, 250)],
    featured: true,
    tone: "mango",
  },
  {
    id: "p3",
    slug: "mango-pickle",
    name: "Mango Pickle",
    categorySlug: "pickles",
    typeSlug: "mango",
    shortDescriptor: "Raw mango cured in salt, chilli and oil",
    description:
      "Made once a season, when raw mango is at its best. Cut, salted, spiced and left to mature.",
    variants: [v("200g", 28000, 200, "in_stock", true), v("500g", 62000, 500)],
    featured: true,
    tone: "chilli",
  },
  {
    id: "p4",
    slug: "ragi-millet",
    name: "Ragi Millet",
    categorySlug: "millets",
    typeSlug: "ragi",
    shortDescriptor: "Cleaned and graded finger millet",
    description:
      "Whole finger millet, cleaned, de-stoned and graded. For porridge, rotis or malt.",
    variants: [v("1kg", 18000, 1000, "in_stock", true)],
    featured: true,
    tone: "grain",
  },
  {
    id: "p5",
    slug: "curry-leaf-powder",
    name: "Curry Leaf Powder",
    categorySlug: "dehydrated-powders-flakes",
    shortDescriptor: "Shade-dried leaves, milled fine",
    description:
      "Leaves are dried away from direct sun to hold their green, then milled to a fine powder.",
    variants: [v("100g", 22000, 100, "in_stock", true), v("250g", 48000, 250)],
    tone: "leaf",
  },
  {
    id: "p6",
    slug: "beetroot-powder",
    name: "Beetroot Powder",
    categorySlug: "dehydrated-powders-flakes",
    shortDescriptor: "Deep colour, no additives",
    description: "Beetroot, dried and milled. One ingredient.",
    variants: [v("100g", 24000, 100, "in_stock", true)],
    tone: "berry",
  },
  {
    id: "p7",
    slug: "drumstick-leaf-powder",
    name: "Drumstick Leaf Powder",
    categorySlug: "dehydrated-powders-flakes",
    shortDescriptor: "Moringa leaves, shade-dried",
    description: "Moringa leaves, shade-dried and milled fine.",
    variants: [v("100g", 26000, 100, "in_stock", true)],
    tone: "leaf",
  },
  {
    id: "p8",
    slug: "tomato-flakes",
    name: "Tomato Flakes",
    categorySlug: "dehydrated-powders-flakes",
    shortDescriptor: "Sliced and dried, ready to rehydrate",
    description: "Ripe tomato, sliced and dried into flakes.",
    variants: [v("100g", 21000, 100, "low_stock", true)],
    tone: "chilli",
  },
  {
    id: "p9",
    slug: "dehydrated-pineapple",
    name: "Dehydrated Pineapple",
    categorySlug: "dehydrated-fruits",
    typeSlug: "pineapple",
    shortDescriptor: "Bright, tart, naturally sweet",
    description: "Pineapple rings dried slowly to hold their tartness.",
    variants: [v("100g", 28000, 100, "in_stock", true)],
    tone: "turmeric",
  },
  {
    id: "p10",
    slug: "dehydrated-banana",
    name: "Dehydrated Banana",
    categorySlug: "dehydrated-fruits",
    typeSlug: "banana",
    shortDescriptor: "Sliced ripe banana, gently dried",
    description: "Ripe banana, sliced and dried.",
    variants: [v("100g", 25000, 100, "in_stock", true)],
    tone: "cream",
  },
  {
    id: "p11",
    slug: "dehydrated-guava",
    name: "Dehydrated Guava",
    categorySlug: "dehydrated-fruits",
    typeSlug: "guava",
    shortDescriptor: "Soft, fragrant, seasonal",
    description: "Guava, sliced and dried in season.",
    variants: [v("100g", 27000, 100, "in_stock", true)],
    tone: "leaf",
  },
  {
    id: "p12",
    slug: "lemon-pickle",
    name: "Lemon Pickle",
    categorySlug: "pickles",
    typeSlug: "lemon",
    shortDescriptor: "Cured in salt over weeks",
    description: "Lemon, salt, chilli and time.",
    variants: [v("200g", 24000, 200, "in_stock", true)],
    tone: "turmeric",
  },
  {
    id: "p13",
    slug: "gongura-pickle",
    name: "Gongura Pickle",
    categorySlug: "pickles",
    typeSlug: "gongura",
    shortDescriptor: "Sorrel leaves, sharp and tart",
    description: "Gongura leaves cooked down with spice.",
    variants: [v("200g", 30000, 200, "in_stock", true)],
    tone: "chilli",
  },
  {
    id: "p14",
    slug: "garlic-podi",
    name: "Garlic Podi",
    categorySlug: "spiced-dal-powders",
    shortDescriptor: "Roasted lentils and garlic",
    description: "Lentils roasted with garlic and chilli, coarsely ground.",
    variants: [v("100g", 19000, 100, "in_stock", true), v("250g", 42000, 250)],
    featured: true,
    tone: "earth",
  },
  {
    id: "p15",
    slug: "idli-podi",
    name: "Idli Podi",
    categorySlug: "spiced-dal-powders",
    shortDescriptor: "The everyday accompaniment",
    description: "Roasted lentils, chilli and sesame, ground coarse.",
    variants: [v("100g", 18000, 100, "in_stock", true)],
    tone: "earth",
  },
  {
    id: "p16",
    slug: "curry-leaf-podi",
    name: "Curry Leaf Podi",
    categorySlug: "spiced-dal-powders",
    shortDescriptor: "Dark, aromatic, lightly bitter",
    description: "Curry leaves roasted with lentils and ground.",
    variants: [v("100g", 20000, 100, "in_stock", true)],
    tone: "leaf",
  },
  {
    id: "p17",
    slug: "rice-vadiyalu",
    name: "Rice Vadiyalu",
    categorySlug: "sun-dried-crisps",
    shortDescriptor: "Hand-shaped, sun-dried, ready to fry",
    description:
      "Rice batter shaped by hand and dried in open sun across several days.",
    variants: [v("200g", 22000, 200, "in_stock", true)],
    featured: true,
    tone: "cream",
  },
  {
    id: "p18",
    slug: "sabudana-vadiyalu",
    name: "Sabudana Vadiyalu",
    categorySlug: "sun-dried-crisps",
    shortDescriptor: "Light, crisp, traditional",
    description: "Sago batter, hand-shaped and sun-dried.",
    variants: [v("200g", 24000, 200, "in_stock", true)],
    tone: "cream",
  },
  {
    id: "p19",
    slug: "cashews",
    name: "Cashews",
    categorySlug: "dry-fruits",
    shortDescriptor: "Whole, graded W240",
    description: "Whole cashew kernels, graded and packed.",
    variants: [v("250g", 42000, 250, "in_stock", true), v("500g", 80000, 500)],
    tone: "cream",
  },
  {
    id: "p20",
    slug: "almonds",
    name: "Almonds",
    categorySlug: "dry-fruits",
    shortDescriptor: "Whole, sorted by size",
    description: "Whole almonds, sorted and packed.",
    variants: [v("250g", 38000, 250, "in_stock", true)],
    tone: "earth",
  },
  {
    id: "p21",
    slug: "foxtail-millet",
    name: "Foxtail Millet",
    categorySlug: "millets",
    typeSlug: "foxtail",
    shortDescriptor: "Cleaned and graded",
    description: "Whole foxtail millet, cleaned and graded.",
    variants: [v("1kg", 16000, 1000, "in_stock", true)],
    tone: "grain",
  },
  {
    id: "p22",
    slug: "little-millet",
    name: "Little Millet",
    categorySlug: "millets",
    typeSlug: "little",
    shortDescriptor: "Small grain, quick to cook",
    description: "Whole little millet, cleaned and graded.",
    variants: [v("1kg", 17000, 1000, "in_stock", true)],
    tone: "grain",
  },
  {
    id: "p23",
    slug: "lemongrass-tea",
    name: "Lemongrass Tea",
    categorySlug: "herbal-tea-coffee",
    shortDescriptor: "Cut and dried whole leaf",
    description: "Lemongrass, cut and dried. Nothing else.",
    variants: [v("100g", 23000, 100, "in_stock", true)],
    tone: "leaf",
  },
  {
    id: "p24",
    slug: "hibiscus-tea",
    name: "Hibiscus Tea",
    categorySlug: "herbal-tea-coffee",
    shortDescriptor: "Whole dried petals",
    description: "Whole hibiscus petals, dried.",
    variants: [v("100g", 25000, 100, "in_stock", true)],
    tone: "berry",
  },
  {
    id: "p25",
    slug: "sambar-powder",
    name: "Sambar Powder",
    categorySlug: "masala-powders",
    shortDescriptor: "Roasted and ground in small batches",
    description: "Spices and lentils roasted together, then ground.",
    variants: [v("100g", 20000, 100, "in_stock", true)],
    tone: "chilli",
  },
  {
    id: "p26",
    slug: "rasam-powder",
    name: "Rasam Powder",
    categorySlug: "masala-powders",
    shortDescriptor: "Pepper-forward, freshly ground",
    description: "Pepper, cumin and lentils, roasted and ground.",
    variants: [v("100g", 20000, 100, "in_stock", true)],
    tone: "earth",
  },
  {
    id: "p27",
    slug: "pantry-starter-combo",
    name: "Pantry Starter Combo",
    categorySlug: "combo-packs",
    shortDescriptor: "Five everyday essentials in one box",
    description:
      "A set built for a first order — a masala, a podi, a pickle, a millet and a dried fruit.",
    variants: [v("Set of 5", 129000, 750, "in_stock", true)],
    featured: true,
    tone: "cream",
  },
  {
    id: "p28",
    slug: "festive-gift-box",
    name: "Festive Gift Box",
    categorySlug: "combo-packs",
    shortDescriptor: "A considered set, ready to give",
    description: "A gift set across the range, packed to be given.",
    variants: [v("Set of 6", 159000, 900, "in_stock", true)],
    tone: "berry",
  },
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

export const defaultVariant = (p: Product) =>
  p.variants.find((x) => x.isDefault) ?? p.variants[0]!;

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

export function searchProducts(q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  return products.filter((p) => {
    const cat = categoryBySlug(p.categorySlug)?.name ?? "";
    return `${p.name} ${p.shortDescriptor} ${cat}`.toLowerCase().includes(term);
  });
}

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  enquire_only: "Enquire",
};
