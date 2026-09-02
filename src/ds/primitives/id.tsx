import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Collapsible property group for the record detail rail. */
/** Identifier wrapper. One typeface app-wide since 2026-09-01: it inherits the surrounding
   font, size and colour and only adds tabular numerals. Kept for semantics and grep-ability. */
function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("tnum", className)}>{children}</span>;
}

/** A wrapping run of Mono ids; `empty` when there are none. */
function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string }) {
  if (ids.length === 0) return <span className="text-[12.5px] text-muted-foreground">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <Id key={id} className="text-[11.5px] text-muted-foreground">
          {id}
        </Id>
      ))}
    </span>
  );
}

export const Id = Object.assign(Mono, { List: IdList });
