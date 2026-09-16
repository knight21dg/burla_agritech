import type { MetadataRoute } from "next";
import {
  listCategories,
  listIndexableTypePaths,
  listProductSlugs,
} from "@/server/catalogue";
import { site } from "@/lib/site";

/**
 * Generated from live content, never hand-maintained (SEO.md §5).
 *
 * "Live" now means the database: a product published in the admin is in the
 * sitemap the next time it is fetched, without a deployment.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [categories, indexableTypes, productSlugs] = await Promise.all([
    listCategories(),
    listIndexableTypePaths(),
    listProductSlugs(),
  ]);

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/products", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/quality", priority: 0.8 },
    { path: "/locations", priority: 0.6 },
    { path: "/wholesale", priority: 0.8 },
    { path: "/contact", priority: 0.7 },
    { path: "/policies/return-and-refund", priority: 0.3 },
    { path: "/policies/delivery", priority: 0.3 },
    { path: "/policies/privacy", priority: 0.3 },
    { path: "/policies/terms", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${site.url}${r.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
    ...categories.map((c) => ({
      url: `${site.url}/products/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Only types the navigation actually links to. A type holding a single
    // product sends visitors straight to that product, so listing its page
    // here would submit a near-duplicate of the product page. The rule lives
    // in the service, so the sitemap and the navigation cannot disagree.
    ...indexableTypes.map((t) => ({
      url: `${site.url}/products/${t.categorySlug}/${t.typeSlug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...productSlugs.map((slug) => ({
      url: `${site.url}/products/p/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
