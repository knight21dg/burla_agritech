import type { CSSProperties } from "react";
import { r2 } from "./random";

/**
 * A single leaf, drawn rather than photographed.
 *
 * Used by the falling-leaf layer on the homepage and tucked around the
 * illustrated still life. Four silhouettes — narrow mango, broad ovate, a
 * curled one and a small curry-leaf oval — in four greens, so sixteen leaves
 * on screen never read as one sprite repeated.
 *
 * What makes a flat leaf look like a leaf rather than a green blob is three
 * layers of light, and they are all here:
 *
 *   1. A cross-lit body gradient — one half of the blade faces the light,
 *      the other falls away from it.
 *   2. A soft specular bloom near the tip on the lit side.
 *   3. A pale midrib with fainter side veins, which is what the eye actually
 *      uses to recognise the object.
 *
 * Pointing up, stem at the bottom, in a 100 x 160 box. No hooks, so it renders
 * identically as a server or a client component; the caller supplies `uid`
 * because gradient ids are document-global and two leaves must not share one.
 */

export type LeafShape = "mango" | "ovate" | "curl" | "curry";
export type LeafPalette = "fresh" | "deep" | "lime" | "sun";

const PALETTES: Record<
  LeafPalette,
  { dark: string; mid: string; light: string; rib: string }
> = {
  fresh: { dark: "#2a7340", mid: "#3d9a4d", light: "#74c262", rib: "#dcf3c8" },
  deep: { dark: "#1b5a31", mid: "#2b7c42", light: "#55a754", rib: "#cfe9bd" },
  lime: { dark: "#4f8d30", mid: "#7fb63c", light: "#b6d65c", rib: "#f2f8d6" },
  sun: { dark: "#7d8e2b", mid: "#a9b13b", light: "#d8cd64", rib: "#fbf5d2" },
};

interface ShapeSpec {
  outline: string;
  midrib: string;
  /** Half-width of the blade at a given height, for placing the veins. */
  halfWidth: (y: number) => number;
  /** Where the midrib sits horizontally at a given height (curled leaves bend). */
  ribX: (y: number) => number;
}

/** Blade profile: zero at the tip and the base, widest a little below centre. */
function profile(y: number, top: number, bottom: number, max: number, bias = 0.6) {
  const t = Math.min(1, Math.max(0, (y - top) / (bottom - top)));
  const shaped = t < bias ? t / bias : (1 - t) / (1 - bias);
  return max * Math.sin((Math.PI / 2) * Math.pow(shaped, 0.8));
}

const SHAPES: Record<LeafShape, ShapeSpec> = {
  // Long and narrow, like a mango leaf — the most common shape in the layer.
  mango: {
    outline:
      "M50 4 C61 24 71 60 69 96 C67 122 59 140 50 150 C41 140 33 122 31 96 C29 60 39 24 50 4 Z",
    midrib: "M50 150 C50.6 112 50.4 62 50 7",
    halfWidth: (y) => profile(y, 4, 150, 19, 0.63),
    ribX: () => 50,
  },
  ovate: {
    outline:
      "M50 8 C72 26 91 62 86 100 C81 130 63 146 50 150 C37 146 19 130 14 100 C9 62 28 26 50 8 Z",
    midrib: "M50 150 C50.8 114 50.4 64 50 11",
    halfWidth: (y) => profile(y, 8, 150, 36, 0.62),
    ribX: () => 50,
  },
  // Bent at the tip, so it catches the air differently and reads as alive.
  curl: {
    outline:
      "M60 4 C75 30 84 70 74 104 C66 130 56 144 48 150 C38 138 26 116 26 88 C26 52 42 24 60 4 Z",
    midrib: "M48 150 C50 112 54 62 59 7",
    halfWidth: (y) => profile(y, 4, 150, 23, 0.6),
    ribX: (y) => 48 + (150 - y) * (11 / 146),
  },
  curry: {
    outline:
      "M50 22 C69 37 77 72 72 104 C67 130 57 142 50 146 C43 142 33 130 28 104 C23 72 31 37 50 22 Z",
    midrib: "M50 146 C50.4 116 50.2 70 50 25",
    halfWidth: (y) => profile(y, 22, 146, 23, 0.55),
    ribX: () => 50,
  },
};

/** Side veins leave the midrib and sweep up toward the edge, as real ones do. */
function veins(spec: ShapeSpec, top: number, bottom: number): string {
  const paths: string[] = [];
  for (const t of [0.22, 0.36, 0.5, 0.63, 0.75, 0.86]) {
    const y = bottom - (bottom - top) * t;
    const x = spec.ribX(y);
    const w = spec.halfWidth(y) * 0.78;
    if (w < 3) continue;
    const rise = 6 + w * 0.45;
    paths.push(
      `M${r2(x)} ${r2(y)} Q${r2(x - w * 0.45)} ${r2(y - rise * 0.35)} ${r2(x - w)} ${r2(y - rise)}`,
      `M${r2(x)} ${r2(y)} Q${r2(x + w * 0.45)} ${r2(y - rise * 0.35)} ${r2(x + w)} ${r2(y - rise)}`,
    );
  }
  return paths.join(" ");
}

const VEINS: Record<LeafShape, string> = {
  mango: veins(SHAPES.mango, 4, 150),
  ovate: veins(SHAPES.ovate, 8, 150),
  curl: veins(SHAPES.curl, 4, 150),
  curry: veins(SHAPES.curry, 22, 146),
};

export function Leaf({
  uid,
  shape = "mango",
  palette = "fresh",
  className,
  style,
  width,
  height,
}: {
  /** Unique per rendered leaf. Gradient ids are shared across the document. */
  uid: string;
  shape?: LeafShape;
  palette?: LeafPalette;
  className?: string;
  style?: CSSProperties;
  /** For nesting inside another SVG, where CSS sizing is unreliable. */
  width?: number;
  height?: number;
}) {
  const spec = SHAPES[shape];
  const c = PALETTES[palette];
  const body = `${uid}-body`;
  const bloom = `${uid}-bloom`;

  return (
    <svg
      viewBox="0 0 100 160"
      className={className}
      style={style}
      width={width}
      height={height}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Cross-lit: the left half turns away from the light */}
        <linearGradient id={body} x1="0" y1="0.25" x2="1" y2="0.75">
          <stop offset="0" stopColor={c.dark} />
          <stop offset="0.48" stopColor={c.mid} />
          <stop offset="0.52" stopColor={c.mid} />
          <stop offset="1" stopColor={c.light} />
        </linearGradient>
        <radialGradient id={bloom} cx="0.66" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d="M50 148 Q51.5 154 48.5 159"
        fill="none"
        stroke={c.dark}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d={spec.outline} fill={`url(#${body})`} />
      <path d={spec.outline} fill={`url(#${bloom})`} />
      <path
        d={VEINS[shape]}
        fill="none"
        stroke={c.rib}
        strokeOpacity="0.26"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d={spec.midrib}
        fill="none"
        stroke={c.rib}
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={spec.outline}
        fill="none"
        stroke={c.dark}
        strokeOpacity="0.4"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export const LEAF_SHAPES: readonly LeafShape[] = ["mango", "ovate", "curl", "curry"];
export const LEAF_PALETTES: readonly LeafPalette[] = ["fresh", "deep", "lime", "sun"];
