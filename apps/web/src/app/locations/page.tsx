import type { Metadata } from "next";
import { Building2, Globe2, Handshake } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHead } from "@/components/ui/Section";
import { PageHero, PendingContent } from "@/components/sections/PageHero";

export const metadata: Metadata = {
  title: "Our Locations",
  description:
    "Where Burla operates — offices, facilities and distribution presence across India and beyond.",
  alternates: { canonical: "/locations" },
};

const presence = [
  {
    Icon: Building2,
    title: "India",
    note: "Registered office, processing facility and warehousing.",
    q: "OQ-021",
  },
  {
    Icon: Globe2,
    title: "Global",
    note: "International enquiries and export markets served.",
    q: "OQ-021",
  },
  {
    Icon: Handshake,
    title: "Partners",
    note: "Distribution and trade relationships.",
    q: "OQ-021",
  },
];

export default function LocationsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Locations" }]}
        eyebrow="Our locations"
        title="Growing our presence, globally."
        lead="Burla is an Indian business with international ambition. This page shows where we actually are — offices, facilities and distribution — and nothing we cannot verify."
      />

      <Section tone="ivory">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {presence.map(({ Icon, title, note, q }) => (
              <div key={title} className="border-t border-sand pt-6">
                <Icon
                  className="size-6 text-green"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2 className="t-h3 mt-4">{title}</h2>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {note}
                </p>
                <p className="mt-3 text-[0.8125rem] text-ink-faint">
                  Addresses pending — <code className="font-semibold">{q}</code>
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="warm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead
                eyebrow="On the map"
                title="No pin without a verified address"
              />
            </div>
            <div className="lg:col-span-7">
              <PendingContent question="OQ-021">
                The map and location cards are built and ready. They stay empty
                until the business supplies real addresses — registered office,
                processing facility, warehouses and any retail or international
                presence. Placing an approximate pin on a food business would be
                worse than showing none.
              </PendingContent>

              {/* Map placeholder — a real embed appears once addresses are verified */}
              <div className="mt-8 grid aspect-video place-items-center border border-dashed border-sand-deep bg-ivory">
                <p className="px-6 text-center text-[0.875rem] text-ink-faint">
                  Map embed — enabled once addresses are confirmed
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="deep" size="sm">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <SectionHead
              tone="light"
              title="Looking for a distributor near you?"
              lead="Tell us where you are and we will point you in the right direction."
            />
            <ButtonLink href="/contact" variant="onDark" className="shrink-0">
              Contact us
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
