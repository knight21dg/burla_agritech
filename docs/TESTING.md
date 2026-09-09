# Testing Strategy — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/TESTING.md` |
| Version | 1.1 — adds test-data rules and the cutover regression suite |
| Date | 2026-09-09 |
| Tools | Vitest · Testing Library · Playwright · axe-core · Lighthouse CI |

---

## 1. Philosophy

We test **behaviour users depend on**, not implementation detail. A test that breaks when a `className` changes is a liability; a test that breaks when checkout stops working is the point.

**Risk-weighted coverage.** Effort is allocated by consequence:

| Risk tier | Areas | Depth |
|---|---|---|
| **Critical** — money, data loss, legal | Checkout, payment webhooks, price calculation, stock decrement and adjustment, publish validation, enquiry persistence, auth and admin authorisation | Exhaustive, including failure and adversarial paths |
| **High** — conversion | Product page, category browse, search, WhatsApp links, forms | E2E + component |
| **Medium** — content | Marketing pages, navigation, footer | Smoke + a11y |
| **Low** — presentation | Layout details, copy | Manual review |

---

## 2. The pyramid

```
        ╱ E2E — Playwright ╲            ~25 specs, the journeys in USER-FLOWS.md
      ╱─────────────────────╲
     ╱ Integration — Vitest  ╲          server actions, DB, API, webhooks
   ╱───────────────────────────╲
  ╱ Component — Testing Library ╲       interactive components + their states
 ╱───────────────────────────────╲
╱ Unit — Vitest                   ╲     schemas, price maths, builders, utils
───────────────────────────────────
        Static: TypeScript strict · ESLint · build
```

---

## 3. Unit tests

**Target: 90%+ on `lib/` and `schemas/`.** These are pure and cheap to test, and bugs here corrupt everything downstream.

Priority areas:

| Area | What is tested |
|---|---|
| Zod schemas | Valid input accepted; every invalid case rejected with the right field error; boundary values; Indian phone and PIN-code formats |
| Price calculation | Subtotal, tax, shipping, discount, total. Integer arithmetic only. Rounding at every boundary. **Never a floating-point rupee** |
| WhatsApp link builder | Correct encoding of spaces, `#`, `&`, emoji, newlines and non-Latin characters; number formatting; product context |
| SEO builders | Title truncation, description length, canonical construction, JSON-LD shape validity |
| Slug and redirect logic | Slug generation, collision handling, redirect chain resolution |
| Cart logic | Add, merge duplicate lines, update, remove, quantity limits, empty-cart edge cases |
| Date and shelf-life formatting | IST rendering, timezone correctness |
| Availability resolution | Which of in stock / low / out / enquire-only is shown given each data state |
| **Taxonomy rendering** | A category with no types renders a product grid; with types and <8 products renders filter chips; with types and >=8 renders type cards; a type with one product links straight to it |
| **Breadcrumb building** | Correct trail for 2-level and 3-level products; correct when a product is recategorised |

---

## 4. Component tests

Rendered with Testing Library, queried by **role and accessible name** — which means the tests double as accessibility assertions.

| Component | Cases |
|---|---|
| Product card | With price / without price; out of stock; long name truncation; missing image; single link, no nested interactives |
| Variant selector | Selection updates price, SKU and availability; unavailable variants disabled and announced |
| Product gallery | Keyboard navigation, thumbnail sync, image error fallback, swipe on touch |
| Search overlay | Opens on `/`, debounces, arrow-key navigation, `Esc` closes, focus restored to trigger, empty state |
| Mega menu | Opens on hover and keyboard, `Esc` closes, focus order correct, closes on outside click, `aria-expanded` accurate |
| Mobile drawer | Focus trap, scroll lock, closes on route change, restores focus |
| Forms | Field errors, error summary, focus moves to first error, submit disabled while pending, values preserved on server error |
| WhatsApp button | Correct `href`; analytics event fired; hidden on checkout; dismissible on mobile |
| Cart drawer | Add, update, remove, empty state, total recalculation |
| Skeletons | Dimensions match loaded content — the CLS regression guard |
| **Product carousel** | Scroll-snap positions; arrows disable at each end; keyboard arrows scroll; every card reachable by Tab; partial next card visible at every breakpoint; instant scroll under `prefers-reduced-motion`; no autoplay |
| **Category bar** | All ten categories present; active item marked; scrolls horizontally below 1280px without clipping the last item |
| **Breadcrumbs** | Trail matches the URL exactly; `aria-current` on the last item; JSON-LD mirrors the visible trail |

---

## 5. Integration tests

Run against a real Postgres instance (Neon branch or a container), never mocks of the database.

