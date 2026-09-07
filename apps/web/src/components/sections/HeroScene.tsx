/**
 * Illustrated hero backdrop — a stand-in for the commissioned hero photograph
 * (OQ-017, PHOTOGRAPHY-BRIEF §3.3).
 *
 * A deliberately art-directed graphic is a better placeholder than a stock
 * photograph: it reads as intentional rather than borrowed, and it costs
 * ~4KB inline instead of a 200KB image request.
 */
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBF6EA" />
          <stop offset="42%" stopColor="#F7EAD0" />
          <stop offset="72%" stopColor="#F3DCB0" />
          <stop offset="100%" stopColor="#EBCE97" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.86" r="0.42">
          <stop offset="0%" stopColor="#FFF6DC" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#FBE3AE" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F5D79A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A9B79B" />
          <stop offset="100%" stopColor="#93A588" />
        </linearGradient>
        <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E8C63" />
          <stop offset="100%" stopColor="#54744C" />
        </linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7241" />
          <stop offset="100%" stopColor="#2E5430" />
        </linearGradient>
      </defs>

      <rect width="1440" height="760" fill="url(#sky)" />
      <ellipse cx="720" cy="560" rx="620" ry="300" fill="url(#sun)" />

      {/* Far ridge */}
      <path
        d="M0 505 L120 470 L232 496 L338 452 L452 492 L560 462 L648 498 L760 458 L868 494 L980 462 L1092 500 L1200 466 L1320 498 L1440 470 L1440 760 L0 760 Z"
        fill="url(#hillFar)"
        opacity="0.55"
      />

      {/* Mid ridge */}
      <path
        d="M0 556 L128 528 L256 560 L380 522 L512 566 L640 534 L784 570 L920 532 L1060 566 L1200 528 L1330 562 L1440 534 L1440 760 L0 760 Z"
        fill="url(#hillMid)"
        opacity="0.75"
      />

      {/* Palm silhouettes */}
      <g fill="#3C6038" opacity="0.72">
        {[180, 430, 700, 1010, 1290].map((x, i) => (
          <g key={x} transform={`translate(${x} ${556 + (i % 2) * 10}) scale(${0.9 + (i % 3) * 0.12})`}>
            <rect x="-2.5" y="-52" width="5" height="54" rx="2.5" />
            <path d="M0-52C-16-62-34-60-46-50C-30-56-14-56 0-49Z" />
            <path d="M0-52C16-62 34-60 46-50C30-56 14-56 0-49Z" />
            <path d="M0-53C-10-68-26-76-40-76C-24-72-10-64 0-50Z" />
            <path d="M0-53C10-68 26-76 40-76C24-72 10-64 0-50Z" />
            <path d="M0-54C-4-70 0-82 6-90C2-74 2-64 0-51Z" />
          </g>
        ))}
      </g>

      {/* Cultivated field */}
      <path d="M0 596 L1440 566 L1440 760 L0 760 Z" fill="url(#field)" />

      {/* Furrow rows, converging */}
      <g stroke="#8CB07E" strokeWidth="2" opacity="0.28">
        {Array.from({ length: 22 }).map((_, i) => {
          const t = i / 21;
          const topX = Math.round((200 + t * 1040) * 100) / 100;
          const bottomX = Math.round((-420 + t * 2280) * 100) / 100;
          return <line key={i} x1={topX} y1="600" x2={bottomX} y2="760" />;
        })}
      </g>
      <g stroke="#2A4C2C" strokeWidth="1.5" opacity="0.35">
        {[622, 656, 700, 754].map((y) => (
          <line key={y} x1="0" y1={y} x2="1440" y2={y - 14} />
        ))}
      </g>

      {/* Foliage framing, top corners */}
      <g fill="#2F5A34" opacity="0.9">
        <path d="M0 0 C 70 18 118 62 140 118 C 96 96 40 88 0 96 Z" />
        <path d="M0 60 C 58 78 96 112 116 156 C 72 138 32 134 0 140 Z" opacity="0.8" />
        <path d="M1440 0 C 1364 14 1310 56 1284 112 C 1332 92 1394 84 1440 92 Z" />
        <path d="M1440 56 C 1378 72 1336 106 1314 150 C 1362 132 1404 128 1440 134 Z" opacity="0.8" />
      </g>
    </svg>
  );
}
