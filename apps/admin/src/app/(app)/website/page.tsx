import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { env } from "@burla/core/env";
import { requirePermission } from "@/server/auth/session";
import { getHomepage, listHomepageProducts } from "@/server/website";
import { HomepageForm } from "@/components/website/HomepageForm";
import { HomepageProducts } from "@/components/website/HomepageProducts";

export const metadata: Metadata = { title: "Website" };

/**
 * The words on the homepage, and which products it features. Contact and
 * company details live under Settings, next to the rest of the business's
 * information.
 */
export default async function WebsitePage() {
  await requirePermission("content.write");
  const [homepage, products] = await Promise.all([getHomepage(), listHomepageProducts()]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="page-title">Website</h1>
          <p className="mt-0.5 text-ink-2">Change what the homepage says, without touching anything else.</p>
        </div>
        {env.STOREFRONT_URL && (
          <a href={env.STOREFRONT_URL} target="_blank" rel="noreferrer noopener" className="btn btn-quiet">
            Open the website
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Homepage words</h2>
        <div className="mt-4">
          <HomepageForm homepage={homepage} />
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Products on the homepage</h2>
        <p className="hint mt-0.5">Shown under &ldquo;Featured Products&rdquo;.</p>
        <div className="mt-4">
          <HomepageProducts featured={products.featured} available={products.available} />
        </div>
      </section>

      <p className="text-ink-2">
        To change the phone number, email or address shown on the website, go to <strong>Settings</strong>.
      </p>
    </div>
  );
}
