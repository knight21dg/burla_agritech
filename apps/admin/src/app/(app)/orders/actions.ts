"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { requirePermission } from "@/server/auth/session";
import { moveOrder } from "@/server/orders";

const schema = z
  .object({
    orderNumber: z.string().regex(/^BGA-\d{4}-\d{5,}$/),
    to: z.enum(["processing", "packed", "shipped", "delivered", "cancelled"]),
  })
  .strict();

/**
 * Moving an order along. Only the next steps an order may actually take are
 * accepted, and the server decides that from the order's real current state —
 * not from which button the page happened to show.
 */
export async function moveOrderAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("order.transition");
  const parsed = schema.safeParse({ orderNumber: form.get("orderNumber"), to: form.get("to") });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please reload and try again." };

  const result = await moveOrder(actor, parsed.data.orderNumber, parsed.data.to);
  revalidatePath(`/orders/${parsed.data.orderNumber}`);
  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: result.ok, message: result.message };
}
