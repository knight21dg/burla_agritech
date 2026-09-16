import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@burla/core/db";
import { productDetails, productImages } from "@burla/core/db/schema";
import { env } from "@burla/core/env";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { findProduct, listTaxonomy } from "@/server/repositories/catalogueRepository";
import { checkPublishable } from "@/lib/product";
import { when } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { ProductForm } from "@/components/products/ProductForm";
import { VariantsEditor } from "@/components/products/VariantsEditor";
import { StatusPanel } from "@/components/products/StatusPanel";

export const metadata: Metadata = { title: "Product" };

/**
 * The product editor.
 *
 * Three forms, not one: the product's own fields, its pack sizes, and its
 * visibility. They are separate because they are separate decisions — a
 * different permission governs publishing, each writes its own audit entry,
 * and a person changing a price should not have to re-save a description to
 * do it.
 *
 * Reading needs `catalogue.read_draft`; the editing controls appear only with
 * `catalogue.write`, and the actions behind them check again regardless.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("catalogue.read_draft");
  const { id } = await params;
  // A malformed id is not found, exactly like one that matches nothing — and
  // it never reaches Postgres, which would reject it as a server error.
  if (!isUuid(id)) notFound();

  const product = await findProduct(id);
  // A bad id is not found, never "forbidden": a 403 would confirm which ids
  // exist (docs/AUTHORIZATION.md §5).
  if (!product) notFound();

  const [taxonomy, details, images] = await Promise.all([
    listTaxonomy(),
    db
      .select({ productId: productDetails.productId })
      .from(productDetails)
      .where(eq(productDetails.productId, id))
      .limit(1),
    db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .limit(1),
  ]);

  const check = checkPublishable({
    name: product.name,
    categoryId: product.categoryId,
    shortDescriptor: product.shortDescriptor,
    description: product.description,
    variants: product.variants.map((v) => ({
      priceMinor: v.priceMinor,
      status: v.status,
    })),
    hasLegalDetails: details.length > 0,
    hasImage: images.length > 0,
  });

  const canEdit = can(actor, "catalogue.write");
  const canPublish = can(actor, "catalogue.publish");
  const category = taxonomy.find((t) => t.id === product.categoryId);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All products
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-lg">{product.name}</h1>
          <p className="text-[0.75rem] text-ink-3">
            {category?.name} · last changed {when(product.updatedAt)}
          </p>
        </div>

        {product.isSample && (
          <p className="mt-2 rounded-sm border border-warning/25 bg-warning-soft px-3 py-2 text-[0.8125rem] text-warning">
            <strong className="font-semibold">Sample data.</strong> This product&rsquo;s
            price and pack sizes were set by us so the shop could be built, not
            supplied by the client. Replacing them here is exactly how that flag
            stops being true.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <ProductForm product={product} taxonomy={taxonomy} canEdit={canEdit} />
        </div>

        <div className="space-y-4">
          <StatusPanel
            productId={product.id}
            productSlug={product.slug}
            status={product.status}
            warnings={check.warnings}
            blockers={check.blockers}
            storefrontUrl={env.STOREFRONT_URL}
            canPublish={canPublish}
          />

          <div className="panel space-y-2 p-4 text-[0.8125rem]">
            <h2 className="text-[0.9375rem] font-semibold">Not editable here</h2>
            <p className="text-ink-2">
              <strong className="font-medium text-ink">Stock</strong> moves through
              the inventory ledger, so every change has a reason attached.
            </p>
            <p className="text-ink-2">
              <strong className="font-medium text-ink">Photographs</strong> and the{" "}
              <strong className="font-medium text-ink">food label details</strong>{" "}
              come in later phases. Until then the site shows the supplied
              photographs and &ldquo;to be confirmed&rdquo; for the legal fields.
            </p>
          </div>
        </div>
      </div>

      {/* Full width, below both columns. Pack sizes are a nine-column table
          and the screen the client will use most — squeezed beside the
          visibility panel, a laptop hid a third of it behind a sideways
          scroll, including stock and status. */}
      <VariantsEditor
        productId={product.id}
        variants={product.variants}
        canEdit={canEdit}
      />
    </div>
  );
}
