import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly", stretch: "justify-stretch" } as const;
export type ResponsiveTemplate = { base?: string; sm?: string; md?: string; lg?: string; xl?: string };
// Each breakpoint's template travels as a CSS variable the static class reads, so Tailwind sees one class per breakpoint.
// The base template is a class too, never an inline grid-template-columns, so the breakpoint classes can override it.
const responsiveCols = { base: "grid-cols-(--ds-grid-base)", sm: "sm:grid-cols-(--ds-grid-sm)", md: "md:grid-cols-(--ds-grid-md)", lg: "lg:grid-cols-(--ds-grid-lg)", xl: "xl:grid-cols-(--ds-grid-xl)" } as const;

const autoFlow = { row: "grid-flow-row", column: "grid-flow-col", dense: "grid-flow-dense", "row-dense": "grid-flow-row-dense", "column-dense": "grid-flow-col-dense" } as const;

export type GridProps = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** A grid-template-columns value, or one per breakpoint (`base` applies always, the others from that width up). Template strings stay strings; the gaps are tokens. */
  templateColumns?: string | ResponsiveTemplate | undefined;
  templateRows?: string | undefined;
  templateAreas?: string | undefined;
  gap?: SpaceToken | undefined;
  rowGap?: SpaceToken | undefined;
  columnGap?: SpaceToken | undefined;
  alignItems?: keyof typeof alignItems | undefined;
  justifyContent?: keyof typeof justifyContent | undefined;
  autoFlow?: keyof typeof autoFlow | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** CSS grid with token gaps. */
export function Grid({ as: Tag = "div", templateColumns, templateRows, templateAreas, gap, rowGap, columnGap, alignItems: a, justifyContent: j, autoFlow: f, className, style, children, ...rest }: GridProps) {
  const template: CSSProperties & Record<`--ds-grid-${keyof typeof responsiveCols}`, string> = {} as never;
  const responsive: string[] = [];
  if (typeof templateColumns === "string") template.gridTemplateColumns = templateColumns;
  else if (templateColumns) {
    for (const bp of ["base", "sm", "md", "lg", "xl"] as const) {
      const value = templateColumns[bp];
      if (!value) continue;
      template[`--ds-grid-${bp}`] = value;
      responsive.push(responsiveCols[bp]);
    }
  }
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
        responsive,
        className,
      )}
      style={{ ...template, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
