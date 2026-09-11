# Orders — Burla Global Agri Products

How ordering works as built (2026-09-11), and the decisions taken to build
it that `DATABASE-DESIGN.md` §6 left open. Where this and the design
disagree, this records what was decided and why.

---

## 1. The flow

```
Add to cart ──► the cart lives in the browser (references only: product, pack size, qty)
Checkout    ──► sign in (or create an account) ── required
            ──► 1. delivery address   (a saved one, or a new one — saved on ordering)
            ──► 2. payment method     (cash on delivery | UPI | card)
            ──► 3. review, place order
Server      ──► re-check everything, price every line from the database,
                lock the pack sizes, check stock, write the order, take stock,
                write history ── one transaction
            ──► the customer lands on the order's page, cart emptied
Account     ──► "Your orders": status, items, total, address, history;
                cancel before it ships
```

## 2. Decisions

| Question | Decision | Why |
|---|---|---|
| Accounts | **Sign-in required to order.** Email + password. | The client's call (2026-09-11): "login for ordering, like e-commerce websites". Mobile OTP needs an SMS provider; the account model takes it later without change. |
| Guest checkout (FR-141) | **Not offered.** | Superseded by the above. |
| Staff side | **None.** No admin, no staff login. | The client's call (2026-09-11): "just a user login". Orders stay at *Confirmed* until a staff side exists. |
| Cash on delivery | **Built.** The order is `confirmed` at once; payment stays `pending` until delivered. | COD has no payment to wait for. This departs from the design's "the webhook creates the order" — that rule is for prepaid orders, and still holds for them. |
| UPI and cards | **Refused until Razorpay is integrated**, before anything is written. | An order must never wait on a payment the site cannot take. |
| Stock | **Taken when the order is placed** (COD), through `inventory_movements`, with the pack sizes locked `FOR UPDATE`. Returned on cancellation (reason `order_cancelled`). | FR-148 says "on capture"; COD has no capture. Prepaid orders will take stock on verified payment. |
| Delivery charge | **Sample rule:** ₹50, free from ₹499. `lib/delivery.ts`. | Placeholder until the client sets one (OQ-027). |
| Prices | **Sample**, `SAMPLE_PACKS` in `data/catalog.ts`. | Placeholder until the client's prices arrive. |
| Customer cancellation | Allowed while `pending`, `confirmed`, `processing` or `packed`. | As on Amazon and Flipkart: before it ships. |

## 3. Where the rules live

- **What an order costs** is decided on the server only (`orderService`):
  each line priced from `product_variants` by SKU, delivery from
  `lib/delivery.ts`, the total computed there. The browser sends no price.
- **The database** refuses what must never happen, whoever the caller:
  a total that does not add up (`orders_total_adds_up`), a line total that
  is not price × quantity, a negative stock, an edited order line
  (`order_items_fixed`), edited or deleted history (`order_events` is
  append-only). Migrations `0004_orders`, `0005_orders_integrity`.
- **Ownership:** every read and write of an order or address is by
  `(id, user_id)`. Another customer's order is "not found", never "forbidden".
- **Idempotency:** each checkout visit carries a key; the same key returns
  the same order, and the unique index settles a race between two requests.

## 4. Accounts and sessions

- Passwords: scrypt (Node crypto), per-hash parameters, never stored or
  logged in plain text. 8–128 characters.
- Sessions: a random token in an `HttpOnly`, `SameSite=Lax` cookie (Secure
  in production); only its SHA-256 hash is stored. 30 days.
- Sign-in answers the same way, in the same time, for an unknown email and a
  wrong password; five failures per email in 15 minutes pause attempts
  (in memory — per server process; Redis when there are several).
- After sign-in, only a path on this site is followed (`safeNextPath`).

## 5. Next

1. Razorpay for UPI and cards: create the payment for the server's total,
   verify the signature and the webhook on the server, then confirm the
   order and take stock.
2. Order emails (Resend) once a sending domain exists (OQ-033).
3. A staff side, if and when the client wants one — until then, orders stay
   at *Confirmed*.
4. Real prices, pack sizes and delivery charges from the client.
