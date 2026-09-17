"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveHomepageAction } from "@/app/(app)/website/actions";
import type { FormState } from "@/lib/formState";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { FormFeedback } from "@/components/ui/FormFeedback";
import type { Homepage } from "@burla/core/content";

function Save({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-44" disabled={pending || !dirty}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const FIELDS: { name: keyof Homepage; label: string; hint: string; rows: number }[] = [
  { name: "heroHeading", label: "Big heading at the top", hint: "Press Enter to start a new line.", rows: 3 },
  { name: "heroText", label: "Line under the heading", hint: "One or two short sentences.", rows: 2 },
  { name: "aboutHeading", label: "About section heading", hint: "Press Enter to start a new line.", rows: 2 },
  { name: "aboutText", label: "About section text", hint: "A few sentences about Burla.", rows: 4 },
];

export function HomepageForm({ homepage }: { homepage: Homepage }) {
  const [dirty, setDirty] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await saveHomepageAction(previous, form);
    if (result.ok) setDirty(false);
    return result;
  }, {});
  useUnsavedChangesWarning(dirty);

  return (
    <form action={action} onChange={() => setDirty(true)} className="space-y-4" noValidate>
      <FormFeedback state={state} />
      {FIELDS.map((field) => {
        const error = state.fieldErrors?.[field.name];
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="label">
              {field.label}
            </label>
            <p className="hint">{field.hint}</p>
            <textarea
              id={field.name}
              name={field.name}
              defaultValue={homepage[field.name]}
              rows={field.rows}
              aria-invalid={error ? true : undefined}
              className="field mt-1.5"
            />
            {error && <p className="mt-1.5 text-[0.875rem] font-medium text-danger">{error}</p>}
          </div>
        );
      })}
      <Save dirty={dirty} />
    </form>
  );
}
