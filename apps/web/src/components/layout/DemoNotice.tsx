"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

/**
 * Honest disclosure for the demo build.
 *
 * The catalogue is sample data and the imagery is placeholder artwork. Saying
 * so once, at the top of the page, is what allows the rest of the interface to
 * stay clean — see docs/REFERENCE-ANALYSIS.md and docs/PHOTOGRAPHY-BRIEF.md.
 * Deliberately neutral dark rather than brand green: the header and its
 * category strip are already green, and a third green bar above them reads as
 * part of the brand rather than as a temporary system message.
 *
 * Remove this component when real content and photography land.
 */
export function DemoNotice() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("burla:demo-notice") === "1";
    } catch {
      dismissed = false;
    }
    setHidden(dismissed);
    // Lets --site-chrome shrink so the hero reclaims the space
    document.documentElement.dataset.notice = dismissed
      ? "dismissed"
      : "visible";
  }, []);

  if (hidden) return null;

  return (
    <div data-site-chrome className="bg-ink text-white">
      <div className="container-page">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <p className="flex items-center gap-2.5 text-[0.8125rem] leading-snug">
            <Info className="size-4 shrink-0 text-white/60" aria-hidden="true" />
            <span>
              <span className="font-semibold">Demo build.</span>{" "}
              <span className="text-white/75">
                Product details and imagery are placeholders pending client
                content and photography.
              </span>
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              setHidden(true);
              document.documentElement.dataset.notice = "dismissed";
              try {
                sessionStorage.setItem("burla:demo-notice", "1");
              } catch {
                /* ignore */
              }
            }}
            aria-label="Dismiss demo notice"
            className="shrink-0 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
