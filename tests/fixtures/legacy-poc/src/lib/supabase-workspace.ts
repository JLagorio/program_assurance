import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  flushWorkspacePersistence,
  WorkspaceConflictError,
  type WorkspaceRepository,
} from "@/lib/workspace-storage";

export const usesSupabaseWorkspace = import.meta.env["VITE_DATA_BACKEND"] === "supabase";
let client: SupabaseClient | undefined;

/** Browser-only auth: server-rendered routes continue to use the bundled demo seed. */
export function getWorkspaceClient(): SupabaseClient {
  if (typeof window === "undefined")
    throw new Error("Workspace authentication requires a browser.");
  if (client) return client;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key)
    throw new Error(
      "Local Supabase is not configured. Run npm run local:start, then restart the app.",
    );
  client = createClient(url, key, {
    auth: { storageKey: "program-assurance.supabase.auth", detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)])
            : AbortSignal.timeout(20_000),
        }),
    },
  });
  return client;
}

const snapshotSchema = z.object({
  revision: z.number().int().nonnegative().safe(),
  values: z.record(z.string()),
});

export function supabaseWorkspaceRepository(ownerId: string): WorkspaceRepository {
  const supabase = getWorkspaceClient();
  async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user.id !== ownerId)
      throw new Error(
        "Your workspace session changed. Keep this tab open to preserve unsaved edits and sign back in with the same account.",
      );
    return data.session.access_token;
  }
  return {
    async load() {
      const token = await checkSession();
      const { data, error } = await supabase
        .from("workspace_snapshots")
        .select("revision, values")
        .eq("owner_id", ownerId)
        .maybeSingle()
        .setHeader("Authorization", `Bearer ${token}`);
      if (error) throw new Error(`Could not load the workspace: ${error.message}`);
      return data ? snapshotSchema.parse(data) : { revision: 0, values: {} };
    },
    async save(expectedRevision, values) {
      const token = await checkSession();
      const { data, error } = await supabase
        .rpc("save_workspace_snapshot", {
          expected_revision: expectedRevision,
          snapshot: values,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error?.code === "PT409") throw new WorkspaceConflictError();
      if (error) throw new Error(`Could not save the workspace: ${error.message}`);
      return z.number().int().positive().safe().parse(data);
    },
  };
}

// Auth clients and domain stores are page singletons. Restart them together after
// a code edit, once the old instance has saved its outstanding changes.
if (import.meta.hot && typeof window !== "undefined") {
  const flushBeforeReload =
    (import.meta.hot.data["flushWorkspacePersistence"] as (() => Promise<void>) | undefined) ??
    flushWorkspacePersistence;
  import.meta.hot.data["flushWorkspacePersistence"] = flushBeforeReload;
  import.meta.hot.accept(async () => {
    try {
      await flushBeforeReload();
      window.location.reload();
    } catch {
      // The old page retains its edits and shows the persistence error. Reload
      // manually after retrying or copying those edits.
    }
  });
}
