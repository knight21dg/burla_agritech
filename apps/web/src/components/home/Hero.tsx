import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { imagery } from "@/lib/imagery";
import { linesOf } from "@burla/core/content";
import { site } from "@/lib/site";
import { HeroLeaves } from "./HeroLeaves";

/**
 * Homepage hero, to the client's approved composition, restyled to the mockup
 * of 2026-09-17: a small "Natural • Nutritious • Sustainable" line, the
 * headline (its last line in olive green), a line of copy and one action on
 * the left; the products on the right under the "Good Food Better Living"
 * script; leaves drifting through. No logo here —
 * the header carries it (the client's instruction, same day).
 *
 * The background is plain white: the mockup's cream-to-green and the green
 * circle behind the products were both removed at the client's request.
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
 *         ├── content      live text: eyebrow, headline, copy, action
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
 * screen (`container-page`, fluid past ~1456px): at 2560px the products grow,
 * the paragraph does not.
 */
export function Hero({ heading, text }: { heading: string; text: string }) {
  const products = imagery.heroProducts;

  return (
    <section
      aria-labelledby="hero-title"
      // Full width, and the leaf layer clips here — never at the page.
      className="relative isolate w-full overflow-hidden bg-white"
    >
      <HeroLeaves className="z-0" />

      <div className="container-page relative z-10">
        <div className="grid items-center gap-8 pb-10 pt-8 sm:pb-12 lg:min-h-[min(calc(100dvh-var(--site-chrome)),48rem)] lg:grid-cols-12 lg:gap-10 lg:py-10">
          {/* The words. `data-hero-content` is what the leaves keep clear of. */}
          <div data-hero-content className="lg:col-span-6">
            <p className="enter font-brand text-[clamp(0.75rem,0.66rem+0.4vw,1.125rem)] font-bold uppercase tracking-[0.22em] text-green-700">
              {site.heroEyebrow.join("  •  ")}
            </p>

            <h1
              id="hero-title"
              className="enter enter-delay-1 mt-4 font-serif text-[clamp(2.1rem,1rem+2.7vw,3.9rem)] font-bold leading-[1.08] tracking-[-0.015em] text-forest"
            >
              {/* The owner writes this in the admin; each line they type is a
                  line here, as the design sets it on three. The last line is
                  olive green, as in the mockup. */}
              {linesOf(heading).map((line, index, lines) => (
                <span
                  key={index}
                  className={index === lines.length - 1 && lines.length > 1 ? "block text-olive" : "block"}
                >
                  {line}
                </span>
              ))}
            </h1>

            <p className="enter enter-delay-2 mt-6 max-w-[36ch] text-[clamp(1rem,0.9rem+0.45vw,1.4rem)] leading-snug text-ink-2">
              {text}
            </p>

            <div className="enter enter-delay-3 mt-8">
              <Link
                href="/products"
                className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-forest px-7 text-[0.9375rem] font-semibold text-white sm:h-14 sm:px-9 sm:text-[1.0625rem] shadow-[0_10px_24px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 hover:shadow-[0_14px_28px_-12px_rgba(15,74,44,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
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
          <div className="lg:col-span-6">
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
