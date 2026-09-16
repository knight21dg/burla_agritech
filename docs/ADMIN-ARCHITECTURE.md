# Admin architecture — proposal

| Field | Value |
|---|---|
| Document | `docs/ADMIN-ARCHITECTURE.md` |
| Version | 0.1 |
| Date | 2026-09-16 |
| Status | **Proposed — awaiting approval. No admin code has been written.** |
| Companion | `ADMIN-CURRENT-SYSTEM.md` — what exists. This document — what we propose to add |
| Implements | `AUTHORIZATION.md`, `SECURITY.md` §3, `DATA-OWNERSHIP.md` |

---

## 1. The shape of the problem

The admin is not primarily a set of CRUD screens. Three things make it real:

1. **The storefront must read from the database.** Until it does, an admin edits rows nobody sees. This is the Phase 8 "cutover" already designed for, already built (`catalogService`), already verified (129 parity checks) — and not yet switched on.
2. **The pages are statically generated.** An admin write must invalidate the right cache entries or the change appears only on the next deployment.
3. **Authorization must be real.** Five roles exist as rows; nothing reads them. `AUTHORIZATION.md` specifies the model in full, including twelve acceptance tests. Implementing it is most of the security work.

Everything else — tables, forms, filters — is ordinary work on top of a database that was designed for it.

---

## 2. Where the admin lives

### 2.1 Recommendation: one application, an `/admin` segment

```
apps/web/src/app/
├── (storefront)/      existing routes, untouched
└── admin/             new — its own layout, its own shell
```

`SECURITY.md` §3.1 proposes a separate application on `admin.burla.com`. That is the stronger position and we should say plainly that this proposal deviates from it.

| | Separate app (`apps/admin`) | One app, `/admin` segment |
|---|---|---|
| Cookie isolation | Host-scoped by the browser | By cookie name + `scope` column + path |
| Blast radius of storefront XSS | None | Contained by HttpOnly cookies and a strict CSP on `/admin`, but the origin is shared |
| Service layer | Duplicated or extracted into `packages/` | Shared directly |
| Deployment | Two projects, two domains, two pipelines | One |
| Cost to maintain | Real, ongoing | None |

For a two-partner business, one application is the right trade **provided the isolation is deliberate rather than accidental**:

- A distinct cookie, `burla_admin_session`, with `Path=/admin` and the existing `sessions.scope = 'admin'`. A customer cookie can never be an admin session: the scope is checked in the query, exactly as `findUserBySessionHash` already checks `scope = 'web'`.
- Admin sessions are short — 12 hours, not 30 days.
- `middleware.ts` gates `/admin/*` before a page renders, and every service call re-checks. Middleware is UX; the service check is the control.
- `/admin` responses carry `X-Robots-Tag: noindex, nofollow` and a stricter CSP than the storefront.
- No public sign-up on `/admin`. Staff accounts are created by an admin, or by a single-use invitation token — `verification_tokens.type = 'staff_invitation'` already exists.

The split into a separate app remains possible later precisely because the decision-making lives in services, not in pages. **This is a decision for you to accept or reject, not one to discover in a diff.**

### 2.2 Route map

| Route | Purpose |
|---|---|
| `/admin/login` | staff sign-in (separate from `/login`) |
| `/admin` | dashboard |
| `/admin/products`, `/new`, `/[id]` | product list and editor |
| `/admin/categories`, `/admin/categories/[id]` | categories and types (one table, two levels) |
| `/admin/inventory` | stock, adjustments, low-stock |
| `/admin/orders`, `/admin/orders/[orderNumber]` | fulfilment |
| `/admin/customers`, `/admin/customers/[id]` | read-mostly |
| `/admin/enquiries`, `/admin/enquiries/[id]` | contact and wholesale |
| `/admin/content/homepage` | featured products, category order |
| `/admin/content/pages`, `/admin/content/policies` | company copy and legal pages |
| `/admin/settings` | business identity, delivery, feature flags |
| `/admin/users` | staff accounts and roles (admin only) |
| `/admin/audit` | audit log (admin only) |

Order detail is keyed by `order_number`, not by `id`: it is the number staff and customers actually say out loud, and it is already unique.

---

## 3. Authorization

### 3.1 The actor

```ts
type Actor =
  | { kind: "anonymous" }
  | { kind: "user"; userId: string; roles: RoleKey[]; sessionId: string };
```

Built once per request from the session cookie, never from a header, a form field or a client prop. Services take it as their first argument, which is what makes them testable without a request.

### 3.2 Capabilities, not a permissions table

The brief suggests `permissions` and `admin_role_permissions` tables. For five fixed roles that is a database round trip and a migration in place of a constant. We propose a single typed matrix in code:

