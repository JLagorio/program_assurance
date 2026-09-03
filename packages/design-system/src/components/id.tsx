import type { CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";

/** An identifier. One typeface app-wide: it inherits the surrounding font, size and colour and only adds tabular numerals. Kept for semantics and grep-ability. */
function Mono({ children, className, style }: { children: ReactNode; className?: string | undefined; style?: CSSProperties | undefined }) {
  return <span className={cn("tabular-nums", className)} style={style}>{children}</span>;
}

/** A wrapping run of ids; `empty` when there are none. */
function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string | undefined }) {
  if (ids.length === 0) return <span className="font-body-small text-subtlest">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-050">
      {ids.map((id) => (
        <Id key={id} className="font-body-xsmall text-subtle">
          {id}
        </Id>
      ))}
    </span>
  );
}

export const Id = Object.assign(Mono, { List: IdList });
