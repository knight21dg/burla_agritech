# Design System — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DESIGN-SYSTEM.md` |
| Version | **1.0 — white canvas, product-first** |
| Date | 2026-09-09 |
| Status | Implemented for the design system, header, footer and homepage |
| Supersedes | v0.2 (warm ivory / editorial direction), now withdrawn |

> **This is a full replacement, not an edit.** The client has clarified that they
> do not want a fancy, editorial, warm-toned site. They want a clean, mostly
> white, product-first site where the products supply the colour. The previous
> palette (ivory, sand, terracotta, turmeric) and the display serif are
> withdrawn.

---

## 1. The one rule

**Let the products speak.**

The interface is a white frame around photographs of food. Anything that draws
attention to the frame is working against the brief. If a design decision makes
the page more interesting but the product less prominent, it is the wrong
decision.

Three practical consequences:

1. **White is the default, not a choice.** A section needs a reason to be
   anything else.
2. **Colour comes from the food.** Turmeric yellow, chilli red, millet gold —
   these belong in the photographs, not in the CSS.
3. **Green is identity, not decoration.** It marks the brand, the primary
   action and the active state. Nothing else.

---

## 2. What changed from v0.2, and why

| v0.2 (withdrawn) | v1.0 | Reason |
|---|---|---|
| Ivory `#FAF6EC` page background | **White `#FFFFFF`** | Client: "mostly plain white background" |
| Warm sand borders, cream cards | Neutral grey `#E5E5E5` lines | Client: no excessive beige/brown |
| Terracotta + turmeric accents | **Removed** | Colour comes from product photography |
| Fraunces display serif | **Single sans family** | Client: typography must not distract |
| Caveat handwriting accent | **Removed** | Decorative; conflicts with "not flashy" |
| Deep-green full-bleed anchor bands | Green reserved for actions and footer | Client: no excessive green backgrounds |
| Editorial asymmetry, varied section patterns | Consistent, predictable grid | Client: easy to use, not art-directed |
| Illustrated SVG hero scene | Real product photograph | Client: authentic imagery only |
| Section entrance animations | Removed except hover/fade | Client: subtle only |

**What is retained:** the accessibility floor (WCAG 2.2 AA), the anti-pattern
discipline, the refusal to invent product facts, and the small-radius,
low-shadow treatment — all of which the new brief reinforces.

---

## 3. Colour

### 3.1 Tokens

```
SURFACE
  --white            #FFFFFF   default page background
  --surface          #FAFAFA   subtle section separation, used sparingly
  --surface-2        #F5F5F5   image placeholder ground, input fill
  --line             #E5E5E5   borders, dividers, card outlines
  --line-strong      #D4D4D4   hover borders, stronger separation

INK
  --ink              #171717   headings and body
  --ink-2            #4A4A4A   secondary text
  --ink-3            #6B6B6B   metadata, captions, disabled labels

BRAND
  --green            #26985C   logo green, SAMPLED from the supplied artwork
                               graphics, icons, borders. NOT for text.
  --green-700        #187B44   primary buttons, links, active nav
  --green-900        #0D4526   dark surfaces
  --green-50         #F0F8F3   selected chip / active pill background

FUNCTIONAL
  --success          #157A3F
  --warning          #8A5A00
  --danger           #A32B1E
```

There is no fifth colour. Terracotta, turmeric, sand and ivory are gone.

### 3.2 Verified contrast

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `--ink` #171717 | white | **17.4:1** | ✅ AAA |
| `--ink-2` #4A4A4A | white | **8.9:1** | ✅ AAA |
| `--ink-3` #6B6B6B | white | **5.3:1** | ✅ AA at any size |
| `--ink-3` | `--surface` #FAFAFA | **5.1:1** | ✅ AA |
| `--green-700` #187B44 | white | **5.33:1** | ✅ AA — links and buttons |
| white | `--green-700` | **5.33:1** | ✅ AA — button label on fill |
| white | `--green-900` #0D4526 | **11.1:1** | ✅ AAA — dark surfaces |
| `--green` #26985C | white | **3.67:1** | ⚠️ **Never for text.** Icons, borders, graphics only |

Every value above is computed, not estimated, and the brand green is now
sampled from the client's actual logo artwork rather than guessed. The one
deliberate constraint: the logo green is too light for text on white, which is
normal for a brand green — `--green-700` exists for that.

### 3.3 Colour proportion

Per viewport, roughly: **white 75% · product photography 20% · ink 4% ·
green 1%.**

Green appears as: the logo, the primary button, link text, the active nav
underline, and the footer ground. Nowhere else.

### 3.4 Dark mode

