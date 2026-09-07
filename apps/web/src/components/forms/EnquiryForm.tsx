"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/catalog";
import { cn } from "@/lib/utils";

type Kind = "contact" | "wholesale";
type Status = "idle" | "submitting" | "success" | "error";

interface Errors {
  [field: string]: string | undefined;
}

/**
 * Contact and wholesale enquiry form (FR-100, FR-101).
 *
 * Demo build: submission is not wired to a backend. In production this posts
 * to a Server Action that validates with the same Zod schema, persists to
 * Postgres *before* sending email, applies rate limiting and Turnstile, and
 * returns field-level errors (USER-FLOWS UF-05).
 */
export function EnquiryForm({ kind }: { kind: Kind }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  const wholesale = kind === "wholesale";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
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
    // Demo: no network call. Production replaces this with a Server Action.
    setTimeout(() => setStatus("success"), 700);
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border border-green/40 bg-paper px-6 py-8 text-center"
      >
        <CheckCircle2
          className="mx-auto size-8 text-green"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h3 className="t-h3 mt-4">Thank you — we have your enquiry</h3>
        <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-ink-muted">
          Someone from the team will come back to you. If it is urgent, WhatsApp
          is faster.
        </p>
        <p className="mt-4 text-[0.8125rem] text-ink-faint">
          Demo build — nothing was actually sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
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
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${id}-country`} name="country" label="Country" />
          <div>
            <label
              htmlFor={`${id}-quantity`}
              className="block text-[0.875rem] font-medium text-ink"
            >
              Estimated quantity
            </label>
            <input
              id={`${id}-quantity`}
              name="quantity"
              placeholder="e.g. 500 kg per month"
              className="mt-1.5 h-11 w-full rounded-sm border border-sand bg-paper px-3 text-ink outline-none focus:border-green-mid"
            />
          </div>
        </div>
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
            className="mt-1.5 h-11 w-full rounded-sm border border-sand bg-paper px-3 text-ink outline-none focus:border-green-mid"
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
            "mt-1.5 w-full rounded-sm border bg-paper px-3 py-2.5 text-ink outline-none",
            errors.message
              ? "border-danger focus:border-danger"
              : "border-sand focus:border-green-mid",
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

      <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
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
          "mt-1.5 h-11 w-full rounded-sm border bg-paper px-3 text-ink outline-none",
          error
            ? "border-danger focus:border-danger"
            : "border-sand focus:border-green-mid",
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
