import "server-only";
import { env } from "@burla/core/env";

/**
 * Telling the shop that something changed.
 *
 * The admin and the storefront are separate deployments, so they have separate
 * Next caches. `revalidateTag` here would drop an entry from *this*
 * application's cache and do nothing whatever to the public site: the page a
 * customer sees would keep its old price until the five-minute safety net
 * expired. So the shop exposes an endpoint, and this is the only thing that
 * calls it.
 *
 * Deliberately best-effort. A write has already committed by the time this
 * runs; if the shop is briefly unreachable, the edit is still saved and the
 * page is at most five minutes behind. Throwing here would turn "the cache
 * did not clear" into "your save failed", which is both untrue and worse.
 */

/** What to invalidate after a write. Mirrors the tags in the storefront. */
export interface RevalidateTargets {
  /** Every listing — always, because any change moves something in a list. */
  catalogue?: boolean;
  /** The product's own page. */
  productSlug?: string;
  /** A category or type page and its listings. */
  categorySlug?: string;
  /** Homepage words, contact details and company information. */
  site?: boolean;
}

export async function revalidateStorefront(
  targets: RevalidateTargets,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = env.REVALIDATE_SECRET;
  const base = env.STOREFRONT_URL;

  if (!secret || !base) {
    // Local development without the pair configured. Say so once, at the call
    // site's log level, rather than failing a save.
    return { ok: false, reason: "REVALIDATE_SECRET or STOREFRONT_URL is not set" };
  }

  const tags = [
    ...(targets.catalogue === false ? [] : ["catalogue"]),
    ...(targets.productSlug ? [`product:${targets.productSlug}`] : []),
    ...(targets.categorySlug ? [`category:${targets.categorySlug}`] : []),
    ...(targets.site ? ["site"] : []),
  ];
  if (tags.length === 0) return { ok: true };

  try {
    const response = await fetch(new URL("/api/revalidate", base), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags }),
      // The shop is a second or two away at worst. Waiting longer holds up a
      // staff member watching a spinner for no benefit.
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { ok: false, reason: `storefront returned ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "unreachable",
    };
  }
}
