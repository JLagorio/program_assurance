import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { idSet, readRows, useRows, type ReadContext, type Row } from "./models";

/**
 * Where a library component definition revision is used: the system components that apply its
 * components, their systems and those systems' programs. Each read asks for the rows the previous
 * one names, never a whole table. `undefined` while the components load keeps every read waiting.
 */
export function useLibraryComponentUses(definedComponentIds: readonly string[] | undefined) {
  const ids = useMemo(
    () => (definedComponentIds ? idSet(definedComponentIds) : undefined),
    [definedComponentIds],
  );
  const uses = useRows(
    "system_components",
    { defined_component_id: ids ?? [] },
    { enabled: ids !== undefined },
  );
  const systemIds = useMemo(() => idSet(uses.data?.map((use) => use.system_id)), [uses.data]);
  const systems = useRows(
    "systems",
    { id: systemIds },
    { columns: ["id", "name", "program_id"], enabled: uses.isSuccess },
  );
  const programIds = useMemo(
    () => idSet(systems.data?.map((system) => system.program_id)),
    [systems.data],
  );
  const programs = useRows(
    "programs",
    { id: programIds },
    { columns: ["id", "name"], enabled: systems.isSuccess },
  );
  return { uses, systems, programs, queries: [uses, systems, programs] };
}

const EVIDENCE_LINK_COLUMNS = [
  "id",
  "evidence_version_id",
  "implementation_statement_id",
  "component_contribution_id",
] as const;
type EvidenceLink = Pick<Row<"implementation_evidence">, (typeof EVIDENCE_LINK_COLUMNS)[number]>;

/**
 * The evidence links of some contributions: those linked to a contribution itself, and those
 * linked to the implementation statement it contributes to, each once.
 */
export async function readEvidenceLinks(
  client: Pick<SupabaseClient, "from">,
  context: ReadContext,
  { contributionIds, statementIds }: { contributionIds: string[]; statementIds: string[] },
  signal?: AbortSignal | undefined,
): Promise<EvidenceLink[]> {
  const read = (filters: Record<string, string[]>) =>
    readRows(
      client,
      context,
      "implementation_evidence",
      filters,
      { columns: EVIDENCE_LINK_COLUMNS },
      signal,
    ) as Promise<EvidenceLink[]>;
  const [byContribution, byStatement] = await Promise.all([
    read({ component_contribution_id: contributionIds }),
    read({ implementation_statement_id: statementIds }),
  ]);
  return [...new Map([...byContribution, ...byStatement].map((row) => [row.id, row])).values()];
}

/**
 * What a library component's uses trace to: their contributions to system plans, and then either
 * the requirement revisions those contributions implement (with their requirements' codes) or the
 * evidence versions linked to them or to their implementation statements (with their artifacts'
 * titles). Only the tab's `kind` loads past the contributions.
 */
export function useComponentTraceability(
  useIds: readonly string[] | undefined,
  kind: "Requirements" | "Evidence",
) {
  const workspace = useWorkspace();
  const ids = useMemo(() => (useIds ? idSet(useIds) : undefined), [useIds]);
  const contributions = useRows(
    "component_contributions",
    { system_component_id: ids ?? [] },
    {
      columns: ["id", "system_component_id", "implementation_statement_id"],
      enabled: ids !== undefined,
    },
  );
  const contributionIds = useMemo(
    () => idSet(contributions.data?.map((row) => row.id)),
    [contributions.data],
  );
  const statementIds = useMemo(
    () => idSet(contributions.data?.map((row) => row.implementation_statement_id)),
    [contributions.data],
  );
  const requirementLinks = useRows(
    "requirement_implementations",
    { component_contribution_id: contributionIds },
    {
      columns: ["id", "requirement_revision_id", "component_contribution_id"],
      enabled: kind === "Requirements" && contributions.isSuccess,
    },
  );
  const requirements = useRows(
    "requirement_revisions",
    { id: idSet(requirementLinks.data?.map((link) => link.requirement_revision_id)) },
    { enabled: kind === "Requirements" && requirementLinks.isSuccess },
  );
  const engineering = useRows(
    "engineering_requirements",
    { id: idSet(requirements.data?.map((row) => row.engineering_requirement_id)) },
    { columns: ["id", "code", "program_id"], enabled: requirements.isSuccess },
  );
  // Evidence links to a contribution, or to the implementation statement it contributes to.
  const evidenceLinks = useQuery<EvidenceLink[], Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "implementation_evidence",
      { contributions: contributionIds, statements: statementIds },
    ],
    enabled: kind === "Evidence" && contributions.isSuccess,
    retry: false,
    queryFn: async ({ signal }) =>
      readEvidenceLinks(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        { contributionIds, statementIds },
        signal,
      ),
  });
  const evidence = useRows(
    "evidence_versions",
    { id: idSet(evidenceLinks.data?.map((link) => link.evidence_version_id)) },
    { enabled: kind === "Evidence" && evidenceLinks.isSuccess },
  );
  const artifacts = useRows(
    "evidence_artifacts",
    { id: idSet(evidence.data?.map((version) => version.artifact_id)) },
    { columns: ["id", "title", "program_id"], enabled: evidence.isSuccess },
  );
  return {
    contributions,
    requirementLinks,
    requirements,
    engineering,
    evidenceLinks,
    evidence,
    artifacts,
  } satisfies Record<string, UseQueryResult<unknown[], Error>>;
}
