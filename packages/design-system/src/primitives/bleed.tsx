import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { bleedClasses, type SpaceToken } from "./tokens";

export type BleedProps = {
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
  /** Pull out on every side by this much. */
  all?: SpaceToken;
  /** Pull out on the inline (horizontal) axis. */
  inline?: SpaceToken;
  /** Pull out on the block (vertical) axis. */
  block?: SpaceToken;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

/** The only sanctioned negative spacing: a child that escapes its parent's padding, e.g. a full-bleed table inside a card. */
export function Bleed({ all, inline, block, className, children, ...rest }: BleedProps) {
  return (
    <div className={cn(all && bleedClasses.m[all], inline && bleedClasses.mx[inline], block && bleedClasses.my[block], className)} {...rest}>
      {children}
    </div>
  );
}
