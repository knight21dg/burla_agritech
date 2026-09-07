# User Flows — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/USER-FLOWS.md` |
| Version | 0.2 — adds UF-10b, stock management |
| Date | 2026-09-07 |

Every flow below lists its **states** (loading / empty / error / success), because a flow specification without failure modes is only half a specification. Each flow maps to Playwright coverage in `docs/TESTING.md`.

---

## Flow index

| ID | Flow | Persona | Priority | Commerce-gated |
|---|---|---|---|---|
| UF-01 | Discover → category → product → enquire | P1, P2 | Critical | No |
| UF-02 | Discover → category → product → purchase | P1 | Critical | Yes |
| UF-03 | Search → product | P1, P2 | Critical | No |
| UF-04 | Evaluate credibility (About → Quality → Locations) | P6 | Critical | No |
| UF-05 | Wholesale / B2B enquiry | P3, P4, P5 | Critical | No |
| UF-06 | WhatsApp product enquiry | All | Critical | No |
| UF-07 | Account creation and sign-in | P1 | High | No |
| UF-08 | Returning customer reorder | P1 | Medium | Yes |
| UF-09 | General contact | All | High | No |
| UF-10 | Staff publishes a new product | Editor | Critical | No |
| UF-10b | Staff updates stock | Staff | Critical | No |
| UF-11 | Staff handles an enquiry | Staff | High | No |
| UF-12 | Mobile-first browse | All | Critical | No |

---

## UF-01 — Discover → category → product → enquire

**Entry:** Google organic, Instagram bio link, direct.
**Goal:** the visitor understands a product well enough to ask about it.
**Success:** WhatsApp enquiry sent, or contact form submitted.

```
Landing (/ or /shop/[category])
   │
   ├─ Homepage → scans hero → understands what Burla sells
   │     └─ clicks a category card  ─────────────┐
   │                                             │
   └─ Lands directly on a category page ◄────────┘
         │
         ├─ reads category intro
         ├─ scans product grid
         ├─ (optionally filters by pack size / availability)
         │
         └─ clicks a product card
               │
               ▼
         Product detail (/products/[slug])
               │
               ├─ views gallery
               ├─ reads description
               ├─ selects a pack size
               ├─ reads ingredients / weight / shelf life / origin
               │
               ├─► "Ask about this product"  → WhatsApp (UF-06)   ✅
               ├─► "Add to cart"             → UF-02              ✅
               └─► related product           → loop
```

**States**

| Step | Loading | Empty | Error |
|---|---|---|---|
| Category grid | Skeleton cards matching final layout, no layout shift | "No products in this category yet" + links to other categories | Retry affordance + WhatsApp fallback |
| Filters applied | Optimistic grid update | "No products match these filters" + Clear all | Filters reset to last valid state |
| Product page | Streamed shell, gallery placeholder at correct aspect ratio | — | 404 for unknown slug with category suggestions |
| Gallery images | Blurred LQIP placeholder | — | Fallback image + `alt` still meaningful |

**Design notes:** the product card must not carry a price when no price exists — an empty price slot reads as "unavailable". Where `OQ-001` = enquiry-only, the card CTA is "View details", not "Add to cart".

---

## UF-02 — Discover → product → purchase `[commerce]`

**Entry:** from UF-01.
**Goal:** complete a paid order.
**Success:** order confirmed, confirmation email received.

```
Product detail
   │ select variant → Add to Cart
   ▼
Cart drawer opens (does not navigate away)
   │ review · adjust quantity · remove
   ├─► Continue shopping → back to context
   └─► Checkout
         ▼
   /checkout/address
   │ guest or signed-in
   │ name, phone, email, address, PIN code
   │ [server: revalidate cart, recalculate prices]
         ▼
   /checkout/payment
   │ order summary · shipping · taxes · total
   │ Razorpay
   │       ├─ success ──► webhook verifies ──► order created ──┐
   │       ├─ failure ──► retry / change method                │
   │       └─ abandon ──► cart preserved, recovery email       │
   ▼                                                           │
   /checkout/confirmation/[orderId] ◄──────────────────────────┘
   │ order number · items · delivery estimate · support contact
   └─► Continue shopping / View order
```

**Critical rules**

- Prices are **recalculated server-side** at every checkout step. A price sent by the client is never trusted.
- The order is created by the **webhook**, not by the browser redirect. A closed tab must not lose a paid order.
- The webhook is **idempotent** — a duplicate delivery must not create a second order or decrement stock twice.
- Stock is decremented on payment **capture**, not on add-to-cart.
- If the payment succeeds but order creation fails, the failure is alerted immediately and the payment is reconcilable — this is a money-loss path and gets explicit test coverage.

**States**

