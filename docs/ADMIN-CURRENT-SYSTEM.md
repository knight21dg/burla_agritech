# Admin — the system as it stands today

| Field | Value |
|---|---|
| Document | `docs/ADMIN-CURRENT-SYSTEM.md` |
| Version | 1.0 |
| Date | 2026-09-16 |
| Purpose | What exists before any admin code is written, verified by inspection of the repository and of the running development database. **No proposals here** — those are in `ADMIN-ARCHITECTURE.md` |
| Commit audited | `b962af5` |

---

## 1. Summary

Three sentences, because the rest of this document is detail.

1. **The database is already built and the admin's tables already exist.** Twenty-two tables, sixteen enums, foreign keys, check constraints and triggers — including `audit_log` (append-only), `media`, `enquiries`, `inventory_movements` and `site_settings`. None of it was written for this task; it was designed in Phase 3 in anticipation of it.
2. **The storefront does not read from that database.** Every catalogue surface still reads `apps/web/src/data/catalog.ts`, a TypeScript literal. A service layer that replaces it exists and is verified at parity (129 checks), but the pages have not been switched over.
3. **There is no admin of any kind.** No `/admin` route, no `middleware.ts`, no role check anywhere in the application, no file upload, no object storage.

The consequence for planning: **an admin panel is not blocked by database work. It is blocked by the cutover** — until pages read the database, editing a product in an admin would change nothing on the site.

---

## 2. Repository and stack

```
Agri/
├── apps/web/            the only application — customer site
├── docs/                34 documents
├── assets/              client reference material and extraction scripts
└── logos/               client-supplied logo sources
```

`apps/admin` does not exist. `packages/*` is declared in the workspace globs and is empty.

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 16.3.4 (App Router, Turbopack) |
| UI | `react`, `react-dom` | 19.1.1 |
| Language | `typescript` | 5.9.2 — strict, `noUncheckedIndexedAccess` |
| Styling | `tailwindcss` | 4.1.13 (`@theme` / `@utility`, no config file) |
| Icons | `lucide-react` | 0.544.0 |
| ORM | `drizzle-orm` | 0.45.2 |
| Driver | `postgres` (postgres.js) | 3.4.9 |
| Validation | `zod` | 4.5.4 |
| Tooling | `drizzle-kit` 0.31.10, `tsx`, `dotenv` | |

**Ten runtime dependencies.** Not installed, and all named by the admin brief: a test runner (Vitest), a browser test runner (Playwright), ESLint, a form library, a component library, an object-storage SDK, an email sender, a monitoring SDK.

`npm run lint` is currently broken — `next lint` was removed in Next 16 and no ESLint configuration exists. This is pre-existing and should be fixed as part of admin work, because an admin without a linter is a bad trade.

---

## 3. Database

### 3.1 Connection and migrations

| | |
|---|---|
| Config | `apps/web/drizzle.config.ts` — `casing: "snake_case"`, `strict: true` |
| Schema entry | `apps/web/src/server/db/schema/index.ts` |
| Migrations | `apps/web/src/server/db/migrations/` — six, `0000` … `0005` |
| Runner | `npm run db:migrate` (`src/server/db/migrate.ts`), uses `DATABASE_URL_UNPOOLED` |
| Environment | `apps/web/src/lib/env.ts` is the **only** module that reads `process.env`; it parses with Zod at import time |
| Local database | Postgres 17 cluster at `C:/Users/tarun/burla-dev-db`, port 55433, database `burla_dev` |

| Migration | What it adds |
|---|---|
| `0000_init_catalogue_identity_operations` | 20 tables, 15 enums, indexes, checks |
| `0001_triggers_and_integrity` | `set_updated_at`, taxonomy enforcement, append-only audit log, search vector support |
| `0002_add_tone_and_sample_marker` | `tone` column, `is_sample` flags |
| `0003_allow_purging_sample_ledger` | lets the demo purge remove ledger rows |
| `0004_orders` | `orders`, `order_items`, `order_events`, order/payment enums |
| `0005_orders_integrity` | order triggers — items frozen after insert, events append-only |

### 3.2 Tables, with live row counts

Counts are from the development database on 2026-09-16.

