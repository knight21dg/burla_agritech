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
import type { CSSProperties } from "react";

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
 * Where the canvas is anchored on phones, where it is cropped: a 1024-px-wide
 * window of the source ending at its right edge — the products, not the
 * painted words: (512 + padX) / (canvas.w - 1024) = 0.625. Vertically it is
 * centred on every layout. (Desktop is anchored to the page grid instead; see
 * HERO_LAYER_CSS.)
 */
export const HERO_ANCHOR = {
  phone: { x: 0.625, y: 0.5 },
  y: 0.5,
} as const;

/**
 * The painting itself inside the canvas, in canvas px: everything drawn, from
 * the top of the logo to the shadow under the bowls, measured from
 * hero-wide-3072.webp (ink, not the extended backdrop). The canvas is taller
 * and much wider than this — empty margin above and below, matched backdrop
 * to either side — so it is the content, not the canvas, that the hero is
 * sized to fill. The height carries two rows of slack, so rounding never
 * pushes the bowls' shadow past the bottom of the band.
 */
export const HERO_CONTENT = { left: 861, top: 37, w: 1420, h: 810 } as const;

/** The block of words painted into the image (logo to paragraph), source px. */
export const PAINTED_TEXT = { left: 88, right: 470, bottom: 600 } as const;

/**
 * Where the desktop "Explore Our Products" action sits, source px: level with
 * the painted paragraph's left edge (x 96), in the clear band between the
 * paragraph's last line (ends at row 583) and the painted leaf beside the
 * mango bowl (from row 650, x 346 rightwards). At the image's own scale the
 * button (44 px tall) fills x 96-340, rows 602-646.
 */
export const HERO_ACTION = { x: 96, y: 602, height: 44, fontSize: 15, padX: 22 } as const;

/**
 * How the canvas is scaled and placed in the hero frame, as CSS, for every
 * layer drawn on it — the image, the leaves, the action — on the class
 * `hero-layer`. The frame is a size container, so `cqw` / `cqh` measure it.
 *
 *   --spx     rendered px per canvas px.
 *   --hero-x  the canvas's left edge in the frame.
 *   --hero-y  its top edge.
 *
 * Desktop: the painting is shown as large as it fits — scaled so its own
 * height (HERO_CONTENT.h, not the canvas's empty margins) fills the band —
 * and centred, so the backdrop left over is even on both sides. It cannot
 * also fill the width: the painting is about 1.76:1 and the band about
 * 2.6:1, so filling the width would cut the top of the logo and the bottoms
 * of the bowls. The vertical crop takes only the canvas's empty margin.
 *
 * Phones: the anchored crop of the products (HERO_ANCHOR.phone), at the
 * canvas's own cover scale — the painted words are replaced by real text
 * there, so the products are what has to fill the frame.
 */
export const HERO_LAYER_CSS = (() => {
  const { w: CW, h: CH } = HERO_CANVAS;
  const { left: CX, w: CONTENT_W, h: CONTENT_H } = HERO_CONTENT;
  // The canvas must always cover the frame, whatever else is asked for.
  const cover = `max(100cqw / ${CW}, 100cqh / ${CH})`;
  const top = `calc((100cqh - ${CH} * var(--spx)) * ${HERO_ANCHOR.y})`;
  // Desktop: as large as the painting fits. Its height fills the band; the
  // width is capped so it is never scaled past the frame, and the canvas's
  // cover scale is the floor, so no edge of the frame is ever left bare.
  const fit = `max(${cover}, min(100cqh / ${CONTENT_H}, 100cqw / ${CONTENT_W}))`;
  // Centred on the painting, not on the canvas: the canvas has 768px of
  // backdrop either side, and centring that would put the painting off-centre.
  const centred =
    `calc((100cqw - ${CONTENT_W} * var(--spx)) / 2 - ${CX} * var(--spx))`;
  return (
    `.hero-layer{--spx:${cover};` +
    `--hero-x:calc((100cqw - ${CW} * var(--spx)) * ${HERO_ANCHOR.phone.x});` +
    `--hero-y:${top}}` +
    `@media (width >= 768px){.hero-layer{--spx:${fit};` +
    `--hero-x:clamp(100cqw - ${CW} * var(--spx), ${centred}, 0px)}}`
  );
})();

/**
 * An element's box at source (x, y), in the canvas's own placement
 * (HERO_LAYER_CSS), so it stays on its spot in the painting at every size.
 * The element, or an ancestor inside the frame, carries `hero-layer`.
 */
export function heroPlacement(x: number, y: number, w?: number): CSSProperties {
  const { padX, cropTop } = HERO_CANVAS;
  return {
    left: `calc(var(--hero-x) + ${x + padX} * var(--spx))`,
    top: `calc(var(--hero-y) + ${y - cropTop} * var(--spx))`,
    ...(w === undefined ? {} : { width: `calc(${w} * var(--spx))` }),
  };
}

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
