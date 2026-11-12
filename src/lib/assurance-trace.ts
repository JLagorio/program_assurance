import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * The assurance chain around one record. A control is met by requirements, a requirement is
 * supported by evidence, an operational issue cites evidence, a risk rests on an issue and a
 * remediation item answers it. `assurance_trace` walks the chain outward from the record in one
 * request, as the reader, and this module says what the walk found: the links a screen draws
 * between the stages, where the record reaches (control families, system elements) and how its
 * remediation stands.
 */

/** The stages of the chain, in the order a trace reads. */
export const TRACE_KINDS = [
  "control",
  "requirement",
  "evidence",
  "issue",
  "risk",
  "remediation",
] as const;
export type TraceKind = (typeof TRACE_KINDS)[number];

/** The record each stage holds. */
export const traceTables = {
  control: "controls",
  requirement: "engineering_requirements",
  evidence: "evidence_artifacts",
  issue: "operational_issues",
  risk: "risks",
  remediation: "poam_items",
} as const satisfies Record<TraceKind, TableName>;

/** Every model a trace is read from: a write to one reads the trace again. */
export const TRACE_MODELS = [
  "requirement_control_links",
  "requirement_revisions",
  "requirement_evidence",
  "requirement_allocations",
  "evidence_artifacts",
  "evidence_versions",
  "issue_evidence",
  "issue_observations",
  "observation_evidence",
  "operational_issues",
  "risk_observations",
  "risk_revisions",
  "risks",
  "issue_poams",
  "poam_items",
  "poam_item_revisions",
  "poam_milestones",
] as const satisfies readonly TableName[];

const id = z.string().uuid();
const text = z.string().nullable();

const controlSchema = z.object({
  id,
  code: z.string(),
  title: z.string(),
  family: text,
  family_title: text,
});
const requirementSchema = z.object({
  id,
  code: z.string(),
  title: z.string(),
  state: z.string(),
  program_id: id,
  evidence_count: z.number(),
});
const evidenceSchema = z.object({
  id,
  title: z.string(),
  kind: z.string(),
  program_id: id.nullable(),
  version_id: id.nullable(),
  version_number: z.number().nullable(),
  collected_at: text,
  review: z.string(),
  expires_at: text,
});
const issueSchema = z.object({
  id,
  title: z.string(),
  severity: text,
  status: z.string(),
  opened_at: text,
  closed_at: text,
  program_id: id,
});
const riskSchema = z.object({
  id,
  title: z.string(),
  status: z.string(),
  severity: text,
  likelihood: text,
  impact: text,
  program_id: id,
});
const milestoneSchema = z.object({
  id,
  title: z.string(),
  status: z.string(),
  planned_on: text,
  completed_on: text,
});
const remediationSchema = z.object({
  id,
  title: z.string(),
  status: z.string(),
  planned_on: text,
  completed_on: text,
  milestones: z.array(milestoneSchema),
});
const elementSchema = z.object({ id, code: z.string(), name: z.string(), program_id: id });
const pairs = z.array(z.tuple([id, id]));

const traceSchema = z.object({
  focus: z.object({ kind: z.enum(TRACE_KINDS), id }),
  clipped: z.boolean(),
  controls: z.array(controlSchema),
  requirements: z.array(requirementSchema),
  evidence: z.array(evidenceSchema),
  issues: z.array(issueSchema),
  risks: z.array(riskSchema),
  remediation: z.array(remediationSchema),
  elements: z.array(elementSchema),
  links: z.object({
    control_requirement: pairs,
    requirement_evidence: pairs,
    evidence_issue: pairs,
    issue_risk: pairs,
    issue_remediation: pairs,
  }),
});

export type AssuranceTrace = z.infer<typeof traceSchema>;
export type TraceControl = z.infer<typeof controlSchema>;
export type TraceRequirement = z.infer<typeof requirementSchema>;
export type TraceEvidence = z.infer<typeof evidenceSchema>;
export type TraceIssue = z.infer<typeof issueSchema>;
export type TraceRisk = z.infer<typeof riskSchema>;
export type TraceRemediation = z.infer<typeof remediationSchema>;
export type TraceMilestone = z.infer<typeof milestoneSchema>;
export type TraceElement = z.infer<typeof elementSchema>;

