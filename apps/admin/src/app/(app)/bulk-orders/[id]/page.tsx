import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getEnquiry, interestNames, readInterest } from "@/server/enquiries";
import { isUuid } from "@/lib/ids";
import { EnquiryDetail } from "@/components/enquiries/EnquiryDetail";

export const metadata: Metadata = { title: "Bulk order" };

export default async function BulkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("enquiry.read");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();
  // An ordinary message is not a bulk order; it is read in the inbox.
  if (enquiry.type !== "wholesale") redirect(`/enquiries/${id}`);

  const interest = readInterest(enquiry.productInterest, await interestNames(enquiry.productInterest ?? []));

  return <EnquiryDetail actor={actor} interest={interest} enquiry={enquiry} back={{ href: "/bulk-orders", label: "Bulk orders" }} />;
}
