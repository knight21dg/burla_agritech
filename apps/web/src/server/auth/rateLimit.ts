import "server-only";

/**
 * Failed sign-ins per email: five in fifteen minutes, then a pause.
 *
 * In memory, so it holds per server process — enough for one server, and a
 * real brake on guessing a password. A deployment with several instances
 * moves this to Redis (UPSTASH_* in lib/env.ts), which is why it sits behind
 * two small functions.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map<string, { count: number; first: number }>();

export function isLockedOut(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  failures.delete(key);
}
