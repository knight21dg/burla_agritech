import type { MetadataRoute } from "next";
import {
  categories,
  products,
  productsByType,
  productTypes,
} from "@/data/catalog";
import { site } from "@/lib/site";

/** Generated from live content, never hand-maintained (SEO.md §5). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    // here would submit a near-duplicate of the product page.
    ...productTypes
      .filter((t) => productsByType(t.parentSlug!, t.slug).length > 1)
      .map((t) => ({
        url: `${site.url}/products/${t.parentSlug}/${t.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ...products.map((p) => ({
      url: `${site.url}/products/p/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
