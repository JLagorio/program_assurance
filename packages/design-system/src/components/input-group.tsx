import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type InputGroupProps = {
  /** An icon at the start, inside the field's padding: the search glass, a calendar. It decorates; the field's label or `aria-label` still names it. */
  leading?: ReactNode;
  /** A unit or a shortcut hint at the end: "days", "kg", "⌘K". Static text or an icon; an action belongs beside the field, not inside it. For an Input only: a NativeSelect keeps its chevron there. */
  trailing?: ReactNode;
  /** The width in pixels for a group that stands alone, such as a search box. In a form's Grid the column sets it. */
  width?: number | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** One Input or one NativeSelect. */
  children: ReactNode;
};

/** An Input or a NativeSelect with an icon at the start or a unit or shortcut at the end, inside the field's padding. The ends render after the control so they paint above it: a NativeSelect's wrapper is positioned and would cover them otherwise. */
export function InputGroup({ leading, trailing, width, className, children }: InputGroupProps) {
  return (
    <span
      className={cn(
        "relative block",
        leading && "[&>input]:ps-400 [&>span>select]:ps-400",
        trailing && "[&>input]:pe-500 [&>span>select]:pe-500",
        className,
      )}
      style={width ? { width } : undefined}
    >
      {children}
      {leading ? (
        <span
          aria-hidden
          className="pointer-events-none absolute start-100 top-1/2 flex -translate-y-1/2 items-center icon-subtle [&_svg]:size-icon-small"
        >
          {leading}
        </span>
      ) : null}
      {trailing ? (
        <span
          aria-hidden
          className="pointer-events-none absolute end-100 top-1/2 flex -translate-y-1/2 items-center gap-050 font-body-xsmall text-subtle [&_svg]:size-icon-small"
        >
          {trailing}
        </span>
      ) : null}
    </span>
  );
}