| Table | Rows | Note |
|---|---|---|
| `categories` | 19 | 10 categories + 9 types — **one table, two levels**, via `parent_id` |
| `products` | 63 | seeded from `catalog.ts`, all flagged `is_sample` |
| `product_variants` | 126 | 2 sample packs per product |
| `product_details` | **0** | legally required food fields — none supplied yet |
| `product_images` | **0** | join table to `media` |
| `media` | **0** | R2 object metadata — nothing uploaded, ever |
| `inventory_movements` | 138 | the stock ledger |
| `orders` / `order_items` / `order_events` | 4 / 6 / 6 | real test orders placed through checkout |
| `users` | 3 | all `@example.test` |
| `password_credentials` | 3 | scrypt hashes |
| `sessions` | 1 | |
| `roles` | 5 | `admin`, `content_manager`, `customer`, `order_manager`, `staff` |
| `user_roles` | 3 | all `customer` |
| `addresses` | 3 | |
| `enquiries` | **0** | the contact form does not submit |
| `audit_log` | **0** | append-only; nothing writes to it yet |
| `site_settings` | 1 | singleton, business identity |
| `locations` | **0** | |
| `redirects` | **0** | |
| `verification_tokens` | **0** | includes a `staff_invitation` type |

### 3.3 Enums

