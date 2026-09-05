import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import {
  classFor,
  inverseFor,
  isSurface,
  spaceClasses,
  type BackgroundToken,
  type LayoutElement,
  type SpaceToken,
} from "./tokens";
import { tokens } from "../generated/tokens";

/* Box is the fundamental block: padding on every edge as space tokens, a backgroundColor token,
   `as` for any non-interactive element (never an `a` or a `button`: those are TextLink and
   Button), `style` as a last resort, and no margin, ever. A Box with a bold background paints its
   text inverse, and publishes its surface as the current surface for sticky and masking
   children. A surface is named, never counted: nesting does not step the background. */

export type BoxProps = {
  /** The element: a container, a landmark, a list or a list part. Never a link or a button: TextLink and Button carry the ring, the face and the name. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Padding on every side. */
  padding?: SpaceToken | undefined;
  /** Padding on the block (vertical) axis. */
  paddingBlock?: SpaceToken | undefined;
  /** Padding on the inline (horizontal) axis. */
  paddingInline?: SpaceToken | undefined;
  paddingBlockStart?: SpaceToken | undefined;
  paddingBlockEnd?: SpaceToken | undefined;
  paddingInlineStart?: SpaceToken | undefined;
  paddingInlineEnd?: SpaceToken | undefined;
  /** A semantic background or an elevation surface. A surface is also published as the current surface for sticky and masking children; a bold fill paints its text inverse. */
  backgroundColor?: BackgroundToken | undefined;
  className?: string | undefined;
  /** Runtime values only: a width measured or computed at render. A design value is a token or a class. The other layout primitives take no style; a computed dimension is a Box's. */
  style?: CSSProperties | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/**
 * The fundamental block. Padding and background are token-typed; there are no margin props,
 * spacing between siblings comes from Stack, Inline and Bleed. Modelled on @atlaskit/primitives Box.
 */
export function Box({
  as = "div",
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
  const Tag = as as ElementType;
  const inverse = backgroundColor ? inverseFor(backgroundColor) : undefined;
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
        inverse && classFor(inverse),
        className,
      )}
      style={surfaceStyle || style ? { ...surfaceStyle, ...style } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
