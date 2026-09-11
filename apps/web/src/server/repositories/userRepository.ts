import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { passwordCredentials, roles, sessions, userRoles, users } from "@/server/db/schema";

/** What the rest of the app knows about a signed-in customer. Never a hash. */
export interface AccountUser {
  id: string;
  email: string;
  name: string | null;
}

export async function findCredentialsByEmail(email: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      status: users.status,
      passwordHash: passwordCredentials.passwordHash,
    })
    .from(users)
    .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);
  return row;
}

export async function emailExists(email: string): Promise<boolean> {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return Boolean(row);
}

/**
 * A new customer: the user, their password hash and the `customer` role, in
 * one transaction — never a user without a credential, or without a role.
 * Returns undefined when the email is already taken (the unique index decides,
 * not a racy check beforehand).
 */
export async function createCustomer(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AccountUser | undefined> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: input.email, name: input.name })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email, name: users.name });
    if (!user) return undefined;

    await tx.insert(passwordCredentials).values({ userId: user.id, passwordHash: input.passwordHash });

    const [customer] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, "customer"))
      .limit(1);
    if (!customer) throw new Error("The customer role is missing — run the migrations.");
    await tx.insert(userRoles).values({ userId: user.id, roleId: customer.id });

    return user;
  });
}

export async function recordSignIn(userId: string) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

// --- sessions ----------------------------------------------------------------

export async function insertSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
}) {
  await db.insert(sessions).values({ ...input, scope: "web" });
}

/** The customer behind a live web session, or undefined. */
export async function findUserBySessionHash(tokenHash: string): Promise<AccountUser | undefined> {
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        eq(sessions.scope, "web"),
        gt(sessions.expiresAt, new Date()),
        eq(users.status, "active"),
      ),
    )
    .limit(1);
  return row;
}

export async function deleteSessionByHash(tokenHash: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
