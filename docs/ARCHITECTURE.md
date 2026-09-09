# Technical Architecture — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/ARCHITECTURE.md` |
| Version | 0.2 — **two-application architecture** |
| Date | 2026-09-07 |
| Status | Proposed — awaiting approval |
| Change from v0.1 | Client confirmed two websites: a customer site and a separate admin site. Sanity removed; Postgres is now the single source of truth. See ADR-009 and ADR-010 |

> ⚠️ **Unresolved conflict (`OQ-055`).** The clarified brief of 2026-09-09 lists
> **Sanity** in the stack, which reverses ADR-010. That decision removed Sanity
> specifically because the client asked for one admin managing "stock and
> everything", and keeping a CMS alongside it means two logins and product data
> split across two stores. This document still describes the custom-admin
> architecture. **Do not begin Phase 16 until `OQ-055` is answered.**

---

## 1. Architectural principles

1. **Two applications, one system.** A public customer site and a private admin site, deployed separately, sharing one database and one set of typed domain packages.
2. **One source of truth.** PostgreSQL owns everything — catalogue, content, stock, orders, enquiries. No second content store, no synchronisation, no ambiguity about where a value lives.
3. **Server-first.** React Server Components by default in both apps. Client components only at interactive leaves.
4. **Admin code never reaches the customer.** Separate builds mean the admin bundle, its dependencies and its logic are not merely hidden from customers — they are not shipped at all.
5. **Commerce is a module, not a mode.** Whether V1 sells online or takes enquiries only (`OQ-001`), the same architecture holds. Commerce ships behind a feature flag.
6. **Fewer dependencies.** Every package justifies itself. No two libraries solving one problem.
7. **Configuration over hard-coding.** No business value appears in source.

---

## 2. System overview

```
        CUSTOMERS                              STAFF
            │                                    │
    ┌───────▼────────┐                  ┌────────▼────────┐
    │  burla.com     │                  │ admin.burla.com │
    │                │                  │                 │
    │  apps/web      │                  │  apps/admin     │
    │  Next.js       │                  │  Next.js        │
    │  public · SEO  │                  │  private · MFA  │
    │  ISR cached    │                  │  always dynamic │
    └───────┬────────┘                  └────────┬────────┘
            │                                    │
            │      revalidation webhook          │
            │  ◄─────────────────────────────────┤
            │       (HMAC-signed, on publish)    │
            │                                    │
            └──────────────┬─────────────────────┘
                           │
                  ┌────────▼─────────┐
                  │   packages/db    │   Drizzle schema + client
                  │   packages/core  │   domain logic + Zod schemas
                  │   packages/ui    │   shared design system
                  └────────┬─────────┘
                           │
              ┌────────────▼─────────────┐
              │   PostgreSQL (Neon)      │   single source of truth
              └────────────┬─────────────┘
                           │
     ┌─────────┬───────────┼───────────┬──────────┐
     │         │           │           │          │
 Cloudflare  Razorpay   Resend     PostHog     Sentry
    R2      [commerce]   email    analytics   errors
  (images)

 WhatsApp: outbound wa.me deep links only — no API, no widget script
```

### Why two applications rather than one app with an `/admin` route

| Benefit | Detail |
|---|---|
| **Bundle isolation** | Admin dependencies — rich-text editor, upload widgets, data tables, charts — never enter the customer bundle. This is worth ~150–250KB of JS the customer never downloads |
| **Security posture** | The admin origin can be locked down independently: Cloudflare Access, IP allowlist, mandatory MFA, stricter CSP, no public sign-up. An attack surface on the customer site does not reach admin code |
| **Different rendering models** | Customer site is aggressively cached (ISR). Admin is always dynamic and never cached. These are opposing configurations, awkward to hold in one app |
| **Independent deploys** | An admin fix does not redeploy and re-warm the customer site's cache |
| **Clear blast radius** | An admin bug cannot take down the storefront |

**Cost:** monorepo tooling, two deployments, two environment sets, and the discipline to keep shared logic in `packages/` rather than duplicating it. Worth it here.

---

## 3. Technology decisions

