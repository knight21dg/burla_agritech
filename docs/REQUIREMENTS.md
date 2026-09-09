# Requirements — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/REQUIREMENTS.md` |
| Version | 1.0 — product-first navigation, taxonomy and carousel |
| Date | 2026-09-07 |
| Status | Awaiting client sign-off |

**Tags:** `[CLIENT]` supplied · `[DERIVED]` inferred · `[PROPOSED]` our recommendation · `[PLACEHOLDER]` unknown

**Priority:** `MUST` (V1 launch blocker) · `SHOULD` (V1 if time) · `COULD` (V1.1) · `WONT` (out of scope, recorded deliberately)

Every requirement carries a **Source** so it can be traced back to the client material and audited later.

---

## 1. Requirements extracted verbatim from the handwritten sheet

This section is a faithful transcription before any interpretation. It is the authoritative record of what the client actually asked for.

### 1.1 Header zone

| As written | Reading |
|---|---|
| `(LOGO) BURLA GLOBAL AGRI PRODCTS.` | Logo, top-left. "PRODCTS" is a hand slip for "PRODUCTS" |
| `signin/signup, Account` | Top-right: authentication entry + account area |
| `Search :-` | Right side: search affordance |

### 1.2 Navigation list

```
1. Home
2. Dehydrated powders / Flakes
   2b. Dehydrated Fruits - powders
3. Pickles
4. Spiced dal powder
5. Sundried crips (vadiyalu)
6. Dry Fruits
7. Millets
8. Herbal Tea / coffee
9. Masala powders
10. Combo packs
11. Contact us
```

### 1.3 Body zone

| As written | Reading |
|---|---|
| Boxed: `About products with pictures.` | The main content area is a visual product showcase |

### 1.4 Communication

| As written | Reading |
|---|---|
| `Whatsapp connect. or Live chat.` | A persistent contact widget. The "or" indicates the client has not decided between the two |

### 1.5 Footer ("Bottom")

```
1. Policies
     Return and Refund policy
     Delivery policy
     Privacy policy
     Terms and Conditions
2. About us
3. Our locations
4. Contact us
5. Quality control and Standards
6. Connect  Facebook, Instagram, youtube
```

### 1.6 Delivery note

| As written | Reading |
|---|---|
| `NOTE: WEBSITE MAKING WITH CODING` | Custom-coded application. Not a template builder, not a hosted store theme |

---

## 2. Functional requirements

### 2.1 Global / shell

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-001 | Site-wide header carrying the Burla logo linking to `/` | MUST | `[CLIENT]` |
| FR-002 | Primary navigation: Home, About, Quality, Contact. **Locations is excluded** and lives in the footer | MUST | `[CLIENT]` 2026-09-09 |
| FR-003 | A persistent category bar beneath the header carries all ten categories on every page; below 1280px it scrolls horizontally with a partial next item visible | MUST | `[CLIENT]` 2026-09-09 |
| FR-003b | Mobile drawer lists all ten categories flat under a "Products" heading, with no accordion | MUST | `[CLIENT]` 2026-09-09 |
| FR-004 | Header exposes Search, Account and (when commerce is enabled) Cart | MUST | `[CLIENT]` |
| FR-005 | Header is sticky with a condensed state after scroll; must not obscure content or trap focus | SHOULD | `[PROPOSED]` |
| FR-006 | Persistent WhatsApp contact affordance on every page | MUST | `[CLIENT]` |
| FR-007 | Footer contains the four policy links, About us, Our Locations, Contact us, Quality Control & Standards, and social links to Facebook, Instagram and YouTube | MUST | `[CLIENT]` |
| FR-008 | Footer displays legal identity: entity name, registered address, FSSAI licence number, GSTIN, grievance officer contact | MUST | `[DERIVED]` — legal requirement, see `SECURITY.md` §8 |
| FR-009 | Footer newsletter / enquiry capture | COULD | `[PROPOSED]` |
| FR-010 | Skip-to-content link as the first focusable element | MUST | `[PROPOSED]` (WCAG 2.4.1) |
| FR-011 | Global 404 and 500 pages, art-directed, with recovery paths | MUST | `[PROPOSED]` |
| FR-012 | Breadcrumbs on all shop, product and content pages | MUST | `[PROPOSED]` |

