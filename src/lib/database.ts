import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { collectionSchema, type Collection, type DataRecord, titleColumn } from "./records";

let instance: SupabaseClient | undefined;
export function database(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Sign in to load workspace records.");
  if (instance) return instance;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key)
    throw new Error(
      "Database connection is not configured. Run npm run local:start and restart the app.",
    );
  instance = createClient(url, key, {
    auth: { storageKey: "program-assurance.supabase.auth", detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)])
            : AbortSignal.timeout(30_000),
        }),
    },
  });
  return instance;
}
export type Workspace = {
  tenantId: string;
  name: string;
  email: string;
  userId: string;
  role: string;
  collections: Collection[];
};
export async function loadWorkspace(): Promise<Workspace | null> {
  const db = database();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) {
    const { data } = await db.auth.getSession();
    if (data.session && authError) throw new Error(authError.message);
    return null;
  }
  const { data: session } = await db.auth.getSession();
  if (session.session?.user.id !== auth.user.id)
    throw new Error("Your sign-in changed while opening the workspace. Retry the connection.");
  const authorization = `Bearer ${session.session.access_token}`;
  const { data: tenantId, error } = await db
    .rpc("ensure_personal_tenant")
    .setHeader("Authorization", authorization);
  if (error) throw new Error(`Could not open the workspace: ${error.message}`);
  const id = z.string().uuid().parse(tenantId);
  const [tenant, membership, schema] = await Promise.all([
    db
      .from("tenants")
      .select("name")
      .eq("id", id)
      .setHeader("Authorization", authorization)
      .single(),
    db
      .from("tenant_memberships")
      .select("role")
      .eq("tenant_id", id)
      .eq("user_id", auth.user.id)
      .setHeader("Authorization", authorization)
      .single(),
    db.rpc("app_schema").setHeader("Authorization", authorization),
  ]);
  for (const result of [tenant, membership, schema])
    if (result.error) throw new Error(result.error.message);
  const { data: current } = await db.auth.getSession();
  if (current.session?.user.id !== auth.user.id)
    throw new Error("Your sign-in changed while opening the workspace. Retry the connection.");
  return {
    tenantId: id,
    name: tenant.data!.name as string,
    email: auth.user.email ?? "",
    userId: auth.user.id,
    role: membership.data!.role as string,
    collections: z.array(collectionSchema).parse(schema.data),
  };
}
export async function requireIdentity(workspace: Workspace): Promise<string> {
  const { data, error } = await database().auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== workspace.userId)
    throw new Error("Your sign-in changed. Reload before editing this workspace.");
  return data.session.access_token;
}
export async function listRecords(
  workspace: Workspace,
  collection: Collection,
  options: {
    page?: number;
    search?: string;
    filter?: [string, string] | undefined;
    limit?: number;
  } = {},
) {
  const token = await requireIdentity(workspace);
  const limit = options.limit ?? 25;
  const page = options.page ?? 0;
  const title = titleColumn(collection);
  // Large OSCAL document bodies belong on the detail screen, not every list request.
  const listColumns = [
    ...new Set([
      "id",
      "revision",
      title,
      "code",
      "status",
      "state",
      "program_id",
      "system_id",
      "owner_party_id",
      "due_date",
      "updated_at",
    ]),
  ].filter((name) => collection.columns.some((column) => column.name === name));
  let query = database()
    .from(collection.name)
    .select(listColumns.join(","), { count: "exact" })
    .setHeader("Authorization", `Bearer ${token}`);
  // RLS is authoritative. Explicit scope keeps shared reference and tenant views predictable.
  if (collection.columns.some((column) => column.name === "tenant_id"))
    query = query.or(`tenant_id.eq.${workspace.tenantId},tenant_id.is.null`);
  if (options.filter) query = query.eq(options.filter[0], options.filter[1]);
  if (options.search?.trim()) {
    const term = options.search.replaceAll("%", "\\%").replaceAll("_", "\\_").trim();
    if (title !== "id") query = query.ilike(title, `%${term}%`);
    else {
      if (!z.string().uuid().safeParse(options.search.trim()).success)
        throw new Error("Enter a complete record ID to search this collection.");
      query = query.eq("id", options.search.trim());
    }
  }
  query = query.order(title, { ascending: true });
  if (title !== "id") query = query.order("id", { ascending: true });
  const { data, error, count } = await query.range(page * limit, (page + 1) * limit - 1);
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || count === null)
    throw new Error(
      "The database did not return the requested records and count. Retry the request.",
    );
  return { records: data as unknown as DataRecord[], count };
}
export async function getRecord(workspace: Workspace, collection: Collection, id: string) {
  const token = await requireIdentity(workspace);
  const { data, error } = await database()
    .from(collection.name)
    .select("*")
    .eq("id", id)
    .setHeader("Authorization", `Bearer ${token}`)
    .single();
  if (error)
    throw new Error(
      error.code === "PGRST116"
        ? "This record does not exist or is not accessible in your workspace."
        : error.message,
    );
  return data as DataRecord;
}
export async function saveRecord(
  workspace: Workspace,
  collection: Collection,
  payload: Record<string, unknown>,
  existing?: DataRecord,
): Promise<DataRecord> {
  const token = await requireIdentity(workspace);
  let query;
  if (existing) {
    if (!Number.isSafeInteger(existing.revision))
      throw new Error("This record is managed through its published revision workflow.");
    query = database()
      .from(collection.name)
      .update({ ...payload, revision: existing.revision! + 1 })
      .eq("id", existing.id)
      .eq("revision", existing.revision!);
  } else {
    query = database()
      .from(collection.name)
      .insert({
        ...payload,
        ...(collection.columns.some((column) => column.name === "tenant_id")
          ? { tenant_id: workspace.tenantId }
          : {}),
      });
  }
  const { data, error } = await query
    .select()
    .setHeader("Authorization", `Bearer ${token}`)
    .single();
  if (error) {
    if (error.code === "PT409" || error.code === "PGRST116")
      throw new Error(
        "This record changed in another session. Your draft is still here; reload the record before saving again.",
      );
    if (error.code === "23505")
      throw new Error("A record with this identifier or relationship already exists.");
    if (error.code === "23503")
      throw new Error("Choose existing related records from the same workspace.");
    throw new Error(error.message);
  }
  return data as DataRecord;
}

export async function deleteRecord(
  workspace: Workspace,
  collection: Collection,
  record: DataRecord,
): Promise<void> {
  const token = await requireIdentity(workspace);
  if (!Number.isSafeInteger(record.revision))
    throw new Error("This record cannot be deleted through this form.");
  const { error } = await database()
    .from(collection.name)
    .delete()
    .eq("id", record.id)
    .eq("revision", record.revision!)
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`)
    .single();
  if (error?.code === "23503")
    throw new Error(
      "Related records still reference this record. Remove those draft relationships first.",
    );
  if (error?.code === "PGRST116")
    throw new Error("This record changed in another session. Reload it before deleting.");
  if (error) throw new Error(error.message);
}
