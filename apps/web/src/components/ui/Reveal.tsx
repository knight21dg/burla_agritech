"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children once, on first scroll into view.
 *
 * Deliberately small: a short fade and a 16px rise, 450ms, once per element,
 * never repeated. The client asked for smooth animation on the homepage, not
 * for the page to perform — so there is no parallax, no stagger beyond a
 * couple of hundred milliseconds, and nothing that delays reading.
 *
 * Three safeguards:
 *  - `prefers-reduced-motion` short-circuits the whole thing; content renders
 *    visible immediately with no transform ever applied
 *  - Content is in the DOM and visible to search engines and screen readers
 *    regardless of whether the observer has fired
 *  - The observer disconnects after firing, so nothing accumulates
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Milliseconds. Keep under ~200 — this is a hint of sequence, not a queue. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn("reveal", shown && "reveal-in", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
