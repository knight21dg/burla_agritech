import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { env } from "@burla/core/env";
import { requirePermission } from "@/server/auth/session";
import { categoryOptions, getProduct } from "@/server/products";
import { isUuid } from "@/lib/ids";
import { ProductEditor } from "@/components/products/ProductEditor";
import { DeleteProduct } from "@/components/products/DeleteProduct";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePermission("catalogue.read_draft");
  const { id } = await params;
  // A broken link is simply "not found" — never a server error.
  if (!isUuid(id)) notFound();

  const [product, categories, query] = await Promise.all([
    getProduct(id),
    categoryOptions(),
    searchParams,
  ]);
  if (!product) notFound();

  const canPublish = can(actor, "catalogue.publish");
  const shopLink = env.STOREFRONT_URL
    ? `${env.STOREFRONT_URL.replace(/\/+$/, "")}/products/p/${product.advanced.webAddress}`
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/products" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Products
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="page-title">{product.name}</h1>
          {product.visible && shopLink && (
            <a
              href={shopLink}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
            >
              See it on the website
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {query.added === "1" && (
        <p role="status" className="rounded-md border border-accent/25 bg-accent-soft px-3 py-2 text-accent-dark">
          Product added. You can keep editing it here.
        </p>
      )}

      <ProductEditor product={product} categories={categories} canPublish={canPublish} />

      {canPublish && <DeleteProduct productId={product.id} name={product.name} />}
    </div>
  );
}
