import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The real Burla logo (supplied 2026-09-09), replacing the hand-built
 * approximation we were drawing while waiting for it.
 *
 * The supplied files are JPEGs on a white ground with generous surrounding
 * padding, which would otherwise make the mark render small and visually
 * off-centre. The padding was measured from the pixels, so each variant is
 * cropped to its actual artwork rather than eyeballed:
 *
 *   full      content at 11.25% / 15.56%, 78.75% x 60.15%  -> aspect 1.850
 *   wordmark  content at 15.16% / 11.23%, 71.17% x 68.69%  -> aspect 2.442
 *
 * Because the source has a white background rather than transparency, the
 * logo can only sit on a white or near-white surface. That is why the footer
 * is light rather than dark green — see the note in Footer.tsx. A transparent
 * PNG or SVG would let us revisit that.
 *
 * Still outstanding: vector original, transparent version, and a reversed
 * (white) variant — `docs/CLIENT-ASSETS-REQUIRED.md` §1.
 */

const VARIANTS = {
  /** Sprout + BURLA + GLOBAL AGRI PRODUCTS. The primary lockup. */
  full: {
    src: "/brand/logo-full.jpg",
    // Not the file's true 1280x906. next/image builds its srcset from the
    // width prop, so declaring the full size made it fetch a 3840px image for
    // a logo rendered at ~100px. These keep the source aspect ratio while
    // capping the largest candidate at a sane size for a logo.
    intrinsic: { w: 420, h: 297 },
    aspect: 1.85,
    scale: { w: 126.98, h: 166.25, left: -14.29, top: -25.87 },
  },
  /** Sprout + BURLA(tm). Wider, better where vertical space is tight. */
  wordmark: {
    src: "/brand/logo-wordmark.jpg",
    intrinsic: { w: 420, h: 178 },
    aspect: 2.442,
    scale: { w: 140.51, h: 145.58, left: -21.3, top: -16.35 },
  },
} as const;

export function Logo({
  variant = "wordmark",
  height = 36,
  className,
  priority = false,
  alt = "Burla Global Agri Products",
  plate = false,
}: {
  variant?: keyof typeof VARIANTS;
  /** Rendered height in px. Width follows the artwork's aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
  /** Pass "" where an ancestor link already carries the accessible name. */
  alt?: string;
  /**
   * Wraps the mark in a white panel so it can sit on a coloured surface.
   * The supplied artwork is a JPEG on white with no transparency, so it
   * cannot be placed directly on a green bar. A reversed or transparent
   * logo would remove the need for this — `CLIENT-ASSETS-REQUIRED.md` §1.
   */
  plate?: boolean;
}) {
  const v = VARIANTS[variant];

  const mark = (
    <span
      className="relative block overflow-hidden"
      style={{ height, width: Math.round(height * v.aspect) }}
    >
      <Image
        src={v.src}
        alt={alt}
        width={v.intrinsic.w}
        height={v.intrinsic.h}
        priority={priority}
        sizes="(min-width: 768px) 220px, 180px"
        className="absolute max-w-none"
        style={{
          width: `${v.scale.w}%`,
          height: `${v.scale.h}%`,
          left: `${v.scale.left}%`,
          top: `${v.scale.top}%`,
        }}
      />
    </span>
  );

  if (!plate) return <span className={className}>{mark}</span>;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-white px-2.5 py-1.5",
        className,
      )}
    >
      {mark}
    </span>
  );
}
