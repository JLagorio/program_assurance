import { useLedgerLocale } from "../../lib/locale";
import {
  flexRender,
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { Alert } from "../../components/alert";
import { IconButton } from "../../components/button";
import { DropdownMenu } from "../../components/dropdown-menu";
import { HoverCard } from "../../components/hover-card";
import { Id } from "../../components/id";
import { Pagination } from "../../components/pagination";
import { Skeleton } from "../../components/skeleton";
import { PreviewButton, Table } from "../../components/table";
import { cn } from "../../lib/cn";
import { Empty } from "../empty";
import type { DataTableFeatures } from "./features";
import { Columns, HeaderMenu, Settings } from "./columns-menu";
import { Filter, Presets, Search } from "./filter";
import { ColumnSortable, DragContext, RowSortable, useColumnDrag, useRowDrag } from "./reorder";
import { SelectionBar } from "./selection-bar";
import type { DataTableInstance } from "./use-data-table";

/*
 * The renderer. It takes the table from useDataTable and draws it with the Table parts: header
 * groups, rows and cells, the toolbar slot above, Pagination below when the table pages, the
 * states inside the frame so the header never moves. Every feature is one option on the hook and
 * one part here; nothing is a second table.
 */

export type DataTableState = "ready" | "loading" | "empty" | "error";

export type DataTableProps<TData extends RowData> = {
  table: DataTableInstance<TData>;
  /** Search, filters and actions. Sits inside the frame, above the header. */
  toolbar?: ReactNode;
  state?: DataTableState | undefined;
  /** What the empty state says. */
  empty?: { title: string; description?: string | undefined; action?: ReactNode } | undefined;
  /** What the error state says. */
  error?: ReactNode;
  /** The row opens something: the record, a peek. */
  onRowClick?: ((row: TData) => void) | undefined;
  /** The table scrolls inside itself past this height; the header stays. */
  maxHeight?: number | undefined;
  className?: string | undefined;
};

type F = DataTableFeatures;

/** `Table.Selection` and `Table.Handle` are `w-400`. */
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

/** Where a column is pinned, how far from that edge, and whether it is the one that touches the middle. */
const pinning = <TData extends RowData>(column: Column<F, TData, unknown>, before = 0) => {
  const pinned = column.getIsPinned();
  if (!pinned) return { pinned: false as const, offset: undefined, edge: false };
  return {
    pinned,
    offset: pinned === "start" ? before + column.getStart("start") : column.getAfter("end"),
    edge: pinned === "start" ? column.getIsLastColumn("start") : column.getIsFirstColumn("end"),
  };
};

/**
 * The leading columns the renderer adds: selection, the drag handle, the detail chevron. They are
 * always the first columns and always pinned, whatever the reader pins, so the checkbox never
 * scrolls away or lands after a pinned column.
 */
type Leading = { selectable: boolean; handle: boolean; detail: boolean };

const leadingCount = (l: Leading) => [l.selectable, l.handle, l.detail].filter(Boolean).length;
const leadingWidth = (l: Leading) => leadingCount(l) * NARROW;

/** Each leading column's offset from the start edge, and whether it is the last of them. */
const leadingPins = (l: Leading, dataPinned: boolean) => {
  const order = (["selectable", "handle", "detail"] as const).filter((k) => l[k]);
  const last = order[order.length - 1];
  return (key: (typeof order)[number]) => ({
    pinned: "start" as const,
    offset: order.indexOf(key) * NARROW,
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
    ? pinning(column, before)
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
      colSpan={header.colSpan}
      className={cn(
        alignClass(meta?.align),
        header.isPlaceholder && "border-b-0",
        !leaf && "text-center",
        drag.isDragging && "bg-surface-hovered",
      )}
      style={{ ...sizeStyle(header as Header<F, RowData, unknown>, sized), ...drag.style }}
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

function BodyCell<TData extends RowData>({
  cell,
  row,
  before,
  treeColumn,
  previewAt,
}: {
  cell: Cell<F, TData, unknown>;
  row: Row<F, TData>;
  before: number;
  /** The column that carries the tree cell, in tree mode. */
  treeColumn: string | undefined;
  /** The column whose cell carries the preview eye, when an id column has `preview`. */
  previewAt: string | undefined;
}) {
  const { t } = useLedgerLocale();

  const meta = cell.column.columnDef.meta;
  const options = cell.column.table.options.meta;
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  const record = row.original as never;
  const pin = pinning(cell.column, before);
  const idMeta =
    previewAt === cell.column.id
      ? cell.column.table.getAllLeafColumns().find((c) => c.columnDef.meta?.kind === "id")
          ?.columnDef.meta
      : undefined;
  const preview = idMeta?.preview
    ? {
        onPreview: () => idMeta.preview?.(record),
        isActive: idMeta.active ? idMeta.active(record) : false,
      }
    : undefined;

  if (options?.tree && cell.column.id === treeColumn) {
    const folded = row.getCanExpand() && !row.getIsExpanded();
    return (
      <Table.Tree
        depth={row.depth}
        hasChildren={row.getCanExpand()}
        expanded={row.getIsExpanded()}
        onToggle={() => row.toggleExpanded()}
        label={options.tree.label(record)}
        hint={folded ? options.tree.hint?.(record, row.subRows.length) : null}
      >
        {content}
      </Table.Tree>
    );
  }

  if (meta?.kind === "id") {
    const glance = meta.glance?.(record);
    return (
      <Table.Id
        id={
          glance ? (
            <HoverCard content={glance} width={300}>
              <span
                tabIndex={0}
                className="rounded-xsmall outline-none focus-visible:outline-focused"
              >
                <Id>{content}</Id>
              </span>
            </HoverCard>
          ) : (
            content
          )
        }
        tone={meta.tone ?? "brand"}
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        {...(preview ? { onPreview: preview.onPreview } : {})}
        {...(meta.active ? { isActive: meta.active(record) } : {})}
      />
    );
  }

  if (meta?.kind === "actions") {
    const actions = meta.actions?.(record) ?? [];
    if (actions.length === 0)
      return (
        <Table.Cell
          className="max-w-none pe-100"
          pinned={pin.pinned}
          offset={pin.offset}
          edge={pin.edge}
        />
      );
    return (
      <Table.Cell
        className="max-w-none pe-100 text-right"
        pinned={pin.pinned}
        offset={pin.offset}
        edge={pin.edge}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu
          align="end"
          trigger={
            <IconButton
              label={t("rowActions")}
              variant="subtle"
              className="invisible focus-visible:visible group-hover/row:visible data-[state=open]:visible"
              icon={<MoreHorizontal />}
            />
          }
        >
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.label}
              onSelect={a.onSelect}
              {...(a.disabled ? { disabled: true } : {})}
              {...(a.tone === "danger" ? { tone: "danger" } : {})}
            >
              {a.label}
            </DropdownMenu.Item>
          ))}
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
        <span className="flex items-center gap-075">
          <span className="min-w-0 flex-1 truncate">{content}</span>
          <PreviewButton onPreview={preview.onPreview} isActive={preview.isActive} />
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
      {content}
    </Table.Cell>
  );
}

/**
 * The column keyboard model of an editable table: Enter commits (the Editable does that) and then
 * moves to the same column in the next row, so a reader fills a column the way they would in a
 * sheet. Tab keeps its meaning and moves across.
 */
function enterMovesDown(event: KeyboardEvent<HTMLTableCellElement>) {
  if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) return;
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
  /** Expanded, in tree mode or with a detail; the parent reads it so the memo sees it change. */
  isExpanded: boolean;
  /** The visible columns in order; a change re-renders every row. */
  columnsKey: string;
  /** The width of the pinned leading columns. */
  before: number;
  /** A data column is pinned to the start, so the leading columns' edge is not the table's. */
  dataPinned: boolean;
  treeColumn: string | undefined;
  previewAt: string | undefined;
  columnCount: number;
  isPinnedRow: boolean;
  onRowClick?: ((row: TData) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLTableRowElement>) => void) | undefined;
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
  columnsKey: _columnsKey,
  isActive: _isActive,
  before,
  dataPinned,
  treeColumn,
  previewAt,
  columnCount,
  isPinnedRow,
  onRowClick,
  onKeyDown,
}: BodyRowProps<TData>) {
  const { t } = useLedgerLocale();
  const options = row.table.options.meta;
  const tree = Boolean(options?.tree);
  const detail = options?.detail;
  const drag = useRowDrag(row.id, leading.handle);
  const detailId = `${options?.view ?? "table"}-${row.id}-detail`;
  const pins = leadingPins(leading, dataPinned);
  return (
    <>
      <Table.Row
        ref={drag.setNodeRef}
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
              tabIndex: -1,
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
            className="w-400 max-w-none pe-0"
            onClick={(e) => e.stopPropagation()}
            {...pins("detail")}
          >
            <IconButton
              label={isExpanded ? t("close") : t("open")}
              variant="subtle"
              className="size-250"
              aria-expanded={isExpanded}
              aria-controls={detailId}
              onClick={() => row.toggleExpanded()}
              icon={
                <ChevronRight
                  className={cn(
                    "transition-transform duration-fast ease-standard",
                    isExpanded && "rotate-90",
                  )}
                />
              }
            />
          </Table.Cell>
        ) : null}
        {row.getVisibleCells().map((cell) => (
          <BodyCell
            key={cell.id}
            cell={cell}
            row={row}
            before={before}
            treeColumn={treeColumn}
            previewAt={previewAt}
          />
        ))}
      </Table.Row>
      {detail && isExpanded ? (
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
      el.tabIndex = 0;
      tr.tabIndex = -1;
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

/** The first row is the treegrid's tab stop; whichever row is focused holds it after that. */
const claimTabStop = (event: { target: EventTarget }) => {
  const el = event.target as HTMLElement;
  if (el.tagName === "TR") el.tabIndex = 0;
};

function DataTableRoot<TData extends RowData>({
  table,
  toolbar,
  state = "ready",
  empty,
  error,
  onRowClick,
  maxHeight,
  className,
}: DataTableProps<TData>) {
  const { t, direction } = useLedgerLocale();
  const options = table.options.meta;
  const selectable = Boolean(table.options.enableRowSelection);
  const leading: Leading = {
    selectable,
    handle: Boolean(options?.reorderRows),
    detail: Boolean(options?.detail),
  };
  const pageSize = options?.pageSize;
  const label = options?.label;
  const tree = options?.tree;
  const groupBy = options?.groupBy;
  const headerGroups = table.getHeaderGroups();
  const visibleColumns = table.getVisibleLeafColumns();
  const columnCount = visibleColumns.length + leadingCount(leading);
  const columnsKey = [
    ...visibleColumns.map((c) => c.id),
    ...table.state.columnPinning.start,
    "|",
    ...table.state.columnPinning.end,
    JSON.stringify(table.state.columnSizing),
  ].join(" ");
  const idMeta = table.getAllLeafColumns().find((c) => c.columnDef.meta?.kind === "id")
    ?.columnDef.meta;
  const active = idMeta?.active;
  const previewAt = idMeta?.preview ? previewColumn(visibleColumns) : undefined;
  const fixed = options?.layout === "fixed";
  // The leading columns are always pinned, so every start offset begins after them.
  const before = leadingWidth(leading);
  const dataPinned = table.state.columnPinning.start.length > 0;
  const pins = leadingPins(leading, dataPinned);
  const minWidth = fixed
    ? visibleColumns.reduce((sum, c) => {
        const sized =
          c.columnDef.size !== undefined ||
          table.state.columnSizing[c.id] !== undefined ||
          c.getIsPinned();
        return sum + (sized ? c.getSize() : (c.columnDef.minSize ?? 120));
      }, leadingWidth(leading))
    : undefined;
  const treeColumn = tree
    ? (tree.column ??
      visibleColumns.find(
        (c) => c.columnDef.meta?.kind !== "id" && c.columnDef.meta?.kind !== "actions",
      )?.id)
    : undefined;
  const onKeyDown = tree ? treeKeys(table, direction) : undefined;

  const allRows = table.getRowModel().rows;
  const pinRows = Boolean(options?.pinRows);
  const topRows = pinRows ? table.getTopRows() : [];
  const bottomRows = pinRows ? table.getBottomRows() : [];
  const rows = pinRows ? table.getCenterRows() : allRows;

  // Only the rows in view are drawn; a spacer row above and below keeps the scroll height honest.
  // Rows are dimension.row tall, so the estimate is the table's density and nothing measures.
  const virtual = options?.virtualize && !groupBy ? options.virtualize : undefined;
  const frame = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => frame.current,
    estimateSize: () => virtual?.estimate ?? (options?.density === "compact" ? 36 : 40),
    overscan: virtual?.overscan ?? 8,
    initialRect: { width: 0, height: maxHeight ?? 480 },
  });
  const items = virtual ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtual && items.length ? (items[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtual && items.length ? virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0) : 0;
  const groups = groupBy ? allRows.filter((r) => r.getIsGrouped() && r.depth === 0) : [];
  const showRows = state === "ready" && allRows.length > 0;
  const isEmpty = state === "empty" || (state === "ready" && allRows.length === 0);
  const footerGroup = visibleColumns.some((c) => c.columnDef.footer !== undefined)
    ? table.getFooterGroups().find((g) => g.headers.every((h) => h.subHeaders.length === 0))
    : undefined;

  const drawRow = (row: Row<F, TData>, isPinnedRow = false) => (
    <BodyRow
      key={row.id}
      row={row}
      leading={leading}
      isSelected={row.getIsSelected()}
      canSelect={row.getCanSelect()}
      isActive={active ? active(row.original as never) : false}
      isExpanded={row.getIsExpanded()}
      columnsKey={columnsKey}
      before={before}
      dataPinned={dataPinned}
      treeColumn={treeColumn}
      previewAt={previewAt}
      columnCount={columnCount}
      isPinnedRow={isPinnedRow}
      onRowClick={onRowClick}
      onKeyDown={onKeyDown}
    />
  );

  const narrowHeader = (key: "handle" | "detail") => (
    <Table.Header key={key} className="w-400 pe-0" {...pins(key)}>
      <span className="sr-only">{key === "detail" ? t("details") : t("reorder")}</span>
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
            <Alert tone="danger">{error ?? t("rowsError")}</Alert>
          </Table.Cell>
        </Table.Row>
      ) : null}
      {isEmpty ? (
        <Table.Row isStatic>
          <Table.Cell
            colSpan={columnCount}
            className="h-auto max-w-none whitespace-normal px-150 py-150"
          >
            <Empty
              title={empty?.title ?? t("nothingHere")}
              description={empty?.description}
              action={empty?.action}
            />
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );

  return (
    <div className={cn("overflow-hidden rounded-large border border-default", className)}>
      {toolbar ? <div className="border-b border-default px-150 py-100">{toolbar}</div> : null}
      <DragContext table={table}>
        <Table
          frameRef={frame}
          density={options?.density ?? "default"}
          label={label}
          {...(maxHeight === undefined ? {} : { maxHeight })}
          {...(tree ? { role: "treegrid" } : options?.editable ? { role: "grid" } : {})}
          className={fixed ? "table-fixed" : undefined}
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
                          checked={
                            table.getIsAllPageRowsSelected()
                              ? true
                              : table.getIsSomePageRowsSelected()
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(next) => table.toggleAllPageRowsSelected(next)}
                          label={t("selectPage")}
                          {...pins("selectable")}
                        />
                      ) : null}
                      {leading.handle ? narrowHeader("handle") : null}
                      {leading.detail ? narrowHeader("detail") : null}
                    </>
                  ) : (
                    Array.from({ length: leadingCount(leading) }, (_, j) => (
                      <Table.Header key={j} className="border-b-0" aria-hidden />
                    ))
                  )}
                  {group.headers.map((header) => (
                    <HeaderCell key={header.id} header={header} table={table} before={before} />
                  ))}
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
            <tbody {...(tree ? { onFocus: claimTabStop } : {})}>
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
                        return row ? drawRow(row) : null;
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
                {footerGroup.headers.map((header) => (
                  <Table.Cell
                    key={header.id}
                    className={alignClass(header.column.columnDef.meta?.align)}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder || header.column.columnDef.footer === undefined
                      ? null
                      : flexRender(header.column.columnDef.footer, header.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            </tfoot>
          ) : null}
        </Table>
      </DragContext>
      {pageSize !== undefined && !groupBy && state !== "loading" ? (
        <Pagination
          page={table.state.pagination.pageIndex + 1}
          pageCount={Math.max(1, table.getPageCount())}
          onPageChange={(p) => table.setPageIndex(p - 1)}
          total={table.getRowCount()}
          pageSize={pageSize}
          label={label ? t("paginationLabel", { label }) : undefined}
          className="border-t border-default px-150 py-100"
        />
      ) : null}
    </div>
  );
}

export const DataTable = Object.assign(DataTableRoot, {
  SelectionBar,
  Filter,
  Search,
  Presets,
  Columns,
  Settings,
});
