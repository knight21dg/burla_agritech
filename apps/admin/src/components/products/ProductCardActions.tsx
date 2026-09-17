"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteFromListAction, setAvailableAction } from "@/app/(app)/products/actions";
import type { FormState } from "@/lib/formState";
import { cn } from "@/lib/cn";

/**
 * The buttons under a product card: Edit, Available / Out of stock, Delete.
 *
 * Availability changes every pack size of the product at once; one pack size
 * on its own is changed in the editor. Delete asks first, and the product
 * leaves the list without the page losing its search or category.
 */

function StockButton({ available, active }: { available: boolean; active: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="available"
      value={String(available)}
      aria-pressed={active}
      disabled={pending || active}
      className={cn(
        "min-h-10 flex-1 px-2.5 text-[0.875rem] font-medium disabled:cursor-default",
        active
          ? available
            ? "bg-accent text-white"
            : "bg-warning text-white"
          : "bg-panel text-ink-2 hover:bg-surface",
        pending && !active && "opacity-60",
      )}
    >
      {available ? "Available" : "Out of stock"}
    </button>
  );
}

function ConfirmDelete() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-danger" disabled={pending}>
      {pending ? "Deleting…" : "Yes, delete"}
    </button>
  );
}

export function ProductCardActions({
  productId,
  name,
  available,
  hasPacks,
  canChangeStock,
  canDelete,
}: {
  productId: string;
  name: string;
  available: boolean;
  hasPacks: boolean;
  canChangeStock: boolean;
  canDelete: boolean;
}) {
  const [stockState, setStock] = useActionState<FormState, FormData>(setAvailableAction, {});
  const [deleteState, remove] = useActionState<FormState, FormData>(deleteFromListAction, {});
  const [asking, setAsking] = useState(false);

  const problem = [stockState, deleteState].find((state) => state.ok === false)?.message;

  if (asking) {
    return (
      <form action={remove} className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <input type="hidden" name="productId" value={productId} />
        <span className="mr-auto font-medium">Delete {name}?</span>
        <ConfirmDelete />
        <button type="button" className="btn btn-quiet" onClick={() => setAsking(false)}>
          No
        </button>
        {problem && (
          <p role="alert" className="w-full text-[0.875rem] text-danger">
            {problem}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-2 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {canChangeStock && hasPacks && (
          <form
            action={setStock}
            role="group"
            aria-label={`Is ${name} available?`}
            className="flex min-w-[11rem] flex-1 overflow-hidden rounded-md border border-line-strong"
          >
            <input type="hidden" name="productId" value={productId} />
            <StockButton available active={available} />
            <StockButton available={false} active={!available} />
          </form>
        )}

        <div className="ml-auto flex gap-2">
          <Link href={`/products/${productId}`} className="btn btn-quiet" aria-label={`Edit ${name}`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
          {canDelete && (
            <button
              type="button"
              className="btn btn-quiet text-danger"
              aria-label={`Delete ${name}`}
              onClick={() => setAsking(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>

      {problem && (
        <p role="alert" className="text-[0.875rem] text-danger">
          {problem}
        </p>
      )}
    </div>
  );
}
