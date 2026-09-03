import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { spaceClasses, type SpaceToken } from "./tokens";

const alignBlock = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
const alignInline = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;

export type StackProps = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Space between children. */
  space?: SpaceToken | undefined;
  /** Position along the block (vertical) axis. */
  alignBlock?: keyof typeof alignBlock | undefined;
  /** Position along the inline (horizontal) axis. */
  alignInline?: keyof typeof alignInline | undefined;
  /** Distribute children with space between them. */
  spread?: "space-between" | undefined;
  /** `fill` takes the available block size. */
  grow?: "hug" | "fill" | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

/** Vertical layout. Children stack top to bottom with one token of space between them. */
export function Stack({ as: Tag = "div", space, alignBlock: ab, alignInline: ai, spread, grow, className, children, ...rest }: StackProps) {
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