Not in V1. Tokens are CSS custom properties so it stays possible. The page
declares `color-scheme: light`.

---

## 4. Typography

### 4.1 Recommendation: one family

**Instrument Sans** for everything — navigation, headings, body, UI.

A single well-set sans is the correct answer for a product-first catalogue. It
is quiet, it reads cleanly at every size, and it never competes with a
photograph. The v0.2 pairing (Fraunces display serif + Caveat script) is
withdrawn: it was editorial, and the client has asked for the opposite.

**Optional, if the client wants a touch more brand character:** a restrained
serif on the homepage `h1` and page titles *only* — never on product names,
never in the interface. Our recommendation is to launch without it and add it
later if the site feels too plain in review. Adding is easy; removing a serif
that has spread through the UI is not. Logged as `OQ-047`.

Self-hosted via `next/font` — no third-party request, no layout shift.

### 4.2 Scale

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `display` | 36 → 52px | 1.08 | 600 | Homepage hero only |
| `h1` | 30 → 40px | 1.15 | 600 | Page titles |
| `h2` | 22 → 28px | 1.25 | 600 | Section titles |
| `h3` | 17 → 19px | 1.35 | 600 | Card titles, sub-sections |
| `body-lg` | 17px | 1.6 | 400 | Lead paragraphs |
| `body` | 16px | 1.65 | 400 | Default |
| `body-sm` | 14px | 1.55 | 400 | Secondary, product meta |
| `caption` | 13px | 1.5 | 400 | Captions, footnotes |
| `label` | 12px | 1.4 | 600, `0.06em` | Eyebrows, section labels |
| `nav` | 15px | 1 | 500 | Navigation |
| `button` | 15px | 1 | 600 | Buttons |

Deliberately flatter than v0.2. The display size drops from 88px to 52px,
because a 5rem headline on a product catalogue is the frame shouting.

### 4.3 Rules

- Body measure 60–75 characters, enforced with `max-width`.
- Product names are **never** styled as display type. They are `h3` at card
  level, `h1` at product level, and they stay plain.
- Tabular numerals for prices, weights and specifications.
- Nothing below 12px. Inputs at 16px minimum (prevents iOS zoom).
- Regional product names (vadiyalu, sandige, podi) are set in the same face,
  never italicised as foreign words. They are the product's real name.
- Sentence case for headings. No all-caps except the 12px `label` token.

---

## 5. Space, grid, shape

### 5.1 Spacing

4px base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`. Nothing
off-scale. The v0.2 128/160 steps are removed — they created the airy editorial
rhythm the client does not want.

### 5.2 Section rhythm

| Breakpoint | Block padding |
|---|---|
| Mobile | 48px |
| Tablet | 56px |
| Desktop | 64–72px |

Tighter than v0.2 (which went to 128px). Products should arrive sooner.

### 5.3 Grid

- Container max-width **1280px**, gutters 16px mobile / 24px tablet / 32px desktop.
- Text-heavy content constrained to 680px.
- Product grid: **2 / 3 / 4 columns** at mobile / tablet / desktop. 5 only above 1536px.
- Category grid: **2 / 3 / 5 columns**.
- Symmetric and predictable. The v0.2 asymmetric 5/7 editorial splits are withdrawn.

### 5.4 Breakpoints

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`

Verified at **320, 375, 390, 414, 768, 1024, 1280, 1440, 1920**.

### 5.5 Radius and elevation

| Token | Value | Use |
|---|---|---|
| `radius-none` | 0 | Product and category images |
| `radius-sm` | 3px | Inputs, chips, badges |
| `radius-md` | 6px | Buttons, cards |
| `radius-full` | 9999px | The WhatsApp button only |

**Elevation is a 1px `--line` border, not a shadow.** Exactly two shadows exist
in the system: `shadow-overlay` for modals and drawers, and `shadow-header` for
the sticky header once scrolled. Product cards have no shadow — a shadow on a
white card on a white page is decoration.

---

## 6. Anti-patterns — review-blocking

A pull request containing any of these does not merge.

| ❌ Never | ✅ Instead |
|---|---|
| Coloured or gradient page backgrounds | White |
| Beige, cream, tan, sand surfaces | White or `--surface` |
| Green section backgrounds | Green on buttons, links, footer only |
| Card shadows | 1px `--line` border |
| `rounded-2xl` / `rounded-3xl` | 6px max on cards |
| Decorative icons beside every heading | No icon, or one meaningful icon |
| Three identical icon-heading-text cards in a row | A real list, or nothing |
| Scroll-triggered animation | Hover and fade only |
| Parallax, 3D, cinematic transitions | Nothing |
| Stock or AI-generated food photography as product imagery | Real client photographs, or a marked placeholder |
| Fake packaging renders | A marked placeholder |
| Star ratings without real reviews | Omit entirely |
| Discount badges on every product | Only genuine, time-bound offers |
| Health claims ("rich in nutrition", "boosts immunity") | Factual specifications only |
| 40-word keyword-stuffed product names | 2–4 word human names |
| Text baked into images | Real HTML text |
| Emoji as icons | Lucide, or nothing |
| Company story above the products on the homepage | Products first |

