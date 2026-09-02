/**
 * The program draft the wizard edits, and what creating it does.
 *
 * `§16.1` new-system onboarding, steps 1–5: create the system with its owner,
 * mission and boundary; instantiate the architecture at the fidelity you have;
 * categorize; select the baseline and evaluate overlays; cut the first control
 * set revision and route it for approval.
 *
 * The draft lives in React state until "Create"; nothing here is a store.
 * `createProgramFromDraft` is the one function that writes, and it writes in
 * dependency order — program, then nodes, then scopes, then revisions — because
 * the selectors downstream cache per program and must not be primed early.
 */

import { addCompositionNodes, nextNodeId, type NewCompositionNode } from "@/lib/composition";
import {
  createInitialRevision,
  initialOverlayDecisions,
  refreshOverlayDecisions,
  triadLabel,
  type OverlayDecision,
  type RevisionDraft,
  type TailoringDecision,
} from "@/lib/control-set";
import { datasetToday } from "@/lib/dataset-clock";
import { defaultFramework, frameworkById, type FrameworkId } from "@/lib/frameworks";
import type { Program } from "@/lib/grc-data";
import { addProgram, nextProgramId, updateProgram } from "@/lib/program-store";
import { addScopes, rollupControlSet, type AssessmentScope } from "@/lib/scopes";
import { highWaterMark, type SystemParameters } from "@/lib/tailoring";

/* ------------------------------------------------------------------ Draft */

export type DraftSubsystem = {
  key: string;
  name: string;
  function: string;
  owner: string;
};

export type DraftSystem = {
  key: string;
  name: string;
  function: string;
  owner: string;
  subsystems: DraftSubsystem[];
};

/**
 * One leaf of the tree, and the categorization it will be assessed under. A
 * scope inherits the program default until somebody overrides it; the
 * override is the whole parameter set, not a diff, so a scope is always
 * reproducible on its own.
 */
export type DraftScope = {
  key: string;
  systemKey: string;
  subsystemKey: string | null;
  label: string;
  path: string;
  override: SystemParameters | null;
  overlays: OverlayDecision[];
  tailoring: TailoringDecision[];
  separationBasis: string;
};

export type ProgramDraft = {
  name: string;
  acronym: string;
  owner: string;
  authorizingOfficial: string;
  assessor: string;
  environment: Program["environment"];
  mission: string;
  framework: FrameworkId;
  systems: DraftSystem[];
  /** Program-level categorization and environment; every scope starts here. */
  defaults: SystemParameters;
  scopes: DraftScope[];
  submitOnCreate: boolean;
};

export const draftDefaults: SystemParameters = {
  confidentiality: "Moderate",
  integrity: "Moderate",
  availability: "Moderate",
  systemClass: "Enterprise IT",
  hosting: "Cloud (IL5)",
  classification: "CUI",
  connectivity: "Continuous",
  handlesPii: false,
  crossDomain: false,
  safetyCritical: false,
};

let keySeq = 0;
export function draftKey(prefix: string): string {
  keySeq += 1;
  return `${prefix}-${keySeq}`;
}

export function emptyDraft(): ProgramDraft {
  const system: DraftSystem = {
    key: draftKey("sys"),
    name: "",
    function: "",
    owner: "",
    subsystems: [],
  };
  const draft: ProgramDraft = {
    name: "",
    acronym: "",
    owner: "Grace Hoppel",
    authorizingOfficial: "R. Feldman",
    assessor: "Whitcombe LLP",
    environment: "AWS GovCloud",
    mission: "",
    framework: defaultFramework,
    systems: [system],
    defaults: { ...draftDefaults },
    scopes: [],
    submitOnCreate: true,
  };
  return { ...draft, scopes: reconcileScopes(draft) };
}

/** Effective parameters for a scope: its override, else the program default. */
export function scopeParameters(draft: ProgramDraft, scope: DraftScope): SystemParameters {
  return scope.override ?? draft.defaults;
}

export function scopeDraft(draft: ProgramDraft, scope: DraftScope): RevisionDraft {
  return {
    parameters: scopeParameters(draft, scope),
    overlays: scope.overlays,
    tailoring: scope.tailoring,
    separationBasis: scope.separationBasis,
  };
}

/** The leaves of the tree, one scope each, keeping any state a leaf already had. */
export function reconcileScopes(draft: ProgramDraft): DraftScope[] {
  const prior = new Map(draft.scopes.map((s) => [s.key, s]));
  const out: DraftScope[] = [];
  for (const system of draft.systems) {
    const systemName = system.name.trim() || draft.name.trim() || "System";
    if (system.subsystems.length === 0) {
      const was = prior.get(system.key);
      out.push({
        key: system.key,
        systemKey: system.key,
        subsystemKey: null,
        label: systemName,
        path: systemName,
        override: was?.override ?? null,
        overlays: was
          ? refreshOverlayDecisions(was.override ?? draft.defaults, was.overlays)
          : initialOverlayDecisions(draft.defaults),
        tailoring: was?.tailoring ?? [],
        separationBasis: was?.separationBasis ?? "",
      });
      continue;
    }
    for (const sub of system.subsystems) {
      const was = prior.get(sub.key);
      const label = sub.name.trim() || "Subsystem";
      out.push({
        key: sub.key,
        systemKey: system.key,
        subsystemKey: sub.key,
        label,
        path: `${systemName} › ${label}`,
        override: was?.override ?? null,
        overlays: was
          ? refreshOverlayDecisions(was.override ?? draft.defaults, was.overlays)
          : initialOverlayDecisions(draft.defaults),
        tailoring: was?.tailoring ?? [],
        separationBasis: was?.separationBasis ?? "",
      });
    }
  }
  return out;
}

