import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** One rail row. `wrap` lets a long value run to several lines instead of truncating. */
export function KeyValue({
  label,
  wrap,
  children,
}: {
  label: string;
  wrap?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
      <dt className="truncate text-[12.5px] text-muted-foreground">{label}</dt>
      <dd
        className={cn("min-w-0 text-[12.5px] text-foreground", wrap ? "leading-snug" : "truncate")}
      >
        {children}
      </dd>
    </div>
  );
}
