import {
  createTableHook,
  type ColumnDef,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";

import type { ReactNode } from "react";

import { dataTableFeatures, type DataTableFeatures } from "./features";
import { useViewStore } from "./view-store";

/*
 * One hook for every data table. `createTableHook` binds the feature set once, so a route sees the
 * kit's options and never TanStack's feature plumbing. The state's owner stays visible at the call
 * site: pass `sorting`/`onSortingChange` (or any other slice) to own it in the URL or a store, or
 * `initialState` and let the table keep it.
 */

const hook = createTableHook({
  features: dataTableFeatures,
  enableMultiSort: false,
  enableSortingRemoval: false,
  columnResizeMode: "onEnd",
});

export const { useTableContext, useCellContext, useHeaderContext } = hook;

/** One column of a list whose value types differ, typed as TanStack types its own `columns()` helper. */
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

type TanStackOptions<TData extends RowData> = Omit<
  TableOptions<DataTableFeatures, TData>,
  "features" | "columns" | "data" | "enableRowSelection" | "manualPagination" | "meta"
>;

export type DataTableOptions<TData extends RowData> = Partial<TanStackOptions<TData>> & {
  columns: ReadonlyArray<DataTableColumn<TData>>;
  data: ReadonlyArray<TData>;
  /** Draws the checkbox column. A function says which rows can be chosen. */
  selectable?: boolean | ((row: TData) => boolean) | undefined;
  /** Rows per page. Unset, the table shows every row and no Pagination. */
  pageSize?: number | undefined;
  /** The accessible name of the table. */
  label?: string | undefined;
  /** The server sorts, filters or pages: the table stops doing it and `rowCount` says how many there are. */
  manual?: { sorting?: boolean; filtering?: boolean; pagination?: boolean } | undefined;
  /** The reader can pin and unpin columns from the column menu. On by default. */
  pinnable?: boolean | undefined;
  /** The reader can hide columns. On by default; `hideable: false` on a column keeps that one. */
  hideable?: boolean | undefined;
  /** A handle on every header's trailing edge. */
  resizable?: boolean | undefined;
  /** A grip on every header; drag or arrow keys reorder. Pinned columns keep their band. */
  reorderable?: boolean | undefined;
  /** The per-column menu on header hover: sort, pin, hide. On when anything above is. */
  columnMenu?: boolean | undefined;
  /** `fixed` makes every width authoritative and leaves the slack to the unsized columns; on by itself when the table resizes or reorders. `auto` lets the browser fit content. */
  layout?: "auto" | "fixed" | undefined;
  /** Names the table so the reader's layout (order, widths, visibility, pins) persists in this browser. */
  view?: string | undefined;
  /** Nested rows: `children` reads a row's parts; the table is a treegrid and the name column carries the chevron. */
  tree?:
    | {
        children: (row: TData) => ReadonlyArray<TData> | undefined;
        label: (row: TData) => string;
        hint?: ((row: TData, childCount: number) => ReactNode) | undefined;
        column?: string | undefined;
        /** Row ids open at first, or `true` for every row. */
        initialExpanded?: true | string[] | undefined;
      }
    | undefined;
  /** A row opens into this: a child table, the record's detail. */
  detail?: ((row: TData) => ReactNode) | undefined;
  /** A band per value of this column, each opened and closed as one. Pagination is off while it is on. */
  groupBy?: string | undefined;
  /** Rows can be pinned above and below through `row.pin`. */
  pinRows?: boolean | undefined;
  /** Only the rows in view are drawn; the frame scrolls the rest. Give the renderer a `maxHeight`; leave `pageSize` off. */
  virtualize?:
    boolean | { estimate?: number | undefined; overscan?: number | undefined } | undefined;
  /** Rows can be dragged into a new order. Sorting is off while it is on. */
  reorderRows?: ((moved: TData, target: TData, position: "before" | "after") => void) | undefined;
};

/** The author's pins, from the kinds' `pin`, as the initial pinning state. */
const pinsOf = <TData extends RowData>(columns: ReadonlyArray<DataTableColumn<TData>>) => {
  const start: string[] = [];
  const end: string[] = [];
  const walk = (list: ReadonlyArray<DataTableColumn<TData>>) => {
    for (const c of list) {
      const id =
        c.id ??
        ("accessorKey" in c && typeof c.accessorKey === "string" ? c.accessorKey : undefined);
      if (id && c.meta?.pin === "start") start.push(id);
      if (id && c.meta?.pin === "end") end.push(id);
      if ("columns" in c && c.columns) walk(c.columns as ReadonlyArray<DataTableColumn<TData>>);
    }
  };
  walk(columns);
  return { start, end };
};

export function useDataTable<TData extends RowData>({
  columns,
  data,
  selectable = false,
  pageSize,
  label,
  manual,
  pinnable = true,
  hideable = true,
  resizable = false,
  reorderable = false,
  columnMenu,
  layout,
  view,
  tree,
  detail,
  groupBy,
  pinRows = false,
  reorderRows,
  virtualize,
  initialState,
  ...rest
}: DataTableOptions<TData>) {
  const pins = pinsOf(columns);
  const expanded =
    tree?.initialExpanded === true || groupBy
      ? true
      : tree?.initialExpanded
        ? Object.fromEntries(tree.initialExpanded.map((id) => [id, true]))
        : {};
  const table = hook.useAppTable<TData>({
    ...rest,
    columns,
    data,
    enableRowSelection:
      typeof selectable === "function" ? (row) => selectable(row.original) : selectable,
    enableColumnPinning: pinnable || pins.start.length + pins.end.length > 0,
    enableHiding: hideable,
    enableColumnResizing: resizable,
    manualSorting: manual?.sorting ?? false,
    manualFiltering: manual?.filtering ?? false,
    manualPagination: (manual?.pagination ?? pageSize === undefined) || Boolean(groupBy),
    enableSorting: !reorderRows,
    // the reader's open rows survive a data refresh; the projection behind a tree is often rebuilt per render
    autoResetExpanded: false,
    enableRowPinning: pinRows,
    enableGrouping: Boolean(groupBy),
    groupedColumnMode: "remove",
    ...(tree ? { getSubRows: (row: TData) => tree.children(row) } : {}),
    ...(detail ? { getRowCanExpand: () => true } : {}),
    initialState: {
      ...(pageSize === undefined ? {} : { pagination: { pageIndex: 0, pageSize } }),
      columnPinning: pins,
      expanded,
      ...(groupBy ? { grouping: [groupBy] } : {}),
      ...initialState,
    },
    meta: {
      pageSize,
      label,
      pinnable,
      hideable,
      resizable,
      reorderable,
      columnMenu: columnMenu ?? (pinnable || hideable),
      layout: layout ?? (resizable || reorderable ? "fixed" : "auto"),
      view,
      ...(tree
        ? {
            tree: {
              column: tree.column,
              label: tree.label as (row: never) => string,
              hint: tree.hint as ((row: never, childCount: number) => ReactNode) | undefined,
            },
          }
        : {}),
      detail: detail as ((row: never) => ReactNode) | undefined,
      groupBy,
      pinRows,
      ...(virtualize ? { virtualize: virtualize === true ? {} : virtualize } : {}),
      reorderRows: reorderRows as
        ((moved: never, target: never, position: "before" | "after") => void) | undefined,
    },
  });
  useViewStore(table, view);
  return table;
}

export type DataTableInstance<TData extends RowData> = ReturnType<typeof useDataTable<TData>>;

/** The column helper bound to the kit's features, for a column the kinds do not cover. */
export const createDataTableColumnHelper = hook.createAppColumnHelper;
