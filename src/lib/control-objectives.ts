import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * A control's assessment objectives, as a program's requirements cover them. A requirement maps a
 * whole control, or the objectives it meets, one mapping an objective. The objectives a control
 * counts are its leaves, the statements an assessor determines (AC-02a.[01]), and each heading that
 * prints a sentence of its own besides the objectives under it (PM-24, "a Data Integrity Board is
 * established"); a heading is above the objectives it holds, so a mapping that names it covers it
 * and every objective under it, and one that names no objective (the whole control, or a statement
 * or item of its text) covers them all. Where a program stands on the control counts them: it
 * leaves No requirement once every objective is covered, and No evidence once each is covered by a
 * requirement that cites evidence (`program_control_status`). `program_control_objectives` answers one control's
 * objectives in one request, as the reader, for its Map a requirement and its next step;
 * `control_objective_counts` counts one control's objectives in several programs at once, for the
 * catalog control's table; what a set of mappings covers, which the Map dialogs ask of the mappings
 * a requirement holds, is `coverageOf` in requirement-control-mappings.
 */

/** One of the program's requirements whose mapping covers an objective. */
export type ObjectiveRequirement = {
  id: string;
  code: string; // "REQ-001"
  /** Its latest revision cites evidence. */
  evidenced: boolean;
};

/** An objective a control counts, as the program stands on it. */
export type ControlObjective = {
  id: string;
  /** As SP 800-53A labels it: "AC-02a.[01]". */
  label: string | null;
  /** What the assessor determines, with the catalog's parameter insertions. */
  prose: string | null;
  /** The objectives above it, from the control's root down: a mapping naming one covers it. */
  ancestors: string[];
  /** A requirement of the program, at its latest revision, covers it. */
  mapped: boolean;
  /** One of those requirements cites evidence. */
  evidenced: boolean;
  /** The requirements that cover it, by code. */
  requirements: ObjectiveRequirement[];
};

export type ProgramControlObjectives = {
  programId: string;
  controlId: string;
  /** Every objective the control counts, in the catalog's reading order. None where it has none. */
  objectives: ControlObjective[];
};

const answerSchema = z.object({
  program_id: z.string(),
  control_id: z.string(),
  objectives: z.array(
    z.object({
      id: z.string(),
      label: z.string().nullable(),
      prose: z.string().nullable(),
      ancestors: z.array(z.string()),
      mapped: z.boolean(),
      evidenced: z.boolean(),
      requirements: z.array(z.object({ id: z.string(), code: z.string(), evidenced: z.boolean() })),
    }),
  ),
});

type Client = Pick<SupabaseClient, "rpc">;

/** One control's objectives and where the program stands on each, as the server reads them. */
export async function readProgramControlObjectives(
  client: Client,
  context: ReadContext,
  programId: string,
  controlId: string,
  signal?: AbortSignal,
): Promise<ProgramControlObjectives> {
  let request = client
    .rpc("program_control_objectives", { p_program_id: programId, p_control_id: controlId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = answerSchema.parse(data);
  return {
    programId: answer.program_id,
    controlId: answer.control_id,
    objectives: answer.objectives,
  };
}

/** What the coverage is read from: a write to one reads it again. */
const OBJECTIVE_MODELS = [
  "engineering_requirements",
  "requirement_revisions",
  "requirement_control_links",
  "requirement_evidence",
  "evidence_versions",
] as const satisfies readonly TableName[];

/** One control's objectives and where the program stands on each; nothing until both are named. */
export function useProgramControlObjectives(
  programId: string | null | undefined,
  controlId: string | null | undefined,
  options: { enabled?: boolean | undefined } = {},
): UseQueryResult<ProgramControlObjectives, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, OBJECTIVE_MODELS, [
    "models",
    workspace.tenantId,
    "program_control_objectives",
  ]);
  return useQuery<ProgramControlObjectives, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "program_control_objectives",
      programId ?? null,
      controlId ?? null,
    ],
    enabled: !!programId && !!controlId && (options.enabled ?? true),
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramControlObjectives(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId!,
        controlId!,
        signal,
      ),
  });
}

/** The objectives no requirement of the program covers yet, in reading order. */
export function unmappedObjectives(objectives: readonly ControlObjective[]): ControlObjective[] {
  return objectives.filter((objective) => !objective.mapped);
}

/* ——— One control in several programs ——————————————————————————————————————————————————————— */

/** How many of a control's objectives a program counts, and how many its requirements cover. */
export type ProgramObjectiveCount = {
  programId: string;
  /** The objectives the control counts; none for a control the catalog gives none. */
  objectives: number;
  /** Those the program's requirements cover, at their latest revision. */
  mapped: number;
  /** Those covered by one that cites evidence. */
  evidenced: number;
};

/** One control's objectives counted in each program asked for, by program. */
export type ControlObjectiveCounts = {
  controlId: string;
  programs: ReadonlyMap<string, ProgramObjectiveCount>;
};

const countsSchema = z.object({
  control_id: z.string(),
  programs: z.array(
    z.object({
      program_id: z.string(),
      objectives: z.number(),
      objectives_mapped: z.number(),
      objectives_evidenced: z.number(),
    }),
  ),
});

/**
 * One control's objectives counted in each of the programs named, in one request, as the reader:
 * the catalog control's table of the workspace's programs. A program the reader cannot read is
 * refused; none named asks nothing.
 */
export async function readControlObjectiveCounts(
  client: Client,
  context: ReadContext,
  controlId: string,
  programIds: readonly string[],
  signal?: AbortSignal,
): Promise<ControlObjectiveCounts> {
  if (programIds.length === 0) return { controlId, programs: new Map() };
  let request = client
    .rpc("control_objective_counts", { p_control_id: controlId, p_program_ids: [...programIds] })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = countsSchema.parse(data);
  return {
    controlId: answer.control_id,
    programs: new Map(
      answer.programs.map((program) => [
        program.program_id,
        {
          programId: program.program_id,
          objectives: program.objectives,
          mapped: program.objectives_mapped,
          evidenced: program.objectives_evidenced,
        },
      ]),
    ),
  };
}

/**
 * One control's objectives counted in each program asked for, once the control and the programs
 * are known (`enabled`); a write to what the coverage is read from reads it again, and the
 * control's counts on screen stay while another set of its programs is counted.
 */
export function useControlObjectiveCounts(
  controlId: string | null | undefined,
  programIds: readonly string[],
  options: { enabled?: boolean | undefined } = {},
): UseQueryResult<ControlObjectiveCounts, Error> {
  const workspace = useWorkspace();
  const ids = useMemo(() => [...new Set(programIds)].sort(), [programIds]);
  useStaleOnWrite(workspace.tenantId, OBJECTIVE_MODELS, [
    "models",
    workspace.tenantId,
    "control_objective_counts",
  ]);
  return useQuery<ControlObjectiveCounts, Error>({
    queryKey: ["models", workspace.tenantId, "control_objective_counts", controlId ?? null, ids],
    enabled: !!controlId && (options.enabled ?? true),
    retry: false,
    // Another control's counts never stand in for this one's.
    placeholderData: (previous) => (previous?.controlId === controlId ? previous : undefined),
    queryFn: async ({ signal }) =>
      readControlObjectiveCounts(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        controlId!,
        ids,
        signal,
      ),
  });
}
