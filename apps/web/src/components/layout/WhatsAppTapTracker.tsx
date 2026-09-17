"use client";

import { useEffect } from "react";

/**
 * Notes a tap on any WhatsApp button, so the owner sees it in the admin.
 *
 * One listener for the whole page rather than code on every button: any link
 * to wa.me counts, and its `data-source` says which button it was. The tap is
 * sent with sendBeacon, which does not hold up opening WhatsApp. Only the
 * page's path is sent — never the query string, the message or anything
 * about the visitor.
 */

const PLACES = new Set(["floating", "footer", "contact", "wholesale", "search"]);

export function WhatsAppTapTracker() {
  useEffect(() => {
    const onTap = (event: MouseEvent) => {
      if (event.type === "auxclick" && event.button !== 1) return;
      const link = (event.target as Element | null)?.closest?.('a[href^="https://wa.me/"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const source = link.dataset.source ?? "";
      const body = JSON.stringify({
        place: PLACES.has(source) ? source : "page",
        path: window.location.pathname.slice(0, 200),
      });
      try {
        navigator.sendBeacon("/api/whatsapp-tap", new Blob([body], { type: "application/json" }));
      } catch {
        // Recording a tap is never worth getting in the way of the chat.
      }
    };

    document.addEventListener("click", onTap, { capture: true });
    document.addEventListener("auxclick", onTap, { capture: true });
    return () => {
      document.removeEventListener("click", onTap, { capture: true });
      document.removeEventListener("auxclick", onTap, { capture: true });
    };
  }, []);

  return null;
}
