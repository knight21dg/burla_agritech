# Security & Compliance — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/SECURITY.md` |
| Version | 0.2 — two-origin architecture |
| Date | 2026-09-07 |

> **Scope note.** §8 summarises our understanding of the Indian regulatory requirements that apply to a food business selling or marketing online. It is written so nothing is missed during build. **It is not legal advice.** The client must have these confirmed by their own legal or regulatory advisor before launch.

---

## 1. Threat model

| # | Threat | Asset at risk | Likelihood | Impact | Primary control |
|---|---|---|---|---|---|
| T1 | Automated form spam | Enquiry pipeline, staff time, email reputation | High | Medium | Turnstile + honeypot + timing + rate limit |
| T2 | Credential stuffing | Customer accounts | Medium | High | Rate limiting, generic errors, strong hashing, breach-password rejection |
| T3 | Payment tampering — modified prices | Revenue | Medium | Critical | Server-side price recalculation; client totals never trusted |
| T4 | Webhook forgery / replay | Order integrity | Medium | Critical | Signature verification + idempotency on `event_id` |
| T5 | Unauthorised access to the admin application | All content, stock, orders, customer data | Low | Critical | Separate origin, invitation-only accounts, mandatory MFA, RBAC re-checked in every server action, audit logging, optional network restriction |
| T6 | XSS via admin-authored rich text | Customer sessions | Low | High | Tiptap JSON rendered by a typed serialiser; no `dangerouslySetInnerHTML`; strict CSP |
| T7 | SQL injection | Database | Low | Critical | Drizzle parameterised queries; no raw string SQL |
| T8 | IDOR — reading another user's order | Customer PII | Medium | High | Ownership checks on every record access, never trusting an ID from the client |
| T9 | Secret leakage to the client bundle | Everything | Medium | Critical | Env schema, `NEXT_PUBLIC_` discipline, lint rule, bundle inspection in CI |
| T10 | Dependency compromise | Everything | Low | Critical | Lockfile, scanning, Dependabot, no postinstall scripts from unvetted packages |
| T11 | Enumeration of users via auth responses | Privacy | Medium | Medium | Identical responses and timing for existing and non-existing accounts |
| T12 | Scraping of the catalogue | Business data | High | Low | Accepted — a public catalogue is meant to be read. Rate limit only to protect availability |
| T13 | Denial of service | Availability | Low | Medium | Vercel + Cloudflare edge, rate limits, ISR absorbing traffic |
| T14 | Session hijacking | Accounts | Low | High | httpOnly + Secure + SameSite cookies, rotation on privilege change, short TTL |
| T15 | Staging environment indexed or reachable | Brand, SEO | Medium | Medium | `Disallow: /` + access protection on preview deployments |

---

## 2. Authentication and session management

- Email/password with verification, plus optional OAuth. **Browsing and enquiring never require an account** (FR-123).
- Password hashing with the auth library's modern default (Argon2id or scrypt). No custom crypto anywhere.
- Password policy: minimum 10 characters, checked against a known-breached-password list. **No forced composition rules or rotation** — they demonstrably produce weaker passwords.
- Sessions stored in the database, referenced by an opaque hashed token in an `httpOnly`, `Secure`, `SameSite=Lax` cookie. 30-day expiry with rolling renewal.
- Session invalidated on password change, on email change, and on explicit sign-out (all devices).
- Verification and reset tokens: single-use, hashed at rest, 1-hour expiry, consumed atomically.
- Auth responses are **uniform** whether or not an account exists (T11).
- MFA on the admin application, Vercel, Neon and Cloudflare accounts is mandatory for all staff.

---

## 3. Authorisation and the admin application

- Roles: `customer`, `staff`, `admin`.
- Every protected route checks authorisation **server-side**. Middleware is a convenience, never the only gate.
- Ownership is verified on every record read and write: an order is fetched by `(id AND user_id)`, never by `id` alone (T8).

### 3.1 Why the admin is a separate application

Running the admin on its own origin (`admin.burla.com`, `apps/admin`) is a security decision as much as an architectural one:

| Property | Benefit |
|---|---|
| Separate origin | Cookies are host-scoped — a customer session on `burla.com` is not an admin session, and cannot become one |
| Separate build | Admin code, queries and dependencies are **not shipped** to customers, not merely hidden |
| Separate CSP and headers | The admin can run a stricter policy without constraining the marketing site |
| Separate network policy | Cloudflare Access or an IP allowlist can front the admin domain without affecting customers (`OQ-040`) |
| Separate blast radius | An XSS on a public page cannot reach admin functionality |

