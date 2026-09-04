import {
  aggregationFns,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  constructFilterFn,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

/*
 * The table engine is TanStack Table 9. Features are opt-in imports composed once here, so every
 * DataTable in the app shares one feature set and one column vocabulary, and the bundle carries
 * nothing the kit does not draw. Cell selection and cell spanning are left out on purpose.
 */

/** What a column is, which decides its alignment, its sort, its filter and the part that draws it. */
export type ColumnKind =
  "id" | "text" | "number" | "date" | "status" | "person" | "actions" | "custom";

/** A row action in the overflow menu of an `actions` column. */
export type RowAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean | undefined;
  tone?: "default" | "danger" | undefined;
};

/**
 * The kit's column metadata. The kinds set it; the renderer reads it. Row-typed callbacks take
 * `never` so a column for any record type fits: the renderer casts the row back when it calls them.
 */
export type DataTableColumnMeta = {
  kind: ColumnKind;
  align: "start" | "end";
  /** Wrap instead of truncating; the row grows. */
  wrap?: boolean | undefined;
  /** The author's default pin; the reader's view can move it. */
  pin?: "start" | "end" | undefined;
  /** `id` kind: the eye on hover opens the preview surface. */
  preview?: ((row: never) => void) | undefined;
  /** `id` kind: the row whose preview is open reads active. */
  active?: ((row: never) => boolean) | undefined;
  /** `id` kind: the glance shown on hover (the hover ladder's first rung). */
  glance?: ((row: never) => ReactNode) | undefined;
  /** `id` kind: brand ids light up on row hover, subtle ones do not. */
  tone?: "brand" | "subtle" | undefined;
  /** `actions` kind: the row's menu. */
  actions?: ((row: never) => RowAction[]) | undefined;
};

/** What the hook stores on the table for the renderer: the kit options that are not TanStack's. */
export type DataTableMeta = {
  /** Rows per page; unset means every row, no Pagination. */
  pageSize?: number | undefined;
  /** The accessible name of the table. */
  label?: string | undefined;
  /** The reader can pin and unpin columns from the column menu. */
  pinnable?: boolean | undefined;
  /** The reader can hide columns from the Columns menu and the column menu. */
  hideable?: boolean | undefined;
  /** A handle on every header's trailing edge. */
  resizable?: boolean | undefined;
  /** A grip on every header; drag or arrow keys reorder. */
  reorderable?: boolean | undefined;
  /** The per-column menu on header hover: sort, pin, hide. */
  columnMenu?: boolean | undefined;
  /** `fixed` makes every width authoritative and leaves the slack to the unsized columns; `auto` lets the browser fit content. */
  layout?: "auto" | "fixed" | undefined;
  /** The name under which the reader's layout persists. */
  view?: string | undefined;
};

const lower = (v: unknown) => (v == null ? "" : String(v).toLowerCase());

/**
 * The one filter the kinds share. An array is membership (the facet checkboxes), a string is
 * equality (a route's tab), `{ contains }` is a substring (a long text column's filter field).
 */
const filterFn_matches = constructFilterFn({
  filter: (dataValue: unknown, filterValue: unknown) => {
    if (Array.isArray(filterValue)) return filterValue.some((v) => lower(v) === lower(dataValue));
    if (filterValue && typeof filterValue === "object" && "contains" in filterValue)
      return lower(dataValue).includes(lower((filterValue as { contains: unknown }).contains));
    return lower(dataValue) === lower(filterValue);
  },
  autoRemove: (v: unknown) =>
    v == null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" &&
      "contains" in (v as object) &&
      !(v as { contains: unknown }).contains),
});

/** ISO date strings against `[from, to]`, either end open. Strings compare as dates when they are ISO. */
const filterFn_dateRange = constructFilterFn({
  filter: (dataValue: unknown, filterValue: unknown) => {
    const [from, to] = Array.isArray(filterValue) ? filterValue : [undefined, undefined];
    const v = typeof dataValue === "string" ? dataValue : "";
    if (!v) return false;
    if (from && v < String(from)) return false;
    if (to && v > String(to)) return false;
    return true;
  },
  autoRemove: (v: unknown) => !Array.isArray(v) || (!v[0] && !v[1]),
});

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowPinningFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortFns,
  filterFns: { ...filterFns, matches: filterFn_matches, dateRange: filterFn_dateRange },
  aggregationFns,
  columnMeta: {} as DataTableColumnMeta,
  tableMeta: {} as DataTableMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;
