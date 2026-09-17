"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveBusinessAction } from "@/app/(app)/settings/actions";
import type { FormState } from "@/lib/formState";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { FormFeedback } from "@/components/ui/FormFeedback";
import type { Business } from "@/server/website";

function Save({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-44" disabled={pending || !dirty}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

type Field = { name: keyof Business; label: string; hint?: string; type?: string; wide?: boolean };

const GROUPS: { title: string; hint: string; fields: Field[] }[] = [
  {
    title: "How customers reach you",
    hint: "Shown on the Contact page and at the bottom of every page.",
    fields: [
      { name: "contactPhone", label: "Phone number", type: "tel" },
      { name: "contactEmail", label: "Email address", type: "email" },
      { name: "businessHours", label: "Opening hours", hint: "For example: Mon–Sat, 9 am to 6 pm", wide: true },
      { name: "addressLine", label: "Address", wide: true },
    ],
  },
  {
    title: "Company information",
    hint: "Required by law for selling food online in India. Shown at the bottom of every page.",
    fields: [
      { name: "entityName", label: "Registered business name", wide: true },
      { name: "gstin", label: "GSTIN", hint: "15 letters and numbers" },
      { name: "fssaiLicenceNumber", label: "FSSAI licence number", hint: "14 digits" },
    ],
  },
  {
    title: "Grievance officer",
    hint: "The person customers can complain to, required for online shops in India.",
    fields: [
      { name: "grievanceOfficerName", label: "Name", wide: true },
      { name: "grievanceOfficerEmail", label: "Email", type: "email" },
      { name: "grievanceOfficerPhone", label: "Phone", type: "tel" },
    ],
  },
];

export function BusinessForm({ business }: { business: Business }) {
  const [dirty, setDirty] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await saveBusinessAction(previous, form);
    if (result.ok) setDirty(false);
    return result;
  }, {});
  useUnsavedChangesWarning(dirty);

  return (
    <form action={action} onChange={() => setDirty(true)} className="space-y-5" noValidate>
      <FormFeedback state={state} />
      {GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-3">
          <legend className="text-[1rem] font-semibold">{group.title}</legend>
          <p className="hint -mt-2">{group.hint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {group.fields.map((field) => {
              const error = state.fieldErrors?.[field.name];
              const missing = !business[field.name];
              return (
                <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
                  <label htmlFor={field.name} className="label">
                    {field.label}
                  </label>
                  {field.hint && <p className="hint">{field.hint}</p>}
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    defaultValue={business[field.name]}
                    aria-invalid={error ? true : undefined}
                    placeholder={missing ? "Not filled in yet" : undefined}
                    className="field mt-1.5"
                  />
                  {error && <p className="mt-1.5 text-[0.875rem] font-medium text-danger">{error}</p>}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
      <Save dirty={dirty} />
    </form>
  );
}