| Area | Cases |
|---|---|
| Enquiry submission | Persists to DB; email failure does **not** lose the record; rate limit enforced; spam rejected; validation errors returned per field |
| Auth | Sign-up, verification, sign-in, wrong password, unverified account, reset flow, token reuse rejected, session invalidation on password change |
| Cart | Guest cart created; merged into the user cart on sign-in; expiry |
| Checkout | Server-side price recalculation; **tampered client price rejected**; out-of-stock item blocks checkout |
| Payment webhook | Valid signature accepted; invalid rejected; **duplicate `event_id` is a no-op**; order created exactly once; stock decremented exactly once |
| Stock | Concurrent purchases of the last unit — one succeeds, one fails cleanly. No overselling |
| Revalidation | The admin's publish webhook invalidates only the correct cache tags; an unsigned or wrongly-signed request is rejected; a failed revalidation does not roll back the saved change |
| Authorisation | A user cannot read another user's order or address (IDOR) |
| **Admin authorisation** | A `customer` role cannot reach any admin route or server action; a `staff` role cannot manage users or legal settings; a customer session cookie is not accepted by the admin origin |
| **Publish validation** | A product missing any legally required field cannot be published; an image without alt text blocks publish |
| **Stock adjustment** | Writes a movement record, updates the variant, writes an audit entry, and cannot drive stock negative — all in one transaction, all or nothing |
| **Audit log** | Every admin mutation produces an entry with actor, before and after |

---

### 5.1 Test data — rules

**Where we are today:** the repository audit at `c17cf19` found **zero tests**. No Vitest, no Playwright, no CI. Everything in this document is a plan, not a description, and that is worth stating plainly rather than letting the detail imply otherwise.

Four rules, before the first test is written:

1. **Tests never use production data.** Not a copy, not a subset, not "just the catalogue". Customer PII in a CI log is a breach with extra steps.
2. **Tests never run against a production database.** `vitest.setup.ts` calls `assertNotProduction("run tests")` before opening a connection (`ENVIRONMENT.md` §5). The check also catches a production connection string pasted into a local `.env`, which is the case a simple `APP_ENV` check would miss.
3. **Each suite owns its data.** Fixtures are created by the test and removed after it, against a dedicated Neon branch that is truncated between suites. Tests that depend on data another test left behind fail in a different order.
4. **Seeded demo data is clearly demo.** `seed/demo.ts` refuses to run when `APP_ENV=production` (`MIGRATIONS.md` §9), and there is a test asserting that it refuses.

### 5.2 Authorization suite

The twelve authorization tests in `AUTHORIZATION.md` §10 are not a subset of the table above — they are the acceptance criteria for that document. If they do not exist, authorization is not implemented, whatever the code looks like.

The one most often missing: **Customer A requesting Customer B's order id must return 404, not 403.** A 403 confirms the row exists.

---

## 5.3 Cutover regression suite — temporary, and the most valuable tests in the project

While `catalog.ts` is being replaced by the database (`MIGRATIONS.md` Part B), one assertion matters more than any other:

> **The rendered HTML must be identical before and after each cutover commit.**

The brief is explicit that the frontend is not being redesigned. So any visual difference after a cutover commit is a bug in the cutover, not an improvement — and without a diff, a subtle one (a dropped variant, a reordered list, a missing `mrpMinor`) ships unnoticed.

```
1. Before starting: render every route against the seed data, snapshot the HTML.
2. After each cutover commit: re-render, diff.
3. Any difference is investigated. None is accepted as "close enough".
```

These snapshots are deleted once `catalog.ts` is deleted. They exist to protect one migration, and keeping them afterwards would freeze the markup against future legitimate change.

---

## 6. End-to-end tests

Playwright, against a preview deployment with seeded data. Each flow from `USER-FLOWS.md` maps to a spec.

| Spec | Flow | Priority |
|---|---|---|
| `discover-enquire.spec` | UF-01 | Critical |
| `purchase.spec` | UF-02 `[commerce]` | Critical |
| `search.spec` | UF-03 | Critical |
| `credibility.spec` | UF-04 | High |
| `wholesale.spec` | UF-05 | Critical |
| `whatsapp.spec` | UF-06 | Critical |
| `auth.spec` | UF-07 | High |
| `reorder.spec` | UF-08 `[commerce]` | Medium |
| `contact.spec` | UF-09 | High |
| `admin-product-publish.spec` | UF-10 — create, validate, preview, publish, appears live | Critical |
| `admin-stock.spec` | UF-10b — adjust stock, movement recorded, availability updates on the customer site | Critical |
| `admin-auth.spec` | Staff sign-in, MFA, invitation flow, no public sign-up, role gating | Critical |
| `admin-enquiries.spec` | UF-11 | Medium |
| `mobile-browse.spec` | UF-12 | Critical |
| `navigation.spec` | Header, mega menu, footer, breadcrumbs | High |
| `seo.spec` | Titles, canonicals, JSON-LD, sitemap, robots | High |
| `errors.spec` | 404, 500, offline, empty states | High |