/** Program defaults changed: every inheriting scope's recommendations follow. */
export function refreshInheritingScopes(draft: ProgramDraft): DraftScope[] {
  return draft.scopes.map((s) =>
    s.override ? s : { ...s, overlays: refreshOverlayDecisions(draft.defaults, s.overlays) },
  );
}

export function slugOf(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "system"
  );
}

export function acronymOf(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0]!.slice(0, 5).toUpperCase();
  return words
    .map((w) => w[0]!)
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

/* ---------------------------------------------------------------- Create */

export type CreatedProgram = {
  program: Program;
  scopes: AssessmentScope[];
};

/**
 * Create the program exactly as drawn.
 *
 * One system → it is the root of the composition tree, as the seeded Atlas
 * platform is. Several → a boundary node named after the program is the root
 * and each system sits beneath it. Subsystems go under their system. Every
 * leaf becomes an assessment scope with its first control-set revision.
 */
export function createProgramFromDraft(draft: ProgramDraft): CreatedProgram {
  const programId = nextProgramId();
  const name = draft.name.trim();
  const framework = frameworkById.get(draft.framework);

  const program = addProgram({
    id: programId,
    name,
    acronym: draft.acronym.trim() || acronymOf(name),
    system: slugOf(draft.acronym.trim() || name),
    type: "Major application",
    environment: draft.environment,
    impact: highWaterMark(draft.defaults),
    confidentiality: draft.defaults.confidentiality,
    integrity: draft.defaults.integrity,
    availability: draft.defaults.availability,
    baseline: `${framework?.name ?? "NIST SP 800-53 Rev. 5"} · CNSSI 1253 ${triadLabel(draft.defaults)}`,
    controlsTotal: 0,
    controlsAssessed: 0,
    controlsFailing: 0,
    status: "Draft",
    owner: draft.owner,
    assessor: draft.assessor,
    authorizingOfficial: draft.authorizingOfficial,
    authorized: "—",
    expires: "—",
    updated: datasetToday,
    summary:
      draft.mission.trim() || `${name}, categorized under CNSSI 1253 and awaiting scope approval.`,
  });

  // Nodes, parents before children, ids allocated in order.
  let seq = Number(nextNodeId().replace(/^CN-/, ""));
  const nodeId = () => `CN-${String(seq++).padStart(4, "0")}`;
  const inputs: NewCompositionNode[] = [];
  const leafNode = new Map<string, string>(); // draft scope key → CN-

  const single = draft.systems.length === 1;
  let rootId: string | null = null;
  if (!single) {
    rootId = nodeId();
    inputs.push({
      id: rootId,
      name: `${name} boundary`,
      kind: "System",
      class: "System",
      parent: null,
      program: programId,
      note: "Authorization boundary; the systems beneath it are assessed as scopes.",
    });
  }
  for (const system of draft.systems) {
    const systemId = nodeId();
    inputs.push({
      id: systemId,
      name: system.name.trim() || name,
      kind: "System",
      class: "System",
      parent: rootId,
      program: programId,
      note: system.function.trim(),
    });
    if (system.subsystems.length === 0) leafNode.set(system.key, systemId);
    for (const sub of system.subsystems) {
      const subId = nodeId();
      inputs.push({
        id: subId,
        name: sub.name.trim() || "Subsystem",
        kind: "Subsystem",
        class: "System",
        parent: systemId,
        program: programId,
        note: sub.function.trim(),
      });
      leafNode.set(sub.key, subId);
    }
  }
  addCompositionNodes(inputs);

  // Scopes, one per leaf.
  const scopes = addScopes(
    draft.scopes.map((s) => {
      const system = draft.systems.find((x) => x.key === s.systemKey);
      const sub = system?.subsystems.find((x) => x.key === s.subsystemKey);
      const params = scopeParameters(draft, s);
      return {
        program: programId,
        element: leafNode.get(s.key) ?? inputs[0]!.id,
        name: s.label,
        owner: sub?.owner.trim() || system?.owner.trim() || draft.owner,
        mission: sub?.function.trim() || system?.function.trim() || draft.mission.trim(),
        independentlyAuthorized: false,
        parameters: { ...params },
        separationBasis:
          s.separationBasis.trim() ||
          "Categorized at the program ceiling; nothing below it needs justifying.",
      };
    }),
  );

  // First revisions, recorded into each scope whatever their state.
  draft.scopes.forEach((s, i) => {
    const scope = scopes[i];
    if (!scope) return;
    createInitialRevision({
      program: programId,
      scope: scope.id,
      framework: draft.framework,
      parameters: scopeParameters(draft, s),
      overlays: s.overlays,
      tailoring: s.tailoring,
      separationBasis: scope.separationBasis,
      reason: "Initial control set",
      submit: draft.submitOnCreate,
    });
  });

  updateProgram(programId, { controlsTotal: rollupControlSet(programId).total });
  return { program, scopes };
}
