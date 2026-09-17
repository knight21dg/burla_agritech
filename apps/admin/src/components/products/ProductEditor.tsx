"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { saveProductAction } from "@/app/(app)/products/actions";
import type { FormState } from "@/lib/formState";
import { PACK_SIZE_HELP } from "@/lib/packSize";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { YesNo } from "@/components/ui/YesNo";
import type { EditableProduct } from "@/server/products";

/**
 * Adding or editing a product — one screen, one Save.
 *
 * In the order someone thinks about a product: what it looks like, what it is
 * called, where it goes, what it costs, and whether customers can see it.
 * Anything a developer might need but the owner does not sits under
 * "More options", closed.
 */

interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

interface Pack {
  /** The pack's id, or "new". */
  id: string;
  /** A key for React that stays put while rows are added and removed. */
  key: string;
  size: string;
  price: string;
  available: boolean;
}


function SaveButton({ adding, dirty }: { adding: boolean; dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary w-full sm:w-auto sm:min-w-44"
      disabled={pending || (!adding && !dirty)}
    >
      {pending ? "Saving…" : adding ? "Save product" : "Save changes"}
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      {hint && <p className="hint mt-0.5">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[0.875rem] font-medium text-danger">
      {message}
    </p>
  );
}

export function ProductEditor({
  product,
  categories,
  canPublish,
}: {
  /** Absent when adding a new product. */
  product?: EditableProduct;
  categories: CategoryOption[];
  canPublish: boolean;
}) {
  const adding = !product;

  const topLevel = categories.filter((c) => c.parentId === null);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(product?.subcategoryId ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [visible, setVisible] = useState(product?.visible ?? true);
  // Row keys must be identical on the server and in the browser, or the
  // labels lose their boxes after the page loads. Existing packs use their own
  // id; rows added later get a number from a counter that only ever runs in
  // the browser, in response to a click.
  const [packs, setPacks] = useState<Pack[]>(() =>
    product?.packs.length
      ? product.packs.map((p) => ({ ...p, key: p.id, price: String(p.price) }))
      : [{ id: "new", key: "new-0", size: "", price: "", available: true }],
  );
  const added = useRef(0);
  const newKey = () => `new-${(added.current += 1)}`;
  const [shortLine, setShortLine] = useState(product?.advanced.shortLine ?? "");
  const [webAddress, setWebAddress] = useState(product?.advanced.webAddress ?? "");
  const [onHomepage, setOnHomepage] = useState(product?.advanced.onHomepage ?? false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(product?.photoUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  // After a successful save the form is clean again and the chosen file is cleared.
  const [state, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await saveProductAction(previous, form);
    if (result.ok) {
      setDirty(false);
      setHasNewPhoto(false);
      setRemovePhoto(false);
      if (fileInput.current) fileInput.current.value = "";
    }
    return result;
  }, {});

  useUnsavedChangesWarning(dirty);

  // A photo chosen from the phone or computer shows at once, before saving.
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const subcategories = useMemo(
    () => categories.filter((c) => c.parentId === categoryId),
    [categories, categoryId],
  );

  const error = (field: string) => state.fieldErrors?.[field];

  const payload = JSON.stringify({
    name,
    categoryId,
    subcategoryId: subcategories.some((s) => s.id === subcategoryId) ? subcategoryId : "",
    description,
    visible,
    packs: packs.map(({ id, size, price, available }) => ({
      id,
      size,
      price: price === "" ? 0 : Number(price),
      available,
    })),
    advanced: { shortLine, webAddress, onHomepage },
    removePhoto: removePhoto && !hasNewPhoto,
    ...(product ? { expectedUpdatedAt: product.updatedAt } : {}),
  });

  const updatePack = (index: number, patch: Partial<Pack>) => {
    setPacks((current) => current.map((pack, i) => (i === index ? { ...pack, ...patch } : pack)));
    touch();
  };

  return (
    <form action={action} className="space-y-4" noValidate>
      {product && <input type="hidden" name="productId" value={product.id} />}
      <input type="hidden" name="product" value={payload} />

      <FormFeedback state={state} />

      {/* ------------------------------------------------------------ Photo */}
      <Section title="Photo">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-40 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
            {photoPreview && !removePhoto ? (
              // A preview of the shop's own photo or a file just chosen; nothing to optimise.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="px-3 text-center text-[0.875rem] text-ink-3">No photo</span>
            )}
          </div>

          <div className="space-y-2">
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
            <div className="flex flex-wrap gap-2">
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
            <p className="hint">A clear photo on a plain background works best. JPG or PNG.</p>
            <ErrorText id="photo-error" message={error("photo")} />
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- Details */}
      <Section title="Product">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Product name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
              placeholder="For example: Moringa Powder"
              aria-invalid={error("name") ? true : undefined}
              aria-describedby={error("name") ? "name-error" : undefined}
              className="field mt-1.5"
            />
            <ErrorText id="name-error" message={error("name")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="label">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                  touch();
                }}
                aria-invalid={error("categoryId") ? true : undefined}
                className="field mt-1.5"
              >
                <option value="">Choose a category</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ErrorText id="category-error" message={error("categoryId")} />
            </div>

            {subcategories.length > 0 && (
              <div>
                <label htmlFor="subcategory" className="label">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  value={subcategoryId}
                  onChange={(e) => {
                    setSubcategoryId(e.target.value);
                    touch();
                  }}
                  className="field mt-1.5"
                >
                  <option value="">None</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              rows={4}
              placeholder="What it is, how to use it, what makes it good."
              className="field mt-1.5"
            />
            <ErrorText id="description-error" message={error("description")} />
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------- Price and packs */}
      <Section title="Price and pack sizes" hint={PACK_SIZE_HELP}>
        <ul className="space-y-3">
          {packs.map((pack, index) => (
            <li
              key={pack.key}
              className="grid grid-cols-1 gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end sm:border-0 sm:p-0"
            >
              <div>
                <label htmlFor={`size-${pack.key}`} className="label">
                  Pack size
                </label>
                <input
                  id={`size-${pack.key}`}
                  value={pack.size}
                  onChange={(e) => updatePack(index, { size: e.target.value })}
                  placeholder="500 g"
                  aria-invalid={error(`packs.${index}.size`) ? true : undefined}
                  className="field mt-1.5"
                />
                <ErrorText id={`size-${pack.key}-error`} message={error(`packs.${index}.size`)} />
              </div>

              <div>
                <label htmlFor={`price-${pack.key}`} className="label">
                  Price (₹)
                </label>
                <input
                  id={`price-${pack.key}`}
                  value={pack.price}
                  onChange={(e) => updatePack(index, { price: e.target.value.replace(/[^\d.]/g, "") })}
                  inputMode="decimal"
                  placeholder="250"
                  aria-invalid={error(`packs.${index}.price`) ? true : undefined}
                  className="field mt-1.5"
                />
                <ErrorText id={`price-${pack.key}-error`} message={error(`packs.${index}.price`)} />
              </div>

              <div>
                <span className="label" id={`available-${pack.key}`}>
                  Available?
                </span>
                <div className="mt-1.5">
                  <YesNo
                    label={`Is the ${pack.size || "pack"} available?`}
                    value={pack.available}
                    onChange={(available) => updatePack(index, { available })}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPacks((current) => current.filter((_, i) => i !== index));
                  touch();
                }}
                className="btn btn-quiet sm:px-3"
                aria-label={`Delete the ${pack.size || "new"} pack size`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sm:sr-only">Delete</span>
              </button>

              {/* Stock is changed on its own screen, where supply and counts are recorded. */}
              {pack.id !== "new" && product && (
                <p className="text-[0.875rem] text-ink-3 sm:col-span-4">
                  {(() => {
                    const packets = product.packs.find((saved) => saved.id === pack.id)?.packets;
                    return packets === null || packets === undefined
                      ? "Stock: not counted. "
                      : `Stock: ${packets} ${packets === 1 ? "packet" : "packets"}. `;
                  })()}
                  <Link href={`/stock?q=${encodeURIComponent(product.name)}`} className="underline underline-offset-2 hover:text-ink">
                    Change stock
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>

        {packs.length === 0 && (
          <p className="rounded-md bg-surface px-3 py-2 text-[0.9375rem] text-ink-2">
            No pack sizes. Add one so customers can buy this product.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setPacks((current) => [
              ...current,
              { id: "new", key: newKey(), size: "", price: "", available: true },
            ]);
            touch();
          }}
          className="btn btn-quiet mt-3"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add pack size
        </button>
      </Section>

      {/* ---------------------------------------------------------- Website */}
      <Section title="Website">
        <span className="label" id="visible-label">
          Show on website?
        </span>
        <p className="hint">When this is No, customers cannot see or buy the product.</p>
        <div className="mt-2">
          <YesNo
            label="Show on website?"
            value={visible}
            onChange={(next) => {
              setVisible(next);
              touch();
            }}
            disabled={!canPublish}
            invalid={Boolean(error("visible"))}
          />
        </div>
        <ErrorText id="visible-error" message={error("visible")} />

        <details className="mt-5 rounded-md border border-line px-3 py-2">
          <summary className="cursor-pointer py-1 text-[0.9375rem] font-semibold text-ink-2">
            More options
          </summary>
          <div className="space-y-4 pb-2 pt-3">
            <div>
              <span className="label">Show on the homepage?</span>
              <p className="hint">Adds it to the featured products on the homepage.</p>
              <div className="mt-2">
                <YesNo
                  label="Show on the homepage?"
                  value={onHomepage}
                  onChange={(next) => {
                    setOnHomepage(next);
                    touch();
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="shortLine" className="label">
                Short line under the name <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="shortLine"
                value={shortLine}
                maxLength={90}
                onChange={(e) => {
                  setShortLine(e.target.value);
                  touch();
                }}
                placeholder="For example: Sun-dried and stone-ground"
                className="field mt-1.5"
              />
              <ErrorText id="shortLine-error" message={error("advanced.shortLine")} />
            </div>

            <div>
              <label htmlFor="webAddress" className="label">
                Web address
              </label>
              <p className="hint">
                The end of this product&rsquo;s link. Leave it as it is unless you have a reason —
                changing it breaks links people have saved.
              </p>
              <div className="mt-1.5 flex items-center overflow-hidden rounded-md border border-line-strong">
                <span className="shrink-0 bg-surface px-3 py-2.5 text-[0.875rem] text-ink-3">
                  /products/p/
                </span>
                <input
                  id="webAddress"
                  value={webAddress}
                  onChange={(e) => {
                    setWebAddress(e.target.value.toLowerCase());
                    touch();
                  }}
                  placeholder={adding ? "made from the name" : ""}
                  className="min-h-11 w-full min-w-0 border-0 px-2 outline-none"
                />
              </div>
              <ErrorText id="webAddress-error" message={error("advanced.webAddress")} />
            </div>
          </div>
        </details>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton adding={adding} dirty={dirty} />
          {dirty && <span className="hint">You have changes that are not saved yet.</span>}
        </div>
      </div>
    </form>
  );
}
