"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { requirePermission } from "@/server/auth/session";
import { markEnquiry } from "@/server/enquiries";

const schema = z
  .object({
    enquiryId: z.string().uuid(),
    as: z.enum(["new", "contacted", "done", "spam"]),
  })
  .strict();

export async function markEnquiryAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("enquiry.write");
  const parsed = schema.safeParse({ enquiryId: form.get("enquiryId"), as: form.get("as") });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please reload and try again." };

  const result = await markEnquiry(actor, parsed.data.enquiryId, parsed.data.as);
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  revalidatePath("/enquiries");
  // The same enquiry is read under Bulk orders when it is a wholesale one.
  revalidatePath(`/bulk-orders/${parsed.data.enquiryId}`);
  revalidatePath("/bulk-orders");
  revalidatePath("/");
  return result;
}
