import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { readRows, type ReadContext, type Row } from "./models";

type Client = Pick<SupabaseClient, "from">;

/** A resolved profile with how many controls it selects. */
export type ResolutionCount = Pick<
  Row<"profile_resolutions">,
  "id" | "profile_revision_id" | "resolved_at"
> & {
  /** The resolution's selected controls, counted by Postgres. */
  selections: number;
};

/** PostgREST counts an embedded collection without returning it: `selected_controls(count)`. */
const columns = ["id", "profile_revision_id", "resolved_at", "selected_controls(count)"];

/**
 * Every profile resolution the reader can see, each with how many controls it selects. The
 * selections are counted on the server: a register that shows the count never reads the rows,
 * which run to thousands per baseline.
 */
export async function readResolutionCounts(
  client: Client,
  context: ReadContext,
  signal?: AbortSignal | undefined,
): Promise<ResolutionCount[]> {
  const rows = (await readRows(
    client,
    context,
    "profile_resolutions",
    {},
    { columns },
    signal,
  )) as (Omit<ResolutionCount, "selections"> & {
    selected_controls?: readonly { count?: number | null }[] | null;
  })[];
  return rows.map(({ selected_controls: counted, ...row }) => ({
    ...row,
    selections: counted?.[0]?.count ?? 0,
  }));
}

/**
 * The profiles register's resolutions and their selection counts. Kept under the
 * `profile_resolutions` read key, so whatever refreshes the resolutions refreshes the counts.
 */
export function useResolutionCounts(): UseQueryResult<ResolutionCount[], Error> {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [
      "models",
      workspace.tenantId,
      "profile_resolutions",
      { counts: "selected_controls" },
    ],
    retry: false,
    queryFn: async ({ signal }) =>
      readResolutionCounts(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        signal,
      ),
  });
}
