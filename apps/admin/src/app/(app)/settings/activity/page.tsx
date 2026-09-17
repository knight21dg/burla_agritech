import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@burla/core/db";
import { auditLog, users } from "@burla/core/db/schema";
import { requirePermission } from "@/server/auth/session";
import { describe } from "@/lib/activity";
import { when } from "@/lib/format";

export const metadata: Metadata = { title: "Recent activity" };

const PAGE = 50;

/** Who did what, newest first, in plain sentences. The record cannot be edited. */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("audit.read");
  const params = await searchParams;
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1);

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      changes: auditLog.changes,
      at: auditLog.createdAt,
      who: users.name,
      email: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE + 1)
    .offset((page - 1) * PAGE);

  const more = rows.length > PAGE;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Settings
        </Link>
        <h1 className="page-title mt-2">Recent activity</h1>
        <p className="mt-0.5 text-ink-2">A record of every change made in this admin. It cannot be edited or deleted.</p>
      </div>

      {rows.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-ink-2">Nothing has happened yet.</p>
      ) : (
        <ol className="panel divide-y divide-line">
          {rows.slice(0, PAGE).map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">{describe(row)}</p>
                <p className="text-[0.875rem] text-ink-3">{row.who ?? row.email ?? "Website"}</p>
              </div>
              <span className="text-[0.875rem] text-ink-3">{when(row.at)}</span>
            </li>
          ))}
        </ol>
      )}

      {(page > 1 || more) && (
        <nav aria-label="More activity" className="flex justify-between">
          {page > 1 ? <Link href={`/settings/activity?page=${page - 1}`} className="btn btn-quiet">← Newer</Link> : <span />}
          {more ? <Link href={`/settings/activity?page=${page + 1}`} className="btn btn-quiet">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
