# Open Questions — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/OPEN-QUESTIONS.md` |
| Version | 1.0 — adds OQ-047 to OQ-057 and the design-direction conflicts |
| Date | 2026-09-09 |
| Owner | Client (Burla Global Agri Products) unless stated |

This is the single register of everything unknown. **Nothing here has been guessed or filled in with invented information.**

**Status:** 🔴 Blocking — work stops or ships wrong without it · 🟠 Needed before launch · 🟡 Needed before the relevant phase · 🟢 Nice to have

**Answer in this document.** Add the answer under each item and change the status to ✅. Every answer updates a linked requirement.

---

## Priority summary

| Answer first (this week) | Answer within 2 weeks | Answer before launch |
|---|---|---|
| **OQ-051**, **OQ-055**, **OQ-057**, OQ-001, OQ-008, OQ-016, OQ-017 | OQ-002, OQ-003, OQ-004, OQ-013, OQ-049, OQ-050, OQ-032 | Everything else marked 🟠 |

> The three bolded items are new conflicts created by the clarified design
> direction. They gate the rework — see section K.

---

## A. Business model and legal identity

### 🔴 OQ-001 — Does V1 sell online, or take enquiries only?
This is **the single most consequential question in the project**. It determines roughly 40% of the build.

- **Option A — Catalogue + enquiry.** Products displayed with full information; buying happens over WhatsApp/phone. No cart, no payment gateway, no order management. Faster, cheaper, lower compliance burden. Architecture still supports adding commerce later.
- **Option B — Full ecommerce.** Cart, checkout, Razorpay, orders, invoices, stock, shipping, returns. Requires a payment gateway account, a shipping partner, GST invoicing and a stock process.
- **Option C — Hybrid.** Retail online for a subset of SKUs; wholesale by enquiry only.

**Affects:** FR-140 to FR-152, entire Phase 15, database scope, testing scope, timeline, cost.
**Answer:**

### 🔴 OQ-002 — Legal entity details
Registered legal name (e.g. "… Private Limited" / proprietorship name), registered address, GSTIN, CIN if applicable.
**Needed for:** footer, invoices, terms, privacy policy, payment gateway onboarding.
**Answer:**

### 🔴 OQ-003 — FSSAI licence number and licence type
A food business operating online in India must display its FSSAI licence details. We cannot launch a food website without this.
**Note:** neither of your two reference sites displays one (`REFERENCE-ANALYSIS.md` §4). That does not make it optional — it makes it a differentiator.
**Answer:**

### 🟠 OQ-004 — WhatsApp business number
Country code and number. Is it a WhatsApp Business account? Who monitors it, and during what hours?
**Affects:** FR-110 to FR-115 — the primary conversion channel.
**Answer:**

### 🟠 OQ-005 — Grievance / nodal officer
The Consumer Protection (E-Commerce) Rules require a named grievance officer with contact details and a response timeline.
**Answer:**

### 🟡 OQ-006 — Business bank account and payment gateway
Only if OQ-001 = B or C. Does a Razorpay account exist? Is KYC complete?
**Answer:**

### 🔴 OQ-007 — Domain name and business email
See OQ-032 and OQ-033.
**Answer:**

---

## B. Brand and identity

### 🔴 OQ-008 — Vector logo and exact brand colour
We need the original vector file (`.svg`, `.ai` or `.eps`) and the **exact hex/Pantone of the green**. The supplied image is a raster file; sampling it gives an approximation, which is not an acceptable foundation for a design system.
Also required: reversed (white) and single-colour variants, and any minimum clear-space / minimum-size rules.
**Answer:**

### 🟠 OQ-009 — Is there an existing brand guideline, packaging design or print collateral?
Packaging artwork is the strongest signal of the intended visual language. If packaging exists, the website should extend it rather than invent a parallel identity.
**Answer:**

### 🟡 OQ-010 — Tagline
Is there an approved tagline? The direction "From India's farms to your everyday table" in the brief is **conceptual only** and has not been treated as approved copy.
**Answer:**

---

## C. Product taxonomy

### 🟠 OQ-011 — Is "Dehydrated Fruits" separate or nested?
The handwritten sheet writes it as an inserted sub-line under "Dehydrated powders / Flakes". Our reading is that it is a **separate top-level category**. Confirm.
**Affects:** navigation, URL structure (permanent), FR-050.
**Answer:**

