import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, type Database } from "../db";
import { auditLog } from "../db/schema";
import type { Actor } from "../auth/rbac";

/**
 * The audit trail (docs/AUTHORIZATION.md §8).
 *
 * `audit_log` is append-only at the database — a trigger refuses UPDATE and
 * DELETE — so this module can only add to it.
 *
 * ## Write it in the same transaction as the change
 *
 * Every mutation should pass its transaction as `executor`. An audit row that
 * can be missing while the write succeeded is worse than no audit log at all,
 * because it is trusted. Pass the transaction and the two either both happen
 * or neither does.
 *
 * ## What never goes in `changes`
 *
 * Password hashes, session or verification tokens, payment secrets, or a
 * whole row copied wholesale. Only the fields that changed, and only ones a
 * person may see.
 */

export interface AuditEntry {
  /** Past tense, dotted, stable: `product.published`, `session.signed_in`. */
  action: string;
  entityType: string;
  entityId?: string;
  /** The changed fields only — never a whole row, never a secret. */
  changes?: Record<string, unknown>;
  ipHash?: string;
  userAgent?: string;
}

/** Accepts the `db` or a transaction, so a caller can include it in theirs. */
type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function writeAudit(
  executor: Executor,
  actor: Actor,
  entry: AuditEntry,
): Promise<void> {
  await executor.insert(auditLog).values({
    actorId: actor.kind === "user" ? actor.userId : null,
    // The roles at the moment of the action. A role removed next week must
    // not change what the log says happened today.
    actorRole: actor.kind === "user" ? actor.roles.join(",") : null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    changes: entry.changes ?? null,
    ipHash: entry.ipHash ?? null,
    userAgent: entry.userAgent ?? null,
  });
}

export interface AuditRow {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  createdAt: Date;
}

/** Newest first. Paged — the log only grows. */
export async function listAudit(options: {
  limit: number;
  offset?: number;
  entityType?: string;
}): Promise<AuditRow[]> {
  const query = db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      changes: auditLog.changes,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(options.limit)
    .offset(options.offset ?? 0);

  return options.entityType
    ? query.where(eq(auditLog.entityType, options.entityType))
    : query;
}
