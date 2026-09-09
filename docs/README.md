# Documentation Index — Burla Global Agri Products

**Direction updated 2026-09-09: minimal, clean, mostly white, product-first.**
`DESIGN-SYSTEM.md` v1.0 replaces the earlier warm editorial direction. A demo
exists but is built on the withdrawn system — see `IMPLEMENTATION-PLAN.md` §1–2
for exactly what survives.

**Three decisions gate the rework:** `OQ-051` (hero image), `OQ-055` (Sanity vs
custom admin), `OQ-057` (rework vs restart).

**Scope: two websites.** A customer site (`burla.com`) and a separate admin site (`admin.burla.com`) where staff manage products, stock, content, orders and enquiries. Both are Next.js applications in one monorepo sharing a single PostgreSQL database — see `ARCHITECTURE.md` ADR-009 and ADR-010.

Every factual statement is tagged: `[CLIENT]` supplied · `[DERIVED]` inferred · `[PROPOSED]` our recommendation · `[PLACEHOLDER]` unknown and tracked.

---

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 1 | [PROJECT-BRIEF.md](PROJECT-BRIEF.md) | What is this project, who is it for, what could go wrong |
| 2 | [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | **What we need from you.** Start here if you read only one |
| 3 | [REQUIREMENTS.md](REQUIREMENTS.md) | Every requirement, traced to its source |
| 4 | [SITEMAP.md](SITEMAP.md) | Every page and URL |
| 5 | [USER-FLOWS.md](USER-FLOWS.md) | How people move through the site |
| 6 | [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | How it will look, and why it will not look like a template |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) | How it is built |
| 8 | [DATABASE.md](DATABASE.md) | Where data lives |
| 9 | [SEO.md](SEO.md) | How it gets found |
| 10 | [SECURITY.md](SECURITY.md) | How it is protected, and the legal requirements |
| 11 | [TESTING.md](TESTING.md) | How we know it works |
| 12 | [ANALYTICS.md](ANALYTICS.md) | How we measure it |
| 13 | [PRODUCT-TAXONOMY.md](PRODUCT-TAXONOMY.md) | Category → Type → Product, and when to collapse a level |
| 14 | [IMAGE-ASSET-REQUIREMENTS.md](IMAGE-ASSET-REQUIREMENTS.md) | The photography specification and shot list |
| 15 | [CLIENT-ASSETS-REQUIRED.md](CLIENT-ASSETS-REQUIRED.md) | Everything we need from you, in one checklist |
| 16 | [REFERENCE-ANALYSIS.md](REFERENCE-ANALYSIS.md) | The two client-supplied reference sites — what to learn, what to avoid |
| 14 | [PHOTOGRAPHY-BRIEF.md](PHOTOGRAPHY-BRIEF.md) | The images we need — longest lead time |
| 15 | [CONTENT-INVENTORY.md](CONTENT-INVENTORY.md) | Every word and fact you need to supply |
| 16 | [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | The plan, the phases, and what happens next |

---

## By audience

**Client / business owner:** OPEN-QUESTIONS → PROJECT-BRIEF → CONTENT-INVENTORY → PHOTOGRAPHY-BRIEF → IMPLEMENTATION-PLAN

**Designer:** DESIGN-SYSTEM → REFERENCE-ANALYSIS → SITEMAP → USER-FLOWS → PHOTOGRAPHY-BRIEF

**Engineer:** ARCHITECTURE → DATABASE → REQUIREMENTS → SITEMAP → SECURITY

**QA:** TESTING → USER-FLOWS → REQUIREMENTS → SECURITY

---

## The nine answers that unblock everything

| ID | Question |
|---|---|
| `OQ-001` | Does V1 sell online, or take enquiries only? |
| `OQ-038` | **Custom admin, or Sanity Studio as the admin?** — a ~25-day cost difference |
| `OQ-002` | Legal entity name, address, GSTIN |
| `OQ-003` | FSSAI licence number |
| `OQ-004` | WhatsApp business number |
| `OQ-005` | Full product list with weights, prices and ingredients |
| `OQ-006` | Product photography — exists or to be commissioned |
| `OQ-007` | Domain name and business email |
| `OQ-008` | Vector logo and exact brand green |

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) for the full register of 57 items.

---

## Document conventions

- Requirements are `FR-xxx` (functional) and `NFR-xxx` (non-functional).
- Questions are `OQ-xxx`. Deviations from the client brief are `D-xx`. Risks are `Rx`. Assumptions are `A-xx`.
- Architecture decisions are `ADR-xxx` in [ARCHITECTURE.md](ARCHITECTURE.md) §13.
- `[commerce]` marks anything conditional on `OQ-001`.
- Anything we do not know is written as unknown. Nothing is invented.