---

## 7. Components

### 7.1 Button

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--green-700` | white | none | One per view |
| Secondary | white | `--ink` | 1px `--line-strong` | Alternative action |
| Tertiary | none | `--green-700` | none, underline on hover | Inline |
| WhatsApp | `#25D366` | `#0B2E13` | none | WhatsApp only |

Height 44px default / 52px large / 36px small. Radius 6px. Focus: 2px
`--ink` outline, 2px offset. States: default, hover, active, focus-visible,
disabled, loading (spinner replaces label, width preserved, `aria-busy`).

### 7.2 Product card

```
┌───────────────────┐
│                   │
│   PRODUCT PHOTO   │   1:1, no radius, --surface-2 ground
│                   │
└───────────────────┘
  Mango Pickle           h3, --ink
  500 g                  body-sm, --ink-3
  ₹XXX                   body-sm, --ink, tabular
```

**Four pieces of information, maximum.** No shadow, no border on the card
itself (the image edge defines it), no badge stack, no rating, no countdown.
The whole card is one link. Price is omitted entirely — not shown blank — when
a product has none. "View product →" appears on hover at desktop and is
implicit on mobile (the whole card is tappable).

Image occupies roughly 78% of the card's height. That is the point.

### 7.3 Category card

```
┌───────────────────┐
│   CATEGORY PHOTO  │   4:3
└───────────────────┘
  Pickles                h3
  8 products             body-sm, --ink-3
```

Authentic photography only — no icons, no illustrations, no abstract tiles.
Entire card is one link.

### 7.4 Product carousel

A horizontally scrollable rail, built on native CSS scroll-snap rather than a
carousel library. Zero JavaScript for the scrolling itself.

- `scroll-snap-type: x mandatory`, `overflow-x: auto`, `scroll-padding` matching the gutter
- **Partial next card visible** at every breakpoint, so it is obvious more exists
- Arrow buttons on desktop (hidden when there is nothing to scroll to)
- Native touch/trackpad swipe on all devices
- Keyboard: the rail is focusable, arrow keys scroll, Tab moves through cards
- `aria-label` on the region; cards are ordinary links, not `role="listbox"` theatre
- Respects `prefers-reduced-motion` (instant rather than smooth scroll)

No autoplay. Ever.

### 7.5 Other components

| Component | Notes |
|---|---|
| Header | White, 1px bottom line, sticky. Category bar beneath on desktop — see §8 |
| Category bar | Horizontal row of category links; active item gets a 2px green underline |
| Mobile drawer | Full-height sheet, Products list first, focus trapped, `Esc` to close |
| Input | 44px, 1px `--line`, white fill, visible label always, 16px text |
| Search overlay | Dialog, instant suggestions, keyboard operable, focus restored on close |
| Breadcrumb | `nav` + ordered list, `aria-current` on the last item. Present on every product and category page |
| Chip / filter pill | 3px radius, `--green-50` fill and `--green-700` text when selected |
| Badge | Rectangular, 3px radius. Only for real status: "Out of stock", "New" |
| Skeleton | Matches final dimensions exactly. `--surface-2` fill, no shimmer under reduced motion |
| Empty state | One line of explanation, one action |
| Error state | Plain language, retry, plus a WhatsApp fallback |
| Footer | `--surface` ground with a 2px green top rule. **Changed from the planned dark-green ground** because the supplied logo is a JPEG on white with no transparency and cannot sit on a dark field. Revisit if a transparent or reversed logo arrives — deviation `D-09` |

---

## 8. Navigation pattern

The client has asked for categories visible at the top, and specifically for
**Locations removed from the main navigation**.

**Desktop — two rows:**

```
┌────────────────────────────────────────────────────────────────────┐
│  [BURLA LOGO]        Home   About   Quality   Contact    🔍  👤  🛒 │
├────────────────────────────────────────────────────────────────────┤
│  Dehydrated Powders · Dehydrated Fruits · Pickles · Dal Powders ·   │
│  Sandige · Dry Fruits · Millets · Tea & Coffee · Masalas · Combos   │
└────────────────────────────────────────────────────────────────────┘
```

Row two is the product bar: all ten categories, always visible, one click from
anywhere. Active category carries a 2px green underline.

