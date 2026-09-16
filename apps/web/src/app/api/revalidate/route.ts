import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { env } from "@burla/core/env";

/**
 * "This product changed — drop it from your cache."
 *
 * ## Why this is an HTTP endpoint and not a function call
 *
 * The admin is a separate application on a separate origin, which was a
 * deliberate security decision (SECURITY.md §3.1). Its Next cache is its own:
 * `revalidateTag` called inside the admin invalidates the admin's cache and
 * does nothing whatever to the storefront's. So the storefront has to be told,
 * and being told over HTTP with a shared secret is the whole mechanism.
 *
 * Without it, an admin edit would sit invisible behind a cached page until the
 * safety net expired — which is the failure this phase exists to prevent.
 *
 * ## What it will and will not do
 *
 * Only catalogue tags, matched against a pattern. A caller cannot ask for
 * arbitrary strings, so a leaked secret buys someone the ability to make the
 * storefront re-read its own database — a nuisance, not a breach. It never
 * reads or returns data, and it never touches customer or order caches,
 * because none exist: nothing personal is cached (`server/catalogue.ts`).
 */

const tagSchema = z.union([
  z.literal("catalogue"),
  z.string().regex(/^product:[a-z0-9-]{1,80}$/),
  z.string().regex(/^category:[a-z0-9-]{1,80}$/),
]);

const bodySchema = z.object({ tags: z.array(tagSchema).min(1).max(50) }).strict();

/** Constant-time, and length-safe: `timingSafeEqual` throws on a mismatch. */
function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const secret = env.REVALIDATE_SECRET;

  // Not configured: the endpoint does not exist as far as anyone can tell.
  // Advertising "this is switched off" tells an attacker what to come back for.
  if (!secret) return new Response(null, { status: 404 });

  if (!secretMatches(request.headers.get("x-revalidate-secret"), secret)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    // No issue detail: the caller is our own admin and knows the shape.
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // `{ expire: 0 }` — gone now, not "stale after a while". The admin has
  // already written the change; a delay here is a staff member refreshing the
  // public page and wondering whether the save worked.
  for (const tag of parsed.data.tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: parsed.data.tags });
}
