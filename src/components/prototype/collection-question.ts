import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  tableQueryFromSearch,
  tableQueryKey,
  tableQueryParamNames,
  tableQueryToSearch,
  tableQueryToString,
  useDataTable,
  type DataTableInstance,
  type DataTableOptions,
  type FilterOption,
  type Preset,
  type TableQuery,
  type TableQueryParams,
} from "@ledger/design-system";
import {
  useServerCounts,
  useServerRows,
  type ServerPage,
  type ServerRead,
} from "@/lib/server-table";
import { setServerPaging } from "./record-preview";
import type { QueryStatus } from "./work-common";

/*
 * What a product collection shares with the screens around it: its page size, the address its
 * question lives in (ProductCollection's `keepQuestion`), so a link can open a register on a
 * question, and the server read a register that can hold thousands of rows pages through.
 */

/** The page size of a product collection that pages, unless its task needs another. */
export const collectionPageSize = 25;

/** Whether two lists of table rows hold the same values in the same order, one level deep. */
export function sameRows<T extends object>(before: readonly T[], after: readonly T[]) {
  return (
    before.length === after.length &&
    before.every((row, index) => {
      const next = after[index];
      if (!next) return false;
      const keys = Object.keys(row) as (keyof T)[];
      return (
        keys.length === Object.keys(next).length &&
        keys.every((key) => Object.is(row[key], next[key]))
      );
    })
  );
}

/**
 * `useDataTable` for a product collection: it pages at `collectionPageSize` unless the options
 * give another `pageSize` (or `undefined`, for a collection that does not page).
 *
 * The table keeps its page only while its rows keep their identity. A collection's question lives
 * in the address, so turning a page re-renders the route, and rows a caller derives from inline
 * columns are new on every render: rows whose values are unchanged stay the same rows.
 */
export function useCollectionTable<T extends { id: string }>(
  options: DataTableOptions<T>,
): DataTableInstance<T> {
  const shown = useRef<ReadonlyArray<T> | null>(null);
  const data = useMemo(() => {
    const previous = shown.current;
    if (previous && sameRows(previous, options.data)) return previous;
    shown.current = options.data;
    return options.data;
  }, [options.data]);
  return useDataTable<T>({ pageSize: collectionPageSize, ...options, data });
}

/** The prefix a collection's question takes in the address: its view or key, then a dot. */
export const questionPrefix = (key: string) => `${key}.`;

/**
 * A question's parameters as the router keeps them: the page a number and the filters one object,
 * so the address reads `page=2` and one JSON object rather than quoted strings. `undefined`
 * removes a parameter; an empty value (filters cleared over a default) stays.
 */
export function routerParams(params: TableQueryParams, prefix: string): Record<string, unknown> {
  const names = tableQueryParamNames({ prefix });
  return Object.fromEntries(
    Object.entries(params).map(([name, value]): [string, unknown] => {
      if (value === undefined || value === "") return [name, value];
      if (name === names.page) return [name, Number(value)];
      if (name === names.filters)
        try {
          return [name, JSON.parse(value) as unknown];
        } catch {
          return [name, value];
        }
      return [name, value];
    }),
  );
}

/**
 * The route search that opens a collection on a question: a Portfolio tile's or a heatmap cell's
 * link to the register filtered to what it counts. `view` is the collection's table `view` (or its
 * `keepQuestion` key); a slice the question leaves out is the collection's default.
 */
export function questionSearch(view: string, query: TableQuery): Record<string, unknown> {
  const prefix = questionPrefix(view);
  return Object.fromEntries(
    Object.entries(routerParams(tableQueryToSearch(query, { prefix }), prefix)).filter(
      ([, value]) => value !== undefined,
    ),
  );
}

/** The question this tab's session remembers for a collection, in its canonical form. */
export function rememberedQuestion(key: string) {
  try {
    return sessionStorage.getItem(tableQueryKey(key)) ?? "";
  } catch {
    return "";
  }
}

type Sorting = NonNullable<TableQuery["sorting"]>;
type ColumnFilters = NonNullable<TableQuery["filters"]>;
type Pagination = { pageIndex: number; pageSize: number };
/** A table's change to one slice of its state: the next value, or how to make it from the last. */
type Update<S> = S | ((previous: S) => S);
const applyUpdate = <S>(update: Update<S>, previous: S): S =>
  typeof update === "function" ? (update as (previous: S) => S)(previous) : update;

