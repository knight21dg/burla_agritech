import "server-only";
import { and, count, desc, eq, ilike, inArray, max, or, type SQL } from "drizzle-orm";
import { db } from "@burla/core/db";
import { addresses, orders, roles, userRoles, users } from "@burla/core/db/schema";

/**
 * Customers — the people who have an account on the shop.
 *
 * Staff accounts live in the same table and are never listed here. A phone
 * number is not asked for at sign-up, so the one shown is the most recent a
 * customer gave at checkout, which is the one worth calling.
 *
 * Read-only. Nothing here changes a customer; a password is never shown,
 * and never could be — only a one-way hash of it exists.
 */

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  lastOrderAt: Date | null;
  joinedAt: Date;
}

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
}): Promise<{ rows: CustomerRow[]; total: number }> {
  const clauses: SQL[] = [customerOnly()];
  if (options.search) {
    const like = `%${options.search}%`;
    const match = or(ilike(users.name, like), ilike(users.email, like));
    if (match) clauses.push(match);
  }
  const where = and(...clauses);
  const page = Math.max(1, options.page ?? 1);

  const [people, totals] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, joinedAt: users.createdAt })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(CUSTOMERS_PAGE_SIZE)
      .offset((page - 1) * CUSTOMERS_PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where),
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
      };
    }),
    total: totals[0]?.n ?? 0,
  };
}

export async function getCustomer(id: string) {
  const [person] = await db
    .select({ id: users.id, name: users.name, email: users.email, joinedAt: users.createdAt })
    .from(users)
    .where(and(eq(users.id, id), customerOnly()))
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
    phone: history[0]?.phone ?? saved[0]?.phone ?? null,
    orders: history,
    addresses: saved,
    spentMinor: history
      .filter((order) => order.status !== "cancelled" && order.status !== "failed")
      .reduce((sum, order) => sum + order.totalMinor, 0),
  };
}
