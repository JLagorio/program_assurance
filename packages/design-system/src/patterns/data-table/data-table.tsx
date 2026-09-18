import { useLedgerLocale } from "../../lib/locale";
import {
  flexRender,
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { fitColumns } from "./responsive";
import { KeyValue } from "../../components/key-value";
import { Stack } from "../../primitives/stack";

import { AlertDescription, Alert } from "../../components/alert";
import { Button, IconButton } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../components/hover-card";
import { Id } from "../../components/id";
import { TablePagination } from "./pagination";
import { Skeleton } from "../../components/skeleton";
import { PreviewButton, Table } from "../../components/table";
import { cn } from "../../lib/cn";
import { useFillWindow } from "../../lib/use-fill-window";
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
import { Columns, HeaderMenu, Settings } from "./columns-menu";
import { Filter, Filters, Presets, Search } from "./filter";
import { GroupBy } from "./group-by";
import { Metrics, MetricsContent, MetricsTrigger } from "./metrics";
import { ColumnSortable, DragContext, RowSortable, useColumnDrag, useRowDrag } from "./reorder";
import { SelectionBar } from "./selection-bar";
import type { DataTableInstance } from "./use-data-table";

/*
 * The renderer. It takes the table from useDataTable and draws it with the Table parts: header
 * groups, rows and cells, the toolbar slot above, Pagination below when the table pages, the
 * states under the header so it never moves. Every feature is one option on the hook and
 * one part here; nothing is a second table.
 */

export type DataTableState = "ready" | "loading" | "empty" | "error";

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
  /** The narrowed state: shown instead of the above while a search or a column filter is active. */
  filtered?: DataTableFilteredEmpty | undefined;
};

export type DataTableProps<TData extends RowData> = {
  table: DataTableInstance<TData>;
  /** Search, filters and actions. Sits above the header, flush with the table's edge. */
  toolbar?: ReactNode;
  state?: DataTableState | undefined;
  /** What the empty state says: one message for no records, another while a search or a filter leaves none. */
  empty?: DataTableEmpty | undefined;
  /** What the error state says. */
  error?: ReactNode;
  /** The row opens something: the record, a peek. */
  onRowClick?: ((row: TData) => void) | undefined;
  /** The table scrolls inside itself past this height; the header stays. */
  maxHeight?: number | undefined;
  /** The register is the page's one block: it takes the rest of the window, the rows scroll under the header, and the pagination sits at the bottom. Wins over `maxHeight`. */
  fill?: boolean | undefined;
  /** Fit the container and disclose lower-priority fields within the row instead of horizontal scrolling. */
  responsive?: boolean | undefined;
  className?: string | undefined;
};

type F = DataTableFeatures;

type ResponsiveLayout = ReturnType<typeof fitColumns> & {
  columns: { id: string; pin: false | "start" | "end" }[];
};
const ResponsiveLayoutContext = createContext<ResponsiveLayout | null>(null);
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

/** `Table.Selection` and `Table.Handle` are this wide; the detail chevron column matches them. */
const NARROW = 32;

const alignClass = (align: "start" | "end" | undefined) =>
  align === "end" ? "text-right" : undefined;

const sizeStyle = (
  header: Header<F, RowData, unknown>,
  sized: boolean,
): CSSProperties | undefined => {
  const def = header.column.columnDef;
  const style: CSSProperties = {};
  if (def.size !== undefined || sized) style.width = header.getSize();
  if (def.minSize !== undefined) style.minWidth = def.minSize;
  return Object.keys(style).length ? style : undefined;
};

/**
 * Where a column is pinned, how far from that edge, and whether it is the one that touches the
 * middle. A pinned data column draws its hairline at rest; the row-actions column is chrome, like
 * the leading columns, so it draws one only while a column is scrolled under it.
 */
