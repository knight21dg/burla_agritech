"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { whatsappLink } from "@/lib/site";

/**
 * Floating WhatsApp affordance (FR-110 to FR-115).
 *
 * - Number comes from config, never hard-coded
 * - Hidden on checkout so it cannot cover a payment action
 * - Dismissible on mobile, remembered for the session
 * - Plain wa.me link: no third-party script, no tracking pixel
 */
export function WhatsAppFab() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem("burla:wa-dismissed") === "1");
    } catch {
      /* storage can throw in private mode — treat as not dismissed */
    }
  }, []);

  const hidden =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");

  if (!mounted || hidden || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("burla:wa-dismissed", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide WhatsApp button"
        className="rounded-full border border-line bg-white p-1.5 text-ink-3 shadow-sm transition-colors hover:text-ink sm:hidden"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>

      <a
        href={whatsappLink(
          "Hi Burla, I'd like to know more about your products.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics="whatsapp_click"
        data-source="floating"
        className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3 text-[0.9375rem] font-semibold text-[#0B2E13] shadow-[0_6px_20px_-6px_rgba(31,33,28,0.45)] transition-transform duration-150 hover:scale-[1.03] sm:px-5"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">Chat with Burla</span>
        <span className="sr-only sm:hidden">Chat with Burla on WhatsApp</span>
      </a>
    </div>
  );
}
