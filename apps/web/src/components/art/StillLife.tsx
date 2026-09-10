import { BowlGroup } from "./Bowl";
import { Leaf } from "./Leaf";

/**
 * The hero illustration: a still life of the raw ingredients.
 *
 * Arranged the way the client's mockup arranges its photograph — a back row
 * raised a little, a front row of bowls overlapping it, loose produce and
 * whole chillies spilling onto the surface in front, leaves tucked behind —
 * but with the ingredients themselves in place of packaging. There is no
 * pouch, no jar label and no logo in it, because the brief rules out
 * inventing what Burla's products look like.
 *
 * ## Grounding
 *
 * Everything rests on one implied surface. Each object's lowest point sits on
 * one of two baselines — the back row at y 334, the front row at y 414 — and
 * each carries its own contact shadow, with one broad shadow under the whole
 * group. Objects that float at unrelated heights read as clip-art; objects
 * that share a floor read as a scene.
 *
 * A bowl's own coordinates run 0..200 x 0..160 with its foot at y 140, so a
 * bowl at scale s placed on baseline b is translated to y = b - 140s.
 *
 * Replaced by the commissioned hero photograph when it arrives (`OQ-017`);
 * see `lib/imagery.ts`.
 */

const BACK = 334;
const FRONT = 414;

/** Places a bowl with its centre at x and its foot on the baseline. */
const onBaseline = (x: number, baseline: number, s: number) =>
  `translate(${x - 100 * s} ${baseline - 140 * s}) scale(${s})`;

