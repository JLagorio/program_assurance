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
};

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
  filterFns,
  aggregationFns,
  columnMeta: {} as DataTableColumnMeta,
  tableMeta: {} as DataTableMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;
