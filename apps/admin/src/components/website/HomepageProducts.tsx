"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { setFeaturedAction } from "@/app/(app)/website/actions";
import type { FormState } from "@/lib/formState";
import { FormFeedback } from "@/components/ui/FormFeedback";

interface Item {
  id: string;
  name: string;
}

function Busy({ children, className, label }: { children: React.ReactNode; className: string; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-label={label}>
      {children}
    </button>
  );
}

/** The products shown under "Featured Products" on the homepage. */
export function HomepageProducts({ featured, available }: { featured: Item[]; available: Item[] }) {
  const [state, action] = useActionState<FormState, FormData>(setFeaturedAction, {});

  return (
    <div className="space-y-3">
      <FormFeedback state={state} />

      {featured.length === 0 ? (
        <p className="rounded-md bg-surface px-3 py-2 text-ink-2">No products are on the homepage yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {featured.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium">{item.name}</span>
              <form action={action}>
                <input type="hidden" name="productId" value={item.id} />
                <input type="hidden" name="featured" value="false" />
                <Busy className="btn btn-quiet" label={`Take ${item.name} off the homepage`}>
                  <X className="size-4" aria-hidden="true" />
                  Remove
                </Busy>
              </form>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="featured" value="true" />
          <div className="min-w-56 flex-1">
            <label htmlFor="add-featured" className="label">
              Add a product to the homepage
            </label>
            <select id="add-featured" name="productId" defaultValue="" className="field mt-1.5">
              <option value="" disabled>
                Choose a product
              </option>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <Busy className="btn btn-quiet">
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Busy>
        </form>
      )}
    </div>
  );
}
