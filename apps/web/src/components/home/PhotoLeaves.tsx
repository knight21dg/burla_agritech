"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { between, seeded } from "@/components/art/random";
import { cn } from "@/lib/utils";
import {
  HERO_ANCHOR,
  HERO_CANVAS,
  HERO_LEAVES,
  PAINTED_TEXT,
  heroLeafSrc,
} from "./heroLeaves";
import { TAU, advance, character, type Motion, transformOf } from "./leafPhysics";

/**
 * The hero image's own leaves, falling.
 *
 * Every leaf here is a sprite cut from the supplied image (`heroLeaves.ts`),
 * so they are exactly the leaves the client chose — the same shapes, greens
 * and out-of-focus blur. At the first frame each sits precisely where it was
 * painted, so the hero is indistinguishable from the supplied image. After a
 * moment's stillness the breeze takes them, on the same physics as the
 * illustrated leaves (`leafPhysics.ts`).
 *
 * ## Placement, in CSS, exact at every size
 *
 * The image is shown with `object-fit: cover` in a frame whose shape depends
 * on the screen, so where a painted pixel lands is only known from the
 * frame's size. The frame is a size container, and each leaf is positioned
 * with container units using the same arithmetic as `object-fit: cover`:
 *
 *   s    = max(frame width / canvas width, frame height / canvas height)
 *   left = (frame width - canvas width x s) x anchorX + canvas x x s
 *
 * so the server render is already exact on every device, with no script and
 * no flash. JavaScript then reads each leaf's rendered position and carries
 * on from there.
 *
 * ## Continuity with the painted pose
 *
 * The physics starts from each leaf's exact drawn pose — no sway offset, no
 * rotation, no turn — and eases in after a hold, which is how a still scene
 * comes alive when a breeze arrives.
 *
 * ## Keeping the words clear
 *
 * The headline is part of the picture, so a leaf cannot pass behind it the
 * way the illustrated leaves passed behind live text — a leaf there covers
 * it. So no leaf re-enters over the words: they come in to the right of
 * them, from the upwind side below them, or down through the calm margin to
 * their left, falling nearly straight. The two leaves the image paints beside
 * the words are becalmed the same way on their first fall. Simulated at
 * 1009-2545px frames: no leaf touches the painted words; 8 of 11 on screen.
 */

const HOLD_SECONDS = 1.1;
const EASE_IN_SECONDS = 2.6;
/** Share of re-entering leaves that arrive from the upwind side, below the words. */
const SIDE_ENTRY_SHARE = 0.3;
/** Share that fall through the calm white margin left of the words. */
const MARGIN_ENTRY_SHARE = 0.25;

/**
 * Leaves in the lee of the words fall almost straight down: nearly all of
 * the breeze is taken away and the swing kept short, so they drift down
 * beside the text rather than being blown across it.
 *
 * `still` is for the two leaves the image paints right beside the words —
 * one only ~20px from the logo — which get no drift at all on their first
 * fall and a swing of a few pixels.
 */
function calm(m: Motion, still = false) {
  m.windScale = still ? 0 : m.windScale * 0.03;
  m.swayAmp = Math.min(m.swayAmp, still ? 8 : 12);
}

/** Room left for a leaf's own swing and slow drift, so it stays in its lane. */
const DRIFT_ALLOWANCE = 60;

/**
 * How close to the painted words (source px) a painted leaf may sit and
 * still be free to swing. Leaf "h" sits 31px past the end of the headline —
 * about 18px on a small laptop, less than one swing.
 */
const BESIDE_TEXT = 60;

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

const { w: CW, h: CH, padX: PAD, cropTop: TOP } = HERO_CANVAS;

/** The leaf's box, in container units — `object-fit: cover`, done by hand. */
function placement(x: number, y: number, w: number): CSSProperties {
  return {
    left: `calc((100cqw - ${CW} * var(--spx)) * var(--ox) + ${x + PAD} * var(--spx))`,
    top: `calc((100cqh - ${CH} * var(--spx)) * var(--oy) + ${y - TOP} * var(--spx))`,
    width: `calc(${w} * var(--spx))`,
  };
}

