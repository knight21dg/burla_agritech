import type { ProductStatus } from "@burla/core/db/schema";

/**
 * What state a row is in, said in a word.
 *
 * Colour is never the only signal — each state has its own word — because a
 * badge that means something only if you can distinguish green from grey is
 * not a badge for everyone.
 */
const STYLES: Record<ProductStatus, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-accent-soft text-accent-dark",
  },
  draft: {
    label: "Draft",
    className: "bg-surface text-ink-2 border border-line",
  },
  archived: {
    label: "Archived",
    className: "bg-danger-soft text-danger",
  },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
