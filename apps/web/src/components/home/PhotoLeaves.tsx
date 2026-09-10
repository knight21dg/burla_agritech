"use client";

import { useEffect, useRef } from "react";
import { between, seeded } from "@/components/art/random";
import { cn } from "@/lib/utils";
import { HERO_LEAVES, HERO_SOURCE, heroLeafSrc } from "./heroLeaves";
import { TAU, advance, character, type Motion, transformOf } from "./leafPhysics";

/**
 * The hero image's own leaves, falling.
 *
 * Every leaf here is a sprite cut from the supplied image (`heroLeaves.ts`),
 * so they are exactly the leaves the client chose — the same shapes, the same
 * greens, the same out-of-focus blur on the near ones. At the first frame each
 * sits precisely where it was painted, so the hero is indistinguishable from
 * the original file. After a moment's stillness the breeze takes them.
 *
 * The motion is the same physics as the illustrated leaves
 * (`leafPhysics.ts`): one shared wind whose gusts sweep across the scene,
 * pendulum-glide descent, banking, and turning under perspective. Near
 * leaves fall and drift faster than far ones.
 *
 * ## Continuity with the painted pose
 *
 * The physics is started from each leaf's exact drawn pose — no sway offset,
 * no rotation, no turn — so nothing visibly moves at the hand-over from the
 * server-rendered frame. Motion then eases in over the first seconds rather
 * than starting at full speed, which is how a still scene comes alive when a
 * breeze arrives.
 *
 * ## Framing
 *
 * On desktop the frame shows the whole image, so positions are exact from the
 * server render, and leaves may drift on past the image into the band's white
 * margin. On phones the same image is cropped to the products (cover,
 * anchored right); the leaves are mapped through that crop in the
 * browser, and the layer fades in once they are placed so no leaf is ever
 * seen in the wrong spot.
 *
 * Re-entering leaves come back in at the top, upwind, with a fresh rotation,
 * so the scene keeps its density without repeating itself.
 */

/** How long the scene holds still before the breeze arrives, and eases in. */
const HOLD_SECONDS = 1.1;
const EASE_IN_SECONDS = 2.6;

/** Where the phone crop is anchored — must match PhotoHero's object-position. */
const PHONE_ANCHOR = { x: 1, y: 0.5 };

/**
 * The right edge of the words painted into the image, in source pixels.
 *
 * The headline is part of the picture, so a leaf cannot pass behind it the
 * way the illustrated leaves passed behind live text — anything drifting
 * across it covers it. Leaves re-entering from the top therefore come in to
 * the right of this line, where a rightward breeze carries them away from the
 * words. Only the smallest, faintest leaves may cross them, as they would.
 */
const PAINTED_TEXT_RIGHT = 470;
const PAINTED_TEXT_BOTTOM = 600;
const FREE_TO_CROSS_TEXT_BELOW_DEPTH = 0.28;

/** Share of re-entering leaves that arrive from the upwind side, not the top. */
const SIDE_ENTRY_SHARE = 0.3;

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

