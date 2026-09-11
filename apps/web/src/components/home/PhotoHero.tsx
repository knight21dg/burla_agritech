import type { CSSProperties } from "react";
import { preload } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { Photo } from "@/lib/imagery";
import { cn } from "@/lib/utils";
import { HERO_ACTION, HERO_SCALE, heroPlacement } from "./heroLeaves";
import { PhotoLeaves } from "./PhotoLeaves";

/**
 * The hero as the client's supplied image (2026-09-10), shown exactly.
 *
 * The image is the whole composition — logo, headline, copy, products, the
 * "Good Food Better Living" script and the leaves — so on desktop it is
 * displayed as it is, not reconstructed. The one thing added on top of it is
 * the "Explore Our Products" action, which the image has no painted
 * equivalent of: a live link, set in the clear white under the painted
 * paragraph and scaled with the image, so it stays on that spot at every
 * width.
 *
 * Its floating leaves are the exception, and only in that they move: they
 * were lifted out of the image as sprites (`heroLeaves.ts`), the background
 * behind them filled, and each placed back exactly where it was painted
 * (`PhotoLeaves`). The first frame is the supplied image; then a breeze takes
 * the leaves.
 *
 * The words are painted into the pixels, which search engines and screen
 * readers cannot read, so the same words are in the markup, visually hidden.
 *
 * ## Sizing
 *
 * The supplied image is 3:2; a desktop band under the header is closer to
 * 2.6:1. Letterboxing left white bars down both sides, stretching distorts,
 * and a plain cover-crop cuts the logo or the products. So the page shows a
 * widened canvas (`HERO_CANVAS`): the image with its empty top and bottom
 * margin trimmed and matched backdrop extended at both sides, with
 * `object-fit: cover`. The hero fills the screen edge to edge, fits under the
 * header without scrolling, and the content renders as large as the height
 * allows.
 *
 * ## Phones
 *
 * At phone width the painted text would be about 8px tall. So below `md` the
 * words are rendered as real text, with an "Explore Our Products" action, and
 * the image is cropped to a 1024 x 880 window of the source — the products,
 * not the painted words. There is one image element for both layouts (a
 * hidden high-priority image is still downloaded), whose frame and crop
 * change by breakpoint.
 */
export function PhotoHero({ photo }: { photo: Photo }) {
  // Served pre-encoded rather than through next/image: the hero is the
  // page's largest paint, and an on-the-fly encode is both a first-visit
  // delay and — as found in development — a dependency that can stall.
  const sources = photo.sources ?? [{ src: photo.src, width: photo.width }];
  const srcSet = sources.map((s) => `${s.src} ${s.width}w`).join(", ");
  // The content is about half the canvas width, so the full-size file is
  // what keeps it sharp on desktop; on phones the crop shows a third of the
  // canvas across the screen, so the canvas renders at about 3x the width.
  const sizes = "(min-width: 768px) 3072px, 300vw";
  // In the document head, before the parser reaches the <img>.
  preload(photo.src, {
    as: "image",
    imageSrcSet: srcSet,
    imageSizes: sizes,
    fetchPriority: "high",
  });

  return (
    <section
      aria-labelledby="hero-title"
      // Clips the leaves at the edges of the band, not of the image.
      className="relative overflow-hidden bg-white"
    >
      {/* The painted words, for search engines and screen readers. */}
      <h1 id="hero-title" className="sr-only">
        Burla Global Agri Products — Pure Goodness from India&rsquo;s Soil To
        Your Table
      </h1>
      <p className="sr-only">
        Wholesome agricultural products, carefully processed for a healthier,
        happier tomorrow.
      </p>

      {/* Phones: the painted words, legible. Hidden from assistive technology
          because the heading above already says them. */}
      <div className="container-page pt-8 md:hidden" aria-hidden="true">
        <Logo variant="full" height={78} alt="" />
        <p className="mt-6 font-serif text-[1.85rem] leading-[1.15] tracking-[-0.01em] text-forest">
          Pure Goodness from India&rsquo;s Soil
          <br />
          To Your Table
        </p>
        <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink-2">
          Wholesome agricultural products, carefully processed for a
          healthier, happier tomorrow.
        </p>
      </div>
      <div className="container-page mt-6 md:hidden">
        <Link
          href="/products"
          className="group inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-forest px-7 text-[0.875rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Explore Our Products
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* The image — one element, framed per breakpoint.
          Desktop: the full width of the screen, as tall as the content's own
          ratio allows but never taller than the screen below the header, and
          never taller than the canvas (so it is never upscaled).
          Phones: a 1024 x 880 window of the source — the products.
          A size container, so the leaves can be placed in container units. */}
      <div
        data-hero-frame
        className={cn(
          "relative mt-4 w-full overflow-hidden bg-[#fefefe] [container-type:size]",
          "aspect-[1024/880] [--ox:0.625] [--oy:0.5]",
          "md:mt-0 md:aspect-[1536/880] md:max-h-[min(calc(100svh-var(--site-chrome)),880px)] md:[--ox:0.5]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- served
            pre-encoded (see `photo.sources`), preloaded above */}
        <img
          data-hero-image
          src={photo.src}
          srcSet={srcSet}
          sizes={sizes}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[62.5%_50%] md:object-center"
        />
        <PhotoLeaves className="z-10" />

        {/* Desktop: the action, placed on the painting under the paragraph
            (HERO_ACTION) and sized in canvas px, so it keeps its proportion to
            the painted words. A floor on each size keeps it a usable button
            where the image renders small, just above md. Above the leaves, so
            one drifting past goes behind it. */}
        <Link
          href="/products"
          style={
            {
              "--spx": HERO_SCALE,
              ...heroPlacement(HERO_ACTION.x, HERO_ACTION.y),
              height: `max(2.25rem, calc(${HERO_ACTION.height} * var(--spx)))`,
              paddingInline: `max(1rem, calc(${HERO_ACTION.padX} * var(--spx)))`,
              fontSize: `max(0.75rem, calc(${HERO_ACTION.fontSize} * var(--spx)))`,
            } as CSSProperties
          }
          className="enter enter-delay-3 group absolute z-20 hidden items-center gap-[0.6em] whitespace-nowrap rounded-full bg-forest font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,74,44,0.7)] transition duration-300 hover:bg-green-700 hover:shadow-[0_14px_28px_-12px_rgba(15,74,44,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:inline-flex"
        >
          Explore Our Products
          <ArrowRight
            className="size-[1.15em] transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
