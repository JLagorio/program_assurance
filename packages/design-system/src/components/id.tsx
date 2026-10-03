import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type IdProps = Omit<ComponentProps<"span">, "children"> & {
  /** The identifier: CTRL-0412, AC-2(3), FND-2231. */
  children: ReactNode;
  /**
   * The colour or size it takes from its place: `text-subtle` in a row's id column, `break-all`
   * for a hash.
   * @accepts color typography break-all
   */
  className?: string | undefined;
};

/** An identifier. One typeface app-wide: it inherits the surrounding font, size and colour and only adds tabular numerals. Kept for semantics and grep-ability. Native span props and the ref reach the span. */
function Mono({ children, className, ...props }: IdProps) {
  return (
    <span {...props} className={cn("tabular-nums", className)} data-slot="id">
      {children}
    </span>
  );
}

export type IdListProps = Omit<ComponentProps<"span">, "children"> & {
  /** The identifiers, in order. */
  ids: string[];
  /** What to say when there are none; a muted dash by default. */
  empty?: string | undefined;
  className?: string | undefined;
};

/** A wrapping run of ids; `empty` when there are none. Native span props and the ref reach the run, or the empty word. */
export function IdList({ ids, empty = "—", className, ...props }: IdListProps) {
  if (ids.length === 0)
    return (
      <span
        {...props}
        className={cn("font-body-small text-subtlest", className)}
        data-slot="id-list"
        data-empty=""
      >
        {empty}
      </span>
    );
  return (
    <span {...props} className={cn("flex flex-wrap gap-050", className)} data-slot="id-list">
      {ids.map((id, index) => (
        <Id key={`${id}-${index}`} className="font-body-xsmall text-subtle">
          {id}
        </Id>
      ))}
    </span>
  );
}

export const Id = Object.assign(Mono, { List: IdList });
