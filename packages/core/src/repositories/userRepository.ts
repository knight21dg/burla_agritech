import "server-only";
import { and, eq, gt, inArray } from "drizzle-orm";
import { db } from "../db";
import { passwordCredentials, roles, sessions, userRoles, users } from "../db/schema";
import { isRoleKey, type RoleKey } from "../auth/rbac";

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

// --- staff -------------------------------------------------------------------

/**
 * The admin application needs two things the customer site never asks for:
 * the roles a person holds, and sessions in the `admin` scope. Both queries
 * live here rather than in the admin, because the shape of `users`,
 * `user_roles` and `sessions` is shared and should be read one way.
 */
export interface StaffUser {
  id: string;
  email: string;
  name: string | null;
  roles: RoleKey[];
}

/** Every role key held by one user, filtered to the ones this code knows. */
async function rolesOf(userId: string): Promise<RoleKey[]> {
  const rows = await db
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));

  // An unknown role key in the database grants nothing, rather than crashing
  // a sign-in or — worse — being treated as a role it resembles.
  return rows.map((row) => row.key).filter(isRoleKey);
}

/**
 * Credentials plus roles, for the admin sign-in.
 *
 * Returns the row whatever the roles are: refusing a customer is the caller's
 * decision, made after the password has been verified, so that "this address
 * is not staff" and "this password is wrong" take the same time and give the
 * same answer.
 */
export async function findStaffCredentialsByEmail(email: string) {
  const row = await findCredentialsByEmail(email);
  if (!row) return undefined;
  return { ...row, roles: await rolesOf(row.id) };
}

/** The staff member behind a live admin session, with their roles. */
export async function findStaffBySessionHash(
  tokenHash: string,
): Promise<(StaffUser & { sessionId: string }) | undefined> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        // The scope is the reason a customer cookie cannot become an admin
        // session even if it were somehow presented to this origin.
        eq(sessions.scope, "admin"),
        gt(sessions.expiresAt, new Date()),
        eq(users.status, "active"),
      ),
    )
    .limit(1);

  if (!row) return undefined;
  return { ...row, roles: await rolesOf(row.id) };
}

export async function insertStaffSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
}) {
  await db.insert(sessions).values({ ...input, scope: "admin" });
}

/**
 * Creates a staff account with its roles, in one transaction.
 *
 * Used by the admin's user management and by `admin:create`, which bootstraps
 * the first account. There is no sign-up route on the admin — an account is
 * made by someone who already has one, or by someone with shell access to the
 * server.
 */
export async function createStaffUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  roles: RoleKey[];
  grantedBy?: string;
}): Promise<StaffUser | undefined> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: input.email, name: input.name })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email, name: users.name });
    if (!user) return undefined;

    await tx
      .insert(passwordCredentials)
      .values({ userId: user.id, passwordHash: input.passwordHash });

    const granted = await tx
      .select({ id: roles.id, key: roles.key })
      .from(roles)
      .where(inArray(roles.key, input.roles));

    if (granted.length !== input.roles.length) {
      // Rolls the transaction back: half a staff account is worse than none.
      throw new Error(
        `Unknown role(s): ${input.roles
          .filter((key) => !granted.some((row) => row.key === key))
          .join(", ")}`,
      );
    }

    await tx.insert(userRoles).values(
      granted.map((role) => ({
        userId: user.id,
        roleId: role.id,
        grantedBy: input.grantedBy,
      })),
    );

    return { ...user, roles: input.roles };
  });
}
