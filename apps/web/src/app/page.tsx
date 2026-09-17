import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sprout, Users } from "lucide-react";
import { AboutPhoto } from "@/components/home/AboutPhoto";
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
      {/* The farmer photograph and the words, in two halves on a desktop.
          How the photograph is fitted, and why the layout changes where it
          does, is explained on AboutPhoto below. */}
      <section
        aria-labelledby="home-about"
        className="relative isolate overflow-hidden border-y border-line/70 bg-[#fcfbf7]"
      >
        {/* Faint leaves in the bottom-right corner — the hero's own leaf
            cut-outs, washed out. Decoration only, and only where the panel
            is wide enough to keep them clear of the words. */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-12 -z-10 hidden h-56 w-72 opacity-[0.1] min-[1800px]:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative sprite */}
          <img src="/images/home/leaves/leaf-c.webp" alt="" className="absolute bottom-0 right-16 w-48 rotate-[-28deg]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative sprite */}
          <img src="/images/home/leaves/leaf-f.webp" alt="" className="absolute bottom-16 right-0 w-28 rotate-[18deg]" />
        </div>

        <div className="mx-auto grid max-w-[1920px] xl:grid-cols-2">
          <AboutPhoto photo={about} />

          <div className="flex items-center px-5 py-10 sm:px-8 sm:py-12 md:px-12 xl:px-12 xl:py-14 2xl:px-16">
            <Reveal className="w-full">
              <div className="grid gap-9 min-[1800px]:grid-cols-[minmax(0,1.55fr)_auto_minmax(0,1fr)] min-[1800px]:gap-8 2xl:gap-10">
                <div className="max-w-xl">
                  <p className="font-brand text-[0.8125rem] font-bold uppercase tracking-[0.22em] text-green-700 sm:text-[0.875rem]">
                    About Burla
                  </p>
                  <span aria-hidden="true" className="mt-2.5 block h-[3px] w-12 rounded-full bg-green-700" />

                  <h2
                    id="home-about"
                    className="mt-5 font-serif text-[clamp(1.75rem,1rem+1.35vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.015em] text-forest"
                  >
                    {/* The owner's own heading (Website → Homepage in the
                        admin); the last line in olive, as in the mockup. */}
                    {linesOf(words.aboutHeading).map((line, index, lines) => (
                      <span
                        key={index}
                        className={index === lines.length - 1 && lines.length > 1 ? "block text-olive" : "block"}
                      >
                        {line}
                      </span>
                    ))}
                  </h2>

                  {/* Written by the owner in the admin. The default is
                      deliberately general: the founding story and sourcing
                      detail are theirs to supply, not ours to invent. */}
                  <p className="mt-4 max-w-[48ch] text-[0.9375rem] leading-[1.75] text-ink-2 2xl:text-[1rem]">
                    {words.aboutText}
                  </p>

                  <Link
                    href="/about"
                    className="group mt-6 inline-flex h-12 items-center gap-2.5 rounded-full bg-forest px-7 text-[0.9375rem] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(15,74,44,0.6)] transition duration-300 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                  >
                    Our Story
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>

                <span aria-hidden="true" className="hidden w-px bg-line min-[1800px]:block" />

                {/* Below the words in two columns, until the panel is wide
                    enough for its own column beside them. */}
                <ul className="grid content-center gap-x-6 gap-y-5 border-t border-line pt-7 sm:max-[1799px]:grid-cols-2 min-[1800px]:gap-y-6 min-[1800px]:border-t-0 min-[1800px]:pt-0">
                  {ABOUT_POINTS.map(({ Icon, title, note }) => (
                    <li key={title} className="flex items-center gap-3.5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green-50 2xl:size-12">
                        <Icon className="size-5 text-green-700" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[0.9375rem] font-semibold leading-snug text-forest">{title}</span>
                        <span className="block text-[0.8125rem] leading-snug text-ink-3 2xl:text-[0.875rem]">{note}</span>
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
