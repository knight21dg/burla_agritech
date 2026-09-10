import type { ReactElement } from "react";
import type { Tone } from "@/types/catalog";
import { between, r2, seeded } from "./random";

/**
 * A wooden bowl of whatever a category is made of — drawn, not photographed.
 *
 * ## Why this exists
 *
 * The client's mockup fills every image slot with photographs of Burla
 * packaging. Those are AI renders carrying the real logo, and the brief rules
 * out invented packaging and AI imagery standing in for the product. Until the
 * commissioned photography arrives (`OQ-017`) the slots need *something*, and
 * a grey box in each of ten category tiles makes the page look unfinished.
 *
 * So: an illustration, and an obviously illustrated one. It shows the raw
 * ingredient in a bowl — turmeric as a golden mound, dried mango as a pile of
 * slices — and never a package, a label or a logo. It suggests what the
 * category is without pretending to be a photograph of a product.
 *
 * ## How it is drawn
 *
 * Layered back to front the way the eye expects a bowl to be built: the far
 * rim, the dark inside wall, the contents heaped above it, then the bowl body
 * in front — which hides the bottom of the pile, so the contents read as
 * *inside* — and finally the lit front lip.
 *
 * Piles are procedural. Pieces are scattered over a dome with a seeded
 * generator and drawn back to front, so the front of the heap overlaps the
 * back. Every number is rounded, so server and client markup are identical.
 */

export type Contents =
  | "powder"
  | "slices"
  | "chunks"
  | "grains"
  | "discs"
  | "nuts"
  | "tea";

interface Shades {
  base: string;
  light: string;
  dark: string;
}

/** What the food looks like, per tone. Not the UI tints — these are the produce. */
const PRODUCE: Record<Tone, Shades> = {
  turmeric: { base: "#e2a018", light: "#f7d05c", dark: "#b37208" },
  mango: { base: "#f0952a", light: "#fcc86a", dark: "#c86b0e" },
  chilli: { base: "#c0301c", light: "#e8683f", dark: "#861a0f" },
  leaf: { base: "#5c8c3a", light: "#92be5f", dark: "#3a6224" },
  grain: { base: "#c69e5c", light: "#e8cb92", dark: "#9a7338" },
  berry: { base: "#8c2446", light: "#c24c6e", dark: "#5c132c" },
  earth: { base: "#976741", light: "#c9996c", dark: "#6a4323" },
  cream: { base: "#e4cfa2", light: "#f7ecd3", dark: "#bba071" },
};

/** Which kind of pile suits each category. */
export const CONTENTS_FOR_CATEGORY: Record<string, Contents> = {
  "dehydrated-powders-flakes": "powder",
  "dehydrated-fruits": "slices",
  pickles: "chunks",
  "dal-powders": "powder",
  crisps: "discs",
  "dry-fruits": "nuts",
  "millet-powders": "powder",
  "tea-coffee": "tea",
  "masala-powders": "powder",
  spices: "powder",
};

// --- colour ------------------------------------------------------------------

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

/** A slightly different shade of the same food, so pieces are not clones. */
function vary(s: Shades, rand: () => number): string {
  const t = rand();
  return t < 0.5 ? mix(s.dark, s.base, t * 2) : mix(s.base, s.light, (t - 0.5) * 2);
}

// --- geometry (200 x 160 box, bowl centred) ----------------------------------

const CX = 100;
const RIM_Y = 82;
const RX = 76;
const RY = 17;
const LEFT = CX - RX;
const RIGHT = CX + RX;

/** Lower half of the rim ellipse, left to right — the lip facing the viewer. */
const FRONT_LIP = `M${LEFT} ${RIM_Y} A${RX} ${RY} 0 0 0 ${RIGHT} ${RIM_Y}`;

const BODY =
  `${FRONT_LIP} C${RIGHT - 2} 120 ${CX + 40} 140 ${CX} 140 ` +
  `C${CX - 40} 140 ${LEFT + 2} 120 ${LEFT} ${RIM_Y} Z`;

/** A heap rising from the rim to a peak `h` above it. */
function mound(h: number, flat = 0.55): string {
  const peak = RIM_Y - h;
  return (
    `M${LEFT} ${RIM_Y} C${LEFT + 16} ${r2(RIM_Y - h * flat)} ${CX - 22} ${r2(peak)} ${CX} ${r2(peak)} ` +
    `C${CX + 22} ${r2(peak)} ${RIGHT - 16} ${r2(RIM_Y - h * flat)} ${RIGHT} ${RIM_Y} ` +
    `A${RX} ${RY} 0 0 1 ${LEFT} ${RIM_Y} Z`
  );
}

interface Spot {
  x: number;
  y: number;
  rot: number;
  s: number;
}

/**
 * Positions over the surface of a heap, sorted back to front so nearer
 * pieces overlap farther ones.
 */
