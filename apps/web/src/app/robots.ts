import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Demo build: the whole site is disallowed.
 *
 * A staging or preview site reaching the index is a real and common failure
 * (SEO.md §5). The production rules — which allow the marketing and catalogue
 * routes and disallow /api, /account, /auth, /cart, /checkout, /search and
 * faceted URLs — switch on once the real domain is live.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
