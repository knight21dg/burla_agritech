"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, type AuthFormState } from "@/app/login/actions";
import { TextField } from "@/components/checkout/fields";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

/**
 * Sign in or create an account — one card, two tabs, as on Amazon and
 * Flipkart. Both are server actions: the browser only posts the form, and
 * every check (and the session cookie) happens on the server.
 */
export function AuthForm({ next, initialMode = "signin" }: { next: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="rounded-lg border border-line bg-white">
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 border-b border-line">
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "relative py-3.5 text-[0.9375rem] font-semibold transition-colors",
              mode === value
                ? "text-green-700 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-green-700"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {mode === "signin" ? <SignInForm next={next} /> : <SignUpForm next={next} />}
      </div>
    </div>
  );
}

function SignInForm({ next }: { next: string }) {
  const id = useId();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormError message={state.error} />
      <TextField
        id={`${id}-email`}
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <PasswordField id={`${id}-password`} autoComplete="current-password" error={state.fieldErrors?.password} />
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const id = useId();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormError message={state.error} />
      <TextField
        id={`${id}-name`}
        name="name"
        label="Full name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <TextField
        id={`${id}-email`}
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <PasswordField
        id={`${id}-password`}
        autoComplete="new-password"
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />
      <Submit pending={pending}>Create account</Submit>
    </form>
  );
}

function PasswordField({
  id,
  autoComplete,
  hint,
  error,
}: {
  id: string;
  autoComplete: string;
  hint?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextField
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        label="Password"
        autoComplete={autoComplete}
        error={error}
        className="[&_input]:pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-[1.85rem] grid size-9 place-items-center rounded-sm text-ink-3 hover:text-ink"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
      {hint && !error && <p className="mt-1.5 text-[0.8125rem] text-ink-3">{hint}</p>}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger/40 px-3 py-2.5 text-[0.875rem] text-ink"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      {message}
    </p>
  );
}

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}
