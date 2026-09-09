import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse every Burla range — dehydrated powders and flakes, dehydrated fruits, pickles, spiced dal powders, sun-dried crisps, dry fruits, millets, herbal tea and coffee, masala powders and combo packs.",
};

export default function ShopPage() {
  return (
    <>
      <Section tone="warm" size="sm">
        <Container>
          <Breadcrumbs items={[{ label: "Shop" }]} />
          <h1 className="t-h1 mt-6">Our full range</h1>
          <p className="t-lead measure mt-4">
            Ten ranges built around a single way of working with what the land
            gives — drying, curing, roasting and milling.
          </p>
        </Container>
      </Section>

      <Section tone="ivory">
        <Container>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <CategoryCard key={c.slug} category={c} seed={i} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="t-h2">Every product</h2>
            <p className="text-[0.875rem] text-ink-muted">
              {products.length} products
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} seed={i} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
