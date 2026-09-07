# Implementation Plan — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/IMPLEMENTATION-PLAN.md` |
| Version | 0.3 — frontend demo status |
| Date | 2026-09-07 |
| Current position | Frontend demo built (Phases 7-13, customer site, mock data). Admin app not started. |

---

## 1. Sequencing principle

Three tracks run in parallel, because the critical path is not engineering:

```
ENGINEERING   ──────────────────────────────────────────────────►
CONTENT       ──────────────────────────────────────────────────►   ← usually the bottleneck
PHOTOGRAPHY   ──────────────────────────────────────────────────►   ← longest lead time
```

**Photography and product data start now.** They have the longest lead time and gate the visual quality of everything. A perfectly built site with placeholder images is a failed project.

---

## 2. Phase status

| Phase | Name | Status | Gate |
|---|---|---|---|
| 0 | Understand the project | ✅ Complete | — |
| 1 | Requirements analysis | ✅ Complete | **Client sign-off + `OQ-001`** |
| 2 | Information architecture | ✅ Complete (in `SITEMAP.md`) | `OQ-011`, `OQ-012`, `OQ-013`, `OQ-014` |
| 3 | User flows | ✅ Complete | Follows Phase 1 sign-off |
| 4 | Technical architecture | ✅ Complete | ADR approval |
| 5 | Design system | 🟡 Direction proposed | Typography choice + `OQ-008` |
| 6 | Wireframes / layout | ⬜ Not started | Phase 5 approval |
| 6 | Wireframes / layout | ✅ Superseded | Client supplied an approved UI mockup |
| 7 | Application foundation | 🟢 Demo done | Monorepo, Next.js 16, tokens, CI pending |
| 8 | Homepage | 🟢 Demo done | Uses the client's key visual; real photography pending |
| 9 | Shop + category pages | 🟢 Demo done | Filters, sort, SEO-safe facet URLs |
| 10 | Product detail | 🟢 Demo done | Legal info block renders as "to be confirmed" |
| 11 | About / Quality / Locations / Contact | 🟢 Demo done | Blocked on client content |
| 12 | Wholesale | 🟢 Demo done | Form validates; not yet wired to a backend |
| 13 | Search | 🟢 Demo done | In-memory; Postgres FTS on real data |
| 14 | Authentication | ⬜ Not started | Needs database |
| 15 | Cart / checkout / payment | ⬜ Blocked | `OQ-001` |
| 16 | Admin application | ⬜ Not started | Needs `OQ-038` |
| 17–22 | SEO → harden → ship | ⬜ Not started | Sequential |

**"Demo done" means the UI exists and is navigable against sample data.** It
does not mean the Definition of Done in §9 is met: there is no database, no
tests, no CI, and the content is placeholder.

---

## 3. Phases in detail

### ✅ Phase 0 — Understand
Inspected the repository and both client images. Transcribed the handwritten sheet verbatim. Identified what is known, inferred and unknown.
**Deliverable:** `PROJECT-BRIEF.md`.

### ✅ Phase 1 — Requirements
Extracted every requirement, tagged its source, separated functional from non-functional, and registered every unknown.
**Deliverables:** `REQUIREMENTS.md`, `OPEN-QUESTIONS.md`.
**Exit gate:** client signs off the requirements **and answers `OQ-001`** (ecommerce or enquiry-only). Everything downstream sizes off that answer.

### ✅ Phase 2 — Information architecture
Full sitemap, page inventory, navigation model, URL conventions, crawl policy.
**Deliverable:** `SITEMAP.md`.
**Exit gate:** approval of the category taxonomy and the "Shop" nesting deviation (`OQ-014`). **URLs are permanent — this must be right before Phase 9.**

### ✅ Phase 3 — User flows
Twelve flows with states and failure modes.
**Deliverable:** `USER-FLOWS.md`.

### ✅ Phase 4 — Technical architecture
Stack, module boundaries, data ownership, caching, eight ADRs.
**Deliverables:** `ARCHITECTURE.md`, `DATABASE.md`.
**Exit gate:** ADR-005 (R2 images), ADR-006 (Better Auth), ADR-007 (WhatsApp only), ADR-009 (two applications) and ADR-010 (custom admin, no CMS) approved.

### 🟡 Phase 5 — Design system
**Done:** colour palette with verified contrast, three typography directions, spacing, grid, motion, component specs, anti-pattern rules.
**Remaining:** client picks a typography direction; the vector logo arrives and the exact green replaces the provisional value; tokens are implemented in code.
**Deliverable:** `DESIGN-SYSTEM.md` + `app/globals.css` token layer.
**Exit gate:** direction approved, contrast re-verified against the real brand green.

