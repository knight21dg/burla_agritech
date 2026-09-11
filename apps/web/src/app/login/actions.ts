"use server";

import { redirect } from "next/navigation";
import { safeNextPath, signInSchema, signUpSchema } from "@/lib/account";
import { decoyHash, hashPassword, verifyPassword } from "@/server/auth/password";
import { clearFailures, isLockedOut, recordFailure } from "@/server/auth/rateLimit";
import { endSession, startSession } from "@/server/auth/session";
import {
  createCustomer,
  findCredentialsByEmail,
  recordSignIn,
} from "@/server/repositories/userRepository";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  /** Echoed back so a failed attempt does not empty the form. */
  values?: { name?: string; email?: string };
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const out: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "email" || field === "password") && !out[field]) {
      out[field] = issue.message;
    }
  }
  return out;
}

/**
 * Sign in. The same answer for "no such account" and "wrong password", and
 * the same time taken (a decoy hash is checked for unknown emails), so the
 * form cannot be used to find out who has an account. Five failures for one
 * email in fifteen minutes pause further attempts.
 */
export async function signIn(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  const values = { email: String(form.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues), values };

  const { email, password } = parsed.data;
  if (isLockedOut(email)) {
    return {
      error: "Too many attempts. Wait 15 minutes, then try again.",
      values,
    };
  }

  const account = await findCredentialsByEmail(email);
  const valid = await verifyPassword(password, account?.passwordHash ?? (await decoyHash()));
  if (!account || !valid || account.status !== "active") {
    recordFailure(email);
    return { error: "That email and password don't match an account.", values };
  }

  clearFailures(email);
  await recordSignIn(account.id);
  await startSession(account.id);
  redirect(safeNextPath(form.get("next")));
}

export async function signUp(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  const values = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues), values };

  const user = await createCustomer({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
  });
  if (!user) {
    return {
      fieldErrors: { email: "An account with this email already exists. Sign in instead." },
      values,
    };
  }

  await startSession(user.id);
  redirect(safeNextPath(form.get("next")));
}

export async function signOut() {
  await endSession();
  redirect("/");
}
