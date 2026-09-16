"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProductDetails, type FormState } from "@/app/(app)/products/actions";
import type { AdminProduct, TaxonomyOption } from "@/server/repositories/catalogueRepository";
import { FormFeedback } from "./FormFeedback";

/**
 * The product's own fields.
 *
 * Grouped the way someone thinks about a product — what it is, where it sits,
 * how it reads — rather than in column order. Pack sizes and publishing are
 * separate forms below, because they are separate decisions with separate
 * permissions and separate audit entries.
 *
 * The form carries the row's `updated_at` as it was drawn. If someone else
 * saves first, this save is refused rather than silently overwriting them.
 */

function Save({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save changes"}
      </button>
      {dirty && !pending && (
        <span className="text-[0.75rem] text-ink-3">Unsaved changes</span>
      )}
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
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[0.75rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductForm({
  product,
  taxonomy,
  canEdit,
}: {
  product: AdminProduct;
  taxonomy: TaxonomyOption[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProductDetails, {});
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [dirty, setDirty] = useState(false);

  // After a successful save the page revalidates and `product` arrives fresh,
  // so the form is clean again.
  useEffect(() => {
    if (state.ok) setDirty(false);
  }, [state]);

  const categories = taxonomy.filter((t) => t.parentId === null);
  const types = taxonomy.filter((t) => t.parentId === categoryId);
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      className="panel space-y-5 p-4"
      noValidate
    >
      <input type="hidden" name="productId" value={product.id} />
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={product.updatedAt.toISOString()}
      />

      <FormFeedback state={state} />

      <fieldset disabled={!canEdit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="name" label="Name" error={error("name")}>
            <input
              id="name"
              name="name"
              defaultValue={product.name}
              required
              maxLength={120}
              aria-invalid={error("name") ? true : undefined}
              className="field"
            />
          </Field>

          <Field
            id="slug"
            label="Slug"
            hint={`The public address: /products/p/${product.slug}`}
            error={error("slug")}
          >
            <input
              id="slug"
              name="slug"
              defaultValue={product.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              aria-invalid={error("slug") ? true : undefined}
              className="field font-mono text-[0.8125rem]"
            />
          </Field>

          <Field id="categoryId" label="Range" error={error("categoryId")}>
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="field"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="typeId"
            label="Type"
            hint={
              types.length === 0
                ? "This range has no types — products sit in it directly."
                : undefined
            }
            error={error("typeId")}
          >
            <select
              id="typeId"
              name="typeId"
              defaultValue={product.typeId ?? ""}
              key={categoryId}
              className="field"
              disabled={types.length === 0}
            >
              <option value="">None</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          id="shortDescriptor"
          label="Short descriptor"
          hint="One line, under a product card and in search results. 90 characters."
          error={error("shortDescriptor")}
        >
          <input
            id="shortDescriptor"
            name="shortDescriptor"
            defaultValue={product.shortDescriptor}
            maxLength={90}
            className="field"
          />
        </Field>

        <Field
          id="description"
          label="Description"
          hint="The paragraph on the product page."
          error={error("description")}
        >
          <textarea
            id="description"
            name="description"
            defaultValue={product.description}
            rows={5}
            maxLength={5000}
            className="field"
          />
        </Field>

        <details className="rounded-sm border border-line p-3">
          <summary className="cursor-pointer text-[0.8125rem] font-medium">
            Search engines and ordering
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field
              id="seoTitle"
              label="SEO title"
              hint="Blank uses the product name."
              error={error("seoTitle")}
            >
              <input
                id="seoTitle"
                name="seoTitle"
                defaultValue={product.seoTitle ?? ""}
                maxLength={70}
                className="field"
              />
            </Field>
            <Field
              id="seoDescription"
              label="SEO description"
              hint="Blank uses the short descriptor."
              error={error("seoDescription")}
            >
              <input
                id="seoDescription"
                name="seoDescription"
                defaultValue={product.seoDescription ?? ""}
                maxLength={160}
                className="field"
              />
            </Field>
            <Field
              id="sortOrder"
              label="Sort order"
              hint="Lower comes first in its range. Ties fall back to the name."
              error={error("sortOrder")}
            >
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={product.sortOrder}
                className="field w-28"
              />
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[0.8125rem]">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product.featured}
                  className="size-4"
                />
                Show on the homepage
              </label>
            </div>
          </div>
        </details>

        {canEdit && <Save dirty={dirty} />}
      </fieldset>

      {!canEdit && (
        <p className="text-[0.8125rem] text-ink-3">
          Your account can see this product but not change it.
        </p>
      )}
    </form>
  );
}
