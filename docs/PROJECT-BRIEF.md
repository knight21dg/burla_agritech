# Burla Global Agri Products — Project Brief

| Field | Value |
|---|---|
| Document | `docs/PROJECT-BRIEF.md` |
| Version | 0.2 — two applications (customer + admin) |
| Date | 2026-09-07 |
| Status | Phase 0–1 complete. No implementation started. |
| Source material | 2 client-supplied images: brand logo, handwritten requirements sheet |

> **Read this first.** Every factual statement in this documentation set is tagged as one of:
> **`[CLIENT]`** — explicitly supplied by the client in the reference material.
> **`[DERIVED]`** — a direct, low-risk inference from `[CLIENT]` material.
> **`[PROPOSED]`** — our professional recommendation, requires client approval.
> **`[PLACEHOLDER]`** — unknown. Must be supplied before launch. Tracked in `docs/OPEN-QUESTIONS.md`.
> Nothing in this repository invents company facts, product data, certifications, claims or history.

---

## 1. Project understanding

### 1.0 Scope

**Two websites**, confirmed by the client after the initial documentation pass:

1. **Customer site** (`burla.com`) — the public catalogue and brand presence described throughout these documents.
2. **Admin site** (`admin.burla.com`) — a private application where staff add products, manage stock, edit content, and handle orders and enquiries.

They are separate applications sharing one database and one set of typed packages. This replaces the headless-CMS approach in v0.1 — see `ARCHITECTURE.md` ADR-009 and ADR-010, and the cost implications in `IMPLEMENTATION-PLAN.md` §7.

### 1.1 What we were given

**Image 1 — Logo.** A wordmark "BURLA" in a heavy geometric sans, in a single green, with a two-leaf sprout rising from the space above the letterforms. Below, letter-spaced in the same green: "GLOBAL AGRI PRODUCTS". White background, flat vector, no gradients, no effects. `[CLIENT]`

**Image 2 — Handwritten requirements sheet.** A single-page hand-drawn wireframe, written on the reverse of an unrelated printed certificate. It specifies the header, the navigation list, a central content zone, a communication widget, and a complete footer. It closes with the note "**WEBSITE MAKING WITH CODING**". `[CLIENT]`

### 1.2 What the material tells us

The client has thought about the site in terms of **navigation and footer completeness**, not in terms of brand or visual design. The handwritten sheet is essentially an **information-architecture brief**: 11 top-level nav items (10 of which are product categories), a search affordance, account entry points, a WhatsApp / live-chat channel, a policy block, and a set of trust pages (About, Locations, Quality Control and Standards, Contact).

The instruction "WEBSITE MAKING WITH CODING" is read as an explicit rejection of drag-and-drop / template builders (Wix, Shopify theme, WordPress page-builder) in favour of a custom-coded application. `[DERIVED]`

The brand name — "**GLOBAL** AGRI PRODUCTS" — combined with a product range built entirely on **dehydration, pickling, milling and sun-drying** (all shelf-stable, exportable formats) signals ambition beyond local retail: **B2C retail today, B2B / wholesale / export tomorrow**. The architecture is designed for that even though V1 may not ship it. `[DERIVED]`

### 1.3 What the material does *not* tell us

No product names. No prices. No weights. No ingredients. No photography. No company history. No addresses. No phone number. No WhatsApp number. No FSSAI licence. No certifications. No legal entity name. No domain. No social handles. No decision on whether V1 sells online or only captures enquiries.

**These are the eight blocking unknowns** (§7 and `docs/OPEN-QUESTIONS.md`). Everything else can proceed.

---

## 2. Business context

### 2.1 Positioning statement `[PROPOSED]`

> Burla Global Agri Products takes Indian agricultural produce — fruit, vegetables, pulses, millets, spices — and converts it into shelf-stable everyday foods: dehydrated powders and flakes, pickles, spiced dal powders, sun-dried crisps, dry fruits, millets, herbal infusions and masalas.

The website's job is to make a **processing and packaging business** read as a **branded food house** — not as a commodity supplier, and not as a corner grocery.

### 2.2 The competitive trap to avoid

*(Validated against two client-supplied reference sites — see `REFERENCE-ANALYSIS.md`. Both fall into trap 1 or 2 below, which is why the premium editorial position is unoccupied.)*

The default outcome for a business of this type is a website that looks like one of four things:

1. A WordPress food-business template — hero slider, three icon cards, "Why Choose Us", stock farmer photo.
2. A default Shopify theme — product grid, nothing else, no story.
3. An AI-generated landing page — green gradient, glassmorphism, `rounded-3xl` everything, emoji icons.
4. A B2B exporter directory listing — dense tables, no design, 2009 aesthetic.

