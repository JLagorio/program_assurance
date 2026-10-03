import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
// PostgreSQL views do not expose their underlying NOT NULL/default constraints to
// type generation. This compatibility projection is guaranteed by canonical
// systems and its forwarding trigger; it does not introduce another data model.
type CompositionRow = Pick<
  Tables["systems"]["Row"],
  | "id"
  | "tenant_id"
  | "code"
  | "name"
  | "description"
  | "revision"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
> & { system_id: string; parent_id: string | null; node_type: string };
type CompositionInsert = Pick<
  CompositionRow,
  "tenant_id" | "system_id" | "code" | "name" | "node_type"
> &
  Partial<CompositionRow>;
type Schema = Omit<Tables, "composition_nodes" | "composition_nodes_archive_20260913"> & {
  composition_nodes: {
    Row: CompositionRow;
    Insert: CompositionInsert;
    Update: Partial<CompositionRow>;
  };
  system_effective_baselines: {
    Row: {
      id: string;
      system_id: string;
      tenant_id: string;
      boundary_system_id: string;
      profile_resolution_id: string | null;
      source_system_id: string | null;
      inherited: boolean;
      source_label: string;
    };
    Insert: never;
    Update: never;
  };
  system_component_element_links: {
    Row: {
      id: string;
      tenant_id: string;
      system_id: string;
      system_element_id: string | null;
      inventory_element_count: number;
      link_source: string;
    };
    Insert: never;
    Update: never;
  };
  profile_resolution_catalogs: {
    Row: {
      id: string;
      tenant_id: string | null;
      profile_resolution_id: string;
      profile_revision_id: string;
      catalog_revision_id: string;
      base_profile_resolution_id: string | null;
      root_profile_resolution_id: string;
      depth: number;
      layered: boolean;
    };
    Insert: never;
    Update: never;
  };
};
/**
 * Every table keeps a `tenant_id` except the tenants themselves and legacy stores the app never
 * reads. Those stores are not models, so no read can reach them and every other model is
 * workspace-scoped.
 */
type TenantFree = {
  [K in keyof Schema]: "tenant_id" extends keyof Schema[K]["Row"] ? never : K;
}[keyof Schema];
type Models = Omit<Schema, Exclude<TenantFree, "tenants">>;
export type TableName = keyof Models;
export type Row<T extends TableName> = Models[T]["Row"];
export type Insert<T extends TableName> = Models[T]["Insert"];
export type Update<T extends TableName> = Models[T]["Update"];
/** A column's value, `null` for "is empty", or a list of ids for "is one of" (PostgREST `in`). */
export type FilterValue = string | number | boolean | null | readonly string[];
/**
 * Equality filters by column. A key with dots filters through the record's references, which the
 * read joins on the server and leaves out of the rows: `{ "engineering_requirements.program_id":
 * programId }` reads a program's requirement revisions without their requirements.
 */
export type Filters = Record<string, FilterValue>;

type Client = Pick<SupabaseClient, "from">;
/** Who reads: the workspace the rows are scoped to and the session's access token. */
export type ReadContext = { tenantId: string; token: string };

/** The table keeps a `tenant_id`, so reads keep to the workspace and the shared reference rows. */
export function isTenantScoped(table: TableName): boolean {
  return table !== "tenants";
}

/** `select`: the columns asked for (every column unsaid), then an inner join per dotted filter. */
export function selectClause(columns: readonly string[] | undefined, filters: Filters = {}) {
  type Joins = Map<string, Joins>;
  const joins: Joins = new Map();
  for (const key of Object.keys(filters)) {
    const path = key.split(".").slice(0, -1);
    let level = joins;
    for (const table of path) {
      if (!level.has(table)) level.set(table, new Map());
      level = level.get(table)!;
    }
  }
  // An empty embed filters without returning anything: `engineering_requirements!inner()`.
  const render = (level: Joins): string[] =>
    [...level].map(([table, inner]) => `${table}!inner(${render(inner).join(",")})`);
  return [columns?.length ? columns.join(",") : "*", ...render(joins)].join(",");
}

