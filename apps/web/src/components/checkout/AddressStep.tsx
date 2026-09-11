"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatAddress, type Address, type SavedAddress } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { AddressForm } from "./AddressForm";

/** The address the order goes to: one of the saved ones, or a new one. */
export type AddressChoice = { address: Address; savedId?: string };

/**
 * Step 1 of checkout, as Amazon runs it: the customer's saved addresses to
 * pick from (the most recently used first, and selected), with "Add a new
 * address" beside them. A first-time customer goes straight to the form. A
 * new address is saved to the account when the order is placed.
 */
export function AddressStep({
  saved,
  current,
  onSubmit,
}: {
  saved: SavedAddress[];
  current?: AddressChoice;
  onSubmit: (choice: AddressChoice) => void;
}) {
  const [selected, setSelected] = useState<string | undefined>(
    current ? current.savedId : saved[0]?.id,
  );
  const [adding, setAdding] = useState(saved.length === 0 || (current && !current.savedId));

  if (adding) {
    return (
      <div>
        {saved.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="mb-5 text-[0.875rem] font-semibold text-green-700 hover:underline"
          >
            ← Choose a saved address
          </button>
        )}
        <AddressForm
          initial={current && !current.savedId ? current.address : undefined}
          onSubmit={(address) => onSubmit({ address })}
        />
      </div>
    );
  }

  const chosen = saved.find((a) => a.id === selected);

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Saved addresses</legend>
        <div className="space-y-3">
          {saved.map((a) => (
            <label
              key={a.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                selected === a.id ? "border-green-700 bg-green-50" : "border-line hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="saved-address"
                value={a.id}
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
                className="mt-1 size-4 shrink-0 accent-green-700"
              />
              <span className="min-w-0 text-[0.9375rem] leading-relaxed">
                <span className="font-semibold text-ink">{a.fullName}</span>
                <span className="ml-2 rounded-sm bg-surface px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-3">
                  {a.kind}
                </span>
                <span className="block text-ink-2">+91 {a.mobile}</span>
                <span className="block text-ink-2">{formatAddress(a)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-green-700 hover:underline"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add a new address
      </button>

      <div className="mt-6">
        <Button
          type="button"
          size="lg"
          disabled={!chosen}
          onClick={() => {
            if (!chosen) return;
            const { id, ...address } = chosen;
            onSubmit({ address, savedId: id });
          }}
          className="w-full sm:w-auto sm:min-w-[16rem]"
        >
          Deliver to this address
        </Button>
      </div>
    </div>
  );
}
