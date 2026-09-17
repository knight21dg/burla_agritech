"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  addSubcategoryAction,
  deleteSubcategoryAction,
  updateSubcategoryAction,
} from "@/app/(app)/categories/actions";
import type { FormState } from "@/lib/formState";
import { FormFeedback } from "@/components/ui/FormFeedback";
import type { SubcategoryRow } from "@/server/categories";
import { cn } from "@/lib/cn";

/**
 * Subcategories — only for categories that are split, like Pickles into Veg
 * and Non-Veg. Each row can be renamed, hidden or deleted, and a new one added
 * with just a name.
 */

function Busy({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {children}
    </button>
  );
}

function Row({ categoryId, sub }: { categoryId: string; sub: SubcategoryRow }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [renameState, rename] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await updateSubcategoryAction(previous, form);
    if (result.ok) setEditing(false);
    return result;
  }, {});
  const [toggleState, toggle] = useActionState<FormState, FormData>(updateSubcategoryAction, {});
  const [deleteState, remove] = useActionState<FormState, FormData>(deleteSubcategoryAction, {});

  const problem = [renameState, toggleState, deleteState].find((s) => s.ok === false);

  return (
    <li className="border-b border-line py-3 last:border-0">
      {editing ? (
        <form action={rename} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="subcategoryId" value={sub.id} />
          <label htmlFor={`rename-${sub.id}`} className="sr-only">
            New name for {sub.name}
          </label>
          <input id={`rename-${sub.id}`} name="name" defaultValue={sub.name} className="field max-w-72 flex-1" autoFocus />
          <Busy className="btn btn-primary">
            <Check className="size-4" aria-hidden="true" />
            Save
          </Busy>
          <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">{sub.name}</p>
            <p className="text-[0.875rem] text-ink-3">
              {sub.productCount} {sub.productCount === 1 ? "product" : "products"}
              <span className={cn("pill ml-2", sub.visible ? "pill-on" : "pill-off")}>
                {sub.visible ? "On website" : "Hidden"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Rename
            </button>
            <form action={toggle}>
              <input type="hidden" name="categoryId" value={categoryId} />
              <input type="hidden" name="subcategoryId" value={sub.id} />
              <input type="hidden" name="visible" value={sub.visible ? "false" : "true"} />
              <Busy className="btn btn-quiet">{sub.visible ? "Hide" : "Show"}</Busy>
            </form>
            {confirming ? (
              <form action={remove} className="flex items-center gap-2">
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="subcategoryId" value={sub.id} />
                <Busy className="btn btn-danger">Yes, delete</Busy>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>
                  <X className="size-4" aria-hidden="true" />
                  <span className="sr-only">Cancel</span>
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="btn btn-quiet"
                aria-label={`Delete ${sub.name}`}
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
      {problem && (
        <div className="mt-2">
          <FormFeedback state={problem} />
        </div>
      )}
    </li>
  );
}

export function Subcategories({
  categoryId,
  categoryName,
  subcategories,
}: {
  categoryId: string;
  categoryName: string;
  subcategories: SubcategoryRow[];
}) {
  const [state, add] = useActionState<FormState, FormData>(addSubcategoryAction, {});
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && input.current) input.current.value = "";
  }, [state]);

  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-[1.0625rem] font-semibold">Subcategories</h2>
      <p className="hint mt-0.5">
        Optional. Use these only if {categoryName} is split into groups — like Veg and Non-Veg.
      </p>

      {subcategories.length > 0 ? (
        <ul className="mt-3">
          {subcategories.map((sub) => (
            <Row key={sub.id} categoryId={categoryId} sub={sub} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md bg-surface px-3 py-2 text-ink-2">
          {categoryName} has no subcategories. Its products are listed together.
        </p>
      )}

      <form action={add} className="mt-4 flex flex-wrap items-end gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <div className="min-w-56 flex-1">
          <label htmlFor="new-subcategory" className="label">
            Add a subcategory
          </label>
          <input ref={input} id="new-subcategory" name="name" placeholder="For example: Veg Pickles" className="field mt-1.5" />
        </div>
        <Busy className="btn btn-quiet">
          <Plus className="size-4" aria-hidden="true" />
          Add Subcategory
        </Busy>
      </form>
      {state.message && (
        <div className="mt-3">
          <FormFeedback state={state} />
        </div>
      )}
    </section>
  );
}
