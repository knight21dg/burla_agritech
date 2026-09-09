import Link from "next/link";
import { Facebook, Instagram, Mail, MessageCircle, Phone, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Section";
import { categories } from "@/data/catalog";
import { companyNav, policyNav, site, whatsappLink } from "@/lib/site";

/**
 * Footer — mirrors the client's handwritten structure exactly (FR-007):
 * Policies · About us · Our Locations · Contact us · Quality Control &
 * Standards · Facebook, Instagram, YouTube.
 *
 * All ten categories appear here as flat links, giving crawlers a complete
 * category index on every page. Locations lives here rather than in the main
 * navigation, at the client's request.
 *
 * ## Why this is light rather than dark green
 *
 * DESIGN-SYSTEM §7.5 called for a green-900 ground — the one place the brand
 * colour dominates. The supplied logo is a JPEG on a white background with no
 * transparency, so it cannot sit on a dark field without a white box around it,
 * which looks worse than either option.
 *
 * A light footer with a green top rule is also more consistent with the
 * "mostly plain white" brief. Revisit if a transparent or reversed logo
 * arrives (`docs/CLIENT-ASSETS-REQUIRED.md` §1).
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-2 border-green-700 bg-surface">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:gap-8 lg:py-14">
          <div className="md:col-span-4 lg:col-span-3">
            <Logo variant="full" height={54} />
            <p className="mt-5 max-w-[26ch] text-[0.875rem] leading-relaxed text-ink-2">
              Indian agricultural produce, carefully processed into everyday
              foods.
            </p>
          </div>

          <nav className="md:col-span-4 lg:col-span-3" aria-labelledby="f-shop">
            <h2 id="f-shop" className="t-label text-ink-3">
              Products
            </h2>
            <ul className="mt-4 space-y-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/products/${c.slug}`}
                    className="text-[0.875rem] text-ink-2 underline-offset-4 transition-colors hover:text-green-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-4 lg:col-span-2" aria-labelledby="f-company">
            <h2 id="f-company" className="t-label text-ink-3">
              Company
            </h2>
            <ul className="mt-4 space-y-2">
              {companyNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.875rem] text-ink-2 underline-offset-4 transition-colors hover:text-green-700 hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-6 lg:col-span-2" aria-labelledby="f-policies">
            <h2 id="f-policies" className="t-label text-ink-3">
              Policies
            </h2>
            <ul className="mt-4 space-y-2">
              {policyNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.875rem] text-ink-2 underline-offset-4 transition-colors hover:text-green-700 hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-6 lg:col-span-2">
            <h2 className="t-label text-ink-3">Connect</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={whatsappLink(
                    "Hi Burla, I'd like to know more about your products.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="whatsapp_click"
                  data-source="footer"
                  className="inline-flex items-center gap-2 text-[0.875rem] text-ink-2 transition-colors hover:text-green-700"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`tel:${site.contact.phoneRaw}`}
                  className="inline-flex items-center gap-2 text-[0.875rem] text-ink-2 transition-colors hover:text-green-700"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="inline-flex items-start gap-2 break-all text-[0.875rem] text-ink-2 transition-colors hover:text-green-700"
                >
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {site.contact.email}
                </a>
              </li>
            </ul>

            <div className="mt-5 flex gap-2">
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
                  className="rounded-md border border-line bg-white p-2.5 text-ink-2 transition-colors hover:border-green-700 hover:text-green-700"
                >
                  <Icon className="size-[1.05rem]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal block — FR-008. Required of an Indian food business online. */}
        <div className="border-t border-line py-7">
          <div className="flex flex-col gap-3 text-[0.8125rem] leading-relaxed text-ink-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-ink-2">{site.legal.entityName}</p>
              <p>{site.legal.address}</p>
              <p>
                FSSAI Licence No. {site.legal.fssai} · GSTIN {site.legal.gstin}
              </p>
              <p>Grievance Officer: {site.legal.grievanceOfficer}</p>
            </div>
            <p className="shrink-0">
              © {year} {site.name}. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
