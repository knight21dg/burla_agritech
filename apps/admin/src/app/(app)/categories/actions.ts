"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categorySchema, categoryStatusSchema, newCategorySchema } from "@/lib/taxonomy";
import { requirePermission } from "@/server/auth/session";
import * as taxonomyService from "@/server/services/taxonomyService";
import type { FormState } from "@/app/(app)/products/actions";

/**
 * Category and type actions.
 *
 * Same shape as the product actions, and for the same reasons: the permission
 * is checked here as well as in the service, the input is parsed by a strict
 * schema before a service sees it, and the two write paths that change what
 * the public site shows tell it so afterwards.
 */

const idSchema = z.string().uuid();

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

function read(form: FormData) {
  return {
    name: form.get("name"),
    slug: form.get("slug"),
    shortName: form.get("shortName") ?? "",
    heroHeadline: form.get("heroHeadline") ?? "",
    description: form.get("description") ?? "",
    seoTitle: form.get("seoTitle") ?? "",
    seoDescription: form.get("seoDescription") ?? "",
    tone: form.get("tone") ?? "cream",
    sortOrder: form.get("sortOrder") ?? 0,
  };
}

export async function createCategory(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const parsed = newCategorySchema.safeParse({
    ...read(form),
    parentId: form.get("parentId") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Some of these need correcting.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await taxonomyService.createCategory(actor, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/categories");
  // Straight into the new row's own page: the next thing anyone wants is to
  // fill in the rest of it.
  redirect(`/categories/${result.id}`);
}

export async function saveCategory(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const id = idSchema.safeParse(form.get("categoryId"));
  if (!id.success) return { ok: false, message: "That request was not valid." };

  const parsed = categorySchema.safeParse({
    ...read(form),
    expectedUpdatedAt: form.get("expectedUpdatedAt"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Some of these need correcting.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await taxonomyService.updateCategory(actor, id.data, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/categories");
  revalidatePath(`/categories/${id.data}`);
  return { ok: true, message: result.message, note: result.staleCache };
}

export async function changeCategoryStatus(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.publish");

  const id = idSchema.safeParse(form.get("categoryId"));
  const status = categoryStatusSchema.safeParse(form.get("status"));
  if (!id.success || !status.success) {
    return { ok: false, message: "That request was not valid." };
  }

  const result = await taxonomyService.setCategoryStatus(actor, id.data, status.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/categories");
  revalidatePath(`/categories/${id.data}`);
  return { ok: true, message: result.message, note: result.staleCache };
}

export async function deleteCategory(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const id = idSchema.safeParse(form.get("categoryId"));
  if (!id.success) return { ok: false, message: "That request was not valid." };

  const result = await taxonomyService.deleteCategory(actor, id.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/categories");
  redirect("/categories");
}
