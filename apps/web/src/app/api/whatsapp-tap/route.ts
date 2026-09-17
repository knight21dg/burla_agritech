import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@burla/core/db";
import { WHATSAPP_PLACES, products, whatsappTaps } from "@burla/core/db/schema";
import { createRateLimiter } from "@burla/core/auth";
import { env } from "@burla/core/env";

/**
 * POST /api/whatsapp-tap — someone tapped a WhatsApp button.
 *
 * The chat goes straight from their phone to WhatsApp; this only notes which
 * button, on which page, and when, so the owner can see it in the admin.
 *
 * It always answers 204 and never says why a tap was not kept, so it teaches
 * nothing to anyone poking at it. A tap is not kept when:
 *   - the request did not come from this website's own pages;
 *   - the body is anything but the two expected fields;
 *   - the same visitor tapped the same button on the same page in the last
 *     ten minutes (one conversation, not five rows);
 *   - one address has sent more than 30 in an hour.
 */

const bodySchema = z
  .object({
    place: z.enum(WHATSAPP_PLACES),
    path: z
      .string()
      .max(200)
      .regex(/^\/[A-Za-z0-9\-._~/]*$/),
  })
  .strict();

const limiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxFailures: 30 });
const REPEAT_MS = 10 * 60 * 1000;

const done = () => new Response(null, { status: 204 });

function sameSite(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameSite(request)) return done();

  const text = await request.text();
  if (text.length > 500) return done();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return done();
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return done();
  const { place, path } = parsed.data;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256")
    .update(`${env.IP_HASH_SALT ?? "local-development"}:${ip}`)
    .digest("hex");

  if (limiter.isLockedOut(ipHash)) return done();
  limiter.recordFailure(ipHash);

  try {
    const [recent] = await db
      .select({ id: whatsappTaps.id })
      .from(whatsappTaps)
      .where(
        and(
          eq(whatsappTaps.ipHash, ipHash),
          eq(whatsappTaps.place, place),
          eq(whatsappTaps.pagePath, path),
          gt(whatsappTaps.createdAt, new Date(Date.now() - REPEAT_MS)),
        ),
      )
      .limit(1);
    if (recent) return done();

    const slug = path.match(/^\/products\/p\/([a-z0-9-]+)\/?$/)?.[1];
    const [product] = slug
      ? await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1)
      : [];

    await db.insert(whatsappTaps).values({ place, pagePath: path, productId: product?.id ?? null, ipHash });
  } catch (error) {
    // A lost tap must never break the website; note it without details.
    console.error("whatsapp-tap: could not save", error instanceof Error ? error.name : "unknown");
  }
  return done();
}
