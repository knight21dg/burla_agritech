/**
 * Business identity, read from the database rather than from a TypeScript file.
 *
 * This is the second half of the `lib/site.ts` split (docs/DATA-OWNERSHIP.md
 * §3): navigation and structural copy stay in code, because they are layout;
 * the address, GSTIN, FSSAI licence and grievance officer come from
 * `site_settings`, because the client edits them and a deploy should not be
 * required to fix a phone number.
 *
 * Every field is optional in the read model. Three of them — the registered
 * firm name (`OQ-002`), the FSSAI licence (`OQ-003`) and the grievance officer
 * (`OQ-005`) — are legally required before launch and are not yet supplied.
 * They come back undefined, and the UI renders its existing "to be confirmed"
 * placeholder. Nothing here invents a value.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { siteSettings } from "@/server/db/schema";

export interface Partner {
  name: string;
  role: string;
}

export interface BusinessIdentity {
  entityName?: string;
  addressLine?: string;
  gstin?: string;
  fssaiLicenceNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessHours?: string;
  whatsappNumber?: string;
  grievanceOfficerName?: string;
  grievanceOfficerEmail?: string;
  grievanceOfficerPhone?: string;
  partners: Partner[];
}

/** Turns a nullable column into an absent key, so `??` at the call site works. */
function present(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Partners are stored as jsonb, so the shape is not guaranteed by the schema.
 * Validated on the way out rather than trusted: a malformed row should render
 * nothing, not crash the footer on every page of the site.
 */
function toPartners(value: unknown): Partner[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : undefined;
    const role = typeof record.role === "string" ? record.role : undefined;
    return name && role ? [{ name, role }] : [];
  });
}

/**
 * The singleton settings row.
 *
 * Returns an empty identity when the row does not exist — an unseeded database
 * should render placeholders, not a 500. The seed creates it, and `db:verify`
 * is where a missing row becomes a deploy failure.
 */
export async function getBusinessIdentity(): Promise<BusinessIdentity> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.singleton, true))
    .limit(1);

  if (!row) return { partners: [] };

  return {
    entityName: present(row.entityName),
    addressLine: present(row.addressLine),
    gstin: present(row.gstin),
    fssaiLicenceNumber: present(row.fssaiLicenceNumber),
    contactPhone: present(row.contactPhone),
    contactEmail: present(row.contactEmail),
    businessHours: present(row.businessHours),
    whatsappNumber: present(row.whatsappNumber),
    grievanceOfficerName: present(row.grievanceOfficerName),
    grievanceOfficerEmail: present(row.grievanceOfficerEmail),
    grievanceOfficerPhone: present(row.grievanceOfficerPhone),
    partners: toPartners(row.partners),
  };
}
