import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronsUpDown, Eye } from "lucide-react";
import {
  useCallback,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { Count } from "./badge";
import { Checkbox } from "./controls";
import { Id } from "./id";
import { Tooltip } from "./tooltip";

/**
 * The register. The wrapper is the scroll frame: sideways always, and down past `maxHeight`, so the
 * sticky header sticks to it and not to the page. While the frame is scrolled sideways it carries
 * `data-scrolled-start` and `data-scrolled-end`, which the pinned columns read for their edge.
 */
function TableRoot({
  className,
  maxHeight,
  ...props
}: ComponentPropsWithoutRef<"table"> & { maxHeight?: number | undefined }) {
  const frame = useRef<HTMLDivElement>(null);
  const track = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    const start = el.scrollLeft > 0;
    const end = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;
    if (start) el.dataset["scrolledStart"] = "";
    else delete el.dataset["scrolledStart"];
    if (end) el.dataset["scrolledEnd"] = "";
    else delete el.dataset["scrolledEnd"];
  }, []);
  return (
    <div
      ref={(el) => {
        frame.current = el;
        if (el) track();
      }}
      onScroll={track}
      className={cn(
        "group/scroll w-full",
        maxHeight === undefined ? "overflow-x-auto" : "overflow-auto",
      )}
      style={maxHeight === undefined ? undefined : { maxHeight }}
    >
      <table className={cn("w-full border-collapse text-left font-body", className)} {...props} />
    </div>
  );
}

/** Where a column is pinned, and how far from that edge. `edge` marks the pinned column that touches the scrolling middle. */
export type PinnedProps = {
  pinned?: "start" | "end" | false | undefined;
  /** Pixels from the pinned edge: the widths of the pinned columns before it. */
  offset?: number | undefined;
  edge?: boolean | undefined;
};

const pinnedClass = (pinned: PinnedProps["pinned"], edge: boolean | undefined, z: string) =>
  pinned
    ? cn(
        "sticky bg-surface-current",
        z,
        edge &&
          pinned === "start" &&
          "border-e border-default group-data-[scrolled-start]/scroll:border-bold",
        edge &&
          pinned === "end" &&
          "border-s border-default group-data-[scrolled-end]/scroll:border-bold",
      )
    : undefined;

const pinnedStyle = (
  pinned: PinnedProps["pinned"],
  offset: number | undefined,
): CSSProperties | undefined =>
  pinned === "start"
    ? { insetInlineStart: offset ?? 0 }
    : pinned === "end"
      ? { insetInlineEnd: offset ?? 0 }
      : undefined;

export type ThProps = ComponentPropsWithoutRef<"th"> &
  PinnedProps & {
    ref?: Ref<HTMLTableCellElement> | undefined;
    /** Makes the heading a button that reports its direction (aria-sort) and shows the arrow. */
    sort?: "asc" | "desc" | false | undefined;
    onSort?: (() => void) | undefined;
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels. Column widths are content decisions, so they are a prop, not a class. */
    width?: number | undefined;
    /** A handle on the trailing edge. `onResizeStart` takes the pointer down; `resizeDelta` moves the guide while it drags; double-click resets. */
    resize?:
      | {
          onResizeStart: (event: unknown) => void;
          onResizeReset?: (() => void) | undefined;
          isResizing?: boolean | undefined;
          resizeDelta?: number | null | undefined;
        }
      | undefined;
    /** A control that appears on hover after the heading: the column menu, a drag grip. */
    trailing?: ReactNode;
  };

