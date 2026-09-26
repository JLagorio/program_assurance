import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import type { HeadingElement, TextElement } from "./tokens";

/* VisuallyHidden: text for assistive technology alone. It stays in the accessibility tree and in
   reading order, and takes no space on screen (`sr-only`). */

/** The elements VisuallyHidden renders as: a run or a paragraph, a label, or a heading level. */
export type VisuallyHiddenElement = TextElement | Exclude<HeadingElement, "div" | "span">;

export type VisuallyHiddenProps = {
  /** The element: a `span` by default; `div` or `p` for a block, `h1` to `h6` for a heading only the outline needs, `label` or `legend` to name a control or a group. */
  as?: VisuallyHiddenElement | undefined;
  /** What a screen reader hears: the meaning of a mark beside it ("Authorization boundary"), a heading for a region that shows none. */
  children?: ReactNode | undefined;
  ref?: Ref<HTMLElement> | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style">;

/** Text read by assistive technology and not drawn: the name of a mark, a heading the outline needs. */
export function VisuallyHidden({ as = "span", className, children, ...rest }: VisuallyHiddenProps) {
  // An assertion, as in Text: an annotation would narrow to the literal union and check the ref
  // against every element in it.
  const Tag = as as ElementType;
  return (
    <Tag {...rest} data-slot="visually-hidden" className={cn("sr-only", className)}>
      {children}
    </Tag>
  );
}
