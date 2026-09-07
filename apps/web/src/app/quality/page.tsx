import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHead } from "@/components/ui/Section";
import { PageHero, PendingContent } from "@/components/sections/PageHero";

export const metadata: Metadata = {
  title: "Quality Control & Standards",
  description:
    "Every Burla batch moves through the same sequence — sourcing, inspection, processing, quality control, packaging and dispatch.",
  alternates: { canonical: "/quality" },
};

const stages = [
  {
    name: "Sourcing",
    summary: "Where produce comes from and how suppliers are selected.",
  },
  {
    name: "Inspection",
    summary: "What incoming raw material is checked for, and against what.",
  },
  {
    name: "Processing",
    summary: "Drying, curing, roasting or milling, depending on the range.",
  },
  {
    name: "Quality Control",
    summary: "What is checked, when, and by whom.",
  },
  {
    name: "Packaging",
    summary: "Pack formats, sealing and batch coding.",
  },
  {
    name: "Dispatch",
    summary: "Storage conditions and how orders leave the facility.",
  },
];

export default function QualityPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Quality" }]}
        eyebrow="Quality control &amp; standards"
        title="From source to shelf, with care."
        lead="Food is a category where credibility matters more than presentation. This page exists to say exactly how Burla works — and, where a stage has not yet been confirmed, to say that instead of guessing."
      />

      <Section tone="ivory">
        <Container>
          <SectionHead
            eyebrow="The sequence"
            title="Six stages, and nothing skips one"
          />

          <ol className="mt-12 grid gap-px overflow-hidden border border-sand bg-sand md:grid-cols-2 lg:grid-cols-3">
            {stages.map((s, i) => (
              <li key={s.name} className="bg-paper p-7">
                <span className="t-label block text-ink-faint" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3 mt-3">{s.name}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {s.summary}
                </p>
                <p className="mt-4 text-[0.8125rem] text-ink-faint">
                  Detail pending confirmation
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="warm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead
                eyebrow="Certifications"
                title="Published only with evidence"
              />
            </div>
            <div className="lg:col-span-7">
              <PendingContent question="OQ-019">
                No certification, licence or standard will appear anywhere on
                this site without a certificate number and expiry date supplied
                by the business. Neither of the reference sites reviewed for this
                project displays its FSSAI licence — doing so is a genuine mark
                of seriousness, and it is a legal requirement for a food business
                operating online in India.
              </PendingContent>

              <PendingContent question="OQ-018" >
                Hygiene practices, quality checks, traceability and lab testing
                arrangements are described here once confirmed. An unverifiable
                quality claim on a food website is a liability, not a marketing
                asset.
              </PendingContent>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <SectionHead
              tone="light"
              title="Buying in bulk?"
              lead="Specification sheets and documentation are available to trade buyers on request."
            />
            <div className="flex shrink-0 gap-3">
              <ButtonLink href="/wholesale" variant="onDark">
                Wholesale enquiry
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
