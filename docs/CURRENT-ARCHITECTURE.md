# Current Architecture — audit before backend work

| Field | Value |
|---|---|
| Document | `docs/CURRENT-ARCHITECTURE.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Purpose | What exists today, verified by inspection. No proposals here — those are in `SYSTEM-DESIGN.md` |
| Commit audited | `c17cf19` |

---

## 1. Summary

A **complete, working frontend with no backend at all**. Every page renders, navigation works, search works, forms validate. Nothing persists, nothing is sent, nothing is authenticated.

The honest description is **a high-fidelity prototype**, not an application. It is close to production quality *as a frontend* — accessible, typed, server-rendered, contrast-verified — and that work carries over intact.

---

## 2. Repository

```
burla/                        npm workspaces monorepo
├── apps/web/                 the only app — customer site
├── docs/                     19 documents
├── assets/                   brand + client reference material
├── logos/                    client-supplied logo source files
└── package-lock.json         npm is the package manager. Do not switch.
```

`packages/*` is declared in the workspace globs but **does not exist yet**. `apps/admin` does not exist.

---

## 3. Stack, as installed

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 16.3.4 |
| UI | `react`, `react-dom` | 19.1.1 |
| Language | `typescript` | 5.9.2, strict, `noUncheckedIndexedAccess` |
| Styling | `tailwindcss`, `@tailwindcss/postcss` | 4.1.13 |
| Icons | `lucide-react` | 0.544.0 |
| Class utils | `clsx`, `tailwind-merge` | 2.1.1 / 3.3.1 |

**Six runtime dependencies. That is the entire application.**

Not present, and all required: database driver, ORM, validation, auth, email, storage, rate limiting, monitoring, analytics, testing. Nothing to uninstall or migrate away from — the backend is a greenfield addition inside an existing frontend.

---

## 4. Routes

16 route files, all under the App Router.

| Route | Render | Params awaited | Notes |
|---|---|---|---|
| `/` | static | — | Homepage |
| `/products` | static | — | Categories + full catalogue |
| `/products/[category]` | SSG | ✅ | `generateStaticParams` over 10 categories |
| `/products/[category]/[type]` | SSG | ✅ | `generateStaticParams` over 10 types |
| `/products/p/[slug]` | SSG | ✅ | `generateStaticParams` over 28 products |
| `/search` | dynamic | ✅ | Reads `searchParams` |
| `/about`, `/quality`, `/locations`, `/contact`, `/wholesale` | static | — | Company pages |
| `/policies/[slug]` | SSG | ✅ | 4 policies |
| `/sitemap.ts`, `/robots.ts` | generated | — | robots currently `Disallow: /` |
| `/not-found.tsx` | static | — | |

**There is no `app/api/` directory. There are no Route Handlers. There are no Server Actions.**

---

## 5. Components

23 component files. **9 are client components**, 14 are server components.

| Client component | Why | Backend impact |
|---|---|---|
| `layout/Header` | menu state, `/` key | ⚠️ imports `categories` — see §7 |
| `layout/SearchOverlay` | input state, keyboard | 🔴 **imports the whole catalogue** — see §7 |
| `layout/WhatsAppFab` | sessionStorage, pathname | none |
| `layout/DemoNotice` | sessionStorage | remove before production |
| `layout/ChromeMeasure` | ResizeObserver | none |
| `forms/EnquiryForm` | form state | ⚠️ imports `categories`; **submits nowhere** |
| `product/ProductBuyPanel` | variant/qty state | receives product as prop — clean |
| `product/ProductCarousel` | scroll state | type-only import — clean |
| `ui/Reveal` | IntersectionObserver | none |

The server/client split is already disciplined. Client components sit at interactive leaves, not as wrappers.

---

## 6. The data layer as it stands

Everything comes from **one file**: `apps/web/src/data/catalog.ts`, ~630 lines, exporting `IS_SAMPLE_DATA = true`.

### 6.1 Types

```ts
Category  { slug, name, shortName, order, heroHeadline, description, tone, parentSlug? }
Product   { id, slug, name, categorySlug, typeSlug?, shortDescriptor,
            description, variants[], featured?, tone }
Variant   { id, label, sku, priceMinor, mrpMinor?, netWeightGrams,
            availability, isDefault? }
Availability = in_stock | low_stock | out_of_stock | enquire_only
```

Two shape notes that matter for the schema:

- **A type is a `Category` with a `parentSlug`.** One table, two levels, no separate entity.
- **A product stores both `categorySlug` and `typeSlug`.** Denormalised on purpose so breadcrumbs never need a recursive walk.
- **Money is already integer minor units.** No floats anywhere.

### 6.2 Query surface — the contract the backend must satisfy

These 13 functions are the entire data API the frontend consumes today. **They are all synchronous.**

| Function | Used by |
|---|---|
| `categories`, `productTypes`, `products` | direct array access in 8 files |
| `categoryBySlug`, `typeBySlug`, `typesOf` | category + type pages, header |
| `productBySlug`, `productsByCategory`, `productsByType` | product + listing pages |
| `featuredProducts`, `relatedProducts`, `defaultVariant` | homepage, PDP, cards |
| `searchProducts` | search page **and the client-side overlay** |
| `trailFor`, `productHref`, `availabilityLabel` | breadcrumbs, links, labels |

**18 files import from this module.** It is the single seam between UI and data, which is the one genuinely good thing about the current state: replacing it is a contained change, not a rewrite.

---

## 7. The three findings that shape the plan

### 🔴 Finding 1 — the entire catalogue ships to the browser

`SearchOverlay` is a **client component** that imports `searchProducts` and `categories`. Every product name, price, SKU and description is therefore bundled into client JavaScript and shipped to every visitor.

Today that is 28 sample products. At 500 real products it is a large, growing bundle — and once the catalogue is in Postgres, **client-side `searchProducts()` simply cannot work**. Search is the one feature that structurally breaks on the move to a database.

**Consequence:** search needs a real endpoint before anything else in the UI can be cut over. It is Phase 9 in the client's ordering, but it is coupled to Phase 8.

`Header` and `EnquiryForm` also import `categories` into client bundles. Smaller, and fixable by passing props from their server parents.

### 🟠 Finding 2 — five of twelve pages are synchronous

`/`, `/products`, `/about`, `/quality`, `/locations`, `/contact`, `/wholesale` are `export default function`, not `async`. Awaiting a database read requires converting each. Mechanical, but it touches every page and must not disturb the rendered output.

### 🟠 Finding 3 — the forms are theatre

`EnquiryForm` validates properly, shows field errors, manages focus, has a honeypot — and then calls `setTimeout(() => setStatus("success"), 700)`. **A real enquiry today is silently lost.** There is no Server Action, no endpoint, no persistence, no email.

This is the highest-risk item on the site: it looks like it works.

---

## 8. Configuration

`apps/web/src/lib/site.ts` centralises all business values. Good discipline already.

| Concern | State |
|---|---|
| Env vars used | Exactly two: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Env files | **None.** No `.env`, no `.env.example` |
| Validation | None. Both reads use `??` fallbacks |
| Secrets | None present — and none needed yet, since there are no integrations |
| Real business data | Address, GSTIN, phone, email, partners (from the business card) |
| Placeholders | FSSAI, registered firm name, grievance officer, hours, socials |

`next.config.ts` sets four security headers and two permanent redirects from the old `/shop` paths.

---

## 9. What is genuinely production-quality already

Worth stating, because it should not be rebuilt:

- **Accessibility.** Zero contrast failures across every rendered text node, one `h1` per page, no skipped heading levels, keyboard-operable carousel and search, 44px tap targets, `prefers-reduced-motion` honoured properly.
- **SEO scaffolding.** Per-route metadata, canonicals, `BreadcrumbList` / `ItemList` / `Product` / `Organization` JSON-LD, generated sitemap.
- **Compliance architecture.** The ten legally required food fields are modelled on the product page and marked "to be confirmed" rather than invented.
- **Server-first rendering.** Small client bundles, no unnecessary `"use client"`.
- **Money as integers.** Already correct.

---

## 10. What does not exist

| Area | State |
|---|---|
| Database, ORM, migrations | none |
| API routes, Server Actions | none |
| Authentication, sessions, users | none |
| Authorization, roles | none |
| Admin application | none |
| Cart, orders, payment, inventory | none |
| Image storage | none — all imagery is a grey placeholder component |
| Email | none |
| Rate limiting | none |
| Tests | **zero.** No Vitest, no Playwright, no CI |
| Monitoring, analytics | none |
| Deployment | none — localhost only |

---

## 11. Data classification

Per the client's §82, before any migration:

| Data | Classification | Disposition |
|---|---|---|
| 10 category names, slugs, order | **Client-derived** — from the handwritten sheet, pending final confirmation (`OQ-013`) | Seed as real, flag for confirmation |
| 10 product types | **Invented by us** — demonstrates the UX only (`OQ-049`) | Demo seed. Must not reach production |
| 28 products, prices, SKUs, descriptions | **Invented by us** | Demo seed. Must not reach production |
| Address, GSTIN, phone, email, partners | **Real** — business card | Migrate to `site_settings` |
| FSSAI, firm name, grievance officer, hours | **Placeholder** | Stay placeholder until supplied |
| Availability values | **Invented** | Demo seed |

A production guard on `IS_SAMPLE_DATA` should make it impossible to boot production against demo data.

---

## 12. Constraints carried into the design

1. **Do not redesign the frontend.** The rendered output must be unchanged after cutover.
2. **The `catalog.ts` export surface is the integration contract.** Match it, then make it async.
3. **npm, not pnpm.** The lockfile is npm's.
4. **Node 20.15** locally. Anything requiring Node 22+ is out.
5. **The workspace already declares `packages/*`** — shared packages can be added without restructuring.
6. **Search must move server-side first**, or the cutover breaks it.
