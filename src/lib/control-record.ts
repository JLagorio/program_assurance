import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { openIssue, openRisk, type AssuranceTrace } from "./assurance-trace";
import type { ControlObjective } from "./control-objectives";
import type { ControlStanding } from "./control-status";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { nextStepLabel, type ControlNextStep } from "./next-steps";
import { coverageOf, coveredObjectives } from "./requirement-control-mappings";
import { useStaleOnWrite } from "./server-table";
import {
  controlStatuses,
  determinations,
  severityLevels,
  statusEntry,
  statusLabel,
  statusTone,
} from "./status";

/*
 * The program's record of one control (control-record): what its header, its strip, its
 * Assessment tab and its rail say, derived from the reads the page already makes, so the screen
 * decides nothing of its own. The tabs live in the address (`tab`), Implementation first. The slot
 * says the control's next step (`controlNextStep` in next-steps) in the slot's words: the act, why
 * it is next and one smaller line. The strip counts the chain from the control outward, one
 * station a stage (Controls, Requirements, Evidence, Findings, POA&M, Risks), its Findings the
 * assessor's findings and the open operational issues together. The Assessment tab lists each
 * objective with what decided it: the program's assessors, or the library component its element
 * is built from (`program_control_objective_judgments`, read here), and where each requirement's
 * mappings stand.
 */

/** The record's tabs, in their order: the address names one, and none is the first. */
export const controlTabs = [
  "Implementation",
  "Requirements",
  "Evidence",
  "Assessment",
  "Findings",
] as const;
export type ControlTab = (typeof controlTabs)[number];
/** Whether a value names one of the record's tabs: an address's `tab` is checked with it. */
export const isControlTab = (value: unknown): value is ControlTab =>
  typeof value === "string" && (controlTabs as readonly string[]).includes(value);

/* ——— What decided each objective ————————————————————————————————————————————————————————— */

export type Determination = "satisfied" | "partially_satisfied" | "other_than_satisfied";

/**
 * One objective of a control judged for the program (`objectiveId` null for a control that counts
 * none): the determination that decides it, and whether it is the program's assessors' or
 * inherited from the component assessments behind the elements it stands on.
 */
export type ObjectiveJudgment = {
  objectiveId: string | null;
  determination: Determination;
  inherited: boolean;
  /** The component assessments an inherited judgment comes from, the worst first. */
  componentAssessments: { id: string; determination: Determination }[];
};

const determinationSchema = z.enum(["satisfied", "partially_satisfied", "other_than_satisfied"]);
const judgmentSchema = z.object({
  control_id: z.string(),
  objective_id: z.string().nullable(),
  determination: determinationSchema,
  inherited: z.boolean(),
  component_assessments: z
    .array(z.object({ id: z.string(), determination: determinationSchema }))
    .nullable(),
});

type Client = Pick<SupabaseClient, "rpc">;

/**
 * What is judged of one control for a program, objective by objective, as the control status
 * counts it: the program's own determinations, and those inherited from library components where
 * the program's mappings place an objective only on elements built from judged components. An
 * objective nobody has judged has no line.
 */
