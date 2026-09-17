"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/app/(app)/settings/actions";
import type { FormState } from "@/lib/formState";
import { FormFeedback } from "@/components/ui/FormFeedback";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? "Changing…" : "Change password"}
    </button>
  );
}

const FIELDS = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  { name: "next", label: "New password", autoComplete: "new-password", hint: "At least 12 characters." },
  { name: "again", label: "New password again", autoComplete: "new-password" },
] as const;

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const form = useRef<HTMLFormElement>(null);

  // Passwords never linger in the page after a change.
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-3" noValidate>
      <FormFeedback state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FIELDS.map((field) => {
          const error = state.fieldErrors?.[field.name];
          return (
            <div key={field.name}>
              <label htmlFor={`password-${field.name}`} className="label">
                {field.label}
              </label>
              <input
                id={`password-${field.name}`}
                name={field.name}
                type="password"
                autoComplete={field.autoComplete}
                aria-invalid={error ? true : undefined}
                className="field mt-1.5"
              />
              {"hint" in field && !error && <p className="hint mt-1">{field.hint}</p>}
              {error && <p className="mt-1.5 text-[0.875rem] font-medium text-danger">{error}</p>}
            </div>
          );
        })}
      </div>
      <Save />
    </form>
  );
}
