# Data Ownership — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DATA-OWNERSHIP.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. The rule

> **Every field has exactly one owner. One place it is written, one place it is read from.**

The failure this prevents is mundane and expensive: a price in the database, a price hard-coded in a component, and a price in a JSON file. Three sources, two of them stale, and no way to tell which one the customer saw.

So for each piece of information the question is asked once, up front: *who writes this, and where does it live?*

---

## 2. Ownership map

| Data | Owner | Written by | Read by |
|---|---|---|---|
| Categories, types | Postgres `categories` | Admin | Every catalogue surface |
| Products, descriptors, descriptions | Postgres `products` | Admin | Catalogue, search, PDP |
| Variants, prices, weights, SKUs | Postgres `product_variants` | Admin | PDP, cart, checkout |
| Stock levels | Postgres `inventory` | Admin, order flow | PDP, checkout |
| Legal product fields (FSSAI, ingredients, shelf life) | Postgres `product_details` | Admin | PDP |
| Images | R2 object storage; metadata in `media` | Admin upload | Everywhere |
| Page content (About, Quality) | Postgres `pages` | Admin | Those pages |
| Policies | Postgres `pages` | Admin | `/policies/[slug]` |
| Enquiries | Postgres `enquiries` | Public form | Admin |
| Users, roles | Postgres `users`, `user_roles` | Registration, admin | Auth |
| Orders, payments | Postgres, via webhook | System | Account, admin |
| Business identity (GSTIN, address, FSSAI, entity) | Postgres `site_settings` | Admin | Footer, policies, PDP |
| Site URL, WhatsApp number, keys | Environment | Deployment config | Server only |
| Design tokens | `globals.css` | Engineering | CSS |
| Copy that is structural, not editorial | Component source | Engineering | That component |

Everything the business changes lives in Postgres. Everything that changes per environment lives in the environment. Everything that is part of the design lives in the code. Nothing lives in two of them.

---

## 3. Where this is violated today

`apps/web/src/data/catalog.ts` owns the entire catalogue as a TypeScript literal, and `apps/web/src/lib/site.ts` owns the business identity the same way.

That was correct for a frontend demo and is wrong for a running business — the client cannot edit a TypeScript file.

| Today | After |
|---|---|
| `catalog.ts` — 10 categories, 10 types, 28 products | Seed input for Postgres, then **deleted** |
| `site.ts` — address, GSTIN, phone, email, partners | `site_settings` table, admin-editable |
| `site.ts` — `NEXT_PUBLIC_SITE_URL`, WhatsApp number | Environment, validated at boot |
| `site.ts` — nav structure | Stays in code. It is layout, not content |

`catalog.ts` is deleted at the end of Phase 8, not kept "just in case". A dormant second source of product data is exactly the thing this document exists to prevent.

Navigation stays in code deliberately. The header has room for four links; making that editable invites a fifth that breaks the layout. The **category bar** is data-driven, because categories genuinely change.

---

## 4. No CMS

The audit found six runtime dependencies and no CMS. Adding one now would mean products live in Postgres and page copy lives in a hosted service, with two admin logins, two permission models, and a second vendor for a business with a dozen editable paragraphs.

Content is stored as **Tiptap JSON**, not HTML. JSON is validated against a node allowlist; HTML would require sanitising on every render and one missed path is stored XSS. The renderer maps nodes to the existing design-system components, so admin-authored copy cannot introduce styles that break the page.

Tracked as `OQ-038` — if the client wants a CMS, that is a legitimate choice, but it is theirs to make, not a default.

---

## 5. Snapshots are not duplication

`order_items` stores the product name, variant label, unit price and tax rate **at the moment of purchase**, and does not join to `products` to display them.

That looks like violating §1, and it is the opposite. An order is a record of what happened. If a price rises in March, a January invoice must not change. The owner of "the price on order 1043" is `order_items`; the owner of "the price today" is `product_variants`. Two different facts.

The same reasoning applies to the customer address on an order, and to the GSTIN printed on an invoice.

---

## 6. Derived values are computed, never stored

| Value | How |
|---|---|
| Order total | Sum of items at write time, stored — it is part of the record |
| "In stock" label | Derived from `inventory` at read time |
| Breadcrumb trail | Derived from `category_slug` / `type_slug` |
| Product count per category | Counted at query time |
| Search vector | A generated column — Postgres owns it, not the application |

Counts are not cached in a column. A stale "12 products" beside a list of nine is a bug report; a `COUNT(*)` on hundreds of rows is not a performance problem.

---

## 7. Deletion

Nothing the business depends on is hard-deleted.

| Entity | On "delete" |
|---|---|
| Product | `status = 'archived'`. Referenced by past orders |
| Category | Blocked while products reference it |
| Enquiry | Soft delete, retained per policy |
| Order, payment | **Never.** Cancellation is a status |
| User | Anonymised on request — see below |
| Media | Row removed, object removed only when unreferenced |

Under the DPDP Act 2023 a customer may request erasure. Orders are retained for statutory tax purposes, so the record survives with personal fields anonymised: name, email, phone and address replaced, ids and amounts intact. That satisfies both obligations, which conflict only if you try to satisfy them with a single `DELETE`.

---

## 8. Open questions

| ID | Question |
|---|---|
| `OQ-038` | Custom admin or CMS (this document assumes custom) |
| `OQ-061` | Retention period for enquiries |
| `OQ-062` | Who is the DPDP data fiduciary contact |
