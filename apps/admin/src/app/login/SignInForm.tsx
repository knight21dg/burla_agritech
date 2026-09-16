"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type SignInState } from "./actions";

/**
 * The sign-in form.
 *
 * Client-side only for the pending state and to keep what was typed after a
 * failure. Everything that decides anything happens in the action: this
 * component cannot be trusted and does not need to be.
 */

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-[0.8125rem] text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="label block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className="field"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-[0.8125rem] text-danger">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="label block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          className="field"
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-[0.8125rem] text-danger">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <Submit />
    </form>
  );
}
