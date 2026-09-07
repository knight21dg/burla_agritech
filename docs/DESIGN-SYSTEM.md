# Design System & Art Direction — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DESIGN-SYSTEM.md` |
| Version | 0.2 — direction proposal, validated against reference sites |
| Date | 2026-09-07 |
| Status | Awaiting approval. Colour values are provisional until the vector logo arrives (`OQ-008`) |

---

## 1. Art direction

### 1.1 The idea

**"Processed with care, presented with restraint."**

Burla turns raw agricultural produce into shelf-stable food. The interesting tension in the brand is between the **raw** (soil, fruit, pulses, sun-drying, hand processes) and the **refined** (clean packs, precise weights, consistent quality). The design should hold both, not resolve to either. A site that is all rustic texture reads as a farmers' market stall; a site that is all clinical white reads as a chemical supplier.

**The resolution:** rustic in *photography and texture*, refined in *typography and grid*.

### 1.2 Reference language

Think closer to a premium pantry brand or a food-focused editorial publication than to a grocery store. Specifically:

- Large, confident, well-set type — a headline is allowed to be the hero.
- Photography that shows **material**: grain, powder, seed, oil, dust, weave.
- Generous, deliberate whitespace — not empty, but *paced*.
- Asymmetry. Off-centre compositions. Content that does not always start at the same left edge.
- Editorial devices: rules, captions, small caps labels, numbered sequences, pull quotes.
- Colour used **structurally** — a deep green section that anchors the page — rather than decoratively.

### 1.3 The five-second test

A visitor landing on the homepage should, within five seconds, be able to say: *"This is an Indian company that makes real food products, and they take it seriously."*

If a section does not contribute to that, it does not ship.

---

## 2. Anti-patterns — hard rules

These are review-blocking. A pull request containing any of them does not merge.

| ❌ Never | ✅ Instead |
|---|---|
| Green gradient backgrounds | Flat, considered colour fields |
| `rounded-2xl` / `rounded-3xl` on everything | Radius 2–8px; cards mostly square; radius is a signal, not a default |
| Drop shadows on every card | A 1px warm border, or a background-tone change |
| Glassmorphism, blur panels, neon | Solid, honest surfaces |
| Three identical `[icon] [heading] [text]` cards in a row | Varied layout: numbered sequence, alternating image/text, editorial list |
| Emoji as icons | Lucide, at consistent stroke width, or no icon at all |
| Generic stock photography of "happy farmer at sunset" | Real Burla product and process photography (`docs/PHOTOGRAPHY-BRIEF.md`) |
| Every section full-width, centred, same rhythm | Alternating full-bleed / contained / offset compositions |
| A heading above every section regardless of need | A section may open with an image or a statement |
| Scroll-triggered animation on every element | Motion only where it clarifies (see §9) |
| Purple/blue as accent | Warm earth tones only |
| A "100% NATURAL" style badge on every card *(observed on all 19 categories at hillpureorganic.com)* | A claim on everything is information on nothing. Say something specific, or say nothing |
| 40-word keyword-stuffed product names *(observed throughout hillpureorganic.com)* | Short human names; keywords live in SEO fields — `REFERENCE-ANALYSIS.md` §6 |
| A discount badge on every product *(observed on both reference sites)* | Genuine MRP, occasional real offers — `REFERENCE-ANALYSIS.md` §7 |
| The same product rail repeated under three headings *(observed at hillpureorganic.com)* | One curated rail with a reason to exist |
| Everything green | Green ≤ 20% of any viewport, except deliberate anchor sections |
| Text over a busy image with no scrim | Scrim, dedicated colour block, or a considered crop |
| `text-gray-500` on `white` for body copy | Tokens only; contrast verified |
| Placeholder Latin text shipped to production | Real copy or a clearly marked, tracked placeholder |

---

## 3. Colour

### 3.1 Source

The brand green is taken from the supplied logo. **The value below is sampled from a raster image and is provisional.** It must be replaced with the exact value from the vector file before Phase 7 (`OQ-008`).

### 3.2 Palette

