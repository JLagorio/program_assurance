import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type KeyValueProps = {
  /** The fact's name, in the label column: "Owner", "Last verified". */
  label: string;
  /** The label column's width, 104 by default; every KeyValue in one rail takes the same. */
  labelWidth?: number | undefined;
  /** Lets a long value run to several lines instead of truncating: a statement, an objective. */
  wrap?: boolean | undefined;
  /** The value: text, a Badge, a Person, a TextLink, an Absent. A plain string that truncates carries its full text as the title. */
  children: ReactNode;
};

/** One rail row: a label column and a value, its own definition list so it is valid wherever it sits. */
export function KeyValue({ label, labelWidth = 104, wrap, children }: KeyValueProps) {
  return (
    <dl
      className="grid items-baseline gap-150 py-050 font-body"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` }}
    >
      <dt className="truncate text-subtle">{label}</dt>
      <dd
        className={cn("min-w-0 text-default", wrap ? "" : "truncate")}
        {...(!wrap && typeof children === "string" ? { title: children } : {})}
      >
        {children}
      </dd>
    </dl>
  );
}
