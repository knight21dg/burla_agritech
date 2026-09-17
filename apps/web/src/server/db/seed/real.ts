/**
 * REAL SEED — safe to run in production.
 *
 * Everything here traces to something the client supplied:
 *
 *   - the ten top-level categories, from the client's catalogue (2026-09-10)
 *   - the business identity, from the business card
 *
 * Nothing in this file is invented. Where a legally required value has not
 * been supplied it is left NULL, and the site renders "to be confirmed"
 * rather than a plausible-looking guess. The FSSAI licence (`OQ-003`), the
 * registered firm name (`OQ-002`) and the grievance officer (`OQ-005`) are
 * all in that position, and all three block launch.
 *
 * Idempotent, and insert-only: re-running it adds anything missing and changes
 * nothing that exists. Everything it writes is the admin's to edit afterwards.
 *
 * Category names and order remain provisional pending `OQ-013` / `OQ-064`.
 */
import { and, eq, isNull } from "drizzle-orm";
import { categories as sourceCategories } from "./catalogue";
import { site } from "@/lib/site";
import { type Database } from "@burla/core/db";
import { categories, siteSettings } from "@burla/core/db/schema";

export interface SeedResult {
  categoriesInserted: number;
  categoriesUpdated: number;
  settingsWritten: boolean;
}

export async function seedReal(db: Database): Promise<SeedResult> {
  let inserted = 0;
  const updated = 0;

  // The ten categories, in the order they appear in the catalogue.
  //
  // Written one at a time rather than as a bulk upsert: the unique index is on
  // an expression — coalesce(parent_id, nil uuid) — which ON CONFLICT cannot
  // name. Ten rows once per deploy does not need the round trips saved.
  for (const source of sourceCategories) {
    const values = {
      parentId: null,
      name: source.name,
      slug: source.slug,
      shortName: source.shortName,
      heroHeadline: source.heroHeadline,
      description: source.description,
      sortOrder: source.order,
      tone: source.tone,
      status: "published" as const,
      isSample: false,
    };

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.slug, source.slug), isNull(categories.parentId)))
      .limit(1);

    if (existing) {
      // Never overwritten. The admin owns categories now: a name, description
      // or visibility the owner changed must survive the seed running again,
      // which it does on every deploy. The seed's job is to make sure the
      // ten exist, not to decide what they say.
      continue;
    } else {
      await db
        .insert(categories)
        .values({ ...values, publishedAt: new Date() });
      inserted += 1;
    }
  }

  // Business identity, from the business card. A singleton row.
  //
  // This is the data that moves out of lib/site.ts so the client can edit it
  // without a deploy — docs/DATA-OWNERSHIP.md §3. Until the admin exists, the
  // seed is how it gets there.
  await db
    .insert(siteSettings)
    .values({
      singleton: true,
      // OQ-002. The placeholder text is kept verbatim so the site keeps
      // saying "to be confirmed" rather than quietly showing a blank.
      entityName: null,
      addressLine: site.legal.address,
      gstin: site.legal.gstin,
      fssaiLicenceNumber: null, // OQ-003 — blocking. Never guessed.
      contactPhone: site.contact.phone,
      contactEmail: site.contact.email,
      businessHours: null, // OQ-024
      whatsappNumber: site.whatsapp,
      grievanceOfficerName: null, // OQ-005 — blocking
      grievanceOfficerEmail: null,
      grievanceOfficerPhone: null,
      partners: site.legal.partners,
      socialLinks: null, // OQ-025
    })
    // Only the first time. The owner edits these in the admin; a deploy that
    // put the business card's phone number back over theirs would be a bug
    // nobody notices until a customer calls the old number.
    .onConflictDoNothing({ target: siteSettings.singleton });

  return {
    categoriesInserted: inserted,
    categoriesUpdated: updated,
    settingsWritten: true,
  };
}
