# Database Design — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DATABASE-DESIGN.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Engine | PostgreSQL 16 (Neon) · Drizzle ORM |
| Supersedes | `DATABASE.md` v0.2 |

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

Demo product names are prefixed `[SAMPLE]` in non-production environments, and the seed refuses to run when `NODE_ENV=production`. The existing `IS_SAMPLE_DATA` flag becomes a boot guard.

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
