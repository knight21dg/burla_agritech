import Image from "next/image";
import { CONTENTS_FOR_CATEGORY } from "@/components/art/Bowl";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/types/catalog";
import { cn } from "@/lib/utils";

/**
 * A product's picture: its photograph when it has one (chosen in the admin,
 * stored in the database), otherwise its illustrated stand-in.
 *
 * One component for every place a product is pictured — card, product page —
 * so a product never shows a photograph in one place and a drawing in
 * another.
 *
 * `decorative` is for cards, where the product's name sits right beside the
 * picture and a screen reader would otherwise hear it twice.
 */
export function ProductPhoto({
  product,
  decorative = false,
  priority = false,
  className,
}: {
  product: Product;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const photo = product.photo;

  if (!photo) {
    return (
      <ProductImage
        name={product.name}
        tone={product.tone}
        contents={CONTENTS_FOR_CATEGORY[product.categorySlug] ?? "powder"}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-white", className)}>
      <Image
        src={photo.url}
        alt={decorative ? "" : photo.alt}
        width={photo.width}
        height={photo.height}
        // Supplied photos are pre-encoded at 600 x 600; uploads are resized and
        // re-encoded when saved. Nothing for the optimiser to add.
        unoptimized
        priority={priority}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