#### §2.2 Navigation — resolved 2026-09-09

Earlier we proposed nesting the ten categories under a "Shop" mega-menu.
**That is withdrawn.** The client has confirmed they want categories visible at
the top, and specifically that **Locations must not be a main navigation item**.

The structure is now two rows on desktop — company links above, a persistent
product bar carrying all ten categories below — and a flat category list at the
top of the mobile drawer. Full specification in `SITEMAP.md` §3.

This resolves `OQ-014` in favour of the client's original handwritten intent.

### 2.2 Home

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-020 | Simple hero on white: brand statement and CTA in real HTML, one authentic product photograph. Not full-viewport, not cinematic | MUST | `[CLIENT]` 2026-09-09 |
| FR-021 | Hero carries one primary CTA ("Explore Products") and at most one secondary | MUST | `[CLIENT]` |
| FR-021b | **Products must be visible without scrolling past company copy.** The category bar sits above the fold and the first product section follows the hero directly | MUST | `[CLIENT]` 2026-09-09 |
| FR-021c | **Horizontal product carousel** on the homepage: drag, swipe, arrow buttons, keyboard navigation, partial next card visible, no autoplay | MUST | `[CLIENT]` 2026-09-09 |
| FR-022 | Category grid presenting all ten categories, each with an **authentic photograph** — not an icon or illustration | MUST | `[CLIENT]` 2026-09-09 |
| FR-023 | **Short** brand statement linking to About — placed below the products, not above them | MUST | `[CLIENT]` 2026-09-09 |
| FR-024 | Featured products section, CMS-curated | MUST | `[PROPOSED]` |
| FR-025 | Quality & standards teaser linking to `/quality` | MUST | `[CLIENT]` |
| FR-026 | Combo packs / collections feature | SHOULD | `[CLIENT]` |
| FR-027 | Wholesale / B2B entry point | MUST | `[DERIVED]` from "Global Agri Products" |
| FR-028 | Contact / WhatsApp closing section | MUST | `[CLIENT]` |
| FR-029 | All homepage sections orderable and toggleable from the CMS | SHOULD | `[PROPOSED]` |

### 2.3 Products and categories

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-040 | `/products` index listing every published category, then the full catalogue | MUST | `[CLIENT]` |
| FR-041 | `/products/[category]` page per category with its own description and imagery | MUST | `[CLIENT]` |
| FR-041b | `/products/[category]/[type]` page per type where types exist | MUST | `[CLIENT]` 2026-09-09 |
| FR-042 | Product grid with responsive columns (1 / 2 / 3 / 4 by breakpoint) | MUST | `[PROPOSED]` |
| FR-043 | Filtering kept minimal — the client asked to avoid complicated filters. Type chips and availability only, unless the catalogue size justifies more | SHOULD | `[CLIENT]` 2026-09-09 |
| FR-044 | Sorting — featured, newest, price asc/desc, A–Z | SHOULD | `[PROPOSED]` |
| FR-045 | Filter and sort state reflected in the URL (shareable, back-button safe, crawl-controlled) | MUST | `[PROPOSED]` |
| FR-046 | Pagination or load-more with an SEO-safe crawl path | MUST | `[PROPOSED]` |
| FR-047 | Product card: image (≈78% of the card), name, pack size, price if available. **Four items maximum.** No shadow, no badge stack, no rating | MUST | `[CLIENT]` 2026-09-09 |
| FR-048 | Empty state when filters return nothing, with a one-click reset | MUST | `[PROPOSED]` |
| FR-049 | Categories reorderable and hideable from the CMS without a deploy | MUST | `[DERIVED]` |
| FR-050 | **Category → Type → Product hierarchy**, two levels of category nesting, rendered generically and never hard-coded in a component | MUST | `[CLIENT]` 2026-09-09 |
| FR-051 | A category with no types renders products directly; with types it renders filter chips or type pages depending on product count (`PRODUCT-TAXONOMY.md` §1.1) | MUST | `[PROPOSED]` |
| FR-052 | A type with a single product links straight to that product, never to a page containing one card | SHOULD | `[PROPOSED]` |
| FR-053 | Breadcrumbs on every category, type and product page, with matching `BreadcrumbList` structured data | MUST | `[CLIENT]` — "never feel lost" |

