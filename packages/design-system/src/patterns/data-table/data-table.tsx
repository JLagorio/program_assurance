import { useLedgerLocale } from "../../lib/locale";
import {
  flexRender,
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { ArrowDown, ArrowUp, ChevronRight, MoreHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { announce } from "../../lib/announce";
import {
  fitFrame,
  shareSlack,
  identityOf,
  yieldPins,
  type FitColumn,
  type FrameFit,
  type PinnedColumn,
} from "./responsive";
import { rowNameOf, rowSpokenName } from "./row-name";
import { KeyValue } from "../../components/key-value";

import { Alert, AlertAction, AlertDescription } from "../../components/alert";
import { Button, IconButton } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
} from "../../components/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../components/hover-card";
import { MatchDirection } from "../../components/tooltip";
import { Id } from "../../components/id";
import { TablePagination } from "./pagination";
import { Skeleton } from "../../components/skeleton";
import { PreviewEye, Table, headerTrailingWidth, previewValueClass } from "../../components/table";
import { token, tokenLiterals } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useFillWindow } from "../../lib/use-fill-window";
import { useTouch } from "../../lib/touch";
import {
  Empty,
  EmptyHeader,
  EmptyContent,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  type EmptyIllustrationKind,
} from "../../components/empty";
import type { DataTableFeatures } from "./features";
import { ColumnMoveStatus, Columns, HeaderMenu, Settings } from "./columns-menu";
import { Filter, Filters, Presets, Search } from "./filter";
import { GroupBy } from "./group-by";
import { Metrics, MetricsContent, MetricsTrigger } from "./metrics";
import { ColumnSortable, DragContext, RowSortable, useColumnDrag, useRowDrag } from "./reorder";
import { SelectionBar } from "./selection-bar";
import { focusPlace, stopCell, syncTabOrder, touchedRows, treegridKeys } from "./treegrid";
import { DataTableSort, directionWords, labelOf } from "./sort-menu";
import type { DataTableInstance } from "./use-data-table";

/*
 * The renderer. It takes the table from useDataTable and draws it with the Table parts: header
 * groups, rows and cells, the toolbar slot above, Pagination below when the table pages, the
 * states under the header so it never moves. Every feature is one option on the hook and
 * one part here; nothing is a second table.
 */

/** The SelectionBar, as the toolbar slot finds it. */
const SELECTION_BAR = '[data-slot="data-table-selection-bar"]';

/** Hands an element to a caller's ref, a callback or an object. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/**
 * `refreshing` keeps the rows drawn while new ones load: the table is busy, and says so. `error`
 * keeps any rows `data` still holds, usable, under the error: a refresh that failed.
 */
export type DataTableState = "ready" | "loading" | "refreshing" | "empty" | "error";

/** What the empty state says when a search or a filter left nothing. Each part has a localized default; the default action clears the table's search and column filters. */
export type DataTableFilteredEmpty = {
  title?: string | undefined;
  description?: string | undefined;
  /** In place of the kit's Clear filters. `null` for no action. */
  action?: ReactNode;
  illustration?: EmptyIllustrationKind | false | undefined;
};

export type DataTableEmpty = {
  title: string;
  description?: string | undefined;
  /** The primary next step: the button that creates the first record. */
  action?: ReactNode;
  /** A quieter action beside it: a link to the docs, an import. */
  secondary?: ReactNode;
  /** The picture above the message. `records` by default; `false` for none. */
  illustration?: EmptyIllustrationKind | false | undefined;
  /**
   * `compact` for a collection of a few rows inside a record, a card or a rail: the message sits
   * beside `icon` in one short row instead of the centred picture, and a search that leaves
   * nothing says so the same way. `default` unsaid.
   */
  size?: "default" | "compact" | undefined;
  /** The compact empty's icon, in the neutral circle. None unsaid. */
  icon?: ReactNode;
  /** The narrowed state: shown instead of the above while a search, a column filter or the caller's `narrowed` is active. */
  filtered?: DataTableFilteredEmpty | undefined;
};

/** What one row is, in the words the result status uses: `{ one: "task", other: "tasks" }`. */
export type DataTableNoun = { one: string; other: string };

export type DataTableOwnProps<TData extends RowData> = {
  table: DataTableInstance<TData>;
  /** Search, filters and actions. Sits above the header, flush with the table's edge. */
  toolbar?: ReactNode;
  state?: DataTableState | undefined;
  /** What the empty state says: one message for no records, another while a search or a filter leaves none. */
  empty?: DataTableEmpty | undefined;
  /**
   * The caller has narrowed `data` outside the table's own search and filters: a scope toggle, a
   * route or server filter, a picker's own search. With nothing left, the table keeps its toolbar
   * and header and shows the filtered empty instead of the no-records state, so the control that
   * brings the rows back stays in reach. Give `empty.filtered.action` the way back; the kit's
   * Clear filters shows only while the table's own search or filters are set.
   */
  narrowed?: boolean | undefined;
  /** What a row is, for the polite result status after a search, a filter or a page ("8 of 24 tasks"). "row" and "rows" unsaid. */
  noun?: DataTableNoun | undefined;
  /**
   * What the error state says. With no rows it stands under the header in place of them; a failed
   * refresh (`state="error"` while `data` still holds the rows the reader had) keeps those rows
   * usable, with the alert above the table.
   */
  error?: ReactNode;
  /** With `state="error"`, Try again in the error's alert runs this: refetch what failed. None unsaid. */
  onRetry?: (() => void) | undefined;
  /**
   * The row opens something: the record, a peek. A click on a control or a link in the row, or one
   * that ends a text selection, is not a row click. With Cmd, Ctrl or Shift, or the middle button,
   * the row opens its link in a new tab instead: `rowHref`, else the first link in the row.
   */
  onRowClick?: ((row: TData, event: MouseEvent<HTMLTableRowElement>) => void) | undefined;
  /** Where the row goes, for a new tab from a modifier or middle click. The first link in the row unsaid. */
  rowHref?: ((row: TData) => string | undefined) | undefined;
  /** How many skeleton rows a first load draws: the page size, at most ten, unsaid; `3` suits a collection of a few rows. */
  loadingRows?: number | undefined;
  /** The table scrolls inside itself past this height; the header stays. */
  maxHeight?: number | undefined;
  /** The register is the page's one block: it takes the rest of the window, the rows scroll under the header, and the pagination sits at the bottom. Wins over `maxHeight`. */
  fill?: boolean | undefined;
  /**
   * Fit the container: lower-priority fields move into each row's More fields ("+3") instead of
   * the table scrolling sideways. On unsaid. `responsive={false}` keeps every column in the row
   * and scrolls the frame sideways, for a wide comparison or a table whose cells hold drafts.
   */
  responsive?: boolean | undefined;
  className?: string | undefined;
};

/**
 * The register's props, and the native attributes of its root `div`, which also takes the ref; its
 * `data-slot` is `data-table`.
 */
export type DataTableProps<TData extends RowData> = DataTableOwnProps<TData> &
  Omit<ComponentProps<"div">, keyof DataTableOwnProps<TData> | "children">;

type F = DataTableFeatures;

type ResponsiveLayout = FrameFit["layout"];
const ResponsiveLayoutContext = createContext<ResponsiveLayout | null>(null);

/**
 * The table's shared popups: one row-actions menu and one glance card, opened by each row's
 * trigger with the row's id as its payload, so a closed menu or card costs a row nothing.
 */
type SharedPopups = {
  actions: MenuPrimitive.Handle<string>;
  glance: PreviewCardPrimitive.Handle<GlancePayload>;
};
/** Which glance a trigger opens: the row, and the id column whose `glance` draws it. */
type GlancePayload = { rowId: string; columnId: string };
const SharedPopupsContext = createContext<SharedPopups | null>(null);

/** Where a data column is drawn: its band, how far from that edge, and whether it touches the middle. */
type DrawnPin = {
  pinned: false | "start" | "end";
  offset: number | undefined;
  edge: boolean | "scrolled";
};
const UNPINNED: DrawnPin = { pinned: false, offset: undefined, edge: false };
const PinsContext = createContext<ReadonlyMap<string, DrawnPin>>(new Map());
function visibleHeaders<T extends RowData>(
  header: Header<F, T, unknown>,
  layout: ResponsiveLayout | null,
): number {
  if (!layout) return header.colSpan;
  return header.subHeaders.length
    ? header.subHeaders.reduce((sum, child) => sum + visibleHeaders(child, layout), 0)
    : Number(layout.ids.has(header.column.id));
}
function fittedHeaderWidth<T extends RowData>(
  header: Header<F, T, unknown>,
  layout: ResponsiveLayout,
): number {
  return header.subHeaders.length
    ? header.subHeaders.reduce((sum, child) => sum + fittedHeaderWidth(child, layout), 0)
    : layout.ids.has(header.column.id)
      ? (layout.widths.get(header.column.id) ?? 0)
      : 0;
}

/** The custom property that carries a flexible column's share of the slack, set on the table's root. */
const flexVar = (index: number) => `--ledger-table-flex-${index}`;

/**
 * A fitted header's width. The flexible columns share the slack: each but the last reads its share
 * from a custom property the renderer sets from the frame's width, outside React, and the last is
 * drawn without a width, so it takes the rest.
 */
function fittedHeaderStyle<T extends RowData>(
  header: Header<F, T, unknown>,
  layout: ResponsiveLayout,
): CSSProperties | undefined {
  const flex = header.subHeaders.length === 0 ? layout.flexible.indexOf(header.column.id) : -1;
  if (flex === layout.flexible.length - 1 && flex >= 0) return undefined;
  if (flex >= 0) {
    const least = layout.widths.get(header.column.id) ?? 0;
    return { width: `var(${flexVar(flex)}, ${least}px)`, minWidth: least };
  }
  const width = fittedHeaderWidth(header, layout);
  return { width, minWidth: width };
}

/** Whether the table previews its rows: through `preview` on the hook, or an id column's `preview`. */
const idPreviewMeta = <TData extends RowData>(table: Row<F, TData>["table"]) =>
  table.getAllLeafColumns().find((c) => c.columnDef.meta?.preview)?.columnDef.meta;

/**
 * A row's preview: what its eye opens and whether its preview is the open one, from the hook's
 * `preview` or the id column's. The handler is read when the eye is pressed, so a row that has not
 * redrawn still opens with the caller's current one.
 */
function previewOf<TData extends RowData>(row: Row<F, TData>) {
  const table = row.table;
  const own = table.options.meta?.preview;
  if (own)
    return {
      onPreview: () => row.table.options.meta?.preview?.onPreview(row.original as never),
      isActive: own.activeId !== undefined && own.activeId !== null && own.activeId === row.id,
    };
  const meta = idPreviewMeta(table);
  if (!meta?.preview) return undefined;
  return {
    onPreview: () => idPreviewMeta(row.table)?.preview?.(row.original as never),
    isActive: meta.active ? meta.active(row.original as never) : false,
  };
}

/** A column's name for what is said about it: its header text, else its id. */
const columnSpokenName = <TData extends RowData>(column: Column<F, TData, unknown>): string =>
  typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;

/*
 * A link inside a cut value keeps its whole focus ring. The value clips across only, and a text
 * link in it cuts itself at the value's width and draws its ring inside its own box, so the clip
 * that ends the value in an ellipsis never takes the ring. The same holds for a link in a plain
 * cell. Beside an icon in a flex row the link shrinks to the room left (`min-w-0`), so it still ends
 * in its own ellipsis. A link that looks like a button (LinkButton, LinkIconButton) keeps its own
 * box and ring.
 */
