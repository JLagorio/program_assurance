import type { ColumnFiltersState, RowData, SortingState } from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useRef } from "react";

import {
  tableQueryFromSearch,
  tableQueryToSearch,
  tableQueryToString,
  type TableQuery,
  type TableQueryParams,
  type TableQuerySearch,
} from "./query";
import type { DataTableInstance } from "./use-data-table";

/*
 * Binds a table's question (search, sort, filters, page) to where it should outlive the register:
 * the URL, through the router the product already has, or this tab's session storage. The table
 * keeps owning its state; the hook restores the question once and writes every change after that.
 */

/** Where the question lives. */
export type TableQueryOptions =
  | {
      /** This tab's session storage, under `ledger.table.<key>.query`: the question survives opening a record and pressing Back, and ends with the tab. */
      storage: "session";
      /** The storage name. The table's `view` unsaid; with neither, nothing is kept. */
      key?: string | undefined;
    }
  | {
      /** The route's search now, as the router hands it over. The hook applies it when it changes, so Back and Forward restore the question. */
      search: TableQuerySearch;
      /** Called with the question's parameters when the reader changes it: merge them over the route's search and replace the entry (`undefined` removes a parameter). */
      onSearchChange: (params: TableQueryParams) => void;
      /** Put before every parameter name, for two tables on one route. */
      prefix?: string | undefined;
    };

/** The session storage key the hook uses for a table. */
export const tableQueryKey = (key: string) => `ledger.table.${key}.query`;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** How many written questions the hook remembers while a route has not given them back. */
const ECHOES = 20;

/** The question in a canonical form, so two that ask the same thing compare equal. */
const canonical = (query: TableQuery) => tableQueryToString(query);
const withoutPage = (query: TableQuery) => canonical({ ...query, page: undefined });

/**
 * The table's question as it stands, leaving out each slice at the author's default: a search
 * other than the initial one, a sort or filters other than `initialState`'s, and the page from 2
 * on while the table pages.
 */
export function readTableQuery<TData extends RowData>(table: DataTableInstance<TData>): TableQuery {
  const initial = table.initialState;
  const search = String(table.state.globalFilter ?? "");
  const sorting: SortingState = table.state.sorting;
  const filters: ColumnFiltersState = table.state.columnFilters;
  const page =
    table.options.meta?.pageSize === undefined ? 1 : table.state.pagination.pageIndex + 1;
  return {
    ...(search === String(initial.globalFilter ?? "") ? {} : { search }),
    ...(same(sorting, initial.sorting ?? []) ? {} : { sorting }),
    ...(same(filters, initial.columnFilters ?? []) ? {} : { filters }),
    ...(page > 1 ? { page } : {}),
  };
}

/**
 * Applies the question's search, sort and filters, each absent slice back to the author's default,
 * and returns what was applied: a column the table does not have, cannot sort or cannot filter is
 * dropped, and a table that sorts one column at a time takes the first sort only.
 */
function applyQuestion<TData extends RowData>(
  table: DataTableInstance<TData>,
  query: TableQuery,
): TableQuery {
  const initial = table.initialState;
  const column = (id: string) => table.getAllLeafColumns().find((c) => c.id === id);
  const sorts = query.sorting?.filter((sort) => column(sort.id)?.getCanSort());
  const sorting =
    sorts === undefined
      ? (initial.sorting ?? [])
      : table.options.enableMultiSort === false
        ? sorts.slice(0, 1)
        : sorts;
  const filters =
    query.filters?.filter((filter) => column(filter.id)?.getCanFilter()) ??
    initial.columnFilters ??
    [];
  const search = query.search ?? String(initial.globalFilter ?? "");
  if (!same(table.state.sorting, sorting)) table.setSorting(sorting);
  if (!same(table.state.columnFilters, filters)) table.setColumnFilters(filters);
  if (String(table.state.globalFilter ?? "") !== search) table.setGlobalFilter(search);
  return {
    ...(query.search === undefined ? {} : { search }),
    ...(sorts === undefined ? {} : { sorting }),
    ...(query.filters === undefined ? {} : { filters }),
    ...(query.page === undefined ? {} : { page: query.page }),
  };
}

const readSession = (key: string): TableQuery | null => {
  try {
    const raw = sessionStorage.getItem(tableQueryKey(key));
    return raw === null ? null : tableQueryFromSearch(raw);
  } catch {
    return null;
  }
};

const writeSession = (key: string, query: TableQuery) => {
  try {
    const value = canonical(query);
    if (value) sessionStorage.setItem(tableQueryKey(key), value);
    else sessionStorage.removeItem(tableQueryKey(key));
  } catch {
    // storage unavailable: the question lives for the page
  }
};

