import Image from "next/image";
import Link from "next/link";
import heroLanding from "@/assets/hero-landing.png";

/**
 * Homepage hero — the client's key visual used as the landing page itself
 * (`logos/landing page.png`).
 *
 * The artwork carries its own headline, tagline, call-to-action and trust
 * pillars in the pixels, so it is presented whole and unmodified at every
 * breakpoint. Two things are layered on top of it:
 *
 *  1. A real, visually-hidden <h1>. Text inside an image is invisible to
 *     screen readers and search engines, so without this the page has no
 *     heading at all. The artwork itself is decorative (alt="").
 *  2. A transparent link positioned exactly over the painted
 *     "Explore our products" button, so the button in the image actually
 *     works. Its position is expressed in percentages measured from the
 *     source file, so it stays aligned at every width.
 *
 * Hotspot geometry, measured against the 1672x941 source:
 *   button box  x 653-1018, y 512-561
 *   => left 39.06%  top 54.41%  width 21.83%  height 5.21%
 *   => centre     x 49.97%      y 57.02%
 *
 * The link is centred on that point rather than anchored top-left, so a
 * minimum tap size can grow symmetrically on narrow screens, where the
 * painted button would otherwise be about 11px tall (WCAG 2.5.8).
 *
 * This arrangement is a stopgap. Once commissioned photography lands
 * (OQ-017) the hero should become a clean image with the headline, tagline
 * and button as real HTML — type baked into an image cannot be translated,
 * resized or selected, and is a WCAG 1.4.5 failure.
 */
export function Hero() {
  return (
    <section className="relative isolate bg-ivory">
      <h1 className="sr-only">
        Burla Global Agri Products — From Nature to Your Table. Pure products,
        healthy people, a greener tomorrow.
      </h1>

      <div className="relative w-full">
        <Image
          src={heroLanding}
          alt=""
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder="blur"
          className="h-auto w-full select-none"
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
          {/* Hover affordance only — the label itself lives in the artwork */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-paper/0 transition-colors duration-200 group-hover:bg-paper/15"
          />
        </Link>
      </div>
    </section>
  );
}
