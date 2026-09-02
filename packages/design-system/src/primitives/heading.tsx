import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { classFor, type TextColorToken } from "./tokens";

const size = { medium: "font-heading-medium", small: "font-heading-small", xsmall: "font-heading-xsmall" } as const;
const defaultTag = { medium: "h1", small: "h2", xsmall: "h3" } as const;

export type HeadingProps = {
  /** Heading level is semantic and chosen by the page; size is visual and chosen by the design. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  /** font.heading.medium (page titles) · small (section headings) · xsmall (dialog and card titles) */
  size: keyof typeof size;
  color?: TextColorToken;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"h2">, "children" | "className" | "color">;

export function Heading({ as, size: s, color, className, children, ...rest }: HeadingProps) {
  const Tag = (as ?? defaultTag[s]) as ElementType;
  return (
    <Tag className={cn(size[s], color && classFor(color), className)} {...rest}>
      {children}
    </Tag>
  );
}
