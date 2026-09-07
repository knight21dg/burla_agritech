# Sitemap & Information Architecture — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/SITEMAP.md` |
| Version | 0.2 — two applications |
| Date | 2026-09-07 |

---

## 1. IA principles

1. **Shallow for people, deep for crawlers.** Every product is reachable in three clicks from the homepage; every page is reachable from a crawlable link.
2. **One canonical home per piece of content.** A product lives at exactly one URL regardless of how it is reached.
3. **URLs are permanent.** Slugs are CMS-owned; any change writes a 301 redirect record automatically.
4. **Trust pages are first-class.** About, Quality and Locations sit in the primary navigation, not buried in the footer — although the client asked for footer links, and those remain (FR-007).
5. **Category pages are the SEO engine.** They carry real editorial content, not just a grid.

---

## 2. Site structure — customer site (`burla.com`)

The admin site is a separate application on `admin.burla.com` — see §3.4.

```
/                                     Home
│
├── /shop                             Shop index — all categories
│   ├── /shop/dehydrated-powders-flakes
│   ├── /shop/dehydrated-fruits
│   ├── /shop/pickles
│   ├── /shop/spiced-dal-powders
│   ├── /shop/[sun-dried-crisps]      slug pending OQ-012
│   ├── /shop/dry-fruits
│   ├── /shop/millets
│   ├── /shop/herbal-tea-coffee
│   ├── /shop/masala-powders
│   └── /shop/combo-packs
│
├── /products/[slug]                  Product detail
│
├── /search                           Search results
│
├── /about                            About Burla
├── /quality                          Quality Control & Standards
├── /locations                        Our Locations
├── /contact                          Contact
├── /wholesale                        Bulk & Wholesale Enquiries
│
├── /policies
│   ├── /policies/return-and-refund
│   ├── /policies/delivery
│   ├── /policies/privacy
│   └── /policies/terms
│
├── /account                          [auth]
│   ├── /account/profile
│   ├── /account/addresses            [commerce]
│   ├── /account/orders               [commerce]
│   ├── /account/orders/[id]          [commerce]
│   └── /account/wishlist             [optional]
│
├── /auth
│   ├── /auth/sign-in
│   ├── /auth/sign-up
│   ├── /auth/verify-email
│   ├── /auth/forgot-password
│   └── /auth/reset-password
│
├── /cart                             [commerce]
├── /checkout                         [commerce]
│   ├── /checkout/address
│   ├── /checkout/payment
│   └── /checkout/confirmation/[orderId]
│
├── /sitemap.xml
├── /robots.txt
├── /opensearch.xml                   [optional]
├── /404
└── /500
```

`[commerce]` routes exist only if `OQ-001` resolves to full or hybrid ecommerce. They are behind a feature flag, not a separate codebase.

---

## 3. Page inventory

Legend — **Render:** SSG = static, ISR = incremental static regeneration, SSR = server-rendered per request, CSR = client-rendered. **Index:** whether search engines should index it.

### 3.1 Marketing and content

| Route | Purpose | Primary action | Render | Index | Auth | Requirements |
|---|---|---|---|---|---|---|
| `/` | Establish brand, route to categories, build trust | Explore products | ISR 60s | ✅ | — | FR-020…029 |
| `/shop` | Present the full range | Enter a category | ISR 60s | ✅ | — | FR-040 |
| `/shop/[category]` | Sell the category, list its products | Open a product | ISR 60s | ✅ | — | FR-041…050 |
| `/products/[slug]` | Convert — buy or enquire | Add to cart / WhatsApp | ISR 60s | ✅ | — | FR-060…075 |
| `/about` | Establish credibility and story | Continue to Quality/Shop | ISR 300s | ✅ | — | FR-090 |
| `/quality` | Prove food safety and process rigour | Trust → shop or enquire | ISR 300s | ✅ | — | FR-091 |
| `/locations` | Prove physical existence | Contact | ISR 300s | ✅ | — | FR-092 |
| `/contact` | Enable contact | Submit form / WhatsApp | ISR 300s | ✅ | — | FR-093, FR-100 |
| `/wholesale` | Capture B2B leads | Submit wholesale enquiry | ISR 300s | ✅ | — | FR-094, FR-101 |
| `/policies/*` | Legal and consumer protection | Read | ISR 3600s | ✅ | — | FR-095 |
| `/search` | Find products | Open a product | SSR | ❌ | — | FR-083 |

### 3.2 Account and auth

