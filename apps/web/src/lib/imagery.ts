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
  /** Homepage hero, right-hand side. Products on white, landscape ~4:3. */
  hero: Photo | null;
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
  // Supplied by the client, 2026-09-10 (a generated image; the packaging it
  // shows is not yet a real product). Its floating leaves have been lifted out
  // as sprites and removed from these files — they are placed back, and
  // animated, by components/home/PhotoLeaves.tsx. Masters and the script that
  // produced all of it: assets/hero/.
  hero: {
    // The widened canvas (3072 x 880): the supplied image with its empty top
    // and bottom margin trimmed and matched backdrop added at both sides, so
    // it fills the screen width without stretching or cropping content.
    src: "/images/home/hero-wide-3072.webp",
    sources: [
      { src: "/images/home/hero-wide-1536.webp", width: 1536 },
      { src: "/images/home/hero-wide-3072.webp", width: 3072 },
    ],
    alt:
      "Burla dehydrated mango pouch and jars of mango pickle and spiced dal " +
      "powder, with wooden bowls of dried mango slices, turmeric and red " +
      "chilli powder, and dried red chillies",
    width: 3072,
    height: 880,
  },
  about: null,
  // Supplied by the client, 2026-09-10, as one sheet of ten cards; each photo
  // cut out, its printed label left behind, and re-centred at one scale
  // (assets/categories/). Decorative in the tile, whose name is the label.
  categories: Object.fromEntries(
    [
      ["dehydrated-powders-flakes", "A wooden bowl of dehydrated powder"],
      ["dehydrated-fruits", "A wooden bowl of dried mango slices"],
      ["pickles", "A jar of mango pickle"],
      ["spiced-dal-powders", "A wooden bowl of spiced dal powder"],
      ["sun-dried-crisps", "A wooden bowl of sun-dried crisps"],
      ["dry-fruits", "A wooden bowl of mixed nuts"],
      ["millets", "A wooden bowl of millet"],
      ["herbal-tea-coffee", "A wooden bowl of loose herbal tea"],
      ["masala-powders", "A wooden bowl of masala powders"],
      ["combo-packs", "A set of packs and jars"],
    ].map(([slug, alt]) => [
      slug!,
      { src: `/images/categories/${slug}.webp`, alt: alt!, width: 480, height: 360 },
    ]),
  ),
  // Supplied by the client, 2026-09-10, as the Featured Products sheet; each
  // photo cut out and re-centred at one scale (assets/products/).
  products: Object.fromEntries(
    [
      ["dehydrated-mango", "Dehydrated Mango pouch with dried mango slices and fresh mangoes"],
      ["mango-pickle", "Jar of Mango Pickle with fresh mango and dried chillies"],
      ["dehydrated-banana", "Dehydrated Banana pouch with a bowl of banana chips"],
      ["red-chilli-powder", "Wooden bowl of red chilli powder with dried red chillies"],
      ["ragi-flour", "Ragi Flour pouch with a bowl of ragi flour"],
      ["gongura-pickle", "Jar of Gongura Pickle with gongura leaves and red chillies"],
    ].map(([slug, alt]) => [
      slug!,
      { src: `/images/products/${slug}.webp`, alt: alt!, width: 600, height: 600 },
    ]),
  ),
};