| Step | Loading | Error |
|---|---|---|
| Add to cart | Button spinner, disabled, no layout shift | Toast + reason; cart unchanged |
| Cart | Skeleton rows | Stale-price notice with an accept-and-continue action |
| Address | Field-level async PIN validation | Inline errors; focus moves to the first invalid field |
| Payment | Gateway modal | Distinct copy for declined / cancelled / network / timeout |
| Confirmation | — | If the order is not yet visible, poll briefly then show "processing", never "failed" |

---

## UF-03 — Search → product

```
Any page → Search (click, or `/` key)
   ▼
Search overlay opens, focus in the input
   │ types ≥ 2 characters
   │ debounced 200ms
   ▼
Suggestions: products (with thumbnails) · categories · "See all results"
   ├─ ↑ ↓ to move · Enter to open · Esc to close
   ├─ pick a suggestion ─► product or category page  ✅
   └─ Enter on the query ─► /search?q=...
                              │
                              ├─ results grid, result count, refinement
                              └─ zero results → suggested categories,
                                 popular products, WhatsApp "ask us"
```

**Rules:** requests are cancellable; a slow response never overwrites a newer one. Query state lives in the URL so results are shareable. Zero-result queries are logged for the client. Focus returns to the trigger on close.

---

## UF-04 — Evaluate credibility

The flow that decides whether any other flow completes.

```
Any page
   ├─ About      → who, origin, beliefs, sourcing, vision
   ├─ Quality    → sourcing → inspection → processing → QC → packaging → dispatch
   │               certifications (only if verified) · standards · hygiene
   └─ Locations  → verified addresses · facilities · distribution
        │
        └─ every one of these pages ends with a next step:
           browse products · wholesale enquiry · contact
```

**Rule:** none of these pages is a dead end. Each closes with a relevant action. **No claim appears on any of them without client-supplied evidence** (`OQ-018`, `OQ-019`, `OQ-020`, `OQ-021`).

---

## UF-05 — Wholesale / B2B enquiry

**Personas:** retailer, distributor, food business, exporter.
**Goal:** a qualified lead with enough detail to quote.

```
Entry: /wholesale (header, footer, homepage B2B block, PDP link, mega-menu)
   ▼
Wholesale landing
   │ who we supply · capabilities · pack formats · MOQ guidance
   │ process: enquiry → response → samples → quote → supply
   ▼
Enquiry form
   │ Name* · Company* · Country* · Email* · Phone*
   │ Product interest (multi-select from live categories)
   │ Estimated quantity · Message
   │ Turnstile · honeypot · rate limit
   ▼
Submit
   ├─ validation error → inline, focus to first error, nothing lost
   ├─ server error     → "we could not send this" + WhatsApp fallback
   │                     + form contents preserved
   └─ success ─► confirmation panel (not a redirect — keeps context)
                 │ "We'll respond within [X] business hours"
                 │ + WhatsApp "talk to our team now"
                 ├─ enquiry persisted to Postgres
                 ├─ notification email to the business
                 └─ acknowledgement email to the enquirer
```

**Rule:** the enquiry is **written to the database before the email is sent**. Email is best-effort; the database record is the source of truth. An email failure must never lose a lead.

---

## UF-06 — WhatsApp enquiry

```
Trigger
   ├─ floating button (all pages)      → generic message
   ├─ "Ask about this product" (PDP)   → product name + URL prefilled
   ├─ wholesale page                   → B2B intent prefilled
   └─ contact page                     → generic
        ▼
   Build wa.me deep link
   │ number from configuration (never hard-coded)
   │ message URL-encoded
        ▼
   Fire analytics event: whatsapp_click { source, product_id?, category? }
        ▼
   Open in a new tab
   ├─ mobile  → WhatsApp app
   └─ desktop → WhatsApp Web
```

**Example prefilled message (PDP):**

```
Hi Burla, I'd like to know more about [Product Name] ([Pack Size]).
https://[domain]/products/[slug]
```

**Rules:** never obscures the mobile sticky CTA bar; dismissible on mobile with the choice remembered for the session; hidden on `/checkout/*`; no third-party chat script — a plain link.

---

## UF-07 — Account creation and sign-in

```
Sign up
   email + password (or the chosen provider)
   → validate (server-side, shared Zod schema)
   → create user, send verification email
   → "check your inbox" screen with resend (rate-limited)
   → verify link → email confirmed → signed in

Sign in
   → success → return to the page the user came from
   → wrong credentials → generic error (never reveal whether the email exists)
   → unverified → prompt to resend verification
   → rate limited → clear, honest message with a wait time

Forgot password
   → always show the same success message regardless of whether the account exists
   → single-use, time-limited token
   → reset → all other sessions invalidated
```