### ⬜ Phase 6 — Wireframes and layout
Low-fidelity layouts for every page type at mobile and desktop, then one high-fidelity homepage design to establish the visual standard everything else is measured against.
**Deliverable:** wireframes + one homepage comp.
**Exit gate:** client approves the homepage direction. **Do not build twelve pages before agreeing what one page looks like.**

### ⬜ Phase 7 — Application foundation
Repository and Turborepo monorepo (see §5), both Next.js apps scaffolded, TypeScript strict, shared Tailwind token preset, `packages/db` schema and migrations, `packages/core` domain schemas, `packages/ui` primitives, R2 storage package, auth with role separation, environment validation, error and 404 pages, CI pipeline, two preview deployments.
**Exit gate:** an empty but production-shaped application deploys, passes CI, and scores 100 on Lighthouse accessibility and SEO.

### ⬜ Phase 8 — Homepage
The strongest page on the site, built section by section against the approved comp.
**Exit gate:** design review passed, all breakpoints verified, performance budget met, a11y clean. **Requires real hero photography** (`OQ-017`).

### ⬜ Phase 9 — Shop and category pages
Shop index, category template, product grid, filters, sorting, pagination, all states.
**Exit gate:** all ten categories render with real content; filter URLs are SEO-safe.

### ⬜ Phase 10 — Product detail
Gallery, variants, information block, WhatsApp enquiry, related products, structured data.
**Exit gate:** the complete mandatory information block renders; `Product` JSON-LD validates; enquiry flow works end to end.

### ⬜ Phase 11 — About, Quality, Locations, Contact
The trust cluster. **Blocked on client content** (`OQ-018`, `OQ-019`, `OQ-020`, `OQ-021`) — we will not write company history or process claims.
**Exit gate:** zero placeholders; every claim traceable to client-supplied evidence.

### ⬜ Phase 12 — Wholesale / B2B
Landing page, enquiry form, persistence, notification and acknowledgement email, admin visibility.
**Exit gate:** submission persists before email; spam controls verified; a lead cannot be lost by an email failure.

### ⬜ Phase 13 — Search
Overlay, suggestions, results page, empty state, keyboard support, analytics.
**Exit gate:** p95 suggestion latency < 200ms; fully keyboard operable.

### ⬜ Phase 14 — Authentication
Sign-up, verification, sign-in, reset, profile, sessions, rate limiting.
**Exit gate:** every case in `TESTING.md` §5 passing, including adversarial paths.

### ⬜ Phase 15 — Cart, checkout, payment `[only if OQ-001 = B or C]`
Cart, address, shipping, Razorpay, webhook, orders, confirmation, invoice, stock.
**Exit gate:** price tampering rejected; webhook idempotent; concurrent purchase of the last unit cannot oversell; payment-success-order-failure alerts and reconciles.
**This is the largest single phase.** If `OQ-001` = A, it is skipped entirely and the timeline shortens materially.

### ⬜ Phase 16 — Admin application
**Now the second-largest phase in the project.** Built as `apps/admin` on its own domain.

Sub-phases, in build order:

| # | Scope |
|---|---|
| 16.1 | Admin shell — auth, MFA, invitations, roles, navigation, dashboard, audit log |
| 16.2 | Media library — R2 upload, alt-text enforcement, blur placeholders, usage tracking |
| 16.3 | Products — list, create, edit, rich text, images, SEO, archive, bulk actions |
| 16.4 | Variants and pricing — pack sizes, SKUs, price, MRP, GST, weight |
| 16.5 | **Inventory — stock view, adjustments with reasons, movement history, low-stock alerts** |
| 16.6 | Categories — CRUD, drag-to-reorder, hero content, publish state |
| 16.7 | Content — homepage sections, pages, locations, settings, navigation, redirects |
| 16.8 | Preview and publish — signed preview tokens, revalidation webhook, publish validation |
| 16.9 | Enquiries and orders — pipelines, filtering, export, status transitions |
| 16.10 | Runbook, training material, live handover session |

**Exit gate:** a non-technical member of the client's staff, unaided and unobserved, (a) creates and publishes a product with complete legal information, and (b) adjusts stock and sees it change on the live customer site. If they cannot, the phase is not finished — this admin is bespoke, so its usability is entirely our responsibility (risk R10).