**Projects:** Desktop Chrome 1440 · Desktop Safari 1280 · Mobile Chrome (Pixel 7) · Mobile Safari (iPhone 14). Critical specs run on all four; the rest on desktop Chrome plus mobile Chrome.

**Stability rules:** no arbitrary waits — always wait for a condition. Query by role and accessible name, never by CSS class. Every test creates its own data and cleans up. Payment tests use Razorpay test mode; **the webhook is invoked directly with a signed payload**, not simulated through the UI. A flaky test is fixed or deleted, never retried into green.

---

## 7. Accessibility testing

Automated tooling catches roughly a third of real accessibility problems. Manual passes are mandatory.

**Automated:** `@axe-core/playwright` on every E2E route. **CI fails on any critical or serious violation.**

**Manual, per page, before sign-off:**
- [ ] Keyboard only — every action reachable, focus always visible, order logical, no traps
- [ ] Screen reader (NVDA or VoiceOver) — headings navigable, images described, forms labelled, errors announced, dialogs announced
- [ ] 200% browser zoom — no loss of content or function
- [ ] 320px width — no horizontal scroll
- [ ] `prefers-reduced-motion` — all non-essential motion removed
- [ ] Colour contrast verified against `DESIGN-SYSTEM.md` §3.3
- [ ] Forms usable without colour as the only error signal

---

## 8. Performance testing

Lighthouse CI on every PR against preview, budgets enforced:

| Metric | Budget | Action if exceeded |
|---|---|---|
| Performance (mobile) | ≥ 95 | Blocks merge |
| Accessibility | 100 | Blocks merge |
| Best Practices | 100 | Blocks merge |
| SEO | 100 | Blocks merge |
| LCP | ≤ 2.0s | Blocks merge |
| CLS | ≤ 0.05 | Blocks merge |
| TBT | ≤ 200ms | Warns |
| Initial JS | ≤ 130KB home / 160KB PDP | Blocks merge |

Bundle analysis on every PR with a size diff comment. Field data (real users) reviewed monthly through PostHog and Search Console — **lab scores that pass while field data fails means the lab configuration is wrong, not the users.**

---

## 9. Content and compliance testing

Specific to a food business — these prevent shipping something legally or factually wrong:

- [ ] No `[PLACEHOLDER]` string reachable in production — automated crawl assertion
- [ ] No lorem ipsum anywhere — automated
- [ ] Every product page renders the complete mandatory information block (`SECURITY.md` §8.2)
- [ ] FSSAI licence number present in the footer and on product pages
- [ ] Legal entity, address, GSTIN and grievance officer present in the footer
- [ ] All four policy pages published with real content
- [ ] No certification, award, testimonial or review present without a recorded evidence reference
- [ ] No health claim present without a recorded evidence reference
- [ ] Every image has non-empty, meaningful alt text (decorative images excepted)
- [ ] Every internal link resolves — full-site crawl, zero 404s

---

## 10. Manual test matrix

| Device / context | Checked |
|---|---|
| iPhone SE (375) | Layout, sticky bar, WhatsApp button collision, form zoom |
| iPhone 14 Pro (393) | Gallery swipe, drawer |
| Pixel 7 (412) | Same |
| iPad (768) | Grid transitions, mega menu absence |
| Laptop 1440 | Full experience |
| Desktop 1920 | Max-width behaviour, no stretched imagery |
| Slow 3G throttle | Perceived performance, skeletons, image loading |
| JS disabled | Core content readable, navigation usable |
| Dark OS theme | Site renders light correctly, no forced-dark artefacts |
| Windows high contrast | Content remains legible |

---

## 11. CI pipeline

```
PR opened
  ├─ Type check (tsc --noEmit)          blocks
  ├─ Lint (ESLint)                      blocks
  ├─ Unit + component (Vitest)          blocks
  ├─ Build                              blocks
  ├─ Deploy preview (Vercel)
  ├─ Integration tests (Neon branch)    blocks
  ├─ E2E (Playwright, 4 projects)       blocks
  ├─ Accessibility (axe)                blocks on critical/serious
  ├─ Lighthouse CI                      blocks on budget breach
  ├─ Bundle size diff                   comments; blocks on budget breach
  └─ npm audit                          blocks on high/critical

Merge to main
  ├─ All of the above
  ├─ Deploy production
  ├─ Smoke tests against production     rolls back on failure
  └─ Sentry release marker
```

---

## 12. Definition of done — testing

A feature is not done until:

- [ ] Unit tests for its logic
- [ ] Component tests for its interactive UI, including error and empty states
- [ ] E2E coverage if it is part of a critical journey
- [ ] Accessibility verified — automated and manual
- [ ] Verified at all breakpoints in §10
- [ ] Loading, empty and error states each tested, not just the happy path
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] Performance budget still met
