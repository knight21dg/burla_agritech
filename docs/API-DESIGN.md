# API Design — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/API-DESIGN.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. Strategy: mostly no API

The client's §24 says not to create APIs for the sake of having them. In a Next.js App Router application that is not a slogan — it is the correct architecture.

**Server Components call services directly.** A category page does not fetch `/api/products`; it calls `productService.listByCategory()` in the same process. Adding HTTP there would mean serialising, a network hop, a second validation pass and a cache layer, for nothing.

So the rule is:

| Need | Mechanism | Why |
|---|---|---|
| Read data for a server-rendered page | **Direct service call** | No HTTP needed |
| Write from our own UI (forms, cart) | **Server Action** | Typed end to end, progressive enhancement, CSRF handled by the framework |
| A **client component** needs data | **Route Handler** | It has no other option |
| An **external system** calls us | **Route Handler** | Webhooks cannot invoke Server Actions |
| Infrastructure needs to probe us | **Route Handler** | Health checks |

That yields **four endpoints**, not thirty.

---

## 2. The endpoints

| Method | Path | Auth | Exists because |
|---|---|---|---|
| GET | `/api/search` | public | `SearchOverlay` is a client component |
| GET | `/api/health` | public | uptime monitoring, deploy gates |
| POST | `/api/uploads/sign` | staff | browser uploads directly to R2 |
| POST | `/api/webhooks/razorpay` | signature | `[commerce]` external caller |

Everything else is a Server Action or a direct service call. If a fifth endpoint is proposed, it needs to answer: *which client component or external system requires it?*

---

## 3. Response envelope

```jsonc
// success
{ "data": { … } }

// error
{ "error": { "code": "VALIDATION_ERROR",
             "message": "Please check the highlighted fields.",
             "details": { "email": "Enter a valid email address." } } }
```

`message` is always safe to show a user. Internal detail, stack traces and SQL never cross the boundary — they go to Sentry with a correlation id.

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed Zod. `details` carries field errors |
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated, wrong role, or not the owner |
| `NOT_FOUND` | 404 | Includes rows the caller may not see — see §7 |
| `CONFLICT` | 409 | Slug or SKU taken, invalid state transition |
| `RATE_LIMITED` | 429 | With `Retry-After` |
| `EXTERNAL_SERVICE_ERROR` | 502 | Payment, email or storage failed |
| `INTERNAL_ERROR` | 500 | Anything unhandled. Generic message only |

Server Actions return the same shape as a value rather than an HTTP status:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string> } }
```

---

## 4. `GET /api/search`

The one endpoint that unblocks the frontend cutover.

| | |
|---|---|
| **Auth** | Public |
| **Query** | `q` string 2–64 · `limit` int 1–20, default 6 · `type` `all｜product｜category`, default `all` |
| **Validation** | Zod. `q` trimmed; under 2 characters returns an empty list, not an error |
| **Rate limit** | 60/min per IP |
| **Cache** | `no-store`. Results depend on publish state |

```jsonc
{ "data": {
    "query": "mango",
    "products": [{ "slug":"mango-pickle", "name":"Mango Pickle",
                   "categoryName":"Pickles", "typeName":"Mango",
                   "priceMinor":28000, "variantLabel":"200g",
                   "imageUrl":null, "href":"/products/p/mango-pickle" }],
    "categories": [{ "slug":"pickles", "name":"Pickles", "href":"/products/pickles" }],
    "total": 3 } }
```

**Only published rows.** Drafts and archived products are invisible to this endpoint regardless of who is asking.

Postgres full-text over `search_vector` (name, descriptor, category, type, keywords), with `pg_trgm` similarity as a fallback so "vadiyalu" still finds "vadiyalu" when someone types "vadiyaalu". The service is `searchProducts(q, opts)` — swapping the implementation later requires no caller changes.

---

## 5. `GET /api/health`

| | |
|---|---|
| **Auth** | Public |
| **Rate limit** | 120/min per IP |
| **Cache** | `no-store` |

```jsonc
{ "data": { "status": "ok", "version": "…", "checks": {
    "database": { "ok": true, "latencyMs": 12 } } } }
