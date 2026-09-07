# Data Architecture — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DATABASE.md` |
| Version | 0.2 — **single-store architecture** |
| Date | 2026-09-07 |
| Store | PostgreSQL (Neon) via Drizzle, in `packages/db` |
| Change from v0.1 | Sanity removed. Catalogue and content now live in Postgres, managed through `apps/admin`. See ADR-010 |

---

## 1. Single source of truth

One database. Both applications read it through the same typed schema in `packages/db`.

```
apps/admin  ──write──►  ┌──────────────┐  ◄──read──  apps/web
                        │  PostgreSQL  │
                        └──────────────┘
                               │
                        Cloudflare R2
                        (image binaries only —
                         metadata lives in Postgres)
```

**Rules**

1. Every fact has exactly one row in one table. No duplication, no synchronisation, no "which system owns this?"
2. `apps/web` reads; it writes only carts, orders, enquiries and account data. It never writes catalogue or content.
3. `apps/admin` writes everything, always inside a transaction, always with an `audit_log` entry.
4. An order **snapshots** product name, variant label, price and tax at purchase. An order is a historical record and must never change because the catalogue changed.
5. R2 stores image bytes only. Alt text, dimensions, usage and ownership are database rows.

---

## 2. Catalogue

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text ✅ | Display name |
| `slug` | text ✅ unique | **Permanent.** Change writes a redirect |
| `parent_id` | uuid → categories | One level of nesting (`OQ-011`) |
| `sort_order` | integer ✅ | Drag-to-reorder in admin |
| `hero_headline` | text | |
| `description` | text | 150–300 words — required for SEO depth |
| `hero_image_id` | uuid → media | |
| `seo_title`, `seo_description` | text | Auto-derived, overridable |
| `status` | enum `draft` \| `published` \| `hidden` | |
| `published_at`, `created_at`, `updated_at` | timestamptz | |

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text ✅ | |
| `slug` | text ✅ unique | **Permanent** |
| `primary_category_id` | uuid ✅ → categories | Breadcrumb and canonical context |
| `short_descriptor` | varchar(90) ✅ | Card and PDP subtitle |
| `description` | jsonb ✅ | Tiptap document. **Never raw HTML** |
| `featured` | boolean | Homepage curation |
| `status` | enum `draft` \| `active` \| `discontinued` ✅ | |
| `seo_title`, `seo_description` | text | |
| `search_keywords` | text[] | Includes regional names |
| `search_vector` | tsvector generated | GIN-indexed — ADR-008 |
| `published_at`, `created_at`, `updated_at` | timestamptz | |

### `product_categories`
Many-to-many for secondary category membership: `product_id`, `category_id`, PK(both).

### `product_information` — the legally significant table

One row per product. **Every ✅ field blocks publish when empty** (`SECURITY.md` §8).

| Column | Required | Legal driver |
|---|---|---|
| `product_id` | PK → products | |
| `ingredients` | ✅ | FSS labelling — descending order by weight |
| `allergens` | conditional | FSS labelling |
| `net_quantity` | ✅ | Legal Metrology Rule 6 |
| `shelf_life` | ✅ | FSS |
| `storage_instructions` | ✅ | FSS |
| `country_of_origin` | ✅ | Consumer Protection (E-Commerce) Rules 2020 |
| `manufacturer_name`, `manufacturer_address` | ✅ | Legal Metrology Rule 6 |
| `fssai_licence_number` | ✅ | FSS Act |
| `consumer_care_contact` | ✅ | Legal Metrology Rule 6 |
| `veg_non_veg` | ✅ enum | FSS labelling mark |
| `nutritional_info` | optional jsonb | Only if lab-verified |
| `usage_suggestions` | optional | |

> Stated as our understanding of the applicable Indian rules for online food sale. **The client must have them confirmed by their own advisor** — `OQ-003`.

### `product_variants` — pack sizes, price and stock together

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `product_id` | uuid → products cascade | |
| `label` | text ✅ | e.g. "250g" |
| `sku` | text ✅ unique | |
| `price_minor` | integer | **Paise. Never a float** |
| `mrp_minor` | integer | Inclusive of all taxes |
| `currency` | char(3) default `INR` | Multi-currency headroom |
| `tax_rate_bp` | integer | GST in basis points; varies by food category |
| `net_weight_grams` | integer | Shipping calculation |
| `stock_quantity` | integer default 0, CHECK ≥ 0 | |
| `low_stock_threshold` | integer default 5 | Drives the admin alert |
| `availability` | enum `in_stock` \| `low_stock` \| `out_of_stock` \| `enquire_only` | Derived, overridable |
| `is_default` | boolean | Which variant the PDP opens on |
| `sort_order` | integer | |

**This table is why the CMS was removed.** Price and stock require transactional integrity and atomic decrement; product content is edited alongside them. Splitting them across two systems was the single largest architectural risk in v0.1.

