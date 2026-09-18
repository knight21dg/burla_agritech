"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markEnquiryAction } from "@/app/(app)/enquiries/actions";
import type { FormState } from "@/lib/formState";

/**
 * Marking a bulk order from the list, without opening it.
 *
 * The buttons offered are the ones that make sense from where you are
 * standing: from New you say you have been in touch, from Contacted you say
 * it is finished, and from anywhere else you can put it back. The same
 * action as the buttons inside the enquiry, so the two never disagree.
 */

const NEXT: Record<string, { as: string; label: string }[]> = {
  new: [
    { as: "contacted", label: "Contacted" },
    { as: "done", label: "Done" },
  ],
  contacted: [{ as: "done", label: "Done" }],
  done: [{ as: "new", label: "Back to new" }],
  spam: [{ as: "new", label: "Back to new" }],
};

function Button({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-quiet px-3 py-1.5 text-[0.875rem]" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

export function QuickMark({ enquiryId, view }: { enquiryId: string; view: string }) {
  const [, action] = useActionState<FormState, FormData>(markEnquiryAction, {});
  const options = NEXT[view] ?? [];
  if (options.length === 0) return null;

  return (
    <div className="hidden shrink-0 gap-1.5 sm:flex">
      {options.map((option) => (
        <form key={option.as} action={action}>
          <input type="hidden" name="enquiryId" value={enquiryId} />
          <input type="hidden" name="as" value={option.as} />
          <Button label={option.label} />
        </form>
      ))}
    </div>
  );
}
