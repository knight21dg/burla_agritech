"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

/**
 * Honest disclosure for the demo build.
 *
 * The catalogue is sample data and the imagery is placeholder artwork. Saying
 * so once, at the top of the page, is what allows the rest of the interface to
 * stay clean — see docs/REFERENCE-ANALYSIS.md and docs/PHOTOGRAPHY-BRIEF.md.
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
    <div data-site-chrome className="bg-green-deep text-ivory">
      <div className="container-page">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <p className="flex items-center gap-2.5 text-[0.8125rem] leading-snug">
            <Info className="size-4 shrink-0 text-ivory/70" aria-hidden="true" />
            <span>
              <span className="font-semibold">Demo build.</span>{" "}
              <span className="text-ivory/80">
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
            className="shrink-0 rounded-md p-1.5 text-ivory/70 transition-colors hover:bg-ivory/10 hover:text-ivory"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
