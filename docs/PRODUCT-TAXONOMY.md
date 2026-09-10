# Product Taxonomy — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/PRODUCT-TAXONOMY.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | **Structure proposed. Contents blocked on client data (`OQ-016`).** |

> **Nothing in this document invents a product, a type or a price.** The
> examples marked `[ILLUSTRATIVE]` show how the interface behaves; they are not
> claims about what Burla sells. The real taxonomy comes from the client.

---

## 1. The model

The client has asked for browsing that goes:

```
CATEGORY  →  TYPE  →  PRODUCT
```

with an example of **Pickles → Mango / Lemon / Gongura → individual products**.

The data model supports three levels, but the interface **collapses a level
when it would add a click without adding clarity**. Forcing every category
through a type page would make a category of four products feel like a
bureaucracy.

### 1.1 Rendering rules

| Condition | Category page shows | Rationale |
|---|---|---|
| Category has **no types** | Product grid directly | No hierarchy to explain |
| Category has types, but **< 8 products total** | Type chips as *filters* above one product grid | Everything stays on one page; the type structure is still visible |
| Category has types and **≥ 8 products** | Type cards → dedicated type pages | The hierarchy now earns its click |
| A type has **1 product** | Type links straight to that product | Never a page containing one card |

These thresholds are a starting proposal (`OQ-048`). They should be reviewed
once the real catalogue size is known — a 40-SKU catalogue and a 400-SKU
catalogue want different answers.

### 1.2 Why not always three levels

The client's brief says *"do not force unnecessary hierarchy if the catalogue is
small — UX should be based on actual product count."* This section is that
instruction expressed as a rule the code can follow.

---

## 2. Categories — confirmed

These ten come from the client's product catalogue of 2026-09-10, which
replaced the handwritten sheet's list (Spiced Dal Powders, Sun-Dried Crisps,
Millets, Herbal Tea & Coffee and Combo Packs are gone; Spices is new).
Names are exactly as the client wrote them. The full list, with the items
awaiting confirmation, is in `docs/PRODUCT-DOMAIN.md` §3.

| # | Category | Slug | Types |
|---|---|---|---|
| 1 | Dehydrated Powders & Flakes | `dehydrated-powders-flakes` | Powders, Flakes |
| 2 | Dehydrated Fruits | `dehydrated-fruits` | Flat |
| 3 | Pickles | `pickles` | Veg Pickles, Non-Veg Pickles |
| 4 | Dal Powders | `dal-powders` | Flat |
| 5 | Crisps | `crisps` | Flat |
| 6 | Dry Fruits | `dry-fruits` | Flat |
| 7 | Millet Powders | `millet-powders` | Five, one per millet |
| 8 | Tea / Coffee | `tea-coffee` | Flat |
| 9 | Masala Powders | `masala-powders` | Flat |
| 10 | Spices | `spices` | Flat |

Slugs are **permanent** once published. `OQ-013` must be answered before any
category page ships.

---

## 3. Type layer — from the client's catalogue

The client's catalogue of 2026-09-10 divides three categories; the other seven
list products directly, with no type in between.

```
Dehydrated Powders & Flakes
├── Powders
└── Flakes

Pickles
├── Veg Pickles
└── Non-Veg Pickles

Millet Powders
├── Foxtail / Korralu    → Foxtail / Korralu Powder
├── Little / Samalu      → Little / Samalu Powder
├── Kodo / Arikalu       → Kodo / Arikalu Powder
├── Barnyard / Udalu     → Barnyard / Udalu Powder
└── Andukorralu          → Andukorralu Powder
```

The millets follow the hierarchy the client gave ("Millet Powders → Foxtail /
Korralu → Product"): each millet is a type, holding its powder. The product
names come from the client's product sheet (2026-09-10). `OQ-049` (ingredient
versus form as the type axis) is settled by the catalogue itself: the millet
types are by ingredient.

---

## 4. Data shape

Mirrors `docs/DATABASE.md`. Types are a self-reference on the category table
rather than a separate entity, so a category can gain or lose a type layer
without a migration.

```
category
  id, name, slug, parent_id (null = top level),
  sort_order, description, hero_image_id, seo_*, status

product
  id, name, slug,
  category_id        -> the TYPE when one exists, else the CATEGORY
  primary_category_id-> always the top-level category, for breadcrumbs
  …

product_variant
  id, product_id, label ("250g"), sku, price_minor, stock, …
```

**Why two category references:** a product in *Pickles → Mango* must show
breadcrumbs as `Home / Pickles / Mango / Mango Pickle` and must also appear when
browsing all of Pickles. Storing the top-level category directly avoids a
recursive query on every page render.

### 4.1 Rules

- A category with `parent_id` set is a **type**. Same table, same editor, no new concept for staff to learn.
- Nesting is capped at **two levels**. A type cannot have a sub-type. If the catalogue ever needs that, it is a taxonomy problem, not a software one.
- Products attach to the deepest level available.
- Slug changes write a permanent 301 automatically.
- **Nothing in this hierarchy is hard-coded in a component** — it is queried and rendered generically, per the client's §26.

---

## 5. URLs

Per the client's §31:

| Page | URL | Example |
|---|---|---|
| All products | `/products` | |
| Category | `/products/[category]` | `/products/pickles` |
| Type | `/products/[category]/[type]` | `/products/pickles/mango` |
| Product | `/products/[category]/[type]/[product]` | *see decision below* |

### Decision: product URL shape

The client's example shows `/products/pickles/mango-pickle` — product nested
under category. That reads well, but it breaks if a product belongs to two
categories, and it changes the product's URL whenever it is recategorised.

**Recommendation:** products live at a flat `/products/p/[slug]`, or the
category-nested form is used with a strict rule that a product has exactly one
category. Flat is safer for SEO; nested is more readable.

**This needs a decision before any product page ships — `OQ-050`.** It is
effectively irreversible once URLs are indexed.

> Note: the current demo build uses `/shop` and `/products/[slug]`. Moving to
> `/products/...` is a routing change plus a redirect map. Cheap now, expensive
> after launch.

---

## 6. Breadcrumbs

Every product and type page carries a visible breadcrumb matching its URL, with
`BreadcrumbList` structured data mirroring it exactly.

```
Home / Pickles / Mango / Traditional Mango Pickle
```

Where a category has no type layer, the trail simply has one fewer step. The
client's §37 requirement — "the customer should never feel lost" — is largely
this component doing its job.

---

## 7. What the client must supply

Blocking. Detailed intake in `docs/CLIENT-ASSETS-REQUIRED.md` §3.

1. **Confirmed category names and display order** — `OQ-013`
2. **The real type layer per category**, or confirmation a category has none — `OQ-049`
3. **The full product list**, each mapped to its category and type — `OQ-016`
4. **Pack sizes and prices per product**
5. **Which products are featured** for the homepage carousel

Until 1–3 arrive, category and type pages can be built but not populated, and
no slug can be finalised.

---

## 8. Admin behaviour

Staff must be able to, without a developer:

- Create, rename, reorder and hide a category
- Add a type under a category, and move a type between categories
- Move a product between categories and types
- Delete a type — with the products beneath it reassigned first, never orphaned
- See a warning when renaming anything that would change a live URL, with the redirect created automatically

The three-level model is invisible to staff: they see "categories", some of
which sit inside others.
