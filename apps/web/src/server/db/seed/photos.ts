import { statSync } from "node:fs";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { staticKey } from "@burla/core/media";
import { type Database } from "@burla/core/db";
import { categories, media, productImages, products } from "@burla/core/db/schema";

/**
 * The photographs the client supplied, registered in the database.
 *
 * They ship with the site, in `public/images/`, and stay there — nothing is
 * copied. Each gets a `media` row pointing at its file, and becomes its
 * product's primary photo or its category's picture. From then on the
 * database decides what every page shows, so the owner can change or remove
 * any of them from the admin, and the site follows.
 *
 * Insert-only, like the rest of the real seed, and it runs once per photo:
 * once a supplied photo's file has a `media` row, it is never registered or
 * attached again. So a photo the owner removed stays removed, and one they
 * replaced stays replaced, however often the seed runs. (Removing a photo
 * unlinks it; the row for a file that ships with the site is kept, and that
 * row is the memory that it was already handled.)
 *
 * Moved here from `lib/imagery.ts`, which used to be the only place these
 * mappings existed. Alt text describes what each photograph shows and nothing
 * more (client sheets of 2026-09-10; `assets/products/`, `assets/categories/`).
 */

const PRODUCT_PHOTOS: [slug: string, alt: string][] = [
  ["dehydrated-fruits-apple", "Wooden bowl of dried apple slices with fresh apples"],
  ["dehydrated-fruits-papaya", "Wooden bowl of dried papaya strips with a halved papaya"],
  ["dehydrated-fruits-mango", "Wooden bowl of dried mango slices with a fresh mango, cut and whole"],
  ["dehydrated-fruits-pineapple", "Wooden bowl of dried pineapple rings with a fresh pineapple"],
  ["dehydrated-fruits-sapota", "Wooden bowl of dried sapota slices with fresh sapota"],
  ["dehydrated-fruits-honey", "Jar of honey with a bowl of honey, a honey dipper, honeycomb and white flowers"],
  ["tomato-pickle", "Jar of Tomato Pickle and a bowl of it, with fresh tomatoes"],
  ["gongura-pickle", "Jar of Gongura Pickle and a bowl of it, with gongura leaves"],
  ["garlic-pickle", "Jar of Garlic Pickle and a bowl of it, with garlic bulbs and cloves"],
  ["mango-pickle", "Jar of Mango Pickle and a bowl of it, with green mangoes"],
  ["chicken-pickle", "Jar of Chicken Pickle and a bowl of it, with raw chicken, red chillies and peppercorns"],
  ["prawns-pickle", "Jar of Prawns Pickle and a bowl of it, with prawns, red chillies and peppercorns"],
  ["mutton-pickle", "Jar of Mutton Pickle and a bowl of it, with raw mutton, red chillies and peppercorns"],
  ["kandi-powder", "Wooden bowl of kandi powder with a sack of split yellow lentils"],
  ["chana-powder", "Wooden bowl of chana powder with a sack of chickpeas"],
  ["avise-powder", "Wooden bowl of avise powder with a scoop of brown seeds and blue flowers"],
  ["sesame-seed-nuvvulu", "Wooden bowl of powder with a bowl and a scoop of sesame seeds"],
  ["rice-vadialu", "Wooden bowl of rice vadialu with a sack of rice"],
  ["gummadi-vadialu", "Wooden bowl of gummadi vadialu with a cut pumpkin"],
  ["saggubiyyam", "Wooden bowl of saggubiyyam crisps with a scoop of white pearls"],
  ["minapa-vadialu", "Wooden bowl of minapa vadialu with a small bowl of whole lentils"],
  ["badam", "Wooden bowl of almonds with green leaves"],
  ["pista", "Wooden bowl of pistachios in their shells"],
  ["cashews", "Wooden bowl of cashews with green leaves"],
  ["dates", "Wooden bowl of dates with green leaves"],
  ["foxtail-korralu-powder", "Wooden bowl of Foxtail / Korralu powder with millet stalks and a scoop of grain"],
  ["little-samalu-powder", "Wooden bowl of Little / Samalu powder with millet stalks and a scoop of grain"],
  ["kodo-arikalu-powder", "Wooden bowl of Kodo / Arikalu powder with millet stalks and a scoop of grain"],
  ["barnyard-udalu-powder", "Wooden bowl of Barnyard / Udalu powder with millet stalks and a scoop of grain"],
  ["andukorralu-powder", "Wooden bowl of Andukorralu powder with millet stalks and a scoop of grain"],
  ["herbal-tea-powder", "Wooden bowl of herbal tea powder with ginger, lemongrass, fresh leaves and loose tea"],
  ["masala-tea-powder", "Wooden bowl of masala tea powder with cinnamon, cardamom, cloves and ginger"],
  ["lemon-tea-powder", "Wooden bowl of lemon tea powder with lemons and loose tea"],
  ["green-tea-powder", "Wooden bowl of green tea powder with fresh tea leaves and loose tea"],
  ["masala-powders-chicken-biryani", "Wooden bowl of masala powder beside a pot of chicken biryani"],
  ["masala-powders-mutton-biryani", "Wooden bowl of masala powder beside a pot of mutton biryani"],
  ["masala-powders-fish-curry", "Wooden bowl of masala powder beside a pan of fish curry"],
  ["masala-powders-non-veg", "Wooden bowl of masala powder with raw chicken, meat and fish"],
  ["turmeric-powder", "Wooden bowl of turmeric powder with fresh turmeric roots"],
  ["red-chilli-powder", "Wooden bowl of red chilli powder with dried red chillies"],
  ["coriander-powder", "Wooden bowl of coriander powder with coriander seeds and leaves"],
  ["black-pepper-powder", "Wooden bowl of black pepper powder with a scoop of peppercorns"],
  ["rasam-powder", "Wooden bowl of rasam powder with tomatoes, red chillies and spices"],
  ["moringa-powder", "Wooden bowl of moringa powder with moringa leaves"],
  ["banana-powder", "Wooden bowl of banana powder with bananas and banana slices"],
  ["lemon-powder", "Wooden bowl of lemon powder with lemons and lemon slices"],
  ["tomato-powder", "Wooden bowl of tomato powder with fresh tomatoes"],
  ["ginger-powder", "Wooden bowl of ginger powder with fresh ginger"],
  ["garlic-powder", "Wooden bowl of garlic powder with garlic bulbs and cloves"],
  ["onion-powder", "Wooden bowl of onion powder with red onions"],
  ["carrot-powder", "Wooden bowl of carrot powder with carrots"],
  ["beetroot-powder", "Wooden bowl of beetroot powder with beetroot"],
  ["curry-leaves", "Wooden bowl of powder with fresh curry leaves"],
  ["amla-powder", "Wooden bowl of amla powder with fresh amla"],
  ["abc-powder", "Wooden bowl of pink powder with an apple, a beetroot and a carrot"],
  ["spinach-powder", "Wooden bowl of spinach powder with spinach leaves"],
  ["mango-flakes", "Wooden bowl of mango flakes with a fresh mango, cut and whole"],
  ["tomato-flakes", "Wooden bowl of tomato flakes with fresh tomatoes"],
  ["ginger-flakes", "Wooden bowl of ginger flakes with fresh ginger"],
  ["garlic-flakes", "Wooden bowl of garlic flakes with garlic bulbs and cloves"],
  ["onion-flakes", "Wooden bowl of onion flakes with red onions"],
  ["carrot-flakes", "Wooden bowl of carrot flakes with carrots"],
  ["beetroot-flakes", "Wooden bowl of beetroot flakes with beetroot and its leaves"],
];

