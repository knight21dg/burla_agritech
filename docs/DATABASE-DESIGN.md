# Database Design — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DATABASE-DESIGN.md` |
| Version | 1.2 — adds the seed as built |
| Date | 2026-09-09 |
| Engine | PostgreSQL 16 (Neon) · Drizzle ORM 0.45 |
| Supersedes | `DATABASE.md` v0.2 |
| Implemented in | `apps/web/src/server/db/schema/` · migrations `0000`, `0001` |

---

## 0. What was actually built, and where it differs

Phase 3 is complete for everything except commerce. Nineteen tables, two
migrations, verified by 40 assertions against a real Postgres engine.

Five differences from v1.0 of this document, each with a reason:

| # | Change | Why |
|---|---|---|
| 1 | **Commerce tables deferred.** No `carts`, `orders`, `payments`, `refunds`, `webhook_events` yet | They are conditional on `OQ-001`. The design in §6 is settled, so adding them later is one migration; creating eight empty tables for an unmade decision is not better. If the answer is enquiry-only they never exist |
| 2 | `product_variants.track_inventory` added | The frontend already renders `enquire_only`. Without this column there is nothing to derive it from — and it is what the whole catalogue uses if `OQ-001` lands on enquiry-only |
| 3 | `enquiries.notified_at` added | Distinguishes "lead saved" from "somebody was told". A partial index finds leads that were saved and never emailed — the failure mode `OBSERVABILITY.md` §5 is most worried about |
| 4 | `search_vector` excludes category and type names | A generated column can only see its own row, and those live in `categories`. The search query matches them through the join instead — `API-DESIGN.md` §4 |
| 5 | The five `roles` rows are inserted by migration `0001`, not by the seed | They are reference data the permission model depends on, not sample data. They must exist in production before anyone can be granted one |
| 6 | `tone` and `is_sample` added to `categories` and `products` (migration `0002`) | `tone` drives the card tint and placeholder treatment, and the cutover cannot render identical output without it. `is_sample` replaces the `[SAMPLE]` prefix — see §10 |
| 7 | `inventory_movements` allows `DELETE` for sample products only (migration `0003`) | Found by running the purge, not by reading the schema — see below |

**The defect worth recording**, because the schema looked correct: `inventory_movements.variant_id` is `ON DELETE RESTRICT` *and* the table refuses `DELETE` outright. Both rules are right on their own. Together they made demonstration data impossible to remove — so the production boot guard was telling an operator to run a purge command that could only fail. A guard whose own remediation does not work is worse than no guard.

The append-only rule protects the *business* ledger, since stock is its running total. Rows belonging to an `is_sample` product are not business records. `DELETE` is now permitted for exactly those; `UPDATE` is still refused for every row, which was verified against a real ledger row rather than assumed.

**One implementation detail worth recording**, because it will look odd otherwise: `products.search_vector` calls a helper function `burla_keywords_text(text[])` rather than `array_to_string`. A `GENERATED ALWAYS` column may only call `IMMUTABLE` functions, and `array_to_string` is marked `STABLE` — because for arrays of arbitrary element type the output function can depend on session settings. For `text[]` the result is the identity, so the wrapper is genuinely immutable rather than conveniently mislabelled. It must never be widened to `anyarray`.

Also implemented and not in v1.0: `stock_quantity` is maintained by a trigger on `inventory_movements`, so the ledger is the only way stock changes; `inventory_movements` and `audit_log` reject `UPDATE` and `DELETE` outright; `updated_at` is set by trigger on all sixteen tables that carry it.

---

## 1. Principles

1. **The database enforces the rules.** Foreign keys, unique constraints, checks and enums — not application validation alone. Application code has bugs; constraints do not.
2. **Money is `integer` minor units** with the currency stored beside it. No `float`, no `numeric` arithmetic in application code.
3. **History is immutable.** An order records what was bought at the price paid. Renaming a product later must not rewrite the past.
4. **Nothing referenced by history is hard-deleted.** Status transitions, not `DELETE`.
5. **Every table carries `created_at` and `updated_at`**, `timestamptz`, UTC, `updated_at` maintained by trigger.
6. **UUID primary keys** (`gen_random_uuid()`), so ids never leak row counts or ordering.

