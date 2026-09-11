import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form fields for checkout, styled as the enquiry form's are. Each wires its
 * label, its error (announced and linked with aria-describedby) and
 * aria-invalid, so the form reads correctly without sight.
 */

const control = (error?: string) =>
  cn(
    "h-11 w-full rounded-sm border bg-white px-3 text-[0.9375rem] text-ink outline-none transition-colors",
    error ? "border-danger focus:border-danger" : "border-line focus:border-green-700",
  );

function Label({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.875rem] font-medium text-ink">
      {label}
      {optional && <span className="font-normal text-ink-3"> (optional)</span>}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-danger">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export function TextField({
  id,
  label,
  error,
  optional,
  prefix,
  className,
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  /** Shown inside the field, before the input — "+91" for a mobile number. */
  prefix?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "prefix">) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} optional={optional} />
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 grid place-items-center border-r border-line px-3 text-[0.9375rem] text-ink-2">
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(control(error), prefix && "pl-16")}
          {...input}
        />
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  className,
  children,
  ...select
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} />
      <div className="relative mt-1.5">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(control(error), "appearance-none pr-9")}
          {...select}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
