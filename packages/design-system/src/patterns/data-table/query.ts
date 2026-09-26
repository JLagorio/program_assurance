import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

/*
 * The reader's question of a table: what they searched for, how they sorted, what they filtered
 * and which page they were on. The view store keeps the layout (order, widths, visibility, pins,
 * density, page size); this keeps the question, so a register still asks it after the reader opens
 * a record and comes back. These helpers are pure and know no router: they turn a question into
 * flat string parameters and back, for a URL's search or a session's storage.
 */

/** The reader's question of a table. An absent slice is the author's default. */
export type TableQuery = {
  /** The search text, the table's global filter. */
  search?: string | undefined;
  /** The sort, first column first. */
  sorting?: SortingState | undefined;
  /** The column filters, as the table holds them. */
  filters?: ColumnFiltersState | undefined;
  /** The page, counted from 1. */
  page?: number | undefined;
};

/** A route's search as a router hands it over: a query string, `URLSearchParams`, or an object whose values are strings or values the router has already parsed. */
export type TableQuerySearch = string | URLSearchParams | Readonly<Record<string, unknown>>;

export type TableQueryParamOptions = {
  /** Put before every parameter name, so two tables on one route keep separate questions: `findings.` gives `findings.q`, `findings.sort`, `findings.filters` and `findings.page`. None unsaid. */
  prefix?: string | undefined;
};

/** A question's parameters. `undefined` removes one, so merging them over a route's search drops what the reader cleared. */
export type TableQueryParams = Record<string, string | undefined>;

/** Bounds on what a parsed question may hold; anything past them is dropped, never trusted. */
const LIMITS = { search: 500, sorts: 8, filters: 32, values: 100, id: 128, page: 100000 };

