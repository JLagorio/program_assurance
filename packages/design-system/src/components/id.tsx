import type { CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";

export type IdProps = {
  /** The identifier: CTRL-0412, AC-2(3), FND-2231. */
  children: ReactNode;
  /** The colour or size it takes from its place: `text-subtle` in a row's id column, `break-all` for a hash. */
  className?: string | undefined;
  style?: CSSProperties | undefined;
};

/** An identifier. One typeface app-wide: it inherits the surrounding font, size and colour and only adds tabular numerals. Kept for semantics and grep-ability. */
function Mono({ children, className, style }: IdProps) {
  return (
    <span className={cn("tabular-nums", className)} style={style}>
      {children}
    </span>
  );
}

export type IdListProps = {
  /** The identifiers, in order. */
  ids: string[];
  /** What to say when there are none; a muted dash by default. */
  empty?: string | undefined;
};

/** A wrapping run of ids; `empty` when there are none. */
export function IdList({ ids, empty = "—" }: IdListProps) {
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