The design brief in `docs/DESIGN-SYSTEM.md` is written specifically to make each of these outcomes structurally impossible.

### 2.3 Brand attributes, ranked

Ranked by how much each should influence a decision when two conflict:

1. **Trustworthy** — this is food. Credibility outranks beauty. Verifiable facts, legal declarations, real photography, no invented claims.
2. **Natural / agricultural** — the product is farm-derived. Material, texture, warmth, earth.
3. **Editorial / premium** — restraint, whitespace, typographic confidence, art direction.
4. **Indian** — specific, not generic. Regional product names kept, not anglicised away.
5. **Global** — export-ready structure, international enquiry paths, English-first.
6. **Conversion-focused** — but through trust and ease, never through pressure patterns.

### 2.4 Success criteria `[PROPOSED]`

| # | Criterion | Measure | Target |
|---|---|---|---|
| S1 | Products are discoverable | Category → product click-through | ≥ 35% |
| S2 | Contact is frictionless | WhatsApp click rate on product pages | ≥ 8% |
| S3 | Trust is established | Median session on About + Quality pages | ≥ 60s |
| S4 | Wholesale pipeline exists | Qualified B2B enquiries per month | ≥ 10 by month 3 |
| S5 | Search performs | Lighthouse SEO, indexed canonical pages | 100, all indexed |
| S6 | Site is fast | Core Web Vitals, field p75 | LCP ≤ 2.0s, INP ≤ 150ms, CLS ≤ 0.05 |
| S7 | Site is usable by everyone | WCAG 2.2 AA, axe violations | 0 critical / serious |
| S8 | Staff independence | Content edits requiring a developer | 0 |

Targets are proposed and should be agreed before they become contractual.

---

## 3. Target users

| # | Persona | Who | Primary need | Primary action | Entry point |
|---|---|---|---|---|---|
| P1 | **Home cook** | 28–55, urban India, buys quality staples | "Is this good, and what is actually in it?" | Buy or WhatsApp enquiry | Google, Instagram |
| P2 | **Diaspora buyer** | Indian abroad, seeks authentic regional foods (vadiyalu, sandige, pickles) | "Can I get this shipped, and is it the real thing?" | International enquiry | Google, word of mouth |
| P3 | **Retailer / distributor** | Kirana, specialty grocer, online reseller | "Price list, MOQ, margins, supply reliability" | Wholesale enquiry | Direct, referral |
| P4 | **Food business** | Restaurant, cloud kitchen, snack brand, HORECA | "Bulk spec, consistency, documentation" | Bulk enquiry | Search, referral |
| P5 | **Exporter / importer** | International buyer | "Certifications, capacity, compliance, samples" | B2B enquiry + documents | Search, trade channels |
| P6 | **Evaluator** | Anyone deciding whether Burla is legitimate | "Who are these people? Is this safe food?" | Read About + Quality | Any page |

P6 is not a separate visitor — it is a **mode** every one of P1–P5 enters before converting. This is why About, Quality & Standards and Locations are treated as conversion pages, not as filler.

---

## 4. Product scope

### 4.1 Categories `[CLIENT]` — verbatim from the handwritten sheet

| # | As written by hand | Note |
|---|---|---|
| 1 | Home | Nav item, not a category |
| 2 | Dehydrated powders / Flakes | |
| 2b | Dehydrated Fruits — powders | Written as an insertion beneath item 2. Ambiguous — `OQ-011` |
| 3 | Pickles | |
| 4 | Spiced dal powder | |
| 5 | Sundried crips (vadiyalu) | Reads "crips"; almost certainly "crisps" — `OQ-012` |
| 6 | Dry Fruits | |
| 7 | Millets | |
| 8 | Herbal Tea / coffee | |
| 9 | Masala powders | |
| 10 | Combo packs | |
| 11 | Contact us | Nav item, not a category |

**No additional category has been invented.** Anything beyond this list must be added by the client through the CMS.

### 4.2 Naming ambiguities — flagged, not silently corrected

- `OQ-011` — Is **Dehydrated Fruits** a separate top-level category or a sub-category of Dehydrated Powders/Flakes? The sheet writes it as an inserted sub-line. Our reading is *separate top-level*. **Needs confirmation.**
- `OQ-012` — Sun-dried crisps: the client wrote "**vadiyalu**" (Telugu). The project brief offers "**Sandige**" (Kannada). Same product family, two regional names. Which leads? Both? This is a **brand and SEO decision**, not a typo — the answer permanently fixes the URL slug.
- `OQ-013` — Singular/plural and capitalisation of every label ("Spiced dal powder" vs "Spiced Dal Powders").

