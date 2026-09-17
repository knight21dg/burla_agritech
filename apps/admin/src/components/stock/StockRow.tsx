"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PackagePlus, Pencil } from "lucide-react";
import { changeStockAction } from "@/app/(app)/stock/actions";
import type { FormState } from "@/lib/formState";
import { STOCK_LABEL, STOCK_TONE, websiteSays, type StockState } from "@/lib/stock";
import { cn } from "@/lib/cn";

/**
 * One pack size on the Stock screen: how many packets, what the website says,
 * and two jobs — "Add supply" when packets come in, "Set count" after
 * counting the shelf. A pack not counted yet has "Start counting".
 */

function Save({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

type Mode = "none" | "supply" | "count";

export function StockRow({
  variantId,
  productName,
  size,
  counted,
  quantity,
  lowLevel,
  onSale,
  state,
}: {
  variantId: string;
  productName: string;
  size: string;
  counted: boolean;
  quantity: number;
  lowLevel: number;
  onSale: boolean;
  state: StockState;
}) {
  const [mode, setMode] = useState<Mode>("none");
  const [result, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const next = await changeStockAction(previous, form);
    if (next.ok) setMode("none");
    return next;
  }, {});

  const says = websiteSays({ counted, quantity, lowLevel, onSale });

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-[6rem]">
          <p className="font-semibold">{size}</p>
          <span className={cn("pill mt-0.5", STOCK_TONE[state])}>{STOCK_LABEL[state]}</span>
        </div>

        <div className="min-w-[7rem] flex-1">
          {counted ? (
            <p>
              <span className="text-2xl font-semibold tabular-nums">{quantity}</span>{" "}
              <span className="text-ink-2">{quantity === 1 ? "packet" : "packets"}</span>
            </p>
          ) : (
            <p className="text-ink-2">No number yet</p>
          )}
          <p className="text-[0.875rem] text-ink-3">Website says: “{says}”</p>
        </div>

        {mode === "none" && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setMode("supply")}>
              <PackagePlus className="size-4" aria-hidden="true" />
              Add supply
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setMode("count")}>
              <Pencil className="size-4" aria-hidden="true" />
              {counted ? "Set count" : "Start counting"}
            </button>
          </div>
        )}
      </div>

      {mode !== "none" && (
        <form action={action} className="mt-3 rounded-md border border-line bg-surface p-3">
          <input type="hidden" name="variantId" value={variantId} />
          <input type="hidden" name="kind" value={mode} />
          {mode === "count" && counted && <input type="hidden" name="seen" value={quantity} />}

          <label htmlFor={`packets-${variantId}`} className="label">
            {mode === "supply"
              ? `How many packets of ${productName} ${size} came in?`
              : `How many packets of ${productName} ${size} do you have now?`}
          </label>
          <p className="hint">
            {mode === "supply"
              ? `They are added to the ${counted ? quantity : 0} you have.`
              : "Count the packets on the shelf and type the number."}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              id={`packets-${variantId}`}
              name="packets"
              type="number"
              inputMode="numeric"
              min={mode === "supply" ? 1 : 0}
              max={100000}
              step={1}
              required
              autoFocus
              defaultValue={mode === "count" && counted ? quantity : undefined}
              className="field w-32"
            />
            <Save pendingText="Saving…">{mode === "supply" ? "Add" : "Save count"}</Save>
            <button type="button" className="btn btn-quiet" onClick={() => setMode("none")}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "count" && counted && (
        <form action={action} className="mt-2">
          <input type="hidden" name="variantId" value={variantId} />
          <input type="hidden" name="kind" value="stop" />
          <button type="submit" className="text-[0.875rem] text-ink-2 underline underline-offset-2 hover:text-ink">
            Stop counting this pack size
          </button>
        </form>
      )}

      {result.message && (
        <p
          role={result.ok ? "status" : "alert"}
          className={cn("mt-2 text-[0.875rem]", result.ok ? "text-accent-dark" : "text-danger")}
        >
          {result.message}
        </p>
      )}
    </li>
  );
}
