import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const direction = { row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse", "column-reverse": "flex-col-reverse" } as const;
const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly" } as const;
const wrap = { wrap: "flex-wrap", nowrap: "flex-nowrap", "wrap-reverse": "flex-wrap-reverse" } as const;

export type FlexProps = {
  as?: ElementType;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  direction?: keyof typeof direction;
  gap?: SpaceToken;
  rowGap?: SpaceToken;
  columnGap?: SpaceToken;
  alignItems?: keyof typeof alignItems;
  justifyContent?: keyof typeof justifyContent;
  wrap?: keyof typeof wrap;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

/** The general flex container, for the layouts Stack and Inline do not express. */
export function Flex({ as: Tag = "div", direction: d, gap, rowGap, columnGap, alignItems: a, justifyContent: j, wrap: w, className, children, ...rest }: FlexProps) {
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
