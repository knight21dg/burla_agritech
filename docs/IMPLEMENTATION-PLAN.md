# Implementation Plan — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/IMPLEMENTATION-PLAN.md` |
| Version | **1.0 — rework plan for the product-first direction** |
| Date | 2026-09-09 |
| Current position | Demo built on the withdrawn v0.2 design. Planning complete for v1.0. **Awaiting approval before rework begins.** |

---

## 1. Where the project actually is

Being precise about this matters, because "we have a demo" and "we have a
website" are very different statements.

**What exists:** a navigable Next.js 16 demo of the customer site with ten
categories, 28 sample products, working search, WhatsApp deep links, validated
forms, a full accessibility pass, the Indian food-labelling compliance
architecture, and 18 documents.

**What it is built on:** the v0.2 design system — warm ivory, display serif,
handwriting accent, deep-green section bands, `/shop` URLs, categories behind a
mega-menu, an AI-generated hero. **All of that is now withdrawn.**

**What it does not have:** a database, an admin, tests, CI, real content, or real
photography.

---

## 2. What survives the redirection

Roughly 40% of the frontend and effectively all of the non-visual work.

| Carries over intact | Needs rework | Discarded |
|---|---|---|
| Data layer and catalogue module shape | Design tokens — full replacement | Warm palette (ivory, sand, terracotta, turmeric) |
| Accessibility patterns (focus, keyboard, ARIA, contrast method) | Header and navigation — restructured | Fraunces display serif, Caveat script |
| Compliance handling (legal fields block publish) | Homepage — reordered, products first | Deep-green anchor bands |
| Search overlay logic | Product and category cards — simplified | Illustrated SVG hero scene |
| Form validation and states | URL structure `/shop` → `/products` | Shop mega-menu |
| SEO scaffolding (metadata, JSON-LD, sitemap) | Taxonomy — type layer added | Editorial asymmetric layouts |
| WhatsApp integration | Placeholder imagery — neutral, not pouch art | Section entrance animations |
| All 18 documents (updated, not rewritten) | | AI-generated hero *(pending `OQ-051`)* |

**The honest summary: this is a re-skin plus a restructure, not a rebuild.**
Reworking is materially faster than starting again, and it keeps the
accessibility and compliance work that is easy to lose and expensive to redo.

---

## 3. Three decisions gate everything

Work should not start until these are answered. Each changes what gets built.

| # | Decision | Tracked | Blocks |
|---|---|---|---|
| 1 | **The hero image.** Keep the AI-generated composite, or replace it with a simple white hero and a real photograph? | `OQ-051` | Homepage — the first thing anyone sees |
| 2 | **Sanity or the custom admin?** The new stack list reverses ADR-010 | `OQ-055` | The entire admin phase |
| 3 | **Rework or restart?** Confirm we adapt the existing build | `OQ-057` | Everything |

Two more are needed early but do not stop a start:

| # | Decision | Tracked |
|---|---|---|
| 4 | The real type layer per category | `OQ-049` |
| 5 | Product URL shape — nested or flat | `OQ-050` |

---

## 4. Phases

### Phase A — Design system in code · 3 days
Replace the token layer with the white/green/neutral palette. Single sans
family. Remove the serif, script font, warm surfaces and shadow usage. Rebuild
Button, Section, Container against the new tokens.
**Exit:** tokens live, contrast re-verified against the real brand green
(`OQ-008`), no raw hex anywhere in components.

### Phase B — Navigation restructure · 3 days
Two-row desktop header with the persistent category bar. Horizontal scroll for
the bar below 1280px. Mobile drawer with the flat category list. Remove
Locations from the main nav and the mega-menu entirely. Footer restructured.
**Exit:** every category reachable in one click from every page, at every
breakpoint, by keyboard.

### Phase C — Taxonomy and routes · 4 days
Add the type layer to the data model. Move `/shop` → `/products`, add
`/products/[category]/[type]`, settle the product URL shape. Write the redirect
map. Implement the collapse rules from `PRODUCT-TAXONOMY.md` §1.1.
**Exit:** all three rendering modes work; breadcrumbs correct at two and three
levels; every old URL redirects.

