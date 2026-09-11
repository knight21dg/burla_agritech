"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { cancelMyOrder } from "@/app/checkout/actions";
import { Button } from "@/components/ui/Button";

/**
 * Cancel, with a second press to confirm — an order is not something to lose
 * to a stray tap. The server decides whether it can still be cancelled.
 */
export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-[0.9375rem] font-medium text-ink">Cancel this order?</p>
      <p className="mt-1 text-[0.875rem] text-ink-2">
        It won&rsquo;t be delivered, and this can&rsquo;t be undone.
      </p>
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-[0.875rem] text-danger">
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await cancelMyOrder(orderNumber);
              if (result.ok) {
                setConfirming(false);
                router.refresh();
              } else {
                setError(result.message);
              }
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Yes, cancel it
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
          Keep order
        </Button>
      </div>
    </div>
  );
}
