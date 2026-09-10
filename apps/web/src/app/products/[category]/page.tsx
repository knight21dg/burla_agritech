import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { TypeChips } from "@/components/product/TypeChips";
import { ButtonLink } from "@/components/ui/Button";
import {
  categories,
  categoryBySlug,
  productHref,
  productsByCategory,
  typesOf,
} from "@/data/catalog";
import { site } from "@/lib/site";

type Params = { category: string };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) return {};
  // No category description has been supplied yet; describe the page by
  // what it is rather than inventing copy.
  const description =
    c.description.slice(0, 155) || `${c.name} from ${site.name}.`;
  return {
    title: c.name,
    description,
    alternates: { canonical: `/products/${c.slug}` },
    openGraph: { title: `${c.name} — ${site.shortName}`, description },
  };
}

/**
 * Category page — simple by instruction.
 *
 * Header, a short real description, the type layer where one exists, then the
 * products. The sort and availability toolbar from v0.2 is withdrawn: the
 * client asked to avoid complicated filters unless the catalogue actually
 * needs them, and at this size it does not. Type chips do the useful part of
 * that job while also giving each type an indexable URL.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) notFound();

  const list = productsByCategory(c.slug);
  const types = typesOf(c.slug);
  const others = categories.filter((x) => x.slug !== c.slug);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.name,
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site.url}${productHref(p)}`,
      name: p.name,
    })),
  };

  return (
    <>
      <Section tone="white" size="sm">
        <Container>
          <Breadcrumbs
            items={[{ label: "Products", href: "/products" }, { label: c.name }]}
          />
          <div className="mt-6 max-w-2xl">
            <h1 className="t-h1">{c.name}</h1>
            {c.description && <p className="t-lead mt-3">{c.description}</p>}
          </div>

          {types.length > 0 && (
            <div className="mt-8">
              <h2 className="t-label mb-3 text-ink-3">Browse by type</h2>
              <TypeChips categorySlug={c.slug} types={types} />
            </div>
          )}
        </Container>
      </Section>

      <Section tone="white" size="sm">
        <Container>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-8">
            <h2 className="t-h2">
              {types.length > 0 ? `All ${c.name}` : "Products"}
            </h2>
            <p className="text-[0.875rem] text-ink-3">
              {list.length} {list.length === 1 ? "product" : "products"}
            </p>
          </div>

          {list.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="t-h3">Nothing here yet</h3>
              <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-ink-2">
                This range is being added. Ask us what is available now.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <ButtonLink href="/products">All products</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">
                  Contact us
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Every category stays reachable from every category */}
      <Section tone="surface" size="sm">
        <Container>
          <h2 className="t-label text-ink-3">Other ranges</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/products/${o.slug}`}
                  className="inline-block rounded-sm border border-line bg-white px-4 py-2 text-[0.875rem] text-ink transition-colors hover:border-green-700 hover:text-green-700"
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
