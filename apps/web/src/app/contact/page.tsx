import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/sections/PageHero";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Burla",
  description:
    "Reach the Burla team by WhatsApp, phone or email for product enquiries, bulk orders and everything else.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Contact" }]}
        eyebrow="Get in touch"
        title="We'd love to hear from you."
        lead="Product enquiries, bulk orders, partnerships, or anything else — reach us through the form or directly on WhatsApp."
      />

      <Section tone="ivory">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="t-h3">Direct channels</h2>

              <ul className="mt-6 space-y-px overflow-hidden rounded-md border border-sand">
                <li className="bg-paper px-5 py-4">
                  <p className="t-label text-ink-faint">WhatsApp</p>
                  <a
                    href={whatsappLink(
                      "Hi Burla, I'd like to know more about your products.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics="whatsapp_click"
                    data-source="contact"
                    className="mt-1 inline-flex items-center gap-2 font-medium text-ink hover:text-green-text"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Message us — usually the quickest
                  </a>
                </li>
                <li className="border-t border-sand bg-paper px-5 py-4">
                  <p className="t-label text-ink-faint">Phone</p>
                  <a
                    href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
                    className="mt-1 inline-flex items-center gap-2 font-medium text-ink hover:text-green-text"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {site.contact.phone}
                  </a>
                </li>
                <li className="border-t border-sand bg-paper px-5 py-4">
                  <p className="t-label text-ink-faint">Email</p>
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="mt-1 inline-flex items-center gap-2 font-medium text-ink hover:text-green-text"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {site.contact.email}
                  </a>
                </li>
                <li className="border-t border-sand bg-paper px-5 py-4">
                  <p className="t-label text-ink-faint">Hours</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-ink">
                    <Clock className="size-4" aria-hidden="true" />
                    {site.contact.hours}
                  </p>
                </li>
              </ul>

              <div className="mt-6 border-l-2 border-sand-deep bg-ivory-warm/60 px-5 py-4">
                <p className="t-label text-ink-faint">Awaiting client content</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                  Phone number, email address, business hours and whether a
                  physical address should be published are pending
                  confirmation.
                </p>
                <p className="mt-2 text-[0.8125rem] text-ink-faint">
                  Tracked as <code className="font-semibold">OQ-024</code> and{" "}
                  <code className="font-semibold">OQ-004</code>
                </p>
              </div>

              <div className="mt-8">
                <ButtonLink
                  href={whatsappLink(
                    "Hi Burla, I'd like to know more about your products.",
                  )}
                  external
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-7">
              <h2 className="t-h3">Send us a message</h2>
              <div className="mt-6">
                <EnquiryForm kind="contact" />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
