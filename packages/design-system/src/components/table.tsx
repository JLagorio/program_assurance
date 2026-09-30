import { useRender } from "@base-ui/react/use-render";
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
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
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
  /** The frame takes the rest of a bounded flex column (a `fill-window` block, a Stack with `grow="fill"`) and scrolls inside it; the header sticks to the frame. Wins over `maxHeight`. */
  fill?: boolean | undefined;
  /** The scroll frame, for a virtualizer that needs the element that scrolls. */
  frameRef?: Ref<HTMLDivElement> | undefined;
  /** `treegrid` for DataTable's tree mode, which wires the arrow keys; `grid` only when cells are editable. A hierarchy drawn by hand is a plain table. */
  role?: "table" | "treegrid" | "grid" | undefined;
  /** The rows' height: `default`, `dimension.row` 40px, or `compact`, 36px, for a picker's table or a register the reader has set so. Never the document's setting. */
  density?: Density | undefined;
  className?: string | undefined;
  children?: ReactNode;
} & Omit<ComponentProps<"table">, "className" | "children" | "role">;

/**
 * The frame's scroll padding covers its pinned columns and its sticky header, so a control the
 * keyboard reaches is scrolled clear of them rather than left under them: focus moves into view
 * past the pinned id, and a row below the header. A value another part has written (DataTable
 * writes the inline sides from its layout) is left alone.
 */
function keepClearOfStickyParts(
  frame: HTMLElement,
  table: HTMLTableElement,
  written: Record<string, string>,
) {
  const head = table.tHead;
  const row = head?.rows[head.rows.length - 1] ?? table.tBodies[0]?.rows[0];
  let start = 0;
  let end = 0;
  for (const cell of row?.cells ?? []) {
    const pin = cell.dataset["pinned"];
    if (pin === "start")
      start = Math.max(start, (parseFloat(cell.style.insetInlineStart) || 0) + cell.offsetWidth);
    else if (pin === "end")
      end = Math.max(end, (parseFloat(cell.style.insetInlineEnd) || 0) + cell.offsetWidth);
  }
  const sides = {
    scrollPaddingInlineStart: `${start}px`,
    scrollPaddingInlineEnd: `${end}px`,
    scrollPaddingTop: `${head?.offsetHeight ?? 0}px`,
  } as const;
  for (const [side, value] of Object.entries(sides) as [keyof typeof sides, string][]) {
    const now = frame.style[side];
    if (now !== "" && now !== written[side]) continue;
    frame.style[side] = value;
    written[side] = value;
  }
}

/**
 * The register. The wrapper is the scroll frame: sideways always, and down past `maxHeight` or,
 * with `fill`, inside the height its column gives it, so the sticky header sticks to it and not to
 * the page. While the frame is scrolled sideways it carries
 * `data-scrolled-start` and `data-scrolled-end`, which the pinned columns read for their edge. A
 * frame that overflows is a tab stop, so the keyboard can scroll it too: a landmark named after the
 * table's `label` when it has one, else a plain named group, since two landmarks cannot share a name.
 * Its scroll padding covers the pinned columns and the sticky header, so focus is never left under
 * them.
 */
function TableRoot({
  label,
  className,
  maxHeight,
  fill,
  frameRef,
  role,
  density,
  ...props
}: TableProps) {
  const { t, direction } = useLedgerLocale();
  const frame = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
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
  // The scroll padding the frame keeps clear of its sticky parts, written here unless something
  // else (DataTable, which knows its layout) writes it.
  const cover = useRef<Record<string, string>>({});
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      track();
      if (table.current) keepClearOfStickyParts(el, table.current, cover.current);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (table.current) observer.observe(table.current);
    measure();
    return () => observer.disconnect();
  }, [track]);
  const tableElement = useRender({
    defaultTagName: "table",
    ref: table,
    props: {
      "data-slot": "table",
      // Tabular numerals on the table itself: `font-body` writes the font shorthand, which resets
      // the base layer's `font-variant-numeric`, so figures in a column would not line up.
      className: cn("w-full border-collapse text-start font-body tabular-nums", className),
      ...(label ? { "aria-label": label } : {}),
      ...(role ? { role } : {}),
      ...props,
    },
  });
  return useRender({
    defaultTagName: "div",
    ref: frameRef ? [frame, frameRef] : frame,
    props: {
      "data-slot": "table-container",
      onScroll: track,
      ...(density === "compact" ? { "data-density": "compact" } : {}),
      className: cn(
        // Relative, so an absolutely positioned descendant (a visually hidden label) is clipped
        // by the frame's scroll instead of scrolling the page or the panel around it.
        "group/scroll relative w-full rounded-small outline-none focus-visible:outline-focused",
        fill
          ? "min-h-0 flex-1 overflow-auto"
          : maxHeight === undefined
            ? "overflow-x-auto"
            : "overflow-auto",
      ),
      style: fill || maxHeight === undefined ? undefined : { maxHeight },
      children: tableElement,
    },
  });
}

