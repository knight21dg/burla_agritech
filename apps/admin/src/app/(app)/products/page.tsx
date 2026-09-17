import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { PAGE_SIZE, categoryOptions, listProducts } from "@/server/products";
import { isUuid } from "@/lib/ids";
import { cn } from "@/lib/cn";
import { ProductCardActions } from "@/components/products/ProductCardActions";

export const metadata: Metadata = { title: "Products" };

/**
 * Products — the screen the owner will use most.
 *
 * A search box, the categories as buttons, and a card per product showing
 * exactly what matters: its photo, name, category, price and pack size,
 * whether it is available, and whether it is on the website. Under each card:
 * Available / Out of stock, Edit and Delete.
 */

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

const rupees = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePermission("catalogue.read_draft");
  const params = await searchParams;

  const search = one(params.q)?.slice(0, 80);
  const categoryId = isUuid(one(params.category)) ? one(params.category) : undefined;
  const page = Math.max(1, Number(one(params.page)) || 1);

  const [{ cards, total }, options] = await Promise.all([
    listProducts({ search, categoryId, page }),
    categoryOptions(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (next: { category?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    const category = "category" in next ? next.category : categoryId;
    if (category) query.set("category", category);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const text = query.toString();
    return text ? `/products?${text}` : "/products";
  };

  if (total > 0 && page > pages) redirect(href({ page: pages }));

  const categories = options.filter((option) => option.parentId === null);
  const canAdd = can(actor, "catalogue.write");
  const canDelete = can(actor, "catalogue.publish");
  const deleted = one(params.deleted) === "1";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="mt-0.5 text-ink-2">
            {total} {total === 1 ? "product" : "products"}
            {search || categoryId ? " found" : ""}
          </p>
        </div>
        {canAdd && (
          <Link href="/products/new" className="btn btn-primary">
            <Plus className="size-5" aria-hidden="true" />
            Add Product
          </Link>
        )}
      </div>

      {deleted && (
        <p role="status" className="rounded-md border border-accent/25 bg-accent-soft px-3 py-2 text-accent-dark">
          The product was deleted.
        </p>
      )}

      <form method="get" role="search" className="flex gap-2">
        {categoryId && <input type="hidden" name="category" value={categoryId} />}
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search products…"
            className="field pl-10"
          />
        </div>
        <button type="submit" className="btn btn-quiet">
          Search
        </button>
      </form>

      <nav aria-label="Categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {[{ id: undefined, name: "All" }, ...categories].map((category) => {
          const active = category.id === categoryId;
          return (
            <Link
              key={category.id ?? "all"}
              href={href({ category: category.id })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.9375rem] font-medium",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-line-strong bg-panel text-ink hover:border-accent",
              )}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>

      {cards.length === 0 ? (
        <div className="panel px-4 py-14 text-center">
          <h2 className="text-lg">No products here</h2>
          <p className="mx-auto mt-1 max-w-sm text-ink-2">
            {search ? `Nothing matches “${search}”.` : "This category has no products yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(search || categoryId) && (
              <Link href="/products" className="btn btn-quiet">
                Show all products
              </Link>
            )}
            {canAdd && (
              <Link href="/products/new" className="btn btn-primary">
                Add Product
              </Link>
            )}
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => (
            <li key={card.id} className="panel flex flex-col gap-3 p-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
                  {card.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the shop's own photo, already sized
                    <img src={card.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="px-2 text-center text-[0.75rem] text-ink-3">No photo</span>
                  )}
                </div>
  
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="truncate text-[1.0625rem] font-semibold" title={card.name}>
                    {card.name}
                  </h2>
                  <p className="truncate text-[0.875rem] text-ink-3">
                    {card.subcategoryName
                      ? `${card.categoryName} · ${card.subcategoryName}`
                      : card.categoryName}
                  </p>
  
                  <p className="mt-1 text-[0.9375rem]">
                    {card.price ? (
                      <>
                        <span className="font-semibold">{rupees(card.price.rupees)}</span>
                        <span className="text-ink-2"> · {card.price.size}</span>
                        {card.packCount > 1 && (
                          <span className="text-ink-3"> · {card.packCount} sizes</span>
                        )}
                      </>
                    ) : (
                      <span className="text-warning">No price yet</span>
                    )}
                  </p>
  
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("pill", card.onWebsite ? "pill-on" : "pill-off")}>
                      {card.onWebsite ? "On website" : "Hidden"}
                    </span>
                    {!canAdd && !card.available && card.packCount > 0 && (
                      <span className="pill pill-warn">Out of stock</span>
                    )}
                    {(card.runningLow || card.noneLeft) && (
                      <Link
                        href={`/stock?q=${encodeURIComponent(card.name)}`}
                        className={cn("pill hover:underline", card.noneLeft ? "pill-bad" : "pill-warn")}
                      >
                        {card.noneLeft ? "None left — add stock" : "Running low"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <ProductCardActions
                productId={card.id}
                name={card.name}
                available={card.available}
                hasPacks={card.packCount > 0}
                canChangeStock={canAdd}
                canDelete={canDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="More products" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="btn btn-quiet">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-2">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="btn btn-quiet">
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