### 2.4 Product detail

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-060 | `/products/[slug]` page per product | MUST | `[DERIVED]` |
| FR-061 | Image gallery — multiple images, zoom, keyboard navigable, mobile swipe | MUST | `[CLIENT]` — "with pictures" |
| FR-062 | Name, short descriptor, long description | MUST | `[DERIVED]` |
| FR-063 | Variant selection (weight / pack size) updating price, SKU and availability | MUST | `[PROPOSED]` |
| FR-064 | Price with MRP-inclusive-of-taxes labelling | MUST if commerce | `[DERIVED]` — Legal Metrology |
| FR-065 | Availability state — in stock / low stock / out of stock / enquire only | MUST | `[PROPOSED]` |
| FR-066 | Add to Cart and Buy Now | MUST if commerce | `[DERIVED]` |
| FR-067 | "Ask about this product" WhatsApp CTA, pre-filling product name and URL | MUST | `[CLIENT]` |
| FR-068 | Product information block: ingredients, net weight, shelf life, storage, country of origin, manufacturer/packer name and address, consumer care contact | MUST | `[DERIVED]` — legally mandated for online food sale |
| FR-069 | Fields render **only when populated** — no empty labels, no "N/A" | MUST | `[PROPOSED]` |
| FR-070 | Allergen information where applicable | MUST | `[PROPOSED]` |
| FR-071 | Quality note linking to `/quality` | SHOULD | `[CLIENT]` |
| FR-072 | Related products, CMS-curated with an automatic same-category fallback | SHOULD | `[PROPOSED]` |
| FR-073 | Wishlist / save | COULD | `[PROPOSED]` |
| FR-074 | Share | COULD | `[PROPOSED]` |
| FR-075 | Structured data (`Product`) emitted only when price and availability are genuinely known | MUST | `[PROPOSED]` |

### 2.5 Search

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-080 | Search accessible from the header on all breakpoints | MUST | `[CLIENT]` |
| FR-081 | Overlay/dialog search with instant suggestions | MUST | `[PROPOSED]` |
| FR-082 | Matches product names, categories, descriptors, keywords and ingredients | MUST | `[PROPOSED]` |
| FR-083 | Full results page at `/search?q=` | MUST | `[PROPOSED]` |
| FR-084 | Empty state suggesting categories and popular products | MUST | `[PROPOSED]` |
| FR-085 | Keyboard operable — `/` to open, arrows to move, `Enter` to select, `Esc` to close, focus trapped and restored | MUST | `[PROPOSED]` |
| FR-086 | Debounced, cancellable queries; p95 suggestion latency under 200ms | MUST | `[PROPOSED]` |
| FR-087 | Search terms recorded for analytics; zero-result terms surfaced to the client | SHOULD | `[PROPOSED]` |

### 2.6 Content pages

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-090 | `/about` — who Burla is, origin, beliefs, what is produced, sourcing, processing, quality philosophy, vision | MUST | `[CLIENT]` |
| FR-091 | `/quality` — Quality Control & Standards, with a process narrative and any verified certifications | MUST | `[CLIENT]` |
| FR-092 | `/locations` — Our Locations, structured for offices, facilities and distribution presence | MUST | `[CLIENT]` |
| FR-093 | `/contact` — contact detail, form, WhatsApp, map, hours | MUST | `[CLIENT]` |
| FR-094 | `/wholesale` — B2B enquiry landing page and form | MUST | `[DERIVED]` |
| FR-095 | `/policies/return-and-refund`, `/delivery`, `/privacy`, `/terms` | MUST | `[CLIENT]` |
| FR-096 | All content pages fully CMS-editable including SEO fields | MUST | `[DERIVED]` |
| FR-097 | Maps embedded only for verified addresses; no invented pins | MUST | `[PROPOSED]` |

