# Migration Strategy — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/MIGRATIONS.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |
| Covers | Schema migrations, and the one-time move of `catalog.ts` into Postgres |

---

## 1. Two different things called "migration"

| | What it is | How often |
|---|---|---|
| **Schema migration** | A versioned change to the database structure | Continuously, forever |
| **The cutover** | Moving the frontend from `catalog.ts` to the database | Once |

Both are below. They share nothing except the word.

---

# Part A — Schema migrations

## 2. Rules

1. **Every schema change is a committed SQL file.** Reviewed in a pull request like any other code.
2. **Migrations are forward-only in production.** Down migrations exist for local development and are not trusted for recovery — the recovery path is a restore, see `DATABASE-RECOVERY.md`.
3. **Migrations are idempotent where the syntax allows** (`IF NOT EXISTS`), so a half-applied run is re-runnable.
4. **Never edit an applied migration.** Fix forward with a new one. Editing one that has run in production makes the migration table lie.
5. **No destructive change ships in the same release as the code that stops using the column.** See §4.
6. **Migrations run against the direct connection**, not the pooler. Advisory locks and DDL do not survive connection pooling reliably.

## 3. Tooling

Drizzle Kit. `drizzle-kit generate` diffs the TypeScript schema and emits SQL; the SQL is the artefact that is reviewed and committed.

```
npm run db:generate    # schema change → SQL file. Read it before committing.
npm run db:migrate     # apply pending migrations
npm run db:studio      # inspect, local only
```

**`drizzle-kit push` is never used outside local development.** It applies a diff with no file and no history, which is convenient exactly until the first time two people run it against the same database.

Generated SQL is read, not trusted blindly. A rename that the differ interprets as drop-then-create is a data-loss bug that looks like a rename in the TypeScript.

### 3.1 Two things Drizzle Kit does not generate

**Extensions and functions.** Drizzle manages tables, not `CREATE EXTENSION` or `CREATE FUNCTION`. Migration `0000` therefore carries a hand-written preamble above the generated body — `citext`, `pg_trgm`, and the `burla_keywords_text` helper. It must stay first: `users.email` is `citext` and `products.search_vector` calls the helper, so `CREATE TABLE` fails without them. It is idempotent, so re-running is harmless.

Editing a generated migration is normally forbidden (§2, rule 4). The exception here is narrow and safe: `0000` had never been applied anywhere when the preamble was added, and the preamble adds nothing the snapshot tracks, so the schema snapshot and the database do not drift.

**Triggers.** Anything needing a subquery cannot be a `CHECK` constraint in Postgres, so it is a trigger, written by hand in `0001` via `drizzle-kit generate --custom` (which creates the file *and* the journal entry — never hand-edit `_journal.json`).

| Rule | Mechanism |
|---|---|
| `updated_at` is current | `set_updated_at()` on 16 tables |
| Taxonomy is exactly two levels deep | `categories_enforce_depth()` |
| `products.category_id` is top-level and `type_id` is its child | `products_enforce_taxonomy()` |
| Stock is the sum of the ledger | `inventory_apply_movement()` |
| The ledger and the audit log are append-only | two `RAISE EXCEPTION` triggers |

Do not remove a trigger because "the service already checks it". The service is one caller; a migration, a script or a psql session is another.

## 4. Expand / contract

Any change that could drop data runs across two releases.

```
Release 1  EXPAND     add the new column, nullable. Backfill. Write to both.
           ─── deploy, verify, let it run ───
Release 2  CONTRACT   stop writing the old column. Drop it.
```

Renaming `products.title` to `products.name`:

| Step | Action |
|---|---|
| 1 | Add `name`, nullable |
| 2 | Backfill `name = title` in batches |
| 3 | Application writes both, reads `name` |
| 4 | Verify: zero rows with `name IS NULL` |
| 5 | Next release: drop `title`, set `name NOT NULL` |

Slower, and the reason is simple: between the moment a migration runs and the moment the new code is serving every request, both versions are live. A column dropped in step 1 breaks the old code that is still running.

## 5. Adding a NOT NULL column to a populated table

Never in one statement. `ALTER TABLE … ADD COLUMN … NOT NULL` without a default fails, and with a default it rewrites the table under an exclusive lock.

```sql
ALTER TABLE products ADD COLUMN sort_order integer;             -- 1. nullable
UPDATE products SET sort_order = 0 WHERE sort_order IS NULL;    -- 2. batched
ALTER TABLE products ALTER COLUMN sort_order SET DEFAULT 0;     -- 3.
ALTER TABLE products ALTER COLUMN sort_order SET NOT NULL;      -- 4. brief lock
```

## 6. Indexes

`CREATE INDEX CONCURRENTLY`, always, on a table with rows. A plain `CREATE INDEX` takes a write lock for the duration — on a small catalogue that is a second, and the habit matters when it is not.

`CONCURRENTLY` cannot run inside a transaction, so those migrations are marked to run outside one.

## 7. Order of operations on deploy

```
1. Run migrations (expand only — nothing destructive)
2. Deploy application code
3. Verify
4. Contract migrations ship in a later release
```

Migrations run **before** the new code, never after, and never concurrently across instances — a Postgres advisory lock ensures a single runner.

## 7a. Verifying a migration before there is a database

Neither Docker nor a credentialed Postgres was available when the first two migrations were written, and shipping untested DDL is exactly what this document exists to prevent. So they were applied to **PGlite** — Postgres compiled to WebAssembly, running in-process — and then exercised: 40 assertions covering every constraint, trigger and index the schema claims to enforce, including the ones that must *fail*.

That found one real defect before it reached a database: `array_to_string` is `STABLE`, so the generated `search_vector` column was rejected outright. A review would probably not have caught it.

