import Link from "next/link";
import { Facebook, Instagram, Mail, Phone, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Section";
import { categories } from "@/data/catalog";
import { companyNav, policyNav, site, whatsappLink } from "@/lib/site";

/**
 * Footer — mirrors the client's handwritten structure exactly (FR-007):
 * Policies · About us · Our Locations · Contact us · Quality Control &
 * Standards · Facebook, Instagram, YouTube.
 *
 * All ten categories also appear here as flat links, which preserves the
 * client's original "every category in the nav" intent and gives crawlers a
 * complete category index on every page.
 */
export function Footer() {
  return (
    <footer className="border-t border-green-deep/15 bg-green-deep text-ivory">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-12 md:gap-8 lg:py-20">
          <div className="md:col-span-4 lg:col-span-3">
            <Logo variant="reversed" className="text-[2.4rem]" />
            <p className="measure-tight mt-6 text-[0.9375rem] leading-relaxed text-ivory/75">
              Indian agricultural produce, carefully processed into everyday
              foods.
            </p>
            <p className="t-script mt-6 text-[1.6rem] text-ivory/85">
              Indian roots, global horizons
            </p>
          </div>

          <div className="md:col-span-4 lg:col-span-3">
            <h2 className="t-label text-ivory/60">Shop</h2>
            <ul className="mt-5 space-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop/${c.slug}`}
                    className="text-[0.9375rem] text-ivory/85 underline-offset-4 transition-colors hover:text-ivory hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-2">
            <h2 className="t-label text-ivory/60">Company</h2>
            <ul className="mt-5 space-y-2.5">
              {companyNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.9375rem] text-ivory/85 underline-offset-4 transition-colors hover:text-ivory hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6 lg:col-span-2">
            <h2 className="t-label text-ivory/60">Policies</h2>
            <ul className="mt-5 space-y-2.5">
              {policyNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.9375rem] text-ivory/85 underline-offset-4 transition-colors hover:text-ivory hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6 lg:col-span-2">
            <h2 className="t-label text-ivory/60">Connect</h2>
            <ul className="mt-5 space-y-2.5">
              <li>
                <a
                  href={whatsappLink("Hi Burla, I'd like to know more about your products.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.9375rem] text-ivory/85 underline-offset-4 hover:text-ivory hover:underline"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-[0.9375rem] text-ivory/85 hover:text-ivory"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="inline-flex items-center gap-2 text-[0.9375rem] text-ivory/85 hover:text-ivory"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {site.contact.email}
                </a>
              </li>
            </ul>

            <div className="mt-6 flex gap-2">
              {[
                { Icon: Facebook, href: site.social.facebook, label: "Facebook" },
                { Icon: Instagram, href: site.social.instagram, label: "Instagram" },
                { Icon: Youtube, href: site.social.youtube, label: "YouTube" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded-md border border-ivory/25 p-2.5 text-ivory/85 transition-colors hover:border-ivory/60 hover:text-ivory"
                >
                  <Icon className="size-[1.05rem]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal block — FR-008. Values are placeholders pending OQ-002/003/005. */}
        <div className="border-t border-ivory/15 py-8">
          <div className="flex flex-col gap-4 text-[0.8125rem] leading-relaxed text-ivory/60 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p>
                {site.legal.entityName} · {site.legal.address}
              </p>
              <p>
                FSSAI Licence No. {site.legal.fssai} · GSTIN{" "}
                {site.legal.gstin}
              </p>
              <p>Grievance Officer: {site.legal.grievanceOfficer}</p>
            </div>
            <p className="shrink-0">
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