const widthStyle = (
  width: number | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined => (width === undefined ? style : { width, ...style });

function Th({
  ref,
  className,
  sort,
  onSort,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  width,
  resize,
  trailing,
  style,
  children,
  ...props
}: ThProps) {
  const sortable = sort !== undefined || onSort !== undefined;
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  return (
    <th
      ref={ref}
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined}
      className={cn(
        "group/th sticky top-0 z-10 h-row-header whitespace-nowrap border-b border-default bg-surface-current px-150 font-body-small font-medium text-subtle",
        pinnedClass(pinned, edge, "z-20"),
        className,
      )}
      style={widthStyle(width, { ...pinnedStyle(pinned, offset), ...style })}
      {...props}
    >
      <span className="flex items-center gap-050">
        {sortable ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              "group/sort inline-flex h-control-xsmall min-w-0 items-center gap-050 rounded-small px-050 outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused",
              sort && "text-default",
            )}
          >
            <span className="truncate">{children}</span>
            {sort === "asc" ? (
              <ArrowUp className="size-150 shrink-0" />
            ) : sort === "desc" ? (
              <ArrowDown className="size-150 shrink-0" />
            ) : (
              <ChevronsUpDown className="invisible size-150 shrink-0 icon-subtlest group-hover/sort:visible" />
            )}
          </button>
        ) : (
          <span className="truncate">{children}</span>
        )}
        {trailing ? (
          <span className="absolute inset-y-0 end-100 flex items-center gap-025 bg-surface-current ps-050 opacity-0 transition-opacity duration-fast ease-standard focus-within:opacity-100 group-hover/th:opacity-100 has-[[data-state=open]]:opacity-100">
            {trailing}
          </span>
        ) : null}
      </span>
      {resize ? (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={resize.onResizeStart}
          onTouchStart={resize.onResizeStart}
          onDoubleClick={resize.onResizeReset}
          className={cn(
            "absolute inset-y-0 end-0 z-10 w-100 cursor-col-resize touch-none select-none",
            "after:absolute after:inset-y-0 after:end-0 after:w-025 after:bg-brand-bold after:opacity-0 after:transition-opacity after:duration-fast after:ease-standard hover:after:opacity-100",
            resize.isResizing && "after:opacity-100",
          )}
          style={
            resize.isResizing && resize.resizeDelta != null
              ? { transform: `translateX(${resize.resizeDelta}px)` }
              : undefined
          }
        />
      ) : null}
    </th>
  );
}

function Td({
  className,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  width,
  style,
  ...props
}: ComponentPropsWithoutRef<"td"> &
  PinnedProps & { sticky?: boolean | undefined; width?: number | undefined }) {
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  return (
    <td
      className={cn(
        "h-row max-w-0 truncate whitespace-nowrap px-150 align-middle",
        pinnedClass(pinned, edge, "z-10"),
        pinned && "group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected",
        className,
      )}
      style={widthStyle(width, { ...pinnedStyle(pinned, offset), ...style })}
      {...props}
    />
  );
}

/** A row. `isStatic` is for rows that are not records: a form laid out as a table, a totals row. They do not light up on hover. */
function Tr({
  className,
  isSelected,
  isStatic,
  ...props
}: ComponentPropsWithoutRef<"tr"> & {
  isSelected?: boolean | undefined;
  isStatic?: boolean | undefined;
}) {
  return (
    <tr
      data-selected={isSelected ? "" : undefined}
      className={cn(
        "group/row border-b border-default transition-colors duration-fast ease-standard last:border-b-0",
        !isStatic && "hover:bg-surface-hovered",
        isSelected && "bg-selected hover:bg-selected-hovered",
        className,
      )}
      {...props}
    />
  );
}

