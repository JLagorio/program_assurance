import { useLedgerLocale } from "../lib/locale";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  GripVertical,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import type { Density } from "../mode/density";
import { Count } from "./badge";
import { Checkbox } from "./checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Id } from "./id";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Absent } from "./typography";

export type TableProps = {
  /** The table's accessible name, when no heading above it says what the rows are: "Findings". */
  label?: string | undefined;
  /** Pixels. Past it the frame scrolls down inside itself and the header sticks to the frame. */
  maxHeight?: number | undefined;
  /** The scroll frame, for a virtualizer that needs the element that scrolls. */
  frameRef?: Ref<HTMLDivElement> | undefined;
  /** `treegrid` for a hierarchy with columns; `grid` only when cells are editable. */
  role?: "table" | "treegrid" | "grid" | undefined;
  /** The rows' height: `default`, `dimension.row` 40px, or `compact`, 36px, for a picker's table or a register the reader has set so. Never the document's setting. */
  density?: Density | undefined;
  className?: string | undefined;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"table">, "className" | "children" | "role">;

/**
 * The register. The wrapper is the scroll frame: sideways always, and down past `maxHeight`, so the
 * sticky header sticks to it and not to the page. While the frame is scrolled sideways it carries
 * `data-scrolled-start` and `data-scrolled-end`, which the pinned columns read for their edge. A
 * frame that overflows is a tab stop, so the keyboard can scroll it too: a landmark named after the
 * table's `label` when it has one, else a plain named group, since two landmarks cannot share a name.
 */
function TableRoot({ label, className, maxHeight, frameRef, role, density, ...props }: TableProps) {
  const { t, direction } = useLedgerLocale();
  const frame = useRef<HTMLDivElement>(null);
  const track = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    const distance = direction === "rtl" ? Math.abs(el.scrollLeft) : el.scrollLeft;
    const start = distance > 0;
    const end = Math.ceil(distance + el.clientWidth) < el.scrollWidth;
    if (start) el.dataset["scrolledStart"] = "";
    else delete el.dataset["scrolledStart"];
    if (end) el.dataset["scrolledEnd"] = "";
    else delete el.dataset["scrolledEnd"];
    const overflows = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    if (overflows) {
      el.tabIndex = 0;
      el.setAttribute("role", label ? "region" : "group");
      el.setAttribute("aria-label", label ? t("tableScrollsLabel", { label }) : t("tableScrolls"));
    } else {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    }
  }, [label, t, direction]);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(track);
    observer.observe(el);
    return () => observer.disconnect();
  }, [track]);
  return (
    <div
      ref={(el) => {
        frame.current = el;
        if (typeof frameRef === "function") frameRef(el);
        else if (frameRef) frameRef.current = el;
        if (el) track();
      }}
      onScroll={track}
      {...(density === "compact" ? { "data-density": "compact" } : {})}
      className={cn(
        "group/scroll w-full rounded-small outline-none focus-visible:outline-focused",
        maxHeight === undefined ? "overflow-x-auto" : "overflow-auto",
      )}
      style={maxHeight === undefined ? undefined : { maxHeight }}
    >
      <table
        className={cn("w-full border-collapse text-left font-body", className)}
        {...(label ? { "aria-label": label } : {})}
        {...(role ? { role } : {})}
        {...props}
      />
    </div>
  );
}

/** Where a column is pinned, and how far from that edge. `edge` marks the pinned column that touches the scrolling middle: `true` draws its hairline at rest, `"scrolled"` only while the frame is scrolled, for a checkbox column that is pinned on its own. */
export type PinnedProps = {
  pinned?: "start" | "end" | false | undefined;
  /** Pixels from the pinned edge: the widths of the pinned columns before it. */
  offset?: number | undefined;
  edge?: boolean | "scrolled" | undefined;
};

/* The hairline is a pseudo-element, not the cell's border: collapsed table borders are painted by
   the table and stay put while a sticky cell moves, so a border would vanish on the first scroll. */
const rule = "after:pointer-events-none after:absolute after:inset-y-0 after:border-default";

const edgeClass = {
  start: {
    rest: `${rule} after:end-0 after:border-e`,
    scrolled: `${rule} after:end-0 group-data-[scrolled-start]/scroll:after:border-e`,
  },
  end: {
    rest: `${rule} after:start-0 after:border-s`,
    scrolled: `${rule} after:start-0 group-data-[scrolled-end]/scroll:after:border-s`,
  },
} as const;

