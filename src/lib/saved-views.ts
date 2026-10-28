import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workspace } from "./database";

const ids = z.array(z.string().min(1).max(150)).max(300);
export const savedViewDefinitionSchema = z
  .object({
    version: z.literal(1),
    kind: z.enum(["table", "workbook"]),
    destination: z
      .object({
        href: z
          .string()
          .max(4000)
          .refine(
            (href) =>
              /^\/(?!\/)[a-zA-Z0-9/_-]*(?:\?[^#\\]*)?$/.test(href) &&
              ![...href].some((character) => character.charCodeAt(0) < 32),
            "Use a workspace destination.",
          ),
      })
      .optional(),
    question: z.record(z.string(), z.unknown()),
    layout: z
      .object({
        order: ids.optional(),
        visibility: z.record(z.string(), z.boolean()).optional(),
        sizing: z.record(z.string(), z.number().min(1).max(10000)).optional(),
        pinning: z.object({ start: ids, end: ids }).optional(),
        wrap: ids.optional(),
        density: z.enum(["default", "compact"]).optional(),
        pageSize: z.number().int().min(1).max(1000).optional(),
      })
      .optional(),
  })
  .refine((value) => JSON.stringify(value).length <= 40000, "This view is too large to save.");
export type SavedViewDefinition = z.infer<typeof savedViewDefinitionSchema>;
export const savedViewSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  scope_key: z.string(),
  name: z.string(),
  visibility: z.enum(["private", "workspace"]),
  revision: z.number().int().positive(),
  definition: savedViewDefinitionSchema,
});
export type SavedView = z.infer<typeof savedViewSchema>;
type Context = Pick<Workspace, "tenantId" | "userId"> & { token: string };
export async function readSavedViews(client: SupabaseClient, context: Context, scope: string) {
  const { data, error } = await client
    .from("assurance_saved_views")
    .select("*")
    .eq("tenant_id", context.tenantId)
    .eq("scope_key", scope)
    .order("name")
    .limit(200)
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  const rows = z.array(z.unknown()).parse(data);
  const views: SavedView[] = [];
  let unsupportedCount = 0;
  for (const row of rows) {
    const parsed = savedViewSchema.safeParse(row);
    if (parsed.success) views.push(parsed.data);
    else unsupportedCount++;
  }
  return { views, unsupportedCount };
}
export async function saveNamedView(
  client: SupabaseClient,
  context: Context,
  input: {
    id: string;
    scope: string;
    name: string;
    visibility: "private" | "workspace";
    definition: SavedViewDefinition;
    revision?: number | undefined;
  },
) {
  const name = z.string().trim().min(1, "Name this view.").max(100).parse(input.name);
  const definition = savedViewDefinitionSchema.parse(input.definition);
  const { data, error } = await client
    .rpc("save_assurance_view", {
      p_tenant_id: context.tenantId,
      p_id: input.id,
      p_scope: input.scope,
      p_name: name,
      p_visibility: input.visibility,
      p_definition: definition,
      p_revision: input.revision ?? null,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return savedViewSchema.parse(data);
}
export async function deleteNamedView(client: SupabaseClient, context: Context, view: SavedView) {
  const { error } = await client
    .rpc("delete_assurance_view", {
      p_tenant_id: context.tenantId,
      p_id: view.id,
      p_revision: view.revision,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
}
