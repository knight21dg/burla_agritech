import "server-only";
import { and, count, desc, eq, ilike, inArray, max, ne, or, type SQL } from "drizzle-orm";
import { db } from "@burla/core/db";
import { addresses, orders, roles, sessions, userRoles, users } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";

/**
 * Customers — the people who have an account on the shop.
 *
 * Staff accounts live in the same table and are never listed here. A phone
 * number is not asked for at sign-up, so the one shown is the most recent a
 * customer gave at checkout, which is the one worth calling.
 *
 * The one change the admin makes is switching an account off and on again
 * (`setCustomerActive`). A password is never shown, and never could be —
 * only a one-way hash of it exists.
 */

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  lastOrderAt: Date | null;
  joinedAt: Date;
  active: boolean;
}

export type CustomerShow = "all" | "active" | "deactivated";

export const CUSTOMERS_PAGE_SIZE = 25;

function customerOnly(): SQL {
  return inArray(
    users.id,
    db
      .select({ id: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(roles.key, "customer")),
  );
}

export async function listCustomers(options: {
  search?: string;
  page?: number;
  show?: CustomerShow;
}): Promise<{ rows: CustomerRow[]; total: number; deactivated: number }> {
  const clauses: SQL[] = [customerOnly(), ne(users.status, "deleted")];
  if (options.show === "active") clauses.push(eq(users.status, "active"));
  if (options.show === "deactivated") clauses.push(eq(users.status, "suspended"));
  if (options.search) {
    const like = `%${options.search}%`;
    const match = or(ilike(users.name, like), ilike(users.email, like));
    if (match) clauses.push(match);
  }
  const where = and(...clauses);
  const page = Math.max(1, options.page ?? 1);

  const [people, totals, [deactivated]] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, joinedAt: users.createdAt, status: users.status })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(CUSTOMERS_PAGE_SIZE)
      .offset((page - 1) * CUSTOMERS_PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where),
    db
      .select({ n: count() })
      .from(users)
      .where(and(customerOnly(), eq(users.status, "suspended"))),
  ]);

  const ids = people.map((person) => person.id);
  const [orderStats, phones] = ids.length
    ? await Promise.all([
        db
          .select({ userId: orders.userId, n: count(), last: max(orders.placedAt) })
          .from(orders)
          .where(inArray(orders.userId, ids))
          .groupBy(orders.userId),
        db
          .select({ userId: orders.userId, phone: orders.contactPhone, at: orders.placedAt })
          .from(orders)
          .where(inArray(orders.userId, ids))
          .orderBy(desc(orders.placedAt)),
      ])
    : [[], []];

  return {
    rows: people.map((person) => {
      const stats = orderStats.find((row) => row.userId === person.id);
      return {
        id: person.id,
        name: person.name ?? "(no name)",
        email: person.email,
        phone: phones.find((row) => row.userId === person.id)?.phone ?? null,
        orderCount: stats?.n ?? 0,
        lastOrderAt: stats?.last ?? null,
        joinedAt: person.joinedAt,
        active: person.status === "active",
      };
    }),
    total: totals[0]?.n ?? 0,
    deactivated: deactivated?.n ?? 0,
  };
}

export async function getCustomer(id: string) {
  const [person] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      accountPhone: users.phone,
      joinedAt: users.createdAt,
      lastSignInAt: users.lastLoginAt,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.id, id), customerOnly(), ne(users.status, "deleted")))
    .limit(1);
  if (!person) return undefined;

  const [history, saved] = await Promise.all([
    db
      .select({
        orderNumber: orders.orderNumber,
        placedAt: orders.placedAt,
        totalMinor: orders.totalMinor,
        status: orders.status,
        phone: orders.contactPhone,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.placedAt)),
    db
      .select({
        id: addresses.id,
        fullName: addresses.fullName,
        phone: addresses.phone,
        line1: addresses.line1,
        line2: addresses.line2,
        landmark: addresses.landmark,
        city: addresses.city,
        state: addresses.state,
        postalCode: addresses.postalCode,
      })
      .from(addresses)
      .where(eq(addresses.userId, id))
      .orderBy(desc(addresses.updatedAt)),
  ]);

  return {
    ...person,
    name: person.name ?? "(no name)",
    phone: history[0]?.phone ?? saved[0]?.phone ?? person.accountPhone ?? null,
    active: person.status === "active",
    /** Every number this customer has used, which a deactivation also blocks. */
    phones: [
      ...new Set(
        [person.accountPhone, ...saved.map((a) => a.phone), ...history.map((o) => o.phone)].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ],
    orders: history,
    addresses: saved,
    spentMinor: history
      .filter((order) => order.status !== "cancelled" && order.status !== "failed")
      .reduce((sum, order) => sum + order.totalMinor, 0),
  };
}

/**
 * Deactivate or activate a customer's account.
 *
 * Deactivated: signed out everywhere at once, cannot sign in, and checkout
 * refuses any phone number the account has used. Orders already placed are
 * left as they are. Activating undoes all of it; nothing is deleted either way.
 */
export async function setCustomerActive(
  actor: Actor,
  customerId: string,
  active: boolean,
): Promise<{ ok: boolean; message: string }> {
  requireCapability(actor, "user.manage");

  return db.transaction(async (tx) => {
    const [person] = await tx
      .select({ id: users.id, name: users.name, email: users.email, status: users.status })
      .from(users)
      .where(and(eq(users.id, customerId), customerOnly()))
      .for("update")
      .limit(1);
    if (!person || person.status === "deleted") return { ok: false, message: "This customer could not be found." };

    const name = person.name ?? person.email;
    const now = active ? "active" : "suspended";
    if (person.status === now) {
      return { ok: true, message: active ? `${name}'s account is already active.` : `${name}'s account is already deactivated.` };
    }

    await tx.update(users).set({ status: now }).where(eq(users.id, customerId));
    if (!active) await tx.delete(sessions).where(eq(sessions.userId, customerId));

    await writeAudit(tx, actor, {
      action: active ? "customer.activated" : "customer.deactivated",
      entityType: "user",
      entityId: customerId,
      changes: { name },
    });

    return {
      ok: true,
      message: active
        ? `${name}'s account is active again. They can sign in and shop.`
        : `${name}'s account is deactivated. They have been signed out and cannot shop.`,
    };
  });
}
