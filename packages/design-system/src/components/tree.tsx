import { useRender } from "@base-ui/react/use-render";
import { ChevronRight } from "lucide-react";
import {
  Children,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { textOf } from "./option-text";
import { Truncate } from "./truncate";

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

/** What a click on a row leaves to itself: a control or a focusable element inside the row. */
const CONTROL =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex], [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="option"], [role="tab"], [role="combobox"], [role="slider"], [role="textbox"]';

/**
 * Text in a row's label or trailing slot, cut to one line with an ellipsis; icons and other
 * elements pass through. Neighbouring strings and numbers form one run, so `{count} controls` stays
 * one piece of text. The label's text shows whole while it is cut, on hover and on keyboard focus
 * of the row; other text (`ownTitle`) is its own tooltip on hover, so the row's focus reveals one
 * thing, the name.
 */
function cutText(children: ReactNode, ownTitle = false): { nodes: ReactNode[]; hasText: boolean } {
  const nodes: ReactNode[] = [];
  let run = "";
  let hasText = false;
  const flush = () => {
    if (run.trim()) {
      nodes.push(
        <Truncate key={`text-${nodes.length}`} {...(ownTitle ? { title: run.trim() } : {})}>
          {run}
        </Truncate>,
      );
      hasText = true;
    }
    run = "";
  };
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") run += String(child);
    else {
      flush();
      nodes.push(child);
    }
  }
  flush();
  return { nodes, hasText };
}

/** Whether the element's text reads right to left, where Right closes and Left opens. */
const rightToLeft = (element: Element) => getComputedStyle(element).direction === "rtl";

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
      if (removed && entry && (document.activeElement === document.body || active !== undefined)) {
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
      "data-slot": "tree",
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
  isExpanded?: boolean | undefined;
  /**
   * The branch is open.
   * @deprecated Use `isExpanded`, the name that matches `isSelected`; `expanded` is read for one version.
   */
  expanded?: boolean | undefined;
  /** Opens or closes the branch: the chevron, Right and Left. */
  onToggle?: (() => void) | undefined;
  /** The row is selected. It is the initial tab stop; keyboard focus can move independently. A row that takes neither this nor `onSelect` is not selectable and carries no `aria-selected`. */
  isSelected?: boolean | undefined;
  /** Selects the node: a click on the row, Enter or Space. */
  onSelect?: (() => void) | undefined;
  /** The node's icon and label, the row's accessible name. Every row of a tree takes an icon, or none does. Text in it truncates, and shows whole while it is cut. */
  children: ReactNode;
  /** Muted text after the label: a code, a kind, the profile a system adopts. It takes only the room the label leaves, so it is cut before the label is, and it is read as the row's description. */
  hint?: ReactNode;
  /** At the end of the row: a Count, a Badge, a Dot. It is read as the row's description; text in it truncates as the row narrows and is its own tooltip on hover. A control belongs in `actions`. */
  trailing?: ReactNode;
  /** Controls at the row's end, after `trailing`: the row's menu button. Each is a tab stop of its own, outside the tree's keyboard, and none is part of the row's name or description. */
  actions?: ReactNode;
  className?: string | undefined;
};