```

Returns 200 when healthy, 503 when a hard dependency is down. It runs a single `SELECT 1` — **it must never become expensive**, or the monitor becomes the load. No secrets, no environment names, no connection strings.

---

## 6. `POST /api/uploads/sign`

| | |
|---|---|
| **Auth** | Session with `staff` or `admin` |
| **Body** | `filename`, `contentType`, `sizeBytes` |
| **Rate limit** | 30/min per user |

Returns a short-lived presigned R2 URL. The browser then PUTs the file directly, so images never pass through the application server.

Security, since this is the classic upload hole:

- `contentType` allowlisted to `image/jpeg｜png｜webp｜avif`. **The extension is never trusted.**
- Size capped server-side at 10MB.
- The **server** sets the stored `Content-Type` and object key; the client cannot choose either.
- Key is `products/{uuid}.{ext}` — never the user's filename.
- Dimensions verified after upload; the `media` row is only created once the object is confirmed.

## 7. `POST /api/webhooks/razorpay` `[commerce]`

| | |
|---|---|
| **Auth** | HMAC signature over the raw body |
| **Rate limit** | none — signature is the gate |
| **Cache** | never |

```
raw body → verify HMAC (timing-safe) → 401 if invalid
         → INSERT webhook_events(provider, event_id)   ← UNIQUE
              on conflict → already handled → 200
         → transaction: create order, snapshot items, decrement stock, record payment
         → 200
```

Always returns 200 for a signature-valid event, including duplicates — a non-200 makes Razorpay retry, and retrying a successful order is worse than the original problem. Genuine processing failures are recorded on the `webhook_events` row and alerted, not surfaced as an error status.

---

## 8. Server Actions

| Action | Auth | Rate limit | Notes |
|---|---|---|---|
| `submitContactEnquiry` | public | 3/h per IP | Turnstile + honeypot. **Persists before emailing** |
| `submitWholesaleEnquiry` | public | 5/h per IP | as above |
| `subscribeNewsletter` | public | 3/h per IP | double opt-in |
| `signUp` / `signIn` / `signOut` | public | 3/h, 5/15min | uniform responses, no user enumeration |
| `requestPasswordReset` | public | 3/h | **always** reports success |
| `addToCart` / `updateCartItem` | session | 60/min | `[commerce]` |
| `createCheckout` | session | 10/10min | recalculates every price server-side |
| `admin.*` | staff/admin | 120/min | every one writes `audit_log` |

Each runs the five steps in `SYSTEM-DESIGN.md` §5: parse → authorize → rate limit → execute → audit.

---

## 9. Rules that apply everywhere

**Sorting is an allowlist.** A user-supplied column name never reaches SQL:

```ts
const SORTS = {
  featured:   [desc(products.featured), asc(products.sortOrder)],
  newest:     [desc(products.publishedAt)],
  "price-asc":  [asc(variants.priceMinor)],
  "price-desc": [desc(variants.priceMinor)],
  "name-asc":  [asc(products.name)],
} as const;                     // anything else → featured
```

**Pagination is mandatory.** No list endpoint returns unbounded rows. Listings use `limit`/`offset` with a hard cap of 60; the search suggestion list caps at 20. Order history and audit use cursor pagination, since those grow without limit and offset scanning degrades.

**Mass assignment is impossible by construction.** Every write parses through a Zod schema with `.strict()`, so an unexpected `role` or `status` field is rejected rather than ignored.

**404 rather than 403 for hidden rows.** Asking for a draft product returns "not found", not "forbidden" — the latter confirms the row exists.

---

## 10. Caching per surface

| Surface | Header / strategy |
|---|---|
| Product and category pages | ISR 60s, tagged; revalidated on publish |
| `/api/search` | `no-store` |
| `/api/health` | `no-store` |
| Cart, checkout, account, admin | `no-store`, `private` |
| Images (R2/CDN) | `public, max-age=31536000, immutable` — keys are content-addressed |

---

## 11. Versioning

None, deliberately. There are no external consumers; the only clients are this application's own components, deployed together.

If a third party ever integrates, the routes become `/api/v1/*` at that point. Versioning an API with one in-process consumer is ceremony.