| Enum | Values |
|---|---|
| `product_status` | `draft`, `published`, `archived` |
| `category_status` | `draft`, `published`, `hidden` |
| `variant_status` | `active`, `inactive` |
| `order_status` | `pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `failed`, `refunded` |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |
| `payment_method` | `upi`, `card`, `cod` |
| `inventory_reason` | `order`, `restock`, `adjustment`, `return`, `damage`, `correction`, `order_cancelled` |
| `enquiry_status` | `new`, `in_progress`, `quoted`, `won`, `lost`, `spam` |
| `enquiry_type` | `contact`, `wholesale` |
| `session_scope` | `web`, `admin` |
| `user_status` | `active`, `suspended`, `deleted` |
| `verification_token_type` | `email_verification`, `password_reset`, `email_change`, `staff_invitation` |
| `product_image_role` | `pack`, `contents`, `macro`, `lifestyle`, `detail` |
| `location_type` | `registered_office`, `facility`, `warehouse`, `retail`, `partner` |
| `veg_non_veg` | `veg`, `non_veg`, `not_applicable` |
| `tone` | eight brand tints |

The order status enum already matches the state machine the admin brief asks for, and `session_scope` already distinguishes a customer session from an admin one.

### 3.4 Integrity the database enforces by itself

Not application conventions — constraints and triggers:

- `products_published_has_date` — a product cannot be `published` with a null `published_at`. Same for categories.
- `products_type_differs_from_category`, plus a `products_enforce_taxonomy` trigger — a product's category must be top-level and its type must be a real child of that category.
- `categories_enforce_depth` trigger — the taxonomy is exactly two levels. A parent may not have a parent; a row with children may not be given one.
- `product_variants_one_default_idx` — a partial unique index; **one default variant per product**, enforced, not hoped for. `product_images_one_primary_idx` does the same for the primary photograph.
- `inventory_apply_movement` trigger — inserting a movement is what changes `product_variants.stock_quantity`. Combined with the `stock >= 0` check, overselling is a database error rather than a race.
- `product_variants` checks — price ≥ 0, MRP ≥ price, weight > 0, stock ≥ 0, tax rate 0–10000 bp.
- `inventory_movements_delta_non_zero` — a movement of zero is a mistake, not a correction.
- `audit_log_append_only` trigger — UPDATE and DELETE are refused at the database.
- `order_events` append-only; `order_items` frozen after insert; order totals must equal the sum of their lines.
- `products.search_vector` — a generated `tsvector` (weighted name / descriptor / keywords / description) with a GIN index, plus a trigram index on `name`. Admin search does not need building from scratch.

### 3.5 Seeds

| Command | Effect |
|---|---|
| `npm run db:seed` | real data only — 10 categories and the business identity. Safe in production |
| `npm run db:seed -- --demo` | adds the 63 sample products, flagged `is_sample` |
| `npm run db:seed -- --purge-demo` | removes every sample row |
| `npm run db:verify` | deployment check |
| `npm run db:parity` | compares the service layer against `catalog.ts` — **129 checks, currently passing** |

`assertNotProduction()` in `lib/env.ts` guards destructive scripts twice: once on `APP_ENV`, and once by sniffing the connection string for "prod", which catches a production URL pasted into a local `.env`.

---

## 4. Authentication, as built

Customer-only. Files: `apps/web/src/server/auth/{password,session,rateLimit}.ts`.

| | |
|---|---|
| Hashing | scrypt (Node `crypto`), N=2¹⁵, parameters stored per hash. A decoy hash equalises timing for unknown emails |
| Sessions | 32 random bytes, base64url, in an HttpOnly + SameSite=Lax cookie named `burla_session`; **only the SHA-256 hash is stored** in `sessions` |
| Lifetime | 30 days; `scope` is `web` |
| Rate limit | 5 failures per email per 15 minutes, **in process memory** — does not survive a restart and does not work across instances |
| Entry points | `startSession`, `endSession`, `currentUser` (React `cache`), `requireUser(returnTo)` |
| Redirect safety | `safeNextPath` in `lib/account.ts` blocks open redirects |

`users` already carries `mfa_secret` and `mfa_enabled_at` columns. Nothing writes them.

---

## 5. Authorization, as built

**There is none beyond "is someone signed in".**

- `requireUser()` is called in four places: `/checkout` (page and action), `/account`, `/account/orders/[orderNumber]`.
- Ownership is enforced in the query, correctly: order and address repositories take the user id as a required argument (`findForUser`, `lockForUser`), so there is no signature that can be called without an owner.
- `roles` and `user_roles` are populated and joined at sign-up, but **no code reads a role to make a decision**.
- There is no `middleware.ts`, no `Actor` type, no permission matrix in code.

`docs/AUTHORIZATION.md` (status: Proposed) already specifies the intended model in detail — five roles, a permission matrix, 404-not-403, audit in the same transaction, and twelve acceptance tests. The admin work is its implementation, not its design.

---

## 6. Application layering

The rule from `docs/SYSTEM-DESIGN.md` §2, observed in the code: a page may call a service, a service may call a repository, a repository may call the database. Never skip, never reverse.

```
app/…/page.tsx  ──►  server/services/*  ──►  server/repositories/*  ──►  server/db
```

| Layer | Files |
|---|---|
| Services | `catalogService` (13 functions, the full storefront contract), `orderService`, `settingsService` |
| Repositories | `categoryRepository`, `productRepository`, `orderRepository`, `addressRepository`, `userRepository` |
| Server actions | only two: `app/checkout/actions.ts` (`placeOrder`, `cancelMyOrder`), `app/login/actions.ts` (`signIn`, `signUp`, `signOut`) |
| Route handlers | **none.** There is no `app/api` directory |

`catalogService` is complete and unused by any page.

---

## 7. How the storefront actually gets its data today

| Data | Source today | Owner per `DATA-OWNERSHIP.md` |
|---|---|---|
| Categories, types, products, variants, prices | `src/data/catalog.ts` — 28 files import it | Postgres |
| Product and category photographs | `src/lib/imagery.ts` → `public/images/**` | R2 + `media` |
| Business identity, nav, policies | `src/lib/site.ts` and hard-coded page constants | `site_settings`, `pages` |
| Stock, order pricing at checkout | **Postgres** — variants are locked `FOR UPDATE` and priced by SKU | Postgres |
| Orders, addresses, users | Postgres | Postgres |

The last two rows are the important ones. **Checkout already crosses the line**: `orderService` looks a cart line up in `catalog.ts` to find its SKU, then prices and decrements that SKU in the database. So a price shown on a product page comes from a TypeScript file, while the price actually charged comes from Postgres. They agree today only because the seed put them there.

This is the single most consequential finding in this audit, and it is exactly the failure `DATA-OWNERSHIP.md` §1 was written to prevent.

### 7.1 Rendering

Every catalogue page is statically generated at build time (`generateStaticParams` over 10 categories, 9 types, 63 products). No page sets `revalidate` or `dynamic`. There is no cache tag anywhere.

So even after the cutover, **an admin edit would not appear on the site until the next deployment** unless revalidation is added. That is a requirement, not a detail.

---

## 8. Images

- 63 product photographs and 9 category photographs, as `.webp` under `apps/web/public/images/`, committed to git.
- `lib/imagery.ts` is a hand-maintained allowlist mapping slug → path, alt text and dimensions. Its own comment explains why it is not a filesystem scan: a build that picks up whatever file happens to be in a folder is how an unapproved image reaches a live site.
- **No upload path exists anywhere in the application.** No S3/R2 SDK, no presigned URLs, no multipart handling, no `formData` file reads. Every mention of R2 in the repository is documentation describing a design that has not been built.
- The `media` and `product_images` tables are ready and empty.

---

## 9. Enquiries

`components/forms/EnquiryForm.tsx` validates on the client and then calls nothing — `setTimeout(…, 700)` and a success panel that says "Demo build — nothing was actually sent." A honeypot field exists and is never checked.

The `enquiries` table, its two enums and its admin-shaped index (`type, status, created_at desc`) are already in the database. Wiring the form to a server action is a small job that the admin makes worth doing, because there would finally be somewhere to read enquiries.

---

## 10. What the admin can reuse, unchanged

- The database, its constraints and its triggers.
- The migration workflow (`drizzle-kit generate`, `--custom` for triggers) and the seed/verify/parity scripts.
- The session mechanism — token hashing, cookie flags, `currentUser` caching — which needs a second scope, not a rewrite.
- scrypt password hashing.
- The service/repository layering and the existing repositories.
- `catalogService`, which becomes the read side of the admin as well as the storefront.
- `lib/env.ts` for configuration, and `.env.example` for naming new variables.
- The design system tokens (`globals.css`) and primitives (`Button`, `Section`, `Container`, `Breadcrumbs`) — useful for the admin even though the admin should not look like the storefront.
- Every relevant design document: `AUTHORIZATION.md`, `SECURITY.md`, `DATA-OWNERSHIP.md`, `DATABASE-DESIGN.md`, `MIGRATIONS.md`, `SYSTEM-DESIGN.md`.

## 11. What does not exist and must be built

| | |
|---|---|
| Admin surface | routes, layout, tables, forms, the lot |
| Authorization | `Actor`, role loading, permission checks, `middleware.ts` |
| Admin sessions | a second cookie and scope; staff invitations; MFA |
| Audit writing | the table is append-only and empty |
| Uploads and storage | R2 client, presigned uploads, validation, `media` writes |
| Revalidation | cache tags on catalogue pages, invalidated by admin writes |
| The cutover | 28 files importing `catalog.ts` must move to `catalogService` |
| Enquiry submission | a server action, rate limiting, spam control, notification |
| Testing | no test runner is installed |
| Durable rate limiting | the in-memory limiter is not safe for production |
| Linting | `next lint` no longer exists; ESLint is not configured |

---

## 12. Facts worth carrying into the design

1. Every product in the database is `is_sample` — prices and pack sizes are ours, not the client's. An admin that lets staff edit them is also the tool that lets the client replace them, which is the fastest route out of that state.
2. `product_details` is empty, so no product has the legally required Indian food-label information. Publishing rules must account for that, or the admin will happily publish a non-compliant listing.
3. Three legally required business fields — registered entity name, FSSAI licence, grievance officer — are still `NULL` in `site_settings` and are rendered as "to be confirmed". They block launch, not the admin.
4. `robots.ts` currently disallows the entire site. Whatever the admin does, it must keep the admin area disallowed and `noindex` permanently.
5. The catalogue is 63 products and 126 variants. Pagination matters for correctness, not for scale.

---

## 13. Sources

Verified by reading: `apps/web/package.json`, `drizzle.config.ts`, `next.config.ts`, `src/lib/env.ts`, `src/server/**`, `src/app/**`, `src/data/catalog.ts`, `src/lib/imagery.ts`, `src/lib/site.ts`, `src/components/forms/EnquiryForm.tsx`, the six migration files, and by querying the development database directly for table, column, index, constraint, trigger and row-count facts.