| Layer | Choice | Rationale |
|---|---|---|
| Monorepo | **Turborepo + pnpm workspaces** | Task caching, shared packages, one lockfile |
| Framework | **Next.js (App Router)** — both apps | Server components, ISR for web, server actions for admin |
| Language | **TypeScript, strict** | Non-negotiable |
| UI | **React 19** | Server components, Actions, `useOptimistic` |
| Styling | **Tailwind CSS v4** | One shared token preset across both apps |
| Components | **shadcn/ui on Radix** | Copy-in; accessible primitives; admin gets data-table, form and dialog patterns for free |
| Animation | **Motion for React** | Customer app only |
| Icons | **Lucide** | Both apps |
| **CMS** | **None — custom admin** | See ADR-010 |
| Database | **PostgreSQL (Neon)** | Single source of truth; branching for previews |
| ORM | **Drizzle** | SQL-first, fully typed, shared schema package |
| Rich text | **Tiptap** (admin) → JSON → typed renderer (web) | WYSIWYG for non-technical staff; structured JSON output, never raw HTML |
| Image storage | **Cloudflare R2** + presigned uploads | Cheap, no egress fees, S3-compatible. Served via `next/image` |
| Validation | **Zod** in `packages/core` | One schema used by both apps, client and server |
| Forms | **React Hook Form + Zod resolver** | Both apps |
| Tables | **TanStack Table** (admin only) | Sorting, filtering, pagination for product and order lists |
| Auth | **Better Auth** | Shared user table; role-gated; MFA enforced for admin |
| Payments | **Razorpay** `[commerce]` | Standard for India |
| Email | **Resend + React Email** | Typed templates |
| Rate limiting | **Upstash Redis** | Both apps |
| Bot protection | **Cloudflare Turnstile** | Customer forms |
| Analytics | **PostHog** | Customer app only |
| Monitoring | **Sentry** | Both apps, separate projects |
| Testing | **Vitest · Testing Library · Playwright · axe-core** | Both apps |
| CI/CD | **GitHub Actions + Vercel** | Two Vercel projects from one repository |

**Version policy:** pin current stable, mutually compatible versions when Phase 7 begins. No speculative installs. Every new dependency needs a one-line justification in the PR.

---

## 4. Repository structure

```
burla/
├── apps/
│   ├── web/                          # burla.com — customer
│   │   ├── app/
│   │   │   ├── (marketing)/          # home, about, quality, locations, contact, wholesale, policies
│   │   │   ├── (shop)/               # shop, category, product, search
│   │   │   ├── (account)/            # auth + customer account
│   │   │   ├── (checkout)/           # cart, checkout            [commerce]
│   │   │   ├── api/
│   │   │   │   ├── revalidate/       # called by admin on publish
│   │   │   │   ├── webhooks/razorpay/
│   │   │   │   └── search/
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── components/
│   │   └── features/
│   │
│   └── admin/                        # admin.burla.com — staff
│       ├── app/
│       │   ├── (auth)/               # staff sign-in only, no sign-up
│       │   ├── (dashboard)/
│       │   │   ├── products/
│       │   │   ├── categories/
│       │   │   ├── inventory/
│       │   │   ├── orders/           [commerce]
│       │   │   ├── enquiries/
│       │   │   ├── customers/
│       │   │   ├── content/
│       │   │   ├── media/
│       │   │   ├── settings/
│       │   │   ├── users/
│       │   │   └── audit/
│       │   └── api/upload/           # R2 presigned URLs
│       ├── components/
│       └── features/
│
├── packages/
│   ├── db/                           # Drizzle schema, client, migrations, seed
│   ├── core/                         # domain logic + Zod schemas — the shared brain
│   │   ├── catalog/                  # product/category rules, availability, slugs
│   │   ├── pricing/                  # money maths, tax, totals
│   │   ├── inventory/                # stock movement rules
│   │   ├── enquiries/
│   │   ├── orders/                   [commerce]
│   │   └── schemas/                  # Zod — used by BOTH apps
│   ├── ui/                           # shared primitives + Burla design tokens
│   ├── email/                        # React Email templates
│   ├── storage/                      # R2 client, presigned uploads, image URLs
│   └── config/                       # eslint, tsconfig, tailwind preset
│
├── docs/
├── assets/
├── turbo.json
└── pnpm-workspace.yaml
```

### Boundary rules

