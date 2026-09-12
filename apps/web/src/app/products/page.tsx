import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/data/catalog";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Every Burla range — dehydrated powders and flakes, dehydrated fruits, pickles, dal powders, crisps, dry fruits, millet powders, tea and coffee, masala powders and spices.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <Section tone="white" size="compact">
        <Container>
          <Breadcrumbs items={[{ label: "Products" }]} />
          <div className="mt-3 max-w-2xl">
            <h1 className="t-h1">Our full range</h1>
            <p className="t-lead mt-2">
              Ten ranges, each built around one way of working with what the
              land gives — drying, curing, roasting and milling.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 lg:gap-x-5">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="white" size="compact" className="pt-0">
        <Container>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-8">
            <h2 className="t-h2">Every product</h2>
            <p className="text-[0.875rem] text-ink-3">
              {products.length} products
            </p>
          </div>
          <div className="product-grid mt-5 md:mt-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
