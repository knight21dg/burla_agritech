import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";

/** Consistent opening block for the content pages. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lead?: string;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <Section tone="surface" size="sm">
      <Container>
        <Breadcrumbs items={crumbs} />
        <div className="mt-7 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {eyebrow && <p className="t-label mb-4 text-ink-3">{eyebrow}</p>}
            <h1 className="t-h1">{title}</h1>
            {subtitle && (
              <p className="t-h3 mt-3 font-normal text-green-700">{subtitle}</p>
            )}
            {lead && <p className="t-lead measure mt-5">{lead}</p>}
          </div>
          {children && <div className="lg:col-span-5">{children}</div>}
        </div>
      </Container>
    </Section>
  );
}

/**
 * Explicit marker for content the client has not yet supplied.
 *
 * Showing this is deliberate: it is more useful to the client, and more
 * honest to a visitor, than inventing a company history or a process claim.
 */
export function PendingContent({
  children,
  question,
}: {
  children: ReactNode;
  question: string;
}) {
  return (
    <div className="border-l-2 border-line-strong bg-surface/60 px-5 py-4">
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
