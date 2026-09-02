import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Buttons that belong together read as one control: the corners join and a hairline sits between. Children are Buttons or IconButtons of one size. */
export function ButtonGroup({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <span
      role="group"
      className={cn(
        "inline-flex items-stretch",
        "[&>*]:rounded-none [&>*:first-child]:rounded-s-medium [&>*:last-child]:rounded-e-medium [&>*+*]:border-s [&>*+*]:border-default [&>*]:relative [&>*:hover]:z-10 [&>*:focus-visible]:z-10",
        className,
      )}
    >
      {children}
    </span>
  );
}
