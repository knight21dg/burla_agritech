import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Leaf,
  MessageCircle,
  Package,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHead } from "@/components/ui/Section";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCard } from "@/components/product/ProductCard";
import { Hero } from "@/components/sections/Hero";
import { HeroScene } from "@/components/sections/HeroScene";
import { categories, featuredProducts } from "@/data/catalog";
import { whatsappLink } from "@/lib/site";

const pillars = [
  { Icon: Leaf, title: "Natural Ingredients", note: "One ingredient, where it should be one" },
  { Icon: ShieldCheck, title: "Quality Assured", note: "Checked at every stage" },
  { Icon: Sprout, title: "Traditional Goodness", note: "Methods worth keeping" },
  { Icon: Globe, title: "Global Reach", note: "Indian roots, global horizons" },
];

const process = [
  "Sourcing",
  "Inspection",
  "Processing",
  "Quality Control",
  "Packaging",
  "Dispatch",
];

export default function HomePage() {
  const featured = featuredProducts();

  return (
    <>
      <Hero />

      {/* ------------------------------------------------------------- Pillars
          The client's key visual already carries these four pillars as pixels,
          so from `md` up this strip is visually redundant. It stays in the
          accessibility tree (`md:sr-only`) because text baked into an image is
          invisible to screen readers and search engines. Below `md` the hero is
          cropped past them, so it renders normally. */}
      <section className="border-y border-sand bg-paper md:sr-only md:border-0">
        <Container>
          <ul className="grid grid-cols-2 divide-sand md:grid-cols-4 md:divide-x">
            {pillars.map(({ Icon, title, note }) => (
              <li
                key={title}
                className="flex flex-col items-center gap-2.5 px-4 py-8 text-center md:py-10"
              >
                <Icon
                  className="size-6 text-green"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p className="text-[0.9375rem] font-semibold leading-tight text-ink">
                  {title}
                </p>
                <p className="text-[0.8125rem] leading-snug text-ink-faint">
                  {note}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Categories */}
      <Section tone="ivory">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              eyebrow="What we make"
              title="Explore our product categories"
              lead="Ten ranges, each built around a single way of working with what the land gives."
            />
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 pb-1 text-[0.9375rem] font-medium text-green-text underline-offset-4 hover:underline"
            >
              View all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <CategoryCard key={c.slug} category={c} seed={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------------- Story */}
      <Section tone="deep" size="lg">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="aspect-4/5 overflow-hidden bg-green-mid/40">
                  <HeroScene className="h-full w-full opacity-90" />
                </div>
                <p
                  className="t-script absolute -bottom-5 -right-3 max-w-[10rem] text-[1.9rem] leading-[1.05] text-ivory/90 lg:-right-8"
                  aria-hidden="true"
                >
                  People, farmers, a better tomorrow
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SectionHead
                eyebrow="Who we are"
                tone="light"
                title={
                  <>
                    Rooted in agriculture.
                    <br />
                    Committed to a better tomorrow.
                  </>
                }
              />
              <div className="measure mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-ivory/80">
                <p>
                  Burla works with produce that India has always grown, and with
                  the methods that have always suited it — drying, curing,
                  roasting, milling. What changes is the care around them:
                  consistent grading, controlled processing and honest packing.
                </p>
                <p className="text-ivory/60">
                  <em>
                    Our founding story, sourcing relationships and processing
                    detail are pending client confirmation. We do not invent
                    company history.
                  </em>
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/about" variant="onDark">
                  Our Story
                </ButtonLink>
                <ButtonLink
                  href="/quality"
                  variant="secondary"
                  className="border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory/10"
                >
                  Quality &amp; Standards
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ Featured */}
      <Section tone="ivory">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              eyebrow="Selected"
              title="Featured products"
              lead="A short list, chosen rather than ranked."
            />
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 pb-1 text-[0.9375rem] font-medium text-green-text underline-offset-4 hover:underline"
            >
              All products
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} seed={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------- Quality */}
      <Section tone="warm">
        <Container>
          <SectionHead
            eyebrow="Quality control &amp; standards"
            title="From source to shelf, with care."
            lead="Every batch moves through the same sequence, and nothing skips a step."
            align="center"
          />

          <ol className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {process.map((step, i) => (
              <li key={step} className="relative text-center">
                <span
                  className="t-label block text-ink-faint"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 block text-[0.9375rem] font-semibold text-green-deep">
                  {step}
                </span>
                {i < process.length - 1 && (
                  <span
                    className="absolute right-[-0.5rem] top-1.5 hidden text-ink-faint lg:block"
                    aria-hidden="true"
                  >
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </li>
            ))}
          </ol>

          <p className="mx-auto mt-12 max-w-xl text-center text-[0.9375rem] text-ink-muted">
            The specifics of each stage are published only once confirmed by the
            business. No certification appears on this site without documentary
            evidence.
          </p>

          <div className="mt-8 flex justify-center">
            <ButtonLink href="/quality" variant="secondary">
              How we work
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Wholesale */}
      <Section tone="paper">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHead
                eyebrow="Bulk &amp; wholesale"
                title="Supplying retailers, kitchens and exporters."
                lead="Bulk formats, consistent grading and documentation for buyers who need to plan ahead. Tell us what you need and we will come back with specifics."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/wholesale">
                  <Package className="size-4" aria-hidden="true" />
                  Wholesale enquiry
                </ButtonLink>
                <ButtonLink
                  href={whatsappLink(
                    "Hi Burla, I'd like to discuss bulk or wholesale supply.",
                  )}
                  external
                  variant="secondary"
                >
                  Talk to our team
                </ButtonLink>
              </div>
            </div>

            <ul className="grid gap-px overflow-hidden rounded-md bg-sand lg:col-span-5">
              {[
                ["Retailers & distributors", "Case packs and margins"],
                ["Restaurants & food businesses", "Consistent bulk formats"],
                ["Exporters & international buyers", "Documentation on request"],
              ].map(([title, note]) => (
                <li key={title} className="bg-paper px-6 py-5">
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-[0.875rem] text-ink-muted">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Contact */}
      <Section tone="deep" size="md">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="t-h2 text-ivory">Questions? Ask us directly.</h2>
              <p className="measure mt-3 text-[1.0625rem] text-ivory/75">
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
          </div>
        </Container>
      </Section>
    </>
  );
}