const LINK_KEEPS_RING =
  "[&_a:not([data-slot^=link-])]:inline-block [&_a:not([data-slot^=link-])]:min-w-0 [&_a:not([data-slot^=link-])]:max-w-full [&_a:not([data-slot^=link-])]:overflow-x-clip [&_a:not([data-slot^=link-])]:text-ellipsis [&_a:not([data-slot^=link-])]:whitespace-nowrap [&_a:not([data-slot^=link-])]:align-top [&_a:not([data-slot^=link-]):focus-visible]:outline-field-focused";

/** `Table.Selection` and `Table.Handle` are this wide; the detail chevron column matches them. */
const NARROW = 32;

const sizeStyle = (
  header: Header<F, RowData, unknown>,
  sized: boolean,
  extra: number,
): CSSProperties | undefined => {
  const def = header.column.columnDef;
  const style: CSSProperties = {};
  if (def.size !== undefined || sized) style.width = header.getSize() + extra;
  if (def.minSize !== undefined) style.minWidth = def.minSize + extra;
  return Object.keys(style).length ? style : undefined;
};

/* Where any pointer is coarse (useTouch, the kit's one touch predicate), the header's column menu
   and grip are always shown beside the heading. A table that scrolls sideways draws the column
   that much wider (`headerTrailingWidth`), so the heading keeps the room it has at rest where a
   pointer hovers. A responsive table keeps the author's widths, so the controls never fold a
   column away on a phone: the heading gives them its room and shows whole in its tooltip. Layout
   only: the stored sizes, the resize handle's value and the export do not change. */

/** Which trailing controls a column's header carries: the column menu, when it would hold an item, and the drag grip. */
const headerControls = <TData extends RowData>(column: Column<F, TData, unknown>) => {
  const options = column.table.options.meta;
  const menu =
    Boolean(options?.columnMenu) &&
    column.columnDef.meta?.kind !== "actions" &&
    (column.getCanSort() ||
      (Boolean(options?.pinnable) && column.getCanPin()) ||
      (Boolean(options?.hideable) && column.getCanHide()) ||
      (Boolean(options?.resizable) && column.getCanResize()));
  const grip = Boolean(options?.reorderable) && !column.getIsPinned();
  return { menu, grip };
};

/** How much wider a column is drawn where any pointer is coarse: its header's trailing controls. */
const touchExtra = <TData extends RowData>(column: Column<F, TData, unknown>, touch: boolean) => {
  if (!touch) return 0;
  const { menu, grip } = headerControls(column);
  return headerTrailingWidth(Number(menu) + Number(grip));
};

/** The same for a header, which spans the extra of every column under it. */
const headerExtra = <TData extends RowData>(
  header: Header<F, TData, unknown>,
  touch: boolean,
): number =>
  header.subHeaders.length
    ? header.subHeaders.reduce((sum, child) => sum + headerExtra(child, touch), 0)
    : touchExtra(header.column, touch);

/** No pin gives way. */
const NONE_RELEASED = "[]";

/** How long the result status waits after the last change to the question, so typing is said once. */
const RESULT_STATUS_DELAY = 500;

/** Which pins give way in a frame this wide, as a key that state and a memo compare by value. */
const releaseKey = (columns: readonly PinnedColumn[], frame: number, before: number) =>
  JSON.stringify([...yieldPins(columns, frame, before)]);

/**
 * Where each pinned column is drawn, how far from its edge, and which one touches the middle. The
 * pins are the reader's, but a band too wide for the frame gives way (`yieldPins`): a column that
 * gives way is drawn in the scrolling middle, and the offsets and the edge follow the columns that
 * stay. A pinned data column draws its hairline at rest; the row-actions column is chrome, like the
 * leading columns, so it draws one only while a column is scrolled under it.
 */
function drawPins(
  columns: readonly PinnedColumn[],
  before: number,
  released: ReadonlySet<string>,
): Map<string, DrawnPin> {
  const drawn = new Map<string, DrawnPin>();
  const edge = (touches: boolean, chrome: boolean | undefined) =>
    touches ? (chrome ? ("scrolled" as const) : true) : false;
  const start = columns.filter((column) => column.pin === "start" && !released.has(column.id));
  const end = columns.filter((column) => column.pin === "end" && !released.has(column.id));
  let offset = before;
  start.forEach((column, index) => {
    drawn.set(column.id, {
      pinned: "start",
      offset,
      edge: edge(index === start.length - 1, column.chrome),
    });
    offset += column.width;
  });
  offset = 0;
  for (let index = end.length - 1; index >= 0; index--) {
    const column = end[index]!;
    drawn.set(column.id, { pinned: "end", offset, edge: edge(index === 0, column.chrome) });
    offset += column.width;
  }
  return drawn;
}

/** One level of a tree's indent, `space.200`, applied to the row's first value: in pixels, which
    Table.Id's `indent` takes. */
const INDENT = Number.parseFloat(tokenLiterals["space.200"]);

/** The disclosure column: the chevron and a hair either side, nothing reserved for the indent. */
const DISCLOSURE = 28;

/**
 * The leading columns the renderer adds: selection, the tree's disclosure, the drag handle, the
 * detail chevron. They are always the first columns, in this order, and always pinned, whatever the
 * reader reorders, hides or pins, so the checkbox and the chevron never scroll away or land after a
 * pinned column.
 */
type Leading = { selectable: boolean; tree: boolean; handle: boolean; detail: boolean };
type LeadingKey = keyof Leading;

const LEADING: readonly LeadingKey[] = ["selectable", "tree", "handle", "detail"];

const leadingKeys = (l: Leading) => LEADING.filter((k) => l[k]);
const leadingCount = (l: Leading) => leadingKeys(l).length;

/** Every leading column is `NARROW`, except the disclosure, which holds only its chevron. */
const leadingSizes: Record<LeadingKey, number> = {
  selectable: NARROW,
  tree: DISCLOSURE,
  handle: NARROW,
  detail: NARROW,
};

const leadingWidth = (l: Leading) => leadingKeys(l).reduce((sum, k) => sum + leadingSizes[k], 0);

/** Each leading column's offset from the start edge, and whether it is the last of them. */
const leadingPins = (l: Leading, dataPinned: boolean) => {
  const order = leadingKeys(l);
  const sizes = leadingSizes;
  const last = order[order.length - 1];
  return (key: LeadingKey) => ({
    pinned: "start" as const,
    offset: order.slice(0, order.indexOf(key)).reduce((sum, k) => sum + sizes[k], 0),
    edge: key === last && !dataPinned ? ("scrolled" as const) : false,
  });
};

/** The column whose first cell carries the preview eye: the leftmost column that holds a value. */
const previewColumn = <TData extends RowData>(columns: Column<F, TData, unknown>[]) =>
  (
    columns.find((c) => {
      const kind = c.columnDef.meta?.kind;
      return kind !== "custom" && kind !== "actions";
    }) ?? columns[0]
  )?.id;

function HeaderCell<TData extends RowData>({
  header,
  table,
  touch,
}: {
  header: Header<F, TData, unknown>;
  table: DataTableInstance<TData>;
  /** Some pointer is coarse: the trailing controls sit beside the heading and the column is wider. */
  touch: boolean;
}) {
  const layout = useContext(ResponsiveLayoutContext);
  const drawnPins = useContext(PinsContext);
  const column = header.column;
  const meta = column.columnDef.meta;
  const options = table.options.meta;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  const leaf = header.subHeaders.length === 0;
  const sized = table.state.columnSizing[column.id] !== undefined || column.getIsPinned() !== false;
  // The row-actions column is chrome, always last and pinned to the end: it has no column menu.
  const hasMenu = leaf && !header.isPlaceholder && headerControls(column).menu;
  // With a column menu, the menu moves and sizes the column by keyboard, so the grip and the
  // resize handle are for the pointer and a header costs the keyboard two stops, the sort and the
  // menu. Without one (`columnMenu: false`), the grip and the handle keep their keys.
  const drag = useColumnDrag(
    column.id,
    Boolean(options?.reorderable) && leaf && !column.getIsPinned() && !header.isPlaceholder,
    { label: columnSpokenName(column), pointerOnly: hasMenu },
  );
  const pin = leaf ? (drawnPins.get(column.id) ?? UNPINNED) : UNPINNED;
  const canResize = Boolean(options?.resizable) && leaf && column.getCanResize();
  const resizing = table.state.columnResizing;
  const menu = hasMenu ? <HeaderMenu table={table} column={column} drawn={layout?.ids} /> : null;
  const resizeMin = column.columnDef.minSize ?? 20;
  const resizeMax = Math.min(column.columnDef.maxSize ?? 10000, 10000);
  const trailing =
    drag.grip || menu ? (
      <>
        {drag.grip}
        {menu}
      </>
    ) : undefined;
  return (
    <Table.Header
      ref={drag.setNodeRef}
      colSpan={visibleHeaders(header, layout)}
      hairline={!header.isPlaceholder}
      // The heading sits where its figures do (end for a number, logical, so RTL mirrors it); a
      // heading over a group of columns is centred over them.
      align={leaf ? meta?.align : "center"}
      className={cn(drag.isDragging && "bg-surface-hovered")}
      style={{
        ...(layout
          ? fittedHeaderStyle(header, layout)
          : sizeStyle(header as Header<F, RowData, unknown>, sized, headerExtra(header, touch))),
        ...drag.style,
      }}
      pinned={pin.pinned}
      offset={pin.offset}
      edge={pin.edge}
      trailing={trailing}
      {...(header.isPlaceholder ? { "aria-hidden": true } : {})}
      {...(canSort && leaf ? { sort: sorted || false, onSort: () => column.toggleSorting() } : {})}
      {...(canResize
        ? {
            // With a menu, the keyboard sets the width there (Wider, Narrower, Reset width), so
            // the handle is no tab stop of its own; without one, the handle takes the arrow keys.
            resize: {
              onResizeStart: header.getResizeHandler(),
              onResizeReset: () => column.resetSize(),
              value: column.getSize(),
              min: resizeMin,
              max: resizeMax,
              // Every handle says its column: "Resize Status", never eight "Resize column".
              label: columnSpokenName(column),
              ...(hasMenu
                ? {}
                : {
                    onResizeKeyboard: (change: number | "min" | "max") => {
                      const next =
                        change === "min"
                          ? resizeMin
                          : change === "max"
                            ? resizeMax
                            : column.getSize() + change;
                      table.setColumnSizing((current) => ({
                        ...current,
                        [column.id]: Math.min(resizeMax, Math.max(resizeMin, next)),
                      }));
                    },
                  }),
              isResizing: column.getIsResizing(),
              resizeDelta: column.getIsResizing() ? resizing.deltaOffset : null,
            },
          }
        : {})}
    >
      {header.isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext())}
    </Table.Header>
  );
}