// Spices has no card on the client's sheet, so it has no photograph.
const CATEGORY_PHOTOS: [slug: string, alt: string][] = [
  ["dehydrated-powders-flakes", "A wooden bowl of dehydrated powder"],
  ["dehydrated-fruits", "A wooden bowl of dried mango slices"],
  ["pickles", "A jar of mango pickle"],
  ["dal-powders", "A wooden bowl of dal powder"],
  ["crisps", "A wooden bowl of crisps"],
  ["dry-fruits", "A wooden bowl of mixed nuts"],
  ["millet-powders", "A wooden bowl of millet"],
  ["tea-coffee", "A wooden bowl of loose tea leaves"],
  ["masala-powders", "A wooden bowl of masala powders"],
];

async function register(
  db: Database,
  publicPath: string,
  width: number,
  height: number,
): Promise<string | undefined> {
  const file = path.join(process.cwd(), "public", publicPath);
  let size: number;
  try {
    size = statSync(file).size;
  } catch {
    // A mapping without its file is skipped, not invented.
    return undefined;
  }

  const key = staticKey(publicPath);
  const [existing] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.r2Key, key))
    .limit(1);
  // Already handled on an earlier run — whatever the owner has done since.
  if (existing) return undefined;

  const [row] = await db
    .insert(media)
    .values({
      r2Key: key,
      filename: path.basename(publicPath),
      mimeType: "image/webp",
      sizeBytes: size,
      width,
      height,
    })
    .returning({ id: media.id });
  return row?.id;
}

export async function seedPhotos(
  db: Database,
): Promise<{ products: number; categories: number }> {
  let productCount = 0;
  let categoryCount = 0;

  for (const [slug, alt] of PRODUCT_PHOTOS) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (!product) continue;

    const [hasPhoto] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .limit(1);
    // A photo the owner uploaded before this ever ran wins.
    if (hasPhoto) continue;

    const mediaId = await register(db, `images/products/${slug}.webp`, 600, 600);
    if (!mediaId) continue;

    await db.insert(productImages).values({
      productId: product.id,
      mediaId,
      altText: alt,
      isPrimary: true,
      sortOrder: 0,
    });
    productCount += 1;
  }

  for (const [slug] of CATEGORY_PHOTOS) {
    const [category] = await db
      .select({ id: categories.id, heroImageId: categories.heroImageId })
      .from(categories)
      .where(and(eq(categories.slug, slug), isNull(categories.parentId)))
      .limit(1);
    if (!category || category.heroImageId) continue;

    const mediaId = await register(db, `images/categories/${slug}.webp`, 480, 360);
    if (!mediaId) continue;

    await db
      .update(categories)
      .set({ heroImageId: mediaId })
      .where(eq(categories.id, category.id));
    categoryCount += 1;
  }

  return { products: productCount, categories: categoryCount };
}
