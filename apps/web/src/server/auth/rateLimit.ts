import "server-only";
import { createRateLimiter } from "@burla/core/auth";

/**
 * Failed customer sign-ins: five per email in fifteen minutes, then a pause
 * until the oldest failure ages out.
 *
 * The mechanism is shared with the admin (`@burla/core/auth`); the settings
 * are not. The admin is stricter, and its counts are its own, so a customer
 * fumbling a password cannot lock a staff account.
 */
const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxFailures: 5 });

export const { isLockedOut, recordFailure, clearFailures } = limiter;
