import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
const hitSchema = z.object({
  kind: z.enum(["program", "requirement", "control", "evidence", "citation", "risk", "finding"]),
  id: z.string().uuid(),
  identifier: z.string().nullable(),
  title: z.string(),
  excerpt: z.string(),
  href: z.string().startsWith("/"),
});
export type WorkspaceSearchHit = z.infer<typeof hitSchema>;
export async function searchWorkspace(
  client: SupabaseClient,
  context: { tenantId: string; token: string },
  query: string,
  signal?: AbortSignal,
) {
  const term = query.trim();
  if (term.length < 2) return [];
  if (term.length > 200) throw new Error("Search with at most 200 characters.");
  let request = client
    .rpc("search_assurance_records", { p_tenant_id: context.tenantId, p_query: term, p_limit: 50 })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return hitSchema.array().parse(data);
}
