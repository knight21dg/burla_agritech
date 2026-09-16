import "server-only";

/**
 * Failed sign-ins per key: a few in a window, then a pause.
 *
 * In memory, so it holds per server process — enough for one server, and a
 * real brake on guessing a password. A deployment with several instances
 * moves this to Redis (`UPSTASH_*` in env.ts), which is why it sits behind
 * three small functions and a factory rather than being inlined at the call
 * site.
 *
 * A factory rather than a module-level map because the two applications want
 * different settings: the customer site pauses after five failures in fifteen
 * minutes; the admin is stricter (SECURITY.md §3.2). Each limiter keeps its
 * own counts, so a customer's failures cannot lock a staff account, or the
 * reverse.
 */

export interface RateLimitOptions {
  /** How long failures are remembered. */
  windowMs?: number;
  /** Failures allowed inside the window before the key is locked. */
  maxFailures?: number;
  /**
   * How long the key stays locked once it trips. Defaults to the window, so
   * the count simply ages out; a longer value is a deliberate lockout.
   */
  lockoutMs?: number;
}

export interface RateLimiter {
  isLockedOut(key: string): boolean;
  recordFailure(key: string): void;
  clearFailures(key: string): void;
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimiter {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const maxFailures = options.maxFailures ?? 5;
  const lockoutMs = options.lockoutMs ?? windowMs;

  const failures = new Map<string, { count: number; first: number; until?: number }>();

  return {
    isLockedOut(key) {
      const entry = failures.get(key);
      if (!entry) return false;

      if (entry.until !== undefined) {
        if (Date.now() < entry.until) return true;
        failures.delete(key);
        return false;
      }

      if (Date.now() - entry.first > windowMs) {
        failures.delete(key);
        return false;
      }
      return entry.count >= maxFailures;
    },

    recordFailure(key) {
      const entry = failures.get(key);
      const now = Date.now();

      if (!entry || (entry.until === undefined && now - entry.first > windowMs)) {
        failures.set(key, { count: 1, first: now });
        return;
      }

      entry.count += 1;
      // Trip into an explicit lockout only when one was asked for; otherwise
      // the count ages out of the window on its own.
      if (entry.count >= maxFailures && lockoutMs > windowMs) {
        entry.until = now + lockoutMs;
      }
    },

    clearFailures(key) {
      failures.delete(key);
    },
  };
}
