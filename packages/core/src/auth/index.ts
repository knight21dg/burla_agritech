/**
 * Authentication primitives shared by both applications.
 *
 * What belongs here is what the customer site and the admin must agree on:
 * how a password is hashed, how a session token is hashed before it is
 * stored, and how repeated failures are throttled. What does not belong here
 * is either application's session policy — cookie name, lifetime, scope —
 * because those are deliberately different (docs/ADMIN-ARCHITECTURE.md §2.1).
 */
export { hashPassword, verifyPassword, decoyHash } from "./password";
export { createRateLimiter, type RateLimiter, type RateLimitOptions } from "./rateLimit";
export { hashToken, newSessionToken } from "./tokens";
