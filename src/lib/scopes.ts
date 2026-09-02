/**
 * Assessment scopes — the level at which controls are actually selected.
 *
 * The program is one authorization boundary with one ATO, which is how a DoD
 * PIT system is normally authorized: the LRUs and subsystems inside it are
 * assessed, not separately authorized. But a single boundary does not mean a
 * single obligation set. A forward relay in a Public trust zone and a cloud
 * ground segment do not carry the same controls, and flattening them into one
 * program-wide control set is the same mistake as flattening a control onto an
 * LRU — it destroys the reason each obligation exists.
 *
 * So: one boundary, many scopes. Each scope categorizes itself, selects its own
 * controls, and owns its own SCTM. The program's control set is the union, with
 * provenance recording which scope required each control.
 *
 * ## Categorization is CNSSI 1253, not FIPS 200
 *
 * This is the part the rest of the app had wrong. `highWaterMark()` in
 * `tailoring.ts` takes `max(C, I, A)` and looks up one Low/Moderate/High
 * baseline — that is the FIPS 200 collapse, correct for a federal non-NSS
 * system. CNSSI 1253 does not collapse: confidentiality, integrity and
 * availability are categorized independently and each selects controls at its
 * own level, with the baseline being their **union**. The overlay catalog in
 * this app is already named for CNSSI 1253 attachments, so the categorization
 * math had to follow it.
 *
 * The practical difference is visible immediately. A forward relay whose loss
 * of availability is a Low impact keeps every confidentiality and integrity
 * control at High while dropping contingency controls the ground segment
 * carries. FIPS 200 cannot express that system at all — it would put the whole
 * thing on the High baseline and the tailoring conversation would happen in a
 * spreadsheet instead of in the model.
 */

import { useSyncExternalStore } from "react";

import { nistControls, type NistControl } from "@/lib/nist-catalog";
import {
  computeTailoring,
  type Overlay,
  type OverlayControl,
  type SystemParameters,
} from "@/lib/tailoring";
import type { ImpactLevel } from "@/lib/grc-data";

/* -------------------------------------------------------------- Objectives */

export type Objective = "Confidentiality" | "Integrity" | "Availability";

export const objectives: Objective[] = ["Confidentiality", "Integrity", "Availability"];

/**
 * Which security objectives each control family serves.
 *
 * CNSSI 1253 publishes this per control; the catalog in this repo carries only
 * SP 800-53B baseline membership, so the mapping is derived at family level.
 * It is a stated approximation, not a claim to be 1253 Table 1 — but it is the
 * right *shape*: most families serve more than one objective, and the ones that
 * serve only one are what make an objective-specific baseline differ from a
 * collapsed one. CP is the clearest case: contingency planning is availability
 * and nothing else, so an A=Low scope sheds it and a C=High scope does not.
 */
export const familyObjectives: Record<string, Objective[]> = {
  AC: ["Confidentiality", "Integrity"],
  AT: ["Confidentiality", "Integrity", "Availability"],
  AU: ["Confidentiality", "Integrity"],
  CA: ["Confidentiality", "Integrity", "Availability"],
  CM: ["Integrity", "Availability"],
  CP: ["Availability"],
  IA: ["Confidentiality", "Integrity"],
  IR: ["Confidentiality", "Integrity", "Availability"],
  MA: ["Integrity", "Availability"],
  MP: ["Confidentiality", "Integrity"],
  PE: ["Confidentiality", "Integrity", "Availability"],
  PL: ["Confidentiality", "Integrity", "Availability"],
  PM: ["Confidentiality", "Integrity", "Availability"],
  PS: ["Confidentiality", "Integrity"],
  PT: ["Confidentiality"],
  RA: ["Confidentiality", "Integrity", "Availability"],
  SA: ["Confidentiality", "Integrity", "Availability"],
  SC: ["Confidentiality", "Integrity", "Availability"],
  SI: ["Integrity", "Availability"],
  SR: ["Integrity", "Availability"],
};

const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };

