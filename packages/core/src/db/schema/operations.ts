/**
 * Everything the business runs on that is not the catalogue or a customer:
 * stock movements, enquiries, the audit trail, site settings, locations and
 * URL redirects.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import {
  enquiryStatusEnum,
  enquiryTypeEnum,
  inventoryReasonEnum,
  locationTypeEnum,
} from "./enums";
import { users } from "./identity";
import { productVariants, products } from "./products";

// --- inventory_movements ----------------------------------------------------

/**
 * Append-only. Stock is never set blind: the admin writes a movement and
 * `product_variants.stock_quantity` is the running total, so "why is this
 * number wrong?" is always answerable.
 */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: primaryId(),

    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),

    /** Signed. Negative for a sale, positive for a restock. Never zero. */
    delta: integer("delta").notNull(),

    reason: inventoryReasonEnum("reason").notNull(),

    /** The order, return or adjustment this movement belongs to, if any. */
    referenceId: uuid("reference_id"),

    note: text("note"),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_variant_idx").on(
      table.variantId,
      table.createdAt,
    ),
    // A movement of zero is not a correction, it is a mistake.
    check("inventory_movements_delta_non_zero", sql`${table.delta} <> 0`),
  ],
);

// --- enquiries --------------------------------------------------------------

export const enquiries = pgTable(
  "enquiries",
  {
    id: primaryId(),

    type: enquiryTypeEnum("type").notNull().default("contact"),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    country: text("country"),

    /** Category or product slugs the enquirer selected. */
    productInterest: text("product_interest").array(),
    estimatedQuantity: text("estimated_quantity"),

    subject: text("subject"),
    message: text("message").notNull(),

    /** Where the form was submitted from, for context in the admin. */
    sourceUrl: text("source_url"),
    sourceProductId: uuid("source_product_id").references(() => products.id, {
      onDelete: "set null",
    }),

    status: enquiryStatusEnum("status").notNull().default("new"),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    internalNotes: text("internal_notes"),

    /** Hashed with a rotating salt. Raw IPs are never stored. */
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    /**
     * Set when the notification email was sent. Null with an old created_at
     * means a lead nobody was told about — the one query worth alerting on.
     */
    notifiedAt: timestamp("notified_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [
    // The admin list: filtered by type and status, newest first.
    index("enquiries_type_status_created_idx").on(
      table.type,
      table.status,
      table.createdAt.desc(),
    ),
    // Finds leads that were saved but never emailed.
    index("enquiries_unnotified_idx")
      .on(table.createdAt)
      .where(sql`${table.notifiedAt} is null`),
  ],
);

// --- audit_log --------------------------------------------------------------

/**
 * One row per admin mutation, written in the same transaction as the change.
 * An audit row that can be missing when the write succeeded is worse than no
 * audit log at all, because it is trusted. docs/AUTHORIZATION.md §8.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: primaryId(),

    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Snapshotted: the role at the time, not the role they hold today. */
    actorRole: text("actor_role"),

    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),

    /**
     * Changed fields only, as { before, after }. Never a password hash, token
     * or secret — the redaction list is applied before this is written.
     */
    changes: jsonb("changes"),

    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_actor_created_idx").on(table.actorId, table.createdAt.desc()),
  ],
);

// --- site_settings ----------------------------------------------------------

/**
 * A singleton. The business identity the client edits — as opposed to the
 * deployment configuration, which lives in the environment.
 * docs/DATA-OWNERSHIP.md §2.
 *
 * `CHECK (singleton)` is added by the migration, so a second row is impossible
 * rather than merely discouraged.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    /** Always true. The check plus the primary key allow exactly one row. */
    singleton: boolean("singleton").primaryKey().default(true),

    /** OQ-002 — the registered firm name. */
    entityName: text("entity_name"),
    addressLine: text("address_line"),
    gstin: text("gstin"),
    /** OQ-003 — the FSSAI licence. A food site legally must display it. */
    fssaiLicenceNumber: text("fssai_licence_number"),

    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    businessHours: text("business_hours"),
    whatsappNumber: text("whatsapp_number"),

    /** OQ-005 — Consumer Protection (E-Commerce) Rules 2020. */
    grievanceOfficerName: text("grievance_officer_name"),
    grievanceOfficerEmail: text("grievance_officer_email"),
    grievanceOfficerPhone: text("grievance_officer_phone"),

    /** [{ name, role }] — the partners, from the business card. */
    partners: jsonb("partners"),
    socialLinks: jsonb("social_links"),

    ...timestamps,
  },
  (table) => [
    // Belt and braces with the primary key: a second row is impossible, not
    // merely discouraged by a comment.
    check("site_settings_singleton", sql`${table.singleton}`),
  ],
);

// --- locations --------------------------------------------------------------

export const locations = pgTable(
  "locations",
  {
    id: primaryId(),

    name: text("name").notNull(),
    type: locationTypeEnum("type").notNull(),

    addressLine: text("address_line").notNull(),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").notNull().default("IN"),

    /** Null until the address is geocoded. An approximate pin is worse than none. */
    latitude: text("latitude"),
    longitude: text("longitude"),

    phone: text("phone"),
    hours: text("hours"),

    /** Nothing appears on the public map until the client says it may. */
    isPublic: boolean("is_public").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    ...timestamps,
  },
  (table) => [index("locations_public_sort_idx").on(table.isPublic, table.sortOrder)],
);

// --- redirects --------------------------------------------------------------

/**
 * Written whenever a slug changes, so an indexed URL never 404s.
 * Read by middleware, which is why `from_path` is the unique key.
 */
export const redirects = pgTable("redirects", {
  id: primaryId(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  permanent: boolean("permanent").notNull().default(true),
  ...timestamps,
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
