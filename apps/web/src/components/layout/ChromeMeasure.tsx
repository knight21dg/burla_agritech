"use client";

import { useLayoutEffect } from "react";

/**
 * Keeps `--site-chrome` equal to the real height of everything above the hero.
 *
 * The hero sizes itself to `100svh - var(--site-chrome)` so the artwork fits
 * the viewport. globals.css sets a sensible default from the header and notice
 * tokens, which is what server-rendered HTML uses, but that default is a guess
 * and guesses drift: the demo notice wraps to two lines on narrow screens, and
 * a font swap can change the header's height by a pixel or two.
 *
 * Measuring the elements removes that whole class of problem. Runs in a layout
 * effect so the value is corrected before the browser paints, and a
 * ResizeObserver keeps it right through resizes, orientation changes and the
 * notice being dismissed.
 */
export function ChromeMeasure() {
  useLayoutEffect(() => {
    const root = document.documentElement;

    const measure = () => {
      const parts = document.querySelectorAll<HTMLElement>("[data-site-chrome]");
      let total = 0;
      parts.forEach((el) => {
        // Sticky elements still occupy their own height in flow
        total += el.getBoundingClientRect().height;
      });
      if (total > 0) {
        root.style.setProperty("--site-chrome", `${Math.ceil(total)}px`);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    document
      .querySelectorAll<HTMLElement>("[data-site-chrome]")
      .forEach((el) => observer.observe(el));

    // Elements come and go (the notice is dismissible), so watch for that too
    const mutation = new MutationObserver(() => {
      measure();
      observer.disconnect();
      document
        .querySelectorAll<HTMLElement>("[data-site-chrome]")
        .forEach((el) => observer.observe(el));
    });
    mutation.observe(document.body, { childList: true, subtree: false });

    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener("orientationchange", measure);
      root.style.removeProperty("--site-chrome");
    };
  }, []);

  return null;
}
