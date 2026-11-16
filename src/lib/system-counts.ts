import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * What the system tree counts of each element of a program and of everything inside it within its
 * authorization boundary: the controls its control baseline selects and the requirement revisions
 * allocated to it. `program_system_counts` counts them on the server in one request, so the record,
 * the tree and its preview read no allocation and no selection: every allocation of a program and
 * every control its baselines select run to thousands of rows.
 */

/** One element's counts, as `buildSystemAssuranceRows` takes them. */
export type SystemCounts = {
  systemId: string;
  /** The controls its control baseline selects; null without a baseline. */
  controlCount: number | null;
  /** The controls it and everything inside it select, each once; null where none has a baseline. */
  subtreeControlCount: number | null;
  /** The controls something inside it selects that it does not. */
  additionalChildControlCount: number;
  /** How many elements inside it have no control baseline. */
  unresolvedDescendantCount: number;
  /** The requirement revisions allocated to it, each once. */
  requirementCount: number;
  /** The requirement revisions allocated to it or anything inside it, each once. */
  subtreeRequirementCount: number;
};

const rowSchema = z.object({
  system_id: z.string(),
  control_count: z.number().nullable(),
  subtree_control_count: z.number().nullable(),
  additional_child_control_count: z.number(),
  unresolved_descendant_count: z.number(),
  requirement_count: z.number(),
  subtree_requirement_count: z.number(),
});

type Client = Pick<SupabaseClient, "rpc">;

/**
 * Every element of a program with its counts, as the reader may read the elements, their
 * allocations and their baselines' selections. A program the reader cannot read has no elements.
 */
export async function readProgramSystemCounts(
  client: Client,
  context: ReadContext,
  programId: string,
  signal?: AbortSignal | undefined,
): Promise<SystemCounts[]> {
  let request = client
    .rpc("program_system_counts", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return z
    .array(rowSchema)
    .parse(data)
    .map((row) => ({
      systemId: row.system_id,
      controlCount: row.control_count,
      subtreeControlCount: row.subtree_control_count,
      additionalChildControlCount: row.additional_child_control_count,
      unresolvedDescendantCount: row.unresolved_descendant_count,
      requirementCount: row.requirement_count,
      subtreeRequirementCount: row.subtree_requirement_count,
    }));
}

/**
 * What the counts derive from: a write to one of these models (an allocation, a baseline adopted
 * or tailored, an element moved, an SSP revision or a scope's adoption that pins a baseline) reads
 * them again.
 */
const COUNTED_FROM: readonly TableName[] = [
  "systems",
  "requirement_allocations",
  "selected_controls",
  "profile_resolutions",
  "ssp_revisions",
  "scopes",
  "scope_baselines",
];

/** A program's elements with their counts, read once for the record, the tree and the preview. */
export function useProgramSystemCounts(
  programId: string | null | undefined,
): UseQueryResult<SystemCounts[], Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, COUNTED_FROM, [
    "models",
    workspace.tenantId,
    "program_system_counts",
  ]);
  return useQuery<SystemCounts[], Error>({
    queryKey: ["models", workspace.tenantId, "program_system_counts", programId ?? null],
    enabled: !!programId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramSystemCounts(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId!,
        signal,
      ),
  });
}
