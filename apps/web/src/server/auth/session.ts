import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isProduction } from "@/lib/env";
import {
  deleteSessionByHash,
  findUserBySessionHash,
  insertSession,
  type AccountUser,
} from "@/server/repositories/userRepository";

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

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await insertSession({ userId, tokenHash: hash(token), expiresAt, userAgent });

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
  if (token) await deleteSessionByHash(hash(token));
  store.delete(COOKIE);
}

/**
 * The signed-in customer, or undefined. Cached per request, so a page and
 * the components inside it share one lookup.
 */
export const currentUser = cache(async (): Promise<AccountUser | undefined> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return undefined;
  return findUserBySessionHash(hash(token));
});

/** For pages that need a customer: sends anyone else to sign in, then back. */
export async function requireUser(returnTo: string): Promise<AccountUser> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
