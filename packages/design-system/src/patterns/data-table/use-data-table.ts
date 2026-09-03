import {
  createTableHook,
  type ColumnDef,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";

import { dataTableFeatures, type DataTableFeatures } from "./features";

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
};

export function useDataTable<TData extends RowData>({
  columns,
  data,
  selectable = false,
  pageSize,
  label,
  manual,
  initialState,
  ...rest
}: DataTableOptions<TData>) {
  return hook.useAppTable<TData>({
    ...rest,
    columns,
    data,
    enableRowSelection:
      typeof selectable === "function" ? (row) => selectable(row.original) : selectable,
    manualSorting: manual?.sorting ?? false,
    manualFiltering: manual?.filtering ?? false,
    manualPagination: manual?.pagination ?? pageSize === undefined,
    initialState: {
      ...(pageSize === undefined ? {} : { pagination: { pageIndex: 0, pageSize } }),
      ...initialState,
    },
    meta: { pageSize, label },
  });
}

export type DataTableInstance<TData extends RowData> = ReturnType<typeof useDataTable<TData>>;

/** The column helper bound to the kit's features, for a column the kinds do not cover. */
export const createDataTableColumnHelper = hook.createAppColumnHelper;
