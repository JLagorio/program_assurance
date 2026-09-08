/**
 * Programs created at runtime.
 *
 * The seed array in `grc-data.ts` is what every route loader and selector reads
 * with `programs.find(...)` at call time, so registering a program is a push
 * onto it plus a version bump for the surfaces that memoise over the list.
 * Same stable-snapshot contract as `useRequirementsVersion`: the hook returns
 * a number and callers key a `useMemo` off it.
 */

import { useEffect, useSyncExternalStore } from "react";
import { toast } from "@ledger/design-system";
import { z } from "zod";

import { programs, type Program } from "@/lib/grc-data";

const listeners = new Set<() => void>();
let version = 0;
let restored = false;
let programsRestored = false;
const programKey = "equinox.programs.v1";
const seededIds = new Set(programs.map((program) => program.id.toLowerCase()));
let savedPrograms: Program[] = [];
const impactSchema = z.enum(["Low", "Moderate", "High"]);
const programSchema = z.object({
  id: z.string().regex(/^PRG-\d+$/),
  name: z.string().trim().min(1),
  acronym: z.string(),
  system: z.string(),
  type: z.enum(["Major application", "General support system", "Minor application"]),
  environment: z.enum(["AWS GovCloud", "AWS Commercial", "Azure", "On-premise"]),
  impact: impactSchema,
  confidentiality: impactSchema,
  integrity: impactSchema,
  availability: impactSchema,
  baseline: z.string(),
  controlsTotal: z.number().int().nonnegative(),
  controlsAssessed: z.number().int().nonnegative(),
  controlsFailing: z.number().int().nonnegative(),
  status: z.enum(["Draft", "In assessment", "Authorized", "POA&M open", "Expired"]),
  owner: z.string(),
  assessor: z.string(),
  authorizingOfficial: z.string(),
  authorized: z.string(),
  expires: z.string(),
  updated: z.string(),
  summary: z.string(),
  archivedAt: z.string().optional(),
  assessmentScheduled: z.string().optional(),
});
const commandKey = "equinox.program-commands.v1";
type CommandPatch = Pick<Program, "archivedAt" | "assessmentScheduled">;
let commandPatches: Record<string, CommandPatch> = {};

/** Restore program identities before their requirements, assessments or evidence. */
export function restorePrograms() {
  if (programsRestored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(programKey);
  const next = raw ? z.array(programSchema).parse(JSON.parse(raw)) : [];
  const ids = next.map((program) => program.id.toLowerCase());
  if (new Set(ids).size !== ids.length || ids.some((id) => seededIds.has(id)))
    throw new Error("Saved program IDs conflict with another program.");
  savedPrograms = next;
  for (const program of next) {
    const existing = programs.find((item) => item.id === program.id);
    if (existing) Object.assign(existing, program);
    else programs.push(program);
  }
  programsRestored = true;
  version += 1;
  for (const listener of listeners) listener();
}

export function restoreProgramCommands() {
  if (restored || typeof window === "undefined") return;
  restorePrograms();
  const raw = window.localStorage.getItem(commandKey);
  if (!raw) {
    restored = true;
    return;
  }
  const next = z
    .record(
      z.object({ archivedAt: z.string().optional(), assessmentScheduled: z.string().optional() }),
    )
    .parse(JSON.parse(raw));
  commandPatches = next;
  for (const [id, patch] of Object.entries(commandPatches)) {
    const program = programs.find((item) => item.id === id);
    if (program && patch && typeof patch === "object") Object.assign(program, patch);
  }
  restored = true;
  version += 1;
  for (const listener of listeners) listener();
}

export function saveProgramCommand(id: string, patch: CommandPatch) {
  saveProgramCommands([id], patch);
}

export function saveProgramCommands(ids: string[], patch: CommandPatch) {
  restoreProgramCommands();
  if (ids.some((id) => !programs.some((program) => program.id === id)))
    throw new Error("Program not found.");
  const next = { ...commandPatches };
  for (const id of ids) next[id] = { ...next[id], ...patch };
  if (typeof window !== "undefined") window.localStorage.setItem(commandKey, JSON.stringify(next));
  commandPatches = next;
  for (const id of ids)
    Object.assign(
      programs.find((program) => program.id === id)!,
      patch,
    );
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribePrograms(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function programsVersion(): number {
  return version;
}

export function useProgramsVersion(): number {
  useEffect(() => {
    try {
      restoreProgramCommands();
    } catch {
      toast.error("Saved program actions could not be restored", {
        description: "Browser storage is unavailable or saved data is invalid.",
      });
    }
  }, []);
  return useSyncExternalStore(subscribePrograms, programsVersion, programsVersion);
}

export function nextProgramId(): string {
  restorePrograms();
  const max = programs.reduce((m, p) => Math.max(m, Number(p.id.replace(/^PRG-/, "")) || 0), 0);
  return `PRG-${max + 1}`;
}

export function addProgram(input: Omit<Program, "id"> & { id?: string }): Program {
  restorePrograms();
  const id = input.id ?? nextProgramId();
  const existing = programs.find((p) => p.id.toLowerCase() === id.toLowerCase());
  if (existing) return existing;
  const created = programSchema.parse({ ...input, id });
  const next = [...savedPrograms, created];
  if (typeof window !== "undefined") window.localStorage.setItem(programKey, JSON.stringify(next));
  savedPrograms = next;
  programs.push(created);
  version += 1;
  for (const l of listeners) l();
  return created;
}

export function updateProgram(id: string, patch: Partial<Omit<Program, "id">>) {
  restorePrograms();
  const p = programs.find((x) => x.id === id);
  if (!p) return;
  if (savedPrograms.some((program) => program.id === id)) {
    const updated = programSchema.parse({ ...p, ...patch });
    const next = savedPrograms.map((program) => (program.id === id ? updated : program));
    if (typeof window !== "undefined")
      window.localStorage.setItem(programKey, JSON.stringify(next));
    savedPrograms = next;
    Object.assign(p, updated);
  } else Object.assign(p, patch);
  version += 1;
  for (const l of listeners) l();
}
