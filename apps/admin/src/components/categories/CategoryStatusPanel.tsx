"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink } from "lucide-react";
import type { CategoryStatus } from "@burla/core/db/schema";
import {
  changeCategoryStatus,
  deleteCategory,
} from "@/app/(app)/categories/actions";
import type { FormState } from "@/app/(app)/products/actions";
import { CategoryStatusBadge } from "./CategoryStatusBadge";
import { FormFeedback } from "@/components/products/FormFeedback";

/**
 * Visibility, and the one destructive button in the catalogue.
 *
 * Deleting asks first, and only ever succeeds on something empty — the
 * service checks, and the database would refuse anyway. A range with products
 * is hidden instead, which is why "hidden" exists as a state.
 */

function Action({ label, variant }: { label: string; variant: "primary" | "quiet" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant}`} disabled={pending}>
      {pending ? "Working…" : label}
    </button>
  );
}

export function CategoryStatusPanel({
  categoryId,
  slug,
  parentSlug,
  status,
  productCount,
  isType,
  storefrontUrl,
  canPublish,
  canDelete,
}: {
  categoryId: string;
  slug: string;
  parentSlug?: string;
  status: CategoryStatus;
  productCount: number;
  isType: boolean;
  storefrontUrl?: string;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(changeCategoryStatus, {});
  const [removeState, removeAction] = useActionState<FormState, FormData>(deleteCategory, {});
  const [confirming, setConfirming] = useState(false);

  const publicPath = isType ? `/products/${parentSlug}/${slug}` : `/products/${slug}`;
  const empty = productCount === 0;

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold">Visibility</h2>
        <CategoryStatusBadge status={status} />
      </div>

      <p className="text-[0.8125rem] text-ink-2">
        {status === "published"
          ? "In the navigation, and on the site."
          : status === "hidden"
            ? "Not in the navigation. The page still works for anyone with the link."
            : "A draft. Not on the site at all."}
      </p>

      <FormFeedback state={state} />
      <FormFeedback state={removeState} />

      {canPublish ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {status !== "published" && (
            <form action={action}>
              <input type="hidden" name="categoryId" value={categoryId} />
              <input type="hidden" name="status" value="published" />
              <Action label="Publish" variant="primary" />
            </form>
          )}
          {status !== "hidden" && (
            <form action={action}>
              <input type="hidden" name="categoryId" value={categoryId} />
              <input type="hidden" name="status" value="hidden" />
              <Action label="Hide" variant="quiet" />
            </form>
          )}
          {status !== "draft" && (
            <form action={action}>
              <input type="hidden" name="categoryId" value={categoryId} />
              <input type="hidden" name="status" value="draft" />
              <Action label="Back to draft" variant="quiet" />
            </form>
          )}
        </div>
      ) : (
        <p className="text-[0.8125rem] text-ink-3">
          Your account cannot change what is on the site.
        </p>
      )}

      {status === "published" && storefrontUrl && (
        <a
          href={`${storefrontUrl}${publicPath}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-accent hover:underline"
        >
          View on the site
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}

      {canDelete && (
        <div className="border-t border-line pt-3">
          {empty ? (
            confirming ? (
              <form action={removeAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="categoryId" value={categoryId} />
                <span className="text-[0.8125rem] text-ink-2">
                  Delete this permanently?
                </span>
                <Action label="Delete" variant="quiet" />
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[0.8125rem] text-ink-2 hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-[0.8125rem] text-danger hover:underline"
              >
                Delete
              </button>
            )
          ) : (
            <p className="text-[0.75rem] text-ink-3">
              Holds {productCount} {productCount === 1 ? "product" : "products"}, so it
              cannot be deleted. Hide it instead.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