### `product_images`
`id`, `product_id` cascade, `media_id` → media, `alt_text` ✅ **required**, `sort_order`, `role` (`pack` | `contents` | `macro` | `lifestyle` | `detail`).

### `related_products`
`product_id`, `related_product_id`, `sort_order`. Falls back to same-category when empty.

---

## 3. Content

Replaces what would have been CMS documents.

### `pages`
`id`, `slug` ✅ unique, `title` ✅, `body` jsonb (Tiptap), `seo_title`, `seo_description`, `og_image_id`, `status`, `published_at`, timestamps.
Covers About, Quality, Locations, Contact and all four policy pages.

### `page_sections`
Composable, ordered sections so staff build pages from approved patterns (`DESIGN-SYSTEM.md` §8) rather than free-form layout.
`id`, `page_id` (nullable — `null` means the homepage), `type` (enum matching the section vocabulary), `sort_order`, `is_visible`, `content` jsonb, `media_id`.

### `locations`
`id`, `name`, `type` (`office` | `facility` | `warehouse` | `retail`), `address_line1/2`, `city`, `state`, `postal_code`, `country`, `latitude`, `longitude`, `phone`, `hours`, `media_id`, `is_public`, `sort_order`.
**No row is created without a verified address** — no invented map pins.

### `site_settings` — singleton
Logo, entity name, registered address, **FSSAI licence, GSTIN**, grievance officer (name/email/phone/response time), phone numbers, emails, WhatsApp number, social URLs, business hours.
Enforced single row via `CHECK (id = 1)`.

### `navigation`
`id`, `location` (`header` | `footer`), `label`, `href`, `parent_id`, `sort_order`, `is_visible`.

### `media`
`id`, `r2_key` unique, `filename`, `mime_type`, `size_bytes`, `width`, `height`, `blur_data_url` (LQIP, generated at upload), `default_alt_text`, `uploaded_by`, `created_at`.
Deletion is blocked while any `product_images`, `categories`, `pages` or `page_sections` row references it — the admin shows where it is used first.

### `redirects`
`id`, `from` ✅ unique, `to` ✅, `permanent` default true, `created_at`. Written automatically whenever a product or category slug changes.

---

## 4. Identity

**`users`** — `id`, `email` (unique, citext), `email_verified_at`, `name`, `phone`, `role` (`customer` | `staff` | `admin`, default `customer`), `mfa_enabled`, timestamps, `deleted_at`
**`sessions`** — `id`, `user_id` cascade, `token` (hashed, unique), `scope` (`web` | `admin`), `expires_at`, `ip_hash`, `user_agent`, `created_at`
**`accounts`** — OAuth links: `user_id`, `provider`, `provider_account_id`, tokens, unique(provider, provider_account_id)
**`verification_tokens`** — `identifier`, `token` (hashed, unique), `type` (`email_verify` | `password_reset` | `staff_invite`), `expires_at`, `consumed_at`
**`addresses`** — `user_id`, `label`, `full_name`, `phone`, `line1`, `line2`, `city`, `state`, `postal_code`, `country` (default `IN`), `is_default_shipping`, `is_default_billing`

Password hashes live in the auth library's own table, never in `users`. Admin sessions are scoped separately — see `ARCHITECTURE.md` §8.

---

## 5. Commerce `[if OQ-001 = B or C]`

**`carts`** — `id`, `user_id` (nullable for guests), `session_token`, `status` (`active` | `converted` | `abandoned`), `currency`, `expires_at`
**`cart_items`** — `cart_id` cascade, `variant_id`, `quantity` CHECK > 0, `price_minor_at_add`, unique(cart_id, variant_id)

**`orders`** — `id`, `order_number` unique (`BGA-2026-00042`), `user_id` nullable, `email`, `phone`, `status` (`pending` → `confirmed` → `processing` → `shipped` → `delivered` | `cancelled` | `refunded`), `payment_status`, `subtotal_minor`, `shipping_minor`, `tax_minor`, `discount_minor`, `total_minor`, `currency`, `shipping_address` jsonb, `billing_address` jsonb, `notes`, `placed_at`, timestamps.
Addresses are **jsonb snapshots, not foreign keys** — an order must not change when a customer edits their address book.

**`order_items`** — `order_id` cascade, `variant_id` nullable, plus **snapshotted** `product_name`, `variant_label`, `sku`, `unit_price_minor`, `quantity`, `tax_rate_bp`, `line_total_minor`.

**`payments`** — `order_id`, `provider`, `provider_payment_id` unique, `provider_order_id`, `amount_minor`, `status`, `method`, `raw_payload` jsonb
**`webhook_events`** — `provider`, `event_id` **unique — this is what makes webhook handling idempotent**, `event_type`, `payload`, `processed_at`, `error`
**`refunds`** — `order_id`, `payment_id`, `amount_minor`, `reason`, `provider_refund_id`, `status`, `created_by`

---

## 6. Operations

