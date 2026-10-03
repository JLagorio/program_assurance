import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { ReadContext } from "./models";

type Client = Pick<SupabaseClient, "rpc">;

/** What an element works from: its containing element's baseline, or a profile it adopts itself. */
export type BaselineSelection =
  | { mode: "inherit" }
  | {
      mode: "adopt";
      catalogRevisionId: string;
      profileResolutionId: string;
      /** The controls the element keeps, the profile's own or tailored. */
      controlIds: string[];
      rationale: string;
    };

export type AdoptSystemBaseline = {
  systemId: string;
  /** The system's revision the reader saw: a later one refuses the change. */
  expectedRevision: number;
  /** Chosen once per selection, so saving the same choice again applies it once. */
  requestId: string;
  selection: BaselineSelection;
};

export const BASELINE_CHANGED_ELSEWHERE =
  "This system changed in another session. Your choices are kept; close the dialog and open it again to load the current system.";

/**
 * Change the control baseline an element works from, through the `adopt_system_baseline`
 * command: inherit the containing element's, or adopt a published profile, tailored or not. The
 * element's descendants inherit the change in the same transaction.
 */
export async function adoptSystemBaseline(
  client: Client,
  { tenantId, token }: ReadContext,
  request: AdoptSystemBaseline,
): Promise<void> {
  const { error } = await client
    .rpc("adopt_system_baseline", {
      p_tenant_id: tenantId,
      p_system_id: request.systemId,
      p_expected_revision: request.expectedRevision,
      p_request_id: request.requestId,
      p_selection: request.selection,
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new Error(error.code === "PT409" ? BASELINE_CHANGED_ELSEWHERE : error.message);
}

/**
 * The baseline change as a mutation. It resolves once Postgres confirms; descendant inheritance
 * and every profile reader depend on it, so every workspace read refreshes behind the close.
 */
export function useAdoptSystemBaseline() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<void, Error, AdoptSystemBaseline>({
    mutationFn: async (request) =>
      adoptSystemBaseline(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () =>
      void Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((prefix) =>
          cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId] }),
        ),
      ),
  });
}
