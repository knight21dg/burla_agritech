import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { enquiryLabel, getEnquiry } from "@/server/enquiries";
import { isUuid } from "@/lib/ids";
import { when } from "@/lib/format";
import { EnquiryActions } from "@/components/enquiries/EnquiryActions";

export const metadata: Metadata = { title: "Enquiry" };

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("enquiry.read");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  const label = enquiryLabel(enquiry.status);
  const subject = `Re: your ${enquiry.type === "wholesale" ? "wholesale " : ""}enquiry to Burla`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/enquiries" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Enquiries
        </Link>
        <h1 className="page-title mt-2">{enquiry.name}</h1>
        <p className="mt-0.5 text-ink-2">
          {enquiry.type === "wholesale" ? "Wholesale enquiry" : "Contact form"} · {when(enquiry.createdAt)} · {label}
        </p>
      </div>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Message</h2>
        {enquiry.subject && <p className="mt-2 font-medium">{enquiry.subject}</p>}
        <p className="mt-2 whitespace-pre-wrap text-[1rem] leading-relaxed">{enquiry.message}</p>

        {(enquiry.company || enquiry.country || enquiry.estimatedQuantity || enquiry.productInterest?.length) && (
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
            {enquiry.productInterest?.length ? (
              <div>
                <dt className="hint">Interested in</dt>
                <dd>{enquiry.productInterest.join(", ")}</dd>
              </div>
            ) : null}
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
