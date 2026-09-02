import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, toneClasses, type Tone } from "./badge";

/** Tinted callout in a rail or above a table: Dot, a title in the tone colour, optional body. */
export function Alert({ tone = "warning", title, children, className }: { tone?: Tone | undefined; title?: ReactNode; children?: ReactNode; className?: string | undefined }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex flex-col gap-075 rounded-medium px-150 py-100 font-body", toneClasses[tone].subtle, className)}>
      {title ? (
        <div className="flex items-start gap-100 font-medium">
          <span className="flex h-250 items-center">
            <Dot tone={tone} />
          </span>
          <span className="min-w-0">{title}</span>
        </div>
      ) : null}
      {children ? <div>{children}</div> : null}
    </div>
  );
}
