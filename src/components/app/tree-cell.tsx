/**
 * Candidate for the kit as `Table.Tree` — flagged 2026-09-02, decision open.
 *
 * The kit's Tree is a list: one label per row, no columns. The system tree
 * needs a hierarchy whose rows also carry columns (the ARIA treegrid: Jira
 * plans, Asana subtasks, Airtable groups), and the kit has no cell for that.
 * This is the cell, on the kit's own Tree recipe — the same indent per level,
 * the same chevron, the same hover — so it moves into packages/design-system
 * unchanged if the decision is "kit", and stays here if it is "bespoke to the
 * spine". Nothing in it knows about programs or scopes.
 */

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn, Inline, Table } from "@ledger/design-system";

/** One level of indent, the width of the kit Tree's guide column. */
const indent = 16;

export function TreeCell({
  depth,
  hasChildren = false,
  expanded = false,
  onToggle,
  label,
  hint,
  children,
}: {
  depth: number;
  hasChildren?: boolean | undefined;
  expanded?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  /** The row's plain name, for the chevron's accessible label. */
  label: string;
  /** Muted text after the name: a folded count, a kind. */
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Table.Cell className="max-w-none">
      <Inline
        style={{ paddingInlineStart: depth * indent }}
        as="span"
        space="space.050"
        alignBlock="center"
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="inline-flex size-250 shrink-0 items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused"
          >
            <ChevronRight
              className={cn(
                "size-icon-small transition-transform duration-fast ease-standard",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span aria-hidden className="block size-250 shrink-0" />
        )}
        <span className="truncate">{children}</span>
        {hint}
      </Inline>
    </Table.Cell>
  );
}