**Below 1280px** the ten labels will not fit on one line. Rather than shrink
the type or wrap to a ragged second line, the bar becomes horizontally
scrollable with the same partial-item-visible cue as the product carousel.
This keeps every category one tap away without a dropdown.

**Mobile:**

```
┌──────────────────────────┐
│  [BURLA]        🔍   ☰   │
└──────────────────────────┘
```

Drawer contents, in order: **Products** (all ten categories, listed flat — no
accordion, no extra tap), then Home, About, Quality, Contact, then Locations,
then the contact block with WhatsApp.

**Locations** moves to the footer and the About page, per the client's
instruction, while remaining a real, indexable page.

---

## 9. Photography

This is the highest-risk dependency in the project. Full specification in
`docs/IMAGE-ASSET-REQUIREMENTS.md`.

| Aspect | Direction |
|---|---|
| Source | **Client-supplied photographs only.** No stock. No AI-generated food. No rendered packaging |
| Background | White or very light neutral, consistent across the catalogue |
| Light | Even, clean, accurate. Product colour must be true — turmeric must look like turmeric |
| Framing | Product centred, generous margin, consistent scale between products |
| Consistency | One setup, one background family, one grade across the whole catalogue |
| Ratios | Product 1:1 · category 4:3 · hero 3:2 or 16:9 |
| Alt text | Describes the actual product, never "product image" |

**Until real photography exists**, the site uses a clearly neutral placeholder:
a `--surface-2` panel with the product name. It does not attempt to look like a
photograph, and it does not invent packaging. Nothing on the site should imply a
product looks a particular way when we do not know.

**Technical:** `next/image`, AVIF with WebP fallback, responsive `srcset` with
explicit `sizes`, lazy loading below the fold, `priority` on the LCP image only,
explicit dimensions so CLS stays at zero.

---

## 10. Motion

**Allowed:** hover state changes (150ms), image scale on card hover (1.0 → 1.02,
300ms), menu and drawer open/close (200ms), carousel scroll, fade on route
change (120ms).

**Not allowed:** scroll-triggered reveals, parallax, staggered list entrances,
animated counters, autoplaying carousels, page loaders, 3D, cinematic
transitions.

Easing `cubic-bezier(0.4, 0, 0.2, 1)`. Nothing exceeds 300ms.

`prefers-reduced-motion: reduce` removes all transform and scroll animation —
opacity only. Shortening durations is not sufficient.

---

## 11. Accessibility floor

Non-negotiable, and part of the definition of done:

- WCAG 2.2 AA. Zero critical or serious axe violations in CI.
- Every interactive element keyboard reachable, with a visible focus indicator at ≥3:1.
- One `h1` per page; no skipped heading levels.
- Meaningful alt text on every product and category image; decorative images `alt=""`.
- Carousel operable by keyboard and screen reader.
- Target size ≥24×24px, ≥44px for primary mobile actions.
- Usable at 200% zoom and 320px width with no horizontal scroll.
- Forms: real labels, `aria-describedby` for errors, errors announced.
- `prefers-reduced-motion` honoured.

---

## 12. Implementation

Tokens defined once as CSS custom properties and exposed to Tailwind v4 through
`@theme`. Components consume utilities bound to tokens — never raw hex, never
arbitrary values like `text-[#2E9E5B]`. A lint rule blocks raw colour in
component files.

```css
@theme {
  --color-white: #ffffff;
  --color-surface: #fafafa;
  --color-surface-2: #f5f5f5;
  --color-line: #e5e5e5;
  --color-line-strong: #d4d4d4;
  --color-ink: #171717;
  --color-ink-2: #4a4a4a;
  --color-ink-3: #6b6b6b;
  --color-green: #2e9e5b;
  --color-green-700: #157a3f;
  --color-green-900: #0e4a27;
  --color-green-50: #f1f8f3;
}
```

---

## 13. Review checklist

Every page passes before merge:

- [ ] Background is white unless there is a stated reason
- [ ] Green appears only on logo, primary action, link, active nav, footer
- [ ] No shadow on any card
- [ ] Products are visible without scrolling past company copy
- [ ] Product image is the largest element in every product card
- [ ] No anti-pattern from §6
- [ ] Verified at 320, 375, 768, 1024, 1440px
- [ ] Keyboard-only pass complete
- [ ] Carousel operable by keyboard and screen reader
- [ ] `prefers-reduced-motion` verified
- [ ] Loading, empty and error states designed
- [ ] Every image has meaningful alt text
- [ ] No placeholder copy without a tracked entry
- [ ] LCP element identified and prioritised
- [ ] **Would a first-time visitor understand what Burla sells within five seconds?**