export function PhotoLeaves({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W0 = container.clientWidth;
    const H0 = container.clientHeight;
    if (!W0 || !H0) return;

    // How the source image is fitted into this frame: the whole of it on
    // desktop (the frame has the image's own ratio), cropped on phones.
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const scale = desktop
      ? W0 / HERO_SOURCE.w
      : Math.max(W0 / HERO_SOURCE.w, H0 / HERO_SOURCE.h);
    const offX = desktop ? 0 : (W0 - HERO_SOURCE.w * scale) * PHONE_ANCHOR.x;
    const offY = desktop ? 0 : (H0 - HERO_SOURCE.h * scale) * PHONE_ANCHOR.y;

    const leaves: { el: HTMLDivElement; m: Motion }[] = [];
    HERO_LEAVES.forEach((leaf, i) => {
      const el = leafRefs.current[i];
      if (!el) return;
      const width = leaf.w * scale;
      const height = leaf.h * scale;
      const c = character(leaf.depth, seeded(i * 7919 + 101));
      const phase = i % 2 === 0 ? 0 : Math.PI; // zero sway offset at t=0
      const bank = 16 + 10 * leaf.depth;

      leaves.push({
        el,
        m: {
          depth: leaf.depth,
          width,
          height,
          x: offX + leaf.x * scale,
          y: offY + leaf.y * scale,
          vx: 0,
          phase,
          bank,
          // Cancel every rotation term at t=0: the sprite is drawn in its
          // painted orientation, and the first frame must match it exactly.
          rest: -bank * Math.cos(phase),
          spin: 0,
          flutter: 0,
          pitchOffset: -0.9 * phase,
          ...c,
          // A photograph turned past edge-on shows its own face mirrored,
          // which reads wrong; these leaves turn, but never fully over.
          tumbler: false,
          flutterAmp: Math.min(c.flutterAmp, 52),
        },
      });

      el.style.left = "0px";
      el.style.top = "0px";
      el.style.width = `${width.toFixed(2)}px`;
      el.style.transform = transformOf({
        x: offX + leaf.x * scale,
        y: offY + leaf.y * scale,
        rotZ: 0,
        rotY: 0,
        rotX: 0,
      });
    });

    // Placed: safe to show (the phone layer starts hidden until now).
    container.style.opacity = "1";

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return; // the still image is the design

    // Where leaves may travel, in this layer's coordinates. On desktop the
    // image is centred in a wider band, and a leaf should drift on across the
    // white margin and leave at the edge of the band — not vanish mid-air at
    // the image's invisible border. On phones the crop is the band.
    const section = container.closest("section");
    let bounds = { left: 0, right: W0, top: 0, bottom: H0 };
    const measure = () => {
      const c = container.getBoundingClientRect();
      if (desktop && section) {
        const s = section.getBoundingClientRect();
        bounds = {
          left: s.left - c.left,
          right: s.right - c.left,
          top: s.top - c.top,
          bottom: s.bottom - c.top,
        };
      } else {
        bounds = { left: 0, right: c.width, top: 0, bottom: c.height };
      }
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    if (section) resize.observe(section);

    const reenter = (m: Motion) => {
      const rand = Math.random;
      const span = bounds.right - bounds.left;
      Object.assign(m, character(m.depth, rand), {
        tumbler: false,
      });
      m.flutterAmp = Math.min(m.flutterAmp, 52);
      // Above the top of the band, upwind of a rightward breeze — and, for all
      // but the faintest leaves, clear of the painted words (desktop only;
      // the phone crop shows no painted text).
      const clearOfText =
        desktop && m.depth >= FREE_TO_CROSS_TEXT_BELOW_DEPTH
          ? PAINTED_TEXT_RIGHT * scale
          : bounds.left - 0.1 * span;
      const bandH = bounds.bottom - bounds.top;
      if (rand() < SIDE_ENTRY_SHARE) {
        // Carried in from beside the scene on the breeze, as leaves are —
        // below the painted words, so it never has to cross them.
        const belowText = desktop ? PAINTED_TEXT_BOTTOM * scale : bounds.top;
        m.x = bounds.left - m.width - between(rand, 0, 40);
        m.y = between(rand, Math.max(belowText, bounds.top), bounds.top + bandH * 0.8);
      } else {
        m.x = between(rand, clearOfText, bounds.left + 0.9 * span);
        // Just above the band, so the scene never thins out while it waits.
        m.y = bounds.top - m.height - between(rand, 0, bandH * 0.12);
      }
      m.vx = 0;
      m.phase = rand() * TAU;
      m.flutter = rand() * TAU;
      m.pitchOffset = rand() * TAU;
      m.rest = between(rand, -30, 30);
      m.spin = 0;
    };

    let frame = 0;
    let last = 0;
    let started = 0;
    let running = false;

    const step = (now: number) => {
      if (!started) started = now;
      const raw = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      // Hold, then ease the breeze in.
      const alive = smooth(((now - started) / 1000 - HOLD_SECONDS) / EASE_IN_SECONDS);
      const dt = raw * alive;
      const t = now / 1000;

      if (dt > 0) {
        for (const leaf of leaves) {
          const pose = advance(leaf.m, dt, t);
          leaf.el.style.transform = transformOf(pose);
          const margin = leaf.m.height * 1.3;
          const span = bounds.right - bounds.left;
          if (
            pose.y > bounds.bottom + margin ||
            pose.x > bounds.right + margin ||
            pose.x < bounds.left - span * 0.35
          ) {
            reenter(leaf.m);
          }
        }
      }
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || motionQuery.matches || document.hidden) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { rootMargin: "80px" },
    );
    io.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const onMotion = () => (motionQuery.matches ? stop() : start());
    motionQuery.addEventListener("change", onMotion);

    return () => {
      stop();
      io.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        // Not clipped here: on desktop leaves travel past the image into the
        // band's white margin, and the section clips them at its edges.
        "pointer-events-none absolute inset-0",
        // Exact from the server on desktop; on phones the crop is only known
        // in the browser, so the layer appears once the leaves are placed.
        "opacity-0 transition-opacity duration-500 md:opacity-100",
        className,
      )}
    >
      {HERO_LEAVES.map((leaf, i) => (
        <div
          key={leaf.name}
          ref={(el) => {
            leafRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{
            left: `${(leaf.x / HERO_SOURCE.w) * 100}%`,
            top: `${(leaf.y / HERO_SOURCE.h) * 100}%`,
            width: `${(leaf.w / HERO_SOURCE.w) * 100}%`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a 2-10KB
              pre-sized sprite positioned by transform; next/image's wrapper
              and srcset would add nothing but weight */}
          <img
            src={heroLeafSrc(leaf.name)}
            alt=""
            width={leaf.w}
            height={leaf.h}
            decoding="async"
            draggable={false}
            className="block h-auto w-full select-none"
          />
        </div>
      ))}
    </div>
  );
}
