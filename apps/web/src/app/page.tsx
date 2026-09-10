import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sprout, Users } from "lucide-react";
import { FarmLandscape } from "@/components/art/FarmLandscape";
import { Hero } from "@/components/home/Hero";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { categories, featuredProducts } from "@/data/catalog";
import { imagery } from "@/lib/imagery";

/**
 * Homepage, built to the client's final mockup (2026-09-10).
 *
 * Four bands on white, in the mockup's order: the hero, the ten categories in
 * one row, featured products on a rail, and the "About Burla" band with its
 * full-bleed image. The footer closes it.
 *
 * Every image slot shows an illustration until the commissioned photography
 * arrives, and switches to the photograph when `lib/imagery.ts` is filled in —
 * the layout is already sized for it.
 */

const ABOUT_POINTS = [
  { Icon: Sprout, title: "Carefully Sourced", note: "From trusted farmers" },
  {
    Icon: ShieldCheck,
    title: "Hygienically Processed",
    note: "Ensuring purity and safety",
  },
  { Icon: Gem, title: "Quality Checked", note: "For your confidence" },
  {
    Icon: Users,
    title: "For a Healthier Tomorrow",
    note: "Good food for brighter lives",
  },
];

function SectionHead({
  id,
  title,
  href,
  action,
}: {
  id: string;
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 id={id} className="t-section">
        {title}
      </h2>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1.5 pb-1.5 text-[0.8125rem] font-medium text-green-700 underline-offset-4 hover:underline"
      >
        {action}
        <ArrowRight
          className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const featured = featuredProducts();
  const about = imagery.about;

  return (
    <>
      <Hero />

      {/* ---------------------------------------------------------- Categories */}
      <section aria-labelledby="home-categories" className="bg-white pb-10 pt-6 md:pb-12">
        <Container>
          <Reveal>
            <SectionHead
              id="home-categories"
              title="Our Product Categories"
              href="/products"
              action="View All Products"
            />

            {/* One line of ten, as in the mockup: a ten-column grid from lg
                up, so they always fit; below that the row scrolls rather than
                wrapping to a ragged second line. */}
            <ul className="rail -mx-1 items-stretch gap-3 px-1 py-2 lg:grid lg:grid-cols-10 lg:overflow-visible">
              {categories.map((c) => (
                <li
                  key={c.slug}
                  className="rail-item w-[34vw] max-w-[9.5rem] sm:w-[22vw] lg:w-auto lg:max-w-none"
                >
                  <CategoryCard category={c} />
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------- Featured products */}
      <section aria-labelledby="home-featured" className="bg-white pb-12 pt-4 md:pb-16">
        <Container>
          <Reveal>
            <SectionHead
              id="home-featured"
              title="Featured Products"
              href="/products"
              action="View All"
            />
            <ProductCarousel products={featured} label="Featured products" />
          </Reveal>
        </Container>
      </section>

      {/* --------------------------------------------------------------- About */}
      <section
        aria-labelledby="home-about"
        className="relative overflow-hidden border-y border-line/70 bg-white"
      >
        {/* Full-bleed as in the mockup, but capped: past 1920px a band that
            keeps widening turns a landscape into a stretched banner. */}
        <div className="mx-auto grid max-w-[1920px] lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]">
          {/* Full-bleed to the left edge of the viewport, as in the mockup */}
          <div className="relative min-h-[16rem] lg:min-h-[21rem]">
            {about ? (
              <Image
                src={about.src}
                alt={about.alt}
                fill
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
            ) : (
              <FarmLandscape className="absolute inset-0 h-full w-full" />
            )}
            <p
              aria-hidden="true"
              className="t-script pointer-events-none absolute right-[8%] top-[12%] rotate-[-10deg] text-[clamp(1.6rem,1.2rem+1.2vw,2.3rem)] leading-[1] text-forest"
            >
              From
              <br />
              <span className="ml-5">Our Farms</span>
              <br />
              <span className="ml-10">To Your Family</span>
            </p>
          </div>

          <div className="px-4 py-10 md:px-10 lg:py-12 lg:pl-10 lg:pr-[max(2rem,calc((min(100vw,1920px)-var(--container-page))/2+2rem))]">
            <Reveal>
              <div className="grid gap-8 md:grid-cols-[minmax(0,1.25fr)_auto_minmax(0,1fr)] md:gap-8">
                <div>
                  <p className="font-serif text-[1.0625rem] text-ink">About Burla</p>
                  <span aria-hidden="true" className="mt-2 block h-0.5 w-10 rounded-full bg-green-700" />

                  <h2
                    id="home-about"
                    className="mt-5 font-serif text-[clamp(1.6rem,1.3rem+1vw,2rem)] font-medium leading-[1.18] tracking-[-0.015em] text-forest"
                  >
                    Rooted in Values.
                    <br />
                    Growing for Tomorrow.
                  </h2>

                  {/* Deliberately general. The founding story, sourcing
                      relationships and processing detail are pending client
                      confirmation (CONTENT-INVENTORY) and are not invented. */}
                  <p className="mt-4 max-w-[46ch] text-[0.875rem] leading-[1.75] text-ink-2">
                    Burla Global Agri Products brings the everyday foods of
                    Indian farming — dried, cured, roasted and milled — from
                    the field to your table, with careful grading and honest
                    packing at every step.
                  </p>

                  <Link
                    href="/about"
                    className="group mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 text-[0.8125rem] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                  >
                    Our Story
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>

                <span aria-hidden="true" className="hidden w-px bg-line md:block" />

                <ul className="grid content-center gap-6">
                  {ABOUT_POINTS.map(({ Icon, title, note }) => (
                    <li key={title} className="flex items-start gap-3.5">
                      <Icon
                        className="mt-0.5 size-7 shrink-0 text-green-700"
                        strokeWidth={1.25}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block text-[0.875rem] font-semibold text-green-700">
                          {title}
                        </span>
                        <span className="block text-[0.75rem] text-ink-3">
                          {note}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
