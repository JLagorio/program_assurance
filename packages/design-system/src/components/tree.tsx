import { useRender } from "@base-ui/react/use-render";
import { ChevronRight } from "lucide-react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";

/* A hierarchy the caller flattens: it owns the data, the open set and the
   selection, and renders one row per visible node. The tree owns the keyboard: one tab stop, the
   arrows move and open, Enter selects: the ARIA tree pattern. */

export type TreeSize = "small" | "xsmall";

const TreeContext = createContext<{ size: TreeSize } | null>(null);

const rowsOf = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter(
    (row) => row.closest('[role="tree"]') === root,
  );

const setEntry = (rows: HTMLElement[], entry: HTMLElement | undefined) => {
  for (const row of rows) row.tabIndex = row === entry ? 0 : -1;
};

export type TreeProps = ComponentProps<"div"> & {
  /** The tree's accessible name: "Control families", "System composition". */
  label: string;
  /** `small` is the default, 32px rows; `xsmall` is 24px, for a deep tree that must show more at once. */
  size?: TreeSize | undefined;
  /** Tree.Item rows, in visible order, one per open node. */
  children: ReactNode;
  className?: string | undefined;
};

/** A hierarchy you open and close. The caller owns the data and the flattening; Tree renders the rows with indent guides, a chevron on rows that have children, and the tree aria and keyboard. */
function TreeRoot({ label, size = "small", onFocusCapture, onKeyDown, ...props }: TreeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef<HTMLElement | null>(null);
  const previousRows = useRef<HTMLElement[]>([]);
  const search = useRef({ text: "", time: 0 });
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const document = root.ownerDocument;
    const synchronize = () => {
      const rows = rowsOf(root);
      const removed = focused.current && !rows.includes(focused.current);
      const oldIndex = focused.current ? previousRows.current.indexOf(focused.current) : -1;
      const preceding = previousRows.current
        .slice(0, oldIndex)
        .reverse()
        .find((row) => rows.includes(row));
      const activeRow = document.activeElement?.closest<HTMLElement>('[role="treeitem"]');
      const active = activeRow && rows.includes(activeRow) ? activeRow : undefined;
      const entry =
        active ??
        (focused.current && rows.includes(focused.current) ? focused.current : undefined) ??
        (removed ? preceding : undefined) ??
        rows.find((row) => row.getAttribute("aria-selected") === "true") ??
        rows[0];
      setEntry(rows, entry);
      if (
        removed &&
        entry &&
        (document.activeElement === document.body || active !== undefined)
      ) {
        entry.focus();
        focused.current = entry;
      }
      const ancestors: HTMLElement[] = [];
      const siblings = new Map<HTMLElement | undefined, HTMLElement[]>();
      for (const row of rows) {
        const level = Number(row.getAttribute("aria-level")) || 1;
        ancestors.length = Math.max(0, level - 1);
        const parent = ancestors[level - 2];
        const group = siblings.get(parent) ?? [];
        group.push(row);
        siblings.set(parent, group);
        ancestors[level - 1] = row;
      }
      for (const group of siblings.values())
        group.forEach((row, index) => {
          if (!row.hasAttribute("data-tree-position"))
            row.setAttribute("aria-posinset", String(index + 1));
          if (!row.hasAttribute("data-tree-size"))
            row.setAttribute("aria-setsize", String(group.length));
        });
      previousRows.current = rows;
    };
    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-selected", "aria-level", "data-tree-position", "data-tree-size"],
    });
    return () => observer.disconnect();
  }, []);
  const element = useRender({
    defaultTagName: "div",
    ref,
    props: {
      ...props,
      role: "tree",
      "aria-label": props["aria-label"] ?? label,
      onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
        onFocusCapture?.(event);
        if (event.defaultPrevented) return;
        const row = (event.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
        if (row && row.closest('[role="tree"]') === event.currentTarget) {
          focused.current = row;
          setEntry(rowsOf(event.currentTarget), row);
        }
      },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.key.length !== 1 ||
          event.key === " "
        )
          return;
        const target = event.target as HTMLElement;
        if (
          target.getAttribute("role") !== "treeitem" ||
          target.closest('[role="tree"]') !== event.currentTarget
        )
          return;
        const now = Date.now();
        const letter = event.key.toLocaleLowerCase();
        const prior = now - search.current.time < 700 ? search.current.text : "";
        const text = prior && [...prior].every((c) => c === letter) ? letter : prior + letter;
        search.current = { text, time: now };
        const rows = rowsOf(event.currentTarget);
        const index = rows.indexOf(event.target as HTMLElement);
        const match = [...rows.slice(index + 1), ...rows.slice(0, index + 1)].find((row) =>
          (row.querySelector("[data-tree-label]")?.textContent ?? "")
            .trim()
            .toLocaleLowerCase()
            .startsWith(text),
        );
        if (match) {
          event.preventDefault();
          match.focus();
        }
      },
    },
  });
  return <TreeContext.Provider value={{ size }}>{element}</TreeContext.Provider>;
}

export type TreeItemProps = Omit<ComponentProps<"div">, "onSelect"> & {
  /** How deep the node sits, 0 at the root. One indent per level. */
  depth: number;
  /** Explicit sibling metadata for partial or virtualized trees. Otherwise inferred from visible rows. */
  posInSet?: number | undefined;
  setSize?: number | undefined;
  /** One flag per ancestor level: draw the guide at that depth. Defaults to every level. */
  lines?: boolean[] | undefined;
  /** A branch: the row takes a chevron and `aria-expanded`. */
  hasChildren?: boolean | undefined;
  /** The branch is open. */
  expanded?: boolean | undefined;
  /** Opens or closes the branch: the chevron, Right and Left. */
  onToggle?: (() => void) | undefined;
  /** The row is selected. It is the initial tab stop; keyboard focus can move independently. */
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
  posInSet,
  setSize,
  lines,
  hasChildren = false,
  expanded = false,
  onToggle,
  isSelected = false,
  onSelect,
  children,
  trailing,
  className,
  onClick,
  onKeyDown,
  ...props
}: TreeItemProps) {
  const size = useContext(TreeContext)?.size ?? "small";
  const guides = lines ?? Array.from({ length: depth }, () => true);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    const tree = e.currentTarget.closest('[role="tree"]');
    const items = tree ? rowsOf(tree) : [];
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
          const child = items[i + 1];
          if (child && Number(child.getAttribute("aria-level")) > level) focus(child);
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
      {...props}
      role="treeitem"
      aria-posinset={posInSet ?? props["aria-posinset"]}
      aria-setsize={setSize ?? props["aria-setsize"]}
      data-tree-position={(posInSet ?? props["aria-posinset"]) === undefined ? undefined : ""}
      data-tree-size={(setSize ?? props["aria-setsize"]) === undefined ? undefined : ""}
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? expanded : undefined}
      onClick={(event) => {
        onClick?.(event);
        const target = event.target as HTMLElement;
        if (
          event.defaultPrevented ||
          target.closest('[role="treeitem"]') !== event.currentTarget ||
          target.closest('button, a, input, select, textarea, [contenteditable="true"]')
        )
          return;
        event.currentTarget.focus();
        onSelect?.();
      }}
      onKeyDown={handleKeyDown}
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
            e.currentTarget.closest<HTMLElement>('[role="treeitem"]')?.focus();
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
      <span
        data-tree-label
        className="flex min-w-0 flex-1 items-center gap-100 font-body text-default"
      >
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
