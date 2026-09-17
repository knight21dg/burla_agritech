"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Ban, CircleCheck } from "lucide-react";
import { setCustomerActiveAction } from "@/app/(app)/customers/actions";
import type { FormState } from "@/lib/formState";
import { cn } from "@/lib/cn";

/**
 * Deactivate account / Activate account.
 *
 * Deactivating asks first and says exactly what will happen; activating is
 * safe and happens straight away.
 */

function Go({ children, className, pendingText }: { children: React.ReactNode; className: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function AccountSwitch({
  customerId,
  name,
  active,
  phones = [],
  compact = false,
}: {
  customerId: string;
  name: string;
  active: boolean;
  /** Numbers this customer has used; shown so the owner knows what is blocked. */
  phones?: string[];
  /** Smaller, for a row in the customer list. */
  compact?: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(setCustomerActiveAction, {});
  const [asking, setAsking] = useState(false);

  const message = state.message && (
    <p role={state.ok ? "status" : "alert"} className={cn("w-full text-[0.875rem]", state.ok ? "text-accent-dark" : "text-danger")}>
      {state.message}
    </p>
  );

  if (active && asking) {
    return (
      <form action={action} className="w-full space-y-2 rounded-md border border-danger/30 bg-danger-soft p-3">
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="active" value="false" />
        <p className="font-semibold">Deactivate {name}&rsquo;s account?</p>
        <ul className="list-disc space-y-0.5 pl-5 text-[0.9375rem] text-ink-2">
          <li>They are signed out straight away and cannot sign in.</li>
          <li>
            The website will not take orders from{" "}
            {phones.length ? <span className="font-medium text-ink">{phones.join(", ")}</span> : "their phone number"},
            even from a new account.
          </li>
          <li>Orders already placed are not cancelled.</li>
          <li>You can activate the account again at any time.</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <Go className="btn btn-danger" pendingText="Deactivating…">
            Yes, deactivate
          </Go>
          <button type="button" className="btn btn-quiet" onClick={() => setAsking(false)}>
            No, keep it active
          </button>
        </div>
        {message}
      </form>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", !compact && "w-full")}>
      {active ? (
        <button
          type="button"
          className={cn("btn btn-danger", !compact && "min-h-12 text-base")}
          onClick={() => setAsking(true)}
        >
          <Ban className="size-4" aria-hidden="true" />
          {compact ? "Deactivate" : "Deactivate account"}
        </button>
      ) : (
        <form action={action}>
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="active" value="true" />
          <Go className={cn("btn btn-primary", !compact && "min-h-12 text-base")} pendingText="Activating…">
            <CircleCheck className="size-4" aria-hidden="true" />
            {compact ? "Activate" : "Activate account"}
          </Go>
        </form>
      )}
      {message}
    </div>
  );
}