/** The parameter names a question uses, for a route that declares its search or clears it. */
export const tableQueryParamNames = ({ prefix = "" }: TableQueryParamOptions = {}) => ({
  search: `${prefix}q`,
  sort: `${prefix}sort`,
  filters: `${prefix}filters`,
  page: `${prefix}page`,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** A column id the parameters can carry: short, and without the comma that separates sorts. */
const validId = (id: unknown): id is string =>
  typeof id === "string" && id.length > 0 && id.length <= LIMITS.id && !id.includes(",");

type Scalar = string | number | boolean | null;
const isScalar = (value: unknown): value is Scalar =>
  value === null ||
  typeof value === "boolean" ||
  (typeof value === "string" && value.length <= LIMITS.search) ||
  (typeof value === "number" && Number.isFinite(value));

/**
 * A filter value the kinds understand, or `undefined` when it is not one: a scalar (equality), a
 * list (membership, or a range's two ends), or `{ contains }` (a substring). A range's open end is
 * `undefined` in the table and `null` in JSON; `toJson` says which way the list is going.
 */
function filterValue(value: unknown, toJson: boolean): { value: unknown } | undefined {
  if (isScalar(value)) return value === null ? undefined : { value };
  if (Array.isArray(value)) {
    const items = value.map((item: unknown) => (item === undefined ? null : item));
    if (items.length > LIMITS.values || !items.every(isScalar)) return undefined;
    return { value: toJson ? items : items.map((item) => (item === null ? undefined : item)) };
  }
  if (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    typeof value["contains"] === "string" &&
    value["contains"].length <= LIMITS.search
  )
    return { value: { contains: value["contains"] } };
  return undefined;
}

/**
 * The question as flat string parameters: `q` the search, `sort` the sorted column ids with `-`
 * before a descending one (`-due,name`), `filters` the column filters as one JSON object keyed by
 * column id, and `page` from 2 on. Every name is present, `undefined` for a slice the question
 * leaves at its default, so merging the result over a route's search removes stale ones. A slice
 * set to empty on purpose (filters cleared over a default) stays as an empty value, so it does not
 * come back as the default.
 */
export function tableQueryToSearch(
  query: TableQuery,
  options: TableQueryParamOptions = {},
): TableQueryParams {
  const key = tableQueryParamNames(options);
  const sorting = query.sorting?.filter((sort) => validId(sort.id)).slice(0, LIMITS.sorts);
  const filters = query.filters?.slice(0, LIMITS.filters).flatMap((filter) => {
    const encoded = validId(filter.id) ? filterValue(filter.value, true) : undefined;
    return encoded ? [[filter.id, encoded.value] as const] : [];
  });
  const page =
    query.page !== undefined && Number.isInteger(query.page) && query.page > 1
      ? Math.min(query.page, LIMITS.page)
      : undefined;
  return {
    [key.search]: query.search?.slice(0, LIMITS.search),
    [key.sort]: sorting?.map((sort) => `${sort.desc ? "-" : ""}${sort.id}`).join(","),
    [key.filters]: filters ? JSON.stringify(Object.fromEntries(filters)) : undefined,
    [key.page]: page === undefined ? undefined : String(page),
  };
}

/** Reads one parameter from any shape a router hands over; `null` when it is not there at all. */
function reader(search: TableQuerySearch): (name: string) => { value: unknown } | null {
  if (typeof search === "string" || search instanceof URLSearchParams) {
    const params =
      typeof search === "string" ? new URLSearchParams(search.replace(/^\?/, "")) : search;
    return (name) => (params.has(name) ? { value: params.get(name) } : null);
  }
  return (name) =>
    Object.prototype.hasOwnProperty.call(search, name) && search[name] !== undefined
      ? { value: search[name] }
      : null;
}

/** A parameter as text. A router that parses its search may hand over `?q=12` as a number or `?q=true` as a boolean; either is still the words the reader typed. */
const text = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : undefined;

function parseSorting(value: unknown): SortingState | undefined {
  const parts = Array.isArray(value) ? value.map(text) : text(value)?.split(",");
  if (!parts) return undefined;
  const sorting: SortingState = [];
  for (const part of parts.slice(0, LIMITS.sorts)) {
    if (!part) continue;
    const desc = part.startsWith("-");
    const id = desc ? part.slice(1) : part;
    if (validId(id) && !sorting.some((sort) => sort.id === id)) sorting.push({ id, desc });
  }
  return sorting;
}

function parseFilters(value: unknown): ColumnFiltersState | undefined {
  let object: unknown = value;
  if (typeof value === "string") {
    if (value === "") return [];
    try {
      object = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!isRecord(object)) return undefined;
  const filters: ColumnFiltersState = [];
  for (const [id, raw] of Object.entries(object).slice(0, LIMITS.filters)) {
    const decoded = validId(id) ? filterValue(raw, false) : undefined;
    if (decoded) filters.push({ id, value: decoded.value });
  }
  return filters;
}

function parsePage(value: unknown): number | undefined {
  const page = typeof value === "number" ? value : Number(text(value));
  return Number.isInteger(page) && page >= 1 && page <= LIMITS.page ? page : undefined;
}

/**
 * The question in a route's search, validated. A missing parameter leaves its slice at the
 * author's default; a malformed one is dropped rather than applied in part. Unknown columns are
 * kept here and dropped when the question is applied to a table, which knows its columns.
 */
export function tableQueryFromSearch(
  search: TableQuerySearch,
  options: TableQueryParamOptions = {},
): TableQuery {
  const key = tableQueryParamNames(options);
  const read = reader(search);
  const query: TableQuery = {};
  const q = read(key.search);
  const searchText = q ? text(q.value) : undefined;
  if (searchText !== undefined) query.search = searchText.slice(0, LIMITS.search);
  const sort = read(key.sort);
  const sorting = sort ? parseSorting(sort.value) : undefined;
  if (sorting) query.sorting = sorting;
  const filter = read(key.filters);
  const filters = filter ? parseFilters(filter.value) : undefined;
  if (filters) query.filters = filters;
  const pageParam = read(key.page);
  const page = pageParam ? parsePage(pageParam.value) : undefined;
  if (page !== undefined) query.page = page;
  return query;
}

/** The question as a query string without the `?`, for a link or a session's storage; empty when every slice is at its default. */
export function tableQueryToString(query: TableQuery, options: TableQueryParamOptions = {}) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(tableQueryToSearch(query, options)))
    if (value !== undefined) params.set(name, value);
  return params.toString();
}

/** Two questions ask the same thing. */
export const sameTableQuery = (a: TableQuery, b: TableQuery) =>
  tableQueryToString(a) === tableQueryToString(b);
