import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, searchProducts } from "@/data/catalog";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search",
  // Search result pages are never indexed (SEO.md §5)
  robots: { index: false, follow: true },
};

async function Results({ q }: { q: string }) {
  const results = q ? searchProducts(q) : [];

  if (!q) {
    return (
      <div>
        <p className="t-lead">Search our full range by product or category.</p>
        <ul className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/products/${c.slug}`}
                className="inline-block rounded-sm border border-line bg-white px-4 py-2 text-[0.875rem] text-ink hover:border-green hover:text-green-700"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="max-w-xl">
        <h2 className="t-h3">No products match &ldquo;{q}&rdquo;</h2>
        <p className="mt-3 text-ink-2">
          We may still be able to help — some ranges are seasonal, and bulk
          formats are not all listed. Ask us directly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink
            href={whatsappLink(`Hi Burla, do you stock ${q}?`)}
            external
            variant="whatsapp"
          >
            Ask on WhatsApp
          </ButtonLink>
          <ButtonLink href="/products" variant="secondary">
            Browse all products
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-[0.9375rem] text-ink-2" aria-live="polite">
        {results.length} {results.length === 1 ? "result" : "results"} for
        &ldquo;{q}&rdquo;
      </p>
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {results.map((p, i) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <Section >
      <Container>
        <h1 className="t-h1">Search</h1>
        <div className="mt-8">
          <Suspense fallback={<p className="text-ink-2">Searching…</p>}>
            <Results q={q.trim()} />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}
