"use client";

import { cn } from "@/lib/cn";

/**
 * A plain "Yes / No" choice.
 *
 * Two big buttons with words on them, rather than a small sliding switch: a
 * switch asks the reader to know which side means on, and the answer here
 * should never need working out. It is a radio group underneath, so a screen
 * reader announces both options and which one is chosen, and the arrow keys
 * move between them.
 */
export function YesNo({
  value,
  onChange,
  yes = "Yes",
  no = "No",
  label,
  disabled = false,
  invalid = false,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  yes?: string;
  no?: string;
  /** What is being chosen — read out, not shown. */
  label: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const option = (active: boolean, text: string, next: boolean) => (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange(next)}
      onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          onChange(!value);
        }
      }}
      className={cn(
        "min-h-11 flex-1 px-4 text-[0.9375rem] font-semibold transition-colors",
        active
          ? next
            ? "bg-accent text-white"
            : "bg-ink-2 text-white"
          : "bg-panel text-ink-2 hover:bg-surface",
      )}
    >
      {text}
    </button>
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn(
        "inline-flex w-full max-w-60 overflow-hidden rounded-md border",
        invalid ? "border-danger" : "border-line-strong",
      )}
    >
      {option(value, yes, true)}
      <span aria-hidden="true" className="w-px bg-line-strong" />
      {option(!value, no, false)}
    </div>
  );
}
