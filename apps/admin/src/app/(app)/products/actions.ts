"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { productDetailsSchema, variantsSchema } from "@/lib/product";
import { requirePermission } from "@/server/auth/session";
import * as catalogueService from "@/server/services/catalogueService";

/**
 * The product editor's actions.
 *
 * Each one re-checks the permission itself. The page that rendered the form
 * checked too, and the navigation hid the link from anyone who could not use
 * it — but a form post is just an HTTP request, and neither of those is
 * standing between it and the database. This is (docs/AUTHORIZATION.md §1).
 *
 * Input is parsed by a strict schema before it reaches a service, so a payload
 * carrying `status`, `isSample` or `id` is refused rather than absorbed.
 */

export interface FormState {
  ok?: boolean;
  message?: string;
  /** Shown quieter than an error: the save worked, something else did not. */
  note?: string;
  fieldErrors?: Record<string, string>;
  details?: string[];
}

const idSchema = z.string().uuid();

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function saveProductDetails(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const productId = idSchema.safeParse(form.get("productId"));
  if (!productId.success) return { ok: false, message: "That product id is not valid." };

  const parsed = productDetailsSchema.safeParse({
    name: form.get("name"),
    slug: form.get("slug"),
    categoryId: form.get("categoryId"),
    typeId: form.get("typeId") ?? "",
    shortDescriptor: form.get("shortDescriptor") ?? "",
    description: form.get("description") ?? "",
    seoTitle: form.get("seoTitle") ?? "",
    seoDescription: form.get("seoDescription") ?? "",
    featured: form.get("featured") === "on",
    sortOrder: form.get("sortOrder") ?? 0,
    expectedUpdatedAt: form.get("expectedUpdatedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Some of these need correcting.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await catalogueService.updateProductDetails(
    actor,
    productId.data,
    parsed.data,
  );

  if (!result.ok) return { ok: false, message: result.message, details: result.details };

  revalidatePath(`/products/${productId.data}`);
  revalidatePath("/products");
  return { ok: true, message: result.message, note: result.staleCache };
}

export async function saveVariants(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const productId = idSchema.safeParse(form.get("productId"));
  if (!productId.success) return { ok: false, message: "That product id is not valid." };

  // The editor is a dynamic list, so it posts one JSON field rather than
  // thirty indexed ones. It is parsed exactly as strictly either way.
  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("variants") ?? "[]"));
  } catch {
    return { ok: false, message: "The pack sizes did not arrive intact. Try again." };
  }

  const parsed = variantsSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Some pack sizes need correcting.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await catalogueService.replaceVariants(actor, productId.data, parsed.data);
  if (!result.ok) return { ok: false, message: result.message, details: result.details };

  revalidatePath(`/products/${productId.data}`);
  revalidatePath("/products");
  return { ok: true, message: result.message, note: result.staleCache };
}

const statusSchema = z.enum(["draft", "published", "archived"]);

export async function changeStatus(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  // Publishing is its own capability: editing a description and deciding it
  // goes in front of customers are different jobs.
  const actor = await requirePermission("catalogue.publish");

  const productId = idSchema.safeParse(form.get("productId"));
  const status = statusSchema.safeParse(form.get("status"));
  if (!productId.success || !status.success) {
    return { ok: false, message: "That request was not valid." };
  }

  const result = await catalogueService.setProductStatus(actor, productId.data, status.data);
  if (!result.ok) return { ok: false, message: result.message, details: result.details };

  revalidatePath(`/products/${productId.data}`);
  revalidatePath("/products");
  return { ok: true, message: result.message, note: result.staleCache };
}

export async function toggleFeatured(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requirePermission("catalogue.write");

  const productId = idSchema.safeParse(form.get("productId"));
  if (!productId.success) return { ok: false, message: "That request was not valid." };

  const result = await catalogueService.setFeatured(
    actor,
    productId.data,
    form.get("featured") === "true",
  );
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath(`/products/${productId.data}`);
  revalidatePath("/products");
  return { ok: true, message: result.message, note: result.staleCache };
}
