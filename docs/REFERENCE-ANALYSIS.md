# Reference Site Analysis — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/REFERENCE-ANALYSIS.md` |
| Version | 0.1 |
| Date | 2026-09-07 |
| Sites reviewed | hillpureorganic.com · organicindia.com |
| Method | Live inspection of homepage structure, product presentation, navigation, copy and footer compliance |

Supplied by the client as reference. Reviewed to find what to learn from, what to avoid, and where the gap is.

---

## 1. Summary

| | Hillpure Organic | Organic India |
|---|---|---|
| **Platform** | Shopify | Custom/enterprise |
| **Ownership** | Independent, Uttarakhand | Tata Consumer Products |
| **Scale** | Small brand | National, mass-market |
| **Relevance to Burla** | **Direct peer** — regional Indian produce, similar category breadth, similar stage | **Aspirational reference** — what scale looks like, not what to copy |
| **Categories** | 19 | Category / Condition / Goal, plus combos |
| **Design quality** | Template. Reads as a marketplace listing | Competent, polished, but conventional ecommerce |
| **Positioning** | "Organic, natural, hill produce" | "Wellness, ayurveda, health outcomes" |
| **FSSAI licence displayed** | ❌ Not found | ❌ Not found |

**The headline finding: the premium editorial position is unoccupied.** Neither reference reads as a *brand*. Both read as *shops*. The direction proposed in `DESIGN-SYSTEM.md` is not a stylistic preference — it is the available competitive gap.

---

## 2. Hillpure Organic — the direct peer

### 2.1 What it gets right

| Strength | Why it matters for Burla |
|---|---|
| **A real story** — "create a national and international marketplace for Indian marginal farmers, especially hill farmers… enhancing the living standards of hill farmers" | This is genuinely differentiating and emotionally strong. Burla needs its equivalent (`OQ-020`) |
| **"Meet Our Farmers" and "Women Empowerment" pages** | Sourcing provenance as a trust asset, not a marketing slogan |
| **Regional specificity** — Munsyari Rajma, Gahat Dal, Kala Bhatt, Pahadi | They keep the local names. Validates our rule on vadiyalu/sandige (`OQ-012`) |
| **Complete contact block** — full address, four phone numbers, email | Signals a real business |

### 2.2 What it gets wrong — and what Burla must not repeat

| Problem | Observed | Consequence |
|---|---|---|
| **"100% NATURAL" on every category card** | All 19 categories carry the identical label | A claim on everything is information on nothing. It becomes wallpaper |
| **Emoji as design** | `🌿 SHOP BY CATEGORY 🌿` | Instantly reads as a template. Already banned in `DESIGN-SYSTEM.md` §2 |
| **Keyword-stuffed product names** | *"Hillpure Organic Grown By Mother Nature Cold Pressed White Sesame 250 Ml, 100% Pure & Unrefined, Multipurpose Edible Oil, Daily Cooking Oil, Keto Friendly, Naturally Cholesterol Free, Rich In MUFA & Omega-6 PUFA"* | This is an Amazon listing title on a brand website. Unreadable in a card, impossible to typeset, destroys any premium impression |
| **Permanent discount theatre** | `SAVE 52%`, ₹599 → ₹290, across essentially the whole catalogue | When everything is half price, the MRP is not credible — and neither is the brand. Also carries Legal Metrology exposure if the struck-through price is not a genuine MRP |
| **The same products repeated three times** | "Popular Products", "Best Selling", "Bestsellers" — same rails, same items | Padding. Signals a thin catalogue rather than a curated one |
| **Health claims in product names** | "Anti-Inflammatory", "Pain Relief", "Naturally Cholesterol Free", "Keto Friendly" | **Regulatory exposure.** Unsubstantiated health claims on food are prohibited under the FSS Act |
| **The story is in the footer** | Vision, farmers and women's empowerment are footer links | The best asset they have is the least visible thing on the site |

### 2.3 The single most important lesson

Hillpure has **better raw material than its website communicates**. Real hill produce, real farmer sourcing, real regional specificity — presented as a discount grocery listing.

**Burla is at risk of exactly the same outcome.** The difference will be made by photography, product naming and restraint, not by features.

---

## 3. Organic India — the scale reference

### 3.1 What is worth borrowing

