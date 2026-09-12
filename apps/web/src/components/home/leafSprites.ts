/**
 * The leaf sprites cut from the client's hero image.
 *
 * Each was masked out of the original 1536 x 1024 painting by greenness with
 * a dilated halo for its blur; the ground behind it filled with the measured
 * white of its surroundings (or inpainted, for "k" on the marble); and its
 * alpha computed against that exact ground, so it stays solid when it drifts
 * over a product. Four that the image's own border sliced (a, f, g, i) are
 * feathered at the cut, so no straight edge shows once they move inward.
 * Produced by assets/hero/extract_leaves.py.
 *
 * Only the sprites' own sizes live here — where each is shown is the page's
 * business now (`HeroLeaves`), in percentages of the hero box, rather than a
 * position baked into a picture.
 */

export interface LeafSprite {
  /** The file's own pixels, for the img's width and height. */
  w: number;
  h: number;
}

export const HERO_LEAF_SPRITES: Record<string, LeafSprite> = {
  a: { w: 62, h: 88 },
  b: { w: 110, h: 137 },
  c: { w: 103, h: 106 },
  d: { w: 307, h: 119 },
  e: { w: 72, h: 76 },
  f: { w: 209, h: 95 },
  g: { w: 127, h: 178 },
  h: { w: 87, h: 127 },
  i: { w: 126, h: 160 },
  j: { w: 111, h: 82 },
  k: { w: 129, h: 74 },
};

export const heroLeafSrc = (name: string) => `/images/home/leaves/leaf-${name}.webp`;
