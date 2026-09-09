# Sitemap & Information Architecture — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/SITEMAP.md` |
| Version | **1.0 — product-first IA** |
| Date | 2026-09-09 |
| Supersedes | v0.2 (`/shop` structure, Locations in main nav) |

---

## 1. Principles

1. **Products are reachable from everywhere.** All ten categories sit in a
   persistent bar under the header, not behind a dropdown.
2. **Three clicks to any product, maximum**, from any page.
3. **Locations leaves the main navigation** at the client's request, but remains
   a real, indexable page linked from the footer and About.
4. **URLs are permanent.** Slugs are CMS-owned; any change writes a 301.
5. **The hierarchy is visible.** Breadcrumbs on every category, type and product
   page — the customer should never have to guess where they are.

---

## 2. Route structure

```
/                                    Home — products visible without scrolling
│
├── /products                        All categories + full catalogue
│   ├── /products/[category]         e.g. /products/pickles
│   │   ├── /products/[category]/[type]      e.g. /products/pickles/mango
│   │   └── …
│   └── …  (ten categories)
│
├── /products/p/[slug]               Product detail — see §5 for the open decision
│
├── /search                          Search results
│
├── /about                           About Burla
├── /quality                         Quality Control & Standards
├── /locations                       Our Locations  [footer-linked, not in main nav]
├── /contact                         Contact
│
├── /policies
│   ├── /policies/return-and-refund
│   ├── /policies/delivery
│   ├── /policies/privacy
│   └── /policies/terms
│
├── /account                         [auth]
│   ├── /account/profile
│   ├── /account/orders              [commerce]
│   └── /account/addresses           [commerce]
│
├── /auth/sign-in · /auth/sign-up · /auth/verify-email · /auth/reset-password
│
├── /cart                            [commerce]
├── /checkout/…                      [commerce]
│
├── /sitemap.xml · /robots.txt · /404 · /500
```

`[commerce]` routes exist only if the client confirms online selling
(`OQ-001`). They sit behind a feature flag, not in a separate codebase.

### Change from v0.2

| Was | Now | Consequence |
|---|---|---|
| `/shop` | `/products` | Redirect required |
| `/shop/[category]` | `/products/[category]` | Redirect required |
| *(no type layer)* | `/products/[category]/[type]` | New route |
| `/products/[slug]` | `/products/p/[slug]` *(proposed)* | Redirect required — `OQ-050` |

A redirect map covers all of these. They are cheap now and expensive after
launch.

---

## 3. Navigation

### 3.1 Desktop — two rows

```
┌──────────────────────────────────────────────────────────────────────┐
│  [BURLA LOGO]         Home   About   Quality   Contact   🔍  👤  🛒  │
├──────────────────────────────────────────────────────────────────────┤
│  Dehydrated Powders · Dehydrated Fruits · Pickles · Dal Powders ·    │
│  Sandige · Dry Fruits · Millets · Tea & Coffee · Masalas · Combos    │
└──────────────────────────────────────────────────────────────────────┘
```

**Row 1** — brand, company pages, utilities.
**Row 2** — the product bar. All ten categories, always visible, one click from
anywhere. The active category carries a 2px green underline.

**Locations is deliberately absent** from row 1, per the client's instruction.

**Below 1280px** the ten labels stop fitting on one line. Rather than shrinking
the type or wrapping to a ragged second row, the bar scrolls horizontally with a
partial next item visible — the same affordance as the product carousel. Every
category stays one tap away, with no dropdown.

The v0.2 "Shop" mega-menu is **withdrawn**: it hid the categories behind a hover,
which is the opposite of what the client asked for.

### 3.2 Mobile

```
┌────────────────────────────┐
│  [BURLA]           🔍   ☰  │
└────────────────────────────┘
```

Drawer contents, in this order:

```
PRODUCTS
  Dehydrated Powders & Flakes
  Dehydrated Fruits
  Pickles
  Spiced Dal Powders
  Sandige / Crisps / Vadiyalu
  Dry Fruits
  Millets
  Herbal Tea & Coffee
  Masala Powders
  Combo Packs
  ─────────────────
  View all products →

Home · About · Quality · Contact · Locations · Account

WhatsApp · Phone
```

Categories are listed **flat, not in an accordion** — the client asked not to
overwhelm the mobile screen, and an accordion adds a tap without reducing
cognitive load for a list this short.

### 3.3 Footer

```
BURLA                SHOP              COMPANY            POLICIES
GLOBAL AGRI          All 10            About Us           Return & Refund
PRODUCTS             categories        Quality Control    Delivery
                                       & Standards        Privacy
[logo, reversed]                       Our Locations      Terms
                                       Contact Us
                     CONNECT
                     WhatsApp · Facebook · Instagram · YouTube
─────────────────────────────────────────────────────────────────────
[Entity] · [Address] · FSSAI [·] · GSTIN [·] · Grievance Officer [·]
© 2026 Burla Global Agri Products
```

