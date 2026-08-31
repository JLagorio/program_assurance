/**
 * Derived "what do I do next" for a program.
 *
 * Pure selectors over existing mock data — no schema changes. Everything here
 * is already visible somewhere in a table; this module turns it into a short,
 * owned, dated action list so the overview stops being a reading exercise.
 */

import type { ControlRow } from "@/lib/control-matrix";
import { controlMatrix } from "@/lib/control-matrix";
import { datasetNow } from "@/lib/dataset-clock";
import type { Program } from "@/lib/grc-data";
import { programState, type Stage } from "@/lib/program-stage";
import { poamItems } from "@/lib/register";
import { findings, isOpen } from "@/lib/findings";
import { inheritanceForProgram } from "@/lib/inheritance";
import { staleThresholdDays } from "@/lib/reusable-components";
import { scopeApprovals } from "@/lib/tailoring";
import type { Tone } from "@/components/app/ui";

/** Which tab the action resolves into. */
export type ActionTarget =
  | "Controls"
  | "Findings"
  | "Evidence"
  | "POA&M"
  | "Activity"
  | "Team";

export type NextAction = {
  id: string;
  tone: Tone;
  label: string;
  owner: string;
  due: string;
  /** Verb on the inline button. */
  cta: string;
  target: ActionTarget;
  stage: Stage;
};

