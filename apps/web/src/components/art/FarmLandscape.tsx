import { r2, seeded, between } from "./random";

/**
 * The "About Burla" band's image: a crop field at sunrise.
 *
 * The mockup uses a photograph here. This is an illustration standing in for
 * it until the commissioned farm photography arrives (`OQ-017`) — built the
 * way a landscape photograph is read, in planes of decreasing contrast:
 *
 *   sky and sun  →  hazy far hills  →  nearer hills  →  tree line
 *   →  field rows converging on the sun  →  crop leaves in the foreground
 *
 * Atmospheric perspective does the depth: each plane further back is paler,
 * bluer and lower in contrast, and a warm haze around the sun washes over
 * all of them. The rows converge on the sun's position, so the eye is led to
 * the light.
 *
 * `preserveAspectRatio="xMidYMid slice"` lets it fill whatever box the layout
 * gives it, like `object-fit: cover`.
 */

const SUN = { x: 540, y: 262 };

function palm(x: number, base: number, h: number, key: string) {
  const top = base - h;
  const fronds = [-150, -115, -70, -30, 10, 45];
  return (
    <g key={key}>
      <path
        d={`M${x} ${base} Q${r2(x + h * 0.08)} ${r2(base - h * 0.5)} ${r2(x + h * 0.03)} ${r2(top)}`}
        fill="none"
        stroke="#4b6a3e"
        strokeWidth={r2(h * 0.045)}
        strokeLinecap="round"
      />
      {fronds.map((a) => {
        const rad = (a * Math.PI) / 180;
        const len = h * 0.42;
        const ex = x + h * 0.03 + Math.cos(rad) * len;
        const ey = top + Math.sin(rad) * len * 0.55 + len * 0.18;
        return (
          <path
            key={a}
            d={`M${r2(x + h * 0.03)} ${r2(top)} Q${r2((x + ex) / 2)} ${r2(top - len * 0.22)} ${r2(ex)} ${r2(ey)}`}
            fill="none"
            stroke="#557a44"
            strokeWidth={r2(h * 0.05)}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

export function FarmLandscape({ className }: { className?: string }) {
  const rand = seeded(4211);

  // Rows of crop, converging on the sun.
  const rows = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    const bottomX = -420 + t * 1640;
    return `M${SUN.x} ${SUN.y + 36} Q${r2((SUN.x + bottomX) / 2 + (t - 0.5) * 60)} ${r2(SUN.y + 150)} ${r2(bottomX)} 520`;
  });

  // Foreground crop leaves along the bottom edge.
  const foreground = Array.from({ length: 70 }, () => ({
    x: r2(between(rand, -20, 820)),
    y: r2(between(rand, 430, 515)),
    rx: r2(between(rand, 10, 22)),
    ry: r2(between(rand, 3.5, 6.5)),
    rot: r2(between(rand, -70, -10) * (rand() < 0.5 ? 1 : -1)),
    shade: rand(),
  })).sort((a, b) => a.y - b.y);

  // Rounded trees along the horizon, between the palms.
  const trees = Array.from({ length: 16 }, (_, i) => ({
    x: r2(i * 52 + between(rand, -12, 12)),
    r: r2(between(rand, 9, 20)),
  }));

  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustration of crop fields at sunrise — photograph pending"
    >
      <defs>
        <linearGradient id="fl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9e6e2" />
          <stop offset="0.45" stopColor="#f6e6c2" />
          <stop offset="1" stopColor="#fcd99a" />
        </linearGradient>
        <radialGradient id="fl-sun" cx={SUN.x} cy={SUN.y} r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff8e2" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffe9b0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffe2a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fl-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9c86a" />
          <stop offset="0.4" stopColor="#6fa243" />
          <stop offset="1" stopColor="#2f6a2c" />
        </linearGradient>
        <linearGradient id="fl-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3cfc1" />
          <stop offset="1" stopColor="#d9dccb" />
        </linearGradient>
        <linearGradient id="fl-hill-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb592" />
          <stop offset="1" stopColor="#b9c5a0" />
        </linearGradient>
        <clipPath id="fl-field-clip">
          <path d="M0 300 C200 292 520 290 800 296 L800 500 L0 500 Z" />
        </clipPath>
      </defs>

      <rect width="800" height="500" fill="url(#fl-sky)" />
      <circle cx={SUN.x} cy={SUN.y} r="260" fill="url(#fl-sun)" />
      <circle cx={SUN.x} cy={SUN.y} r="26" fill="#fffaf0" />

      {/* Far and near hills — paler and bluer the further they are */}
      <path d="M0 262 C90 214 170 226 250 244 C330 204 420 196 510 236 C600 214 700 204 800 232 L800 320 L0 320 Z" fill="url(#fl-hill-far)" />
      <path d="M0 286 C110 250 200 262 300 276 C390 252 470 258 560 276 C650 256 730 262 800 272 L800 320 L0 320 Z" fill="url(#fl-hill-near)" />

      {/* Tree line on the horizon */}
      <g fill="#6f8f5a" opacity="0.9">
        {trees.map((t, i) => (
          <circle key={i} cx={t.x} cy={r2(300 - t.r * 0.6)} r={t.r} />
        ))}
      </g>
      {palm(96, 304, 110, "p1")}
      {palm(182, 302, 82, "p2")}
      {palm(640, 300, 96, "p3")}
      {palm(728, 304, 124, "p4")}

      {/* The field, with rows leading the eye to the sun */}
      <path d="M0 300 C200 292 520 290 800 296 L800 500 L0 500 Z" fill="url(#fl-field)" />
      <g clipPath="url(#fl-field-clip)" fill="none" stroke="#2e5f27" strokeOpacity="0.28">
        {rows.map((d, i) => (
          <path key={i} d={d} strokeWidth={r2(1 + Math.abs(i - 16.5) * 0.12)} />
        ))}
      </g>

      {/* Foreground leaves, darker and sharper: the nearest plane */}
      {foreground.map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx={l.rx}
          ry={l.ry}
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          fill={l.shade < 0.35 ? "#2c6127" : l.shade < 0.7 ? "#3f7d34" : "#5f9c44"}
        />
      ))}

      {/* Low sun washing over everything */}
      <circle cx={SUN.x} cy={SUN.y} r="340" fill="url(#fl-sun)" opacity="0.35" />
    </svg>
  );
}
