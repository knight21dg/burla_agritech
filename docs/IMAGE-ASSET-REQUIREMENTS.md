# Image Asset Requirements — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/IMAGE-ASSET-REQUIREMENTS.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | **Blocking. No product page can ship without at least one real image.** |
| Owner | Client, with our support on shot direction |

> The client's instruction is explicit: *"Pure original authentic images for the
> products."* This document turns that into a shot list, a specification and a
> tracking sheet.

---

## 1. The rule, and why it is absolute

**Only real photographs of real Burla products appear on this website.**

Not permitted, under any circumstance:

- Stock photography standing in for a Burla product
- AI-generated food or packaging images
- Rendered or mocked-up packaging
- A competitor's or supplier's photograph
- A photograph of a similar product from a different producer
- Colour-graded images that misrepresent the actual product

This is not only a design preference. For a food business it is a legal and
trust question: an image that misrepresents what arrives in the box is a
consumer-protection problem, and it is the fastest way to lose a customer who
was deciding whether to believe you.

**Where a real image does not exist yet**, the site renders a plainly neutral
placeholder — a light grey panel carrying the product name. It does not imitate
a photograph and it does not invent packaging. This is deliberate: an obvious
gap is honest, a convincing fake is not.

---

## 2. Priority order

Photography has the longest lead time in the project. If budget or time is
limited, shoot in this order:

| Priority | What | Why |
|---|---|---|
| **P1** | One pack shot per product | Without this there is no catalogue |
| **P2** | One image per category | The homepage and `/products` need these |
| **P3** | One hero image | The homepage's largest element |
| **P4** | Product close-up (contents out of pack) | The single biggest conversion lift on a food PDP |
| **P5** | Back-of-pack (label legible) | Lets customers verify ingredients themselves |
| **P6** | Raw material / ingredient | Supports the sourcing story |
| **P7** | In-use / serving | Aspirational, nice to have |
| **P8** | Facility, process, team | About and Quality pages |

**P1 and P2 are launch-blocking.** Everything from P4 down can arrive after
launch and be added through the admin.

---

## 3. Per-product shot list

The ideal set is five images. **Design gracefully degrades to one** — the
gallery, thumbnails and zoom all adapt rather than showing empty slots.

| # | Shot | Framing | Required |
|---|---|---|---|
| 1 | **Front pack** | Whole pack, front label square to camera, centred, even margin | ✅ **Yes** |
| 2 | **Back pack** | Label legible enough to read ingredients | Strongly recommended |
| 3 | **Product close-up** | Contents outside the pack — the powder, the pickle, the crisps | Strongly recommended |
| 4 | **Raw material** | The fruit, grain or spice before processing | Optional |
| 5 | **In use** | Served, cooked or being used | Optional |

### Consistency matters more than perfection

Twenty products photographed identically on a plain background look
professional. Twenty products photographed beautifully but each differently
look like a marketplace listing. **One setup, one background, one light, one
distance — for the entire catalogue.**

---

## 4. Category images

One per category, ten total. These carry the homepage and `/products`.

- Show the **category**, not one product from it — a spread of pickles rather than a single jar
- Landscape **4:3**
- Same lighting and background family as the product shots
- No text, no logo, no graphic overlay — the interface adds the label

---

## 5. Hero image

One image, the largest thing on the site.

- Landscape, **3:2 or 16:9**, minimum 2400px wide
- Shows real Burla product — a considered arrangement of packs, or one product presented well
- **Composed with empty space on one side** for the headline and buttons, which are real HTML
- **No text baked into the image.** Baked-in type cannot be translated, resized or read by a screen reader, and it is a WCAG 1.4.5 failure

> ⚠️ **The current homepage violates this.** It uses `logos/landing page.png`,
> an AI-generated composite with the headline, tagline, four pillars and CTA
> baked into the pixels. It conflicts with this document on four counts. See
> `OQ-051` — this needs a decision.

---

## 6. Technical specification

| Property | Requirement |
|---|---|
| Format from client | JPEG or PNG. RAW/TIFF welcome |
| Colour space | sRGB |
| Resolution | Product ≥ 2000×2000px · category ≥ 2400×1800px · hero ≥ 2400px wide |
| Compression | Minimal — we handle optimisation |
| Orientation | Correct in-camera; no reliance on EXIF rotation |
| Background | White or very light neutral, consistent |
| File naming | `product-slug--01-front.jpg`, `category-pickles--hero.jpg` |
| Delivery | Google Drive / Dropbox / WeTransfer folder, one folder per category |
| Rights | Client must own or have licence for all supplied images |

### Our pipeline

Upload through the admin → stored in object storage → served via `next/image`
as AVIF with WebP fallback, responsive `srcset`, explicit `sizes`, blur
placeholder generated at upload, lazy loading below the fold, `priority` on the
LCP image only, explicit dimensions so layout shift stays at zero.

**Alt text is a required field.** A product cannot be published without it.

---

## 7. Shooting guidance

For a phone or an in-house shoot, this gets 80% of the way there:

- **Light:** a large window, indirect. Never direct flash, never overhead office fluorescents
- **Background:** a large sheet of white or light grey card, curving up behind the product so there is no visible corner
- **Position:** product centred, camera level with the pack's midpoint, not looking down
- **Distance:** the same for every product, so packs stay comparable in scale
- **Colour:** shoot a plain white card in the first frame so we can correct white balance
- **Steady:** tripod or a stable surface; use a timer
- **Do not:** apply filters, use portrait/bokeh mode, add props that compete, or crop tightly

Turmeric that photographs orange, or pickle that photographs brown, is worse
than no photograph.

---

## 8. Tracking sheet

Fill in as assets arrive. **A product is not launch-ready until "Front pack" is ✅.**

| Product | Front | Back | Close-up | Raw | In use | Status |
|---|---|---|---|---|---|---|
| *(awaiting product list — `OQ-016`)* | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Blocked |

| Category | Image | Status |
|---|---|---|
| Dehydrated Powders & Flakes | ⬜ | Blocked |
| Dehydrated Fruits | ⬜ | Blocked |
| Pickles | ⬜ | Blocked |
| Spiced Dal Powders | ⬜ | Blocked |
| Sandige / Crisps / Vadiyalu | ⬜ | Blocked |
| Dry Fruits | ⬜ | Blocked |
| Millets | ⬜ | Blocked |
| Herbal Tea & Coffee | ⬜ | Blocked |
| Masala Powders | ⬜ | Blocked |
| Combo Packs | ⬜ | Blocked |

| Other | Image | Status |
|---|---|---|
| Homepage hero | ⬜ | Blocked — see `OQ-051` |
| About / company | ⬜ | Optional |
| Quality / process | ⬜ | Optional |

---

## 9. Open questions

| ID | Question |
|---|---|
| `OQ-017` | Does professional product photography already exist? In what form, and who owns the rights? |
| `OQ-051` | The supplied `landing page.png` is AI-generated with baked-in text. Keep it as an interim hero, or replace it with a real photograph? |
| `OQ-052` | Will photography be commissioned, or shot in-house? Is there a budget and a date? |
| `OQ-053` | Does packaging artwork exist and is it final? Photographing a pack that is about to change wastes the shoot |
| `OQ-054` | Are there existing farm, facility or team photographs we may use? |
