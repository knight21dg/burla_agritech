"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { packetsSchema } from "@/lib/stock";
import { requirePermission } from "@/server/auth/session";
import { addSupply, setCount, stopCounting } from "@/server/stock";

/**
 * Stock changes. Each checks permission, accepts exactly the fields it names,
 * and leaves the arithmetic to the server, which locks the pack first.
 */

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("supply"), variantId: z.string().uuid(), packets: packetsSchema }).strict(),
  z
    .object({
      kind: z.literal("count"),
      variantId: z.string().uuid(),
      packets: packetsSchema,
      seen: z.coerce.number().int().min(0).optional(),
    })
    .strict(),
  z.object({ kind: z.literal("stop"), variantId: z.string().uuid() }).strict(),
]);

export async function changeStockAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("inventory.adjust");

  const raw: Record<string, FormDataEntryValue> = {};
  for (const key of ["kind", "variantId", "packets", "seen"]) {
    const value = form.get(key);
    if (value !== null && value !== "") raw[key] = value;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const packetsError = parsed.error.issues.find((issue) => issue.path[0] === "packets");
    return {
      ok: false,
      message: packetsError ? packetsError.message : "Something went wrong. Please reload and try again.",
    };
  }

  const input = parsed.data;
  const result =
    input.kind === "supply"
      ? await addSupply(actor, input.variantId, input.packets)
      : input.kind === "count"
        ? await setCount(actor, input.variantId, input.packets, input.seen)
        : await stopCounting(actor, input.variantId);

  revalidatePath("/stock");
  revalidatePath("/products");
  revalidatePath("/");
  return result;
}