```
BRAND
  --burla-green         #2E9E5B    provisional — logo green, brand identity
  --burla-green-deep    #0E3B23    anchor sections, reversed surfaces
  --burla-green-text    #1B6B3F    the only green permitted for body-size text

SURFACE
  --ivory               #FAF7F0    default page background
  --ivory-warm          #F2EDE2    alternating section background
  --paper               #FFFFFF    cards, elevated surfaces
  --sand                #E5DDCC    borders, dividers, subtle fills

INK
  --ink                 #1A1917    primary text
  --ink-muted           #5C574E    secondary text, captions
  --ink-faint           #8C8478    tertiary, disabled, metadata

ACCENT — use sparingly, one per view
  --terracotta          #B3542E    B2B/wholesale, alerts, editorial accents
  --turmeric            #C8901F    highlights, badges — large text only

FUNCTIONAL
  --success             #1B6B3F
  --warning             #A66A12
  --danger              #A32B1E
  --info                #2A5A6B
```

### 3.3 Verified contrast

Measured WCAG contrast ratios. Provisional pending the exact brand green.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `--ink` #1A1917 | `--ivory` #FAF7F0 | ~16.1:1 | ✅ AAA |
| `--ink-muted` #5C574E | `--ivory` | ~7.4:1 | ✅ AAA |
| `--ink-faint` #8C8478 | `--ivory` | ~3.6:1 | ⚠️ Large text and non-text only |
| `--burla-green-text` #1B6B3F | `--ivory` | ~6.1:1 | ✅ AA body |
| `--burla-green` #2E9E5B | `#FFFFFF` | ~3.4:1 | ⚠️ **Not valid for body text.** Large text (≥24px, or ≥18.66px bold), icons, borders and graphics only |
| `--ivory` | `--burla-green-deep` #0E3B23 | ~11.8:1 | ✅ AAA — reversed sections |
| `--terracotta` #B3542E | `#FFFFFF` | ~5.0:1 | ✅ AA body |
| `--turmeric` #C8901F | `#FFFFFF` | ~2.8:1 | ❌ Decorative fills only |
| `--turmeric` | `--burla-green-deep` | ~4.5:1 | ⚠️ Large text on dark only |

**The important consequence:** the logo green is *not* a text colour. This is normal for a brand green and is why `--burla-green-text` exists. Buttons using `--burla-green` as a fill carry white text — verify that combination separately (white on `#2E9E5B` is ~3.4:1, which passes for large/bold button labels at ≥18.66px bold but **not** at 14px). Primary buttons therefore use `--burla-green-deep` as the fill.

### 3.4 Colour proportion

Per viewport, roughly: **60% ivory/paper · 25% ink (type and photography) · 12% green · 3% accent.** Anchor sections (a full-bleed `--burla-green-deep` band) are the deliberate exception and should appear **once or twice per page, never more**.

### 3.5 Dark mode

**Not in V1.** The brand is warm-light by nature and a dark variant doubles the design and QA surface for a food catalogue. Tokens are defined as CSS custom properties so a dark theme remains possible later. `prefers-color-scheme` is not honoured in V1; the page declares `color-scheme: light`.

---

## 4. Typography

### 4.1 Three directions

Presented for selection. Each is technically sound; they differ in personality.

**Direction A — Editorial warmth (recommended)**
Display: **Fraunces** · Body/UI: **Instrument Sans**
A variable serif with optical-size and soft axes, paired with a modern, slightly narrow grotesque. Fraunces has genuine character at large sizes without being decorative; Instrument Sans keeps interface text crisp and dense. Reads premium and human. Best fit for the food-editorial direction.

**Direction B — Modern restraint**
Display: **Instrument Serif** · Body/UI: **Geist**
Higher contrast, more fashion-adjacent, cooler. Very clean. Slightly less "agricultural", slightly more "boutique".

**Direction C — Confident sans**
Display: **Bricolage Grotesque** · Body/UI: **Public Sans**
No serif at all. Contemporary, bolder, more product-brand than publication. Lowest risk, least distinctive.

**Recommendation: Direction A.**

All are open-source with clear licences and are self-hostable via `next/font` — no third-party font request, no FOUT, no privacy issue.

### 4.2 Type scale