/** The record a trace starts from; a control's requirements can be kept to one program. */
export type TraceFocus = { kind: TraceKind; id: string; programId?: string | null | undefined };

type Client = Pick<SupabaseClient, "rpc">;

/** One request, one walk: the records of every stage the focus reaches and the links between them. */
export async function readAssuranceTrace(
  client: Client,
  context: ReadContext,
  focus: TraceFocus,
  signal?: AbortSignal,
): Promise<AssuranceTrace> {
  let request = client
    .rpc("assurance_trace", {
      p_tenant_id: context.tenantId,
      p_kind: focus.kind,
      p_id: focus.id,
      ...(focus.programId ? { p_program_id: focus.programId } : {}),
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return traceSchema.parse(data);
}

const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The trace around a record, read once its id is known. The trace on screen stays while another
 * record's loads, and a write to any model the chain is read from reads it again.
 */
export function useAssuranceTrace(
  focus: TraceFocus | null | undefined,
): UseQueryResult<AssuranceTrace, Error> {
  const workspace = useWorkspace();
  const key = [
    "models",
    workspace.tenantId,
    "assurance_trace",
    focus?.kind ?? null,
    focus?.id ?? null,
    focus?.programId ?? null,
  ];
  useStaleOnWrite(workspace.tenantId, TRACE_MODELS, [
    "models",
    workspace.tenantId,
    "assurance_trace",
  ]);
  return useQuery<AssuranceTrace, Error>({
    queryKey: key,
    enabled: !!focus && RECORD_ID.test(focus.id),
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readAssuranceTrace(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        focus!,
        signal,
      ),
  });
}

/** A record's place in a trace: its stage and its id, the name a link's ends use. */
export const traceKey = (kind: TraceKind, recordId: string) => `${kind}:${recordId}`;

/** A link a trace draws, from a record of one stage to a record of a later one. */
export type TraceLink = { from: string; to: string };

/**
 * The links between the stages as a trace draws them, left to right. Four are recorded: a control
 * and the requirement that meets it, a requirement and its evidence, evidence and the issue that
 * cites it, an issue and the risk that rests on it. Remediation is recorded against the issue; a
 * trace reads it after the risk, so an item is linked from each risk of its issue, and straight
 * from the issue when no risk in the trace rests on it.
 */
export function traceLinks(trace: AssuranceTrace): TraceLink[] {
  const links: TraceLink[] = [];
  const seen = new Set<string>();
  const add = (from: string, to: string) => {
    const name = `${from}>${to}`;
    if (seen.has(name)) return;
    seen.add(name);
    links.push({ from, to });
  };
  for (const [control, requirement] of trace.links.control_requirement)
    add(traceKey("control", control), traceKey("requirement", requirement));
  for (const [requirement, evidence] of trace.links.requirement_evidence)
    add(traceKey("requirement", requirement), traceKey("evidence", evidence));
  for (const [evidence, issue] of trace.links.evidence_issue)
    add(traceKey("evidence", evidence), traceKey("issue", issue));
  const risksOf = new Map<string, string[]>();
  for (const [issue, risk] of trace.links.issue_risk) {
    add(traceKey("issue", issue), traceKey("risk", risk));
    risksOf.set(issue, [...(risksOf.get(issue) ?? []), risk]);
  }
  for (const [issue, item] of trace.links.issue_remediation) {
    const risks = risksOf.get(issue);
    if (risks?.length)
      for (const risk of risks) add(traceKey("risk", risk), traceKey("remediation", item));
    else add(traceKey("issue", issue), traceKey("remediation", item));
  }
  return links;
}

/** A control family a trace reaches, with how many of its controls. */
export type TraceFamily = { code: string; title: string | null; controls: number };

/** Where a trace reaches: the control families of its controls, and the system elements its requirements are allocated to. */
export function traceReach(trace: AssuranceTrace): {
  families: TraceFamily[];
  elements: TraceElement[];
} {
  const families = new Map<string, TraceFamily>();
  for (const control of trace.controls) {
    if (!control.family) continue;
    const family = families.get(control.family);
    if (family) family.controls += 1;
    else
      families.set(control.family, {
        code: control.family,
        title: control.family_title,
        controls: 1,
      });
  }
  const compare = new Intl.Collator(undefined, { numeric: true }).compare;
  return {
    families: [...families.values()].sort((a, b) => compare(a.code, b.code)),
    elements: [...trace.elements].sort((a, b) => compare(a.code, b.code)),
  };
}

/** A remediation item or a milestone that will not happen: its dates carry no due state. */
const called = (status: string) => status === "cancelled" || status === "risk_accepted";

/** How a trace's remediation stands on a day. */
export type TraceTreatment = {
  /** The remediation items, and how many are still to finish. */
  items: number;
  open: number;
  /** The milestones of the items that are still to happen or done, and how many are done. */
  milestones: number;
  completed: number;
  /** Open milestones planned before the day. */
  late: number;
  /** The last planned completion among the open items: when the treatment is due to be done. */
  dueOn: string | null;
  /** Whether that day has passed. */
  overdue: boolean;
};

/**
 * Where the remediation of a trace stands on `today` (a calendar day, "2026-11-10", the reader's):
 * a completed, cancelled or risk-accepted item is no longer open, a cancelled milestone is not
 * counted, and an open milestone planned before today is late.
 */
export function traceTreatment(
  remediation: readonly TraceRemediation[],
  today: string,
): TraceTreatment {
  let open = 0;
  let milestones = 0;
  let completed = 0;
  let late = 0;
  let dueOn: string | null = null;
  for (const item of remediation) {
    const done = item.status === "completed" || !!item.completed_on;
    const stopped = called(item.status);
    if (!done && !stopped) {
      open += 1;
      if (item.planned_on && (dueOn === null || item.planned_on > dueOn)) dueOn = item.planned_on;
    }
    for (const milestone of item.milestones) {
      if (milestone.status === "cancelled") continue;
      milestones += 1;
      const reached = milestone.status === "completed" || !!milestone.completed_on;
      if (reached) completed += 1;
      else if (!done && !stopped && milestone.planned_on && milestone.planned_on < today) late += 1;
    }
  }
  return {
    items: remediation.length,
    open,
    milestones,
    completed,
    late,
    dueOn,
    overdue: dueOn !== null && dueOn < today,
  };
}

/** Whether an operational issue is still open, as the Portfolio counts it. */
export const openIssue = (status: string) => !["closed", "resolved", "cancelled"].includes(status);
/** Whether a risk is still open, as the Portfolio counts it. */
export const openRisk = (status: string) => status !== "closed";

/**
 * A control's standing in each program that has a requirement meeting it, from a trace read
 * without a program: how many requirements, how many of them with evidence, and the open issues
 * and risks their evidence leads to.
 */
export type ControlProgramLine = {
  programId: string;
  requirements: number;
  evidenced: number;
  issues: number;
  risks: number;
};

export function controlPrograms(trace: AssuranceTrace): ControlProgramLine[] {
  const lines = new Map<string, ControlProgramLine>();
  const line = (programId: string) => {
    let found = lines.get(programId);
    if (!found) {
      found = { programId, requirements: 0, evidenced: 0, issues: 0, risks: 0 };
      lines.set(programId, found);
    }
    return found;
  };
  for (const requirement of trace.requirements) {
    const at = line(requirement.program_id);
    at.requirements += 1;
    if (requirement.evidence_count > 0) at.evidenced += 1;
  }
  for (const issue of trace.issues) if (openIssue(issue.status)) line(issue.program_id).issues += 1;
  for (const risk of trace.risks) if (openRisk(risk.status)) line(risk.program_id).risks += 1;
  return [...lines.values()];
}