### 3.2 Admin-specific controls

- **No public sign-up route exists.** Staff accounts are created by an existing admin and activated through a single-use, time-limited invitation token.
- **MFA (TOTP) is mandatory** for every `staff` and `admin` account. Sign-in without a second factor is not possible.
- Admin sessions are **8 hours, non-rolling**, and are invalidated immediately on role change or password change.
- **Every admin server action re-checks the role**, independently of middleware.
- **Every admin mutation writes to `audit_log`** — actor, action, entity, before/after, hashed IP.
- Destructive actions confirm explicitly and archive rather than hard-delete wherever history has value.
- The admin domain returns `Disallow: /` and `X-Robots-Tag: noindex` on every response.
- Rate limiting on admin sign-in is stricter than on the customer site: 5 attempts per 15 minutes, then a 1-hour lockout per account.

---

## 4. Input handling

- **Every** external input — form fields, query strings, route params, webhook bodies, headers used in logic — is parsed with Zod before use. Unvalidated input never reaches business logic.
- The same schema is shared by client and server so validation cannot drift.
- Output encoding is React's default. `dangerouslySetInnerHTML` is banned; Tiptap JSON is rendered through typed serialisers with an allowlisted node set.
- **File uploads happen only in the admin application**, by authenticated staff, through presigned R2 URLs with server-enforced MIME type and size limits, and the stored content type is set by the server rather than trusted from the client. **The customer site accepts no uploads at all.**
- Redirect targets after auth are validated against an allowlist of internal paths (no open redirects).

---

## 5. HTTP security headers

Set in `next.config.ts` and middleware:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | Nonce-based `script-src`; `default-src 'self'`; explicit allowlist for the R2 image domain, PostHog, Sentry, Razorpay, Turnstile; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

CSP is deployed in `Report-Only` first, reports reviewed, then enforced. Shipping a broken enforcing CSP is a worse outcome than a short report-only period.

---

## 6. Rate limiting

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| Sign in (customer) | 5 | 15 min | IP + email |
| Sign in (admin) | 5, then 1-hour account lockout | 15 min | IP + email |
| Sign up | 3 | 1 hour | IP |
| Password reset request | 3 | 1 hour | IP + email |
| Contact form | 3 | 1 hour | IP |
| Wholesale form | 5 | 1 hour | IP |
| Search API | 60 | 1 min | IP |
| Checkout creation | 10 | 10 min | Session |
| Webhooks | Not rate limited | — | Signature-verified instead |

Exceeding a limit returns 429 with `Retry-After` and an honest message. Auth limits also apply per account to prevent distributed attacks against one target.

---

## 7. Payment security `[commerce]`

- **No card data ever touches our servers or database.** Razorpay's hosted flow handles it; we store only provider references.
- Order amounts are computed server-side from current catalogue prices at checkout. A client-supplied amount is never used.
- Webhook handling: verify HMAC signature → check `event_id` uniqueness → process inside a transaction → record in `webhook_events`. A replayed event is a no-op (T4).
- The order is created by the webhook, not the browser redirect — a closed tab cannot lose a paid order.
- Payment-success-but-order-creation-failure raises an immediate alert and is reconcilable from `payments`.
- Refunds are issued through the provider API only, always logged in `audit_log`.
- Every payment-related change requires a second reviewer.

---

## 8. Regulatory compliance — India

Applicable requirements as we understand them. **Client to confirm with their advisor.**

### 8.1 Food safety — FSS Act 2006 and FSSAI regulations
- The FSSAI licence number must be displayed. `OQ-003`
- Mandatory product labelling information must appear on the product page: ingredients list in descending order by weight, allergen declaration, net quantity, veg/non-veg mark, storage conditions, shelf life / best-before basis, and the FSSAI licence number of the manufacturing unit.
- **No health, nutritional or therapeutic claim may be made without substantiation.** No such claim will be written without client-supplied evidence.

### 8.2 Legal Metrology (Packaged Commodities) Rules 2011 — Rule 6
For goods sold online, the listing must declare: name and address of the manufacturer / packer / importer, common or generic name of the commodity, net quantity, retail sale price as MRP inclusive of all taxes, consumer-care contact details, and country of origin.
→ These are modelled as **required-to-publish** fields on the `product` document (`DATABASE.md` §2.1).