/**
 * Keeps a table's question (search, sort, filters, page) where it outlives the register, so a
 * reader who opens a record and comes back finds the register asking what they left it asking.
 * Pass `{ storage: "session" }` to keep it in this tab, or the route's `search` and
 * `onSearchChange` to keep it in the URL, where it can also be shared and bookmarked. Call it right
 * after `useDataTable`: the reader's layout (the view store) is restored first, then the question.
 * A restored page waits for its rows, then applies, so a page beyond the rows that arrive lands on
 * the last one.
 */
export function useTableQuery<TData extends RowData>(
  table: DataTableInstance<TData>,
  options: TableQueryOptions,
): void {
  const url = "search" in options;
  const prefix = url ? options.prefix : undefined;
  const key = url ? undefined : (options.key ?? table.options.meta?.view);
  // The URL's question in its canonical form, so the effect compares by value, not identity.
  const incoming = url ? canonical(tableQueryFromSearch(options.search, { prefix })) : null;
  const onSearchChange = useRef(url ? options.onSearchChange : undefined);
  useLayoutEffect(() => {
    onSearchChange.current = url ? options.onSearchChange : undefined;
  });
  // The question last applied or written, canonical, and whether the table has caught up with it.
  const written = useRef<string | null>(null);
  const settling = useRef(0);
  // Questions handed to `onSearchChange` that the route has not given back yet, oldest first. A
  // router that commits its search later (after its loaders, in a transition) can give back an
  // earlier one while the reader is still typing: that is an echo, not a question to apply.
  const echoes = useRef<string[]>([]);
  // A restored page, held until the rows it needs exist.
  const pendingPage = useRef<number | null>(null);
  const restored = useRef(false);

  // Restore: once per session key (nothing stored is the author's question), or whenever the URL's
  // question differs from the one last written, as after Back or Forward.
  useEffect(() => {
    if (incoming === null && !key) return;
    if (incoming !== null) {
      // The route has caught up with the last question written.
      if (incoming === written.current) {
        echoes.current = [];
        return;
      }
      // The route gives back an earlier question the reader has already moved past.
      const echo = echoes.current.indexOf(incoming);
      if (echo >= 0) {
        echoes.current = echoes.current.slice(echo + 1);
        return;
      }
    }
    // Back, Forward or a followed link: a question of its own, applied over the reader's.
    echoes.current = [];
    const query = incoming !== null ? tableQueryFromSearch(incoming) : (readSession(key!) ?? {});
    restored.current = true;
    const applied = applyQuestion(table, query);
    const paged = table.options.meta?.pageSize !== undefined;
    const page = applied.page ?? 1;
    pendingPage.current = paged && page - 1 !== table.state.pagination.pageIndex ? page : null;
    written.current = canonical(applied);
    // Until the table draws what was applied, its state is the one from before: do not write it.
    const now = readTableQuery(table);
    const shown = pendingPage.current === null ? now : { ...now, page: pendingPage.current };
    settling.current = canonical(shown) === written.current ? 0 : 2;
    // The table instance is stable; the question is compared by value.
  }, [incoming, key]);

  // A restored page applies once its rows exist, after the reset that a new sort, filter or data
  // makes to the first page.
  const rowCount = table.getPrePaginatedRowModel().rows.length;
  useEffect(() => {
    const page = pendingPage.current;
    if (page === null) return;
    const manual = Boolean(table.options.manualPagination);
    if (!manual && rowCount === 0) return;
    const timer = setTimeout(() => {
      if (pendingPage.current !== page) return;
      pendingPage.current = null;
      const last = manual ? Number.MAX_SAFE_INTEGER : Math.max(0, table.getPageCount() - 1);
      const index = Math.min(page - 1, last);
      if (table.state.pagination.pageIndex !== index) table.setPageIndex(index);
    }, 0);
    return () => clearTimeout(timer);
  });

  // Write every change the reader makes, once the table has caught up with what was restored.
  const { globalFilter, sorting, columnFilters, pagination } = table.state;
  useEffect(() => {
    if (!restored.current) return;
    const current = readTableQuery(table);
    const pending = pendingPage.current;
    const question = pending === null ? current : { ...current, page: pending };
    const next = canonical(question);
    if (settling.current > 0) {
      settling.current = next === written.current ? 0 : settling.current - 1;
      return;
    }
    if (next === written.current) return;
    // The reader asked something else: a page still waiting for its rows no longer applies.
    if (pending !== null && written.current !== null) {
      const before = tableQueryFromSearch(written.current);
      if (withoutPage(current) !== withoutPage(before)) pendingPage.current = null;
    }
    const settled = pendingPage.current === null ? current : question;
    written.current = canonical(settled);
    if (url) {
      echoes.current = [...echoes.current, written.current].slice(-ECHOES);
      onSearchChange.current?.(tableQueryToSearch(settled, { prefix }));
    } else if (key) writeSession(key, settled);
  }, [globalFilter, sorting, columnFilters, pagination.pageIndex, url, key, prefix]);
}
