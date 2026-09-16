import "server-only";
import { and, count, eq, lte, sql } from "drizzle-orm";
import { db } from "@burla/core/db";
import {
  enquiries,
  orders,
  productVariants,
  products,
  users,
} from "@burla/core/db/schema";

/**
 * The few numbers the dashboard shows.
 *
 * Counts only — no rows, no personal data. Each one is a separate small query
 * against an index rather than one clever join, because they are gated
 * separately: a content manager sees catalogue counts and never learns how
 * many orders the business has taken.
 */

export async function catalogueCounts() {
  const [row] = await db
    .select({
      total: count(),
      published: sql<number>`count(*) filter (where ${products.status} = 'published')::int`,
      draft: sql<number>`count(*) filter (where ${products.status} = 'draft')::int`,
      sample: sql<number>`count(*) filter (where ${products.isSample} = true)::int`,
    })
    .from(products);
  return row ?? { total: 0, published: 0, draft: 0, sample: 0 };
}

/** Variants at or below their own threshold, and those at zero. */
export async function stockCounts() {
  const [row] = await db
    .select({
      low: count(),
      out: sql<number>`count(*) filter (where ${productVariants.stockQuantity} = 0)::int`,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.trackInventory, true),
        lte(productVariants.stockQuantity, productVariants.lowStockThreshold),
      ),
    );
  return row ?? { low: 0, out: 0 };
}

export async function orderCounts() {
  const [row] = await db
    .select({
      total: count(),
      toPack: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','processing'))::int`,
      shipped: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
      unpaid: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'pending' and ${orders.status} not in ('cancelled','failed'))::int`,
    })
    .from(orders);
  return row ?? { total: 0, toPack: 0, shipped: 0, unpaid: 0 };
}

export async function enquiryCounts() {
  const [row] = await db
    .select({
      total: count(),
      unanswered: sql<number>`count(*) filter (where ${enquiries.status} = 'new')::int`,
    })
    .from(enquiries);
  return row ?? { total: 0, unanswered: 0 };
}

export async function customerCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(users);
  return row?.n ?? 0;
}
