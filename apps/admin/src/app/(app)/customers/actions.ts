"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { requirePermission } from "@/server/auth/session";
import { setCustomerActive } from "@/server/customers";

const schema = z.object({ customerId: z.string().uuid(), active: z.enum(["true", "false"]) }).strict();

/** Switching a customer's account off or on. Only an admin may. */
export async function setCustomerActiveAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("user.manage");
  const parsed = schema.safeParse({ customerId: form.get("customerId"), active: form.get("active") });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please reload and try again." };

  const result = await setCustomerActive(actor, parsed.data.customerId, parsed.data.active === "true");
  revalidatePath("/customers");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return result;
}
