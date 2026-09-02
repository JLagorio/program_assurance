import type { CSSProperties } from "react";

import { cn } from "../lib/cn";

/** A placeholder for content that is loading. One bar by default; `lines` stacks several with the last one shorter. Size it with className so the layout holds still. */
export function Skeleton({ lines, className, style }: { lines?: number | undefined; className?: string | undefined; style?: CSSProperties | undefined }) {
  if (lines && lines > 1)
    return (
      <div aria-hidden className={cn("flex flex-col gap-100", className)} style={style}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={cn("h-150 animate-pulse rounded-small bg-skeleton", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    );
  return <div aria-hidden className={cn("h-150 w-full animate-pulse rounded-small bg-skeleton", className)} style={style} />;
}
