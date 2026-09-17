import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { ENQUIRIES_PAGE_SIZE, ENQUIRY_VIEWS, listEnquiries, type EnquiryView } from "@/server/enquiries";
import { when } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Enquiries" };

function one(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

/** An inbox: new messages first, one line each, open to read and reply. */
export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("enquiry.read");
  const params = await searchParams;
  const showParam = one(params.show);
  const view = showParam && showParam in ENQUIRY_VIEWS ? (showParam as EnquiryView) : "new";
  const page = Math.max(1, Number(one(params.page)) || 1);

  const { rows, total, counts } = await listEnquiries({ view, page });
  const pages = Math.max(1, Math.ceil(total / ENQUIRIES_PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Enquiries</h1>
        <p className="mt-0.5 text-ink-2">Messages sent from the website&rsquo;s contact and wholesale forms.</p>
      </div>

      <nav aria-label="Show enquiries" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {(Object.keys(ENQUIRY_VIEWS) as EnquiryView[]).map((key) => {
          const active = key === view;
          return (
            <Link
              key={key}
              href={key === "new" ? "/enquiries" : `/enquiries?show=${key}`}
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
          <h2 className="text-lg">{view === "new" ? "No new enquiries" : "Nothing here"}</h2>
          <p className="mt-1 text-ink-2">
            {view === "new" ? "When someone writes to you from the website, it will appear here." : "Enquiries you mark will appear here."}
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((enquiry) => (
            <li key={enquiry.id}>
              <Link href={`/enquiries/${enquiry.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold">{enquiry.name}</span>
                    {enquiry.company && <span className="text-ink-3">· {enquiry.company}</span>}
                    <span className={cn("pill", enquiry.type === "wholesale" ? "pill-warn" : "pill-off")}>
                      {enquiry.type === "wholesale" ? "Wholesale" : "Contact"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.9375rem] text-ink-2">{enquiry.message}</p>
                </div>
                <span className="shrink-0 text-[0.875rem] text-ink-3">{when(enquiry.createdAt)}</span>
                <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="More enquiries" className="flex items-center justify-between">
          {page > 1 ? <Link href={`/enquiries?show=${view}&page=${page - 1}`} className="btn btn-quiet">← Previous</Link> : <span />}
          <span className="text-ink-2">Page {page} of {pages}</span>
          {page < pages ? <Link href={`/enquiries?show=${view}&page=${page + 1}`} className="btn btn-quiet">Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
