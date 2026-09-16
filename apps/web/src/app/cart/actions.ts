"use server";

import { z } from "zod";
import { CATALOGUE_ID, MAX_LINE_QTY } from "@/lib/checkout";
import { listBySlugs, listAllTypes, listCategories } from "@/server/catalogue";
import type { ResolvedLine } from "@/components/cart/lines";

/**
 * Turns the cart the browser is holding into something it can display.
 *
 * The cart stores references only — slug, pack size, quantity — and used to
 * look the rest up in a catalogue that lived in the browser bundle. It does
 * not any more, so the lookup happens here.
 *
 * Three things this deliberately is not:
 *
 *   - **Not a source of truth for money.** What an order costs is decided in
 *     `placeOrder`, which prices every line from the database by SKU inside a
 *     transaction. These prices are for display; editing them in the browser
 *     changes nothing but the browser.
 *   - **Not trusting its input.** Whatever is in `localStorage` may be stale,
 *     hand-edited or from an older version of the site, so it is parsed
 *     strictly and unknown slugs simply vanish from the result.
 *   - **Not cached.** A price or a withdrawal must show immediately, and a
 *     shared cache keyed by cart contents would be both useless and a way for
 *     one person's data to reach another.
 */

const CART_LIMIT = 50;

const lineSchema = z
  .object({
    slug: z.string().regex(CATALOGUE_ID),
    variantId: z.string().regex(CATALOGUE_ID).optional(),
    qty: z.number().int().min(1).max(MAX_LINE_QTY),
  })
  .strict();

const cartSchema = z.array(lineSchema).max(CART_LIMIT);

export async function resolveCart(input: unknown): Promise<ResolvedLine[]> {
  const parsed = cartSchema.safeParse(input);
  if (!parsed.success) return [];

  const lines = parsed.data;
  if (lines.length === 0) return [];

  // One query for the whole cart, and two cached reads for the breadcrumb
  // labels — not one lookup per line.
  const [products, categories, types] = await Promise.all([
    listBySlugs([...new Set(lines.map((line) => line.slug))]),
    listCategories(),
    listAllTypes(),
  ]);

  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    // Withdrawn, unpublished or never existed: it drops out of the cart
    // rather than 404ing the page someone is trying to check out from.
    if (!product) return [];

    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId)
      : undefined;

    return [
      {
        line,
        product,
        variant,
        trail: {
          categoryName: categories.find((c) => c.slug === product.categorySlug)
            ?.name,
          typeName: product.typeSlug
            ? types.find(
                (t) =>
                  t.slug === product.typeSlug &&
                  t.parentSlug === product.categorySlug,
              )?.name
            : undefined,
        },
      },
    ];
  });
}
