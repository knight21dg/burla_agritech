import type { Tone } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * Art-directed placeholder tile, standing in for product photography.
 *
 * Draws a stand-up pouch silhouette on a tone-matched ground, so a grid of
 * these reads as a set of pack shots rather than as broken images.
 *
 * ⚠️ PLACEHOLDER (OQ-017). Real photography is the highest visual-quality
 * dependency in this project — see docs/PHOTOGRAPHY-BRIEF.md. Tiles are
 * decorative (aria-hidden), because the product name always sits adjacent
 * as real text.
 */

/**
 * Rounds to two decimals.
 *
 * Trigonometric output can differ between the server and the browser at the
 * last floating-point digit, which React reports as a hydration mismatch.
 * Fixing the precision makes both sides produce byte-identical markup.
 */
const round2 = (n: number) => Math.round(n * 100) / 100;

const palettes: Record<Tone, { from: string; to: string; ink: string }> = {
  turmeric: { from: "#F7CE5B", to: "#DA8F14", ink: "#7A4A05" },
  mango: { from: "#FBC46A", to: "#E5872C", ink: "#7C3D08" },
  chilli: { from: "#DE7550", to: "#A8391C", ink: "#5E1A0C" },
  leaf: { from: "#8ABF84", to: "#3F7C47", ink: "#1E4526" },
  grain: { from: "#E2CFA4", to: "#B99D66", ink: "#5C4A24" },
  berry: { from: "#CE7F93", to: "#8E3B54", ink: "#4B1B29" },
  earth: { from: "#C9AB89", to: "#8A6A4A", ink: "#4A3524" },
  cream: { from: "#F3E9D6", to: "#D8C9AA", ink: "#6B5B3C" },
};

export function ProductImage({
  tone = "cream",
  seed = 0,
  className,
  ratio = "square",
}: {
  tone?: Tone;
  /** Varies the composition so a grid does not read as one repeated tile. */
  seed?: number;
  className?: string;
  ratio?: "square" | "portrait" | "wide";
}) {
  const p = palettes[tone];
  const uid = `${tone}-${seed}`;
  const tilt = ((seed % 5) - 2) * 2.2;
  const lift = (seed % 3) * 4;

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
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
          <radialGradient id={`glow-${uid}`} cx="0.34" cy="0.24" r="0.8">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`pouch-${uid}`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="#FFFCF4" stopOpacity="0.96" />
            <stop offset="52%" stopColor="#FBF4E4" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#E9DCC2" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`shadow-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.ink} stopOpacity="0.22" />
            <stop offset="100%" stopColor={p.ink} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ground */}
        <rect width="200" height="200" fill={`url(#bg-${uid})`} />
        <rect width="200" height="200" fill={`url(#glow-${uid})`} />

        {/* Speckle, so the field is not flat */}
        <g opacity="0.13" fill={p.ink}>
          {Array.from({ length: 22 }).map((_, i) => {
            const a = (i * 137.5 + seed * 41) % 360;
            const r = 46 + ((i * 23 + seed * 11) % 52);
            return (
              <circle
                key={i}
                cx={round2(100 + r * Math.cos((a * Math.PI) / 180))}
                cy={round2(100 + r * Math.sin((a * Math.PI) / 180))}
                r={round2(0.9 + (i % 3) * 0.8)}
              />
            );
          })}
        </g>

        {/* Contact shadow */}
        <ellipse
          cx="100"
          cy={170 - lift}
          rx="44"
          ry="7"
          fill={p.ink}
          opacity="0.16"
        />

        {/* Stand-up pouch */}
        <g transform={`translate(0 ${-lift}) rotate(${tilt} 100 108)`}>
          <path
            d="M64 52h72a6 6 0 0 1 6 6v96a10 10 0 0 1-10 10H68a10 10 0 0 1-10-10V58a6 6 0 0 1 6-6Z"
            fill={`url(#pouch-${uid})`}
          />
          {/* Side gusset */}
          <path
            d="M132 52h4a6 6 0 0 1 6 6v96a10 10 0 0 1-10 10h-4Z"
            fill={p.ink}
            opacity="0.07"
          />
          {/* Top seal */}
          <rect
            x="58"
            y="40"
            width="84"
            height="14"
            rx="3"
            fill="#FFFCF4"
            opacity="0.95"
          />
          <g stroke={p.ink} strokeWidth="0.9" opacity="0.16">
            {[62, 68, 74, 80, 86, 92, 98, 104, 110, 116, 122, 128, 134].map(
              (x) => (
                <line key={x} x1={x} y1="42" x2={x} y2="52" />
              ),
            )}
          </g>
          {/* Window band */}
          <rect
            x="70"
            y="94"
            width="60"
            height="46"
            rx="4"
            fill={p.to}
            opacity="0.24"
          />
          <rect
            x="70"
            y="94"
            width="60"
            height="46"
            rx="4"
            fill={`url(#shadow-${uid})`}
          />

          {/* Leaf sprout on the pack */}
          <g transform="translate(100 82)" fill={p.ink} opacity="0.55">
            <g transform="rotate(-8) scale(-0.42 0.42)">
              <path d="M0 0C1 -19 11 -36 32 -45C37 -21 25 -6 0 0Z" />
            </g>
            <g transform="rotate(6) scale(0.32)">
              <path d="M0 0C1 -19 11 -36 32 -45C37 -21 25 -6 0 0Z" />
            </g>
            <rect x="-1.2" y="-1" width="2.4" height="9" rx="1.2" />
          </g>

          {/* Label rules, standing in for typography */}
          <g fill={p.ink} opacity="0.2">
            <rect x="82" y="150" width="36" height="3" rx="1.5" />
            <rect x="90" y="157" width="20" height="2.4" rx="1.2" />
          </g>

          {/* Specular highlight */}
          <path
            d="M66 56c0 40 0 72 0 104"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.35"
          />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(31,33,28,0.07)]" />
    </div>
  );
}
