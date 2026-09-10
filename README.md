# Burla Global Agri Products

Two web applications for Burla Global Agri Products — an Indian agricultural food-products brand producing dehydrated powders and flakes, dehydrated fruits, pickles, dal powders, crisps, dry fruits, millet powders, tea and coffee, masala powders and spices.

| App | Domain | Purpose |
|---|---|---|
| `apps/web` | `burla.com` | Public catalogue, brand, enquiries, and commerce if enabled |
| `apps/admin` | `admin.burla.com` | Staff management of products, **stock**, content, orders and enquiries |

One npm-workspaces monorepo, one PostgreSQL database, shared typed packages.

`apps/admin` does not exist yet — it is planned, not built. `apps/web` is real and runs.

---

## Status

**Customer frontend: built and running. Backend: designed, not yet written.**

`apps/web` renders every page, navigation and search work, forms validate. It is accessible, typed, server-rendered and contrast-verified. What it does not do is persist anything: there is no database, no API, no authentication, and the enquiry form currently reports success without sending anything. The honest description is a **high-fidelity prototype**.

The full audit is in [`docs/CURRENT-ARCHITECTURE.md`](docs/CURRENT-ARCHITECTURE.md). The plan to make it an application is in [`docs/SYSTEM-DESIGN.md`](docs/SYSTEM-DESIGN.md) — roughly 66 working days for the enquiry-only build, 80 with commerce.

Backend implementation can begin now; the phases that are blocked on client decisions are named in `SYSTEM-DESIGN.md` §13. The largest single unknown remains whether V1 sells online or captures enquiries only ([`OQ-001`](docs/OPEN-QUESTIONS.md)).

> **All product data on the running site is sample data we invented to demonstrate the interface.** It is marked `IS_SAMPLE_DATA` in the source and must not reach production. See `CURRENT-ARCHITECTURE.md` §11.

---

## Start here

→ **[Documentation index](docs/README.md)**
→ **[Open questions](docs/OPEN-QUESTIONS.md)** — what we need from the client
→ **[Implementation plan](docs/IMPLEMENTATION-PLAN.md)** — the roadmap and next actions

---

## Planned stack

Turborepo · Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Radix · Motion · Lucide · PostgreSQL · Drizzle · Zod · React Hook Form · Tiptap · TanStack Table · Better Auth · Cloudflare R2 · Razorpay `[if commerce]` · Resend · PostHog · Sentry · Vitest · Playwright · Vercel · Cloudflare

Rationale and decision records: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Before writing any code

This directory is **not yet a git repository of its own**. Git commands run here currently resolve to a repository rooted at the Windows home directory, which contains personal files and credentials.

Required first:

1. Move the project out of OneDrive (e.g. `C:\dev\burla`) — `node_modules/` and `.next/` under OneDrive cause file locks and sync problems.
2. `git init` in the project folder.
3. Commit a `.gitignore` covering `node_modules`, `.next`, `.env*`, `.vercel` as the **first** commit.
4. Verify `git rev-parse --show-toplevel` points here, not at the home directory.

See [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) §5.

---

## Repository layout

```
docs/          Project documentation — the current deliverable
assets/        Original client assets (logo, reference material)
```

Planned from Phase 7:

```
apps/web       Customer site
apps/admin     Admin site
packages/db    Drizzle schema + client
packages/core  Domain logic + Zod schemas shared by both apps
packages/ui    Shared design system
```
