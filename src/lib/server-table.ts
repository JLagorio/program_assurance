import { useEffect, useRef } from "react";
import {
  keepPreviousData,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import {
  normalizeFilters,
  selectClause,
  type Filters,
  type ReadContext,
  type TableName,
} from "./models";

/*
 * A register that can hold thousands of rows reads one page of them from the server: the server
 * pages, sorts, filters and searches, and counts the whole result. The question is the one a
 * register's table keeps (its search, sort, column filters and page), so the address that holds a
 * client register's question drives a server register's read the same way. Derived columns come
 * from a view that runs as the reader (`security_invoker`), never from joins on screen.
 */

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];
/** A table or a register's view. */
export type ServerSource = keyof Tables | keyof Views;
/** A source's row as the database describes it; a view's columns are all nullable to it. */
export type SourceRow<S extends ServerSource> = S extends keyof Tables
  ? Tables[S]["Row"]
  : S extends keyof Views
    ? Views[S]["Row"]
    : never;
/**
 * A row of a server read: the columns asked for, with `id` and the columns named in `Present`
 * never empty (a view's columns are nullable to the type generator even where the table's are not).
 */
export type ServerRow<
  S extends ServerSource,
  K extends keyof SourceRow<S> & string,
  Present extends K = never,
> = Omit<Pick<SourceRow<S>, K>, Present | "id"> & {
  [P in Present]: NonNullable<SourceRow<S>[P]>;
} & { id: string };

/** The reader's question, as a register's table keeps it. Structurally the kit's `TableQuery`. */
export type ServerQuestion = {
  search?: string | undefined;
  sorting?: readonly { id: string; desc: boolean }[] | undefined;
  filters?: readonly { id: string; value: unknown }[] | undefined;
  /** The page, counted from 0. */
  pageIndex: number;
  pageSize: number;
};

/** How the question reaches one of the table's columns, by the column's id. */
export type ServerField = {
  /** The source column it reads; the column's id unsaid. */
  column?: string | undefined;
  /** The column the server orders by when the reader sorts this one (`code_order` for a code); `false` when it cannot sort. The column unsaid. */
  sort?: string | false | undefined;
  /**
   * What a filter on it asks: `value` (the default) is one of the values chosen (`in`), equality,
   * or `{ contains }`; `list` is an array column holding any value chosen (`ov`); `range` is a
   * date or a number between `[from, to]`, either end open. `false` takes no filter.
   */
  filter?: "value" | "list" | "range" | false | undefined;
  /** The filter value that asks for rows with none: an empty list, or an empty value. */
  emptyLabel?: string | undefined;
  /** A status column's words, so the search finds a value by the label its badge shows. */
  labels?: Readonly<Record<string, { readonly label: string }>> | undefined;
};

/** One server-paged register's read. Write it with `serverRead`, which checks its columns. */
export type ServerRead = {
  /** The table, or the register's view, the rows come from. */
  source: ServerSource;
  /** The model the rows are records of, so a write to it marks every page stale: `cci_items` for `cci_item_rows`. The source unsaid. */
  model?: TableName | undefined;
  /** The other models a view derives the rows' columns from (a risk's latest assessment from `risk_revisions`): a write to one marks every page stale too. */
  models?: readonly TableName[] | undefined;
  /** The columns the register and its preview draw, `id` among them: never every column. */
  columns: readonly string[];
  /** What the read is scoped to before the reader asks anything: a program, an edition. An empty list reads nothing. */
  scope?: Filters | undefined;
  /** The text columns the search reads, each by substring, ignoring case. */
  search?: readonly string[] | undefined;
  /** The columns whose sort or filter is not their own column's plain value, by the table's column id. */
  fields?: Readonly<Record<string, ServerField>> | undefined;
  /** The order when the reader has chosen none; the id follows every order, so paging is stable. */
  order?: readonly { column: string; ascending?: boolean | undefined }[] | undefined;
};

