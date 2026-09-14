import type { ColumnFiltersState, PaginationState, SortingState } from "@ledger/design-system";
import { useMemo } from "react";

/*
 * The URL owns a table's question: sort, page, search and filters. This binds those four slices of
 * a DataTable to a route's search params, so a link carries the question and the back button
 * answers it. The reader's layout (order, widths, pins) is not here; the kit keeps that in
 * localStorage under the table's view name.
 */

export type TableSearch = {
  sort?: string | undefined;
  dir?: "asc" | "desc" | undefined;
  page?: number | undefined;
  q?: string | undefined;
  filters?: Record<string, unknown> | undefined;
};

/** For a route's `validateSearch`: keeps what is well-formed and drops the rest. */
export function validateTableSearch(search: Record<string, unknown>): TableSearch {
  const out: TableSearch = {};
  if (typeof search["sort"] === "string" && search["sort"]) out.sort = search["sort"];
  if (search["dir"] === "asc" || search["dir"] === "desc") out.dir = search["dir"];
  const page = Number(search["page"]);
  if (Number.isInteger(page) && page > 1) out.page = page;
  if (typeof search["q"] === "string" && search["q"]) out.q = search["q"];
  const filters = search["filters"];
  if (filters && typeof filters === "object" && !Array.isArray(filters))
    out.filters = filters as Record<string, unknown>;
  return out;
}

type Updater<T> = T | ((old: T) => T);
const resolve = <T>(updater: Updater<T>, old: T): T =>
  typeof updater === "function" ? (updater as (old: T) => T)(old) : updater;

/**
 * The slices and their setters, for `useDataTable`. `setSearch` merges a patch into the route's
 * search (`navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })`). A value equal
 * to the default leaves the URL.
 */
export function useTableSearch(
  search: TableSearch,
  setSearch: (patch: Partial<TableSearch>) => void,
  {
    sort,
    dir = "asc",
    pageSize = 25,
  }: {
    sort?: string | undefined;
    dir?: "asc" | "desc" | undefined;
    pageSize?: number | undefined;
  } = {},
) {
  const sorting: SortingState = useMemo(() => {
    const id = search.sort ?? sort;
    return id ? [{ id, desc: (search.dir ?? dir) === "desc" }] : [];
  }, [search.sort, search.dir, sort, dir]);
  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: (search.page ?? 1) - 1, pageSize }),
    [search.page, pageSize],
  );
  const columnFilters: ColumnFiltersState = useMemo(
    () => Object.entries(search.filters ?? {}).map(([id, value]) => ({ id, value })),
    [search.filters],
  );
  const globalFilter = search.q ?? "";

  return {
    state: { sorting, pagination, columnFilters, globalFilter },
    onSortingChange: (u: Updater<SortingState>) => {
      const next = resolve(u, sorting)[0];
      const isDefault = !next || (next.id === sort && (next.desc ? "desc" : "asc") === dir);
      setSearch({
        sort: isDefault ? undefined : next?.id,
        dir: isDefault ? undefined : next?.desc ? "desc" : "asc",
        page: undefined,
      });
    },
    onPaginationChange: (u: Updater<PaginationState>) => {
      const next = resolve(u, pagination);
      setSearch({ page: next.pageIndex > 0 ? next.pageIndex + 1 : undefined });
    },
    onColumnFiltersChange: (u: Updater<ColumnFiltersState>) => {
      const next = resolve(u, columnFilters);
      const filters = Object.fromEntries(next.map((f) => [f.id, f.value]));
      setSearch({ filters: next.length ? filters : undefined, page: undefined });
    },
    onGlobalFilterChange: (u: Updater<string>) => {
      const next = resolve(u, globalFilter);
      setSearch({ q: next || undefined, page: undefined });
    },
  };
}
