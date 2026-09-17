# The simple admin — as built

The admin is used by the business owner, not by developers. Every screen follows one path: **open → see → edit → save**. This document records what that means in code, so later work keeps it that way.

Roles and sessions are in `ADMIN-ROLES-PERMISSIONS.md`. How the admin sits beside the shop is in `ADMIN-ARCHITECTURE.md`.

## 1. Screens

| Menu | What the owner does there | Files (`apps/admin/src`) |
|---|---|---|
| Home | Greeting, four counts (products, orders, customers, new enquiries), big buttons for common jobs | `app/(app)/page.tsx`, `server/repositories/dashboardRepository.ts` |
| Products | Search, pick a category, open a card, edit, save. Add Product is one form | `app/(app)/products/*`, `components/products/ProductEditor.tsx`, `server/products.ts` |
| Categories | Category cards with product counts; edit name, photo, description, show on website, subcategories | `app/(app)/categories/*`, `components/categories/*`, `server/categories.ts` |
| Orders | New / Preparing / Ready / On the way / Delivered / Cancelled, each with one big next-step button | `app/(app)/orders/*`, `lib/orderSteps.ts`, `server/orders.ts` |
| Customers | List and detail: contact details, orders, amount spent | `app/(app)/customers/*`, `server/customers.ts` |
| Enquiries | Inbox; reply by email, phone or WhatsApp; mark as contacted, done or not genuine | `app/(app)/enquiries/*`, `server/enquiries.ts` |
| Website | Homepage headings and text; which products appear on the homepage | `app/(app)/website/*`, `server/website.ts` |
| Settings | Business details shown on the site, password, recent activity | `app/(app)/settings/*`, `server/website.ts`, `lib/activity.ts` |

A menu item only appears when the account can use it (`components/Nav.tsx`). Every page and every action checks permission again on the server.

## 2. Words

Database words never reach the screen. The translation:

| In the database | On screen |
|---|---|
| product `published` / `draft` | On website / Hidden |
| product `archived` | Deleted (not shown in the admin) |
| variant | Pack size |
| variant `active` / `inactive` | Available / Out of stock |
| variant `removed` | Gone from the list; kept for old orders |
| SKU | Not shown. Made automatically: `BGA-<NAME>-<grams>` |
| slug | "Web address", only under More options; made from the name |
| subcategory (child category) | Subcategory |
| order `confirmed` / `processing` / `packed` / `shipped` | New order / Preparing / Ready / On the way |
| enquiry `in_progress`, `quoted` / `won`, `lost` / `spam` | Contacted / Done / Not genuine |
| audit log action | A sentence, e.g. "Changed the price of Moringa Powder" (`lib/activity.ts`) |

## 3. How a save reaches the shop

1. The form posts to a server action. The action checks the session and permission.
2. The input is parsed with a strict Zod schema (`lib/productForm.ts`, `server/categories.ts`, `server/website.ts`). Unknown fields are refused. Only named columns are written.
3. The change and its audit row are written in one transaction.
4. The admin calls the shop's `POST /api/revalidate` with `REVALIDATE_SECRET`. The shop drops the cached pages for that product, category or the site text.
5. The next visitor sees the new data. PostgreSQL is the only source of truth.

Photos are checked and re-encoded with sharp (at most 1600 px, WebP, metadata removed, 10 MB upload limit). Locally they are stored in `MEDIA_DIR` and served by the shop at `/media/...`. Production needs object storage (R2) before launch.

## 4. Stock

Stock is not counted by default (`track_inventory = false`). A pack is either available or out of stock, which the owner sets with one switch. Packs that do count stock still get it back when an order is cancelled.

## 5. Verified by hand (16–17 Sept 2026, local database)

- Price change (Moringa Powder 100 g), photo change, hide and show again: the database and the shop page matched each time.
- Add product with two pack sizes, then delete it. The shop page appeared, then returned 404.
- Rename a category; add and delete a subcategory.
- Move an order from New to Delivered. Cash-on-delivery payment was marked received.
- Contact form on the shop → Enquiries inbox → Mark as contacted.
- Homepage heading, homepage products, and business hours changed and seen on the shop, then restored.
- Every screen at 375 px and 768 px wide has no sideways scrolling. The phone menu opens and closes.
- `npm run typecheck`, `npm run lint` (no errors), `npm test` and both production builds pass.

All test data has been removed and the edited values restored. The audit rows from testing remain, because the activity log is not edited.

## 6. Known limits

- A cash-on-delivery order starts as "New order"; there is no separate confirm step.
- Uploaded photos are stored on local disk only (`MEDIA_DIR`). Production needs R2.
- The WhatsApp number still comes from the environment, not from Settings.
- The storefront has 8 lint warnings (`react-hooks/set-state-in-effect`) in older components. They work, but should move off effects later.
