# Product Domain Model — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/PRODUCT-DOMAIN.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |
| Companion | `DATABASE-DESIGN.md` — the tables. This document — the meaning |

---

## 1. Why this document exists separately

`DATABASE-DESIGN.md` says what the columns are. This says what the words mean, which is the part that gets argued about six months in when someone asks whether "Mango" is a category, a type, a product, or a flavour.

It is written in the client's vocabulary, taken from the handwritten sheet, not in ours.

---

## 2. The three levels

```
Category ─────────► Type ─────────► Product ─────────► Variant
Pickles             Mango           Mango Pickle       200g · 500g
```

| Level | Definition | Answers |
|---|---|---|
| **Category** | What kind of food it is | "What do you sell?" |
| **Type** | What it is made from, within a category | "Which pickle?" |
| **Product** | A named, photographed, sellable thing | "This one." |
| **Variant** | A pack size of that product | "How much?" |

### The rules

1. **A product belongs to exactly one category.** No product appears under two.
2. **A type is optional.** Categories with few products have none.
3. **Type is never global.** "Mango" under Pickles and "Mango" under Dehydrated Fruits are two different rows, not one shared tag. They have different parents, different photographs and different descriptions.
4. **Exactly two levels of depth.** No sub-sub-categories. Enforced by a database trigger, not by convention (`DATABASE-DESIGN.md` §4).
5. **Price and stock live on the variant, never on the product.** A product without variants is not sellable and cannot be published.

### One table, two levels

Category and type are the **same table**. A type is a `categories` row with a `parent_id`.

That is not a shortcut. They behave identically: both have a slug, a hero headline, a description, and a page. Two tables would mean two sets of repositories and two page templates for one concept. The frontend already models it this way — `Category` with an optional `parentSlug` — so the schema matches what is built.

---

## 3. The ten categories

From the handwritten sheet supplied by the client. Names pending final confirmation (`OQ-013`).

| # | Category | Slug | Note |
|---|---|---|---|
| 1 | Dehydrated Powders & Flakes | `dehydrated-powders-flakes` | Vegetable and leaf powders |
| 2 | Dehydrated Fruits | `dehydrated-fruits` | |
| 3 | Pickles | `pickles` | |
| 4 | Spiced Dal Powders | `spiced-dal-powders` | Podi. A Telugu household staple |
| 5 | Sun-Dried Crisps | `sun-dried-crisps` | **Vadiyalu** — see §4 |
| 6 | Dry Fruits | `dry-fruits` | Traded, not manufactured |
| 7 | Millets | `millets` | |
| 8 | Herbal Tea & Coffee | `herbal-tea-coffee` | |
| 9 | Masala Powders | `masala-powders` | |
| 10 | Combo Packs | `combo-packs` | Composed of other products — see §6 |

**The type layer is currently invented by us** (`OQ-049`). The ten types in `catalog.ts` demonstrate the UX and must not reach production. Real types come from the client, per category.

---

## 4. Vocabulary that is regional, and got checked

The GSTIN prefix `37` and the Nellore address place the business in **Andhra Pradesh**, so the language is **Telugu**.

| Term | Meaning | Why not the alternative |
|---|---|---|
| **Vadiyalu** | Sun-dried lentil or sago crisps, fried before eating | *Sandige* is the Kannada word; *Vadi / Badi* is northern. Vadiyalu is correct for AP |
| **Podi** | Dry spiced powder eaten with rice or idli | Not "chutney powder", which is a marketing translation |
| **Gongura** | Roselle leaf | No English equivalent in common use |
| **Avakaya** | The specific AP mango pickle in mustard oil | Not interchangeable with mango pickle generally |

These words appear in product names as the client uses them. Where a customer outside AP might not know a term, the short descriptor explains it; the name itself is not anglicised.

---

## 5. Product lifecycle

```
draft ──publish──► published ──unpublish──► draft
  │                    │
  └──────archive───────┴──────► archived
```

