import type { Metadata } from "next";
import { Building2, Globe2, Handshake, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { PageHeader, PendingContent } from "@/components/sections/PageHeader";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Locations",
  description:
    "Where Burla operates — the registered office in Nellore, Andhra Pradesh, and our growing distribution presence.",
  alternates: { canonical: "/locations" },
};

const presence = [
  {
    Icon: Building2,
    title: "India",
    note: "Registered office in Nellore, Andhra Pradesh. Facilities and warehousing pending confirmation.",
  },
  {
    Icon: Globe2,
    title: "Global",
    note: "International enquiries welcome. Export markets served are published once confirmed.",
  },
  {
    Icon: Handshake,
    title: "Partners",
    note: "Distribution and trade relationships, published once confirmed.",
  },
];

export default function LocationsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Locations" }]}
        eyebrow="Our locations"
        title="Growing Our Presence, Globally."
        subtitle="An Indian business, with international ambition."
        lead="This page shows where Burla actually is — and nothing we cannot verify. No pin is placed without a confirmed address."
      />

      {/* The one address we can verify, from the business card */}
      <Section tone="white" size="sm">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <h2 className="t-h2">Registered office</h2>
              <address className="mt-5 not-italic">
                <p className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink">
                  <MapPin
                    className="mt-0.5 size-5 shrink-0 text-green"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>
                    {site.legal.address}
                  </span>
                </p>
              </address>
              <dl className="mt-6 space-y-2 border-t border-line pt-5 text-[0.875rem]">
                <div className="flex gap-2">
                  <dt className="text-ink-3">GSTIN</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {site.legal.gstin}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-3">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${site.contact.phoneRaw}`}
                      className="inline-flex min-h-6 items-center font-medium text-ink hover:text-green-700"
                    >
                      {site.contact.phone}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              {/* A real embed replaces this once the address is confirmed for
                  publication and geocoded. An approximate pin on a food
                  business is worse than none. */}
              <div className="grid aspect-video place-items-center rounded-md border border-dashed border-line-strong bg-surface">
                <p className="max-w-xs px-6 text-center text-[0.875rem] text-ink-3">
                  Map embed — enabled once the address is confirmed for
                  publication
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Wider presence */}
      <Section tone="surface" size="sm">
        <Container>
          <ul className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {presence.map(({ Icon, title, note }) => (
              <li
                key={title}
                className="rounded-md border border-line bg-white p-6"
              >
                <Icon
                  className="size-6 text-green"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2 className="t-h3 mt-3">{title}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                  {note}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <PendingContent question="OQ-021">
              Processing facilities, warehouses, retail presence and any
              international offices are listed here once addresses are supplied.
              The location cards and map are built and waiting.
            </PendingContent>
          </div>
        </Container>
      </Section>

      <Section tone="white" size="sm">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-md border border-line p-6 lg:flex-row lg:items-center lg:p-8">
            <div>
              <h2 className="t-h3">Looking for a distributor near you?</h2>
              <p className="measure mt-2 text-[0.9375rem] text-ink-2">
                Tell us where you are and we will point you in the right
                direction.
              </p>
            </div>
            <ButtonLink href="/contact" className="shrink-0">
              Contact us
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <TrustStrip />
    </>
  );
}