/** The question a server-paged collection asks, held by the collection so the read can see it. */
type Asked = { search: string; sorting: Sorting; filters: ColumnFilters; pagination: Pagination };

/** A table's `view` as the name ProductCollection keeps its question under. */
function viewKey(view: DataTableOptions<never>["view"]): string | undefined {
  if (typeof view === "string") return view;
  if (!view) return undefined;
  return view.scope ? `${view.scope}.${view.id}` : view.id;
}

/** The search, sort and filters of a question, in one spelling, to compare two by. */
const askedText = (asked: Pick<Asked, "search" | "sorting" | "filters">) =>
  tableQueryToString({ search: asked.search, sorting: asked.sorting, filters: asked.filters });

/**
 * What the address asks a collection, else what this tab's session remembers it asking, with the
 * author's default for each slice it leaves out; `null` for a collection that keeps no question.
 */
function keptQuestion(
  address: Record<string, unknown>,
  key: string | undefined,
  defaults: { sorting: Sorting; filters: ColumnFilters },
) {
  if (!key) return null;
  const prefix = questionPrefix(key);
  const inAddress = Object.values(tableQueryParamNames({ prefix })).some(
    (name) => Object.prototype.hasOwnProperty.call(address, name) && address[name] !== undefined,
  );
  const asked = inAddress
    ? tableQueryFromSearch(address, { prefix })
    : tableQueryFromSearch(rememberedQuestion(key));
  return {
    search: asked.search ?? "",
    sorting: asked.sorting ?? defaults.sorting,
    filters: asked.filters ?? defaults.filters,
    page: asked.page ?? 1,
  };
}

const NO_ROWS: never[] = [];
/** How long a search being typed waits for the typing to pause before the server is asked. */
const SEARCH_PAUSE = 200;

/** A scope still waiting for what it names: a list with nothing in it reads nothing. */
const scopeWaits = (scope: ServerRead["scope"]) =>
  Object.values(scope ?? {}).some((value) => Array.isArray(value) && value.length === 0);

export type ServerCollectionOptions<T extends { id: string }, R = T> = Omit<
  DataTableOptions<T>,
  "data" | "manual" | "rowCount"
> & {
  /** Wait for what the read is scoped to (an edition, a program) before reading. */
  enabled?: boolean | undefined;
  /** ProductCollection's `keepQuestion`, which the collection is drawn with: the table's `view` unsaid, `false` in a dialog, a sheet or a picker. */
  keepQuestion?: boolean | string | undefined;
  /**
   * The table's rows from the page's, the page's own unsaid: each record as the table draws it,
   * and a tree's parts in the row that holds them (`tree.children`). Every row of the page stays,
   * in the server's order: a row nests only under a row before it, so the tree read top-down is
   * the page as the server ordered it. Keep it stable (module level, or memoized).
   */
  rows?: ((page: R[], answer: { sorted: boolean }) => T[]) | undefined;
};

/** A tree's rows top-down, every part after the row that holds it: the order the server read. */
function topDown<T>(
  rows: readonly T[],
  children: ((row: T) => readonly T[] | undefined) | undefined,
): T[] {
  if (!children) return rows as T[];
  return rows.flatMap((row) => [row, ...topDown(children(row) ?? [], children)]);
}

/** A server-paged collection: spread it into ProductCollection beside the toolbar's parts. */
export type ServerCollection<T extends { id: string }> = {
  table: DataTableInstance<T>;
  /** The read, as ProductCollection's `queries`: a failed page keeps the page before it on screen. */
  queries: QueryStatus[];
  keepQuestion: boolean | string;
};

/**
 * A register that can hold thousands of rows, read a page at a time from the server: the table is
 * in manual mode (the server pages, sorts, filters and searches) with the server's count as its
 * `rowCount`, and its question (the search, sort, filters and page ProductCollection keeps in the
 * address) is the read's. The collection holds the question, so the first read already asks what
 * the address asks; a new search, sort or filter goes back to the first page. The page the reader
 * had stays on screen, busy, while the next one loads, and stays under the alert when it fails.
 *
 * The rows `useDisplayedRecords` gives for the table are its page, and know where the page stands
 * in the whole result, so `RecordPreviewActions` counts the whole result ("21 of 62") and a step
 * past the page's edge turns the page and shows its first or last row.
 *
 * A tree pages top-down: the read orders each part right after the row that holds it, and `rows`
 * nests the page's parts in the rows above them (the program's Requirements). Every row of the page
 * counts, a folded part too, so the position is the server's whatever the reader has folded.
 */
