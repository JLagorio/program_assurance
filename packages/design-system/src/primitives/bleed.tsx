import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { bleedClasses, type BleedToken, type LayoutElement } from "./tokens";

/* Reference material. Atlassian's Bleed is the one primitive that writes a negative margin, on
   `all`, `inline` or `block`, and its scale stops at space.200: a bleed escapes a padding, so it
   is never larger than one. Carbon has no bleed; its full-width rows come from the grid's own
   gutter modes. Here the scale is the tokens that have a negative in the source, up to
   space.400, the page gutter, and the classes read those negative tokens. */

export type BleedProps = {
  /** The element: a container or a list part. Never a link or a button. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Pull out on every side by this much. */
  all?: BleedToken | undefined;
  /** Pull out on the inline (horizontal) axis: a strip or a table that runs to a card's edges. */
  inline?: BleedToken | undefined;
  /** Pull out on the block (vertical) axis: a list that runs to a panel's top and bottom. */
  block?: BleedToken | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** The only sanctioned negative spacing: a child that escapes its parent's padding, by the token that padding is. */
export function Bleed({ as = "div", all, inline, block, className, children, ...rest }: BleedProps) {
  const Tag = as as ElementType;
  return (
    <Tag className={cn(all && bleedClasses.m[all], inline && bleedClasses.mx[inline], block && bleedClasses.my[block], className)} {...rest}>
      {children}
    </Tag>
  );
}
