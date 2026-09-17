"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markEnquiryAction } from "@/app/(app)/enquiries/actions";
import type { FormState } from "@/lib/formState";
import { FormFeedback } from "@/components/ui/FormFeedback";

function Mark({ label, primary }: { label: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn ${primary ? "btn-primary" : "btn-quiet"} w-full sm:w-auto`} disabled={pending}>
      {label}
    </button>
  );
}

export function EnquiryActions({ enquiryId, current }: { enquiryId: string; current: string }) {
  const [state, action] = useActionState<FormState, FormData>(markEnquiryAction, {});

  const options: { as: string; label: string; primary?: boolean }[] =
    current === "New"
      ? [
          { as: "contacted", label: "Mark as contacted", primary: true },
          { as: "done", label: "Mark as done" },
          { as: "spam", label: "Not genuine" },
        ]
      : current === "Contacted"
        ? [
            { as: "done", label: "Mark as done", primary: true },
            { as: "new", label: "Move back to new" },
          ]
        : [{ as: "new", label: "Move back to new" }];

  return (
    <section className="panel space-y-3 p-4 sm:p-5">
      <FormFeedback state={state} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {options.map((option) => (
          <form key={option.as} action={action}>
            <input type="hidden" name="enquiryId" value={enquiryId} />
            <input type="hidden" name="as" value={option.as} />
            <Mark label={option.label} primary={option.primary} />
          </form>
        ))}
      </div>
    </section>
  );
}