export function useServerCollection<T extends { id: string }, R = T>(
  read: ServerRead,
  { enabled, keepQuestion = true, rows: toRows, ...options }: ServerCollectionOptions<T, R>,
): ServerCollection<T> {
  const pageSize = options.pageSize ?? collectionPageSize;
  const key =
    keepQuestion === false
      ? undefined
      : typeof keepQuestion === "string"
        ? keepQuestion
        : viewKey(options.view);
  const defaults = useMemo(
    () => ({
      sorting: (options.initialState?.sorting ?? []) as Sorting,
      filters: (options.initialState?.columnFilters ?? []) as ColumnFilters,
    }),
    [options.initialState?.sorting, options.initialState?.columnFilters],
  );
  // The address of the page the collection is drawn on, as ProductCollection's keeper reads it.
  const address = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).search as Record<string, unknown>,
  });
  const kept = keptQuestion(address, key, defaults);
  const latestKept = useRef(kept);
  latestKept.current = kept;
  const [asked, setAsked] = useState<Asked>(() => ({
    search: kept?.search ?? "",
    sorting: kept?.sorting ?? defaults.sorting,
    filters: kept?.filters ?? defaults.filters,
    pagination: { pageIndex: (kept?.page ?? 1) - 1, pageSize },
  }));
  // A new search, sort or filter asks from the first page; the question the address holds (Back,
  // Forward, a followed link, which the keeper applies one slice at a time) asks from its own page.
  const askAgain = useCallback((change: (asked: Asked) => Asked) => {
    setAsked((previous) => {
      const next = change(previous);
      if (askedText(next) === askedText(previous)) return previous;
      const address = latestKept.current;
      const pageIndex = address && askedText(address) === askedText(next) ? address.page - 1 : 0;
      return { ...next, pagination: { ...next.pagination, pageIndex } };
    });
  }, []);
  // Another scope (an edition, a program) is another collection: it opens on its first page. A
  // scope that arrives after the read waited for it keeps the page the address asked for.
  const scope = { key: JSON.stringify(read.scope ?? {}), waits: scopeWaits(read.scope) };
  const [scopeShown, setScopeShown] = useState(scope);
  if (scope.key !== scopeShown.key) {
    setScopeShown(scope);
    if (!scope.waits && !scopeShown.waits && asked.pagination.pageIndex !== 0)
      setAsked((previous) => ({
        ...previous,
        pagination: { ...previous.pagination, pageIndex: 0 },
      }));
  }
  // The question the server is asked: as the reader asks it, except that a search being typed is
  // asked once the typing pauses, not at every key.
  const [reading, setReading] = useState(asked);
  const typing = reading !== asked && reading.search !== asked.search;
  if (reading !== asked && !typing) setReading(asked);
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setReading(asked), SEARCH_PAUSE);
    return () => clearTimeout(timer);
  }, [typing, asked]);
  const result = useServerRows<R>(
    read,
    {
      search: reading.search,
      sorting: reading.sorting,
      filters: reading.filters,
      pageIndex: reading.pagination.pageIndex,
      pageSize: reading.pagination.pageSize,
    },
    { enabled },
  );
  // The last page that loaded, kept on screen under the alert when the next one fails.
  const loaded = useRef<ServerPage<R> | undefined>(undefined);
  if (result.data && !result.isError) loaded.current = result.data;
  const page = result.data ?? (result.isError ? loaded.current : undefined);
  const data = useMemo(
    () =>
      !page
        ? (NO_ROWS as T[])
        : toRows
          ? toRows(page.rows, { sorted: page.sorted })
          : (page.rows as unknown as T[]),
    [page, toRows],
  );
  // Every row of the page in the server's order, a folded part too: where each stands in the result.
  const children = options.tree?.children;
  const order = useMemo(() => topDown(data, children), [data, children]);
  const table = useCollectionTable<T>({
    ...options,
    pageSize,
    data,
    rowCount: page?.count ?? 0,
    manual: { pagination: true, sorting: true, filtering: true },
    state: {
      ...options.state,
      globalFilter: asked.search,
      sorting: asked.sorting,
      columnFilters: asked.filters,
      pagination: asked.pagination,
    },
    onGlobalFilterChange: (update: Update<string>) =>
      askAgain((previous) => ({
        ...previous,
        search: String(applyUpdate(update, previous.search) ?? ""),
      })),
    onSortingChange: (update: Update<Sorting>) =>
      askAgain((previous) => ({ ...previous, sorting: applyUpdate(update, previous.sorting) })),
    onColumnFiltersChange: (update: Update<ColumnFilters>) =>
      askAgain((previous) => ({ ...previous, filters: applyUpdate(update, previous.filters) })),
    onPaginationChange: (update: Update<Pagination>) =>
      setAsked((previous) => {
        const pagination = applyUpdate(update, previous.pagination);
        return pagination.pageIndex === previous.pagination.pageIndex &&
          pagination.pageSize === previous.pagination.pageSize
          ? previous
          : { ...previous, pagination };
      }),
  });

  // A preview's step to a row on another page: the row it wants, by its place in the whole
  // result, shown once the page that holds it has loaded. Turning another page drops it.
  const [arrival, setArrival] = useState<{
    offset: number;
    pageIndex: number;
    select: (row: T) => void;
  } | null>(null);
  const latestTable = useRef(table);
  latestTable.current = table;
  const show = useCallback((offset: number, select: (row: never) => void) => {
    const current = latestTable.current;
    const pageIndex = Math.floor(offset / current.state.pagination.pageSize);
    setArrival({ offset, pageIndex, select: select as (row: T) => void });
    current.setPageIndex(pageIndex);
  }, []);
  // After the commit's other effects: the address takes the turned page (ProductCollection's
  // keeper, inside this collection) before the step selects its row, so a selection the address
  // keeps too (a preview's record) is written over the turned page, never over the one before. A
  // page read before and kept is read again first when a write has marked it stale, since its rows
  // may stand elsewhere now (an edited record moved): the step counts on the page as it is.
  useEffect(() => {
    if (!arrival) return;
    if (asked.pagination.pageIndex !== arrival.pageIndex) return setArrival(null);
    const arrived = result.data;
    if (
      !arrived ||
      result.isPlaceholderData ||
      result.isFetching ||
      arrived.pageIndex !== arrival.pageIndex
    )
      return;
    setArrival(null);
    const row = order[arrival.offset - arrived.pageIndex * arrived.pageSize];
    if (row) arrival.select(row);
  }, [
    arrival,
    result.data,
    result.isPlaceholderData,
    result.isFetching,
    asked.pagination.pageIndex,
    order,
  ]);
  setServerPaging(table, () =>
    page
      ? {
          offset: page.pageIndex * page.pageSize,
          count: page.count,
          result: page.result,
          show,
          rows: order,
          read,
          question: page.question,
          // The page on screen is not yet the one asked for (a page, a search, a sort on its way).
          settling: result.isPlaceholderData || result.isFetching,
        }
      : undefined,
  );

  const queries = useMemo<QueryStatus[]>(
    () => [
      {
        isPending: result.isPending,
        isError: result.isError,
        error: result.error,
        refetch: result.refetch,
        data: page,
        fetchStatus: result.fetchStatus,
        isFetching: result.isFetching,
        // A search being typed is on its way too: the rows shown are the last question's.
        isPlaceholderData: result.isPlaceholderData || typing,
      },
    ],
    [
      result.isPending,
      result.isError,
      result.error,
      result.refetch,
      page,
      result.fetchStatus,
      result.isFetching,
      result.isPlaceholderData,
      typing,
    ],
  );
  return { table, queries, keepQuestion };
}

/**
 * A server-filtered status column's choices, each value of its vocabulary in the vocabulary's
 * order: the server's rows are one page, so their values are not every value there is.
 */
export const vocabularyOptions = (vocabulary: Readonly<Record<string, unknown>>): FilterOption[] =>
  Object.keys(vocabulary).map((value) => ({ value }));

/**
 * A server-paged register's saved views' counts, for `DataTable.Presets`'s `counts`: each view
 * counted by the server over the whole register, as the table counts a client register's (before
 * the search). None shows until every count has loaded, rather than one page's.
 */
export function useServerPresetCounts(
  read: ServerRead,
  presets: readonly Preset[],
): Readonly<Record<string, number>> {
  const counts = useServerCounts(
    read,
    presets.map((preset) => ({ filters: preset.filters ?? [] })),
  );
  return counts.every((count) => count !== undefined)
    ? Object.fromEntries(presets.map((preset, index) => [preset.id, counts[index]!]))
    : {};
}
