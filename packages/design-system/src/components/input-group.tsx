import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** An Input with something at either end: a search icon, a unit, a shortcut hint, a clear button. The child is any Input or NativeSelect. */
export function InputGroup({ leading, trailing, width, className, children }: { leading?: ReactNode; trailing?: ReactNode; width?: number | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <span
      className={cn("relative block", leading && "[&>input]:ps-400 [&>span>select]:ps-400", trailing && "[&>input]:pe-500 [&>span>select]:pe-500", className)}
      style={width ? { width } : undefined}
    >
      {leading ? <span className="pointer-events-none absolute start-100 top-1/2 flex -translate-y-1/2 items-center icon-subtle [&_svg]:size-icon-small">{leading}</span> : null}
      {children}
      {trailing ? <span className="absolute end-100 top-1/2 flex -translate-y-1/2 items-center gap-050 font-body-xsmall text-subtle [&_svg]:size-icon-small">{trailing}</span> : null}
    </span>
  );
}
