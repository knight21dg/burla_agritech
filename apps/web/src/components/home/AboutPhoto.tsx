import Image from "next/image";
import { FarmLandscape } from "@/components/art/FarmLandscape";
import type { Photo } from "@/lib/imagery";

/**
 * The left half of the homepage "About Burla" band: the farmer photograph,
 * with "From Our Farms To Your Table" as live text over its sky.
 *
 * ## Fitting a 3:2 photograph
 *
 * What must never be cut: the farmer's face (around 24–40% across, 12–40%
 * down) and the Burla sack (48–80% across, 47–90% down). Everything else is
 * field and sky that can give way. So the box's shape is chosen per screen,
 * rather than one crop being forced on all of them:
 *
 *   phone        3:2, the photograph's own shape — nothing is cropped
 *   tablet       1.9:1 — the most a stacked band can shorten while keeping
 *                the turban top (12% down) and the sack foot (90%) in view
 *   laptop       stacked the same way below 1152px
 *   desktop      42% of the band, exactly as tall as the words beside it
 *                (at least 30rem). At 1152px that box shows about 58% of the
 *                width and the subjects span 56% (24–80% across), so it is
 *                placed at 54% across — on the subjects, not the photo's
 *                centre — which keeps both in at 1152px and wider
 *
 * Below 1152px a side-by-side column would be tall and narrow and could
 * only show about half the photograph, so the band stacks there instead
 * (see the grid in app/page.tsx).
 *
 * The script sits over the open sky at the top right, which stays in view at
 * every one of those crops. It is positioned in percentages of the box, so
 * it moves with the photograph rather than with the screen, and sized to the
 * box's width (cqw), so in a narrow desktop column it shrinks with the
 * photograph instead of growing with the window into the farmer's turban. On a phone the
 * box is too small for it to clear the farmer's turban, so it is left out
 * there rather than laid across his head.
 */
export function AboutPhoto({ photo }: { photo: Photo | null }) {
  return (
    <div className="@container relative aspect-[3/2] w-full overflow-hidden bg-green-50 md:aspect-[19/10] min-[1152px]:aspect-auto min-[1152px]:h-full min-[1152px]:min-h-[30rem]">
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1920px) 806px, (min-width: 1152px) 42vw, 100vw"
          className="object-cover object-[50%_45%] md:object-[50%_55%] min-[1152px]:object-[54%_50%]"
        />
      ) : (
        <FarmLandscape className="absolute inset-0 h-full w-full" />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-[5%] hidden rotate-[-8deg] [text-shadow:0_1px_12px_rgba(255,255,255,0.75)] md:block"
      >
        <p className="t-script text-[clamp(1rem,4.6cqw,2.1rem)] leading-[1] text-forest">
          From
          <br />
          <span className="ml-[0.9em]">Our Farms</span>
          <br />
          <span className="ml-[1.8em]">To Your Table</span>
        </p>
        <svg viewBox="0 0 200 24" className="ml-[40%] mt-1 h-auto w-[55%]" fill="none">
          <path d="M4 18 C60 8 130 4 196 6" stroke="currentColor" className="text-forest" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
