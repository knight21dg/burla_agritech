# Documentation Index — Burla Global Agri Products

**Where the project stands, 2026-09-09.** A complete, accessible, server-rendered **frontend with no backend at all** — the honest description is a high-fidelity prototype. Nothing persists, nothing is sent, nothing is authenticated. `CURRENT-ARCHITECTURE.md` is the audit; `SYSTEM-DESIGN.md` onward is the plan to make it an application.

**Scope: two websites.** A customer site and a separate admin site where staff manage products, stock, content, orders and enquiries. Both are Next.js applications in one monorepo sharing a single PostgreSQL database — `ARCHITECTURE.md` ADR-009 and ADR-010.

Every factual statement is tagged: `[CLIENT]` supplied · `[DERIVED]` inferred · `[PROPOSED]` our recommendation · `[PLACEHOLDER]` unknown and tracked.

---

## The three decisions that matter most

| ID | Question | Costs |
|---|---|---|
| `OQ-001` | Does V1 sell online, or take enquiries only? | ~14 days, ~8 database tables |
| `OQ-038` | Custom admin, or a CMS? | ~10–12 days |
| `OQ-065` | Better Auth, or Auth.js v5? | Hard to reverse once users exist |

Phases 3–11 of the build can start before any of them are answered — `SYSTEM-DESIGN.md` §12.

---

## Read in this order

### Part 1 — The project

