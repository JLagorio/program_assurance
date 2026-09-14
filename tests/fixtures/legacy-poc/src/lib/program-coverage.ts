/**
 * Pure selectors for the RMF coverage picture on a program record page.
 *
 * Coverage is derived from the live control matrix, so it moves whenever a
 * control is edited, a finding lands, or a POA&M section closes. Milestones and
 * the gate outlook come from the program's lifecycle gates.
 */

import { datasetNow } from "@/lib/dataset-clock";
import { controlFamilies, gatesForProgram, type Program, type ProgramGate } from "@/lib/grc-data";
import { daysUntil, parseGateDate } from "@/lib/program-stage";
import type { ControlRow } from "@/lib/control-matrix";

export type CoverageSegment = {
  key: "satisfied" | "partial" | "other" | "notAssessed";
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "neutral";
};

export type FamilyCoverage = {
  id: string;
  name: string;
  total: number;
  satisfied: number;
  partial: number;
  other: number;
  notAssessed: number;
  inherited: number;
  owner: string;
  /** 0–100 satisfied share, used for sorting and the mini bar. */
  pct: number;
};

export type Coverage = {
  total: number;
  segments: CoverageSegment[];
  satisfied: number;
  pct: number;
  inherited: number;
  systemImplemented: number;
  families: FamilyCoverage[];
};

const familyNames = new Map(controlFamilies.map((f) => [f.id, f.name]));
const familyOwners = new Map(controlFamilies.map((f) => [f.id, f.owner]));

/** Roll a set of matrix rows up into the coverage picture. */
export function coverageFromRows(rows: ControlRow[]): Coverage {
  const byFamily = new Map<string, FamilyCoverage>();

  for (const r of rows) {
    let f = byFamily.get(r.family);
    if (!f) {
      f = {
        id: r.family,
        name: familyNames.get(r.family) ?? r.familyName,
        owner: familyOwners.get(r.family) ?? "Unassigned",
        total: 0,
        satisfied: 0,
        partial: 0,
        other: 0,
        notAssessed: 0,
        inherited: 0,
        pct: 0,
      };
      byFamily.set(r.family, f);
    }
    f.total += 1;
    if (r.status === "Satisfied") f.satisfied += 1;
    else if (r.status === "Partial") f.partial += 1;
    else if (r.status === "Other than satisfied") f.other += 1;
    else f.notAssessed += 1;
    if (r.implementation === "Inherited") f.inherited += 1;
  }

  const families = [...byFamily.values()].map((f) => ({
    ...f,
    pct: f.total ? Math.round((f.satisfied / f.total) * 100) : 0,
  }));

  const sum = (pick: (f: FamilyCoverage) => number) => families.reduce((a, f) => a + pick(f), 0);
  const total = sum((f) => f.total);
  const satisfied = sum((f) => f.satisfied);
  const inherited = sum((f) => f.inherited);

  return {
    total,
    satisfied,
    pct: total ? Math.round((satisfied / total) * 100) : 0,
    inherited,
    systemImplemented: Math.max(0, total - inherited),
    segments: [
      { key: "satisfied", label: "Satisfied", value: satisfied, tone: "success" },
      { key: "partial", label: "Partial", value: sum((f) => f.partial), tone: "warning" },
      { key: "other", label: "Other than satisfied", value: sum((f) => f.other), tone: "danger" },
      {
        key: "notAssessed",
        label: "Not assessed",
        value: sum((f) => f.notAssessed),
        tone: "neutral",
      },
    ],
    families: [...families].sort((a, b) => a.pct - b.pct),
  };
}

/** Gates worth putting on a milestone track — decision points, not every review. */
const milestoneIds = ["MS-A", "PDR", "MS-B", "CDR", "TRR", "RMF-6", "MS-C", "RMF-7", "IOC"];

export type MilestoneNode = {
  id: string;
  name: string;
  planned: string;
  status: string;
  owner: string;
  state: "done" | "current" | "upcoming";
  daysOut: number | null;
  tone: "success" | "warning" | "danger" | "information" | "neutral";
};

export function programMilestones(program: Program, now = datasetNow): MilestoneNode[] {
  const gates = gatesForProgram(program.id)
    .filter((g) => milestoneIds.includes(g.id))
    .sort((a, b) => {
      const da = parseGateDate(a.planned)?.getTime() ?? 0;
      const db = parseGateDate(b.planned)?.getTime() ?? 0;
      return da - db;
    });

  const currentIndex = gates.findIndex((g) => g.status !== "Complete");

  return gates.map((g, i) => {
    const done = currentIndex === -1 ? true : i < currentIndex;
    const state: MilestoneNode["state"] = done
      ? "done"
      : i === currentIndex
        ? "current"
        : "upcoming";
    const daysOut = daysUntil(g.planned, now);
    const tone: MilestoneNode["tone"] =
      state === "done"
        ? "success"
        : g.status === "Blocked" || (daysOut !== null && daysOut < 0)
          ? "danger"
          : state === "current"
            ? daysOut !== null && daysOut < 30
              ? "warning"
              : "information"
            : "neutral";

    return {
      id: g.id,
      name: g.name,
      planned: g.planned,
      status: g.status,
      owner: g.owner,
      state,
      daysOut,
      tone,
    };
  });
}

