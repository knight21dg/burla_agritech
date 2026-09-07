# Burla Global Agri Products

Two web applications for Burla Global Agri Products — an Indian agricultural food-products brand producing dehydrated powders and flakes, dehydrated fruits, pickles, spiced dal powders, sun-dried crisps, dry fruits, millets, herbal tea and coffee, masala powders and combo packs.

| App | Domain | Purpose |
|---|---|---|
| `apps/web` | `burla.com` | Public catalogue, brand, enquiries, and commerce if enabled |
| `apps/admin` | `admin.burla.com` | Staff management of products, **stock**, content, orders and enquiries |

One Turborepo monorepo, one PostgreSQL database, shared typed packages.

---

## Status

**Phase 1 of 22 complete. No application code written yet — by design.**

The project is in the planning stage. All Phase 0–1 deliverables are in [`docs/`](docs/README.md).

Implementation begins once the eight blocking questions in [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) are answered — most importantly whether V1 sells online or captures enquiries only (`OQ-001`), which determines roughly 40% of the build.

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
