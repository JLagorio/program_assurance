import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Source shown as source: a line-number gutter that stays put when the block scrolls sideways, one row per line, the code face. `lines` are already-rendered nodes so the caller owns highlighting. */
export function CodeBlock({
  lines,
  start = 1,
  maxHeight = 560,
  label = "Code",
  className,
}: {
  lines: ReactNode[];
  start?: number | undefined;
  maxHeight?: number | undefined;
  /** The region's accessible name: the file, the format. */ label?: string | undefined;
  className?: string | undefined;
}) {
  const width = String(start + lines.length - 1).length;
  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "overflow-auto rounded-medium border border-default bg-surface-sunken outline-none focus-visible:outline-focused",
        className,
      )}
      style={{ maxHeight }}
    >
      <pre className="w-max min-w-full py-050 font-code text-default">
        {lines.map((line, i) => (
          <div key={start + i} className="flex">
            <span
              className="sticky start-0 shrink-0 select-none border-e border-default bg-surface-sunken px-100 text-end text-subtlest tabular-nums"
              style={{ width: `${Math.max(width, 3) + 2.5}ch` }}
            >
              {start + i}
            </span>
            <span className="px-150">{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
