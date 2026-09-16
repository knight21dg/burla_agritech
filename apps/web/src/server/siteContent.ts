import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@burla/core/db";
import { siteSettings } from "@burla/core/db/schema";
import { readHomepage, type Homepage } from "@burla/core/content";
import { getBusinessIdentity } from "@/server/services/settingsService";
import { site } from "@/lib/site";

/**
 * The words and details the owner edits under "Website" and "Settings" in the
 * admin: homepage text, contact details, company information.
 *
 * Cached under one tag, `site`, which the admin clears through the storefront's
 * revalidation endpoint after a save — the same mechanism as the catalogue.
 *
 * Every field falls back to what the site said before it was editable
 * (`lib/site.ts`), so an empty settings row renders the familiar page, and a
 * value that is legally required but not yet supplied keeps saying "to be
 * confirmed" rather than going blank.
 */

export const SITE_TAG = "site";

export interface ContactDetails {
  phone: string;
  /** Digits for tel: links. */
  phoneRaw: string;
  email: string;
  hours: string;
  address: string;
  entityName: string;
  gstin: string;
  fssai: string;
  grievanceOfficer: string;
}

async function loadHomepage(): Promise<Homepage> {
  const [row] = await db
    .select({ homepage: siteSettings.homepage })
    .from(siteSettings)
    .where(eq(siteSettings.singleton, true))
    .limit(1);
  return readHomepage(row?.homepage);
}

async function loadContact(): Promise<ContactDetails> {
  const identity = await getBusinessIdentity();
  const phone = identity.contactPhone ?? site.contact.phone;

  return {
    phone,
    phoneRaw: phone.replace(/[^\d+]/g, ""),
    email: identity.contactEmail ?? site.contact.email,
    hours: identity.businessHours ?? site.contact.hours,
    address: identity.addressLine ?? site.legal.address,
    entityName: identity.entityName ?? site.legal.entityName,
    gstin: identity.gstin ?? site.legal.gstin,
    fssai: identity.fssaiLicenceNumber ?? site.legal.fssai,
    grievanceOfficer: identity.grievanceOfficerName ?? site.legal.grievanceOfficer,
  };
}

export const getHomepage = unstable_cache(loadHomepage, ["site-homepage"], {
  tags: [SITE_TAG],
  revalidate: 300,
});

export const getContact = unstable_cache(loadContact, ["site-contact"], {
  tags: [SITE_TAG],
  revalidate: 300,
});
