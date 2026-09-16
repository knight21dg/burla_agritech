import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Session tokens.
 *
 * The token goes to the browser in a cookie; only its SHA-256 hash is stored
 * in `sessions.token_hash`, so a leaked database dump hands over no live
 * session. Both applications do this, which is why it is here rather than
 * copied into each of them — a second copy is a second chance to get it
 * wrong.
 *
 * SHA-256 without a work factor is correct here and would be wrong for a
 * password: the input is 32 bytes of cryptographic randomness, so there is no
 * dictionary to run against it.
 */

/** 256 bits of randomness, URL-safe. */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
