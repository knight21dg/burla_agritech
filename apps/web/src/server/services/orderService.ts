import "server-only";
import { productBySlug } from "@/data/catalog";
import type { Address, OrderRequest } from "@/lib/checkout";
import { deliveryFeeMinor } from "@/lib/delivery";
import { db } from "@/server/db";
import * as addressRepository from "@/server/repositories/addressRepository";
import * as orderRepository from "@/server/repositories/orderRepository";
import type { OrderStatus } from "@/server/repositories/orderRepository";

/**
 * Placing and cancelling orders — the transactions. docs/ORDERS.md.
 *
 * Everything that decides what an order is happens here, on the server, from
 * the server's own records: the price of every line, the delivery charge,
 * the total, whether there is stock. The browser's request is only
 * references (which product, which pack, how many) and the address.
 */

export type PlaceResult =
  | { ok: true; orderNumber: string }
  | { ok: false; code: "UNAVAILABLE" | "OUT_OF_STOCK"; items: string[] }
  | { ok: false; code: "ADDRESS_NOT_FOUND" };

/** Who may move an order where. Anything not listed is refused. */
const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "processing", "packed"];

/**
 * Places a cash-on-delivery order, in one transaction:
 *
 *   1. An order already made with this idempotency key is returned as it is
 *      — a double click or a retried request never orders twice.
 *   2. Each cart line is matched to its live pack size by SKU and the rows
 *      are locked (FOR UPDATE); a product no longer published, a pack size
 *      withdrawn, or too little stock stops the order, naming the items.
 *   3. The order is written with its lines copied (name, pack, price) and
 *      its total computed here; stock is taken through the ledger; the
 *      history gets its first entry; a newly typed address is saved to the
 *      customer's account.
 *
 * The status is `confirmed` at once: cash on delivery has no payment to wait
 * for. Payment stays `pending` until the order is delivered and paid.
 */
export async function placeCodOrder(
  userId: string,
  request: OrderRequest,
  address: { value: Address; savedId?: string },
): Promise<PlaceResult> {
  // Cart line → the catalogue pack it names → that pack's SKU, which is the
  // key the database knows it by.
  const wanted = request.lines.map((line) => {
    const product = productBySlug(line.slug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return { line, name: product?.name ?? line.slug, sku: variant?.sku };
  });
  const missing = wanted.filter((w) => !w.sku).map((w) => w.name);
  if (missing.length > 0) return { ok: false, code: "UNAVAILABLE", items: missing };

  return db.transaction(async (tx) => {
    const existing = await orderRepository.findByIdempotencyKey(tx, userId, request.idempotencyKey);
    if (existing) return { ok: true as const, orderNumber: existing.orderNumber };

    const live = await orderRepository.lockVariantsForOrder(tx, wanted.map((w) => w.sku!));
    const bySku = new Map(live.map((v) => [v.sku, v]));

    const unavailable: string[] = [];
    const outOfStock: string[] = [];
    const lines = wanted.flatMap((w) => {
      const variant = bySku.get(w.sku!);
      if (!variant) {
        unavailable.push(w.name);
        return [];
      }
      if (variant.trackInventory && variant.stockQuantity < w.line.qty) {
        outOfStock.push(`${variant.productName} (${variant.label})`);
        return [];
      }
      return [{ variant, qty: w.line.qty }];
    });
    if (unavailable.length > 0) return { ok: false as const, code: "UNAVAILABLE" as const, items: unavailable };
    if (outOfStock.length > 0) return { ok: false as const, code: "OUT_OF_STOCK" as const, items: outOfStock };

    const subtotalMinor = lines.reduce((sum, l) => sum + l.variant.priceMinor * l.qty, 0);
    const shippingMinor = deliveryFeeMinor(subtotalMinor);
    const a = address.value;

    const order = await orderRepository.insertOrder(tx, {
      idempotencyKey: request.idempotencyKey,
      userId,
      status: "confirmed",
      paymentMethod: "cod",
      paymentStatus: "pending",
      contactName: a.fullName,
      contactPhone: a.mobile,
      shippingAddress: {
        fullName: a.fullName,
        mobile: a.mobile,
        line1: a.line1,
        line2: a.line2,
        landmark: a.landmark,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        kind: a.kind,
      },
      subtotalMinor,
      shippingMinor,
      totalMinor: subtotalMinor + shippingMinor,
    });

    await orderRepository.insertItems(
      tx,
      lines.map(({ variant, qty }) => ({
        orderId: order.id,
        productId: variant.productId,
        variantId: variant.variantId,
        productName: variant.productName,
        productSlug: variant.productSlug,
        variantLabel: variant.label,
        sku: variant.sku,
        unitPriceMinor: variant.priceMinor,
        quantity: qty,
        lineTotalMinor: variant.priceMinor * qty,
      })),
    );

    await orderRepository.insertStockMovements(
      tx,
      lines
        .filter(({ variant }) => variant.trackInventory)
        .map(({ variant, qty }) => ({
          variantId: variant.variantId,
          delta: -qty,
          reason: "order" as const,
          referenceId: order.id,
          createdBy: userId,
        })),
    );

    await orderRepository.insertEvent(tx, {
      orderId: order.id,
      fromStatus: null,
      toStatus: "confirmed",
      actorId: userId,
      note: "Order placed — cash on delivery.",
    });

    if (address.savedId) await addressRepository.touch(tx, userId, address.savedId);
    else await addressRepository.saveUsed(tx, userId, a);

    return { ok: true as const, orderNumber: order.orderNumber };
  });
}

export type CancelResult = { ok: true } | { ok: false; code: "NOT_FOUND" | "NOT_CANCELLABLE" };

/**
 * A customer cancels their own order, before it ships. The stock goes back
 * through the ledger and the history records who and when.
 */
export async function cancelOrder(userId: string, orderNumber: string): Promise<CancelResult> {
  return db.transaction(async (tx) => {
    const order = await orderRepository.lockForUser(tx, userId, orderNumber);
    if (!order) return { ok: false as const, code: "NOT_FOUND" as const };
    if (!CANCELLABLE.includes(order.status)) {
      return { ok: false as const, code: "NOT_CANCELLABLE" as const };
    }

    await orderRepository.updateOrder(tx, order.id, { status: "cancelled", cancelledAt: new Date() });

    const items = await orderRepository.itemsOf(tx, order.id);
    const tracked = await orderRepository.variantsTrackingStock(
      tx,
      items.flatMap((i) => (i.variantId ? [i.variantId] : [])),
    );
    await orderRepository.insertStockMovements(
      tx,
      items
        .filter((i) => i.variantId && tracked.has(i.variantId))
        .map((i) => ({
          variantId: i.variantId!,
          delta: i.quantity,
          reason: "order_cancelled" as const,
          referenceId: order.id,
          createdBy: userId,
        })),
    );

    await orderRepository.insertEvent(tx, {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: "cancelled",
      actorId: userId,
      note: "Cancelled by the customer.",
    });
    return { ok: true as const };
  });
}

export const isCancellable = (status: OrderStatus) => CANCELLABLE.includes(status);

export const listOrders = orderRepository.listForUser;
export const getOrder = orderRepository.findForUser;
export const listAddresses = addressRepository.listForUser;
export const findAddress = addressRepository.findForUser;
