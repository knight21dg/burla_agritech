import type { CategoryStatus } from "@burla/core/db/schema";

/**
 * A range has three states, and the middle one is the useful one.
 *
 * `hidden` is not `draft`: a hidden range keeps its page for anyone holding
 * the link but leaves the navigation, which is what a seasonal range wants.
 * Deleting it would take its products with it.
 */
const STYLES: Record<CategoryStatus, { label: string; className: string }> = {
  published: { label: "Published", className: "bg-accent-soft text-accent-dark" },
  draft: { label: "Draft", className: "border border-line bg-surface text-ink-2" },
  hidden: { label: "Hidden", className: "bg-warning-soft text-warning" },
};

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
