import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Source shown as source: a line-number gutter that stays put when the block
   scrolls sideways, one row per line, the kit's mono face. `lines` are
   already-rendered nodes so the caller owns highlighting; `start` is the
   number of the first one when the block is a window into a longer file. */
export function CodeBlock({
  lines,
  start = 1,
  maxHeight = 560,
  className,
}: {
  lines: ReactNode[];
  start?: number;
  maxHeight?: number;
  className?: string;
}) {
  const width = String(start + lines.length - 1).length;
  return (
    <div
      className={cn("overflow-auto rounded-md border border-border bg-subtle", className)}
      style={{ maxHeight }}
    >
      <pre className="w-max min-w-full py-1 font-mono text-[11.5px] leading-[1.55]">
        {lines.map((line, i) => (
          <div key={start + i} className="flex">
            <span
              className="tnum sticky left-0 shrink-0 select-none border-r border-border bg-subtle px-2 text-right text-muted-foreground"
              style={{ width: `${Math.max(width, 3) + 2.5}ch` }}
            >
              {start + i}
            </span>
            <span className="px-3">{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