### 🟠 OQ-012 — "Vadiyalu" or "Sandige"?
You wrote **vadiyalu** (Telugu). The brief also offers **Sandige** (Kannada). These are regional names for the same product family. This is a branding and SEO decision — whichever leads becomes the permanent URL slug and the primary search keyword.
Options: (a) "Vadiyalu" leads, (b) "Sandige" leads, (c) a neutral English lead — "Sun-Dried Crisps" — with both regional names in the description and metadata (our recommendation, best for both audiences).
**Supporting evidence:** hillpureorganic.com keeps regional names throughout (Munsyari Rajma, Gahat Dal, Kala Bhatt) and it works well for them — `REFERENCE-ANALYSIS.md` §2.1.
**Answer:**

### 🟠 OQ-013 — Final display name for every category
Please confirm exact spelling, capitalisation and singular/plural for all ten. These become permanent URLs.

| Handwritten | Proposed display name | Proposed slug | Confirmed? |
|---|---|---|---|
| Dehydrated powders / Flakes | Dehydrated Powders & Flakes | `dehydrated-powders-flakes` | |
| Dehydrated Fruits | Dehydrated Fruits | `dehydrated-fruits` | |
| Pickles | Pickles | `pickles` | |
| Spiced dal powder | Spiced Dal Powders | `spiced-dal-powders` | |
| Sundried crips (vadiyalu) | *pending OQ-012* | *pending* | |
| Dry Fruits | Dry Fruits | `dry-fruits` | |
| Millets | Millets | `millets` | |
| Herbal Tea / coffee | Herbal Tea & Coffee | `herbal-tea-coffee` | |
| Masala powders | Masala Powders | `masala-powders` | |
| Combo packs | Combo Packs | `combo-packs` | |

**Answer:**

### ✅ OQ-014 — ~~Approval to nest categories under "Shop"~~ **Resolved**
Superseded by the clarified direction of 2026-09-09: categories are **not**
nested behind a Shop mega-menu. All ten sit in a persistent bar under the
header, visible from every page. The client's original handwritten intent —
every category reachable at the top — is now met directly. See `SITEMAP.md` §3.

### 🟡 OQ-015 — Regional and linguistic identity
"Vadiyalu" suggests Andhra/Telangana; "sandige" suggests Karnataka. Which region is Burla actually from? This affects copy voice, product naming, SEO keywords and any future language support.
**Answer:**

---

## D. Products and content

### 🔴 OQ-016 — Full product list
For each product we need: name, category, short descriptor, long description, pack sizes/weights, MRP per size, ingredients in descending order by weight, allergens, shelf life, storage instructions, country of origin, manufacturer/packer name and address, FSSAI number of the manufacturing unit, veg/non-veg mark, and current availability.
**A structured intake sheet is specified in `docs/CONTENT-INVENTORY.md` §3.** No product page can be built without this.
**Note on naming:** please give short, human product names ("Mango Powder"), not keyword strings. Keywords belong in a separate field — see `REFERENCE-ANALYSIS.md` §6.
**Answer:**

### 🔴 OQ-017 — Photography
Does professional product photography exist? If yes, in what form (RAW, JPEG, resolution, rights)? If no, is there budget to commission a shoot? See `docs/PHOTOGRAPHY-BRIEF.md`.
**This is the highest visual-quality risk in the project.** Without real photography the site cannot achieve the premium standard requested.
**Answer:**

### 🟠 OQ-018 — Manufacturing model
Does Burla own a processing facility, use contract manufacturing, or aggregate from producers? This determines what can honestly be claimed on the Quality page and which legal declaration applies (manufactured by / packed by / marketed by).
**We will not write a single word about the process until this is answered.**
**Answer:**

### 🟠 OQ-019 — Certifications
Which certifications genuinely exist? FSSAI (which type), ISO 22000, HACCP, organic (which body), APEDA/IEC for export, kosher/halal, others. Please supply certificate numbers and expiry dates.
**No certification will be displayed without documentary evidence.**
**Answer:**

### 🟠 OQ-020 — Company story
Founding year, founder(s), origin of the business, why it started, what it believes, where sourcing happens. Anything factual you want on the About page.
**We will not invent company history.**
**Answer:**

### 🟠 OQ-021 — Locations
Registered office, processing facility, warehouses, retail presence, distribution regions, any international presence. Full addresses for anything to be shown on a map.
**No map pin will be placed without a verified address.**
**Answer:**

