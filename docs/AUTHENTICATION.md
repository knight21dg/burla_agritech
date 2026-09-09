# Authentication — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/AUTHENTICATION.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. Choice: Better Auth

**Recommendation: Better Auth**, with Auth.js v5 as the conservative alternative.

| Criterion | Better Auth | Auth.js v5 |
|---|---|---|
| Drizzle + Postgres | first-class adapter | adapter exists, credentials flow needs custom work |
| Email + password | built in, with verification | Credentials provider is deliberately minimal; you build most of it |
| Database sessions | default | JWT default; DB sessions need configuration |
| Multiple roles per user | supported | roll your own |
| MFA (TOTP) | plugin | roll your own |
| Maturity | younger, smaller ecosystem | larger install base |

The deciding factor is that this project needs **email/password with verification, database sessions, several roles per user, and mandatory MFA for staff**. With Auth.js that is largely custom code; with Better Auth it is configuration. Custom auth code is where security bugs live.

Tracked as `OQ-065`. Either choice satisfies the architecture — the service layer never imports the auth library directly.

---

## 2. What exists today

Nothing. `/account` and `/auth/*` are linked in the header and drawer but **no route exists**. Those links 404 today.

---

## 3. Credentials

| Rule | Value |
|---|---|
| Hashing | The library default — Argon2id, or scrypt. **No custom crypto, ever** |
| Minimum length | 10 characters |
| Composition rules | **None** — they demonstrably produce weaker passwords |
| Rotation | **None** — same reason |
| Breach check | Rejected if present in a known-breached list (k-anonymity range query, the password never leaves the server) |
| Storage | `password_credentials`, a separate table from `users`, so `SELECT * FROM users` can never leak a hash |

---

## 4. Sessions

Opaque token in a cookie; the session row lives in Postgres. Not a JWT — revocation matters more here than statelessness, and there is one database anyway.

| Property | Customer | Staff / admin |
|---|---|---|
| Lifetime | 30 days, rolling | **8 hours, non-rolling** |
| Cookie | `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/` | same |
| Token at rest | **hashed** — a database leak does not yield usable sessions | same |
| Scope | `web` | `admin` |

`SameSite=Lax` rather than `Strict`: `Strict` breaks the session when a customer follows a link from an email or WhatsApp, which is the primary way people will reach this site. Lax plus the framework's CSRF handling on Server Actions covers the risk.

**Sessions are invalidated on:** password change, email change, role change, explicit sign-out, and sign-out-everywhere.

---

## 5. Flows

```
Sign up      → validate → create user → send verification → "check your inbox"
             → verify link → email confirmed → signed in

Sign in      → rate limit → verify → create session → redirect to allowlisted path
             → wrong credentials  : generic message, never "no such account"
             → unverified         : offer to resend
             → locked out         : honest message with a wait time

Reset        → ALWAYS reports success, whether or not the account exists
             → single-use, hashed, 1-hour token
             → on reset: all other sessions invalidated
```

**Uniform responses.** Sign-in and reset return the same message and take comparable time whether or not the account exists. Otherwise the form becomes an account-enumeration oracle.

---

## 6. Staff accounts

- **No public sign-up route exists for staff.** An existing admin invites; the invitation is a single-use, time-limited token.
- **MFA (TOTP) is mandatory** for `staff` and `admin`. Sign-in without a second factor is not possible.
- Stricter rate limit: 5 attempts per 15 minutes, then a 1-hour lockout on the account, not just the IP.

---

## 7. Rate limits

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| Sign in (customer) | 5 | 15 min | IP + email |
| Sign in (staff) | 5, then 1h lockout | 15 min | IP + email |
| Sign up | 3 | 1 hour | IP |
| Password reset request | 3 | 1 hour | IP + email |
| Verification resend | 3 | 1 hour | account |

Keyed by **account as well as IP**, so a distributed attack on one account is still throttled.

---

## 8. Redirects after auth

The `next` parameter is validated against an allowlist of internal paths. An absolute URL, a protocol-relative `//evil.com`, or a path outside the allowlist falls back to `/account`. Open redirects are a phishing vector, and auth pages are exactly where they get exploited.

---

## 9. Boundaries

- Browsing, searching and enquiring **never require an account** (FR-123).
- An account is offered at checkout, never forced.
- Customer and admin sessions are **separate scopes**. A customer cookie is not accepted by admin routes, and vice versa.
- The service layer receives a resolved `Actor { userId, roles }`. It never touches cookies or the auth library, which is what makes every rule unit-testable.

---

## 10. Tests that must exist

Per the client's §65 and §86:

- valid sign-in; wrong password; unverified account; locked out
- reset token reused → rejected; expired → rejected
- session invalidated after password change
- customer cookie rejected by an admin route
- MFA cannot be skipped on a staff account
- no timing or message difference between existing and non-existing accounts
- `next` redirect rejects external URLs