| Idea | Assessment for Burla |
|---|---|
| **Multi-axis navigation** — Shop by Category / Condition / Goal | ✅ Adopt the principle, not the axes. Burla's second axis should be **use**, not health (see §3.3) |
| **Combo packs as a headline nav item** — "Super Saver Combos" first in the menu | ✅ **Strongly validates the client's combo-packs category.** Combos raise basket value and solve the "where do I start?" problem for new visitors |
| **Short, brandable product names** — "Organic Moringa Powder", "Bilona Cow Ghee", "Tulsi Green Tea Classic" | ✅ **Adopt.** Exactly the opposite of Hillpure. Name for humans; put keywords in the SEO fields |
| **Variant selection on the product card** — 100g / 200g / 100g × 2 | ✅ Adopt. Removes a click for repeat buyers. Fits Burla's pack-size model directly |
| **Trust architecture in the footer** — Certifications, Meet the Farmers, Store Locator, Press | ✅ Adopt the pattern. Burla's equivalent is Quality & Standards, Our Locations, About |
| **Dedicated international and B2B channels** — `export@`, `gifting@` | ✅ **Directly relevant to "Global Agri Products".** A named export contact is a low-cost B2B signal |
| **Explicit pack-size labelling everywhere** | ✅ Adopt. Weight is a spec, and specs build trust |

### 3.2 What not to borrow

| Pattern | Why not |
|---|---|
| An `X% OFF` badge on **every** product | Same credibility problem as Hillpure, at larger scale |
| Density — hundreds of products above the fold | Works for a mass wellness catalogue with brand recognition. It would flatten an unknown premium brand |
| Supplement/capsule visual language | Burla is food, not nutraceuticals. Borrowing it would misposition the brand |
| Cookie banner that covers the viewport | Ours must not obscure content or cause layout shift (`SEO.md` §7) |

### 3.3 "Shop by Health Concern" — attractive, and a trap

Organic India runs a second navigation axis on health outcomes: Gut Care, Immunity, Sleep Care, Heart Care, Joint Care, Metabolism.

**Commercially it is excellent** — it matches how people actually search. **For Burla it is a liability**, because every one of those labels is a health claim requiring substantiation under the FSS Act, and Burla sells food, not formulated supplements.

**The safe equivalent — recommended:**

| Instead of a health axis | Use a use-case axis |
|---|---|
| Immunity Care | **Everyday Cooking** |
| Gut Care | **Snacking** |
| Metabolism | **Traditional & Festive** |
| Sleep Care | **Gifting & Combos** |
| Nutrition Support | **Travel & Ready-to-Use** |

Same merchandising benefit — helps a visitor who does not yet know which category they need — with **zero regulatory exposure and no invented claims.** Logged as `OQ-042`.

---

## 4. The compliance finding

**Neither site displays an FSSAI licence number, a GSTIN, or a grievance officer in its footer.** Organic India's footer carries a Tata Consumer contact and toll-free number; Hillpure's carries an address, phone numbers and email — but neither carries the statutory identifiers.

Two conclusions:

1. **This is a genuine differentiator.** A visible FSSAI licence, GSTIN, entity name and named grievance officer costs nothing and signals seriousness that neither reference conveys. For a buyer evaluating an unknown food brand, it is exactly the reassurance they are looking for. For a wholesale or export buyer, it is table stakes.
2. **It does not make it optional for Burla.** That competitors omit it is not a defence. The requirements in `SECURITY.md` §8 stand — `OQ-003` remains blocking.

---

## 5. What this changes in our documentation

| # | Change | Where |
|---|---|---|
| 1 | **Product naming policy** added — short human names, keywords confined to SEO fields | §6 below; `CONTENT-INVENTORY.md` §3 |
| 2 | **Pricing presentation policy** added — no permanent discount theatre | §7 below |
| 3 | **Combo packs promoted** — from a category to a merchandising pillar with homepage presence | `SITEMAP.md`, `REQUIREMENTS.md` FR-026 |
| 4 | **Second navigation axis proposed** — by use, not health | `OQ-042` |
| 5 | **Variant selection on product cards** confirmed as a pattern | `DESIGN-SYSTEM.md` §7.2 |
| 6 | **Export/B2B contact channel** — a named export email, not just a form | `OQ-043` |
| 7 | Anti-pattern list extended with observed real-world examples | `DESIGN-SYSTEM.md` §2 |
| 8 | Provenance and sourcing confirmed as the strongest available story | `CONTENT-INVENTORY.md` §6 |