function Chilli({ uid, transform }: { uid: string; transform: string }) {
  const body = `${uid}-body`;
  return (
    <g transform={transform}>
      <defs>
        {/* Across the pod: glossy crest, lit ridge, shadowed underside */}
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2452f" />
          <stop offset="0.35" stopColor="#c7231a" />
          <stop offset="0.8" stopColor="#8f150c" />
          <stop offset="1" stopColor="#6a0f08" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="14" rx="62" ry="6" fill="#1c1208" opacity="0.16" />
      <path d="M0 -8 C32 -13 82 -6 122 24 C86 5 32 7 0 8 Z" fill={`url(#${body})`} />
      <path
        d="M9 -5 C40 -9 78 -3 106 15"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M-3 -8 C-10 -6 -12 1 -3 8 L5 5 L5 -5 Z" fill="#3e6d2a" />
      <path
        d="M-7 0 C-15 -2 -19 -9 -22 -16"
        fill="none"
        stroke="#4f7d33"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * A whole mango: a leaning oval, fuller at the shoulder, yellow ripening to
 * orange with a red blush low on the sunny side and a green tinge at the
 * stem. The green shoulder is what stops it reading as an orange.
 */
function Mango({ uid, transform }: { uid: string; transform: string }) {
  const skin = `${uid}-skin`;
  const shoulder = `${uid}-shoulder`;
  const blush = `${uid}-blush`;
  const outline =
    "M-6 -66 C34 -70 64 -36 62 6 C60 44 34 66 2 66 C-34 66 -58 42 -58 6 C-58 -34 -40 -63 -6 -66 Z";
  return (
    <g transform={transform}>
      <defs>
        <radialGradient id={skin} cx="0.4" cy="0.36" r="0.72">
          <stop offset="0" stopColor="#ffe58a" />
          <stop offset="0.5" stopColor="#f7c23e" />
          <stop offset="1" stopColor="#e3861e" />
        </radialGradient>
        <radialGradient id={shoulder} cx="0.42" cy="0.02" r="0.55">
          <stop offset="0" stopColor="#8fae34" stopOpacity="0.75" />
          <stop offset="1" stopColor="#8fae34" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={blush} cx="0.78" cy="0.76" r="0.52">
          <stop offset="0" stopColor="#d6441f" stopOpacity="0.6" />
          <stop offset="1" stopColor="#d6441f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="4" cy="64" rx="56" ry="9" fill="#1c1208" opacity="0.18" />
      <path d={outline} fill={`url(#${skin})`} />
      <path d={outline} fill={`url(#${shoulder})`} />
      <path d={outline} fill={`url(#${blush})`} />
      <ellipse
        cx="-20"
        cy="-30"
        rx="15"
        ry="8"
        fill="#ffffff"
        opacity="0.3"
        transform="rotate(-32 -20 -30)"
      />
      <path d="M-4 -66 C-3 -74 -5 -80 -10 -85" fill="none" stroke="#5b3a1a" strokeWidth="3.4" strokeLinecap="round" />
    </g>
  );
}

/** A dried mango slice lying flat on the surface. */
function LooseSlice({ uid, transform }: { uid: string; transform: string }) {
  const g = `${uid}-g`;
  return (
    <g transform={transform}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcc868" />
          <stop offset="1" stopColor="#dd7812" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="8" rx="44" ry="6" fill="#1c1208" opacity="0.14" />
      <path d="M-46 4 C-32 -30 32 -30 46 4 C30 -2 -30 -2 -46 4 Z" fill={`url(#${g})`} />
      <path d="M-37 -4 C-24 -22 24 -22 37 -4" fill="none" stroke="#fde7b0" strokeOpacity="0.8" strokeWidth="2.6" />
      <path d="M-40 3 C-26 -1 26 -1 40 3" fill="none" stroke="#b85f0c" strokeOpacity="0.5" strokeWidth="1.4" />
    </g>
  );
}

/** A leaf nested into the scene, rotated about its own centre. */
function SceneLeaf({
  uid,
  x,
  y,
  w,
  rotate,
  shape,
  palette,
}: {
  uid: string;
  x: number;
  y: number;
  w: number;
  rotate: number;
  shape: "mango" | "ovate" | "curl" | "curry";
  palette: "fresh" | "deep" | "lime" | "sun";
}) {
  const h = w * 1.6;
  // A period and phase derived from the uid, so each leaf stirs on its own
  // rhythm and the values are identical on the server and the client.
  const n = uid.charCodeAt(uid.length - 1) % 5;
  const sway = {
    animationDuration: `${6.2 + n * 0.8}s`,
    animationDelay: `${-1.3 * n}s`,
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <g className="still-leaf" style={sway}>
        <Leaf uid={uid} shape={shape} palette={palette} width={w} height={h} />
      </g>
    </g>
  );
}

export function StillLife({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 460"
      className={className}
      role="img"
      aria-label="Illustration of turmeric, chilli powder and dried mango in wooden bowls — photograph pending"
    >
      <defs>
        <radialGradient id="sl-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1c1208" stopOpacity="0.16" />
          <stop offset="1" stopColor="#1c1208" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* One broad shadow: the surface the whole group rests on */}
      <ellipse cx="330" cy="420" rx="320" ry="34" fill="url(#sl-floor)" />

      {/* Leaves tucked in behind the back row — they sway on the same breeze */}
      <SceneLeaf uid="sl-leaf-1" x={150} y={110} w={62} rotate={-42} shape="mango" palette="fresh" />
      <SceneLeaf uid="sl-leaf-2" x={250} y={96} w={58} rotate={-12} shape="curl" palette="deep" />
      <SceneLeaf uid="sl-leaf-3" x={452} y={120} w={66} rotate={38} shape="mango" palette="fresh" />
      <SceneLeaf uid="sl-leaf-4" x={540} y={214} w={54} rotate={74} shape="ovate" palette="lime" />

      {/* Back row */}
      <Mango uid="sl-mango-a" transform={`translate(176 ${BACK - 66}) rotate(-14)`} />
      <BowlGroup uid="sl-turmeric" contents="powder" tone="turmeric" seed={11} transform={onBaseline(360, BACK, 1.22)} />

      {/* Front row, overlapping the back */}
      <BowlGroup uid="sl-slices" contents="slices" tone="mango" seed={37} transform={onBaseline(176, FRONT, 1.28)} />
      <BowlGroup uid="sl-chilli" contents="powder" tone="chilli" seed={23} transform={onBaseline(478, FRONT - 6, 1.12)} />

      {/* Spilled onto the surface in front */}
      <LooseSlice uid="sl-slice-1" transform={`translate(330 ${FRONT + 2}) rotate(-6)`} />
      <LooseSlice uid="sl-slice-2" transform={`translate(70 ${FRONT + 12}) rotate(10) scale(0.72)`} />
      <Chilli uid="sl-chilli-1" transform={`translate(360 ${FRONT + 18}) rotate(-8)`} />
      <Chilli uid="sl-chilli-2" transform={`translate(420 ${FRONT + 26}) rotate(-24) scale(0.86)`} />
      <Chilli uid="sl-chilli-3" transform={`translate(540 ${FRONT + 8}) rotate(8) scale(0.72)`} />

      <SceneLeaf uid="sl-leaf-5" x={586} y={332} w={46} rotate={28} shape="curry" palette="fresh" />
    </svg>
  );
}