export async function readControlJudgments(
  client: Client,
  context: Pick<ReadContext, "token">,
  programId: string,
  controlId: string,
  signal?: AbortSignal,
): Promise<ObjectiveJudgment[]> {
  let request = client
    .rpc("program_control_objective_judgments", {
      p_program_id: programId,
      p_control_ids: [controlId],
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return z
    .array(judgmentSchema)
    .parse(data)
    .filter((row) => row.control_id === controlId)
    .map((row) => ({
      objectiveId: row.objective_id,
      determination: row.determination,
      inherited: row.inherited,
      componentAssessments: row.component_assessments ?? [],
    }));
}

/** What the judgments are read from: a write to one reads them again. */
const JUDGMENT_MODELS = [
  "assessment_findings",
  "assessment_results_revisions",
  "requirement_control_links",
  "requirement_revisions",
  "requirement_allocations",
  "system_components",
  "systems",
  "component_assessments",
  "component_determinations",
  "component_version_changes",
  "component_version_change_controls",
] as const satisfies readonly TableName[];

/** One control's judgments in a program; nothing until both are named. */
export function useControlJudgments(
  programId: string | null | undefined,
  controlId: string | null | undefined,
  options: { enabled?: boolean | undefined } = {},
): UseQueryResult<ObjectiveJudgment[], Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "program_control_objective_judgments"];
  useStaleOnWrite(workspace.tenantId, JUDGMENT_MODELS, key);
  return useQuery<ObjectiveJudgment[], Error>({
    queryKey: [...key, programId ?? null, controlId ?? null],
    enabled: !!programId && !!controlId && (options.enabled ?? true),
    retry: false,
    queryFn: async ({ signal }) =>
      readControlJudgments(
        database(),
        { token: await requireIdentity(workspace) },
        programId!,
        controlId!,
        signal,
      ),
  });
}

/** An objective as the Assessment tab lists it: its words, and what decided it, if anything has. */
export type ObjectiveLine = {
  id: string;
  label: string | null;
  prose: string | null;
  determination: Determination | null;
  /** Whose determination it is: the program's assessors, or the components it is inherited from. */
  by: "program" | "inherited" | null;
};

/** Each objective the control counts, in the catalog's reading order, with what decided it. */
export function objectiveLines(
  objectives: readonly Pick<ControlObjective, "id" | "label" | "prose">[],
  judgments: readonly ObjectiveJudgment[],
): ObjectiveLine[] {
  const byObjective = new Map(judgments.map((judgment) => [judgment.objectiveId, judgment]));
  return objectives.map((objective) => {
    const judged = byObjective.get(objective.id);
    return {
      id: objective.id,
      label: objective.label,
      prose: objective.prose,
      determination: judged?.determination ?? null,
      by: judged ? (judged.inherited ? "inherited" : "program") : null,
    };
  });
}

/* ——— Where each requirement's mappings stand ————————————————————————————————————————————— */

/** One mapping of the control, at its requirement's latest revision. */
export type StandingMapping = {
  requirementId: string;
  /** The element it names; none where it counts on every system. */
  systemId: string | null;
  /** The objective, heading or statement it names; none for the whole control. */
  partId: string | null;
};

/** A library component an element is built from, as the table names it: "Audit Log Collector 1". */
export type BuiltFrom = { id: string; name: string; version: number | null };

/** A row of Where it stands: a requirement on one element, what it covers there and what the element is built from. */
export type StandingLine = {
  key: string;
  requirementId: string;
  systemId: string | null;
  /** The objectives its mappings on that element cover, out of all the control counts. */
  covered: number;
  objectives: number;
  builtFrom: BuiltFrom[];
};

/**
 * Where the requirements that map a control stand: one line a requirement and element its
 * mappings name, in the order the requirements are given and then by the element's order, with
 * how many of the control's objectives those mappings cover and the library components the
 * element is built from.
 */
export function standingLines(input: {
  requirementIds: readonly string[];
  mappings: readonly StandingMapping[];
  objectives: readonly { id: string; ancestors: readonly string[] }[];
  /** The library components on each element, by the element's id. */
  builtFrom: ReadonlyMap<string, readonly BuiltFrom[]>;
  /** An element's place in the order the lines take: its code. */
  elementOrder?: ((systemId: string | null) => string) | undefined;
}): StandingLine[] {
  const lines: StandingLine[] = [];
  const order = input.elementOrder ?? ((id: string | null) => id ?? "");
  for (const requirementId of input.requirementIds) {
    const own = input.mappings.filter((mapping) => mapping.requirementId === requirementId);
    const systems = [...new Set(own.map((mapping) => mapping.systemId))].sort((a, b) =>
      order(a).localeCompare(order(b), undefined, { numeric: true }),
    );
    for (const systemId of systems) {
      const parts = own.filter((mapping) => mapping.systemId === systemId).map((m) => m.partId);
      const coverage = coverageOf(input.objectives, parts);
      lines.push({
        key: `${requirementId}/${systemId ?? "every"}`,
        requirementId,
        systemId,
        covered: input.objectives.length ? coveredObjectives(coverage, input.objectives) : 0,
        objectives: input.objectives.length,
        builtFrom: systemId ? [...(input.builtFrom.get(systemId) ?? [])] : [],
      });
    }
  }
  return lines;
}

