# Client Assets Required — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/CLIENT-ASSETS-REQUIRED.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Owner | Client |

This is the single checklist of everything we need from Burla. **We will not
invent any of it.** Where something is missing the site shows a clearly marked
placeholder and the gap is tracked in `docs/OPEN-QUESTIONS.md`.

**Legend:** 🔴 blocks launch · 🟠 needed before launch · 🟡 needed for the
relevant page · 🟢 nice to have

---

## Start here — the six that unblock everything

| # | Item | Why it blocks |
|---|---|---|
| 1 | **Vector logo file** (`.svg` / `.ai` / `.eps`) | We are currently drawing a substitute. See §1 |
| 2 | **Does V1 sell online, or take enquiries only?** | Determines roughly 40% of the build |
| 3 | **Product list** with categories, types, sizes, prices | The catalogue cannot exist without it |
| 4 | **Product photography** — or a decision to commission it | The site is product-first; this *is* the site |
| 5 | **FSSAI licence number** | Legally required on a food business website in India |
| 6 | **Domain name** | Deployment, email, SEO setup |

---

## 1. Brand 🔴

| Item | Status | Notes |
|---|---|---|
| Original logo, vector (`.svg`, `.ai`, `.eps`) | ⬜ | **We do not have this.** The only logo on disk is composited into `landing page.png`. We are currently rendering a hand-built approximation |
| Logo, high-resolution transparent PNG (≥2000px) | ⬜ | Acceptable fallback if no vector exists |
| Reversed / white logo variant | ⬜ | For the footer |
| Exact brand green — hex or Pantone | ⬜ | Sampled `#2E9E5B` from a raster image; approximate |
| Brand guidelines, if any | ⬜ | Clear space, minimum size, misuse rules |
| Packaging artwork | ⬜ | The strongest signal of the intended visual language |
| Approved tagline | ⬜ | "From Nature to Your Table" appears in supplied artwork — is it approved? |

> The client's brief says *"Do not recreate the logo using text if the original
> logo asset is available."* It is not currently available to us. Supplying it
> replaces our approximation immediately.

---

## 2. Business identity 🔴

Legally required in the footer of an Indian food business website.

| Item | Status |
|---|---|
| Registered legal entity name | ⬜ |
| Registered address | ⬜ |
| GSTIN | ⬜ |
| **FSSAI licence number and type** | ⬜ |
| Grievance officer — name, email, phone, response time | ⬜ |
| Public phone number(s) | ⬜ |
| Public email address(es) | ⬜ |
| **WhatsApp business number** | ⬜ |
| Business hours | ⬜ |
| Domain name | ⬜ |

---

## 3. Product catalogue 🔴

The largest single input. Please supply as a spreadsheet — one row per pack size.

### 3.1 Taxonomy first

| Item | Status |
|---|---|
| Confirmed display name for each of the ten categories | ⬜ |
| Display order of categories | ⬜ |
| **Types within each category** (e.g. Pickles → Mango, Lemon…), or confirmation a category has none | ⬜ |
| "Vadiyalu" or "Sandige" — which name leads? | ⬜ |

### 3.2 Then products

| Column | Required | Note |
|---|---|---|
| Product name | ✅ | **2–4 words.** "Mango Pickle", not a keyword string |
| Category | ✅ | |
| Type | if applicable | |
| Short description | ✅ | One line, max 90 characters |
| Full description | ✅ | We can draft from your notes |
| Pack size | ✅ | One row per size |
| SKU | ✅ | |
| MRP inclusive of taxes | ✅ if selling | Legally required |
| GST rate | ✅ if selling | Varies by food category |
| **Ingredients** | ✅ | Legally required, descending by weight |
| **Allergens** | ✅ | Legally required where applicable |
| **Net quantity** | ✅ | Legally required |
| **Shelf life** | ✅ | Legally required |
| **Storage instructions** | ✅ | Legally required |
| **Country of origin** | ✅ | Legally required |
| **Manufacturer / packer name and address** | ✅ | Legally required |
| **FSSAI number of the manufacturing unit** | ✅ | Legally required |
| **Consumer care contact** | ✅ | Legally required |
| **Veg / non-veg** | ✅ | Legally required mark |
| Nutritional information | optional | Only if lab-tested |
| Availability | ✅ | In stock / out of stock / enquire only |
| Featured on homepage? | | For the product carousel |

> Fields marked **legally required** reflect our understanding of the Indian
> rules for online food sale (`docs/SECURITY.md` §8). The admin will block
> publishing a product until each is filled, so no incomplete product page can
> go live. Please have this list confirmed by your own advisor.