### ⬜ Phase 17 — SEO
Metadata across all routes, JSON-LD, sitemap, robots, redirects, Search Console.
**Exit gate:** `SEO.md` §9 checklist complete.

### ⬜ Phase 18 — Accessibility
Full audit and remediation, automated and manual.
**Exit gate:** zero critical/serious axe violations; manual checklist complete on every page type.

### ⬜ Phase 19 — Performance
Image, font and bundle optimisation; caching verification; third-party audit.
**Exit gate:** every budget in `TESTING.md` §8 met on mobile.

### ⬜ Phase 20 — Security
Headers, CSP enforcement, rate limits, penetration checklist, dependency audit, backup restore drill.
**Exit gate:** `SECURITY.md` §12 checklist complete.

### ⬜ Phase 21 — Testing
Complete the suite to the coverage defined in `TESTING.md`; full manual matrix; content and compliance crawl.
**Exit gate:** CI green; zero placeholders in production; zero broken links.

### ⬜ Phase 22 — Production deployment
Domain, DNS, SSL, environment variables, monitoring, analytics, backups, launch checklist, post-launch watch.
**Exit gate:** live, monitored, backed up, with a tested rollback.

---

## 4. Critical path

```
OQ-001 answered ──┬──► scope fixed ──► Phase 5 approval ──► Phase 7 ──► 8 ──► 9 ──► 10 ─┐
                  │                                                                     │
OQ-008 logo ──────┘                                                                     │
                                                                                        ▼
Photography commissioned ──────────────► shoot ──────► retouch ──────► Phases 8/9/10 usable
                                                                                        │
Product data collected ────────────────► CMS entry ─────────────────────────────────────┤
                                                                                        ▼
Company content (About/Quality/Locations) ──────────────────► Phase 11 ──► 17-21 ──► Launch
```

**The three things that actually determine the launch date:** the `OQ-001` answer, photography, and client-supplied content. Engineering is rarely the constraint on a project of this shape.

---

## 5. Repository setup — before any code

Required, in order (see `PROJECT-BRIEF.md` §9 for why this matters):

1. **Move the project out of OneDrive** — e.g. `C:\dev\burla`. `node_modules/` and `.next/` under OneDrive cause file locks and sync storms on Windows.
2. **Initialise a dedicated git repository** in the project folder. Today, git commands there resolve to a repository rooted at the Windows home directory containing `.ssh/`, credentials and browser data.
3. **Commit a `.gitignore` first** — `node_modules`, `.next`, `.env*`, `.vercel`, coverage, Playwright artefacts.
4. Verify `git rev-parse --show-toplevel` points at the project folder.
5. Create the GitHub repository as **private**.
6. Branch protection on `main`: PR required, CI must pass.
7. Conventional Commits; one logical change per commit.

---

## 6. Immediate next actions

### Client
| # | Action | Blocks |
|---|---|---|
| 1 | Answer `OQ-001` — ecommerce or enquiry-only | Everything downstream |
| 2 | Supply the vector logo and exact brand green (`OQ-008`) | Phase 5 completion |
| 3 | Supply legal identity, FSSAI licence, GSTIN (`OQ-002`, `OQ-003`) | Launch, legally |
| 4 | Supply the WhatsApp number (`OQ-004`) | Primary conversion channel |
| 5 | Confirm the category taxonomy (`OQ-011`–`OQ-014`) | URLs, permanently |
| 6 | Decide on photography — exists or commission (`OQ-017`) | Visual quality, everywhere |
| 7 | Begin the product data intake sheet (`OQ-016`) | Every product page |
| 8 | Confirm the domain (`OQ-032`) | Deployment, SEO setup |
| 9 | Choose a typography direction (`DESIGN-SYSTEM.md` §4.1) | Phase 5 completion |
| 10 | Approve or reject the five deviations in `OPEN-QUESTIONS.md` §H | IA and architecture |

### Us, once §6.1 items 1, 2 and 9 land
| # | Action |
|---|---|
| 1 | Finalise the design system with the real brand colour and chosen type |
| 2 | Produce wireframes for every page type |
| 3 | Produce the high-fidelity homepage comp |
| 4 | Set up the repository and CI |
| 5 | Scaffold the application foundation |

---

## 7. Effort shape

Indicative, in engineering-days, excluding client content production and photography. Two scenarios by `OQ-001`.

Revised for the two-application architecture (ADR-009) and the custom admin (ADR-010).