/** One visible node. The row is the tree item: focusable, selected on a click, opened on its chevron. */
export function TreeItem({
  depth,
  posInSet,
  setSize,
  lines,
  hasChildren = false,
  isExpanded,
  expanded: deprecatedExpanded,
  onToggle,
  isSelected,
  onSelect,
  children,
  hint,
  trailing,
  actions,
  className,
  onClick,
  onKeyDown,
  ...props
}: TreeItemProps) {
  const size = useContext(TreeContext)?.size ?? "small";
  const expanded = isExpanded ?? deprecatedExpanded ?? false;
  const selected = isSelected ?? false;
  const selectable = Boolean(onSelect) || isSelected !== undefined;
  const guides = lines ?? Array.from({ length: depth }, () => true);
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const trailingId = `${id}-trailing`;
  const label = cutText(children);
  const trailingText = cutText(trailing, true);
  // The hint's words, a code and a profile in a fragment included, are its own tooltip.
  const hintText = hint ? textOf(hint) : "";
  // A control in `trailing` (from before `actions`) keeps its own name out of the row's description.
  const trailingRef = useRef<HTMLSpanElement>(null);
  const [trailingControls, setTrailingControls] = useState(false);
  useLayoutEffect(() => {
    const controls = Boolean(trailingRef.current?.querySelector(CONTROL));
    if (controls !== trailingControls) setTrailingControls(controls);
  });
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  const describedBy =
    [
      props["aria-describedby"],
      hint ? hintId : undefined,
      trailing && !trailingControls ? trailingId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

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
    // Right opens and Left closes in the reading direction: mirrored in a right-to-left tree.
    const rtl = rightToLeft(e.currentTarget);
    const key =
      rtl && e.key === "ArrowRight"
        ? "ArrowLeft"
        : rtl && e.key === "ArrowLeft"
          ? "ArrowRight"
          : e.key;
    switch (key) {
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
      aria-selected={selectable ? selected : undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      {...(named ? {} : { "aria-labelledby": labelId })}
      aria-describedby={describedBy}
      data-slot="tree-item"
      onClick={(event) => {
        onClick?.(event);
        const row = event.currentTarget;
        const target = event.target as HTMLElement;
        if (event.defaultPrevented || target.closest('[role="treeitem"]') !== row) return;
        // A control inside the row keeps its own click; a Count or a Badge selects the row.
        const control = target.closest(CONTROL);
        if (control && control !== row && row.contains(control)) return;
        row.focus();
        onSelect?.();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex items-center gap-075 rounded-medium pe-100 outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused motion-reduce:transition-none",
        size === "small" ? "h-control-medium" : "h-control-xsmall",
        // Selected is the selected fill and a 2px bar at the row's start edge in the selected
        // colour, 3:1 on the fill, so the selection does not rest on a 1.1:1 tint alone. The bar is
        // absolutely placed, so it takes no room from the guides.
        selected &&
          "bg-selected before:pointer-events-none before:absolute before:inset-y-050 before:start-0 before:w-025 before:rounded-full before:bg-selected-bold",
        // Only a row that selects answers the pointer.
        onSelect && !selected && "cursor-pointer hover:bg-neutral-subtle-hovered",
        onSelect && selected && "cursor-pointer",
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
          className="relative inline-flex size-250 shrink-0 touch-target items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default motion-reduce:transition-none"
        >
          <ChevronRight
            className={cn(
              "size-icon-small transition-transform duration-fast ease-standard motion-reduce:transition-none",
              // Closed points to the reading direction's end: left in a right-to-left tree.
              expanded ? "rotate-90" : "rtl:rotate-180",
            )}
          />
        </button>
      ) : (
        <span aria-hidden className="inline-flex size-250 shrink-0 items-center justify-center">
          <span className="size-050 rounded-full bg-neutral-pressed" />
        </span>
      )}
      <span
        id={labelId}
        data-tree-label
        data-slot="tree-item-label"
        className={cn(
          "flex min-w-0 items-center gap-100 font-body text-default [&>svg]:shrink-0",
          // With a hint the label keeps its own width and the hint takes what is left. Without one
          // the label fills the row from its own width, so as the row narrows it and the trailing
          // text give way together and neither is cut to nothing first.
          hint ? "shrink" : "grow",
        )}
      >
        {label.nodes}
      </span>
      {hint ? (
        <span id={hintId} data-slot="tree-item-hint" className="min-w-0 basis-0 grow">
          <Truncate
            // The row's focus reveals the label; the hint's own words are its tooltip.
            {...(hintText ? { title: hintText } : {})}
            className="font-body-small text-subtle"
          >
            {hint}
          </Truncate>
        </span>
      ) : null}
      {trailing ? (
        <span
          ref={trailingRef}
          id={trailingId}
          data-slot="tree-item-trailing"
          className={cn(
            "flex items-center gap-100",
            trailingText.hasText
              ? "min-w-0 shrink [&>:not([data-slot=truncate])]:shrink-0"
              : "shrink-0",
          )}
        >
          {trailingText.nodes}
        </span>
      ) : null}
      {actions ? (
        <span data-slot="tree-item-actions" className="flex shrink-0 items-center gap-100">
          {actions}
        </span>
      ) : null}
    </div>
  );
}

export const Tree = Object.assign(TreeRoot, { Item: TreeItem });
