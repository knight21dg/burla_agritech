import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isProduction } from "@burla/core/env";
import { hashToken, newSessionToken } from "@burla/core/auth";
import {
  deleteSessionByHash,
  findUserBySessionHash,
  insertSession,
  type AccountUser,
} from "@burla/core/repositories/users";

/**
 * Customer sessions: an opaque random token in an HttpOnly cookie, and only
 * its SHA-256 hash in the database (`sessions`), so a leaked database dump
 * hands over no live sessions. docs/AUTHENTICATION.md.
 *
 *   HttpOnly  — page scripts cannot read it, so an injected script cannot
 *               steal it.
 *   Secure    — HTTPS only, in production.
 *   SameSite  — Lax: sent on ordinary navigation, not on cross-site posts.
 *               Server actions also check the request's origin.
 *
 * Sessions last 30 days. Authorization is always decided here, on the server,
 * per request — hiding a link in the interface decides nothing.
 */

const COOKIE = "burla_session";
const SESSION_DAYS = 30;

export async function startSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await insertSession({ userId, tokenHash: hashToken(token), expiresAt, userAgent });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await deleteSessionByHash(hashToken(token));
  store.delete(COOKIE);
}

/**
 * The signed-in customer, or undefined. Cached per request, so a page and
 * the components inside it share one lookup.
 */
export const currentUser = cache(async (): Promise<AccountUser | undefined> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return undefined;
  return findUserBySessionHash(hashToken(token));
});

/** For pages that need a customer: sends anyone else to sign in, then back. */
export async function requireUser(returnTo: string): Promise<AccountUser> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
