import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { invalidateModel, writeRow, type ReadContext, type Row } from "./models";

/*
 * Publish SSP N, the Controls part's Implementation view's primary: a draft SSP revision becomes
 * published, as the system record's Security plan revisions has always published one (a generic
 * edit of its State). One update at revision + 1 of the revision the reader saw, which Postgres
 * stamps with the moment it was published (stamp_record_lifecycle) and from then on refuses to
 * change; a revision changed since, or already published, is refused instead of overwritten. No
 * command makes the next draft: a change after publishing is a new SSP revision (Create SSP
 * revision), which copies nothing.
 */

type Client = Pick<SupabaseClient, "from">;

/** The SSP revision to publish, at the revision the reader saw. */
export type SspToPublish = { id: string; revision: number };

/** Publishes a draft SSP revision at the revision the reader saw. */
export async function publishSspRevision(
  client: Client,
  context: ReadContext,
  { id, revision }: SspToPublish,
): Promise<Row<"ssp_revisions">> {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error("Reload the SSP before publishing it.");
  return writeRow(client, context, "ssp_revisions", {
    id,
    revision,
    values: { state: "published" },
  });
}

/** Publish SSP N: the SSP's revisions and every read of them refresh once Postgres confirms it. */
export function usePublishSspRevision() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<"ssp_revisions">, Error, SspToPublish>({
    mutationFn: async (ssp) =>
      publishSspRevision(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        ssp,
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, "ssp_revisions"),
  });
}
