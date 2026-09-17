import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sprout, Users } from "lucide-react";
import { FarmLandscape } from "@/components/art/FarmLandscape";
import { Hero } from "@/components/home/Hero";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { listCategories, listFeatured } from "@/server/catalogue";
import { getHomepage } from "@/server/siteContent";
import { linesOf } from "@burla/core/content";
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

export default async function HomePage() {
  const [categories, featured, words] = await Promise.all([
    listCategories(),
    listFeatured(),
    getHomepage(),
  ]);
  const about = imagery.about;

  return (
    <>
      <Hero heading={words.heroHeading} text={words.heroText} />

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
      {/* Built to the client's mockup of 2026-09-17: the photograph on the
          left half, full-bleed, with the script over it; on the right the
          "ABOUT BURLA" line, the heading with its last line in olive, the
          owner's text and "Our Story"; a rule; and the four points, each
          icon in a pale green circle. Faint leaves in the bottom corner. */}
      <section
        aria-labelledby="home-about"
        className="relative isolate overflow-hidden border-y border-line/70 bg-white"
      >
        {/* The faint leaves in the mockup's bottom-right corner — the hero's
            own leaf cut-outs, washed out. Decoration only. */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-12 -z-10 hidden h-56 w-72 opacity-[0.1] 2xl:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative sprite */}
          <img src="/images/home/leaves/leaf-c.webp" alt="" className="absolute bottom-0 right-16 w-48 rotate-[-28deg]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative sprite */}
          <img src="/images/home/leaves/leaf-f.webp" alt="" className="absolute bottom-16 right-0 w-28 rotate-[18deg]" />
        </div>

        {/* Full-bleed as in the mockup, but capped: past 1920px a band that
            keeps widening turns a photograph into a stretched banner. */}
        <div className="mx-auto grid max-w-[1920px] lg:grid-cols-2 xl:grid-cols-[46%_54%]">
          <div className="relative min-h-[18rem] sm:min-h-[24rem] lg:min-h-[clamp(30rem,40vw,42rem)]">
            {about ? (
              <Image
                src={about.src}
                alt={about.alt}
                fill
                sizes="(min-width: 1280px) 46vw, (min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <FarmLandscape className="absolute inset-0 h-full w-full" />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[9%] top-[12%] rotate-[-10deg]"
            >
              <p className="t-script text-[clamp(1.6rem,1.1rem+1.5vw,2.6rem)] leading-[1] text-forest">
                From
                <br />
                <span className="ml-6">Our Farms</span>
                <br />
                <span className="ml-12">To Your Table</span>
              </p>
              <svg viewBox="0 0 200 24" className="ml-[45%] mt-2 h-auto w-[50%]" fill="none">
                <path d="M4 18 C60 8 130 4 196 6" stroke="currentColor" className="text-forest" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="flex items-center px-4 py-12 sm:px-8 md:px-10 lg:py-16 xl:px-12 2xl:px-16">
            <Reveal className="w-full">
              <div className="grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_auto_minmax(0,1fr)] xl:gap-7 2xl:gap-10">
                <div>
                  <p className="font-brand text-[0.875rem] font-bold uppercase tracking-[0.22em] text-green-700 xl:text-[1rem]">
                    About Burla
                  </p>
                  <span aria-hidden="true" className="mt-3 block h-[3px] w-14 rounded-full bg-green-700" />

                  <h2
                    id="home-about"
                    className="mt-7 font-serif text-[clamp(1.9rem,0.6rem+1.55vw,3.1rem)] font-semibold leading-[1.12] tracking-[-0.015em] text-forest"
                  >
                    {/* The owner's own heading; the last line in olive, as in
                        the mockup. */}
                    {linesOf(words.aboutHeading).map((line, index, lines) => (
                      <span
                        key={index}
                        className={index === lines.length - 1 && lines.length > 1 ? "block text-olive" : "block"}
                      >
                        {line}
                      </span>
                    ))}
                  </h2>

                  {/* Written by the owner in the admin (Website → Homepage). The
                      default is deliberately general: the founding story and
                      sourcing detail are theirs to supply, not ours to invent. */}
                  <p className="mt-6 max-w-[46ch] text-[clamp(0.9375rem,0.88rem+0.25vw,1.0625rem)] leading-[1.8] text-ink-2">
                    {words.aboutText}
                  </p>

                  <Link
                    href="/about"
                    className="group mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-forest px-8 text-[0.9375rem] font-semibold text-white shadow-[0_12px_26px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:h-14 sm:px-10 sm:text-[1.0625rem]"
                  >
                    Our Story
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>

                <span aria-hidden="true" className="hidden w-px bg-line xl:block" />

                <ul className="grid content-center gap-7 sm:grid-cols-2 xl:grid-cols-1">
                  {ABOUT_POINTS.map(({ Icon, title, note }) => (
                    <li key={title} className="flex items-center gap-4 xl:gap-5">
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-green-50 xl:size-[4.5rem]">
                        <Icon
                          className="size-6 text-green-700 xl:size-7"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </span>
                      <span>
                        <span className="block text-[1rem] font-semibold text-forest xl:text-[1.125rem]">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-[0.875rem] text-ink-2 xl:text-[0.9375rem]">
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
