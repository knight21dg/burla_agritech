/**
 * The floating leaves of the supplied hero image, lifted out as sprites.
 *
 * Each one was cut from the original 1536 x 1024 image
 * (`public/images/home/hero.png` is that image with these leaves removed).
 * Positions and sizes are in the source image's own pixels, so at the first
 * frame every sprite sits exactly where it was painted and the hero looks
 * identical to the file the client supplied. Then they fall.
 *
 * Extraction, for whoever regenerates these: each leaf was masked by
 * greenness with a dilated halo for its blur; the ground behind it filled with
 * the measured white of its surroundings (or inpainted, for "k" on the
 * marble); and its alpha computed against that exact ground, so it composites
 * back to the original and stays solid when it drifts over a product.
 * Composited over the clean hero the sprites reproduce the original to within
 * 30/255 everywhere but two places: the last six rows of leaf "c", whose tip
 * met the pouch and was rounded off, and the outer 16px of the four leaves
 * the image's own border slices (a, f, g, i), which are feathered so their
 * straight cut edge never shows once they drift inward.
 *
 * `depth` is by eye from the source: the large out-of-focus leaves are
 * nearest the camera, the small soft ones furthest. It drives how fast each
 * falls, how far it sways and how strongly the breeze carries it.
 */

export interface HeroLeaf {
  name: string;
  /** Top-left, width and height in source-image pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0 = far, 1 = near. */
  depth: number;
}

export const HERO_SOURCE = { w: 1536, h: 1024 } as const;

/**
 * The canvas the page actually shows: the source cropped to rows
 * `cropTop`..`cropTop + h` (the content spans rows 107-916; the rest was empty
 * margin) and extended by `padX` of matched backdrop on each side, so it can
 * fill a wide screen edge to edge. Produced by assets/hero/extract_leaves.py.
 *
 * A leaf at source (x, y) sits at canvas (x + padX, y - cropTop).
 */
export const HERO_CANVAS = { w: 3072, h: 880, padX: 768, cropTop: 70 } as const;

/**
 * Where the canvas is anchored when it is cropped (object-position), per
 * layout. On phones the crop is a 1024-px-wide window of the source ending
 * at its right edge — the products, not the painted words:
 * (512 + padX) / (canvas.w - 1024) = 0.625.
 */
export const HERO_ANCHOR = {
  phone: { x: 0.625, y: 0.5 },
  desktop: { x: 0.5, y: 0.5 },
} as const;

/** The block of words painted into the image (logo to paragraph), source px. */
export const PAINTED_TEXT = { left: 88, right: 470, bottom: 600 } as const;

/** Drawn in this order: far first, so nearer leaves pass in front. */
export const HERO_LEAVES: HeroLeaf[] = [
  { name: "a", x: 2, y: 126, w: 62, h: 88, depth: 0.18 },
  { name: "e", x: 967, y: 137, w: 72, h: 76, depth: 0.24 },
  { name: "k", x: 351, y: 896, w: 129, h: 74, depth: 0.3 },
  { name: "j", x: 123, y: 782, w: 111, h: 82, depth: 0.34 },
  { name: "c", x: 566, y: 214, w: 103, h: 106, depth: 0.46 },
  { name: "h", x: 501, y: 324, w: 87, h: 127, depth: 0.5 },
  { name: "b", x: 557, y: 27, w: 110, h: 137, depth: 0.55 },
  { name: "i", x: 1, y: 557, w: 126, h: 160, depth: 0.6 },
  { name: "g", x: 1408, y: 355, w: 127, h: 178, depth: 0.86 },
  { name: "f", x: 1238, y: 1, w: 209, h: 95, depth: 0.92 },
  { name: "d", x: 655, y: 187, w: 307, h: 119, depth: 0.97 },
];

export const heroLeafSrc = (name: string) => `/images/home/leaves/leaf-${name}.webp`;
