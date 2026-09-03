import {
  Children,
  Fragment,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const alignBlock = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
} as const;
const alignInline = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

export type InlineProps = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Space between children on the inline axis. */
  space?: SpaceToken | undefined;
  /** Space between rows when wrapping. */
  rowSpace?: SpaceToken | undefined;
  /** Position along the block (vertical) axis. */
  alignBlock?: keyof typeof alignBlock | undefined;
  /** Position along the inline (horizontal) axis. */
  alignInline?: keyof typeof alignInline | undefined;
  spread?: "space-between" | undefined;
  shouldWrap?: boolean | undefined;
  /** Rendered between children, e.g. "·" or "/". Decorative; hidden from assistive tech. */
  separator?: ReactNode | undefined;
  /** `fill` takes the available inline size. */
  grow?: "hug" | "fill" | undefined;
  /** `inline-flex` keeps the row inline-level, so it can sit in a run of text: a chip, a count beside a label. */
  display?: "flex" | "inline-flex" | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

/** Horizontal layout. Children sit left to right with one token of space between them. */
export function Inline({
  as: Tag = "div",
  space,
  rowSpace,
  alignBlock: ab,
  alignInline: ai,
  spread,
  shouldWrap,
  separator,
  grow,
  display = "flex",
  className,
  children,
  ...rest
}: InlineProps) {
  const items = Children.toArray(children); // toArray already drops null, undefined and booleans
  return (
    <Tag
      className={cn(
        display === "inline-flex" ? "inline-flex flex-row" : "flex flex-row",
        space && spaceClasses.gapX[space],
        rowSpace ? spaceClasses.gapY[rowSpace] : space && spaceClasses.gapY[space],
        ab && alignBlock[ab],
        ai && alignInline[ai],
        spread === "space-between" && "justify-between",
        shouldWrap && "flex-wrap",
        grow === "fill" && "flex-1",
        className,
      )}
      {...rest}
    >
      {separator
        ? items.map((child, i) => (
            <Fragment key={i}>
              {child}
              {i < items.length - 1 ? <span aria-hidden="true">{separator}</span> : null}
            </Fragment>
          ))
        : children}
    </Tag>
  );
}
