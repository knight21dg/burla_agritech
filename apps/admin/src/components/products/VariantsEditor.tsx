"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { saveVariants, type FormState } from "@/app/(app)/products/actions";
import type { AdminVariant } from "@/server/repositories/catalogueRepository";
import { toRupees } from "@/lib/product";
import { FormFeedback } from "./FormFeedback";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

/**
 * Pack sizes — the screen that turns our sample prices into the client's real
 * ones.
 *
 * The whole set is saved at once, because the rules are about the set: SKUs
 * must be unique, exactly one pack may be the default, and a published product
 * must keep at least one pack someone can buy. Saving one row at a time would
 * mean passing through states the database would refuse.
 *
 * Prices are typed in rupees and stored in paise. The conversion happens once,
 * on the server (`toMinor`), so nothing here can introduce a rounding error.
 *
 * Stock is shown but not editable. It moves only through the inventory ledger,
 * so that "why is this number wrong?" always has an answer — editing a pack
 * must not quietly restock it.
 */

interface Row {
  id: string;
  label: string;
  sku: string;
  priceRupees: string;
  mrpRupees: string;
  netWeightGrams: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  status: "active" | "inactive";
  isDefault: boolean;
  /** Present for existing packs; absent for a row just added. */
  stock?: number;
}

const toRow = (v: AdminVariant): Row => ({
  id: v.id,
  label: v.label,
  sku: v.sku,
  priceRupees: String(toRupees(v.priceMinor)),
  mrpRupees: v.mrpMinor === null ? "" : String(toRupees(v.mrpMinor)),
  netWeightGrams: String(v.netWeightGrams),
  lowStockThreshold: String(v.lowStockThreshold),
  trackInventory: v.trackInventory,
  status: v.status,
  isDefault: v.isDefault,
  stock: v.stockQuantity,
});

function Save({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
      {pending ? "Saving…" : "Save pack sizes"}
    </button>
  );
}