/* ——— The strip ——————————————————————————————————————————————————————————————————————————— */

export type StripKind = "control" | "requirement" | "evidence" | "finding" | "remediation" | "risk";
/** The strip's stations, in the chain's order as the record reads it. */
export const STRIP_ORDER: readonly StripKind[] = [
  "control",
  "requirement",
  "evidence",
  "finding",
  "remediation",
  "risk",
];
export type StripTone = "neutral" | "success" | "warning" | "danger";

/**
 * What stands at one station: `held` records (with how many), a `gap` the control owes, or `none`.
 * `words` are what the station says under its dot: the worst record's words, or, for a control its
 * components decide, that it was judged there. `step` marks the station whose gap the control's
 * next step fills.
 */
export type StripStation = {
  kind: StripKind;
  state: "held" | "gap" | "none";
  count: number | undefined;
  tone: StripTone;
  words?: string | undefined;
  /** One short fact under the words: where a decided control was judged. */
  meta?: string | undefined;
  step?: boolean | undefined;
};

/** A vocabulary's tone as a station's: the rail draws four. */
const stripTone = (tone: string): StripTone =>
  tone === "success" || tone === "warning" || tone === "danger" ? tone : "neutral";

const rank = (tone: StripTone) => ["neutral", "success", "warning", "danger"].indexOf(tone);

/** Where the step a control's next step is fills a station's gap. */
const stepStation = (step: ControlNextStep | null | undefined): StripKind | null => {
  switch (step?.kind) {
    case "map_requirement":
    case "allocate_requirement":
      return "requirement";
    case "link_evidence":
      return "evidence";
    case "assess":
    case "plan_assessment":
    case "open_campaign":
      return "finding";
    default:
      return null;
  }
};

/**
 * The strip of a control's trace in a program. Requirements and Evidence count the trace's; a
 * stage the control owes and does not have is a gap (no requirement, where no product or
 * component decides it; no evidence, once a requirement maps it and nothing decided it). Findings
 * count the assessor's findings and the open operational issues, in the worst one's tone and
 * words; a control its components decide with no finding of the program's names them (`judgedOn`,
 * the component's words) in the inherited determination's tone; and evidence nobody has judged is
 * a gap. POA&M counts the remediation items still open, and Risks the open risks, the worst's
 * severity in its tone. `step` is the control's next step: its station is marked.
 */