```ts
const MATRIX: Record<RoleKey, Capability[]> = { … };
export function can(actor: Actor, capability: Capability): boolean
export function require(actor: Actor, capability: Capability): void   // throws
```

One file, readable in one screen, diffable in review, and impossible to leave in an inconsistent state in production. If per-user permissions are ever needed, the tables can be added behind the same `can()` function without touching a call site.

`admin` appears in the matrix like every other role. There is no "if admin, skip the checks" branch, ever.

### 3.3 Capabilities and the roles that hold them

Taken from `AUTHORIZATION.md` §3, unchanged.

| Capability | customer | content_manager | order_manager | staff | admin |
|---|:--:|:--:|:--:|:--:|:--:|
| `catalogue.read_draft` | | ✔ | | ✔ | ✔ |
| `catalogue.write` (product, variant, taxonomy, media) | | ✔ | | | ✔ |
| `catalogue.publish` | | ✔ | | | ✔ |
| `inventory.adjust` | | | ✔ | ✔ | ✔ |
| `enquiry.read` / `enquiry.write` | | | | ✔ | ✔ |
| `order.read_all` | | | ✔ | ✔ | ✔ |
| `order.transition` | | | ✔ | | ✔ |
| `customer.read_pii` | | | ✔ | ✔ | ✔ |
| `content.write` (pages, policies) | | ✔ | | | ✔ |
| `settings.write` | | | | | ✔ |
| `user.manage` | | | | | ✔ |
| `audit.read` | | | | | ✔ |

Two positions worth restating: a content manager never sees customer data, and **nobody can delete an order** — cancellation and refund are status transitions.

### 3.4 The rules that do not bend

- Ownership belongs in the `WHERE` clause. Owned entities have no `findById` at all — this is already true of orders and addresses.
- A row you may not see returns **404**, not 403. The exception is `/admin` itself, where a signed-in customer gets a clear refusal.
- Publish state is authorization: `listPublished()` for the public surface, `listForAdmin(actor)` for the admin. The public method has no flag to forget.
- Every write schema is `.strict()`. An extra `role` or `status` field in a payload is an error, not something silently ignored.

---

## 4. Database changes

Very little, which is the point of having designed the schema first.

| Change | Why |
|---|---|
| **New table `pages`** | Company copy and the four policies are hard-coded in page components today. `DATA-OWNERSHIP.md` assigns them to a `pages` table. Content stored as validated Tiptap JSON, never HTML — a node allowlist, rendered by a typed serialiser, so admin-authored copy cannot become stored XSS |
| `sessions` | no change — `scope` already distinguishes `web` from `admin` |
| `audit_log` | no change — table and append-only trigger exist |
| `media`, `product_images` | no change — they exist and are empty |
| `site_settings` | possibly a few columns for delivery rules, once the real ones are known |
| Feature flags | a small `jsonb` column on `site_settings` rather than a new table |

Every change goes through `drizzle-kit generate`, reviewed as SQL, tested against a clean database. Triggers stay hand-written (`--custom`), as `MIGRATIONS.md` requires.

---

## 5. Images and storage

No upload path exists anywhere in the application today, and the customer site must continue to accept none.

- Uploads happen only inside `/admin`, by an authenticated actor with `catalogue.write`.
- Cloudflare R2 through a presigned PUT. The environment names already exist in `.env.example` (`R2_*`); the account does not. **This needs a Cloudflare account before it can be built.**
- Validation is server-side: extension, declared MIME, actual magic bytes, byte size, and dimensions. The stored content type is set by the server, never taken from the client.
- The row in `media` is written after the object exists, and `product_images` links it with alt text, role, sort order and a primary flag (already uniquely indexed).
- The 63 photographs currently in `public/images/` are migrated into `media` by a one-off script, so there is one source of truth afterwards rather than two.

If R2 is not wanted, the fallback is Vercel Blob with the same shape. What is not acceptable is writing to the application's filesystem, which does not survive a deployment.

---

## 6. Keeping the storefront correct

1. **The cutover.** 28 files import `data/catalog.ts`. They move to `catalogService`, page by page, with `db:parity` green at each step. `catalog.ts` is then deleted — not kept "just in case", because a dormant second source of product data is the exact failure `DATA-OWNERSHIP.md` exists to prevent.
2. **Revalidation.** Catalogue pages get cache tags (`product:<slug>`, `category:<slug>`, `catalogue`). Every admin write calls `revalidateTag` in the same action. Editing a price must not require a deployment.
3. **No visual change.** The storefront's rendered HTML must be identical before and after the cutover. That is what the parity script measures, and it is the acceptance test.

---

## 7. Phases

Each phase ends in something demonstrable. Phases 1–3 are the ones that turn the site into an application; the rest is surface.

