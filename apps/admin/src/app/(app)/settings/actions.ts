"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/formState";
import { errorsOf } from "@/lib/productForm";
import { requirePermission, requireStaff } from "@/server/auth/session";
import { businessSchema, changePassword, passwordSchema, saveBusiness } from "@/server/website";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

export async function saveBusinessAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("settings.write");
  const parsed = businessSchema.safeParse({
    contactPhone: text(form, "contactPhone"),
    contactEmail: text(form, "contactEmail"),
    businessHours: text(form, "businessHours"),
    addressLine: text(form, "addressLine"),
    entityName: text(form, "entityName"),
    gstin: text(form, "gstin"),
    fssaiLicenceNumber: text(form, "fssaiLicenceNumber"),
    grievanceOfficerName: text(form, "grievanceOfficerName"),
    grievanceOfficerEmail: text(form, "grievanceOfficerEmail"),
    grievanceOfficerPhone: text(form, "grievanceOfficerPhone"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted boxes.", fieldErrors: errorsOf(parsed.error) };
  }
  const result = await saveBusiness(actor, parsed.data);
  revalidatePath("/settings");
  return result;
}

/** Any signed-in staff member may change their own password — and only that. */
export async function changePasswordAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const parsed = passwordSchema.safeParse({
    current: text(form, "current"),
    next: text(form, "next"),
    again: text(form, "again"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted boxes.", fieldErrors: errorsOf(parsed.error) };
  }
  return changePassword(actor, parsed.data);
}
