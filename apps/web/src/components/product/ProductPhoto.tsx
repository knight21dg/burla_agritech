import Image from "next/image";
import { CONTENTS_FOR_CATEGORY } from "@/components/art/Bowl";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/data/catalog";
import { imagery } from "@/lib/imagery";
import { cn } from "@/lib/utils";

/**
 * A product's picture: its photograph when one has been supplied
 * (`imagery.products`), otherwise its illustrated stand-in.
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
  const photo = imagery.products[product.slug];

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
        src={photo.src}
        alt={decorative ? "" : photo.alt}
        width={photo.width}
        height={photo.height}
        // Pre-encoded at 600 x 600, which covers a card at 2x and the product
        // page's main image; nothing for the optimiser to add.
        unoptimized
        priority={priority}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
