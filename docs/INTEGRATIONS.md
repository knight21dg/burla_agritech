# External Integrations — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/INTEGRATIONS.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. Rules

1. **Every integration sits behind an interface** in `server/integrations/`. Domain code depends on `EmailSender`, never on Resend.
2. **No third-party type crosses into a service.** A Razorpay object never becomes a function argument in `orderService`.
3. **Every integration can fail.** The behaviour when it does is designed, not discovered — see the failure column in each section.
4. **No integration is trusted for data integrity.** Payment confirmation is verified server-side; a "success" from the browser proves nothing.
5. **Every integration is togglable.** A missing key disables the feature with a clear log line; it does not crash the catalogue.

The interface rule earns its keep at the first vendor change. Swapping Resend for SES should be one file, not a search across the codebase.

---

## 2. The set

| Concern | Choice | Why | Blast radius if it fails |
|---|---|---|---|
| Database | **Neon Postgres** | Branching per preview, serverless pricing, plain Postgres | Site serves from ISR cache; writes fail |
| Object storage | **Cloudflare R2** | No egress fees — an image-heavy catalogue on S3 pays per view | Existing images serve from CDN; uploads fail |
| Email | **Resend** | Simple API, good deliverability, generous free tier | Enquiry is already saved; alert only |
| Payments `[commerce]` | **Razorpay** | UPI, the dominant Indian rail. Stripe does not serve Indian domestic UPI well | Checkout blocked with an honest message |
| Rate limiting | **Upstash Redis** | Serverless-native; in-memory counters do not work across Vercel instances | Fail closed on writes, open on reads |
| Bot protection | **Cloudflare Turnstile** | No puzzle for the user, unlike reCAPTCHA | Fall back to honeypot + rate limit |
| Errors | **Sentry** | Source maps, release tracking | Silent. Never blocks a request |
| Analytics | **PostHog** | Self-hostable later; EU region available | Silent |
| Hosting | **Vercel** | First-party Next.js. Preview per PR | — |

Deliberately **not** integrated: a CMS (`DATA-OWNERSHIP.md` §4), a search service (Postgres FTS is ample for hundreds of SKUs), a job queue, a CRM, an ERP.

---

## 3. Email — Resend

```ts
export interface EmailSender {
  send(msg: { to: string; subject: string; react: ReactElement }): Promise<Result<{ id: string }>>;
}
```

| Email | Trigger | To |
|---|---|---|
| Enquiry received | Contact / wholesale form | `ENQUIRY_NOTIFY_TO` |
| Enquiry acknowledgement | same | the customer |
| Verify email address | Registration | the customer |
| Password reset | Reset request | the customer |
| Order confirmation `[commerce]` | Payment webhook | the customer |
| Shipping update `[commerce]` | Admin | the customer |

**Email is never in the critical path of a write.** The enquiry row is committed first; the send is best-effort afterwards (`SYSTEM-DESIGN.md` §7). A lead lost to an SMTP outage is unacceptable; an email that arrives two minutes late is not.

Failures are logged with the enquiry id and alerted, never surfaced to the customer — they submitted successfully, and telling them otherwise would produce a duplicate submission.

Password reset and verification emails are the exception: those are the whole point of the request, so a send failure returns a genuine error. Even then the response is uniform, so a failure cannot be used to probe which addresses are registered (`AUTHENTICATION.md`).

---

## 4. Storage — Cloudflare R2

Browser uploads directly to R2 via a presigned URL (`API-DESIGN.md` §6). Images never pass through the application server, so a 10MB upload does not occupy a serverless function.

```ts
export interface ObjectStorage {
  presignUpload(input: { key: string; contentType: string; maxBytes: number }): Promise<PresignedUpload>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
```

Security, since uploads are the classic hole:

- Content type allowlisted server-side. **The file extension is never trusted.**
- The **server** chooses the object key — `products/{uuid}.{ext}` — never the user-supplied filename.
- The server sets the stored `Content-Type`; the client cannot.
- Size capped server-side, not just in the browser.
- The `media` row is created only after the object is confirmed present, so a failed upload leaves no dangling reference.
- Keys are content-addressed, so `max-age=31536000, immutable` is safe.

