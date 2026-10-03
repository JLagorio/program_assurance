import {
  createTableHook,
  type ColumnHelper,
  type Row,
  type RowData,
  type RowSelectionState,
  type TableOptions,
  type Updater,
} from "@tanstack/react-table";
import type { Density } from "../../mode/density";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { warnOnce } from "../../components/date-picker";
import { useLedgerLocale } from "../../lib/locale";
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
  // TanStack's includesString, and a status map's labels too.
  globalFilterFn: "search",
});

export const { useTableContext, useCellContext, useHeaderContext } = hook;

/** One column of a list whose value types differ: an element of what TanStack's own `columns()`
    helper returns, which is `ColumnDef<…, any>`. Its value type is erased, as TanStack erases it,
    also in a column written where this type is expected; a column written on its own keeps the
    value type `createDataTableColumnHelper` checks (test/data-table-column.types.tsx). */
export type DataTableColumn<TData extends RowData> = ReturnType<
  ColumnHelper<DataTableFeatures, TData>["columns"]
>[number];

type TanStackOptions<TData extends RowData> = Omit<
  TableOptions<DataTableFeatures, TData>,
  "features" | "columns" | "data" | "enableRowSelection" | "manualPagination" | "meta"
>;

/** A reader's stored layout, named: `id` names the table, `version` retires every stored layout when the author changes the columns, `scope` keeps one reader's or one tenant's apart. */
export type DataTableView = {
  id: string;
  /** Raise it when the columns change so much that a stored layout no longer fits: every stored layout under an older version is discarded. `0` unsaid. */
  version?: number | undefined;
  /** Put before the name: a tenant or a user, so two people in one browser keep their own layouts. */
  scope?: string | undefined;
};

