import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import type { Address, SavedAddress } from "@/lib/checkout";

/** A transaction or the database: repository writes take either. */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

type Row = typeof addresses.$inferSelect;

const toAddress = (row: Row): SavedAddress => ({
  id: row.id,
  fullName: row.fullName,
  mobile: row.phone,
  pincode: row.postalCode,
  line1: row.line1,
  line2: row.line2 ?? "",
  landmark: row.landmark ?? "",
  city: row.city,
  // Only ever written from a validated Address, so it is one of the states.
  state: row.state as Address["state"],
  kind: row.label === "work" ? "work" : "home",
});

/** The customer's saved addresses, most recently used first. */
export async function listForUser(userId: string): Promise<SavedAddress[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.updatedAt), asc(addresses.createdAt));
  return rows.map(toAddress);
}

/** One saved address — only if it belongs to this customer. */
export async function findForUser(userId: string, id: string): Promise<SavedAddress | undefined> {
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1);
  return row && toAddress(row);
}

/**
 * Saves an address a customer typed at checkout, unless they already have
 * exactly this one; either way, marks it as just used.
 */
export async function saveUsed(exec: Executor, userId: string, a: Address) {
  const values = {
    fullName: a.fullName,
    phone: a.mobile,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark || null,
    city: a.city,
    state: a.state,
    postalCode: a.pincode,
    label: a.kind,
  };
  const existing = await exec
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId));
  const same = existing.find(
    (row) =>
      row.fullName === values.fullName &&
      row.phone === values.phone &&
      row.line1 === values.line1 &&
      (row.line2 ?? "") === values.line2 &&
      (row.landmark ?? null) === values.landmark &&
      row.city === values.city &&
      row.state === values.state &&
      row.postalCode === values.postalCode,
  );
  if (same) {
    await exec.update(addresses).set({ label: values.label }).where(eq(addresses.id, same.id));
    return;
  }
  await exec.insert(addresses).values({ userId, ...values });
}

/** Marks a saved address as just used, so it is offered first next time. */
export async function touch(exec: Executor, userId: string, id: string) {
  await exec
    .update(addresses)
    .set({ updatedAt: new Date() })
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}