- Business rules live in `packages/core` — **never duplicated between apps**. If admin validates a price and web displays it, both import the same function.
- `packages/db` is the only place raw Drizzle queries are written for shared entities.
- `apps/*/features/` holds app-specific orchestration only.
- `apps/web` must not import anything from `apps/admin`, and vice versa. Enforced by lint.
- `packages/ui` is presentation only — no data access.

---

## 5. The admin application

This is what "one place to add stock and everything" means concretely.

| Area | Capability |
|---|---|
| **Dashboard** | Today's orders and enquiries, low-stock alerts, recent activity |
| **Products** | Create, edit, duplicate, archive. Name, slug, category, descriptors, rich description, images with alt text, SEO fields, featured flag, related products |
| **Variants** | Per product: pack size, SKU, price, MRP, GST rate, weight, availability |
| **Inventory** | Stock levels across all variants, adjust with a reason, low-stock thresholds, full movement history |
| **Categories** | Create, edit, drag to reorder, hero image and copy, publish/unpublish |
| **Content** | Homepage sections (add, reorder, toggle), About, Quality, Locations, Contact, all four policy pages |
| **Media** | Image library — upload, search, alt text, replace, usage tracking before delete |
| **Orders** `[commerce]` | List, filter, detail, status transitions, invoice, refund, dispatch notes |
| **Enquiries** | Contact and wholesale enquiries, status pipeline, assignment, internal notes, CSV export |
| **Customers** | Accounts, order history, addresses |
| **Settings** | Contact details, WhatsApp number, socials, and the legal block — entity name, FSSAI licence, GSTIN, grievance officer |
| **Users** | Staff accounts, roles, MFA enforcement |
| **Audit** | Every mutation: who, what, when, before and after |

### Editorial guardrails carried over from the CMS design

The guardrails matter more than the tool. They are enforced in the admin's Zod schemas:

- **Alt text is required** — a product cannot be published without it on every image.
- **Legally mandated fields block publish** — ingredients, net quantity, shelf life, storage, country of origin, manufacturer address, FSSAI number, consumer care contact, veg/non-veg (`SECURITY.md` §8).
- **Slug changes prompt and auto-create a 301 redirect.**
- **Draft → preview → publish.** Preview renders the real customer page against draft data through a signed preview token.
- **Rich text is Tiptap JSON**, rendered by a typed serialiser. No raw HTML ever enters the database or the DOM.

---

## 6. Data flow between the two apps

```
Staff edits a product in admin
        │
        ▼
 Zod validation (packages/core)  ── rejects incomplete/non-compliant records
        │
        ▼
 Postgres write + audit log entry
        │
        ▼
 POST https://burla.com/api/revalidate   ── HMAC-signed with a shared secret
   { entity: "product", id, slug, categorySlug }
        │
        ▼
 Customer app: revalidateTag("product:id"), ("category:slug"), ("sitemap")
        │
        ▼
 Live within seconds
```

**Failure handling:** if revalidation fails, the write still succeeded — content is never lost. Failed revalidations are queued and retried, and a time-based ISR fallback (60s for catalogue, 300s for content) guarantees eventual freshness even if the webhook never lands. The admin surfaces a "publish pending" indicator rather than silently diverging.

---

## 7. Rendering and caching

| App | Content | Strategy |
|---|---|---|
| web | Home, category, product, marketing pages | ISR with cache tags, on-demand revalidation |
| web | Search | Dynamic, no cache |
| web | Cart, checkout, account | Dynamic, `no-store` |
| web | Sitemap | ISR 1 hour + on publish |
| **admin** | **Everything** | **Always dynamic, `no-store`, no ISR.** Staff must never see stale stock |

Cache tags: `product:{id}`, `category:{id}`, `page:{slug}`, `settings`, `navigation`, `sitemap`.

---

## 8. Authentication across two origins

- **One `users` table, one auth library, two session scopes.** Cookies are host-scoped, so a customer session on `burla.com` and a staff session on `admin.burla.com` are independent. A customer cannot escalate into admin by sharing a cookie.
- **No public sign-up on admin.** Staff accounts are created by an existing admin and activated by an invitation email.
- **MFA is mandatory for `admin` and `staff` roles.**
- **Every admin server action re-checks the role.** Middleware is a convenience, never the only gate.
- Optional additional layer: Cloudflare Access or an IP allowlist in front of `admin.burla.com` (`OQ-040`).
- Admin sessions are short — 8 hours, no rolling renewal, and are invalidated on role change.

