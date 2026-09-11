"use client";

import { useId, useState, type FormEvent } from "react";
import { Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  INDIAN_STATES,
  addressErrors,
  addressSchema,
  type Address,
  type AddressField,
} from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { SelectField, TextField } from "./fields";

/** Typed as "98765 43210", "+91 98765 43210" or "098765 43210" — keep the ten digits. */
function normaliseMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** The order the fields appear in, so the first error found is the first on screen. */
const FIELD_ORDER: AddressField[] = [
  "fullName",
  "mobile",
  "pincode",
  "line1",
  "line2",
  "landmark",
  "city",
  "state",
  "kind",
];

/**
 * The delivery address, in the fields and order an Indian courier address
 * uses — the same as Amazon and Flipkart ask for. Each field carries the
 * browser's autofill hint, so a saved address fills it in one tap.
 *
 * Checked against the shared schema (`addressSchema`) on submit: the first
 * field with a problem takes focus, and every problem is shown by its field.
 * The server checks the same rules again when the order is placed.
 */
export function AddressForm({
  initial,
  onSubmit,
}: {
  initial?: Address;
  onSubmit: (address: Address) => void;
}) {
  const id = useId();
  const [errors, setErrors] = useState<Partial<Record<AddressField, string>>>({});
  const [kind, setKind] = useState<Address["kind"]>(initial?.kind ?? "home");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "");

    const parsed = addressSchema.safeParse({
      fullName: value("fullName"),
      mobile: normaliseMobile(value("mobile")),
      pincode: value("pincode").replace(/\s/g, ""),
      line1: value("line1"),
      line2: value("line2"),
      landmark: value("landmark"),
      city: value("city"),
      state: value("state"),
      kind,
    });

    if (!parsed.success) {
      const next = addressErrors(parsed.error);
      setErrors(next);
      const first = FIELD_ORDER.find((f) => next[f]);
      if (first) document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  const field = (name: AddressField) => ({
    id: `${id}-${name}`,
    name,
    error: errors[name],
    defaultValue: initial?.[name],
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField {...field("fullName")} label="Full name" autoComplete="name" />
        <TextField
          {...field("mobile")}
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          prefix="+91"
          maxLength={14}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          {...field("pincode")}
          label="PIN code"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={7}
        />
      </div>

      <TextField
        {...field("line1")}
        label="Flat, house no., building"
        autoComplete="address-line1"
      />
      <TextField
        {...field("line2")}
        label="Area, street, village"
        autoComplete="address-line2"
      />
      <TextField {...field("landmark")} label="Landmark" optional />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField {...field("city")} label="Town or city" autoComplete="address-level2" />
        <SelectField
          {...field("state")}
          defaultValue={initial?.state ?? ""}
          label="State"
          autoComplete="address-level1"
        >
          <option value="" disabled>
            Choose a state
          </option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset>
        <legend className="text-[0.875rem] font-medium text-ink">Address type</legend>
        <div className="mt-2 flex gap-3">
          {(
            [
              { value: "home", label: "Home", Icon: Home },
              { value: "work", label: "Work", Icon: Briefcase },
            ] as const
          ).map(({ value, label, Icon }) => (
            <label
              key={value}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.875rem] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                kind === value
                  ? "border-green-700 bg-green-50 text-green-700"
                  : "border-line text-ink hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-[16rem]">
        Deliver to this address
      </Button>
    </form>
  );
}