export function controlStrip(
  trace: Pick<
    AssuranceTrace,
    "requirements" | "evidence" | "findings" | "issues" | "risks" | "remediation"
  >,
  standing:
    | Pick<
        ControlStanding,
        "status" | "determinedBy" | "objectivesInherited" | "componentAssessments"
      >
    | null
    | undefined,
  options: { step?: ControlNextStep | null | undefined; judgedOn?: string | undefined } = {},
): StripStation[] {
  const marked = stepStation(options.step);
  const decided =
    standing?.status === "satisfied" ||
    standing?.status === "partially_satisfied" ||
    standing?.status === "other_than_satisfied";
  const inherited = (standing?.objectivesInherited ?? 0) > 0;
  const held = (
    kind: StripKind,
    count: number,
    extra: Partial<StripStation> = {},
  ): StripStation => ({
    kind,
    state: count > 0 ? "held" : "none",
    count: count > 0 ? count : undefined,
    tone: "neutral",
    ...extra,
  });
  const gapOr = (station: StripStation, owed: boolean): StripStation =>
    station.state === "none" && owed
      ? { ...station, state: "gap", step: marked === station.kind }
      : marked === station.kind
        ? { ...station, step: true }
        : station;

  const requirements = gapOr(
    held("requirement", trace.requirements.length),
    !!standing && standing.determinedBy !== "product" && !inherited,
  );
  const evidence = gapOr(
    held("evidence", trace.evidence.length),
    trace.requirements.length > 0 && !decided && !inherited,
  );

  // The assessor's findings and the open issues, the worst first.
  const issues = trace.issues.filter((issue) => openIssue(issue.status));
  let worst: { tone: StripTone; words: string } | null = null;
  const consider = (tone: StripTone, words: string, weight: number) => {
    if (!worst || rank(tone) > rank(worst.tone) || (rank(tone) === rank(worst.tone) && weight > 0))
      worst = { tone, words };
  };
  for (const finding of trace.findings)
    consider(
      stripTone(statusTone(determinations, finding.determination)),
      statusLabel(determinations, finding.determination),
      0,
    );
  for (const issue of issues)
    if (issue.severity)
      consider(
        stripTone(statusTone(severityLevels, issue.severity)),
        statusLabel(severityLevels, issue.severity),
        statusEntry(severityLevels, issue.severity)?.rank ?? 0,
      );
  const found = trace.findings.length + issues.length;
  const worstFound = worst as { tone: StripTone; words: string } | null;
  let finding: StripStation = held("finding", found, worstFound ? { ...worstFound } : {});
  if (found === 0 && inherited && options.judgedOn) {
    const determination = standing?.componentAssessments[0]?.determination ?? "satisfied";
    finding = {
      kind: "finding",
      state: "held",
      count: undefined,
      tone: stripTone(statusTone(determinations, determination)),
      words: options.judgedOn,
      meta: "Judged once",
    };
  }
  finding = gapOr(
    finding,
    trace.evidence.length > 0 && standing?.status === "not_assessed" && !inherited,
  );

  const open = trace.remediation.filter(
    (item) =>
      !item.completed_on && !["completed", "cancelled", "risk_accepted"].includes(item.status),
  );
  const remediation = held("remediation", open.length);

  const risks = trace.risks.filter((risk) => openRisk(risk.status));
  const worstRisk = [...risks]
    .filter((risk) => risk.severity)
    .sort(
      (a, b) =>
        (statusEntry(severityLevels, b.severity)?.rank ?? -1) -
        (statusEntry(severityLevels, a.severity)?.rank ?? -1),
    )[0];
  const risk = held(
    "risk",
    risks.length,
    worstRisk?.severity
      ? {
          tone: stripTone(statusTone(severityLevels, worstRisk.severity)),
          words: statusLabel(severityLevels, worstRisk.severity),
        }
      : {},
  );

  return [
    { kind: "control", state: "held", count: undefined, tone: "neutral" },
    requirements,
    evidence,
    finding,
    remediation,
    risk,
  ];
}

/* ——— The slot ———————————————————————————————————————————————————————————————————————————— */

/**
 * What the record's slot holds: the act, why it is the next step (`reason`, at medium weight) and
 * one smaller line (`detail`). `kind` is the step's, or `open_component_assessment` for a control
 * the components it is built from decide and nothing else moves; `none` where the control has no
 * step for this reader.
 */
export type ControlSlot =
  | {
      form: "advance";
      kind: ControlNextStep["kind"] | "add_evidence" | "open_component_assessment";
      label: string;
      reason: string;
      detail?: string | undefined;
    }
  | { form: "none" };

/** The steps a reader takes on the control itself, over the page: a viewer has none of them. */
const IN_PLACE: ReadonlySet<string> = new Set([
  "map_requirement",
  "allocate_requirement",
  "assess",
  "plan_assessment",
  "add_evidence",
]);

