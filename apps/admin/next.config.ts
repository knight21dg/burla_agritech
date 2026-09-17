import type { NextConfig } from "next";

/**
 * Development only. Hot reloading compiles modules with `eval`, so a policy
 * without this makes `next dev` a blank screen. It is never added to a
 * production build.
 */
const devScriptSrc = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

/**
 * Product and category photos are served by the shop, so the admin must be
 * allowed to show images from the shop's address — and from nowhere else.
 */
const storefrontOrigin = (() => {
  try {
    return process.env.STOREFRONT_URL ? new URL(process.env.STOREFRONT_URL).origin : "";
  } catch {
    return "";
  }
})();

/**
 * The admin application — admin.burla.com.
 *
 * A separate origin from the customer site, which is what makes a customer
 * session incapable of becoming an admin session: cookies are host-scoped, so
 * nothing on burla.com can read or write anything here (SECURITY.md §3.1).
 *
 * Its headers are stricter than the storefront's, because nothing here is
 * public and nothing here should ever be indexed, framed or embedded.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** One schema, one environment parser, shared with the customer site. */
  transpilePackages: ["@burla/core"],
  // sharp decodes uploaded photos on the server; it must not be bundled.
  serverExternalPackages: ["sharp"],

  experimental: {
    // A phone photo is several megabytes. The server shrinks it on arrival;
    // it has to be allowed to arrive first.
    serverActions: { bodySizeLimit: "12mb" },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // The admin must not leak a row id or an order number into a
          // third-party referer log.
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Belt and braces with robots.ts: a crawler that ignores
          // robots.txt still sees this.
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          {
            /**
             * No third-party anything. Every script and style the admin runs
             * is its own. `unsafe-inline` for styles is Next's inlined
             * critical CSS; scripts get no such exemption.
             */
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${devScriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob:${storefrontOrigin ? ` ${storefrontOrigin}` : ""}`,
              "font-src 'self'",
              "connect-src 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "base-uri 'none'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
