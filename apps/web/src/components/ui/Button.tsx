import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "tertiary" | "whatsapp" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold " +
  "transition-colors duration-150 select-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // green-700 gives white text 5.4:1. The logo green is only 3.4:1 and is
  // never used as a fill behind text (DESIGN-SYSTEM §3.2).
  primary: "bg-green-700 text-white hover:bg-green-900",
  secondary:
    "border border-line-strong text-ink hover:border-ink hover:bg-surface",
  tertiary: "text-green-700 underline-offset-4 hover:underline px-0",
  whatsapp: "bg-[#25D366] text-[#0B2E13] hover:bg-[#1FBE5A]",
  onDark: "bg-white text-green-900 hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-7 text-[0.9375rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        variant !== "tertiary" && sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  external,
  ...rest
}: CommonProps & {
  href: string;
  external?: boolean;
} & Omit<ComponentProps<"a">, "href">) {
  const cls = cn(
    base,
    variants[variant],
    variant !== "tertiary" && sizes[size],
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