| Route | Purpose | Render | Index | Auth |
|---|---|---|---|---|
| `/auth/sign-in` | Authenticate | SSR | ❌ | Guest only |
| `/auth/sign-up` | Register | SSR | ❌ | Guest only |
| `/auth/verify-email` | Confirm address | SSR | ❌ | Token |
| `/auth/forgot-password` | Request reset | SSR | ❌ | Guest only |
| `/auth/reset-password` | Set new password | SSR | ❌ | Token |
| `/account` | Account hub | SSR | ❌ | ✅ |
| `/account/profile` | Manage details | SSR | ❌ | ✅ |
| `/account/addresses` | Manage addresses | SSR | ❌ | ✅ |
| `/account/orders` | Order history | SSR | ❌ | ✅ |
| `/account/orders/[id]` | Order detail | SSR | ❌ | ✅ + ownership |
| `/account/wishlist` | Saved products | SSR | ❌ | ✅ |

### 3.3 Commerce

| Route | Purpose | Render | Index | Auth |
|---|---|---|---|---|
| `/cart` | Review basket | CSR over server data | ❌ | — |
| `/checkout/address` | Capture delivery details | SSR | ❌ | — (guest allowed) |
| `/checkout/payment` | Take payment | SSR | ❌ | Session-scoped |
| `/checkout/confirmation/[orderId]` | Confirm and reassure | SSR | ❌ | Token or ownership |

### 3.4 Administration — `admin.burla.com`, a separate application

A second Next.js app (`apps/admin`), deployed to its own domain. Every route is dynamic, `no-store`, `noindex`, and requires a `staff` or `admin` role with MFA. There is **no public sign-up** — staff accounts are created by invitation.

| Route | Purpose |
|---|---|
| `/` | Dashboard — today's orders and enquiries, low-stock alerts, recent activity |
| `/sign-in` | Staff authentication (invitation-only; no registration route exists) |
| `/products` | Product list — search, filter by category and status, bulk actions |
| `/products/new` | Create product |
| `/products/[id]` | Edit — details, description, images, SEO |
| `/products/[id]/variants` | Pack sizes, SKUs, prices, GST rates, weights |
| `/products/[id]/information` | The legally required information block |
| `/products/[id]/preview` | Renders the real customer page against draft data |
| `/categories` | List, create, drag-to-reorder, publish/unpublish |
| `/categories/[id]` | Edit — hero, copy, SEO |
| `/inventory` | Stock across all variants, low-stock view, bulk adjust |
| `/inventory/[variantId]` | Movement history — every change, who and why |
| `/orders` | Order list — filter by status, date, payment `[commerce]` |
| `/orders/[id]` | Detail, status transitions, invoice, refund, dispatch `[commerce]` |
| `/enquiries` | Contact and wholesale enquiries, status pipeline, CSV export |
| `/enquiries/[id]` | Detail, assignment, internal notes, reply shortcuts |
| `/customers` | Accounts, order history, addresses |
| `/content/home` | Homepage sections — add, reorder, toggle |
| `/content/pages` | About, Quality, Locations, Contact, policies |
| `/content/locations` | Location records and map data |
| `/media` | Image library — upload, alt text, replace, usage before delete |
| `/settings` | Contact details, WhatsApp number, socials, legal block (FSSAI, GSTIN, grievance officer) |
| `/settings/navigation` | Header and footer link management |
| `/settings/redirects` | 301 redirect records |
| `/users` | Staff accounts, roles, MFA status, invitations |
| `/audit` | Full mutation log — who changed what, when |

`robots.txt` on this domain is `Disallow: /`, and every response carries `X-Robots-Tag: noindex`.

### 3.5 System

| Route | Purpose | Index |
|---|---|---|
| `/sitemap.xml` | Generated from live content | — |
| `/robots.txt` | Crawl directives | — |
| `/404` | Not found, with recovery paths | ❌ |
| `/500` | Server error, with recovery paths | ❌ |
| `/api/*` | Internal endpoints | ❌ (disallowed in robots) |

---

## 4. Navigation model

