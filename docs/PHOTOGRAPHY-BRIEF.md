# Photography Brief — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/PHOTOGRAPHY-BRIEF.md` |
| Version | 0.1 |
| Date | 2026-09-07 |
| Status | **Blocking `OQ-017`** — the highest visual-quality risk in the project |

---

## 1. Why this document exists first

The brief asks for a website that reads as a premium, established food brand. **Photography is what delivers that, more than layout, typography or code.** A well-engineered site with stock images of anonymous produce looks exactly like the template sites the client explicitly does not want.

There is no way to compensate for missing photography in code. This is therefore the longest-lead-time item in the project and it starts now, in parallel with design.

---

## 2. What we need to know first

| Question | Why |
|---|---|
| Does professional photography already exist? | Determines whether we shoot or curate |
| If so — resolution, format, rights, consistency? | Web-usable assets need ≥ 2400px and clear usage rights |
| Is there packaging? Is it final? | Pack shots are the single most important image type |
| Is there a facility we can photograph? | Process imagery is what makes the Quality page credible |
| Budget for a commissioned shoot? | Determines scope: full shoot vs phased |
| Who owns the products physically, and where? | Shoot logistics |

→ `OQ-017`, `OQ-018`.

---

## 3. Shot list

### 3.1 Per product — the minimum viable set

For **every** SKU, four images. This is the floor, not the ambition.

| # | Shot | Purpose | Ratio | Notes |
|---|---|---|---|---|
| 1 | **Pack shot** | The product as sold | 1:1 | Straight-on or slight 3/4. Label legible. Consistent placement across the catalogue so the grid reads as a system |
| 2 | **Contents** | What is actually inside | 1:1 | Product out of the pack — powder, pieces, seeds — on a warm neutral surface |
| 3 | **Macro / texture** | Quality proof | 1:1 or 4:5 | Close enough to see grain, colour and consistency. This is what makes a food product feel real |
| 4 | **In use** | Context and scale | 4:5 | In a bowl, in a dish, being spooned, being mixed |

### 3.2 Per category — one hero each (10 total)

An editorial image representing the category, wide enough to crop for both a 16:9 desktop hero and a 4:5 mobile hero. Ingredients in composition, or the process that defines the category — sun-drying racks for vadiyalu, pickle jars in row, millets in open sacks.

### 3.3 Brand and process — 15–25 images

The images that make About, Quality and the homepage credible. **These cannot be substituted with stock.**

| Subject | Notes |
|---|---|
| Raw material arriving / being sorted | Sourcing story |
| Inspection and grading | Quality proof |
| Processing — dehydration, milling, drying | The core of the Quality page |
| Hands at work | Close, working hands. **Not posed portraits** |
| Packing and sealing | Hygiene and care |
| Finished stock, shelved | Scale and capability |
| Facility exterior and interior | Proves physical existence |
| Ingredient still lifes | Editorial section imagery |
| Homepage hero — 2 to 3 options | The single most important image on the site |

### 3.4 Combo packs

Each combo photographed as a group, arranged, plus one flat-lay overhead.

**Total estimate:** roughly `(SKU count × 4) + 10 + 25` images. For 30 SKUs that is about **155 final images** — a two- to three-day shoot plus retouching.

---

## 4. Visual treatment

Consistency across the whole catalogue matters more than any individual image. One setup, one background family, one grade.

| Aspect | Direction |
|---|---|
| **Light** | Natural or naturalistic, single directional source, soft but real shadows. **Never** flat ring-light, never on-camera flash, never a hard studio white-out |
| **Background** | Warm neutrals: unbleached linen, textured paper, stone, aged wood, jute, terracotta. Pack shots may use a clean warm off-white — never pure `#FFFFFF` cut-out |
| **Colour** | Warm, accurate, appetising. Turmeric must read as turmeric. No teal-and-orange grade, no heavy filters, no oversaturation |
| **Composition** | Generous negative space. Product off-centre. Overhead and 3/4 angles. Room to crop for multiple ratios |
| **Styling** | Show material honestly — a spill of powder, a scatter of seed, a spoon left in the bowl. Considered, not sterile; styled, not staged |
| **People** | Hands only. Working, not modelling. No stock-photo smiles |
| **Props** | Restrained and Indian-appropriate — brass, steel, ceramic, cloth, wood. No Western-styled marble-and-eucalyptus flat-lays |

**Reference the client's own product and place.** The most valuable thing this photography can do is look like *Burla's* products in *Burla's* setting, not like any premium food brand anywhere.

---

## 5. Technical specification

| Requirement | Value |
|---|---|
| Capture | RAW, full-frame preferred |
| Delivery | 16-bit TIFF or high-quality JPEG, sRGB, **minimum 2400px on the long edge** (3000px preferred for hero and macro) |
| Ratios | Shoot loose enough to crop 1:1, 4:5, 3:2 and 16:9 from the same frame |
| Retouching | Dust and blemish removal, colour accuracy, consistent grade. **No liquify, no fake steam, no composited product** |
| Naming | `product-slug-01-pack.jpg`, `category-slug-hero.jpg`, `process-drying-01.jpg` |
| Rights | Full, perpetual, worldwide commercial usage transferred to Burla, in writing |
| Delivery format | Organised folders per product/category, plus a contact sheet |

**Web pipeline (our side):** upload through the admin media library → stored in Cloudflare R2 → AVIF/WebP with responsive `srcset` via `next/image` → LQIP blur placeholder generated at upload → explicit `sizes` per usage. Delivered originals are never served directly.

---

## 6. Alt text

Every image needs alt text written by whoever knows the product. It is a required field in the CMS — a product cannot be published without it.

| Image | ✅ Good alt text | ❌ Bad |
|---|---|---|
| Pack shot | "250g pack of Burla dehydrated mango powder" | "product image" |
| Contents | "Bright orange mango powder in a ceramic bowl" | "mango" |
| Macro | "Close-up of fine mango powder showing even texture" | "IMG_2043" |
| Process | "Sliced mango on drying racks in a covered facility" | "our process" |
| Decorative | `alt=""` | "decorative image" |

---

## 7. If photography cannot happen before launch

Ranked options. **Option 1 is strongly preferred.**

1. **Phase the shoot.** Homepage hero + all 10 category heroes + top 10 SKUs first (a one-day shoot). Launch with those categories fully populated and the rest unpublished. Shoot the remainder in a second pass. A smaller, complete catalogue beats a large, half-illustrated one.
2. **Controlled in-house photography.** With a written setup guide — a window, a diffuser, a neutral cloth, a tripod, a recent phone — the pack and contents shots are achievable in-house at acceptable quality. Macro and process imagery are not. We can supply the guide.
3. **Design around absence.** Typographic and illustrative category treatments in place of photography. This is a deliberate art-directed choice and can look intentional — but it caps how premium the site can feel, and product pages still need a real pack shot.
4. **Stock imagery.** ❌ **Not acceptable as a final production asset.** It will be visible, it will read as generic, and it directly contradicts the brief. If used at all, it is a clearly marked placeholder with a removal date.

---

## 8. Checklist before Phase 8

- [ ] `OQ-017` answered — photography exists, or a shoot is commissioned with a date
- [ ] Photographer briefed with this document
- [ ] Shot list finalised against the actual SKU list
- [ ] Packaging final, or the shoot scheduled after packaging is final
- [ ] Usage rights agreed in writing
- [ ] Homepage hero options delivered — Phase 8 cannot complete without one
- [ ] Alt text written for every delivered image
- [ ] Assets uploaded through the admin media library with alt text set