export function VariantsEditor({
  productId,
  variants,
  canEdit,
}: {
  productId: string;
  variants: AdminVariant[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveVariants, {});
  const [rows, setRows] = useState<Row[]>(() => variants.map(toRow));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setDirty(false);
    }
  }, [state]);

  useUnsavedChangesWarning(dirty);

  const update = (index: number, patch: Partial<Row>) => {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) {
          // Only one default: choosing a new one clears the old, here as well
          // as in the database, so the form never shows two.
          return patch.isDefault ? { ...row, isDefault: false } : row;
        }
        return { ...row, ...patch };
      }),
    );
    setDirty(true);
  };

  const add = () => {
    setRows((current) => [
      ...current,
      {
        id: "new",
        label: "",
        sku: "",
        priceRupees: "",
        mrpRupees: "",
        netWeightGrams: "",
        lowStockThreshold: "5",
        trackInventory: true,
        status: "active",
        isDefault: current.length === 0,
      },
    ]);
    setDirty(true);
  };

  const remove = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index));
    setDirty(true);
  };

  const payload = JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      label: row.label,
      sku: row.sku,
      priceRupees: row.priceRupees === "" ? 0 : Number(row.priceRupees),
      mrpRupees: row.mrpRupees === "" ? "" : Number(row.mrpRupees),
      netWeightGrams: row.netWeightGrams === "" ? 0 : Number(row.netWeightGrams),
      lowStockThreshold: row.lowStockThreshold === "" ? 0 : Number(row.lowStockThreshold),
      trackInventory: row.trackInventory,
      status: row.status,
      isDefault: row.isDefault,
    })),
  );

  const rowError = (index: number, field: string) =>
    state.fieldErrors?.[`${index}.${field}`];

  return (
    <form action={action} className="panel space-y-4 p-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variants" value={payload} />

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[0.9375rem] font-semibold">Pack sizes</h2>
          <p className="mt-0.5 text-[0.75rem] text-ink-3">
            Prices in rupees. Stock changes in Inventory, not here.
          </p>
        </div>
      </div>

      <FormFeedback state={state} />

      {rows.length === 0 ? (
        <p className="py-6 text-center text-[0.8125rem] text-ink-2">
          No pack sizes yet. A product needs one before it can be published.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label px-1.5 py-2">
                  Label
                </th>
                <th scope="col" className="label px-1.5 py-2">
                  SKU
                </th>
                <th scope="col" className="label px-1.5 py-2 text-right">
                  Price ₹
                </th>
                <th scope="col" className="label px-1.5 py-2 text-right">
                  MRP ₹
                </th>
                <th scope="col" className="label px-1.5 py-2 text-right">
                  Grams
                </th>
                <th scope="col" className="label px-1.5 py-2 text-right">
                  Stock
                </th>
                <th scope="col" className="label px-1.5 py-2">
                  Default
                </th>
                <th scope="col" className="label px-1.5 py-2">
                  Status
                </th>
                <th scope="col" className="label px-1.5 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.id}-${index}`} className="border-b border-line/70 last:border-0">
                  <td className="px-1.5 py-2">
                    <input
                      aria-label={`Pack ${index + 1} label`}
                      value={row.label}
                      onChange={(e) => update(index, { label: e.target.value })}
                      disabled={!canEdit}
                      placeholder="250 g"
                      aria-invalid={rowError(index, "label") ? true : undefined}
                      className="field w-24"
                    />
                    {rowError(index, "label") && (
                      <span className="mt-1 block text-[0.6875rem] text-danger">
                        {rowError(index, "label")}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2">
                    <input
                      aria-label={`Pack ${index + 1} SKU`}
                      value={row.sku}
                      onChange={(e) => update(index, { sku: e.target.value })}
                      disabled={!canEdit}
                      aria-invalid={rowError(index, "sku") ? true : undefined}
                      className="field w-52 font-mono text-[0.75rem]"
                    />
                    {rowError(index, "sku") && (
                      <span className="mt-1 block text-[0.6875rem] text-danger">
                        {rowError(index, "sku")}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2">
                    <input
                      aria-label={`Pack ${index + 1} price in rupees`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.priceRupees}
                      onChange={(e) => update(index, { priceRupees: e.target.value })}
                      disabled={!canEdit}
                      aria-invalid={rowError(index, "priceRupees") ? true : undefined}
                      className="field w-20 text-right tabular-nums"
                    />
                    {rowError(index, "priceRupees") && (
                      <span className="mt-1 block text-[0.6875rem] text-danger">
                        {rowError(index, "priceRupees")}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2">
                    <input
                      aria-label={`Pack ${index + 1} MRP in rupees`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.mrpRupees}
                      onChange={(e) => update(index, { mrpRupees: e.target.value })}
                      disabled={!canEdit}
                      placeholder="—"
                      aria-invalid={rowError(index, "mrpRupees") ? true : undefined}
                      className="field w-20 text-right tabular-nums"
                    />
                    {rowError(index, "mrpRupees") && (
                      <span className="mt-1 block text-[0.6875rem] text-danger">
                        {rowError(index, "mrpRupees")}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2">
                    <input
                      aria-label={`Pack ${index + 1} weight in grams`}
                      type="number"
                      min={1}
                      value={row.netWeightGrams}
                      onChange={(e) => update(index, { netWeightGrams: e.target.value })}
                      disabled={!canEdit}
                      aria-invalid={rowError(index, "netWeightGrams") ? true : undefined}
                      className="field w-20 text-right tabular-nums"
                    />
                    {rowError(index, "netWeightGrams") && (
                      <span className="mt-1 block text-[0.6875rem] text-danger">
                        {rowError(index, "netWeightGrams")}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2 text-right tabular-nums text-ink-3">
                    {row.stock ?? "—"}
                  </td>
                  <td className="px-1.5 py-2">
                    <input
                      type="radio"
                      name="defaultPack"
                      aria-label={`Make pack ${index + 1} the default`}
                      checked={row.isDefault}
                      onChange={() => update(index, { isDefault: true })}
                      disabled={!canEdit}
                      className="size-4"
                    />
                  </td>
                  <td className="px-1.5 py-2">
                    <select
                      aria-label={`Pack ${index + 1} status`}
                      value={row.status}
                      onChange={(e) =>
                        update(index, { status: e.target.value as "active" | "inactive" })
                      }
                      disabled={!canEdit}
                      className="field w-24"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-1.5 py-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Remove pack ${index + 1}`}
                        title="Remove this pack"
                        className="rounded-sm p-1.5 text-ink-3 hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={add} className="btn btn-quiet">
            <Plus className="size-4" aria-hidden="true" />
            Add a pack size
          </button>
          <Save dirty={dirty} />
          {dirty && <span className="text-[0.75rem] text-ink-3">Unsaved changes</span>}
        </div>
      )}
    </form>
  );
}