export function PhotoLeaves({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const W0 = container.clientWidth;
    const H0 = container.clientHeight;
    if (!W0 || !H0) return;

    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const anchor = desktop ? HERO_ANCHOR.desktop : HERO_ANCHOR.phone;

    // The same cover arithmetic as the CSS, for the one thing CSS cannot
    // give the physics: where the painted words are.
    const fit = (W: number, H: number) => {
      const s = Math.max(W / CW, H / CH);
      return {
        s,
        offX: (W - CW * s) * anchor.x,
        offY: (H - CH * s) * anchor.y,
      };
    };

    const leaves: { el: HTMLDivElement; m: Motion }[] = [];
    const origin = container.getBoundingClientRect();
    HERO_LEAVES.forEach((leaf, i) => {
      const el = leafRefs.current[i];
      if (!el) return;
      // Where the CSS put it — exact, and already on screen. Bounding boxes
      // rather than offsetLeft/offsetWidth, which round to whole pixels and
      // would nudge every leaf at the hand-over.
      const box = el.getBoundingClientRect();
      const x = box.left - origin.left;
      const y = box.top - origin.top;
      const width = box.width;
      const height = width * (leaf.h / leaf.w);

      const c = character(leaf.depth, seeded(i * 7919 + 101));
      const phase = i % 2 === 0 ? 0 : Math.PI; // zero sway offset at t=0
      const bank = 16 + 10 * leaf.depth;
      leaves.push({
        el,
        m: {
          depth: leaf.depth,
          width,
          height,
          x,
          y,
          vx: 0,
          phase,
          bank,
          // Cancel every rotation term at t=0: the sprite is drawn in its
          // painted orientation, and the first frame must match it.
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
      // The image paints three leaves right beside the words — by the logo,
      // by the paragraph, and just past the end of the headline. On the
      // breeze, or even on their own swing, they would cross the text, so on
      // their first fall they drop straight down beside it instead.
      if (
        desktop &&
        leaf.x < PAINTED_TEXT.right + BESIDE_TEXT &&
        leaf.y < PAINTED_TEXT.bottom + 40
      ) {
        calm(leaves[leaves.length - 1]!.m, true);
      }
    });

    // The leaves are small and arrive long before the hero photograph, and a
    // leaf hanging over empty white is not the picture. So the layer stays
    // hidden until the photograph has loaded, then fades in with it — and the
    // hold before the breeze is counted from that moment, not from mount.
    let revealedAt = 0;
    const photo = container.parentElement?.querySelector<HTMLImageElement>(
      "img[data-hero-image]",
    );
    const reveal = () => {
      if (revealedAt) return;
      revealedAt = performance.now();
      container.style.opacity = "1";
    };
    if (!photo || (photo.complete && photo.naturalWidth > 0)) reveal();
    else {
      photo.addEventListener("load", reveal, { once: true });
      // A photograph that fails to load must not take the leaves with it.
      photo.addEventListener("error", reveal, { once: true });
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return; // the still image is the design

    // Hand over from CSS placement to transforms, in one frame, at the same
    // position — nothing visibly moves.
    for (const { el, m } of leaves) {
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.width = `${m.width.toFixed(2)}px`;
      el.style.transform = transformOf({ x: m.x, y: m.y, rotZ: 0, rotY: 0, rotX: 0 });
    }

    let W = W0;
    let H = H0;
    const resize = new ResizeObserver(() => {
      W = container.clientWidth;
      H = container.clientHeight;
    });
    resize.observe(container);

    const reenter = (m: Motion) => {
      const rand = Math.random;
      const { s, offX, offY } = fit(W, H);
      Object.assign(m, character(m.depth, rand), { tumbler: false });
      m.flutterAmp = Math.min(m.flutterAmp, 52);

      // The painted words, in this frame. No leaf ever re-enters over them:
      // they are part of the picture, so a leaf there covers them. (Phones
      // crop the words out, so the whole frame is open.)
      const textLeft = desktop ? offX + (PAINTED_TEXT.left + PAD) * s : 0;
      const textRight = desktop ? offX + (PAINTED_TEXT.right + PAD) * s : 0;
      const textBottom = desktop ? offY + (PAINTED_TEXT.bottom - TOP) * s : 0;
      // The margin lane must leave room for the calm leaf's swing and its
      // slow drift; the lane right of the words must start a full swing
      // clear, since a swing carries a leaf left as well as right.
      const marginRoom = textLeft - m.width - 12 - DRIFT_ALLOWANCE;
      const roll = rand();

      if (roll < SIDE_ENTRY_SHARE) {
        // Carried in from beside the scene on the breeze — below the words.
        m.x = -m.width - between(rand, 0, 40);
        m.y = between(rand, Math.max(0, textBottom), H * 0.8);
      } else if (desktop && marginRoom > 20 && roll < SIDE_ENTRY_SHARE + MARGIN_ENTRY_SHARE) {
        // Down through the calm white margin left of the words, where the
        // image itself has leaves.
        m.x = between(rand, 0, marginRoom);
        m.y = -m.height - between(rand, 0, H * 0.12);
        calm(m);
      } else {
        // Just above the band, clear of the words, upwind of the breeze.
        m.x = between(rand, Math.max(0, textRight + m.swayAmp + 8), 0.9 * W);
        m.y = -m.height - between(rand, 0, H * 0.12);
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
    let running = false;

    const step = (now: number) => {
      const raw = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      // Still until the scene is visible; then the hold, then the breeze.
      const alive = revealedAt
        ? smooth(((now - revealedAt) / 1000 - HOLD_SECONDS) / EASE_IN_SECONDS)
        : 0;
      const dt = raw * alive;
      const t = now / 1000;

      if (dt > 0) {
        for (const leaf of leaves) {
          const pose = advance(leaf.m, dt, t);
          leaf.el.style.transform = transformOf(pose);
          const margin = leaf.m.height * 1.3;
          if (pose.y > H + margin || pose.x > W + margin || pose.x < -W * 0.35) {
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
      data-photo-leaves
      aria-hidden="true"
      // --spx: rendered px per canvas px, exactly as object-fit: cover
      // computes it. Resolved against the frame, the nearest size container.
      style={{ "--spx": `max(100cqw / ${CW}, 100cqh / ${CH})` } as CSSProperties}
      // Hidden until the hero photograph has loaded (see the effect). The
      // <noscript> rule below shows the leaves anyway when there is no script
      // to reveal them — they are part of the picture.
      className={cn(
        "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
        className,
      )}
    >
      <noscript>
        <style>{`[data-photo-leaves]{opacity:1!important}`}</style>
      </noscript>
      {HERO_LEAVES.map((leaf, i) => (
        <div
          key={leaf.name}
          ref={(el) => {
            leafRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={placement(leaf.x, leaf.y, leaf.w)}
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
