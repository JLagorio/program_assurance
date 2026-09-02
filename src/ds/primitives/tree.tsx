import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* A hierarchy you open and close: a composition, a folder of documents. The
   caller owns the data and the flattening (which rows are visible, which are
   open); Tree renders the rows with indent guides, a chevron on rows that have
   children, and the tree aria. */
function TreeRoot({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="tree" aria-label={label} className={className}>
      {children}
    </div>
  );
}

function TreeItem({
  depth,
  lines,
  hasChildren = false,
  expanded = false,
  onToggle,
  selected = false,
  onSelect,
  children,
  trailing,
  className,
}: {
  depth: number;
  /** One flag per ancestor level: draw the guide at that depth. Defaults to every level. */
  lines?: boolean[];
  hasChildren?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  const guides = lines ?? Array.from({ length: depth }, () => true);
  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md pr-2 transition-colors duration-100",
        selected ? "bg-primary-soft" : "hover:bg-surface-hover",
        className,
      )}
    >
      <span aria-hidden className="flex h-full shrink-0 items-stretch">
        {guides.map((line, i) => (
          <span
            key={i}
            className={cn("w-4 border-l", line ? "border-border-subtle" : "border-transparent")}
          />
        ))}
      </span>

      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform duration-100", expanded && "rotate-90")}
          />
        </button>
      ) : (
        <span className="size-5 shrink-0" />
      )}

      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {children}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      )}

      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
    </div>
  );
}

export const Tree = Object.assign(TreeRoot, { Item: TreeItem });
