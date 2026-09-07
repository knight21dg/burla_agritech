# Analytics Plan — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/ANALYTICS.md` |
| Version | 0.1 |
| Date | 2026-09-07 |
| Tools | PostHog (product analytics) · Sentry (errors) · Search Console (organic) |

---

## 1. The questions analytics must answer

Instrumentation exists to answer business questions, not to collect data. These are the questions:

| # | Question | Signal |
|---|---|---|
| Q1 | Which products interest people most? | `product_view` by product |
| Q2 | Which categories convert to product views? | `category_view` → `product_view` funnel |
| Q3 | How many people contact Burla via WhatsApp, and from where? | `whatsapp_click` by source |
| Q4 | What are people searching for that we do not sell? | `search` with `results_count = 0` |
| Q5 | Where do people abandon checkout? | Checkout funnel step drop-off |
| Q6 | Is the wholesale channel working? | `wholesale_enquiry_submit` by country and product interest |
| Q7 | Do the trust pages actually help? | Sessions viewing About/Quality → conversion rate |
| Q8 | Which traffic sources bring buyers, not just visitors? | Source attribution on conversion events |
| Q9 | Is mobile performing as well as desktop? | Every metric segmented by device |
| Q10 | Where does the experience break? | Sentry errors + rage-click detection |

**If an event does not help answer one of these, it is not implemented.**

---

## 2. Event taxonomy

Naming: `snake_case`, `object_action`. Properties are typed and defined once in `lib/analytics/events.ts` — no ad-hoc `capture()` calls with free-form strings anywhere in the codebase.

### 2.1 Discovery

| Event | Properties |
|---|---|
| `page_view` | `path`, `referrer`, `device_type` (automatic) |
| `category_view` | `category_id`, `category_name`, `product_count` |
| `product_view` | `product_id`, `product_name`, `category`, `price_minor?`, `availability`, `position?`, `list_source` |
| `product_list_view` | `list_source`, `item_count`, `product_ids[]` |
| `product_click` | `product_id`, `list_source`, `position` |
| `filter_apply` | `category`, `filter_type`, `filter_value`, `results_count` |
| `sort_apply` | `category`, `sort_by` |

### 2.2 Search

| Event | Properties |
|---|---|
| `search` | `query`, `results_count`, `source` (overlay / page) |
| `search_result_click` | `query`, `product_id`, `position` |
| `search_no_results` | `query` — **the highest-value event on the site for product planning** |

### 2.3 Conversion

| Event | Properties |
|---|---|
| `whatsapp_click` | `source` (floating / pdp / wholesale / contact / footer), `product_id?`, `category?` |
| `contact_form_start` | `form_type` |
| `contact_form_submit` | `form_type`, `subject` |
| `wholesale_enquiry_start` | — |
| `wholesale_enquiry_submit` | `country`, `product_interest[]`, `quantity_band`, `has_company` |
| `phone_click` | `source` |
| `email_click` | `source` |
| `form_error` | `form_type`, `field`, `error_type` — **exposes bad form design** |

### 2.4 Commerce `[if enabled]`

| Event | Properties |
|---|---|
| `add_to_cart` | `product_id`, `variant_id`, `quantity`, `price_minor`, `source` |
| `remove_from_cart` | `product_id`, `variant_id`, `quantity` |
| `cart_view` | `item_count`, `cart_value_minor` |
| `begin_checkout` | `item_count`, `cart_value_minor` |
| `add_shipping_info` | `shipping_method`, `state` |
| `add_payment_info` | `payment_method` |
| `purchase` | `order_id`, `value_minor`, `currency`, `item_count`, `items[]`, `shipping_minor`, `tax_minor`, `is_first_order` |
| `payment_failed` | `reason_code`, `payment_method` |
| `checkout_abandoned` | `last_step`, `cart_value_minor` |

### 2.5 Account

