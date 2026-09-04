import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** One rail row: a label column and a value, its own definition list so it is valid wherever it sits. `wrap` lets a long value run to several lines instead of truncating. */
export function KeyValue({
  label,
  labelWidth = 104,
  wrap,
  children,
}: {
  label: string;
  labelWidth?: number | undefined;
  wrap?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <dl
      className="grid items-baseline gap-150 py-050 font-body"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` }}
    >
      <dt className="truncate text-subtle">{label}</dt>
      <dd className={cn("min-w-0 text-default", wrap ? "" : "truncate")}>{children}</dd>
    </dl>
  );
}
