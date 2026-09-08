import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { toast } from "@ledger/design-system";
import {
  campaigns,
  campaignById,
  events,
  eventById,
  objectives,
  objectiveById,
  type Campaign,
  type TestEvent,
  type TestObjective,
} from "@/lib/campaigns";
import {
  procedures,
  procedureById,
  runsForCampaign,
  runsForEvent,
  type TestProcedure,
} from "@/lib/test-execution";
import { programs } from "@/lib/grc-data";
import { restorePrograms } from "@/lib/program-store";
import { assets } from "@/lib/findings";
import { getRequirement } from "@/lib/requirements";
import {
  registerAssessmentVerification,
  restoreVerificationLinks,
} from "@/lib/requirement-verification";
import { clockNow, record } from "@/lib/activity";

const dateSchema = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
    "Choose a valid calendar date.",
  );
const scheduleSchema = z
  .object({
    start: dateSchema,
    end: dateSchema,
    owner: z.string().trim().min(1, "Choose an owner."),
  })
  .refine((value) => value.end >= value.start, {
    message: "The end date must be on or after the start date.",
    path: ["end"],
  });

const inputSchema = z
  .object({
    program: z.string().min(1),
    title: z.string().trim().min(1, "Assessment title is required."),
    owner: z.string().trim().min(1, "Assessment owner is required."),
    scope: z.string().trim().min(1, "Describe the assessment boundary."),
    requirement: z.string(),
    asset: z.string(),
    objective: z.string().trim().min(1, "An assessment objective is required."),
    method: z.enum(["Examine", "Interview", "Test"]),
    action: z.string().trim().min(1, "Describe what the assessor will do."),
    expected: z.string().trim().min(1, "State the acceptance criterion."),
    start: dateSchema,
    end: dateSchema,
  })
  .refine((v) => v.end >= v.start, {
    message: "The end date must be on or after the start date.",
    path: ["end"],
  });