/**
 * The lowest baseline a control appears in — the impact level at which an
 * objective starts selecting it. A control in the Moderate and High baselines
 * is selected once an objective reaches Moderate.
 */
export function selectionLevel(control: NistControl): ImpactLevel | null {
  if (control.baselines.includes("Low")) return "Low";
  if (control.baselines.includes("Moderate")) return "Moderate";
  if (control.baselines.includes("High")) return "High";
  return null; // overlay-only; never selected by categorization alone
}

export type Triad = Record<Objective, ImpactLevel>;

/** Which objectives put this control in the set, given a triad. Empty = not selected. */
export function selectingObjectives(control: NistControl, triad: Triad): Objective[] {
  const level = selectionLevel(control);
  if (!level) return [];
  const serves = familyObjectives[control.family] ?? objectives;
  return serves.filter((o) => rank[triad[o]] >= rank[level]);
}

/* ------------------------------------------------------------------ Scopes */

export type AssessmentScope = {
  id: string; // SYS-
  program: string; // PRG-
  /** The composition element this scope is anchored to. */
  element: string; // CN-
  name: string;
  owner: string;
  mission: string;
  /**
   * Almost always false. One boundary, one ATO — a scope is separately
   * *categorised and assessed*, not separately authorized. Set this only when
   * a different AO genuinely owns the risk decision, which brings
   * interconnection agreements with it.
   */
  independentlyAuthorized: boolean;
  /** This scope's own categorization and environment. */
  parameters: SystemParameters;
  /**
   * Why this scope may categorize an objective below its siblings. The first
   * thing an assessor challenges: a lower categorization is earned with a
   * demonstrated boundary, not asserted.
   */
  separationBasis: string;
};

export const assessmentScopes: AssessmentScope[] = [
  {
    id: "SYS-0001",
    program: "PRG-1041",
    element: "CN-0100",
    name: "Ground control segment",
    owner: "Grace Hoppel",
    mission: "Operator console, settlement processing and the authoritative record.",
    independentlyAuthorized: false,
    parameters: {
      confidentiality: "High",
      integrity: "High",
      availability: "High",
      systemClass: "Enterprise IT",
      hosting: "Cloud (IL5)",
      classification: "CUI",
      connectivity: "Continuous",
      handlesPii: true,
      crossDomain: false,
      safetyCritical: false,
    },
    separationBasis:
      "Highest categorization in the boundary; nothing below it needs justifying against this scope.",
  },
  {
    id: "SYS-0002",
    program: "PRG-1041",
    element: "CN-0200",
    name: "Mission software",
    owner: "Sarah Chen",
    mission: "Settlement API and operator identity for the platform.",
    independentlyAuthorized: false,
    parameters: {
      confidentiality: "Moderate",
      integrity: "High",
      availability: "Moderate",
      systemClass: "Enterprise IT",
      hosting: "Cloud (IL5)",
      classification: "CUI",
      connectivity: "Continuous",
      handlesPii: false,
      crossDomain: false,
      safetyCritical: false,
    },
    separationBasis:
      "Cardholder data is tokenised before it crosses into the service; the scope holds no primary account numbers at rest. Confidentiality is Moderate on that basis, and the tokenisation boundary is itself assessed under SC-7 in this scope.",
  },
  {
    id: "SYS-0003",
    program: "PRG-1041",
    element: "CN-0300",
    name: "Tactical edge",
    owner: "Marcus Ryde",
    mission: "Forward relay for mission telemetry in a disconnected environment.",
    independentlyAuthorized: false,
    parameters: {
      confidentiality: "High",
      integrity: "High",
      availability: "Low",
      systemClass: "Tactical / deployed",
      hosting: "Hardware / platform",
      classification: "Secret",
      connectivity: "Intermittent (DDIL)",
      handlesPii: false,
      crossDomain: false,
      safetyCritical: true,
    },
    separationBasis:
      "Loss of the forward relay degrades but does not halt settlement — the ground segment continues against cached state and reconciles on reachback. Availability is Low on that basis; confidentiality stays High because the relay carries Secret traffic.",
  },
];

