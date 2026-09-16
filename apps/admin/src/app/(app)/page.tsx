import type { Metadata } from "next";
import { can } from "@burla/core/auth/rbac";
import { requireStaff } from "@/server/auth/session";
import {
  catalogueCounts,
  customerCount,
  enquiryCounts,
  orderCounts,
  stockCounts,
} from "@/server/repositories/dashboardRepository";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The dashboard.
 *
 * It shows what this actor is permitted to see and nothing else — a content
 * manager is not told how many orders came in, because content work never
 * needs it (docs/AUTHORIZATION.md §3). Each block is fetched only when the
 * capability holds, so an unauthorised number is never even read from the
 * database, let alone hidden with CSS.
 *
 * No charts. Five numbers a person can act on beat a graph of a business that
 * has taken four orders.
 */

function Stat({
  label,
  value,
  note,
  tone = "plain",
}: {
  label: string;
  value: number | string;
  note?: string;
  tone?: "plain" | "warn" | "ok";
}) {
  const toneClass =
    tone === "warn" ? "text-warning" : tone === "ok" ? "text-ok" : "text-ink";
  return (
    <div className="panel p-4">
      <p className="label">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {note && <p className="mt-1 text-[0.75rem] text-ink-3">{note}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const actor = await requireStaff();

  const [catalogue, stock, orders, enquiries, customers] = await Promise.all([
    can(actor, "catalogue.read_draft") ? catalogueCounts() : undefined,
    can(actor, "inventory.adjust") ? stockCounts() : undefined,
    can(actor, "order.read_all") ? orderCounts() : undefined,
    can(actor, "enquiry.read") ? enquiryCounts() : undefined,
    can(actor, "customer.read_pii") ? customerCount() : undefined,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg">Dashboard</h1>
        <p className="mt-0.5 text-[0.8125rem] text-ink-2">
          Signed in as {actor.kind === "user" ? actor.email : "—"}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {catalogue && (
          <>
            <Stat
              label="Products"
              value={catalogue.total}
              note={`${catalogue.published} published · ${catalogue.draft} draft`}
            />
            {catalogue.sample > 0 && (
              <Stat
                label="Sample data"
                value={catalogue.sample}
                note="Prices and pack sizes are ours, not the client's"
                tone="warn"
              />
            )}
          </>
        )}

        {stock && (
          <Stat
            label="Low stock"
            value={stock.low}
            note={stock.out > 0 ? `${stock.out} at zero` : "None at zero"}
            tone={stock.low > 0 ? "warn" : "plain"}
          />
        )}

        {orders && (
          <>
            <Stat
              label="To pack"
              value={orders.toPack}
              note={`${orders.total} orders in total`}
              tone={orders.toPack > 0 ? "warn" : "plain"}
            />
            <Stat label="Awaiting payment" value={orders.unpaid} />
          </>
        )}

        {enquiries && (
          <Stat
            label="New enquiries"
            value={enquiries.unanswered}
            note={`${enquiries.total} received`}
            tone={enquiries.unanswered > 0 ? "warn" : "plain"}
          />
        )}

        {customers !== undefined && (
          <Stat label="Registered customers" value={customers} />
        )}
      </div>

      <section className="panel p-4">
        <h2 className="text-[0.9375rem] font-semibold">What is built so far</h2>
        <p className="mt-1 text-[0.8125rem] text-ink-2">
          Sign-in, sessions, roles and permissions. The sections in the sidebar
          marked <em>Soon</em> are the next phases, in the order set out in{" "}
          <code className="font-mono text-[0.75rem]">docs/ADMIN-ARCHITECTURE.md</code>.
        </p>
        <p className="mt-2 text-[0.8125rem] text-ink-2">
          Editing the catalogue here will not change the public site until the
          storefront reads the database rather than its built-in copy — that is
          the next phase, and it is deliberately before any editing screen.
        </p>
      </section>
    </div>
  );
}