---

## 2. Entity relationship

```
                    ┌────────────┐
                    │   users    │
                    └─────┬──────┘
        ┌─────────────────┼─────────────────┬──────────────┐
        │                 │                 │              │
   ┌────▼─────┐    ┌──────▼─────┐    ┌──────▼────┐  ┌──────▼──────┐
   │ sessions │    │ addresses  │    │   carts   │  │   orders    │
   └──────────┘    └────────────┘    └─────┬─────┘  └──────┬──────┘
                                           │               │
                                    ┌──────▼─────┐  ┌──────▼───────┐
                                    │ cart_items │  │ order_items  │
                                    └──────┬─────┘  └──────┬───────┘
                                           │               │
                                           └───────┬───────┘
                                                   │  (order_items also
                                          ┌────────▼─────────┐  snapshot
                                          │ product_variants │   name/price)
                                          └────────┬─────────┘
                                                   │
   ┌────────────┐  parent_id   ┌──────────┐  ┌─────▼──────┐   ┌────────────────┐
   │ categories │◄─────────────│ (self)   │  │  products  │──►│ product_images │
   └─────┬──────┘              └──────────┘  └─────┬──────┘   └────────┬───────┘
         │  category_id, type_id ─────────────────┘                    │
         │                                   ┌─────▼──────────┐   ┌────▼────┐
         │                                   │product_details │   │  media  │
         │                                   │ (legal fields) │   └─────────┘
         │                                   └────────────────┘
         │
   ┌─────▼──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────────┐
   │ site_settings  │  │  enquiries   │  │ audit_log │  │ webhook_events │
   └────────────────┘  └──────────────┘  └───────────┘  └────────────────┘
   ┌────────────────┐  ┌──────────────────────┐  ┌───────────┐
   │   locations    │  │ inventory_movements  │  │ redirects │
   └────────────────┘  └──────────────────────┘  └───────────┘
```

---

## 3. Taxonomy

### `categories`

A **type is a category with a parent**. One table, two levels — chosen so a category can gain or lose a type layer without a migration, and so staff see one concept instead of two. It also matches the shape the frontend already uses.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `parent_id` | uuid → categories | `NULL` = top-level category. Set = this row is a **type** |
| `name` | text NOT NULL | |
| `slug` | text NOT NULL | unique per parent — see below |
| `short_name` | text | for the header rail, where space is tight |
| `description` | text | 100–200 words on a category; a line on a type |
| `hero_image_id` | uuid → media | |
| `sort_order` | integer NOT NULL | drag-to-reorder in admin |
| `status` | enum `draft｜published｜hidden` | |
| `seo_title`, `seo_description` | text | auto-derived, overridable |
| `published_at` | timestamptz | |

```sql
-- Slugs are unique within a parent, not globally: "mango" may exist
-- under both Pickles and Dehydrated Fruits, and that is correct.
CREATE UNIQUE INDEX categories_parent_slug_key
  ON categories (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'), slug);

-- Two levels only. A type cannot have a type.
ALTER TABLE categories ADD CONSTRAINT categories_max_depth CHECK (
  parent_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM categories p WHERE p.id = parent_id AND p.parent_id IS NOT NULL
  )
);
```

> The depth rule cannot be expressed as a plain `CHECK` in Postgres (subqueries are not allowed). It is enforced by a `BEFORE INSERT OR UPDATE` trigger; the constraint is written above for intent. Documented so nobody "fixes" the trigger away.

---

## 4. Products

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text UNIQUE NOT NULL | **permanent**; a change writes a redirect |
| `name` | text NOT NULL | 2–4 words. Keywords live in `search_keywords` |
| `category_id` | uuid NOT NULL → categories | always the **top-level** category |
| `type_id` | uuid → categories | the type, where one exists |
| `short_descriptor` | varchar(90) NOT NULL | card and PDP subtitle |
| `description` | text NOT NULL | |
| `status` | enum `draft｜published｜archived` NOT NULL | default `draft` |
| `featured` | boolean NOT NULL default false | |
| `sort_order` | integer NOT NULL default 0 | |
| `seo_title`, `seo_description` | text | |
| `search_keywords` | text[] | regional names, synonyms, alternate spellings |
| `search_vector` | tsvector GENERATED STORED | GIN indexed |
| `published_at` | timestamptz | |

