import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section rhythm — DESIGN-SYSTEM §5.2.
 * `tone` varies the ground so adjacent sections never read identically.
 */
export function Section({
  children,
  className,
  tone = "ivory",
  size = "md",
  as: Tag = "section",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "ivory" | "warm" | "paper" | "deep";
  size?: "sm" | "md" | "lg";
  as?: ElementType;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        {
          ivory: "bg-ivory",
          warm: "bg-ivory-warm",
          paper: "bg-paper",
          deep: "bg-green-deep text-ivory",
        }[tone],
        {
          sm: "py-12 md:py-16",
          md: "py-16 md:py-20 lg:py-24",
          lg: "py-20 md:py-28 lg:py-32",
        }[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("container-page", className)}>{children}</div>;
}

export function Eyebrow({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "light";
}) {
  return (
    <p
      className={cn(
        "t-label",
        tone === "light" ? "text-ivory/70" : "text-ink-faint",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Section heading with an optional eyebrow and lead paragraph. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "default",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto text-center",
        align === "center" ? "max-w-2xl" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow && (
        <Eyebrow tone={tone} className="mb-4">
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className={cn("t-h2", tone === "light" && "text-ivory")}>{title}</h2>
      {lead && (
        <p
          className={cn(
            "t-lead measure mt-4",
            tone === "light" && "text-ivory/80",
            align === "center" && "mx-auto",
          )}
        >
          {lead}
        </p>
      )}
      {children}
    </div>
  );
}
