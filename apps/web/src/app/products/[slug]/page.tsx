import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import {
  categoryBySlug,
  defaultVariant,
  productBySlug,
  products,
  relatedProducts,
} from "@/data/catalog";
import { site } from "@/lib/site";

type Params = { slug: string };

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
  return {
    title: `${p.name} ${variant.label}`,
    description: p.shortDescriptor,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name} — ${site.shortName}`,
      description: p.shortDescriptor,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const category = categoryBySlug(product.categorySlug);
  const related = relatedProducts(product);

  /**
   * Product JSON-LD without `offers`.
   *
   * An Offer requires a real price, availability and price validity, and this
   * demo catalogue is sample data. Emitting offers here would misrepresent the
   * page to search engines (SEO.md §4). No AggregateRating or Review either —
   * no reviews exist.
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescriptor,
    category: category?.name,
    brand: { "@type": "Brand", name: site.shortName },
    url: `${site.url}/products/${product.slug}`,
  };

  return (
    <>
      <Section tone="ivory" size="sm">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Shop", href: "/shop" },
              ...(category
                ? [{ label: category.name, href: `/shop/${category.slug}` }]
                : []),
              { label: product.name },
            ]}
          />
          <div className="mt-8">
            <ProductDetail product={product} />
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="warm">
          <Container>
            <h2 className="t-h2">More from {category?.name}</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  seed={i + 2}
                  showCategory={false}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