### 2.7 Contact and enquiry

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-100 | General contact form: name, email, phone, subject, message | MUST | `[CLIENT]` |
| FR-101 | Wholesale form: name, company, country, email, phone, product interest, estimated quantity, message | MUST | `[DERIVED]` |
| FR-102 | Client-side and server-side validation from a single shared Zod schema | MUST | `[PROPOSED]` |
| FR-103 | Anti-spam: honeypot + timing check + CAPTCHA (Cloudflare Turnstile) + per-IP rate limiting | MUST | `[PROPOSED]` |
| FR-104 | Submissions persisted to the database, never email-only | MUST | `[PROPOSED]` |
| FR-105 | Notification email to the business on every submission | MUST | `[PROPOSED]` |
| FR-106 | Acknowledgement email to the submitter | SHOULD | `[PROPOSED]` |
| FR-107 | Explicit loading, success, validation-error and server-error states | MUST | `[PROPOSED]` |
| FR-108 | Enquiries visible to staff in an admin view | MUST | `[PROPOSED]` |

### 2.8 WhatsApp

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-110 | Floating WhatsApp button, tastefully styled, never covering primary actions or the mobile sticky bar | MUST | `[CLIENT]` |
| FR-111 | Number read from configuration, never hard-coded | MUST | `[PROPOSED]` |
| FR-112 | Context-aware prefilled message — generic on marketing pages, product name + URL on a PDP, enquiry summary from a form | MUST | `[PROPOSED]` |
| FR-113 | Every WhatsApp interaction fires a tracked analytics event | MUST | `[PROPOSED]` |
| FR-114 | Uses the official `wa.me` deep link; no third-party chat widget script | SHOULD | `[PROPOSED]` — performance and privacy |
| FR-115 | Dismissible on mobile, with the choice remembered for the session | SHOULD | `[PROPOSED]` |

### 2.9 Accounts

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-120 | Sign up, sign in, sign out | MUST | `[CLIENT]` |
| FR-121 | Email verification | MUST | `[PROPOSED]` |
| FR-122 | Password reset | MUST | `[PROPOSED]` |
| FR-123 | Browsing and enquiring never require an account | MUST | `[PROPOSED]` |
| FR-124 | Profile management | MUST | `[CLIENT]` |
| FR-125 | Address book | MUST if commerce | `[PROPOSED]` |
| FR-126 | Order history and order detail | MUST if commerce | `[PROPOSED]` |
| FR-127 | Wishlist | COULD | `[PROPOSED]` |
| FR-128 | Account deletion / data export | SHOULD | `[PROPOSED]` — DPDP Act 2023 |

### 2.10 Commerce — gated on `OQ-001`

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-140 | Cart: add, update quantity, remove, persist across sessions | MUST if commerce | `[DERIVED]` |
| FR-141 | Guest checkout | MUST if commerce | `[PROPOSED]` |
| FR-142 | Address capture with Indian PIN-code validation | MUST if commerce | `[PROPOSED]` |
| FR-143 | Shipping method and cost calculation | MUST if commerce | `[PROPOSED]` |
| FR-144 | Razorpay payment integration | MUST if commerce | `[PROPOSED]` |
| FR-145 | Server-side price recalculation at checkout — client prices never trusted | MUST if commerce | `[PROPOSED]` |
| FR-146 | Idempotent, signature-verified payment webhook | MUST if commerce | `[PROPOSED]` |
| FR-147 | Order confirmation page + email | MUST if commerce | `[PROPOSED]` |
| FR-148 | Stock decrement on payment capture, with oversell protection | MUST if commerce | `[PROPOSED]` |
| FR-149 | Payment failure, abandonment and retry handling | MUST if commerce | `[PROPOSED]` |
| FR-150 | GST-compliant invoice | MUST if commerce | `[PROPOSED]` |
| FR-151 | Order status tracking and notifications | SHOULD if commerce | `[PROPOSED]` |
| FR-152 | Returns / refunds workflow consistent with the published policy | SHOULD if commerce | `[CLIENT]` |

