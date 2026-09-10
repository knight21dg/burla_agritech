import { ImageIcon } from "lucide-react";
import { Bowl, type Contents } from "@/components/art/Bowl";
import { seedFrom } from "@/components/art/random";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types/catalog";

/**
 * Stand-in for a real photograph.
 *
 * Two forms:
 *
 *  - **Illustrated**, when the caller says what the thing is made of (`tone`
 *    and `contents`): a drawn wooden bowl of the raw ingredient, on white, as
 *    the client's mockup sets its product tiles on white. It suggests the
 *    category without depicting a product, a package, a label or a logo —
 *    the brief rules out inventing what Burla's packaging looks like.
 *  - **Plain**, otherwise: a light panel with a camera glyph and the name.
 *
 * Either way it announces itself to assistive technology as a pending
 * photograph, not as a picture of the product. Replaced by `<Image>` when real
 * photography lands (`docs/IMAGE-ASSET-REQUIREMENTS.md`, `lib/imagery.ts`).
 */
export function ProductImage({
  name,
  className,
  ratio = "square",
  showLabel = true,
  tone,
  contents,
}: {
  /** Used for the caption and the accessible label. */
  name?: string;
  className?: string;
  ratio?: "square" | "landscape" | "portrait";
  showLabel?: boolean;
  tone?: Tone;
  contents?: Contents;
}) {
  const label = name ? `${name} — photograph pending` : "Photograph pending";
  const aspect = {
    square: "aspect-square",
    landscape: "aspect-4/3",
    portrait: "aspect-4/5",
  }[ratio];

  if (tone && contents) {
    const key = name ?? `${tone}-${contents}`;
    return (
      <div
        role="img"
        aria-label={label}
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-white",
          aspect,
          className,
        )}
      >
        <Bowl
          uid={`pi-${seedFrom(key).toString(36)}`}
          contents={contents}
          tone={tone}
          seed={seedFrom(key)}
          className="h-auto w-[92%]"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-surface-2",
        aspect,
        className,
      )}
      role="img"
      aria-label={label}
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