| # | Phase | Output | Days |
|---|---|---|---|
| 1 | **Cutover** — pages read the database; cache tags added; `catalog.ts` deleted | The site runs on Postgres, looking identical | 3–4 |
| 2 | **Authorization** — `Actor`, capabilities, `middleware.ts`, admin sessions, staff sign-in, audit writer | A locked door with nothing behind it yet | 3–4 |
| 3 | **Shell and dashboard** — layout, navigation, tables, forms, empty/loading/error states | The frame every module drops into | 3 |
| 4 | **Catalogue** — categories, types, products, variants, publish rules | The client can edit the catalogue | 5–6 |
| 5 | **Images** — R2, presigned uploads, gallery, primary image, backfill | Photographs without a developer | 3–4 |
| 6 | **Inventory** — ledger-backed adjustments, low stock | Stock is answerable | 2 |
| 7 | **Orders** — list, detail, state machine, courier and tracking | The shop can be run | 3–4 |
| 8 | **Customers and enquiries** — plus wiring the contact form to the database | Leads stop being lost | 3 |
| 9 | **Content** — homepage featured, pages, policies, settings | Copy without a deployment | 4 |
| 10 | **Users, roles, audit view** | Staff accounts, traceability | 2 |
| 11 | **Hardening and tests** — Vitest, Playwright, the twelve authorization tests, rate limiting on durable storage, security audit document | Provable, not asserted | 5–6 |

**Roughly 36–44 working days**, and the sequence matters more than the estimate: 1 and 2 before anything else.

---

## 8. Testing

| Kind | Tool | Covers |
|---|---|---|
| Unit | Vitest (to be installed) | validation schemas, the capability matrix, order state transitions, publish rules, pricing |
| Integration | Vitest against a throwaway database | repositories, transactions, triggers, audit rows |
| End-to-end | Playwright (to be installed) | admin login, product create → publish → appears on the storefront, order transition, role restrictions |
| Authorization | Vitest + Playwright | the twelve tests in `AUTHORIZATION.md` §10, including **direct action calls, not only hidden buttons** |

Tests use a seeded throwaway database. Never production data, and never the developer's own `burla_dev` for destructive runs.

---

## 9. Security work, named

- Admin rate limiting on durable storage (Upstash names already in `.env.example`); the current in-memory limiter is not sufficient once there is more than one instance.
- TOTP MFA for staff and admin accounts — the `users.mfa_secret` column exists and is unused. `SECURITY.md` calls it mandatory.
- Strict CSP and `noindex` on `/admin`.
- Upload validation by magic bytes, not extension.
- Mass-assignment: `.strict()` on every input schema, with a test that proves it.
- IDOR: ownership in the query, 404 not 403, and a test per owned entity.
- Audit rows written in the same transaction as the change — an audit trail that can be missing is worse than none, because it is trusted.
- `docs/ADMIN-SECURITY-AUDIT.md` written before production, against this list.

---

## 10. Risks

| Risk | Handling |
|---|---|
| The cutover changes rendered output subtly | `db:parity` at each step; visual check of the eight page types before merge |
| Static pages serve stale data after an edit | Cache tags added in the same phase as the cutover, not later |
| Admin and storefront share an origin | §2.1 mitigations, accepted explicitly or the separate app is built instead |
| Sample prices are edited and look real | `is_sample` stays until the client supplies real values; the admin shows it plainly |
| Publishing a product without legal food fields | `product_details` completeness is part of the publish rule |
| No tests exist today | Phase 11 is not optional, and authorization tests are written with the code, not after |
| Two people editing one product | `updated_at` sent with the form; a stale write is refused and re-shown, not silently applied |
| R2 account does not exist | Phase 5 is blocked until it does; everything else proceeds |

---

## 11. Open questions

| ID | Question | Blocks |
|---|---|---|
| `OQ-055` | Custom admin rather than a hosted CMS — your prompt answers this, and this document assumes it | everything (now answered) |
| **A-01** | One application with `/admin`, or a separate `apps/admin` on its own domain? | §2, phase 2 |
| `OQ-058` | Are four staff roles needed at launch, or only `admin` and `staff`? | phase 2 |
| `OQ-059` | Staff accounts created by an admin directly, or by invitation email? | phase 2, needs Resend |
| **A-02** | Cloudflare R2, or Vercel Blob, for photographs? | phase 5 |
| **A-03** | Is MFA required from day one, or after launch? | phase 2 |
| `OQ-060` | How long is the audit log retained? | phase 10 |
| **A-04** | Does the client want to edit page copy (About, Quality, policies), or should it stay in code until the text settles? | phase 9 |

Unanswered questions are not filled in with assumptions. They are brought back.
