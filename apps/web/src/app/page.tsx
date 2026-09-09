import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { categories, featuredProducts, products } from "@/data/catalog";
import { site, whatsappLink } from "@/lib/site";

/**
 * Homepage — coloured sections with product content on white panels inside.
 *
 * This is the Flipkart arrangement the client asked for: the page carries the
 * colour, each product row sits on a white card within it, and every row
 * scrolls horizontally. Listing pages remain plain white throughout — colour
 * belongs to the homepage and the chrome, not behind a product grid.
 *
 * Order is the client's: brand, then products, then categories, then a short
 * company statement. Nobody should scroll past a mission statement to find out
 * what is for sale.
 *
 * Motion is a single short fade-and-rise per block, once, and is removed
 * entirely under `prefers-reduced-motion`.
 *
 * The hero uses a pure-CSS entrance rather than the observer-driven Reveal.
 * Above-the-fold content must never start at opacity 0 behind a JavaScript
 * gate: if the script is slow, blocked or fails, the most important thing on
 * the page would be invisible. Reveal is used only below the fold, where the
 * user has to scroll before it matters.
 */
export default function HomePage() {
  const featured = featuredProducts();
  const newest = products.slice(-8);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="bg-tint-leaf">
        <Container>
          <div className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-14">
            <div className="enter">
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
                  className="bg-white"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </ButtonLink>
              </div>
            </div>

            <div className="enter enter-delay-1">
              {/* Awaiting the commissioned hero photograph — OQ-017 */}
              <div className="overflow-hidden rounded-[10px] border border-line bg-white">
                <ProductImage name="Hero photograph" ratio="landscape" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------- Featured products */}
      <section className="bg-tint-turmeric py-8 md:py-10">
        <Container>
          <Reveal className="panel">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="t-h2">Featured products</h2>
                <p className="mt-1 text-[0.875rem] text-ink-2">
                  A short, chosen list — not a ranking.
                </p>
              </div>
              <Link
                href="/products"
                className="shrink-0 pb-1 text-[0.875rem] font-semibold text-green-700 underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <ProductCarousel products={featured} label="Featured products" />
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Categories */}
      <section className="bg-tint-cream py-8 md:py-10">
        <Container>
          <Reveal className="panel">
            <div className="mb-6">
              <h2 className="t-h2">Explore our products</h2>
              <p className="mt-1 text-[0.875rem] text-ink-2">
                Ten ranges, each built around one way of working with what the
                land gives.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <CategoryCard key={c.slug} category={c} />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------------- New arrivals */}
      <section className="bg-tint-berry py-8 md:py-10">
        <Container>
          <Reveal className="panel">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="t-h2">Recently added</h2>
              <Link
                href="/products"
                className="shrink-0 pb-1 text-[0.875rem] font-semibold text-green-700 underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <ProductCarousel products={newest} label="Recently added products" />
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------------------- About */}
      <section className="bg-tint-grain py-8 md:py-10">
        <Container>
          <Reveal className="panel">
            <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
              <div>
                <h2 className="t-h2">About Burla</h2>
                <div className="measure mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-2">
                  <p>
                    Burla works with produce India has always grown, and with
                    the methods that have always suited it — drying, curing,
                    roasting and milling. What we bring to those methods is
                    consistency: careful grading, controlled processing and
                    honest packing.
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
              <div className="overflow-hidden rounded-md border border-line">
                <ProductImage name="Company photograph" ratio="landscape" />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* -------------------------------------------------------------- Contact */}
      <section className="bg-green-900 py-10 text-white md:py-12">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="t-h2 text-white">Questions? Ask us directly.</h2>
              <p className="measure mt-2 text-[0.9375rem] text-white/80">
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
              <ButtonLink href="/contact" variant="onDark" size="lg">
                Contact us
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
