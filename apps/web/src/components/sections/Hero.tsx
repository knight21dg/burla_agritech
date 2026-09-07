import Image from "next/image";
import Link from "next/link";
import heroLanding from "@/assets/hero-landing.png";

/** Intrinsic size of the supplied artwork. */
const ART_W = 1672;
const ART_H = 941;

/**
 * Homepage hero — the client's key visual used as the landing page itself
 * (`logos/landing page.png`).
 *
 * ## Fitting the viewport
 *
 * The artwork is 16:9. At full browser width it is taller than the space left
 * under the header, so it used to run past the fold. The wrapper is therefore
 * sized to the *smaller* of the full width and the width implied by the
 * available height:
 *
 *   width = min(100%, (100svh - chrome) * 1672 / 941)
 *
 * with `aspect-ratio` deriving the height. That keeps the whole artwork on
 * screen without cropping it, and — because the wrapper always matches the
 * artwork's aspect exactly — the image fills the wrapper edge to edge, so the
 * percentage-positioned hotspot below stays aligned.
 *
 * `svh` rather than `vh` so mobile browser chrome does not push it off screen.
 * `--site-chrome` is defined in globals.css and shrinks when the demo notice
 * is dismissed.
 *
 * On wide, short screens this leaves a margin either side. A blurred, scaled
 * copy of the same artwork sits behind it so the edges read as intentional
 * rather than as letterboxing.
 *
 * ## Text baked into the artwork
 *
 * The headline, tagline, call-to-action and trust pillars are all pixels,
 * which needs two things layered on top:
 *
 *  1. A real, visually-hidden <h1>. Without it the page has no heading for
 *     screen readers or search engines. The artwork is decorative (alt="").
 *  2. A transparent link over the painted "Explore our products" button, so
 *     it actually works. Measured from the source by scanning for the solid
 *     pill: x 653-1018, y 512-561 => left 39.06%, top 54.41%, 21.83% x 5.21%,
 *     centre 49.97% / 57.02%. The link is centred on that point so a 44px
 *     minimum tap size grows symmetrically on narrow screens, where the
 *     painted button is only about 11px tall (WCAG 2.5.8).
 *
 * This is a stopgap. Once commissioned photography lands (OQ-017) the hero
 * should become a clean image with the type as real HTML — text inside an
 * image cannot be translated, resized or selected (WCAG 1.4.5).
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ivory">
      <h1 className="sr-only">
        Burla Global Agri Products — From Nature to Your Table. Pure products,
        healthy people, a greener tomorrow.
      </h1>

      {/* Blurred fill, so the margins either side read as intentional */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={heroLanding}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover blur-2xl saturate-125"
        />
        <div className="absolute inset-0 bg-ivory/35" />
      </div>

      <div
        className="relative mx-auto"
        style={{
          width: `min(100%, calc((100svh - var(--site-chrome)) * ${ART_W} / ${ART_H}))`,
          aspectRatio: `${ART_W} / ${ART_H}`,
        }}
      >
        <Image
          src={heroLanding}
          alt=""
          priority
          fetchPriority="high"
          sizes="(min-width: 1536px) 1536px, 100vw"
          placeholder="blur"
          className="h-full w-full select-none object-contain"
        />

        {/* The painted button, made real */}
        <Link
          href="/shop"
          aria-label="Explore our products"
          className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          style={{
            left: "49.97%",
            top: "57.02%",
            width: "21.83%",
            height: "5.21%",
            minHeight: "44px",
            minWidth: "44px",
          }}
        >
          {/* Hover affordance only — the label lives in the artwork */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-paper/0 transition-colors duration-200 group-hover:bg-paper/15"
          />
        </Link>
      </div>
    </section>
  );
}