### 🟡 OQ-022 — Combo packs
How are combo packs composed — fixed bundles, or customer-selected? Is a combo a product in its own right with its own SKU and price, or a discount on constituent products?
**Affects:** data model, cart logic. See also `OQ-045`.
**Answer:**

---

## E. Communication and conversion

### 🟠 OQ-023 — WhatsApp or live chat?
The sheet says "Whatsapp connect. **or** Live chat." Our recommendation is **WhatsApp only** for V1: familiar to Indian customers, works asynchronously, no staffing requirement, no third-party script cost, and the conversation stays on the customer's phone. Live chat requires someone present to answer, and an unanswered chat widget damages trust more than having none.
**Answer:**

### 🟡 OQ-024 — Contact details for publication
Public phone number(s), email address(es), business hours, and whether a physical address should be published.
**Answer:**

### 🟡 OQ-025 — Social media handles
Facebook, Instagram and YouTube URLs. Do these accounts exist yet? Any others (LinkedIn, X, Pinterest)?
**Answer:**

### 🟢 OQ-026 — Newsletter
Should we capture email subscribers? If so, which platform will send?
**Answer:**

---

## F. Commerce operations — only if OQ-001 = B or C

### 🟠 OQ-027 — Shipping
Which courier partners? Shipping rates — flat, weight-based, or free above a threshold? Which regions are served? Expected dispatch and delivery times?
**Answer:**

### 🟠 OQ-028 — Return and refund policy
Actual terms: window, condition requirements, who pays return shipping, refund method and timeline. Food products often carry restrictions on returns — state the real policy.
**Answer:**

### 🟠 OQ-029 — Tax
GST rate per product category (rates differ across food categories). Are displayed prices inclusive of GST? MRP or selling price?
**Answer:**

### 🟡 OQ-030 — Inventory
Where does stock truth live today — spreadsheet, Tally, ERP, or nowhere? Should the website hold authoritative stock, or display availability only?
**Answer:**

### 🟡 OQ-031 — Order fulfilment
Who receives an order, and how? Email, dashboard, WhatsApp? What is the packing and dispatch process?
**Answer:**

---

## G. Technical and operational

### 🔴 OQ-032 — Domain
Which domain? Is it registered, and who controls the registrar account? A `.com` or `.in` decision affects SEO and brand perception. If not registered, secure it before anything else.
**Answer:**

### 🟠 OQ-033 — Email
Business email domain and provider (Google Workspace, Zoho, Microsoft 365). Needed for transactional email deliverability (SPF, DKIM, DMARC).
**Answer:**

### 🟡 OQ-034 — Existing digital presence
Any current website, Instagram shop, Amazon/Flipkart listings, IndiaMART profile? If a site exists, we need its URL structure to plan redirects and preserve any existing SEO value.
**Answer:**

### 🟡 OQ-035 — Who maintains the site after launch?
Client staff via the admin only, or is there ongoing developer support? Determines how much operational tooling and documentation is required.
**Answer:**

### 🟡 OQ-036 — Budget and timeline
Target launch date, and whether the budget supports the two-application scope plus a photography commission.
**Answer:**

### 🟢 OQ-037 — Analytics and marketing accounts
Existing Google Analytics, Search Console, Meta Pixel, Google Merchant Center? Should we create them?
**Answer:**

---

## H. Admin application

### 🔴 OQ-038 — Custom admin, or a CMS as the admin?
You asked for a separate admin website to manage stock and everything else. Two ways to deliver it:

- **Option A — Full custom admin (recommended).** One application at `admin.burla.com` managing products, variants, prices, stock, images, all page content, orders and enquiries. One login, one database, one system. **Cost: ~25–31 extra engineering days** versus the original CMS plan.
- **Option B — Sanity Studio + a small custom panel.** Sanity Studio hosted at `admin.burla.com` handles products, categories and content; a small custom panel handles stock, orders and enquiries. **~10–12 days cheaper than Option A.** The cost is two systems for your staff, and product data split across two databases — the risk flagged as R6.

This is a budget decision as much as a technical one. Our recommendation is Option A, because "add the stock" and "add the product" are the same job and should not live in two places.
**Answer:**

### 🟠 OQ-039 — Who gets admin access?
How many staff accounts, and what should each be able to do? Proposed roles:
- **Admin** — everything, including managing other staff accounts and legal settings.
- **Staff** — products, stock, content, enquiries and orders, but not user management or legal settings.

