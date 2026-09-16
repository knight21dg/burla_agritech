/**
 * Orders: the order, its lines and its history.
 *
 * docs/DATABASE-DESIGN.md §6, built for the first time here, with the
 * decisions the design left open recorded in docs/ORDERS.md:
 *
 *   - Every order belongs to a customer account (`user_id` NOT NULL):
 *     ordering needs a sign-in, as on the e-commerce sites the client named.
 *   - Cash on delivery is an order with no payment step; UPI and cards go
 *     through Razorpay, verified on the server (next step).
 *   - Prices, names and the address are copied onto the order when it is
 *     placed. An order is a record of what was agreed, and a later price
 *     change, a renamed product or an edited address must not rewrite it.
 *   - Orders are never deleted. Cancelling is a status.
 *
 * Carts are not a table yet: the cart lives in the browser (cartStore) and
 * only references, never prices, reach the server.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { orderStatusEnum, paymentMethodEnum, paymentStatusEnum } from "./enums";
import { users } from "./identity";
import { productVariants, products } from "./products";

/** Feeds order numbers. Never reset: a number, once issued, is never reused. */
export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 1 });

/** The delivery address as it was when the order was placed. */
export interface ShippingAddressSnapshot {
  fullName: string;
  mobile: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  kind: "home" | "work";
}

// --- orders -----------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: primaryId(),

    /**
     * "BGA-2026-00042": the number a customer quotes on the phone. Year in
     * India's time zone, from a sequence that never repeats.
     */
    orderNumber: text("order_number")
      .notNull()
      .unique()
      .default(
        sql`'BGA-' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0')`,
      ),

    /**
     * Sent by the checkout page with each attempt, so a double click or a
     * retried request finds the order it already made instead of making a
     * second one.
     */
    idempotencyKey: uuid("idempotency_key").notNull().unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),

    /** Who to ring about the delivery — copied from the address. */
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),

    shippingAddress: jsonb("shipping_address").$type<ShippingAddressSnapshot>().notNull(),

    // Money in paise, never floats.
    subtotalMinor: integer("subtotal_minor").notNull(),
    shippingMinor: integer("shipping_minor").notNull().default(0),
    discountMinor: integer("discount_minor").notNull().default(0),
    taxMinor: integer("tax_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    currency: text("currency").notNull().default("INR"),

    /** Filled in by staff when the parcel is handed to a courier. */
    courierName: text("courier_name"),
    trackingNumber: text("tracking_number"),

    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [
    index("orders_user_placed_idx").on(table.userId, table.placedAt.desc()),
    index("orders_status_placed_idx").on(table.status, table.placedAt.desc()),
    check(
      "orders_money_non_negative",
      sql`${table.subtotalMinor} >= 0 AND ${table.shippingMinor} >= 0 AND ${table.discountMinor} >= 0 AND ${table.taxMinor} >= 0`,
    ),
    // The total is arithmetic, not an opinion: it can never disagree with
    // its parts.
    check(
      "orders_total_adds_up",
      sql`${table.totalMinor} = ${table.subtotalMinor} + ${table.shippingMinor} + ${table.taxMinor} - ${table.discountMinor}`,
    ),
  ],
);

// --- order_items ------------------------------------------------------------

export const orderItems = pgTable(
  "order_items",
  {
    id: primaryId(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),

    /**
     * Links back to the catalogue while the product exists. SET NULL, not
     * RESTRICT: the snapshot below is the record, and a product retired years
     * later must not be undeletable because someone once bought it.
     */
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),

    // The snapshot.
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    variantLabel: text("variant_label").notNull(),
    sku: text("sku").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalMinor: integer("line_total_minor").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_price_non_negative", sql`${table.unitPriceMinor} >= 0`),
    check(
      "order_items_line_total_adds_up",
      sql`${table.lineTotalMinor} = ${table.unitPriceMinor} * ${table.quantity}`,
    ),
  ],
);

// --- order_events -----------------------------------------------------------

/**
 * Append-only history: every status change, who made it and why. The order
 * page's timeline is read from here, and "who cancelled this?" is always
 * answerable.
 */
export const orderEvents = pgTable(
  "order_events",
  {
    id: primaryId(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),

    /** Null for the event that created the order. */
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),

    /** The staff member, or the customer; null for the system. */
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),

    note: text("note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_events_order_idx").on(table.orderId, table.createdAt)],
);
