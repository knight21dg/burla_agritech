import type { Tone } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * Art-directed placeholder tile, standing in for product photography.
 *
 * ⚠️ PLACEHOLDER (OQ-017). Real photography is the highest visual-quality
 * dependency in this project — see docs/PHOTOGRAPHY-BRIEF.md. These tiles are
 * decorative (alt=""), because the product name always sits adjacent as text.
 * The demo notice discloses that imagery is pending.
 */

const palettes: Record<Tone, { from: string; to: string; ink: string }> = {
  turmeric: { from: "#F5C542", to: "#D98B12", ink: "#7A4A05" },
  mango: { from: "#FBBF5B", to: "#E8862B", ink: "#7C3D08" },
  chilli: { from: "#D9683F", to: "#A63219", ink: "#5E1A0C" },
  leaf: { from: "#7DB479", to: "#3E7A45", ink: "#1E4526" },
  grain: { from: "#DCC79A", to: "#B69A63", ink: "#5C4A24" },
  berry: { from: "#C77489", to: "#8E3B54", ink: "#4B1B29" },
  earth: { from: "#C0A281", to: "#8A6A4A", ink: "#4A3524" },
  cream: { from: "#F0E6D2", to: "#D6C6A6", ink: "#6B5B3C" },
};

export function ProductImage({
  tone = "cream",
  seed = 0,
  className,
  ratio = "square",
}: {
  tone?: Tone;
  /** Varies the motif so a grid does not read as one repeated tile. */
  seed?: number;
  className?: string;
  ratio?: "square" | "portrait" | "wide";
}) {
  const p = palettes[tone];
  const rotate = (seed % 4) * 22 - 33;
  const scale = 1 + ((seed % 3) * 0.14);
  const offsetX = ((seed % 5) - 2) * 6;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-ivory-warm",
        {
          square: "aspect-square",
          portrait: "aspect-4/5",
          wide: "aspect-video",
        }[ratio],
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        focusable="false"
      >
        <defs>
          <linearGradient id={`g${seed}${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
          <radialGradient id={`r${seed}${tone}`} cx="0.32" cy="0.26" r="0.85">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="200" height="200" fill={`url(#g${seed}${tone})`} />
        <rect width="200" height="200" fill={`url(#r${seed}${tone})`} />

        {/* Botanical motif — rotated and scaled per seed so tiles vary */}
        <g
          transform={`translate(${100 + offsetX} 108) rotate(${rotate}) scale(${scale})`}
          opacity="0.17"
          fill={p.ink}
        >
          <path d="M0 46C0 46 -34 40 -42 12C-50 -16 -22 -34 -2 -28C18 -22 6 12 0 46Z" />
          <path
            d="M3 46C3 46 32 38 40 14C48 -10 26 -26 10 -21C-6 -16 0 14 3 46Z"
            opacity="0.75"
          />
        </g>

        {/* Grain texture so the field is not flat */}
        <g opacity="0.1" fill={p.ink}>
          {Array.from({ length: 26 }).map((_, i) => {
            const a = (i * 137.5 + seed * 31) % 360;
            const r = 24 + ((i * 17 + seed * 7) % 66);
            return (
              <circle
                key={i}
                cx={100 + r * Math.cos((a * Math.PI) / 180)}
                cy={100 + r * Math.sin((a * Math.PI) / 180)}
                r={1 + (i % 3) * 0.7}
              />
            );
          })}
        </g>
      </svg>

      {/* Warm inner edge, so tiles sit rather than float */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(31,33,28,0.07)]" />
    </div>
  );
}