/** The id column. The row itself opens the record; the eye that appears on hover opens the same row in the preview rail. */
function IdCell({
  id,
  onPreview,
  isActive,
  tone = "brand",
  width,
  pinned,
  offset,
  edge,
}: PinnedProps & {
  id: ReactNode;
  onPreview?: (() => void) | undefined;
  isActive?: boolean | undefined;
  tone?: "brand" | "subtle" | undefined;
  /** For a table without a header row, where the cells carry the widths. */
  width?: number | undefined;
}) {
  return (
    <Td className="max-w-none" width={width} pinned={pinned} offset={offset} edge={edge}>
      <span className="flex items-center gap-075">
        <Id
          className={cn(
            "transition-colors duration-fast ease-standard",
            isActive ? "text-brand" : null,
            tone === "brand" && !isActive ? "group-hover/row:text-brand" : null,
          )}
        >
          {id}
        </Id>
        {onPreview ? (
          <Tooltip content="Preview">
            <button
              type="button"
              aria-label="Preview row"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className={cn(
                "ms-auto inline-flex size-250 shrink-0 items-center justify-center rounded-small outline-none transition-colors duration-fast ease-standard focus-visible:visible focus-visible:outline-focused",
                isActive
                  ? "visible bg-selected icon-selected"
                  : "invisible icon-subtle hover:bg-neutral-subtle-hovered hover:icon-default group-hover/row:visible",
              )}
            >
              <Eye className="size-icon-small" />
            </button>
          </Tooltip>
        ) : null}
      </span>
    </Td>
  );
}

/** The checkbox column. In the header it selects every row and reads mixed when only some are; in a row it selects that row. */
function SelectionCell({
  header = false,
  checked,
  onCheckedChange,
  label,
  disabled,
  pinned,
}: PinnedProps & {
  header?: boolean | undefined;
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean | undefined;
}) {
  const box = (
    <Checkbox
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      aria-label={label}
      {...(disabled ? { disabled } : {})}
      onClick={(e) => e.stopPropagation()}
    />
  );
  return header ? (
    <Th className="w-400 pe-0" pinned={pinned}>
      <span className="flex items-center">{box}</span>
    </Th>
  ) : (
    <Td className="w-400 max-w-none pe-0" pinned={pinned}>
      <span className="flex items-center">{box}</span>
    </Td>
  );
}

/** A band of rows under one heading that opens and closes. Renders a tbody, so several groups stack inside one Table. */
function TableGroup({
  colSpan,
  open,
  onToggle,
  title,
  count,
  trailing,
  children,
}: {
  colSpan: number;
  open: boolean;
  onToggle: () => void;
  title: ReactNode;
  count?: number | string | null | undefined;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <tbody className="border-t border-default">
      <tr
        className="cursor-pointer bg-surface-sunken transition-colors duration-fast ease-standard hover:bg-surface-hovered"
        onClick={onToggle}
      >
        <td colSpan={colSpan} className="px-100 py-075">
          <span className="flex items-center gap-150">
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex shrink-0 items-center rounded-small outline-none focus-visible:outline-focused"
            >
              <ChevronDown
                className={cn(
                  "size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard",
                  open ? "" : "-rotate-90",
                )}
              />
            </button>
            <span className="flex min-w-0 flex-1 items-center gap-150 font-body font-medium text-default">
              {title}
            </span>
            {count ? <Count value={count} /> : null}
            {trailing ? (
              <span className="flex shrink-0 items-center gap-150">{trailing}</span>
            ) : null}
          </span>
        </td>
      </tr>
      {open ? children : null}
    </tbody>
  );
}

/**
 * The name cell of a row in a hierarchy that also has columns (the ARIA treegrid). It is the Tree recipe in a
 * cell: one indent per level, the chevron on rows that have children, the name truncated, a hint after it.
 * The Table takes `role="treegrid"`; each Row carries `aria-level` and, when it has children, `aria-expanded`.
 */
function TreeCell({
  depth,
  hasChildren = false,
  expanded = false,
  onToggle,
  label,
  hint,
  className,
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
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Td className={cn("max-w-none", className)}>
      <span
        className="flex items-center gap-050"
        style={{ paddingInlineStart: `calc(${depth} * ${token("space.200")})` }}
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
      </span>
    </Td>
  );
}

export const Table = Object.assign(TableRoot, {
  Row: Tr,
  Cell: Td,
  Header: Th,
  Id: IdCell,
  Selection: SelectionCell,
  Group: TableGroup,
  Tree: TreeCell,
});