### 8.3 Consumer Protection (E-Commerce) Rules 2020
- Legal entity name, registered address and customer-care contact displayed.
- **Grievance officer** named with contact details and a stated response timeline. `OQ-005`
- Country of origin displayed.
- Return, refund, exchange, warranty and delivery policies published and accurate.
- No fake reviews and no misleading advertisement — reinforces the prohibition on invented testimonials.

### 8.4 Digital Personal Data Protection Act 2023
- Collect only what is necessary; state the purpose at the point of collection.
- Notice and consent for personal data; consent must be as easy to withdraw as to give.
- Rights to access, correct and erase, with a stated process.
- Breach notification obligations — an incident response plan exists (§11).
- Children's data: no processing of data of under-18s; no behavioural advertising to them.

### 8.5 GST and IT Act
- GSTIN displayed; GST-compliant invoices for online sales. `OQ-002`, `OQ-029`
- Terms of Use and Privacy Policy published (IT Rules).

### 8.6 Accessibility
Not currently a statutory requirement for private Indian websites, but WCAG 2.2 AA is a contractual requirement here and reduces exposure in export markets where it *is* mandated.

---

## 9. Secrets management

- No secret is ever committed. `.gitignore` covers `.env*` from the very first commit.
- `lib/env.ts` validates all environment variables with Zod at build; a missing secret fails the build rather than failing at runtime in production.
- Server-only variables have no `NEXT_PUBLIC_` prefix; a lint rule blocks referencing them from client components.
- CI inspects the client bundle for known secret patterns.
- Secret rotation procedure documented; rotation on any staff departure.
- Separate credentials per environment. Production secrets are never present in preview environments.

**Immediate risk in this project:** the working directory currently resolves to a git repository rooted at the user's Windows home folder, which contains `.ssh/`, credential files and browser data (`PROJECT-BRIEF.md` §9). A dedicated repository with a `.gitignore` must exist before the first commit.

---

## 10. Dependencies and supply chain

- Lockfile committed; exact versions.
- `npm audit` / Dependabot in CI; high and critical vulnerabilities block the merge.
- Every new dependency requires a stated justification, a maintenance check (recent releases, open issues, contributor count) and a bundle-size check.
- Prefer copy-in components (shadcn/ui) over runtime dependencies where reasonable.
- No unvetted package with a postinstall script.

---

## 11. Monitoring and incident response

| Item | Approach |
|---|---|
| Error tracking | Sentry with release tracking and source maps; PII scrubbed before send |
| Alerting | Payment failures, webhook processing failures, auth error spikes, 5xx rate |
| Audit logging | Every admin mutation in `audit_log` |
| Logging hygiene | No passwords, tokens, card data, full IPs or full emails in logs |
| Incident response | Documented: detect → contain → assess → notify → remediate → review. Named owner. Breach notification timelines per DPDP |
| Backup restore | Tested before launch and re-tested quarterly. **An untested backup is not a backup** |

---

## 12. Pre-launch security checklist

- [ ] All security headers present and verified against a live response
- [ ] CSP enforcing, with no console violations across all key flows
- [ ] `npm audit` clean at high and critical
- [ ] No secret in the client bundle — verified by inspection, not assumption
- [ ] Rate limiting verified on every listed endpoint
- [ ] Auth flows tested: valid, invalid, locked out, expired token, reused token
- [ ] IDOR tested — attempt to read another user's order and address
- [ ] Webhook signature verification tested with a forged payload
- [ ] Webhook idempotency tested with a duplicate delivery
- [ ] Price tampering tested — modified client payload rejected server-side
- [ ] Admin routes inaccessible without the correct role, verified per route **and** per server action
- [ ] A customer session cookie is rejected by the admin origin
- [ ] MFA cannot be bypassed on any staff account
- [ ] No public sign-up route exists on the admin domain
- [ ] Admin domain returns `noindex` and is absent from search results
- [ ] Upload endpoint rejects oversized files and disallowed MIME types
- [ ] Preview and staging environments protected and `noindex`
- [ ] Backup restore drill completed and documented
- [ ] All legal pages published with real content and legal identifiers (§8)
- [ ] Grievance officer details published
- [ ] Dependency and infrastructure MFA confirmed for all staff accounts
