import Link from "next/link";
import { ArrowRight, Globe, Heart, Leaf } from "lucide-react";
import { StillLife } from "@/components/art/StillLife";
import { imagery } from "@/lib/imagery";
import { FallingLeaves } from "./FallingLeaves";
import { PhotoHero } from "./PhotoHero";

/**
 * Homepage hero, built to the client's final mockup (2026-09-10).
 *
 * Left: three lines of tracked capitals, the BURLA wordmark set large in the
 * serif, the tagline, one action, and three brand pillars.
 * Right: the product still life with the "Good Food, Better Living" script.
 * Across all of it: leaves drifting down on a breeze.
 *
 * ## Depth, from back to front
 *
 *   1. Warm light behind the still life
 *   2. Far and mid leaves       (FallingLeaves layer="back")
 *   3. Text and illustration
 *   4. Three near, out-of-focus leaves   (layer="front")
 *
 * So most leaves pass *behind* the headline — which is what makes the scene
 * read as a space rather than a sticker sheet — and the few in front are
 * kept over the illustration, never across the text. Neither layer takes
 * pointer events, so nothing interferes with the button.
 *
 * ## Entrance
 *
 * Pure CSS (`.enter`), staggered by line, so the hero is never waiting on
 * JavaScript to become visible and reduced-motion users get it immediately.
 */

const PILLARS = [
  { Icon: Leaf, label: "Pure & Natural" },
  { Icon: Heart, label: "Quality Assured" },
  { Icon: Globe, label: "Globally Trusted" },
];

export function Hero() {
  const photo = imagery.hero;

  // The client's supplied hero image is a complete composition — words,
  // products and leaves — so when it is present it replaces this layout
  // outright rather than filling the right-hand column.
  if (photo) return <PhotoHero photo={photo} />;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-white"
    >
      {/* 1 — warm light seating the illustration */}
      <div
        aria-hidden="true"
        // Sized and placed against the content column, not the window, so on
        // a very wide screen it stays behind the illustration instead of
        // swelling toward the right edge.
        style={{
          width: "min(62%, 52rem)",
          right: "max(-10%, calc((100% - var(--container-page)) / 2 - 8rem))",
        }}
        className="pointer-events-none absolute top-1/2 -z-10 hidden aspect-square -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#fdf3df_0%,#fef9f0_55%,transparent_100%)] lg:block"
      />

      {/* 2 — leaves behind the content */}
      <FallingLeaves layer="back" className="z-0" />

      <div className="container-page relative z-10">
        <div className="grid items-center gap-8 pb-12 pt-10 lg:grid-cols-12 lg:gap-6 lg:pb-16 lg:pt-12">
          {/* 3 — the words */}
          <div className="lg:col-span-5">
            <p className="t-tracked enter text-ink-2">
              Natural Products
              <br />
              Healthy People
              <br />A Brighter Tomorrow
            </p>

            <h1 id="hero-title" className="mt-5">
              <span className="enter enter-delay-1 block font-serif text-[clamp(4.25rem,2.6rem+6.2vw,7.25rem)] font-bold uppercase leading-[0.86] tracking-[-0.012em] text-forest [font-variation-settings:'opsz'_60]">
                Burla
              </span>
              <span className="enter enter-delay-1 mt-3 block text-[clamp(0.95rem,0.8rem+0.5vw,1.2rem)] font-semibold uppercase leading-none tracking-[0.42em] text-forest">
                Global Agri Products
              </span>
            </h1>

            <p className="enter enter-delay-2 mt-6 font-serif text-[clamp(1.6rem,1.3rem+1.1vw,2.15rem)] font-normal leading-[1.18] tracking-[-0.01em] text-ink">
              Pure Goodness from India&rsquo;s Soil
              <br />
              To Your Table
            </p>

            <p className="enter enter-delay-2 mt-4 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-2">
              Wholesome agricultural products, carefully processed for a
              healthier, happier tomorrow.
            </p>

            <div className="enter enter-delay-3 mt-7">
              <Link
                href="/products"
                className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-forest px-7 text-[0.875rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 hover:shadow-[0_14px_28px_-12px_rgba(15,74,44,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                Explore Our Products
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <ul className="enter enter-delay-4 mt-10 flex items-stretch">
              {PILLARS.map(({ Icon, label }, i) => (
                <li
                  key={label}
                  className={
                    "flex min-w-0 flex-1 flex-col items-center gap-2.5 px-2 text-center sm:flex-none sm:px-6 " +
                    (i > 0 ? "border-l border-line" : "sm:pl-0")
                  }
                >
                  <Icon
                    className="size-7 text-green-700"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <span className="text-[0.75rem] text-ink-2">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 — the picture */}
          <div className="relative lg:col-span-7">
            <div className="enter-art relative">
              <StillLife className="h-auto w-full" />
            </div>

            <div
              aria-hidden="true"
              className="enter enter-delay-3 pointer-events-none absolute -top-3 right-0 hidden rotate-[-9deg] sm:block lg:-top-6 lg:right-2"
            >
              <p className="t-script text-[clamp(2rem,1.4rem+1.6vw,2.9rem)] leading-[0.95] text-forest">
                Good Food
                <br />
                <span className="ml-6">Better Living</span>
              </p>
              <svg
                viewBox="0 0 200 24"
                className="ml-8 mt-1 h-auto w-[62%]"
                fill="none"
              >
                <path
                  d="M4 16 C52 6 120 4 196 10"
                  stroke="currentColor"
                  className="text-forest"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4 — near leaves in front of everything */}
      <FallingLeaves layer="front" className="z-20" />
    </section>
  );
}
