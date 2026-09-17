import "server-only";
import { count, countDistinct, eq, ne } from "drizzle-orm";
import { db } from "@burla/core/db";
import { enquiries, orders, products, roles, userRoles } from "@burla/core/db/schema";

/**
 * The four numbers on the Home screen. Counts only — no names, no rows — and
 * each fetched only when the person looking may see it.
 */

/** Products the owner has not deleted. */
export async function productCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(products).where(ne(products.status, "archived"));
  return row?.n ?? 0;
}

export async function orderCounts(): Promise<{ total: number; new: number }> {
  const [total, fresh] = await Promise.all([
    db.select({ n: count() }).from(orders),
    // A new cash-on-delivery order arrives confirmed; it is "new" to the owner
    // until they start preparing it.
    db.select({ n: count() }).from(orders).where(eq(orders.status, "confirmed")),
  ]);
  return { total: total[0]?.n ?? 0, new: fresh[0]?.n ?? 0 };
}

/** People with a customer account — never staff. */
export async function customerCount(): Promise<number> {
  const [row] = await db
    .select({ n: countDistinct(userRoles.userId) })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(roles.key, "customer"));
  return row?.n ?? 0;
}

export async function newEnquiryCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  return row?.n ?? 0;
}
