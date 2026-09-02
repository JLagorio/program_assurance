import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { classFor, isSurface, spaceClasses, type BackgroundToken, type SpaceToken } from "./tokens";
import { tokens } from "../generated/tokens";

export type BoxProps = {
  as?: ElementType;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  /** Padding on every side. */
  padding?: SpaceToken;
  paddingBlock?: SpaceToken;
  paddingInline?: SpaceToken;
  paddingBlockStart?: SpaceToken;
  paddingBlockEnd?: SpaceToken;
  paddingInlineStart?: SpaceToken;
  paddingInlineEnd?: SpaceToken;
  /** A semantic background or an elevation surface. A surface is also published as the current surface for sticky and masking children. */
  backgroundColor?: BackgroundToken;
  className?: string;
  style?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/**
 * The fundamental block. Padding and background are token-typed; there are no margin props,
 * spacing between siblings comes from Stack, Inline and Bleed. Modelled on @atlaskit/primitives Box.
 */
export function Box({
  as: Tag = "div",
  padding,
  paddingBlock,
  paddingInline,
  paddingBlockStart,
  paddingBlockEnd,
  paddingInlineStart,
  paddingInlineEnd,
  backgroundColor,
  className,
  style,
  children,
  ...rest
}: BoxProps) {
  const surfaceStyle: CSSProperties | undefined =
    backgroundColor && isSurface(backgroundColor)
      ? ({ "--ds-utility-elevation-surface-current": `var(${tokens[backgroundColor]})` } as CSSProperties)
      : undefined;
  return (
    <Tag
      className={cn(
        padding && spaceClasses.p[padding],
        paddingBlock && spaceClasses.py[paddingBlock],
        paddingInline && spaceClasses.px[paddingInline],
        paddingBlockStart && spaceClasses.pt[paddingBlockStart],
        paddingBlockEnd && spaceClasses.pb[paddingBlockEnd],
        paddingInlineStart && spaceClasses.ps[paddingInlineStart],
        paddingInlineEnd && spaceClasses.pe[paddingInlineEnd],
        backgroundColor && classFor(backgroundColor),
        className,
      )}
      style={surfaceStyle || style ? { ...surfaceStyle, ...style } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
