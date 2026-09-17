import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@burla/core/db";
import {
  inventoryMovements,
  orderEvents,
  orderItems,
  orders,
  productVariants,
  users,
  type OrderStatus,
} from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import { ORDER_GROUPS, ORDER_LABEL, canMove, isRejection, needsRefund, type OrderGroup } from "@/lib/orderSteps";
import { money } from "@/lib/format";

/**
 * Orders: what came in, and moving each one along.
 *
 * Moving an order is a transaction that locks the order row first, so two
 * people pressing "Mark ready" at once cannot both apply it. Every move is
 * recorded twice, on purpose: in `order_events`, which is the order's own
 * history and what the customer's account page reads, and in the audit log,
 * which is the record of who did what in the admin.
 */

export interface OrderRow {
  orderNumber: string;
  customer: string;
  phone: string;
  placedAt: Date;
  totalMinor: number;
  status: OrderStatus;
  paymentMethod: "upi" | "card" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  itemCount: number;
}

export const ORDERS_PAGE_SIZE = 25;

export async function listOrders(options: {
  group?: OrderGroup;
  search?: string;
  page?: number;
}): Promise<{ rows: OrderRow[]; total: number; counts: Record<OrderGroup, number> }> {
  const clauses: SQL[] = [];
  if (options.group) clauses.push(inArray(orders.status, ORDER_GROUPS[options.group].statuses));
  if (options.search) {
    const like = `%${options.search}%`;
    const match = or(
      ilike(orders.orderNumber, like),
      ilike(orders.contactName, like),
      ilike(orders.contactPhone, like),
    );
    if (match) clauses.push(match);
  }
  const where = clauses.length ? and(...clauses) : undefined;
  const page = Math.max(1, options.page ?? 1);

  const rowsQuery = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customer: orders.contactName,
      phone: orders.contactPhone,
      placedAt: orders.placedAt,
      totalMinor: orders.totalMinor,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(ORDERS_PAGE_SIZE)
    .offset((page - 1) * ORDERS_PAGE_SIZE);
  const totalQuery = db.select({ n: count() }).from(orders);

  const [rows, totals, byStatus] = await Promise.all([
    where ? rowsQuery.where(where) : rowsQuery,
    where ? totalQuery.where(where) : totalQuery,
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);

  const ids = rows.map((row) => row.id);
  const items = ids.length
    ? await db
        .select({ orderId: orderItems.orderId, n: count() })
        .from(orderItems)
        .where(inArray(orderItems.orderId, ids))
        .groupBy(orderItems.orderId)
    : [];

  const counts = Object.fromEntries(
    (Object.keys(ORDER_GROUPS) as OrderGroup[]).map((group) => [
      group,
      byStatus
        .filter((row) => ORDER_GROUPS[group].statuses.includes(row.status))
        .reduce((sum, row) => sum + row.n, 0),
    ]),
  ) as Record<OrderGroup, number>;

  return {
    rows: rows.map(({ id, ...row }) => ({
      ...row,
      itemCount: items.find((item) => item.orderId === id)?.n ?? 0,
    })),
    total: totals[0]?.n ?? 0,
    counts,
  };
}

export async function getOrder(orderNumber: string) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      contactName: orders.contactName,
      contactPhone: orders.contactPhone,
      shippingAddress: orders.shippingAddress,
      subtotalMinor: orders.subtotalMinor,
      shippingMinor: orders.shippingMinor,
      discountMinor: orders.discountMinor,
      totalMinor: orders.totalMinor,
      placedAt: orders.placedAt,
      userId: orders.userId,
      email: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return undefined;

  const [items, events] = await Promise.all([
    db
      .select({
        productName: orderItems.productName,
        size: orderItems.variantLabel,
        quantity: orderItems.quantity,
        unitPriceMinor: orderItems.unitPriceMinor,
        lineTotalMinor: orderItems.lineTotalMinor,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.createdAt)),
    db
      .select({
        to: orderEvents.toStatus,
        at: orderEvents.createdAt,
        note: orderEvents.note,
        by: users.name,
      })
      .from(orderEvents)
      .leftJoin(users, eq(users.id, orderEvents.actorId))
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(asc(orderEvents.createdAt)),
  ]);

  return { ...order, items, events };
}

