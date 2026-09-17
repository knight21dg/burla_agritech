import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listStock, recentStockChanges, type StockShow } from "@/server/stock";
import { StockRow } from "@/components/stock/StockRow";
import { when } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Stock" };

function one(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

const SHOW: { key: StockShow; label: string }[] = [
  { key: "all", label: "All" },
  { key: "low", label: "Running low" },
  { key: "out", label: "Out of stock" },
  { key: "not_counted", label: "Not counted" },
];

/** How many packets there are of everything, and supply coming in. */
export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("inventory.adjust");
  const params = await searchParams;
  const search = one(params.q)?.slice(0, 60);
  const showParam = one(params.show);
  const show = SHOW.some((s) => s.key === showParam) ? (showParam as StockShow) : "all";

  const [{ groups, counts }, changes] = await Promise.all([listStock({ show, search }), recentStockChanges()]);

  const href = (key: StockShow) => {
    const query = new URLSearchParams();
    if (key !== "all") query.set("show", key);
    if (search) query.set("q", search);
    const text = query.toString();
    return text ? `/stock?${text}` : "/stock";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="page-title">Stock</h1>
        <p className="mt-0.5 text-ink-2">
          How many packets you have. When 5 or fewer are left, the website says “Only 3 left”. At 0 it
          stops selling that pack size.
        </p>
      </div>

      <nav aria-label="Show stock" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {SHOW.map(({ key, label }) => {
          const active = key === show;
          const n = counts[key];
          return (
            <Link
              key={key}
              href={href(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.9375rem] font-medium",
                active ? "border-accent bg-accent text-white" : "border-line-strong bg-panel hover:border-accent",
              )}
            >
              {label}
              {n > 0 && <span className={active ? "text-white/80" : "text-ink-3"}> {n}</span>}
            </Link>
          );
        })}
      </nav>

      <form method="get" role="search" className="flex gap-2">
        {show !== "all" && <input type="hidden" name="show" value={show} />}
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input id="q" name="q" type="search" defaultValue={search ?? ""} placeholder="Search products…" className="field pl-10" />
        </div>
        <button type="submit" className="btn btn-quiet">
          Search
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="panel px-4 py-14 text-center">
          <h2 className="text-lg">Nothing here</h2>
          <p className="mt-1 text-ink-2">
            {search
              ? `No product matches “${search}”.`
              : show === "low"
                ? "No pack size is running low."
                : show === "out"
                  ? "Nothing is out of stock."
                  : show === "not_counted"
                    ? "Every pack size is being counted."
                    : "Add a product first."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <li key={group.productId} className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[1.0625rem] font-semibold">{group.productName}</h2>
                <div className="flex items-center gap-2">
                  {!group.onWebsite && <span className="pill pill-off">Hidden from website</span>}
                  <Link href={`/products/${group.productId}`} className="text-[0.875rem] text-ink-2 underline underline-offset-2 hover:text-ink">
                    Edit product
                  </Link>
                </div>
              </div>
              <ul className="mt-1 divide-y divide-line">
                {group.packs.map((pack) => (
                  <StockRow
                    key={pack.variantId}
                    variantId={pack.variantId}
                    productName={pack.productName}
                    size={pack.size}
                    counted={pack.counted}
                    quantity={pack.quantity}
                    lowLevel={pack.lowLevel}
                    onSale={pack.onSale}
                    state={pack.state}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Recent stock changes</h2>
        {changes.length === 0 ? (
          <p className="mt-2 text-ink-2">No changes yet. Supply you add and orders from the website appear here.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {changes.map((change) => (
              <li key={change.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                <span
                  className={cn(
                    "w-14 shrink-0 font-semibold tabular-nums",
                    change.change.startsWith("+") ? "text-accent-dark" : "text-danger",
                  )}
                >
                  {change.change}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{change.what}</span>
                  <span className="text-ink-3">
                    {" "}
                    · {change.why}
                    {change.by ? ` by ${change.by}` : ""}
                  </span>
                </span>
                <span className="text-[0.875rem] text-ink-3">{when(change.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
