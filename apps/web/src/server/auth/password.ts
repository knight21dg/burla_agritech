import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing: scrypt, from Node's own crypto — no native module to
 * build, and one of the two algorithms docs/AUTHENTICATION.md allows.
 *
 * Stored as `scrypt$N$r$p$salt$hash` (base64url), so the cost can be raised
 * later without breaking existing hashes: each hash carries its own
 * parameters. A plaintext password is never stored, logged or returned.
 */

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
// scrypt needs 128 * N * r bytes; the default 32 MB cap is too low for N=2^15.
const MAX_MEMORY = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, options: ScryptOptions, length: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P, maxmem: MAX_MEMORY }, KEY_LENGTH);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltText, keyText] = stored.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64url");
  const actual = await derive(
    password,
    Buffer.from(saltText, "base64url"),
    { N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEMORY },
    expected.length,
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * A real hash of nothing in particular. Sign-in checks an unknown email
 * against it, so "no such account" takes as long as "wrong password" and the
 * response time does not reveal which emails have accounts.
 */
let decoy: Promise<string> | undefined;
export function decoyHash(): Promise<string> {
  decoy ??= hashPassword(randomBytes(16).toString("hex"));
  return decoy;
}
