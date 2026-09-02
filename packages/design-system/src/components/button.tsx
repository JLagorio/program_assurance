import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";

/*
 * Button. The recipe is Atlassian's: a fill per variant with hovered and pressed tokens,
 * disabled as its own tokens rather than an opacity, one focus outline. The look is Ledger's:
 * primary is the brand bold fill with a flat face; secondary is the raised surface with the raised
 * shadow (the hairline-and-soft-drop button) rather than Atlassian's translucent neutral fill;
 * swap `bg-surface-raised shadow-raised` for `bg-neutral` to get theirs.
 */

const base =
  "inline-flex select-none items-center justify-center gap-075 whitespace-nowrap rounded-medium font-body font-medium transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none";

const variants = {
  primary: "bg-brand-bold text-inverse hover:bg-brand-bold-hovered active:bg-brand-bold-pressed disabled:bg-disabled disabled:text-disabled",
  secondary:
    "bg-surface-raised text-default shadow-raised hover:bg-surface-raised-hovered active:bg-surface-raised-pressed disabled:bg-disabled disabled:text-disabled disabled:shadow-none",
  subtle: "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed disabled:text-disabled",
  danger: "bg-danger-bold text-inverse hover:bg-danger-bold-hovered active:bg-danger-bold-pressed disabled:bg-disabled disabled:text-disabled",
  warning: "bg-warning-bold text-warning-inverse hover:bg-warning-bold-hovered active:bg-warning-bold-pressed disabled:bg-disabled disabled:text-disabled",
  link: "text-brand underline-offset-2 hover:underline disabled:text-disabled",
} as const;

const sizes = {
  xsmall: "h-control-xsmall px-100 font-body-small",
  small: "h-control-small px-150",
  medium: "h-control-medium px-150",
} as const;

export type ButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Render the child element instead of a <button>, keeping the button's classes. This is how a router's Link becomes a button. */
  asChild?: boolean | undefined;
  /** Marks the button as the current choice (aria-pressed) and paints it selected. */
  isSelected?: boolean | undefined;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

export function Button({ variant = "secondary", size = "medium", asChild, isSelected, className, type, children, ...rest }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        base,
        variants[variant],
        variant === "link" ? "h-auto px-0" : sizes[size],
        isSelected && "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none",
        className,
      )}
      aria-pressed={isSelected}
      type={asChild ? undefined : (type ?? "button")}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export type IconButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  /** Required: the icon has no text. */
  label: string;
  variant?: "secondary" | "subtle";
  size?: "small" | "medium";
  asChild?: boolean | undefined;
  isSelected?: boolean | undefined;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "aria-label">;

const iconSizes = { small: "size-control-small", medium: "size-control-medium" } as const;

/** A square button holding one icon. `label` is its accessible name and its tooltip. */
export function IconButton({ label, variant = "secondary", size = "small", asChild, isSelected, className, type, children, ...rest }: IconButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        base,
        variant === "secondary" ? variants.secondary : variants.subtle,
        "shrink-0 px-0",
        iconSizes[size],
        isSelected && "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none",
        className,
      )}
      aria-label={label}
      title={label}
      aria-pressed={isSelected}
      type={asChild ? undefined : (type ?? "button")}
      {...rest}
    >
      {children}
    </Comp>
  );
}
