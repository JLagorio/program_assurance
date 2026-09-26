import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity, type Workspace } from "./database";
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
type Models = Omit<Tables, "composition_nodes" | "composition_nodes_archive_20260913"> & {
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
export type TableName = keyof Models;
export type Row<T extends TableName> = Models[T]["Row"];
export type Insert<T extends TableName> = Models[T]["Insert"];
export type Update<T extends TableName> = Models[T]["Update"];
export type Filters = Record<string, string | number | boolean | null>;

type ReadOptions = {
  /** The columns to read, when a screen needs only some: PostgREST's `select`. Every column unsaid. */
  columns?: readonly string[] | undefined;
  /** Ask for the total too, so the remaining pages can load side by side. */
  count?: boolean | undefined;
};

function scopedQuery(
  workspace: Workspace,
  table: TableName,
  token: string,
  filters: Filters,
  { columns, count }: ReadOptions = {},
) {
  let request = database()
    .from(table)
    .select(columns?.length ? columns.join(",") : "*", count ? { count: "exact" } : undefined)
    .setHeader("Authorization", `Bearer ${token}`)
    // One retry owner: TanStack Query, which reads `retry: false` below. postgrest-js would retry a
    // 503 or a network failure three more times (1s, 2s, 4s) before the reader saw the failure.
    .retry(false);
  if (
    workspace.collections
      .find((collection) => collection.name === table)
      ?.columns.some((column) => column.name === "tenant_id")
  ) {
    request = request.or(`tenant_id.eq.${workspace.tenantId},tenant_id.is.null`);
  }
  for (const [column, value] of Object.entries(filters))
    request = value === null ? request.is(column, null) : request.eq(column, value);
  return request;
}

const PAGE = 1000;
const LIMIT = 100_000;
/** How many pages load at once after the first has told us the total. */
const PARALLEL_PAGES = 4;

export type RowsOptions = {
  enabled?: boolean | undefined;
  /** Keep the previous rows on screen while a new filter's rows load (a search, a scope). */
  keepPrevious?: boolean | undefined;
  /** The server's order, before the id that keeps paging stable: `{ column: "sequence_number" }`. */
  order?: { column: string; ascending?: boolean | undefined } | undefined;
};

/** Complete typed collections. Never expose a truncated first page as a portfolio total. */
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
  return useQuery<unknown[], Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      table,
      filters,
      ...(columns?.length || order ? [{ columns: columns ?? null, order: order ?? null }] : []),
    ],
    enabled: options.enabled ?? true,
    retry: false,
    ...(keepPrevious ? { placeholderData: keepPreviousData } : {}),
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const page = async (offset: number, count: boolean) => {
        let query = scopedQuery(workspace, table, token, filters, { columns, count });
        if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
        const {
          data,
          error,
          count: total,
        } = await query
          .order(table === "tenant_memberships" ? "user_id" : "id")
          .range(offset, offset + PAGE - 1)
          .abortSignal(signal);
        if (error) throw new Error(error.message);
        if (!Array.isArray(data))
          throw new Error("The database did not return the requested records.");
        return { rows: data as unknown[], total };
      };
      const tooLarge = () =>
        new Error(
          "This collection is too large for this view. Narrow its scope before loading it.",
        );
      // The first page brings the total, so the rest load side by side instead of one by one.
      const first = await page(0, true);
      if (first.rows.length < PAGE) return first.rows;
      const total = first.total ?? PAGE;
      if (total > LIMIT) throw tooLarge();
      const offsets: number[] = [];
      for (let offset = PAGE; offset < total; offset += PAGE) offsets.push(offset);
      const pages: unknown[][] = [first.rows];
      for (let index = 0; index < offsets.length; index += PARALLEL_PAGES) {
        const batch = await Promise.all(
          offsets.slice(index, index + PARALLEL_PAGES).map((offset) => page(offset, false)),
        );
        pages.push(...batch.map((result) => result.rows));
      }
      // Rows added while the pages loaded: keep reading until a short page, as before.
      let offset = PAGE * pages.length;
      while (pages[pages.length - 1]!.length === PAGE) {
        if (offset >= LIMIT) throw tooLarge();
        const next = await page(offset, false);
        pages.push(next.rows);
        offset += PAGE;
      }
      return pages.flat();
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
      const { data, error } = await scopedQuery(workspace, table, token, { id: id! })
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as unknown as Row<T> | null;
    },
  });
}

/** Mutations resolve only after Postgres confirms the write; RLS and CAS remain authoritative. */
export function useModelSave<T extends TableName>(table: T) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<
    Row<T>,
    Error,
    { values: Insert<T> | Update<T>; id?: string; revision?: number }
  >({
    mutationFn: async ({ values, id, revision }) => {
      const token = await requireIdentity(workspace);
      if (id && !Number.isSafeInteger(revision))
        throw new Error("Reload the record before saving; its revision is missing.");
      const tenantScoped = workspace.collections
        .find((collection) => collection.name === table)
        ?.columns.some((column) => column.name === "tenant_id");
      const insertPayload: Record<string, unknown> = {
        ...values,
        ...(tenantScoped ? { tenant_id: workspace.tenantId } : {}),
      };
      const request = id
        ? database()
            .from(table)
            .update({ ...values, revision: revision! + 1 })
            .eq("id", id)
            .eq("revision", revision!)
        : database().from(table).insert(insertPayload);
      const { data, error } = await request
        .select()
        .setHeader("Authorization", `Bearer ${token}`)
        .single();
      if (error?.code === "PT409" || error?.code === "PGRST116")
        throw new Error(
          "This record changed in another session. Your draft has not been saved; reload before trying again.",
        );
      if (error) throw new Error(error.message);
      return data as unknown as Row<T>;
    },
    // The save resolves when Postgres confirms the write, not when every list has refetched: the
    // surface closes at once, and the lists refresh behind it (a failed refresh is QueryState's).
    onSuccess: () => {
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
      for (const name of changed)
        for (const prefix of ["models", "model", "records", "record", "reference-options"])
          void cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId, name] });
    },
  });
}