const monthIndex: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(value: string): Date | null {
  const m = /^([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const month = monthIndex[m[1]!];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
}

/**
 * Whole days between calendar days, not between instants — otherwise the same
 * commitment reads "8d overdue" in the morning and "9d overdue" in the evening.
 * Matches `daysUntil` in program-stage.ts and `daysBetween` in conmon.ts.
 */
function daysFromNow(value: string, now: Date): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((d.getTime() - base) / 86_400_000);
}

/** Findings reachable from this program through its POA&M items and risks. */
export function findingsForProgram(programId: string) {
  const poams = new Set(poamItems.filter((p) => p.program === programId).map((p) => p.id));
  const risks = new Set(
    poamItems.filter((p) => p.program === programId && p.risk).map((p) => p.risk!),
  );
  return findings.filter((f) => (f.poam && poams.has(f.poam)) || (f.risk && risks.has(f.risk)));
}

export type Posture = {
  controlsSatisfied: number;
  controlsTotal: number;
  controlsFailing: number;
  findingsOpen: number;
  catI: number;
  poamOpen: number;
  poamOverdue: number;
  evidenceStale: number;
  inheritedControls: number;
};

/**
 * Posture is read off the live control matrix, not off the authored
 * `Program` record: `controlsTotal`/`controlsFailing` there are the last signed
 * package figures, and the coverage card, the family table and the tab badge on
 * the same screen all derive from the rows. Callers that hold the rows pass
 * them so the rail moves with an inline status edit; the fallback keeps a
 * caller without rows on the same source rather than on the stale snapshot.
 */
export function programPosture(
  program: Program,
  rows?: ControlRow[],
  now = datasetNow,
): Posture {
  const matrix = rows ?? controlMatrix(program.id);
  const poams = poamItems.filter((p) => p.program === program.id);
  const open = poams.filter((p) => p.status !== "Completed");
  const overdue = open.filter((p) => {
    const d = daysFromNow(p.scheduledCompletion, now);
    return d !== null && d < 0;
  });
  const fnd = findingsForProgram(program.id).filter(isOpen);
  const inheritance = inheritanceForProgram(program.id);
  const stale = [...inheritance.values()].filter(
    (e) => e.control.evidenceAge > staleThresholdDays,
  );

  return {
    controlsSatisfied: matrix.filter((r) => r.status === "Satisfied").length,
    controlsTotal: matrix.length,
    controlsFailing: matrix.filter((r) => r.status === "Other than satisfied").length,
    findingsOpen: fnd.length,
    catI: fnd.filter((f) => f.mitigatedSeverity === "CAT I").length,
    poamOpen: open.length,
    poamOverdue: overdue.length,
    evidenceStale: stale.length,
    inheritedControls: inheritance.size,
  };
}

/** Max five, worst first. Anything longer is a table, not a call to action. */
export function nextActions(
  program: Program,
  rows?: ControlRow[],
  now = datasetNow,
): NextAction[] {
  const matrix = rows ?? controlMatrix(program.id);
  const controlsFailing = matrix.filter((r) => r.status === "Other than satisfied").length;
  const state = programState(program, now, controlsFailing);
  const out: NextAction[] = [];

  // 1. Gate blocker — the thing stopping the state machine.
  if (state.blocker && state.currentGate) {
    out.push({
      id: `gate-${state.currentGate.id}`,
      tone: state.blockerTone === "danger" ? "danger" : "warning",
      label: `${state.currentGate.id} ${state.currentGate.name} — ${state.blocker}`,
      owner: state.currentGate.owner ?? program.owner,
      due: state.currentGate.planned,
      cta: "Open gate",
      target: "Activity",
      stage: state.currentStage,
    });
  }

  // 2. Scope awaiting a PM decision.
  const approval = scopeApprovals.find((a) => a.programId === program.id);
  if (approval && approval.state !== "Approved") {
    out.push({
      id: `scope-${program.id}`,
      tone: approval.state === "Changes requested" ? "danger" : "warning",
      label:
        approval.state === "Changes requested"
          ? `Tailored baseline returned — ${approval.note ?? "changes requested"}`
          : `Tailored baseline awaiting PM approval — ${approval.controlCount} controls, ${approval.overlayCount} overlays`,
      owner: approval.submittedBy,
      due: approval.submitted,
      cta: "Review scope",
      target: "Controls",
      stage: "Scope",
    });
  }

  // 3. Overdue / imminent POA&M commitments.
  const poams = poamItems
    .filter((p) => p.program === program.id && p.status !== "Completed")
    .map((p) => ({ p, d: daysFromNow(p.scheduledCompletion, now) }))
    .filter((x) => x.d !== null && x.d < 45)
    .sort((a, b) => (a.d! - b.d!));
  for (const { p, d } of poams.slice(0, 2)) {
    out.push({
      id: p.id,
      tone: d! < 0 ? "danger" : "warning",
      label: `${p.id} ${p.title} — ${d! < 0 ? `${Math.abs(d!)}d overdue` : `due in ${d}d`}`,
      owner: p.owner,
      due: p.scheduledCompletion,
      cta: "Open POA&M",
      target: "POA&M",
      stage: "Operate",
    });
  }

  // 4. Controls other than satisfied.
  if (controlsFailing > 0) {
    out.push({
      id: `controls-${program.id}`,
      tone: "danger",
      label: `${controlsFailing} controls other than satisfied in the assessed baseline`,
      owner: program.assessor,
      due: program.updated,
      cta: "Record result",
      target: "Findings",
      stage: "Assess",
    });
  }

  // 5. Stale inherited evidence.
  const inheritance = inheritanceForProgram(program.id);
  const stale = [...inheritance.values()].filter(
    (e) => e.control.evidenceAge > staleThresholdDays,
  );
  if (stale.length > 0) {
    const worst = stale.sort((a, b) => b.control.evidenceAge - a.control.evidenceAge)[0]!;
    out.push({
      id: `stale-${worst.component.id}`,
      tone: "warning",
      label: `${stale.length} inherited controls have evidence older than ${staleThresholdDays}d — ${worst.component.name}`,
      owner: worst.component.owner ?? program.owner,
      due: `${worst.control.evidenceAge}d old`,
      cta: "Refresh evidence",
      target: "Evidence",
      stage: "Build",
    });
  }

  const rank: Record<string, number> = { danger: 0, warning: 1, info: 2, success: 3, neutral: 4 };
  return out.sort((a, b) => (rank[a.tone] ?? 9) - (rank[b.tone] ?? 9)).slice(0, 5);
}