### 4.3 Structural requirement

Categories must be **CMS-managed, orderable, addable and removable without a deploy** — including slug, hero copy, hero image, SEO metadata and display order. No category may be hard-coded. See `docs/ARCHITECTURE.md` §5.

---

## 5. Project objectives

### 5.1 Primary `[CLIENT]` + `[DERIVED]`

1. Build trust in the Burla brand.
2. Showcase products with genuine visual quality.
3. Make products easy to find (navigation + search + category structure).
4. Explain products factually (ingredients, weight, shelf life, origin).
5. Make contact effortless.
6. Support WhatsApp as a first-class conversion channel.
7. Be architecturally ready for ecommerce.
8. Support wholesale / B2B enquiry capture.
9. Establish a premium digital brand presence.
10. Be SEO-native from day one.

### 5.2 Secondary

- Long-term organic traffic — category and product pages as the growth engine.
- Non-technical content management.
- Growth headroom: more products, categories, locations.
- International readiness without paying the complexity cost in V1.
- Analytics and conversion instrumentation.

### 5.3 Explicit non-goals for V1 `[PROPOSED]`

- ❌ Multi-language UI (architected for, not built)
- ❌ Multi-currency pricing (architected for, not built)
- ❌ International shipping calculation
- ❌ Subscriptions / recurring orders
- ❌ Loyalty, referrals, complex promotions
- ❌ Mobile apps
- ❌ Marketplace / multi-vendor
- ❌ Human-agent live chat — WhatsApp *is* the live chat (`OQ-020`)
- ❌ Blog / recipes — recommended for month 3+, architected for now

---

## 6. Approach

### 6.1 Phasing philosophy

```
Understand → Document → Agree → Design system → Foundation → Page by page → Harden → Ship
```

Each phase has an exit criterion. A phase is not "done" because code renders — see the Definition of Done in `docs/IMPLEMENTATION-PLAN.md` §9.

### 6.2 Content-first, not code-first

The largest risk here is **not engineering** — it is **content and photography**. A technically flawless website filled with placeholder copy and stock images fails every objective in §5. Photography and product-data acquisition therefore start **in parallel with Phase 5**, not after Phase 16. See `docs/PHOTOGRAPHY-BRIEF.md` and `docs/CONTENT-INVENTORY.md`.

### 6.3 Documentation set

| Document | Purpose |
|---|---|
| `PROJECT-BRIEF.md` | This file — context, users, objectives, scope, risks |
| `REQUIREMENTS.md` | Traceable functional + non-functional requirements |
| `SITEMAP.md` | Every route, purpose, rendering strategy, SEO treatment |
| `USER-FLOWS.md` | Step-by-step journeys with states and failure modes |
| `ARCHITECTURE.md` | Technical architecture, stack, ADRs, module boundaries |
| `DESIGN-SYSTEM.md` | Art direction, tokens, type, components, motion, anti-patterns |
| `DATABASE.md` | Postgres schema — catalogue, content, commerce, operations, migrations |
| `SEO.md` | URLs, metadata, structured data, sitemap, content strategy |
| `SECURITY.md` | Threat model, controls, compliance (FSSAI, Legal Metrology, DPDP) |
| `TESTING.md` | Strategy, pyramid, journeys, a11y/perf gates, CI |
| `ANALYTICS.md` | Event taxonomy, funnels, dashboards, privacy |
| `REFERENCE-ANALYSIS.md` | Client-supplied reference sites reviewed — patterns to adopt, patterns to avoid, the competitive gap |
| `PHOTOGRAPHY-BRIEF.md` | Shot list, treatment, specs, what to commission |
| `CONTENT-INVENTORY.md` | Every string the client must supply, per page |
| `OPEN-QUESTIONS.md` | Everything unknown, with blocking status and owner |
| `IMPLEMENTATION-PLAN.md` | Phases 0–22, deliverables, exit criteria, sequencing |

---

## 7. Blocking unknowns

