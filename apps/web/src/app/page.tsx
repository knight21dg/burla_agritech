import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { categories, featuredProducts, products } from "@/data/catalog";
import { site, whatsappLink } from "@/lib/site";

/**
 * Homepage — product-first (REQUIREMENTS FR-020 to FR-029).
 *
 * Order matters here and is the client's, not ours: brand, then products,
 * then categories, then a short company statement. Nobody scrolls past a
 * mission statement to find out what is for sale.
 *
 * The hero is deliberately small — a statement, one photograph and one action.
 * The category bar in the header already sits above it, so a visitor can reach
 * any category before reading a word.
 */
export default function HomePage() {
  const featured = featuredProducts();
  const newest = products.slice(-8);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-white">
        <Container>
          <div className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-14 lg:py-16">
            <div>
              <p className="t-label text-green-700">{site.subTagline}</p>
              <h1 className="t-display mt-3 text-ink">
                Authentic agricultural products, made for everyday living.
              </h1>
              <p className="t-lead measure-tight mt-4">
                Dehydrated powders and flakes, pickles, podis, sun-dried crisps,
                millets and masalas — carefully processed and honestly packed.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/products" size="lg">
                  Explore Products
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink
                  href={whatsappLink(
                    "Hi Burla, I'd like to know more about your products.",
                  )}
                  external
                  variant="secondary"
                  size="lg"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </ButtonLink>
              </div>
            </div>

            {/* Awaiting the commissioned hero photograph — OQ-017 / OQ-051 */}
            <ProductImage
              name="Hero photograph"
              ratio="landscape"
              className="w-full"
            />
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------- Featured products
          Products appear immediately after the hero. This is the client's
          explicit requirement, and it is what the whole page is for. */}
      <Section tone="white" size="md">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="t-h2">Featured products</h2>
              <p className="mt-1 text-[0.9375rem] text-ink-2">
                A short, chosen list — not a ranking.
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 pb-1 text-[0.9375rem] font-medium text-green-700 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          <ProductCarousel products={featured} label="Featured products" />
        </Container>
      </Section>

      {/* ---------------------------------------------------------- Categories */}
      <Section tone="surface" size="md">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="t-h2">Explore our products</h2>
              <p className="mt-1 text-[0.9375rem] text-ink-2">
                Ten ranges, each built around one way of working with what the
                land gives.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------- New arrivals */}
      <Section tone="white" size="md">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="t-h2">Recently added</h2>
            <Link
              href="/products"
              className="shrink-0 pb-1 text-[0.9375rem] font-medium text-green-700 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          <ProductCarousel products={newest} label="Recently added products" />
        </Container>
      </Section>

      {/* --------------------------------------------------------------- About
          Short, and deliberately below the products. */}
      <Section tone="surface" size="md">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <h2 className="t-h2">About Burla</h2>
              <div className="measure mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-2">
                <p>
                  Burla works with produce India has always grown, and with the
                  methods that have always suited it — drying, curing, roasting
                  and milling. What we bring to those methods is consistency:
                  careful grading, controlled processing and honest packing.
                </p>
                <p className="text-ink-3">
                  <em>
                    Our founding story, sourcing relationships and processing
                    detail are pending client confirmation. We do not invent
                    company history.
                  </em>
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/about" variant="secondary">
                  Our story
                </ButtonLink>
                <ButtonLink href="/quality" variant="secondary">
                  Quality &amp; standards
                </ButtonLink>
              </div>
            </div>
            <ProductImage
              name="Company photograph"
              ratio="landscape"
              className="w-full"
            />
          </div>
        </Container>
      </Section>

      {/* -------------------------------------------------------------- Contact */}
      <Section tone="white" size="md">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 border-t border-line pt-10 lg:flex-row lg:items-center">
            <div>
              <h2 className="t-h2">Questions? Ask us directly.</h2>
              <p className="measure mt-2 text-[0.9375rem] text-ink-2">
                Product details, bulk pricing, or where to find us — WhatsApp is
                the quickest way to reach the team.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <ButtonLink
                href={whatsappLink(
                  "Hi Burla, I'd like to know more about your products.",
                )}
                external
                variant="whatsapp"
                size="lg"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Chat on WhatsApp
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Contact us
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
