"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "How much do you need?" on the bulk and wholesale enquiry.
 *
 * Buyers here think in tonnes, so the amount is a number with − and + beside
 * it and a few common amounts to tap, rather than a box to write a sentence
 * in. The unit can be changed for smaller loads; the form still sends one
 * plain line ("5 tonnes"), which is what the owner reads in the admin.
 *
 * It may be left empty: a buyer who does not know yet should not be stopped
 * from writing in.
 */

const UNITS = [
  { value: "tonnes", label: "tonnes", step: 1, presets: [1, 5, 10, 25] },
  { value: "quintals", label: "quintals", step: 1, presets: [5, 10, 25, 50] },
  { value: "kg", label: "kilograms", step: 50, presets: [100, 250, 500, 1000] },
] as const;

type Unit = (typeof UNITS)[number];

const MAX = 100_000;

export function BulkQuantity() {
  const id = useId();
  const [unit, setUnit] = useState<Unit>(UNITS[0]);
  const [amount, setAmount] = useState(0);

  const set = (next: number) => setAmount(Math.min(MAX, Math.max(0, Math.round(next * 100) / 100)));
  const line = amount > 0 ? `${amount} ${unit.label}` : "";

  const stepButton =
    "grid h-11 w-11 shrink-0 place-items-center text-ink transition-colors hover:bg-green-50 hover:text-green-700 disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div>
      {/* One line for the server, built from the parts below. */}
      <input type="hidden" name="quantity" value={line} />

      <label htmlFor={`${id}-amount`} className="block text-[0.875rem] font-medium text-ink">
        How much do you need?
      </label>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-sm border border-line bg-white">
          <button
            type="button"
            onClick={() => set(amount - unit.step)}
            disabled={amount <= 0}
            aria-label={`Less ${unit.label}`}
            className={stepButton}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            value={amount === 0 ? "" : String(amount)}
            placeholder="0"
            onChange={(event) => {
              const typed = Number(event.target.value.replace(/[^\d.]/g, ""));
              set(Number.isFinite(typed) ? typed : 0);
            }}
            aria-label={`Amount in ${unit.label}`}
            className="h-11 w-20 border-x border-line text-center text-ink outline-none focus:border-green-700"
          />
          <button
            type="button"
            onClick={() => set(amount + unit.step)}
            disabled={amount >= MAX}
            aria-label={`More ${unit.label}`}
            className={stepButton}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <label htmlFor={`${id}-unit`} className="sr-only">
          Unit
        </label>
        <select
          id={`${id}-unit`}
          value={unit.value}
          onChange={(event) => setUnit(UNITS.find((u) => u.value === event.target.value) ?? UNITS[0])}
          className="h-11 rounded-sm border border-line bg-white px-3 text-ink outline-none focus:border-green-700"
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {unit.presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => set(preset)}
            aria-pressed={amount === preset}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors",
              amount === preset
                ? "border-green-700 bg-green-700 text-white"
                : "border-line bg-white text-ink hover:border-green-700 hover:text-green-700",
            )}
          >
            {preset} {unit.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[0.75rem] text-ink-3" aria-live="polite">
        {line ? `We will quote for ${line}.` : "1 tonne = 1,000 kg. Leave it blank if you are not sure yet."}
      </p>
    </div>
  );
}
