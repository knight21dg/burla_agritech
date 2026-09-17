import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { CUSTOMERS_PAGE_SIZE, listCustomers } from "@/server/customers";
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
  await requirePermission("customer.read_pii");
  const params = await searchParams;
  const search = one(params.q)?.slice(0, 60);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const { rows, total } = await listCustomers({ search, page });
  const pages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const href = (next: number) => {
    const query = new URLSearchParams();
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
          {total} {total === 1 ? "person has" : "people have"} an account on the website.
        </p>
      </div>

      <form method="get" role="search" className="flex gap-2">
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
          <p className="mt-1 text-ink-2">{search ? `Nobody matches “${search}”.` : "When people sign up on the website, they will appear here."}</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((customer) => (
            <li key={customer.id}>
              <Link href={`/customers/${customer.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{customer.name}</p>
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
                <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
              </Link>
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
