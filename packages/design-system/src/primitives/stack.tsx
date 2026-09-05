import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type LayoutElement, type SpaceToken } from "./tokens";

/* Reference material. Atlassian's Stack: `space` between children, `alignBlock` (no baseline),
   `alignInline`, `spread`, `grow`, `as` from div, span, ul, ol, dl. Carbon's Stack takes a gap
   step and an orientation, and its spacing page says the same thing: the child has no margin,
   the container has the distance. Here the same props, with `as` on the layout elements and no
   `style`: a computed dimension is a Box's. */

const alignBlock = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
const alignInline = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;

export type StackProps = {
  /** The element: a container, a landmark or a list (`ul`, `ol` for rows that are a list). Never a link or a button. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Space between children. */
  space?: SpaceToken | undefined;
  /** Position along the block (vertical) axis. */
  alignBlock?: keyof typeof alignBlock | undefined;
  /** Position along the inline (horizontal) axis. */
  alignInline?: keyof typeof alignInline | undefined;
  /** Distribute children with the free block space between them, when the Stack is taller than its children. */
  spread?: "space-between" | undefined;
  /** `fill` takes the available block size; `hug`, the default, is as tall as its children. */
  grow?: "hug" | "fill" | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** Vertical layout. Children stack top to bottom with one token of space between them. */
export function Stack({ as = "div", space, alignBlock: ab, alignInline: ai, spread, grow, className, children, ...rest }: StackProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(
        "flex flex-col",
        space && spaceClasses.gap[space],
        ab && alignBlock[ab],
        ai && alignInline[ai],
        spread === "space-between" && "justify-between",
        grow === "fill" && "flex-1",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