**`inventory_movements`** — append-only: `variant_id`, `delta`, `reason` (`order` | `restock` | `adjustment` | `return` | `damage` | `correction`), `reference_id`, `note`, `created_by`, `created_at`.
**Stock is never edited blind.** The admin's stock field writes a movement; the variant's `stock_quantity` is the running total. Every change is attributable.

**`enquiries`** — `id`, `type` (`contact` | `wholesale`), `name`, `email`, `phone`, `company`, `country`, `product_interest` text[], `estimated_quantity`, `subject`, `message`, `source_url`, `source_product_id`, `status` (`new` | `in_progress` | `quoted` | `won` | `lost` | `spam`), `assigned_to`, `internal_notes`, `ip_hash`, `user_agent`, timestamps

**`newsletter_subscribers`** — `email` unique, `status` (`pending` | `confirmed` | `unsubscribed`), `confirmed_at`, `source` — double opt-in

**`audit_log`** — `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `changes` jsonb (before/after), `ip_hash`, `created_at`. **Every admin mutation.**

**`rate_limits`** — Postgres fallback if Redis is not provisioned: `key`, `count`, `window_start`, PK(key, window_start)

---

## 7. Indexes

| Table | Index | Reason |
|---|---|---|
| `products` | unique(`slug`), (`status`,`published_at`), GIN(`search_vector`) | Routing, listing, search |
| `products` | (`primary_category_id`,`status`) | Category listing |
| `product_variants` | unique(`sku`), (`product_id`,`sort_order`) | Lookup, display |
| `product_variants` | (`stock_quantity`) WHERE `stock_quantity` <= `low_stock_threshold` | Low-stock dashboard |
| `categories` | unique(`slug`), (`parent_id`,`sort_order`) | Navigation |
| `product_categories` | (`category_id`,`product_id`) | Multi-category listing |
| `media` | unique(`r2_key`), (`created_at` desc) | Library |
| `redirects` | unique(`from`) | Middleware lookup |
| `users` | unique(`email`) | Login |
| `sessions` | (`token`), (`user_id`), (`expires_at`) | Auth, cleanup |
| `orders` | unique(`order_number`), (`user_id`,`placed_at` desc), (`status`) | History, admin |
| `payments` | unique(`provider_payment_id`) | Reconciliation |
| `webhook_events` | unique(`provider`,`event_id`) | **Idempotency guarantee** |
| `enquiries` | (`type`,`status`,`created_at` desc) | Admin list |
| `inventory_movements` | (`variant_id`,`created_at` desc) | Stock history |
| `audit_log` | (`entity_type`,`entity_id`), (`created_at` desc) | Investigation |

---

## 8. Integrity rules

- **Money is always an integer in minor units** with its currency stored alongside. No floats, no `numeric` arithmetic in application code.
- `CHECK (quantity > 0)` on cart and order items; `CHECK (stock_quantity >= 0)` on variants.
- Stock decrement runs in a transaction with `SELECT … FOR UPDATE` on the variant row. **Overselling is prevented at the database**, not in application logic.
- Publishing a product is a transaction that validates every required `product_information` field and at least one image with alt text. A non-compliant product cannot go live.
- Foreign keys: `CASCADE` for owned children (variants, cart items, sessions); `RESTRICT` where history must survive (orders, media in use).
- `updated_at` maintained by trigger, not application code.
- Timestamps are `timestamptz`, stored UTC, rendered IST.

---

## 9. Migrations

- Drizzle Kit generates SQL migration files in `packages/db/migrations`; committed and reviewed.
- **Never** `db:push` against staging or production.
- Forward-only and backwards-compatible: add nullable column → backfill → enforce constraint → remove old code. Never a breaking drop in the same release as the code change.
- **Both apps deploy from one schema.** A migration must be compatible with the currently-deployed version of *both* apps during the rollout window.
- Every migration applied to a Neon preview branch first; rollback plan in the PR for destructive changes.

---

## 10. Data protection

| Concern | Approach |
|---|---|
| PII inventory | `users`, `addresses`, `orders`, `enquiries` — documented and reviewed |
| Encryption | TLS in transit; at rest by the provider |
| IP addresses | Hashed with a rotating salt, never stored raw |
| Payment data | **Never touches our database.** Provider references only. No card data, ever |
| Retention | Enquiries 3 years · orders 8 years (statutory) · sessions purged at expiry · abandoned carts purged at 90 days · audit log 3 years |
| Deletion requests | Anonymise the user, retain the order with redacted identity — financial records must survive account deletion (DPDP Act 2023) |
| Export requests | Endpoint producing the user's own data as JSON |
| Backups | Neon PITR + daily logical dump to R2. **Restore drill completed before launch and documented** |

---

## 11. Seed and test data

- Seed script produces realistic-shaped but obviously fictional records, product names prefixed `[SAMPLE]`, so seed data can never be mistaken for real catalogue content.
- E2E tests run against an isolated Neon branch, torn down after the run.
- **No production data in any non-production environment.** If production data is ever needed for debugging, it is anonymised first.