Bucket is private. Public reads go through a CDN domain that serves objects and nothing else — no listing, no write.

---

## 5. Payments — Razorpay `[commerce, pending OQ-001]`

The single most important rule in this document:

> **A payment is confirmed by a signature-verified webhook, never by the browser.**

The redirect after payment is a UX convenience. It can be closed, refreshed, replayed, or forged. The order is created by the webhook.

```
create order (server, amount recalculated from DB)
   → customer pays
   → webhook: verify HMAC over the RAW body, timing-safe
   → INSERT webhook_events(provider, event_id)     UNIQUE
        conflict → already processed → 200
   → transaction: order + snapshotted items + stock decrement + payment
   → 200
```

| Guard | Mechanism |
|---|---|
| Forged webhook | HMAC over the raw body, timing-safe compare. 401 otherwise |
| Replayed webhook | Unique constraint on `(provider, event_id)` — the database, not application logic |
| Tampered amount | Server recalculates every line from current DB prices. A browser-supplied price is ignored entirely |
| Lost order on a closed tab | Order comes from the webhook, not the redirect |
| Oversold stock | `SELECT … FOR UPDATE` on decrement |

**Card numbers never touch our servers.** Razorpay Checkout is hosted; we hold an order id and a payment id. No PCI scope beyond that.

Refunds are initiated from the admin and reconciled by webhook. Order rows are never deleted (`DATA-OWNERSHIP.md` §7).

---

## 6. Rate limiting — Upstash

```ts
export interface RateLimiter {
  check(key: string, rule: RateRule): Promise<{ ok: boolean; retryAfterSec?: number }>;
}
```

Limits are in `API-DESIGN.md` §8. Keys are `{action}:{ip}` or `{action}:{userId}` — by account where the target is an account, so an attacker rotating IPs still cannot brute-force one login.

If Upstash is unreachable: **fail closed on writes, open on reads.** A visitor should still see the catalogue when the rate limiter is down; nobody should be able to submit unlimited enquiries because a dependency is down.

---

## 7. Bot protection — Turnstile

Server-side verification of the token, plus the honeypot and timing checks already in `EnquiryForm`. Three cheap layers beat one strong one, and Turnstile is invisible to a real customer.

If verification is unavailable, the honeypot and rate limit still apply — the form stays usable rather than blocking every legitimate enquiry.

---

## 8. Monitoring — Sentry

Errors, releases, source maps. Scrubbing is configured before the first event is sent:

**Never sent:** passwords, tokens, session cookies, `Authorization` headers, full request bodies from auth or checkout, `DATABASE_URL`, any `*_SECRET` or `*_KEY`.

Every error carries a correlation id that also appears in the user-facing message, so "something went wrong, reference `a3f9c1`" is actionable without leaking a stack trace (`SECURITY.md`).

---

## 9. Analytics — PostHog

Product analytics only, and only with consent. Under the DPDP Act 2023 consent is opt-in and must be as easy to withdraw as to give.

Events: page views, category and product views, search queries, add-to-bag, enquiry submitted, checkout steps. **No PII in event properties** — a user id, never an email address. Search queries are stored as typed, so the consent banner is not decorative.

---

## 10. Integration failure summary

| Down | Customer sees | Business sees |
|---|---|---|
| Neon | Cached pages; writes fail with a WhatsApp fallback | Sentry alert |
| R2 | Existing images fine; new uploads fail | Admin error |
| Resend | Nothing — enquiry saved | Alert with the enquiry id |
| Razorpay | Honest checkout message. No pending order | Alert |
| Upstash | Nothing on reads; writes rejected | Alert |
| Turnstile | Nothing — form still works | Warning |
| Sentry | Nothing | Blind, temporarily |
| PostHog | Nothing | Gap in data |

Only Neon and Razorpay are hard dependencies, and only for writes.

---

## 11. Open questions

| ID | Question |
|---|---|
| `OQ-001` | Sell online — determines whether Razorpay is integrated at all |
| `OQ-065` | Better Auth or Auth.js v5 (see `AUTHENTICATION.md`) |
| `OQ-066` | Which domain sends transactional email; DNS access needed for SPF/DKIM |
| `OQ-067` | PostHog region — EU or US |
