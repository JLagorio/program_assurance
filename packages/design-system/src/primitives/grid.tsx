import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly", stretch: "justify-stretch" } as const;
const autoFlow = { row: "grid-flow-row", column: "grid-flow-col", dense: "grid-flow-dense", "row-dense": "grid-flow-row-dense", "column-dense": "grid-flow-col-dense" } as const;

export type GridProps = {
  as?: ElementType;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  /** A grid-template-columns value. Template strings stay strings; the gaps are tokens. */
  templateColumns?: string;
  templateRows?: string;
  templateAreas?: string;
  gap?: SpaceToken;
  rowGap?: SpaceToken;
  columnGap?: SpaceToken;
  alignItems?: keyof typeof alignItems;
  justifyContent?: keyof typeof justifyContent;
  autoFlow?: keyof typeof autoFlow;
  className?: string;
  style?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** CSS grid with token gaps. */
export function Grid({ as: Tag = "div", templateColumns, templateRows, templateAreas, gap, rowGap, columnGap, alignItems: a, justifyContent: j, autoFlow: f, className, style, children, ...rest }: GridProps) {
  const template: CSSProperties = {};
  if (templateColumns) template.gridTemplateColumns = templateColumns;
  if (templateRows) template.gridTemplateRows = templateRows;
  if (templateAreas) template.gridTemplateAreas = templateAreas;
  return (
    <Tag
      className={cn(
        "grid",
        gap && spaceClasses.gap[gap],
        rowGap && spaceClasses.gapY[rowGap],
        columnGap && spaceClasses.gapX[columnGap],
        a && alignItems[a],
        j && justifyContent[j],
        f && autoFlow[f],
        className,
      )}
      style={{ ...template, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