### 2.11 Admin application — `admin.burla.com`

`[CLIENT]` The client requires a **separate admin website** for staff to manage stock and all other business data. This is a distinct Next.js application on its own domain, not a section of the customer site. See `ARCHITECTURE.md` ADR-009 and ADR-010.

#### Catalogue management

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-160 | Create, edit, duplicate and archive products: name, slug, category, descriptors, rich description, SEO, featured flag | MUST | `[CLIENT]` |
| FR-161 | Manage variants per product: pack size, SKU, price, MRP, GST rate, weight | MUST | `[CLIENT]` |
| FR-162 | Manage the legally required product information block, with publish blocked until complete | MUST | `[DERIVED]` |
| FR-163 | Manage categories: name, slug, drag-to-reorder, hero image and copy, publish/unpublish | MUST | `[CLIENT]` |
| FR-164 | Set and edit related products | SHOULD | `[PROPOSED]` |
| FR-165 | Bulk actions: publish, unpublish, recategorise, adjust price | SHOULD | `[PROPOSED]` |

#### Stock and inventory — the client's stated priority

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-170 | View current stock for every variant in one screen, searchable and sortable | MUST | `[CLIENT]` |
| FR-171 | Adjust stock with a mandatory reason; every change writes an immutable movement record | MUST | `[DERIVED]` |
| FR-172 | Low-stock alerting against a per-variant threshold, surfaced on the dashboard | MUST | `[PROPOSED]` |
| FR-173 | Full stock movement history per variant — what changed, when, by whom, why | MUST | `[PROPOSED]` |
| FR-174 | Bulk stock update (restock run) | SHOULD | `[PROPOSED]` |
| FR-175 | Stock decrements automatically on paid order, atomically, with no oversell | MUST if commerce | `[DERIVED]` |

#### Content management

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-180 | Manage homepage sections — add, reorder, toggle visibility | MUST | `[PROPOSED]` |
| FR-181 | Edit About, Quality, Locations, Contact and all four policy pages | MUST | `[DERIVED]` |
| FR-182 | Manage locations, including map coordinates | MUST | `[CLIENT]` |
| FR-183 | Manage site settings: contact details, WhatsApp number, socials, and the legal block (entity, FSSAI, GSTIN, grievance officer) | MUST | `[DERIVED]` |
| FR-184 | Manage header and footer navigation | SHOULD | `[PROPOSED]` |
| FR-185 | Manage 301 redirects; slug changes create them automatically | MUST | `[PROPOSED]` |
| FR-186 | Rich-text editing producing structured JSON — never raw HTML | MUST | `[PROPOSED]` |

#### Media

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-190 | Upload images with automatic optimisation and blur-placeholder generation | MUST | `[PROPOSED]` |
| FR-191 | Alt text required — publishing is blocked without it | MUST | `[PROPOSED]` |
| FR-192 | Media library: search, replace, and show where an image is used before allowing deletion | MUST | `[PROPOSED]` |

#### Operations

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-200 | Dashboard: today's orders and enquiries, low stock, recent activity | MUST | `[PROPOSED]` |
| FR-201 | View, filter, assign, annotate and export enquiries through a status pipeline | MUST | `[PROPOSED]` |
| FR-202 | View and manage orders: status transitions, invoice, refund, dispatch notes | MUST if commerce | `[DERIVED]` |
| FR-203 | View customers, their orders and addresses | SHOULD | `[PROPOSED]` |

