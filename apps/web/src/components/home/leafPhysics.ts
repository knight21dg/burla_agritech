/**
 * The physics of a leaf falling on a breeze — pure functions, no DOM, no React.
 *
 * Kept apart from `FallingLeaves.tsx` so the motion can be exercised and
 * measured without a browser: a simulation can step these exact functions and
 * check fall times, sway and respawning, which is how they were verified.
 *
 * Model, in brief (the reasoning is in FallingLeaves.tsx):
 *
 *   wind      one shared field; gusts travel across the scene left to right
 *   inertia   horizontal velocity eases toward the wind, time constant tau
 *   sway      pendulum phase; descent fastest mid-swing, stalling at the ends
 *   bank      rotateZ follows the swing velocity and leans with the wind
 *   turn      rotateY / rotateX under perspective; ~22% tumble fully
 *   depth     0 = far (small, slow, soft), 1 = near (large, fast, bokeh)
 */
import type { LeafPalette, LeafShape } from "@/components/art/Leaf";
import { between, r2, seeded } from "@/components/art/random";

export type Layer = "back" | "front";

export const LAYER = {
  back: { count: 14, depth: [0, 0.72] as const, seed: 7203 },
  front: { count: 3, depth: [0.86, 1] as const, seed: 91311 },
} as const;

const SHAPES: LeafShape[] = ["mango", "mango", "curl", "curry", "mango", "ovate", "curl", "curry"];
const PALETTES: LeafPalette[] = ["fresh", "fresh", "deep", "lime", "fresh", "deep", "lime", "sun", "fresh"];

export const TAU = Math.PI * 2;

// --- appearance, from depth --------------------------------------------------

/** Leaf width in px. Near leaves grow quickly, as they would through a lens. */
export const widthFor = (d: number) => 12 + 52 * Math.pow(d, 2.2);

export function blurFor(d: number) {
  if (d > 0.84) return 2.6 + (d - 0.84) * 9; // foreground bokeh
  if (d < 0.2) return 1.3 - d * 3.5; // distance softness
  return 0;
}

export function opacityFor(d: number, layer: Layer) {
  return layer === "front" ? 0.8 : 0.52 + 0.43 * Math.min(1, d / 0.72);
}

/** Far leaves are a touch desaturated, the way distance reads in a photograph. */
export const saturationFor = (d: number) => (d < 0.3 ? 0.78 + d * 0.7 : 1);

// --- the server-rendered starting composition --------------------------------

export interface Seed {
  shape: LeafShape;
  palette: LeafPalette;
  depth: number;
  width: number;
  xPct: number;
  yPct: number;
  /** The rotation the leaf is drawn at before JavaScript runs. */
  rotation: number;
  rest: number;
  bank: number;
  phase0: number;
}

export function composition(layer: Layer): Seed[] {
  const cfg = LAYER[layer];
  const rand = seeded(cfg.seed);
  const [dMin, dMax] = cfg.depth;

  return Array.from({ length: cfg.count }, (_, i) => {
    // Stratified, so leaves spread through the depth range instead of clumping.
    const depth = r2(dMin + ((i + rand()) / cfg.count) * (dMax - dMin));
    const rest = between(rand, -35, 35);
    const bank = between(rand, 20, 36);
    // At the bottom of a swing (sway offset zero), so the first animated frame
    // continues from the drawn pose with no jump.
    const phase0 = rand() < 0.5 ? 0 : Math.PI;

    const xPct = layer === "front" ? between(rand, 58, 94) : between(rand, -4, 98);
    const yPct = layer === "front" ? between(rand, 4, 70) : between(rand, -6, 92);

    return {
      shape: SHAPES[Math.floor(rand() * SHAPES.length)]!,
      palette: PALETTES[Math.floor(rand() * PALETTES.length)]!,
      depth,
      width: r2(widthFor(depth)),
      xPct: r2(xPct),
      yPct: r2(yPct),
      rotation: r2(rest + bank * Math.cos(phase0)),
      rest,
      bank,
      phase0,
    };
  });
}

// --- motion ------------------------------------------------------------------

export interface Motion {
  depth: number;
  width: number;
  height: number;
  /** Centre of the swing, px. The drawn x adds the sway offset. */
  x: number;
  y: number;
  vx: number;
  phase: number;
  swayHz: number;
  swayAmp: number;
  fall: number;
  tau: number;
  windScale: number;
  rest: number;
  bank: number;
  lean: number;
  spin: number;
  spinRate: number;
  flutter: number;
  flutterHz: number;
  flutterAmp: number;
  tumbler: boolean;
  pitchAmp: number;
  pitchOffset: number;
}

