"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, X } from "lucide-react";
import { saveCategoryAction } from "@/app/(app)/categories/actions";
import type { FormState } from "@/lib/formState";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { YesNo } from "@/components/ui/YesNo";
import type { EditableCategory } from "@/server/categories";

/** Name, photo, description, and whether it is on the website. That's all. */

function SaveButton({ adding, dirty }: { adding: boolean; dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-44" disabled={pending || (!adding && !dirty)}>
      {pending ? "Saving…" : adding ? "Save category" : "Save changes"}
    </button>
  );
}

export function CategoryEditor({ category }: { category?: EditableCategory }) {
  const adding = !category;

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [visible, setVisible] = useState(category?.visible ?? true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(category?.photoUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  // After a successful save the form is clean again and the chosen file is cleared.
  const [state, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await saveCategoryAction(previous, form);
    if (result.ok) {
      setDirty(false);
      setHasNewPhoto(false);
      setRemovePhoto(false);
      if (fileInput.current) fileInput.current.value = "";
    }
    return result;
  }, {});

  useUnsavedChangesWarning(dirty);

  const error = (field: string) => state.fieldErrors?.[field];
  const payload = JSON.stringify({
    name,
    description,
    visible,
    removePhoto: removePhoto && !hasNewPhoto,
    ...(category ? { expectedUpdatedAt: category.updatedAt } : {}),
  });

  return (
    <form action={action} className="panel space-y-5 p-4 sm:p-5" noValidate>
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <input type="hidden" name="category" value={payload} />

      <FormFeedback state={state} />

      <div>
        <label htmlFor="name" className="label">
          Category name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            touch();
          }}
          placeholder="For example: Pickles"
          aria-invalid={error("name") ? true : undefined}
          className="field mt-1.5"
        />
        {error("name") && <p className="mt-1.5 text-[0.875rem] font-medium text-danger">{error("name")}</p>}
      </div>

      <div>
        <span className="label">Category photo</span>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid h-28 w-36 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
            {photoPreview && !removePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- a preview
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[0.875rem] text-ink-3">No photo</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPhotoPreview(URL.createObjectURL(file));
                setHasNewPhoto(true);
                setRemovePhoto(false);
                touch();
              }}
            />
            <label htmlFor="photo" className="btn btn-quiet cursor-pointer">
              <ImagePlus className="size-4" aria-hidden="true" />
              {photoPreview && !removePhoto ? "Change photo" : "Add photo"}
            </label>
            {photoPreview && !removePhoto && (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setRemovePhoto(true);
                  setHasNewPhoto(false);
                  if (fileInput.current) fileInput.current.value = "";
                  touch();
                }}
              >
                <X className="size-4" aria-hidden="true" />
                Remove photo
              </button>
            )}
          </div>
        </div>
        {error("photo") && <p className="mt-1.5 text-[0.875rem] font-medium text-danger">{error("photo")}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            touch();
          }}
          rows={3}
          className="field mt-1.5"
        />
      </div>

      <div>
        <span className="label">Show on website?</span>
        <p className="hint">When this is No, the category and its page are hidden from customers.</p>
        <div className="mt-2">
          <YesNo
            label="Show on website?"
            value={visible}
            onChange={(next) => {
              setVisible(next);
              touch();
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton adding={adding} dirty={dirty} />
        {dirty && <span className="hint">You have changes that are not saved yet.</span>}
      </div>
    </form>
  );
}
