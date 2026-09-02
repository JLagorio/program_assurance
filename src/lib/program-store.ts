/**
 * Programs created at runtime.
 *
 * The seed array in `grc-data.ts` is what every route loader and selector reads
 * with `programs.find(...)` at call time, so registering a program is a push
 * onto it plus a version bump for the surfaces that memoise over the list.
 * Same stable-snapshot contract as `useRequirementsVersion`: the hook returns
 * a number and callers key a `useMemo` off it.
 */

import { useSyncExternalStore } from "react";

import { programs, type Program } from "@/lib/grc-data";

const listeners = new Set<() => void>();
let version = 0;

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
