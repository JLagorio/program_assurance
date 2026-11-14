import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
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
 * or item of its text) covers them all.
 *
 * Every system counts. A control is counted on each system of the program whose control baseline
 * selects it (its authorization boundaries, the systems that hold an SSP; an element counts inside
 * its boundary), and an objective is covered only once it is covered on every one of them; where
 * no system selects the control, any mapping covers it. A mapping counts on the system it names, or
 * on every system where it names none. Where a program stands on the control counts them: it leaves
 * No requirement once every objective is covered on every system, and No evidence once each is
 * covered on every one by a requirement that cites evidence (`program_control_status`).
 * `program_control_objectives` answers one control's objectives and systems in one request, as the
 * reader, for its Map a requirement and its next step; `control_objective_counts` counts one
 * control's objectives in several programs at once (mapped, with evidence and judged by the
 * program's assessors, as the status counts them), for the catalog control's table; what a set of
 * mappings covers, which the Map dialogs ask of the mappings a requirement holds, is `coverageOf`
 * in requirement-control-mappings.
 */

/** An objective a control counts, as the program stands on it. */
export type ControlObjective = {
  id: string;
  /** As SP 800-53A labels it: "AC-02a.[01]". */
  label: string | null;
  /** What the assessor determines, with the catalog's parameter insertions. */
  prose: string | null;
  /** The objectives above it, from the control's root down: a mapping naming one covers it. */
  ancestors: string[];
  /**
   * Covered on every system that selects the control by a requirement of the program, at its
   * latest revision; by any of them, where no system selects it.
   */
  mapped: boolean;
  /** Covered on every one of them by a requirement that cites evidence. */
  evidenced: boolean;
  /** The systems that select the control it is covered on, by id; none where none selects it. */
  mappedOn: string[];
};

/**
 * A system of the program whose control baseline selects the control, as the control is counted on
 * it: one of the program's authorization boundaries, with what is covered there.
 */
export type ControlSystem = {
  id: string;
  code: string; // "R210-STD-CUSA"
  name: string;
  /** Every objective is covered there (the control itself, for one that counts no objective). */
  mapped: boolean;
  /** Every one is covered there by a requirement that cites evidence. */
  evidenced: boolean;
  /** The objectives covered there, and those covered by a requirement that cites evidence. */
  objectivesMapped: number;
  objectivesEvidenced: number;
  /**
   * The program's requirements whose latest revision is allocated there (to it, or to a system
   * inside it whose control baseline selects the control): the requirements a mapping on it can be
   * recorded for. None, and the step allocates one first.
   */
  allocated: number;
};

/** One of the program's requirements whose mapping covers the control where it is counted. */
export type CoveringRequirement = {
  id: string;
  code: string; // "REQ-001"
  /** Its latest revision cites evidence. */
  evidenced: boolean;
  /**
   * It cites none and covers an objective on a system where no requirement that cites evidence
   * covers it: evidence linked to it moves the control.
   */
  owes: boolean;
};

export type ProgramControlObjectives = {
  programId: string;
  controlId: string;
  /** Every objective the control counts, in the catalog's reading order. None where it has none. */
  objectives: ControlObjective[];
  /** The systems that select the control, in code order. None where none does. */
  systems: ControlSystem[];
  /** The requirements that cover the control where it is counted, in code order. */
  requirements: CoveringRequirement[];
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
      mapped_on: z.array(z.string()),
    }),
  ),
  systems: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      mapped: z.boolean(),
      evidenced: z.boolean(),
      objectives_mapped: z.number(),
      objectives_evidenced: z.number(),
      allocated: z.number(),
    }),
  ),
  requirements: z.array(
    z.object({ id: z.string(), code: z.string(), evidenced: z.boolean(), owes: z.boolean() }),
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
    objectives: answer.objectives.map(({ mapped_on, ...objective }) => ({
      ...objective,
      mappedOn: mapped_on,
    })),
    systems: answer.systems.map((system) => ({
      id: system.id,
      code: system.code,
      name: system.name,
      mapped: system.mapped,
      evidenced: system.evidenced,
      objectivesMapped: system.objectives_mapped,
      objectivesEvidenced: system.objectives_evidenced,
      allocated: system.allocated,
    })),
    requirements: answer.requirements,
  };
}

/**
 * What the coverage is read from: a write to one reads it again. The systems a control is counted
 * on follow their baselines (an SSP's, or one a system adopts), and how many requirements are
 * allocated on each follows the allocations.
 */
const OBJECTIVE_MODELS = [
  "engineering_requirements",
  "requirement_revisions",
  "requirement_control_links",
  "requirement_evidence",
  "evidence_versions",
  "requirement_allocations",
  "systems",
  "ssp_revisions",
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

// Where an objective stands system by system, as the steps read it: pure, beside what mappings cover.
export {
  coveredSomewhere,
  objectivesShortOn,
  uncoveredObjectives,
} from "./requirement-control-mappings";

/* ——— One control in several programs ——————————————————————————————————————————————————————— */

/**
 * How many of a control's objectives a program counts, how many its requirements cover and how
 * many its assessors have judged.
 */
export type ProgramObjectiveCount = {
  programId: string;
  /** The objectives the control counts; none for a control the catalog gives none. */
  objectives: number;
  /** Those the program's requirements cover, at their latest revision. */
  mapped: number;
  /** Those covered by one that cites evidence. */
  evidenced: number;
  /**
   * Those an assessor of the program has judged in published results, as its control status
   * counts them (`objectivesAssessed`): the program decides the control once every one is.
   */
  assessed: number;
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
      objectives_assessed: z.number(),
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
          assessed: program.objectives_assessed,
        },
      ]),
    ),
  };
}

/**
 * What the counts are read from: the coverage's models, and the findings published on the control,
 * which decide how many of its objectives are judged.
 */
const COUNT_MODELS = [
  ...OBJECTIVE_MODELS,
  "assessment_findings",
  "assessment_results_revisions",
] as const satisfies readonly TableName[];

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
  useStaleOnWrite(workspace.tenantId, COUNT_MODELS, [
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
