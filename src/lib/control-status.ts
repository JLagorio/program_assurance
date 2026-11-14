import { useMemo } from "react";
import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import type { AssuranceTrace } from "./assurance-trace";
import { useControlAssessment } from "./control-assessment";
import { useProgramControlObjectives } from "./control-objectives";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { controlNextStep, stepNeedsCoverage } from "./next-steps";
import { useStaleOnWrite } from "./server-table";
import { controlDeterminers, controlStatuses } from "./status";

/*
 * One status for each control of a program's control baseline: where the program stands on it,
 * the furthest step it has reached. `program_control_status` answers every control in one request,
 * as the reader: no requirement maps it, a requirement maps it and none cites evidence, a
 * requirement cites evidence and no assessor has determined it, or a determination. A control with
 * assessment objectives climbs by them: the program's requirements map every one of them before it
 * leaves No requirement, and one that cites evidence covers each before it leaves No evidence; a
 * mapping of the whole control covers them all (control-objectives). The
 * determination is the worst of its objectives' determinations, once the program's assessors have
 * judged every objective it counts: a determination on an objective judges it and those under it,
 * one on the statement judges them all, and the latest published of those that judge an objective
 * decides it. A control judged in part has no program determination and reads the ladder. Where
 * there is none and every product variant of the program inherits the control with a
 * determination (its delta is inherited), it is the worst of the product's, and the control names
 * the product assessments it was taken from. The words and their order are `controlStatuses` and
 * `controlDeterminers` in status. This module also rolls the controls up by family, for a map of
 * the baseline and its counts.
 */

/** A control's status: a key of `controlStatuses`, in the ladder's order. */
export type ControlStatus = keyof typeof controlStatuses;

/** The statuses in the ladder's order, from nothing recorded to satisfied. */
export const CONTROL_STATUS_ORDER = Object.keys(controlStatuses) as ControlStatus[];

/** Whose determination a control's status is: a key of `controlDeterminers`. */
export type ControlDeterminer = keyof typeof controlDeterminers;

/** The statuses that are a determination, an assessor's or a product assessment's. */
export type ControlDetermination = Extract<
  ControlStatus,
  "other_than_satisfied" | "partially_satisfied" | "satisfied"
>;

const statusSchema = z.enum(CONTROL_STATUS_ORDER as [ControlStatus, ...ControlStatus[]]);
const determinerSchema = z.enum(
  Object.keys(controlDeterminers) as [ControlDeterminer, ...ControlDeterminer[]],
);

const controlSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  parent_id: z.string().nullable(),
  family: z.string().nullable(),
  family_title: z.string().nullable(),
  status: statusSchema,
  requirements: z.number(),
  evidenced: z.number(),
  objectives: z.number(),
  objectives_mapped: z.number(),
  objectives_evidenced: z.number(),
  objectives_assessed: z.number(),
  determined_by: determinerSchema.nullable(),
  product_assessments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      determination: z.enum(["other_than_satisfied", "partially_satisfied", "satisfied"]),
    }),
  ),
});

const answerSchema = z.object({
  program_id: z.string(),
  baseline: z.boolean(),
  totals: z.object({
    controls: z.number(),
    satisfied: z.number(),
    partially_satisfied: z.number(),
    other_than_satisfied: z.number(),
    not_assessed: z.number(),
    no_evidence: z.number(),
    no_requirement: z.number(),
  }),
  controls: z.array(controlSchema),
});

/** A product assessment a control's status was taken from, with its determination on the control. */
export type ControlProductAssessment = {
  id: string;
  title: string;
  determination: ControlDetermination;
};

/** A control of the baseline with where the program stands on it. */
export type ControlStanding = {
  id: string;
  code: string; // "AC-2(1)"
  title: string;
  /** The control this one enhances, when it is an enhancement. */
  parentId: string | null;
  /** The family's code and name as the catalog prints them: "AC", "Access Control". */
  family: string | null;
  familyTitle: string | null;
  status: ControlStatus;
  /** The program's requirements whose latest revision maps the control. */
  requirements: number;
  /** Those of them that cite evidence. */
  evidenced: number;
  /** The assessment objectives the control counts (its leaves); none for a control without any. */
  objectives: number;
  /** Those the program's requirements map, alone or under an objective or the whole control mapped. */
  objectivesMapped: number;
  /** Those mapped by a requirement that cites evidence. */
  objectivesEvidenced: number;
  /**
   * Those an assessor of the program has judged: a published determination on the objective, on an
   * objective above it, or on the control's statement, the latest of which decides the objective.
   * The program's assessors decide the control once every one is judged; until then it reads the
   * ladder below.
   */
  objectivesAssessed: number;
  /**
   * Whose determination the status is: the program's own assessors, once they have judged every
   * objective the control counts, or the product assessment every variant of the program inherits
   * the control from. Null while nobody has determined it.
   */
  determinedBy: ControlDeterminer | null;
  /**
   * The product assessments the product's determination was taken from, the one that decided it
   * first. Empty unless the product determined the status.
   */
  productAssessments: ControlProductAssessment[];
};