export type NewAssessment = z.input<typeof inputSchema>;
type AssessmentBundle = {
  input: NewAssessment;
  campaignId: string;
  eventId: string;
  objectiveId: string;
  procedureId: string;
  created: string;
};
type SchedulePatch = { start: string; end: string; owner: string };
const key = "equinox.assessments.v1";
const bundles: AssessmentBundle[] = [];
let schedulePatches: Record<string, SchedulePatch> = {};
let restored = false;
let version = 0;
const listeners = new Set<() => void>();
function emit() {
  version++;
  for (const listener of listeners) listener();
}
export function subscribeAssessments(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function assessmentsVersion() {
  return version;
}

export function assessmentState(campaign: Campaign): Campaign["state"] {
  if (campaign.state === "Closed") return "Closed";
  const runs = runsForCampaign(campaign.id);
  if (runs.some((run) => run.state === "In progress")) return "Executing";
  if (runs.some((run) => run.state === "Complete")) return "Reporting";
  return campaign.state;
}

export function assessmentEventState(event: TestEvent): TestEvent["state"] {
  if (event.state === "Cancelled") return "Cancelled";
  const runs = runsForEvent(event.id);
  if (runs.some((run) => run.state === "In progress")) return "Executing";
  if (event.state !== "Reported" && runs.some((run) => run.state === "Complete"))
    return "Data reduction";
  return event.state;
}
export function useAssessmentsVersion() {
  useEffect(() => {
    try {
      restoreAssessments();
    } catch {
      toast.error("Saved assessments could not be restored", {
        description: "Check browser storage before changing assessments.",
      });
    }
  }, []);
  return useSyncExternalStore(subscribeAssessments, assessmentsVersion, assessmentsVersion);
}

function register(bundle: AssessmentBundle): Campaign {
  const { input, campaignId, eventId, objectiveId, procedureId } = bundle;
  const existing = campaignById.get(campaignId);
  if (existing) return existing;
  const asset = assets.find((a) => a.id === input.asset && a.program === input.program);
  const requirement = getRequirement(input.requirement);
  const campaign: Campaign = {
    id: campaignId,
    name: input.title,
    program: input.program,
    trigger: "Gate entry",
    gate: "—",
    state: "Planning",
    lead: input.owner,
    opened: input.start,
    target: input.end,
    scope: input.scope,
  };
  const event: TestEvent = {
    id: eventId,
    campaign: campaignId,
    name: input.title,
    kind: "Cooperative",
    state: "Planned",
    window: `${input.start} – ${input.end}`,
    start: input.start,
    end: input.end,
    team: input.owner,
    assets: asset ? [asset.id] : [],
    objectives: [objectiveId],
    findings: [],
    notes: input.scope,
  };
  const objective: TestObjective = {
    id: objectiveId,
    statement: input.objective,
    ccis: [],
    method:
      input.method === "Examine"
        ? "Examination"
        : input.method === "Interview"
          ? "Interview"
          : "Demonstration",
    result: "Not run",
    event: eventId,
  };
  const procedure: TestProcedure = {
    id: procedureId,
    title: input.objective,
    objective: objectiveId,
    method:
      input.method === "Examine"
        ? "Inspection"
        : input.method === "Interview"
          ? "Analysis"
          : "Test",
    assessmentMethod: input.method,
    nodes: asset ? [asset.node] : [],
    preconditions: [input.scope],
    steps: [
      {
        id: `${procedureId}-S1`,
        n: 1,
        action: input.action,
        expected: input.expected,
        collect: "Record observations and link the supporting evidence.",
      },
    ],
    duration: 0,
    author: input.owner,
    version: "1",
  };
  campaigns.push(campaign);
  campaignById.set(campaignId, campaign);
  events.push(event);
  eventById.set(eventId, event);
  objectives.push(objective);
  objectiveById.set(objectiveId, objective);
  procedures.push(procedure);
  procedureById.set(procedureId, procedure);
  if (requirement?.program === input.program)
    registerAssessmentVerification({
      requirement: requirement.id,
      objective: objectiveId,
      linkedBy: input.owner,
      linkedOn: bundle.created,
    });
  return campaign;
}

function applySchedule(id: string, patch: SchedulePatch) {
  const campaign = campaignById.get(id);
  if (campaign)
    Object.assign(campaign, { opened: patch.start, target: patch.end, lead: patch.owner });
  const event = eventById.get(id);
  if (event)
    Object.assign(event, {
      start: patch.start,
      end: patch.end,
      window: `${patch.start} – ${patch.end}`,
      team: patch.owner,
    });
}

export function restoreAssessments(): void {
  if (restored || typeof window === "undefined") return;
  restorePrograms();
  const raw = window.localStorage.getItem(key);
  if (raw) {
    const saved = z
      .object({
        bundles: z.array(
          z.object({
            input: inputSchema,
            campaignId: z.string().regex(/^TC-\d+$/),
            eventId: z.string().regex(/^TE-\d+$/),
            objectiveId: z.string().regex(/^TO-\d+$/),
            procedureId: z.string().regex(/^TP-\d+$/),
            created: z.string().datetime(),
          }),
        ),
        schedule: z.record(scheduleSchema),
      })
      .parse(JSON.parse(raw));
    // Validate the entire saved graph before any record or source date changes.
    const ids = new Set<string>();
    for (const bundle of saved.bundles) {
      validateScope(bundle.input);
      for (const [id, exists] of [
        [bundle.campaignId, campaignById.has(bundle.campaignId)],
        [bundle.eventId, eventById.has(bundle.eventId)],
        [bundle.objectiveId, objectiveById.has(bundle.objectiveId)],
        [bundle.procedureId, procedureById.has(bundle.procedureId)],
      ] as const) {
        if (ids.has(id) || exists)
          throw new Error("A saved assessment ID conflicts with another record.");
        ids.add(id);
      }
    }
    const scheduledIds = new Set([
      ...campaignById.keys(),
      ...eventById.keys(),
      ...saved.bundles.flatMap((bundle) => [bundle.campaignId, bundle.eventId]),
    ]);
    if (Object.keys(saved.schedule).some((id) => !scheduledIds.has(id)))
      throw new Error("Saved schedule references an unknown assessment.");
    restoreVerificationLinks();
    bundles.splice(0, bundles.length, ...saved.bundles);
    for (const bundle of bundles) register(bundle);
    schedulePatches = saved.schedule;
    for (const [id, patch] of Object.entries(schedulePatches)) applySchedule(id, patch);
  }
  restored = true;
  emit();
}

function nextId(prefix: string, list: { id: string }[]) {
  return `${prefix}-${Math.max(0, ...list.map((r) => Number(r.id.replace(`${prefix}-`, "")) || 0)) + 1}`;
}

function validateScope(input: NewAssessment) {
  if (!programs.some((p) => p.id === input.program)) throw new Error("Program not found.");
  if (input.requirement && getRequirement(input.requirement)?.program !== input.program)
    throw new Error("Choose a requirement from this program.");
  if (input.asset && !assets.some((a) => a.id === input.asset && a.program === input.program))
    throw new Error("Choose an asset from this program.");
}

export function createAssessment(value: NewAssessment): Campaign {
  restoreAssessments();
  const input = inputSchema.parse(value);
  validateScope(input);
  restoreVerificationLinks();
  const bundle = {
    input,
    campaignId: nextId("TC", campaigns),
    eventId: nextId("TE", events),
    objectiveId: nextId("TO", objectives),
    procedureId: nextId("TP", procedures),
    created: clockNow().toISOString(),
  };
  if (typeof window !== "undefined")
    window.localStorage.setItem(
      key,
      JSON.stringify({ bundles: [...bundles, bundle], schedule: schedulePatches }),
    );
  const campaign = register(bundle);
  bundles.push(bundle);
  record({
    program: input.program,
    subject: { kind: "program", id: input.program },
    kind: "created",
    actor: input.owner,
    summary: `Created assessment ${campaign.id}: ${campaign.name}.`,
  });
  emit();
  return campaign;
}

function updateSchedule(id: string, input: SchedulePatch, actor: string) {
  restoreAssessments();
  if (!campaignById.has(id) && !eventById.has(id)) throw new Error("Assessment not found.");
  const patch = scheduleSchema.parse(input);
  const next = { ...schedulePatches, [id]: patch };
  if (typeof window !== "undefined")
    window.localStorage.setItem(key, JSON.stringify({ bundles, schedule: next }));
  schedulePatches = next;
  applySchedule(id, patch);
  const campaign = campaignById.get(id) ?? campaignById.get(eventById.get(id)?.campaign ?? "");
  if (campaign)
    record({
      program: campaign.program,
      subject: { kind: "program", id: campaign.program },
      kind: "change",
      actor,
      summary: `Updated ${id} schedule to ${patch.start} – ${patch.end}; owner ${patch.owner}.`,
    });
  emit();
}

export function updateAssessmentSchedule(id: string, patch: SchedulePatch, actor = "Program team") {
  restoreAssessments();
  if (!campaignById.has(id)) throw new Error("Assessment not found.");
  updateSchedule(id, patch, actor);
}
export function updateEventSchedule(id: string, patch: SchedulePatch, actor = "Program team") {
  restoreAssessments();
  if (!eventById.has(id)) throw new Error("Test event not found.");
  updateSchedule(id, patch, actor);
}
