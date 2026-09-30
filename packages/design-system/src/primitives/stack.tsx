import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { elementClasses, growClasses, shrinkClasses, type Grow, type Shrink } from "./_elements";
import { spaceClasses, type LayoutElement, type SpaceToken } from "./tokens";

/* Stack: `space` between children, `alignBlock` (no baseline), `alignInline`, `spread`, `grow`,
   `shrink`, `as` on the layout elements. The child has no margin; the container has the distance.
   No `style`: a computed dimension is a Box's. */

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
  /** As a flex item: `fill` takes the free space along its parent's main axis (the height in a column, the width in a row) and may shrink below its content, so a truncating child inside it cuts instead of overflowing; `hug`, the default, is as big as its children. */
  grow?: Grow | undefined;
  /** As a flex item: `none` keeps its size when the row runs out of room, for a fixed label such as an id; the default lets it shrink. */
  shrink?: Shrink | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** Vertical layout. Children stack top to bottom with one token of space between them. */
export function Stack({
  as = "div",
  space,
  alignBlock: ab,
  alignInline: ai,
  spread,
  grow,
  shrink,
  className,
  children,
  ...rest
}: StackProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(
        "flex flex-col",
        space && spaceClasses.gap[space],
        ab && alignBlock[ab],
        ai && alignInline[ai],
        spread === "space-between" && "justify-between",
        grow && growClasses[grow],
        shrink && shrinkClasses[shrink],
        elementClasses(as),
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