export const scopeById = new Map(assessmentScopes.map((s) => [s.id, s]));

export function scopesForProgram(programId: string): AssessmentScope[] {
  return assessmentScopes.filter((s) => s.program === programId);
}

/* ------------------------------------------------------------------ Serves */

/**
 * A component serving a scope it does not sit under.
 *
 * The composition tree is build structure: one parent, strictly. Function is
 * not a tree — a shared identity provider or a common processing module serves
 * several subsystems at once, and it inherits obligations from every scope it
 * serves. Keeping these as separate relations means the BOM stays honest about
 * what contains what while the assessment stays honest about what depends on
 * what.
 */
export type ServesEdge = {
  component: string; // CN-
  scope: string; // SYS-
  role: string;
  rationale: string;
};

export const servesEdges: ServesEdge[] = [
  {
    component: "CN-0220",
    scope: "SYS-0001",
    role: "Operator authentication",
    rationale:
      "The ground segment console authenticates against this identity provider. It sits inside Mission software in the build tree but the ground segment cannot operate without it, so its confidentiality and integrity obligations are the stricter of the two scopes.",
  },
  {
    component: "CN-0220",
    scope: "SYS-0003",
    role: "Operator authentication",
    rationale:
      "Forward-relay maintenance sessions authenticate through the same provider over reachback. The DDIL overlay's obligations therefore reach this component even though it never leaves the enclave.",
  },
];

/** Scopes a component serves — the one it sits under, plus any explicit edges. */
export function scopesServedBy(componentId: string, ancestry: string[]): AssessmentScope[] {
  const structural = assessmentScopes.filter(
    (s) => s.element === componentId || ancestry.includes(s.element),
  );
  const explicit = servesEdges
    .filter((e) => e.component === componentId)
    .map((e) => scopeById.get(e.scope))
    .filter((s): s is AssessmentScope => !!s);
  const out = [...structural];
  for (const s of explicit) if (!out.some((x) => x.id === s.id)) out.push(s);
  return out;
}

export function servesEdgesFor(componentId: string): ServesEdge[] {
  return servesEdges.filter((e) => e.component === componentId);
}

export function componentsServing(scopeId: string): ServesEdge[] {
  return servesEdges.filter((e) => e.scope === scopeId);
}

/* ------------------------------------------------------------ Control sets */

export type ScopeControl = {
  control: NistControl;
  /** Which objectives put it in the set. Empty when an overlay added it. */
  selectedBy: Objective[];
  /** "Categorization" or the overlay id that added it. */
  source: string;
  /** Set when an overlay tailored it out of this scope's set. */
  tailoredOut: OverlayControl | null;
};

export type ScopeControlSet = {
  scope: AssessmentScope;
  triad: Triad;
  overlays: Overlay[];
  /** Controls in force for this scope. */
  controls: ScopeControl[];
  /** Selected by categorization then removed by an overlay. */
  removed: ScopeControl[];
  /** Added by an overlay rather than by categorization. */
  added: ScopeControl[];
  /** Count of controls each objective is responsible for selecting. */
  byObjective: Record<Objective, number>;
  total: number;
};

export function triadOf(scope: AssessmentScope): Triad {
  return {
    Confidentiality: scope.parameters.confidentiality,
    Integrity: scope.parameters.integrity,
    Availability: scope.parameters.availability,
  };
}

/**
 * The scope's control set: the union of its objective-specific selections,
 * then the overlay deltas that its parameters trigger.
 *
 * Order matters. Categorization selects first and overlays adjust second,
 * because an overlay that tailors a control out has to have something to tailor
 * out — and a control an overlay removes must still be recorded as removed,
 * not silently absent, or the scope cannot explain itself.
 */
export function controlSetFor(scopeId: string): ScopeControlSet | null {
  const scope = scopeById.get(scopeId);
  if (!scope) return null;
  return { scope, ...resolveSelection(triadOf(scope), tailoringFor(scope)) };
}

/** A control set without its scope — what a draft resolves to before it is registered. */
export type Selection = Omit<ScopeControlSet, "scope">;

