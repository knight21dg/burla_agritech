/**
 * Deterministic randomness for illustration.
 *
 * Every procedural drawing on the site — the pile of slices in a bowl, where
 * a leaf starts falling from — must produce byte-identical markup on the
 * server and in the browser, or React reports a hydration mismatch and
 * re-renders the subtree. `Math.random()` cannot do that; a seeded generator
 * can.
 *
 * Numbers are also rounded before they reach an attribute. Floating-point
 * trigonometry is not guaranteed to agree to the last digit between V8 on the
 * server and V8 in a given browser, and `51.80423337731037` against
 * `51.80423337731036` is enough to fail hydration. This bit us once already.
 */

/** mulberry32 — small, fast, and good enough for scattering shapes. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable numeric seed from a string, so "mango-pickle" always draws the same. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Two decimal places — enough for sub-pixel SVG, few enough to be stable. */
export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function between(rand: () => number, min: number, max: number): number {
  return min + (max - min) * rand();
}