---

## 9. API and server-action design

- **Server Actions** for all mutations in both apps.
- **Route Handlers** only for external callers: Razorpay webhook, revalidation webhook, R2 presigned uploads, sitemap, search.
- Every entry point: validate with Zod → authorise → rate limit → execute → audit (admin) → return a typed result.
- Uniform result shape: `{ ok: true, data } | { ok: false, error: { code, message, fields? } }`. Internal errors are never leaked.
- Idempotency keys on all payment operations.

---

## 10. Feature flags

`packages/core/config/features.ts`, from validated environment variables:

| Flag | Controls |
|---|---|
| `commerce.enabled` | Cart, checkout, payment, orders — **in both apps** |
| `commerce.guestCheckout` | Guest vs account-required checkout |
| `accounts.enabled` | Customer auth and account UI |
| `wishlist.enabled` | Wishlist |
| `i18n.enabled` | Reserved — locale routing |

A disabled feature renders no entry point in either app, and its routes 404.

---

## 11. Environment variables

Validated at build with Zod in each app. A missing variable fails the build, not production.

**Shared:** `DATABASE_URL` · `BETTER_AUTH_SECRET` · `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` · `RESEND_API_KEY` / `EMAIL_FROM` · `UPSTASH_REDIS_REST_URL` / `_TOKEN` · `REVALIDATE_SECRET` (HMAC, shared by exactly these two apps)

**Web only:** `NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_WHATSAPP_NUMBER` · `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` · `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` · `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET`

**Admin only:** `NEXT_PUBLIC_ADMIN_URL` · `ADMIN_ALLOWED_IPS` (optional)

**Rule:** anything without `NEXT_PUBLIC_` never appears in a client component. Enforced by lint and checked in CI against the built bundle.

---

## 12. Infrastructure

| Concern | Approach |
|---|---|
| Hosting | Two Vercel projects from one repository, each with its own root directory and domain |
| Domains | `burla.com` (+ `www` redirect) and `admin.burla.com` |
| DNS | Cloudflare. **DNS-only (grey cloud) for Vercel records** — proxying creates double-CDN caching conflicts and breaks ISR invalidation. Cloudflare is used for DNS, registrar, Turnstile and optionally Access on the admin subdomain |
| Database | Neon — production branch, plus a branch per preview environment |
| Images | Cloudflare R2, public bucket behind a custom domain, served through `next/image` |
| Backups | Neon PITR + daily logical dump to R2. **Restore tested before launch** |
| Environments | `development` → `preview` (per PR, both apps) → `staging` → `production` |
| Admin robots | `Disallow: /` and `X-Robots-Tag: noindex` on every admin response |

---

## 13. Architecture decision records

### ADR-001 — Modular monorepo over microservices
**Status:** Accepted. Two Next.js applications sharing typed packages; no network-separated services. Simple to develop and deploy; boundaries enforced by lint and review.

### ADR-002 — App Router with server components by default
**Status:** Accepted. Image-heavy catalogue where SEO and mobile performance are primary. Small JS payload; requires discipline about `"use client"` placement.

### ADR-003 — Products at `/products/[slug]`, not nested under category
**Status:** Accepted. Products may belong to more than one category. One canonical URL per product, no duplicate-content handling; category context conveyed by breadcrumbs.

### ADR-004 — PostgreSQL as the single source of truth *(revised)*
**Status:** Accepted — **supersedes the Sanity/Postgres split in v0.1.**
**Context:** v0.1 divided editorial content (Sanity) from transactional data (Postgres), with a documented migration point for price and stock. Introducing a custom admin makes that split actively harmful: staff would manage products in one system and stock in another, and "which system owns price?" becomes a live question on every screen.
**Decision:** Postgres owns everything. One database, one admin, one answer.
**Consequences:** Eliminates risk R6 and the price-ownership migration entirely. We build the editing UI ourselves. Content is queried with the same typed layer as everything else.

