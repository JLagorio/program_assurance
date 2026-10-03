import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { invalidateModel, type ReadContext, type Row } from "./models";
import { saveOnce } from "./save-once";

type Client = Pick<SupabaseClient, "from">;

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Write a comment before sending it.")
  .max(10000, "Use at most 10,000 characters in a comment.");

export type TaskComment = {
  /** Chosen once for the draft, so sending it again after a lost response finds the first try. */
  id: string;
  taskId: string;
  body: string;
};

export const NO_AUTHOR =
  "Your account has no person in this workspace, so the comment has no author. Ask a workspace administrator to add you.";

/**
 * Posts a comment on a task as the signed-in reader: the author is the person the workspace
 * records for their account, never a choice. It is safe to send again after an uncertain failure:
 * the comment keeps the id its draft chose, and a first try that landed is found, not repeated.
 */
export async function postTaskComment(
  client: Client,
  context: ReadContext & { userId: string },
  comment: TaskComment,
): Promise<Row<"comments">> {
  const parsed = commentBodySchema.safeParse(comment.body);
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message ?? "Write a comment before sending it.");
  const { data: author, error } = await client
    .from("parties")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .eq("auth_user_id", context.userId)
    .setHeader("Authorization", `Bearer ${context.token}`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const authorId = (author as { id: string } | null)?.id;
  if (!authorId) throw new Error(NO_AUTHOR);
  const { record } = await saveOnce(client, context, {
    table: "comments",
    id: comment.id,
    values: { task_id: comment.taskId, author_party_id: authorId, body: parsed.data },
  });
  return record;
}

/**
 * The task record's Comments composer posts through this. It resolves once Postgres confirms the
 * comment and the task's comments have been read again, so the comment is in the feed as the
 * composer clears; a failed read again leaves the feed's own alert to say so.
 */
export function usePostTaskComment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<"comments">, Error, TaskComment>({
    mutationFn: async (comment) =>
      postTaskComment(
        database(),
        {
          tenantId: workspace.tenantId,
          userId: workspace.userId,
          token: await requireIdentity(workspace),
        },
        comment,
      ),
    onSuccess: () => invalidateModel(cache, workspace.tenantId, "comments"),
  });
}
