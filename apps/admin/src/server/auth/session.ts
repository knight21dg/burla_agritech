import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isProduction } from "@burla/core/env";
import { hashToken, newSessionToken } from "@burla/core/auth";
import {
  ANONYMOUS,
  ForbiddenError,
  isStaff,
  requireCapability,
  type Actor,
  type Capability,
} from "@burla/core/auth/rbac";
import {
  deleteSessionByHash,
  findStaffBySessionHash,
  insertStaffSession,
} from "@burla/core/repositories/users";

/**
 * Staff sessions.
 *
 * Mechanically the same as the customer site's — a random token in an
 * HttpOnly cookie, only its SHA-256 hash in `sessions` — and deliberately
 * different in three ways:
 *
 *   1. A different cookie name. On a different origin, so the browser would
 *      keep them apart even if the names matched.
 *   2. `scope = 'admin'` in the database, checked in the query. A customer
 *      session row can never satisfy an admin lookup.
 *   3. Twelve hours, not thirty days. An admin session left open on a shared
 *      machine is a different risk from a shopper staying signed in.
 *
 * Nothing here decides permissions. `requireStaff` proves who you are;
 * `requirePermission` decides what you may do, and every mutation calls it
 * again, close to the data (docs/AUTHORIZATION.md §1).
 */

const COOKIE = "burla_admin_session";
const SESSION_HOURS = 12;

export async function startAdminSession(userId: string): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await insertStaffSession({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent,
  });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  // The row goes first. A deleted cookie with a live row is a session that
  // still works for anyone holding the token.
  if (token) await deleteSessionByHash(hashToken(token));
  store.delete(COOKIE);
}

/**
 * The actor behind this request. Cached per request, so a layout, a page and
 * three components share one lookup rather than five.
 */
export const currentActor = cache(async (): Promise<Actor> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return ANONYMOUS;

  const staff = await findStaffBySessionHash(hashToken(token));
  if (!staff) return ANONYMOUS;

  return {
    kind: "user",
    userId: staff.id,
    email: staff.email,
    name: staff.name,
    roles: staff.roles,
    sessionId: staff.sessionId,
  };
});

/**
 * For every page behind the door.
 *
 * A signed-in customer who somehow reaches this origin with a valid admin
 * session row but no staff role holds no capability, and is sent to the sign
 * in page rather than shown an empty shell.
 */
export async function requireStaff(returnTo?: string): Promise<Actor> {
  const actor = await currentActor();
  if (actor.kind !== "user" || !isStaff(actor)) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${next}`);
  }
  return actor;
}

/**
 * For every action and every page that shows something not everyone may see.
 *
 * Throws `ForbiddenError`, which the error boundary renders as a refusal.
 * Hiding the button that calls an action is a courtesy; this is the control.
 */
export async function requirePermission(capability: Capability): Promise<Actor> {
  const actor = await requireStaff();
  requireCapability(actor, capability);
  return actor;
}

export { ForbiddenError };
