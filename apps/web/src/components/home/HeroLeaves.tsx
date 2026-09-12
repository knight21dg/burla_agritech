"use client";

import { useEffect, useRef } from "react";
import { between, seeded } from "@/components/art/random";
import { cn } from "@/lib/utils";
import { HERO_LEAF_SPRITES, heroLeafSrc } from "./leafSprites";
import { advance, character, transformOf, type Motion } from "./leafPhysics";

/**
 * The hero's leaves: the sprites cut from the client's image, placed by the
 * page rather than baked into it.
 *
 * Each leaf is its own element, positioned and sized as a percentage of the
 * hero box — so it sits in the same place, at the same relative size, on a
 * phone and on a 2560px monitor — and the layer clips at the hero's edges, so
 * a drifting leaf can never widen the page.
 *
 * ## Where they may be
 *
 * Never over the words. Each layout has its own places — stacked, the leaves
 * keep to the products below the text; side by side, they have the margins
 * and the product half — and the text column is measured at runtime and kept
 * clear, so a leaf that falls past it re-enters somewhere else. Counts go
 * down with the screen: six on desktop, four on tablets, three on phones.
 *
 * ## Movement
 *
 * The same slow drift as before (`leafPhysics`), which is the approved effect
 * — a few leaves on a breeze, not a snowstorm. It starts after a moment of
 * stillness, so the first frame is the composition at rest, and
 * `prefers-reduced-motion` leaves them exactly there, unmoving.
 */

interface Placement {
  /** Which sprite. */
  name: string;
  /** Top-left, as percentages of the hero box. */
  x: number;
  y: number;
  /** Width as a percentage of the hero's width. */
  w: number;
  /** 0 = far and small, 1 = near, large and out of focus. */
  depth: number;
  /**
   * Which layout this leaf belongs to. The two are laid out differently, so
   * they need different places: stacked, the words fill the width and the
   * leaves keep to the product below them; side by side, the words are a
   * column and the leaves have the margins and the product half.
   */
  layout: "stacked" | "stacked-md" | "side-by-side";
}

const PLACEMENTS: Placement[] = [
  // Stacked (below lg): low, over and around the products.
  { name: "d", x: 56, y: 64, w: 20, depth: 0.85, layout: "stacked" },
  { name: "g", x: 84, y: 74, w: 13, depth: 0.7, layout: "stacked" },
  { name: "k", x: 5, y: 80, w: 15, depth: 0.45, layout: "stacked" },
  // One more once there is room for it (tablets).
  { name: "b", x: 2, y: 58, w: 9, depth: 0.5, layout: "stacked-md" },
  // Side by side (lg and up): the product half only. The text column reaches
  // about 42% of the hero, and the margin to its left closes entirely below
  // ~1600px, so a leaf placed there would sit on the words at most sizes.
  { name: "d", x: 58, y: 4, w: 13, depth: 0.85, layout: "side-by-side" },
  { name: "f", x: 79, y: 8, w: 11, depth: 0.9, layout: "side-by-side" },
  { name: "g", x: 90, y: 33, w: 7, depth: 0.7, layout: "side-by-side" },
  { name: "h", x: 47, y: 46, w: 5, depth: 0.4, layout: "side-by-side" },
  { name: "k", x: 55, y: 82, w: 9, depth: 0.45, layout: "side-by-side" },
  { name: "i", x: 70, y: 88, w: 6, depth: 0.6, layout: "side-by-side" },
];

const VISIBILITY: Record<Placement["layout"], string> = {
  stacked: "lg:hidden",
  "stacked-md": "hidden md:block lg:hidden",
  "side-by-side": "hidden lg:block",
};

/** Still before the breeze arrives, then eased in — never a jump. */
const HOLD_SECONDS = 1.2;
const EASE_IN_SECONDS = 2.4;
/** Room kept between a leaf and the text column. */
const CLEARANCE = 24;

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

