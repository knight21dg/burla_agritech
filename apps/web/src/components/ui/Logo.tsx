import { cn } from "@/lib/utils";

/**
 * Burla wordmark — a faithful reconstruction for the demo build.
 *
 * ⚠️ PLACEHOLDER (OQ-008): this must be replaced with the client's original
 * vector file. The green below is sampled from a raster image and is therefore
 * approximate; the wordmark uses a substitute geometric sans.
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
      className={cn("inline-flex flex-col items-center leading-none", className)}
    >
      <span className="flex items-end gap-[0.12em]">
        <LeafMark
          className="h-[1.15em] w-auto shrink-0 -mb-[0.06em]"
          reversed={reversed}
        />
        <span
          className={cn(
            "font-sans font-extrabold tracking-[-0.015em]",
            reversed ? "text-paper" : "text-green",
          )}
          style={{ fontSize: "1em" }}
        >
          BURLA
        </span>
      </span>
      {showSubline && (
        <span
          className={cn(
            "font-sans font-semibold uppercase",
            reversed ? "text-paper/85" : "text-green",
          )}
          style={{
            fontSize: "0.207em",
            letterSpacing: "0.26em",
            marginTop: "0.13em",
            marginLeft: "0.26em",
          }}
        >
          Global Agri Products
        </span>
      )}
    </span>
  );
}

/** The two-leaf sprout from the supplied logo. */
export function LeafMark({
  className,
  reversed = false,
}: {
  className?: string;
  reversed?: boolean;
}) {
  const fill = reversed ? "#FFFDF8" : "currentColor";
  return (
    <svg
      viewBox="0 0 64 56"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn(reversed ? "text-paper" : "text-green", className)}
      fill="none"
    >
      {/* Left leaf — larger, sweeping left */}
      <path
        d="M31 52C31 52 6.5 50.5 2.5 30.5C-1.5 10.5 14 1 27 4.5C40 8 33.5 27 31 52Z"
        fill={fill}
      />
      <path
        d="M27.5 47C22 34 14.5 21.5 6 14"
        stroke={reversed ? "#14472B" : "#FAF6EC"}
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Right leaf — smaller, sweeping right */}
      <path
        d="M33.5 52C33.5 52 51 49 59.5 34.5C68 20 55 11 45 13.5C35 16 33 33 33.5 52Z"
        fill={fill}
      />
      <path
        d="M36 48C40.5 38 47 28.5 55 22"
        stroke={reversed ? "#14472B" : "#FAF6EC"}
        strokeWidth="2.3"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Stems */}
      <path
        d="M30.4 56C30.4 47 30.2 42 30.6 37M34.2 56C34.2 48 34.6 43 35 39"
        stroke={fill}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