/** How many controls stand at each status. */
export type ControlStatusCounts = Record<ControlStatus, number>;

export type ProgramControlStatus = {
  programId: string;
  /** The program records a control baseline. Without one there is nothing to stand on. */
  baseline: boolean;
  /** How many controls the baseline selects. */
  total: number;
  counts: ControlStatusCounts;
  /** Every control of the baseline, by family and then in the catalog's order. */
  controls: ControlStanding[];
};

type Client = Pick<SupabaseClient, "rpc">;

/**
 * Where a program stands on each control of its baseline, as the server reads it. A program with
 * no baseline answers `baseline: false` and no controls; a program the reader cannot read is refused.
 */
export async function readProgramControlStatus(
  client: Client,
  context: ReadContext,
  programId: string,
  signal?: AbortSignal,
): Promise<ProgramControlStatus> {
  let request = client
    .rpc("program_control_status", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = answerSchema.parse(data);
  return {
    programId: answer.program_id,
    baseline: answer.baseline,
    total: answer.totals.controls,
    counts: {
      no_requirement: answer.totals.no_requirement,
      no_evidence: answer.totals.no_evidence,
      not_assessed: answer.totals.not_assessed,
      other_than_satisfied: answer.totals.other_than_satisfied,
      partially_satisfied: answer.totals.partially_satisfied,
      satisfied: answer.totals.satisfied,
    },
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      parentId: control.parent_id,
      family: control.family,
      familyTitle: control.family_title,
      status: control.status,
      requirements: control.requirements,
      evidenced: control.evidenced,
      objectives: control.objectives,
      objectivesMapped: control.objectives_mapped,
      objectivesEvidenced: control.objectives_evidenced,
      objectivesAssessed: control.objectives_assessed,
      determinedBy: control.determined_by,
      productAssessments: control.product_assessments,
    })),
  };
}

/**
 * Every model the statuses are read from: a write to one reads them again. The baseline is the
 * resolution the program's reference choice names; a requirement's mapping and its evidence, and
 * an assessor's findings and the results revision that publishes them, decide the rest, with what
 * the program's variants inherit: their elements, the product versions they stand on and those
 * versions' product assessments.
 */
const STATUS_MODELS = [
  "program_reference_choices",
  "engineering_requirements",
  "requirement_revisions",
  "requirement_control_links",
  "requirement_evidence",
  "evidence_versions",
  "assessment_findings",
  "assessment_results_revisions",
  "systems",
  "selected_controls",
  "product_revisions",
  "product_elements",
  "product_configuration_elements",
  "defined_component_implementations",
  "product_assessments",
  "product_determinations",
] as const satisfies readonly TableName[];

/**
 * Where a program stands on each control of its baseline. While another program's statuses load
 * there is no data: one program's standing never stands in for another's.
 */
export function useProgramControlStatus(
  programId: string | null | undefined,
): UseQueryResult<ProgramControlStatus, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, STATUS_MODELS, [
    "models",
    workspace.tenantId,
    "program_control_status",
  ]);
  return useQuery<ProgramControlStatus, Error>({
    queryKey: ["models", workspace.tenantId, "program_control_status", programId ?? null],
    enabled: !!programId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramControlStatus(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId!,
        signal,
      ),
  });
}

/**
 * Where each of a few programs stands on its control baseline, one read a program, for a widget
 * that lists a handful: the Portfolio's recently updated programs. The answers are by program id
 * and share their cache with `useProgramControlStatus`, so a program's Overview opens on the read
 * the widget made. Never a register's every row: that is a column of its view.
 */
export function useProgramsControlStatus(
  programIds: readonly string[],
): ReadonlyMap<string, UseQueryResult<ProgramControlStatus, Error>> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, STATUS_MODELS, [
    "models",
    workspace.tenantId,
    "program_control_status",
  ]);
  const answers = useQueries({
    queries: programIds.map((programId) => ({
      queryKey: ["models", workspace.tenantId, "program_control_status", programId],
      retry: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        readProgramControlStatus(
          database(),
          { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
          programId,
          signal,
        ),
    })),
  });
  return new Map(
    programIds.map((programId, index) => [
      programId,
      answers[index] as UseQueryResult<ProgramControlStatus, Error>,
    ]),
  );
}

