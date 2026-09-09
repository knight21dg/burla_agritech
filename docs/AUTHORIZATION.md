# Authorization — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/AUTHORIZATION.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |
| Companion | `AUTHENTICATION.md` — who you are. This document — what you may do |

---

## 1. The one rule

> **Authorization happens on the server, inside the service, on every call.**

Not in a middleware alone. Not by hiding a link. Not by a `role` prop passed down from a client component.

Hiding the "Edit product" button is a courtesy to the user. It is not a security control — anyone can call the Server Action directly. Route middleware is a useful first gate, but it sees a URL, not a row, so it cannot answer *"is this **your** order?"*.

So the check lives where the decision is made: in the service, next to the data.

```ts
export async function updateProduct(actor: Actor, id: string, input: unknown) {
  requireRole(actor, ["content_manager", "admin"]);   // ← before anything else
  const data = updateProductSchema.parse(input);
  …
}
```

Middleware still runs — it redirects anonymous visitors away from `/admin` so they see a login page rather than a permission error. That is UX. The service check is the security.

---

## 2. Roles

Five, and no more until a real need appears. A role is a job, not a person; a person may hold more than one.

| Role | Who | Exists because |
|---|---|---|
| `customer` | anyone who registers | Owns their own account, orders, addresses |
| `content_manager` | whoever writes the site copy | Can publish products and pages, cannot see orders or customers |
| `order_manager` | whoever packs and ships | Can see and fulfil orders, cannot change prices |
| `staff` | general office | Reads enquiries, replies, updates stock |
| `admin` | the partners | Everything, including users, roles and legal settings |

The split between `content_manager` and `order_manager` matters for a family business that will hire: the person editing photographs does not need customer phone numbers.

Roles are stored in `user_roles` (many-to-many), never as a string column on `users`, so a second role is a row rather than a schema change.

`admin` is **not** a superuser bypass in code. It appears in the same allowlists as every other role, so the permission matrix stays readable and an accidental "if admin, skip all checks" branch never exists.

---

## 3. Permission matrix

`○` denotes *own rows only* — ownership is checked, not just the role.

| Capability | customer | content_manager | order_manager | staff | admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Browse published catalogue | ✔ public | ✔ | ✔ | ✔ | ✔ |
| View draft / unpublished product | | ✔ | | ✔ | ✔ |
| Create / edit product, variant, media | | ✔ | | | ✔ |
| Publish / unpublish / archive product | | ✔ | | | ✔ |
| Edit taxonomy (categories, types) | | ✔ | | | ✔ |
| Edit page content, policies | | ✔ | | | ✔ |
| Adjust stock | | | ✔ | ✔ | ✔ |
| Read enquiries | | | | ✔ | ✔ |
| Reply to / close enquiry | | | | ✔ | ✔ |
| Place an order `[commerce]` | ✔ ○ | | | | |
| View own orders | ✔ ○ | | | | |
| View all orders | | | ✔ | ✔ | ✔ |
| Change order status, refund | | | ✔ | | ✔ |
| Manage own addresses | ✔ ○ | | | | |
| View customer PII | | | ✔ | ✔ | ✔ |
| Create / disable users, assign roles | | | | | ✔ |
| Edit legal settings (FSSAI, GSTIN, entity) | | | | | ✔ |
| Read audit log | | | | | ✔ |

Two deliberate positions:

- **`content_manager` cannot see customers or orders.** Content work never requires PII.
- **Nobody can delete an order.** Cancellation and refund are status transitions. Financial records are append-only — see `DATA-OWNERSHIP.md` §7.

---

## 4. Ownership is part of the query, not a check after it

The classic IDOR bug is fetching first and checking second. Under load, refactoring, or a copy-paste, the check gets dropped and nobody notices, because the happy path still works.

```ts
// ✘ wrong — any signed-in customer can read any order by guessing an id
const order = await orderRepo.findById(orderId);
return order;

// ✘ still wrong — one careless refactor away from the bug above
const order = await orderRepo.findById(orderId);
if (order.userId !== actor.userId) throw new ForbiddenError();

// ✔ right — ownership is in the WHERE clause
const order = await orderRepo.findByIdForUser(orderId, actor.userId);
if (!order) throw new NotFoundError();
```

