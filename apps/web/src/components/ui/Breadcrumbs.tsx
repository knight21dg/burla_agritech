import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumbs (FR-012) plus matching BreadcrumbList JSON-LD (SEO.md §4).
 * The structured data mirrors the visible trail exactly.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site.url}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-ink-2">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className="hover:text-green-700 hover:underline underline-offset-4"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className="text-ink">
                    {c.label}
                  </span>
                )}
                {!last && (
                  <ChevronRight
                    className="size-3.5 text-ink-3"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