/** Where a column is pinned, and how far from that edge. `edge` marks the pinned column that touches the scrolling middle: `true` draws its hairline at rest, `"scrolled"` only while the frame is scrolled, for a checkbox column that is pinned on its own. */
export type PinnedProps = {
  pinned?: "start" | "end" | false | undefined;
  /** Pixels from the pinned edge: the widths of the pinned columns before it. */
  offset?: number | undefined;
  edge?: boolean | "scrolled" | undefined;
};

/** Where a cell's content sits across its column: text starts, a number ends. Logical, so an RTL table mirrors it. */
export type TableAlign = "start" | "center" | "end";

/* A caller that aligns by class (`text-right`, `text-end` or `text-center` on the cell) gets what
   `align` gives. A heading is a flex row, which a text-align class never moved, and `text-right`
   is physical, so an RTL number sat on the wrong side. */
const ALIGN_BY_CLASS = [
  [/(^|\s)text-(right|end)(\s|$)/, "end"],
  [/(^|\s)text-center(\s|$)/, "center"],
] as const;
const alignOf = (align: TableAlign | undefined, className: string | undefined): TableAlign => {
  if (align) return align;
  for (const [pattern, placed] of ALIGN_BY_CLASS)
    if (className && pattern.test(className)) return placed;
  return "start";
};
/** After the caller's class, so the logical class replaces a physical `text-right`. */
const TEXT_ALIGN = { start: "text-start", center: "text-center", end: "text-end" } as const;

/* A caller that wraps a cell by class (`whitespace-normal` and its kin) gets what `wrap` gives, so
   a link in it wraps with the text instead of being cut to one line. */
const WRAP_BY_CLASS = /(^|\s)whitespace-(normal|pre-wrap|pre-line|break-spaces)(\s|$)/;
const wrapsOf = (wrap: boolean | undefined, className: string | undefined) =>
  Boolean(wrap) || (className !== undefined && WRAP_BY_CLASS.test(className));

/* The hairline is a pseudo-element, not the cell's border: collapsed table borders are painted by
   the table and stay put while a sticky cell moves, so a border would vanish on the first scroll. */
const rule = "after:pointer-events-none after:absolute after:inset-y-0 after:border-default";

// The header's hairline is the cell's own for the same reason: a collapsed border stays put while
// the sticky heading moves, so the line would scroll away with the first row. Paint it above the
// trailing controls' opaque hover background so that background cannot interrupt the rule.
const HEADER_RULE =
  "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:z-10 before:border-b before:border-default";
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

/* A pinned cell paints its own fill so the middle scrolls under it; it follows the row's: hovered,
   selected, and selected under the pointer. A static row is no group, so it never lights. */
const ROW_FILL =
  "group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected group-data-[selected]/row:group-hover/row:bg-selected-hovered";

const pinnedStyle = (
  pinned: PinnedProps["pinned"],
  offset: number | undefined,
): CSSProperties | undefined =>
  pinned === "start"
    ? { insetInlineStart: offset ?? 0 }
    : pinned === "end"
      ? { insetInlineEnd: offset ?? 0 }
      : undefined;

export type ThProps = Omit<ComponentProps<"th">, "align"> &
  PinnedProps & {
    /** Makes the heading a button that reports its direction (aria-sort) and shows the arrow. */
    sort?: "asc" | "desc" | false | undefined;
    onSort?: (() => void) | undefined;
    /** Where the heading sits: `end` over a column of numbers, so it ends where they do; the sort arrow then leads. Logical, so an RTL table mirrors it. Match the column's cells. */
    align?: TableAlign | undefined;
    /** The heading wraps instead of ending in an ellipsis. For a heading that must be read whole; prefer a shorter word. */
    wrap?: boolean | undefined;
    /** The hairline under the heading, drawn on the cell so it stays while the frame scrolls. Off for a placeholder cell in a second header row. */
    hairline?: boolean | undefined;
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels. Column widths are content decisions, so they are a prop, not a class. */
    width?: number | undefined;
    /** The least width in pixels the column keeps: in a narrow frame the table scrolls sideways rather than squeezing it. Give the name column one (180 to 220) so it is never the column that gives way. */
    minWidth?: number | undefined;
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
          /** The column's name for the handle's: "Resize Status". Unsaid, every handle is "Resize column"; give it wherever a table has two. */
          label?: string | undefined;
        }
      | undefined;
    /** Controls that appear on hover and focus over the heading's end: the column menu, a drag grip. Where no pointer can hover they are always shown, beside the heading, and take more of the column: 24px for one 20px control, 46px for two (a grip and a menu). Widen the column by that much there so the heading keeps its room; DataTable does. A column menu that sorts carries `data-column-menu`, and there the heading drops its up-down hint for it. An end-aligned heading keeps them at its start, clear of the heading. */
    trailing?: ReactNode;
  };

/**
 * Where nothing can hover, how much wider a header's trailing controls make it: the gap before them,
 * `space.050`, and each 20px control (`size-250`) with `space.025` between. DataTable widens a
 * column with a menu or a grip by this much there, so the heading keeps the room it has at rest
 * where a pointer can hover.
 */
