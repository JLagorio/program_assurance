import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const direction = { row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse", "column-reverse": "flex-col-reverse" } as const;
const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly" } as const;
const wrap = { wrap: "flex-wrap", nowrap: "flex-nowrap", "wrap-reverse": "flex-wrap-reverse" } as const;

export type FlexProps = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  direction?: keyof typeof direction | undefined;
  gap?: SpaceToken | undefined;
  rowGap?: SpaceToken | undefined;
  columnGap?: SpaceToken | undefined;
  alignItems?: keyof typeof alignItems | undefined;
  justifyContent?: keyof typeof justifyContent | undefined;
  wrap?: keyof typeof wrap | undefined;
  className?: string | undefined;
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
