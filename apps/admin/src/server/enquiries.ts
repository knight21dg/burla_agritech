import "server-only";
import { count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@burla/core/db";
import { enquiries, type EnquiryStatus } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";

/**
 * Enquiries from the website's contact and wholesale forms — an inbox.
 *
 * Three states the owner needs, mapped onto the database's own:
 *   New        — nobody has replied yet
 *   Contacted  — someone has been in touch     (in_progress)
 *   Done       — nothing more to do            (won)
 * and "Not genuine" for spam, which hides it from the inbox.
 */

export const ENQUIRY_VIEWS = {
  new: { label: "New", statuses: ["new"] as EnquiryStatus[] },
  contacted: { label: "Contacted", statuses: ["in_progress", "quoted"] as EnquiryStatus[] },
  done: { label: "Done", statuses: ["won", "lost"] as EnquiryStatus[] },
  spam: { label: "Not genuine", statuses: ["spam"] as EnquiryStatus[] },
} as const;

export type EnquiryView = keyof typeof ENQUIRY_VIEWS;

export function enquiryLabel(status: EnquiryStatus): string {
  const view = (Object.keys(ENQUIRY_VIEWS) as EnquiryView[]).find((key) =>
    ENQUIRY_VIEWS[key].statuses.includes(status),
  );
  return view ? ENQUIRY_VIEWS[view].label : "New";
}

export const ENQUIRIES_PAGE_SIZE = 25;

export async function listEnquiries(options: { view?: EnquiryView; page?: number }) {
  const view = options.view ?? "new";
  const where: SQL = inArray(enquiries.status, ENQUIRY_VIEWS[view].statuses);
  const page = Math.max(1, options.page ?? 1);

  const [rows, totals, byStatus] = await Promise.all([
    db
      .select({
        id: enquiries.id,
        type: enquiries.type,
        name: enquiries.name,
        company: enquiries.company,
        message: enquiries.message,
        status: enquiries.status,
        createdAt: enquiries.createdAt,
      })
      .from(enquiries)
      .where(where)
      .orderBy(desc(enquiries.createdAt))
      .limit(ENQUIRIES_PAGE_SIZE)
      .offset((page - 1) * ENQUIRIES_PAGE_SIZE),
    db.select({ n: count() }).from(enquiries).where(where),
    db.select({ status: enquiries.status, n: count() }).from(enquiries).groupBy(enquiries.status),
  ]);

  const counts = Object.fromEntries(
    (Object.keys(ENQUIRY_VIEWS) as EnquiryView[]).map((key) => [
      key,
      byStatus
        .filter((row) => ENQUIRY_VIEWS[key].statuses.includes(row.status))
        .reduce((sum, row) => sum + row.n, 0),
    ]),
  ) as Record<EnquiryView, number>;

  return { rows, total: totals[0]?.n ?? 0, counts, view };
}

export async function getEnquiry(id: string) {
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return row;
}

const TARGET: Record<"new" | "contacted" | "done" | "spam", EnquiryStatus> = {
  new: "new",
  contacted: "in_progress",
  done: "won",
  spam: "spam",
};

export async function markEnquiry(
  actor: Actor,
  id: string,
  as: keyof typeof TARGET,
): Promise<{ ok: boolean; message: string }> {
  requireCapability(actor, "enquiry.write");

  const current = await getEnquiry(id);
  if (!current) return { ok: false, message: "That enquiry could not be found." };

  const status = TARGET[as];
  await db.transaction(async (tx) => {
    await tx.update(enquiries).set({ status }).where(eq(enquiries.id, id));
    await writeAudit(tx, actor, {
      action: "enquiry.marked",
      entityType: "enquiry",
      entityId: id,
      changes: { from: enquiryLabel(current.status), to: enquiryLabel(status), name: current.name },
    });
  });

  return {
    ok: true,
    message:
      as === "contacted"
        ? "Marked as contacted."
        : as === "done"
          ? "Marked as done."
          : as === "spam"
            ? "Moved out of the inbox."
            : "Marked as new.",
  };
}
