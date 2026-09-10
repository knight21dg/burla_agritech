import Image from "next/image";
import Link from "next/link";
import { CONTENTS_FOR_CATEGORY } from "@/components/art/Bowl";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Category } from "@/data/catalog";
import { imagery } from "@/lib/imagery";

/**
 * Category tile, as in the client's final mockup: a white card, the category's
 * photograph filling the top, its name centred beneath in two short lines.
 *
 * White rather than tinted. The previous pass put each category on a produce
 * tint; the mockup keeps the tiles white and lets the photograph carry the
 * colour, which also keeps ten tiles in a row from turning into a paint chart.
 *
 * Until photography arrives the image is the illustrated bowl for that
 * category. Set `imagery.categories[slug]` and the photograph takes its place.
 */
export function CategoryCard({ category }: { category: Category }) {
  const photo = imagery.categories[category.slug];

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_2px_rgba(23,23,23,0.04)] transition duration-300 ease-out hover:-translate-y-1 hover:border-green-700/40 hover:shadow-[0_12px_28px_-14px_rgba(15,74,44,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="relative overflow-hidden">
        {photo ? (
          <Image
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1024px) 120px, 36vw"
            className="aspect-4/3 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <ProductImage
            name={category.name}
            ratio="landscape"
            tone={category.tone}
            contents={CONTENTS_FOR_CATEGORY[category.slug] ?? "powder"}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        )}
      </div>
      <h3 className="flex flex-1 items-center justify-center px-2 pb-3 pt-1 text-center text-[0.78rem] font-medium leading-snug text-ink transition-colors group-hover:text-green-700">
        {category.name}
      </h3>
    </Link>
  );
}
