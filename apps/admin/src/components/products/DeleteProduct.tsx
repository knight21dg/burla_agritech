"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/(app)/products/actions";

/**
 * Deleting a product — kept apart from Save, at the bottom, and asked twice.
 *
 * To the owner the product is gone: off the website and out of the list.
 * Underneath it is kept, because past orders still name it.
 */

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-danger" disabled={pending}>
      {pending ? "Deleting…" : "Yes, delete it"}
    </button>
  );
}

export function DeleteProduct({ productId, name }: { productId: string; name: string }) {
  const [asking, setAsking] = useState(false);

  return (
    <section className="panel border-danger/20 p-4 sm:p-5">
      <h2 className="text-[1.0625rem] font-semibold">Delete this product</h2>
      <p className="mt-0.5 text-ink-2">
        It will be removed from the website and from this list. Past orders keep their details.
      </p>

      {asking ? (
        <form action={deleteProductAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="productId" value={productId} />
          <span className="font-medium">Delete {name}?</span>
          <Confirm />
          <button type="button" className="btn btn-quiet" onClick={() => setAsking(false)}>
            No, keep it
          </button>
        </form>
      ) : (
        <button type="button" className="btn btn-danger mt-3" onClick={() => setAsking(true)}>
          <Trash2 className="size-4" aria-hidden="true" />
          Delete product
        </button>
      )}
    </section>
  );
}