| Event | Properties |
|---|---|
| `signup_start` / `signup_complete` | `method`, `source` |
| `login` | `method` |
| `logout` | — |
| `email_verification_sent` / `_complete` | — |
| `password_reset_request` / `_complete` | — |

### 2.6 Engagement

| Event | Properties |
|---|---|
| `trust_page_view` | `page` (about / quality / locations), `scroll_depth_max` |
| `product_gallery_interact` | `product_id`, `image_index` |
| `variant_select` | `product_id`, `variant_id` |
| `newsletter_subscribe` | `source` |
| `outbound_click` | `destination` (instagram / facebook / youtube) |

---

## 3. Funnels

| Funnel | Steps |
|---|---|
| **Discovery → enquiry** | `page_view` → `category_view` → `product_view` → `whatsapp_click` |
| **Discovery → purchase** | `product_view` → `add_to_cart` → `begin_checkout` → `add_shipping_info` → `add_payment_info` → `purchase` |
| **Search → conversion** | `search` → `search_result_click` → `product_view` → conversion |
| **Wholesale** | `page_view /wholesale` → `wholesale_enquiry_start` → `wholesale_enquiry_submit` |
| **Trust** | `trust_page_view` → any conversion event |

Every funnel is segmented by device, source and new vs returning. **Mobile and desktop are analysed separately** — the mobile experience is the primary one and an aggregate number hides its problems.

---

## 4. Dashboards for the client

Three dashboards, built for non-analysts, reviewed in the handover session:

**Weekly business view** — sessions, top 10 products by view, top categories, WhatsApp clicks, enquiries received, orders and revenue (if commerce), conversion rate.

**Product insight** — product views ranked, view-to-conversion by product, zero-result search terms, filter usage, out-of-stock views (demand for things we cannot sell).

**Experience health** — Core Web Vitals field data, error rate, form abandonment by field, mobile vs desktop conversion gap, 404 hits.

---

## 5. Privacy

Non-negotiable, and aligned with DPDP Act 2023 (`SECURITY.md` §8.4):

| Rule | Implementation |
|---|---|
| No PII in event properties | Never send name, email, phone or address. User identification uses an opaque ID only |
| IP handling | Anonymised at ingest |
| Search queries | Captured — but they are user-typed, so any query resembling an email or phone number is redacted before send |
| Session recording | **Off.** It would capture form input on a site handling addresses and payment |
| Cookie consent | Analytics loaded only after consent where consent is required; the banner must not cause layout shift and must not block content |
| Do Not Track | Honoured |
| Third-party pixels | None in V1. If marketing later requires Meta or Google Ads pixels, they are added behind consent with a documented data-sharing assessment |
| Data retention | 24 months, then aggregated |
| Loading | Analytics never blocks rendering; loaded with `afterInteractive` and excluded from the critical path |

---

## 6. Implementation rules

- One typed wrapper module. Components call `track.productView({...})`, never `posthog.capture('product_view', {...})` — this keeps names and property shapes consistent and makes renaming safe.
- Server-side events for anything that must not be lost to an ad-blocker or a closed tab: `purchase`, `wholesale_enquiry_submit`, `contact_form_submit`.
- Client-side for interaction events.
- Every event fires exactly once per occurrence — deduplication tested, because double-counted purchases destroy trust in the data.
- Analytics failures are silent to the user and never break a flow.
- A `debug` mode logs events to the console in development so instrumentation can be verified while building.
- **Instrumentation is part of the feature, not a follow-up ticket.** A feature without its events is not done.

---

## 7. Validation before launch

- [ ] Every event in §2 fires with the correct properties — verified manually in PostHog live view
- [ ] No event fires twice
- [ ] No PII present in any event payload — verified by inspecting real captured events
- [ ] Funnels populate correctly with test traffic
- [ ] Server-side events arrive with an ad-blocker enabled
- [ ] Consent flow verified — no analytics before consent
- [ ] Dashboards built and shown to the client
- [ ] Search Console linked and receiving data
- [ ] Sentry receiving errors with correct release tagging and no PII
