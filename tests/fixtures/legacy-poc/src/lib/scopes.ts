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

import { ancestorsOf, nodeById } from "@/lib/composition";
import { useSyncExternalStore } from "react";

import type { ImpactLevel } from "@/lib/grc-data";
import {
  cnssiAllocation,
  cnssiControlsWithoutAllocation,
  selectsAtImpact,
  type Impact,
  type SecurityCategorization,
  type SecurityObjective,
} from "@/lib/cnssi-1253";
import { nistControls, nistControlById, type NistControl } from "@/lib/nist-catalog";
import {
  computeTailoring,
  type Overlay,
  type OverlayControl,
  type SystemParameters,
} from "@/lib/tailoring";

/* -------------------------------------------------------------- Objectives */

export type Objective = "Confidentiality" | "Integrity" | "Availability";

export const objectives: Objective[] = ["Confidentiality", "Integrity", "Availability"];

/** The app's title-case vocabulary against CNSSI 1253's own lower-case keys. */
const cnssiObjective: Record<Objective, SecurityObjective> = {
  Confidentiality: "confidentiality",
  Integrity: "integrity",
  Availability: "availability",
};
const cnssiImpact: Record<ImpactLevel, Impact> = {
  Low: "low",
  Moderate: "moderate",
  High: "high",
};

export type Triad = Record<Objective, ImpactLevel>;

export function categorizationOf(triad: Triad): SecurityCategorization {
  return {
    confidentiality: cnssiImpact[triad.Confidentiality],
    integrity: cnssiImpact[triad.Integrity],
    availability: cnssiImpact[triad.Availability],
  };
}

/**
 * Controls CNSSI 1253 allocates organization-wide rather than by impact level.
 *
 * The PM family is deployed program-wide independent of categorization, so no
 * triad selects or deselects it. They are carried in every scope's set and
 * marked, rather than silently included by an impact column that does not
 * actually select them.
 */
export const organizationWideControlIds: ReadonlySet<string> = new Set(
  nistControls
    .map((control) => cnssiAllocation(control.id))
    .filter((a): a is NonNullable<typeof a> => !!a && a.allocation === "organization-wide")
    .map((a) => a.controlId),
);

/**
 * Controls with no row in the CNSSI 1253 extraction.
 *
 * Seven Rev. 5 controls post-date or fall outside the 2022 publication's tables
 * (IA-13 and its enhancements, SA-15(13), SA-24, SI-2(7)). Categorization cannot
 * select them because the publication says nothing about them — that is an
 * absence of guidance, not a decision to exclude, so it is exported for a screen
 * to surface rather than being swallowed here.
 */
export const controlsWithoutCnssiAllocation: readonly string[] = cnssiControlsWithoutAllocation;

/**
 * Which objectives put this control in the set, given a triad. Empty = not selected.
 *
 * This reads CNSSI 1253's published per-control C/I/A allocation. It used to
 * approximate that table at family level from SP 800-53B membership — a stated
 * approximation, and a costly one: at C/I/A all High it produced exactly the 370
 * controls of the SP 800-53B High baseline, which is the FIPS 200 collapse this
 * module's own header exists to reject. The published table selects 554 at
 * C:high/I:high/A:moderate, which is what `wsx90-platform-seed.json` records as
 * its CNSSI stage. Same doctrine, one implementation.
 */
export function selectingObjectives(control: NistControl, triad: Triad): Objective[] {
  const allocation = cnssiAllocation(control.id);
  if (!allocation || allocation.withdrawn) return [];
  if (allocation.allocation === "organization-wide") return objectives.slice();
  return objectives.filter((objective) =>
    selectsAtImpact(allocation, cnssiObjective[objective], cnssiImpact[triad[objective]]),
  );
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
  /** Imported profiles select exact catalog controls; child scopes inherit their parent's set. */
  selectionSource?: ControlSelectionSource;
};

export type ControlSelectionSource = {
  profileId: string;
  profileUuid: string;
  catalogId: string;
  label: string;
  startingControlIds: string[];
  parentScope?: string;
  /** Retains inheritance intent when a move temporarily leaves no categorized ancestor. */
  inheritance?: "containment";
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
  const source = liveScopeSelectionSource(scope);
  const parent = source?.parentScope ? controlSetFor(source.parentScope) : null;
  const selection = source
    ? {
        ...source,
        startingControlIds: parent
          ? parent.controls.map((row) => row.control.id)
          : source.startingControlIds,
        label: parent ? `Inherited from ${parent.scope.name}` : source.label,
      }
    : undefined;
  return { scope, ...resolveSelection(triadOf(scope), tailoringFor(scope), selection) };
}

/** Inheritance follows the live system tree; revision snapshots remain historical. */
export function liveScopeSelectionSource(
  scope: AssessmentScope,
): ControlSelectionSource | undefined {
  const source = scope.selectionSource;
  if (!source || (!source.parentScope && source.inheritance !== "containment")) return source;
  const parent = ancestorsOf(scope.element)
    .map((node) =>
      assessmentScopes.find(
        (candidate) => candidate.program === scope.program && candidate.element === node.id,
      ),
    )
    .find((candidate) => candidate !== undefined);
  if (!parent) {
    const { parentScope: _oldParent, ...selection } = source;
    return { ...selection, inheritance: "containment", label: "Previously inherited control set" };
  }
  return {
    ...source,
    inheritance: "containment",
    parentScope: parent.id,
    label: `Inherited from ${parent.name}`,
  };
}

/** Refresh labels and inherited parent references without replacing local tailoring. */
export function synchronizeCompositionScopes(programId: string) {
  for (const scope of scopesForProgram(programId)) {
    const node = nodeById.get(scope.element);
    if (node) scope.name = node.name;
  }
  for (const scope of scopesForProgram(programId)) {
    const selection = liveScopeSelectionSource(scope);
    if (selection) scope.selectionSource = selection;
  }
  bumpScopes();
}

/** A control set without its scope — what a draft resolves to before it is registered. */
export type Selection = Omit<ScopeControlSet, "scope">;

/** The selection algorithm on its own, so an unregistered draft resolves the same way a scope does. */
export function resolveSelection(
  triad: Triad,
  deltas: TailoringDeltas,
  source?: ControlSelectionSource,
): Selection {
  const { overlays, removedById, addedById } = deltas;

  // An imported profile's starting selection is hundreds of ids and this loop runs
  // once per scope in the tree, so membership has to be a hash lookup, not a scan.
  const starting = source ? new Set(source.startingControlIds) : null;
  const controls: ScopeControl[] = [];
  const removed: ScopeControl[] = [];
  const byObjective: Record<Objective, number> = {
    Confidentiality: 0,
    Integrity: 0,
    Availability: 0,
  };

  for (const control of nistControls) {
    const selectedBy = source ? [] : selectingObjectives(control, triad);
    if (starting ? !starting.has(control.id) : selectedBy.length === 0) continue;
    const row: ScopeControl = {
      control,
      selectedBy,
      source: source?.label ?? "Categorization",
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
    const control = nistControlById.get(id);
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
  const removedById = new Map<string, OverlayControl>();
  const addedById = new Map<string, OverlayControl>();
  for (const overlay of overlays)
    for (const control of overlay.controls) {
      if (control.action === "Tailored out") {
        addedById.delete(control.id);
        removedById.set(control.id, control);
      }
      if (control.action === "Added") {
        removedById.delete(control.id);
        addedById.set(control.id, control);
      }
    }
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
  if (scope.selectionSource) return tailoringDeltas([], new Map(), new Map());
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
