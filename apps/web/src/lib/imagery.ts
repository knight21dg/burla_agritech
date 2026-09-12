/**
 * Where real photography goes when it arrives.
 *
 * Every image slot on the homepage reads from here. While a slot is `null`
 * the page shows its illustrated stand-in; set a path and the photograph
 * replaces the illustration in the same layout, at the same size, with no
 * other change.
 *
 *   1. Put the file under `apps/web/public/images/…`
 *   2. Set its path below, e.g. `hero: "/images/home/hero.webp"`
 *
 * Deliberately a hand-edited list rather than a scan of the filesystem: a
 * build that silently picks up whatever file happens to be in a folder is how
 * an unapproved image ends up on a live site. Each photograph here is one
 * reviewed line.
 *
 * Specifications — dimensions, framing, background — are in
 * `docs/IMAGE-ASSET-REQUIREMENTS.md`. The commissioned shoot is `OQ-017`.
 *
 * Product photographs do not belong here. They come from the `media` table
 * once the catalogue is served from the database (Phase 8).
 */

export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * Pre-encoded sizes, when the image is served as-is rather than through
   * next/image's on-the-fly optimiser. Used for the hero, which is the page's
   * largest paint and should not wait on (or depend on) an encode.
   */
  sources?: { src: string; width: number }[];
}

