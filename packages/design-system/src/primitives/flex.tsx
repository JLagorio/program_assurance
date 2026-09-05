import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type LayoutElement, type SpaceToken } from "./tokens";

/* Reference material. Atlassian's Flex is the general flex container behind Stack and Inline:
   direction row or column, gap, rowGap, columnGap, alignItems, justifyContent, wrap. No reverse
   direction and no reverse wrap, and none here either: a reversed row reads in one order and
   tabs in the other. HubSpot's Flex is the same set with a named gap scale. Carbon has no flex
   primitive; its Stack takes an orientation. No `style`: a computed dimension is a Box's. */

const direction = { row: "flex-row", column: "flex-col" } as const;
const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly" } as const;
const wrap = { wrap: "flex-wrap", nowrap: "flex-nowrap" } as const;

export type FlexProps = {
  /** The element: a container, a landmark or a list. Never a link or a button. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** `row` or `column`. Reverse is not offered: reading order and tab order stay one order. */
  direction?: keyof typeof direction | undefined;
  /** Space between children on both axes. */
  gap?: SpaceToken | undefined;
  /** Space between rows, over `gap`. */
  rowGap?: SpaceToken | undefined;
  /** Space between columns, over `gap`. */
  columnGap?: SpaceToken | undefined;
  /** Position on the cross axis. */
  alignItems?: keyof typeof alignItems | undefined;
  /** Distribution on the main axis. */
  justifyContent?: keyof typeof justifyContent | undefined;
  wrap?: keyof typeof wrap | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** The general flex container, for the layouts Stack and Inline do not express. */
export function Flex({ as = "div", direction: d, gap, rowGap, columnGap, alignItems: a, justifyContent: j, wrap: w, className, children, ...rest }: FlexProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(
        "flex",
        d && direction[d],
        gap && spaceClasses.gap[gap],
        rowGap && spaceClasses.gapY[rowGap],
        columnGap && spaceClasses.gapX[columnGap],
        a && alignItems[a],
        j && justifyContent[j],
        w && wrap[w],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