/** One request's filters: the workspace, then each column's equality, emptiness or list. */
function scopedQuery(
  client: Client,
  context: ReadContext,
  table: TableName,
  filters: Filters,
  { columns, count }: { columns?: readonly string[] | undefined; count?: boolean | undefined } = {},
) {
  let request = client
    .from(table)
    .select(selectClause(columns, filters), count ? { count: "exact" } : undefined)
    .setHeader("Authorization", `Bearer ${context.token}`)
    // One retry owner: TanStack Query, whose reads set `retry: false`. postgrest-js would retry a
    // 503 or a network failure three more times (1s, 2s, 4s) before the reader saw the failure.
    .retry(false);
  if (isTenantScoped(table))
    request = request.or(`tenant_id.eq.${context.tenantId},tenant_id.is.null`);
  for (const [column, value] of Object.entries(filters))
    request =
      value === null
        ? request.is(column, null)
        : Array.isArray(value)
          ? request.in(column, value as string[])
          : request.eq(column, value as string | number | boolean);
  return request;
}

const PAGE = 1000;
const LIMIT = 100_000;
/** How many pages load at once after the first has told us the total. */
const PARALLEL_PAGES = 4;
/** How many ids one `in` filter sends, so a request's address stays short. */
const IN_CHUNK = 100;
/** A collection this long is worth scoping on the server; development says so in the console. */
export const LARGE_COLLECTION = 5000;

export type ReadOptions = {
  /** The columns to read, when a screen needs only some: PostgREST's `select`. Every column unsaid. */
  columns?: readonly string[] | undefined;
  /** The server's order, before the id that keeps paging stable: `{ column: "sequence_number" }`. */
  order?: { column: string; ascending?: boolean | undefined } | undefined;
};

/** Ids in one spelling, sorted and without repeats or empties: equal asks share a cache entry. */
export function idSet(ids: readonly (string | null | undefined)[] | undefined): string[] {
  return [...new Set((ids ?? []).filter((id): id is string => !!id))].sort();
}

/** The same filters in one spelling: each list sorted and without repeats, so equal reads share a key. */
export function normalizeFilters(filters: Filters = {}): Filters {
  return Object.fromEntries(
    Object.entries(filters).map(([column, value]) => [
      column,
      Array.isArray(value) ? [...new Set(value as string[])].sort() : value,
    ]),
  );
}

function tooLarge() {
  return new Error(
    "This collection is too large for this view. Narrow its scope before loading it.",
  );
}

/** Every row of one filtered read, a page at a time: the first page brings the total. */
async function readPages(
  client: Client,
  context: ReadContext,
  table: TableName,
  filters: Filters,
  { columns, order }: ReadOptions,
  signal: AbortSignal | undefined,
) {
  const page = async (offset: number, count: boolean) => {
    let query = scopedQuery(client, context, table, filters, { columns, count });
    if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
    query = query
      .order(table === "tenant_memberships" ? "user_id" : "id")
      .range(offset, offset + PAGE - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, error, count: total } = await query;
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error("The database did not return the requested records.");
    return { rows: data as unknown[], total };
  };
  const first = await page(0, true);
  if (first.rows.length < PAGE) return first.rows;
  const total = first.total ?? PAGE;
  if (total > LIMIT) throw tooLarge();
  if (total > LARGE_COLLECTION) largeCollection(table, total, filters);
  const offsets: number[] = [];
  for (let offset = PAGE; offset < total; offset += PAGE) offsets.push(offset);
  const pages: unknown[][] = [first.rows];
  for (let index = 0; index < offsets.length; index += PARALLEL_PAGES) {
    const batch = await Promise.all(
      offsets.slice(index, index + PARALLEL_PAGES).map((offset) => page(offset, false)),
    );
    pages.push(...batch.map((result) => result.rows));
  }
  // Rows added while the pages loaded: keep reading until a short page.
  let offset = PAGE * pages.length;
  while (pages[pages.length - 1]!.length === PAGE) {
    if (offset >= LIMIT) throw tooLarge();
    const next = await page(offset, false);
    pages.push(next.rows);
    offset += PAGE;
  }
  return pages.flat();
}

/** Development names every read that pages past a few thousand rows, so it gets a server scope. */
function largeCollection(table: string, total: number, filters: Filters) {
  if (!import.meta.env.DEV) return;
  const scope = Object.keys(filters).join(", ") || "no filter";
  console.warn(
    `useRows read ${total} ${table} rows (${scope}). Scope it on the server or read fewer columns.`,
  );
}