#### Platform

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-210 | Draft → preview → publish. Preview renders the real customer page against draft data | MUST | `[PROPOSED]` |
| FR-211 | Publishing invalidates the affected customer-site cache within 60 seconds | MUST | `[PROPOSED]` |
| FR-212 | Role-based access: `admin` and `staff` | MUST | `[PROPOSED]` |
| FR-213 | No public sign-up; staff accounts created by invitation only | MUST | `[PROPOSED]` |
| FR-214 | MFA mandatory for all admin and staff accounts | MUST | `[PROPOSED]` |
| FR-215 | Every mutation written to an audit log: who, what, when, before and after | MUST | `[PROPOSED]` |
| FR-216 | Admin domain fully excluded from search indexing | MUST | `[PROPOSED]` |
| FR-217 | Admin usable on a tablet and a phone — stock checks happen away from a desk | SHOULD | `[PROPOSED]` |
| FR-218 | Every destructive action confirms, and archives rather than hard-deletes where history matters | MUST | `[PROPOSED]` |

---

## 3. Non-functional requirements

### 3.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-001 | Largest Contentful Paint (field p75, mobile) | ≤ 2.0s |
| NFR-002 | Interaction to Next Paint (field p75) | ≤ 150ms |
| NFR-003 | Cumulative Layout Shift (field p75) | ≤ 0.05 |
| NFR-004 | Time to First Byte (p75) | ≤ 600ms |
| NFR-005 | Initial JS transferred, homepage | ≤ 130KB gzipped |
| NFR-006 | Initial JS transferred, PDP | ≤ 160KB gzipped |
| NFR-007 | Largest hero image transferred | ≤ 180KB (AVIF, responsive) |
| NFR-008 | Lighthouse mobile: Performance / Accessibility / Best Practices / SEO | ≥ 95 / 100 / 100 / 100 |
| NFR-009 | Server components by default; client components only where interaction demands it | Enforced in review |
| NFR-010 | No render-blocking third-party script above the fold | Enforced in review |

### 3.2 Accessibility

| ID | Requirement |
|---|---|
| NFR-020 | WCAG 2.2 Level AA across all user-facing pages |
| NFR-021 | Zero critical or serious axe-core violations in CI |
| NFR-022 | Every interactive element reachable and operable by keyboard alone |
| NFR-023 | Visible focus indicator meeting 3:1 contrast against adjacent colours |
| NFR-024 | Text contrast ≥ 4.5:1; large text and UI components ≥ 3:1 |
| NFR-025 | One `h1` per page, no skipped heading levels |
| NFR-026 | Meaningful alt text on every content image; decorative images `alt=""` |
| NFR-027 | Dialogs, drawers and menus manage focus correctly and restore it on close |
| NFR-028 | `prefers-reduced-motion` honoured — non-essential motion removed, not merely shortened |
| NFR-029 | Forms use real labels, `aria-describedby` for help and errors, and announce errors |
| NFR-030 | Target size ≥ 24×24 CSS px (WCAG 2.2 §2.5.8); ≥ 44px for primary mobile actions |
| NFR-031 | Site remains usable at 200% zoom and 320px width without horizontal scroll |

### 3.3 SEO

| ID | Requirement |
|---|---|
| NFR-040 | Unique title and meta description on every indexable route |
| NFR-041 | Canonical URL on every page |
| NFR-042 | Open Graph and Twitter card metadata with per-page images |
| NFR-043 | `sitemap.xml` generated from live content |
| NFR-044 | `robots.txt` with correct allow/disallow and sitemap reference |
| NFR-045 | Structured data: Organization, WebSite, BreadcrumbList, ItemList, Product |
| NFR-046 | Clean, human-readable, permanently stable URLs |
| NFR-047 | Faceted-filter URLs excluded from indexing |
| NFR-048 | Server-rendered content for all indexable pages |
| NFR-049 | 301 redirect map maintained for every slug change |

### 3.4 Security

