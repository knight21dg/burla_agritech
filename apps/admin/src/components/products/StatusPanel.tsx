"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { changeStatus, type FormState } from "@/app/(app)/products/actions";
import type { ProductStatus } from "@burla/core/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { FormFeedback } from "./FormFeedback";

/**
 * Publishing.
 *
 * Its own panel, its own action, its own permission: editing a description and
 * deciding a product goes in front of customers are different decisions, and
 * `staff` may do the first but not the second.
 *
 * Archiving asks for confirmation because it takes the product off the site
 * and out of the ordinary lists. Publishing does not — it is the thing this
 * screen is for, and it is reversible in one click.
 */

function Action({ label, variant }: { label: string; variant: "primary" | "quiet" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn btn-${variant}`}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Working…" : label}
    </button>
  );
}

export function StatusPanel({
  productId,
  productSlug,
  status,
  warnings,
  blockers,
  storefrontUrl,
  canPublish,
}: {
  productId: string;
  productSlug: string;
  status: ProductStatus;
  warnings: string[];
  blockers: string[];
  storefrontUrl?: string;
  canPublish: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(changeStatus, {});
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold">Visibility</h2>
        <StatusBadge status={status} />
      </div>

      <p className="text-[0.8125rem] text-ink-2">
        {status === "published"
          ? "Customers can see and buy this."
          : status === "draft"
            ? "Only staff can see this. It is not on the site."
            : "Archived: off the site, and out of the ordinary lists."}
      </p>

      <FormFeedback state={state} />

      {blockers.length > 0 && status !== "published" && (
        <div className="rounded-sm border border-danger/25 bg-danger-soft px-3 py-2 text-[0.8125rem] text-danger">
          <p className="font-medium">Not ready to publish</p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-sm border border-warning/25 bg-warning-soft px-3 py-2 text-[0.8125rem] text-warning">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Missing, but not blocking
          </p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {canPublish ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {status !== "published" && (
            <form action={action}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="status" value="published" />
              <Action label="Publish" variant="primary" />
            </form>
          )}

          {status === "published" && (
            <form action={action}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="status" value="draft" />
              <Action label="Unpublish" variant="quiet" />
            </form>
          )}

          {status !== "archived" &&
            (confirmingArchive ? (
              <form action={action} className="flex items-center gap-2">
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="status" value="archived" />
                <span className="text-[0.8125rem] text-ink-2">Archive this product?</span>
                <Action label="Archive" variant="quiet" />
                <button
                  type="button"
                  onClick={() => setConfirmingArchive(false)}
                  className="text-[0.8125rem] text-ink-2 hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingArchive(true)}
                className="btn btn-quiet"
              >
                Archive
              </button>
            ))}

          {status === "archived" && (
            <form action={action}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="status" value="draft" />
              <Action label="Restore as draft" variant="quiet" />
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
          href={`${storefrontUrl}/products/p/${productSlug}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-accent hover:underline"
        >
          View on the site
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