| State | Public | In search | In sitemap | Orderable |
|---|:--:|:--:|:--:|:--:|
| `draft` | ✘ 404 | ✘ | ✘ | ✘ |
| `published` | ✔ | ✔ | ✔ | ✔ if in stock |
| `archived` | ✘ 410 | ✘ | ✘ | ✘ |

`archived` returns **410 Gone**, not 404, for a slug that was once published. It tells search engines the page is deliberately retired rather than temporarily broken.

**Publish is guarded.** A product cannot move to `published` without: a name, a slug, a category, at least one variant with a price, at least one image, and the legally required fields of §7. The guard lives in the service, so it applies whether the call came from the admin UI, a script, or a test.

---

## 6. Combo packs

Category 10 is structurally different: a combo contains other products.

Modelled as a normal product with a `bundle_items` join to the variants it contains. That gives it its own price, photograph and stock behaviour while remaining traceable to its contents.

Its availability is the **minimum** of its components. Selling a combo whose contents are out of stock is the failure this prevents.

Deferred until the catalogue is real — the shape is recorded so the schema does not have to change later, but no code is written for it in Phase 3.

---

## 7. Legal fields are part of the domain

Indian law requires specific information on packaged food. These are not optional metadata; a published product without them is non-compliant.

| Field | Required by |
|---|---|
| Name of the commodity | Legal Metrology (Packaged Commodities) Rules 2011, Rule 6 |
| Net quantity | Rule 6 |
| Manufacturer / packer name and address | Rule 6 |
| Month and year of manufacture | Rule 6 |
| Retail sale price, inclusive of all taxes | Rule 6 |
| Consumer care contact | Rule 6 |
| FSSAI licence number | FSS (Packaging & Labelling) Regulations |
| Veg / non-veg mark | FSS Regulations |
| Ingredients, in descending order by weight | FSS Regulations |
| Allergen declaration | FSS Regulations |
| Best before / use by | FSS Regulations |
| Storage conditions | FSS Regulations |

They live in `product_details`, one row per product, separate from `products` because they are read only on the product page and change on a different cadence from name and price.

**None of these are invented.** Where a value is unknown the field renders as "to be confirmed" — which is why the frontend already has a `PendingContent` component. A fabricated allergen declaration is a safety issue, not a content gap.

---

## 8. Availability

```ts
type Availability = "in_stock" | "low_stock" | "out_of_stock" | "enquire_only";
```

The frontend already uses these four. They are derived from `inventory`, not stored:

| Value | Condition |
|---|---|
| `in_stock` | quantity > low-stock threshold |
| `low_stock` | 0 < quantity ≤ threshold |
| `out_of_stock` | quantity = 0, tracking enabled |
| `enquire_only` | tracking disabled — wholesale, or `OQ-001` unresolved |

`enquire_only` is what the whole catalogue shows if the client chooses not to sell online. That decision changes the button, not the model.

---

## 9. Identity and URLs

| Concern | Decision |
|---|---|
| Primary key | UUID. Sequential ids leak volume |
| Public identifier | Slug, unique per level |
| Product URL | `/products/p/[slug]` — flat, so recategorising never breaks a link |
| Category URL | `/products/[category]` |
| Type URL | `/products/[category]/[type]` |
| SKU | Per variant, business-facing, never in URLs |

The flat product URL is the important one. If it were `/products/pickles/mango/mango-pickle`, moving a product between categories would break an indexed link. Slug changes keep a redirect from the old slug (`product_slug_history`).

---

## 10. What a product is not

- Not a variant. "Mango Pickle 200g" is a variant of "Mango Pickle".
- Not a type. If a type holds one product, the type page redirects rather than showing a list of one.
- Not a photograph. A product with three images is one product.
- Not a listing. A product appears on many surfaces and remains one row.

---

## 11. Open questions

| ID | Question | Blocks |
|---|---|---|
| `OQ-013` | Final category names and order | Taxonomy seed |
| `OQ-016` | The real product catalogue | Every product page |
| `OQ-049` | The real type layer per category | Taxonomy seed |
| `OQ-001` | Sell online, or enquire-only | Availability, cart, checkout |
| `OQ-063` | Are combo packs in scope at launch | Bundle schema |
