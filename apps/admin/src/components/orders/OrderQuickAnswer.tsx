"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";
import { moveOrderAction } from "@/app/(app)/orders/actions";
import type { FormState } from "@/lib/formState";

/**
 * Accept or Reject, right in the order list, for an order that has just come
 * in. Reject asks first. The server checks the order is still new, so two
 * people answering at once cannot both win.
 */

function Go({ children, className, pendingText }: { children: React.ReactNode; className: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function OrderQuickAnswer({ orderNumber, paidOnline }: { orderNumber: string; paidOnline?: string }) {
  const [state, action] = useActionState<FormState, FormData>(moveOrderAction, {});
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="space-y-2 border-t border-line px-4 py-3">
      {rejecting ? (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="to" value="cancelled" />
          <span className="mr-auto font-medium">Reject order {orderNumber}?</span>
          {paidOnline && (
            <p className="order-last w-full rounded-md bg-warning-soft px-3 py-2 text-warning">
              The customer has paid {paidOnline} online. You will need to refund it from your payment dashboard.
            </p>
          )}
          <Go className="btn btn-danger" pendingText="Rejecting…">
            Yes, reject
          </Go>
          <button type="button" className="btn btn-quiet" onClick={() => setRejecting(false)}>
            No
          </button>
        </form>
      ) : (
        <div className="flex gap-2">
          <form action={action} className="flex-1 sm:flex-none">
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <input type="hidden" name="to" value="processing" />
            <Go className="btn btn-primary w-full sm:w-auto" pendingText="Accepting…">
              <Check className="size-4" aria-hidden="true" />
              Accept
            </Go>
          </form>
          <button type="button" className="btn btn-danger flex-1 sm:flex-none" onClick={() => setRejecting(true)}>
            <X className="size-4" aria-hidden="true" />
            Reject
          </button>
        </div>
      )}

      {state.ok === false && (
        <p role="alert" className="text-[0.875rem] text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}
