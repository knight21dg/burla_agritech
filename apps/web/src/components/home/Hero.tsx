import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { imagery } from "@/lib/imagery";
import { HeroLeaves } from "./HeroLeaves";

/**
 * Homepage hero, to the client's approved composition: the wordmark, the
 * headline, a line of copy and one action on the left; the products on the
 * right under the "Good Food Better Living" script; leaves drifting through.
 *
 * ## Why it is composed rather than one picture
 *
 * It used to be the supplied image itself — logo, words, products and all —
 * scaled to fit. One picture cannot re-flow: on a wide screen its shape left
 * bands of empty backdrop at the sides, on a tablet everything shrank
 * together, and the words could never stack above the products on a phone.
 * The page now owns the layout and the image carries only the products
 * (`assets/hero/extract_products.py`), so each part answers the screen it is
 * on:
 *
 *   Hero  ├── background   the page's own white
 *         ├── content      live text: logo, headline, copy, action
 *         ├── products     one photograph, never stretched or cropped
 *         └── leaves       independent sprites (HeroLeaves)
 *
 * ## Sizing
 *
 * Full-bleed, and on desktop as tall as the first screen below the header
 * (`100dvh - --site-chrome`, the dynamic unit so a phone's address bar
 * appearing does not jump it), capped so a very tall window does not stretch
 * it. Below `lg` the height follows the content: the parts stack, and the
 * hero ends where it ends rather than leaving a gap.
 *
 * The words keep a readable measure while the composition widens with the
 * screen (`container-hero`): at 2560px the products grow, the paragraph does
 * not.
 */
export function Hero() {
  const products = imagery.heroProducts;

  return (
    <section
      aria-labelledby="hero-title"
      // Full width, and the leaf layer clips here — never at the page.
      className="relative isolate w-full overflow-hidden bg-white"
    >
      <HeroLeaves className="z-0" />

      <div className="container-hero relative z-10">
        <div className="grid items-center gap-8 pb-10 pt-8 sm:pb-12 lg:min-h-[min(calc(100dvh-var(--site-chrome)),48rem)] lg:grid-cols-12 lg:gap-10 lg:py-10">
          {/* The words. `data-hero-content` is what the leaves keep clear of. */}
          <div data-hero-content className="lg:col-span-5">
            <Logo
              variant="full"
              height="clamp(3.5rem,7.5vw,6.5rem)"
              priority
              className="enter block"
            />

            <h1
              id="hero-title"
              className="enter enter-delay-1 mt-7 font-serif text-[clamp(1.75rem,1.1rem+1.9vw,2.85rem)] font-normal leading-[1.16] tracking-[-0.01em] text-forest"
            >
              Pure Goodness from
              <br />
              India&rsquo;s Soil
              <br />
              To Your Table
            </h1>

            <p className="enter enter-delay-2 mt-5 max-w-[34ch] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-ink-2">
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
          </div>

          {/* The products, with the script above them as in the painting.
              In the flow rather than laid over the image: the two then never
              overlap, at any width. */}
          <div className="lg:col-span-7">
            <div
              aria-hidden="true"
              className="enter enter-delay-2 pointer-events-none flex justify-end pr-2 sm:pr-6"
            >
              <div className="rotate-[-9deg]">
                <p className="t-script text-[clamp(1.5rem,1rem+1.7vw,2.9rem)] leading-[0.95] text-forest">
                  Good Food
                  <br />
                  <span className="ml-6">Better Living</span>
                </p>
                <svg viewBox="0 0 200 24" className="ml-8 mt-1 h-auto w-[62%]" fill="none">
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

            {products && (
              <div className="enter-art mt-2 sm:mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- the
                    page's largest paint, served pre-encoded at its own size;
                    an on-the-fly encode is a first-visit delay for no gain */}
                <img
                  src={products.src}
                  alt={products.alt}
                  width={products.width}
                  height={products.height}
                  fetchPriority="high"
                  decoding="async"
                  className="mx-auto h-auto w-full max-w-[min(100%,46rem)] object-contain lg:max-w-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
