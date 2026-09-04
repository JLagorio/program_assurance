import {
  flexRender,
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { memo, type CSSProperties, type ReactNode } from "react";

import { Alert } from "../../components/alert";
import { IconButton } from "../../components/button";
import { DropdownMenu } from "../../components/dropdown-menu";
import { HoverCard } from "../../components/hover-card";
import { Id } from "../../components/id";
import { Pagination } from "../../components/pagination";
import { Skeleton } from "../../components/skeleton";
import { Table } from "../../components/table";
import { cn } from "../../lib/cn";
import { Empty } from "../empty";
import type { DataTableFeatures } from "./features";
import { Columns, HeaderMenu } from "./columns-menu";
import { Filter, Presets, Search } from "./filter";
import { ColumnReorder, useColumnDrag } from "./reorder";
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

/** `Table.Selection` is `w-400`. */
const SELECTION_WIDTH = 32;

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

function HeaderCell<TData extends RowData>({
  header,
  table,
  selectionWidth,
}: {
  header: Header<F, TData, unknown>;
  table: DataTableInstance<TData>;
  selectionWidth: number;
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
    ? pinning(column, selectionWidth)
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
      {...(canSort && leaf ? { sort: sorted || false, onSort: () => column.toggleSorting() } : {})}
      {...(canResize
        ? {
            resize: {
              onResizeStart: header.getResizeHandler(),
              onResizeReset: () => column.resetSize(),
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
  selectionWidth,
}: {
  cell: Cell<F, TData, unknown>;
  row: Row<F, TData>;
  /** The pinned selection column's width, added to every start offset. */
  selectionWidth: number;
}) {
  const meta = cell.column.columnDef.meta;
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  const record = row.original as never;
  const pin = pinning(cell.column, selectionWidth);

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
        {...(meta.preview ? { onPreview: () => meta.preview?.(record) } : {})}
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
              label="Row actions"
              variant="subtle"
              className="invisible focus-visible:visible group-hover/row:visible data-[state=open]:visible"
            >
              <MoreHorizontal className="size-icon-small" />
            </IconButton>
          }
        >
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.label}
              onSelect={a.onSelect}
              {...(a.disabled ? { disabled: true } : {})}
            >
              <span className={a.tone === "danger" ? "text-danger" : undefined}>{a.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu>
      </Table.Cell>
    );
  }

  return (
    <Table.Cell
      className={cn(alignClass(meta?.align), meta?.wrap && "whitespace-normal")}
      pinned={pin.pinned}
      offset={pin.offset}
      edge={pin.edge}
    >
      {content}
    </Table.Cell>
  );
}

type BodyRowProps<TData extends RowData> = {
  row: Row<F, TData>;
  selectable: boolean;
  isSelected: boolean;
  canSelect: boolean;
  /** The id column's active flag, read by the parent so the memo sees it change. */
  isActive: boolean;
  /** The visible columns in order; a change re-renders every row. */
  columnsKey: string;
  selectionWidth: number;
  onRowClick?: ((row: TData) => void) | undefined;
};

/**
 * One row, memoized on what it shows. A thousand rows must not redraw because one checkbox changed:
 * the parent re-renders and hands each row its flags, and only the rows whose flags changed draw.
 */
const BodyRow = memo(function BodyRow<TData extends RowData>({
  row,
  selectable,
  isSelected,
  canSelect,
  columnsKey: _columnsKey,
  isActive: _isActive,
  selectionWidth,
  onRowClick,
}: BodyRowProps<TData>) {
  return (
    <Table.Row
      isSelected={isSelected}
      className={onRowClick ? "cursor-pointer" : undefined}
      {...(onRowClick ? { onClick: () => onRowClick(row.original) } : {})}
    >
      {selectable ? (
        <Table.Selection
          checked={isSelected}
          onCheckedChange={(next) => row.toggleSelected(next)}
          label={`Select row ${row.id}`}
          disabled={!canSelect}
          pinned={selectionWidth > 0 ? "start" : false}
        />
      ) : null}
      {row.getVisibleCells().map((cell) => (
        <BodyCell key={cell.id} cell={cell} row={row} selectionWidth={selectionWidth} />
      ))}
    </Table.Row>
  );
}) as <TData extends RowData>(props: BodyRowProps<TData>) => ReactNode;

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
  const selectable = Boolean(table.options.enableRowSelection);
  const pageSize = table.options.meta?.pageSize;
  const label = table.options.meta?.label;
  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  const columnCount = visibleColumns.length + (selectable ? 1 : 0);
  const columnsKey = [
    ...visibleColumns.map((c) => c.id),
    ...table.state.columnPinning.start,
    "|",
    ...table.state.columnPinning.end,
    JSON.stringify(table.state.columnSizing),
  ].join("\u0000");
  const options = table.options.meta;
  const fixed = options?.layout === "fixed";
  // The selection column pins with the start-pinned columns, so their offsets begin after it.
  const selectionWidth =
    selectable && table.state.columnPinning.start.length > 0 ? SELECTION_WIDTH : 0;
  // In the fixed layout a sized column is exactly its width and the unsized ones share the slack; the
  // table is at least as wide as its sized columns plus a minimum for each unsized one, and scrolls past the frame.
  const minWidth = fixed
    ? visibleColumns.reduce(
        (sum, c) => {
          const sized =
            c.columnDef.size !== undefined ||
            table.state.columnSizing[c.id] !== undefined ||
            c.getIsPinned();
          return sum + (sized ? c.getSize() : (c.columnDef.minSize ?? 120));
        },
        selectable ? 32 : 0,
      )
    : undefined;
  const active = visibleColumns.find((c) => c.columnDef.meta?.kind === "id")?.columnDef.meta
    ?.active;
  const showRows = state === "ready" && rows.length > 0;
  const isEmpty = state === "empty" || (state === "ready" && rows.length === 0);

  return (
    <div className={cn("overflow-hidden rounded-large border border-default", className)}>
      {toolbar ? <div className="border-b border-default px-150 py-100">{toolbar}</div> : null}
      <ColumnReorder table={table}>
        <Table
          {...(label ? { "aria-label": label } : {})}
          {...(maxHeight === undefined ? {} : { maxHeight })}
          className={fixed ? "table-fixed" : undefined}
          style={minWidth === undefined ? undefined : { minWidth }}
        >
          <thead>
            {headerGroups.map((group, i) => (
              <tr key={group.id}>
                {selectable ? (
                  i === headerGroups.length - 1 ? (
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
                      label="Select all rows on this page"
                      pinned={selectionWidth > 0 ? "start" : false}
                    />
                  ) : (
                    <Table.Header className="border-b-0" />
                  )
                ) : null}
                {group.headers.map((header) => (
                  <HeaderCell
                    key={header.id}
                    header={header}
                    table={table}
                    selectionWidth={selectionWidth}
                  />
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
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
                  <Alert tone="danger">{error ?? "The rows could not be loaded."}</Alert>
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
                    title={empty?.title ?? "Nothing here"}
                    description={empty?.description}
                    action={empty?.action}
                  />
                </Table.Cell>
              </Table.Row>
            ) : null}
            {showRows
              ? rows.map((row) => (
                  <BodyRow
                    key={row.id}
                    row={row}
                    selectable={selectable}
                    isSelected={row.getIsSelected()}
                    canSelect={row.getCanSelect()}
                    isActive={active ? active(row.original as never) : false}
                    columnsKey={columnsKey}
                    selectionWidth={selectionWidth}
                    onRowClick={onRowClick}
                  />
                ))
              : null}
          </tbody>
        </Table>
      </ColumnReorder>
      {pageSize !== undefined && state !== "loading" ? (
        <Pagination
          page={table.state.pagination.pageIndex + 1}
          pageCount={Math.max(1, table.getPageCount())}
          onPageChange={(p) => table.setPageIndex(p - 1)}
          total={table.getRowCount()}
          pageSize={pageSize}
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
});
