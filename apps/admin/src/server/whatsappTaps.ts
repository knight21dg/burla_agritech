import "server-only";
import { count, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@burla/core/db";
import { categories, products, whatsappTaps } from "@burla/core/db/schema";
import { pageName, placeName } from "@/lib/whatsappTaps";

/**
 * Taps on the website's WhatsApp buttons, for the Enquiries screen.
 *
 * The conversation itself is in the owner's WhatsApp; this shows only where
 * people reached for it and when.
 */

export const TAPS_PAGE_SIZE = 50;

/** Midnight today in India, as an instant. */
function startOfTodayIst(): Date {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

export async function tapCountLastWeek(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(whatsappTaps)
    .where(gte(whatsappTaps.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  return row?.n ?? 0;
}

export async function listTaps(pageNumber: number) {
  const page = Math.max(1, pageNumber);
  const today = startOfTodayIst();

  const [rows, [total], [todayCount], lastWeek] = await Promise.all([
    db
      .select({
        id: whatsappTaps.id,
        place: whatsappTaps.place,
        pagePath: whatsappTaps.pagePath,
        productName: products.name,
        createdAt: whatsappTaps.createdAt,
      })
      .from(whatsappTaps)
      .leftJoin(products, eq(products.id, whatsappTaps.productId))
      .orderBy(desc(whatsappTaps.createdAt))
      .limit(TAPS_PAGE_SIZE)
      .offset((page - 1) * TAPS_PAGE_SIZE),
    db.select({ n: count() }).from(whatsappTaps),
    db.select({ n: count() }).from(whatsappTaps).where(gte(whatsappTaps.createdAt, today)),
    tapCountLastWeek(),
  ]);

  // Category pages are named by their category, looked up once for the page.
  const categorySlugs = [
    ...new Set(
      rows.flatMap((row) => {
        const slug = row.pagePath.match(/^\/products\/([a-z0-9-]+)\/?$/)?.[1];
        return slug ? [slug] : [];
      }),
    ),
  ];
  const categoryNames = new Map(
    categorySlugs.length
      ? (
          await db
            .select({ slug: categories.slug, name: categories.name })
            .from(categories)
            .where(inArray(categories.slug, categorySlugs))
        ).map((row) => [row.slug, row.name])
      : [],
  );

  return {
    rows: rows.map((row) => ({
      id: row.id,
      page: pageName(row.pagePath, row.productName, categoryNames),
      button: placeName(row.place),
      createdAt: row.createdAt,
    })),
    total: total?.n ?? 0,
    today: todayCount?.n ?? 0,
    lastWeek,
  };
}