export const headerTrailingWidth = (controls: number) =>
  controls > 0 ? 4 + controls * 20 + (controls - 1) * 2 : 0;

/* A cell's `width` is firm: it is also its `min-width`, because when the table is wider than its
   frame the browser gives a cell with only a `width` its min-content width instead. `minWidth` is a
   floor alone: the column takes slack above it and the frame scrolls below it. */
const widthStyle = (
  width: number | undefined,
  minWidth: number | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined =>
  width === undefined && minWidth === undefined
    ? style
    : {
        ...(width === undefined ? {} : { width, minWidth: width }),
        ...(minWidth === undefined ? {} : { minWidth }),
        ...style,
      };

/** The heading's own margin in its row: it takes the free space on the side away from its alignment. */
const LABEL_PLACE = { start: "me-auto", center: "mx-auto", end: "ms-auto" } as const;
/** The sort button's padding is ring room; none on the side that meets the column's text. */
const SORT_PAD = { start: "pe-050", center: "px-050", end: "ps-050 flex-row-reverse" } as const;

/**
 * A column heading. Every heading sticks to the top of the frame; one in a second header row (the
 * leaf headings under a column-group row) sticks below the rows above it, so the group row is not
 * covered once the frame scrolls.
 */
export function Th({
  ref,
  className,
  sort,
  onSort,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  hairline = true,
  width,
  minWidth,
  resize,
  trailing,
  align,
  wrap,
  style,
  children,
  ...props
}: ThProps) {
  const { direction, t } = useLedgerLocale();
  const sortable = sort !== undefined || onSort !== undefined;
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  const placed = alignOf(align, className);
  // A heading squeezed by its column's controls ends in an ellipsis; the whole shows on hover.
  const text = typeof children === "string" ? children : undefined;
  const title = wrap ? undefined : text;
  // Which header row the cell sits in; below the first it sticks under the rows above.
  const [row, setRow] = useState(0);
  const measure = useCallback((el: HTMLTableCellElement | null) => {
    const tr = el?.parentElement;
    if (tr instanceof HTMLTableRowElement && tr.parentElement instanceof HTMLTableSectionElement)
      setRow(tr.parentElement.tagName === "THEAD" ? tr.sectionRowIndex : 0);
  }, []);
  const stuck: CSSProperties | undefined =
    row > 0 ? { top: `calc(${row} * ${token("dimension.row.header")})` } : undefined;
  const label = (
    <span
      className={cn(
        wrap ? "break-words" : "truncate",
        !sortable && "has-data-[slot=checkbox]:overflow-visible",
        !sortable && LABEL_PLACE[placed],
      )}
      title={title}
    >
      {children}
    </span>
  );
  return useRender({
    defaultTagName: "th",
    ref: ref ? [ref, measure] : measure,
    props: {
      "aria-sort": sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined,
      "data-pinned": pinned || undefined,
      className: cn(
        "group/th sticky top-0 z-10 h-row-header bg-surface-current px-150 font-body-small font-medium text-subtle",
        wrap ? "whitespace-normal" : "whitespace-nowrap",
        hairline && HEADER_RULE,
        pinnedClass(pinned, edge, "z-20"),
        className,
        TEXT_ALIGN[placed],
      ),
      style: widthStyle(width, minWidth, { ...stuck, ...pinnedStyle(pinned, offset), ...style }),
      ...props,
      children: (
        <>
          <span className="flex items-center gap-050">
            {sortable ? (
              <button
                type="button"
                onClick={onSort}
                className={cn(
                  "group/sort relative inline-flex min-w-0 touch-target items-center gap-050 rounded-small outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused motion-reduce:transition-none",
                  // A wrapping heading grows its button, so no line of it spills out of the header.
                  wrap ? cn("min-h-control-xsmall", TEXT_ALIGN[placed]) : "h-control-xsmall",
                  SORT_PAD[placed],
                  LABEL_PLACE[placed],
                  sort && "text-default",
                )}
              >
                {label}
                {sort === "asc" ? (
                  <ArrowUp className="size-150 shrink-0" />
                ) : sort === "desc" ? (
                  <ArrowDown className="size-150 shrink-0" />
                ) : (
                  // Where nothing can hover the hint says the heading sorts, unless the column's menu is
                  // beside it: the menu sorts, and one control there is enough.
                  <ChevronsUpDown className="invisible size-150 shrink-0 icon-subtlest group-focus-visible/sort:visible group-hover/sort:visible [@media(hover:none)]:visible [@media(hover:none)]:group-has-[[data-column-menu]]/th:hidden" />
                )}
              </button>
            ) : (
              // A control in the heading, the select-all checkbox, is not clipped with the text, so
              // its hit area, larger than the box, stays whole.
              label
            )}
            {trailing ? (
              // Over the heading's end on hover and focus, or its start when the heading ends; where
              // nothing can hover, always there and in the row's flow after the row's gap
              // (`headerTrailingWidth`), so the heading keeps its room in a column widened for it and
              // never runs under the controls. An end-aligned heading puts them first, so it still
              // ends where its figures do.
              <span
                className={cn(
                  "absolute inset-y-0 flex items-center gap-025 bg-surface-current opacity-0 transition-opacity duration-fast ease-standard focus-within:opacity-100 group-hover/th:opacity-100 has-[[data-popup-open]]:opacity-100 has-[[data-state=open]]:opacity-100 motion-reduce:transition-none [@media(hover:none)]:static [@media(hover:none)]:opacity-100",
                  placed === "end"
                    ? "start-100 pe-050 [@media(hover:none)]:order-first [@media(hover:none)]:pe-0"
                    : "end-100 ps-050 [@media(hover:none)]:ps-0",
                )}
              >
                {trailing}
              </span>
            ) : null}
          </span>
          {resize ? (
            <span
              role="separator"
              aria-orientation="vertical"
              aria-label={
                resize.label ? t("resizeColumnLabel", { label: resize.label }) : t("resizeColumn")
              }
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
                // The kit's ring drawn inside the handle, which sits on the column's edge, and the
                // guide shown while the keyboard is on it.
                "absolute inset-y-0 end-0 z-10 w-100 cursor-col-resize touch-none select-none outline-none focus-visible:outline-field-focused",
                "after:absolute after:inset-y-0 after:end-0 after:w-025 after:bg-brand-bold after:opacity-0 after:transition-opacity after:duration-fast after:ease-standard hover:after:opacity-100 focus-visible:after:opacity-100 motion-reduce:after:transition-none",
                resize.isResizing && "after:opacity-100",
              )}
              style={
                resize.isResizing && resize.resizeDelta != null
                  ? { transform: `translateX(${resize.resizeDelta}px)` }
                  : undefined
              }
            />
          ) : null}
        </>
      ),
    },
  });
}