export type MoveResult = { ok: true; message: string } | { ok: false; message: string };

export async function moveOrder(
  actor: Actor,
  orderNumber: string,
  to: OrderStatus,
  note?: string,
): Promise<MoveResult> {
  requireCapability(actor, "order.transition");

  return db.transaction(async (tx) => {
    // Locked for the length of this change: the second of two simultaneous
    // presses sees the first one's result and is refused cleanly.
    const [order] = await tx
      .select({
        id: orders.id,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalMinor: orders.totalMinor,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .for("update")
      .limit(1);

    if (!order) return { ok: false as const, message: "That order could not be found." };
    if (!canMove(order.status, to)) {
      return {
        ok: false as const,
        message: `This order is already "${ORDER_LABEL[order.status]}", so it cannot be marked "${ORDER_LABEL[to]}". The page may be out of date — please reload.`,
      };
    }

    const now = new Date();
    const cashReceived = to === "delivered" && order.paymentMethod === "cod" && order.paymentStatus !== "paid";
    const rejected = to === "cancelled" && isRejection(order.status);

    await tx
      .update(orders)
      .set({
        status: to,
        ...(to === "shipped" ? { shippedAt: now } : {}),
        ...(to === "delivered" ? { deliveredAt: now } : {}),
        ...(to === "cancelled" ? { cancelledAt: now } : {}),
        ...(cashReceived ? { paymentStatus: "paid" as const } : {}),
      })
      .where(eq(orders.id, order.id));

    if (to === "cancelled") {
      // Stock that was counted goes back. Packs that are not counted have
      // nothing to return.
      const items = await tx
        .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      const variantIds = items.flatMap((item) => (item.variantId ? [item.variantId] : []));
      const counted = variantIds.length
        ? await tx
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(and(inArray(productVariants.id, variantIds), eq(productVariants.trackInventory, true)))
        : [];
      const countedIds = new Set(counted.map((row) => row.id));
      const returns = items.filter((item) => item.variantId && countedIds.has(item.variantId));
      if (returns.length) {
        await tx.insert(inventoryMovements).values(
          returns.map((item) => ({
            variantId: item.variantId!,
            delta: item.quantity,
            reason: "order_cancelled" as const,
            referenceId: order.id,
            createdBy: actor.kind === "user" ? actor.userId : null,
          })),
        );
      }
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: to,
      actorId: actor.kind === "user" ? actor.userId : null,
      note:
        note?.trim().slice(0, 500) ||
        (cashReceived ? "Cash received on delivery" : rejected ? "Rejected by the shop" : null),
    });

    await writeAudit(tx, actor, {
      action: `order.${to}`,
      entityType: "order",
      entityId: order.id,
      changes: {
        orderNumber,
        status: { from: order.status, to },
        ...(cashReceived ? { payment: "cash received" } : {}),
      },
    });

    const said: Partial<Record<OrderStatus, string>> = {
      processing: order.status === "confirmed" ? "Order accepted. It is now in Preparing." : "Marked as preparing.",
      packed: "Marked as ready.",
      shipped: "Marked as on the way.",
      delivered: cashReceived ? "Marked as delivered, and the cash as received." : "Marked as delivered.",
      cancelled: rejected ? "Order rejected." : "Order cancelled.",
    };
    const refund =
      to === "cancelled" && needsRefund(order.paymentMethod, order.paymentStatus)
        ? ` The customer paid ${money(order.totalMinor)} online — refund it from your payment dashboard.`
        : "";
    return { ok: true as const, message: (said[to] ?? "Updated.") + refund };
  });
}
