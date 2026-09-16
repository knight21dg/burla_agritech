import type { MetadataRoute } from "next";

/**
 * Nothing on this domain is public, so nothing on it is crawlable. This is
 * not a launch toggle to remember later — there is no state in which the
 * admin should be indexed.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