The repository method **has no signature that can be called without the owner**. There is no `findById` on owned entities at all. You cannot forget an argument that is required.

This applies to orders, addresses, cart, and the account itself.

---

## 5. 404, not 403

Asking for a row you may not see returns **not found**.

`403 Forbidden` is a confirmation that the row exists. Enumerating order ids until the status changes from 404 to 403 tells an attacker exactly how many orders the business has taken, and which ids are real.

The exception is `/admin` itself: a signed-in `customer` hitting an admin route gets a clear "you do not have access", because pretending the whole admin section does not exist would be confusing to a real staff member whose role was set up wrongly.

---

## 6. Publish state is authorization, not a filter

The public catalogue is `status = 'published' AND published_at <= now()`. That is enforced in the repository's public query methods, not by a caller remembering to pass a flag.

```
productRepo.listPublished(...)      ← public surface, filter is not optional
productRepo.listForAdmin(...)       ← requires an actor with content permission
```

A draft product with a leaked slug returns 404 to the public route. Search never indexes unpublished rows. Sitemap never lists them.

---

## 7. The actor

Every service that makes a decision takes an `Actor` as its first argument:

```ts
type Actor =
  | { kind: "anonymous" }
  | { kind: "user"; userId: string; roles: Role[]; sessionId: string };
```

Constructed once per request from the session, never from a header, a query parameter, or a client-supplied field. A service never reads the session itself — it is handed an actor, which is what makes it testable without a request object.

```ts
// the admin action, wherever it lives
const actor = await getActor();              // reads the session, once
return productService.publish(actor, id);    // service decides
```

The admin is planned as a separate application on its own origin (`SECURITY.md` §3.1, deviation D-07). That changes where the action file sits; it does not change this pattern, which is the point of putting the decision in the service.

---

## 8. Audit

Every mutation by a non-customer writes one `audit_log` row, in the same transaction as the change:

```
actor_user_id · action · entity_type · entity_id · before · after · ip · user_agent · created_at
```

Same transaction, deliberately. An audit row that can be missing when the write succeeded is worse than no audit log, because it is trusted.

Reads are not audited, except reads of customer PII, which are — a staff member exporting a customer list should leave a trace.

`before`/`after` store the changed fields only, and never a password hash, token or secret.

---

## 9. Rate limiting is not authorization, and both are required

Being allowed to submit an enquiry does not mean being allowed to submit four hundred. The two run as separate steps (`SYSTEM-DESIGN.md` §5) because they answer different questions: *may you?* and *how often?*

---

## 10. Tests that must exist

From the client's §65. These are the acceptance criteria for this document; if they do not exist, authorization is not implemented.

| # | Test |
|---|---|
| 1 | Anonymous request to every admin route and action → rejected |
| 2 | `customer` calling every admin service directly → rejected |
| 3 | Customer A requesting Customer B's order id → **404**, not 403 |
| 4 | Customer A updating Customer B's address → rejected |
| 5 | `content_manager` reading orders or customer PII → rejected |
| 6 | `order_manager` editing a product price → rejected |
| 7 | Non-admin assigning themselves the `admin` role → rejected |
| 8 | Public request for a draft product slug → 404 |
| 9 | Draft product absent from search, sitemap and listings |
| 10 | A write with an extra `role` field in the payload → rejected by `.strict()`, not silently ignored |
| 11 | Every admin mutation produces exactly one `audit_log` row |
| 12 | Session of a disabled user → rejected on the next request |

Test 10 is the mass-assignment guard. Test 3 is the one that is usually missing.

---

## 11. Open questions

| ID | Question |
|---|---|
| `OQ-058` | Are `content_manager` / `order_manager` needed at launch, or is `staff` + `admin` enough for two partners? |
| `OQ-059` | Should staff accounts be created by an admin only, or by invitation email? |
| `OQ-060` | Retention period for `audit_log` |