/**
 * Where a program stands on one control and the step that moves it up the ladder, as its Details
 * and its trace both read them, so the two say the same step. The status is the read the program's
 * Overview and its Control status view share. Where the step waits on more than the status says,
 * it reads the control's coverage system by system (`program_control_objectives`): a control its
 * requirements map in part, whose step is what is left or the system it is short on, and one with
 * several requirements that cite no evidence, whose step names the one that owes it. For evidence
 * no assessor has determined it reads what the program's open campaigns hold of the control.
 * `requirements` are those that map the control, as its trace reads them. `known` once every read
 * the step waits on has answered; `queries` are the step's own reads, which a failure region says.
 * Nothing is read until both the program and the control are named.
 */
export function useControlNextStep(
  programId: string | null | undefined,
  controlId: string | null | undefined,
  requirements?: AssuranceTrace["requirements"] | undefined,
) {
  const statuses = useProgramControlStatus(programId);
  const standing = controlId
    ? statuses.data?.controls.find((control) => control.id === controlId)
    : undefined;
  const waiting = standing?.status === "not_assessed";
  const assessment = useControlAssessment(programId, controlId, { enabled: waiting });
  const partial = !!standing && stepNeedsCoverage(standing);
  const coverage = useProgramControlObjectives(programId, controlId, { enabled: partial });
  // One step for as long as what it is read from holds, so the trace drawn from it keeps its own.
  const step = useMemo(
    () =>
      standing
        ? controlNextStep(
            standing,
            requirements,
            assessment.data,
            partial ? coverage.data : undefined,
          )
        : null,
    [standing, requirements, assessment.data, partial, coverage.data],
  );
  const queries = waiting ? assessment.queries : partial ? [coverage] : [];
  const known =
    statuses.isSuccess && (!waiting || !!assessment.data) && (!partial || !!coverage.data);
  return { statuses, standing, step, plans: assessment.data, queries, known };
}

/* ——— The roll-up ————————————————————————————————————————————————————————————————————— */

/** A control with the enhancements of it that the baseline also selects. */
export type ControlWithEnhancements = ControlStanding & { enhancements: ControlStanding[] };

/** A control family of the baseline: its controls, each with its enhancements, and its counts. */
export type ControlStatusFamily = {
  /** The family's code, "AC"; "Other" for a control the catalog files under no family. */
  code: string;
  title: string | null;
  /** How many controls of the family the baseline selects, enhancements included. */
  total: number;
  counts: ControlStatusCounts;
  controls: ControlWithEnhancements[];
};

/** Counts of zero for every status. */
export function emptyControlStatusCounts(): ControlStatusCounts {
  return Object.fromEntries(
    CONTROL_STATUS_ORDER.map((status) => [status, 0]),
  ) as ControlStatusCounts;
}

const UNFILED = "Other";

/**
 * The baseline's controls by family, in the order given (the server's: by family, then the
 * catalog's order). An enhancement stands under the control it enhances; one whose control the
 * baseline does not select stands on its own, so no control is lost.
 */
export function controlStatusFamilies(controls: readonly ControlStanding[]): ControlStatusFamily[] {
  const families = new Map<string, ControlStatusFamily>();
  const held = new Map<string, ControlWithEnhancements>();
  const ids = new Set(controls.map((control) => control.id));
  const familyOf = (control: ControlStanding) => {
    const code = control.family ?? UNFILED;
    let family = families.get(code);
    if (!family) {
      family = {
        code,
        title: control.familyTitle,
        total: 0,
        counts: emptyControlStatusCounts(),
        controls: [],
      };
      families.set(code, family);
    }
    return family;
  };
  // The controls first, so an enhancement finds its control wherever the order put it.
  for (const control of controls) {
    if (control.parentId && ids.has(control.parentId)) continue;
    const top = { ...control, enhancements: [] };
    held.set(control.id, top);
    familyOf(control).controls.push(top);
  }
  for (const control of controls) {
    const family = familyOf(control);
    family.total += 1;
    family.counts[control.status] += 1;
    if (control.parentId && ids.has(control.parentId)) {
      // An enhancement of an enhancement the catalog does not print; one would stand on its own.
      const parent = held.get(control.parentId);
      if (parent) parent.enhancements.push(control);
      else family.controls.push({ ...control, enhancements: [] });
    }
  }
  return [...families.values()];
}

/** The share of the baseline at a status, as a whole percent; 0 for an empty baseline. */
export function controlStatusShare(
  status: Pick<ProgramControlStatus, "total" | "counts">,
  of: ControlStatus,
): number {
  return status.total > 0 ? Math.round((status.counts[of] / status.total) * 100) : 0;
}