export function HeroLeaves({ className }: { className?: string }) {
  const layer = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = layer.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let W = container.clientWidth;
    let H = container.clientHeight;
    if (!W || !H) return;

    /** The text column in this box, with clearance: no leaf re-enters over it. */
    const keepOut = () => {
      const box = container.parentElement?.querySelector("[data-hero-content]");
      if (!box) return undefined;
      const a = container.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return { left: b.left - a.left - CLEARANCE, right: b.right - a.left + CLEARANCE };
    };

    const origin = container.getBoundingClientRect();
    const leaves: { el: HTMLDivElement; m: Motion }[] = [];

    PLACEMENTS.forEach((leaf, i) => {
      const el = refs.current[i];
      // Hidden at this width (the tablet and desktop extras).
      if (!el || el.offsetParent === null) return;
      const box = el.getBoundingClientRect();
      const rand = seeded(i * 7919 + 101);
      const phase = i % 2 === 0 ? 0 : Math.PI;
      const bank = 16 + 10 * leaf.depth;
      const c = character(leaf.depth, rand);
      leaves.push({
        el,
        m: {
          depth: leaf.depth,
          width: box.width,
          height: box.height,
          x: box.left - origin.left,
          y: box.top - origin.top,
          vx: 0,
          phase,
          bank,
          // Every rotation term cancels at t=0: the first frame is the leaf
          // exactly where it was placed.
          rest: -bank * Math.cos(phase),
          spin: 0,
          flutter: 0,
          pitchOffset: -0.9 * phase,
          ...c,
          // A photograph turned past edge-on shows its face mirrored, which
          // reads wrong; these turn, but never fully over.
          tumbler: false,
          flutterAmp: Math.min(c.flutterAmp, 52),
        },
      });
    });
    if (leaves.length === 0) return;

    // From CSS placement to transforms, in one frame, at the same position.
    for (const { el, m } of leaves) {
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.width = `${m.width.toFixed(2)}px`;
      el.style.transform = transformOf({ x: m.x, y: m.y, rotZ: 0, rotY: 0, rotX: 0 });
    }

    /** Back to the top, in a lane that clears the words. */
    const respawn = (m: Motion) => {
      const rand = Math.random;
      const c = character(m.depth, rand);
      Object.assign(m, c, { tumbler: false, flutterAmp: Math.min(c.flutterAmp, 52) });

      const zone = keepOut();
      const candidates: [number, number][] = zone
        ? [
            [0, zone.left - m.width],
            [zone.right, W - m.width],
          ]
        : [[0, W - m.width]];
      const lanes = candidates.filter(([from, to]) => to - from > 8);
      const lane = lanes[Math.floor(rand() * lanes.length)] ?? [0, Math.max(0, W - m.width)];
      m.x = between(rand, lane[0], lane[1]);
      m.y = -m.height - between(rand, 0, H * 0.25);
      m.vx = 0;
      m.phase = rand() * Math.PI * 2;
    };

    // A layout change moves the words; a leaf mid-fall keeps its pixels, so
    // one can be left over the text until it next comes round. Send those
    // back to the top instead.
    const resize = new ResizeObserver(() => {
      W = container.clientWidth;
      H = container.clientHeight;
      const zone = keepOut();
      if (!zone) return;
      for (const { m } of leaves) {
        if (m.x + m.width > zone.left && m.x < zone.right) respawn(m);
      }
    });
    resize.observe(container);

    let raf = 0;
    let last = 0;
    let started = 0;
    let running = true;

    const frame = (now: number) => {
      if (!running) return;
      if (!started) started = now;
      const elapsed = (now - started) / 1000;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      // Held still, then the breeze eases in.
      const gain = smooth((elapsed - HOLD_SECONDS) / EASE_IN_SECONDS);
      for (const { el, m } of leaves) {
        const pose = advance(m, dt * gain, elapsed);
        if (pose.y > H + m.height) respawn(m);
        el.style.transform = transformOf(pose);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Scrolled past, or a background tab: nothing moves.
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting ?? true) start();
      else stop();
    });
    io.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={layer}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {PLACEMENTS.map((leaf, i) => {
        const sprite = HERO_LEAF_SPRITES[leaf.name]!;
        return (
          <div
            key={`${leaf.layout}-${leaf.name}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn("absolute will-change-transform", VISIBILITY[leaf.layout])}
            style={{ left: `${leaf.x}%`, top: `${leaf.y}%`, width: `${leaf.w}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a 2-10KB
                pre-sized sprite moved by transform; next/image's wrapper and
                srcset would add nothing but weight */}
            <img
              src={heroLeafSrc(leaf.name)}
              alt=""
              width={sprite.w}
              height={sprite.h}
              decoding="async"
              className="h-auto w-full select-none"
            />
          </div>
        );
      })}
    </div>
  );
}
