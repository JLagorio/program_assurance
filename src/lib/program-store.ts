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
const commandKey = "equinox.program-commands.v1";
type CommandPatch = Pick<Program, "archivedAt" | "assessmentScheduled">;
let commandPatches: Record<string, CommandPatch> = {};

export function restoreProgramCommands() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  const raw = window.localStorage.getItem(commandKey);
  if (!raw) return;
  commandPatches = z
    .record(
      z.object({ archivedAt: z.string().optional(), assessmentScheduled: z.string().optional() }),
    )
    .parse(JSON.parse(raw));
  for (const [id, patch] of Object.entries(commandPatches)) {
    const program = programs.find((item) => item.id === id);
    if (program && patch && typeof patch === "object") Object.assign(program, patch);
  }
  version += 1;
  for (const listener of listeners) listener();
}

export function saveProgramCommand(id: string, patch: CommandPatch) {
  saveProgramCommands([id], patch);
}

export function saveProgramCommands(ids: string[], patch: CommandPatch) {
  if (ids.some((id) => !programs.some((program) => program.id === id)))
    throw new Error("Program not found.");
  const next = { ...commandPatches };
  for (const id of ids) next[id] = { ...next[id], ...patch };
  window.localStorage.setItem(commandKey, JSON.stringify(next));
  commandPatches = next;
  for (const id of ids) updateProgram(id, patch);
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
  const max = programs.reduce((m, p) => Math.max(m, Number(p.id.replace(/^PRG-/, "")) || 0), 0);
  return `PRG-${max + 1}`;
}

export function addProgram(input: Omit<Program, "id"> & { id?: string }): Program {
  const id = input.id ?? nextProgramId();
  const existing = programs.find((p) => p.id.toLowerCase() === id.toLowerCase());
  if (existing) return existing;
  const created: Program = { ...input, id };
  programs.push(created);
  version += 1;
  for (const l of listeners) l();
  return created;
}

export function updateProgram(id: string, patch: Partial<Omit<Program, "id">>) {
  const p = programs.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, patch);
  version += 1;
  for (const l of listeners) l();
}