---

## 6. Product naming policy `[PROPOSED]`

Directly informed by the contrast between the two references.

**Rule: name products for a person reading a shelf, not for a search engine.**

| ✅ Do | ❌ Don't |
|---|---|
| `Mango Powder` | `Burla Global Agri Products 100% Natural Premium Sun-Dried Mango Powder 250g Rich in Vitamin C No Preservatives` |
| `Andhra Avakaya Pickle` | `Traditional Authentic Homemade Style Andhra Special Mango Avakaya Pickle Achar 500g Premium Quality` |
| `Little Millet` | `Organic Natural Little Millet Samai Kutki Healthy Grain Gluten Free Diabetic Friendly 1kg` |

**Structure**

| Field | Purpose | Length |
|---|---|---|
| `name` | What it is. Brand-first thinking | 2–4 words |
| `short_descriptor` | One line of appetite or context | ≤ 90 characters |
| `variant.label` | Pack size, shown separately | "250g" |
| `search_keywords[]` | Regional names, synonyms, alternate spellings — **invisible to the reader, fully indexed** | Unlimited |
| `seo_title` | Where keyword targeting lives | ≤ 60 characters |

This gets the SEO benefit without paying the brand cost. Hillpure pays the brand cost on every single card.

---

## 7. Pricing presentation policy `[PROPOSED]`

Both references badge nearly every product with a discount. It is the default Shopify behaviour and it is corrosive.

| Rule | Reason |
|---|---|
| A struck-through price appears **only** when it is a genuine MRP and the product is genuinely on offer | Legal Metrology requires MRP to be truthful; a permanent "discount" is not a discount |
| **No permanent site-wide discounting** | If everything is 50% off, the real price is the discounted one and the brand has told the customer its MRP is fiction |
| Discount badges are used sparingly and are time-bound | Scarcity only works when it is true |
| Combo packs may show genuine bundle savings | This is a real saving and reads as such |
| **No countdown timers, no "only 2 left" unless true, no fake urgency** | Already in `DESIGN-SYSTEM.md` §7.2 |

If the client's commercial model genuinely requires permanent discounting, say so and we will design for it honestly — but it should be a decision, not an accident of the platform default. Logged as `OQ-044`.

---

## 8. Where Burla wins

Neither reference occupies these positions. All are achievable and none require inventing anything:

1. **Editorial art direction** — restraint, whitespace, typography, real photography. Both references are dense grids.
2. **Visible compliance** — FSSAI, GSTIN, entity, grievance officer, complete product declarations. Neither reference does this.
3. **Complete, honest product information** — ingredients, net weight, shelf life, storage, origin, on every product page. Hillpure puts a fragment of it in the title; Organic India puts pack size only.
4. **Process transparency** — a real Quality & Standards page showing how the food is actually made. Both references gesture at sourcing; neither documents process.
5. **Named regional identity** — vadiyalu, sandige, podi, kept as the products' real names with the explanation alongside. Hillpure does this well and is the model to follow here.
6. **A serious B2B path** — Organic India has an export email; Hillpure has nothing. A proper wholesale landing page with a structured enquiry form is an open goal for a company named "Global Agri Products".
7. **Speed and accessibility** — both references carry heavy template overhead.

---

## 9. Open questions raised by this review

| ID | Question |
|---|---|
| `OQ-042` | Do you want a second navigation axis (Shop by Use — Everyday Cooking, Snacking, Traditional & Festive, Gifting)? Recommended over a health-based axis, which would require substantiated claims |
| `OQ-043` | Should we publish dedicated `export@` and `wholesale@` addresses alongside the enquiry forms? |
| `OQ-044` | What is your pricing and discount strategy? Genuine MRP with occasional offers, or the permanent-discount model both references use? This is a brand decision with legal implications |
| `OQ-045` | How prominent should combo packs be? Organic India leads its navigation with them. Recommendation: a homepage section plus a top-level category |
| `OQ-046` | Is there a farmer/producer sourcing story? Hillpure's marginal-farmer narrative is their strongest asset — does Burla have an equivalent, and is it factually supportable? |