/* --------------------------------------------------- remaining gates */

export type GateOutlookRow = {
  gate: ProgramGate;
  daysOut: number | null;
  tone: "success" | "warning" | "danger" | "information" | "neutral";
  /** Controls still not satisfied that this gate depends on. */
  blockers: number;
};

export type GateOutlook = {
  remaining: GateOutlookRow[];
  completed: number;
  total: number;
  next: GateOutlookRow | null;
};

export function gateOutlook(program: Program, rows: ControlRow[], now = datasetNow): GateOutlook {
  const gates = gatesForProgram(program.id);
  const openControls = rows.filter((r) => r.status !== "Satisfied");

  const remaining = gates
    .filter((g) => g.status !== "Complete")
    .map<GateOutlookRow>((g) => {
      const daysOut = daysUntil(g.planned, now);
      const tone: GateOutlookRow["tone"] =
        g.status === "Blocked" || (daysOut !== null && daysOut < 0)
          ? "danger"
          : g.status === "At risk"
            ? "warning"
            : g.status === "In progress"
              ? "information"
              : "neutral";
      const blockers =
        g.kind === "RMF action" || g.kind === "Milestone decision"
          ? openControls.filter((r) => r.openFindings > 0 || r.status === "Other than satisfied")
              .length
          : 0;
      return { gate: g, daysOut, tone, blockers };
    })
    .sort((a, b) => {
      const da = parseGateDate(a.gate.planned)?.getTime() ?? 0;
      const db = parseGateDate(b.gate.planned)?.getTime() ?? 0;
      return da - db;
    });

  return {
    remaining,
    completed: gates.filter((g) => g.status === "Complete").length,
    total: gates.length,
    next: remaining[0] ?? null,
  };
}

/* ------------------------------------------------- next RMF deadlines */

export type DeadlineKind = "Gate" | "POA&M" | "Control";

export type Deadline = {
  id: string;
  kind: DeadlineKind;
  label: string;
  date: string;
  daysOut: number | null;
  owner: string;
  tone: "success" | "warning" | "danger" | "information" | "neutral";
  note: string;
};

function toneFor(daysOut: number | null, atRisk: boolean) {
  if (daysOut !== null && daysOut < 0) return "danger" as const;
  if (atRisk) return "warning" as const;
  if (daysOut !== null && daysOut < 30) return "warning" as const;
  return "neutral" as const;
}

/**
 * One calendar for the program: the gates it still has to pass, the POA&M
 * sections it has committed to, and the controls carrying a remediation date.
 * Sorted by date, which is the only order that matters to the person working it.
 */
export function programDeadlines(
  program: Program,
  rows: ControlRow[],
  poams: {
    id: string;
    title: string;
    owner: string;
    status: string;
    scheduledCompletion: string;
  }[],
  now = datasetNow,
  limit = 12,
): Deadline[] {
  const out: Deadline[] = [];

  for (const g of gatesForProgram(program.id)) {
    if (g.status === "Complete") continue;
    const daysOut = daysUntil(g.planned, now);
    out.push({
      id: g.id,
      kind: "Gate",
      label: g.name,
      date: g.planned,
      daysOut,
      owner: g.owner,
      tone: g.status === "Blocked" ? "danger" : toneFor(daysOut, g.status === "At risk"),
      note: g.cyberGate,
    });
  }

  for (const p of poams) {
    if (p.status === "Completed" || p.scheduledCompletion === "—") continue;
    const daysOut = daysUntil(p.scheduledCompletion, now);
    out.push({
      id: p.id,
      kind: "POA&M",
      label: p.title,
      date: p.scheduledCompletion,
      daysOut,
      owner: p.owner,
      tone: p.status === "Overdue" ? "danger" : toneFor(daysOut, false),
      note: `${p.status} commitment`,
    });
  }

  const dated = rows
    .filter((r) => r.status !== "Satisfied" && r.due !== "—" && !r.poam)
    .map((r) => ({ row: r, daysOut: daysUntil(r.due, now) }))
    .filter((r) => r.daysOut !== null)
    .sort((a, b) => a.daysOut! - b.daysOut!)
    .slice(0, 6);

  for (const { row, daysOut } of dated) {
    out.push({
      id: row.id,
      kind: "Control",
      label: row.title,
      date: row.due,
      daysOut,
      owner: row.owner,
      tone: toneFor(daysOut, row.openFindings > 0),
      note: row.nextAction,
    });
  }

  return out
    .sort((a, b) => {
      const da = parseGateDate(a.date)?.getTime() ?? 0;
      const db = parseGateDate(b.date)?.getTime() ?? 0;
      return da - db;
    })
    .slice(0, limit);
}