Names and email addresses for the initial accounts. Note that **MFA will be mandatory** for every account — each person needs a phone with an authenticator app.
**Answer:**

### 🟡 OQ-040 — Should the admin site be network-restricted?
Beyond password + MFA, we can additionally restrict `admin.burla.com` to specific IP addresses, or put Cloudflare Access in front of it. More secure, but staff then cannot log in from a mobile network or while travelling. Recommendation: **no IP restriction**, rely on MFA — unless you have a fixed office network and staff never need remote access.
**Answer:**

### 🟡 OQ-041 — Admin subdomain name
`admin.burla.com` is proposed. Alternatives: `manage.`, `office.`, `dashboard.`. Any preference?
**Answer:**

---

## I. Raised by the reference-site review

Full analysis in `docs/REFERENCE-ANALYSIS.md`.

### 🟡 OQ-042 — A second navigation axis, "Shop by Use"?
Organic India runs a second axis on **health concern** (Gut Care, Immunity, Sleep Care). Commercially effective, but every one of those labels is a health claim requiring substantiation — not appropriate for a food brand without evidence.
Proposed safe equivalent: **Everyday Cooking · Snacking · Traditional & Festive · Gifting & Combos · Travel & Ready-to-Use.** Same merchandising benefit, zero regulatory exposure. Want it?
**Answer:**

### 🟡 OQ-043 — Dedicated export and wholesale email addresses?
Organic India publishes `export@` and `gifting@` addresses. For a company called "Global Agri Products", a named export contact alongside the enquiry form is a cheap, strong B2B signal.
**Answer:**

### 🟠 OQ-044 — Pricing and discount strategy
Both reference sites badge nearly every product with a discount (Hillpure shows `SAVE 52%` across essentially the whole catalogue). This is the Shopify default, and it undermines both the MRP's credibility and the brand's.
Our recommendation: genuine MRP, occasional real time-bound offers, honest bundle savings on combo packs. If your commercial model genuinely needs permanent discounting, tell us and we will design for it honestly — but it should be a decision, not a platform default. Note the Legal Metrology implication: a struck-through price must be a real MRP.
**Answer:**

### 🟡 OQ-045 — How prominent should combo packs be?
Organic India leads its entire navigation with "Super Saver Combos". Your handwritten sheet lists combo packs as category 10. Recommendation: promote them to a homepage section **and** a top-level category — they raise basket value and give new visitors a starting point.
Related: `OQ-022` — are combos their own SKU, or a discount on constituents?
**Answer:**

### 🟠 OQ-046 — Is there a sourcing or producer story?
Hillpure's strongest asset is a real narrative about marginal hill farmers and women's empowerment — though they bury it in the footer. Does Burla have an equivalent, factually supportable story about where produce comes from and who grows it?
If yes, it belongs on the homepage, not the footer. If no, we will not invent one.
**Answer:**

---

## Deviations from the client brief requiring approval

Places where we are recommending something different from what was written. Each needs an explicit yes or no.

| ID | Deviation | Reason | Approved? |
|---|---|---|---|
| D-01 | Categories nested under "Shop" rather than ten top-level nav items | Usability, mobile, SEO — `OQ-014` | |
| D-02 | WhatsApp only; no separate live-chat widget | Staffing reality, performance, privacy — `OQ-023` | |
| D-03 | Cloudflare R2 for image storage rather than Cloudinary | No egress fees, S3-compatible, sufficient with `next/image` — ADR-005 | |
| D-04 | Blog / recipes deferred to post-launch | Content capacity; not requested | |
| D-05 | Multi-language and multi-currency architected but not built in V1 | Cost vs confirmed need | |
| D-06 | **No headless CMS — content managed in the custom admin** | You asked for one admin for stock "and everything". Keeping a CMS too would mean two logins and product data split across two databases — ADR-010, `OQ-038` | |
| D-07 | Admin as a separate application on `admin.burla.com` rather than an `/admin` section | Admin code never ships to customers; independent security and caching — ADR-009 | |
| D-08 | No permanent discount badging | Credibility and Legal Metrology — `OQ-044` | |

---

## Answered questions

Move items here as they are resolved, with the date and the answer. Nothing has been answered yet.

| ID | Question | Answer | Date | Requirements updated |
|---|---|---|---|---|
| — | — | — | — | — |
