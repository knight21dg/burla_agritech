import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductBuyPanel } from "@/components/product/ProductBuyPanel";
import {
  defaultVariant,
  productBySlug,
  productHref,
  products,
  relatedProducts,
  trailFor,
} from "@/data/catalog";
import { site } from "@/lib/site";

type Params = { slug: string };

/** Legally required for online food sale in India — SECURITY.md §8. */
const INFO_FIELDS = [
  "Ingredients",
  "Allergens",
  "Net quantity",
  "Shelf life",
  "Storage instructions",
  "Country of origin",
  "Manufacturer / packer",
  "FSSAI licence number",
  "Consumer care",
  "Veg / Non-veg",
];

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) return {};
  const variant = defaultVariant(p);
  const { category } = trailFor(p);
  // No descriptor has been supplied yet; describe the page by what it is.
  const description =
    p.shortDescriptor || `${p.name} — ${category?.name ?? "Products"} from ${site.name}.`;
  return {
    title: variant ? `${p.name} ${variant.label}` : p.name,
    description,
    alternates: { canonical: productHref(p) },
    openGraph: {
      title: `${p.name} — ${site.shortName}`,
      description,
    },
  };
}

/**
 * Product page — flat sections rather than the v0.2 tabs.
 *
 * Tabs hid most of the page behind a click, which is worse for search engines
 * (all of it is in the DOM either way, but only the visible panel reads as
 * primary content) and worse for a customer trying to check an ingredient on a
 * phone. The client asked for simple and useful; a single scroll is both.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const { category, type } = trailFor(product);
  const related = relatedProducts(product);

  const crumbs: Crumb[] = [
    { label: "Products", href: "/products" },
    ...(category
      ? [{ label: category.name, href: `/products/${category.slug}` }]
      : []),
    ...(category && type
      ? [
          {
            label: type.name,
            href: `/products/${category.slug}/${type.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ];

  /**
   * Product JSON-LD without `offers`.
   *
   * An Offer needs a real price, availability and price validity, and this
   * catalogue is sample data. Emitting one would misrepresent the page. No
   * AggregateRating or Review either — no reviews exist.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.shortDescriptor ? { description: product.shortDescriptor } : {}),
    category: category?.name,
    brand: { "@type": "Brand", name: site.shortName },
    url: `${site.url}${productHref(product)}`,
  };

  return (
    <>
      <Section tone="white" size="sm">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-8">
            <ProductBuyPanel product={product} />
          </div>
        </Container>
      </Section>

      <Section tone="white" size="sm">
        <Container>
          <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <h2 className="t-h2">About this product</h2>
              {product.description ? (
                <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                  {product.description}
                </p>
              ) : (
                <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-ink-3">
                  Product description to be confirmed.
                </p>
              )}
              {/* TODO surfaced for the client's review: items the catalogue
                  marks for confirmation, or leaves ambiguous as written. */}
              {product.confirmation && (
                <p className="measure mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
                  To confirm: {product.confirmation}
                </p>
              )}

              <h2 className="t-h2 mt-10">Quality</h2>
              <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                Every batch moves through the same sequence — sourcing,
                inspection, processing, quality control, packaging and dispatch.
                The detail of each stage is published once verified.
              </p>
            </div>

            <div className="lg:col-span-5">
              <h2 className="t-h2">Product information</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {INFO_FIELDS.map((f) => (
                  <div
                    key={f}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <dt className="text-[0.9375rem] text-ink">{f}</dt>
                    <dd className="text-right text-[0.875rem] text-ink-3">
                      To be confirmed
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">
                These fields are legally required for online food sale in India.
                The admin blocks publishing a product until every one is
                populated, so no incomplete product page can go live.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="surface" size="sm">
          <Container>
            <h2 className="t-h2">
              More from {type?.name ?? category?.name ?? "this range"}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