Two constraints that encode real rules:

```sql
-- category_id must be top-level; type_id must be a child of it.
-- Enforced by trigger (same subquery limitation as above).

-- A product cannot be published without at least one image
-- and a complete legal detail row. Enforced in publishProduct(),
-- and asserted by an integration test — see §9.
```

**Why `category_id` is stored even when `type_id` is set:** breadcrumbs, the category listing and the "other ranges" block all need the top-level category on every render. Walking the parent chain on each row would be a recursive query per product. This denormalisation is deliberate and is kept honest by a trigger.

### `product_variants`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `product_id` | uuid NOT NULL → products ON DELETE CASCADE | |
| `label` | text NOT NULL | "250g" |
| `sku` | text UNIQUE NOT NULL | |
| `price_minor` | integer NOT NULL CHECK (>= 0) | **paise** |
| `mrp_minor` | integer CHECK (mrp_minor >= price_minor) | inclusive of taxes |
| `tax_rate_bp` | integer NOT NULL default 0 | GST in basis points; varies by food category |
| `net_weight_grams` | integer CHECK (> 0) | shipping + the legal net-quantity display |
| `stock_quantity` | integer NOT NULL default 0 CHECK (>= 0) | |
| `low_stock_threshold` | integer NOT NULL default 5 | |
| `status` | enum `active｜inactive` | |
| `is_default` | boolean | which variant the PDP opens on |
| `sort_order` | integer | |

Sizes are rows. Never a comma-separated string.

### `product_details` — the legally significant table

One row per product. **Every field here blocks publishing when empty**, because Indian law requires them for online food sale (`SECURITY.md` §8).

| Column | Legal driver |
|---|---|
| `ingredients` | FSS labelling — descending by weight |
| `allergens` | FSS labelling |
| `net_quantity` | Legal Metrology Rule 6 |
| `shelf_life` | FSS |
| `storage_instructions` | FSS |
| `country_of_origin` | Consumer Protection (E-Commerce) Rules 2020 |
| `manufacturer_name`, `manufacturer_address` | Legal Metrology Rule 6 |
| `fssai_licence_number` | FSS Act |
| `consumer_care_contact` | Legal Metrology Rule 6 |
| `veg_non_veg` | enum — FSS labelling mark |
| `nutritional_info` | jsonb, optional, only if lab-verified |

> Our reading of the applicable rules. **The client must have this confirmed by their own advisor** — `OQ-003`.

### `product_images` and `media`

Split deliberately: `media` is the file, `product_images` is its use.

```
media            id, r2_key UNIQUE, filename, mime_type, size_bytes,
                 width, height, blur_data_url, uploaded_by, created_at

product_images   id, product_id, media_id, alt_text NOT NULL, sort_order,
                 is_primary, role (pack|contents|macro|lifestyle|detail)
```

**Binaries never go in Postgres.** The database stores the key and metadata; R2 stores the file.

`alt_text` is `NOT NULL` at the database level — the accessibility rule is a constraint, not a convention. A partial unique index enforces one primary image per product.

---

## 5. Identity

```
users                 id, email CITEXT UNIQUE, email_verified_at, name, phone,
                      status(active|suspended|deleted), mfa_secret, timestamps
password_credentials  user_id PK, password_hash            ← separate table, never
                                                             selected by accident
sessions              id, user_id, token_hash UNIQUE, scope(web|admin),
                      expires_at, ip_hash, user_agent
roles                 id, key UNIQUE (customer|staff|content_manager|
                      order_manager|admin), name
user_roles            user_id, role_id  PK(user_id, role_id)
verification_tokens   identifier, token_hash UNIQUE, type, expires_at, consumed_at
addresses             user_id, label, full_name, phone, line1, line2, city,
                      state, postal_code, country default 'IN', is_default_*
```

Two choices worth stating:

- **Password hashes live in their own table.** `SELECT * FROM users` can then never leak one.
- **Roles are rows, not an enum column.** A user can hold several — the client's §15 lists four, and a small business will have one person who is both content and order manager.

---

## 6. Commerce `[only if OQ-001 = yes]`