**Rules:** browsing, searching and enquiring **never** require an account (FR-123). Account is offered at checkout, never forced. Post-auth redirect targets are validated against an allowlist — no open redirects.

---

## UF-08 — Returning customer reorder `[commerce]`

```
Sign in → /account/orders → order detail
   ├─ "Reorder" → adds all still-available items to cart
   │              → notice listing anything unavailable or changed in price
   └─ "Buy again" on a single item
```

---

## UF-09 — General contact

```
/contact
   ├─ direct channels: phone, email, WhatsApp, hours
   ├─ map (only for a verified address)
   └─ form: name, email, phone, subject, message
        → same validation, anti-spam, persistence and state model as UF-05
```

---

## UF-10 — Staff publishes a new product

The flow that determines whether the client is actually independent after launch.

```
Sign in to admin.burla.com  (staff account + MFA)
   ▼
Products → New
   │ name → slug auto-generates (editable, warns if it would change a live URL)
   │ category (required) · short descriptor · rich description
   │ images (alt text required — cannot publish without it)
   │ variants: pack size · SKU · price · MRP · GST rate · weight · stock
   │ information: ingredients · allergens · net quantity · shelf life ·
   │              storage · origin · manufacturer · FSSAI · consumer care · veg mark
   │ SEO: title · description · share image (auto-filled, overridable)
   ▼
Preview  → renders the real customer page against draft data
   ▼
Publish
   │ ├─ validation blocks publish if any legally required field is empty
   │ └─ audit_log entry written
   ▼
Revalidation webhook → burla.com invalidates product + category + sitemap tags
   ▼
Live on burla.com/products/[slug] within seconds
   → appears in its category, in search, and in the sitemap
```

**Rules:** publishing is impossible without alt text, a category and a complete legal information block. Slug changes prompt and auto-create a 301. Nothing here requires a developer.

---

## UF-10b — Staff updates stock

The client's stated reason for wanting an admin site.

```
Sign in to admin.burla.com
   ▼
Inventory
   │ every variant, current stock, low-stock flagged
   │ search by product or SKU · filter to low stock only
   │
   ├─► Adjust one variant
   │     │ new quantity or +/- delta
   │     │ reason (required): restock · adjustment · damage · return · correction
   │     │ optional note
   │     ▼
   │   Transaction: write inventory_movement + update variant + audit_log
   │     ▼
   │   Availability recalculates (in stock / low / out of stock)
   │     ▼
   │   Revalidation → customer site reflects it within seconds
   │
   └─► Bulk restock — update many variants in one submission
```

**Rules:** stock is never edited blind — every change writes an attributable movement record, so "why is this number wrong?" is always answerable. Stock cannot go negative. Setting a variant to zero updates availability on the customer site automatically rather than requiring a second manual step.

---

## UF-11 — Staff handles an enquiry

```
Notification email → admin.burla.com/enquiries
   │ list: date · type (contact / wholesale) · name · company · country · status
   │ filter by type, status, date · export CSV
   ▼
Open enquiry → full detail
   ├─ reply by email (mailto with context prefilled)
   ├─ reply by WhatsApp (deep link to the given number)
   └─ set status: new → in progress → quoted → won / lost
```

---

## UF-12 — Mobile-first browse

Mobile is the primary experience, not a reduction of the desktop one.

```
Mobile landing
   ├─ hero: one headline, one line of support, one primary CTA
   │        image sized for portrait, not a cropped desktop banner
   ├─ categories: horizontally scrollable cards with real edge-peek,
   │              or a two-column grid — never a stacked list of ten links
   ├─ sticky bottom bar on PDP: price + primary action
   ├─ WhatsApp button positioned so it never collides with that bar
   └─ drawer navigation: thumb-reachable, accordion categories
```

**Verified at 320, 375, 390 and 414px.** Specific hazards to check: the mega-menu must not appear at all on mobile; the filter panel becomes a bottom sheet; the product gallery is swipeable with visible pagination; forms never trigger iOS zoom (16px minimum input font size).

---

## Cross-cutting state model

Every flow honours this contract:

| State | Requirement |
|---|---|
| **Loading** | Skeletons matching the final layout's dimensions. No spinners on full pages. No layout shift. |
| **Empty** | Explains why it is empty and offers exactly one clear next step. |
| **Error** | Says what happened in plain language, what the user can do, and offers a fallback channel (usually WhatsApp). Never exposes a stack trace or an error code alone. |
| **Success** | Confirms explicitly, and offers a next action. |
| **Offline / network failure** | Detected and communicated; submitted form data preserved. |
| **Slow (> 3s)** | Progressive disclosure — show what has arrived rather than blocking everything. |