/** The selection algorithm on its own, so an unregistered draft resolves the same way a scope does. */
export function resolveSelection(triad: Triad, deltas: TailoringDeltas): Selection {
  const { overlays, removedById, addedById } = deltas;

  const controls: ScopeControl[] = [];
  const removed: ScopeControl[] = [];
  const byObjective: Record<Objective, number> = {
    Confidentiality: 0,
    Integrity: 0,
    Availability: 0,
  };

  for (const control of nistControls) {
    const selectedBy = selectingObjectives(control, triad);
    if (selectedBy.length === 0) continue;
    const row: ScopeControl = {
      control,
      selectedBy,
      source: "Categorization",
      tailoredOut: removedById.get(control.id) ?? null,
    };
    if (row.tailoredOut) {
      removed.push(row);
      continue;
    }
    for (const o of selectedBy) byObjective[o] += 1;
    controls.push(row);
  }

  // Overlay additions the categorization did not already select.
  const have = new Set(controls.map((c) => c.control.id));
  const added: ScopeControl[] = [];
  for (const [id, overlayControl] of addedById) {
    if (have.has(id)) continue;
    const control = nistControls.find((c) => c.id === id);
    if (!control) continue;
    const row: ScopeControl = {
      control,
      selectedBy: [],
      source: overlayControl.title,
      tailoredOut: null,
    };
    added.push(row);
    controls.push(row);
  }

  return {
    triad,
    overlays,
    controls,
    removed,
    added,
    byObjective,
    total: controls.length,
  };
}

/* ---------------------------------------------------- Recorded tailoring */

/**
 * What a control-set revision decided for a scope, once approved: the overlays
 * it applied (recommended or not) and the controls it tailored out or in by
 * hand. `§5.1`: rules produce recommendations; the authority records the
 * decision. When nothing is recorded the scope falls back to the predicate
 * path, which is what every seeded scope does today.
 */
export type RecordedTailoring = {
  overlays: Overlay[];
  /** Control id → rationale. */
  excluded: Map<string, string>;
  /** Control id → rationale. */
  included: Map<string, string>;
};

const TAILORING_SOURCE = "Program tailoring";

const tailorings = new Map<string, RecordedTailoring>();

export function recordTailoring(
  scopeId: string,
  t: RecordedTailoring,
  opts: { silent?: boolean } = {},
) {
  if (!scopeById.has(scopeId)) return;
  tailorings.set(scopeId, {
    overlays: [...t.overlays],
    excluded: new Map(t.excluded),
    included: new Map(t.included),
  });
  if (!opts.silent) bumpScopes();
}

export function recordedTailoring(scopeId: string): RecordedTailoring | null {
  return tailorings.get(scopeId) ?? null;
}

export type TailoringDeltas = {
  overlays: Overlay[];
  removedById: Map<string, OverlayControl>;
  addedById: Map<string, OverlayControl>;
};

/** The deltas a recorded decision produces: applied overlays, then explicit exclusions and inclusions winning. */
export function tailoringDeltas(
  overlays: Overlay[],
  excluded: Map<string, string>,
  included: Map<string, string>,
): TailoringDeltas {
  const all = overlays.flatMap((o) => o.controls);
  const removedById = new Map(all.filter((c) => c.action === "Tailored out").map((c) => [c.id, c]));
  const addedById = new Map(all.filter((c) => c.action === "Added").map((c) => [c.id, c]));
  for (const [id, rationale] of excluded) {
    addedById.delete(id);
    removedById.set(id, { id, title: TAILORING_SOURCE, action: "Tailored out", rationale });
  }
  for (const [id, rationale] of included) {
    removedById.delete(id);
    if (!addedById.has(id)) {
      addedById.set(id, { id, title: TAILORING_SOURCE, action: "Added", rationale });
    }
  }
  return { overlays, removedById, addedById };
}

