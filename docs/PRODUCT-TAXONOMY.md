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

These ten come from the client's handwritten sheet and the approved mockup.
**No category has been added or removed.**

| # | Category | Proposed slug | Types expected? |
|---|---|---|---|
| 1 | Dehydrated Powders & Flakes | `dehydrated-powders-flakes` | Likely — by source vegetable/leaf |
| 2 | Dehydrated Fruits | `dehydrated-fruits` | Likely — by fruit |
| 3 | Pickles | `pickles` | **Yes — client gave this example** |
| 4 | Spiced Dal Powders | `spiced-dal-powders` | Possibly — by base |
| 5 | Sandige / Crisps / Vadiyalu | *pending `OQ-012`* | Possibly — by base grain |
| 6 | Dry Fruits | `dry-fruits` | Likely — by nut/fruit |
| 7 | Millets | `millets` | Likely — by millet, and by whole/flour |
| 8 | Herbal Tea & Coffee | `herbal-tea-coffee` | Possibly — tea vs coffee |
| 9 | Masala Powders | `masala-powders` | Likely — by dish |
| 10 | Combo Packs | `combo-packs` | Unlikely — flat |

Slugs are **permanent** once published. `OQ-013` must be answered before any
category page ships.

---

## 3. Type layer — `[ILLUSTRATIVE]` only

The shapes below show the *kind* of structure the interface expects. **Every
entry is a placeholder.** The client supplies the real list.

```
Pickles                          [ILLUSTRATIVE]
├── Mango
├── Lemon
├── Gongura
└── …

Dehydrated Fruits                [ILLUSTRATIVE]
├── Mango
├── Pineapple
├── Banana
└── …

Millets                          [ILLUSTRATIVE]
├── Ragi
├── Foxtail
└── …
   └── each possibly split whole grain / flour / rava
```

**Open question `OQ-049`:** for Millets and Dehydrated Powders, is the type
axis the *ingredient* (Ragi, Foxtail) or the *form* (whole, flour, rava)? It
cannot be both without a two-axis filter, which conflicts with the brief's
"avoid complicated filters". Our recommendation is **ingredient as the type,
form as a product variant**, because a customer looks for "ragi" before they
look for "flour".

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
