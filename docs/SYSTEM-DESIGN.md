# System Design — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/SYSTEM-DESIGN.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed — awaiting approval before implementation |
| Builds on | `CURRENT-ARCHITECTURE.md` |
| Supersedes | `ARCHITECTURE.md` v0.2 for the backend sections |

---

## 1. Shape of the system

A **modular monolith**: one Next.js application, strict internal boundaries. There is no scale, team-topology or deployment argument for anything more, and microservices here would multiply operational cost for a single team with one database.

```
Browser
   │
   ▼
Vercel edge — static assets, ISR cache
   │
   ▼
Next.js application
   │
   ├── Server Components ......... read path. Call services directly.
   ├── Server Actions ............ write path from our own UI.
   └── Route Handlers ............ webhooks, search, health, uploads.
   │
   ▼
Domain services ................. business rules. The only place they live.
   │
   ▼
Repositories .................... every SQL query. Nothing else touches Drizzle.
   │
   ▼
PostgreSQL (Neon)
```

External, all behind interfaces so none of them can leak into domain code:

```
Object storage (R2) · Email (Resend) · Payments (Razorpay, if enabled)
Rate limiting (Upstash) · Monitoring (Sentry) · Analytics (PostHog)
```

---

## 2. The layering rule

One rule, and it is the reason the layers exist at all:

> **A React component may call a service. A service may call a repository. A repository may call the database. Never skip, never reverse.**

| Layer | May import | Must never |
|---|---|---|
| `app/**` (pages) | services, components | Drizzle, `db`, SQL |
| `server/services/**` | repositories, schemas, other services | React, `next/*`, request objects |
| `server/repositories/**` | `server/db`, Drizzle, schemas | services, React |
| `server/db/**` | drizzle, pg | anything above it |

Two consequences worth naming:

- **Services are testable without a browser or a request.** They take plain arguments and return plain data, so Vitest can exercise every business rule directly.
- **A query change never escapes the repository.** If a product listing needs a join tomorrow, exactly one file changes.

This is three layers, not five. Every one earns its place; there is no DTO layer, no mapper layer, no dependency-injection container.

---

## 3. Directory plan

Adapting the existing structure rather than replacing it. Everything currently in `apps/web/src` stays where it is.

```
apps/web/src/
├── app/                    unchanged, except pages become async
│   └── api/
│       ├── search/route.ts             search — required by the client overlay
│       ├── health/route.ts             liveness + dependency check
│       ├── uploads/sign/route.ts       presigned R2 URLs (admin only)
│       └── webhooks/razorpay/route.ts  [commerce]
│
├── components/             unchanged
│
├── server/                 NEW — nothing here is ever imported by a client component
│   ├── db/
│   │   ├── index.ts        the Drizzle client, one instance
│   │   ├── schema/         one file per domain area
│   │   └── migrations/     generated SQL, committed and reviewed
│   ├── repositories/       products, categories, enquiries, users, orders
│   ├── services/           the business rules
│   ├── auth/               session, password, RBAC
│   └── integrations/       storage, email, payments, ratelimit — each behind an interface
│
├── schemas/                NEW — Zod. Shared by client forms and server validation
├── lib/                    site config, utils, errors, env
└── data/                   catalog.ts — becomes the seed source, then is deleted
```

`server/` sits inside `apps/web` rather than in `packages/` deliberately: there is one consumer today. When `apps/admin` arrives it moves to `packages/core` — a directory move, not a redesign. Building the shared package before there is a second consumer would be abstraction on speculation.

---

## 4. Read path

The frontend integration contract is already defined: the 13 functions exported by `data/catalog.ts` (`CURRENT-ARCHITECTURE.md` §6.2).

The cutover keeps those names and signatures and makes them async:

```ts
// before
const list = productsByCategory(slug);

// after
const list = await productService.listByCategory(slug);
```

Pages become `async`. Components keep their props. **The rendered output is identical** — that is the acceptance test.

### Caching

| Content | Strategy | Invalidated by |
|---|---|---|
| Categories, types | ISR, cache tag `taxonomy` | admin publish |
| Product listings | ISR 60s, tag `category:{slug}` | admin publish |
| Product detail | ISR 60s, tag `product:{id}` | admin publish |
| Search | no cache | — |
| Cart, checkout, account, admin | `no-store` | — |

Never cached: anything user-specific, anything transactional, anything with a price the customer is about to pay.

---

## 5. Write path

**Server Actions for our own UI. Route Handlers for anything external.**

That split is not stylistic. A Server Action cannot receive a Razorpay webhook, and a Route Handler adds a pointless network hop for a form the same app rendered.

Every write, without exception, runs the same five steps:

```
1. Parse    Zod. Reject unknown fields — no mass assignment.
2. Authorize Server-side role and ownership check. Never trust the UI.
3. Rate limit Keyed by IP, or by account where the target is an account.
4. Execute   Inside a transaction when more than one row changes.
5. Audit     Admin mutations write to audit_log.
```

Result shape, everywhere:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string> } }
```

`message` is always safe to render. Internal detail goes to Sentry, never to the response.

---

## 6. Product read flow

```
GET /products/pickles
   │
   ├─ ISR cache hit ─────────────────────────────► HTML
   │
   └─ miss
        categoryService.getBySlug("pickles")
        productService.listByCategory("pickles", { limit, cursor })
             │
             └─ productRepository — ONE query, joined and paginated.
                Variants and the primary image come back in the same
                round trip. No N+1: 12 products must never mean 25 queries.
        → render → cache under tags ["taxonomy", "category:pickles"]