/** The pinned column that touches the middle carries the same hairline as every other border, and keeps it while the frame is scrolled. */
const pinnedClass = (pinned: PinnedProps["pinned"], edge: PinnedProps["edge"], z: string) =>
  pinned
    ? cn(
        "sticky bg-surface-current",
        z,
        edge && edgeClass[pinned].scrolled,
        edge === true && edgeClass[pinned].rest,
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
          /** Keyboard change in pixels, or the minimum/maximum boundary. */
          onResizeKeyboard?: ((change: number | "min" | "max") => void) | undefined;
          value?: number | undefined;
          min?: number | undefined;
          max?: number | undefined;
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
  const { direction, t } = useLedgerLocale();
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
              <ChevronsUpDown className="invisible size-150 shrink-0 icon-subtlest group-focus-visible/sort:visible group-hover/sort:visible" />
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
          aria-label={t("resizeColumn")}
          tabIndex={resize.onResizeKeyboard ? 0 : undefined}
          aria-valuenow={resize.onResizeKeyboard ? (resize.value ?? width) : undefined}
          aria-valuemin={resize.onResizeKeyboard ? resize.min : undefined}
          aria-valuemax={resize.onResizeKeyboard ? resize.max : undefined}
          onKeyDown={(event) => {
            if (!resize.onResizeKeyboard) return;
            const step = event.shiftKey ? 32 : 8;
            const changes: Record<string, number | "min" | "max"> = {
              ArrowLeft: direction === "rtl" ? step : -step,
              ArrowRight: direction === "rtl" ? -step : step,
              Home: "min",
              End: "max",
            };
            const change = changes[event.key];
            if (change !== undefined) {
              event.preventDefault();
              resize.onResizeKeyboard(change);
            }
          }}
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

export type TdProps = ComponentPropsWithoutRef<"td"> &
  PinnedProps & {
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels, for a table with no header row. */
    width?: number | undefined;
  };

/** A cell. It truncates to one line; a plain string is also the cell's title, so the whole shows on hover. */
function Td({
  className,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  width,
  style,
  children,
  ...props
}: TdProps) {
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  return (
    <td
      {...(typeof children === "string" ? { title: children } : {})}
      className={cn(
        "h-row max-w-0 truncate whitespace-nowrap px-150 align-middle",
        pinnedClass(pinned, edge, "z-10"),
        pinned && "group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected",
        className,
      )}
      style={widthStyle(width, { ...pinnedStyle(pinned, offset), ...style })}
      {...props}
    >
      {children}
    </td>
  );
}

/** A row. `isStatic` is for rows that are not records: a form laid out as a table, a totals row. They do not light up on hover. */
function Tr({
  ref,
  className,
  isSelected,
  isStatic,
  ...props
}: ComponentPropsWithoutRef<"tr"> & {
  ref?: Ref<HTMLTableRowElement> | undefined;
  isSelected?: boolean | undefined;
  isStatic?: boolean | undefined;
}) {
  return (
    <tr
      ref={ref}
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

/**
 * The eye that opens a row in the preview surface. It sits at the end of a row's first cell and is
 * there at rest, muted, so a reader never has to hunt for it; the open row's eye reads selected.
 */
export function PreviewButton({
  onPreview,
  isActive,
  className,
}: {
  onPreview: () => void;
  isActive?: boolean | undefined;
  className?: string | undefined;
}) {
  const { t } = useLedgerLocale();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={t("previewRow")}
            aria-pressed={isActive ? true : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className={cn(
              "inline-flex size-250 shrink-0 items-center justify-center rounded-small outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused",
              isActive
                ? "bg-selected icon-selected"
                : "icon-subtlest hover:bg-neutral-subtle-hovered hover:icon-default group-hover/row:icon-subtle",
              className,
            )}
          >
            <Eye className="size-icon-small" />
          </button>
        }
      />
      <TooltipContent>{t("preview")}</TooltipContent>
    </Tooltip>
  );
}

/** The id column. The row itself opens the record; the eye at the end of the cell opens the same row in the preview surface. */
function IdCell({
  id,
  onPreview,
  isActive,
  tone = "brand",
  width,
  indent,
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
  /** Pixels of tree indent before the id, one level's worth per level of nesting. */
  indent?: number | undefined;
}) {
  return (
    <Td className="max-w-none" width={width} pinned={pinned} offset={offset} edge={edge}>
      <span
        className="relative flex items-center"
        {...(indent ? { style: { paddingInlineStart: indent } } : {})}
      >
        <Id
          className={cn(
            "min-w-0 flex-1 truncate transition-colors duration-fast ease-standard",
            isActive ? "text-brand" : null,
            tone === "brand" && !isActive ? "group-hover/row:text-brand" : null,
          )}
        >
          {id}
        </Id>
        {onPreview ? (
          <span
            className={cn(
              "absolute inset-y-0 end-0 flex items-center ps-050 opacity-0 transition-opacity duration-fast ease-standard",
              "bg-surface-current group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected",
              "focus-within:opacity-100 group-hover/row:opacity-100",
              // the row whose preview is open keeps its eye, so the reader can see which row it is
              isActive && "opacity-100",
            )}
          >
            <PreviewButton onPreview={onPreview} isActive={isActive} />
          </span>
        ) : null}
      </span>
    </Td>
  );
}

/** The checkbox column. In the header it selects every row and reads mixed when only some are; in a row it selects that row. */
function SelectionCell({
  header = false,
  checked,
  indeterminate,
  onCheckedChange,
  label,
  disabled,
  pinned,
  offset,
  edge,
}: PinnedProps & {
  header?: boolean | undefined;
  checked: boolean;
  indeterminate?: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean | undefined;
}) {
  const box = (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      {...(disabled ? { disabled } : {})}
      onClick={(e) => e.stopPropagation()}
    />
  );
  return header ? (
    <Th className="w-400 pe-0" pinned={pinned} offset={offset} edge={edge}>
      <span className="flex items-center">{box}</span>
    </Th>
  ) : (
    <Td className="w-400 max-w-none pe-0" pinned={pinned} offset={offset} edge={edge}>
      <span className="flex items-center">{box}</span>
    </Td>
  );
}

/** A band of rows under one heading that opens and closes. Renders a tbody, so several groups stack inside one Table. The heading sticks to the frame's leading edge, so it stays read while the rows scroll sideways. */
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
  const { t } = useLedgerLocale();
  return (
    <tbody className="border-t border-default">
      <tr
        className="cursor-pointer bg-surface-sunken transition-colors duration-fast ease-standard hover:bg-surface-hovered"
        onClick={onToggle}
      >
        <td colSpan={colSpan} className="py-075">
          <span className="sticky start-0 inline-flex max-w-full items-center gap-150 px-100">
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? t("collapse") : t("expand")}
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
  const { t } = useLedgerLocale();
  return (
    <Td className={cn("max-w-none", className)}>
      <span
        className="flex items-center gap-050"
        style={{ paddingInlineStart: `calc(${depth} * ${token("space.200")})` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? t("collapseLabel", { label }) : t("expandLabel", { label })}
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

/**
 * The chevron column of a treegrid: its own leading cell, always first, so the disclosure never
 * moves when the reader reorders, hides or pins a column. One narrow column whatever the depth: the
 * indent belongs to the row's first value, so no width is reserved for a nesting most rows do not
 * have. A row with no parts keeps the space, so the values below it line up.
 */
function DisclosureCell({
  hasChildren = false,
  expanded = false,
  onToggle,
  label,
  width,
  pinned,
  offset,
  edge,
}: PinnedProps & {
  hasChildren?: boolean | undefined;
  expanded?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  /** The row's plain name, for the chevron's accessible label. */
  label: string;
  width?: number | undefined;
}) {
  const { t } = useLedgerLocale();
  return (
    <Td
      className="max-w-none px-0"
      width={width}
      pinned={pinned}
      offset={offset}
      edge={edge}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex items-center justify-center">
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? t("collapseLabel", { label }) : t("expandLabel", { label })}
            onClick={onToggle}
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
      </span>
    </Td>
  );
}

/**
 * The row a record opens into: one cell spanning every column, holding whatever the record has to
 * show at length, a child table included. The chevron that opens it carries `aria-controls` with
 * this row's `id`.
 */
function DetailRow({
  id,
  colSpan,
  className,
  children,
}: {
  id?: string | undefined;
  colSpan: number;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <tr id={id} className="border-b border-default bg-surface-sunken last:border-b-0">
      <td colSpan={colSpan} className={cn("px-200 py-150 align-top", className)}>
        {children}
      </td>
    </tr>
  );
}

/**
 * The grip cell for a row that can be dragged into a new order. `ref`, `attributes` and `listeners`
 * come from the drag context; the cell is the handle, so the row's own controls keep their clicks.
 */
function HandleCell({
  ref,
  label,
  isDragging,
  className,
  pinned,
  offset,
  edge,
  ...props
}: ComponentPropsWithoutRef<"span"> &
  PinnedProps & {
    ref?: Ref<HTMLSpanElement> | undefined;
    label?: string | undefined;
    isDragging?: boolean | undefined;
  }) {
  const { t } = useLedgerLocale();
  return (
    <Td className="w-400 max-w-none pe-0" pinned={pinned} offset={offset} edge={edge}>
      <span
        ref={ref}
        role="button"
        aria-label={label ?? t("reorder")}
        className={cn(
          "inline-flex size-250 shrink-0 items-center justify-center rounded-small icon-subtlest outline-none touch-none cursor-grab hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused",
          isDragging && "cursor-grabbing",
          className,
        )}
        {...props}
      >
        <GripVertical className="size-icon-small" />
      </span>
    </Td>
  );
}

/** One item of a list cell: what the line writes and what the card lists. */
export type ListItem = {
  key: string;
  label: string;
  /** Under the label in the card: kind, path, owner. One line. */
  meta?: ReactNode | undefined;
  /** At the end of the item's line in the card: an Indicator, one. */
  status?: ReactNode | undefined;
};

/**
 * Several values in one cell, on one line: the first by name, the rest as a count, every one in a
 * hover card with its meta line. The card is facts only. With `onOpen` the line is a button;
 * without it the line is text the keyboard can still rest on. Given `expanded`, the line carries a
 * chevron and reads as the row's disclosure, so a cell that opens the row into a table says so.
 * The full list is the line's title.
 */
function ListCell({
  items,
  empty,
  note,
  onOpen,
  expanded,
  controls,
}: {
  items: ReadonlyArray<ListItem>;
  /** Drawn in place of the line when there are no items. `Absent` unsaid. */
  empty?: ReactNode | undefined;
  /** One line under the card's list: what among the items needs attention. */
  note?: ReactNode | undefined;
  /** The click: the row's preview, or the row's detail. */
  onOpen?: (() => void) | undefined;
  /** The line opens the row's detail, and this is whether it is open: it draws the chevron. */
  expanded?: boolean | undefined;
  /** The id of the detail row the line opens. */
  controls?: string | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  // The card is the substitute for opening the row. Once the row is open the whole list is on
  // screen below, so the card is suppressed rather than sitting over what it stands in for.
  const [open, setOpen] = useState(false);
  const [first, ...rest] = items;
  if (!first) return <>{empty ?? <Absent />}</>;
  const title = items.map((i) => i.label).join(", ");
  const line = (
    <>
      <span className="min-w-0 truncate">{first.label}</span>
      {rest.length ? (
        <span className="shrink-0 font-body-small tabular-nums text-subtle">
          +{formatNumber(rest.length)}
        </span>
      ) : null}
      {expanded === undefined ? null : (
        <ChevronRight
          aria-hidden
          className={cn(
            "size-icon-small shrink-0 icon-subtlest transition-transform duration-fast ease-standard",
            expanded && "rotate-90",
          )}
        />
      )}
    </>
  );
  const shape =
    "flex min-w-0 max-w-full items-center gap-075 rounded-xsmall text-left outline-none focus-visible:outline-focused";
  const card = (
    <div className="flex flex-col gap-100">
      <ul className="flex flex-col gap-075">
        {items.map((i) => (
          <li key={i.key} className="flex flex-col gap-025">
            <span className="flex items-center gap-100">
              <span className="min-w-0 truncate font-medium">{i.label}</span>
              {i.status ? <span className="ms-auto shrink-0">{i.status}</span> : null}
            </span>
            {i.meta ? <span className="truncate font-body-small text-subtle">{i.meta}</span> : null}
          </li>
        ))}
      </ul>
      {note ? (
        <div className="border-t border-default pt-075 font-body-small text-subtle">{note}</div>
      ) : null}
    </div>
  );
  return (
    <HoverCard open={open && !expanded} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          onOpen ? (
            <button
              type="button"
              title={title}
              {...(expanded === undefined ? {} : { "aria-expanded": expanded })}
              {...(controls ? { "aria-controls": controls } : {})}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onOpen();
              }}
              className={cn(shape, "hover:underline")}
            >
              {line}
            </button>
          ) : (
            <span tabIndex={0} title={title} className={shape}>
              {line}
            </span>
          )
        }
      />
      <HoverCardContent align="start" alignOffset={0} style={{ width: 300 }}>
        {card}
      </HoverCardContent>
    </HoverCard>
  );
}

export const Table = Object.assign(TableRoot, {
  Row: Tr,
  Cell: Td,
  Header: Th,
  Disclosure: DisclosureCell,
  Id: IdCell,
  List: ListCell,
  Selection: SelectionCell,
  Group: TableGroup,
  Tree: TreeCell,
  Detail: DetailRow,
  Handle: HandleCell,
});