### ADR-005 — Cloudflare R2 for image storage *(revised)*
**Status:** Accepted — **supersedes the Sanity image pipeline decision.**
**Context:** With Sanity removed we need our own asset store.
**Decision:** R2 with presigned uploads from admin; delivery through `next/image` for format negotiation and responsive sizing; LQIP placeholders generated at upload.
**Consequences:** No egress fees, S3-compatible, cheap at scale. We implement upload, alt-text enforcement and blur-placeholder generation ourselves — roughly two days of work. Cloudinary remains the fallback if automatic transformation proves worth the cost.

### ADR-006 — Better Auth over Auth.js
**Status:** Proposed. Native Drizzle adapter, database sessions, typed API, straightforward email/password with verification, and role support that both apps share. Auth.js v5 is the more conservative alternative. Revisit if enterprise SSO is ever required.

### ADR-007 — WhatsApp deep links, not a chat widget
**Status:** Proposed — needs approval (`D-02`). `wa.me` links only. Zero JS cost, no privacy exposure, no staffing requirement. No in-page conversation history.

### ADR-008 — Search: Postgres full-text first
**Status:** Accepted — **revised from GROQ-first now that Sanity is gone.**
**Decision:** Postgres full-text search over a materialised search column (`tsvector` across name, descriptor, category, keywords, ingredients), with a GIN index and trigram matching for typo tolerance. Move to a dedicated search service only when result quality or latency demonstrably degrades.
**Consequences:** No extra infrastructure. Adequate well past the expected catalogue size (A-04).

### ADR-009 — Two applications rather than one with an `/admin` route *(new)*
**Status:** Accepted.
**Context:** The client requires a separate admin website.
**Decision:** `apps/web` and `apps/admin` in a Turborepo monorepo, sharing `packages/db`, `packages/core` and `packages/ui`, deployed as two Vercel projects on separate domains.
**Consequences:** Admin JavaScript never ships to customers; admin can be network-restricted and MFA-gated independently; the two opposing caching strategies stop fighting each other. Costs monorepo tooling and two deployment configurations, and demands discipline that shared logic lives in `packages/core` rather than being copy-pasted.

### ADR-010 — No headless CMS; build a custom admin *(new)*
**Status:** Accepted — **this is the significant change from v0.1.**
**Context:** The client asked for an admin site to manage stock "and everything". Sanity is itself an admin interface, so keeping both means two logins, two mental models, and product data split across two stores.
**Decision:** Remove Sanity. Build content and catalogue management into `apps/admin` over Postgres.
**Consequences:**
- ✅ One login, one system, one source of truth — exactly what was asked for.
- ✅ Stock, price and product content are edited together, because they belong together.
- ✅ No CMS subscription, no sync layer, no dual-ownership rules.
- ❌ **Roughly 14 extra days on Phase 16 alone** (6 → 20), and **~25 extra days across the project** once the monorepo, dual auth, admin testing and second deployment are counted. We build CRUD screens, the media library, rich-text editing, preview and draft/publish — all of which a CMS provides on day one. Full breakdown in `IMPLEMENTATION-PLAN.md` §7.
- ❌ We own the editorial UX. It must be genuinely good, or the client is worse off than with Sanity.
- **Reconsider if** the client's priority is speed to launch over having a single system — in that case Sanity Studio at `admin.burla.com` *is* a valid "admin website", with a small custom panel for stock, orders and enquiries. That variant is roughly 10 days cheaper. See `OQ-038`.

---

## 14. What we are deliberately not building

| Not building | Why | Reconsider when |
|---|---|---|
| Microservices | No scale or team argument | Never, for this product |
| A headless CMS alongside the admin | Two systems for one job | Never — decided in ADR-010 |
| GraphQL layer | Server components colocate data fetching | A mobile app or third-party consumer appears |
| Global client state store | Server state stays on the server; cart is the only client state | Genuinely complex cross-page client state emerges |
| Dedicated search service | Postgres FTS is sufficient at this catalogue size | Per ADR-008 |
| WhatsApp Business API | Deep links satisfy the requirement | Automated/templated messaging is needed |
| Storybook | Cost outweighs benefit at this scale | The shared component library passes ~40 components |
| A mobile admin app | The admin is responsive and works on a phone | Never, realistically |