const pinning = <TData extends RowData>(
  column: Column<F, TData, unknown>,
  before = 0,
  layout: ResponsiveLayout | null = null,
) => {
  const pinned = column.getIsPinned();
  if (!pinned) return { pinned: false as const, offset: undefined, edge: false };
  const chrome = column.columnDef.meta?.kind === "actions";
  const edge = (touches: boolean) => (touches ? (chrome ? ("scrolled" as const) : true) : false);
  if (layout) {
    const band = layout.columns.filter((item) => layout.ids.has(item.id) && item.pin === pinned);
    const index = band.findIndex((item) => item.id === column.id);
    const adjacent = pinned === "start" ? band.slice(0, index) : band.slice(index + 1);
    return {
      pinned,
      offset:
        (pinned === "start" ? before : 0) +
        adjacent.reduce((sum, item) => sum + (layout.widths.get(item.id) ?? 0), 0),
      edge: edge(pinned === "start" ? index === band.length - 1 : index === 0),
    };
  }

  return {
    pinned,
    offset: pinned === "start" ? before + column.getStart("start") : column.getAfter("end"),
    edge: edge(
      pinned === "start" ? column.getIsLastColumn("start") : column.getIsFirstColumn("end"),
    ),
  };
};

/** One level of a tree's indent, `space.200`, applied to the row's first value. */
const INDENT = 16;

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
  before,
}: {
  header: Header<F, TData, unknown>;
  table: DataTableInstance<TData>;
  /** The width of the pinned leading columns, added to every start offset. */
  before: number;
}) {
  const layout = useContext(ResponsiveLayoutContext);
  const column = header.column;
  const meta = column.columnDef.meta;
  const options = table.options.meta;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  const leaf = header.subHeaders.length === 0;
  const sized = table.state.columnSizing[column.id] !== undefined || column.getIsPinned() !== false;
  const drag = useColumnDrag(
    column.id,
    Boolean(options?.reorderable) && leaf && !column.getIsPinned() && !header.isPlaceholder,
  );
  const pin = leaf
    ? pinning(column, before, layout)
    : { pinned: false as const, offset: undefined, edge: false };
  const canResize = Boolean(options?.resizable) && leaf && column.getCanResize();
  const resizing = table.state.columnResizing;
  const menu =
    options?.columnMenu && leaf && !header.isPlaceholder ? (
      <HeaderMenu table={table} column={column} />
    ) : null;
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
      className={cn(
        alignClass(meta?.align),
        !leaf && "text-center",
        drag.isDragging && "bg-surface-hovered",
      )}
      style={{
        ...(layout
          ? {
              width: fittedHeaderWidth(header, layout),
              minWidth: fittedHeaderWidth(header, layout),
            }
          : sizeStyle(header as Header<F, RowData, unknown>, sized)),
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
            resize: {
              onResizeStart: header.getResizeHandler(),
              onResizeReset: () => column.resetSize(),
              value: column.getSize(),
              min: column.columnDef.minSize ?? 20,
              max: Math.min(column.columnDef.maxSize ?? 10000, 10000),
              onResizeKeyboard: (change: number | "min" | "max") => {
                const min = column.columnDef.minSize ?? 20;
                const max = Math.min(column.columnDef.maxSize ?? 10000, 10000);
                const next =
                  change === "min" ? min : change === "max" ? max : column.getSize() + change;
                table.setColumnSizing((current) => ({
                  ...current,
                  [column.id]: Math.min(max, Math.max(min, next)),
                }));
              },
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
        style={{ insetInlineStart: 10 }}
      >
        {Array.from({ length: depth }, (_, level) => (
          <span key={level} className="w-200 shrink-0 border-s border-default" />
        ))}
      </span>
      {hasChildren ? (
        <button
          type="button"
          aria-label={expanded ? t("collapseLabel", { label }) : t("expandLabel", { label })}
          aria-expanded={expanded}
          onClick={(event) => {
            event.stopPropagation();
            row.toggleExpanded();
          }}
          className="relative inline-flex size-250 shrink-0 items-center justify-center rounded-small bg-surface-current icon-subtle outline-none transition-colors duration-fast ease-standard group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused"
        >
          <ChevronRight
            aria-hidden
            className={cn(
              "size-icon-small transition-transform duration-fast ease-standard",
              expanded ? "rotate-90" : direction === "rtl" && "rotate-180",
            )}
          />
        </button>
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
  before,
  hintAt,
  previewAt,
}: {
  cell: Cell<F, TData, unknown>;
  row: Row<F, TData>;
  before: number;
  /** The column that carries a folded row's hint and the tree indent: the first column with a value. */
  hintAt: string | undefined;
  /** The column whose cell carries the preview eye, when an id column has `preview`. */
  previewAt: string | undefined;
}) {
  const { t } = useLedgerLocale();

  const meta = cell.column.columnDef.meta;
  const options = cell.column.table.options.meta;
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  const record = row.original as never;
  const layout = useContext(ResponsiveLayoutContext);
  const pin = pinning(cell.column, before, layout);
  const idMeta =
    previewAt === cell.column.id
      ? cell.column.table.getAllLeafColumns().find((c) => c.columnDef.meta?.preview)?.columnDef.meta
      : undefined;
  const preview = idMeta?.preview
    ? {
        onPreview: () => idMeta.preview?.(record),
        isActive: idMeta.active ? idMeta.active(record) : false,
      }
    : undefined;

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
        <span className="min-w-0 truncate">{content}</span>
        {hint}
      </span>
    ) : (
      content
    ),
  );

  if (meta?.kind === "id") {
    const glance = meta.glance?.(record);
    return (
      <Table.Id
        id={withGuides(
          glance ? (
            <HoverCard>
              <HoverCardTrigger
                render={
                  <span
                    tabIndex={0}
                    className="rounded-xsmall outline-none focus-visible:outline-focused"
                  >
                    <Id>{content}</Id>
                  </span>
                }
              />
              <HoverCardContent align="start" alignOffset={0} style={{ width: 300 }}>
                {glance}
              </HoverCardContent>
            </HoverCard>
          ) : (
            content
          ),
        )}
        tone={meta.tone ?? "brand"}
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        {...(indent ? { indent } : {})}
        {...(preview ? { onPreview: preview.onPreview } : {})}
        {...(preview
          ? { isActive: preview.isActive }
          : meta.active
            ? { isActive: meta.active(record) }
            : {})}
      />
    );
  }

  if (meta?.kind === "actions") {
    const actions = meta.actions?.(record) ?? [];
    if (actions.length === 0)
      return (
        <Table.Cell
          className="max-w-none px-0"
          pinned={pin.pinned}
          offset={pin.offset}
          edge={pin.edge}
        />
      );
    return (
      <Table.Cell
        className="max-w-none px-0 text-center"
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                label={t("rowActions")}
                variant="subtle"
                className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100 data-popup-open:opacity-100"
                icon={<MoreHorizontal />}
              />
            }
          />
          <DropdownMenuContent align="end" style={{ width: 200 }}>
            {actions.map((a) => (
              <DropdownMenuItem
                key={a.label}
                onClick={a.onSelect}
                {...(a.disabled ? { disabled: true } : {})}
                {...(a.tone === "danger" ? { variant: "destructive" } : {})}
              >
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.Cell>
    );
  }

  if (preview)
    return (
      <Table.Cell
        className={cn(alignClass(meta?.align), meta?.wrap && "whitespace-normal")}
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        {...(typeof content === "string" ? { title: content } : {})}
        {...(meta?.editable ? { onKeyDown: enterMovesDown } : {})}
      >
        <span
          className="relative flex items-center"
          {...(indent ? { style: { paddingInlineStart: indent } } : {})}
        >
          <span className="min-w-0 flex-1 truncate">{body}</span>
          <span
            className={cn(
              "absolute inset-y-0 end-0 flex items-center ps-050 opacity-0 transition-opacity duration-fast ease-standard",
              "bg-surface-current group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected",
              "focus-within:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100",
              preview.isActive && "opacity-100",
            )}
          >
            <PreviewButton onPreview={preview.onPreview} isActive={preview.isActive} />
          </span>
        </span>
      </Table.Cell>
    );

  return (
    <Table.Cell
      className={cn(alignClass(meta?.align), meta?.wrap && "whitespace-normal")}
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
  /** The width of the pinned leading columns. */
  before: number;
  /** A data column is pinned to the start, so the leading columns' edge is not the table's. */
  dataPinned: boolean;
  hintAt: string | undefined;
  previewAt: string | undefined;
  columnCount: number;
  isPinnedRow: boolean;
  moreOpen: boolean;
  onMoreToggle: (id: string) => void;
  virtualIndex?: number | undefined;
  onMeasure?: ((index: number, height: number) => void) | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLTableRowElement>) => void) | undefined;
  treeTabStop: boolean;
  onTreeFocus: (id: string) => void;
};

/**
 * One row, memoized on what it shows. A thousand rows must not redraw because one checkbox changed:
 * the parent re-renders and hands each row its flags, and only the rows whose flags changed draw.
 * In tree mode the row carries the treegrid aria and takes the arrow keys; with a detail it carries
 * the chevron and the detail row after it.
 */
const BodyRow = memo(function BodyRow<TData extends RowData>({
  row,
  leading,
  isSelected,
  canSelect,
  isExpanded,
  isDetailOpen,
  columnsKey: _columnsKey,
  isActive: _isActive,
  before,
  dataPinned,
  hintAt,
  previewAt,
  columnCount,
  isPinnedRow,
  moreOpen,
  onMoreToggle,
  virtualIndex,
  onMeasure,
  onRowClick,
  onKeyDown,
  treeTabStop,
  onTreeFocus,
}: BodyRowProps<TData>) {
  const { t } = useLedgerLocale();
  const options = row.table.options.meta;
  const tree = Boolean(options?.tree);
  const detail = options?.detail;
  const drag = useRowDrag(row.id, leading.handle);
  const detailId = `${options?.view ?? "table"}-${row.id}-detail`;
  const layout = useContext(ResponsiveLayoutContext);
  const moreId = useId();
  const rowElement = useRef<HTMLTableRowElement | null>(null);
  const setRowElement = useCallback(
    (element: HTMLTableRowElement | null) => {
      rowElement.current = element;
      drag.setNodeRef?.(element);
    },
    [drag.setNodeRef],
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
    const measure = () =>
      onMeasure(
        virtualIndex,
        parts.reduce((height, part) => height + part.getBoundingClientRect().height, 0),
      );
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
  const moreLabel = t("moreFieldsFor", {
    label:
      options?.tree?.label(row.original as never) ??
      (typeof identityValue === "string" ? identityValue : row.id),
  });

  const pins = leadingPins(leading, dataPinned);
  return (
    <>
      <Table.Row
        ref={setRowElement}
        style={drag.style}
        data-row-id={row.id}
        isSelected={isSelected}
        className={cn(
          onRowClick && "cursor-pointer",
          isPinnedRow && "bg-surface-sunken",
          drag.isDragging && "bg-surface-hovered",
        )}
        {...(tree
          ? {
              "aria-level": row.depth + 1,
              ...(row.getCanExpand() ? { "aria-expanded": isExpanded } : {}),
              tabIndex: treeTabStop ? 0 : -1,
              onFocus: (event: { target: EventTarget; currentTarget: EventTarget }) => {
                if (event.target === event.currentTarget) onTreeFocus(row.id);
              },
              onKeyDown,
            }
          : {})}
        {...(onRowClick ? { onClick: () => onRowClick(row.original) } : {})}
      >
        {leading.selectable ? (
          <Table.Selection
            checked={isSelected}
            onCheckedChange={(next) => row.toggleSelected(next)}
            label={t("selectRow", { id: row.id })}
            disabled={!canSelect}
            {...pins("selectable")}
          />
        ) : null}
        {leading.tree ? (
          <Table.Disclosure
            hasChildren={row.getCanExpand()}
            expanded={isExpanded}
            onToggle={() => row.toggleExpanded()}
            label={options?.tree?.label(row.original as never) ?? row.id}
            width={leadingSizes.tree}
            {...pins("tree")}
          />
        ) : null}
        {leading.handle ? (
          <Table.Handle
            {...(drag.handle ?? {})}
            isDragging={drag.isDragging}
            label={t("reorderRow", { id: row.id })}
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
              label={isDetailOpen ? t("close") : t("open")}
              variant="subtle"
              className="size-250"
              aria-expanded={isDetailOpen}
              aria-controls={detailId}
              onClick={() => options?.toggleDetail?.(row.id)}
              icon={
                <ChevronRight
                  className={cn(
                    "transition-transform duration-fast ease-standard",
                    isDetailOpen && "rotate-90",
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
              before={before}
              hintAt={hintAt}
              previewAt={previewAt}
            />
          ))}

        {layout?.collapsed && (
          <Table.Cell
            className="max-w-none px-0 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <IconButton
              variant="subtle"
              size="small"
              label={moreLabel}
              aria-expanded={moreOpen}
              aria-controls={moreId}
              icon={<ChevronDown className={moreOpen ? "rotate-180" : undefined} />}
              onClick={() => onMoreToggle(row.id)}
            />
          </Table.Cell>
        )}
      </Table.Row>
      {layout?.collapsed && moreOpen && (
        <Table.Detail id={moreId} colSpan={columnCount}>
          <Stack space="space.150">
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
          </Stack>
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

/** The arrow keys on a treegrid: up and down move between rows, right opens or steps in, left closes or steps out. */
function treeKeys<TData extends RowData>(
  table: DataTableInstance<TData>,
  direction: "ltr" | "rtl",
) {
  return (event: KeyboardEvent<HTMLTableRowElement>) => {
    const tr = event.currentTarget;
    const id = tr.dataset["rowId"];
    if (!id || event.target !== tr) return;
    const row = table.getRow(id);
    const siblings = [
      ...(tr.parentElement?.querySelectorAll<HTMLTableRowElement>("tr[data-row-id]") ?? []),
    ];
    const focusAt = (el: HTMLTableRowElement | undefined) => {
      if (!el) return;
      el.focus();
    };
    const at = siblings.indexOf(tr);
    switch (
      direction === "rtl" && event.key === "ArrowLeft"
        ? "ArrowRight"
        : direction === "rtl" && event.key === "ArrowRight"
          ? "ArrowLeft"
          : event.key
    ) {
      case "ArrowDown":
        focusAt(siblings[at + 1]);
        break;
      case "ArrowUp":
        focusAt(siblings[at - 1]);
        break;
      case "ArrowRight":
        if (row.getCanExpand() && !row.getIsExpanded()) row.toggleExpanded(true);
        else focusAt(siblings[at + 1]);
        break;
      case "ArrowLeft":
        if (row.getIsExpanded()) row.toggleExpanded(false);
        else {
          const parent = row.getParentRow();
          if (parent) focusAt(siblings.find((el) => el.dataset["rowId"] === parent.id));
        }
        break;
      case "Home":
        focusAt(siblings[0]);
        break;
      case "End":
        focusAt(siblings[siblings.length - 1]);
        break;
      default:
        return;
    }
    event.preventDefault();
  };
}

/** The empty state. With no records at all it stands alone on its dashed frame; under the header, the table's rules bound it, so it has no frame of its own. */
function EmptyState({
  frame,
  illustration,
  title,
  description,
  action,
  secondary,
  className,
}: {
  frame: "dashed" | "none";
  className?: string | undefined;
  illustration: EmptyIllustrationKind | false;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <Empty frame={frame} className={className}>
      {illustration ? (
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

function DataTableRoot<TData extends RowData>({
  table,
  toolbar,
  state = "ready",
  empty,
  error,
  onRowClick,
  maxHeight,
  fill,
  responsive = false,
  className,
}: DataTableProps<TData>) {
  const { t, direction } = useLedgerLocale();
  const options = table.options.meta;
  const selectable = Boolean(table.options.enableRowSelection);
  const leading: Leading = {
    selectable,
    tree: Boolean(options?.tree) && !options?.tree?.guides,
    handle: Boolean(options?.reorderRows),
    detail: Boolean(options?.detail) && options?.detailColumn !== false,
  };
  // The page size is the reader's while the table pages; the option is the author's default.
  const pageSize = options?.pageSize === undefined ? undefined : table.state.pagination.pageSize;
  const label = options?.label;
  const tree = options?.tree;
  const groupBy = options?.groupBy;
  const headerGroups = table.getHeaderGroups();
  const requestedColumns = table.getVisibleLeafColumns();
  const root = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [moreOpenIds, setMoreOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  const [focusedTreeRow, setFocusedTreeRow] = useState<string | null>(null);
  const toggleMore = useCallback((id: string) => {
    setMoreOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || !responsive) return;
    const observer = new ResizeObserver(() => setContainerWidth(element.clientWidth));
    observer.observe(element);
    setContainerWidth(element.clientWidth);
    return () => observer.disconnect();
  }, [responsive]);
  const layout: ResponsiveLayout | null =
    responsive && containerWidth > 0
      ? {
          ...fitColumns(
            requestedColumns.map((column) => ({
              id: column.id,
              width:
                column.columnDef.size !== undefined ||
                table.state.columnSizing[column.id] !== undefined ||
                column.getIsPinned()
                  ? column.getSize()
                  : (column.columnDef.minSize ?? 120),
              priority: column.columnDef.meta?.priority,
              action: column.columnDef.meta?.kind === "actions",
            })),
            containerWidth,
            leadingWidth(leading),
          ),
          columns: [
            ...table.getStartVisibleLeafColumns(),
            ...table.getCenterVisibleLeafColumns(),
            ...table.getEndVisibleLeafColumns(),
          ].map((column) => ({ id: column.id, pin: column.getIsPinned() })),
        }
      : null;
  const visibleColumns = requestedColumns.filter((column) => !layout || layout.ids.has(column.id));
  const columnCount =
    visibleColumns.length + leadingCount(leading) + Number(layout?.collapsed ?? false);
  const columnsKey = [
    ...visibleColumns.map((c) => c.id),
    ...table.state.columnPinning.start,
    "|",
    ...table.state.columnPinning.end,
    JSON.stringify(table.state.columnSizing),
    layout ? [...layout.widths].filter(([id]) => layout.ids.has(id)).join("|") : "",
  ].join(" ");
  const idMeta = table.getAllLeafColumns().find((c) => c.columnDef.meta?.preview)?.columnDef.meta;
  const active = idMeta?.active;
  const previewAt = idMeta?.preview ? previewColumn(visibleColumns) : undefined;
  const hintAt = tree ? previewColumn(visibleColumns) : undefined;
  const fixed = responsive || options?.layout === "fixed";
  // The leading columns are always pinned, so every start offset begins after them.
  const before = leadingWidth(leading);
  const dataPinned = visibleColumns.some((column) => column.getIsPinned() === "start");
  const pins = leadingPins(leading, dataPinned);
  const minWidth = layout
    ? undefined
    : fixed
      ? visibleColumns.reduce((sum, c) => {
          const sized =
            c.columnDef.size !== undefined ||
            table.state.columnSizing[c.id] !== undefined ||
            c.getIsPinned();
          return sum + (sized ? c.getSize() : (c.columnDef.minSize ?? 120));
        }, leadingWidth(leading))
      : undefined;
  const onKeyDown = tree ? treeKeys(table, direction) : undefined;

  const allRows = table.getRowModel().rows;
  const pinRows = Boolean(options?.pinRows);
  const topRows = pinRows ? table.getTopRows() : [];
  const bottomRows = pinRows ? table.getBottomRows() : [];
  const rows = pinRows ? table.getCenterRows() : allRows;

  // Only visible records mount. BodyRow measures each record together with its disclosed fields;
  // the density estimate covers records that have not been measured yet.
  const virtual = options?.virtualize && !groupBy ? options.virtualize : undefined;
  const frame = useRef<HTMLDivElement>(null);
  // The register that is the page: its root takes the rest of the window from its own top edge,
  // and the toolbar, the frame and the pagination share that height as a column.
  const top = useFillWindow(root, Boolean(fill));
  const rootProps = {
    ref: root,
    ...(fill ? { "data-fill": "" } : {}),
    className: cn(fill && "fill-window", className) || undefined,
    style: fill ? ({ "--fill-top": `${top}px` } as CSSProperties) : undefined,
  };
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => frame.current,
    estimateSize: () => virtual?.estimate ?? (options?.density === "compact" ? 36 : 40),
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: virtual?.overscan ?? 8,
    initialRect: { width: 0, height: maxHeight ?? 480 },
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
  const treeTabStop = renderedRows.some((row) => row.id === focusedTreeRow)
    ? focusedTreeRow
    : renderedRows[0]?.id;
  const showRows = state === "ready" && allRows.length > 0;
  const isEmpty = state === "empty" || (state === "ready" && allRows.length === 0);
  // A search or a column filter is what emptied the table, so the way out is to clear it.
  const narrowed =
    table.state.columnFilters.length > 0 || String(table.state.globalFilter ?? "") !== "";
  const clearFilters = () => {
    table.setColumnFilters([]);
    table.setGlobalFilter("");
  };
  const footerGroup = visibleColumns.some((c) => c.columnDef.footer !== undefined)
    ? table.getFooterGroups().find((g) => g.headers.every((h) => h.subHeaders.length === 0))
    : undefined;

  // No records at all: nothing to search, filter, sort or page, so the register is only its empty
  // state, on its own frame, and the action in it creates the first record.
  if (isEmpty && !narrowed)
    return (
      <div {...rootProps}>
        <EmptyState
          className={fill ? "flex-1" : undefined}
          frame="dashed"
          illustration={empty?.illustration ?? "records"}
          title={empty?.title ?? t("nothingHere")}
          description={empty?.description}
          action={empty?.action}
          secondary={empty?.secondary}
        />
      </div>
    );

  const drawRow = (row: Row<F, TData>, isPinnedRow = false, virtualIndex?: number) => (
    <BodyRow
      key={row.id}
      row={row}
      leading={leading}
      isSelected={row.getIsSelected()}
      canSelect={row.getCanSelect()}
      isActive={active ? active(row.original as never) : false}
      isExpanded={row.getIsExpanded()}
      isDetailOpen={Boolean(options?.detailOpen?.(row.id))}
      columnsKey={columnsKey}
      before={before}
      dataPinned={dataPinned}
      hintAt={hintAt}
      previewAt={previewAt}
      columnCount={columnCount}
      isPinnedRow={isPinnedRow}
      moreOpen={moreOpenIds.has(row.id)}
      onMoreToggle={toggleMore}
      virtualIndex={virtualIndex}
      onMeasure={virtualIndex === undefined ? undefined : measureRow}
      onRowClick={onRowClick}
      onKeyDown={onKeyDown}
      treeTabStop={row.id === treeTabStop}
      onTreeFocus={setFocusedTreeRow}
    />
  );

  const narrowHeader = (key: "tree" | "handle" | "detail") => (
    <Table.Header key={key} className="px-0" width={leadingSizes[key]} {...pins(key)}>
      <span className="sr-only">
        {key === "detail" ? t("details") : key === "tree" ? t("parts") : t("reorder")}
      </span>
    </Table.Header>
  );

  const states = (
    <>
      {state === "loading"
        ? Array.from({ length: pageSize ?? 5 }, (_, i) => (
            <Table.Row key={i} isStatic>
              <Table.Cell colSpan={columnCount} className="max-w-none">
                <Skeleton lines={1} />
              </Table.Cell>
            </Table.Row>
          ))
        : null}
      {state === "error" ? (
        <Table.Row isStatic>
          <Table.Cell
            colSpan={columnCount}
            className="h-auto max-w-none whitespace-normal px-150 py-150"
          >
            <Alert tone="danger" role="alert">
              <AlertDescription>{error ?? t("rowsError")}</AlertDescription>
            </Alert>
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
              illustration={empty?.filtered?.illustration ?? "search"}
              title={empty?.filtered?.title ?? t("noMatches")}
              description={empty?.filtered?.description ?? t("noMatchesHint")}
              action={
                empty?.filtered?.action === undefined ? (
                  <Button onClick={clearFilters}>{t("clearFilters")}</Button>
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

  return (
    <div {...rootProps} data-responsive={responsive || undefined}>
      {toolbar ? <div className="shrink-0 pb-200">{toolbar}</div> : null}
      <ResponsiveLayoutContext.Provider value={layout}>
        <DragContext table={table}>
          <Table
            frameRef={frame}
            density={options?.density ?? "default"}
            label={label}
            {...(fill ? { fill } : maxHeight === undefined ? {} : { maxHeight })}
            {...(tree ? { role: "treegrid" } : options?.editable ? { role: "grid" } : {})}
            className={cn("border-b border-default", fixed && "table-fixed")}
            style={minWidth === undefined ? undefined : { minWidth }}
          >
            <thead>
              <ColumnSortable table={table}>
                {headerGroups.map((group, i) => (
                  <tr key={group.id}>
                    {i === headerGroups.length - 1 ? (
                      <>
                        {leading.selectable ? (
                          <Table.Selection
                            header
                            checked={table.getIsAllPageRowsSelected()}
                            indeterminate={
                              !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()
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
                        <HeaderCell key={header.id} header={header} table={table} before={before} />
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
                  open={group.getIsExpanded()}
                  onToggle={() => group.toggleExpanded()}
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
                    {topRows.map((row) => drawRow(row, true))}
                    {virtual ? (
                      <>
                        {paddingTop > 0 ? (
                          <tr aria-hidden style={{ height: paddingTop }}>
                            <td colSpan={columnCount} />
                          </tr>
                        ) : null}
                        {items.map((item) => {
                          const row = rows[item.index];
                          return row ? drawRow(row, false, item.index) : null;
                        })}
                        {paddingBottom > 0 ? (
                          <tr aria-hidden style={{ height: paddingBottom }}>
                            <td colSpan={columnCount} />
                          </tr>
                        ) : null}
                      </>
                    ) : (
                      rows.map((row) => drawRow(row))
                    )}
                    {bottomRows.map((row) => drawRow(row, true))}
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
                        className={alignClass(header.column.columnDef.meta?.align)}
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
      </ResponsiveLayoutContext.Provider>
      {pageSize !== undefined && !groupBy && state !== "loading" && !isEmpty ? (
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
  );
}

export const DataTable = Object.assign(DataTableRoot, {
  GroupBy,
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