| Phase | Enquiry-only | Full ecommerce | Δ vs v0.1 |
|---|---|---|---|
| 5–6 Design system + wireframes + homepage comp | 8 | 8 | — |
| 7 Foundation — monorepo, two apps, shared packages | 9 | 11 | +3 |
| 8 Homepage | 6 | 6 | — |
| 9 Shop + categories | 6 | 7 | — |
| 10 Product detail | 6 | 8 | — |
| 11 About / Quality / Locations / Contact | 5 | 5 | — |
| 12 Wholesale | 3 | 3 | — |
| 13 Search — Postgres FTS | 5 | 5 | +1 |
| 14 Authentication — customer + staff, MFA, invitations | 6 | 7 | +2 |
| 15 Cart / checkout / payment | — | 14 | — |
| **16 Admin application + handover** | **20** | **28** | **+14 / +19** |
| 17 SEO | 3 | 4 | — |
| 18 Accessibility — now two apps | 4 | 5 | +1 |
| 19 Performance | 3 | 3 | — |
| 20 Security — two origins, admin hardening | 4 | 6 | +1 |
| 21 Testing — admin coverage added | 8 | 13 | +2 / +3 |
| 22 Deployment — two Vercel projects, two domains | 3 | 4 | +1 |
| **Total** | **~99 days** | **~137 days** | **+25 / +31** |

Estimates assume content and photography arrive on time. A planning aid, not a quotation; re-baseline once `OQ-001` is answered.

### What the change costs, honestly

Building the admin instead of using a CMS adds roughly **25–31 engineering days**. You get: one system, one login, stock and product data managed together, no subscription, and complete control of the editorial UX. You give up: a mature, battle-tested editing interface that would have worked on day one.

**If that cost is unwelcome, there is a middle path** — see `OQ-038`. Use Sanity Studio *as* the admin website on `admin.burla.com` for products, categories and content, and build a small custom panel only for stock, orders and enquiries. That is roughly **10–12 days cheaper** and still gives you two websites. The trade-off is two systems for staff to learn, and the stock/product split I originally warned about. My recommendation remains the full custom admin — but the decision is a budget question, not a technical one, so it is yours.

### Two recommendations on sequencing

1. **If there is any hesitation on `OQ-001`, launch enquiry-only and add commerce as release 2.** Roughly six weeks sooner to market, validates demand before checkout is built, and costs nothing architecturally.
2. **Phase 16 can start earlier than its number suggests.** The admin has no dependency on the customer site's visual design. Once Phase 7 lands, admin work (16.1–16.5) can run in parallel with Phases 8–10 — which also means the client can begin entering real product data while the storefront is still being built, removing the single biggest schedule risk (R2).

---

## 8. Delivery cadence

| Ritual | Frequency | Purpose |
|---|---|---|
| Progress update | Weekly | What shipped, what is blocked, what is needed from the client |
| Design review | Per page, before merge | `DESIGN-SYSTEM.md` §13 checklist |
| Demo | End of each phase | Client sees the real thing on a real URL |
| Open-questions review | Weekly | Chase blocking answers; nothing sits unanswered silently |
| Risk review | Fortnightly | `PROJECT-BRIEF.md` §8 |

---

## 9. Definition of done

A feature ships only when **all** of the following are true:

- [ ] Matches the approved design; passes the §13 design review
- [ ] Responsive and verified at every breakpoint in `TESTING.md` §10
- [ ] WCAG 2.2 AA — automated and manual passes complete
- [ ] Loading, empty, error and success states implemented and tested
- [ ] Unit, component and (where critical) E2E tests written and passing
- [ ] SEO handled — metadata, structured data, semantics
- [ ] Performance budget met
- [ ] Security reviewed — input validation, authorisation, no secret exposure
- [ ] Zero TypeScript errors, zero lint errors, zero console output
- [ ] No `[PLACEHOLDER]` without a tracked entry in `CONTENT-INVENTORY.md`
- [ ] No broken links
- [ ] Code reviewed and merged through a PR

"It renders" is not done.

---

## 10. What we will not do

Stated so it is never assumed:

- We will not invent product names, prices, ingredients, certifications, locations, company history, statistics, testimonials, reviews or health claims.
- We will not ship stock photography as final production imagery.
- We will not launch a food website without the legally required declarations.
- We will not build ecommerce before `OQ-001` is answered.
- We will not skip accessibility or testing to hit a date.
- We will not commit to the user's home-directory git repository.
