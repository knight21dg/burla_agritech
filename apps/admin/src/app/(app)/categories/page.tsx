import type { Metadata } from "next";
import Link from "next/link";
import { CornerDownRight, Plus } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { listAll } from "@/server/services/taxonomyService";
import { CategoryStatusBadge } from "@/components/categories/CategoryStatusBadge";

export const metadata: Metadata = { title: "Categories" };

/**
 * Ranges and the types inside them.
 *
 * One list, nested, rather than two screens — because they are one table and
 * one idea: a type is a range with a parent. Seeing them apart would invite
 * the question of how they relate, which is exactly the thing not to be
 * confused about.
 */
export default async function CategoriesPage() {
  const actor = await requirePermission("catalogue.read_draft");
  const rows = await listAll();

  const ranges = rows.filter((row) => row.parentId === null);
  const typesOf = (id: string) => rows.filter((row) => row.parentId === id);
  const canEdit = can(actor, "catalogue.write");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg">Categories</h1>
          <p className="mt-0.5 text-[0.8125rem] text-ink-2">
            {ranges.length} ranges, {rows.length - ranges.length} types. The catalogue
            is two levels deep — a type cannot hold a type.
          </p>
        </div>
        {canEdit && (
          <Link href="/categories/new" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" />
            New range
          </Link>
        )}
      </div>

      <div className="panel divide-y divide-line">
        {ranges.map((range) => {
          const types = typesOf(range.id);
          return (
            <div key={range.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <Link
                    href={`/categories/${range.id}`}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {range.name}
                  </Link>
                  <span className="ml-2 font-mono text-[0.6875rem] text-ink-3">
                    /{range.slug}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[0.75rem] text-ink-3">
                  <span className="tabular-nums">
                    {range.productCount}{" "}
                    {range.productCount === 1 ? "product" : "products"}
                  </span>
                  <CategoryStatusBadge status={range.status} />
                </div>
              </div>

              {types.length > 0 && (
                <ul className="ml-1 mt-2 space-y-1">
                  {types.map((type) => (
                    <li
                      key={type.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-l border-line pl-3"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <CornerDownRight
                          className="size-3 shrink-0 text-ink-3"
                          aria-hidden="true"
                        />
                        <Link
                          href={`/categories/${type.id}`}
                          className="text-[0.8125rem] text-ink hover:text-accent"
                        >
                          {type.name}
                        </Link>
                        <span className="font-mono text-[0.6875rem] text-ink-3">
                          /{type.slug}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-[0.75rem] text-ink-3">
                        <span className="tabular-nums">{type.productCount}</span>
                        <CategoryStatusBadge status={type.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <Link
                  href={`/categories/new?parent=${range.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-[0.75rem] text-ink-2 hover:text-accent"
                >
                  <Plus className="size-3" aria-hidden="true" />
                  Add a type to {range.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
