"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Gift,
  Handshake,
  Leaf,
  Package,
  Phone,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { OFFER_LINKS, type Offer, type OfferIcon } from "@burla/core/content";

/**
 * The scrolling strip of offers under the header (client mockup, 2026-09-17):
 * bulk orders, discounts, delivery, partnerships, quotes — whatever the owner
 * sets under Website in the admin.
 *
 * ## How it moves
 *
 * The offers glide slowly to the left in a loop. The list is drawn three
 * times side by side and the whole row is moved by one list's width at a
 * time, so it never runs out and never jumps, even on a very wide screen.
 * Only the first copy is read out or reachable by keyboard; the others are
 * decoration to the screen reader but still open their offer when clicked,
 * because as the strip moves it is usually a copy under the pointer.
 *
 * It stops while the pointer is over it, while it is being pressed, while
 * something in it has focus, and while the tab is hidden — so an offer can be
 * read and clicked. The arrows move
 * it one offer at a time and hold it still for a few seconds after.
 *
 * Someone who has asked their device for reduced motion gets no gliding at
 * all — the arrows still move it.
 *
 * Moved with a transform, driven by requestAnimationFrame: no layout work per
 * frame, and it keeps the page's scroll alone.
 */

const ICONS: Record<OfferIcon, LucideIcon> = {
  truck: Truck,
  percent: BadgePercent,
  package: Package,
  handshake: Handshake,
  phone: Phone,
  leaf: Leaf,
  gift: Gift,
  star: Star,
};

/** Pixels per second. Slow enough to read a line as it passes. */
const SPEED = 36;
const HOLD_AFTER_ARROW_MS = 4000;
/** Long enough for a press and release to land on the same offer. */
const HOLD_AFTER_PRESS_MS = 1200;

function OfferItem({ offer, hidden }: { offer: Offer; hidden: boolean }) {
  const Icon = ICONS[offer.icon];
  const href = OFFER_LINKS[offer.link].href;
  const body = (
    <>
      <Icon className="size-7 shrink-0 text-green-700 sm:size-8" strokeWidth={1.75} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[0.875rem] font-semibold text-ink sm:text-[0.9375rem]">{offer.title}</span>
        {offer.text && (
          <span className="block whitespace-nowrap text-[0.75rem] text-ink-2 sm:text-[0.8125rem]">{offer.text}</span>
        )}
      </span>
    </>
  );
  const cls =
    "flex h-full items-center gap-3 border-r border-green-700/15 px-6 py-2.5 sm:px-9";

  return (
    <li className="shrink-0">
      {href ? (
        <Link
          href={href}
          tabIndex={hidden ? -1 : undefined}
          className={`${cls} transition-colors hover:bg-white/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700`}
        >
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

export function OfferStrip({ offers }: { offers: Offer[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLUListElement>(null);
  const offset = useRef(0);
  const paused = useRef(false);
  const heldUntil = useRef(0);
  const nudge = useRef<{ from: number; to: number; start: number } | null>(null);

  const apply = useCallback(() => {
    const width = setRef.current?.offsetWidth ?? 0;
    if (width > 0) {
      // Keep the offset within one list's width, so the loop never shows its seam.
      while (offset.current <= -width) offset.current += width;
      while (offset.current > 0) offset.current -= width;
    }
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${offset.current}px,0,0)`;
  }, []);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      if (nudge.current) {
        const t = Math.min(1, (now - nudge.current.start) / 420);
        const eased = 1 - Math.pow(1 - t, 3);
        offset.current = nudge.current.from + (nudge.current.to - nudge.current.from) * eased;
        if (t >= 1) nudge.current = null;
      } else if (!still.matches && !paused.current && !document.hidden && now > heldUntil.current) {
        offset.current -= (SPEED * dt) / 1000;
      }
      apply();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [apply]);

  /** One offer to the left or right: the average width of an offer. */
  const step = (direction: 1 | -1) => {
    const set = setRef.current;
    if (!set || offers.length === 0) return;
    const distance = set.offsetWidth / offers.length;
    nudge.current = { from: offset.current, to: offset.current + direction * distance, start: performance.now() };
    heldUntil.current = performance.now() + HOLD_AFTER_ARROW_MS;
  };

  if (offers.length === 0) return null;

  const arrow =
    "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_2px_10px_-2px_rgba(23,23,23,0.25)] transition-colors hover:text-green-700 focus-visible:outline-2 focus-visible:outline-green-700 sm:size-9";

  return (
    <section
      data-site-chrome
      aria-label="Offers"
      className="relative overflow-hidden border-b border-green-700/10 bg-[#e9f4ec]"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      // A press freezes it too. A browser only counts a click when the press
      // and the release land on the same thing, and a strip still gliding
      // under the finger moves out from under it — which swallowed the click
      // on a touchscreen and wherever the pointer arrived with the press.
      onPointerDown={() => {
        paused.current = true;
        heldUntil.current = performance.now() + HOLD_AFTER_PRESS_MS;
      }}
      onPointerCancel={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <button type="button" onClick={() => step(1)} aria-label="Previous offer" className={`${arrow} left-2 sm:left-4`}>
        <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
      </button>

      {/* Soft edges, so offers fade in and out under the arrows. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r from-[#e9f4ec] to-transparent sm:w-20" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l from-[#e9f4ec] to-transparent sm:w-20" />

      <div ref={trackRef} className="flex w-max will-change-transform">
        {[0, 1, 2].map((copy) => (
          <ul
            key={copy}
            ref={copy === 0 ? setRef : undefined}
            aria-hidden={copy === 0 ? undefined : true}
            // The copies are not read out and not in the tab order, but they
            // are still clickable: as the strip moves, the offer under the
            // pointer is usually one of them, and `inert` swallowed the click.
            className="flex"
          >
            {offers.map((offer, index) => (
              <OfferItem key={index} offer={offer} hidden={copy !== 0} />
            ))}
          </ul>
        ))}
      </div>

      <button type="button" onClick={() => step(-1)} aria-label="Next offer" className={`${arrow} right-2 sm:right-4`}>
        <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
      </button>
    </section>
  );
}
