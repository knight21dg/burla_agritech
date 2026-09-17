import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@burla/core/db";
import { passwordCredentials, products, sessions, siteSettings } from "@burla/core/db/schema";
import { hashPassword, verifyPassword } from "@burla/core/auth";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import {
  HOMEPAGE_DEFAULTS,
  homepageSchema,
  offerStripSchema,
  readHomepage,
  readOfferStrip,
  type Homepage,
  type OfferStrip,
} from "@burla/core/content";
import { revalidateStorefront } from "@/server/storefront";

/**
 * The words on the website, the business's details, and the owner's own
 * password — everything under "Website" and "Settings".
 *
 * All of it lives in the single settings row. Each save writes only the
 * fields its form shows, so saving the homepage words can never blank the
 * GSTIN, and the other way round.
 */

async function ensureRow() {
  await db.insert(siteSettings).values({ singleton: true }).onConflictDoNothing({ target: siteSettings.singleton });
}

// --- homepage ----------------------------------------------------------------

export async function getHomepage(): Promise<Homepage> {
  const [row] = await db
    .select({ homepage: siteSettings.homepage })
    .from(siteSettings)
    .where(eq(siteSettings.singleton, true))
    .limit(1);
  return readHomepage(row?.homepage);
}

export { HOMEPAGE_DEFAULTS, homepageSchema };

export async function saveHomepage(actor: Actor, homepage: Homepage) {
  requireCapability(actor, "content.write");
  await ensureRow();

  const before = await getHomepage();
  await db.transaction(async (tx) => {
    // Merged into the stored object, so the offer strip kept beside the words survives.
    await tx
      .update(siteSettings)
      .set({ homepage: sql`coalesce(${siteSettings.homepage}, '{}'::jsonb) || ${JSON.stringify(homepage)}::jsonb` })
      .where(eq(siteSettings.singleton, true));
    await writeAudit(tx, actor, {
      action: "website.homepage_saved",
      entityType: "website",
      changes: Object.fromEntries(
        (Object.keys(homepage) as (keyof Homepage)[])
          .filter((key) => before[key] !== homepage[key])
          .map((key) => [key, { from: before[key], to: homepage[key] }]),
      ),
    });
  });

  const told = await revalidateStorefront({ catalogue: false, site: true });
  return { ok: true as const, message: "Saved. The homepage now shows your words.", note: told.ok ? undefined : "The website may take up to five minutes to show the change." };
}

// --- offer strip -------------------------------------------------------------

export { offerStripSchema };

export async function getOfferStrip(): Promise<OfferStrip> {
  const [row] = await db
    .select({ homepage: siteSettings.homepage })
    .from(siteSettings)
    .where(eq(siteSettings.singleton, true))
    .limit(1);
  return readOfferStrip((row?.homepage as Record<string, unknown> | null | undefined)?.offerStrip);
}

/** The scrolling offers under the website's header. Written under its own key. */
export async function saveOfferStrip(actor: Actor, strip: OfferStrip) {
  requireCapability(actor, "content.write");
  await ensureRow();

  await db.transaction(async (tx) => {
    await tx
      .update(siteSettings)
      .set({
        homepage: sql`coalesce(${siteSettings.homepage}, '{}'::jsonb) || jsonb_build_object('offerStrip', ${JSON.stringify(strip)}::jsonb)`,
      })
      .where(eq(siteSettings.singleton, true));
    await writeAudit(tx, actor, {
      action: "website.offers_saved",
      entityType: "website",
      changes: { visible: strip.visible, offers: strip.offers.map((offer) => offer.title) },
    });
  });

  const told = await revalidateStorefront({ catalogue: false, site: true });
  return {
    ok: true as const,
    message: strip.visible ? "Saved. The offers on the website are updated." : "Saved. The offer strip is hidden from the website.",
    note: told.ok ? undefined : "The website may take up to five minutes to show the change.",
  };
}

// --- featured products -------------------------------------------------------

export async function listHomepageProducts() {
  const rows = await db
    .select({ id: products.id, name: products.name, featured: products.featured, status: products.status })
    .from(products)
    .where(ne(products.status, "archived"))
    .orderBy(asc(products.name));

  return {
    featured: rows.filter((row) => row.featured),
    // Only products customers can see make sense on the homepage.
    available: rows.filter((row) => !row.featured && row.status === "published"),
  };
}

