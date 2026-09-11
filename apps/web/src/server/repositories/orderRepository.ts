import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  inventoryMovements,
  orderEvents,
  orderItems,
  orders,
  productVariants,
  products,
} from "@/server/db/schema";
import type { Executor } from "./addressRepository";

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderEventRow = typeof orderEvents.$inferSelect;
export type OrderStatus = OrderRow["status"];

/**
 * The live catalogue rows an order is priced from, locked for the rest of
 * the transaction (FOR UPDATE on the variants) so two orders for the last
 * jar cannot both succeed. Only published products and active pack sizes.
 */
export async function lockVariantsForOrder(exec: Executor, skus: string[]) {
  if (skus.length === 0) return [];
  return exec
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productSlug: products.slug,
      productName: products.name,
      sku: productVariants.sku,
      label: productVariants.label,
      priceMinor: productVariants.priceMinor,
      stockQuantity: productVariants.stockQuantity,
      trackInventory: productVariants.trackInventory,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        inArray(productVariants.sku, skus),
        eq(productVariants.status, "active"),
        eq(products.status, "published"),
      ),
    )
    .for("update", { of: productVariants });
}

export async function findByIdempotencyKey(exec: Executor, userId: string, key: string) {
  const [row] = await exec
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.idempotencyKey, key), eq(orders.userId, userId)))
    .limit(1);
  return row;
}

export interface OrderSummary {
  orderNumber: string;
  placedAt: Date;
  status: OrderStatus;
  paymentMethod: OrderRow["paymentMethod"];
  totalMinor: number;
  itemCount: number;
  /** Up to three product names, each once, in the order they were added. */
  firstItems: string[];
  /** How many more products the order holds beyond those. */
  moreItems: number;
}

/** The customer's orders, newest first, with a line of what was in each. */
export async function listForUser(userId: string): Promise<OrderSummary[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      placedAt: orders.placedAt,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      totalMinor: orders.totalMinor,
      itemCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      names: sql<string[]>`array_agg(${orderItems.productName} order by ${orderItems.createdAt})`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .groupBy(orders.id)
    .orderBy(desc(orders.placedAt));

  return rows.map(({ id: _id, names, ...row }) => {
    // Two pack sizes of one product are one product to the eye.
    const distinct = [...new Set((names ?? []).filter(Boolean))];
    return { ...row, firstItems: distinct.slice(0, 3), moreItems: Math.max(0, distinct.length - 3) };
  });
}

export interface OrderDetail {
  order: OrderRow;
  items: OrderItemRow[];
  events: OrderEventRow[];
}

/**
 * One order — only if it belongs to this customer. Anyone else's order is
 * simply not found (a 404, not a 403: its existence is not confirmed).
 */
export async function findForUser(userId: string, orderNumber: string): Promise<OrderDetail | undefined> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);
  if (!order) return undefined;

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.createdAt)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.createdAt)),
  ]);
  return { order, items, events };
}

/** The same, locked, inside a transaction that is about to change it. */
export async function lockForUser(exec: Executor, userId: string, orderNumber: string) {
  const [order] = await exec
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1)
    .for("update");
  return order;
}

export async function itemsOf(exec: Executor, orderId: string) {
  return exec.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// --- writes (inside the service's transaction) --------------------------------

export async function insertOrder(exec: Executor, values: typeof orders.$inferInsert) {
  const [row] = await exec
    .insert(orders)
    .values(values)
    .returning({ id: orders.id, orderNumber: orders.orderNumber });
  return row!;
}

export async function insertItems(exec: Executor, values: (typeof orderItems.$inferInsert)[]) {
  await exec.insert(orderItems).values(values);
}

export async function insertEvent(exec: Executor, values: typeof orderEvents.$inferInsert) {
  await exec.insert(orderEvents).values(values);
}

export async function updateOrder(
  exec: Executor,
  id: string,
  values: Partial<typeof orders.$inferInsert>,
) {
  await exec.update(orders).set(values).where(eq(orders.id, id));
}

/**
 * Stock moves only through the ledger (inventory_movements); a trigger keeps
 * product_variants.stock_quantity as its running total, and a CHECK refuses
 * a negative one. Stock is never written directly.
 */
export async function insertStockMovements(
  exec: Executor,
  values: (typeof inventoryMovements.$inferInsert)[],
) {
  if (values.length > 0) await exec.insert(inventoryMovements).values(values);
}

export async function variantsTrackingStock(exec: Executor, variantIds: string[]) {
  if (variantIds.length === 0) return new Set<string>();
  const rows = await exec
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(and(inArray(productVariants.id, variantIds), eq(productVariants.trackInventory, true)));
  return new Set(rows.map((r) => r.id));
}