/** A server read whose columns and search are checked against its source's columns. */
export function serverRead<S extends ServerSource, K extends keyof SourceRow<S> & string>(
  read: Omit<ServerRead, "source" | "columns" | "search"> & {
    source: S;
    columns: readonly K[];
    search?: readonly K[] | undefined;
  },
): ServerRead {
  return read;
}

/** One page of a server read and its place in the whole result. */
export type ServerPage<T> = {
  rows: T[];
  /** How many rows the whole result holds. */
  count: number;
  /** The page these rows are, counted from 0, at `pageSize` rows a page. */
  pageIndex: number;
  pageSize: number;
  /** The result the page is of (the source, scope, search, sort and filters) in one spelling: every page of one result shares it, so a row's place in it holds from page to page. */
  result: string;
  /** Whether the reader chose the order: else the rows are in the read's own (`order`). */
  sorted: boolean;
};

type Client = Pick<SupabaseClient, "from">;
/** postgrest-js's filter builder, as far as a read here uses it. */
type Request = ReturnType<ReturnType<Client["from"]>["select"]>;

const LIMITS = { pageSize: 500, search: 500 };

/** A LIKE pattern's own characters, matched as themselves. */
const likeEscape = (text: string) => text.replace(/[\\%_]/g, "\\$&");
/** A value inside a PostgREST logic tree (`or=(…)`), quoted so commas and brackets stay text. */
const quote = (value: string) => `"${value.replace(/[\\"]/g, "\\$&")}"`;
/** An array literal for `ov`, each member quoted. */
const arrayLiteral = (values: readonly string[]) => `{${values.map(quote).join(",")}}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const scalar = (value: unknown): value is string | number | boolean =>
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));

/** What a field reads and how, for a column id the read knows; `undefined` for one it does not. */
function fieldOf(read: ServerRead, id: string) {
  const field = read.fields?.[id];
  const column = field?.column ?? id;
  if (!field && !(read.columns as readonly string[]).includes(id)) return undefined;
  return { ...field, column };
}

/**
 * The question as the read applies it: the search trimmed, and only the sorts and filters on
 * columns the read knows, each filter with a value that asks something. Equal questions ask the
 * server the same thing, so they share one cache entry.
 */
export function serverQuestion(read: ServerRead, question: ServerQuestion) {
  const search = (question.search ?? "").trim().slice(0, LIMITS.search);
  const sorting = (question.sorting ?? []).filter((sort) => {
    const field = fieldOf(read, sort.id);
    return field !== undefined && field.sort !== false;
  });
  const filters = (question.filters ?? []).filter((filter) => {
    const field = fieldOf(read, filter.id);
    if (!field || field.filter === false) return false;
    const value = filter.value;
    if (Array.isArray(value))
      return field.filter === "range"
        ? value.some((end) => end !== undefined && end !== null && end !== "")
        : value.length > 0;
    if (isRecord(value)) return typeof value["contains"] === "string" && value["contains"] !== "";
    return value !== undefined && value !== null && value !== "";
  });
  const pageSize = Math.min(Math.max(1, Math.floor(question.pageSize)), LIMITS.pageSize);
  const pageIndex = Math.max(0, Math.floor(question.pageIndex));
  return { search, sorting, filters, pageIndex, pageSize };
}

/** The search as one `or` tree: a substring of any text column, or a status whose words hold it. */
function searchTree(read: ServerRead, search: string): string | undefined {
  if (!search) return undefined;
  const words = search.toLocaleLowerCase();
  const pattern = quote(`*${likeEscape(search)}*`);
  const branches = (read.search ?? []).map((column) => `${column}.ilike.${pattern}`);
  for (const [id, field] of Object.entries(read.fields ?? {})) {
    if (!field.labels) continue;
    const values = Object.entries(field.labels)
      .filter(([, definition]) => definition.label.toLocaleLowerCase().includes(words))
      .map(([value]) => value);
    if (values.length) branches.push(`${field.column ?? id}.in.(${values.map(quote).join(",")})`);
  }
  return branches.length ? branches.join(",") : undefined;
}

/** One column filter on the request. */
function applyFilter(
  request: Request,
  field: ServerField & { column: string },
  value: unknown,
): Request {
  const { column, emptyLabel } = field;
  if (field.filter === "range") {
    const [from, to] = Array.isArray(value) ? value : [];
    if (scalar(from) && from !== "") request = request.gte(column, from);
    if (scalar(to) && to !== "") request = request.lte(column, to);
    return request;
  }
  if (isRecord(value)) {
    const contains = String(value["contains"]);
    return field.filter === "list" ? request : request.ilike(column, `%${likeEscape(contains)}%`);
  }
  const chosen = (Array.isArray(value) ? value : [value]).filter(scalar).map(String);
  const none = emptyLabel !== undefined && chosen.includes(emptyLabel);
  const values = chosen.filter((item) => item !== emptyLabel);
  if (field.filter === "list") {
    if (none && values.length)
      return request.or(`${column}.ov.${arrayLiteral(values)},${column}.eq.{}`);
    if (none) return request.eq(column, "{}");
    return request.overlaps(column, values);
  }
  if (none && values.length)
    return request.or(`${column}.is.null,${column}.in.(${values.map(quote).join(",")})`);
  if (none) return request.is(column, null);
  if (values.length === 1 && !Array.isArray(value)) return request.eq(column, values[0]!);
  return request.in(column, values);
}

/** The scope's equality filters, as `useRows` applies them: `is` for empty, `in` for a list. */
function applyScope(request: Request, scope: Filters): Request {
  for (const [column, value] of Object.entries(scope))
    request =
      value === null
        ? request.is(column, null)
        : Array.isArray(value)
          ? request.in(column, value as string[])
          : request.eq(column, value as string | number | boolean);
  return request;
}

/** "An offset of 1000 was requested, but there are only 62 rows." */
const rowsInError = (details: unknown) => {
  const match = typeof details === "string" ? /only (\d+) rows?/.exec(details) : null;
  return match ? Number(match[1]) : undefined;
};

/** A scope with an empty list reads nothing. */
const scopeIsEmpty = (scope: Filters) =>
  Object.values(scope).some((value) => Array.isArray(value) && value.length === 0);

/** The request for a question's whole result, before its order and its page: rows, or the count alone. */
function resultRequest(
  client: Client,
  context: ReadContext,
  read: ServerRead,
  asked: ReturnType<typeof serverQuestion>,
  scope: Filters,
  head: boolean,
): Request {
  let request = client
    .from(read.source)
    .select(selectClause(head ? ["id"] : read.columns, scope), { count: "exact", head })
    .setHeader("Authorization", `Bearer ${context.token}`)
    // One retry owner: TanStack Query.
    .retry(false)
    .or(`tenant_id.eq.${context.tenantId},tenant_id.is.null`) as Request;
  request = applyScope(request, scope);
  const tree = searchTree(read, asked.search);
  if (tree) request = request.or(tree);
  for (const filter of asked.filters)
    request = applyFilter(request, fieldOf(read, filter.id)!, filter.value);
  return request;
}

/** How many rows a question finds, without reading them: a saved view's count. */
export async function readServerCount(
  client: Client,
  context: ReadContext,
  read: ServerRead,
  question: Omit<ServerQuestion, "pageIndex" | "pageSize">,
  signal?: AbortSignal | undefined,
): Promise<number> {
  const asked = serverQuestion(read, { ...question, pageIndex: 0, pageSize: 1 });
  const scope = normalizeFilters(read.scope);
  if (scopeIsEmpty(scope)) return 0;
  let request = resultRequest(client, context, read, asked, scope, true);
  if (signal) request = request.abortSignal(signal);
  const { error, count } = await request;
  if (error) throw new Error(error.message);
  if (count === null || count === undefined)
    throw new Error("The database did not return the requested count.");
  return count;
}

/**
 * One page of a register: the rows the question asks for, in its order, with the whole result's
 * count, in one request. A page past the last one is no rows and the count, so the table offers
 * its first page. RLS stays authoritative; the workspace scope keeps tenant and shared rows apart.
 */
export async function readServerPage(
  client: Client,
  context: ReadContext,
  read: ServerRead,
  question: ServerQuestion,
  signal?: AbortSignal | undefined,
): Promise<ServerPage<unknown>> {
  const asked = serverQuestion(read, question);
  const scope = normalizeFilters(read.scope);
  const page = {
    pageIndex: asked.pageIndex,
    pageSize: asked.pageSize,
    result: JSON.stringify([read.source, scope, asked.search, asked.sorting, asked.filters]),
    sorted: asked.sorting.length > 0,
  };
  if (scopeIsEmpty(scope)) return { rows: [], count: 0, ...page };
  const build = (head: boolean) => resultRequest(client, context, read, asked, scope, head);
  let request = build(false);
  // A reader's sort places empty values as a table sorts them itself: last ascending and first
  // descending, so a descending sort reads the ascending one backwards.
  for (const sort of asked.sorting) {
    const field = fieldOf(read, sort.id)!;
    request = request.order(field.sort || field.column, {
      ascending: !sort.desc,
      nullsFirst: sort.desc,
    });
  }
  if (!asked.sorting.length)
    for (const order of read.order ?? [])
      request = request.order(order.column, {
        ascending: order.ascending ?? true,
        nullsFirst: false,
      });
  const from = asked.pageIndex * asked.pageSize;
  let ranged = request.order("id").range(from, from + asked.pageSize - 1);
  if (signal) ranged = ranged.abortSignal(signal);
  const { data, error, count } = await ranged;
  if (error) {
    // The page asked for is past the last row (rows left the result): no rows, and the count.
    if (error.code === "PGRST103") {
      const known = rowsInError(error.details);
      if (known !== undefined) return { rows: [], count: known, ...page };
      let head = build(true);
      if (signal) head = head.abortSignal(signal);
      const total = await head;
      if (total.error) throw new Error(total.error.message);
      return { rows: [], count: total.count ?? 0, ...page };
    }
    throw new Error(error.message);
  }
  if (!Array.isArray(data) || count === null || count === undefined)
    throw new Error("The database did not return the requested records and count.");
  return { rows: data as unknown[], count, ...page };
}

/** How many rows an export of a register's whole result reads at most. */
const RESULT_LIMIT = 10_000;

/**
 * Every row of a register's result, in its order: what the reader's search, sort and filters
 * leave, read a page of the most rows a request takes at a time. For an export of what the
 * register holds, never for drawing it; a result past `limit` rows is refused, not cut short.
 */
export async function readServerResult(
  client: Client,
  context: ReadContext,
  read: ServerRead,
  question: Omit<ServerQuestion, "pageIndex" | "pageSize">,
  { limit = RESULT_LIMIT, signal }: { limit?: number | undefined; signal?: AbortSignal } = {},
): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let pageIndex = 0; ; pageIndex++) {
    const page = await readServerPage(
      client,
      context,
      read,
      { ...question, pageIndex, pageSize: LIMITS.pageSize },
      signal,
    );
    if (page.count > limit)
      throw new Error(
        `This result holds ${page.count} records, more than an export takes. Narrow it first.`,
      );
    rows.push(...page.rows);
    if (page.rows.length < page.pageSize || rows.length >= page.count) return rows;
  }
}

/** A register's whole result, read when it is asked for (an export): `read(question)`. */
export function useServerResult(read: ServerRead) {
  const workspace = useWorkspace();
  return async (question: Omit<ServerQuestion, "pageIndex" | "pageSize">) => {
    const token = await requireIdentity(workspace);
    return readServerResult(database(), { tenantId: workspace.tenantId, token }, read, question);
  };
}

/** A read in one spelling, for a query's key: equal reads share their pages. */
const readKey = (read: ServerRead) => ({
  source: read.source,
  columns: read.columns,
  scope: normalizeFilters(read.scope),
  search: read.search ?? null,
  fields: read.fields ?? null,
  order: read.order ?? null,
});

export type ServerRowsOptions = {
  /** Wait for what the read is scoped to (an edition, a program). */
  enabled?: boolean | undefined;
};

/**
 * One page of a register, read as the question changes. The page the reader had stays on screen
 * while the next one loads (TanStack's `placeholderData`), so a page, a search or a filter on its
 * way is busy, not empty. A write to the read's model marks every page of it stale.
 */
export function useServerRows<T>(
  read: ServerRead,
  question: ServerQuestion,
  options: ServerRowsOptions = {},
): UseQueryResult<ServerPage<T>, Error> {
  const workspace = useWorkspace();
  const asked = serverQuestion(read, question);
  useDerivedFrom(workspace.tenantId, read.models, read.model ?? read.source);
  return useQuery<ServerPage<T>, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      read.model ?? read.source,
      "page",
      readKey(read),
      asked,
    ],
    enabled: options.enabled ?? true,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      return (await readServerPage(
        database(),
        { tenantId: workspace.tenantId, token },
        read,
        asked,
        signal,
      )) as ServerPage<T>;
    },
  });
}

/**
 * How many rows each of several questions finds, without their rows: a register's saved views,
 * each counted over the whole register as the reader's question leaves aside its search. Each count
 * is `undefined` until it loads; a write to the read's models counts again.
 */
export function useServerCounts(
  read: ServerRead,
  questions: readonly Omit<ServerQuestion, "pageIndex" | "pageSize">[],
  options: ServerRowsOptions = {},
): (number | undefined)[] {
  const workspace = useWorkspace();
  useDerivedFrom(workspace.tenantId, read.models, read.model ?? read.source);
  const counts = useQueries({
    queries: questions.map((question) => {
      const asked = serverQuestion(read, { ...question, pageIndex: 0, pageSize: 1 });
      return {
        queryKey: [
          "models",
          workspace.tenantId,
          read.model ?? read.source,
          "page",
          readKey(read),
          { search: asked.search, sorting: [], filters: asked.filters, count: true },
        ],
        enabled: options.enabled ?? true,
        retry: false,
        placeholderData: keepPreviousData,
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const token = await requireIdentity(workspace);
          return readServerCount(
            database(),
            { tenantId: workspace.tenantId, token },
            read,
            asked,
            signal,
          );
        },
      };
    }),
  });
  return counts.map((count) => count.data);
}

/** A stamp each watch reads anew whenever a write marks its model stale. */
let watchStamp = 0;

/**
 * Marks every page of a register stale when a model its view derives from is written. A write
 * marks its own model's reads stale (`invalidateModel`), never another's: a quiet read of each
 * model the view derives from, which a write marks stale and reads again, passes the write on.
 */
function useDerivedFrom(tenantId: string, models: readonly TableName[] | undefined, own: string) {
  const cache = useQueryClient();
  const watches = useQueries({
    queries: (models ?? []).map((model) => ({
      queryKey: ["models", tenantId, model, "server-page-watch"],
      queryFn: () => ++watchStamp,
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    })),
  });
  const stamps = watches.every((watch) => watch.data !== undefined)
    ? watches.map((watch) => watch.data).join(",")
    : null;
  const seen = useRef(stamps);
  useEffect(() => {
    if (stamps === null) return;
    const before = seen.current;
    seen.current = stamps;
    if (before !== null && before !== stamps)
      void cache.invalidateQueries({ queryKey: ["models", tenantId, own, "page"] });
  }, [stamps, cache, tenantId, own]);
}
