import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * Opening block for the company pages, following the client's mockup:
 * breadcrumb, eyebrow, title, a green subtitle line, a short lead, and an
 * image to the right.
 *
 * The image is optional — a page with nothing real to show is better without
 * a placeholder taking a third of the screen.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  lead,
  crumbs,
  imageName,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lead?: string;
  crumbs: Crumb[];
  /** Caption for the pending photograph. Omit to render text only. */
  imageName?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-white">
      <Container>
        <div className="py-8 md:py-10">
          <Breadcrumbs items={crumbs} />

          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className={imageName ? "lg:col-span-7" : "lg:col-span-9"}>
              {eyebrow && <p className="t-label text-ink-3">{eyebrow}</p>}
              <h1 className="t-h1 mt-2">{title}</h1>
              {subtitle && (
                <p className="t-h3 mt-2 font-medium text-green-700">
                  {subtitle}
                </p>
              )}
              {lead && <p className="t-lead measure mt-4">{lead}</p>}
              {children}
            </div>

            {imageName && (
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-md border border-line">
                  <ProductImage name={imageName} ratio="landscape" />
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Explicit marker for content the client has not yet supplied.
 *
 * Showing this is deliberate. It is more useful to the client, and more honest
 * to a visitor, than inventing a company history or a process claim.
 */
export function PendingContent({
  children,
  question,
}: {
  children: ReactNode;
  question: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-5 py-4">
      <p className="t-label text-ink-3">Awaiting client content</p>
      <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
        {children}
      </p>
      <p className="mt-2 text-[0.8125rem] text-ink-3">
        Tracked as <code className="font-semibold">{question}</code> in
        docs/OPEN-QUESTIONS.md
      </p>
    </div>
  );
}
