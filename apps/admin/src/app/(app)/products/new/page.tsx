import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { categoryOptions } from "@/server/products";
import { ProductEditor } from "@/components/products/ProductEditor";

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const actor = await requirePermission("catalogue.write");
  const categories = await categoryOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/products" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Products
        </Link>
        <h1 className="page-title mt-2">Add Product</h1>
      </div>

      <ProductEditor categories={categories} canPublish={can(actor, "catalogue.publish")} />
    </div>
  );
}