function scatter(rand: () => number, n: number, h: number, spread = 0.88): Spot[] {
  const spots: Spot[] = [];
  for (let i = 0; i < n; i += 1) {
    const v = Math.pow(rand(), 0.75); // 0 at the rim, 1 at the peak
    const half = RX * spread * (1 - v * 0.72);
    spots.push({
      x: r2(CX + (rand() * 2 - 1) * half),
      y: r2(RIM_Y + 6 - v * h + (rand() - 0.5) * 5),
      rot: r2(between(rand, -50, 50)),
      s: r2(between(rand, 0.8, 1.18)),
    });
  }
  return spots.sort((a, b) => a.y - b.y);
}

// --- piece drawings, each centred on the origin ------------------------------

// A dried mango strip: wide and thick, not a thin crescent, or it reads as noodles.
const SLICE = "M-18 2 C-14 -13 14 -13 18 2 C12 0 -12 0 -18 2 Z";
const CASHEW =
  "M-11 5 C-15 -6 -2 -13 7 -9 C13 -6 13 2 7 2 C3 2 1 -2 -2 1 C-5 4 -7 7 -11 5 Z";

function chunk(rand: () => number): string {
  // An irregular rounded lump: six jittered radii joined with smooth curves.
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    const rad = between(rand, 6, 10);
    return [Math.cos(a) * rad, Math.sin(a) * rad * 0.8] as const;
  });
  const mid = (i: number) => {
    const p = pts[i % 6]!;
    const q = pts[(i + 1) % 6]!;
    return [r2((p[0] + q[0]) / 2), r2((p[1] + q[1]) / 2)] as const;
  };
  let d = `M${mid(0)[0]} ${mid(0)[1]}`;
  for (let i = 1; i <= 6; i += 1) {
    const c = pts[i % 6]!;
    const m = mid(i);
    d += ` Q${r2(c[0])} ${r2(c[1])} ${m[0]} ${m[1]}`;
  }
  return `${d} Z`;
}

// --- the bowl ----------------------------------------------------------------