### 4.1 Desktop header

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [BURLA logo]      Shop ▾   About   Quality   Locations   Contact        │
│                                              [Search] [Account] [Cart]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Shop ▾** opens a mega-panel:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BY CATEGORY                          BY OCCASION            FEATURED    │
│                                                                          │
│  Dehydrated Powders & Flakes          Combo Packs            [image]     │
│  Dehydrated Fruits                    New Arrivals           Featured    │
│  Pickles                              Best Sellers           product     │
│  Spiced Dal Powders                                          card        │
│  Sun-Dried Crisps                     ─────────────                      │
│  Dry Fruits                           Bulk & Wholesale →                 │
│  Millets                                                                 │
│  Herbal Tea & Coffee                                                     │
│  Masala Powders                                                          │
│                                       View all products →                │
└──────────────────────────────────────────────────────────────────────────┘
```

Behaviour: opens on hover **and** on click/Enter; closes on `Esc`, outside click or focus leaving; arrow keys move between items; the trigger carries `aria-expanded` and `aria-controls`; the panel is a real list of links, never `div`s with click handlers.

### 4.2 Mobile header

```
┌───────────────────────────────────┐
│ [BURLA]        [search] [☰]       │
└───────────────────────────────────┘
```

The drawer is a full-height sheet: Shop (accordion listing all categories) → About → Quality → Locations → Wholesale → Contact → Account → contact block with WhatsApp. Focus trapped, body scroll locked, closes on `Esc` and on route change, restores focus to the trigger.

### 4.3 Footer — `[CLIENT]` structure preserved exactly

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [BURLA logo]                                                            │
│  One-line brand statement                                                │
│                                                                          │
│  SHOP              COMPANY            POLICIES           CONNECT         │
│  All categories    About Us           Return & Refund    WhatsApp        │
│  (10 links)        Our Locations      Delivery           Facebook        │
│                    Quality Control    Privacy            Instagram       │
│                    & Standards        Terms & Conditions YouTube         │
│                    Contact Us                                            │
│                    Bulk & Wholesale                                      │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────────  │
│  [Legal entity name] · Registered address                                │
│  FSSAI Licence No. [·] · GSTIN [·] · Grievance Officer: [·]              │
│  © 2026 Burla Global Agri Products. All rights reserved.                 │
└──────────────────────────────────────────────────────────────────────────┘
```

The footer is also where all ten categories appear as flat links — this preserves the client's intent from the handwritten sheet and gives crawlers a complete category index on every page.

---

## 5. URL conventions

| Rule | Example |
|---|---|
| Lowercase, hyphenated, no underscores | `/shop/dry-fruits` |
| No file extensions, no IDs in public URLs | `/products/mango-powder` not `/products/1042` |
| No trailing slash (enforced by redirect) | `/about` |
| Categories under `/shop/`, products under `/products/` | products are *not* nested under category, so a product in two categories has one canonical URL |
| Query params for state only, never for identity | `/shop/pickles?sort=price-asc` |
| Filter/sort URLs carry `noindex` when parameters are present | prevents facet-crawl bloat |
| Slug changes always write a permanent redirect | old → new, 301 |

**Decision:** products sit at `/products/[slug]`, **not** `/shop/[category]/[product]`. Reason: a product may belong to more than one category (e.g. a millet-based crisp), and nesting forces either duplicate URLs or an arbitrary primary category. A flat product namespace gives one canonical URL per product with no canonicalisation gymnastics. Breadcrumbs still show the category path contextually.

---

## 6. Content depth per page type

To avoid thin pages that neither convert nor rank:

| Page type | Minimum editorial content |
|---|---|
| Category | 150–300 words of genuine category copy, a distinct hero image, and at least 3 products |
| Product | Short descriptor, 100+ word description, complete legal information block, at least 3 images |
| About | 500+ words, at least 3 real photographs |
| Quality | 400+ words describing the actual process, with a process visualisation |
| Locations | At least one verified address |

A category with fewer than 3 products should be marked as unpublished rather than shown empty.

---

## 7. Crawl and index policy

| Path | robots | Sitemap |
|---|---|---|
| `/`, `/shop`, `/shop/*`, `/products/*`, `/about`, `/quality`, `/locations`, `/contact`, `/wholesale`, `/policies/*` | index, follow | ✅ |
| `/search`, `/search?q=*` | noindex, follow | ❌ |
| `/shop/*?` with filter params | noindex, follow | ❌ |
| `/cart`, `/checkout/*` | noindex, nofollow | ❌ |
| `/account/*`, `/auth/*` | noindex, nofollow | ❌ |
| `/api/*` | disallow | ❌ |
| `admin.burla.com` (entire domain) | `Disallow: /` + `X-Robots-Tag: noindex` | ❌ |

---

## 8. Future routes — architected, not built

Reserved so they do not require restructuring later:

| Route | Purpose | Trigger to build |
|---|---|---|
| `/journal` or `/recipes` | Content marketing | Month 3+, when content capacity exists |
| `/collections/[slug]` | Curated groupings beyond category | When merchandising need arises |
| `/[locale]/...` | Localised sites | Confirmed second-language market |
| `/export` | Dedicated export/international page | Confirmed export operations |
| `/track-order` | Guest order tracking | Commerce + shipping integration |
| `/careers` | Recruitment | Client request |
