import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** A hierarchy you open and close. The caller owns the data and the flattening; Tree renders the rows with indent guides, a chevron on rows that have children, and the tree aria. */
function TreeRoot({ label, children, className }: { label: string; children: ReactNode; className?: string | undefined }) {
  return (
    <div role="tree" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export type TreeItemProps = {
  depth: number;
  /** One flag per ancestor level: draw the guide at that depth. Defaults to every level. */
  lines?: boolean[] | undefined;
  hasChildren?: boolean | undefined;
  expanded?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  isSelected?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string | undefined;
};

function TreeItem({ depth, lines, hasChildren = false, expanded = false, onToggle, isSelected = false, onSelect, children, trailing, className }: TreeItemProps) {
  const guides = lines ?? Array.from({ length: depth }, () => true);
  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? expanded : undefined}
      className={cn("flex h-control-medium items-center gap-075 rounded-medium pe-100 transition-colors duration-fast ease-standard", isSelected ? "bg-selected" : "hover:bg-neutral-subtle-hovered", className)}
    >
      <span aria-hidden className="flex h-full shrink-0 items-stretch">
        {guides.map((line, i) => (
          <span key={i} className={cn("w-200", line && "border-s border-default")} />
        ))}
      </span>
      {hasChildren ? (
        <button type="button" onClick={onToggle} aria-label={expanded ? "Collapse" : "Expand"} className="inline-flex size-250 shrink-0 items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused">
          <ChevronRight className={cn("size-icon-small transition-transform duration-fast ease-standard", expanded && "rotate-90")} />
        </button>
      ) : (
        <span aria-hidden className="inline-flex size-250 shrink-0 items-center justify-center">
          <span className="size-050 rounded-full bg-neutral-pressed" />
        </span>
      )}
      {onSelect ? (
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-100 text-left font-body text-default outline-none focus-visible:outline-focused">
          {children}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-100 font-body text-default">{children}</span>
      )}
      {trailing ? <span className="flex shrink-0 items-center gap-100">{trailing}</span> : null}
    </div>
  );
}

export const Tree = Object.assign(TreeRoot, { Item: TreeItem });
