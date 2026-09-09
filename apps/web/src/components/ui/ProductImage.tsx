import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stand-in for a real photograph.
 *
 * Deliberately plain. The previous version drew a stand-up pouch with a leaf
 * mark on it, which was **invented packaging** — the brief rules that out
 * alongside stock and AI-generated imagery, and it risks implying a product
 * looks a way we have not verified.
 *
 * So this is a light grey panel with a camera glyph and the product name. It
 * does not pretend to be a photograph. An obvious gap is honest; a convincing
 * fake is not.
 *
 * Replaced by `<Image>` as soon as real photography lands
 * (`docs/IMAGE-ASSET-REQUIREMENTS.md`).
 */
export function ProductImage({
  name,
  className,
  ratio = "square",
  showLabel = true,
}: {
  /** Used for the visible caption, so the tile still identifies the product. */
  name?: string;
  className?: string;
  ratio?: "square" | "landscape" | "portrait";
  showLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-surface-2",
        {
          square: "aspect-square",
          landscape: "aspect-4/3",
          portrait: "aspect-4/5",
        }[ratio],
        className,
      )}
      role="img"
      aria-label={
        name ? `${name} — photograph pending` : "Photograph pending"
      }
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <ImageIcon
          className="size-6 text-ink-3/45"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        {showLabel && name && (
          <span className="text-[0.75rem] leading-tight text-ink-3/70">
            {name}
          </span>
        )}
      </div>
    </div>
  );
}
