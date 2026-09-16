import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { find } from "@/server/services/taxonomyService";
import { isUuid } from "@/lib/ids";
import { CategoryForm } from "@/components/categories/CategoryForm";

export const metadata: Metadata = { title: "New category" };

/**
 * A new range, or a new type inside one.
 *
 * `?parent=` decides which, and it is read here on the server rather than
 * trusted from the form: where a row sits in the tree is not something a
 * browser gets to assert.
 *
 * Everything is created as a draft. Nothing reaches the public site because
 * somebody filled in a form — that is a separate decision, with a separate
 * permission, on the page that follows.
 */
export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalogue.write");

  const { parent } = await searchParams;
  const parentId = typeof parent === "string" ? parent : undefined;
  if (parentId !== undefined && !isUuid(parentId)) notFound();

  const parentRow = parentId ? await find(parentId) : undefined;
  if (parentId && !parentRow) notFound();
  if (parentRow?.parentId) {
    // A type inside a type: the database would refuse it, and so does this.
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          href={parentRow ? `/categories/${parentRow.id}` : "/categories"}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {parentRow ? parentRow.name : "All categories"}
        </Link>
        <h1 className="mt-2 text-lg">
          {parentRow ? `New type in ${parentRow.name}` : "New range"}
        </h1>
      </div>

      <CategoryForm parentId={parentRow?.id} parentName={parentRow?.name} canEdit />
    </div>
  );
}