export type TdProps = Omit<ComponentProps<"td">, "align"> &
  PinnedProps & {
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels, for a table with no header row. */
    width?: number | undefined;
    /** The column's least width in pixels, for a table with no header row. */
    minWidth?: number | undefined;
    /** Where the content sits: `end` for a number, in tabular numerals. Logical, so an RTL table mirrors it. Match the column's heading. */
    align?: TableAlign | undefined;
    /** The value wraps, breaking a long unbroken one (a URN, a hash), instead of ending in an ellipsis. For a value that must be read whole. */
    wrap?: boolean | undefined;
    /** The cell names its row (`th scope="row"`), so a screen reader announces the row's identity with every other cell and control in it. One per row: the id or the name. */
    rowHeader?: boolean | undefined;
  };

/* A cell whose content is not a plain string takes its text as its title while, and only while,
   the column cuts it, so the whole still shows on hover. It is measured when the pointer arrives,
   not on every render. Content that shows its whole value itself (a title of its own, a hover
   card) is left alone. */
const DERIVED_TITLE = "data-title-derived";
function titleWhenCut(cell: HTMLElement) {
  if (cell.hasAttribute("title") && !cell.hasAttribute(DERIVED_TITLE)) return;
  const own = cell.querySelector('[title], [data-slot="hover-card-trigger"]');
  const cut =
    !own &&
    [cell, ...cell.querySelectorAll<HTMLElement>("*")].some(
      (el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1,
    );
  const text = cut ? cell.innerText.replace(/\s+/g, " ").trim() : "";
  if (text) {
    cell.setAttribute("title", text);
    cell.setAttribute(DERIVED_TITLE, "");
  } else if (cell.hasAttribute(DERIVED_TITLE)) {
    cell.removeAttribute("title");
    cell.removeAttribute(DERIVED_TITLE);
  }
}

/* A truncating cell clips, so a link in it (a record's name) is cut to the cell and draws the
   kit's ring inside its own edge, where the clip cannot take it. Link buttons keep their own. */
const LINK_KEEPS_RING =
  "[&_a:not([data-slot^=link-])]:inline-block [&_a:not([data-slot^=link-])]:min-w-0 [&_a:not([data-slot^=link-])]:max-w-full [&_a:not([data-slot^=link-])]:overflow-x-clip [&_a:not([data-slot^=link-])]:text-ellipsis [&_a:not([data-slot^=link-])]:whitespace-nowrap [&_a:not([data-slot^=link-])]:align-top [&_a:not([data-slot^=link-]):focus-visible]:outline-field-focused";

/** A cell. It truncates to one line, and the whole shows on hover: a plain string is the cell's title, and other content cut by its column takes its text as one. `wrap` lets it wrap instead. */
export function Td({
  className,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  width,
  minWidth,
  align,
  wrap: wrapProp,
  rowHeader,
  style,
  children,
  onPointerEnter,
  ...props
}: TdProps) {
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  const placed = alignOf(align, className);
  const wrap = wrapsOf(wrapProp, className);
  const text = typeof children === "string" ? children : undefined;
  const derive = !wrap && text === undefined && props.title === undefined;
  // The row header is a `th` drawn exactly as a cell: not bold, not centred, not sticky chrome.
  const Cell = (rowHeader ? "th" : "td") as "td";
  return (
    <Cell
      data-pinned={pinned || undefined}
      {...(rowHeader ? { scope: "row" } : {})}
      {...(text !== undefined && !wrap ? { title: text } : {})}
      className={cn(
        "h-row max-w-0 px-150 align-middle",
        wrap ? "whitespace-normal break-words" : cn("truncate whitespace-nowrap", LINK_KEEPS_RING),
        rowHeader && "font-regular",
        pinnedClass(pinned, edge, "z-10"),
        pinned && ROW_FILL,
        className,
        TEXT_ALIGN[placed],
        placed === "end" && "tabular-nums",
      )}
      style={widthStyle(width, minWidth, { ...pinnedStyle(pinned, offset), ...style })}
      onPointerEnter={
        derive
          ? (event) => {
              onPointerEnter?.(event);
              titleWhenCut(event.currentTarget);
            }
          : onPointerEnter
      }
      {...props}
    >
      {children}
    </Cell>
  );
}

export type TrProps = ComponentProps<"tr"> & {
  /** The row is chosen: `color.background.selected` and `data-selected`. Pair it with a checked `Table.Selection`. */
  isSelected?: boolean | undefined;
  /** A row that is not a record: a totals row, a form laid out as a table. It does not light up on hover. */
  isStatic?: boolean | undefined;
};

/** A row. `isStatic` is for rows that are not records: a form laid out as a table, a totals row. They do not light up on hover. */
export function Tr({ ref, className, isSelected, isStatic, ...props }: TrProps) {
  return (
    <tr
      ref={ref}
      data-selected={isSelected ? "" : undefined}
      className={cn(
        "border-b border-default transition-colors duration-fast ease-standard last:border-b-0 motion-reduce:transition-none",
        // A row that is not a record is no group, so nothing in it lights up on the row's hover.
        !isStatic && "group/row hover:bg-surface-hovered",
        // A row the keyboard reaches (a tree row) shows the kit's ring inside its edge.
        "focus-visible:outline-field-focused",
        isSelected && "bg-selected hover:bg-selected-hovered",
        className,
      )}
      {...props}
    />
  );
}

export type PreviewButtonProps = {
  onPreview: () => void;
  /** The row open in the preview: the eye reads selected, with a ring as well as the fill, and reports `aria-pressed`. */
  isActive?: boolean | undefined;
  /** The eye's name, after the record: "Preview CTRL-0412". "Preview row" unsaid; name it wherever the row has an identity. */
  label?: string | undefined;
  className?: string | undefined;
};

/**
 * The eye that opens a row in the preview surface. It sits at the end of a row's first cell and is
 * there at rest, muted, so a reader never has to hunt for it; the open row's eye reads selected,
 * on the selected fill inside a `color.border.selected` ring, so it is told apart by more than its
 * colour where every eye shows.
 */
export function PreviewButton({ onPreview, isActive, label, className }: PreviewButtonProps) {
  const { t } = useLedgerLocale();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label ?? t("previewRow")}
            aria-pressed={isActive ? true : false}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className={cn(
              "relative inline-flex size-250 shrink-0 touch-target items-center justify-center rounded-small outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused motion-reduce:transition-none",
              isActive
                ? "border border-selected bg-selected icon-selected"
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

/** While the eye shows: on the row's hover, on focus in the cell, and always where nothing can hover. */
const EYE_SHOWN =
  "group-hover/row:pe-300 group-focus-within/eye:pe-300 [@media(hover:none)]:pe-300";

/**
 * The value beside the eye gives up the eye's 24px while the eye shows, so it ends in an ellipsis
 * before the eye instead of running under it. For a value in a cell whose width the column sets
 * (a `Table.Cell`); pair it with `PreviewEye` inside one `group/eye relative flex` span.
 */
export const previewValueClass = (isActive: boolean | undefined) =>
  cn(EYE_SHOWN, isActive && "pe-300");

/**
 * The id sizes its column in a table laid out by its content, so there the eye keeps its slot at
 * rest: hovering a row never moves the columns. In a `table-fixed` table the column's width is set,
 * so the id keeps its full width at rest and gives up the slot only while the eye shows.
 */
const idEyeClass = (isActive: boolean | undefined) =>
  cn("pe-300", !isActive && "in-[.table-fixed]:[@media(hover:hover)]:pe-0", EYE_SHOWN);

export type PreviewEyeProps = {
  onPreview: () => void;
  /** The row open in the preview keeps its eye shown and selected. */
  isActive?: boolean | undefined;
  /** The eye's name, after the record: "Preview CTRL-0412". "Preview row" unsaid. */
  label?: string | undefined;
};

/** The eye's slot over the end of its cell: hidden at rest where a pointer can hover, shown on the row's hover, on focus in the cell and on the open row; always shown where nothing can hover. */
export function PreviewEye({ onPreview, isActive, label }: PreviewEyeProps) {
  return (
    <span
      data-slot="preview-eye"
      className={cn(
        "absolute inset-y-0 end-0 flex items-center ps-050 opacity-0 transition-opacity duration-fast ease-standard motion-reduce:transition-none",
        "bg-surface-current",
        ROW_FILL,
        "group-focus-within/eye:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100",
        // the row whose preview is open keeps its eye, so the reader can see which row it is
        isActive && "opacity-100",
      )}
    >
      <PreviewButton onPreview={onPreview} isActive={isActive} label={label} />
    </span>
  );
}

export type TableIdProps = PinnedProps & {
  /** The record's identifier. A plain string is also the eye's name ("Preview CTRL-0412") and the cell's title. */
  id: ReactNode;
  /** Draws the eye, which opens the same row in the preview surface. */
  onPreview?: (() => void) | undefined;
  /** The row open in the preview: the id in `color.text.brand` and the eye shown and selected. */
  isActive?: boolean | undefined;
  /** `subtle` where the id is not the link, in a grouped listing. */
  tone?: "brand" | "subtle" | undefined;
  /** The eye's name when `id` is not a plain string: "Preview Segregation of duties". */
  label?: string | undefined;
  /** The id names its row (`th scope="row"`). Give it to the id or the name, one per row. */
  rowHeader?: boolean | undefined;
  /** For a table without a header row, where the cells carry the widths. */
  width?: number | undefined;
  /** Pixels of tree indent before the id, one level's worth per level of nesting. */
  indent?: number | undefined;
};

/** The id column. The row itself opens the record; the eye at the end of the cell opens the same row in the preview surface. */
export function IdCell({
  id,
  onPreview,
  isActive,
  tone = "brand",
  label,
  rowHeader,
  width,
  indent,
  pinned,
  offset,
  edge,
}: TableIdProps) {
  const { t } = useLedgerLocale();
  const text = typeof id === "string" ? id : undefined;
  const eyeLabel = label ?? (text === undefined ? undefined : t("previewLabel", { label: text }));
  return (
    <Td
      className="max-w-none"
      width={width}
      pinned={pinned}
      offset={offset}
      edge={edge}
      rowHeader={rowHeader}
      {...(text === undefined ? {} : { title: text })}
    >
      <span
        className="group/eye relative flex items-center"
        {...(indent ? { style: { paddingInlineStart: indent } } : {})}
      >
        <Id
          className={cn(
            "min-w-0 flex-1 truncate transition-colors duration-fast ease-standard motion-reduce:transition-none",
            // The id cuts its overflow, so a link or button inside it takes the kit's ring inside its
            // own edge, where the cut cannot take it.
            "[&_:is(a,button,[tabindex]):focus-visible]:outline-field-focused",
            isActive ? "text-brand" : null,
            tone === "brand" && !isActive ? "group-hover/row:text-brand" : null,
            onPreview && idEyeClass(isActive),
          )}
        >
          {id}
        </Id>
        {onPreview ? (
          <PreviewEye onPreview={onPreview} isActive={isActive} label={eyeLabel} />
        ) : null}
      </span>
    </Td>
  );
}

/** The width of the checkbox and the drag-handle columns, `space.400`. DataTable adds the same width to every pinned start offset, so the column must measure exactly this. */
const NARROW = 32;

export type TableSelectionProps = PinnedProps & {
  /** The header's box, which chooses every row and reads mixed when only some are. */
  header?: boolean | undefined;
  checked: boolean;
  /** Mixed: some rows are chosen. For the header's box. */
  indeterminate?: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
  /** The box's name: "Select CTRL-0412", "Select all". */
  label: string;
  disabled?: boolean | undefined;
};

/** The checkbox column. In the header it selects every row and reads mixed when only some are; in a row it selects that row. A click anywhere in the cell toggles the box and never reaches the row. */
export function SelectionCell({
  header = false,
  checked,
  indeterminate,
  onCheckedChange,
  label,
  disabled,
  pinned,
  offset,
  edge,
}: TableSelectionProps) {
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
  // The cell is the box's target: a click beside the box toggles it, and neither reaches the row,
  // whose click opens the record. The box and its input handle their own click.
  const onCellClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (disabled) return;
    if (event.target instanceof Element && event.target.closest('[data-slot="checkbox"], input'))
      return;
    onCheckedChange(!checked);
  };
  return header ? (
    <Th
      className="pe-0"
      width={NARROW}
      pinned={pinned}
      offset={offset}
      edge={edge}
      onClick={onCellClick}
    >
      <span className="flex items-center">{box}</span>
    </Th>
  ) : (
    <Td
      className="max-w-none pe-0"
      width={NARROW}
      pinned={pinned}
      offset={offset}
      edge={edge}
      onClick={onCellClick}
    >
      <span className="flex items-center">{box}</span>
    </Td>
  );
}

export type TableGroupProps = {
  /** The number of columns the band spans: every column of the table. */
  colSpan: number;
  open: boolean;
  onToggle: () => void;
  /** The band's heading, and the name of its chevron. */
  title: ReactNode;
  count?: number | string | null | undefined;
  /** Muted text or a control at the band's end: "2 of 46". */
  trailing?: ReactNode;
  children?: ReactNode;
};

/** A band of rows under one heading that opens and closes. Renders a tbody, so several groups stack inside one Table. The heading is the rows' `th scope="rowgroup"`, and its chevron is named by the title while `aria-expanded` says whether it is open. The heading sticks to the frame's leading edge, so it stays read while the rows scroll sideways. */
export function TableGroup({
  colSpan,
  open,
  onToggle,
  title,
  count,
  trailing,
  children,
}: TableGroupProps) {
  const titleId = useId();
  return (
    <tbody className="border-t border-default">
      <tr
        className="cursor-pointer bg-surface-sunken transition-colors duration-fast ease-standard hover:bg-surface-hovered motion-reduce:transition-none"
        onClick={onToggle}
      >
        <th colSpan={colSpan} scope="rowgroup" className="py-075 text-start font-regular">
          <span className="sticky start-0 inline-flex max-w-full items-center gap-150 px-100">
            <button
              type="button"
              aria-expanded={open}
              aria-labelledby={titleId}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="relative flex shrink-0 touch-target items-center rounded-small outline-none focus-visible:outline-focused"
            >
              <ChevronDown
                className={cn(
                  "size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard motion-reduce:transition-none",
                  // Closed points to the reading direction's end: left in a right-to-left table.
                  open ? "" : "-rotate-90 rtl:rotate-90",
                )}
              />
            </button>
            <span
              id={titleId}
              className="flex min-w-0 flex-1 items-center gap-150 font-body font-medium text-default"
            >
              {title}
            </span>
            {count ? <Count value={count} /> : null}
            {trailing ? (
              <span className="flex shrink-0 items-center gap-150">{trailing}</span>
            ) : null}
          </span>
        </th>
      </tr>
      {open ? children : null}
    </tbody>
  );
}

export type TableTreeProps = {
  /** The row's level, from 0: one `space.200` indent each. */
  depth: number;
  hasChildren?: boolean | undefined;
  expanded?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  /** The row's plain name, for the chevron's accessible label: "Expand Ground segment". */
  label: string;
  /** Muted text after the name: a folded count, a kind. */
  hint?: ReactNode;
  className?: string | undefined;
  children: ReactNode;
};

const CHEVRON_BUTTON =
  "relative inline-flex size-250 shrink-0 touch-target items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused motion-reduce:transition-none";
const chevronClass = (expanded: boolean) =>
  cn(
    "size-icon-small transition-transform duration-fast ease-standard motion-reduce:transition-none",
    expanded ? "rotate-90" : "rtl:rotate-180",
  );

/**
 * The name cell of a row in a hierarchy that also has columns. It is the Tree recipe in a cell:
 * one indent per level, the chevron on rows that have children, named "Expand" or "Collapse" and
 * the row, the name truncated, a hint after it. Drawn by hand it is a plain table, reached by Tab;
 * DataTable's tree mode is the treegrid, with the arrow keys.
 */
export function TreeCell({
  depth,
  hasChildren = false,
  expanded = false,
  onToggle,
  label,
  hint,
  className,
  children,
}: TableTreeProps) {
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
            className={CHEVRON_BUTTON}
          >
            <ChevronRight className={chevronClass(expanded)} />
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

export type TableDisclosureProps = PinnedProps & {
  hasChildren?: boolean | undefined;
  expanded?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  /** The row's plain name, for the chevron's accessible label: "Expand Ground segment". */
  label: string;
  /** The column's width in pixels, for a table with no header row. */
  width?: number | undefined;
};

/**
 * The chevron column of a hierarchy: its own leading cell, always first, so the disclosure never
 * moves when the reader reorders, hides or pins a column. One narrow column whatever the depth: the
 * indent belongs to the row's first value, so no width is reserved for a nesting most rows do not
 * have. A row with no parts keeps the space, so the values below it line up.
 */
export function DisclosureCell({
  hasChildren = false,
  expanded = false,
  onToggle,
  label,
  width,
  pinned,
  offset,
  edge,
}: TableDisclosureProps) {
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
            className={CHEVRON_BUTTON}
          >
            <ChevronRight className={chevronClass(expanded)} />
          </button>
        ) : (
          <span aria-hidden className="block size-250 shrink-0" />
        )}
      </span>
    </Td>
  );
}

