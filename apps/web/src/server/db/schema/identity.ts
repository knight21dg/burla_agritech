/**
 * Users, credentials, sessions, roles and addresses.
 *
 * Two decisions worth naming, both from docs/DATABASE-DESIGN.md §5:
 *
 *   - Password hashes live in their own table, so `SELECT * FROM users` can
 *     never leak one into a log, an error report or an API response.
 *   - Roles are rows, not an enum column on the user. A small business will
 *     have one person who is both content manager and order manager, and a
 *     second role should be an INSERT rather than a migration.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { citext, primaryId, timestamps } from "./_shared";
import {
  sessionScopeEnum,
  userStatusEnum,
  verificationTokenTypeEnum,
} from "./enums";

// --- users ------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: primaryId(),

    /** citext: "Ravi@example.com" and "ravi@example.com" are one account. */
    email: citext("email").notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

    name: text("name"),
    phone: text("phone"),

    status: userStatusEnum("status").notNull().default("active"),

    /**
     * TOTP secret, encrypted at the application layer before it is stored.
     * Mandatory for staff and admin accounts — docs/AUTHENTICATION.md.
     */
    mfaSecret: text("mfa_secret"),
    mfaEnabledAt: timestamp("mfa_enabled_at", { withTimezone: true }),

    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    /**
     * Set when a customer exercises their right to erasure under the DPDP Act
     * 2023. The row survives with personal fields cleared, because orders are
     * retained for statutory tax purposes — docs/DATA-OWNERSHIP.md §7.
     */
    anonymisedAt: timestamp("anonymised_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [index("users_status_idx").on(table.status)],
);

// --- password_credentials ---------------------------------------------------

export const passwordCredentials = pgTable("password_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  /** Argon2id. Never a plaintext password, anywhere, ever. */
  passwordHash: text("password_hash").notNull(),

  /** Bumped on password change, which invalidates every existing session. */
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  ...timestamps,
});

// --- sessions ---------------------------------------------------------------

export const sessions = pgTable(
  "sessions",
  {
    id: primaryId(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /**
     * The hash of the session token, never the token. A leaked database dump
     * must not hand over live sessions.
     */
    tokenHash: text("token_hash").notNull().unique(),

    /**
     * A customer session must not be accepted by the admin origin. Storing the
     * scope makes that a lookup rather than an inference from roles.
     */
    scope: sessionScopeEnum("scope").notNull().default("web"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    /** Hashed with a rotating salt. Raw IPs are never stored. */
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    ...timestamps,
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    // Expired-session cleanup scans this.
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

// --- roles ------------------------------------------------------------------

export const roles = pgTable("roles", {
  id: primaryId(),
  /** customer | staff | content_manager | order_manager | admin */
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    grantedBy: uuid("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_roles_role_idx").on(table.roleId),
  ],
);

// --- verification_tokens ----------------------------------------------------

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: primaryId(),

    /** Email address or user id, depending on the token type. */
    identifier: text("identifier").notNull(),

    /** Hashed, for the same reason session tokens are. */
    tokenHash: text("token_hash").notNull().unique(),

    type: verificationTokenTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    /**
     * Set on use. A token is single-use; presenting a consumed one is
     * rejected rather than silently accepted.
     */
    consumedAt: timestamp("consumed_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [
    index("verification_tokens_identifier_idx").on(table.identifier, table.type),
    index("verification_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

// --- addresses --------------------------------------------------------------

export const addresses = pgTable(
  "addresses",
  {
    id: primaryId(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    label: text("label"),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),

    line1: text("line1").notNull(),
    line2: text("line2"),
    /** "Near the temple" — Indian couriers use it, and checkout asks for it. */
    landmark: text("landmark"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("IN"),

    isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
    isDefaultBilling: boolean("is_default_billing").notNull().default(false),

    ...timestamps,
  },
  (table) => [index("addresses_user_idx").on(table.userId)],
);

// --- relations --------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  password: one(passwordCredentials, {
    fields: [users.id],
    references: [passwordCredentials.userId],
  }),
  sessions: many(sessions),
  addresses: many(addresses),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
    relationName: "user_role_user",
  }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Address = typeof addresses.$inferSelect;
