import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/ids";
import { Search } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import {
  listProducts,
  listTaxonomy,
  type ProductFilters,
} from "@/server/repositories/catalogueRepository";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

/**
 * The product list.
 *
 * Reading it needs `catalogue.read_draft`, because it shows drafts: the whole
 * point of this screen is the rows customers cannot see. An order manager,
 * who has no catalogue capability at all, gets the refusal page rather than a
 * table with the edit buttons hidden.
 *
 * Paged in the database, never in the application. Sixty-three products would
 * survive being loaded whole; the habit would not survive six hundred.
 */

const PER_PAGE = 25;

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalogue.read_draft");

  const params = await searchParams;
  const status = one(params.status);
  const filters: ProductFilters = {
    q: one(params.q),
    status:
      status === "draft" || status === "published" || status === "archived"
        ? status
        : undefined,
    // A filter is a convenience, not a lookup: a malformed one is ignored
    // rather than turned into a server error.
    categoryId: isUuid(one(params.category)) ? one(params.category) : undefined,
    page: Number(one(params.page) ?? 1) || 1,
    perPage: PER_PAGE,
  };

  const [{ rows, total }, taxonomy] = await Promise.all([
    listProducts(filters),
    listTaxonomy(),
  ]);

  const categories = taxonomy.filter((t) => t.parentId === null);
  const page = filters.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const pageHref = (next: number) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.categoryId) query.set("category", filters.categoryId);
    if (next > 1) query.set("page", String(next));
    const search = query.toString();
    return search ? `/products?${search}` : "/products";
  };

  // A page past the end — an old bookmark, or the last product archived from
  // under someone — goes to the last page that exists, rather than showing
  // "No products match" over a catalogue that plainly has products in it.
  if (total > 0 && page > pages) redirect(pageHref(pages));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg">Products</h1>
          <p className="mt-0.5 text-[0.8125rem] text-ink-2">
            {total} {total === 1 ? "product" : "products"}
            {filters.q || filters.status || filters.categoryId ? " matching" : " in the catalogue"}
          </p>
        </div>
      </div>

      {/* A GET form: the filters end up in the URL, so a filtered list can be
          bookmarked, shared with a colleague and reloaded. */}
      <form method="get" className="panel flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="q" className="label block">
            Search
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              placeholder="Name, slug or SKU"
              className="field pl-8"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="label block">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="category" className="label block">
            Range
          </label>
          <select
            id="category"
            name="category"
            defaultValue={filters.categoryId ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-quiet">
          Apply
        </button>
        {(filters.q || filters.status || filters.categoryId) && (
          <Link href="/products" className="text-[0.8125rem] text-ink-2 hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="panel px-4 py-16 text-center">
          <h2 className="text-[0.9375rem] font-semibold">No products match</h2>
          <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] text-ink-2">
            Try a different search, or clear the filters to see the whole catalogue.
          </p>
          <Link href="/products" className="btn btn-quiet mt-4">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label px-3 py-2.5">
                  Product
                </th>
                <th scope="col" className="label px-3 py-2.5">
                  Range
                </th>
                <th scope="col" className="label px-3 py-2.5 text-right">
                  From
                </th>
                <th scope="col" className="label px-3 py-2.5 text-right">
                  Packs
                </th>
                <th scope="col" className="label px-3 py-2.5 text-right">
                  Stock
                </th>
                <th scope="col" className="label px-3 py-2.5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/products/${row.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {row.name}
                    </Link>
                    <span className="block font-mono text-[0.6875rem] text-ink-3">
                      {row.slug}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[0.8125rem] text-ink-2">
                    {row.categoryName}
                    {row.typeName && (
                      <span className="text-ink-3"> · {row.typeName}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {row.fromPriceMinor === null ? (
                      <span className="text-ink-3">—</span>
                    ) : (
                      money(row.fromPriceMinor)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-2">
                    {row.variantCount}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={row.stock === 0 ? "text-danger" : "text-ink-2"}>
                      {row.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={row.status} />
                      {row.featured && (
                        <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-medium text-accent-dark">
                          Featured
                        </span>
                      )}
                      {row.isSample && (
                        <span
                          title="Price and pack size set by us, not the client"
                          className="rounded-sm bg-warning-soft px-1.5 py-0.5 text-[0.6875rem] font-medium text-warning"
                        >
                          Sample
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav
          aria-label="Pages"
          className="flex items-center justify-between text-[0.8125rem]"
        >
          <span className="text-ink-3">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="btn btn-quiet">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className="btn btn-quiet">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
