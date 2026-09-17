# Admin roles and permissions — as implemented

| Field | Value |
|---|---|
| Document | `docs/ADMIN-ROLES-PERMISSIONS.md` |
| Version | 1.0 |
| Date | 2026-09-16 |
| Status | **Implemented.** This describes code that exists, not a plan |
| Design | `AUTHORIZATION.md` — the model. This document — where it lives and how to operate it |

---

## 1. Where the decisions are made

```
apps/admin/src/proxy.ts                    a cookie exists?          → /login
apps/admin/src/server/auth/session.ts      who is this?              → Actor
packages/core/src/auth/rbac.ts             what may they do?         → Capability
```

Three layers, and only the last two decide anything.

`proxy.ts` (Next 16's replacement for `middleware.ts`) sees a URL and a cookie. It cannot reach the database, so it cannot know whether a cookie is live, whose it is, or what they may do. All it does is redirect someone with no cookie to the sign-in page rather than render a shell they would be thrown out of. **That is a courtesy, not a control.**

`requireStaff()` reads the session, loads the roles and refuses anyone holding no capability. `requirePermission(capability)` does that and then checks the capability. Both run on the server, on every request, and every future mutation calls `requireCapability` again next to the data.

## 2. The roles

Five exist as rows in `roles` (seeded by migration `0001`). **Two are in use at launch** (`OQ-058`); the others are defined so that granting one later is an `INSERT`, not a migration.

| Role | In use | Who |
|---|---|---|
| `customer` | ✔ | anyone who registers on the shop. **Holds no capability** and cannot enter the admin |
| `staff` | ✔ | the office: enquiries, stock, orders, customer details |
| `content_manager` | defined | writes copy, edits and publishes the catalogue. Never sees a customer |
| `order_manager` | defined | packs and ships. Cannot change a price |
| `admin` | ✔ | the partners: everything, including accounts and settings |

A role is a job, not a person. Someone may hold several; their capabilities add up.

## 3. The matrix

`packages/core/src/auth/rbac.ts` is the single source. This table is generated from the same data and must match it.

| Capability | customer | staff | content_manager | order_manager | admin |
|---|:--:|:--:|:--:|:--:|:--:|
| `catalogue.read_draft` | | ✔ | ✔ | | ✔ |
| `catalogue.write` | | | ✔ | | ✔ |
| `catalogue.publish` | | | ✔ | | ✔ |
| `inventory.adjust` | | ✔ | | ✔ | ✔ |
| `enquiry.read` | | ✔ | | | ✔ |
| `enquiry.write` | | ✔ | | | ✔ |
| `order.read_all` | | ✔ | | ✔ | ✔ |
| `order.transition` | | | | ✔ | ✔ |
| `customer.read_pii` | | ✔ | | ✔ | ✔ |
| `content.write` | | | ✔ | | ✔ |
| `settings.write` | | | | | ✔ |
| `user.manage` | | | | | ✔ |
| `audit.read` | | | | | ✔ |

The blank people assume wrongly: `content_manager` has **no** access to orders or customer details. Content work never requires personal data, so it never gets it.

Two positions worth restating:

- **A customer holds nothing.** Everything a customer may do is decided by ownership in the query, not by a capability. This is what makes "a customer with a valid password is refused at the admin door" true by construction rather than by a check someone might forget.
- **`admin` is a row in the matrix**, not a bypass. There is no `if (admin) return true` anywhere, and a test asserts that removing a capability from the admin row would actually remove it.

## 4. Sessions

| | Customer site | Admin |
|---|---|---|
| Cookie | `burla_session` | `burla_admin_session` |
| Origin | `burla.com` | `admin.burla.com` |
| `sessions.scope` | `web` | `admin` |
| Lifetime | 30 days | **12 hours** |
| Stored | SHA-256 of the token | SHA-256 of the token |

Both hash the token before storing it, using the same helper, so a leaked database dump hands over no live session.

The scope is checked **in the query**, not after it. A `web` session row cannot satisfy an admin lookup even if the token were somehow presented to the admin origin — verified, not assumed (§7).

## 5. Creating accounts

There is no sign-up route on the admin and there never will be. The first account comes from a shell:

```bash
npm run admin:create --workspace=@burla/admin -- --email you@example.com --name "Your Name" --role admin
```

The password is typed at the prompt with the echo turned off. It is never an argument — arguments are visible in `ps` and land in shell history — never printed and never logged. Only its scrypt hash reaches the database. Staff passwords must be at least 12 characters, longer than the customer minimum, because these accounts can change prices and read every customer's address.

Later, an `admin` creates accounts from `/users`. Whether that should instead be an invitation email is `OQ-059`, still open.

## 6. The audit log

Every mutation by a non-customer writes one row to `audit_log`, which is append-only at the database — a trigger refuses `UPDATE` and `DELETE`.

Written today: `session.signed_in`, `session.signed_out`, `session.sign_in_failed`. A failed attempt records that one happened, with a hashed IP, but **not the address that was tried**: the log is for noticing an attack, not for accumulating a list of guessed emails.

`changes` holds the changed fields only — never a whole row, never a password hash, token or payment secret.

## 7. What has been verified

| Property | How |
|---|---|
| Anonymous request to any admin route is refused | `GET /` with no cookie → 307 to `/login` |
| A `web`-scope session presented to the admin is refused | Same user, `scope='web'` token in the admin cookie → 307 to `/login` |
| A customer holding an `admin`-scope session is still refused | Session row forced to `scope='admin'` for a customer → 307 to `/login` (no capability, so not staff) |
| Permissions filter what is *fetched*, not just what is shown | A `content_manager`'s dashboard HTML contains no order or customer numbers at all |
| Sign-out ends the session and leaves a trace | Session row deleted; one `session.signed_out` row with `actor_role = staff` |
| Only hashes are stored | `password_credentials.password_hash` begins `scrypt$32768$…` |
| The matrix behaves | 22 unit tests, `npm test` |
| Admin is never indexed | `robots.txt` disallows all; `X-Robots-Tag: noindex, nofollow, noarchive` on every response |
| Admin cannot be framed, and loads no third-party code | `X-Frame-Options: DENY`; CSP with `frame-ancestors 'none'`, `default-src 'self'` — and proved in passing when a cross-origin `fetch` from the admin page to the shop was blocked |
| A catalogue edit reaches the public site | Price changed in the editor → new price on the shop within the second, one `product.variants_replaced` audit row |
| Publishing controls what customers see | Unpublish → the shop's product page 404s and it leaves the listing; publish → both return |
| Two people cannot overwrite each other | With the form open, another save touched the row; the next save was refused and nothing was written |
| A category change reaches the site | Renamed, then renamed back: the header and category page followed; adding and deleting a subcategory each wrote one audit row |
| Staff can read the catalogue but not change it | A `staff` session sees the editor with no save or publish controls and both refusals in words |

**Not yet verified end to end:** two things, named rather than assumed. The sign-in POST itself. Sign-out exercises the same action, session and audit machinery, but a full "type a password, get a session" pass belongs in the Playwright suite in the hardening phase, with a seeded test account. And a forbidden *action* post — the editor hides its controls from `staff` and both the action and the service call the permission check first, but nothing yet drives an HTTP post from an account that may not make it. Both belong in the Playwright suite in the hardening phase.

## 8. Still to do

- TOTP MFA for staff — the `users.mfa_secret` column exists and is unused (**A-03**, open).
- Rate limiting on durable storage. The limiter is in process memory: correct for one server, insufficient for several. Upstash names are already in `.env.example`.
- `/users` and `/audit` screens — phase 11.
- The remaining acceptance tests in `AUTHORIZATION.md` §10 that need a database: ownership, 404-not-403, one audit row per mutation, a disabled user's session refused on the next request.
