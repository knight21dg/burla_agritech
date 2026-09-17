import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * `@burla/core` is TypeScript source in the workspace, not a built package:
   * one schema, one environment parser, shared with the admin application.
   */
  transpilePackages: ["@burla/core"],
  // sharp reads uploaded photos for the /media route; never bundled.
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  /**
   * The IA moved from /shop to /products (SITEMAP v1.0). These are permanent
   * so nothing that was linked or indexed under the old paths 404s.
   */
  async redirects() {
    return [
      { source: "/shop", destination: "/products", permanent: true },
      {
        source: "/shop/:category",
        destination: "/products/:category",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
