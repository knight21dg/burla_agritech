import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { CategoryEditor } from "@/components/categories/CategoryEditor";

export const metadata: Metadata = { title: "Add Category" };

export default async function NewCategoryPage() {
  await requirePermission("catalogue.write");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/categories" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Categories
        </Link>
        <h1 className="page-title mt-2">Add Category</h1>
      </div>
      <CategoryEditor />
    </div>
  );
}
