"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { isUuid } from "@/lib/ids";
import { errorsOf, productFormSchema } from "@/lib/productForm";
import { requirePermission } from "@/server/auth/session";
import { fileFrom } from "@/server/photos";
import { deleteProduct, saveProduct, setAvailable, setOnWebsite } from "@/server/products";

/**
 * The product screen's actions.
 *
 * Each checks permission itself — the page did too, but a form post is just a
 * request, and neither the page nor a hidden button stands between it and the
 * database. The form arrives as one JSON field plus an optional photo, and is
 * parsed by a strict schema before anything else looks at it.
 */

function readForm(form: FormData) {
  try {
    return JSON.parse(String(form.get("product") ?? "null")) as unknown;
  } catch {
    return null;
  }
}

export async function saveProductAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const productId = form.get("productId");
  if (productId !== null && !isUuid(productId)) {
    return { ok: false, message: "This product could not be found. Please go back to Products." };
  }

  const parsed = productFormSchema.safeParse(readForm(form));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted boxes.",
      fieldErrors: errorsOf(parsed.error),
    };
  }

  const result = await saveProduct(
    actor,
    typeof productId === "string" ? productId : null,
    parsed.data,
    fileFrom(form, "photo"),
  );
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/products");
  revalidatePath("/");

  // A new product goes straight to its own page, so a second press of Save
  // edits it rather than adding a copy.
  if (productId === null) redirect(`/products/${result.id}?added=1`);

  revalidatePath(`/products/${result.id}`);
  return { ok: true, message: result.message, note: result.note };
}

export async function deleteProductAction(form: FormData): Promise<void> {
  const actor = await requirePermission("catalogue.publish");
  const productId = form.get("productId");
  if (!isUuid(productId)) redirect("/products");

  await deleteProduct(actor, productId);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products?deleted=1");
}

const toggleSchema = z.object({ productId: z.string().uuid(), visible: z.enum(["true", "false"]) }).strict();

export async function toggleOnWebsiteAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.publish");
  const parsed = toggleSchema.safeParse({
    productId: form.get("productId"),
    visible: form.get("visible"),
  });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please try again." };

  const result = await setOnWebsite(actor, parsed.data.productId, parsed.data.visible === "true");
  revalidatePath("/products");
  return { ok: result.ok, message: result.message };
}

const productIdSchema = z.object({ productId: z.string().uuid() }).strict();

/** Delete from the product list: stays on the list, with its search and category. */
export async function deleteFromListAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.publish");
  const parsed = productIdSchema.safeParse({ productId: form.get("productId") });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please try again." };

  const result = await deleteProduct(actor, parsed.data.productId);
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: result.ok, message: result.message };
}

const availableSchema = z.object({ productId: z.string().uuid(), available: z.enum(["true", "false"]) }).strict();

export async function setAvailableAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");
  const parsed = availableSchema.safeParse({
    productId: form.get("productId"),
    available: form.get("available"),
  });
  if (!parsed.success) return { ok: false, message: "Something went wrong. Please try again." };

  const result = await setAvailable(actor, parsed.data.productId, parsed.data.available === "true");
  revalidatePath("/products");
  return { ok: result.ok, message: result.message };
}