export const imagery: {
  /**
   * The homepage hero's product composition — the products alone, on white.
   * The logo, headline, copy and leaves are the page's own elements, so this
   * carries none of them (assets/hero/extract_products.py).
   */
  heroProducts: Photo | null;
  /** Homepage "About Burla" band, left-hand side. Farm landscape, ~16:10. */
  about: Photo | null;
  /** One per category slug, square, product on white. */
  categories: Partial<Record<string, Photo>>;
  /**
   * One per product slug, square, product on white. Until the catalogue is
   * served from the database (Phase 8) and product photographs come from the
   * `media` table, supplied product photographs are listed here.
   */
  products: Partial<Record<string, Photo>>;
} = {
  // Cut from the client's supplied hero (2026-09-10, a generated image; the
  // packaging it shows is not yet a real product): the painted text and the
  // script were removed and the products trimmed to their own bounds, so the
  // page can lay out its own words and leaves around them. The floating
  // leaves were lifted out earlier as sprites (components/home/HeroLeaves).
  // Masters and the scripts that produced both: assets/hero/.
  heroProducts: {
    src: "/images/home/hero-products.webp",
    alt:
      "Burla dehydrated mango pouch and jars of mango pickle and spiced dal " +
      "powder, with wooden bowls of dried mango slices, turmeric and red " +
      "chilli powder, and dried red chillies",
    width: 1243,
    height: 616,
  },
  about: null,
  // Supplied by the client, 2026-09-10, as one sheet of ten cards; each photo
  // cut out, its printed label left behind, and re-centred at one scale
  // (assets/categories/). Decorative in the tile, whose name is the label.
  //
  // Mapped onto the catalogue's categories by what each card showed. Spices
  // has no card on the sheet, so it keeps the illustrated placeholder; the
  // sheet's Combo Packs card has no category in the catalogue and is unused.
  // TODO (confirm): the Millet Powders tile uses the sheet's "Millets" card,
  // which shows whole millet grains rather than a powder.
  categories: Object.fromEntries(
    [
      ["dehydrated-powders-flakes", "A wooden bowl of dehydrated powder"],
      ["dehydrated-fruits", "A wooden bowl of dried mango slices"],
      ["pickles", "A jar of mango pickle"],
      ["dal-powders", "A wooden bowl of dal powder"],
      ["crisps", "A wooden bowl of crisps"],
      ["dry-fruits", "A wooden bowl of mixed nuts"],
      ["millet-powders", "A wooden bowl of millet"],
      ["tea-coffee", "A wooden bowl of loose tea leaves"],
      ["masala-powders", "A wooden bowl of masala powders"],
    ].map(([slug, alt]) => [
      slug!,
      { src: `/images/categories/${slug}.webp`, alt: alt!, width: 480, height: 360 },
    ]),
  ),
  // Supplied by the client, 2026-09-10, as one sheet per range; each photo cut
  // out and re-centred at one scale (assets/products/). Every product in the
  // catalogue has one, each mapped by the name printed on its card. (The
  // earlier Featured Products sheet is superseded by these.) The pickle jars'
  // labels are part of the generated image, not real packaging.
  // Alt text describes what each photograph shows, and nothing more.
  products: Object.fromEntries(
    [
      ["dehydrated-fruits-apple", "Wooden bowl of dried apple slices with fresh apples"],
      ["dehydrated-fruits-papaya", "Wooden bowl of dried papaya strips with a halved papaya"],
      ["dehydrated-fruits-mango", "Wooden bowl of dried mango slices with a fresh mango, cut and whole"],
      ["dehydrated-fruits-pineapple", "Wooden bowl of dried pineapple rings with a fresh pineapple"],
      ["dehydrated-fruits-sapota", "Wooden bowl of dried sapota slices with fresh sapota"],
      ["dehydrated-fruits-honey", "Jar of honey with a bowl of honey, a honey dipper, honeycomb and white flowers"],
      ["tomato-pickle", "Jar of Tomato Pickle and a bowl of it, with fresh tomatoes"],
      ["gongura-pickle", "Jar of Gongura Pickle and a bowl of it, with gongura leaves"],
      ["garlic-pickle", "Jar of Garlic Pickle and a bowl of it, with garlic bulbs and cloves"],
      ["mango-pickle", "Jar of Mango Pickle and a bowl of it, with green mangoes"],
      ["chicken-pickle", "Jar of Chicken Pickle and a bowl of it, with raw chicken, red chillies and peppercorns"],
      ["prawns-pickle", "Jar of Prawns Pickle and a bowl of it, with prawns, red chillies and peppercorns"],
      ["mutton-pickle", "Jar of Mutton Pickle and a bowl of it, with raw mutton, red chillies and peppercorns"],
      ["kandi-powder", "Wooden bowl of kandi powder with a sack of split yellow lentils"],
      ["chana-powder", "Wooden bowl of chana powder with a sack of chickpeas"],
      ["avise-powder", "Wooden bowl of avise powder with a scoop of brown seeds and blue flowers"],
      ["sesame-seed-nuvvulu", "Wooden bowl of powder with a bowl and a scoop of sesame seeds"],
      ["rice-vadialu", "Wooden bowl of rice vadialu with a sack of rice"],
      ["gummadi-vadialu", "Wooden bowl of gummadi vadialu with a cut pumpkin"],
      ["saggubiyyam", "Wooden bowl of saggubiyyam crisps with a scoop of white pearls"],
      ["minapa-vadialu", "Wooden bowl of minapa vadialu with a small bowl of whole lentils"],
      ["badam", "Wooden bowl of almonds with green leaves"],
      ["pista", "Wooden bowl of pistachios in their shells"],
      ["cashews", "Wooden bowl of cashews with green leaves"],
      ["dates", "Wooden bowl of dates with green leaves"],
      ["foxtail-korralu-powder", "Wooden bowl of Foxtail / Korralu powder with millet stalks and a scoop of grain"],
      ["little-samalu-powder", "Wooden bowl of Little / Samalu powder with millet stalks and a scoop of grain"],
      ["kodo-arikalu-powder", "Wooden bowl of Kodo / Arikalu powder with millet stalks and a scoop of grain"],
      ["barnyard-udalu-powder", "Wooden bowl of Barnyard / Udalu powder with millet stalks and a scoop of grain"],
      ["andukorralu-powder", "Wooden bowl of Andukorralu powder with millet stalks and a scoop of grain"],
      ["herbal-tea-powder", "Wooden bowl of herbal tea powder with ginger, lemongrass, fresh leaves and loose tea"],
      ["masala-tea-powder", "Wooden bowl of masala tea powder with cinnamon, cardamom, cloves and ginger"],
      ["lemon-tea-powder", "Wooden bowl of lemon tea powder with lemons and loose tea"],
      ["green-tea-powder", "Wooden bowl of green tea powder with fresh tea leaves and loose tea"],
      ["masala-powders-chicken-biryani", "Wooden bowl of masala powder beside a pot of chicken biryani"],
      ["masala-powders-mutton-biryani", "Wooden bowl of masala powder beside a pot of mutton biryani"],
      ["masala-powders-fish-curry", "Wooden bowl of masala powder beside a pan of fish curry"],
      ["masala-powders-non-veg", "Wooden bowl of masala powder with raw chicken, meat and fish"],
      ["turmeric-powder", "Wooden bowl of turmeric powder with fresh turmeric roots"],
      ["red-chilli-powder", "Wooden bowl of red chilli powder with dried red chillies"],
      ["coriander-powder", "Wooden bowl of coriander powder with coriander seeds and leaves"],
      ["black-pepper-powder", "Wooden bowl of black pepper powder with a scoop of peppercorns"],
      ["rasam-powder", "Wooden bowl of rasam powder with tomatoes, red chillies and spices"],
      ["moringa-powder", "Wooden bowl of moringa powder with moringa leaves"],
      ["banana-powder", "Wooden bowl of banana powder with bananas and banana slices"],
      ["lemon-powder", "Wooden bowl of lemon powder with lemons and lemon slices"],
      ["tomato-powder", "Wooden bowl of tomato powder with fresh tomatoes"],
      ["ginger-powder", "Wooden bowl of ginger powder with fresh ginger"],
      ["garlic-powder", "Wooden bowl of garlic powder with garlic bulbs and cloves"],
      ["onion-powder", "Wooden bowl of onion powder with red onions"],
      ["carrot-powder", "Wooden bowl of carrot powder with carrots"],
      ["beetroot-powder", "Wooden bowl of beetroot powder with beetroot"],
      ["curry-leaves", "Wooden bowl of powder with fresh curry leaves"],
      ["amla-powder", "Wooden bowl of amla powder with fresh amla"],
      ["abc-powder", "Wooden bowl of pink powder with an apple, a beetroot and a carrot"],
      ["spinach-powder", "Wooden bowl of spinach powder with spinach leaves"],
      ["mango-flakes", "Wooden bowl of mango flakes with a fresh mango, cut and whole"],
      ["tomato-flakes", "Wooden bowl of tomato flakes with fresh tomatoes"],
      ["ginger-flakes", "Wooden bowl of ginger flakes with fresh ginger"],
      ["garlic-flakes", "Wooden bowl of garlic flakes with garlic bulbs and cloves"],
      ["onion-flakes", "Wooden bowl of onion flakes with red onions"],
      ["carrot-flakes", "Wooden bowl of carrot flakes with carrots"],
      ["beetroot-flakes", "Wooden bowl of beetroot flakes with beetroot and its leaves"],
    ].map(([slug, alt]) => [
      slug!,
      { src: `/images/products/${slug}.webp`, alt: alt!, width: 600, height: 600 },
    ]),
  ),
};
