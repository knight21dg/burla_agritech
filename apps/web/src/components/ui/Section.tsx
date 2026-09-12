import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section rhythm — DESIGN-SYSTEM §5.2.
 * `tone` varies the ground so adjacent sections never read identically.
 */
export function Section({
  children,
  className,
  tone = "white",
  size = "md",
  as: Tag = "section",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "surface" | "dark";
  size?: "compact" | "sm" | "md" | "lg";
  as?: ElementType;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        {
          white: "bg-white",
          surface: "bg-surface",
          dark: "bg-green-900 text-white",
        }[tone],
        // Tighter than v0.2 — products should arrive sooner.
        // `compact` is for listing pages, where the grid is the content and
        // marketing air above it only pushes products below the fold.
        {
          compact: "py-5 md:py-7",
          sm: "py-10 md:py-12",
          md: "py-12 md:py-14 lg:py-16",
          lg: "py-14 md:py-16 lg:py-20",
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
        tone === "light" ? "text-white/70" : "text-ink-3",
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
      <h2 className={cn("t-h2", tone === "light" && "text-white")}>{title}</h2>
      {lead && (
        <p
          className={cn(
            "t-lead measure mt-4",
            tone === "light" && "text-white/80",
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
