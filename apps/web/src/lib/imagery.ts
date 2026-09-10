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
  categories: {},
};
