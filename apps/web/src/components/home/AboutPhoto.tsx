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
 *   desktop      48% of the band, as tall as the words beside it (at least
 *                28rem), with a little of the panel showing around it. The
 *                subjects span 56% of the width (24–80% across), so the
 *                photograph is placed at 54% across — on them, not on its
 *                own centre — which keeps both in at 1152px and wider
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
    // A little of the panel's warm white shows around the photograph, rather
    // than it running into the edges of the band.
    <div className="p-3 sm:p-4 min-[1152px]:p-6">
      <div className="@container relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-green-50 md:aspect-[19/10] min-[1152px]:aspect-auto min-[1152px]:h-full min-[1152px]:min-h-[28rem]">
        {photo ? (
          // Served as it is, at the size it is stored, like the hero's own
          // photograph: no on-the-fly resizing, which in development stalls on
          // this file and leaves the band blank.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[50%_45%] md:object-[50%_55%] min-[1152px]:object-[54%_50%]"
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
    </div>
  );
}
