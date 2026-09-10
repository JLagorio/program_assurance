import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  currentSession,
  registerControlSourceProvider,
  refreshControlSourceDependencies,
} from "./control-work";
import { scopeById } from "./scopes";
import { nodeById } from "./composition";
import { programs } from "./grc-data";
import { initialLibraryState } from "./assurance-library-seed";
import type {
  LibraryAssignment,
  LibraryControl,
  LibraryDecision,
  LibraryEntry,
  LibraryEvidence,
  LibraryKind,
  LibraryProgramEvidence,
  LibrarySource,
  LibraryState,
  LibraryUse,
  LibraryVersion,
} from "./assurance-library-model";
export type * from "./assurance-library-model";

export const libraryStorageKey = "equinox.assurance-library.v1";
const id = z.string().min(1);
const assessment = z.enum(["Not assessed", "Satisfied", "Other than satisfied"]);
const reference = z.object({ entryId: id, versionId: id });
const evidence = z.object({
  id,
  title: z.string().trim().min(1),
  kind: id,
  date: z.string(),
  reference: z.string(),
});
const control = z.object({
  id,
  title: id,
  family: id,
  applicability: z.enum(["Applicable", "Not applicable"]),
  implementation: z.string(),
  consumerResponsibility: z.string(),
  assessment,
  assessor: z.string(),
  assessedOn: z.string(),
  requirementIds: z.array(id),
  evidenceIds: z.array(id),
});
const release = z.object({
  id,
  version: z.string().trim().min(1),
  publishedOn: z.string().nullable(),
  controls: z.array(control),
  requirements: z.array(
    z.object({
      id,
      title: z.string().trim().min(1),
      controlIds: z.array(id),
      status: z.enum(["Open", "Verified"]),
      evidenceIds: z.array(id),
    }),
  ),
  evidence: z.array(evidence),
  children: z.array(reference.extend({ slot: id, name: id })),
  baseOverlay: reference.nullable(),
  conditions: z.array(z.string()),
});
const entrySchema = z.object({
  id,
  key: id,
  kind: z.enum(["Component", "Overlay"]),
  name: z.string().trim().min(1),
  category: id,
  owner: z.string().trim().min(1),
  versions: z.array(release),
  draft: release.nullable(),
});
const decisionSchema = z.object({
  programId: id,
  useId: id,
  controlId: id,
  sourceDecisions: z.record(z.enum(["Pending", "Confirmed", "Excluded"])),
  narrative: z.string(),
  evidenceIds: z.array(id),
  implementation: z.enum(["Not implemented", "Planned", "Partially implemented", "Implemented"]),
  assessment,
  assessor: z.string(),
  assessedOn: z.string(),
  determination: z.string(),
});
const stateSchema = z.object({
  entries: z.array(entrySchema),
  uses: z.array(
    reference.extend({
      id,
      programId: id,
      name: z.string().trim().min(1),
      parentUseId: id.nullable(),
      targetNodeId: id.nullable(),
      role: z.enum(["Component", "Host"]),
      hostUseId: id.nullable(),
      controlIds: z.array(id),
    }),
  ),
  assignments: z.array(reference.extend({ id, programId: id, targetIds: z.array(id).min(1) })),
  decisions: z.array(decisionSchema),
  programEvidence: z.array(evidence.extend({ programId: id, useId: id })),
});
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
let state = freeze(initialLibraryState());
let restored = false;
let revision = 0;
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
export const libraryVersion = () => revision;
export const useLibraryVersion = () =>
  useSyncExternalStore(subscribe, libraryVersion, libraryVersion);