```

## 7. Enquiry flow — the first thing to build after the catalogue

Currently a `setTimeout`. It must become:

```
Form submit (client)
   → Server Action
       Zod parse ......................... field errors returned to the form
       Turnstile verify .................. bot check
       Honeypot + timing ................. cheap spam rejection
       Rate limit ........................ 3/hour per IP
       INSERT into enquiries ............. ← the lead is now safe
       ─────────────────────────────────── commit
       enqueue email (best effort) ....... failure logged, never surfaced
   → { ok: true }
```

**The database write happens before the email, and the email cannot fail the request.** A lead lost because SMTP was down is unacceptable; an email that arrives late is not.

## 8. Order flow `[commerce only]`

```
Add to bag → cart (session or user)
   │
Checkout
   │  server recalculates every line from current DB prices.
   │  a price sent by the browser is ignored entirely.
   ▼
Create Razorpay order (server)
   ▼
Customer pays
   ▼
Webhook ─── verify HMAC signature
        ─── INSERT webhook_events (provider, event_id) UNIQUE
        │      duplicate delivery → no-op, return 200
        ▼
      transaction:
        create order + order_items (name, price, tax SNAPSHOTTED)
        decrement stock  SELECT … FOR UPDATE
        record payment
      commit
```

Three rules that are not negotiable:

1. **The order is created by the webhook, not the browser redirect.** A closed tab must not lose a paid order.
2. **Idempotency is a unique constraint**, not application logic. `webhook_events(provider, event_id)`.
3. **Stock decrements under a row lock.** Two customers buying the last unit — one succeeds, one gets a clean failure.

---

## 9. Security boundaries

```
PUBLIC          catalogue, content, search, enquiry submission
AUTHENTICATED   own account, own orders, own addresses — ownership checked per row
STAFF           admin: products, stock, content, enquiries, orders
ADMIN           the above, plus users, roles and legal settings
```

Enforced **server-side in every service**, not at the route boundary alone. Hiding a link is not authorization.

Detail in `AUTHENTICATION.md`, `AUTHORIZATION.md` and `SECURITY.md`.

---

## 10. Failure behaviour

Designed, not incidental:

| Failure | Behaviour |
|---|---|
| Database unreachable | ISR serves the last good page. Writes fail with a clear message and a WhatsApp fallback |
| Email provider down | Enquiry is already saved. Failure logged, retried, never shown |
| Storage down | Existing images serve from CDN. Uploads fail with a clear admin error |
| Payment provider down | Checkout blocked with an honest message. No pending order created |
| Duplicate webhook | Unique constraint rejects. Returns 200 |
| Rate limit hit | 429 with `Retry-After` and plain-language copy |
| Unknown slug | 404 with category suggestions |

---

## 11. Deliberately not building

| Not building | Why | Revisit when |
|---|---|---|
| Microservices | One team, one database | never, for this product |
| GraphQL | Server Components already colocate fetching | a mobile app or third-party consumer |
| Redis cache layer | ISR covers the read path | measured cache pressure |
| Elasticsearch / Algolia | Postgres FTS is ample for hundreds of SKUs | measured relevance or latency failure |
| Job queue | Nothing needs one yet | scheduled reports, bulk imports |
| Global client state store | Server state stays on the server; cart is the only client state | genuinely complex cross-page state |
| Shared `packages/core` | One consumer today | `apps/admin` exists |
| Docker for local dev | Neon branches serve the same purpose with less setup | offline development becomes a requirement |

---

## 12. Implementation order

Following the client's §97, adjusted for one coupling found in the audit.

| Phase | Work | Days |
|---|---|---|
| 1 | Repository audit | ✅ done |
| 2 | Architecture documentation | ✅ this pass |
| 3–4 | Schema + migrations | 3 |
| 5 | Seed, clearly marked demo | 1 |
| 6 | Repositories + services | 4 |
| 7 | **Search endpoint** — moved earlier, see below | 2 |
| 8 | Frontend cutover, page by page | 4 |
| 9 | Enquiries: Server Actions, persistence, email | 3 |
| 10 | Authentication | 5 |
| 11 | Authorization + RBAC | 2 |
| 12 | Admin | 20–28 |
| 13–15 | Cart, orders, payment, inventory `[if enabled]` | 14 |
| 16 | Observability, analytics | 2 |
| 17 | Security hardening | 4 |
| 18 | Performance | 3 |
| 19 | Tests: Vitest + Playwright + CI | 10 |
| 20 | Deployment | 3 |
| | **Total, enquiry-only** | **~66** |
| | **Total, with commerce** | **~80** |

**Why search moves ahead of the cutover:** `SearchOverlay` is a client component importing the catalogue directly. The moment products live in Postgres, client-side search stops working. The endpoint has to exist before the data source changes, or search breaks mid-migration.

---

## 13. Decisions this design does not make

Carried in `OPEN-QUESTIONS.md`, and each changes scope:

| ID | Question | Affects |
|---|---|---|
| `OQ-001` | Sell online, or enquiry-only? | 14 days, ~8 tables |
| `OQ-038` | Custom admin, or a CMS? | 10–12 days |
| `OQ-016` | The real product catalogue | every product page |
| `OQ-049` | The real type layer | taxonomy seed |
| `OQ-050` | Product URL shape — already flat at `/products/p/[slug]`; confirm | irreversible once indexed |

Phases 3–11 are unaffected by all of them. **Work can start now.**
