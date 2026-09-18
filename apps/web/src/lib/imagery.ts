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
 * Product and category photographs do not belong here: they are in the
 * database (`media`), where the owner changes them from the admin. The
 * mappings that used to live here were moved into the seed
 * (`server/db/seed/photos.ts`), which registered them there.
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
  /** Homepage "About Burla" band: the photograph, 3:2. */
  about: Photo | null;
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
  // Supplied by the client on 2026-09-17 (a generated image: the farmer and
  // the printed sack are illustrative, not a real person or real packaging).
  // Master: assets/about/farmer-supplied.webp, 1536x1024. The farmer's face
  // sits near 30% across, the sack between 48% and 80%, and the top right is
  // open sky — the page's crops and the script overlay are set from that.
  about: {
    src: "/images/home/about-farmer.webp",
    alt:
      "A smiling farmer in a white turban kneeling in a green field, holding " +
      "an armful of freshly picked leaves beside a jute sack printed with the " +
      "Burla logo",
    width: 1400,
    height: 933,
  },
};
