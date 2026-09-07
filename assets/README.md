# Source Assets

Original, unprocessed client assets. **Not shipped** — production assets live in Sanity or `public/`.

## `brand/` — required, currently empty

| File | Description | Status |
|---|---|---|
| `burla-logo.svg` | Primary vector logo | ⬜ **Missing — `OQ-008`** |
| `burla-logo.png` | Raster fallback, ≥ 2000px, transparent | ⬜ Missing |
| `burla-logo-reversed.svg` | White/knockout version for dark surfaces | ⬜ Missing |
| `burla-logo-mono.svg` | Single-colour version | ⬜ Missing |
| `brand-colours.txt` | Exact hex / Pantone values | ⬜ Missing |
| `brand-guidelines.pdf` | If one exists | ⬜ Unknown |

**Why the vector file matters:** the design system's colour tokens are currently derived from a raster image and are marked provisional throughout `docs/DESIGN-SYSTEM.md`. Colour sampled from a JPEG is not an acceptable foundation — compression shifts values, and every contrast calculation in the system depends on the true brand green. The logo also needs to render crisply at every size from a 32px favicon to a full-width footer mark, which only a vector can do.

## `reference/` — required for traceability

| File | Description | Status |
|---|---|---|
| `handwritten-requirements.jpg` | The client's requirements sheet | ⬜ Missing |

The handwritten sheet is the source of record for the requirements in `docs/REQUIREMENTS.md` §1. It should be archived here so any future question about "what did the client actually ask for" can be answered from the original.

## Adding assets

Drop files into the folders above using the exact names in the tables, then update the Status column. Both client images currently exist only in the conversation that produced this documentation.
