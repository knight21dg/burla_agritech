"use client";

import { AlertCircle, Check, Info } from "lucide-react";
import type { FormState } from "@/app/(app)/products/actions";

/**
 * What happened after a save.
 *
 * Three levels, deliberately distinct: it worked, it worked but something
 * downstream did not, it did not work. The middle one exists because "saved,
 * but the public site was not told to refresh" must not look like a failure
 * (the edit is safe) or like a plain success (the page is briefly stale).
 *
 * `role="status"` rather than an alert for success, so a screen reader hears
 * it without being interrupted; errors get `alert`, because they need to be.
 */
export function FormFeedback({ state }: { state: FormState }) {
  if (!state.message) return null;

  if (state.ok) {
    return (
      <div className="space-y-2">
        <p
          role="status"
          className="flex items-start gap-2 rounded-sm border border-accent/25 bg-accent-soft px-3 py-2 text-[0.8125rem] text-accent-dark"
        >
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
        {state.note && (
          <p className="flex items-start gap-2 rounded-sm border border-warning/25 bg-warning-soft px-3 py-2 text-[0.8125rem] text-warning">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-sm border border-danger/25 bg-danger-soft px-3 py-2 text-[0.8125rem] text-danger"
    >
      <p className="flex items-start gap-2 font-medium">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {state.message}
      </p>
      {state.details && state.details.length > 0 && (
        <ul className="ml-6 mt-1.5 list-disc space-y-0.5">
          {state.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
