import Link from "next/link";
import { Facebook, Instagram, Mail, MessageCircle, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Section";
import { categories } from "@/data/catalog";
import { companyNav, policyNav, site, whatsappLink } from "@/lib/site";

/**
 * Footer, built to the client's final mockup (2026-09-10): light, with the
 * logo and social links on the left, then Shop, Company, Policies and
 * Connect, and a closing line of the three brand values.
 *
 * Light rather than the previous deep green, as in the mockup — which also
 * suits the supplied logo, a JPEG on white that cannot sit on a dark ground
 * without a plate.
 *
 * ## One deliberate addition to the mockup
 *
 * The statutory block — registered name, address, FSSAI licence, GSTIN and
 * grievance officer — is not in the mockup, and it stays. An Indian food
 * business selling online is required to show it (FR-008; Consumer
 * Protection (E-Commerce) Rules 2020, FSS Act). It sits small in the bottom
 * bar so it does not change the look.
 *
 * ## Social links
 *
 * The client has not supplied the accounts yet (`OQ-025`). The icons render
 * as in the mockup, but as inert marks rather than links to `#`: a link that
 * goes nowhere is worse than no link, and it is invisible that it is broken
 * until someone clicks it.
 */

const SOCIAL = [
  { Icon: Facebook, href: site.social.facebook, label: "Facebook" },
  { Icon: Instagram, href: site.social.instagram, label: "Instagram" },
  { Icon: Youtube, href: site.social.youtube, label: "YouTube" },
];

const linkClass =
  "text-[0.8125rem] leading-relaxed text-ink-2 underline-offset-4 transition-colors hover:text-green-700 hover:underline";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.15fr_1fr_1fr_1.45fr] lg:gap-8 lg:py-14">
          <div>
            <Logo variant="full" height={62} />
            <p className="mt-4 max-w-[28ch] text-[0.8125rem] leading-relaxed text-ink-2">
              Pure agricultural products for a healthier, happier tomorrow.
            </p>
            <ul className="mt-5 flex gap-2.5" aria-label="Social media">
              {SOCIAL.map(({ Icon, href, label }) => {
                const circle =
                  "grid size-9 place-items-center rounded-full bg-ink text-white transition-colors";
                const confirmed = href && href !== "#";
                return (
                  <li key={label}>
                    {confirmed ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Burla on ${label}`}
                        className={`${circle} hover:bg-green-700`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <span
                        className={circle}
                        title={`${label} — link to be confirmed`}
                        aria-label={`${label} (link to be confirmed)`}
                        role="img"
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-labelledby="f-shop">
            <h2 id="f-shop" className="text-[0.875rem] font-semibold text-ink">
              Shop
            </h2>
            <ul className="mt-3 space-y-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/products/${c.slug}`} className={linkClass}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="f-company">
            <h2 id="f-company" className="text-[0.875rem] font-semibold text-ink">
              Company
            </h2>
            <ul className="mt-3 space-y-1">
              {companyNav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="f-policies">
            <h2 id="f-policies" className="text-[0.875rem] font-semibold text-ink">
              Policies
            </h2>
            <ul className="mt-3 space-y-1">
              {policyNav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.875rem] font-semibold text-ink">Connect</h2>
            <ul className="mt-3 space-y-4">
              <li>
                <a
                  href={whatsappLink(
                    "Hi Burla, I would like to know more about your products.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="whatsapp_click"
                  data-source="footer"
                  className="group flex items-start gap-3"
                >
                  <MessageCircle
                    className="mt-0.5 size-6 shrink-0 text-green-700"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-[0.8125rem] font-semibold text-green-700 group-hover:underline">
                      Chat on WhatsApp
                    </span>
                    <span className="block text-[0.8125rem] text-ink-2 tabular-nums">
                      {site.contact.phone}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="group flex items-start gap-3"
                >
                  <Mail
                    className="mt-0.5 size-6 shrink-0 text-green-700"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  {/* Breaks after the @ if it must break at all — never
                      mid-word, which is what break-all did. */}
                  <span className="text-[0.8125rem] text-ink-2 group-hover:text-green-700 group-hover:underline">
                    {site.contact.email.split("@")[0]}@<wbr />
                    {site.contact.email.split("@")[1]}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line py-5">
          <div className="flex flex-col gap-2 text-[0.75rem] text-ink-3 lg:flex-row lg:items-center lg:justify-between">
            <p>
              © {year} {site.name}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              Natural Products
              <span aria-hidden="true">·</span>
              Healthy People
              <span aria-hidden="true">·</span>A Brighter Tomorrow
            </p>
          </div>

          {/* Statutory — FR-008. Small, but present on every page. */}
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">
            {site.legal.entityName} · {site.legal.address} · FSSAI Licence No.{" "}
            {site.legal.fssai} · GSTIN {site.legal.gstin} · Grievance Officer:{" "}
            {site.legal.grievanceOfficer}
          </p>
        </div>
      </Container>
    </footer>
  );
}