/**
 * The record's slot for a control's next step, in the slot's words. Evidence a requirement owes is
 * added on the control (Add evidence, why: REQ-064 cites none, and how many objectives have
 * evidence); a mapping, an allocation, an assessment campaign and a plan keep the next step's own
 * words; a step that leads elsewhere links there. A control with no step whose objectives the
 * components it is built from decide leads to that component's assessment (`builtFrom` names it,
 * "Audit Log Collector 1"). A reader who may not write has no step done on the control: the slot
 * holds none rather than a primary that cannot run.
 */
export function controlSlot(input: {
  step: ControlNextStep | null;
  standing: Pick<
    ControlStanding,
    | "status"
    | "objectives"
    | "objectivesMapped"
    | "objectivesEvidenced"
    | "objectivesAssessed"
    | "objectivesInherited"
    | "requirements"
  >;
  canWrite: boolean;
  builtFrom?: string | null | undefined;
  /** Numbers in the reader's locale. */
  format?: ((value: number) => string) | undefined;
}): ControlSlot {
  const { step, standing, canWrite, builtFrom } = input;
  const format = input.format ?? ((value: number) => String(value));
  const of = (count: number) => `${format(count)} of ${format(standing.objectives)}`;
  const counted = standing.objectives > 0;
  const slot = ((): ControlSlot => {
    if (!step) {
      if (standing.objectivesInherited > 0 && builtFrom)
        return {
          form: "advance",
          kind: "open_component_assessment",
          label: "Open component assessment",
          reason: "Judged once",
          detail: `on ${builtFrom}`,
        };
      return { form: "none" };
    }
    switch (step.kind) {
      case "link_evidence":
        return {
          form: "advance",
          kind: "add_evidence",
          label: "Add evidence",
          reason: step.requirement ? `${step.requirement.code} cites none` : "No evidence cited",
          ...(counted
            ? { detail: `${of(standing.objectivesEvidenced)} objectives` }
            : standing.requirements === 1
              ? { detail: "the only requirement" }
              : {}),
        };
      case "map_requirement":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason:
            standing.objectivesMapped > 0 && counted
              ? `${of(standing.objectivesMapped)} objectives mapped`
              : "No requirement maps it",
          ...(step.system ? { detail: step.system.name } : {}),
        };
      case "allocate_requirement":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason: `No requirement on ${step.system.code}`,
          detail: step.system.name,
        };
      case "assess":
      case "plan_assessment":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason: counted ? `Evidence on ${of(standing.objectivesEvidenced)}` : "Evidence cited",
          detail:
            standing.objectivesAssessed > 0 && counted
              ? `${of(standing.objectivesAssessed)} assessed`
              : "no determination yet",
        };
      case "open_campaign":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason: "In assessment",
          detail: step.campaign.title,
        };
      case "review_findings":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason: statusLabel(controlStatuses, standing.status),
          detail: "by the program's assessors",
        };
      case "review_product_assessment":
        return {
          form: "advance",
          kind: step.kind,
          label: nextStepLabel(step),
          reason: statusLabel(controlStatuses, standing.status),
          detail: step.assessment.title,
        };
    }
  })();
  return slot.form === "advance" && !canWrite && IN_PLACE.has(slot.kind) ? { form: "none" } : slot;
}

/* ——— The record's place in the Controls register ————————————————————————————————————————— */

/**
 * Where a control stands in the register's result, in its order: its place (from one) and how many
 * there are, with the controls before and after it. Null where the result leaves it out.
 */
export function sequencePlace(
  ids: readonly string[],
  id: string,
): { position: number; total: number; previous: string | null; next: string | null } | null {
  const at = ids.indexOf(id);
  if (at < 0) return null;
  return {
    position: at + 1,
    total: ids.length,
    previous: at > 0 ? (ids[at - 1] ?? null) : null,
    next: at + 1 < ids.length ? (ids[at + 1] ?? null) : null,
  };
}
