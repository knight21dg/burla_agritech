import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Globe,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { categories, featuredProducts, products } from "@/data/catalog";
import { whatsappLink } from "@/lib/site";

/**
 * Homepage, built to the client's mockup.
 *
 * The page is light — near-white throughout, with colour coming from the
 * category tiles, the green actions and (once it arrives) the product
 * photography. The heavy per-section tints of the previous pass are dropped:
 * the mockup is much quieter than that, and the products are meant to supply
 * the colour.
 *
 * Order follows the mockup exactly: hero, categories, featured products,
 * about, then the footer. Products appear immediately after the hero.
 *
 * Motion is one short fade-and-rise per block, and the hero uses a pure-CSS
 * entrance so it never depends on JavaScript to become visible.
 */

const heroPillars = [
  { Icon: Leaf, label: "Pure & Natural" },
  { Icon: ShieldCheck, label: "Quality Assured" },
  { Icon: Globe, label: "Globally Trusted" },
];

const aboutPoints = [
  { Icon: Sparkles, title: "Carefully Sourced", note: "From trusted farmers" },
  { Icon: ShieldCheck, title: "Hygienically Processed", note: "Ensuring purity and safety" },
  { Icon: BadgeCheck, title: "Quality Checked", note: "For your confidence" },
  { Icon: Users, title: "For a Healthier Tomorrow", note: "Good food for brighter lives" },
];

export default function HomePage() {
  const featured = featuredProducts();
  const newest = products.slice(-8);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-white">
        <Container>
          <div className="grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-12 lg:py-14">
            <div className="enter">
              <p className="t-label leading-relaxed text-ink-3">
                Natural products
                <br />
                Healthy people
                <br />A brighter tomorrow
              </p>

              <h1 className="t-display mt-5 text-green-700">
                Pure Goodness from India&rsquo;s Soil
                <span className="block text-ink">To Your Table</span>
              </h1>

              <p className="t-lead measure-tight mt-4">
                Wholesome agricultural products, carefully processed for a
                healthier, happier tomorrow.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/products" size="lg">
                  Explore Our Products
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

              <ul className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                {heroPillars.map(({ Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5">
                    <Icon
                      className="size-5 text-green"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span className="text-[0.875rem] font-medium text-ink">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="enter enter-delay-1 relative">
              {/* Awaiting the commissioned hero photograph — OQ-017 */}
              <div className="overflow-hidden rounded-[10px] border border-line bg-white">
                <ProductImage name="Hero photograph" ratio="landscape" />
              </div>
              <p
                aria-hidden="true"
                className="t-script pointer-events-none absolute -top-2 right-2 hidden text-[1.75rem] text-green-700 lg:block"
              >
                Good Food
                <br />
                Better Living
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Categories */}
      <section className="bg-white py-10 md:py-12">
        <Container>
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="t-h2">Our Product Categories</h2>
              <Link
                href="/products"
                className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-[0.875rem] font-semibold text-green-700 underline-offset-4 hover:underline"
              >
                View All Products
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            {/* One line of ten, as in the mockup. A ten-column grid from lg
                up so they always fit without scrolling; below that the row
                scrolls horizontally rather than wrapping to a ragged second
                line. */}
            <ul className="rail items-stretch gap-3 py-1 lg:grid lg:grid-cols-10 lg:overflow-visible">
              {categories.map((c) => (
                <li
                  key={c.slug}
                  className="rail-item w-[36vw] max-w-[10.5rem] sm:w-[24vw] lg:w-auto lg:max-w-none"
                >
                  <CategoryCard category={c} />
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------- Featured products */}
      <section className="border-t border-line bg-white py-10 md:py-12">
        <Container>
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="t-h2">Featured Products</h2>
              <Link
                href="/products"
                className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-[0.875rem] font-semibold text-green-700 underline-offset-4 hover:underline"
              >
                View All
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ProductCarousel products={featured} label="Featured products" />
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------------- New arrivals */}
      <section className="border-t border-line bg-white py-10 md:py-12">
        <Container>
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="t-h2">Recently Added</h2>
              <Link
                href="/products"
                className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-[0.875rem] font-semibold text-green-700 underline-offset-4 hover:underline"
              >
                View All
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ProductCarousel products={newest} label="Recently added products" />
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------------------- About */}
      <section className="border-t border-line bg-surface py-10 md:py-12">
        <Container>
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
              <div className="relative lg:col-span-5">
                <div className="overflow-hidden rounded-md border border-line bg-white">
                  <ProductImage name="Farm photograph" ratio="landscape" />
                </div>
                <p
                  aria-hidden="true"
                  className="t-script pointer-events-none absolute right-4 top-4 text-[1.6rem] text-green-700"
                >
                  From Our Farms
                  <br />
                  To Your Family
                </p>
              </div>

              <div className="lg:col-span-4">
                <p className="t-label text-ink-3">About Burla</p>
                <h2 className="t-h2 mt-2">
                  Rooted in Values.
                  <br />
                  Growing for Tomorrow.
                </h2>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                  Burla works with produce India has always grown, and with the
                  methods that have always suited it — drying, curing, roasting
                  and milling. What we bring to those methods is consistency:
                  careful grading, controlled processing and honest packing.
                </p>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-3">
                  <em>
                    Our founding story, sourcing relationships and processing
                    detail are pending client confirmation. We do not invent
                    company history.
                  </em>
                </p>
                <div className="mt-6">
                  <ButtonLink href="/about">
                    Our Story
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ButtonLink>
                </div>
              </div>

              <ul className="space-y-5 lg:col-span-3">
                {aboutPoints.map(({ Icon, title, note }) => (
                  <li key={title} className="flex gap-3">
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-green"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-[0.9375rem] font-semibold text-ink">
                        {title}
                      </span>
                      <span className="block text-[0.8125rem] text-ink-2">
                        {note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
