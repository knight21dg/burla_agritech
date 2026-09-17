"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveOfferStripAction } from "@/app/(app)/website/actions";
import type { FormState } from "@/lib/formState";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { YesNo } from "@/components/ui/YesNo";
import { OFFER_ICONS, OFFER_LINKS, type Offer, type OfferIcon, type OfferLink, type OfferStrip } from "@burla/core/content";

/**
 * The offers strip, as a short list the owner can change: each offer has a
 * picture, a title, one line under it, and where it leads. Add, remove, move
 * up and down, and whether the strip shows at all. One Save.
 */

const ICON_LABEL: Record<OfferIcon, string> = {
  truck: "Delivery truck",
  percent: "Discount",
  package: "Parcel",
  handshake: "Handshake",
  phone: "Phone",
  leaf: "Leaf",
  gift: "Gift",
  star: "Star",
};

const MAX = 8;

function Save({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-44" disabled={pending || !dirty}>
      {pending ? "Saving…" : "Save offers"}
    </button>
  );
}

type Row = Offer & { key: number };

export function OfferStripForm({ strip }: { strip: OfferStrip }) {
  const counter = useRef(strip.offers.length);
  const [visible, setVisible] = useState(strip.visible);
  const [rows, setRows] = useState<Row[]>(() => strip.offers.map((offer, index) => ({ ...offer, key: index })));
  const [dirty, setDirty] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await saveOfferStripAction(previous, form);
    if (result.ok) setDirty(false);
    return result;
  }, {});
  useUnsavedChangesWarning(dirty);

  const change = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };
  const update = (index: number, patch: Partial<Offer>) =>
    change(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const move = (index: number, by: -1 | 1) => {
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(index + by, 0, row!);
    change(next);
  };

  const payload = JSON.stringify({
    visible,
    offers: rows.map(({ icon, title, text, link }) => ({ icon, title, text, link })),
  });
  const error = (path: string) => state.fieldErrors?.[path];

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="offerStrip" value={payload} />
      <FormFeedback state={state} />

      <div>
        <span className="label">Show the offers strip on the website?</span>
        <div className="mt-1.5">
          <YesNo
            label="Show the offers strip on the website?"
            value={visible}
            onChange={(next) => {
              setVisible(next);
              setDirty(true);
            }}
          />
        </div>
      </div>

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.key} className="rounded-md border border-line p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Offer {index + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-quiet px-2.5"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move offer ${index + 1} up`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-quiet px-2.5"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move offer ${index + 1} down`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-quiet px-2.5 text-danger"
                  onClick={() => change(rows.filter((_, i) => i !== index))}
                  disabled={rows.length === 1}
                  aria-label={`Remove offer ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`offer-title-${row.key}`} className="label">
                  Title
                </label>
                <input
                  id={`offer-title-${row.key}`}
                  value={row.title}
                  maxLength={40}
                  onChange={(e) => update(index, { title: e.target.value })}
                  placeholder="Bulk Orders Welcome"
                  aria-invalid={error(`offers.${index}.title`) ? true : undefined}
                  className="field mt-1.5"
                />
                {error(`offers.${index}.title`) && (
                  <p className="mt-1 text-[0.875rem] font-medium text-danger">{error(`offers.${index}.title`)}</p>
                )}
              </div>
              <div>
                <label htmlFor={`offer-text-${row.key}`} className="label">
                  Line under it (optional)
                </label>
                <input
                  id={`offer-text-${row.key}`}
                  value={row.text}
                  maxLength={60}
                  onChange={(e) => update(index, { text: e.target.value })}
                  placeholder="For retailers, distributors & businesses"
                  aria-invalid={error(`offers.${index}.text`) ? true : undefined}
                  className="field mt-1.5"
                />
                {error(`offers.${index}.text`) && (
                  <p className="mt-1 text-[0.875rem] font-medium text-danger">{error(`offers.${index}.text`)}</p>
                )}
              </div>
              <div>
                <label htmlFor={`offer-icon-${row.key}`} className="label">
                  Picture
                </label>
                <select
                  id={`offer-icon-${row.key}`}
                  value={row.icon}
                  onChange={(e) => update(index, { icon: e.target.value as OfferIcon })}
                  className="field mt-1.5"
                >
                  {OFFER_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {ICON_LABEL[icon]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`offer-link-${row.key}`} className="label">
                  When someone clicks it, open
                </label>
                <select
                  id={`offer-link-${row.key}`}
                  value={row.link}
                  onChange={(e) => update(index, { link: e.target.value as OfferLink })}
                  className="field mt-1.5"
                >
                  {(Object.keys(OFFER_LINKS) as OfferLink[]).map((link) => (
                    <option key={link} value={link}>
                      {OFFER_LINKS[link].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {error("offers") && <p className="text-[0.875rem] font-medium text-danger">{error("offers")}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-quiet"
          disabled={rows.length >= MAX}
          onClick={() => {
            counter.current += 1;
            change([...rows, { key: counter.current, icon: "star", title: "", text: "", link: "none" }]);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add an offer
        </button>
        {rows.length >= MAX && <span className="hint">Up to {MAX} offers.</span>}
      </div>

      <Save dirty={dirty} />
    </form>
  );
}
