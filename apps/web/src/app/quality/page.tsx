import type { Metadata } from "next";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Factory,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { PageHeader, PendingContent } from "@/components/sections/PageHeader";
import { TrustStrip } from "@/components/sections/TrustStrip";

export const metadata: Metadata = {
  title: "Quality Control & Standards",
  description:
    "Every Burla batch moves through the same sequence — sourcing, inspection, processing, quality control, packaging and dispatch.",
  alternates: { canonical: "/quality" },
};

/** The six stages from the client's mockup, in order. */
const stages = [
  { Icon: Boxes, name: "Sourcing", summary: "Where produce comes from and how suppliers are selected." },
  { Icon: Search, name: "Inspection", summary: "What incoming raw material is checked for, and against what." },
  { Icon: Factory, name: "Processing", summary: "Drying, curing, roasting or milling, depending on the range." },
  { Icon: ClipboardCheck, name: "Quality Control", summary: "What is checked, when, and by whom." },
  { Icon: PackageCheck, name: "Packaging", summary: "Pack formats, sealing and batch coding." },
  { Icon: Truck, name: "Dispatch", summary: "Storage conditions and how orders leave the facility." },
];

export default function QualityPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Quality" }]}
        eyebrow="Quality control &amp; standards"
        title="From Source to Shelf, With Care."
        subtitle="One sequence, and nothing skips a step."
        lead="Food is a category where credibility matters more than presentation. This page says exactly how Burla works — and where a stage is not yet confirmed, it says that instead of guessing."
        imageName="Process photograph"
      />

      {/* The six-stage process */}
      <Section tone="white" size="sm">
        <Container>
          <h2 className="t-h2">The sequence</h2>

          <ol className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-6">
            {stages.map(({ Icon, name, summary }, i) => (
              <li key={name} className="relative">
                <div className="flex items-center gap-3 lg:block">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-white text-green-700">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="t-label mt-0 text-ink-3 lg:mt-3">
                    Step {String(i + 1).padStart(2, "0")}
                  </p>
                </div>
                <h3 className="t-h3 mt-2">{name}</h3>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-2">
                  {summary}
                </p>
                <p className="mt-2 text-[0.8125rem] text-ink-3">
                  Detail pending
                </p>

                {/* Connector, desktop only. Decorative. */}
                {i < stages.length - 1 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute -right-3 top-3 hidden size-4 text-line-strong lg:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Certifications */}
      <Section tone="surface" size="sm">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <h2 className="t-h2">Published only with evidence</h2>
              <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                An unverifiable quality claim on a food website is a liability,
                not a marketing asset.
              </p>
            </div>
            <div className="space-y-5 lg:col-span-7">
              <PendingContent question="OQ-019">
                No certification, licence or standard appears anywhere on this
                site without a certificate number and expiry date supplied by
                the business. Neither of the reference sites reviewed for this
                project displays its FSSAI licence — doing so is both a mark of
                seriousness and a legal requirement for a food business
                operating online in India.
              </PendingContent>
              <PendingContent question="OQ-018">
                Hygiene practices, quality checks, traceability and lab testing
                arrangements are described here once confirmed.
              </PendingContent>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="white" size="sm">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-md border border-line bg-white p-6 lg:flex-row lg:items-center lg:p-8">
            <div>
              <h2 className="t-h3">Buying in bulk?</h2>
              <p className="measure mt-2 text-[0.9375rem] text-ink-2">
                Specification sheets and documentation are available to trade
                buyers on request.
              </p>
            </div>
            <ButtonLink href="/wholesale" className="shrink-0">
              Wholesale enquiry
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <TrustStrip />
    </>
  );
}