### Phase D — Homepage rebuild · 4 days
Simple white hero. Category grid. **Horizontal product carousel** on CSS
scroll-snap with arrows, keyboard support and a partial next card. Short about
block and quality teaser, both below the products.
**Exit:** products visible without scrolling past company copy; carousel fully
keyboard and screen-reader operable; homepage passes the five-second test.

### Phase E — Category, type and product pages · 5 days
Rebuild against the new system. Simplified product cards. Product page with
gallery adapting from one image to five, specification block, WhatsApp enquiry.
**Exit:** the complete `UF-00` journey works end to end; PDP renders correctly
with a single image.

### Phase F — Content pages · 2 days
About, Quality, Locations, Contact, policies re-skinned. Locations linked from
the footer only.

### Phase G — Real content and photography · *client-dependent*
Load the real catalogue, taxonomy and photography. **This is the gating
dependency for launch, and it is not an engineering task.**

### Phase H — Admin · 20–28 days · *blocked on `OQ-055`*
Unchanged from the previous plan, plus type management.

### Phase I — Harden and ship · 12 days
SEO, accessibility audit, performance, security, tests, CI, deployment.

---

## 5. Effort

| Phase | Days |
|---|---|
| A — Design system | 3 |
| B — Navigation | 3 |
| C — Taxonomy and routes | 4 |
| D — Homepage | 4 |
| E — Product pages | 5 |
| F — Content pages | 2 |
| **Frontend rework subtotal** | **21** |
| H — Admin | 20–28 |
| I — Harden and ship | 12 |
| **Total to launch** *(enquiry-only)* | **~53–61 days** |
| *If full ecommerce* (`OQ-001` = B/C) | *+14* |

The rework costs about **21 days**. Starting the frontend again from scratch
would cost roughly 35 and would lose the accessibility and compliance work.

---

## 6. Sequencing

```
DECISIONS   OQ-051 · OQ-055 · OQ-057 ──┐
                                       ▼
ENGINEERING   A → B → C → D → E → F ────────────► H ────► I ──► launch
                                       ▲                        ▲
CONTENT       taxonomy → product data ─┘                        │
PHOTOGRAPHY   commission → shoot → retouch ─────────────────────┘
                            ▲
                     longest lead time
```

**Photography and product data are the critical path, not engineering.** They
should start the day the decisions land. A perfectly reworked site with grey
placeholder panels is not a launchable product-first website.

Phases H and A–F can overlap once the foundation is in place, which also lets
the client start entering real data while the storefront is still being built.

---

## 7. Definition of done

Unchanged, and it is not "it renders":

- [ ] Matches the approved design; passes the `DESIGN-SYSTEM.md` §13 checklist
- [ ] Verified at 320, 375, 768, 1024, 1440px
- [ ] WCAG 2.2 AA — automated and manual passes
- [ ] Loading, empty, error and success states implemented
- [ ] Tests written and passing
- [ ] SEO — metadata, structured data, semantics
- [ ] Performance budget met
- [ ] Security reviewed
- [ ] Zero TypeScript errors, zero lint errors, no console output
- [ ] No placeholder without a tracked entry
- [ ] Code reviewed and merged through a PR

---

## 8. Immediate next actions

### Client
1. Answer `OQ-051`, `OQ-055`, `OQ-057` — the three gating decisions
2. Supply the vector logo (`OQ-008`) — we are still drawing a substitute
3. Confirm the type layer per category (`OQ-049`)
4. Decide the product URL shape (`OQ-050`)
5. Start the product data intake (`CLIENT-ASSETS-REQUIRED.md` §3)
6. Decide on photography — commission or in-house (`OQ-052`)
7. Answer `OQ-001` — sell online, or enquiry-only

### Us, on approval
1. Phase A, then rebuild the homepage alone
2. **Present that one page for approval before touching the rest**

That second point is deliberate. The visual direction has now changed once after
a demo was built. Agreeing one page against the new system — before rebuilding
twelve — keeps the cost of any further change small.

---

## 9. What we will not do

- Invent product names, types, prices, ingredients, certifications, locations, company history, statistics, testimonials or health claims
- Ship stock or AI-generated food photography as product imagery
- Launch a food website without the legally required declarations
- Build ecommerce before `OQ-001` is answered
- Start the admin before `OQ-055` is answered
- Rebuild the remaining pages before one page is approved against the new design system