```
carts        id, user_id?, session_token?, status(active|converted|abandoned),
             currency, expires_at
cart_items   cart_id, variant_id, quantity CHECK(>0), price_minor_at_add
             UNIQUE(cart_id, variant_id)

orders       id, order_number UNIQUE, user_id?, email, phone,
             status, payment_status,
             subtotal_minor, shipping_minor, tax_minor, discount_minor,
             total_minor, currency,
             shipping_address jsonb, billing_address jsonb,   ← snapshots
             placed_at

order_items  order_id, variant_id?,          ← nullable: the variant may be archived
             product_name, variant_label, sku,
             unit_price_minor, quantity, tax_rate_bp, line_total_minor
             ↑ all SNAPSHOTTED at purchase

payments        order_id, provider, provider_payment_id UNIQUE, amount_minor,
                status, method, raw_payload jsonb
webhook_events  provider, event_id, UNIQUE(provider, event_id)  ← idempotency
refunds         order_id, payment_id, amount_minor, reason, status, created_by
```

**Addresses are jsonb snapshots, not foreign keys.** If a customer edits their address book, a completed order must not silently change where it was shipped.

### Order state machine

```
pending ──► confirmed ──► processing ──► packed ──► shipped ──► delivered
   │            │              │            │
   └── cancelled ◄─────────────┴────────────┘
   └── failed
              refunded ◄── (from confirmed onward)
```

Valid transitions live in one table in `orderService`. Anything else throws. The status column is an enum, so the database rejects unknown values even if a caller bypasses the service.

---

## 7. Operations

```
inventory_movements  variant_id, delta, reason(order|restock|adjustment|
                     return|damage|correction), reference_id, note,
                     created_by, created_at              ← append-only
enquiries            type(contact|wholesale), name, email, phone, company,
                     country, product_interest text[], estimated_quantity,
                     subject, message, source_url, source_product_id,
                     status(new|in_progress|quoted|won|lost|spam),
                     assigned_to, internal_notes, ip_hash, user_agent
audit_log            actor_id, actor_role, action, entity_type, entity_id,
                     changes jsonb, ip_hash, created_at
site_settings        singleton — CHECK (id = 1)
locations            name, type, address, geo, phone, hours, is_public
redirects            from UNIQUE, to, permanent
```

**Stock is never set blind.** The admin writes a movement; `stock_quantity` is the running total. "Why is this number wrong?" is always answerable.

**IPs are hashed**, never stored raw.

---

## 8. Indexes

Derived from actual query patterns in the existing pages, not added speculatively.

| Table | Index | Query it serves |
|---|---|---|
| `products` | UNIQUE(`slug`) | product page |
| `products` | (`category_id`, `status`, `sort_order`) | category listing |
| `products` | (`type_id`, `status`) | type listing |
| `products` | (`status`, `featured`) WHERE featured | homepage rail |
| `products` | GIN(`search_vector`) | search |
| `product_variants` | UNIQUE(`sku`) | admin, orders |
| `product_variants` | (`product_id`, `sort_order`) | PDP variant list |
| `product_variants` | (`stock_quantity`) WHERE stock <= low_stock_threshold | low-stock dashboard |
| `categories` | UNIQUE(COALESCE(parent_id,…), `slug`) | routing |
| `categories` | (`parent_id`, `sort_order`) | nav, type chips |
| `product_images` | (`product_id`, `sort_order`), UNIQUE(`product_id`) WHERE is_primary | cards, gallery |
| `sessions` | (`token_hash`), (`expires_at`) | auth, cleanup |
| `orders` | UNIQUE(`order_number`), (`user_id`,`placed_at` DESC), (`status`) | history, admin |
| `payments` | UNIQUE(`provider_payment_id`) | reconciliation |
| `webhook_events` | UNIQUE(`provider`,`event_id`) | **idempotency** |
| `enquiries` | (`type`,`status`,`created_at` DESC) | admin list |
| `redirects` | UNIQUE(`from`) | middleware |

Not indexed: `products.name` (covered by the tsvector), `users.name`, anything only read by id.

---

## 9. Integrity rules the code must honour

