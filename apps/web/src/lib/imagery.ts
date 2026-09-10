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
}

export const imagery: {
  /** Homepage hero, right-hand side. Products on white, landscape ~4:3. */
  hero: Photo | null;
  /** Homepage "About Burla" band, left-hand side. Farm landscape, ~16:10. */
  about: Photo | null;
  /** One per category slug, square, product on white. */
  categories: Partial<Record<string, Photo>>;
} = {
  hero: null,
  about: null,
  categories: {},
};