**Combo packs** additionally need: what is inside, how it is priced, and whether
it carries its own SKU.

---

## 4. Photography 🔴

Full specification in `docs/IMAGE-ASSET-REQUIREMENTS.md`.

| Item | Priority | Status |
|---|---|---|
| Front-of-pack photo, every product | 🔴 | ⬜ |
| One photo per category (ten) | 🔴 | ⬜ |
| Homepage hero photograph | 🔴 | ⬜ |
| Back-of-pack photo | 🟠 | ⬜ |
| Product close-up, contents out of pack | 🟠 | ⬜ |
| Raw material / ingredient photos | 🟡 | ⬜ |
| In-use / serving photos | 🟢 | ⬜ |
| Farm photos | 🟢 | ⬜ |
| Facility / processing photos | 🟢 | ⬜ |
| Team photos | 🟢 | ⬜ |

**No stock photography. No AI-generated food images. No rendered packaging.**

---

## 5. Company information 🟠

We will write polished copy from these facts. We will not supply the facts.

| Item | Used on | Status |
|---|---|---|
| Founding year | About | ⬜ |
| Founder name(s), and whether to name them publicly | About | ⬜ |
| Why the business started | About | ⬜ |
| What Burla does, in your own words | About, homepage | ⬜ |
| Sourcing — where produce comes from, how suppliers are chosen | About, Quality | ⬜ |
| **Manufacturing model** — own facility / contract / aggregation | Quality, legal declarations | ⬜ |
| Values | About | ⬜ |
| Vision | About | ⬜ |

---

## 6. Quality & standards 🟠

| Item | Status |
|---|---|
| Sourcing and supplier selection process | ⬜ |
| Raw material inspection process | ⬜ |
| Processing steps, in order | ⬜ |
| Hygiene practices | ⬜ |
| Quality checks — what, when, by whom | ⬜ |
| Packaging process | ⬜ |
| Storage conditions | ⬜ |
| **Certifications with certificate numbers and expiry dates** | ⬜ |
| Lab testing arrangements | ⬜ |

> **No certification, badge or standard will appear on the site without
> documentary evidence.** An unverifiable quality claim on a food website is a
> liability, not a marketing asset.

---

## 7. Locations 🟡

Moving out of the main navigation at the client's request, but still a real page
reachable from the footer and About.

Per location: name, type (office / facility / warehouse / retail), full address,
whether it should be public, phone, hours, photo, and whether to show a map pin.

**No map pin without a verified address.**

---

## 8. Social 🟡

| Platform | URL | Status |
|---|---|---|
| Facebook | | ⬜ |
| Instagram | | ⬜ |
| YouTube | | ⬜ |
| Any others (LinkedIn, X) | | ⬜ |

Do these accounts exist yet?

---

## 9. Legal & policy content 🔴

Four pages. These must reflect **actual business practice**, not template text,
and should be reviewed by your own legal advisor.

| Page | Must state | Status |
|---|---|---|
| **Return & Refund** | Window, conditions, what is non-returnable (food often is), who pays return shipping, refund method and timeline | ⬜ |
| **Delivery** | Courier partners, regions served, dispatch time, delivery estimates, charges, tracking | ⬜ |
| **Privacy** | What data is collected and why, retention, sharing, user rights, contact for requests | ⬜ |
| **Terms & Conditions** | Entity, orders, pricing, cancellation, liability, governing law | ⬜ |

---

## 10. Commerce operations — only if selling online 🟠

| Item | Status |
|---|---|
| Courier partners | ⬜ |
| Shipping rates and any free-delivery threshold | ⬜ |
| Regions served | ⬜ |
| Dispatch and delivery timelines | ⬜ |
| Razorpay account, KYC complete? | ⬜ |
| GST rate per product category | ⬜ |
| Where stock truth lives today (spreadsheet / Tally / ERP / nowhere) | ⬜ |
| Who receives an order, and how | ⬜ |

---

## 11. Access & accounts 🟡

| Item | Status |
|---|---|
| Domain registrar access | ⬜ |
| Business email provider (Google Workspace / Zoho / M365) | ⬜ |
| Existing website, if any — we need its URLs to plan redirects | ⬜ |
| Existing Google Analytics / Search Console | ⬜ |
| Staff who need admin access — names, emails, roles | ⬜ |

---

## 12. How to send

- **Documents and spreadsheets:** one shared folder
- **Images:** one folder per category, named as specified in `IMAGE-ASSET-REQUIREMENTS.md` §6
- **Credentials and licence numbers:** please do **not** email these. Share them
  through a password manager or an agreed secure channel. Nothing sensitive
  should sit in an inbox.
