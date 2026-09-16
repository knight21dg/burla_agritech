/**
 * Who may do what.
 *
 * The permission matrix from docs/AUTHORIZATION.md §3, as one typed table.
 *
 * ## Why a table in code rather than permission tables in the database
 *
 * Five roles, fixed at design time. Rows would buy a join, a cache and a
 * migration for every change, in exchange for flexibility nobody has asked
 * for. A constant is readable in one screen, diffable in review, and cannot
 * drift between environments. If per-user grants are ever needed, they go
 * behind `can()` without touching a single call site.
 *
 * ## Two rules this file exists to keep
 *
 * `admin` is listed in the matrix like every other role. There is no
 * "if admin, skip the checks" branch, because that branch is how an
 * authorization bug becomes invisible.
 *
 * Nothing here reads a cookie, a header or a database. It is a pure function
 * of an actor and a capability, which is what makes it testable — and the
 * tests are the acceptance criteria in AUTHORIZATION.md §10.
 */

export type RoleKey =
  | "customer"
  | "staff"
  | "content_manager"
  | "order_manager"
  | "admin";

/**
 * A capability is a thing someone can do, not a screen they can see. Screens
 * come and go; "may change what a customer is charged" does not.
 */
export type Capability =
  /** See products that are not published. */
  | "catalogue.read_draft"
  /** Create and edit products, variants, categories, types and images. */
  | "catalogue.write"
  /** Make a product public, or withdraw it. */
  | "catalogue.publish"
  /** Move stock, through the ledger. */
  | "inventory.adjust"
  | "enquiry.read"
  | "enquiry.write"
  /** Read every order, not only one's own. */
  | "order.read_all"
  /** Move an order through its states. */
  | "order.transition"
  /** See a customer's name, address, phone or email. */
  | "customer.read_pii"
  /** Edit page copy and policies. */
  | "content.write"
  /** Business identity, delivery rules, feature flags. */
  | "settings.write"
  /** Create staff accounts and grant roles. */
  | "user.manage"
  | "audit.read";

/**
 * The matrix. Read down a column to answer "what can this person do?", and
 * across a row to answer "who can do this?".
 *
 * `customer` holds no capability at all: everything a customer may do is
 * their own row, decided by ownership in the query, not by a capability.
 * Only `admin` and `staff` are in use at launch (OQ-058); the other two are
 * defined so that granting one later is an INSERT, not a migration.
 */
const MATRIX: Record<RoleKey, readonly Capability[]> = {
  customer: [],

  staff: [
    "catalogue.read_draft",
    "inventory.adjust",
    "enquiry.read",
    "enquiry.write",
    "order.read_all",
    "customer.read_pii",
  ],

  content_manager: [
    "catalogue.read_draft",
    "catalogue.write",
    "catalogue.publish",
    "content.write",
  ],

  order_manager: [
    "inventory.adjust",
    "order.read_all",
    "order.transition",
    "customer.read_pii",
  ],

  admin: [
    "catalogue.read_draft",
    "catalogue.write",
    "catalogue.publish",
    "inventory.adjust",
    "enquiry.read",
    "enquiry.write",
    "order.read_all",
    "order.transition",
    "customer.read_pii",
    "content.write",
    "settings.write",
    "user.manage",
    "audit.read",
  ],
};

/**
 * Who is asking.
 *
 * Built once per request from the session, never from a header, a query
 * parameter or a form field. A service takes it as its first argument, which
 * is what lets a service be tested without a request.
 */
export type Actor =
  | { kind: "anonymous" }
  | {
      kind: "user";
      userId: string;
      email: string;
      name: string | null;
      roles: readonly RoleKey[];
      sessionId: string;
    };

export const ANONYMOUS: Actor = { kind: "anonymous" };

/** Every capability this actor holds, from all of their roles. */
export function capabilitiesOf(actor: Actor): ReadonlySet<Capability> {
  if (actor.kind !== "user") return new Set();
  const held = new Set<Capability>();
  for (const role of actor.roles) {
    for (const capability of MATRIX[role] ?? []) held.add(capability);
  }
  return held;
}

export function can(actor: Actor, capability: Capability): boolean {
  if (actor.kind !== "user") return false;
  return actor.roles.some((role) => MATRIX[role]?.includes(capability) ?? false);
}

/**
 * True when this actor has any reason at all to be inside the admin.
 *
 * A customer with a correct password is still not staff: they hold no
 * capability, so they are refused at the door rather than shown an empty
 * dashboard.
 */
export function isStaff(actor: Actor): boolean {
  return capabilitiesOf(actor).size > 0;
}

/** Thrown when an actor lacks a capability. Callers turn it into 403 or 404. */
export class ForbiddenError extends Error {
  readonly capability: Capability;

  constructor(capability: Capability) {
    // The message reaches a log, never a customer. It names the capability
    // rather than the row, so no log line leaks what exists.
    super(`Not permitted: ${capability}`);
    this.name = "ForbiddenError";
    this.capability = capability;
  }
}

/**
 * The guard every mutating service calls first, before it validates input and
 * long before it touches a row.
 */
export function requireCapability(actor: Actor, capability: Capability): void {
  if (!can(actor, capability)) throw new ForbiddenError(capability);
}

/** For tests and for the admin's own "what can I see" checks. */
export function rolesWith(capability: Capability): RoleKey[] {
  return (Object.keys(MATRIX) as RoleKey[]).filter((role) =>
    MATRIX[role].includes(capability),
  );
}

export const ROLE_KEYS = Object.keys(MATRIX) as RoleKey[];

export function isRoleKey(value: string): value is RoleKey {
  return (ROLE_KEYS as string[]).includes(value);
}
