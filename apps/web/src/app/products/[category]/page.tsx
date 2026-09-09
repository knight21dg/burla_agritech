import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryToolbar } from "@/components/product/CategoryToolbar";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  categories,
  categoryBySlug,
  defaultVariant,
  productsByCategory,
} from "@/data/catalog";
import { site } from "@/lib/site";

type Params = { category: string };
type Search = { sort?: string; availability?: string };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) return {};

  const sp = await searchParams;
  const filtered = Boolean(sp.sort || sp.availability);

  return {
    title: c.name,
    description: c.description.slice(0, 155),
    alternates: { canonical: `/shop/${c.slug}` },
    // Faceted URLs are excluded from the index (SEO.md §5)
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: `${c.name} — ${site.shortName}`, description: c.description },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) notFound();

  const { sort = "featured", availability = "all" } = await searchParams;

  let list = productsByCategory(c.slug);
  if (availability === "in-stock") {
    list = list.filter(
      (p) => defaultVariant(p).availability !== "out_of_stock",
    );
  }

  list = [...list].sort((a, b) => {
    const pa = defaultVariant(a).priceMinor;
    const pb = defaultVariant(b).priceMinor;
    if (sort === "price-asc") return pa - pb;
    if (sort === "price-desc") return pb - pa;
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  });

  const others = categories.filter((x) => x.slug !== c.slug).slice(0, 5);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.name,
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site.url}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      {/* Category hero */}
      <Section tone="warm" size="sm">
        <Container>
          <Breadcrumbs
            items={[{ label: "Shop", href: "/shop" }, { label: c.name }]}
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7">
              <h1 className="t-h1">{c.name}</h1>
              <p className="t-h3 mt-3 font-normal text-green-mid">
                {c.heroHeadline}
              </p>
              <p className="t-lead measure mt-5">{c.description}</p>
            </div>
            <div className="lg:col-span-5">
              <ProductImage tone={c.tone} seed={c.order} ratio="wide" />
            </div>
          </div>
        </Container>
      </Section>

      {/* Grid */}
      <Section tone="ivory" size="sm">
        <Container>
          <Suspense
            fallback={<div className="h-[3.75rem] border-y border-sand" />}
          >
            <CategoryToolbar resultCount={list.length} />
          </Suspense>

          {list.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="t-h3">No products match these filters</h2>
              <p className="mx-auto mt-3 max-w-md text-ink-muted">
                Try clearing the filters, or browse another range.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <ButtonLink href={`/shop/${c.slug}`} variant="secondary">
                  Clear filters
                </ButtonLink>
                <ButtonLink href="/shop">All categories</ButtonLink>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  seed={i}
                  showCategory={false}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Cross-links keep every category reachable from every category */}
      <Section tone="paper" size="sm">
        <Container>
          <h2 className="t-label text-ink-faint">Other ranges</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/shop/${o.slug}`}
                  className="inline-block rounded-sm border border-sand bg-ivory px-4 py-2 text-[0.875rem] text-ink transition-colors hover:border-green hover:text-green-text"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
