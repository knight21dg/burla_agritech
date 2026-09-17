# The simple admin — as built

The admin is used by the business owner, not by developers. Every screen follows one path: **open → see → edit → save**. This document records what that means in code, so later work keeps it that way.

Roles and sessions are in `ADMIN-ROLES-PERMISSIONS.md`. How the admin sits beside the shop is in `ADMIN-ARCHITECTURE.md`.

## 1. Screens

| Menu | What the owner does there | Files (`apps/admin/src`) |
|---|---|---|
| Home | Greeting, four counts (products, orders, customers, new enquiries), big buttons for common jobs | `app/(app)/page.tsx`, `server/repositories/dashboardRepository.ts` |
| Products | Search, pick a category, open a card, edit, save. Each card also has Available / Out of stock and Delete. Add Product is one form | `app/(app)/products/*`, `components/products/ProductEditor.tsx`, `server/products.ts` |
| Stock | Packets of every pack size; Add supply, Set count, Start / Stop counting; recent stock changes. Home warns when stock runs low | `app/(app)/stock/*`, `components/stock/StockRow.tsx`, `server/stock.ts`, `lib/stock.ts` |
| Categories | Category cards with product counts; edit name, photo, description, show on website, subcategories | `app/(app)/categories/*`, `components/categories/*`, `server/categories.ts` |
| Orders | New / Preparing / Ready / On the way / Delivered / Cancelled. A new order has Accept and Reject, in the list and on its page; later orders have one next-step button | `app/(app)/orders/*`, `lib/orderSteps.ts`, `server/orders.ts` |
| Customers | List with Account details and Deactivate / Activate; detail with account details, orders, amount spent | `app/(app)/customers/*`, `server/customers.ts` |
| Enquiries | Inbox; reply by email, phone or WhatsApp; mark as contacted, done or not genuine. The WhatsApp taps tab lists taps on the website's WhatsApp buttons | `app/(app)/enquiries/*`, `server/enquiries.ts` |
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

## 4. WhatsApp taps

The website's WhatsApp buttons open WhatsApp directly, so the chat never passes through this system. The website only records a tap: which button, which page, when (`POST /api/whatsapp-tap`, table `whatsapp_taps`). No name, number or message is stored or available.

A tap is ignored when it comes from another website, has any unexpected field, repeats the same button on the same page from the same visitor within 10 minutes, or is one of more than 30 from one address in an hour. Addresses are stored only as a salted hash.

## 5. Accepting and rejecting orders

- Accept moves a new order to Preparing. Reject cancels it and notes "Rejected by the shop" in its history.
- If the customer paid online, the Reject confirmation and the result both remind the owner to refund it from the payment dashboard. Nothing is refunded automatically.
- After Accept, the order page offers **Send confirmation on WhatsApp**. It opens WhatsApp with the message already written to the customer's number (`lib/orderMessages.ts`), and the owner presses send. The same button stays on the order while it is Preparing.
- The message lists only what the order says: items, total, how it is paid, city and PIN code. It promises no delivery date.
- Nothing is sent automatically. That would need Meta's WhatsApp Business Platform (a verified business account, an approved message template and an access token).

## 6. Deactivating a customer

Only an admin can deactivate or activate an account (`user.manage`). Deactivating sets `users.status` to `suspended`, in one transaction with its audit row, and:

- deletes the customer's sessions, so they are signed out straight away; the website already refuses sessions and sign-in for any account that is not active;
- makes checkout refuse any phone number the account has used (on the account, a saved address or a past order), compared by the last ten digits, even when the order comes from a different account (`isPhoneOfDeactivatedAccount`);
- leaves orders already placed as they are.

Signing in with the right password to a deactivated account says it has been deactivated; a wrong password gets the usual message, so nobody learns which accounts exist. Activating sets the status back to `active`; nothing is deleted either way.

## 7. Stock

Each pack size is either **counted** or **not counted** (`track_inventory`). Nothing is counted until the owner starts; a pack not counted is simply on sale, or out of stock when marked so.

- **Add supply** adds packets (ledger reason `restock`). **Set count** sets the number on the shelf (`correction`); if orders came in while the form was open, they still count. **Stop counting** clears the number. Starting to count begins from 0, never from an old leftover figure.
- Every change is a row in `inventory_movements` (append-only); a database trigger keeps `stock_quantity` equal to the total. The pack row is locked during a change, so an order at the same moment is counted once.
- An order takes packets and refuses more than are left; cancelling or rejecting an order puts them back.
- The website shows "Only N left" when N is at or below the pack's low-stock level (5 by default), "Out of stock" at 0, and "In stock" otherwise. It never shows a larger number. The quantity picker stops at what is left.
- Orders, cancellations and admin stock changes refresh the website's cached pages at once.
- Supply added to a pack marked out of stock puts it back on sale.

## 8. Verified by hand (16–17 Sept 2026, local database)

- Price change (Moringa Powder 100 g), photo change, hide and show again: the database and the shop page matched each time.
- Accept and Reject from the order list, including the refund reminder for an order paid online; the order page for a new order.
- WhatsApp taps from the floating button and the footer, shown under Enquiries with the product name.
- Stock on Banana Powder 100 g: set to 3, and the website said "Only 3 left" and would not let anyone pick 4. A website order made it 2 ("Only 2 left" at once); rejecting that order made it 3; supply of 10 made it 13 ("In stock"). Then set back to not counted.
- Deactivating a customer who was signed in: they were signed out; another account's order with the deactivated number was refused and nothing was saved; activating again lifted both.
- From the product list: Out of stock, Available and Delete on a test product. The shop page said "Out of stock", then "not found" after Delete.
- Add product with two pack sizes, then delete it. The shop page appeared, then returned 404.
- Rename a category; add and delete a subcategory.
- Move an order from New to Delivered. Cash-on-delivery payment was marked received.
- Contact form on the shop → Enquiries inbox → Mark as contacted.
- Homepage heading, homepage products, and business hours changed and seen on the shop, then restored.
- Every screen at 375 px and 768 px wide has no sideways scrolling. The phone menu opens and closes.
- `npm run typecheck`, `npm run lint` (no errors), `npm test` and both production builds pass.

All test data has been removed and the edited values restored. The audit rows from testing remain, because the activity log is not edited.

## 9. Known limits

- The WhatsApp confirmation is sent by the owner from their phone, not automatically; a rejection is not sent at all.
- Rejecting a paid online order does not refund it automatically.
- Uploaded photos are stored on local disk only (`MEDIA_DIR`). Production needs R2.
- The WhatsApp number still comes from the environment, not from Settings.
- The storefront has 8 lint warnings (`react-hooks/set-state-in-effect`) in older components. They work, but should move off effects later.