function publish(next: LibraryState) {
  state = freeze(next);
  revision++;
  refreshControlSourceDependencies();
  for (const listener of listeners) listener();
}
const clone = <T>(value: T): T => structuredClone(value);
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const today = () => new Date().toISOString().slice(0, 10);
function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique.`);
}
function entryIn(next: LibraryState, entryId: string) {
  const entry = next.entries.find((item) => item.id === entryId);
  if (!entry) throw new Error("Catalog record not found.");
  return entry;
}
function releaseIn(next: LibraryState, entryId: string, versionId: string) {
  const version = entryIn(next, entryId).versions.find((item) => item.id === versionId);
  if (!version) throw new Error("Choose a published version.");
  return version;
}
function programExists(programId: string) {
  if (!programs.some((program) => program.id === programId)) throw new Error("Program not found.");
}
function programTarget(programId: string): LibraryUse {
  programExists(programId);
  return {
    id: `program:${programId}`,
    programId,
    entryId: "",
    versionId: "",
    name: "Program scope",
    parentUseId: null,
    targetNodeId: null,
    role: "Component",
    hostUseId: null,
    controlIds: [],
  };
}
function instanceIn(next: LibraryState, useId: string): LibraryUse {
  if (useId.startsWith("program:")) return programTarget(useId.slice(8));
  const use = next.uses.find((item) => item.id === useId);
  if (!use) throw new Error("Program component not found.");
  return use;
}
function isProgramTarget(use: LibraryUse) {
  return use.id.startsWith("program:");
}
function blankDecision(use: LibraryUse, controlId: string): LibraryDecision {
  return {
    programId: use.programId,
    useId: use.id,
    controlId,
    sourceDecisions: {},
    narrative: "",
    evidenceIds: [],
    implementation: "Not implemented",
    assessment: "Not assessed",
    assessor: "",
    assessedOn: "",
    determination: "",
  };
}
function validate(next: LibraryState) {
  unique(
    next.entries.map((item) => item.id),
    "Catalog IDs",
  );
  unique(
    next.entries.map((item) => item.key),
    "Catalog keys",
  );
  unique(
    next.uses.map((item) => item.id),
    "Instance IDs",
  );
  unique(
    next.assignments.map((item) => item.id),
    "Assignment IDs",
  );
  unique(
    next.decisions.map((item) => `${item.useId}|${item.controlId}`),
    "Control records",
  );
  unique(
    next.programEvidence.map((item) => item.id),
    "Program evidence IDs",
  );
  for (const entry of next.entries) {
    unique(
      [...entry.versions, ...(entry.draft ? [entry.draft] : [])].map((item) => item.id),
      "Version IDs",
    );
    unique(
      [...entry.versions, ...(entry.draft ? [entry.draft] : [])].map((item) => item.version),
      "Versions",
    );
    for (const version of [...entry.versions, ...(entry.draft ? [entry.draft] : [])]) {
      if (version === entry.draft ? version.publishedOn !== null : !version.publishedOn)
        throw new Error("Invalid release state.");
      unique(
        version.controls.map((item) => item.id),
        "Controls",
      );
      unique(
        version.requirements.map((item) => item.id),
        "Requirements",
      );
      unique(
        version.evidence.map((item) => item.id),
        "Evidence IDs",
      );
      unique(
        version.children.map((item) => item.slot),
        "Child slots",
      );
      for (const c of version.controls) {
        if (
          c.requirementIds.some((key) => !version.requirements.some((r) => r.id === key)) ||
          c.evidenceIds.some((key) => !version.evidence.some((e) => e.id === key))
        )
          throw new Error(`Resolve requirement and evidence links for ${c.id}.`);
        if (
          c.assessment !== "Not assessed" &&
          (!c.implementation.trim() || !c.assessor.trim() || !c.assessedOn)
        )
          throw new Error(`Record implementation and assessor for ${c.id}.`);
        if (
          c.assessment === "Satisfied" &&
          (c.applicability !== "Applicable" || !c.evidenceIds.length)
        )
          throw new Error(`Link evidence before assessing ${c.id} as satisfied.`);
      }
      for (const requirement of version.requirements) {
        if (
          requirement.controlIds.some((key) => !version.controls.some((c) => c.id === key)) ||
          requirement.evidenceIds.some((key) => !version.evidence.some((e) => e.id === key))
        )
          throw new Error(`Resolve links for ${requirement.id}.`);
        if (requirement.status === "Verified" && !requirement.evidenceIds.length)
          throw new Error(`Link evidence before verifying ${requirement.id}.`);
      }
      if (entry.kind === "Overlay" && version.children.length)
        throw new Error("Overlays cannot contain components.");
      if (entry.kind === "Component" && version.baseOverlay)
        throw new Error("Only overlays can extend an overlay.");
      const walk = (ownerId: string, current: LibraryVersion, ancestors: Set<string>) => {
        if (ancestors.has(ownerId)) throw new Error("Catalog nesting cannot contain a cycle.");
        const path = new Set([...ancestors, ownerId]);
        for (const child of current.children) {
          if (entryIn(next, child.entryId).kind !== "Component")
            throw new Error("Choose a component for each child slot.");
          walk(child.entryId, releaseIn(next, child.entryId, child.versionId), path);
        }
        if (current.baseOverlay) {
          if (entryIn(next, current.baseOverlay.entryId).kind !== "Overlay")
            throw new Error("Choose an overlay as the base.");
          walk(
            current.baseOverlay.entryId,
            releaseIn(next, current.baseOverlay.entryId, current.baseOverlay.versionId),
            path,
          );
        }
      };
      walk(entry.id, version, new Set());
    }
  }
  for (const use of next.uses) {
    programExists(use.programId);
    if (entryIn(next, use.entryId).kind !== "Component") throw new Error("Choose a component.");
    releaseIn(next, use.entryId, use.versionId);
    if (use.targetNodeId && nodeById.get(use.targetNodeId)?.program !== use.programId)
      throw new Error("Choose a system element in this program.");
    let cursor: LibraryUse | undefined = use;
    const seen = new Set<string>();
    while (cursor) {
      if (seen.has(cursor.id)) throw new Error("Program component nesting cannot contain a cycle.");
      seen.add(cursor.id);
      if (cursor.programId !== use.programId)
        throw new Error("Parent components must belong to this program.");
      cursor = cursor.parentUseId ? instanceIn(next, cursor.parentUseId) : undefined;
    }
    if (use.hostUseId) {
      const host = instanceIn(next, use.hostUseId);
      if (
        host.programId !== use.programId ||
        host.role !== "Host" ||
        host.id === use.id ||
        use.role === "Host"
      )
        throw new Error("Choose another host in this program.");
    }
  }
  for (const assignment of next.assignments) {
    programExists(assignment.programId);
    if (entryIn(next, assignment.entryId).kind !== "Overlay") throw new Error("Choose an overlay.");
    const version = releaseIn(next, assignment.entryId, assignment.versionId);
    unique(assignment.targetIds, "Overlay targets");
    for (const targetId of assignment.targetIds) {
      if (targetId !== "program" && instanceIn(next, targetId).programId !== assignment.programId)
        throw new Error("Choose targets in this program.");
      if (
        version.baseOverlay &&
        !next.assignments.some(
          (base) =>
            base.programId === assignment.programId &&
            base.entryId === version.baseOverlay!.entryId &&
            base.versionId === version.baseOverlay!.versionId &&
            (base.targetIds.includes("program") || base.targetIds.includes(targetId)),
        )
      )
        throw new Error("Assign the required base overlay version to these targets first.");
    }
  }
  for (const proof of next.programEvidence) {
    if (instanceIn(next, proof.useId).programId !== proof.programId)
      throw new Error("Evidence must belong to its program instance.");
  }
  for (const decision of next.decisions) {
    if (instanceIn(next, decision.useId).programId !== decision.programId)
      throw new Error("Control work must belong to its program instance.");
    if (
      decision.evidenceIds.some(
        (key) =>
          !next.programEvidence.some((proof) => proof.id === key && proof.useId === decision.useId),
      )
    )
      throw new Error("Link evidence from this program instance.");
    if (
      decision.assessment !== "Not assessed" &&
      (!decision.assessor || !decision.assessedOn || !decision.determination.trim())
    )
      throw new Error("Record an assessor and determination.");
    if (
      decision.assessment === "Satisfied" &&
      (decision.implementation !== "Implemented" ||
        !decision.narrative.trim() ||
        !decision.evidenceIds.length)
    )
      throw new Error(
        "Complete local implementation and link evidence before recording Satisfied.",
      );
  }
}
export function restoreLibrary() {
  if (restored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(libraryStorageKey);
  const next = stateSchema.parse(raw ? JSON.parse(raw) : clone(state)) as LibraryState;
  validate(next);
  if (raw) publish(next);
  restored = true;
}
function transaction(edit: (next: LibraryState) => void) {
  restoreLibrary();
  if (typeof window === "undefined") throw new Error("Catalog changes require browser storage.");
  const next = clone(state);
  edit(next);
  const parsed = stateSchema.parse(next) as LibraryState;
  validate(parsed);
  try {
    window.localStorage.setItem(libraryStorageKey, JSON.stringify(parsed));
  } catch {
    throw new Error("Changes could not be saved. Free browser storage and try again.");
  }
  publish(parsed);
}
export function libraryEntries(kind?: LibraryKind): LibraryEntry[] {
  return state.entries.filter((entry) => !kind || entry.kind === kind);
}
export function libraryEntry(idOrKey: string) {
  return state.entries.find((entry) => entry.id === idOrKey || entry.key === idOrKey);
}
export function libraryRelease(entryId: string, versionId: string) {
  return libraryEntry(entryId)?.versions.find((version) => version.id === versionId);
}
export function latestLibraryRelease(entry: LibraryEntry) {
  return entry.versions.at(-1);
}
export function libraryUses(programId?: string) {
  return state.uses.filter((use) => !programId || use.programId === programId);
}
export function libraryAssignments(programId?: string) {
  return state.assignments.filter((use) => !programId || use.programId === programId);
}
export function libraryProgramTarget(programId: string) {
  return programTarget(programId);
}
export function createLibraryEntry(input: {
  kind: LibraryKind;
  name: string;
  category: string;
  owner: string;
  version: string;
}): LibraryEntry {
  restoreLibrary();
  const prefix = input.kind === "Component" ? "CMP" : "OVL";
  const sequence =
    Math.max(
      0,
      ...state.entries
        .map((entry) => new RegExp(`^${prefix}-(\\d+)$`).exec(entry.id))
        .map((match) => Number(match?.[1] ?? 0)),
    ) + 1;
  const entryId = `${prefix}-${String(sequence).padStart(3, "0")}`;
  const slug =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "record";
  const key = state.entries.some((entry) => entry.key === slug)
    ? `${slug}-${entryId.slice(-6)}`
    : slug;
  transaction((next) =>
    next.entries.push({
      id: entryId,
      key,
      kind: input.kind,
      name: input.name,
      category: input.category,
      owner: input.owner,
      versions: [],
      draft: {
        id: uid("REL"),
        version: input.version,
        publishedOn: null,
        controls: [],
        requirements: [],
        evidence: [],
        children: [],
        baseOverlay: null,
        conditions: [],
      },
    }),
  );
  return libraryEntry(entryId)!;
}
export function updateLibraryEntry(
  entryId: string,
  patch: { name: string; owner: string; category: string },
) {
  transaction((next) =>
    Object.assign(entryIn(next, entryId), {
      name: patch.name,
      owner: patch.owner,
      category: patch.category,
    }),
  );
}
export function startLibraryDraft(entryId: string, version: string) {
  transaction((next) => {
    const entry = entryIn(next, entryId);
    if (entry.draft) throw new Error("A draft already exists.");
    const previous = entry.versions.at(-1);
    if (!previous) throw new Error("Published version not found.");
    entry.draft = { ...clone(previous), id: uid("REL"), version, publishedOn: null };
  });
}
function resetAssessment(c: LibraryControl) {
  c.assessment = "Not assessed";
  c.assessor = "";
  c.assessedOn = "";
}
export function saveLibraryDraft(entryId: string, draft: LibraryVersion) {
  transaction((next) => {
    const entry = entryIn(next, entryId);
    if (!entry.draft || entry.draft.id !== draft.id)
      throw new Error("Open the current draft to make changes.");
    const previous = entry.draft;
    const updated = clone(draft);
    updated.publishedOn = null;
    const structureChanged =
      JSON.stringify([previous.children, previous.baseOverlay, previous.conditions]) !==
      JSON.stringify([updated.children, updated.baseOverlay, updated.conditions]);
    for (const c of updated.controls) {
      const prior = previous.controls.find((item) => item.id === c.id);
      const changed =
        prior &&
        JSON.stringify([
          prior.implementation,
          prior.consumerResponsibility,
          prior.applicability,
          prior.requirementIds,
          prior.evidenceIds,
          previous.evidence.filter((e) => prior.evidenceIds.includes(e.id)),
          previous.requirements.filter((r) => prior.requirementIds.includes(r.id)),
        ]) !==
          JSON.stringify([
            c.implementation,
            c.consumerResponsibility,
            c.applicability,
            c.requirementIds,
            c.evidenceIds,
            updated.evidence.filter((e) => c.evidenceIds.includes(e.id)),
            updated.requirements.filter((r) => c.requirementIds.includes(r.id)),
          ]);
      const newDetermination =
        c.assessment !== "Not assessed" && (!prior || prior.assessment !== c.assessment);
      if (newDetermination) {
        if (currentSession().role !== "Assessor")
          throw new Error("Switch to Assessor to record an assessment.");
        c.assessor = currentSession().name;
        c.assessedOn = today();
      } else if (structureChanged || changed || c.assessment === "Not assessed") resetAssessment(c);
    }
    entry.draft = updated;
  });
}
export function publishLibraryDraft(entryId: string) {
  transaction((next) => {
    const entry = entryIn(next, entryId);
    if (!entry.draft) throw new Error("There is no draft to publish.");
    if (!entry.draft.controls.length)
      throw new Error("Add at least one control before publishing.");
    const version = { ...entry.draft, publishedOn: today() };
    entry.versions.push(version);
    entry.draft = null;
  });
}
export function addLibraryUse(input: {
  programId: string;
  entryId: string;
  versionId: string;
  name: string;
  targetNodeId: string | null;
  role: "Component" | "Host";
}): LibraryUse {
  const rootId = uid("USE");
  transaction((next) => {
    const walk = (
      entryId: string,
      versionId: string,
      parentUseId: string | null,
      name: string,
      ancestors: Set<string>,
    ) => {
      if (ancestors.has(entryId)) throw new Error("Catalog nesting cannot contain a cycle.");
      const version = releaseIn(next, entryId, versionId);
      const use: LibraryUse = {
        id: parentUseId ? uid("USE") : rootId,
        programId: input.programId,
        entryId,
        versionId,
        name,
        parentUseId,
        targetNodeId: parentUseId ? null : input.targetNodeId,
        role: parentUseId ? "Component" : input.role,
        hostUseId: null,
        controlIds: version.controls.map((c) => c.id),
      };
      next.uses.push(use);
      for (const child of version.children)
        walk(
          child.entryId,
          child.versionId,
          use.id,
          `${child.slot} · ${child.name}`,
          new Set([...ancestors, entryId]),
        );
    };
    walk(input.entryId, input.versionId, null, input.name, new Set());
  });
  return state.uses.find((use) => use.id === rootId)!;
}
export function setLibraryUseTarget(useId: string, targetNodeId: string | null) {
  transaction((next) => {
    const use = instanceIn(next, useId);
    if (isProgramTarget(use)) throw new Error("Choose a component instance.");
    if (use.targetNodeId !== targetNodeId) resetUseAssessments(next, use.id);
    use.targetNodeId = targetNodeId;
  });
}
function resetUseAssessments(next: LibraryState, useId: string) {
  for (const decision of next.decisions.filter((d) => d.useId === useId)) {
    decision.assessment = "Not assessed";
    decision.assessor = "";
    decision.assessedOn = "";
    decision.determination = "";
  }
}
export function setLibraryHost(useId: string, hostUseId: string | null) {
  transaction((next) => {
    const use = instanceIn(next, useId);
    if (isProgramTarget(use)) throw new Error("Choose a component instance.");
    if (use.hostUseId === hostUseId) return;
    for (const hostId of [use.hostUseId, hostUseId]) {
      if (!hostId) continue;
      const host = instanceIn(next, hostId);
      use.controlIds = [
        ...new Set([
          ...use.controlIds,
          ...releaseIn(next, host.entryId, host.versionId).controls.map((c) => c.id),
        ]),
      ];
    }
    resetUseAssessments(next, useId);
    use.hostUseId = hostUseId;
  });
}
export function assignLibraryOverlay(input: {
  programId: string;
  entryId: string;
  versionId: string;
  targetIds: string[];
}) {
  transaction((next) => {
    const previous = next.assignments.find(
      (item) =>
        item.programId === input.programId &&
        item.entryId === input.entryId &&
        item.versionId === input.versionId,
    );
    const assignment: LibraryAssignment = previous ?? { id: uid("OLA"), ...clone(input) };
    assignment.targetIds = [...new Set([...(previous?.targetIds ?? []), ...input.targetIds])];
    if (!previous) next.assignments.push(assignment);
    const version = releaseIn(next, input.entryId, input.versionId);
    for (const targetId of input.targetIds) {
      const use =
        targetId === "program" ? programTarget(input.programId) : instanceIn(next, targetId);
      if (!isProgramTarget(use))
        use.controlIds = [...new Set([...use.controlIds, ...version.controls.map((c) => c.id)])];
      for (const c of version.controls) {
        if (!next.decisions.some((d) => d.useId === use.id && d.controlId === c.id))
          next.decisions.push(blankDecision(use, c.id));
      }
    }
  });
}
export function removeLibraryAssignment(assignmentId: string) {
  transaction((next) => {
    const assignment = next.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error("Overlay assignment not found.");
    const version = releaseIn(next, assignment.entryId, assignment.versionId);
    // Retain obligations on every affected instance after the source is removed.
    for (const use of next.uses.filter(
      (u) =>
        u.programId === assignment.programId &&
        (assignment.targetIds.includes("program") || assignment.targetIds.includes(u.id)),
    )) {
      use.controlIds = [...new Set([...use.controlIds, ...version.controls.map((c) => c.id)])];
      resetUseAssessments(next, use.id);
    }
    if (assignment.targetIds.includes("program"))
      resetUseAssessments(next, programTarget(assignment.programId).id);
    next.assignments = next.assignments.filter((item) => item.id !== assignmentId);
    for (const d of next.decisions)
      if (d.sourceDecisions[`overlay:${assignmentId}`]) {
        d.assessment = "Not assessed";
        d.assessor = "";
        d.assessedOn = "";
        d.determination = "";
      }
  });
}
export function libraryDecision(useId: string, controlId: string): LibraryDecision {
  const use = instanceIn(state, useId);
  return (
    state.decisions.find((d) => d.useId === useId && d.controlId === controlId) ??
    blankDecision(use, controlId)
  );
}
export function librarySources(useId: string, controlId: string): LibrarySource[] {
  const use = instanceIn(state, useId);
  const decision = libraryDecision(useId, controlId);
  const result: LibrarySource[] = [];
  const add = (
    entryId: string,
    versionId: string,
    sourceId: string,
    kind: LibrarySource["kind"],
  ) => {
    const entry = libraryEntry(entryId)!;
    const version = libraryRelease(entryId, versionId)!;
    const c = version.controls.find(
      (item) => item.id === controlId && item.applicability === "Applicable",
    );
    const programDecision =
      kind === "Overlay" &&
      !isProgramTarget(use) &&
      state.assignments.some(
        (a) => `overlay:${a.id}` === sourceId && a.targetIds.includes("program"),
      )
        ? libraryDecision(programTarget(use.programId).id, controlId).sourceDecisions[sourceId]
        : undefined;
    if (c)
      result.push({
        id: sourceId,
        entry,
        version,
        control: c,
        kind,
        decision: decision.sourceDecisions[sourceId] ?? programDecision ?? "Pending",
      });
  };
  if (!isProgramTarget(use)) add(use.entryId, use.versionId, `component:${use.id}`, "Component");
  for (const assignment of state.assignments.filter(
    (a) =>
      a.programId === use.programId &&
      (a.targetIds.includes("program") || a.targetIds.includes(use.id)),
  ))
    add(assignment.entryId, assignment.versionId, `overlay:${assignment.id}`, "Overlay");
  if (use.hostUseId) {
    const host = instanceIn(state, use.hostUseId);
    add(host.entryId, host.versionId, `host:${host.id}`, "Host");
  }
  return result;
}
export function libraryControlIds(useId: string): string[] {
  const use = instanceIn(state, useId);
  const ids = new Set([
    ...use.controlIds,
    ...state.decisions.filter((d) => d.useId === useId).map((d) => d.controlId),
  ]);
  for (const assignment of state.assignments.filter(
    (a) =>
      a.programId === use.programId &&
      (a.targetIds.includes("program") || a.targetIds.includes(use.id)),
  ))
    for (const c of libraryRelease(assignment.entryId, assignment.versionId)!.controls)
      ids.add(c.id);
  if (use.hostUseId)
    for (const c of releaseIn(
      state,
      instanceIn(state, use.hostUseId).entryId,
      instanceIn(state, use.hostUseId).versionId,
    ).controls)
      ids.add(c.id);
  return [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
export function saveLibraryDecision(
  useId: string,
  controlId: string,
  patch: Partial<LibraryDecision>,
) {
  if (!libraryControlIds(useId).includes(controlId))
    throw new Error("Choose a control in this scope.");
  const sources = librarySources(useId, controlId);
  if (
    patch.sourceDecisions &&
    Object.keys(patch.sourceDecisions).some(
      (key) =>
        !sources.some((source) => source.id === key) &&
        !libraryDecision(useId, controlId).sourceDecisions[key],
    )
  )
    throw new Error("Choose a source assigned to this control.");
  transaction((next) => {
    const use = instanceIn(next, useId);
    const prior =
      next.decisions.find((d) => d.useId === useId && d.controlId === controlId) ??
      blankDecision(use, controlId);
    const updated = { ...prior, ...clone(patch), useId, controlId, programId: use.programId };
    const changed =
      JSON.stringify([
        prior.sourceDecisions,
        prior.narrative,
        prior.evidenceIds,
        prior.implementation,
      ]) !==
      JSON.stringify([
        updated.sourceDecisions,
        updated.narrative,
        updated.evidenceIds,
        updated.implementation,
      ]);
    if (patch.assessment && patch.assessment !== "Not assessed") {
      if (currentSession().role !== "Assessor")
        throw new Error("Switch to Assessor to record a program assessment.");
      if (
        updated.assessment === "Satisfied" &&
        sources.some(
          (source) =>
            (updated.sourceDecisions[source.id] ?? source.decision) === "Confirmed" &&
            source.control.assessment === "Other than satisfied",
        )
      )
        throw new Error("Resolve or exclude deficient sources before recording Satisfied.");
      updated.assessor = currentSession().name;
      updated.assessedOn = today();
    } else if (changed || updated.assessment === "Not assessed") {
      updated.assessment = "Not assessed";
      updated.assessor = "";
      updated.assessedOn = "";
      updated.determination = "";
    }
    if (
      isProgramTarget(use) &&
      JSON.stringify(prior.sourceDecisions) !== JSON.stringify(updated.sourceDecisions)
    ) {
      for (const inherited of next.decisions.filter(
        (d) => d.programId === use.programId && d.useId !== useId && d.controlId === controlId,
      )) {
        const affected = new Set([
          ...Object.keys(prior.sourceDecisions),
          ...Object.keys(updated.sourceDecisions),
        ]);
        if (
          [...affected].some(
            (key) =>
              !inherited.sourceDecisions[key] &&
              prior.sourceDecisions[key] !== updated.sourceDecisions[key],
          )
        ) {
          inherited.assessment = "Not assessed";
          inherited.assessor = "";
          inherited.assessedOn = "";
          inherited.determination = "";
        }
      }
    }
    next.decisions = [
      ...next.decisions.filter((d) => d.useId !== useId || d.controlId !== controlId),
      updated,
    ];
  });
}
export function libraryProgramEvidence(useId: string): LibraryProgramEvidence[] {
  return state.programEvidence.filter((proof) => proof.useId === useId);
}
export function addLibraryProgramEvidence(
  useId: string,
  input: Omit<LibraryEvidence, "id">,
): LibraryProgramEvidence {
  const proof: LibraryProgramEvidence = {
    ...clone(input),
    id: uid("LPE"),
    useId,
    programId: instanceIn(state, useId).programId,
  };
  transaction((next) => {
    next.programEvidence.push(proof);
  });
  return state.programEvidence.find((e) => e.id === proof.id)!;
}
export function librarySourcesForScope(
  programId: string,
  elementId: string,
  controlId: string,
): Array<LibrarySource & { use: LibraryUse }> {
  const root = programTarget(programId);
  const mapped = libraryUses(programId)
    .filter((use) => use.targetNodeId === elementId)
    .flatMap((use) => librarySources(use.id, controlId).map((source) => ({ ...source, use })));
  const mappedSourceIds = new Set(mapped.map((source) => source.id));
  return [
    ...librarySources(root.id, controlId)
      .filter((source) => !mappedSourceIds.has(source.id))
      .map((source) => ({ ...source, use: root })),
    ...mapped,
  ];
}

registerControlSourceProvider((work) => {
  const element = scopeById.get(work.scope)?.element;
  const sources = element ? librarySourcesForScope(work.program, element, work.control) : [];
  const confirmed = sources.filter((source) => source.decision === "Confirmed");
  return {
    fingerprint: JSON.stringify(
      sources
        .map((source) => [source.use.id, source.id, source.version.id, source.decision])
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    ),
    confirmed: confirmed.length,
    deficiency: confirmed.some((source) => source.control.assessment === "Other than satisfied")
      ? "Resolve or exclude deficient library sources before recording Satisfied."
      : null,
  };
});
