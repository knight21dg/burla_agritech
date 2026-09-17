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
 *   tablet       16:9 — a little sky and foreground go, both subjects stay
 *   laptop       stacked, 16:9, capped in height so it never fills the screen
 *   desktop      half the band, as tall as the words beside it; the box is
 *                then nearly square at 1280px, which shows about 63% of the
 *                width — the subjects span 56%, so it is centred on them
 *                (52% across) rather than on the photograph
 *
 * Below 1280px a half-width column would be tall and narrow and could only
 * show about half the photograph, so the band stacks there instead (see the
 * grid in app/page.tsx).
 *
 * The script sits over the open sky at the top right, which stays in view at
 * every one of those crops. It is positioned in percentages of the box, so
 * it moves with the photograph rather than with the screen. On a phone the
 * box is too small for it to clear the farmer's turban, so it is left out
 * there rather than laid across his head.
 */
export function AboutPhoto({ photo }: { photo: Photo | null }) {
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-green-50 md:aspect-[16/9] md:max-h-[34rem] xl:aspect-auto xl:max-h-none xl:min-h-[clamp(36rem,38vw,46rem)]">
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1920px) 960px, (min-width: 1280px) 50vw, 100vw"
          className="object-cover object-[50%_45%] md:object-[50%_55%] xl:object-[52%_50%]"
        />
      ) : (
        <FarmLandscape className="absolute inset-0 h-full w-full" />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[5%] top-[6%] hidden rotate-[-8deg] [text-shadow:0_1px_12px_rgba(255,255,255,0.75)] md:block"
      >
        <p className="t-script text-[clamp(1.2rem,0.8rem+1.6vw,2.1rem)] leading-[1] text-forest">
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