export type DataTableOptions<TData extends RowData> = Partial<TanStackOptions<TData>> & {
  columns: ReadonlyArray<DataTableColumn<TData>>;
  data: ReadonlyArray<TData>;
  /**
   * Draws the choice column. `true` draws a checkbox per row and the select-all in the header;
   * `"single"` draws a radio per row and no select-all, for choosing one record, and so does
   * `true` beside `enableMultiRowSelection: false`. A function says which rows can be chosen.
   */
  selectable?: boolean | "single" | ((row: TData) => boolean) | undefined;
  /** One at a time (`selectable: "single"`): the chosen row's id, owned by the caller; `null` for none. The table keeps it unsaid. */
  value?: string | null | undefined;
  /** One at a time: called with the chosen row's id, or `null` when nothing is chosen. */
  onValueChange?: ((id: string | null) => void) | undefined;
  /** Rows per page. Unset, the table shows every row and no Pagination. */
  pageSize?: number | undefined;
  /** The sizes the reader can choose from, `pageSize` among them; the Pagination offers them as Rows per page when there is more than one. `[10, 20, 50, 100]` unsaid. The choice persists with `view`. */
  pageSizes?: number[] | undefined;
  /** The accessible name of the table. */
  label?: string | undefined;
  /**
   * A row's readable name: its code, its title. Its controls say it ("Select REQ-001", "Row
   * actions for REQ-001", "Reorder REQ-001", "Preview REQ-001", "Show details for REQ-001",
   * "More fields for REQ-001"), and so do the moves a screen reader hears. Unset, the name is the
   * tree's `label`, else the text of the column that names the row (the lowest `priority`, else
   * the first) or of an `id` column; the row's id never is. Give it when that text is not the name
   * a reader knows the row by.
   */
  rowLabel?: ((row: TData) => string) | undefined;
  /**
   * The column whose cell names its row, drawn as `th scope="row"`, so a screen reader says the
   * row's identity with every other cell and control in it. Unset, it is the column with the
   * lowest `priority`, else the first, never the actions: the one a responsive row keeps longest.
   * `false` draws every cell as a `td`.
   */
  rowHeader?: string | false | undefined;
  /**
   * The row's preview: the eye at the end of each row's first value opens it, and the row whose id
   * is `activeId` reads active. The same as `c.id`'s `preview` and `active`, held by the table
   * instead of a column, so the columns can be defined once, at module level.
   */
  preview?: { onPreview: (row: TData) => void; activeId?: string | null | undefined } | undefined;
  /** The server sorts, filters or pages: the table stops doing it and `rowCount` says how many there are. */
  manual?: { sorting?: boolean; filtering?: boolean; pagination?: boolean } | undefined;
  /** The reader can pin and unpin columns from the column menu. On by default. */
  pinnable?: boolean | undefined;
  /** The reader can hide columns. On by default; `hideable: false` on a column keeps that one. */
  hideable?: boolean | undefined;
  /** A handle on every header's trailing edge, and Wider, Narrower and Reset width in the column menu; drag, arrow keys or one press resize. */
  resizable?: boolean | undefined;
  /** A grip on every header, and Move left and Move right in the column menu; drag, arrow keys or one press reorder. Pinned columns keep their band. */
  reorderable?: boolean | undefined;
  /** The per-column menu on a header's hover: sort, move (with `reorderable`), pin, hide. On when `pinnable` or `hideable` is. */
  columnMenu?: boolean | undefined;
  /** `fixed` makes every width authoritative and leaves the slack to the unsized columns; on by itself when the table resizes or reorders. `auto` lets the browser fit content. */
  layout?: "auto" | "fixed" | undefined;
  /**
   * Names the table so the reader's layout (order, widths, visibility, pins, wrapped columns,
   * density, page size) persists in this browser. A name, or `{ id, version, scope }`: raise
   * `version` when the columns change and every older stored layout is discarded; `scope` (a
   * tenant, a user) keeps two readers in one browser apart.
   */
  view?: string | DataTableView | undefined;
  /** The rows' height at first: `compact` (36px) for a picker's table; `default` (40px) unsaid. The reader changes it from the Settings menu, and the choice persists with `view`. */
  density?: Density | undefined;
  /** Nested rows: `children` reads a row's parts; the table is a treegrid and the leading disclosure column carries the chevron. */
  tree?:
    | {
        children: (row: TData) => ReadonlyArray<TData> | undefined;
        label: (row: TData) => string;
        hint?: ((row: TData, childCount: number) => ReactNode) | undefined;
        /** Draws decorative connector lines within the first value's existing tree indent. */
        guides?: boolean | undefined;
        /** Row ids open at first, or `true` for every row. */
        initialExpanded?: true | string[] | undefined;
      }
    | undefined;
  /** A row opens into this: a child table, the record's detail. */
  detail?: ((row: TData) => ReactNode) | undefined;
  /** Row ids whose `detail` is open at first, or `true` for every row. Without it, a table with no `tree` reads `initialState.expanded`. */
  initialDetails?: true | readonly string[] | undefined;
  /**
   * The leading chevron column that opens a `detail`. `false` leaves it out, for a table whose rows
   * are opened from a cell instead: a `list` column with `opens: "detail"`. A treegrid takes this,
   * so the disclosure column is the only chevron and the two never read as twins.
   */
  detailColumn?: boolean | undefined;
  /** A band per value of this column, each opened and closed as one; the groups open as it changes. Pagination is off while it is on. */
  groupBy?: string | undefined;
  /** Rows can be pinned above and below through `row.pin`. */
  pinRows?: boolean | undefined;
  /** Only the rows in view are drawn; the frame scrolls the rest. Give the renderer a `maxHeight`; leave `pageSize` off. Not with `groupBy`. */
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

/** A record's own `id`, when it has one a row can be keyed by. */
const ownId = (row: unknown): string | undefined => {
  const id = row !== null && typeof row === "object" ? (row as { id?: unknown }).id : undefined;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
};

/** Whether every record, parts included, has its own id and no two share one. */
function idsAreKeys<TData>(
  data: ReadonlyArray<TData>,
  children: ((row: TData) => ReadonlyArray<TData> | undefined) | undefined,
) {
  const seen = new Set<string>();
  const walk = (rows: ReadonlyArray<TData>): boolean =>
    rows.every((row) => {
      const id = ownId(row);
      if (id === undefined || seen.has(id)) return false;
      seen.add(id);
      const parts = children?.(row);
      return parts ? walk(parts) : true;
    });
  return walk(data);
}

/** The view's stored name, and its author version. */
const viewName = (view: string | DataTableView | undefined) =>
  typeof view === "string"
    ? view
    : view
      ? view.scope
        ? `${view.scope}.${view.id}`
        : view.id
      : undefined;

export function useDataTable<TData extends RowData>({
  columns,
  data,
  selectable = false,
  value,
  onValueChange,
  pageSize,
  pageSizes,
  label,
  rowLabel,
  rowHeader,
  preview,
  manual,
  pinnable = true,
  hideable = true,
  resizable = false,
  reorderable = false,
  columnMenu,
  layout,
  view: viewOption,
  density: defaultDensity = "default",
  tree,
  detail,
  initialDetails,
  detailColumn = true,
  groupBy,
  pinRows = false,
  reorderRows,
  virtualize,
  initialState,
  ...rest
}: DataTableOptions<TData>) {
  const { timeZone } = useLedgerLocale();
  const pins = pinsOf(columns);
  const view = viewName(viewOption);
  const viewVersion = typeof viewOption === "object" ? viewOption.version : undefined;
  const [density, setDensity] = useState<Density>(defaultDensity);
  // The columns the reader wraps from the Columns menu, kept with the view as the density is.
  const [wrapped, setWrapped] = useState<readonly string[]>([]);
  const toggleWrap = useCallback(
    (columnId: string, wrap: boolean) =>
      setWrapped((current) =>
        wrap
          ? current.includes(columnId)
            ? current
            : [...current, columnId]
          : current.filter((id) => id !== columnId),
      ),
    [],
  );
  // A detail row has its own open set, not TanStack's expansion, so a treegrid's rows can open
  // their parts and their detail at the same time and one never closes the other.
  // `initialDetails` says which start open; a table with no tree still reads `initialState.expanded`.
  const [details, setDetails] = useState<{ all: boolean; open: Record<string, boolean> }>(() => {
    if (initialDetails === true) return { all: true, open: {} };
    if (initialDetails)
      return { all: false, open: Object.fromEntries(initialDetails.map((id) => [id, true])) };
    const seed = tree ? undefined : initialState?.expanded;
    return seed === true
      ? { all: true, open: {} }
      : { all: false, open: seed && typeof seed === "object" ? { ...seed } : {} };
  });
  const editable = columns.some((c) => c.meta?.editable);
  const sizes =
    pageSize === undefined
      ? undefined
      : [...new Set([...(pageSizes ?? [10, 20, 50, 100]), pageSize])].sort((a, b) => a - b);
  const expanded =
    tree?.initialExpanded === true || groupBy
      ? true
      : tree?.initialExpanded
        ? Object.fromEntries(tree.initialExpanded.map((id) => [id, true]))
        : {};

  // One at a time: a radio per row and no select-all. The chosen id is the caller's through
  // `value`, or the table's, unless the caller owns `rowSelection` itself.
  const single =
    selectable === "single" || (Boolean(selectable) && rest.enableMultiRowSelection === false);
  const [ownChoice, setOwnChoice] = useState<string | null>(null);
  const callerOwnsSelection =
    rest.state?.rowSelection !== undefined || rest.onRowSelectionChange !== undefined;
  const choice = value !== undefined ? value : ownChoice;
  // One object per choice: a new one each render would redraw every row's selection.
  const choiceSelection: RowSelectionState = useMemo(
    () => (choice ? { [choice]: true } : {}),
    [choice],
  );
  // One array per grouping: TanStack returns a table to its first page whenever the grouping it
  // is handed changes identity, so a new array each render would pin the table to page one.
  const grouping = useMemo(() => (groupBy ? [groupBy] : []), [groupBy]);
  const choosing = single && !callerOwnsSelection;
  const onChoiceChange = (update: Updater<RowSelectionState>) => {
    const next = typeof update === "function" ? update(choiceSelection) : update;
    const id = Object.keys(next).find((key) => next[key]) ?? null;
    if (value === undefined) setOwnChoice(id);
    onValueChange?.(id);
  };

  // A row is keyed by its record's own id unless the author says otherwise, so a refresh never
  // moves a selection, an open detail or an open part to another record.
  const children = tree?.children;
  const keyedById = useMemo(
    () => (rest.getRowId ? false : idsAreKeys(data, children)),
    [data, children, rest.getRowId],
  );
  const getRowId =
    rest.getRowId ??
    (keyedById
      ? (row: TData) => ownId(row) as string
      : (_row: TData, index: number, parent?: Row<DataTableFeatures, TData>) =>
          parent ? `${parent.id}.${index}` : String(index));
  const name = label ? `useDataTable (${label})` : "useDataTable";
  if (!rest.getRowId && !keyedById && data.length > 0 && (selectable || detail || tree))
    warnOnce(
      `${name}: the rows have no unique \`id\`, so they are keyed by their position and a refresh can move a selection, an open detail or an open part to another record. Pass \`getRowId\`.`,
    );
  if (virtualize && groupBy)
    warnOnce(`${name}: \`virtualize\` is ignored while \`groupBy\` groups the rows.`);
  if (initialState?.columnPinning && pins.start.length + pins.end.length > 0)
    warnOnce(
      `${name}: \`initialState.columnPinning\` replaces the columns' own \`pin\`; pin the columns in one place.`,
    );

  const table = hook.useAppTable<TData>({
    ...rest,
    columns,
    data,
    getRowId,
    enableRowSelection:
      typeof selectable === "function" ? (row) => selectable(row.original) : Boolean(selectable),
    ...(single ? { enableMultiRowSelection: false } : {}),
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
    // a filter or a search keeps a matching row's ancestors, so a child never shows without its parent
    ...(tree ? { getSubRows: (row: TData) => tree.children(row), filterFromLeafRows: true } : {}),
    initialState: {
      // The search is text from the start, so a field bound to it is controlled from the start.
      globalFilter: "",
      ...(pageSize === undefined ? {} : { pagination: { pageIndex: 0, pageSize } }),
      columnPinning: pins,
      expanded,
      ...initialState,
    },
    state: {
      ...rest.state,
      // `groupBy` is the grouping: one option does one thing, however often it changes.
      ...(rest.state?.grouping === undefined ? { grouping } : {}),
      ...(choosing ? { rowSelection: choiceSelection } : {}),
    },
    ...(choosing ? { onRowSelectionChange: onChoiceChange } : {}),
    meta: {
      pageSize,
      pageSizes: sizes,
      label,
      rowLabel: rowLabel as ((row: never) => string) | undefined,
      rowHeader,
      singleSelection: single,
      preview: preview as
        { onPreview: (row: never) => void; activeId?: string | null | undefined } | undefined,
      timeZone,
      pinnable,
      hideable,
      resizable,
      reorderable,
      columnMenu: columnMenu ?? (pinnable || hideable),
      layout: layout ?? (resizable || reorderable ? "fixed" : "auto"),
      view,
      viewVersion,
      density,
      defaultDensity,
      setDensity,
      wrapped,
      setWrapped,
      toggleWrap,
      ...(tree
        ? {
            tree: {
              label: tree.label as (row: never) => string,
              hint: tree.hint as ((row: never, childCount: number) => ReactNode) | undefined,
              guides: tree.guides,
            },
          }
        : {}),
      detail: detail as ((row: never) => ReactNode) | undefined,
      detailColumn,
      detailOpen: (rowId: string) => details.open[rowId] ?? details.all,
      toggleDetail: (rowId: string) =>
        setDetails((current) => ({
          ...current,
          open: { ...current.open, [rowId]: !(current.open[rowId] ?? current.all) },
        })),
      groupBy,
      pinRows,
      editable,
      ...(virtualize ? { virtualize: virtualize === true ? {} : virtualize } : {}),
      reorderRows: reorderRows as
        ((moved: never, target: never, position: "before" | "after") => void) | undefined,
    },
  });
  // A new grouping opens its groups, as the first one did.
  const grouped = useRef(groupBy);
  useLayoutEffect(() => {
    if (grouped.current === groupBy) return;
    grouped.current = groupBy;
    if (groupBy) table.setExpanded(true);
  }, [groupBy, table]);
  useViewStore(table, view, viewVersion);
  return table;
}

export type DataTableInstance<TData extends RowData> = ReturnType<typeof useDataTable<TData>>;

/**
 * The rows the reader can reach, in the table's order, on every page: what the search and filters
 * leave, in the sort chosen, a tree's open parts in place, group headings left out. A preview's
 * previous and next walk these, so they cross pages; `showRow` turns the table to the row's page.
 * A server-paged table (`manual.pagination`) has only its loaded page to give.
 */
export function displayedRows<TData extends RowData>(
  table: DataTableInstance<TData>,
): Row<DataTableFeatures, TData>[] {
  return table.getPrePaginatedRowModel().rows.filter((row) => !row.getIsGrouped());
}

/**
 * Turns the table to the page that holds a row, so the row a preview steps onto is on screen in
 * the table too; nothing changes when the row is already on the current page. Returns whether the
 * row is among the displayed rows at all: `false` for a row the search, a filter or a folded
 * parent leaves out.
 */
export function showRow<TData extends RowData>(
  table: DataTableInstance<TData>,
  rowId: string,
): boolean {
  const index = displayedRows(table).findIndex((row) => row.id === rowId);
  if (index < 0) return false;
  const paged = table.options.meta?.pageSize !== undefined && !table.options.manualPagination;
  if (!paged) return true;
  const page = Math.floor(index / table.state.pagination.pageSize);
  if (page !== table.state.pagination.pageIndex) table.setPageIndex(page);
  return true;
}

/** The column helper bound to the kit's features, for a column the kinds do not cover. */
export const createDataTableColumnHelper = hook.createAppColumnHelper;