The footer is the one place the brand green dominates. It also carries the
legal block required of an Indian food business, and the complete category
index for crawlers.

---

## 4. Page inventory

**Render:** SSG static · ISR incremental · SSR per-request · CSR client.

### 4.1 Product pages

| Route | Purpose | Primary action | Render | Index |
|---|---|---|---|---|
| `/` | Show what Burla sells, immediately | Enter a category or product | ISR 60s | ✅ |
| `/products` | Full range — categories then catalogue | Enter a category | ISR 60s | ✅ |
| `/products/[category]` | Category: types, then products | Enter a type or product | ISR 60s | ✅ |
| `/products/[category]/[type]` | Products of one type | Open a product | ISR 60s | ✅ |
| `/products/p/[slug]` | Convert — buy or enquire | Add to bag / WhatsApp | ISR 60s | ✅ |
| `/search` | Find a product | Open a product | SSR | ❌ |

### 4.2 Company pages

| Route | Purpose | Render | Index | In main nav |
|---|---|---|---|---|
| `/about` | Who Burla is | ISR 300s | ✅ | ✅ |
| `/quality` | Quality control & standards | ISR 300s | ✅ | ✅ |
| `/contact` | Contact and enquiry | ISR 300s | ✅ | ✅ |
| `/locations` | Where Burla operates | ISR 300s | ✅ | ❌ footer only |
| `/policies/*` | Legal and consumer protection | ISR 3600s | ✅ | ❌ footer only |

### 4.3 Account, commerce, admin

| Route | Render | Index | Auth |
|---|---|---|---|
| `/auth/*` | SSR | ❌ | Guest only |
| `/account/*` | SSR | ❌ | ✅ |
| `/cart`, `/checkout/*` | SSR / CSR | ❌ | — |
| Admin | *separate application* | ❌ | Staff + MFA |

The admin is a separate app on its own subdomain — see `docs/ARCHITECTURE.md`.
Note the stack list in the latest brief reintroduces Sanity, which conflicts
with that decision; flagged as `OQ-055`.

---

## 5. URL conventions

| Rule | Example |
|---|---|
| Lowercase, hyphenated, no underscores | `/products/dry-fruits` |
| No IDs, no file extensions | `/products/p/mango-pickle` |
| No trailing slash (enforced by redirect) | `/about` |
| Query params for state only, never identity | `/products/pickles?sort=price-asc` |
| Filter/sort URLs carry `noindex` | Prevents facet crawl bloat |
| Slug change always writes a permanent 301 | old → new |

### Open decision: product URL shape — `OQ-050`

Two options, and it is effectively irreversible once indexed:

- **Nested** `/products/pickles/mango/mango-pickle` — matches the client's
  example, reads well, shows the hierarchy in the URL. Breaks if a product
  belongs to two categories, and the URL changes if a product is recategorised.
- **Flat** `/products/p/mango-pickle` — one canonical URL per product forever,
  no duplicate-content handling, recategorisation is free. Loses the hierarchy
  from the URL, though breadcrumbs still show it.

**Our recommendation: flat.** Product URLs should survive merchandising
decisions. Breadcrumbs and structured data carry the hierarchy for both users
and search engines.

---

## 6. Content depth minimums

To avoid thin pages that neither convert nor rank:

| Page type | Minimum |
|---|---|
| Category | 100–200 words of real category copy, a distinct photograph, ≥3 products |
| Type | A short descriptor, ≥2 products |
| Product | Short descriptor, 80+ word description, complete legal information block, ≥1 real photograph |
| About | 400+ words, ≥2 real photographs |
| Quality | 300+ words describing the actual process |
| Locations | ≥1 verified address |

A category with fewer than three products is marked unpublished rather than
shown empty.

---

## 7. Crawl policy

| Path | robots | Sitemap |
|---|---|---|
| `/`, `/products`, `/products/**`, `/about`, `/quality`, `/locations`, `/contact`, `/policies/*` | index, follow | ✅ |
| `/search`, filtered category URLs | noindex, follow | ❌ |
| `/cart`, `/checkout/*`, `/account/*`, `/auth/*` | noindex, nofollow | ❌ |
| `/api/*` | disallow | ❌ |
| Admin subdomain | `Disallow: /` + `X-Robots-Tag: noindex` | ❌ |

---

## 8. Future routes — reserved, not built

| Route | Trigger to build |
|---|---|
| `/recipes` or `/journal` | Month 3+, when content capacity exists |
| `/collections/[slug]` | When merchandising needs groupings beyond category |
| `/wholesale` | Retained from v0.2; confirm whether B2B is still in scope (`OQ-056`) |
| `/[locale]/…` | A confirmed second-language market |
| `/track-order` | Commerce plus shipping integration |
