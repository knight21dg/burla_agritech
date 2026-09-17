"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/formState";
import { errorsOf } from "@/lib/productForm";
import { requirePermission } from "@/server/auth/session";
import { homepageSchema, offerStripSchema, saveHomepage, saveOfferStrip, setFeatured } from "@/server/website";

export async function saveHomepageAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("content.write");
  const parsed = homepageSchema.safeParse({
    heroHeading: form.get("heroHeading"),
    heroText: form.get("heroText"),
    aboutHeading: form.get("aboutHeading"),
    aboutText: form.get("aboutText"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted boxes.", fieldErrors: errorsOf(parsed.error) };
  }
  const result = await saveHomepage(actor, parsed.data);
  revalidatePath("/website");
  return result;
}

const featuredSchema = z.object({ productId: z.string().uuid(), featured: z.enum(["true", "false"]) }).strict();

export async function setFeaturedAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("content.write");
  const parsed = featuredSchema.safeParse({ productId: form.get("productId"), featured: form.get("featured") });
  if (!parsed.success) return { ok: false, message: "Please choose a product first." };

  const result = await setFeatured(actor, parsed.data.productId, parsed.data.featured === "true");
  revalidatePath("/website");
  revalidatePath("/products");
  return result;
}

export async function saveOfferStripAction(_previous: FormState, form: FormData): Promise<FormState> {
  const actor = await requirePermission("content.write");
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(form.get("offerStrip") ?? "null"));
  } catch {
    raw = null;
  }
  const parsed = offerStripSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted boxes.", fieldErrors: errorsOf(parsed.error) };
  }
  const result = await saveOfferStrip(actor, parsed.data);
  revalidatePath("/website");
  return result;
}