function Filling({
  uid,
  contents,
  shades,
  seed,
}: {
  uid: string;
  contents: Contents;
  shades: Shades;
  seed: number;
}): ReactElement {
  const rand = seeded(seed);
  const shade = `${uid}-shade`;
  const grain = `${uid}-grain`;

  const defs = (
    <defs>
      <radialGradient id={shade} cx="0.36" cy="0.25" r="0.85">
        <stop offset="0" stopColor={shades.light} />
        <stop offset="0.45" stopColor={shades.base} />
        <stop offset="1" stopColor={shades.dark} />
      </radialGradient>
      {/* Speckle for powders: noise, thresholded into sparse dots */}
      <filter id={grain} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="1.1"
          numOctaves="2"
          seed={seed % 97}
        />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.6 -1.25" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
  );

  switch (contents) {
    case "powder": {
      const d = mound(44, 0.5);
      return (
        <g>
          {defs}
          <path d={d} fill={`url(#${shade})`} />
          <path d={d} fill={shades.dark} filter={`url(#${grain})`} opacity="0.55" />
          {/* The lit slope of the heap */}
          <path
            d={`M${CX - 44} ${RIM_Y - 12} Q${CX - 22} ${RIM_Y - 40} ${CX - 2} ${RIM_Y - 43}`}
            fill="none"
            stroke={shades.light}
            strokeOpacity="0.55"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    case "grains": {
      const spots = scatter(rand, 130, 38, 0.92);
      return (
        <g>
          {defs}
          <path d={mound(38)} fill={`url(#${shade})`} />
          {spots.map((p, i) => (
            <ellipse
              key={i}
              cx={p.x}
              cy={p.y}
              rx={r2(2.5 * p.s)}
              ry={r2(1.8 * p.s)}
              transform={`rotate(${p.rot} ${p.x} ${p.y})`}
              fill={vary(shades, rand)}
            />
          ))}
        </g>
      );
    }

    case "slices": {
      const spots = scatter(rand, 13, 40);
      return (
        <g>
          {defs}
          <path d={mound(24)} fill={shades.dark} />
          {spots.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.s})`}>
              <path d={SLICE} fill={vary(shades, rand)} />
              {/* Dried fruit is translucent at the thin edge */}
              <path d="M-14 -2 C-10 -9 10 -9 14 -2" fill="none" stroke={shades.light} strokeOpacity="0.75" strokeWidth="1.6" />
              <path d="M-15 1.5 C-10 -0.5 10 -0.5 15 1.5" fill="none" stroke={shades.dark} strokeOpacity="0.45" strokeWidth="1" />
            </g>
          ))}
        </g>
      );
    }

    case "chunks": {
      const spots = scatter(rand, 13, 34);
      return (
        <g>
          {defs}
          {/* The oily masala the pieces sit in */}
          <path d={mound(26)} fill={mix(shades.dark, "#3a0f06", 0.35)} />
          {spots.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.s})`}>
              <path d={chunk(rand)} fill={vary(shades, rand)} />
              {/* Oil catches the light */}
              <ellipse cx="-2.5" cy="-3" rx="2.6" ry="1.3" fill="#ffffff" opacity="0.45" />
            </g>
          ))}
        </g>
      );
    }

    case "nuts": {
      const spots = scatter(rand, 14, 36);
      return (
        <g>
          {defs}
          <path d={mound(22)} fill={shades.dark} />
          {spots.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.s})`}>
              <path d={CASHEW} fill={vary(shades, rand)} />
              <path d="M-7 1 C-9 -5 -1 -9 5 -6" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    }

    case "discs": {
      const spots = scatter(rand, 12, 32);
      return (
        <g>
          {defs}
          <path d={mound(20)} fill={shades.dark} />
          {spots.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${r2(p.rot * 0.4)}) scale(${p.s})`}>
              <ellipse rx="12" ry="5.5" fill={vary(shades, rand)} />
              <ellipse rx="12" ry="5.5" fill="none" stroke={shades.dark} strokeOpacity="0.35" strokeWidth="0.8" />
              {/* Crisps blister as they dry */}
              <circle cx="-4" cy="-0.5" r="0.9" fill={shades.dark} opacity="0.35" />
              <circle cx="3" cy="1" r="0.7" fill={shades.dark} opacity="0.3" />
            </g>
          ))}
        </g>
      );
    }

    case "tea": {
      const spots = scatter(rand, 42, 34, 0.9);
      return (
        <g>
          {defs}
          <path d={mound(30)} fill={shades.dark} />
          {spots.map((p, i) => (
            <path
              key={i}
              d="M-5 0 L-1 -3 L5 -1 L2 3 Z"
              transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${r2(p.s * 1.3)})`}
              fill={vary(shades, rand)}
            />
          ))}
        </g>
      );
    }
  }
}

/**
 * The bowl as an SVG `<g>`, for composing into a larger illustration.
 * Occupies 0..200 x 0..160 in its own coordinates.
 */
export function BowlGroup({
  uid,
  contents,
  tone,
  seed,
  transform,
}: {
  uid: string;
  contents: Contents;
  tone: Tone;
  seed: number;
  transform?: string;
}) {
  const wood = `${uid}-wood`;
  const depth = `${uid}-depth`;
  const shadow = `${uid}-shadow`;
  const clip = `${uid}-clip`;

  return (
    <g transform={transform}>
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b3218" />
          <stop offset="0.28" stopColor="#a1683a" />
          <stop offset="0.42" stopColor="#bf874f" />
          <stop offset="0.72" stopColor="#8c5629" />
          <stop offset="1" stopColor="#5a3117" />
        </linearGradient>
        <linearGradient id={depth} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.1" stopColor="#2b1406" stopOpacity="0" />
          <stop offset="1" stopColor="#2b1406" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id={shadow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1c1208" stopOpacity="0.28" />
          <stop offset="1" stopColor="#1c1208" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
      </defs>

      <ellipse cx={CX} cy="143" rx="84" ry="11" fill={`url(#${shadow})`} />

      {/* Far rim, then the dark inner wall below the contents */}
      <ellipse cx={CX} cy={RIM_Y} rx={RX} ry={RY} fill="#b07a45" />
      <ellipse cx={CX} cy={RIM_Y + 1} rx={RX - 4} ry={RY - 3.5} fill="#4a2810" />

      <Filling uid={uid} contents={contents} shades={PRODUCE[tone]} seed={seed} />

      {/* The body sits in front of the heap, which is what puts it inside */}
      <path d={BODY} fill={`url(#${wood})`} />
      <g clipPath={`url(#${clip})`} fill="none" stroke="#3f2210" strokeOpacity="0.16" strokeWidth="1.2">
        {[0, 1, 2, 3, 4].map((k) => {
          const y = 92 + k * 10;
          return (
            <path key={k} d={`M${LEFT - 4} ${y} C${CX - 50} ${y + 14 + k * 2} ${CX + 50} ${y + 14 + k * 2} ${RIGHT + 4} ${y}`} />
          );
        })}
      </g>
      <path d={BODY} fill={`url(#${depth})`} />

      {/* The lip facing the viewer catches the light */}
      <path d={FRONT_LIP} fill="none" stroke="#d6a26a" strokeWidth="2.6" strokeLinecap="round" />
      <path d={FRONT_LIP} fill="none" stroke="#6b3c1b" strokeOpacity="0.5" strokeWidth="0.8" transform="translate(0 2)" />
    </g>
  );
}

/** A standalone bowl illustration. */
export function Bowl({
  uid,
  contents,
  tone,
  seed,
  className,
}: {
  uid: string;
  contents: Contents;
  tone: Tone;
  seed: number;
  className?: string;
}) {
  return (
    // Framed tight to the drawing (heap peak ~y 30, shadow ~y 154) rather than
    // the full 0..160 box, so the bowl fills its tile the way the mockup's
    // photographs fill theirs.
    <svg
      viewBox="0 24 200 132"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <BowlGroup uid={uid} contents={contents} tone={tone} seed={seed} />
    </svg>
  );
}
