import type { ReactNode } from "react";

import { Count } from "../components/badge";

/* Reference material. A region of work: a heading with a count or an action, a rule above it,
   and the work under it, always open. Carbon's accordion says not to fold content the reader
   will read; a block is that content. Collapsible is its closed twin for reference; Section is
   the plain region for what the reader reads. None takes an explanation under the heading. */

export type BlockProps = {
  /** The work, a noun, an h2: "Evidence", "Open findings", "Determination". */
  title: ReactNode;
  /** A Count after the title: how many rows the block holds. Zero shows; null hides it. */
  count?: number | string | null | undefined;
  /** At the end of the heading's line: one small button, the verb that adds to the block. */
  action?: ReactNode;
  /** The work: a table, a form, a list, a narrative. */
  children: ReactNode;
};

/** A block of work, always open: a rule, a heading with a count or an action, and the work. Collapsible is its closed twin. */
export function Block({ title, count, action, children }: BlockProps) {
  return (
    <section className="border-t border-default pt-100">
      <div className="flex h-control-small items-center gap-100">
        <h2 className="min-w-0 truncate font-body font-medium text-default">{title}</h2>
        {count != null ? <Count value={count} /> : null}
        {action ? <span className="ms-auto flex shrink-0 items-center gap-100">{action}</span> : null}
      </div>
      <div className="pb-200 pt-050">{children}</div>
    </section>
  );
}
