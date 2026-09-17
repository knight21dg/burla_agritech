import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { listCategories } from "@/server/categories";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Categories" };

/**
 * Categories: one card each, with its photo, how many products it has, its
 * subcategories when it has any, and two buttons — see the products, or edit.
 */
export default async function CategoriesPage() {
  const actor = await requirePermission("catalogue.read_draft");
  const categories = await listCategories();
  const canEdit = can(actor, "catalogue.write");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="mt-0.5 text-ink-2">How products are grouped on the website.</p>
        </div>
        {canEdit && (
          <Link href="/categories/new" className="btn btn-primary">
            <Plus className="size-5" aria-hidden="true" />
            Add Category
          </Link>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id} className="panel flex flex-col p-3">
            <div className="flex gap-3">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
                {category.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- the shop's own photo
                  <img src={category.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="px-2 text-center text-[0.75rem] text-ink-3">No photo</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.0625rem] font-semibold">{category.name}</h2>
                <p className="text-ink-2">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </p>
                <span className={cn("pill mt-1.5", category.visible ? "pill-on" : "pill-off")}>
                  {category.visible ? "On website" : "Hidden"}
                </span>
              </div>
            </div>

            {category.subcategories.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3">
                {category.subcategories.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-2 text-[0.9375rem]">
                    <span className="min-w-0 truncate">
                      {sub.name}
                      {!sub.visible && <span className="text-ink-3"> · hidden</span>}
                    </span>
                    <span className="shrink-0 text-ink-3">
                      {sub.productCount} {sub.productCount === 1 ? "product" : "products"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex flex-wrap justify-end gap-2 pt-3">
              <Link href={`/products?category=${category.id}`} className="btn btn-quiet">
                View products
              </Link>
              {canEdit && (
                <Link href={`/categories/${category.id}`} className="btn btn-quiet" aria-label={`Edit ${category.name}`}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