export async function setFeatured(actor: Actor, productId: string, featured: boolean) {
  requireCapability(actor, "content.write");

  const [product] = await db
    .select({ name: products.name, slug: products.slug, status: products.status })
    .from(products)
    .where(and(eq(products.id, productId), ne(products.status, "archived")))
    .limit(1);
  if (!product) return { ok: false as const, message: "That product could not be found." };
  if (featured && product.status !== "published") {
    return { ok: false as const, message: `${product.name} is hidden from the website, so it cannot go on the homepage.` };
  }

  await db.transaction(async (tx) => {
    await tx.update(products).set({ featured }).where(eq(products.id, productId));
    await writeAudit(tx, actor, {
      action: featured ? "product.on_homepage" : "product.off_homepage",
      entityType: "product",
      entityId: productId,
      changes: { name: product.name },
    });
  });

  await revalidateStorefront({ catalogue: true, productSlug: product.slug });
  return {
    ok: true as const,
    message: featured ? `${product.name} is now on the homepage.` : `${product.name} was taken off the homepage.`,
  };
}

// --- business details -------------------------------------------------------

const optional = (max: number, message = "Please keep this shorter.") =>
  z.string().trim().max(max, message);

export const businessSchema = z
  .object({
    contactPhone: optional(30),
    contactEmail: z
      .string()
      .trim()
      .max(254)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address."),
    businessHours: optional(120),
    addressLine: optional(300),
    entityName: optional(160),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => v === "" || /^[0-9A-Z]{15}$/.test(v), "A GSTIN is 15 letters and numbers."),
    fssaiLicenceNumber: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{14}$/.test(v), "An FSSAI licence number is 14 digits."),
    grievanceOfficerName: optional(120),
    grievanceOfficerEmail: z
      .string()
      .trim()
      .max(254)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address."),
    grievanceOfficerPhone: optional(30),
  })
  .strict();

export type Business = z.infer<typeof businessSchema>;

export async function getBusiness(): Promise<Business> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.singleton, true)).limit(1);
  return {
    contactPhone: row?.contactPhone ?? "",
    contactEmail: row?.contactEmail ?? "",
    businessHours: row?.businessHours ?? "",
    addressLine: row?.addressLine ?? "",
    entityName: row?.entityName ?? "",
    gstin: row?.gstin ?? "",
    fssaiLicenceNumber: row?.fssaiLicenceNumber ?? "",
    grievanceOfficerName: row?.grievanceOfficerName ?? "",
    grievanceOfficerEmail: row?.grievanceOfficerEmail ?? "",
    grievanceOfficerPhone: row?.grievanceOfficerPhone ?? "",
  };
}

export async function saveBusiness(actor: Actor, business: Business) {
  requireCapability(actor, "settings.write");
  await ensureRow();

  const before = await getBusiness();
  // Empty means "not given": stored as NULL, so the website keeps saying
  // "to be confirmed" rather than showing a blank.
  const values = Object.fromEntries(
    Object.entries(business).map(([key, value]) => [key, value === "" ? null : value]),
  ) as Record<keyof Business, string | null>;

  await db.transaction(async (tx) => {
    await tx.update(siteSettings).set(values).where(eq(siteSettings.singleton, true));
    await writeAudit(tx, actor, {
      action: "settings.business_saved",
      entityType: "settings",
      changes: Object.fromEntries(
        (Object.keys(business) as (keyof Business)[])
          .filter((key) => before[key] !== business[key])
          .map((key) => [key, { from: before[key], to: business[key] }]),
      ),
    });
  });

  const told = await revalidateStorefront({ catalogue: false, site: true });
  return { ok: true as const, message: "Saved.", note: told.ok ? undefined : "The website may take up to five minutes to show the change." };
}

// --- the owner's password ------------------------------------------------------

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password.").max(128),
    next: z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters."),
    again: z.string().max(128),
  })
  .strict()
  .refine((form) => form.next === form.again, { path: ["again"], message: "The two new passwords do not match." });

export async function changePassword(
  actor: Actor,
  form: z.infer<typeof passwordSchema>,
): Promise<{ ok: boolean; message: string; fieldErrors?: Record<string, string> }> {
  if (actor.kind !== "user") return { ok: false, message: "Please sign in again." };

  const [row] = await db
    .select({ hash: passwordCredentials.passwordHash })
    .from(passwordCredentials)
    .where(eq(passwordCredentials.userId, actor.userId))
    .limit(1);
  if (!row || !(await verifyPassword(form.current, row.hash))) {
    const message = "That is not your current password.";
    return { ok: false, message, fieldErrors: { current: message } };
  }

  const hash = await hashPassword(form.next);
  await db.transaction(async (tx) => {
    await tx
      .update(passwordCredentials)
      .set({ passwordHash: hash, passwordChangedAt: new Date() })
      .where(eq(passwordCredentials.userId, actor.userId));
    // Signed out everywhere else: if the old password was known to someone,
    // their sessions end now. This browser stays signed in.
    await tx
      .delete(sessions)
      .where(and(eq(sessions.userId, actor.userId), ne(sessions.id, actor.sessionId)));
    // Never the password, old or new — only that it changed.
    await writeAudit(tx, actor, { action: "account.password_changed", entityType: "user", entityId: actor.userId });
  });

  return { ok: true, message: "Password changed. You have been signed out on every other device." };
}
