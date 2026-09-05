import { ChevronRight } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";

/* Reference material. A hierarchy the caller flattens: it owns the data, the open set and the
   selection, and renders one row per visible node. The tree owns the keyboard: one tab stop, the
   arrows move and open, Enter selects. Carbon's tree view and the ARIA tree pattern are the models. */

export type TreeSize = "small" | "xsmall";

const TreeContext = createContext<{ size: TreeSize } | null>(null);

export type TreeProps = {
  /** The tree's accessible name: "Control families", "System composition". */
  label: string;
  /** `small` is Carbon's default, 32px rows; `xsmall` is 24px, for a deep tree that must show more at once. */
  size?: TreeSize | undefined;
  /** Tree.Item rows, in visible order, one per open node. */
  children: ReactNode;
  className?: string | undefined;
};

/** A hierarchy you open and close. The caller owns the data and the flattening; Tree renders the rows with indent guides, a chevron on rows that have children, and the tree aria and keyboard. */
function TreeRoot({ label, size = "small", children, className }: TreeProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!root.querySelector('[role="treeitem"][tabindex="0"]')) {
      const first = root.querySelector<HTMLElement>('[role="treeitem"]');
      if (first) first.tabIndex = 0;
    }
  });
  return (
    <TreeContext.Provider value={{ size }}>
      <div ref={ref} role="tree" aria-label={label} className={className}>
        {children}
      </div>
    </TreeContext.Provider>
  );
}

export type TreeItemProps = {
  /** How deep the node sits, 0 at the root. One indent per level. */
  depth: number;
  /** One flag per ancestor level: draw the guide at that depth. Defaults to every level. */
  lines?: boolean[] | undefined;
  /** A branch: the row takes a chevron and `aria-expanded`. */
  hasChildren?: boolean | undefined;
  /** The branch is open. */
  expanded?: boolean | undefined;
  /** Opens or closes the branch: the chevron, Right and Left. */
  onToggle?: (() => void) | undefined;
  /** The row is the selected node. It is the tree's tab stop. */
  isSelected?: boolean | undefined;
  /** Selects the node: a click on the row, Enter or Space. */
  onSelect?: (() => void) | undefined;
  /** The node's icon and label. Every row of a tree takes an icon, or none does. */
  children: ReactNode;
  /** At the end of the row: a Count, a Badge, a Dot. A button here is a tab stop of its own. */
  trailing?: ReactNode;
  className?: string | undefined;
};

/** One visible node. The row is the tree item: focusable, selected on a click, opened on its chevron. */
export function TreeItem({
  depth,
  lines,
  hasChildren = false,
  expanded = false,
  onToggle,
  isSelected = false,
  onSelect,
  children,
  trailing,
  className,
}: TreeItemProps) {
  const size = useContext(TreeContext)?.size ?? "small";
  const guides = lines ?? Array.from({ length: depth }, () => true);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const tree = e.currentTarget.closest('[role="tree"]');
    const items = tree ? Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')) : [];
    const i = items.indexOf(e.currentTarget);
    const level = depth + 1;
    const focus = (el: HTMLElement | undefined) => {
      if (!el) return;
      el.focus();
      e.preventDefault();
    };
    switch (e.key) {
      case "ArrowDown":
        focus(items[i + 1]);
        break;
      case "ArrowUp":
        focus(items[i - 1]);
        break;
      case "Home":
        focus(items[0]);
        break;
      case "End":
        focus(items[items.length - 1]);
        break;
      case "ArrowRight":
        if (hasChildren && !expanded) {
          onToggle?.();
          e.preventDefault();
        } else if (hasChildren && expanded) {
          focus(items[i + 1]);
        }
        break;
      case "ArrowLeft":
        if (hasChildren && expanded) {
          onToggle?.();
          e.preventDefault();
        } else {
          focus(
            items
              .slice(0, i)
              .reverse()
              .find((el) => Number(el.getAttribute("aria-level")) < level),
          );
        }
        break;
      case "Enter":
      case " ":
        if (onSelect) {
          onSelect();
          e.preventDefault();
        }
        break;
    }
  };

  return (
    <div
      role="treeitem"
      tabIndex={isSelected ? 0 : -1}
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? expanded : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-075 rounded-medium pe-100 outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused",
        size === "small" ? "h-control-medium" : "h-control-xsmall",
        isSelected ? "bg-selected" : "hover:bg-neutral-subtle-hovered",
        onSelect && "cursor-pointer",
        className,
      )}
    >
      <span aria-hidden className="flex h-full shrink-0 items-stretch">
        {guides.map((line, i) => (
          <span key={i} className={cn("w-200", line && "border-s border-default")} />
        ))}
      </span>
      {hasChildren ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="inline-flex size-250 shrink-0 items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default"
        >
          <ChevronRight
            className={cn(
              "size-icon-small transition-transform duration-fast ease-standard",
              expanded && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span aria-hidden className="inline-flex size-250 shrink-0 items-center justify-center">
          <span className="size-050 rounded-full bg-neutral-pressed" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-100 font-body text-default">
        {children}
      </span>
      {trailing ? (
        <span className="flex shrink-0 items-center gap-100" onClick={(e) => e.stopPropagation()}>
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export const Tree = Object.assign(TreeRoot, { Item: TreeItem });