export type TableDetailProps = {
  /** The row's id, which the chevron that opens it names in `aria-controls`. */
  id?: string | undefined;
  /** The number of columns the row spans: every column of the table. */
  colSpan: number;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * The row a record opens into: one cell spanning every column, holding whatever the record has to
 * show at length, a child table included. The chevron that opens it carries `aria-controls` with
 * this row's `id`.
 */
export function DetailRow({ id, colSpan, className, children }: TableDetailProps) {
  return (
    <tr id={id} className="border-b border-default bg-surface-sunken last:border-b-0">
      <td colSpan={colSpan} className={cn("px-200 py-150 align-top", className)}>
        {children}
      </td>
    </tr>
  );
}

export type TableHandleProps = ComponentProps<"span"> &
  PinnedProps & {
    ref?: Ref<HTMLSpanElement> | undefined;
    /** The grip's name, after the row: "Reorder row CTRL-0412". "Reorder" unsaid. */
    label?: string | undefined;
    isDragging?: boolean | undefined;
  };

/**
 * The grip cell for a row that can be dragged into a new order. `ref`, `attributes` and `listeners`
 * come from the drag context; the cell is the handle, so the row's own controls keep their clicks.
 */
export function HandleCell({
  ref,
  label,
  isDragging,
  className,
  pinned,
  offset,
  edge,
  ...props
}: TableHandleProps) {
  const { t } = useLedgerLocale();
  return (
    <Td className="max-w-none pe-0" width={NARROW} pinned={pinned} offset={offset} edge={edge}>
      <span
        ref={ref}
        role="button"
        aria-label={label ?? t("reorder")}
        className={cn(
          "relative inline-flex size-250 shrink-0 touch-target items-center justify-center rounded-small icon-subtlest outline-none touch-none cursor-grab hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused",
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
  /** Under the label in the card: kind, path, owner. */
  meta?: ReactNode | undefined;
  /** At the end of the item's line in the card: an Indicator, one. */
  status?: ReactNode | undefined;
};

export type TableListProps = {
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
};

/**
 * Several values in one cell, on one line: the first by name, the rest as a count ("+2", spoken
 * "and 2 more"), every one in a hover card with its meta line and status. The line is a button:
 * with `onOpen` its click opens the row's preview or detail; without it the click, Enter or a tap
 * opens the card, so the list is reachable where nothing can hover. Every item, its meta and
 * status and the `note` are the line's description, so a screen reader hears the whole list
 * without the card. Given `expanded`, the line carries a chevron and reads as the row's
 * disclosure, so a cell that opens the row into a table says so.
 */
export function ListCell({ items, empty, note, onOpen, expanded, controls }: TableListProps) {
  const { formatNumber, t } = useLedgerLocale();
  // The card is the substitute for opening the row. Once the row is open the whole list is on
  // screen below, so the card is suppressed rather than sitting over what it stands in for.
  const [open, setOpen] = useState(false);
  const described = useId();
  const [first, ...rest] = items;
  if (!first) return <>{empty ?? <Absent />}</>;
  const line = (
    <>
      <span className="min-w-0 truncate">{first.label}</span>
      {rest.length ? (
        <span className="shrink-0 font-body-small tabular-nums text-subtle">
          <span aria-hidden>+{formatNumber(rest.length)}</span>
          <span className="sr-only"> {t("listMore", { count: formatNumber(rest.length) })}</span>
        </span>
      ) : null}
      {expanded === undefined ? null : (
        <ChevronRight
          aria-hidden
          className={cn(
            "size-icon-small shrink-0 icon-subtlest transition-transform duration-fast ease-standard motion-reduce:transition-none",
            expanded ? "rotate-90" : "rtl:rotate-180",
          )}
        />
      )}
    </>
  );
  const shape =
    "relative flex min-w-0 max-w-full touch-target items-center gap-075 rounded-xsmall text-start outline-none focus-visible:outline-focused";
  // The card wraps what it exists to show; nothing in it is cut.
  const card = (
    <div className="flex flex-col gap-100">
      <ul className="flex flex-col gap-075">
        {items.map((i) => (
          <li key={i.key} className="flex flex-col gap-025">
            <span className="flex items-start gap-100">
              <span className="min-w-0 break-words font-medium">{i.label}</span>
              {i.status ? <span className="ms-auto shrink-0">{i.status}</span> : null}
            </span>
            {i.meta ? (
              <span className="break-words font-body-small text-subtle">{i.meta}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {note ? (
        <div className="border-t border-default pt-075 font-body-small text-subtle">{note}</div>
      ) : null}
    </div>
  );
  // The card's content as the line's description, in the order the card shows it. Hidden: a
  // description is read from hidden content, and the cell's own text stays the line alone.
  const description = (
    <span id={described} hidden>
      {items.map((i) => (
        <span key={i.key} className="block">
          {i.label}
          {i.meta ? <>, {i.meta}</> : null}
          {i.status ? <>, {i.status}</> : null}.
        </span>
      ))}
      {note ? <span className="block">{note}</span> : null}
    </span>
  );
  return (
    <>
      <HoverCard open={open && !expanded} onOpenChange={setOpen}>
        <HoverCardTrigger
          render={
            <button
              type="button"
              aria-describedby={described}
              {...(onOpen && expanded !== undefined ? { "aria-expanded": expanded } : {})}
              {...(onOpen && controls ? { "aria-controls": controls } : {})}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpen) {
                  setOpen(false);
                  onOpen();
                } else {
                  // Where nothing can hover the tap is the only way to the card, so it opens it
                  // rather than passing on to the row.
                  setOpen(true);
                }
              }}
              className={cn(shape, onOpen && "hover:underline")}
            >
              {line}
            </button>
          }
        />
        <HoverCardContent
          align="start"
          alignOffset={0}
          className="overflow-y-auto"
          style={{ width: 300, maxHeight: "var(--available-height)" }}
        >
          {card}
        </HoverCardContent>
      </HoverCard>
      {description}
    </>
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