| ID | Requirement |
|---|---|
| NFR-060 | HTTPS enforced; HSTS with preload |
| NFR-061 | Content Security Policy with nonce-based scripts |
| NFR-062 | Every API input validated server-side with Zod |
| NFR-063 | Sessions in httpOnly, Secure, SameSite=Lax cookies |
| NFR-064 | Rate limiting on auth, forms, search and payment endpoints |
| NFR-065 | Admin application protected by role checks re-verified in every server action, invitation-only accounts and mandatory MFA |
| NFR-066 | Payment webhooks signature-verified and idempotent |
| NFR-067 | Secrets server-only; environment schema validated at build |
| NFR-068 | Parameterised queries only, via Drizzle |
| NFR-069 | Dependency scanning in CI |
| NFR-070 | No PII in logs or analytics events |

### 3.5 Reliability and operations

| ID | Requirement |
|---|---|
| NFR-080 | Uptime target 99.9% |
| NFR-081 | Error monitoring with release tracking and source maps |
| NFR-082 | Structured server logging with request correlation |
| NFR-083 | Daily automated database backups, restore tested before launch |
| NFR-084 | Graceful degradation when the payment provider, email or image storage is unavailable; a failed cache revalidation never loses a saved change |
| NFR-085 | Every deployment rollback-able in under 5 minutes |

### 3.6 Maintainability

| ID | Requirement |
|---|---|
| NFR-090 | TypeScript `strict` with no `any` in application code |
| NFR-091 | Zero ESLint errors; CI fails on lint or type errors |
| NFR-092 | No component file exceeding ~250 lines without justification |
| NFR-093 | Business logic in `features/`, never inside page components |
| NFR-094 | No hard-coded business values — configuration or CMS only |
| NFR-095 | Conventional Commits |
| NFR-096 | Every non-obvious architectural decision recorded as an ADR |

### 3.7 Compatibility

| ID | Requirement |
|---|---|
| NFR-100 | Latest two versions of Chrome, Safari, Firefox and Edge |
| NFR-101 | iOS Safari 16+ and Android Chrome 110+ |
| NFR-102 | Verified at 320, 375, 390, 414, 768, 1024, 1280, 1440 and 1920px |
| NFR-103 | Usable on a 3G-class connection |
| NFR-104 | Core content readable with JavaScript disabled |

---

## 4. Requirements explicitly out of scope for V1

| ID | Item | Rationale |
|---|---|---|
| OOS-01 | Multi-language UI | No confirmed second-language market — `OQ-021` |
| OOS-02 | Multi-currency pricing | No confirmed international selling — `OQ-022` |
| OOS-03 | International shipping rates | Depends on OOS-02 |
| OOS-04 | Subscriptions | Not requested |
| OOS-05 | Human-agent live chat | WhatsApp covers it — `OQ-020` |
| OOS-06 | Blog / recipes | Recommended for month 3+ |
| OOS-07 | Marketplace / multi-vendor | Not the business model |
| OOS-08 | Native mobile apps | Not requested |
| OOS-09 | Loyalty and referral programmes | Not requested |
| OOS-10 | ERP / accounting integration | No system identified — `OQ-030` |

---

## 5. Assumptions

Each assumption is a decision made in the absence of information. If any proves wrong, the linked requirements change.

| ID | Assumption | Affects | Confidence |
|---|---|---|---|
| A-01 | Primary market is India, primary language English | Whole project | High |
| A-02 | Currency is INR | Commerce | High |
| A-03 | Products are shelf-stable and non-perishable in transit | Shipping, storage copy | High |
| A-04 | Catalogue is in the tens, not thousands, of SKUs at launch | Search approach, pagination | Medium |
| A-05 | Content editors are non-technical | CMS design | High |
| A-06 | Both B2C and B2B matter; B2C leads in V1 | IA, homepage | Medium |
| A-07 | Burla manufactures or contract-manufactures rather than only reselling | Quality page, legal declarations | Medium — `OQ-016` |
| A-08 | Traffic under 100k sessions/month in year one | Infrastructure sizing | Medium |
| A-09 | Regional origin is Telugu/Kannada-speaking South India, inferred from "vadiyalu" and "sandige" | Copy tone, SEO keywords, future locale | Medium — `OQ-015` |
