import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import heroLanding from "@/assets/hero-landing.png";

/**
 * Homepage hero, built around the client-supplied key visual
 * (`logos/landing page.png`).
 *
 * The supplied artwork has its headline, tagline and call-to-action baked into
 * the pixels. That creates three problems this component works around rather
 * than ignores:
 *
 *  1. Accessibility & SEO — text in an image is invisible to screen readers
 *     and search engines, and cannot be resized or translated (WCAG 1.4.5).
 *     One real, visually-hidden <h1> carries the heading at every breakpoint.
 *     The artwork is decorative (alt=""), and the mobile display type is a
 *     paragraph marked aria-hidden, so the words are announced exactly once.
 *  2. The baked-in "Explore our products" button is not clickable, so real
 *     buttons sit beneath the artwork.
 *  3. At mobile widths the baked-in type renders around 8px and is unreadable.
 *     Below `md` the artwork is therefore cropped to its produce corner and
 *     live text is set over it.
 *
 * When commissioned photography arrives (OQ-017, PHOTOGRAPHY-BRIEF §3.3) this
 * should become a clean photograph with all type in HTML at every breakpoint.
 */
export function Hero() {
  return (
    <section className="relative isolate bg-ivory" aria-labelledby="hero-heading">
      {/* The page's single real heading. Visually hidden at every breakpoint:
          on mobile the styled paragraph below repeats it visually, on desktop
          the artwork carries it in pixels. */}
      <h1 id="hero-heading" className="sr-only">
        Burla Global Agri Products — From Nature to Your Table. Pure products,
        healthy people, a greener tomorrow.
      </h1>

      {/* ------------------------------------------------ Mobile & small tablet */}
      <div className="relative md:hidden">
        <div className="relative h-[30rem] w-full overflow-hidden">
          <Image
            src={heroLanding}
            alt=""
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            // Framed on the produce corner, which crops the baked-in type out
            className="object-cover object-[18%_82%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/80 to-ivory/10"
            aria-hidden="true"
          />
        </div>

        <Container className="relative -mt-56 pb-14">
          <p className="t-label text-green-text">
            Pure products · Healthy people
          </p>
          <p
            className="t-display mt-4 text-green-deep"
            aria-hidden="true"
          >
            From Nature
            <br />
            to Your Table
          </p>
          <p className="t-lead measure-tight mt-5">
            Indian agricultural produce, carefully processed into everyday
            foods.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/shop" size="lg">
              Explore Products
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/about" variant="secondary" size="lg">
              Our Story
            </ButtonLink>
          </div>
        </Container>
      </div>

      {/* ------------------------------------------------------ Tablet & desktop */}
      <div className="hidden md:block">
        <Image
          src={heroLanding}
          alt=""
          priority
          sizes="100vw"
          placeholder="blur"
          className="h-auto w-full"
        />

        {/* Real, clickable actions — the artwork's button is only pixels */}
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-3 pb-14 pt-9 lg:pb-16 lg:pt-11">
            <ButtonLink href="/shop" size="lg">
              Explore Products
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/about" variant="secondary" size="lg">
              Our Story
            </ButtonLink>
          </div>
        </Container>
      </div>
    </section>
  );
}
