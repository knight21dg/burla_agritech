"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { submitEnquiry } from "@/app/contact/actions";
import { BulkQuantity } from "./BulkQuantity";

type Kind = "contact" | "wholesale";
type Status = "idle" | "submitting" | "success" | "error";

interface Errors {
  [field: string]: string | undefined;
}

/**
 * Contact and wholesale enquiry form (FR-100, FR-101).
 *
 * Checked here for a quick answer, then sent to `submitEnquiry`, which checks
 * again with a strict schema, saves the enquiry to the database — where the
 * owner reads it in the admin — and returns field errors if anything was
 * refused. The server's answer is the one that counts.
 */
export function EnquiryForm({
  kind,
  categories,
}: {
  kind: Kind;
  /** The ranges offered in "What are you interested in?" — from the page. */
  categories: Category[];
}) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();

  const wholesale = kind === "wholesale";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("kind", kind);
    setFormError(undefined);
    const next: Errors = {};

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();

    if (name.length < 2) next.name = "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email))
      next.email = "Please enter a valid email address.";
    if (phone && !/^[+\d][\d\s-]{7,}$/.test(phone))
      next.phone = "Please enter a valid phone number.";
    if (message.length < 10)
      next.message = "Please tell us a little more — at least 10 characters.";
    if (wholesale && company.length < 2)
      next.company = "Please enter your company name.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = document.getElementById(`${id}-${Object.keys(next)[0]}`);
      first?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitEnquiry(data);
      if (result.ok) {
        setStatus("success");
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      setStatus("idle");
    } catch {
      setFormError("Your message could not be sent just now. Please try again, or call us.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border border-green/40 bg-white px-6 py-8 text-center"
      >
        <CheckCircle2
          className="mx-auto size-8 text-green"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h3 className="t-h3 mt-4">Thank you — we have your enquiry</h3>
        <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-ink-2">
          Someone from the team will come back to you. If it is urgent, WhatsApp
          is faster.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-terracotta/30 bg-white px-3 py-2 text-[0.875rem] text-ink"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden="true" />
          {formError}
        </p>
      )}
      {/* Honeypot — real submissions leave this empty */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${id}-name`} name="name" label="Name" required error={errors.name} />
        {wholesale ? (
          <Field
            id={`${id}-company`}
            name="company"
            label="Company"
            required
            error={errors.company}
          />
        ) : (
          <Field
            id={`${id}-phone`}
            name="phone"
            label="Phone"
            type="tel"
            error={errors.phone}
          />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${id}-email`}
          name="email"
          label="Email"
          type="email"
          required
          error={errors.email}
        />
        {wholesale ? (
          <Field
            id={`${id}-phone`}
            name="phone"
            label="Phone"
            type="tel"
            error={errors.phone}
          />
        ) : (
          <Field id={`${id}-subject`} name="subject" label="Subject" />
        )}
      </div>

      {wholesale && (
        <>
          <Field id={`${id}-country`} name="country" label="Country" />
          {/* Bulk buyers think in tonnes: a number with - and + and a few
              common amounts, rather than a box to write a sentence in. */}
          <BulkQuantity />
        </>
      )}

      {wholesale && (
        <div>
          <label
            htmlFor={`${id}-interest`}
            className="block text-[0.875rem] font-medium text-ink"
          >
            Product interest
          </label>
          <select
            id={`${id}-interest`}
            name="interest"
            className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-ink outline-none focus:border-green-700"
            defaultValue=""
          >
            <option value="">Select a range</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value="multiple">Several ranges</option>
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor={`${id}-message`}
          className="block text-[0.875rem] font-medium text-ink"
        >
          Message <span className="text-terracotta">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          className={cn(
            "mt-1.5 w-full rounded-sm border bg-white px-3 py-2.5 text-ink outline-none",
            errors.message
              ? "border-danger focus:border-danger"
              : "border-line focus:border-green-700",
          )}
        />
        {errors.message && (
          <FieldError id={`${id}-message-error`}>{errors.message}</FieldError>
        )}
      </div>

      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting" && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {status === "submitting" ? "Sending…" : "Send message"}
      </Button>

      <p className="text-[0.8125rem] leading-relaxed text-ink-3">
        We use your details only to answer this enquiry. Demo build — this form
        does not yet send anything.
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.875rem] font-medium text-ink">
        {label} {required && <span className="text-terracotta">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-1.5 h-11 w-full rounded-sm border bg-white px-3 text-ink outline-none",
          error
            ? "border-danger focus:border-danger"
            : "border-line focus:border-green-700",
        )}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-danger"
    >
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
