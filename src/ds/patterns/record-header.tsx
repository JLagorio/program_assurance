import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Id } from "../primitives/id";

/** Compact record-page header: back chevron, id, title, meta — no breadcrumb. */
export function RecordHeader({
  backTo,
  backParams,
  id,
  title,
  meta,
  actions,
  below,
}: {
  backTo: string;
  backParams?: Record<string, string>;
  id: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Persistent state strip rendered under the title row (e.g. lifecycle). */
  below?: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <Link
          to={backTo}
          params={backParams as never}
          aria-label="Back"
          className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Id className="text-muted-foreground">{id}</Id>
            {meta ? (
              <span className="truncate text-[12px] text-muted-foreground">{meta}</span>
            ) : null}
          </div>
          <h1 className="mt-0.5 text-[18px] font-semibold leading-tight tracking-[-0.015em]">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {below}
    </div>
  );
}