/**
 * Every row a filtered read matches, in id order, with only the columns asked for. A list filter
 * longer than a request carries is read in parts side by side, every such list split in turn; an
 * empty list matches nothing and sends no request. Row-level security stays authoritative; the
 * workspace scope keeps shared reference rows and tenant rows predictable.
 */
export async function readRows(
  client: Client,
  context: ReadContext,
  table: TableName,
  filters: Filters = {},
  options: ReadOptions = {},
  signal?: AbortSignal | undefined,
): Promise<unknown[]> {
  const rows = await readParts(client, context, table, normalizeFilters(filters), options, signal);
  if (rows.split && rows.found.length > LARGE_COLLECTION)
    largeCollection(table, rows.found.length, filters);
  return rows.found;
}

/** One read, or its parts when a list is too long for one request's address. */
async function readParts(
  client: Client,
  context: ReadContext,
  table: TableName,
  scoped: Filters,
  options: ReadOptions,
  signal: AbortSignal | undefined,
): Promise<{ found: unknown[]; split: boolean }> {
  const lists = Object.entries(scoped).filter((entry): entry is [string, string[]] =>
    Array.isArray(entry[1]),
  );
  if (lists.some(([, ids]) => ids.length === 0)) return { found: [], split: false };
  const longest = lists.sort((a, b) => b[1].length - a[1].length)[0];
  if (!longest || longest[1].length <= IN_CHUNK)
    return {
      found: await readPages(client, context, table, scoped, options, signal),
      split: false,
    };
  const [column, ids] = longest;
  const parts: string[][] = [];
  for (let offset = 0; offset < ids.length; offset += IN_CHUNK)
    parts.push(ids.slice(offset, offset + IN_CHUNK));
  const rows: unknown[][] = [];
  for (let index = 0; index < parts.length; index += PARALLEL_PAGES) {
    const batch = await Promise.all(
      parts
        .slice(index, index + PARALLEL_PAGES)
        .map((part) =>
          readParts(client, context, table, { ...scoped, [column]: part }, options, signal),
        ),
    );
    rows.push(...batch.map((part) => part.found));
  }
  // Each part is in order; together they are put back in the order one read would give.
  return { found: rows.flat().sort(readOrder(table, options.order)), split: true };
}

/** The order `readPages` asks the server for: the named column, then the key that keeps it stable. */
function readOrder(table: TableName, order: ReadOptions["order"]) {
  const key = table === "tenant_memberships" ? "user_id" : "id";
  const field = (row: unknown, column: string) => (row as Record<string, unknown>)[column];
  // Empty values sort last, as PostgreSQL puts them ascending (and first descending).
  const compare = (a: unknown, b: unknown) => {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
  };
  return (a: unknown, b: unknown) => {
    const difference = order
      ? compare(field(a, order.column), field(b, order.column)) *
        (order.ascending === false ? -1 : 1)
      : 0;
    return difference || compare(String(field(a, key) ?? ""), String(field(b, key) ?? ""));
  };
}

export type RowsOptions = {
  enabled?: boolean | undefined;
  /** Keep the previous rows on screen while a new filter's rows load (a search, a scope). */
  keepPrevious?: boolean | undefined;
  /** The server's order, before the id that keeps paging stable: `{ column: "sequence_number" }`. */
  order?: { column: string; ascending?: boolean | undefined } | undefined;
};

/**
 * Complete typed collections. Never expose a truncated first page as a portfolio total. Scope the
 * read on the server (a program, a system, a list of ids) and name the columns the screen uses:
 * a whole tenant-wide table is for small collections only.
 */
