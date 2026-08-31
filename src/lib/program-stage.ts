import { datasetNow } from "@/lib/dataset-clock";
import { gatesForProgram, type Program, type ProgramGate } from "@/lib/grc-data";

/** The program IS the state machine. Everything else is reference data. */
export const stages = ["Scope", "Build", "Assess", "Authorize", "Operate"] as const;
export type Stage = (typeof stages)[number];

/** Which stage a gate belongs to. */
const gateStage: Record<string, Stage> = {
  ASR: "Scope",
  "MS-A": "Scope",
  "RMF-1": "Scope",
  SRR: "Scope",
  SFR: "Scope",
  "RMF-2": "Scope",
  PDR: "Build",
  "RMF-3": "Build",
  "MS-B": "Build",
  "RMF-4": "Build",
  CDR: "Build",
  TRR: "Assess",
  "RMF-5": "Assess",
  SVR: "Assess",
  PRR: "Assess",
  "RMF-6": "Assess",
  "MS-C": "Authorize",
  "RMF-7": "Authorize",
  IOC: "Operate",
};

const monthIndex: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseGateDate(value: string): Date | null {
  const m = /^([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const month = monthIndex[m[1]!];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
}

/**
 * Whole days from `now` to `value`, counted between calendar days rather than
 * between instants: a due date is late once the day turns, not once the hour
 * passes, and floor-to-UTC-midnight is what `conmon.ts` counts with, so the two
 * pages agree on the same commitment.
 */
export function daysUntil(value: string, now = datasetNow): number | null {
  const d = parseGateDate(value);
  if (!d) return null;
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((d.getTime() - base) / 86_400_000);
}

export type ProgramState = {
  gates: ProgramGate[];
  currentGate: ProgramGate | null;
  currentStage: Stage;
  daysOut: number | null;
  blocker: string | null;
  blockerTone: "danger" | "warning" | null;
  /** Single state-derived call to action. No drifting buttons. */
  primaryAction: string;
  stageStatus: Record<Stage, "done" | "current" | "locked">;
};

/**
 * `controlsFailing` is a parameter, not a read of `program.controlsFailing`:
 * the authored record carries the last signed package figure while the live
 * control matrix carries what the page next to this rail is showing. Callers
 * that have the rows pass the derived count so the Blocker cannot contradict
 * the coverage card. Control-matrix cannot be imported here — control-matrix.ts
 * imports `parseGateDate` from this module.
 */
export function programState(
  program: Program,
  now = datasetNow,
  controlsFailing = program.controlsFailing,
): ProgramState {
  const gates = gatesForProgram(program.id);
  const currentGate =
    gates.find((g) => g.status === "Blocked") ??
    gates.find((g) => g.status === "At risk") ??
    gates.find((g) => g.status === "In progress") ??
    gates.find((g) => g.status === "Planned") ??
    null;

  const currentStage: Stage =
    (currentGate ? gateStage[currentGate.id] : undefined) ?? "Operate";

  const daysOut = currentGate ? daysUntil(currentGate.planned, now) : null;

  let blocker: string | null = null;
  let blockerTone: "danger" | "warning" | null = null;
  if (currentGate?.status === "Blocked") {
    blocker = currentGate.artifact !== "—" ? currentGate.artifact : `${currentGate.id} blocked`;
    blockerTone = "danger";
  } else if (controlsFailing > 0 && currentStage !== "Scope") {
    blocker = `${controlsFailing} controls other than satisfied`;
    blockerTone = currentGate?.status === "At risk" ? "danger" : "warning";
  } else if (daysOut !== null && daysOut < 0) {
    blocker = `${currentGate?.id} ${Math.abs(daysOut)} days overdue`;
    blockerTone = "danger";
  }

  const primaryAction: string =
    program.status === "Draft"
      ? "Submit scope for approval"
      : currentStage === "Scope"
        ? "Approve tailored baseline"
        : currentStage === "Build"
          ? "Generate CDR package"
          : currentStage === "Assess"
            ? "Record assessment result"
            : currentStage === "Authorize"
              ? "Submit package to SCA"
              : "Log continuous monitoring cycle";

  const idx = stages.indexOf(currentStage);
  const stageStatus = Object.fromEntries(
    stages.map((s, i) => [s, i < idx ? "done" : i === idx ? "current" : "locked"]),
  ) as Record<Stage, "done" | "current" | "locked">;

  return {
    gates,
    currentGate,
    currentStage,
    daysOut,
    blocker,
    blockerTone,
    primaryAction,
    stageStatus,
  };
}
