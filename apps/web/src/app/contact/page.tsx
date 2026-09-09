import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { PageHeader } from "@/components/sections/PageHeader";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach the Burla team by WhatsApp, phone or email for product enquiries, bulk orders and everything else.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contact" }]}
        eyebrow="Get in touch"
        title="We'd Love to Hear from You."
        subtitle="Product enquiries, bulk orders, partnerships."
        lead="Reach us through the form below, or directly on WhatsApp — which is usually the quickest way to get an answer."
      />

      <Section tone="white" size="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Direct channels */}
            <div className="lg:col-span-5">
              <h2 className="t-h2">Direct channels</h2>

              <ul className="mt-6 divide-y divide-line overflow-hidden rounded-md border border-line">
                <li className="p-5">
                  <p className="t-label text-ink-3">WhatsApp</p>
                  <a
                    href={whatsappLink(
                      "Hi Burla, I'd like to know more about your products.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics="whatsapp_click"
                    data-source="contact"
                    className="mt-1 inline-flex min-h-11 items-center gap-2 font-medium text-ink hover:text-green-700"
                  >
                    <MessageCircle className="size-4 text-green" aria-hidden="true" />
                    Message us — usually the quickest
                  </a>
                </li>
                <li className="p-5">
                  <p className="t-label text-ink-3">Phone</p>
                  <a
                    href={`tel:${site.contact.phoneRaw}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-2 font-medium text-ink hover:text-green-700"
                  >
                    <Phone className="size-4 text-green" aria-hidden="true" />
                    {site.contact.phone}
                  </a>
                </li>
                <li className="p-5">
                  <p className="t-label text-ink-3">Email</p>
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-2 break-all font-medium text-ink hover:text-green-700"
                  >
                    <Mail className="size-4 shrink-0 text-green" aria-hidden="true" />
                    {site.contact.email}
                  </a>
                </li>
                <li className="p-5">
                  <p className="t-label text-ink-3">Address</p>
                  <address className="mt-1.5 flex items-start gap-2 not-italic text-ink">
                    <MapPin className="mt-1 size-4 shrink-0 text-green" aria-hidden="true" />
                    {site.legal.address}
                  </address>
                </li>
                <li className="p-5">
                  <p className="t-label text-ink-3">Hours</p>
                  <p className="mt-1.5 flex items-center gap-2 text-ink-2">
                    <Clock className="size-4 text-green" aria-hidden="true" />
                    {site.contact.hours}
                  </p>
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
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
                <ButtonLink
                  href={`tel:${site.contact.phoneRaw}`}
                  variant="secondary"
                  size="lg"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  Call us
                </ButtonLink>
              </div>

              <p className="mt-5 text-[0.8125rem] leading-relaxed text-ink-3">
                Business hours are still to be confirmed, and we need to check
                that the published number is the one that receives WhatsApp —
                <code className="ml-1">OQ-024</code>,{" "}
                <code>OQ-004</code>.
              </p>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <h2 className="t-h2">Send us a message</h2>
              <div className="mt-6 rounded-md border border-line p-6 lg:p-7">
                <EnquiryForm kind="contact" />
              </div>

              {/* Script accent from the mockup. Decorative. */}
              <div className="relative mt-8 hidden lg:block">
                <div className="overflow-hidden rounded-md border border-line">
                  <ProductImage name="Farm photograph" ratio="landscape" />
                </div>
                <p
                  aria-hidden="true"
                  className="t-script pointer-events-none absolute right-5 top-4 text-[1.75rem] text-green-700"
                >
                  Let&rsquo;s
                  <br />
                  Grow Together
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <TrustStrip />
    </>
  );
}