| # | Document | What it answers |
|---|---|---|
| 1 | [PROJECT-BRIEF.md](PROJECT-BRIEF.md) | What is this project, who is it for, what could go wrong |
| 2 | [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | **What we need from you.** Start here if you read only one |
| 3 | [REQUIREMENTS.md](REQUIREMENTS.md) | Every requirement, traced to its source |
| 4 | [SITEMAP.md](SITEMAP.md) | Every page and URL |
| 5 | [USER-FLOWS.md](USER-FLOWS.md) | How people move through the site |

### Part 2 — Design and content

| # | Document | What it answers |
|---|---|---|
| 6 | [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | How it looks, and why it does not look like a template |
| 7 | [PRODUCT-TAXONOMY.md](PRODUCT-TAXONOMY.md) | Category → Type → Product, and when to collapse a level |
| 8 | [REFERENCE-ANALYSIS.md](REFERENCE-ANALYSIS.md) | The client-supplied reference sites — what to learn, what to avoid |
| 9 | [PHOTOGRAPHY-BRIEF.md](PHOTOGRAPHY-BRIEF.md) | The images we need — the longest lead time on the project |
| 10 | [IMAGE-ASSET-REQUIREMENTS.md](IMAGE-ASSET-REQUIREMENTS.md) | The photography specification and shot list |
| 11 | [CONTENT-INVENTORY.md](CONTENT-INVENTORY.md) | Every word and fact you need to supply |
| 12 | [CLIENT-ASSETS-REQUIRED.md](CLIENT-ASSETS-REQUIRED.md) | Everything we need from you, in one checklist |

### Part 3 — Backend architecture *(2026-09-09)*

Written before any backend code, as the brief required. Read `CURRENT-ARCHITECTURE.md` first — the rest builds on it.

| # | Document | What it answers |
|---|---|---|
| 13 | [CURRENT-ARCHITECTURE.md](CURRENT-ARCHITECTURE.md) | **What exists today, verified by inspection.** No proposals |
| 14 | [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) | The proposed shape, the layering rule, the implementation order |
| 15 | [DATABASE-DESIGN.md](DATABASE-DESIGN.md) | Every table, index and constraint, and why |
| 16 | [PRODUCT-DOMAIN.md](PRODUCT-DOMAIN.md) | What the words mean — category, type, product, variant |
| 17 | [API-DESIGN.md](API-DESIGN.md) | Why there are four endpoints and not thirty |
| 18 | [AUTHENTICATION.md](AUTHENTICATION.md) | Who you are — sessions, passwords, MFA |
| 19 | [AUTHORIZATION.md](AUTHORIZATION.md) | What you may do — roles, ownership, audit |
| 20 | [DATA-OWNERSHIP.md](DATA-OWNERSHIP.md) | Every field has exactly one owner |
| 21 | [INTEGRATIONS.md](INTEGRATIONS.md) | The external services, and what happens when each fails |
| 22 | [ENVIRONMENT.md](ENVIRONMENT.md) | Configuration, secrets, and never pointing local at production |
| 23 | [MIGRATIONS.md](MIGRATIONS.md) | Schema changes, and the one-time cutover from `catalog.ts` |
| 24 | [DEPLOYMENT.md](DEPLOYMENT.md) | How it ships, and the launch checklist |
| 25 | [OBSERVABILITY.md](OBSERVABILITY.md) | How we know it is working |
| 26 | [DATABASE-RECOVERY.md](DATABASE-RECOVERY.md) | Backups, and the restore drill that proves them |

### Part 4 — Cross-cutting

| # | Document | What it answers |
|---|---|---|
| 27 | [SECURITY.md](SECURITY.md) | How it is protected, and the Indian legal requirements |
| 28 | [TESTING.md](TESTING.md) | How we know it works |
| 29 | [SEO.md](SEO.md) | How it gets found |
| 30 | [ANALYTICS.md](ANALYTICS.md) | How we measure it |
| 31 | [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | The plan, the phases, and what happens next |

### Superseded

| Document | Superseded by |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | `SYSTEM-DESIGN.md` for the backend sections. ADRs 001–010 still stand |
| [DATABASE.md](DATABASE.md) | `DATABASE-DESIGN.md` |

---

## By audience

**Client / business owner:** OPEN-QUESTIONS → PROJECT-BRIEF → CONTENT-INVENTORY → PHOTOGRAPHY-BRIEF → IMPLEMENTATION-PLAN

**Designer:** DESIGN-SYSTEM → REFERENCE-ANALYSIS → SITEMAP → USER-FLOWS → PHOTOGRAPHY-BRIEF

**Backend engineer:** CURRENT-ARCHITECTURE → SYSTEM-DESIGN → DATABASE-DESIGN → PRODUCT-DOMAIN → API-DESIGN → AUTHENTICATION → AUTHORIZATION

**DevOps:** ENVIRONMENT → DEPLOYMENT → MIGRATIONS → OBSERVABILITY → DATABASE-RECOVERY

**QA:** TESTING → USER-FLOWS → REQUIREMENTS → AUTHORIZATION §10

**Security review:** SECURITY → AUTHENTICATION → AUTHORIZATION → ENVIRONMENT → INTEGRATIONS

---

## The answers that unblock everything

| ID | Question |
|---|---|
| `OQ-001` | Does V1 sell online, or take enquiries only? |
| `OQ-038` | Custom admin, or a CMS? |
| `OQ-002` | Legal entity name and registered firm name |
| `OQ-003` | FSSAI licence number and licence type |
| `OQ-005` | Grievance / nodal officer |
| `OQ-007` | Domain name and business email |
| `OQ-016` | The real product catalogue |
| `OQ-049` | The real type layer for each category |
| `OQ-065` | Better Auth, or Auth.js v5? |
| `OQ-069` | Who owns the Vercel, Neon and Cloudflare accounts? |

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) for the full register of 74 items.

---

## Document conventions

- Requirements are `FR-xxx` (functional) and `NFR-xxx` (non-functional).
- Questions are `OQ-xxx`. Deviations from the client brief are `D-xx`. Risks are `Rx`. Assumptions are `A-xx`.
- Architecture decisions are `ADR-xxx` in [ARCHITECTURE.md](ARCHITECTURE.md) §13.
- `[commerce]` marks anything conditional on `OQ-001`.
- Anything we do not know is written as unknown. **Nothing is invented.**
