import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHead } from "@/components/ui/Section";
import { PageHero, PendingContent } from "@/components/sections/PageHero";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bulk & Wholesale Enquiries",
  description:
    "Bulk formats, consistent grading and documentation for retailers, distributors, food businesses and exporters.",
  alternates: { canonical: "/wholesale" },
};

const buyers = [
  ["Retailers", "Kirana stores, specialty grocers and online resellers"],
  ["Distributors", "Regional and multi-state distribution"],
  ["Restaurants & food businesses", "Cloud kitchens, HORECA and snack brands"],
  ["Exporters & international buyers", "Documentation and samples on request"],
];

const steps = [
  ["Enquiry", "Tell us the range, format and volume you need."],
  ["Response", "We come back with availability and indicative pricing."],
  ["Samples", "Where useful, samples before you commit."],
  ["Quote", "Firm pricing against your specification."],
  ["Supply", "Agreed schedule and packing format."],
];

export default function WholesalePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Bulk & Wholesale" }]}
        eyebrow="Bulk &amp; wholesale"
        title="Supplying retailers, kitchens and exporters."
        lead="Burla is built for volume as well as for the shelf. Tell us what you need and we will come back with specifics rather than a brochure."
      />

      <Section >
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="t-h3">Who we supply</h2>
              <ul className="mt-6 space-y-px overflow-hidden rounded-md border border-line">
                {buyers.map(([title, note]) => (
                  <li
                    key={title}
                    className="border-b border-line bg-white px-5 py-4 last:border-b-0"
                  >
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-[0.875rem] text-ink-2">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>

              <h2 className="t-h3 mt-10">How it works</h2>
              <ol className="mt-5 space-y-4">
                {steps.map(([name, note], i) => (
                  <li key={name} className="flex gap-4">
                    <span
                      className="t-label mt-1 shrink-0 text-ink-3"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-semibold text-ink">{name}</span>
                      <span className="mt-0.5 block text-[0.875rem] text-ink-2">
                        {note}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-10">
                <PendingContent question="OQ-018">
                  Minimum order quantities, available bulk pack formats,
                  private-label capability and export countries are published
                  once confirmed. We will not state a capability the business has
                  not verified.
                </PendingContent>
              </div>

              <div className="mt-8">
                <ButtonLink
                  href={whatsappLink(
                    "Hi Burla, I'd like to discuss bulk or wholesale supply.",
                  )}
                  external
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Talk to our team
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SectionHead
                title="Wholesale enquiry"
                lead="The more detail you give us, the more useful our first reply can be."
              />
              <div className="mt-8">
                <EnquiryForm kind="wholesale" />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
