import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { can, type Actor } from "@burla/core/auth/rbac";
import type { Enquiry } from "@burla/core/db/schema";
import { enquiryLabel } from "@/server/enquiries";
import { when } from "@/lib/format";
import { EnquiryActions } from "@/components/enquiries/EnquiryActions";

/**
 * One enquiry, read and replied to. Shown under Enquiries for an ordinary
 * message and under Bulk orders for a wholesale one — the same page either
 * way, so marking it done in one place is done in both. Only the way back
 * differs, which is why the caller supplies it.
 */

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function EnquiryDetail({
  actor,
  enquiry,
  interest,
  back,
}: {
  actor: Actor;
  enquiry: Enquiry;
  /** The ranges they chose, in words rather than slugs. */
  interest: string[];
  back: { href: string; label: string };
}) {
  const label = enquiryLabel(enquiry.status);
  const wholesale = enquiry.type === "wholesale";
  const subject = `Re: your ${wholesale ? "wholesale " : ""}enquiry to Burla`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
        <h1 className="page-title mt-2">{enquiry.name}</h1>
        <p className="mt-0.5 text-ink-2">
          {wholesale ? "Bulk order enquiry" : "Contact form"} · {when(enquiry.createdAt)} · {label}
        </p>
      </div>

      {wholesale && enquiry.estimatedQuantity && (
        <p className="panel px-4 py-3 text-[1.0625rem] sm:px-5">
          Asking for <span className="font-semibold">{enquiry.estimatedQuantity}</span>
          {interest.length ? <> of {interest.join(", ")}</> : null}.
        </p>
      )}

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Message</h2>
        {enquiry.subject && <p className="mt-2 font-medium">{enquiry.subject}</p>}
        <p className="mt-2 whitespace-pre-wrap text-[1rem] leading-relaxed">{enquiry.message}</p>

        {(enquiry.company || enquiry.country || enquiry.estimatedQuantity || interest.length > 0) && (
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {enquiry.company && (
              <div>
                <dt className="hint">Company</dt>
                <dd>{enquiry.company}</dd>
              </div>
            )}
            {enquiry.country && (
              <div>
                <dt className="hint">Country</dt>
                <dd>{enquiry.country}</dd>
              </div>
            )}
            {enquiry.estimatedQuantity && (
              <div>
                <dt className="hint">Quantity</dt>
                <dd>{enquiry.estimatedQuantity}</dd>
              </div>
            )}
            {interest.length > 0 && (
              <div>
                <dt className="hint">Interested in</dt>
                <dd>{interest.join(", ")}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Reply</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(subject)}`} className="btn btn-quiet">
            <Mail className="size-4" aria-hidden="true" />
            Email {enquiry.email}
          </a>
          {enquiry.phone && (
            <>
              <a href={`tel:${enquiry.phone}`} className="btn btn-quiet">
                <Phone className="size-4" aria-hidden="true" />
                Call {enquiry.phone}
              </a>
              <a
                href={`https://wa.me/${whatsappNumber(enquiry.phone)}?text=${encodeURIComponent(`Hello ${enquiry.name}, thank you for contacting Burla.`)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-quiet"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </>
          )}
        </div>
      </section>

      {can(actor, "enquiry.write") && <EnquiryActions enquiryId={enquiry.id} current={label} />}
    </div>
  );
}
