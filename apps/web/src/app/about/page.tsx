import type { Metadata } from "next";
import { Compass, Eye, HeartHandshake, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHead } from "@/components/ui/Section";
import { PageHero, PendingContent } from "@/components/sections/PageHero";
import { ProductImage } from "@/components/ui/ProductImage";

export const metadata: Metadata = {
  title: "About Us — Our Story",
  description:
    "Burla Global Agri Products takes Indian agricultural produce and converts it into shelf-stable everyday foods, using methods the produce has always suited.",
  alternates: { canonical: "/about" },
};

const pillars = [
  {
    Icon: Sprout,
    title: "Our Story",
    body: "Founding year, founders and origin are pending confirmation.",
    q: "OQ-020",
  },
  {
    Icon: HeartHandshake,
    title: "Our Values",
    body: "What the business stands for, in its own words, is pending confirmation.",
    q: "OQ-020",
  },
  {
    Icon: Eye,
    title: "Our Vision",
    body: "Long-term ambition, including international expansion, is pending confirmation.",
    q: "OQ-020",
  },
  {
    Icon: Compass,
    title: "Our Mission",
    body: "Sourcing and processing philosophy is pending confirmation.",
    q: "OQ-018",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "About" }]}
        eyebrow="Who we are"
        title="Rooted in values. Growing for tomorrow."
        lead="Burla works with produce India has always grown, and with the methods that have always suited it — drying, curing, roasting and milling. What we bring to those methods is consistency: careful grading, controlled processing and honest packing."
      >
        <ProductImage name="Company photograph" ratio="landscape" />
      </PageHero>

      <Section >
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
            {pillars.map(({ Icon, title, body, q }) => (
              <div key={title} className="border-t border-line pt-6">
                <Icon
                  className="size-6 text-green"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2 className="t-h3 mt-4">{title}</h2>
                <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                  {body}
                </p>
                <p className="mt-2 text-[0.8125rem] text-ink-3">
                  <code className="font-semibold">{q}</code>
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section >
        <Container>
          <SectionHead
            eyebrow="What we produce"
            title="Ten ranges, one way of working"
            lead="Every range comes from a single principle: take good produce, remove the water or add the salt, and change as little else as possible."
          />
          <div className="mt-10">
            <PendingContent question="OQ-018">
              Whether Burla operates its own processing facility, uses contract
              manufacturing, or aggregates from producers determines what can
              honestly be said here — and which legal declaration applies
              (manufactured by / packed by / marketed by). We will not describe
              a process we have not confirmed.
            </PendingContent>
          </div>
        </Container>
      </Section>

      <Section >
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <SectionHead
              
              title="See how we work"
              lead="Sourcing through dispatch — the sequence every batch moves through."
            />
            <div className="flex shrink-0 gap-3">
              <ButtonLink href="/quality" variant="onDark">
                Quality &amp; Standards
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="secondary"
                className="border-white/35 text-white hover:border-white hover:bg-white/10"
              >
                Browse products
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