function tailoringFor(scope: AssessmentScope): TailoringDeltas {
  const rec = tailorings.get(scope.id);
  if (rec) return tailoringDeltas(rec.overlays, rec.excluded, rec.included);
  const t = computeTailoring(scope.parameters);
  return {
    overlays: t.overlays,
    removedById: new Map(t.removed.map((c) => [c.id, c])),
    addedById: new Map(t.added.map((c) => [c.id, c])),
  };
}

/* --------------------------------------------------------------- Roll-up */

export type RollupControl = {
  control: NistControl;
  /** Every scope that requires it, and why. */
  scopes: { scope: AssessmentScope; selectedBy: Objective[]; source: string }[];
};

export type ProgramRollup = {
  program: string;
  scopes: AssessmentScope[];
  controls: RollupControl[];
  total: number;
  /** Controls required by exactly one scope — the ones a program-wide set hides. */
  singleScope: number;
  /** Controls one scope tailored out but another still requires. */
  contested: RollupControl[];
};

/**
 * The program's obligation set is the union of its scopes.
 *
 * Union, not maximum. Taking the highest categorization across scopes and
 * selecting once from that would put every control on every scope — which is
 * exactly the flattening this model exists to avoid, and it would erase the
 * fact that SC-40 is in the set only because of the tactical relay.
 */
export function rollupControlSet(programId: string): ProgramRollup {
  const scopes = scopesForProgram(programId);
  const sets = scopes
    .map((s) => controlSetFor(s.id))
    .filter((s): s is ScopeControlSet => s !== null);

  const byControl = new Map<string, RollupControl>();
  for (const set of sets) {
    for (const row of set.controls) {
      const hit = byControl.get(row.control.id) ?? { control: row.control, scopes: [] };
      hit.scopes.push({ scope: set.scope, selectedBy: row.selectedBy, source: row.source });
      byControl.set(row.control.id, hit);
    }
  }

  // A control one scope removed but another kept is worth surfacing: it is the
  // seam where two subsystems genuinely disagree about an obligation.
  const contested: RollupControl[] = [];
  for (const set of sets) {
    for (const row of set.removed) {
      const hit = byControl.get(row.control.id);
      if (hit) contested.push(hit);
    }
  }

  const controls = [...byControl.values()];
  return {
    program: programId,
    scopes,
    controls,
    total: controls.length,
    singleScope: controls.filter((c) => c.scopes.length === 1).length,
    contested,
  };
}

/* ------------------------------------------------------------------ Store */

const listeners = new Set<() => void>();
let version = 0;
const overrides = new Map<string, Partial<SystemParameters>>();

function bumpScopes() {
  version += 1;
  for (const l of listeners) l();
}

export function nextScopeId(): string {
  const max = assessmentScopes.reduce(
    (m, s) => Math.max(m, Number(s.id.replace(/^SYS-/, "")) || 0),
    0,
  );
  return `SYS-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Register scopes created at runtime — the wizard's leaves, or a subsystem
 * added to a program later. Pushes onto the seed array so every selector that
 * filters it sees them, and bumps once for the batch.
 */
export function addScopes(
  inputs: (Omit<AssessmentScope, "id"> & { id?: string })[],
): AssessmentScope[] {
  const out = inputs.map((input) => {
    const id = input.id ?? nextScopeId();
    const hit = scopeById.get(id);
    if (hit) return hit;
    const scope: AssessmentScope = { ...input, id, parameters: { ...input.parameters } };
    assessmentScopes.push(scope);
    scopeById.set(id, scope);
    return scope;
  });
  bumpScopes();
  return out;
}

export function subscribeScopes(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function scopesVersion(): number {
  return version;
}

/** Same stable-snapshot contract as `useRequirementsVersion` — see that note. */
export function useScopesVersion(): number {
  return useSyncExternalStore(subscribeScopes, scopesVersion, scopesVersion);
}

export function setScopeParameter(scopeId: string, patch: Partial<SystemParameters>) {
  const scope = scopeById.get(scopeId);
  if (!scope) return;
  overrides.set(scopeId, { ...overrides.get(scopeId), ...patch });
  Object.assign(scope.parameters, patch);
  bumpScopes();
}
