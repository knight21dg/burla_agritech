import { cn } from "@/lib/utils";

/**
 * Burla lockup — a faithful reconstruction for the demo build.
 *
 * Matches the supplied logo's stacked arrangement: the two-leaf sprout sits
 * above the wordmark, with "GLOBAL AGRI PRODUCTS" letterspaced beneath.
 *
 * ⚠️ PLACEHOLDER (OQ-008): replace with the client's original vector file.
 * The green is sampled from a raster image and the wordmark uses a substitute
 * geometric sans, so neither is exact.
 *
 * Sized in `em` throughout — set the size with a font-size on the parent.
 */
export function Logo({
  className,
  variant = "default",
  showSubline = true,
}: {
  className?: string;
  variant?: "default" | "reversed";
  showSubline?: boolean;
}) {
  const reversed = variant === "reversed";

  return (
    <span
      className={cn(
        "inline-flex flex-col items-center leading-none",
        reversed ? "text-white" : "text-green",
        className,
      )}
    >
      <LeafMark
        className="h-[0.82em] w-auto -mb-[0.02em]"
        reversed={reversed}
      />
      <span
        className="font-sans font-extrabold tracking-[-0.012em]"
        style={{ fontSize: "1em" }}
      >
        BURLA
      </span>
      {showSubline && (
        <span
          className={cn(
            "font-sans font-semibold uppercase",
            reversed ? "text-white/85" : "text-green",
          )}
          style={{
            fontSize: "max(0.205em, 10px)",
            letterSpacing: "0.3em",
            marginTop: "0.42em",
            marginLeft: "0.3em",
          }}
        >
          Global Agri Products
        </span>
      )}
    </span>
  );
}

/** The two-leaf sprout. One leaf path, placed twice with transforms. */
export function LeafMark({
  className,
  reversed = false,
}: {
  className?: string;
  reversed?: boolean;
}) {
  const fill = "currentColor";
  const cut = reversed ? "#14472B" : "#FAF6EC";

  // Leaf with its base at the origin and its tip up and to the right.
  const leaf = "M0 0C1 -19 11 -36 32 -45C37 -21 25 -6 0 0Z";
  const vein = "M2 -3C8 -17 16 -29 28 -38";

  return (
    <svg
      viewBox="0 0 96 62"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn(reversed ? "text-white" : "text-green", className)}
      fill="none"
    >
      <g transform="translate(46 55)">
        {/* Left leaf — larger, mirrored so the tip sweeps up and to the left */}
        <g transform="rotate(-7) scale(-1.02 1.02)">
          <path d={leaf} fill={fill} />
          <path
            d={vein}
            stroke={cut}
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.92"
          />
        </g>

        {/* Right leaf — smaller */}
        <g transform="rotate(5) scale(0.76)">
          <path d={leaf} fill={fill} />
          <path
            d={vein}
            stroke={cut}
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.92"
          />
        </g>

        {/* Stems */}
        <path
          d="M-1.5 6C-1.5 0 -1.5 -3 -2.5 -7"
          stroke={fill}
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <path
          d="M2 6C2 1 2.5 -2 3.5 -6"
          stroke={fill}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
