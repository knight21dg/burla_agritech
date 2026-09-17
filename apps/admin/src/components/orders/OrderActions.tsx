"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { moveOrderAction } from "@/app/(app)/orders/actions";
import type { FormState } from "@/lib/formState";
import { FormFeedback } from "@/components/ui/FormFeedback";
import type { Step } from "@/lib/orderSteps";

/**
 * The next thing to do with an order, as big buttons. Cancelling is kept
 * apart and asks first, because it cannot be undone.
 */

function Go({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function OrderActions({
  orderNumber,
  steps,
  canCancel,
}: {
  orderNumber: string;
  steps: Step[];
  canCancel: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(moveOrderAction, {});
  const [cancelling, setCancelling] = useState(false);

  if (steps.length === 0 && !canCancel) return null;

  return (
    <section className="panel space-y-3 p-4 sm:p-5">
      <h2 className="text-[1.0625rem] font-semibold">Next step</h2>
      <FormFeedback state={state} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {steps.map((step, index) => (
          <form key={step.to} action={action} className="sm:w-auto">
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <input type="hidden" name="to" value={step.to} />
            <Go className={`btn ${index === 0 ? "btn-primary" : "btn-quiet"} w-full min-h-12 text-base sm:w-auto`}>
              {step.label}
            </Go>
            {step.explain && <p className="hint mt-1 max-w-64">{step.explain}</p>}
          </form>
        ))}
      </div>

      {canCancel && (
        <div className="border-t border-line pt-3">
          {cancelling ? (
            <form action={action} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="orderNumber" value={orderNumber} />
              <input type="hidden" name="to" value="cancelled" />
              <span className="font-medium">Cancel this order? This cannot be undone.</span>
              <Go className="btn btn-danger">Yes, cancel order</Go>
              <button type="button" className="btn btn-quiet" onClick={() => setCancelling(false)}>
                No, keep it
              </button>
            </form>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setCancelling(true)}>
              Cancel order
            </button>
          )}
        </div>
      )}
    </section>
  );
}
