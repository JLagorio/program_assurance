import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { database, requireIdentity, type Workspace } from "./database";
import { collectionSchema, type Collection } from "./records";

type Client = Pick<SupabaseClient, "rpc">;

/**
 * The record schema: every collection a signed-in reader can open, with its columns, choices,
 * references and what the role may do with it. It describes the schema, not the tenant's rows, and
 * weighs a few hundred kilobytes, so it loads once, when a screen first needs it.
 */
export async function readSchemaCatalog(client: Client, token: string): Promise<Collection[]> {
  const { data, error } = await client
    .rpc("app_schema")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new Error(`The record schema could not be read. ${error.message}`);
  return z.array(collectionSchema).parse(data);
}

export const schemaCatalogKey = (tenantId: string) => ["schema-catalog", tenantId] as const;

/** One read per session: the schema only changes with a migration, which reloads the app. */
export function schemaCatalogOptions(workspace: Pick<Workspace, "tenantId" | "userId">) {
  return queryOptions({
    queryKey: schemaCatalogKey(workspace.tenantId),
    queryFn: async () => readSchemaCatalog(database(), await requireIdentity(workspace)),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
