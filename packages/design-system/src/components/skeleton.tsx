import type { ComponentProps, CSSProperties } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";

/* One shape in any size rather than a skeleton per component: a line, a heading, a circle or a
   block, in the size of what is coming, so the layout holds still. It is hidden from a screen
   reader: the region that waits carries aria-busy, and the wait is said in words, a visible line
   or a label announced once (a Spinner's, or `announce`), since aria-busy alone says nothing. In
   forced colours the shapes are GrayText. */

export type SkeletonShape = "line" | "heading" | "circle" | "block";

const shapes: Record<SkeletonShape, string> = {
  line: "h-150 rounded-small",
  heading: "h-250 rounded-small",
  circle: "rounded-full",
  block: "rounded-medium",
};

export type SkeletonProps = ComponentProps<"div"> & {
  /** `line` (12px, the default) for a line of body text; `heading` (20px) for a title; `circle` for an avatar or an icon, `width` its size; `block` for a card, a chart, an image, at `height`. */
  shape?: SkeletonShape | undefined;
  /** Several lines stacked `space.100` apart. The last is two thirds wide unless width is supplied. Native content replaces these generated lines. Lines only. */
  lines?: number | undefined;
  /** A number in px, or a CSS length. Full width by default; a circle is 32px (`dimension.part.skeletonCircle`). */
  width?: number | string | undefined;
  /** A number in px, or a CSS length. The shape's height by default; a block is 96px (`dimension.part.skeletonBlock`). */
  height?: number | string | undefined;
};

/** A placeholder with native props/ref on its outer div. Hidden by default; the waiting region carries `aria-busy` and says the wait in words. */
export function Skeleton({
  shape = "line",
  lines,
  width,
  height,
  className,
  style,
  children,
  ...props
}: SkeletonProps) {
  const size: CSSProperties = {
    ...(width !== undefined
      ? { width }
      : shape === "circle"
        ? { width: token("dimension.part.skeletonCircle") }
        : {}),
    ...(height !== undefined
      ? { height }
      : shape === "circle"
        ? { height: width ?? token("dimension.part.skeletonCircle") }
        : shape === "block"
          ? { height: token("dimension.part.skeletonBlock") }
          : {}),
  };
  if (shape === "line" && lines && lines > 1)
    return (
      <div
        aria-hidden
        {...props}
        data-slot="skeleton"
        className={cn("flex flex-col gap-100", className)}
        style={style}
      >
        {children !== undefined || props.dangerouslySetInnerHTML !== undefined
          ? children
          : Array.from({ length: lines }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-full animate-pulse bg-skeleton",
                  shapes.line,
                  i === lines - 1 && "w-2/3",
                )}
                style={size}
              />
            ))}
      </div>
    );
  return (
    <div
      aria-hidden
      {...props}
      data-slot="skeleton"
      className={cn("w-full animate-pulse bg-skeleton", shapes[shape], className)}
      style={{ ...size, ...style }}
    >
      {children}
    </div>
  );
}
