"use client";

import { useEffect } from "react";

/**
 * "You have unsaved changes — leave anyway?"
 *
 * Two different exits, and the browser only guards one of them:
 *
 *   - Closing the tab, reloading, or typing a new address fires
 *     `beforeunload`. The browser shows its own wording; custom text has been
 *     ignored by every browser for years.
 *   - Following a link *inside* the admin does not. Next navigates on the
 *     client, and no unload ever happens — so a staff member who clicks
 *     "Products" in the menu mid-edit would lose their changes silently. Links
 *     are therefore intercepted here, before Next sees the click, and a
 *     confirmation is asked for.
 *
 * Not guarded: the browser's own Back button during client navigation. There
 * is no reliable way to intercept it in the App Router without breaking
 * history, and a half-working guard is worse than a stated gap.
 */
const MESSAGE = "You have unsaved changes. Leave this page and lose them?";

export function useUnsavedChangesWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by some browsers to show the prompt at all.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      // A new tab or window leaves this page where it is.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;

      // Only links that would take this page somewhere else.
      const destination = new URL(link.href, window.location.href);
      const here = new URL(window.location.href);
      if (destination.origin !== here.origin) return;
      if (destination.pathname === here.pathname && destination.search === here.search) {
        return;
      }

      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase, so this runs before Next's own link handler.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