Fluid, `clamp()`-based. Mobile → desktop.

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display` | 44 → 88px | 0.95 | −0.03em | 500 | Hero only, once per page |
| `h1` | 34 → 56px | 1.05 | −0.02em | 500 | Page title |
| `h2` | 26 → 38px | 1.15 | −0.015em | 500 | Section title |
| `h3` | 20 → 26px | 1.25 | −0.01em | 600 | Sub-section, card title |
| `h4` | 17 → 19px | 1.35 | 0 | 600 | Small headings |
| `body-lg` | 17 → 19px | 1.6 | 0 | 400 | Intros, lead paragraphs |
| `body` | 16 → 17px | 1.65 | 0 | 400 | Default |
| `body-sm` | 14 → 15px | 1.6 | 0 | 400 | Secondary |
| `caption` | 13px | 1.5 | 0.01em | 400 | Image captions, metadata |
| `label` | 12px | 1.4 | 0.10em | 600, uppercase | Eyebrows, section labels |
| `button` | 15px | 1 | 0.01em | 600 | All buttons |
| `nav` | 15px | 1 | 0 | 500 | Navigation |

### 4.3 Rules

- Measure: **60–75 characters** for body text. Enforced with `max-width`, not by hoping.
- Display face for `display`, `h1`, `h2` and pull quotes **only**. Everything else is the body face.
- Numerals: tabular in tables, prices and specifications; proportional in prose.
- No text below 12px anywhere. No `letter-spacing` on body copy.
- Indian product names (vadiyalu, sandige, podi) are set in the same face — never italicised as foreign words. They are the product's actual name.
- Minimum 16px on form inputs to prevent iOS zoom-on-focus.
- `font-display: swap` with a metric-matched fallback to keep CLS at zero.

---

## 5. Space, grid and layout

### 5.1 Spacing scale

4px base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128 · 160`. Nothing off-scale.

### 5.2 Section rhythm

| Breakpoint | Section padding (block) |
|---|---|
| Mobile | 64px |
| Tablet | 80px |
| Desktop | 96–128px |

Consecutive sections must not use identical padding and identical background — the eye needs variation to perceive structure.

### 5.3 Grid

- 12 columns, 24px gutter desktop / 16px mobile.
- Container max-width **1320px**; text-heavy content constrained to **720px**.
- Full-bleed permitted for imagery and anchor sections.
- A deliberate **asymmetric variant**: 5/7 or 4/8 splits for editorial sections, so the page does not read as a stack of centred blocks.

### 5.4 Breakpoints

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`

Verified at **320, 375, 390, 414, 768, 1024, 1280, 1440, 1920**. 320px is a hard floor — no horizontal scroll, no clipped content.

### 5.5 Radius and elevation

| Token | Value | Use |
|---|---|---|
| `radius-none` | 0 | Images, full-bleed, most product imagery |
| `radius-sm` | 2px | Inputs, badges, small controls |
| `radius-md` | 4px | Buttons, cards |
| `radius-lg` | 8px | Modals, drawers, sheets |
| `radius-full` | 9999px | Avatars, pills, the WhatsApp button only |

**Elevation is expressed with borders and background tone, not shadow.** Two shadows exist in total: `shadow-overlay` for modals/drawers, and `shadow-sticky` for the mobile bottom bar and the sticky header's scrolled state. No card shadows.

---

## 6. Photography direction

Detailed shot list in `docs/PHOTOGRAPHY-BRIEF.md`. The visual rules:

| Aspect | Direction |
|---|---|
| Light | Natural, directional, single source. Soft shadows with real edges. Never flat ring-light or on-camera flash |
| Background | Warm neutrals — linen, unbleached paper, stone, aged wood, jute. Never pure white cut-out except for pack shots |
| Colour | Warm, true to the product. Turmeric must look like turmeric. No teal-and-orange grading |
| Composition | Generous negative space; product placed off-centre; overhead and 3/4 angles |
| Styling | Show the material — spill the powder, scatter the seed, leave a spoon in. Immaculate is not the goal; *considered* is |
| Human presence | Hands, not faces. Working hands, in-process. Avoid posed portraits |
| Consistency | One lighting setup, one background family, one grade across the entire catalogue |

**Aspect ratios:** product pack shot 1:1 · lifestyle 4:5 (mobile-friendly) · category hero 16:9 desktop / 4:5 mobile art-directed crop · editorial 3:2.

**Technical:** AVIF with WebP fallback, `next/image` with explicit `sizes`, responsive `srcset`, LQIP blur placeholder generated at upload, `priority` on the LCP image only, everything else lazy.

---

## 7. Component specifications

### 7.1 Button

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--burla-green-deep` | `--ivory` | none | One per view. The main action |
| Secondary | transparent | `--ink` | 1px `--ink` | Alternative action |
| Tertiary | transparent | `--burla-green-text` | none, underline on hover | Inline, low emphasis |
| WhatsApp | `#25D366` | `#0B2E13` | none | WhatsApp actions only |
| Destructive | `--danger` | white | none | Delete, cancel order |

