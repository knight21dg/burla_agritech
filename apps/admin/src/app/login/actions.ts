"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@burla/core/db";
import { env } from "@burla/core/env";
import { createRateLimiter, decoyHash, verifyPassword } from "@burla/core/auth";
import { isStaff, type Actor } from "@burla/core/auth/rbac";
import {
  findStaffCredentialsByEmail,
  recordSignIn,
} from "@burla/core/repositories/users";
import { writeAudit } from "@burla/core/repositories/audit";
import { adminSignInSchema, safeNextPath } from "@/lib/auth";
import {
  currentActor,
  endAdminSession,
  startAdminSession,
} from "@/server/auth/session";

export interface SignInState {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  /** Echoed back so a failed attempt does not empty the field. */
  values?: { email?: string };
}

/**
 * Stricter than the customer site (SECURITY.md §3.2): five failures for one
 * address, then an hour's lockout rather than a fifteen-minute cool-off.
 *
 * In process memory, which holds for one server. A deployment with more than
 * one instance must move this to Redis before launch — it is listed as such
 * in ADMIN-ARCHITECTURE.md §9, not quietly assumed to be enough.
 */
const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxFailures: 5,
  lockoutMs: 60 * 60 * 1000,
});

/** Raw addresses are never stored. The salt rotates; see docs/SECURITY.md. */
async function requestContext() {
  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? head.get("x-real-ip");
  const salt = env.IP_HASH_SALT;
  return {
    ipHash:
      ip && salt ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : undefined,
    userAgent: head.get("user-agent")?.slice(0, 300) ?? undefined,
  };
}

/**
 * Staff sign-in.
 *
 * Four refusals, one message. "No such account", "wrong password", "suspended"
 * and "not staff" are indistinguishable to whoever is typing, and cost the
 * same time — an unknown address is checked against a decoy hash so the
 * response cannot be timed. Otherwise this form becomes a way to discover who
 * works here, which is the first half of a targeted attack.
 *
 * The decision to let a customer in is made *after* the password is verified,
 * not before, for that reason.
 */
export async function signIn(
  _previous: SignInState,
  form: FormData,
): Promise<SignInState> {
  const parsed = adminSignInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  const values = { email: String(form.get("email") ?? "") };

  if (!parsed.success) {
    const fieldErrors: SignInState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "email" || field === "password") && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, values };
  }

  const { email, password } = parsed.data;

  if (limiter.isLockedOut(email)) {
    return { error: "Too many attempts. Try again in an hour.", values };
  }

  const account = await findStaffCredentialsByEmail(email);
  const correct = await verifyPassword(
    password,
    account?.passwordHash ?? (await decoyHash()),
  );

  const candidate: Actor = account
    ? {
        kind: "user",
        userId: account.id,
        email: account.email,
        name: account.name,
        roles: account.roles,
        sessionId: "",
      }
    : { kind: "anonymous" };

  if (!account || !correct || account.status !== "active" || !isStaff(candidate)) {
    limiter.recordFailure(email);
    const context = await requestContext();
    // Failures are logged without the address that was tried: the log is for
    // spotting an attack, not for building a list of guessed emails.
    await writeAudit(db, { kind: "anonymous" }, {
      action: "session.sign_in_failed",
      entityType: "session",
      ...context,
    });
    return { error: "That email and password don't match a staff account.", values };
  }

  limiter.clearFailures(email);
  await recordSignIn(account.id);
  await startAdminSession(account.id);

  const context = await requestContext();
  await writeAudit(db, candidate, {
    action: "session.signed_in",
    entityType: "user",
    entityId: account.id,
    ...context,
  });

  redirect(safeNextPath(form.get("next")));
}

export async function signOut(): Promise<void> {
  const actor = await currentActor();
  if (actor.kind === "user") {
    await writeAudit(db, actor, {
      action: "session.signed_out",
      entityType: "user",
      entityId: actor.userId,
    });
  }
  await endAdminSession();
  redirect("/login");
}