| ID | Blocking unknown | Blocks |
|---|---|---|
| `OQ-001` | Is V1 **transactional** (cart, payment) or **enquiry-only** (catalogue + WhatsApp)? | Phases 15 & 21, database scope, roughly 40% of build effort |
| `OQ-038` | **Custom admin, or Sanity Studio as the admin?** | Phase 16 scope — a ~25-day cost difference |
| `OQ-002` | Legal entity name, registered address, GSTIN | Footer, policies, invoices, legal compliance |
| `OQ-003` | **FSSAI licence number** | Legally required on a food business website in India |
| `OQ-004` | WhatsApp business number | The primary conversion channel |
| `OQ-005` | Product list: names, weights, MRP, ingredients, shelf life | Every product page — the catalogue cannot exist without it |
| `OQ-006` | Product photography — exists / to be commissioned / budget | Highest visual-quality risk in the project |
| `OQ-007` | Domain name + business email | Deployment, transactional email, OG tags, Search Console |
| `OQ-008` | Vector logo file (SVG/AI/EPS) + exact brand green hex | Design system foundation |

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Photography never materialises**; site ships with stock imagery | High | Critical — destroys the premium positioning entirely | Photography brief issued in Phase 1; hard gate on Phase 8 sign-off; budget quoted early |
| R2 | **Product data arrives incomplete** (no ingredients, no weights) | High | High — thin, non-compliant, un-rankable product pages | Structured intake sheet issued now; PDP renders only populated fields; compliance fields mandatory |
| R3 | **Ecommerce scope flips mid-build** (`OQ-001` answered late) | Medium | High — rework of cart/checkout/DB | Architecture supports both from day one; commerce is a feature-flagged module, not a rewrite |
| R4 | **Legal compliance missed** — FSSAI, Legal Metrology declarations, grievance officer | Medium | Critical — regulatory exposure for a food business | Requirements enumerated in `SECURITY.md` §8; client must have them reviewed by their own advisor |
| R5 | **Design drifts to template** under delivery pressure | Medium | High — the one outcome the client explicitly rejected | Anti-pattern list is a review gate; every page passes design review before merge |
| R6 | ~~Dual source-of-truth between CMS and database~~ **Resolved** | — | — | Eliminated by ADR-010: Postgres is the single source of truth, managed through one admin application |
| R7 | **Category taxonomy changes** after URLs are indexed | Medium | Medium — SEO loss | Slugs CMS-owned with permanent 301 redirect records from day one |
| R8 | Scope creep into blog, multi-language, marketplace | Medium | Medium | Non-goals stated in §5.3 and agreed at sign-off |
| R9 | Vercel + Cloudflare misconfiguration (double proxy, caching conflicts) | Low | Medium | DNS-only mode for Vercel apex/www records; documented in `ARCHITECTURE.md` §11 |
| R10 | **Client cannot operate the custom admin** | Medium | High — the admin is now bespoke rather than a mature off-the-shelf tool, so its usability is entirely our responsibility | Editorial UX designed, not improvised; plain-language field help; UF-10 usability test with actual staff as a Phase 16 exit gate; runbook + live handover |
| R11 | Repository currently sits inside the user's **home-directory git repo** | Certain (present) | Medium — accidental commit of personal files | Initialise a dedicated repo before any commit — see §9 |

---

## 9. Immediate environment issue `[DERIVED]`

The project folder `C:\Users\tarun\OneDrive\Desktop\Agri` is **empty and is not a git repository**. Git commands run inside it currently resolve to a repository rooted at `C:\Users\tarun` — the entire Windows home directory, containing thousands of untracked personal files, `.ssh/`, `.claude.json`, credentials and browser data.

**Any `git add` / `git commit` from this folder in its current state risks committing personal and secret material.**

Required before any commit:

1. Initialise a dedicated repository in the project folder.
2. Add a `.gitignore` (Node / Next.js + `.env*`) as the **first** commit.
3. Verify `git rev-parse --show-toplevel` resolves to the project folder, not the home directory.

Additionally the project sits inside a **OneDrive-synced folder**. `node_modules/` and `.next/` under OneDrive cause file-lock and sync-storm problems on Windows. Recommendation: move the working copy outside OneDrive (e.g. `C:\dev\burla`) and keep OneDrive for documents only. `[PROPOSED]`

---

## 10. Reference assets

Neither client image is present on disk — both exist only in the conversation. Required before Phase 5:

| Path | Asset | Status |
|---|---|---|
| `assets/brand/burla-logo.svg` | Vector logo, primary | **Missing** — `OQ-008` |
| `assets/brand/burla-logo-mono.svg` | Single-colour / reversed variants | **Missing** |
| `assets/brand/burla-logo.png` | Raster fallback, ≥ 2000px | **Missing** (a PNG was shown in chat) |
| `assets/reference/handwritten-requirements.jpg` | The client's requirements sheet | **Missing** — archive for traceability |

See `assets/README.md`.
