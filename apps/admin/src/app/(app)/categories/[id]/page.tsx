import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { env } from "@burla/core/env";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { find, listAll } from "@/server/services/taxonomyService";
import { when } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryStatusPanel } from "@/components/categories/CategoryStatusPanel";
import { CategoryStatusBadge } from "@/components/categories/CategoryStatusBadge";

export const metadata: Metadata = { title: "Category" };

/**
 * One range, or one type. The same page, because they are the same row.
 *
 * A range also lists the types inside it, with their product counts: that is
 * the question anyone editing a range actually has — what is in here, and is
 * any of it empty.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("catalogue.read_draft");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const category = await find(id);
  if (!category) notFound();

  const all = await listAll();
  const parent = category.parentId
    ? all.find((row) => row.id === category.parentId)
    : undefined;
  const types = all.filter((row) => row.parentId === category.id);

  const canEdit = can(actor, "catalogue.write");
  const canPublish = can(actor, "catalogue.publish");

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All categories
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-lg">
            {parent && (
              <span className="text-ink-3">
                {parent.name}
                <span aria-hidden="true"> · </span>
              </span>
            )}
            {category.name}
          </h1>
          <p className="text-[0.75rem] text-ink-3">
            {category.productCount} {category.productCount === 1 ? "product" : "products"}{" "}
            · last changed {when(category.updatedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <CategoryForm category={category} canEdit={canEdit} />

          {!category.parentId && (
            <section className="panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[0.9375rem] font-semibold">Types in this range</h2>
                {canEdit && (
                  <Link
                    href={`/categories/new?parent=${category.id}`}
                    className="inline-flex items-center gap-1 text-[0.8125rem] text-accent hover:underline"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add a type
                  </Link>
                )}
              </div>

              {types.length === 0 ? (
                <p className="mt-2 text-[0.8125rem] text-ink-2">
                  None. Products sit directly in this range, which is how most of
                  the catalogue works — only add types where the client&rsquo;s own
                  list divides a range.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line/70">
                  {types.map((type) => (
                    <li
                      key={type.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
                    >
                      <Link
                        href={`/categories/${type.id}`}
                        className="text-[0.875rem] text-ink hover:text-accent"
                      >
                        {type.name}
                      </Link>
                      <span className="flex items-center gap-2 text-[0.75rem] text-ink-3">
                        <span className="tabular-nums">
                          {type.productCount}{" "}
                          {type.productCount === 1 ? "product" : "products"}
                        </span>
                        <CategoryStatusBadge status={type.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <CategoryStatusPanel
          categoryId={category.id}
          slug={category.slug}
          parentSlug={parent?.slug}
          status={category.status}
          productCount={category.productCount}
          isType={Boolean(category.parentId)}
          storefrontUrl={env.STOREFRONT_URL}
          canPublish={canPublish}
          canDelete={canEdit}
        />
      </div>
    </div>
  );
}