Two honest limits: PGlite is not Neon, so it proves the DDL is valid and the logic is right, not that Neon behaves identically; and it says nothing about performance, locking or concurrency. **A Neon preview branch is still the gate before production** (§2, rule 6).

The harness is a scratch script, not part of the repository. Worth promoting to a real Vitest suite in Phase 19 — the assertions are already written, and "the schema enforces what it claims" is the sort of test that stays valuable. It has already earned its keep twice: it caught the `array_to_string` immutability defect, and it caught a stale expectation the moment migration `0003` changed an error message.

### The seed was verified against a real cluster

For Phase 5, an isolated PostgreSQL 17 cluster was created on a spare port with trust authentication, entirely separate from anything already on the machine, and torn down afterwards. That allowed `npm run db:migrate`, `db:seed` and `db:verify` to be run as written, rather than a reimplementation of them.

It found a defect a schema review would not have: see `DATABASE-DESIGN.md` §0, finding 7. The purge command the production boot guard recommends could not actually run.

```bash
# Recreating it, if you want a local database without Neon:
initdb -D /tmp/burla/data -U postgres --auth=trust
pg_ctl -D /tmp/burla/data -l /tmp/burla/log -o "-p 55432" start
createdb -h localhost -p 55432 -U postgres burla_dev
# then in apps/web/.env.local:
#   DATABASE_URL=postgresql://postgres@localhost:55432/burla_dev
```

Trust authentication is acceptable **only** for a throwaway cluster bound to localhost on a non-default port. Never for anything that outlives the check.

### Running the scripts outside Next.js

`db/index.ts` and `db/guards.ts` import `server-only`, which throws by design when Node resolves it without the `react-server` condition. The `db:*` scripts therefore run as `tsx --conditions=react-server`. Keeping the import is worth the flag: it is what makes a client component that reaches for the database fail the build rather than shipping a connection string to the browser.

---

## 8. Review checklist

Every migration PR answers:

- [ ] Does this drop or rename anything? If so, is it the contract half of an expand/contract?
- [ ] Does it lock a table for a meaningful time?
- [ ] Is any new index `CONCURRENTLY`?
- [ ] Does the old code still work against the new schema?
- [ ] Has it been applied to a Neon preview branch?
- [ ] If it backfills, is it batched?

---

# Part B — The cutover

## 9. What is moving

`apps/web/src/data/catalog.ts`, ~630 lines, is the sole data source for 18 files. It becomes the seed input, then it is deleted.

Per `CURRENT-ARCHITECTURE.md` §11, its contents are not all the same kind of data:

| Data | Classification | Destination |
|---|---|---|
| 10 categories | Client-derived, pending confirmation | `seed/real.ts` — flagged |
| 10 types | **Invented by us** | `seed/demo.ts` |
| 28 products, prices, SKUs, descriptions | **Invented by us** | `seed/demo.ts` |
| Availability values | Invented | `seed/demo.ts` |
| Address, GSTIN, phone, email, partners | **Real** — business card | `seed/real.ts` → `site_settings` |
| FSSAI, firm name, grievance officer | Placeholder | Stay placeholder |

Two seed files, not one, and the split is the point: `seed/demo.ts` refuses to run when `APP_ENV=production`. Demo product data reaching the live site is the failure this design exists to prevent, and a comment saying "remember to remove this" would not prevent it.

## 10. Order

```
1. Schema + migrations                          nothing else can proceed
2. Seed: real taxonomy + settings, demo products
3. Repositories + services                      verified against the seeded DB
4. GET /api/search                              ← BEFORE the cutover. See §11
5. Page-by-page cutover
6. Delete catalog.ts
```

## 11. Why search comes first

`SearchOverlay` is a client component that imports `searchProducts` from `catalog.ts` (`CURRENT-ARCHITECTURE.md` §7, Finding 1). A client component cannot query Postgres.

So the moment products leave `catalog.ts`, client-side search stops working. The endpoint has to exist first, or the site ships with broken search for however long the cutover takes.

`Header` and `EnquiryForm` also import `categories` into client bundles. Those are fixed by passing props from their server parents — a smaller change, done during the cutover.

## 12. Page-by-page

Each page is one commit, in ascending order of risk:

| # | Page | Change |
|---|---|---|
| 1 | `/products/p/[slug]` | `productBySlug` → `await productService.getBySlug` |
| 2 | `/products/[category]/[type]` | |
| 3 | `/products/[category]` | |
| 4 | `/products` | becomes `async` |
| 5 | `/` | becomes `async`; featured products |
| 6 | `/search` | server-side query |
| 7 | `SearchOverlay` | fetches `/api/search` |
| 8 | `Header`, `EnquiryForm` | categories via props |
| 9 | `sitemap.ts` | published rows only |

Five of these pages are currently synchronous `export default function` and must become `async` (Finding 2).

## 13. The acceptance test

> **The rendered HTML must be identical before and after each step.**

Not "similar". Identical, for the same data. The frontend is not being redesigned — the brief is explicit — so any visual difference after a cutover commit is a bug in the cutover, not an improvement.

Verified by capturing the rendered output of every route against the seed data before starting, and diffing after each commit. Modulo the parts that legitimately vary — nothing on these pages does.

## 14. Rollback

Each cutover commit is independently revertible while `catalog.ts` still exists. That is the reason it is deleted last and in its own commit, rather than being removed alongside the first page that stops importing it.

After deletion, rollback is a redeploy of the previous build. The database is unaffected — the cutover adds no schema change of its own.

---

## 15. Open questions

| ID | Question |
|---|---|
| `OQ-016` | Real catalogue — until it exists, production seeds taxonomy only |
| `OQ-049` | Real type layer |
| `OQ-064` | Are the 10 category names final, or does the sheet need re-reading with the client |
