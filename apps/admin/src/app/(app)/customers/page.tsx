import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { CUSTOMERS_PAGE_SIZE, listCustomers, type CustomerShow } from "@/server/customers";
import { AccountSwitch } from "@/components/customers/AccountSwitch";
import { cn } from "@/lib/cn";
import { when } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

function one(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePermission("customer.read_pii");
  const canManage = can(actor, "user.manage");
  const params = await searchParams;
  const search = one(params.q)?.slice(0, 60);
  const page = Math.max(1, Number(one(params.page)) || 1);
  const showParam = one(params.show);
  const show: CustomerShow = showParam === "active" || showParam === "deactivated" ? showParam : "all";

  const { rows, total, deactivated } = await listCustomers({ search, page, show });
  const pages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const href = (next: number, nextShow: CustomerShow = show) => {
    const query = new URLSearchParams();
    if (nextShow !== "all") query.set("show", nextShow);
    if (search) query.set("q", search);
    if (next > 1) query.set("page", String(next));
    const text = query.toString();
    return text ? `/customers?${text}` : "/customers";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Customers</h1>
        <p className="mt-0.5 text-ink-2">
          {total} {total === 1 ? "person" : "people"}
          {show === "deactivated"
            ? " with a deactivated account."
            : show === "active"
              ? " with an active account."
              : " with an account on the website."}
        </p>
      </div>

      <nav aria-label="Show customers" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {(
          [
            ["all", "All"],
            ["active", "Active"],
            ["deactivated", "Deactivated"],
          ] as [CustomerShow, string][]
        ).map(([key, label]) => (
          <Link
            key={key}
            href={href(1, key)}
            aria-current={key === show ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[0.9375rem] font-medium",
              key === show ? "border-accent bg-accent text-white" : "border-line-strong bg-panel hover:border-accent",
            )}
          >
            {label}
            {key === "deactivated" && deactivated > 0 && (
              <span className={key === show ? "text-white/80" : "text-ink-3"}> {deactivated}</span>
            )}
          </Link>
        ))}
      </nav>

      <form method="get" role="search" className="flex gap-2">
        {show !== "all" && <input type="hidden" name="show" value={show} />}
        <label htmlFor="q" className="sr-only">
          Search customers
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input id="q" name="q" type="search" defaultValue={search ?? ""} placeholder="Name or email…" className="field pl-10" />
        </div>
        <button type="submit" className="btn btn-quiet">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="panel px-4 py-14 text-center">
          <h2 className="text-lg">No customers here</h2>
          <p className="mt-1 text-ink-2">
            {search
              ? `Nobody matches “${search}”.`
              : show === "deactivated"
                ? "No accounts are deactivated."
                : "When people sign up on the website, they will appear here."}
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((customer) => (
            <li key={customer.id} className={cn("px-4 py-3", !customer.active && "bg-danger-soft/40")}>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {customer.name}
                    {!customer.active && <span className="pill pill-bad">Deactivated</span>}
                  </p>
                  <p className="truncate text-[0.875rem] text-ink-3">
                    {customer.phone ? `${customer.phone} · ` : ""}
                    {customer.email}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[0.875rem]">
                  <p className="font-medium">
                    {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
                  </p>
                  <p className="text-ink-3">
                    {customer.lastOrderAt ? `Last: ${when(customer.lastOrderAt)}` : "No orders yet"}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link href={`/customers/${customer.id}`} className="btn btn-quiet">
                  <UserRound className="size-4" aria-hidden="true" />
                  Account details
                </Link>
                {canManage && (
                  <AccountSwitch
                    compact
                    customerId={customer.id}
                    name={customer.name}
                    active={customer.active}
                    phones={customer.phone ? [customer.phone] : []}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="More customers" className="flex items-center justify-between">
          {page > 1 ? <Link href={href(page - 1)} className="btn btn-quiet">← Previous</Link> : <span />}
          <span className="text-ink-2">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="btn btn-quiet">Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
