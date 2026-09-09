import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { PageHero, PendingContent } from "@/components/sections/PageHero";
import { site } from "@/lib/site";

/**
 * Policy pages (FR-095).
 *
 * These are legally significant and must reflect actual business practice.
 * We publish the required structure and state plainly what each page must
 * contain; the text itself comes from the client and should be reviewed by
 * their own advisor. A copied policy that does not match practice is worse
 * than none.
 */
const policies = {
  "return-and-refund": {
    title: "Return & Refund Policy",
    lead: "What can be returned, in what condition, within what window, and how a refund is issued.",
    question: "OQ-028",
    must: [
      "Return window, in days from delivery",
      "Condition requirements — unopened, seal intact, original packaging",
      "Which products are non-returnable (food often is, for safety reasons)",
      "Who pays return shipping",
      "Refund method and timeline",
      "How to raise a return, and the grievance officer's details",
    ],
  },
  delivery: {
    title: "Delivery Policy",
    lead: "Where we ship, how long it takes, what it costs and how to track it.",
    question: "OQ-027",
    must: [
      "Courier partners used",
      "Regions and PIN codes served",
      "Dispatch time after an order is placed",
      "Estimated delivery windows by region",
      "Shipping charges, and any free-delivery threshold",
      "Tracking, and what happens to a failed delivery",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lead: "What personal data we collect, why, how long we keep it and what rights you have.",
    question: "OQ-002",
    must: [
      "What data is collected, and the purpose of each",
      "Legal basis and consent, per the DPDP Act 2023",
      "Retention periods",
      "Who data is shared with — payment, shipping, analytics providers",
      "Rights to access, correct and erase, and how to exercise them",
      "Cookies and analytics",
      "Contact for data requests, and the grievance officer",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    lead: "The terms on which this website and its products are offered.",
    question: "OQ-002",
    must: [
      "Legal entity name, registered address and GSTIN",
      "Use of the website",
      "Orders, pricing and MRP inclusive of taxes",
      "Cancellation",
      "Limitation of liability",
      "Governing law and jurisdiction",
    ],
  },
} as const;

type Slug = keyof typeof policies;

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = policies[slug as Slug];
  if (!p) return {};
  return {
    title: p.title,
    description: p.lead,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug as Slug];
  if (!policy) notFound();

  return (
    <>
      <PageHero
        crumbs={[{ label: "Policies" }, { label: policy.title }]}
        eyebrow="Policies"
        title={policy.title}
        lead={policy.lead}
      />

      <Section >
        <Container>
          <div className="max-w-2xl">
            <PendingContent question={policy.question}>
              This policy must state actual business practice, not template
              text. Below is what it needs to cover. Once {site.shortName}{" "}
              supplies the detail we will draft it — and it should be reviewed by
              your own legal advisor before launch.
            </PendingContent>

            <h2 className="t-h3 mt-10">This page must state</h2>
            <ul className="mt-5 space-y-3">
              {policy.must.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-line pb-3 text-[0.9375rem] leading-relaxed text-ink-2"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-[0.875rem] leading-relaxed text-ink-3">
              Requirements reflect our reading of the Consumer Protection
              (E-Commerce) Rules 2020, the Legal Metrology (Packaged Commodities)
              Rules 2011 and the DPDP Act 2023. This is not legal advice — see
              docs/SECURITY.md §8.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