```sql
CHECK (quantity > 0)                      -- cart_items, order_items
CHECK (stock_quantity >= 0)               -- product_variants
CHECK (price_minor >= 0)
CHECK (mrp_minor IS NULL OR mrp_minor >= price_minor)
```

- **Stock decrement runs `SELECT … FOR UPDATE` inside a transaction.** Overselling is prevented by the database, not by a check-then-write race in application code.
- **Publishing a product is a transaction** that verifies a complete `product_details` row and at least one image with alt text. A non-compliant product cannot go live.
- **Foreign keys:** `CASCADE` for owned children (variants, cart items, sessions); `RESTRICT` where history must survive (orders, media in use).

---

## 10. Seed and data classification

Per `CURRENT-ARCHITECTURE.md` §11:

| Seed set | Contents | Production |
|---|---|---|
| `seed/real.ts` | 10 category names and order; `site_settings` from the business card | ✅ yes |
| `seed/demo.ts` | 10 types, 28 products, prices, SKUs, availability | ❌ **never** |

### As built

The `[SAMPLE]` name prefix proposed above was **not** implemented. It is cosmetic, trivially stripped, and it would change every rendered product name — which would make the Phase 8 cutover diff (`MIGRATIONS.md` §13) useless at exactly the moment it matters.

Instead, `categories.is_sample` and `products.is_sample` mark the rows, and three independent guards stand between them and a live site:

| # | Guard | Where |
|---|---|---|
| 1 | `assertNotProduction()` — the demo seed refuses to run | `seed/demo.ts` |
| 2 | Every demo row is written with `is_sample = true` | `seed/demo.ts` |
| 3 | `assertNoSampleData()` fails a production boot while any survive | `db/guards.ts`, run by `npm run db:verify` |

**Purging is deliberately not guarded.** Seeding demo data into production is forbidden; *removing* it is the remediation the boot guard tells you to run, and a guard that blocked its own fix would be worse than none.

Two commands:

```bash
npm run db:seed                  # real data only — the default, safe in production
npm run db:seed -- --demo        # adds the demonstration catalogue
```

Getting invented products into a live catalogue requires typing `--demo`. It cannot happen by forgetting a flag.

### What each seed contains

| | `seed/real.ts` | `seed/demo.ts` |
|---|---|---|
| Rows | 10 categories, 1 `site_settings` | 10 types, 28 products, 34 variants, 34 movements |
| Source | Handwritten sheet, business card | Invented by us |
| Production | ✅ | ❌ refused |
| Re-run behaviour | Upsert by slug; never overwrites a field an admin filled in | Rebuilds from scratch |

The demo seed **rebuilds rather than upserts**, because stock is the running total of an append-only ledger: an upsert would have to reconcile movements to avoid doubling quantities. Verified — running it three times leaves 28 products and stock at 24, not 72.

**Demo products are seeded `published` with no `product_details` row.** That is a state the publish guard will refuse to create, and rightly: a published food product legally requires ingredients, allergens, shelf life, manufacturer details and an FSSAI number. We have none of them and will not invent them — an invented allergen declaration is a safety issue, not a content gap. So the seed writes what the site currently shows, which is those fields rendered as "to be confirmed", and bypasses the service layer to do it. That is precisely why this data may not reach production.

---

## 11. Migrations

Drizzle Kit generates SQL files; they are committed and reviewed like code.

- **Never `db:push` against staging or production.**
- Forward-only and backwards-compatible: add nullable → backfill → enforce → remove old code. Never a breaking drop in the same release as the code change.
- Every migration runs against a Neon preview branch first.
- Destructive changes require a rollback plan in the PR.

Detail in `MIGRATIONS.md`.

---

## 12. Data protection

| Concern | Approach |
|---|---|
| PII | `users`, `addresses`, `orders`, `enquiries` — inventoried and reviewed |
| Card data | **Never stored.** Provider references only |
| IP addresses | Hashed with a rotating salt |
| Retention | Enquiries 3y · orders 8y (statutory) · sessions purged at expiry · abandoned carts 90d · audit 3y |
| Deletion request | Anonymise the user, retain the order with a redacted identity — financial records must survive account deletion (DPDP Act 2023) |
| Backups | Neon PITR + daily logical dump. **Restore drill before launch** — `DATABASE-RECOVERY.md` |
