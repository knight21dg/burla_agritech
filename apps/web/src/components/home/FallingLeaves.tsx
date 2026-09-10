"use client";

import { useEffect, useRef } from "react";
import { Leaf } from "@/components/art/Leaf";
import { r2 } from "@/components/art/random";
import { cn } from "@/lib/utils";
import {
  advance,
  blurFor,
  composition,
  hasLeft,
  type Layer,
  type Motion,
  motionFrom,
  opacityFor,
  reenter,
  saturationFor,
  transformOf,
} from "./leafPhysics";

/**
 * Leaves drifting down through the hero, in slow motion, on a real breeze.
 *
 * ## Why this is a small physics loop and not CSS keyframes
 *
 * Keyframed leaves each follow their own loop, and the eye notices within a
 * few seconds that nothing is connecting them. A breeze is the connection:
 * when it gusts, every leaf answers it together. So the leaves share one wind
 * field and each responds with its own inertia (`leafPhysics.ts`).
 *
 * What makes the motion read as real rather than as wobbling sprites:
 *
 *  - **Gusts travel.** Wind is sampled at `t - x / 220`, so a gust front
 *    sweeps across the scene. Leaves on the left lift first.
 *  - **Pendulum glide.** A falling leaf swings like a pendulum and descends
 *    fastest through the bottom of each arc, then almost stalls at either end
 *    before it tips over. Descent is scaled by |cos(phase)| — that stall.
 *  - **Banking.** It tilts into its direction of travel and leans with the
 *    wind.
 *  - **Turning in 3D.** It pitches and yaws under perspective, so its
 *    silhouette narrows as it turns edge-on; about a fifth tumble fully.
 *  - **Inertia.** Horizontal velocity eases toward the wind, faster for small
 *    near leaves than for large far ones.
 *  - **Depth.** Far leaves are small, slow, soft and desaturated; mid leaves
 *    crisp; the few near leaves large, fast and out of focus — the foreground
 *    bokeh in the client's mockup.
 *
 * ## Rendering
 *
 *  - Every leaf is server-rendered at a deterministic starting pose, so the
 *    first paint already has leaves in the air — no pop-in — and JavaScript
 *    continues from exactly that pose.
 *  - Transform-only on composited layers: no layout, no paint per frame. Blur
 *    sits on a static inner element, so it is rasterised once.
 *  - Size is set with width, never scale(), so a leaf is rasterised at its
 *    real size and never upscaled.
 *  - The loop stops when the hero leaves the viewport or the tab is hidden,
 *    and frame time is clamped so returning does not teleport every leaf.
 *  - `prefers-reduced-motion`: no loop. The server-rendered leaves remain as a
 *    still composition. Changing the setting mid-visit stops the motion.
 *  - Decorative: `aria-hidden`, `pointer-events: none`.
 */
export function FallingLeaves({
  layer = "back",
  className,
}: {
  layer?: Layer;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const seeds = composition(layer);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return; // the server-rendered stills are the design

    let W = container.clientWidth;
    let H = container.clientHeight;

    const leaves: { el: HTMLDivElement; m: Motion }[] = [];
    seeds.forEach((seed, i) => {
      const el = leafRefs.current[i];
      if (!el) return;
      leaves.push({ el, m: motionFrom(seed, i, W, H) });
      // Hand over from the server's percentage position to transforms in the
      // same frame, so nothing visibly moves at the switch.
      el.style.left = "0px";
      el.style.top = "0px";
    });

    /** Apply a re-entered leaf's new depth: size, focus and atmosphere. */
    const restyle = (el: HTMLDivElement, m: Motion) => {
      el.style.width = `${m.width.toFixed(1)}px`;
      const face = el.firstElementChild as HTMLElement | null;
      if (!face) return;
      face.style.opacity = opacityFor(m.depth, layer).toFixed(2);
      face.style.filter =
        `blur(${blurFor(m.depth).toFixed(2)}px) ` +
        `saturate(${saturationFor(m.depth).toFixed(2)})`;
    };

    let visible: boolean[] = [];
    const measure = () => {
      W = container.clientWidth;
      H = container.clientHeight;
      // Leaves hidden by the small-screen rule are skipped, not animated.
      visible = leaves.map(({ el }) => getComputedStyle(el).display !== "none");
    };
    measure();

    const resize = new ResizeObserver(measure);
    resize.observe(container);

    let frame = 0;
    let last = 0;
    let running = false;

    const step = (now: number) => {
      // Clamped: a backgrounded tab or a long GC pause must not throw every
      // leaf a screen's height in one frame.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const t = now / 1000;

      for (let i = 0; i < leaves.length; i += 1) {
        if (!visible[i]) continue;
        const leaf = leaves[i]!;
        const pose = advance(leaf.m, dt, t);
        leaf.el.style.transform = transformOf(pose);
        if (hasLeft(leaf.m, pose, W, H)) {
          reenter(leaf.m, layer, W, H, Math.random);
          restyle(leaf.el, leaf.m);
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

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { rootMargin: "80px" },
    );
    io.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onMotionPreference = () => (motionQuery.matches ? stop() : start());
    motionQuery.addEventListener("change", onMotionPreference);

    return () => {
      stop();
      io.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionPreference);
    };
    // The composition is deterministic per layer, so it is stable across
    // renders and this effect runs once per layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "leaf-layer pointer-events-none absolute inset-0 overflow-hidden",
        layer === "back" ? "leaf-layer-back" : "leaf-layer-front",
        className,
      )}
    >
      {seeds.map((seed, i) => (
        <div
          key={i}
          ref={(el) => {
            leafRefs.current[i] = el;
          }}
          className="leaf absolute will-change-transform"
          style={{
            left: `${seed.xPct}%`,
            top: `${seed.yPct}%`,
            width: `${seed.width}px`,
            transform: `rotate(${seed.rotation}deg)`,
          }}
        >
          <div
            style={{
              opacity: r2(opacityFor(seed.depth, layer)),
              filter: `blur(${r2(blurFor(seed.depth))}px) saturate(${r2(
                saturationFor(seed.depth),
              )})`,
            }}
          >
            <Leaf
              uid={`leaf-${layer}-${i}`}
              shape={seed.shape}
              palette={seed.palette}
              className="block h-auto w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
