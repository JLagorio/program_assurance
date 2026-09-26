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
import type { Density } from "../../mode/density";
import type { Tone } from "../../lib/status-tone";
import type { ReactNode } from "react";

/*
 * The table engine is TanStack Table 9. Features are opt-in imports composed once here, so every
 * DataTable in the app shares one feature set and one column vocabulary, and the bundle carries
 * nothing the kit does not draw. Cell selection and cell spanning are left out on purpose.
 */

/** What a column is, which decides its alignment, its sort, its filter and the part that draws it. */
export type ColumnKind =
  "id" | "text" | "number" | "date" | "status" | "person" | "list" | "actions" | "custom";

/** One value of a status vocabulary: the words it shows, its tone, and its place in the order. */
export type StatusEntry = {
  /** What the badge and the filter say. The value itself unsaid. */
  label?: string | undefined;
  tone: Tone;
  /** Where the value sorts: lower first. Its place in the map unsaid. */
  rank?: number | undefined;
};

/**
 * A status vocabulary shared by every column and badge that shows it: each stored value to its
 * label, tone and rank. `c.status(key, { statuses })` draws, sorts and filters by it; a product
 * keeps one map per concept and passes the same one everywhere.
 */
export type StatusMap<Value extends string = string> = Readonly<Record<Value, StatusEntry>>;

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
  /** Lower numbers remain visible longer in a responsive table. */
  priority?: number | undefined;
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
  /** What the column exports, when its value is not the cell's text. */
  export?: ((row: never) => string) | undefined;
  /** The column edits in place. */
  editable?: boolean | undefined;
  /** `status` kind: the shared vocabulary, which gives the filter its labels and its order. */
  statuses?: StatusMap | undefined;
};

/** What the hook stores on the table for the renderer: the kit options that are not TanStack's. */
export type DataTableMeta = {
  /** Rows per page; unset means every row, no Pagination. */
  pageSize?: number | undefined;
  /** The sizes the reader can choose from; the Pagination shows them when there is more than one. */
  pageSizes?: number[] | undefined;
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
  /** The per-column menu on a header's hover: sort, move (with `reorderable`), pin, hide. */
  columnMenu?: boolean | undefined;
  /** `fixed` makes every width authoritative and leaves the slack to the unsized columns; `auto` lets the browser fit content. */
  layout?: "auto" | "fixed" | undefined;
  /** The name under which the reader's layout persists. */
  view?: string | undefined;
  /** The rows' height, `default` 40px or `compact` 36px: the reader's choice, kept with the view. */
  density?: Density | undefined;
  /** The author's density, what Reset view returns to. */
  defaultDensity?: Density | undefined;
  setDensity?: ((density: Density) => void) | undefined;
  /** A column edits in place, so the table is a grid and Enter moves down the column. */
  editable?: boolean | undefined;
  /** Nested rows: the leading disclosure column carries the chevron and the indent. */
  tree?:
    | {
        /** The row's plain name, for the chevron's label. */
        label: (row: never) => string;
        /** Muted text after a folded row's first value: a count of parts. */
        hint?: ((row: never, childCount: number) => ReactNode) | undefined;
        /** Decorative connector lines confined to the first value's tree indent. */
        guides?: boolean | undefined;
      }
    | undefined;
  /** A row opens into this. */
  detail?: ((row: never) => ReactNode) | undefined;
  /** The leading chevron column that opens a detail; `false` when a cell opens it instead. */
  detailColumn?: boolean | undefined;
  /** Whether a row's detail is open. Its own state, so a tree's rows open their parts and their detail independently. */
  detailOpen?: ((rowId: string) => boolean) | undefined;
  /** Opens and closes one row's detail. */
  toggleDetail?: ((rowId: string) => void) | undefined;
  /** Rows under a band per value of this column. */
  groupBy?: string | undefined;
  /** Rows can be pinned above and below. */
  pinRows?: boolean | undefined;
  /** Only the rows in view are drawn; the frame scrolls the rest. Needs `maxHeight` on the renderer. */
  virtualize?: { estimate?: number | undefined; overscan?: number | undefined } | undefined;
  /** Rows can be dragged into a new order; the handler receives the moved row and its new neighbour. */
  reorderRows?: ((moved: never, target: never, position: "before" | "after") => void) | undefined;
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

/**
 * The search box's filter. As TanStack's `includesString`, a value matches when its text includes
 * the search, ignoring case. A status column with a shared map also matches the label its badge
 * shows, so the reader finds a status by the words on the screen, not only by the stored value.
 */
const filterFn_search = constructFilterFn({
  ...filterFns.includesString,
  filter: (dataValue: unknown, filterValue: unknown, row, columnId) => {
    const search = String(filterValue);
    if (typeof dataValue === "string" && dataValue.includes(search)) return true;
    const statuses = (
      row.table.getColumn(columnId)?.columnDef.meta as DataTableColumnMeta | undefined
    )?.statuses;
    if (!statuses) return false;
    const value = row.getValue(columnId);
    const label =
      typeof value === "string" && Object.prototype.hasOwnProperty.call(statuses, value)
        ? statuses[value]?.label
        : undefined;
    return label !== undefined && label.toLowerCase().includes(search);
  },
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
  filterFns: {
    ...filterFns,
    matches: filterFn_matches,
    dateRange: filterFn_dateRange,
    search: filterFn_search,
  },
  aggregationFns,
  columnMeta: {} as DataTableColumnMeta,
  tableMeta: {} as DataTableMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;
