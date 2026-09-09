import type { Metadata } from "next";
import { ArrowRight, Compass, Eye, HeartHandshake, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { PageHeader, PendingContent } from "@/components/sections/PageHeader";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us — Our Story",
  description:
    "Burla Global Agri Products takes Indian agricultural produce and converts it into shelf-stable everyday foods, using the methods the produce has always suited.",
  alternates: { canonical: "/about" },
};

/** The four pillars from the client's mockup. */
const pillars = [
  {
    Icon: Sprout,
    title: "Our Story",
    body: "Founding year, founders and how the business began.",
    q: "OQ-020",
  },
  {
    Icon: HeartHandshake,
    title: "Our Values",
    body: "What the business stands for, in its own words.",
    q: "OQ-020",
  },
  {
    Icon: Eye,
    title: "Our Vision",
    body: "Long-term ambition, including international expansion.",
    q: "OQ-020",
  },
  {
    Icon: Compass,
    title: "Our Mission",
    body: "Sourcing and processing philosophy.",
    q: "OQ-018",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "About" }]}
        eyebrow="About Burla"
        title="Rooted in Values. Growing for Tomorrow."
        subtitle="Indian produce, handled the way it has always suited."
        lead="Burla works with produce India has always grown, and with the methods that have always suited it — drying, curing, roasting and milling. What we bring to those methods is consistency: careful grading, controlled processing and honest packing."
        imageName="Company photograph"
      />

      {/* Four pillars */}
      <Section tone="white" size="sm">
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {pillars.map(({ Icon, title, body, q }) => (
              <li key={title} className="border-t-2 border-green-700 pt-5">
                <Icon
                  className="size-6 text-green"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2 className="t-h3 mt-3">{title}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                  {body}
                </p>
                <p className="mt-2 text-[0.8125rem] text-ink-3">
                  Pending — <code className="font-semibold">{q}</code>
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What we produce */}
      <Section tone="surface" size="sm">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-md border border-line bg-white">
                <ProductImage name="Processing photograph" ratio="landscape" />
              </div>
            </div>
            <div className="lg:col-span-7">
              <h2 className="t-h2">Ten ranges, one way of working</h2>
              <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                Every range comes from a single principle: take good produce,
                remove the water or add the salt, and change as little else as
                possible.
              </p>
              <div className="mt-6">
                <PendingContent question="OQ-018">
                  Whether {site.shortName} operates its own processing facility,
                  uses contract manufacturing, or aggregates from producers
                  determines what can honestly be said here — and which legal
                  declaration applies (manufactured by / packed by / marketed
                  by). We will not describe a process we have not confirmed.
                </PendingContent>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/products">
                  Browse products
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/quality" variant="secondary">
                  Quality &amp; Standards
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <TrustStrip />
    </>
  );
}
