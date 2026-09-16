"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCategory, saveCategory } from "@/app/(app)/categories/actions";
import type { FormState } from "@/app/(app)/products/actions";
import { TONES, suggestSlug } from "@/lib/taxonomy";
import type { TaxonomyRow } from "@/server/services/taxonomyService";
import { FormFeedback } from "@/components/products/FormFeedback";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

/**
 * One form for a range and for a type, and for creating and for editing.
 *
 * They differ in exactly two ways — whether there is a parent, and whether
 * there is a row to be stale against — and both are props. Four near-copies
 * of a form is how two of them end up validating differently.
 *
 * The slug follows the name **only while creating**. Renaming a published
 * range must not silently change its public URL: that is what people have
 * bookmarked and what search engines hold.
 */

function Submit({ label, dirty }: { label: string; dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
        {pending ? "Saving…" : label}
      </button>
      {dirty && !pending && <span className="text-[0.75rem] text-ink-3">Unsaved changes</span>}
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-[0.75rem] text-ink-3">{hint}</p>}
      {error && <p className="mt-1 text-[0.75rem] text-danger">{error}</p>}
    </div>
  );
}

export function CategoryForm({
  category,
  parentId,
  parentName,
  canEdit,
}: {
  /** Absent when creating. */
  category?: TaxonomyRow;
  /** Set when creating a type inside a range. */
  parentId?: string;
  parentName?: string;
  canEdit: boolean;
}) {
  const creating = !category;
  const [state, action] = useActionState<FormState, FormData>(
    creating ? createCategory : saveCategory,
    {},
  );
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!creating);
  const [dirty, setDirty] = useState(creating);

  useEffect(() => {
    if (state.ok) setDirty(false);
  }, [state]);

  // Not while creating: an untouched "new" form starts dirty so its button is
  // enabled, and warning about losing nothing would be noise.
  useUnsavedChangesWarning(dirty && (!creating || name.trim().length > 0));

  const isType = Boolean(parentId ?? category?.parentId);
  const noun = isType ? "type" : "range";
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={action} onChange={() => setDirty(true)} className="panel space-y-5 p-4" noValidate>
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      {category && (
        <input type="hidden" name="expectedUpdatedAt" value={category.updatedAt.toISOString()} />
      )}
      {creating && <input type="hidden" name="parentId" value={parentId ?? ""} />}

      <FormFeedback state={state} />

      {creating && parentName && (
        <p className="text-[0.8125rem] text-ink-2">
          A new type inside <strong className="font-medium text-ink">{parentName}</strong>.
        </p>
      )}

      <fieldset disabled={!canEdit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="name" label="Name" error={error("name")}>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(suggestSlug(e.target.value));
              }}
              required
              maxLength={80}
              className="field"
            />
          </Field>

          <Field
            id="slug"
            label="Slug"
            hint={
              creating
                ? "Follows the name until you change it."
                : `The public address: /products/${slug}`
            }
            error={error("slug")}
          >
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              required
              className="field font-mono text-[0.8125rem]"
            />
          </Field>

          <Field
            id="shortName"
            label="Short name"
            hint="For the header bar, where the full name will not fit."
            error={error("shortName")}
          >
            <input
              id="shortName"
              name="shortName"
              defaultValue={category?.shortName ?? ""}
              maxLength={40}
              className="field"
            />
          </Field>

          <Field
            id="sortOrder"
            label="Sort order"
            hint="Lower comes first. Ties fall back to the name."
            error={error("sortOrder")}
          >
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              max={9999}
              defaultValue={category?.sortOrder ?? 0}
              className="field w-28"
            />
          </Field>
        </div>

        <Field
          id="heroHeadline"
          label="Headline"
          hint={`Shown at the top of the ${noun}'s page.`}
          error={error("heroHeadline")}
        >
          <input
            id="heroHeadline"
            name="heroHeadline"
            defaultValue={category?.heroHeadline ?? ""}
            maxLength={120}
            className="field"
          />
        </Field>

        <Field id="description" label="Description" error={error("description")}>
          <textarea
            id="description"
            name="description"
            defaultValue={category?.description ?? ""}
            rows={3}
            maxLength={2000}
            className="field"
          />
        </Field>

        <details className="rounded-sm border border-line p-3">
          <summary className="cursor-pointer text-[0.8125rem] font-medium">
            Search engines and appearance
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field id="seoTitle" label="SEO title" hint="Blank uses the name." error={error("seoTitle")}>
              <input
                id="seoTitle"
                name="seoTitle"
                defaultValue={category?.seoTitle ?? ""}
                maxLength={70}
                className="field"
              />
            </Field>
            <Field
              id="seoDescription"
              label="SEO description"
              hint="Blank uses the description."
              error={error("seoDescription")}
            >
              <input
                id="seoDescription"
                name="seoDescription"
                defaultValue={category?.seoDescription ?? ""}
                maxLength={160}
                className="field"
              />
            </Field>
            <Field
              id="tone"
              label="Tint"
              hint="The colour behind the placeholder illustration, until a photograph is uploaded."
              error={error("tone")}
            >
              <select
                id="tone"
                name="tone"
                defaultValue={category?.tone ?? "cream"}
                className="field"
              >
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </details>

        {canEdit && <Submit label={creating ? `Create ${noun}` : "Save changes"} dirty={dirty} />}
      </fieldset>

      {!canEdit && (
        <p className="text-[0.8125rem] text-ink-3">
          Your account can see this but not change it.
        </p>
      )}
    </form>
  );
}
