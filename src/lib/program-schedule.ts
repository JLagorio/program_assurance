import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { toast } from "@ledger/design-system";

import { record } from "@/lib/activity";
import { campaigns, events } from "@/lib/campaigns";
import { datasetNow } from "@/lib/dataset-clock";
import { gatesForProgram, programs, setProgramGateRecord, type ProgramGate } from "@/lib/grc-data";
import { personById, workstreamsForProgram } from "@/lib/people";
import { poamsForProgram } from "@/lib/register";
import { tasksForProgram } from "@/lib/tasks";
import { restorePrograms } from "@/lib/program-store";
import { assessmentState, assessmentEventState } from "@/lib/assessment-store";

const storageKey = "equinox.program-schedule.v1";
const listeners = new Set<() => void>();
let version = 0;
let restored = false;
let saved: Record<string, ProgramGate[]> = {};

const gateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  phase: z.string(),
  kind: z.enum(["Milestone decision", "Engineering review", "RMF action", "Operational"]),
  status: z.enum(["Complete", "In progress", "At risk", "Blocked", "Planned"]),
  planned: z.string(),
  actual: z.string(),
  owner: z.string(),
  artifact: z.string(),
  description: z.string(),
  cyberGate: z.string(),
  dependsOn: z.array(z.string()).default([]),
  workstreams: z.array(z.string()).default([]),
});
const savedSchema = z.record(z.array(gateSchema));
const emit = () => {
  version += 1;
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Browser hydration is explicit so server and initial client render use the same records. */
export function restoreProgramSchedule() {
  if (restored || typeof window === "undefined") return;
  restorePrograms();
  const raw = window.localStorage.getItem(storageKey);
  const next = raw ? savedSchema.parse(JSON.parse(raw)) : {};
  for (const [program, gates] of Object.entries(next)) {
    if (new Set(gates.map((gate) => gate.id)).size !== gates.length)
      throw new Error("Duplicate milestone IDs in saved schedule.");
    for (const gate of gates) validateDates(gate);
  }
  for (const [program, gates] of Object.entries(next)) {
    for (const gate of gates) setProgramGateRecord(program, gate);
  }
  saved = next;
  restored = true;
  emit();
}

export function useProgramScheduleVersion() {
  useEffect(() => {
    try {
      restoreProgramSchedule();
    } catch {
      toast.error("Saved schedule could not be restored", {
        description: "Check browser storage before changing this plan.",
      });
    }
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
}

/** Normalize authored dates. Undated values remain absent; no date is made up. */
export function scheduleDate(value: string | null | undefined): string | null {
  if (!value || value === "—") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? value
      : null;
  }
  if (!/\b\d{4}\b/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : null;
}

function validateDates(gate: ProgramGate) {
  if (gate.planned && gate.planned !== "—" && !scheduleDate(gate.planned))
    throw new Error("Enter a valid planned date.");
  if (gate.actual && gate.actual !== "—" && !scheduleDate(gate.actual))
    throw new Error("Enter a valid actual date.");
  if (gate.status === "Complete" && !scheduleDate(gate.actual))
    throw new Error("Completed milestones need an actual date.");
}

export function programScheduleMilestones(programId: string) {
  return gatesForProgram(programId);
}

export function saveProgramMilestone(programId: string, input: ProgramGate, actor: string) {
  restoreProgramSchedule();
  if (!programs.some((program) => program.id === programId)) throw new Error("Program not found.");
  const gate = gateSchema.parse(input);
  validateDates(gate);
  const programGates = gatesForProgram(programId);
  const allowed = new Set(programGates.map((item) => item.id));
  if (gate.dependsOn?.some((id) => id === gate.id || !allowed.has(id)))
    throw new Error("Choose other milestones in this program as dependencies.");
  const streams = new Set(workstreamsForProgram(programId).map((stream) => stream.id));
  if (gate.workstreams?.some((id) => !streams.has(id)))
    throw new Error("Choose a workstream in this program.");
  const byId = new Map(
    [...programGates.filter((item) => item.id !== gate.id), gate].map((item) => [item.id, item]),
  );
  const walk = (id: string, path: Set<string>): boolean => {
    if (path.has(id)) return true;
    const next = new Set(path).add(id);
    return (byId.get(id)?.dependsOn ?? []).some((dependency) => walk(dependency, next));
  };
  if (walk(gate.id, new Set())) throw new Error("Milestone dependencies cannot form a cycle.");
  const existing = programGates.find((item) => item.id === gate.id);
  const next = {
    ...saved,
    [programId]: [...(saved[programId] ?? []).filter((item) => item.id !== gate.id), gate],
  };
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(next));
  saved = next;
  setProgramGateRecord(programId, gate);
  record({
    program: programId,
    actor,
    kind: existing ? "change" : "created",
    subject: { kind: "program", id: programId },
    summary: `${existing ? "updated" : "added"} milestone ${gate.id} — ${gate.name}`,
    body: `Planned: ${gate.planned || "Undated"}. Owner: ${gate.owner || "Unassigned"}. Status: ${gate.status}.`,
  });
  emit();
  return gate;
}

export function nextMilestoneId(programId: string) {
  const existing = new Set(gatesForProgram(programId).map((gate) => gate.id));
  let index = 1;
  while (existing.has(`MS-${String(index).padStart(4, "0")}`)) index += 1;
  return `MS-${String(index).padStart(4, "0")}`;
}

export const scheduleTracks = [
  "Acquisition",
  "RMF",
  "Cyber T&E",
  "Implementation",
  "Remediation",
  "Tasks",
] as const;
export type ScheduleRow = {
  id: string;
  sourceId: string;
  title: string;
  track: (typeof scheduleTracks)[number];
  kind:
    "Milestone" | "Workstream" | "Assessment" | "Test event" | "POA&M" | "POA&M milestone" | "Task";
  phase: string;
  status: string;
  owner: string;
  team: string;
  start: string | null;
  due: string | null;
  dates: string;
  dependency: string;
  complete: boolean;
  overdue: boolean;
  poamId?: string;
};

const scheduleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function scheduleWindowLabel(value: string) {
  return value.replace(
    /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?\b/g,
    (value) => {
      const date = scheduleDate(value.slice(0, 10));
      return date ? scheduleDateFormatter.format(new Date(`${date}T00:00:00Z`)) : value;
    },
  );
}

/** Read-only projections of source records. The schedule does not copy POA&M or task dates. */
export function scheduleForProgram(programId: string, now = datasetNow): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const add = (row: Omit<ScheduleRow, "id" | "overdue">) =>
    rows.push({
      ...row,
      dates: scheduleWindowLabel(row.dates),
      id: `${row.kind}:${row.sourceId}`,
      overdue: !row.complete && !!row.due && row.due < now.toISOString().slice(0, 10),
    });
  const workstreams = workstreamsForProgram(programId);
  for (const gate of gatesForProgram(programId))
    add({
      sourceId: gate.id,
      title: gate.name,
      track: gate.kind === "RMF action" ? "RMF" : "Acquisition",
      kind: "Milestone",
      phase: gate.phase,
      status: gate.status,
      owner: gate.owner,
      team: (gate.workstreams ?? [])
        .map((id) => workstreams.find((stream) => stream.id === id)?.title ?? id)
        .join(", "),
      start: null,
      due: scheduleDate(gate.planned),
      dates: gate.planned || "Undated",
      dependency: (gate.dependsOn ?? []).join(", "),
      complete: gate.status === "Complete",
    });
  for (const stream of workstreams)
    add({
      sourceId: stream.id,
      title: stream.title,
      track: "Implementation",
      kind: "Workstream",
      phase: stream.stage,
      status: stream.status,
      owner: personById.get(stream.lead)?.name ?? stream.lead,
      team: stream.disciplines.join(", "),
      start: null,
      due: scheduleDate(stream.due),
      dates: stream.due,
      dependency: [...stream.dependsOn, stream.gate].filter(Boolean).join(", "),
      complete: stream.status === "Done",
    });
  const scopedCampaigns = campaigns.filter((campaign) => campaign.program === programId);
  for (const campaign of scopedCampaigns) {
    add({
      sourceId: campaign.id,
      title: campaign.name,
      track: "Cyber T&E",
      kind: "Assessment",
      phase: campaign.trigger,
      status: assessmentState(campaign),
      owner: campaign.lead,
      team: "",
      start: scheduleDate(campaign.opened),
      due: scheduleDate(campaign.target),
      dates: `${campaign.opened} – ${campaign.target}`,
      dependency: campaign.gate,
      complete: campaign.state === "Closed",
    });
    for (const event of events.filter((item) => item.campaign === campaign.id))
      add({
        sourceId: event.id,
        title: event.name,
        track: "Cyber T&E",
        kind: "Test event",
        phase: event.kind,
        status: assessmentEventState(event),
        owner: event.team,
        team: event.team,
        start: scheduleDate(event.start),
        due: scheduleDate(event.end),
        dates: event.window,
        dependency: campaign.id,
        complete: ["Reported", "Cancelled"].includes(assessmentEventState(event)),
      });
  }
  for (const poam of poamsForProgram(programId)) {
    add({
      sourceId: poam.id,
      title: poam.title,
      track: "Remediation",
      kind: "POA&M",
      phase: "Remediation",
      status: poam.status,
      owner: poam.owner,
      team: "",
      start: null,
      due: scheduleDate(poam.scheduledCompletion),
      dates: poam.scheduledCompletion,
      dependency: "",
      complete: poam.status === "Completed",
      poamId: poam.id,
    });
    for (const milestone of poam.milestones ?? [])
      add({
        sourceId: `${poam.id}/${milestone.id}`,
        title: milestone.title,
        track: "Remediation",
        kind: "POA&M milestone",
        phase: poam.title,
        status: milestone.status,
        owner: poam.owner,
        team: "",
        start: null,
        due: scheduleDate(milestone.targetDate),
        dates: milestone.targetDate,
        dependency: poam.id,
        complete: milestone.status === "Completed",
        poamId: poam.id,
      });
  }
  for (const task of tasksForProgram(programId))
    add({
      sourceId: task.id,
      title: task.title,
      track: "Tasks",
      kind: "Task",
      phase: "Tasks",
      status: task.state,
      owner: task.assignee,
      team: "",
      start: null,
      due: scheduleDate(task.due),
      dates: task.due ?? "Undated",
      dependency: `${task.subject.id}${task.waitingOn ? ` · Waiting on ${task.waitingOn}` : ""}`,
      complete: task.state === "Done",
    });
  return rows.sort(
    (a, b) =>
      Number(a.complete) - Number(b.complete) ||
      (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
      a.title.localeCompare(b.title),
  );
}
