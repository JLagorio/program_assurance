import type { ReactNode } from "react";

import { Count } from "../components/badge";

/* Reference material. None of Carbon, Base Web or Atlassian has a section of its own; a page
   region is a heading and what follows it. This is that, with the rule the system draws under a
   region's heading. The heading may carry a count or a constraint, never an explanation: Block
   is the same region for work, Collapsible for reference that folds. */

export type SectionProps = {
  /** The region's name, an h2: "Control coverage", "Evidence". A noun. */
  title: ReactNode;
  /** A Count after the title: how many rows the region holds. */
  count?: number | string | null | undefined;
  /** One line under the title, subtle: a constraint or a source ("Derived from the live matrix"), not what the region means. */
  description?: ReactNode;
  /** At the end of the heading's line: a TextLink to the whole, or one small button. */
  action?: ReactNode;
  className?: string | undefined;
  /** The region's body. It sets its own space from the rule: `space.150` for text, none for a table. */
  children: ReactNode;
};

/** A titled region of a page with a rule under its heading. Block for work, Collapsible for reference that folds; Section is the plain one. */
export function Section({ title, count, description, action, children, className }: SectionProps) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-200 border-b border-default pb-100">
        <div className="flex min-w-0 flex-col gap-025">
          <div className="flex min-w-0 items-center gap-100">
            <h2 className="min-w-0 truncate font-body font-medium text-default">{title}</h2>
            {count != null ? <Count value={count} /> : null}
          </div>
          {description ? <p className="font-body-small text-subtle">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-100">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
