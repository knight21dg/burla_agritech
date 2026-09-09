/**
 * Every enum in one file, because they are referenced across domain areas and
 * a circular import between schema files is tedious to unpick later.
 *
 * These are Postgres enums rather than text columns with a CHECK: the database
 * then rejects an unknown value even if a caller bypasses the service layer,
 * which is the point of putting rules in the database at all.
 */
import { pgEnum } from "drizzle-orm/pg-core";

// --- Taxonomy and catalogue -------------------------------------------------

export const categoryStatusEnum = pgEnum("category_status", [
  "draft",
  "published",
  "hidden",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "published",
  "archived",
]);

export const variantStatusEnum = pgEnum("variant_status", ["active", "inactive"]);

/** The FSSAI labelling mark. `not_applicable` covers non-food items. */
export const vegNonVegEnum = pgEnum("veg_non_veg", [
  "veg",
  "non_veg",
  "not_applicable",
]);

/** What a photograph is of. Drives which image a surface picks. */
export const productImageRoleEnum = pgEnum("product_image_role", [
  "pack",
  "contents",
  "macro",
  "lifestyle",
  "detail",
]);

// --- Identity ---------------------------------------------------------------

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted",
]);

/**
 * A customer session must never be accepted by the admin origin, so the scope
 * is stored on the session rather than inferred from the user's roles.
 */
export const sessionScopeEnum = pgEnum("session_scope", ["web", "admin"]);

export const verificationTokenTypeEnum = pgEnum("verification_token_type", [
  "email_verification",
  "password_reset",
  "email_change",
  "staff_invitation",
]);

// --- Operations -------------------------------------------------------------

export const enquiryTypeEnum = pgEnum("enquiry_type", ["contact", "wholesale"]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "in_progress",
  "quoted",
  "won",
  "lost",
  "spam",
]);

/**
 * Why stock moved. Every change to a variant's quantity writes one of these,
 * so "why is this number wrong?" is always answerable.
 */
export const inventoryReasonEnum = pgEnum("inventory_reason", [
  "order",
  "restock",
  "adjustment",
  "return",
  "damage",
  "correction",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "registered_office",
  "facility",
  "warehouse",
  "retail",
  "partner",
]);
