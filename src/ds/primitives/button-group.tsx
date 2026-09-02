import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Buttons that belong together read as one control: the corners join and the
   inner borders collapse. Children are Buttons or IconButtons of one size. */
export function ButtonGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      role="group"
      className={cn(
        "inline-flex items-stretch",
        "[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md",
        "[&>*:not(:first-child)]:-ml-px [&>*]:relative [&>*:hover]:z-10 [&>*:focus-visible]:z-10",
        className,
      )}
    >
      {children}
    </span>
  );
}
