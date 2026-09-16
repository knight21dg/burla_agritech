import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { TypeSiblings } from "@/components/product/TypeChips";
import { productHref, typeChips } from "@/lib/catalog";
import {
  listByCategory,
  listIndexableTypePaths,
  getTypePage,
} from "@/server/catalogue";
import { site } from "@/lib/site";

type Params = { category: string; type: string };

/**
 * Only the type pages worth having: those holding more than one product. A
 * type with one product is linked straight past (PRODUCT-TAXONOMY §1.1), so
 * prerendering it would build a page nothing links to. It still renders on
 * request if someone has the URL.
 */
export async function generateStaticParams() {
  const paths = await listIndexableTypePaths();
  return paths.map((path) => ({
    category: path.categorySlug,
    type: path.typeSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, type } = await params;
  const page = await getTypePage(category, type);
  if (!page) return {};
  const { category: c, type: t } = page;

  // The catalogue's type names carry their own context ("Veg Pickles",
  // "Foxtail / Korralu"), so the category is appended after a separator
  // rather than run on: "Veg Pickles · Pickles", not "Veg Pickles Pickles".
  const title = `${t.name} · ${c.name}`;
  return {
    title,
    description: t.description || `${t.name} from Burla's ${c.name} range.`,
    alternates: { canonical: `/products/${c.slug}/${t.slug}` },
    openGraph: { title: `${title} — ${site.shortName}` },
  };
}

/**
 * Type page — the middle level of Category > Type > Product.
 *
 * Exists for two reasons: it matches how people actually search ("mango
 * pickle", not "pickles"), and it keeps the hierarchy the client asked for
 * visible and navigable. Sibling types sit at the foot so this is never a
 * dead end.
 */
export default async function TypePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, type } = await params;
  const page = await getTypePage(category, type);
  if (!page) notFound();

  const { category: c, type: t, siblings, products: list } = page;
  // The sibling chips carry counts, which need the whole category's products.
  // Cached, so this is the same read the category page already warmed.
  const chips = typeChips(c.slug, siblings, await listByCategory(c.slug));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${t.name} · ${c.name}`,
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
      <Section tone="white" size="compact">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: c.name, href: `/products/${c.slug}` },
              { label: t.name },
            ]}
          />
          <div className="mt-3 max-w-2xl">
            {/* Category as an eyebrow rather than part of the heading.
                Concatenating the two reads well for "Mango Pickles" but badly
                for "Mango Dehydrated Fruits". The title tag still carries the
                combined phrase for search. */}
            <p className="t-label text-ink-3">{c.name}</p>
            <h1 className="t-h1 mt-2">{t.name}</h1>
            {t.description && <p className="t-lead mt-2">{t.description}</p>}
          </div>

          {list.length === 0 ? (
            <p className="mt-6 text-[0.9375rem] text-ink-2">
              Nothing in this type yet.
            </p>
          ) : (
            <div className="product-grid mt-5 md:mt-6">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="mt-9 md:mt-10">
            <TypeSiblings
              categorySlug={c.slug}
              categoryName={c.name}
              chips={chips}
              activeType={t.slug}
            />
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
