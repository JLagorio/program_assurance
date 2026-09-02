import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";

type ButtonSize = "xs" | "sm" | "md";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[box-shadow,background-color,color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-button-primary hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
  secondary:
    "bg-card text-foreground shadow-button hover:bg-surface-hover disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
  ghost: "text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-50",
  danger:
    "bg-danger text-primary-foreground shadow-button-primary hover:bg-danger-hover disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
  link: "text-primary hover:underline underline-offset-2 decoration-primary/40 disabled:opacity-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-12",
  sm: "h-7 px-2.5 text-13",
  md: "h-8 px-3 text-13",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        variant === "link" ? "h-auto px-0 text-[13px]" : buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        buttonBase,
        "size-7 shrink-0 text-muted-foreground shadow-button hover:bg-subtle hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
