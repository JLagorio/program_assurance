import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
};
export type TableName = keyof Models;
export type Row<T extends TableName> = Models[T]["Row"];
export type Insert<T extends TableName> = Models[T]["Insert"];
export type Update<T extends TableName> = Models[T]["Update"];
export type Filters = Record<string, string | number | boolean | null>;

function scopedQuery(workspace: Workspace, table: TableName, token: string, filters: Filters) {
  let request = database().from(table).select("*").setHeader("Authorization", `Bearer ${token}`);
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

/** Complete typed collections. Never expose a truncated first page as a portfolio total. */
export function useRows<T extends TableName>(
  table: T,
  filters: Filters = {},
  options: { enabled?: boolean } = {},
) {
  const workspace = useWorkspace();
  return useQuery<Row<T>[]>({
    queryKey: ["models", workspace.tenantId, table, filters],
    enabled: options.enabled ?? true,
    retry: false,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const rows: Row<T>[] = [];
      for (let offset = 0; offset < 100_000; offset += 1000) {
        const query = scopedQuery(workspace, table, token, filters);
        const { data, error } = await query
          .order(table === "tenant_memberships" ? "user_id" : "id")
          .range(offset, offset + 999)
          .abortSignal(signal);
        if (error) throw new Error(error.message);
        if (!Array.isArray(data))
          throw new Error("The database did not return the requested records.");
        rows.push(...(data as unknown as Row<T>[]));
        if (data.length < 1000) return rows;
      }
      throw new Error(
        "This collection is too large for this view. Narrow its scope before loading it.",
      );
    },
  });
}

export function useRow<T extends TableName>(table: T, id: string | undefined | null) {
  const workspace = useWorkspace();
  return useQuery<Row<T> | null>({
    queryKey: ["model", workspace.tenantId, table, id],
    enabled: !!id,
    retry: false,
    queryFn: async ({ signal }) => {
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
    onSuccess: async () => {
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
      await Promise.all(
        [...changed].flatMap((name) =>
          ["models", "model", "records", "record", "reference-options"].map((prefix) =>
            cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId, name] }),
          ),
        ),
      );
    },
  });
}
