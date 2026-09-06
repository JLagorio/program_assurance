/**
 * A program's stages: an ordered list of names the program moves through, set
 * per program from a template and editable. RMF's seven steps are the default
 * template; a business function gets another; a program can rename, add or
 * remove its own. A stage is a name and an order. Nothing is gated on it: the
 * strip says where the program is, and moving it is an act that is logged.
 */
import { useSyncExternalStore } from "react";

import { record } from "@/lib/activity";
import { programs } from "@/lib/grc-data";

export type StageSet = { id: string; name: string; stages: string[] };

export const stageSets: StageSet[] = [
  {
    id: "rmf",
    name: "RMF",
    stages: ["Prepare", "Categorize", "Select", "Implement", "Assess", "Authorize", "Monitor"],
  },
  {
    id: "function",
    name: "Business function",
    stages: ["Scope", "Map", "Attest", "Review", "Accept", "Monitor"],
  },
];

const rmf = stageSets[0]!;

const stagesByProgram = new Map<string, string[]>();
const stageByProgram = new Map<string, string>([["PRG-1041", "Implement"]]);
const listeners = new Set<() => void>();
let version = 0;

function bump() {
  version += 1;
  for (const cb of listeners) cb();
}

export function useStagesVersion(): number {
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}

export function stagesFor(programId: string): string[] {
  return stagesByProgram.get(programId) ?? rmf.stages;
}

/** Where the program is. Seeded, or read off its status when nothing was recorded. */
export function stageOf(programId: string): string {
  const stored = stageByProgram.get(programId);
  const stages = stagesFor(programId);
  if (stored && stages.includes(stored)) return stored;
  const status = programs.find((p) => p.id === programId)?.status;
  const guess =
    status === "Draft"
      ? "Prepare"
      : status === "In assessment"
        ? "Assess"
        : status === "Expired"
          ? "Authorize"
          : "Monitor";
  return stages.includes(guess) ? guess : stages[0]!;
}

export function setStage(programId: string, stage: string, actor: string) {
  const before = stageOf(programId);
  if (before === stage) return;
  stageByProgram.set(programId, stage);
  record({
    program: programId,
    actor,
    kind: "stage",
    summary: `moved the program from ${before} to ${stage}`,
    subject: { kind: "program", id: programId },
    field: "stage",
    before,
    after: stage,
  });
  bump();
}

/** Replace the program's stage names. The current stage follows its position when its name changed. */
export function setStages(programId: string, next: string[], actor: string) {
  const cleaned = next.map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  const before = stagesFor(programId);
  const current = stageOf(programId);
  const idx = before.indexOf(current);
  stagesByProgram.set(programId, cleaned);
  if (!cleaned.includes(current)) {
    stageByProgram.set(programId, cleaned[Math.min(Math.max(idx, 0), cleaned.length - 1)]!);
  }
  record({
    program: programId,
    actor,
    kind: "change",
    summary: `changed the stages to ${cleaned.join(", ")}`,
    subject: { kind: "program", id: programId },
    field: "stages",
    before: before.join(", "),
    after: cleaned.join(", "),
  });
  bump();
}

export function applyStageSet(programId: string, setId: string, actor: string) {
  const set = stageSets.find((s) => s.id === setId);
  if (set) setStages(programId, set.stages, actor);
}
