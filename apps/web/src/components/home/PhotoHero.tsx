import type { CSSProperties } from "react";
import { preload } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { Photo } from "@/lib/imagery";
import { PhotoLeaves } from "./PhotoLeaves";

/**
 * The hero as the client's supplied image (2026-09-10), shown exactly.
 *
 * The image is the whole composition — logo, headline, copy, products, the
 * "Good Food Better Living" script and the leaves — so on desktop it is
 * displayed as it is, not reconstructed, and nothing is added on top of it
 * that the image does not have.
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
 * The frame keeps the image's 3:2 ratio and is capped at the height of the
 * screen below the header, so the hero never runs off the bottom of the
 * viewport — the client asked for exactly that. When height is the limit the
 * image narrows and centres; its ground is white, so the margins are
 * invisible, and the leaves drift on across them. It is also capped at the
 * file's native width, because upscaling a photograph only softens it.
 *
 * ## Phones
 *
 * At phone width the painted text would be about 8px tall. So below `md` the
 * words are rendered as real text, with an "Explore Our Products" action, and
 * the image is cropped to the products beneath them.
 *
 * The crop is square and anchored right. A 3:2 image in a 4:3 frame loses
 * only a sliver at the sides, which left the painted headline showing under
 * the real one; the painted words end about 455px into the 1536px source,
 * and a square frame covering the full height starts at about 512. There is one image
 * element for both layouts — a hidden `priority` image is still downloaded —
 * whose frame and crop change by breakpoint.
 */
export function PhotoHero({ photo }: { photo: Photo }) {
  const ratio = photo.width / photo.height;

  // Served pre-encoded rather than through next/image: the hero is the
  // page's largest paint, and an on-the-fly encode is both a first-visit
  // delay and — as found in development — a dependency that can stall.
  const sources = photo.sources ?? [{ src: photo.src, width: photo.width }];
  const srcSet = sources.map((s) => `${s.src} ${s.width}w`).join(", ");
  const sizes = `(min-width: 768px) min(${photo.width}px, 100vw), 100vw`;
  // Tell the browser about it in the document head, before it has parsed
  // down to the <img>, so the right size starts downloading immediately.
  preload(photo.src, {
    as: "image",
    imageSrcSet: srcSet,
    imageSizes: sizes,
    fetchPriority: "high",
  });
  const frame = {
    "--hero-w": `min(100%, ${photo.width}px, calc((100svh - var(--site-chrome)) * ${ratio}))`,
    "--hero-ratio": `${photo.width} / ${photo.height}`,
  } as CSSProperties;

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

      {/* The image — one element, framed per breakpoint */}
      <div
        style={frame}
        data-hero-frame
        className="relative mx-auto mt-4 aspect-square w-full overflow-hidden md:mt-0 md:aspect-(--hero-ratio) md:w-(--hero-w) md:overflow-visible"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- served
            pre-encoded (see `photo.sources`), preloaded above */}
        <img
          src={photo.src}
          srcSet={srcSet}
          sizes={sizes}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-right md:object-contain md:object-center"
        />
        <PhotoLeaves className="z-10" />
      </div>
    </section>
  );
}
