"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/formState";
import { isUuid } from "@/lib/ids";
import { errorsOf } from "@/lib/productForm";
import { requirePermission } from "@/server/auth/session";
import { fileFrom } from "@/server/photos";
import {
  addSubcategory,
  categoryFormSchema,
  deleteSubcategory,
  saveCategory,
  updateSubcategory,
} from "@/server/categories";

/**
 * Category actions. Each checks permission itself and parses its input
 * strictly before the service sees it.
 */

export async function saveCategoryAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const categoryId = form.get("categoryId");
  if (categoryId !== null && !isUuid(categoryId)) {
    return { ok: false, message: "This category could not be found. Please go back to Categories." };
  }

  let body: unknown = null;
  try {
    body = JSON.parse(String(form.get("category") ?? "null"));
  } catch {
    body = null;
  }
  const parsed = categoryFormSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted boxes.", fieldErrors: errorsOf(parsed.error) };
  }

  const result = await saveCategory(
    actor,
    typeof categoryId === "string" ? categoryId : null,
    parsed.data,
    fileFrom(form, "photo"),
  );
  if (!result.ok) return { ok: false, message: result.message, fieldErrors: result.fieldErrors };

  revalidatePath("/categories");
  if (categoryId === null) redirect(`/categories/${result.id}?added=1`);
  revalidatePath(`/categories/${result.id}`);
  return { ok: true, message: result.message };
}

export async function addSubcategoryAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");
  const parentId = form.get("categoryId");
  if (!isUuid(parentId)) return { ok: false, message: "This category could not be found." };

  const result = await addSubcategory(actor, parentId, String(form.get("name") ?? ""));
  if (result.ok) revalidatePath(`/categories/${parentId}`);
  return { ok: result.ok, message: result.message };
}

export async function updateSubcategoryAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");
  const id = form.get("subcategoryId");
  const parentId = form.get("categoryId");
  if (!isUuid(id) || !isUuid(parentId)) return { ok: false, message: "That subcategory could not be found." };

  const visible = form.get("visible");
  const name = form.get("name");
  const result = await updateSubcategory(actor, id, {
    ...(typeof name === "string" ? { name } : {}),
    ...(visible === "true" || visible === "false" ? { visible: visible === "true" } : {}),
  });
  if (result.ok) revalidatePath(`/categories/${parentId}`);
  return { ok: result.ok, message: result.message };
}

export async function deleteSubcategoryAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");
  const id = form.get("subcategoryId");
  const parentId = form.get("categoryId");
  if (!isUuid(id) || !isUuid(parentId)) return { ok: false, message: "That subcategory could not be found." };

  const result = await deleteSubcategory(actor, id);
  if (result.ok) revalidatePath(`/categories/${parentId}`);
  return { ok: result.ok, message: result.message };
}
