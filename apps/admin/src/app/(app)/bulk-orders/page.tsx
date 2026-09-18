import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import {
  ENQUIRIES_PAGE_SIZE,
  ENQUIRY_VIEWS,
  interestNames,
  listEnquiries,
  readInterest,
  type EnquiryView,
} from "@/server/enquiries";
import { when } from "@/lib/format";
import { QuickMark } from "@/components/enquiries/QuickMark";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Bulk orders" };

/**
 * Bulk orders — the wholesale enquiries from the website's Bulk & Wholesale
 * page, on their own, with the things a supplier needs to see first: how much
 * they want, what of, and where they are.
 *
 * These are the same messages as in Enquiries, not a second copy of them:
 * marking one here marks it there. The trade is what is different, so the
 * trade is what this page shows.
 */

function one(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export default async function BulkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePermission("enquiry.read");
  const mayWrite = can(actor, "enquiry.write");
  const params = await searchParams;
  const showParam = one(params.show);
  const view = showParam && showParam in ENQUIRY_VIEWS ? (showParam as EnquiryView) : "new";
  const page = Math.max(1, Number(one(params.page)) || 1);

  const { rows, total, counts } = await listEnquiries({ view, page, type: "wholesale" });
  const names = await interestNames(rows.flatMap((row) => row.productInterest ?? []));
  const pages = Math.max(1, Math.ceil(total / ENQUIRIES_PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Bulk orders</h1>
        <p className="mt-0.5 text-ink-2">
          Wholesale enquiries from the website — retailers, distributors and businesses asking for a quote.
        </p>
      </div>

      <nav aria-label="Show bulk orders" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {(Object.keys(ENQUIRY_VIEWS) as EnquiryView[]).map((key) => {
          const active = key === view;
          return (
            <Link
              key={key}
              href={key === "new" ? "/bulk-orders" : `/bulk-orders?show=${key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.9375rem] font-medium",
                active ? "border-accent bg-accent text-white" : "border-line-strong bg-panel hover:border-accent",
              )}
            >
              {ENQUIRY_VIEWS[key].label}
              {counts[key] > 0 && <span className={active ? "text-white/80" : "text-ink-3"}> {counts[key]}</span>}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="panel px-4 py-14 text-center">
          <h2 className="text-lg">{view === "new" ? "No new bulk orders" : "Nothing here"}</h2>
          <p className="mt-1 text-ink-2">
            {view === "new"
              ? "When someone asks for a bulk quote on the website, it will appear here."
              : "Bulk orders you mark will appear here."}
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((enquiry) => (
            <li key={enquiry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
              <Link href={`/bulk-orders/${enquiry.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-dark">
                  <Truck className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold">{enquiry.name}</span>
                    {enquiry.company && <span className="text-ink-3">· {enquiry.company}</span>}
                    {enquiry.estimatedQuantity && <span className="pill pill-warn">{enquiry.estimatedQuantity}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-[0.9375rem] text-ink-2">
                    {enquiry.productInterest?.length
                      ? readInterest(enquiry.productInterest, names).join(", ")
                      : enquiry.message}
                  </p>
                </div>
                {enquiry.country && (
                  <span className="hidden shrink-0 text-[0.875rem] text-ink-3 lg:block">{enquiry.country}</span>
                )}
                <span className="shrink-0 text-[0.875rem] text-ink-3">{when(enquiry.createdAt)}</span>
                <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
              </Link>
              {mayWrite && <QuickMark enquiryId={enquiry.id} view={view} />}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="More bulk orders" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={`/bulk-orders?show=${view}&page=${page - 1}`} className="btn btn-quiet">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-2">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/bulk-orders?show=${view}&page=${page + 1}`} className="btn btn-quiet">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