/** Each ancestor contributes one vertical guide through its descendant rows. */
function TreeIndent<TData extends RowData>({
  row,
  children,
}: {
  row: Row<F, TData>;
  children: ReactNode;
}) {
  const { t, direction } = useLedgerLocale();
  const { depth } = row;
  const expanded = row.getIsExpanded();
  const hasChildren = row.getCanExpand();
  const label = row.table.options.meta?.tree?.label(row.original as never) ?? row.id;
  return (
    <span
      className="relative flex min-h-row min-w-0 items-center gap-100"
      style={{ paddingInlineStart: depth * INDENT }}
    >
      <span
        aria-hidden
        data-tree-guides=""
        className="pointer-events-none absolute inset-y-0 flex items-stretch"
        // At the middle of the 20px row control (size-250) the row draws below.
        style={{ insetInlineStart: `calc(${token("space.250")} / 2)` }}
      >
        {Array.from({ length: depth }, (_, level) => (
          <span key={level} className="w-200 shrink-0 border-s border-default" />
        ))}
      </span>
      {hasChildren ? (
        // The kit's 20px row control, on the row's own fill so the guides do not run through it.
        // No tooltip: its name says it, and a row mounts none of its own.
        <IconButton
          label={expanded ? t("collapseLabel", { label }) : t("expandLabel", { label })}
          aria-expanded={expanded}
          variant="subtle"
          size="xxsmall"
          isTooltipDisabled
          onClick={(event) => {
            event.stopPropagation();
            row.toggleExpanded();
          }}
          className="bg-surface-current group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected"
          icon={
            <ChevronRight
              className={cn(
                "transition-transform duration-fast ease-standard motion-reduce:transition-none",
                expanded ? "rotate-90" : direction === "rtl" && "rotate-180",
              )}
            />
          }
        />
      ) : (
        <span aria-hidden className="block size-250 shrink-0" />
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </span>
  );
}

function BodyCell<TData extends RowData>({
  cell,
  row,
  hintAt,
  previewAt,
  headerAt,
}: {
  cell: Cell<F, TData, unknown>;
  row: Row<F, TData>;
  /** The column that carries a folded row's hint and the tree indent: the first column with a value. */
  hintAt: string | undefined;
  /** The column whose cell carries the preview eye, when an id column has `preview`. */
  previewAt: string | undefined;
  /** The column whose cell names its row, drawn as `th scope="row"`. */
  headerAt: string | undefined;
}) {
  const { t } = useLedgerLocale();
  const popups = useContext(SharedPopupsContext);

  const meta = cell.column.columnDef.meta;
  const options = cell.column.table.options.meta;
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  const record = row.original as never;
  const pin = useContext(PinsContext).get(cell.column.id) ?? UNPINNED;
  const preview = previewAt === cell.column.id ? previewOf(row) : undefined;
  // The eye says whose preview it opens: the row's name, or the value beside it.
  const shown = preview ? cell.getValue() : undefined;
  const eyeName = preview
    ? (rowNameOf(row) ?? (typeof shown === "string" && shown ? shown : undefined))
    : undefined;
  const eyeLabel = preview && eyeName ? t("previewLabel", { label: eyeName }) : undefined;
  // The cell that names its row: the identity, unless the author names another or none.
  const names = headerAt === cell.column.id;
  // The author wraps the column, or the reader does from the Columns menu.
  const wrap = Boolean(meta?.wrap) || (options?.wrapped?.includes(cell.column.id) ?? false);

  // A folded row's hint sits after its first value.
  const hint =
    options?.tree &&
    cell.column.id === hintAt &&
    row.getCanExpand() &&
    !row.getIsExpanded() &&
    options.tree.hint
      ? options.tree.hint(record, row.subRows.length)
      : null;
  // Guided trees indent their disclosure with the value; unguided trees retain a leading column.
  const depth = options?.tree && cell.column.id === hintAt ? row.depth : 0;
  const guides = options?.tree?.guides && cell.column.id === hintAt;
  const indent = guides ? 0 : depth * INDENT;
  const withGuides = (value: ReactNode) =>
    guides ? <TreeIndent row={row}>{value}</TreeIndent> : value;
  const body = withGuides(
    hint ? (
      <span className="flex min-w-0 items-center gap-100">
        <span className={cn("min-w-0", wrap ? "break-words" : "truncate")}>{content}</span>
        {hint}
      </span>
    ) : (
      content
    ),
  );

  if (meta?.kind === "id") {
    // The glance opens in the table's one card; the row carries only its trigger. It is the hover
    // ladder's first rung, facts the preview and the record also hold, so it adds no tab stop of
    // its own: a record link the id's `cell` draws (the register's name) opens it on focus, and
    // cuts itself at the id's width with its ring inside, so the id's ellipsis never takes it.
    const glance = popups && meta.glance ? Boolean(meta.glance(record)) : false;
    return (
      <Table.Id
        id={withGuides(
          glance && popups ? (
            <HoverCardTrigger
              handle={popups.glance}
              payload={{ rowId: row.id, columnId: cell.column.id }}
              render={
                <span
                  className={cn(
                    "inline-block max-w-full overflow-x-clip text-ellipsis whitespace-nowrap align-top",
                    LINK_KEEPS_RING,
                  )}
                >
                  <Id>{content}</Id>
                </span>
              }
            />
          ) : (
            <span className={LINK_KEEPS_RING}>{content}</span>
          ),
        )}
        tone={meta.tone ?? "brand"}
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        {...(indent ? { indent } : {})}
        {...(preview ? { onPreview: preview.onPreview } : {})}
        {...(eyeLabel ? { label: eyeLabel } : {})}
        {...(names ? { rowHeader: true } : {})}
        {...(preview
          ? { isActive: preview.isActive }
          : meta.active
            ? { isActive: meta.active(record) }
            : {})}
      />
    );
  }

  if (meta?.kind === "actions") {
    // A table that reorders rows adds Move up and Move down to every row's menu.
    const hasActions = (meta.actions?.(record) ?? []).length > 0 || Boolean(options?.reorderRows);
    if (!hasActions || !popups)
      return (
        <Table.Cell
          className="max-w-none px-0"
          pinned={pin.pinned}
          offset={pin.offset}
          edge={pin.edge}
        />
      );
    const label = rowNameOf(row);
    return (
      <Table.Cell
        className="max-w-none px-0 text-center"
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The menu is the table's one row menu; the row carries only its trigger. */}
        <DropdownMenuTrigger
          handle={popups.actions}
          payload={row.id}
          render={
            <IconButton
              label={label ? t("rowActionsFor", { label }) : t("rowActions")}
              variant="subtle"
              // Its name says it; a row mounts no tooltip of its own.
              isTooltipDisabled
              // The column is as wide as the button, and its cell cuts what overflows, so the
              // ring is drawn inside the button's edge, where the cell cannot clip it.
              className="opacity-0 focus-visible:opacity-100 focus-visible:outline-field-focused group-hover/row:opacity-100 data-popup-open:opacity-100 any-pointer-coarse:opacity-100"
              icon={<MoreHorizontal />}
            />
          }
        />
      </Table.Cell>
    );
  }

  if (preview)
    return (
      <Table.Cell
        align={meta?.align}
        {...(wrap ? { wrap: true } : {})}
        {...(names ? { rowHeader: true } : {})}
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        {...(meta?.editable ? { onKeyDown: enterMovesDown } : {})}
      >
        <span
          className="group/eye relative flex items-center"
          {...(indent ? { style: { paddingInlineStart: indent } } : {})}
        >
          <span
            className={cn(
              "min-w-0 flex-1",
              wrap
                ? "whitespace-normal break-words"
                : cn("overflow-x-clip text-ellipsis whitespace-nowrap", LINK_KEEPS_RING),
              previewValueClass(preview.isActive),
            )}
          >
            {body}
          </span>
          <PreviewEye
            onPreview={preview.onPreview}
            isActive={preview.isActive}
            {...(eyeLabel ? { label: eyeLabel } : {})}
          />
        </span>
      </Table.Cell>
    );

  return (
    <Table.Cell
      align={meta?.align}
      {...(wrap ? { wrap: true } : { className: LINK_KEEPS_RING })}
      {...(names ? { rowHeader: true } : {})}
      pinned={pin.pinned}
      offset={pin.offset}
      edge={pin.edge}
      {...(meta?.editable ? { onKeyDown: enterMovesDown } : {})}
    >
      {indent ? (
        <span className="flex min-w-0 items-center" style={{ paddingInlineStart: indent }}>
          {body}
        </span>
      ) : (
        body
      )}
    </Table.Cell>
  );
}

/**
 * The column keyboard model of an editable table: Enter commits (the Editable does that) and then
 * moves to the same column in the next row, so a reader fills a column the way they would in a
 * sheet. Tab keeps its meaning and moves across.
 */
function enterMovesDown(event: KeyboardEvent<HTMLTableCellElement>) {
  // Editable consumes Enter and bubbles it only after accepting the commit. An ordinary
  // input, an invalid draft, or an IME confirmation must keep its own keyboard behavior.
  if (
    event.key !== "Enter" ||
    !event.defaultPrevented ||
    event.nativeEvent.isComposing ||
    event.keyCode === 229 ||
    !(event.target instanceof HTMLInputElement)
  )
    return;
  const cell = event.currentTarget;
  const row = cell.parentElement;
  if (!row) return;
  const index = [...row.children].indexOf(cell);
  const next = row.nextElementSibling;
  const target = next?.children[index]?.querySelector<HTMLElement>("button, input");
  if (target) requestAnimationFrame(() => target.focus());
}

/**
 * One row's radio in a table that chooses one record (`selectable: "single"`). A native radio in a
 * group named for the table, so the browser's own keys hold: Tab reaches the chosen row's radio
 * (the first when none is chosen), the arrow keys move the choice from row to row, Space chooses.
 * Drawn as the kit's RadioGroupItem; the label around it takes a touch-sized hit area.
 */
function ChoiceCell({
  group,
  checked,
  disabled,
  label,
  onChoose,
  pinned,
  offset,
  edge,
}: DrawnPin & {
  group: string;
  checked: boolean;
  disabled: boolean;
  label: string;
  onChoose: () => void;
}) {
  return (
    <Table.Cell
      className="max-w-none pe-0"
      width={NARROW}
      pinned={pinned}
      offset={offset}
      edge={edge}
      onClick={(event) => event.stopPropagation()}
    >
      <label
        className={cn(
          "relative flex size-200 touch-target items-center justify-center",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <input
          type="radio"
          data-slot="table-choice"
          name={group}
          checked={checked}
          disabled={disabled}
          aria-label={label}
          onChange={() => onChoose()}
          className="peer size-200 shrink-0 cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed border border-bold bg-input outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused checked:border-brand checked:bg-brand-bold disabled:opacity-disabled motion-reduce:transition-none"
        />
        <span
          aria-hidden
          data-slot="table-choice-dot"
          className="pointer-events-none absolute size-100 rounded-full bg-surface opacity-0 peer-checked:opacity-100"
        />
      </label>
    </Table.Cell>
  );
}

type BodyRowProps<TData extends RowData> = {
  row: Row<F, TData>;
  leading: Leading;
  isSelected: boolean;
  canSelect: boolean;
  /** The id column's active flag, read by the parent so the memo sees it change. */
  isActive: boolean;
  /** Open in tree mode; the parent reads it so the memo sees it change. */
  isExpanded: boolean;
  /** The row's detail is open; its own state, so a tree row opens its parts and its detail apart. */
  isDetailOpen: boolean;
  /** The visible columns in order; a change re-renders every row. */
  columnsKey: string;
  /** The author's column definitions: new ones (a cell that reads new state) re-render every row. */
  columnDefs: unknown;
  /** A data column is pinned to the start, so the leading columns' edge is not the table's. */
  dataPinned: boolean;
  hintAt: string | undefined;
  previewAt: string | undefined;
  headerAt: string | undefined;
  columnCount: number;
  isPinnedRow: boolean;
  moreOpen: boolean;
  onMoreToggle: (id: string) => void;
  virtualIndex?: number | undefined;
  onMeasure?: ((index: number, height: number) => void) | undefined;
  /** The row's place among every row, for `aria-rowindex` while only some rows are drawn. */
  rowIndex?: number | undefined;
  /** The name of the radio group a one-at-a-time table's rows share. */
  choiceGroup: string;
  /** The parent's one handler for a click on the row, the middle button's included. */
  onRowClick?: ((row: Row<F, TData>, event: MouseEvent<HTMLTableRowElement>) => void) | undefined;
  /** In a treegrid, the row itself holds the rows' one tab stop (rather than one of its cells). */
  treeTabStop: boolean;
};

/** What in a row takes its own click: a control, a link, a form field. */
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [contenteditable=true]";

/** The click was on something in the row that acts on its own, not on the row. */
const onControl = (event: MouseEvent<HTMLElement>) => {
  const target = event.target instanceof Element ? event.target : null;
  const hit = target?.closest(INTERACTIVE);
  return Boolean(hit && hit !== event.currentTarget && event.currentTarget.contains(hit));
};

/** The click ended a text selection in the row, as when a reader drags across a code to copy it. */
const selectingText = (element: HTMLElement) => {
  const selection = typeof window === "undefined" ? null : window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return false;
  const node = selection.anchorNode;
  return Boolean(node && element.contains(node));
};

/** Where a modifier or middle click on the row goes: the author's `rowHref`, else the row's first link. */
const rowLink = (element: HTMLElement, href: string | undefined) =>
  href ?? element.querySelector<HTMLAnchorElement>("a[href]")?.href;

/**
 * One row, memoized on what it shows. A thousand rows must not redraw because one checkbox changed:
 * the parent re-renders and hands each row its flags, and only the rows whose flags changed draw.
 * The props that hold are stable by construction: the leading columns, the fitted layout and the
 * handlers are memoized, and `onRowClick` is read through a ref. New `data` or new column
 * definitions redraw every row, so a consumer keeps both stable (useMemo) to keep the memo.
 * In tree mode the row carries the treegrid aria and is a tab stop while it holds the rows' one
 * stop; with a detail it carries the chevron and the detail row after it.
 */
const BodyRow = memo(function BodyRow<TData extends RowData>({
  row,
  leading,
  isSelected,
  canSelect,
  isExpanded,
  isDetailOpen,
  columnsKey: _columnsKey,
  columnDefs: _columnDefs,
  isActive: _isActive,
  dataPinned,
  hintAt,
  previewAt,
  headerAt,
  columnCount,
  isPinnedRow,
  moreOpen,
  onMoreToggle,
  virtualIndex,
  onMeasure,
  rowIndex,
  choiceGroup,
  onRowClick,
  treeTabStop,
}: BodyRowProps<TData>) {
  const { t, formatNumber, formatPlural } = useLedgerLocale();
  const options = row.table.options.meta;
  const single = Boolean(options?.singleSelection);
  const tree = Boolean(options?.tree);
  const detail = options?.detail;
  const drag = useRowDrag(row.id, leading.handle);
  const detailId = `${options?.view ?? "table"}-${row.id}-detail`;
  const layout = useContext(ResponsiveLayoutContext);
  const moreId = useId();
  const rowElement = useRef<HTMLTableRowElement | null>(null);
  const setNodeRef = drag.setNodeRef;
  const setRowElement = useCallback(
    (element: HTMLTableRowElement | null) => {
      rowElement.current = element;
      setNodeRef?.(element);
    },
    [setNodeRef],
  );
  useLayoutEffect(() => {
    const element = rowElement.current;
    if (!element || virtualIndex === undefined || !onMeasure) return;
    // A virtual item is one logical record: its main row plus either disclosed sibling.
    // Observe the actual table rows so wrapping, asynchronous content and resize all remeasure.
    const parts: Element[] = [element];
    let sibling = element.nextElementSibling;
    while (sibling && (sibling.id === moreId || sibling.id === detailId)) {
      parts.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    const measure = () => {
      const height = parts.reduce((sum, part) => sum + part.getBoundingClientRect().height, 0);
      // A rendered row is never 0 tall: 0 means it is hidden (Main under a phone-width panel).
      // Keep its last height, or showing it again reads as rows growing above the fold and the
      // virtualizer scrolls the table away from where the reader left it.
      if (height > 0) onMeasure(virtualIndex, height);
    };
    const observer = new ResizeObserver(measure);
    parts.forEach((part) => observer.observe(part));
    measure();
    return () => observer.disconnect();
  }, [
    virtualIndex,
    onMeasure,
    moreOpen,
    isDetailOpen,
    moreId,
    detailId,
    layout?.collapsed,
    _columnsKey,
  ]);
  const cells = row.getVisibleCells();
  const overflowCells = layout ? cells.filter((cell) => !layout.ids.has(cell.column.id)) : [];
  const identity = layout
    ? cells.find(
        (cell) => layout.ids.has(cell.column.id) && cell.column.columnDef.meta?.kind !== "actions",
      )
    : undefined;
  const identityValue = identity?.getValue();
  const label = rowNameOf(row);
  // Named by the row, like every row control, never by its id: a row with nothing readable keeps
  // the generic name. It says how many fields it shows or hides: "Show 3 more fields for REQ-001".
  const moreName =
    label ?? (typeof identityValue === "string" && identityValue ? identityValue : undefined);
  const moreCount = overflowCells.length;
  const named = moreName ? { label: moreName } : undefined;
  const moreLabel = formatPlural(
    moreCount,
    moreOpen
      ? named
        ? { one: t("hideMoreFieldsForOne", named), other: t("hideMoreFieldsForOther", named) }
        : { one: t("hideMoreFieldsOne"), other: t("hideMoreFieldsOther") }
      : named
        ? { one: t("showMoreFieldsForOne", named), other: t("showMoreFieldsForOther", named) }
        : { one: t("showMoreFieldsOne"), other: t("showMoreFieldsOther") },
  );

  const pins = leadingPins(leading, dataPinned);
  return (
    <>
      <Table.Row
        ref={setRowElement}
        style={drag.style}
        data-row-id={row.id}
        isSelected={isSelected}
        {...(rowIndex === undefined ? {} : { "aria-rowindex": rowIndex })}
        className={cn(
          onRowClick && "cursor-pointer",
          isPinnedRow && "bg-surface-sunken",
          drag.isDragging && "bg-surface-hovered",
        )}
        {...(tree
          ? {
              "aria-level": row.depth + 1,
              ...(row.getCanExpand() ? { "aria-expanded": isExpanded } : {}),
              // The table takes the keys and follows the focus: see treegrid.ts.
              tabIndex: treeTabStop ? 0 : -1,
            }
          : {})}
        {...(onRowClick
          ? {
              onClick: (event: MouseEvent<HTMLTableRowElement>) => onRowClick(row, event),
              onAuxClick: (event: MouseEvent<HTMLTableRowElement>) => {
                if (event.button === 1) onRowClick(row, event);
              },
            }
          : {})}
      >
        {leading.selectable && single ? (
          <ChoiceCell
            group={choiceGroup}
            checked={isSelected}
            disabled={!canSelect}
            label={label ? t("selectNamed", { label }) : t("selectRow", { id: row.id })}
            onChoose={() => row.toggleSelected(true)}
            {...pins("selectable")}
          />
        ) : leading.selectable ? (
          <Table.Selection
            checked={isSelected}
            onCheckedChange={(next) => row.toggleSelected(next)}
            label={label ? t("selectNamed", { label }) : t("selectRow", { id: row.id })}
            disabled={!canSelect}
            {...pins("selectable")}
          />
        ) : null}
        {leading.tree ? (
          <Table.Disclosure
            hasChildren={row.getCanExpand()}
            expanded={isExpanded}
            onExpandedChange={(next) => row.toggleExpanded(next)}
            label={options?.tree?.label(row.original as never) ?? row.id}
            width={leadingSizes.tree}
            {...pins("tree")}
          />
        ) : null}
        {leading.handle ? (
          <Table.Handle
            {...(drag.handle ?? {})}
            isDragging={drag.isDragging}
            label={label ? t("reorderNamed", { label }) : t("reorderRow", { id: row.id })}
            {...pins("handle")}
          />
        ) : null}
        {leading.detail ? (
          <Table.Cell
            className="max-w-none px-0 text-center"
            width={NARROW}
            onClick={(e) => e.stopPropagation()}
            {...pins("detail")}
          >
            <IconButton
              label={
                label
                  ? t(isDetailOpen ? "hideDetailsFor" : "showDetailsFor", { label })
                  : isDetailOpen
                    ? t("close")
                    : t("open")
              }
              variant="subtle"
              size="xxsmall"
              isTooltipDisabled
              aria-expanded={isDetailOpen}
              aria-controls={detailId}
              onClick={() => options?.toggleDetail?.(row.id)}
              icon={
                <ChevronRight
                  className={cn(
                    "transition-transform duration-fast ease-standard motion-reduce:transition-none",
                    // Closed points to the reading direction's end: left in a right-to-left table.
                    isDetailOpen ? "rotate-90" : "rtl:rotate-180",
                  )}
                />
              }
            />
          </Table.Cell>
        ) : null}
        {cells
          .filter((cell) => !layout || layout.ids.has(cell.column.id))
          .map((cell) => (
            <BodyCell
              key={cell.id}
              cell={cell}
              row={row}
              hintAt={hintAt}
              previewAt={previewAt}
              headerAt={headerAt}
            />
          ))}

        {layout?.collapsed && (
          <Table.Cell
            className="max-w-none px-0 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* The count of the fields the row folds, "+3", never a chevron: a chevron opens a
                tree's branch or a group. The 20px row control; its cell is as narrow as the
                column and cuts what overflows, so its ring is drawn inside its edge. It needs no
                tooltip: the name says what it shows. */}
            <button
              type="button"
              data-slot="data-table-more-fields"
              aria-label={moreLabel}
              aria-expanded={moreOpen}
              aria-controls={moreId}
              // Open, it takes the selected fill, which forced colours replace, so it carries the
              // mark of a toolbar trigger in force and turns Highlight there.
              {...(moreOpen ? { "data-active-trigger": "" } : {})}
              onClick={() => onMoreToggle(row.id)}
              className={cn(
                "relative inline-flex h-250 min-w-250 max-w-full touch-target items-center justify-center rounded-small px-050 font-body-small font-medium tabular-nums outline-none transition-colors duration-fast ease-standard focus-visible:outline-field-focused motion-reduce:transition-none",
                moreOpen
                  ? "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed"
                  : "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed",
              )}
            >
              <span aria-hidden>+{formatNumber(moreCount)}</span>
            </button>
          </Table.Cell>
        )}
      </Table.Row>
      {layout?.collapsed && moreOpen && (
        <Table.Detail id={moreId} colSpan={columnCount}>
          {/* One list: the labels share one column, and stack over their values where the row
              is too narrow for both, as in a narrow panel. */}
          <KeyValue.Group>
            {overflowCells.map((cell) => (
              <KeyValue
                key={cell.id}
                wrap
                label={
                  typeof cell.column.columnDef.header === "string"
                    ? cell.column.columnDef.header
                    : cell.column.id
                }
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </KeyValue>
            ))}
          </KeyValue.Group>
        </Table.Detail>
      )}
      {detail && isDetailOpen ? (
        <Table.Detail id={detailId} colSpan={columnCount}>
          {detail(row.original as never)}
        </Table.Detail>
      ) : null}
    </>
  );
}) as <TData extends RowData>(props: BodyRowProps<TData>) => ReactNode;

/** The empty state. With no records at all it stands alone on its dashed frame; under the header, the table's rules bound it, so it has no frame of its own. */
function EmptyState({
  frame,
  size = "default",
  icon,
  illustration,
  title,
  description,
  action,
  secondary,
  className,
}: {
  frame: "dashed" | "none";
  /** `compact`: the message beside `icon` in one short row, for a collection of a few rows. */
  size?: "default" | "compact" | undefined;
  icon?: ReactNode;
  className?: string | undefined;
  illustration: EmptyIllustrationKind | false;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <Empty frame={frame} size={size} className={className}>
      {size === "compact" ? (
        icon ? (
          <EmptyMedia variant="icon" aria-hidden>
            {icon}
          </EmptyMedia>
        ) : null
      ) : illustration ? (
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind={illustration} />
        </EmptyMedia>
      ) : null}
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action || secondary ? (
        <EmptyContent>
          {action}
          {secondary}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/** A row by its id among every row, the folded and the paged included; nothing once it has gone. */
function findRow<TData extends RowData>(table: DataTableInstance<TData>, id: string | undefined) {
  if (id === undefined) return undefined;
  try {
    return table.getRow(id, true);
  } catch {
    return undefined;
  }
}

/**
 * The table's one row menu. Each row's kebab opens it with the row's id, so the rows carry a
 * trigger each and no menu of their own. It lists the row's actions, then Move up and Move down
 * when the rows reorder: one press moves a row one place, the way that needs no drag (WCAG 2.5.7),
 * and a polite status says where it now stands.
 */
function RowActionsMenu<TData extends RowData>({
  table,
  handle,
}: {
  table: DataTableInstance<TData>;
  handle: MenuPrimitive.Handle<string>;
}) {
  return (
    <DropdownMenu handle={handle}>
      {({ payload }) => <RowActionsContent table={table} rowId={payload} />}
    </DropdownMenu>
  );
}

function RowActionsContent<TData extends RowData>({
  table,
  rowId,
}: {
  table: DataTableInstance<TData>;
  rowId: string | undefined;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const row = findRow(table, rowId);
  if (!row) return null;
  const record = row.original as never;
  const column = table.getAllLeafColumns().find((c) => c.columnDef.meta?.kind === "actions");
  const actions = column?.columnDef.meta?.actions?.(record) ?? [];
  const reorder = table.options.meta?.reorderRows;
  const order = reorder ? table.getRowModel().rows : [];
  const at = order.findIndex((r) => r.id === row.id);
  const previous = at > 0 ? order[at - 1] : undefined;
  const next = at >= 0 ? order[at + 1] : undefined;
  const move = (target: Row<F, TData>, position: "before" | "after") => {
    reorder?.(record, target.original as never, position);
    // Once the caller has put the row in its place, say where that is.
    requestAnimationFrame(() => {
      const now = table.getRowModel().rows;
      const index = now.findIndex((r) => r.id === row.id);
      if (index < 0) return;
      announce(
        t("rowMoved", {
          label: rowSpokenName(row),
          position: formatNumber(index + 1),
          total: formatNumber(now.length),
        }),
      );
    });
  };
  if (actions.length === 0 && !reorder) return null;
  // The menu sizes to its longest label within the viewport; a group change draws a separator.
  return (
    <DropdownMenuContent align="end">
      {actions.map((a, index) => {
        const key = a.id ?? `${index}:${a.label}`;
        const separator =
          index > 0 && a.group !== actions[index - 1]?.group ? (
            <DropdownMenuSeparator key={`${key}:separator`} />
          ) : null;
        // The icon leads and the words follow, as separate children, so a description line sits
        // under the words and not under the icon.
        const label = a.icon
          ? [
              <span key="icon" aria-hidden className="flex icon-subtle">
                {a.icon}
              </span>,
              a.label,
            ]
          : a.label;
        const unavailable = Boolean(a.disabled || a.disabledReason);
        // A navigating action is a link, so a modifier or middle click opens it in a new tab;
        // unavailable, it is an item that says why.
        const item =
          a.href && !unavailable ? (
            <DropdownMenuLinkItem
              key={key}
              href={a.href}
              {...(a.render ? { render: a.render } : {})}
              {...(a.onSelect ? { onClick: a.onSelect } : {})}
            >
              {label}
            </DropdownMenuLinkItem>
          ) : (
            <DropdownMenuItem
              key={key}
              {...(a.onSelect ? { onClick: a.onSelect } : {})}
              {...(a.disabled ? { disabled: true } : {})}
              {...(a.disabledReason ? { disabledReason: a.disabledReason } : {})}
              {...(a.description ? { description: a.description } : {})}
              {...(a.tone === "danger" ? { variant: "danger" as const } : {})}
            >
              {label}
            </DropdownMenuItem>
          );
        return separator ? [separator, item] : item;
      })}
      {reorder ? (
        <>
          {actions.length ? <DropdownMenuSeparator /> : null}
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={!previous}
              onClick={() => {
                if (previous) move(previous, "before");
              }}
            >
              <span className="flex items-center gap-100">
                <ArrowUp className="size-icon-small icon-subtle" /> {t("moveUp")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!next}
              onClick={() => {
                if (next) move(next, "after");
              }}
            >
              <span className="flex items-center gap-100">
                <ArrowDown className="size-icon-small icon-subtle" /> {t("moveDown")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      ) : null}
    </DropdownMenuContent>
  );
}

/** The table's one glance card. Each id's trigger opens it with its row and column. */
function GlanceCard<TData extends RowData>({
  table,
  handle,
}: {
  table: DataTableInstance<TData>;
  handle: PreviewCardPrimitive.Handle<GlancePayload>;
}) {
  return (
    <HoverCard handle={handle}>
      {({ payload }) => {
        const row = findRow(table, payload?.rowId);
        const glance =
          row && payload
            ? table.getColumn(payload.columnId)?.columnDef.meta?.glance?.(row.original as never)
            : null;
        return glance ? (
          <HoverCardContent
            align="start"
            alignOffset={0}
            style={{ width: token("dimension.part.cellCard") }}
          >
            {glance}
          </HoverCardContent>
        ) : null;
      }}
    </HoverCard>
  );
}

function DataTableRoot<TData extends RowData>({
  table,
  toolbar,
  state = "ready",
  empty,
  narrowed: narrowedOutside = false,
  noun,
  error,
  onRetry,
  onRowClick,
  rowHref,
  loadingRows,
  maxHeight,
  fill,
  responsive = true,
  className,
  style,
  ref,
  ...native
}: DataTableProps<TData>) {
  const { t, direction, formatNumber, formatPlural } = useLedgerLocale();
  const options = table.options.meta;
  const selectable = Boolean(table.options.enableRowSelection);
  const single = Boolean(options?.singleSelection);
  const choiceGroup = useId();
  const errorId = useId();
  const hasTree = Boolean(options?.tree) && !options?.tree?.guides;
  const handle = Boolean(options?.reorderRows);
  const detailColumn = Boolean(options?.detail) && options?.detailColumn !== false;
  // One object while the four flags hold, so the row memo sees the same leading columns.
  const leading: Leading = useMemo(
    () => ({ selectable, tree: hasTree, handle, detail: detailColumn }),
    [selectable, hasTree, handle, detailColumn],
  );
  // The page size is the reader's while the table pages; the option is the author's default.
  const pageSize = options?.pageSize === undefined ? undefined : table.state.pagination.pageSize;
  const label = options?.label;
  const tree = options?.tree;
  const groupBy = options?.groupBy;
  const headerGroups = table.getHeaderGroups();
  const requestedColumns = table.getVisibleLeafColumns();
  const root = useRef<HTMLDivElement>(null);
  const touch = useTouch();
  const [frameWidth, setFrameWidth] = useState(0);
  const [releasedKey, setReleasedKey] = useState(NONE_RELEASED);
  const [moreOpenIds, setMoreOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  // A treegrid's one tab stop in its rows: a row, or one cell of it (its place among the row's
  // cells). The ref is what the tab order follows between renders; the state redraws the rows.
  const [treeStop, setTreeStop] = useState<{ row: string | null; cell: boolean }>({
    row: null,
    cell: false,
  });
  const treeStopAt = useRef<{ row: string | null; index: number | null }>({
    row: null,
    index: null,
  });
  // A treegrid's scroll frame as drawn: a new one whenever the register draws its table anew.
  const [frameElement, setFrameElement] = useState<HTMLDivElement | null>(null);
  const toggleMore = useCallback((id: string) => {
    setMoreOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // What a responsive table fits: each drawn column's width, rank and band, as one key.
  const lead = leadingWidth(leading);
  const grouped = headerGroups.length > 1;
  const fitKey = responsive
    ? JSON.stringify([
        requestedColumns.map((column): FitColumn => {
          // The author's width, the reader's, or a pin's: the column is drawn that wide. An
          // unsized column is drawn at least its minimum and takes a share of the spare width.
          // A kind says whether the author gave a width; a column built by hand counts as sized.
          const authored = column.columnDef.meta
            ? Boolean(column.columnDef.meta.sized)
            : column.columnDef.size !== undefined;
          const sized =
            authored ||
            table.state.columnSizing[column.id] !== undefined ||
            Boolean(column.getIsPinned());
          const action = column.columnDef.meta?.kind === "actions";
          // Where any pointer is coarse, the header's controls take their room from the heading,
          // which ends in an ellipsis and shows whole on focus, rather than widening the column:
          // a column widened for its menu would fold a neighbour on a phone.
          return {
            id: column.id,
            width: sized ? column.getSize() : (column.columnDef.minSize ?? 120),
            priority: column.columnDef.meta?.priority,
            action,
            pin: column.getIsPinned(),
            flexible: !sized && !action,
          };
        }),
        lead,
        grouped,
      ])
    : "";
  const fitFor = useCallback((key: string, width: number) => {
    const [columns, leadWidth, isGrouped] = JSON.parse(key) as [FitColumn[], number, boolean];
    return fitFrame(columns, width, leadWidth, { grouped: isGrouped });
  }, []);
  // The flexible columns' shares of the slack, set as custom properties on the root, outside
  // React: every pixel of a resize reaches them without drawing a row.
  const shareOut = useCallback(
    (key: string, width: number) => {
      const element = root.current;
      if (!element) return;
      const { layout: fitted } = fitFor(key, width);
      const [, leadWidth] = JSON.parse(key) as [FitColumn[], number, boolean];
      const shares = shareSlack(fitted, width, leadWidth);
      fitted.flexible.slice(0, -1).forEach((id, index) => {
        element.style.setProperty(flexVar(index), `${shares.get(id) ?? 0}px`);
      });
    },
    [fitFor],
  );
  // The frame's width as last drawn. A resize redraws the table only when the fit it draws
  // changes: a column folds or returns, a pin gives way. In between, the slack goes to the
  // flexible columns through CSS, so a panel opening or a splitter drag costs no render.
  const drawnWidth = useRef(0);
  const latestFitKey = useRef(fitKey);
  const refit = useCallback(() => {
    const element = root.current;
    const key = latestFitKey.current;
    if (!element || !key) return;
    const width = element.clientWidth;
    const drawn = drawnWidth.current;
    // A frame hidden for a while (a tab panel, a closed panel) keeps the fit it last drew.
    if (width === 0) return;
    shareOut(key, width);
    if (width === drawn) return;
    if (drawn > 0 && fitFor(key, drawn).key === fitFor(key, width).key) return;
    drawnWidth.current = width;
    setFrameWidth(width);
  }, [fitFor, shareOut]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || !responsive || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(refit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [responsive, refit]);
  // New columns, sizes or pins: the width kept from before may no longer draw what the frame does.
  useLayoutEffect(() => {
    latestFitKey.current = fitKey;
    refit();
  }, [fitKey, refit]);
  const fit = useMemo(
    () => (fitKey && frameWidth > 0 ? fitFor(fitKey, frameWidth) : null),
    [fitKey, frameWidth, fitFor],
  );
  const layout: ResponsiveLayout | null = fit?.layout ?? null;
  const visibleColumns = requestedColumns.filter((column) => !layout || layout.ids.has(column.id));
  const columnCount =
    visibleColumns.length + leadingCount(leading) + Number(layout?.collapsed ?? false);
  const columnsKey = [
    ...visibleColumns.map((c) => c.id),
    ...table.state.columnPinning.start,
    "|",
    ...table.state.columnPinning.end,
    JSON.stringify(table.state.columnSizing),
    fit?.key ?? "",
    // A column the reader wraps redraws its rows and their heights.
    JSON.stringify(options?.wrapped ?? []),
  ].join(" ");
  // The preview is the hook's `preview`, or the id column's; either puts the eye on the first value.
  const tablePreview = options?.preview;
  const idMeta = idPreviewMeta(table);
  const activeOf = (row: Row<F, TData>) =>
    tablePreview
      ? tablePreview.activeId !== undefined &&
        tablePreview.activeId !== null &&
        tablePreview.activeId === row.id
      : idMeta?.active
        ? idMeta.active(row.original as never)
        : false;
  const previewAt = tablePreview || idMeta?.preview ? previewColumn(visibleColumns) : undefined;
  const hintAt = tree ? previewColumn(visibleColumns) : undefined;
  // The cell that names each row, `th scope="row"`: the author's column, none with `false`, else
  // the identity, the column a responsive row keeps longest. A row of one cell has nothing for a
  // header to name, so its cell stays a `td`.
  const headerAt =
    options?.rowHeader === false || columnCount < 2
      ? undefined
      : (options?.rowHeader ??
        identityOf(
          requestedColumns.map((column) => ({
            id: column.id,
            priority: column.columnDef.meta?.priority,
            action: column.columnDef.meta?.kind === "actions",
          })),
        )?.id);
  const fixed = responsive || options?.layout === "fixed";
  // The leading columns are always pinned, so every start offset begins after them.
  const before = lead;
  // The reader's pins as drawn in this frame: stored pins stay as they are, but a band that would
  // leave the middle a sliver gives way until there is room again.
  const pinnedBand = (band: "start" | "end") =>
    (band === "start" ? table.getStartVisibleLeafColumns() : table.getEndVisibleLeafColumns())
      .filter((column) => !layout || layout.ids.has(column.id))
      .map((column): PinnedColumn => ({
        id: column.id,
        pin: band,
        width: layout
          ? (layout.widths.get(column.id) ?? 0)
          : column.getSize() + touchExtra(column, touch),
        chrome: column.columnDef.meta?.kind === "actions",
      }));
  const bands = [...pinnedBand("start"), ...pinnedBand("end")];
  const bandKey = JSON.stringify([bands, before]);
  // A responsive table works out what gives way as it fits. Any other table keeps only which pins
  // give way in state, and watches its frame only while a data column is pinned: resizing the
  // frame redraws it only when a pin gives way or returns, never on every pixel.
  useLayoutEffect(() => {
    if (responsive) return;
    const element = root.current;
    const [columns, leadWidth] = JSON.parse(bandKey) as [PinnedColumn[], number];
    if (
      !element ||
      typeof ResizeObserver === "undefined" ||
      !columns.some((column) => !column.chrome)
    ) {
      setReleasedKey(NONE_RELEASED);
      return;
    }
    const measure = () => setReleasedKey(releaseKey(columns, element.clientWidth, leadWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [responsive, bandKey]);
  const released = responsive ? (fit?.released ?? NONE_RELEASED) : releasedKey;
  const drawnPins = useMemo(() => {
    const [columns, leadWidth] = JSON.parse(bandKey) as [PinnedColumn[], number];
    return drawPins(columns, leadWidth, new Set(JSON.parse(released) as string[]));
  }, [bandKey, released]);
  const dataPinned = [...drawnPins.values()].some((pin) => pin.pinned === "start");
  // How much of each side of the frame the columns held still cover: the leading columns and the
  // start pins, and the end pins. The frame's scroll padding, so a heading, a cell or a menu that
  // scrolls into view for focus lands clear of them.
  const bandWidth = (band: "start" | "end") =>
    bands
      .filter((column) => column.pin === band && drawnPins.get(column.id)?.pinned === band)
      .reduce((sum, column) => sum + column.width, 0);
  const coveredStart = before + bandWidth("start");
  const coveredEnd = bandWidth("end");
  const pins = leadingPins(leading, dataPinned);
  const minWidth = layout
    ? undefined
    : fixed
      ? visibleColumns.reduce((sum, c) => {
          const sized =
            c.columnDef.size !== undefined ||
            table.state.columnSizing[c.id] !== undefined ||
            c.getIsPinned();
          return sum + (sized ? c.getSize() : (c.columnDef.minSize ?? 120)) + touchExtra(c, touch);
        }, lead)
      : undefined;
  // A treegrid's keys and its one tab stop, on the table: the arrows move between rows and cells,
  // and the controls in its rows leave the Tab order but those in the cell that holds the stop.
  const treeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => treegridKeys(table, direction)(event),
    [table, direction],
  );
  const treeFocus = useCallback((event: FocusEvent<HTMLTableElement>) => {
    const place = focusPlace(event.currentTarget, event.target);
    if (!place) return;
    treeStopAt.current = { row: place.rowId, index: place.index };
    syncTabOrder(event.currentTarget, place.cell);
    setTreeStop((current) =>
      current.row === place.rowId && current.cell === (place.cell !== null)
        ? current
        : { row: place.rowId, cell: place.cell !== null },
    );
  }, []);
  const isTree = Boolean(tree);
  useLayoutEffect(() => {
    // The treegrid's own table, never one nested in a detail row.
    const host = frameElement ?? frame.current;
    const treeTable = isTree
      ? (host?.querySelector<HTMLTableElement>(":scope > table") ?? null)
      : null;
    if (!treeTable) return;
    const stop = () => stopCell(treeTable, treeStopAt.current.row, treeStopAt.current.index);
    syncTabOrder(treeTable, stop());
    const observer = new MutationObserver((records) => {
      const rows = touchedRows(treeTable, records);
      if (rows === null) syncTabOrder(treeTable, stop());
      else if (rows.size > 0) syncTabOrder(treeTable, stop(), rows);
    });
    observer.observe(treeTable, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["tabindex"],
    });
    return () => observer.disconnect();
  }, [isTree, frameElement]);
  const latestRowClick = useRef(onRowClick);
  const latestRowHref = useRef(rowHref);
  useLayoutEffect(() => {
    latestRowClick.current = onRowClick;
    latestRowHref.current = rowHref;
  });
  // One handler for every row. A click on a control or a link in the row is the control's, and
  // one that ends a text selection copies rather than opens. Cmd, Ctrl, Shift or the middle
  // button open the row's link in a new tab. Otherwise the row opens, or in a table that
  // chooses one, is chosen.
  const rowClick = useCallback((row: Row<F, TData>, event: MouseEvent<HTMLTableRowElement>) => {
    const element = event.currentTarget;
    if (onControl(event) || selectingText(element)) return;
    const newTab = event.button === 1 || event.metaKey || event.ctrlKey || event.shiftKey;
    if (newTab) {
      const href = rowLink(element, latestRowHref.current?.(row.original));
      if (href) {
        event.preventDefault();
        window.open(href, "_blank", "noopener");
        return;
      }
    }
    if (event.button !== 0) return;
    const open = latestRowClick.current;
    if (open) open(row.original, event);
    else if (row.table.options.meta?.singleSelection && row.getCanSelect())
      row.toggleSelected(true);
  }, []);
  const rowClickHandler = onRowClick || single ? rowClick : undefined;
  const [popups] = useState<SharedPopups>(() => ({
    actions: MenuPrimitive.createHandle<string>(),
    glance: PreviewCardPrimitive.createHandle<GlancePayload>(),
  }));

  const allRows = table.getRowModel().rows;
  const pinRows = Boolean(options?.pinRows);
  const topRows = pinRows ? table.getTopRows() : [];
  const bottomRows = pinRows ? table.getBottomRows() : [];
  const rows = pinRows ? table.getCenterRows() : allRows;

  // Only visible records mount. BodyRow measures each record together with its disclosed fields;
  // the density estimate covers records that have not been measured yet.
  const virtual = options?.virtualize && !groupBy ? options.virtualize : undefined;
  const frame = useRef<HTMLDivElement>(null);
  const setFrame = useCallback((element: HTMLDivElement | null) => {
    frame.current = element;
    // Only a treegrid follows its frame, since its tab order is kept on the table; any other
    // register stays at null and draws nothing more for it.
    setFrameElement(element?.querySelector(':scope > table[role="treegrid"]') ? element : null);
  }, []);
  // The register that is the page: its root takes the rest of the window from its own top edge,
  // and the toolbar, the frame and the pagination share that height as a column.
  const top = useFillWindow(root, Boolean(fill));
  // While rows are chosen the SelectionBar takes the Toolbar's place in the slot. The slot keeps
  // the height the Toolbar had, so the rows stay under the pointer when the bar is the shorter,
  // as it is where the Toolbar takes two rows on a phone.
  const toolbarSlot = useRef<HTMLDivElement | null>(null);
  const toolbarHeight = useRef(0);
  const observeToolbar = useCallback((slot: HTMLDivElement | null) => {
    toolbarSlot.current = slot;
    if (!slot || typeof ResizeObserver === "undefined") return;
    // The Toolbar folds and unfolds as its frame changes: the height to keep is its latest.
    const observer = new ResizeObserver(() => {
      if (!slot.querySelector(SELECTION_BAR))
        toolbarHeight.current = slot.getBoundingClientRect().height;
    });
    observer.observe(slot);
    return () => {
      observer.disconnect();
      toolbarSlot.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    const slot = toolbarSlot.current;
    if (!slot) return;
    const held =
      toolbarHeight.current > 0 && slot.querySelector(SELECTION_BAR)
        ? `${toolbarHeight.current}px`
        : "";
    if (slot.style.minHeight !== held) slot.style.minHeight = held;
  });
  // The caller's ref reaches the root beside the table's own.
  const latestRef = useRef(ref);
  latestRef.current = ref;
  const setRoot = useCallback((element: HTMLDivElement | null) => {
    root.current = element;
    assignRef(latestRef.current, element);
  }, []);
  // The caller's attributes, then the table's own: its slot names it whatever the caller passes.
  const rootProps = {
    ...native,
    ref: setRoot,
    ...(fill ? { "data-fill": "" } : {}),
    className: cn(fill && "fill-window", className) || undefined,
    style: fill ? ({ ...style, "--fill-top": `${top}px` } as CSSProperties) : style,
    "data-slot": "data-table",
  };
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => frame.current,
    estimateSize: () => virtual?.estimate ?? (options?.density === "compact" ? 36 : 40),
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: virtual?.overscan ?? 8,
    initialRect: { width: 0, height: maxHeight ?? 480 },
    // The virtualizer's scroll updates can arrive during a React commit (Main shown again as a
    // compact-width panel closes); a synchronous flush there logs "flushSync was called from
    // inside a lifecycle method" on every row.
    useFlushSync: false,
  });
  const measureRow = useCallback(
    (index: number, height: number) => virtualizer.resizeItem(index, height),
    [virtualizer],
  );
  useLayoutEffect(() => {
    // Offscreen records cannot observe a width/column change. Drop their old heights;
    // mounted rows reconnect their observers for the same columnsKey and remeasure.
    virtualizer.measure();
  }, [virtualizer, columnsKey]);
  const items = virtual ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtual && items.length ? (items[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtual && items.length ? virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0) : 0;
  const groups = groupBy ? allRows.filter((r) => r.getIsGrouped() && r.depth === 0) : [];
  const renderedRows = groupBy
    ? groups.filter((group) => group.getIsExpanded()).flatMap((group) => group.subRows)
    : [
        ...topRows,
        ...(virtual ? items.flatMap((item) => rows[item.index] ?? []) : rows),
        ...bottomRows,
      ];
  // The row that holds the stop, the first while the stopped row is gone; a cell of it holds it
  // instead while one is the stop and still drawn.
  const stoppedRowShown = renderedRows.some((row) => row.id === treeStop.row);
  const treeTabStop = stoppedRowShown ? treeStop.row : renderedRows[0]?.id;
  const treeCellStop = stoppedRowShown && treeStop.cell;
  // Refreshing keeps the rows it has while new ones load, and so does a refresh that failed: the
  // rows the reader had stay usable, with the error above them.
  const drawing = state === "ready" || state === "refreshing";
  const busy = state === "loading" || state === "refreshing";
  const showRows = (drawing || state === "error") && allRows.length > 0;
  const stale = state === "error" && showRows;
  const isEmpty = state === "empty" || (drawing && allRows.length === 0);
  // A server page that comes back empty (rows deleted from the last page) is a page to leave, not
  // an empty register: the toolbar, the header and the pager stay, with the way to the first page.
  const stranded =
    isEmpty &&
    Boolean(table.options.manualPagination) &&
    pageSize !== undefined &&
    !groupBy &&
    table.state.pagination.pageIndex > 0;
  // A search or a column filter narrowed the rows, or the caller did outside the table: either
  // way what is empty is the result, not the register, so the toolbar and the header stay.
  const searched = String(table.state.globalFilter ?? "") !== "";
  const filteredHere = table.state.columnFilters.length > 0 || searched;
  const narrowed = filteredHere || narrowedOutside || stranded;
  const compact = empty?.size === "compact";
  // After Clear filters, or Go to first page, the button that was pressed is gone with the empty
  // state: focus goes to the search that asked, else to the first control of the rows now shown,
  // else to the table's first control (a heading's sort, the toolbar), so it never falls to the page.
  const refocus = () =>
    requestAnimationFrame(() => {
      const element = root.current;
      if (!element) return;
      const scope = element.closest<HTMLElement>('[role="dialog"]') ?? element;
      const search =
        element.querySelector<HTMLElement>('input[type="search"], [role="searchbox"]') ??
        scope.querySelector<HTMLElement>('input[type="search"], [role="searchbox"]');
      const control =
        element.querySelector<HTMLElement>(
          "tbody a[href], tbody button:not([disabled]), tbody input:not([disabled]), tbody [tabindex='0']",
        ) ??
        element.querySelector<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), [tabindex='0']",
        );
      (search ?? control ?? frame.current)?.focus();
    });
  const clearFilters = () => {
    table.setColumnFilters([]);
    table.setGlobalFilter("");
    refocus();
  };
  const firstPage = () => {
    table.setPageIndex(0);
    refocus();
  };
  // Try again goes with the alert once the table loads again, so focus moves on as it does after
  // Clear filters and never falls to the page. A retry that fails at once keeps it where it is.
  const retried = useRef(false);
  const latestRefocus = useRef(refocus);
  useLayoutEffect(() => {
    latestRefocus.current = refocus;
  });
  useEffect(() => {
    if (state === "error" || !retried.current) return;
    retried.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) latestRefocus.current();
  }, [state]);

  // The result, said once the reader stops asking: after a search, a filter, a saved question or
  // a page, one polite line through the page's announcer ("8 of 24 tasks", "No matching tasks").
  const nounFor = (count: number) =>
    formatPlural(count, noun ?? { one: t("tableRowOne"), other: t("tableRowOther") });
  const resultCount = table.getRowCount();
  const everyRow = table.getPreFilteredRowModel().rows.length;
  const pageCount = pageSize !== undefined && !groupBy ? table.getPageCount() : 1;
  const firstOnPage = pageSize !== undefined ? table.state.pagination.pageIndex * pageSize + 1 : 1;
  const resultMessage = stranded
    ? t("tablePageEmpty")
    : isEmpty && narrowed
      ? t("tableNoMatching", { noun: nounFor(0) })
      : pageSize !== undefined && pageCount > 1
        ? t("tableResultsRange", {
            from: formatNumber(firstOnPage),
            to: formatNumber(Math.min(firstOnPage + pageSize - 1, resultCount)),
            total: formatNumber(resultCount),
            noun: nounFor(resultCount),
          })
        : filteredHere && !table.options.manualFiltering && resultCount !== everyRow
          ? t("tableResultsOf", {
              count: formatNumber(resultCount),
              total: formatNumber(everyRow),
              noun: nounFor(everyRow),
            })
          : t("tableResults", { count: formatNumber(resultCount), noun: nounFor(resultCount) });
  const question = JSON.stringify([
    table.state.globalFilter ?? "",
    table.state.columnFilters,
    pageSize === undefined ? null : [table.state.pagination.pageIndex, pageSize],
    narrowedOutside,
  ]);
  const settled = state === "ready" || state === "empty";
  const said = useRef<{ question: string; message: string } | null>(null);
  useEffect(() => {
    if (!settled) return;
    // The first settled result is the page's own, which the page's heading and loading say.
    if (!said.current) {
      said.current = { question, message: resultMessage };
      return;
    }
    const asked = question !== said.current.question;
    // Data narrowed outside the table changes without a question the table can see.
    const changedOutside = narrowedOutside && resultMessage !== said.current.message;
    if (!asked && !changedOutside) return;
    const timer = setTimeout(() => {
      said.current = { question, message: resultMessage };
      announce(resultMessage);
    }, RESULT_STATUS_DELAY);
    return () => clearTimeout(timer);
  }, [settled, question, resultMessage, narrowedOutside]);
  // A new sort is said once it settles, from a header, the Sort menu or a column menu alike:
  // "Sorted by Due, Newest first". The first settled sort is the page's own and is not said, nor
  // is one restored as the table opens (a kept question, the URL's), which arrives just after it.
  const sorting = table.state.sorting;
  const sortKey = JSON.stringify(sorting);
  const sortedColumn = sorting[0] ? table.getColumn(sorting[0].id) : undefined;
  const sortMessage =
    sorting[0] && sortedColumn
      ? t("sortAnnounced", {
          label: labelOf(sortedColumn),
          direction: t(directionWords(sortedColumn)[sorting[0].desc ? 1 : 0]),
        })
      : t("sortRemoved");
  const saidSort = useRef<{ key: string; at: number } | null>(null);
  useEffect(() => {
    if (!settled) return;
    const now = performance.now();
    const said = saidSort.current;
    if (!said || (sortKey !== said.key && now - said.at < RESULT_STATUS_DELAY)) {
      saidSort.current = { key: sortKey, at: said?.at ?? now };
      return;
    }
    if (sortKey === said.key) return;
    const timer = setTimeout(() => {
      saidSort.current = { key: sortKey, at: said.at };
      announce(sortMessage);
    }, RESULT_STATUS_DELAY);
    return () => clearTimeout(timer);
  }, [settled, sortKey, sortMessage]);
  // A load the reader waits for is said once it outlasts a glance: "Findings, loading". A quick one
  // is not, and the result that follows is said as above.
  const loadingMessage = label ? t("loadingLabel", { label }) : t("loading");
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => announce(loadingMessage), RESULT_STATUS_DELAY);
    return () => clearTimeout(timer);
  }, [busy, loadingMessage]);
  const footerGroup = visibleColumns.some((c) => c.columnDef.footer !== undefined)
    ? table.getFooterGroups().find((g) => g.headers.every((h) => h.subHeaders.length === 0))
    : undefined;

  const framed = !(isEmpty && !narrowed);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    element.style.scrollPaddingInlineStart = `${coveredStart}px`;
    element.style.scrollPaddingInlineEnd = `${coveredEnd}px`;
  }, [coveredStart, coveredEnd, framed]);

  // No records at all: nothing to search, filter, sort or page, so the register is only its empty
  // state, on its own frame, and the action in it creates the first record. It sits in the same
  // MatchDirection as the table, so the root stays one element when the first record arrives and
  // what watches it (the responsive fit, the fill) keeps watching the frame that is drawn.
  if (!framed)
    return (
      <MatchDirection direction={direction}>
        <div {...rootProps}>
          <EmptyState
            className={fill ? "flex-1" : undefined}
            frame="dashed"
            size={empty?.size}
            icon={empty?.icon}
            illustration={empty?.illustration ?? "records"}
            title={empty?.title ?? t("nothingHere")}
            description={empty?.description}
            action={empty?.action}
            secondary={empty?.secondary}
          />
        </div>
      </MatchDirection>
    );

  // While only some rows are drawn (a virtual window, a server page), each drawn row says its place
  // among all of them and the table says how many there are, header rows included.
  const headerRows = headerGroups.length;
  const serverPaged = Boolean(table.options.manualPagination) && pageSize !== undefined && !groupBy;
  const partial = Boolean(virtual) || serverPaged;
  const pageStart = serverPaged ? table.state.pagination.pageIndex * (pageSize ?? 0) : 0;
  const rowCountAttribute = partial
    ? headerRows +
      (virtual ? topRows.length + rows.length + bottomRows.length : table.getRowCount())
    : undefined;
  const drawRow = (
    row: Row<F, TData>,
    isPinnedRow = false,
    virtualIndex?: number,
    position?: number,
  ) => (
    <BodyRow
      key={row.id}
      row={row}
      leading={leading}
      isSelected={row.getIsSelected()}
      canSelect={row.getCanSelect()}
      isActive={activeOf(row)}
      rowIndex={partial && position !== undefined ? headerRows + position + 1 : undefined}
      choiceGroup={choiceGroup}
      isExpanded={row.getIsExpanded()}
      isDetailOpen={Boolean(options?.detailOpen?.(row.id))}
      columnsKey={columnsKey}
      columnDefs={table.options.columns}
      dataPinned={dataPinned}
      hintAt={hintAt}
      previewAt={previewAt}
      headerAt={headerAt}
      columnCount={columnCount}
      isPinnedRow={isPinnedRow}
      moreOpen={moreOpenIds.has(row.id)}
      onMoreToggle={toggleMore}
      virtualIndex={virtualIndex}
      onMeasure={virtualIndex === undefined ? undefined : measureRow}
      onRowClick={rowClickHandler}
      treeTabStop={row.id === treeTabStop && !treeCellStop}
    />
  );

  const narrowHeader = (key: "tree" | "handle" | "detail") => (
    <Table.Header key={key} className="px-0" width={leadingSizes[key]} {...pins(key)}>
      <span className="sr-only">
        {key === "detail" ? t("details") : key === "tree" ? t("parts") : t("reorder")}
      </span>
    </Table.Header>
  );

  // The error, with Try again when the caller can retry. With no rows it stands where they would;
  // over rows kept from before, it sits above the table and says they are the last ones loaded.
  const failure = (
    <Alert tone="danger" role="alert">
      <AlertDescription id={errorId}>
        {error ?? t(stale ? "rowsStale" : "rowsError")}
      </AlertDescription>
      {onRetry ? (
        <AlertAction>
          <Button
            size="small"
            aria-describedby={errorId}
            onClick={() => {
              retried.current = true;
              onRetry();
            }}
          >
            {t("retry")}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );

  const states = (
    <>
      {state === "loading"
        ? Array.from({ length: loadingRows ?? Math.min(pageSize ?? 5, 10) }, (_, i) => (
            <Table.Row key={i} isStatic>
              <Table.Cell colSpan={columnCount} className="max-w-none">
                <Skeleton lines={1} />
              </Table.Cell>
            </Table.Row>
          ))
        : null}
      {state === "error" && !stale ? (
        <Table.Row isStatic>
          <Table.Cell
            colSpan={columnCount}
            className="h-auto max-w-none whitespace-normal px-150 py-150"
          >
            {failure}
          </Table.Cell>
        </Table.Row>
      ) : null}
      {isEmpty ? (
        <Table.Row isStatic>
          <Table.Cell
            colSpan={columnCount}
            className="h-auto max-w-none whitespace-normal px-200 py-200"
          >
            <EmptyState
              frame="none"
              size={empty?.size}
              icon={empty?.icon}
              illustration={empty?.filtered?.illustration ?? "search"}
              title={stranded ? t("tablePageEmpty") : (empty?.filtered?.title ?? t("noMatches"))}
              description={
                stranded
                  ? undefined
                  : (empty?.filtered?.description ??
                    (filteredHere ? t("noMatchesHint") : undefined))
              }
              action={
                stranded ? (
                  <Button size={compact ? "small" : undefined} onClick={firstPage}>
                    {t("goToFirstPage")}
                  </Button>
                ) : empty?.filtered?.action === undefined ? (
                  // Clear filters clears what the table holds; narrowing outside it is the
                  // caller's to undo, with its own action.
                  filteredHere ? (
                    <Button size={compact ? "small" : undefined} onClick={clearFilters}>
                      {t("clearFilters")}
                    </Button>
                  ) : null
                ) : (
                  empty.filtered.action
                )
              }
            />
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );

  const body = (
    <ResponsiveLayoutContext.Provider value={layout}>
      <SharedPopupsContext.Provider value={popups}>
        <PinsContext.Provider value={drawnPins}>
          <DragContext table={table}>
            <Table
              frameRef={setFrame}
              density={options?.density ?? "default"}
              label={label}
              {...(fill ? { fill } : maxHeight === undefined ? {} : { maxHeight })}
              // A tree is a treegrid, with its arrow keys. An editable table stays a table: Tab
              // moves across its cells, so it does not claim a grid's arrow-key model.
              {...(tree ? { role: "treegrid", onKeyDown: treeKeyDown, onFocus: treeFocus } : {})}
              {...(busy ? { "aria-busy": true } : {})}
              {...(rowCountAttribute === undefined ? {} : { "aria-rowcount": rowCountAttribute })}
              className={cn("border-b border-default", fixed && "table-fixed")}
              style={minWidth === undefined ? undefined : { minWidth }}
            >
              <thead>
                <ColumnSortable table={table}>
                  {headerGroups.map((group, i) => (
                    <tr key={group.id} {...(partial ? { "aria-rowindex": i + 1 } : {})}>
                      {i === headerGroups.length - 1 ? (
                        <>
                          {leading.selectable && single ? (
                            // One at a time: no select-all, only the column's name.
                            <Table.Header className="px-0" width={NARROW} {...pins("selectable")}>
                              <span className="sr-only">{t("selection")}</span>
                            </Table.Header>
                          ) : leading.selectable ? (
                            <Table.Selection
                              header
                              checked={table.getIsAllPageRowsSelected()}
                              indeterminate={
                                !table.getIsAllPageRowsSelected() &&
                                table.getIsSomePageRowsSelected()
                              }
                              onCheckedChange={(next) => table.toggleAllPageRowsSelected(next)}
                              label={t("selectPage")}
                              {...pins("selectable")}
                            />
                          ) : null}
                          {leading.tree ? narrowHeader("tree") : null}
                          {leading.handle ? narrowHeader("handle") : null}
                          {leading.detail ? narrowHeader("detail") : null}
                        </>
                      ) : (
                        Array.from({ length: leadingCount(leading) }, (_, j) => (
                          <Table.Header key={j} hairline={false} aria-hidden />
                        ))
                      )}
                      {group.headers
                        .filter((header) => visibleHeaders(header, layout) > 0)
                        .map((header) => (
                          <HeaderCell key={header.id} header={header} table={table} touch={touch} />
                        ))}
                      {layout?.collapsed && (
                        <Table.Header width={32} className="px-0">
                          <span className="sr-only">{t("moreFields")}</span>
                        </Table.Header>
                      )}
                    </tr>
                  ))}
                </ColumnSortable>
              </thead>
              {groupBy && showRows ? (
                groups.map((group) => (
                  <Table.Group
                    key={group.id}
                    colSpan={columnCount}
                    expanded={group.getIsExpanded()}
                    onExpandedChange={(next) => group.toggleExpanded(next)}
                    title={String(group.groupingValue ?? "")}
                    count={group.getLeafRows().length}
                  >
                    {group.subRows.map((row) => drawRow(row))}
                  </Table.Group>
                ))
              ) : (
                <tbody>
                  {states}
                  {showRows ? (
                    <RowSortable table={table}>
                      {topRows.map((row, at) => drawRow(row, true, undefined, pageStart + at))}
                      {virtual ? (
                        <>
                          {paddingTop > 0 ? (
                            <tr aria-hidden style={{ height: paddingTop }}>
                              <td colSpan={columnCount} />
                            </tr>
                          ) : null}
                          {items.map((item) => {
                            const row = rows[item.index];
                            return row
                              ? drawRow(row, false, item.index, topRows.length + item.index)
                              : null;
                          })}
                          {paddingBottom > 0 ? (
                            <tr aria-hidden style={{ height: paddingBottom }}>
                              <td colSpan={columnCount} />
                            </tr>
                          ) : null}
                        </>
                      ) : (
                        rows.map((row, at) =>
                          drawRow(row, false, undefined, pageStart + topRows.length + at),
                        )
                      )}
                      {bottomRows.map((row, at) =>
                        drawRow(
                          row,
                          true,
                          undefined,
                          pageStart + topRows.length + rows.length + at,
                        ),
                      )}
                    </RowSortable>
                  ) : null}
                </tbody>
              )}
              {footerGroup && showRows ? (
                <tfoot>
                  <Table.Row isStatic className="border-t border-default">
                    {Array.from({ length: leadingCount(leading) }, (_, j) => (
                      <Table.Cell key={j} className="w-400 max-w-none pe-0" />
                    ))}
                    {footerGroup.headers
                      .filter((header) => visibleHeaders(header, layout) > 0)
                      .map((header) => (
                        <Table.Cell
                          key={header.id}
                          align={header.column.columnDef.meta?.align}
                          colSpan={visibleHeaders(header, layout)}
                        >
                          {header.isPlaceholder || header.column.columnDef.footer === undefined
                            ? null
                            : flexRender(header.column.columnDef.footer, header.getContext())}
                        </Table.Cell>
                      ))}
                    {layout?.collapsed && <Table.Cell />}
                  </Table.Row>
                </tfoot>
              ) : null}
            </Table>
          </DragContext>
        </PinsContext.Provider>
      </SharedPopupsContext.Provider>
    </ResponsiveLayoutContext.Provider>
  );

  // The pager shows while there is a page to turn to, or a smaller page size to choose: never
  // under a collection that fits the smallest page, where it would only say "1–1 of 1".
  const smallestPage = Math.min(pageSize ?? 0, ...(options?.pageSizes ?? []));
  const fitsOnePage = table.state.pagination.pageIndex === 0 && table.getRowCount() <= smallestPage;
  const showPager =
    pageSize !== undefined &&
    !groupBy &&
    state !== "loading" &&
    (stranded || (!isEmpty && !fitsOnePage));

  // One writing direction for the register's popups (the row menu, the glance, the table's
  // tooltip and cards), set here only where the page has not set it already.
  return (
    <MatchDirection direction={direction}>
      <div {...rootProps} data-responsive={responsive || undefined}>
        {toolbar ? (
          <div ref={observeToolbar} data-slot="data-table-toolbar" className="shrink-0 pb-200">
            {toolbar}
          </div>
        ) : null}
        {stale ? (
          <div data-slot="data-table-error" className="shrink-0 pb-150">
            {failure}
          </div>
        ) : null}
        {/* Refreshing: the rows stay, and a quiet bar over the header's top edge says more are coming. */}
        {state === "refreshing" ? (
          <div aria-hidden className="relative h-0">
            <div
              data-slot="data-table-refreshing"
              className="absolute inset-x-0 top-0 z-10 h-025 animate-pulse rounded-full bg-brand-bold motion-reduce:animate-none"
            />
          </div>
        ) : null}
        {/* A reorderable or resizable table says where a column moved, or how wide it now is, from its menu, in one polite status. */}
        {options?.reorderable || options?.resizable ? (
          <ColumnMoveStatus>{body}</ColumnMoveStatus>
        ) : (
          body
        )}
        <RowActionsMenu table={table} handle={popups.actions} />
        <GlanceCard table={table} handle={popups.glance} />
        {showPager ? (
          <TablePagination
            page={table.state.pagination.pageIndex + 1}
            pageCount={Math.max(1, table.getPageCount())}
            onPageChange={(p) => table.setPageIndex(p - 1)}
            total={table.getRowCount()}
            pageSize={pageSize}
            pageSizes={options?.pageSizes}
            onPageSizeChange={(size) => table.setPageSize(size)}
            label={label ? t("paginationLabel", { label }) : undefined}
            className="shrink-0 pt-100"
          />
        ) : null}
      </div>
    </MatchDirection>
  );
}

export const DataTable = Object.assign(DataTableRoot, {
  GroupBy,
  Sort: DataTableSort,
  SelectionBar,
  Filter,
  Filters,
  Search,
  Presets,
  Columns,
  Settings,
  Metrics,
  MetricsTrigger,
  MetricsContent,
});
