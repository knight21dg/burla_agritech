import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { ORDERS_PAGE_SIZE, listOrders } from "@/server/orders";
import { ORDER_GROUPS, ORDER_LABEL, ORDER_TONE, type OrderGroup } from "@/lib/orderSteps";
import { money, when } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Orders" };

function one(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("order.read_all");
  const params = await searchParams;

  const groupParam = one(params.show);
  const group = groupParam && groupParam in ORDER_GROUPS ? (groupParam as OrderGroup) : undefined;
  const search = one(params.q)?.slice(0, 60);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const { rows, total, counts } = await listOrders({ group, search, page });
  const pages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));

  const href = (next: { show?: OrderGroup; page?: number }) => {
    const query = new URLSearchParams();
    const show = "show" in next ? next.show : group;
    if (show) query.set("show", show);
    if (search) query.set("q", search);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const text = query.toString();
    return text ? `/orders?${text}` : "/orders";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Orders</h1>
        <p className="mt-0.5 text-ink-2">
          {counts.new > 0
            ? `${counts.new} new ${counts.new === 1 ? "order needs" : "orders need"} your attention.`
            : "No new orders waiting."}
        </p>
      </div>

      <nav aria-label="Show orders" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {[{ key: undefined, label: "All" }, ...(Object.keys(ORDER_GROUPS) as OrderGroup[]).map((key) => ({ key, label: ORDER_GROUPS[key].label }))].map(
          (item) => {
            const active = item.key === group;
            const n = item.key ? counts[item.key] : undefined;
            return (
              <Link
                key={item.key ?? "all"}
                href={href({ show: item.key })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[0.9375rem] font-medium",
                  active ? "border-accent bg-accent text-white" : "border-line-strong bg-panel hover:border-accent",
                )}
              >
                {item.label}
                {n !== undefined && n > 0 && <span className={active ? "text-white/80" : "text-ink-3"}> {n}</span>}
              </Link>
            );
          },
        )}
      </nav>

      <form method="get" role="search" className="flex gap-2">
        {group && <input type="hidden" name="show" value={group} />}
        <label htmlFor="q" className="sr-only">
          Search orders
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input id="q" name="q" type="search" defaultValue={search ?? ""} placeholder="Order number, name or phone…" className="field pl-10" />
        </div>
        <button type="submit" className="btn btn-quiet">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="panel px-4 py-14 text-center">
          <h2 className="text-lg">No orders here</h2>
          <p className="mt-1 text-ink-2">{search ? `Nothing matches “${search}”.` : "When customers order, they will appear here."}</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((order) => (
            <li key={order.orderNumber}>
              <Link
                href={`/orders/${order.orderNumber}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold">{order.customer}</span>
                    <span className={cn("pill", ORDER_TONE[order.status])}>{ORDER_LABEL[order.status]}</span>
                  </div>
                  <p className="mt-0.5 text-[0.875rem] text-ink-3">
                    {order.orderNumber} · {when(order.placedAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <span className="shrink-0 text-[1.0625rem] font-semibold tabular-nums">{money(order.totalMinor)}</span>
                <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="More orders" className="flex items-center justify-between">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="btn btn-quiet">← Previous</Link> : <span />}
          <span className="text-ink-2">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="btn btn-quiet">Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
