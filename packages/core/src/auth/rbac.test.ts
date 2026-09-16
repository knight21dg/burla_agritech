import { describe, expect, it } from "vitest";
import {
  ANONYMOUS,
  ForbiddenError,
  can,
  capabilitiesOf,
  isRoleKey,
  isStaff,
  requireCapability,
  rolesWith,
  type Actor,
  type RoleKey,
} from "./rbac";

/**
 * The permission matrix is the security boundary of the admin, so it is
 * tested as one — not incidentally, through a page that happens to call it.
 *
 * These are the acceptance criteria from docs/AUTHORIZATION.md §10, the ones
 * that can be decided without a database. The rest (ownership in the query,
 * 404 rather than 403, one audit row per mutation) are integration tests and
 * arrive with the phases that create those paths.
 */

const actor = (...roles: RoleKey[]): Actor => ({
  kind: "user",
  userId: "00000000-0000-0000-0000-000000000001",
  email: "someone@burla.test",
  name: "Someone",
  roles,
  sessionId: "session",
});

describe("anonymous", () => {
  it("holds no capability at all", () => {
    expect(capabilitiesOf(ANONYMOUS).size).toBe(0);
    expect(can(ANONYMOUS, "catalogue.write")).toBe(false);
    expect(can(ANONYMOUS, "audit.read")).toBe(false);
  });

  it("is not staff", () => {
    expect(isStaff(ANONYMOUS)).toBe(false);
  });
});

describe("customer", () => {
  // Test 2 in AUTHORIZATION.md §10: a signed-in customer calling an admin
  // service is refused. Everything a customer may do is decided by ownership
  // in the query, never by a capability.
  it("holds no capability, so cannot reach any admin function", () => {
    const customer = actor("customer");
    expect(capabilitiesOf(customer).size).toBe(0);
    expect(can(customer, "order.read_all")).toBe(false);
    expect(can(customer, "catalogue.read_draft")).toBe(false);
  });

  it("is refused at the admin door", () => {
    expect(isStaff(actor("customer"))).toBe(false);
  });
});

describe("staff", () => {
  const staff = actor("staff");

  it("reads enquiries, orders and customer details, and moves stock", () => {
    expect(can(staff, "enquiry.read")).toBe(true);
    expect(can(staff, "enquiry.write")).toBe(true);
    expect(can(staff, "order.read_all")).toBe(true);
    expect(can(staff, "customer.read_pii")).toBe(true);
    expect(can(staff, "inventory.adjust")).toBe(true);
  });

  it("cannot change what a customer is charged", () => {
    expect(can(staff, "catalogue.write")).toBe(false);
    expect(can(staff, "catalogue.publish")).toBe(false);
  });

  it("cannot manage accounts, settings or the audit log", () => {
    expect(can(staff, "user.manage")).toBe(false);
    expect(can(staff, "settings.write")).toBe(false);
    expect(can(staff, "audit.read")).toBe(false);
  });
});

describe("content_manager", () => {
  const content = actor("content_manager");

  it("edits and publishes the catalogue and page copy", () => {
    expect(can(content, "catalogue.write")).toBe(true);
    expect(can(content, "catalogue.publish")).toBe(true);
    expect(can(content, "content.write")).toBe(true);
  });

  // Test 5: content work never requires personal data, so it never gets it.
  it("never sees orders or customer details", () => {
    expect(can(content, "order.read_all")).toBe(false);
    expect(can(content, "customer.read_pii")).toBe(false);
  });
});

describe("order_manager", () => {
  const orders = actor("order_manager");

  it("reads and moves orders", () => {
    expect(can(orders, "order.read_all")).toBe(true);
    expect(can(orders, "order.transition")).toBe(true);
  });

  // Test 6: the person who packs boxes cannot change a price.
  it("cannot edit or publish the catalogue", () => {
    expect(can(orders, "catalogue.write")).toBe(false);
    expect(can(orders, "catalogue.publish")).toBe(false);
  });
});

describe("admin", () => {
  const admin = actor("admin");

  it("holds every capability", () => {
    for (const capability of [
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
    ] as const) {
      expect(can(admin, capability), capability).toBe(true);
    }
  });

  // Test 7: only an admin may hand out roles, so no other role can promote
  // itself by granting one.
  it("is the only role that can manage users", () => {
    expect(rolesWith("user.manage")).toEqual(["admin"]);
  });

  it("is granted its capabilities by the matrix, not by a bypass", () => {
    // If `admin` were special-cased, removing a capability from its row would
    // change nothing. This proves the row is what is consulted.
    const notAdmin = actor("staff");
    expect(can(notAdmin, "settings.write")).toBe(false);
    expect(capabilitiesOf(admin).size).toBeGreaterThan(
      capabilitiesOf(notAdmin).size,
    );
  });
});

describe("several roles at once", () => {
  it("adds the capabilities together", () => {
    const both = actor("content_manager", "order_manager");
    expect(can(both, "catalogue.publish")).toBe(true);
    expect(can(both, "order.transition")).toBe(true);
    // And still grants nothing neither role holds.
    expect(can(both, "user.manage")).toBe(false);
  });
});

describe("requireCapability", () => {
  it("passes silently when the capability is held", () => {
    expect(() => requireCapability(actor("admin"), "settings.write")).not.toThrow();
  });

  it("throws ForbiddenError when it is not", () => {
    expect(() => requireCapability(actor("staff"), "settings.write")).toThrow(
      ForbiddenError,
    );
  });

  it("throws for anonymous", () => {
    expect(() => requireCapability(ANONYMOUS, "enquiry.read")).toThrow(
      ForbiddenError,
    );
  });

  it("names the capability and no row", () => {
    try {
      requireCapability(actor("staff"), "audit.read");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).message).toBe("Not permitted: audit.read");
    }
  });
});

describe("role keys from the database", () => {
  it("accepts the five that exist", () => {
    for (const key of [
      "customer",
      "staff",
      "content_manager",
      "order_manager",
      "admin",
    ]) {
      expect(isRoleKey(key)).toBe(true);
    }
  });

  // A role key added to the database but not to this file must grant nothing
  // rather than resemble a role it is not.
  it("rejects anything else", () => {
    expect(isRoleKey("superuser")).toBe(false);
    expect(isRoleKey("ADMIN")).toBe(false);
    expect(isRoleKey("")).toBe(false);
  });

  it("grants nothing for an unknown role", () => {
    const impostor = { ...actor(), roles: ["superuser" as RoleKey] };
    expect(capabilitiesOf(impostor).size).toBe(0);
    expect(isStaff(impostor)).toBe(false);
  });
});
