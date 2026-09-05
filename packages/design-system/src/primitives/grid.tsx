import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type LayoutElement, type SpaceToken } from "./tokens";

/* Reference material. Atlassian's Grid: templateColumns, templateRows and templateAreas as
   strings, gap, rowGap, columnGap as tokens, alignItems, justifyContent, autoFlow, `as` from
   div, span, ul, ol; no responsive template. Carbon's 2x Grid is a page grid, 4, 8 and 16
   columns by breakpoint with 16px gutters, which the Shell's areas do here. Base Web's FlexGrid
   takes a column count per breakpoint as an array. Here Atlassian's Grid, with one template per
   breakpoint. */

const alignItems = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline", stretch: "items-stretch" } as const;
const justifyContent = { start: "justify-start", center: "justify-center", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly", stretch: "justify-stretch" } as const;
export type ResponsiveTemplate = { base?: string; sm?: string; md?: string; lg?: string; xl?: string };
// Each breakpoint's template travels as a CSS variable the static class reads, so Tailwind sees one class per breakpoint.
// The base template is a class too, never an inline grid-template-columns, so the breakpoint classes can override it.
const responsiveCols = { base: "grid-cols-(--ds-grid-base)", sm: "sm:grid-cols-(--ds-grid-sm)", md: "md:grid-cols-(--ds-grid-md)", lg: "lg:grid-cols-(--ds-grid-lg)", xl: "xl:grid-cols-(--ds-grid-xl)" } as const;

const autoFlow = { row: "grid-flow-row", column: "grid-flow-col", dense: "grid-flow-dense", "row-dense": "grid-flow-row-dense", "column-dense": "grid-flow-col-dense" } as const;

export type GridProps = {
  /** The element: a container, a list or a description list (`dl` for label and value pairs). Never a link or a button. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** A grid-template-columns value, or one per breakpoint (`base` applies always, the others from that width up). Template strings stay strings; the gaps are tokens. */
  templateColumns?: string | ResponsiveTemplate | undefined;
  /** A grid-template-rows value. */
  templateRows?: string | undefined;
  /** A grid-template-areas value: quoted rows, one string. */
  templateAreas?: string | undefined;
  /** Space between cells on both axes. */
  gap?: SpaceToken | undefined;
  /** Space between rows, over `gap`. */
  rowGap?: SpaceToken | undefined;
  /** Space between columns, over `gap`. */
  columnGap?: SpaceToken | undefined;
  alignItems?: keyof typeof alignItems | undefined;
  justifyContent?: keyof typeof justifyContent | undefined;
  autoFlow?: keyof typeof autoFlow | undefined;
  className?: string | undefined;
  /** Runtime values only: a template computed at render. A design value is a token or a class. */
  style?: CSSProperties | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** CSS grid with token gaps. */
export function Grid({ as = "div", templateColumns, templateRows, templateAreas, gap, rowGap, columnGap, alignItems: a, justifyContent: j, autoFlow: f, className, style, children, ...rest }: GridProps) {
  const Tag = as as ElementType;
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