export function useRows<T extends TableName, K extends keyof Row<T> & string>(
  table: T,
  filters: Filters | undefined,
  options: RowsOptions & { columns: readonly K[] },
): UseQueryResult<Pick<Row<T>, K>[], Error>;
export function useRows<T extends TableName>(
  table: T,
  filters?: Filters,
  options?: RowsOptions,
): UseQueryResult<Row<T>[], Error>;
export function useRows(
  table: TableName,
  filters: Filters = {},
  options: RowsOptions & { columns?: readonly string[] } = {},
): UseQueryResult<unknown[], Error> {
  const workspace = useWorkspace();
  const { columns, order, keepPrevious } = options;
  const scoped = normalizeFilters(filters);
  return useQuery<unknown[], Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      table,
      scoped,
      ...(columns?.length || order ? [{ columns: columns ?? null, order: order ?? null }] : []),
    ],
    enabled: options.enabled ?? true,
    retry: false,
    ...(keepPrevious ? { placeholderData: keepPreviousData } : {}),
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      return readRows(
        database(),
        { tenantId: workspace.tenantId, token },
        table,
        scoped,
        { columns, order },
        signal,
      );
    },
  });
}

/** Every table's id is a uuid (the schema's `id uuid`); anything else cannot name a record. */
const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useRow<T extends TableName>(table: T, id: string | undefined | null) {
  const workspace = useWorkspace();
  return useQuery<Row<T> | null>({
    queryKey: ["model", workspace.tenantId, table, id],
    enabled: !!id,
    retry: false,
    queryFn: async ({ signal }) => {
      // A malformed address is a missing record, not a failed read: Postgres would reject it.
      if (!RECORD_ID.test(id!)) return null;
      const token = await requireIdentity(workspace);
      const { data, error } = await scopedQuery(
        database(),
        { tenantId: workspace.tenantId, token },
        table,
        { id: id! },
      )
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as unknown as Row<T> | null;
    },
  });
}

export type RowWrite<T extends TableName> = {
  values: Insert<T> | Update<T>;
  /** The record to update; a create leaves it out (or names its id inside `values`). */
  id?: string | undefined;
  /** The revision the reader edited: the update applies only while the record is still at it. */
  revision?: number | undefined;
};

export const CHANGED_ELSEWHERE =
  "This record changed in another session. Your draft has not been saved; reload before trying again.";

/**
 * One write, resolved once Postgres confirms it: an insert inside the workspace, or an update at
 * the revision the reader saw (a stale revision fails instead of overwriting). RLS stays
 * authoritative.
 */
export async function writeRow<T extends TableName>(
  client: Client,
  context: ReadContext,
  table: T,
  { values, id, revision }: RowWrite<T>,
): Promise<Row<T>> {
  if (id && !Number.isSafeInteger(revision))
    throw new Error("Reload the record before saving; its revision is missing.");
  const created: Record<string, unknown> = {
    ...values,
    ...(isTenantScoped(table) ? { tenant_id: context.tenantId } : {}),
  };
  const request = id
    ? client
        .from(table)
        .update({ ...values, revision: revision! + 1 })
        .eq("id", id)
        .eq("revision", revision!)
    : client.from(table).insert(created);
  const { data, error } = await request
    .select()
    .setHeader("Authorization", `Bearer ${context.token}`)
    .single();
  if (error?.code === "PT409" || error?.code === "PGRST116") throw new Error(CHANGED_ELSEWHERE);
  if (error) throw new Error(error.message);
  return data as unknown as Row<T>;
}

/** Every read a write to `table` can change, marked stale: its lists, rows, names and pickers. */
export function invalidateModel(cache: QueryClient, tenantId: string, table: TableName) {
  const changed = new Set<string>([table]);
  if (table === "systems") {
    changed.add("composition_nodes");
    changed.add("system_effective_baselines");
  }
  if (table === "composition_nodes") {
    changed.add("systems");
    changed.add("system_effective_baselines");
  }
  if (["system_components", "inventory_components", "inventory_items"].includes(table))
    changed.add("system_component_element_links");
  const reads = ["models", "model", "records", "record", "record-name", "reference-options"];
  return Promise.all(
    [...changed].flatMap((name) =>
      reads.map((prefix) => cache.invalidateQueries({ queryKey: [prefix, tenantId, name] })),
    ),
  );
}

/** Mutations resolve only after Postgres confirms the write; RLS and CAS remain authoritative. */
export function useModelSave<T extends TableName>(table: T) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<T>, Error, RowWrite<T>>({
    mutationFn: async (write) =>
      writeRow(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        table,
        write,
      ),
    // The save resolves when Postgres confirms the write, not when every list has refetched: the
    // surface closes at once, and the lists refresh behind it (a failed refresh is QueryState's).
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, table),
  });
}
