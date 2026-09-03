/**
 * The remediation plan behind a control that is not satisfied.
 *
 * A plan is not free-standing: it is the work implied by records the program
 * already keeps. The POA&M section supplies the commitment (owner, resources,
 * scheduled completion, milestone note), the findings supply what has to be
 * fixed, and the workstream supplies the people. This module assembles those
 * into the dated task list an ISSM would actually track, so the control page,
 * the finding page and the POA&M section all read the same plan.
 */

import type { ControlRow } from "@/lib/control-matrix";
import type { Finding } from "@/lib/findings";
import { isOpen } from "@/lib/findings";
import { personById, workstreamById, type Workstream } from "@/lib/people";
import { poamById, type PoamItem } from "@/lib/register";

export const taskStatuses = ["Complete", "In progress", "Blocked", "Planned"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusTone: Record<TaskStatus, "success" | "information" | "danger" | "neutral"> = {
  Complete: "success",
  "In progress": "information",
  Blocked: "danger",
  Planned: "neutral",
};

export type RemediationTask = {
  id: string;
  title: string;
  detail: string;
  /** Person or team accountable for this step. */
  owner: string;
  /** PPL- id when the owner is a named person on the program. */
  ownerId: string | null;
  role: string;
  start: string;
  due: string;
  status: TaskStatus;
  /** How the step is proved done. */
  verification: string;
  /** FND- this step closes, when it maps to one. */
  finding: string | null;
};

export type RemediationPlan = {
  control: string;
  controlTitle: string;
  /** The POA&M section carrying the commitment, when one is open. */
  poam: PoamItem | null;
  /** One sentence: what the program is going to do about it. */
  approach: string;
  tasks: RemediationTask[];
  start: string;
  due: string;
  /** 0–100, share of tasks complete. */
  progress: number;
  complete: number;
  total: number;
  status: TaskStatus | "Accepted";
  /** Scheduled completion has already moved once. */
  slipped: boolean;
  workstream: Workstream | null;
  owner: string;
  findings: Finding[];
};

/* ------------------------------------------------------------- dates */

const monthIndex: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
const monthNames = Object.keys(monthIndex);

function parse(value: string): Date | null {
  const m = /^([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const month = monthIndex[m[1]!];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
}

function fmt(d: Date) {
  return `${monthNames[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

const DAY = 86_400_000;

export function planDay(value: string): number | null {
  const d = parse(value);
  return d ? d.getTime() : null;
}

/** Days between two plan dates, for the timeline geometry. */
export function spanDays(from: string, to: string): number {
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return 1;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / DAY));
}

/* -------------------------------------------------------------- shape */

type Step = {
  key: string;
  title: string;
  detail: (ctx: Ctx) => string;
  role: string;
  verification: string;
  /** Share of the plan window this step ends at. */
  at: number;
};

type Ctx = {
  control: string;
  controlTitle: string;
  poam: PoamItem | null;
  findings: Finding[];
  worst: Finding | null;
  workstream: Workstream | null;
};

const steps: Step[] = [
  {
    key: "scope",
    title: "Confirm the finding and scope the affected assets",
    detail: (c) =>
      c.worst
        ? `Reproduce ${c.worst.id} on ${c.worst.asset} and enumerate every asset in the boundary carrying the same configuration. ${c.findings.length > 1 ? `${c.findings.length} findings currently sit against ${c.control}.` : ""}`.trim()
        : `Establish the gap against ${c.control} on every asset in the boundary and record the starting state.`,
    role: "Finding owner",
    verification: "Scoping note attached to the POA&M section",
    at: 0.15,
  },
  {
    key: "author",
    title: "Author the change against the hardened baseline",
    detail: (c) =>
      c.poam
        ? c.poam.remediation
        : `Write the configuration or design change that brings ${c.control} to satisfied, and stage it for review.`,
    role: "Implementing engineer",
    verification: "Merged baseline change with a reviewer of record",
    at: 0.45,
  },
  {
    key: "ccb",
    title: "Take the change through the configuration control board",
    detail: () =>
      "CM-3 requires the change to be reviewed, approved and scheduled before it touches the boundary. Carry the security impact analysis into the board package.",
    role: "Configuration manager",
    verification: "CCB minutes and an approved change record",
    at: 0.6,
  },
  {
    key: "deploy",
    title: "Deploy across the authorization boundary",
    detail: (c) =>
      `Roll the change to every affected asset in the change window and confirm drift enforcement keeps it applied.${c.poam ? ` Resourcing on record: ${c.poam.resources.toLowerCase()}.` : ""}`,
    role: "Platform owner",
    verification: "Deployment record plus a clean drift report",
    at: 0.8,
  },
  {
    key: "retest",
    title: "Re-run verification and attach the evidence",
    detail: (c) =>
      c.worst
        ? `Re-run the ${c.worst.source.toLowerCase()} that produced ${c.worst.id} and attach the result so the finding can move to closed.`
        : `Re-run the assessment procedure for ${c.control} and attach the result as evidence.`,
    role: "Assessor",
    verification: "Assessment result showing the objective met",
    at: 0.93,
  },
  {
    key: "close",
    title: "Close the POA&M section with the AO",
    detail: (c) =>
      c.poam
        ? `Submit the closure package for ${c.poam.id} with the evidence trail, and record the AO's acceptance of the residual.`
        : `Open a POA&M section for ${c.control} so the commitment carries a date the AO can hold.`,
    role: "ISSM",
    verification: "Closure recorded against the POA&M section",
    at: 1,
  },
];

/* ------------------------------------------------------------ statuses */

/**
 * How far the plan has run. The POA&M status is the authority — a completed
 * section means every step landed, an overdue one means the plan stalled where
 * the milestone note says it stalled.
 */
function progressIndex(poam: PoamItem | null, findings: Finding[]): number {
  if (poam?.status === "Completed") return steps.length;
  if (poam?.status === "Risk accepted") return 1;
  const open = findings.filter(isOpen);
  const retestPending = open.some((f) => f.lifecycle === "Retest pending");
  const remediating = open.some((f) => f.lifecycle === "Remediating");
  const triaged = open.some((f) => f.lifecycle === "Triaged");
  if (retestPending) return 4;
  if (remediating) return 3;
  if (poam) return triaged ? 2 : 2;
  return triaged ? 1 : 0;
}

function statusFor(index: number, done: number, stalled: boolean): TaskStatus {
  if (index < done) return "Complete";
  if (index === done) return stalled ? "Blocked" : "In progress";
  return "Planned";
}

/* -------------------------------------------------------------- build */

function ownerFor(
  step: Step,
  ctx: Ctx,
  familyOwner: string,
): { owner: string; ownerId: string | null } {
  const lead = ctx.workstream ? personById.get(ctx.workstream.lead) : undefined;
  const member = ctx.workstream?.members.find((m) => m.person !== ctx.workstream?.lead);
  const memberPerson = member ? personById.get(member.person) : undefined;

  switch (step.key) {
    case "scope":
    case "deploy":
      return { owner: ctx.worst?.owner ?? familyOwner, ownerId: null };
    case "author":
      return memberPerson
        ? { owner: memberPerson.name, ownerId: memberPerson.id }
        : { owner: ctx.worst?.owner ?? familyOwner, ownerId: null };
    case "ccb":
      return lead ? { owner: lead.name, ownerId: lead.id } : { owner: familyOwner, ownerId: null };
    case "retest":
      return { owner: "Nadia Fournier", ownerId: "PPL-0113" };
    default:
      return { owner: ctx.poam?.owner ?? familyOwner, ownerId: null };
  }
}

/** The plan for one matrix row, or null when the control is already satisfied. */
export function remediationPlan(row: ControlRow): RemediationPlan | null {
  const poam = row.poam ? (poamById.get(row.poam) ?? null) : null;
  const findings = row.findings;
  if (row.status === "Satisfied" && !poam && findings.every((f) => !isOpen(f))) return null;

  const worst = findings.find(isOpen) ?? findings[0] ?? null;
  const workstream = row.workstream ? (workstreamById.get(row.workstream) ?? null) : null;
  const ctx: Ctx = {
    control: row.id,
    controlTitle: row.fullTitle,
    poam,
    findings,
    worst,
    workstream,
  };

  const dueText = poam?.scheduledCompletion ?? row.due;
  const end = parse(dueText === "—" ? "" : dueText) ?? new Date(Date.now() + 45 * DAY);
  const window = poam ? 70 : 45;
  const startDate = new Date(end.getTime() - window * DAY);

  const done = progressIndex(poam, findings);
  const stalled = poam?.status === "Overdue" || findings.some((f) => f.lifecycle === "Open");

  const tasks: RemediationTask[] = steps.map((step, i) => {
    const previous = i === 0 ? 0 : steps[i - 1]!.at;
    const start = new Date(startDate.getTime() + previous * window * DAY);
    const due = new Date(startDate.getTime() + step.at * window * DAY);
    const { owner, ownerId } = ownerFor(step, ctx, row.owner);
    return {
      id: `${poam?.id.replace("POAM-", "RT-") ?? `RT-${row.id.replace(/[^A-Z0-9]/gi, "")}`}-${i + 1}`,
      title: step.title,
      detail: step.detail(ctx),
      owner,
      ownerId,
      role: step.role,
      start: fmt(start),
      due: fmt(due),
      status: poam?.status === "Risk accepted" && i > 0 ? "Planned" : statusFor(i, done, stalled),
      verification: step.verification,
      finding: step.key === "scope" || step.key === "retest" ? (worst?.id ?? null) : null,
    };
  });

  const complete = tasks.filter((t) => t.status === "Complete").length;

  return {
    control: row.id,
    controlTitle: row.fullTitle,
    poam,
    approach: approachFor(row, poam, worst),
    tasks,
    start: tasks[0]!.start,
    due: tasks[tasks.length - 1]!.due,
    progress: Math.round((complete / tasks.length) * 100),
    complete,
    total: tasks.length,
    status:
      poam?.status === "Risk accepted"
        ? "Accepted"
        : complete === tasks.length
          ? "Complete"
          : stalled
            ? "Blocked"
            : complete > 0
              ? "In progress"
              : "Planned",
    slipped: !!poam && poam.scheduledCompletion !== poam.originalCompletion,
    workstream,
    owner: poam?.owner ?? row.owner,
    findings,
  };
}

function approachFor(row: ControlRow, poam: PoamItem | null, worst: Finding | null): string {
  if (poam?.status === "Risk accepted")
    return `No technical remediation is planned. ${poam.milestoneNote} The residual is revisited at reauthorization.`;
  if (poam?.status === "Completed")
    return `${poam.remediation} The section closed on ${poam.scheduledCompletion}.`;
  if (poam) return poam.remediation;
  if (worst)
    return `${worst.id} is open against ${row.id} with no POA&M section behind it. The plan below is the work the program owes; it needs a dated commitment before the next gate.`;
  return `${row.id} is ${row.status.toLowerCase()}. The steps below take it to satisfied; none of them carries a dated commitment yet.`;
}

/** The plan a finding sits inside, keyed off the control it verifies. */
export function planForFinding(finding: Finding, rows: ControlRow[]): RemediationPlan | null {
  const row = rows.find((r) => r.id === finding.control);
  if (!row) return null;
  return remediationPlan(row);
}