/** Motion character, re-rolled every time a leaf re-enters at the top. */
export function character(d: number, rand: () => number) {
  return {
    fall: (14 + 46 * d) * between(rand, 0.85, 1.15), // px/s — slow motion
    swayAmp: (10 + 62 * d) * between(rand, 0.75, 1.2),
    swayHz: between(rand, 0.1, 0.19) * (1.15 - 0.3 * d),
    tau: 2.2 - 1.3 * d, // s — small near leaves answer the wind faster
    windScale: 0.45 + 0.75 * d, // parallax: near leaves cross faster
    lean: between(rand, 8, 16),
    spinRate: between(rand, -7, 7),
    flutterHz: between(rand, 0.05, 0.16),
    flutterAmp: between(rand, 34, 62),
    tumbler: rand() < 0.22,
    pitchAmp: between(rand, 16, 32),
  };
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The breeze, in px/s, at time t and horizontal position x.
 *
 * Three incommensurate periods never line up the same way twice in any span a
 * visitor will watch; the smoothstep keeps the baseline calm so gusts arrive
 * as occasional events rather than constant agitation. Sampling at
 * `t - x / 220` makes each gust a front sweeping across the scene.
 */
export function windAt(t: number, x: number) {
  const tl = t - x / 220;
  const swell =
    0.5 +
    0.5 *
      (0.55 * Math.sin((tl * TAU) / 17) +
        0.3 * Math.sin((tl * TAU) / 9.3 + 1.7) +
        0.15 * Math.sin((tl * TAU) / 5.1 + 4.1));
  const gust = smoothstep(0.52, 0.95, swell);
  const flutter = 4 * Math.sin((tl * TAU) / 2.3);
  return { speed: 9 + gust * 46 + flutter, gust };
}

export interface Pose {
  x: number;
  y: number;
  rotZ: number;
  rotY: number;
  rotX: number;
}

/**
 * Advances one leaf by dt seconds at time t and returns where to draw it.
 * Mutates `m` — this runs sixty times a second for every leaf, and allocating
 * a new object per leaf per frame would feed the garbage collector for no
 * benefit.
 */
export function advance(m: Motion, dt: number, t: number): Pose {
  const wind = windAt(t, m.x);
  m.vx += (wind.speed * m.windScale - m.vx) * (1 - Math.exp(-dt / m.tau));
  m.x += m.vx * dt;

  // Gusts quicken the swing a little, as they do on a real branch.
  m.phase += dt * TAU * m.swayHz * (1 + 0.35 * wind.gust);
  const swing = Math.sin(m.phase);
  const swingVelocity = Math.cos(m.phase);

  // Fastest through the bottom of the arc, nearly stalled at either end.
  m.y += m.fall * (0.38 + 0.62 * Math.abs(swingVelocity)) * dt;

  m.spin += m.spinRate * dt;
  m.flutter += dt * TAU * m.flutterHz;

  return {
    x: m.x + m.swayAmp * swing,
    y: m.y,
    rotZ: m.rest + m.spin + m.bank * swingVelocity + m.lean * (m.vx / 60),
    rotY: m.tumbler ? ((m.flutter * 180) / Math.PI) % 360 : m.flutterAmp * Math.sin(m.flutter),
    rotX: m.pitchAmp * Math.sin(m.phase * 0.9 + m.pitchOffset),
  };
}

/** True once a leaf has left the scene and should re-enter at the top. */
export function hasLeft(m: Motion, pose: Pose, W: number, H: number): boolean {
  const margin = m.height * 1.3;
  return pose.y > H + margin || pose.x > W + margin || pose.x < -W * 0.35;
}

/** Re-enter at the top, upwind, with a fresh character. */
export function reenter(m: Motion, layer: Layer, W: number, H: number, rand: () => number) {
  const [dMin, dMax] = LAYER[layer].depth;
  m.depth = between(rand, dMin, dMax);
  m.width = widthFor(m.depth);
  m.height = m.width * 1.6;
  Object.assign(m, character(m.depth, rand));
  m.x =
    layer === "front"
      ? between(rand, 0.5, 0.92) * W // over the illustration, never the headline
      : between(rand, -0.2, 0.92) * W; // biased upwind of a rightward breeze
  m.y = -m.height - between(rand, 0, H * 0.25);
  m.vx = 0;
  m.phase = rand() * TAU;
  m.flutter = rand() * TAU;
  m.pitchOffset = rand() * TAU;
  m.rest = between(rand, -35, 35);
  m.bank = between(rand, 20, 36);
  m.spin = 0;
}

/** The starting motion for a server-rendered leaf, continuing its drawn pose. */
export function motionFrom(seed: Seed, index: number, W: number, H: number): Motion {
  return {
    depth: seed.depth,
    width: seed.width,
    height: seed.width * 1.6,
    x: (seed.xPct / 100) * W,
    y: (seed.yPct / 100) * H,
    vx: 0,
    phase: seed.phase0,
    rest: seed.rest,
    bank: seed.bank,
    spin: 0,
    flutter: 0,
    // Cancels the pitch term at t=0 (rotX = amp * sin(0.9 * phase + offset)),
    // so a leaf drawn flat on the server does not snap on its first frame.
    pitchOffset: -seed.phase0 * 0.9,
    ...character(seed.depth, seeded(index * 7919 + 13)),
  };
}

export function transformOf(p: Pose): string {
  return (
    `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) ` +
    `perspective(700px) rotateZ(${p.rotZ.toFixed(2)}deg) ` +
    `rotateY(${p.rotY.toFixed(2)}deg) rotateX(${p.rotX.toFixed(2)}deg)`
  );
}