Height 44px (default) / 52px (large) / 36px (small). Horizontal padding 24px. Radius 4px. Focus: 2px outline offset 2px in `--ink`, ≥3:1 against both the button and the page. States: default, hover, active, focus-visible, disabled, loading (spinner replaces the label, width preserved, `aria-busy`).

### 7.2 Product card

```
┌─────────────────────┐
│                     │
│    product image    │  1:1, no radius, subtle warm bg
│                     │
├─────────────────────┤
│ CATEGORY            │  label token, ink-faint
│ Product Name        │  h4
│ Short descriptor    │  body-sm, ink-muted, max 2 lines
│ 250g · ₹XXX         │  body-sm, tabular numerals
│ [ CTA ]             │  appears on hover (desktop) / always (mobile)
└─────────────────────┘
```

Where a product has multiple pack sizes, the card may expose them as small selectable chips (a pattern that works well on organicindia.com) — this removes a click for repeat buyers without adding visual noise.

Rules: at most **five** pieces of information. No badge stacks. No star ratings unless real reviews exist. No countdown timers. No "only 2 left!" unless it is true. The whole card is one link; nested interactive elements use proper markup, never a link inside a link. Price is omitted entirely — not shown blank — when no price exists.

### 7.3 Category card

Large image, name overlaid or beneath, product count optional. Sized generously — a category is a destination, not a chip. Mobile: horizontally scrollable with a visible edge-peek so the affordance is obvious, or a 2-column grid.

### 7.4 Other components

| Component | Notes |
|---|---|
| Input | 44px, 1px `--sand` border, `--paper` fill, 16px text, label always visible (never placeholder-as-label), error text below with `aria-describedby` |
| Select | Radix Select; native on mobile |
| Mega menu | Radix Navigation Menu; keyboard and screen-reader correct |
| Drawer / sheet | Radix Dialog; focus trap, scroll lock, `Esc` to close, focus restored |
| Modal | Radix Dialog; `aria-labelledby`; no nested modals |
| Toast | Bottom-right desktop, bottom mobile; `role="status"`; auto-dismiss 5s except on errors |
| Badge | Small, rectangular, 2px radius; only for real status — New, Out of stock, Bestseller (only if measured) |
| Breadcrumb | `nav` + ordered list, `aria-label="Breadcrumb"`, current page marked `aria-current` |
| Accordion | Radix Accordion; used for product information on mobile |
| Table | Product specification tables only; horizontally scrollable with a visible affordance on mobile |
| Skeleton | Matches final dimensions exactly; `--ivory-warm` fill; no shimmer animation under `prefers-reduced-motion` |
| Empty state | Illustration or photograph + one line + one action |
| Error state | Plain language + retry + WhatsApp fallback |

---

## 8. Section patterns

To keep pages varied, sections are composed from this vocabulary — with a hard rule that **no two adjacent sections may use the same pattern**.

| Pattern | Description |
|---|---|
| `hero-editorial` | Full-bleed image, type overlaid in a scrim or offset panel |
| `hero-split` | 50/50 or 40/60 type and image |
| `category-grid` | Image-led category cards |
| `story-alternating` | Image/text pairs alternating side, 5/7 asymmetric |
| `process-sequence` | Numbered steps with rules — for Quality |
| `product-rail` | Horizontally scrollable product row |
| `statement` | Large type on a colour field. No image. Used for a single strong claim |
| `anchor-dark` | Full-bleed `--burla-green-deep` band — used once or twice per page |
| `spec-list` | Two-column definition list — product information |
| `cta-band` | Contact/WhatsApp closing block |
| `feature-detail` | One large image with annotated callouts |

