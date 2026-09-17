import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { getCategory } from "@/server/categories";
import { isUuid } from "@/lib/ids";
import { CategoryEditor } from "@/components/categories/CategoryEditor";
import { Subcategories } from "@/components/categories/Subcategories";

export const metadata: Metadata = { title: "Edit Category" };

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalogue.write");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [category, query] = await Promise.all([getCategory(id), searchParams]);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/categories" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Categories
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="page-title">{category.name}</h1>
          <Link href={`/products?category=${category.id}`} className="btn btn-quiet">
            View its {category.productCount} {category.productCount === 1 ? "product" : "products"}
          </Link>
        </div>
      </div>

      {query.added === "1" && (
        <p role="status" className="rounded-md border border-accent/25 bg-accent-soft px-3 py-2 text-accent-dark">
          Category added.
        </p>
      )}

      <CategoryEditor category={category} />
      <Subcategories
        categoryId={category.id}
        categoryName={category.name}
        subcategories={category.subcategories}
      />
    </div>
  );
}
