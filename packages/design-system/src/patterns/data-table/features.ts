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
import { parseInstant, zonedParts } from "../../lib/locale-format";
import type { Tone } from "../../lib/status-tone";
import type { ReactElement, ReactNode } from "react";

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

/**
 * A row action in the overflow menu of an `actions` column. It acts (`onSelect`) or it navigates
 * (`href`, with `render` for the product's router link): a navigating item is a real link, so a
 * modifier or middle click opens it in a new tab. Buttons act; links navigate.
 */
export type RowAction = {
  label: string;
  /** What choosing the item does. */
  onSelect?: (() => void) | undefined;
  /** Where the item goes: the item is then a link, not a button. */
  href?: string | undefined;
  /** The link element for `href`, the product's router link: `<Link to="/risks/$id" params={…} />`. A plain anchor unsaid. */
  render?: ReactElement | undefined;
  /** A leading icon, before the label. */
  icon?: ReactNode;
  /** A second line under the label that tells two similar actions apart. */
  description?: ReactNode;
  disabled?: boolean | undefined;
  /** Why the action is unavailable: it disables the item and shows the reason under the label. */
  disabledReason?: string | undefined;
  tone?: "default" | "danger" | undefined;
  /** Keys the item, where two actions could share a label. The label and position unsaid. */
  id?: string | undefined;
  /** Items that share a group sit together; a separator starts each new group. A danger action goes last, in its own group. */
  group?: string | undefined;
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
  /** The author gave the column a width. An unsized column takes a share of a responsive table's spare width. */
  sized?: boolean | undefined;
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
  /** A row's readable name, for its controls and what is said about it; the tree's label or the identity's text unsaid. */
  rowLabel?: ((row: never) => string) | undefined;
  /** The column whose cell names its row (`th scope="row"`); `false` for none, the identity unsaid. */
  rowHeader?: string | false | undefined;
  /** One row at a time is chosen: a radio per row and no select-all. */
  singleSelection?: boolean | undefined;
  /** The table's preview: the eye on each row's first value opens it; the row whose id is `activeId` reads active. */
  preview?: { onPreview: (row: never) => void; activeId?: string | null | undefined } | undefined;
  /** The reader's time zone, from the closest LedgerProvider: a date range filter reads an instant's day in it. */
  timeZone?: string | undefined;
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
  /** The author's version of the layout: a stored layout under another version is discarded. */
  viewVersion?: number | undefined;
  /** The rows' height, `default` 40px or `compact` 36px: the reader's choice, kept with the view. */
  density?: Density | undefined;
  /** The author's density, what Reset view returns to. */
  defaultDensity?: Density | undefined;
  setDensity?: ((density: Density) => void) | undefined;
  /** The columns the reader wraps, from the Columns menu: their values run to several lines instead of ending in an ellipsis. Kept with the view. */
  wrapped?: readonly string[] | undefined;
  /** Sets the columns the reader wraps: the view store's restore and Reset view. */
  setWrapped?: ((columns: readonly string[]) => void) | undefined;
  /** Wraps one column, or ends its wrap: the Columns menu's Wrap text. */
  toggleWrap?: ((columnId: string, wrap: boolean) => void) | undefined;
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

/** A filter value that asks nothing: none, an empty choice, an empty `{ contains }`. */
const noChoice = (v: unknown) =>
  v == null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && "contains" in (v as object) && !(v as { contains: unknown }).contains);

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
  autoRemove: (v: unknown) => noChoice(v),
});

/**
 * A column of several values per row (a `list` column): the row's values are its members, from
 * the column's `getUniqueValues`. An array matches when any value chosen is one of them, so a row
 * of two people is found under either; a string matches one member; `{ contains }` matches a member
 * that holds the text.
 */
const filterFn_members = constructFilterFn({
  filter: (_dataValue: unknown, filterValue: unknown, row, columnId) => {
    const members = row.getUniqueValues<unknown>(columnId).map(lower);
    if (Array.isArray(filterValue)) return filterValue.some((v) => members.includes(lower(v)));
    if (filterValue && typeof filterValue === "object" && "contains" in filterValue) {
      const text = lower((filterValue as { contains: unknown }).contains);
      return members.some((member) => member.includes(text));
    }
    return members.includes(lower(filterValue));
  },
  autoRemove: (v: unknown) => noChoice(v),
});

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The calendar day a value falls on, as `YYYY-MM-DD`: a calendar date as it is, an instant on the
 * day it falls on in the reader's time zone. `undefined` for anything else.
 */
export function dayOf(value: string, timeZone = "UTC"): string | undefined {
  if (CALENDAR_DAY.test(value)) return value;
  const instant = parseInstant(value, timeZone);
  if (instant === null) return undefined;
  const { year, month, day } = zonedParts(instant, timeZone);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * A date column against `[from, to]`, either end open, both ends inclusive. Ends that are calendar
 * days compare by day: an instant counts on the day it falls on in the reader's time zone, so "up
 * to today" keeps today's records and the day filtered is the day the cell shows. An end that is an
 * instant compares as an instant. A value that is not a date never matches.
 */
const filterFn_dateRange = constructFilterFn({
  filter: (dataValue: unknown, filterValue: unknown, row) => {
    const [from, to] = Array.isArray(filterValue) ? filterValue : [undefined, undefined];
    const v = typeof dataValue === "string" ? dataValue : "";
    if (!v) return false;
    const zone = (row.table.options.meta as DataTableMeta | undefined)?.timeZone ?? "UTC";
    const within = (end: unknown, side: "from" | "to") => {
      if (end === undefined || end === null || end === "") return true;
      const bound = String(end);
      if (CALENDAR_DAY.test(bound)) {
        const day = dayOf(v, zone);
        if (day === undefined) return false;
        return side === "from" ? day >= bound : day <= bound;
      }
      const at = parseInstant(bound, zone);
      const value = CALENDAR_DAY.test(v) ? parseInstant(`${v}T00:00`, zone) : parseInstant(v, zone);
      if (at === null || value === null) return false;
      return side === "from" ? value >= at : value <= at;
    };
    return within(from, "from") && within(to, "to");
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
    members: filterFn_members,
    dateRange: filterFn_dateRange,
    search: filterFn_search,
  },
  aggregationFns,
  columnMeta: {} as DataTableColumnMeta,
  tableMeta: {} as DataTableMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;
