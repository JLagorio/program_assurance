import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reviewTargetSchema, reviewTargetHref } from "./assurance-review";
export const attentionItemSchema = z.object({
  tenant_id: z.string().uuid(),
  item_key: z.string(),
  source_revision: z.string(),
  kind: z.enum(["review", "task", "mapping", "evidence"]),
  title: z.string(),
  reason: z.string(),
  target: z.union([
    reviewTargetSchema,
    z.object({ kind: z.literal("task"), recordId: z.string().uuid() }),
  ]),
  program_id: z.string().uuid().nullable(),
  updated_at: z.string(),
  state: z.enum(["seen", "done"]).nullable(),
  ack_version: z.number().int().nonnegative().safe(),
});
export type AttentionItem = z.infer<typeof attentionItemSchema>;
export type AttentionFilter = "open" | "unread" | "done" | "all";
export const attentionPageSchema = z.object({
  count: z.number().int().nonnegative(),
  rows: attentionItemSchema.array(),
});
type Context = { tenantId: string; userId: string; token: string };
export async function readAttention(
  client: SupabaseClient,
  context: Context,
  filter: AttentionFilter,
  page: number,
) {
  const { data, error } = await client
    .rpc("read_assurance_attention", {
      p_tenant_id: context.tenantId,
      p_state: filter,
      p_offset: page * 25,
      p_limit: 25,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return attentionPageSchema.parse(data);
}
export type AttentionState = AttentionItem["state"];
export const attentionCommandSchema = z
  .object({
    itemKey: z.string().min(1).max(200),
    sourceRevision: z.string().min(1).max(300),
    expectedVersion: z.number().int().nonnegative().safe(),
    operation: z.enum(["observe", "set-state"]),
    state: z.enum(["seen", "done"]).nullable(),
  })
  .strict()
  .refine((command) => command.operation !== "observe" || command.state === "seen", {
    message: "Observing an attention item can only mark it seen.",
  });
export type AttentionIntent = {
  requestId: string;
  tenantId: string;
  userId: string;
  command: z.infer<typeof attentionCommandSchema>;
};
const attentionResultSchema = z.object({
  state: z.enum(["seen", "done"]).nullable(),
  version: z.number().int().nonnegative().safe(),
  previousState: z.enum(["seen", "done"]).nullable(),
  changed: z.boolean(),
});
export class AttentionConflict extends Error {}
/** Capture this immutable intent once, retaining its request ID across uncertain retries. */
export function createAttentionIntent(
  context: Pick<Context, "tenantId" | "userId">,
  item: AttentionItem,
  state: AttentionState,
  operation: "observe" | "set-state" = "set-state",
): AttentionIntent {
  if (item.tenant_id !== context.tenantId)
    throw new Error("This item belongs to a different workspace.");
  return {
    requestId: crypto.randomUUID(),
    tenantId: context.tenantId,
    userId: context.userId,
    command: attentionCommandSchema.parse({
      itemKey: item.item_key,
      sourceRevision: item.source_revision,
      expectedVersion: item.ack_version,
      operation,
      state,
    }),
  };
}
/** The server derives the actor and guards the exact source revision and acknowledgment version. */
export async function acknowledgeAttention(
  client: SupabaseClient,
  context: Context,
  intent: AttentionIntent,
) {
  if (intent.tenantId !== context.tenantId || intent.userId !== context.userId)
    throw new Error("This acknowledgment belongs to a different workspace or reader.");
  const { data, error } = await client
    .rpc("command_assurance_attention", {
      p_tenant_id: context.tenantId,
      p_request_id: z.string().uuid().parse(intent.requestId),
      p_command: attentionCommandSchema.parse(intent.command),
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) {
    if (error.code === "PT409") throw new AttentionConflict(error.message);
    throw new Error(error.message);
  }
  return attentionResultSchema.parse(data);
}
export function attentionHref(item: AttentionItem) {
  return item.target.kind === "task"
    ? `/tasks/${item.target.recordId}`
    : reviewTargetHref(item.target, item.program_id);
}