---

## 9. Motion

**Principle:** motion clarifies relationships and state. It is never decoration.

| Interaction | Motion | Duration |
|---|---|---|
| Page transition | Fade only | 150ms |
| Hover on card | Image scale 1.0 → 1.03, `ease-out` | 300ms |
| Menu open | Height/opacity | 200ms |
| Drawer | Slide, `ease-out` | 250ms |
| Modal | Fade + 2% scale | 200ms |
| Section entry | Fade + 12px rise, **once**, only for major sections | 400ms |
| Button press | Scale 0.98 | 80ms |
| Skeleton → content | Crossfade | 150ms |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances, `cubic-bezier(0.4, 0, 0.2, 1)` for transitions. Nothing exceeds 400ms.

**`prefers-reduced-motion: reduce` removes all transform and scroll-triggered motion entirely** — opacity changes only. It is not enough to shorten durations.

**Never:** parallax on text, scroll-jacking, auto-playing carousels, entrance animation on every list item, animated counters, marquees, cursor followers.

---

## 10. Iconography

Lucide, 1.5px stroke, 20px default / 16px inline / 24px touch targets. Icons **support** labels; they do not replace them except for universally understood affordances (search, close, cart) which still carry an `aria-label`. Never mix icon libraries. Never use an emoji as an icon.

---

## 11. Voice and copy

| Do | Don't |
|---|---|
| "Sun-dried in small batches" | "Passionately crafted with love" |
| "250g · shelf life 9 months" | "Premium quality guaranteed!" |
| "Ask us about bulk pricing" | "Contact us today for the best deals!!" |
| Name products by their real regional names | Anglicise everything into blandness |
| State facts and let them do the work | Stack adjectives |
| Sentence case for headings | ALL CAPS SHOUTING |

**Absolutely prohibited without client evidence:** health claims, "best in India", customer counts, export-country lists, awards, certifications, testimonials, reviews, years in business, "trusted by X families".

Every placeholder string in the codebase must be marked `[PLACEHOLDER]` and tracked in `docs/CONTENT-INVENTORY.md`. A placeholder must never reach production.

---

## 12. Implementation

Tokens are defined once as CSS custom properties in `app/globals.css` and exposed to Tailwind v4 via `@theme`. Components consume Tailwind utilities bound to those tokens — never raw hex values, never arbitrary values like `text-[#2E9E5B]`.

```css
@theme {
  --color-burla-green: #2E9E5B;
  --color-burla-green-deep: #0E3B23;
  --color-burla-green-text: #1B6B3F;
  --color-ivory: #FAF7F0;
  --color-ivory-warm: #F2EDE2;
  --color-paper: #FFFFFF;
  --color-sand: #E5DDCC;
  --color-ink: #1A1917;
  --color-ink-muted: #5C574E;
  --color-ink-faint: #8C8478;
  --color-terracotta: #B3542E;
  --color-turmeric: #C8901F;
}
```

A lint rule blocks raw colour values in component files.

---

## 13. Design review checklist

Every page passes this before merge:

- [ ] No anti-pattern from §2 present
- [ ] Adjacent sections use different patterns (§8)
- [ ] Green occupies ≤ 20% of the viewport outside anchor sections
- [ ] Every colour pair verified against §3.3
- [ ] One `display`-scale element per page, maximum
- [ ] Body measure within 60–75 characters
- [ ] Verified at 320, 375, 768, 1024, 1440px
- [ ] Keyboard-only pass completed
- [ ] Screen-reader pass on interactive components
- [ ] `prefers-reduced-motion` verified
- [ ] Loading, empty and error states designed, not improvised
- [ ] No placeholder copy without a `[PLACEHOLDER]` marker and a tracking entry
- [ ] Every image has meaningful alt text
- [ ] LCP element identified and prioritised
- [ ] Could this be mistaken for a template? If yes, it is not done
