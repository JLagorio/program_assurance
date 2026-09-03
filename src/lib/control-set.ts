/**
 * Control-set revisions — the versioned, approved answer to "which controls
 * does this scope owe, and why".
 *
 * `§5.2` step 7: freeze a versioned System Control Set revision; every later
 * change creates a new revision rather than mutating historical state. `§15.2`:
 * every revision is reproducible from its framework edition, categorization,
 * overlay decisions and tailoring decisions — so that is exactly what a
 * revision stores, and resolution is a pure function of it.
 *
 * Three ingredients, the same three as `control-work.ts`:
 *
 *  - **Gates.** A revision cannot be submitted while a decision that disagrees
 *    with the engine's recommendation has no rationale, while a hand-tailored
 *    control has no rationale, while a scope categorizes below its siblings
 *    without a separation basis, or while it changes nothing.
 *  - **Roles.** An engineer proposes; the program manager or authorizing
 *    official approves. Same session as control work, so switching role there
 *    switches it here.
 *  - **A log.** Append-only events per scope: created, submitted, approved,
 *    changes requested, withdrawn. Nothing is edited after the fact.
 *
 * Approving is the only thing that touches the live scope: it writes the
 * revision's parameters and recorded tailoring into `scopes.ts`, so the Systems
 * tab, the scope record, the Controls board and the rollup all move together.
 */

import { useSyncExternalStore } from "react";

import type { Tone } from "@ledger/design-system";
import { currentSession, workForScope, type ControlWork, type Role } from "@/lib/control-work";
import { datasetToday } from "@/lib/dataset-clock";
import { defaultFramework, type FrameworkId } from "@/lib/frameworks";
import type { ImpactLevel } from "@/lib/grc-data";
import { nistControlById, type NistControl } from "@/lib/nist-catalog";
import {
  assessmentScopes,
  objectives,
  recordTailoring,
  resolveSelection,
  scopeById,
  scopesForProgram,
  setScopeParameter,
  tailoringDeltas,
  type Objective,
  type ScopeControl,
  type Selection,
  type Triad,
} from "@/lib/scopes";
import { overlayById, overlayOptions, type Overlay, type SystemParameters } from "@/lib/tailoring";

/* ------------------------------------------------------------- Decisions */

/**
 * One overlay, one decision. `recommended` is what the parameters said at the
 * time; `applied` is what the authority decided. They usually agree — when
 * they do not, the rationale is the record.
 */
export type OverlayDecision = {
  overlay: string;
  recommended: boolean;
  applied: boolean;
  rationale: string;
  /** Somebody set `applied` by hand; a parameter change no longer moves it. */
  explicit?: boolean;
};

export type TailoringSource = "system-tailoring" | "risk-response" | "org-policy";

export const tailoringSources: { value: TailoringSource; label: string }[] = [
  { value: "system-tailoring", label: "System tailoring" },
  { value: "risk-response", label: "Risk response" },
  { value: "org-policy", label: "Organizational policy" },
];

/** `§5.3` — the tailoring decision object, one per hand-tailored control. */
export type TailoringDecision = {
  control: string;
  decision: "excluded" | "included";
  source: TailoringSource;
  rationale: string;
  authority: string;
  at: string;
};

export function initialOverlayDecisions(p: SystemParameters): OverlayDecision[] {
  return overlayOptions(p).map(({ overlay, recommended }) => ({
    overlay: overlay.id,
    recommended,
    applied: recommended,
    rationale: "",
  }));
}

/**
 * Parameters changed: recompute what is recommended. A decision somebody made
 * by hand stays; one that was only ever following the recommendation follows
 * it again.
 */
export function refreshOverlayDecisions(
  p: SystemParameters,
  prior: OverlayDecision[],
): OverlayDecision[] {
  const byId = new Map(prior.map((d) => [d.overlay, d]));
  return overlayOptions(p).map(({ overlay, recommended }) => {
    const was = byId.get(overlay.id);
    if (was?.explicit) return { ...was, recommended };
    return { overlay: overlay.id, recommended, applied: recommended, rationale: "" };
  });
}

export function decideOverlay(
  prior: OverlayDecision[],
  overlayId: string,
  patch: { applied?: boolean; rationale?: string },
): OverlayDecision[] {
  return prior.map((d) =>
    d.overlay === overlayId
      ? {
          ...d,
          ...(patch.applied !== undefined ? { applied: patch.applied } : {}),
          ...(patch.rationale !== undefined ? { rationale: patch.rationale } : {}),
          explicit: true,
        }
      : d,
  );
}

export function appliedOverlays(decisions: OverlayDecision[]): Overlay[] {
  return decisions
    .filter((d) => d.applied)
    .map((d) => overlayById(d.overlay))
    .filter((o): o is Overlay => o !== null);
}

/** Decisions that disagree with the recommendation — each needs a reason. */
export function contestedOverlays(decisions: OverlayDecision[]): OverlayDecision[] {
  return decisions.filter((d) => d.applied !== d.recommended);
}

/* -------------------------------------------------------------- Revision */

export type RevisionState =
  "Draft" | "Pending approval" | "Approved" | "Changes requested" | "Superseded" | "Withdrawn";

export const revisionTone: Record<RevisionState, Tone> = {
  Draft: "neutral",
  "Pending approval": "warning",
  Approved: "success",
  "Changes requested": "danger",
  Superseded: "neutral",
  Withdrawn: "neutral",
};

/** Not yet decided — at most one per scope. */
export const openStates: RevisionState[] = ["Draft", "Pending approval", "Changes requested"];

export type ControlSetRevision = {
  id: string; // SCS-
  program: string; // PRG-
  scope: string; // SYS-
  number: number;
  state: RevisionState;
  framework: FrameworkId;
  /** Categorization and environment, frozen with the revision. */
  parameters: SystemParameters;
  overlays: OverlayDecision[];
  tailoring: TailoringDecision[];
  separationBasis: string;
  /** Why this revision exists — the change being proposed. */
  reason: string;
  supersedes: string | null;
  author: string;
  created: string;
  submitted: string | null;
  decidedBy: string | null;
  decided: string | null;
  note: string;
};

export type RevisionDraft = Pick<
  ControlSetRevision,
  "parameters" | "overlays" | "tailoring" | "separationBasis"
>;

export function triadOfParameters(p: SystemParameters): Triad {
  return {
    Confidentiality: p.confidentiality,
    Integrity: p.integrity,
    Availability: p.availability,
  };
}

export function triadLabel(p: SystemParameters): string {
  return `${p.confidentiality[0]}-${p.integrity[0]}-${p.availability[0]}`;
}

/* ------------------------------------------------------------ Resolution */

function decisionMaps(tailoring: TailoringDecision[]) {
  const excluded = new Map<string, string>();
  const included = new Map<string, string>();
  for (const d of tailoring) {
    if (d.decision === "excluded") excluded.set(d.control, d.rationale);
    else included.set(d.control, d.rationale);
  }
  return { excluded, included };
}

/** What a draft selects. Pure — the same code path a registered scope resolves through. */
export function resolveDraft(draft: RevisionDraft): Selection {
  const { excluded, included } = decisionMaps(draft.tailoring);
  return resolveSelection(
    triadOfParameters(draft.parameters),
    tailoringDeltas(appliedOverlays(draft.overlays), excluded, included),
  );
}

/* ----------------------------------------------------------------- Delta */

export type ControlDelta = {
  control: NistControl;
  kind: "added" | "removed";
  /** "Categorization", an overlay name, or "Program tailoring". */
  source: string;
  rationale: string | null;
  /** The work record that would retire (removed) or already exists (added). */
  work: ControlWork | null;
};

export type RevisionDelta = {
  triad: { objective: Objective; from: ImpactLevel | null; to: ImpactLevel }[];
  parameters: { key: string; from: string; to: string }[];
  overlays: { overlay: Overlay; from: boolean; to: boolean; rationale: string }[];
  controls: ControlDelta[];
  added: number;
  removed: number;
  /** Work records on controls the revision removes. */
  retiring: ControlWork[];
  /** Added controls nobody has started — new unassigned obligations. */
  opening: number;
  /** Nothing differs from the revision in force. */
  empty: boolean;
};

const parameterLabels: Record<keyof SystemParameters, string> = {
  confidentiality: "Confidentiality",
  integrity: "Integrity",
  availability: "Availability",
  systemClass: "System class",
  hosting: "Hosting",
  classification: "Classification",
  connectivity: "Connectivity",
  handlesPii: "Handles PII",
  crossDomain: "Cross-domain",
  safetyCritical: "Safety-critical",
};

export function parameterLabel(key: keyof SystemParameters): string {
  return parameterLabels[key];
}

function sourceOf(row: ScopeControl): string {
  return row.source;
}

/**
 * What changes if `draft` replaces `inForce`. Against nothing (a first
 * revision) every selected control is an addition.
 */
export function deltaOf(
  draft: RevisionDraft,
  inForce: RevisionDraft | null,
  scopeId: string | null,
): RevisionDelta {
  const next = resolveDraft(draft);
  const prev = inForce ? resolveDraft(inForce) : null;
  const work = new Map((scopeId ? workForScope(scopeId) : []).map((w) => [w.control, w]));

  const prevIds = new Map(prev?.controls.map((c) => [c.control.id, c]) ?? []);
  const nextIds = new Map(next.controls.map((c) => [c.control.id, c]));
  const rationaleOf = (id: string) =>
    draft.tailoring.find((t) => t.control === id)?.rationale ??
    next.removed.find((r) => r.control.id === id)?.tailoredOut?.rationale ??
    null;

  const controls: ControlDelta[] = [];
  for (const row of next.controls) {
    if (prevIds.has(row.control.id)) continue;
    controls.push({
      control: row.control,
      kind: "added",
      source: sourceOf(row),
      rationale: rationaleOf(row.control.id),
      work: work.get(row.control.id) ?? null,
    });
  }
  for (const row of prev?.controls ?? []) {
    if (nextIds.has(row.control.id)) continue;
    const removedRow = next.removed.find((r) => r.control.id === row.control.id);
    controls.push({
      control: row.control,
      kind: "removed",
      source: removedRow?.tailoredOut?.title ?? sourceOf(row),
      rationale: rationaleOf(row.control.id),
      work: work.get(row.control.id) ?? null,
    });
  }
  controls.sort((a, b) => a.control.id.localeCompare(b.control.id, undefined, { numeric: true }));

  const triad = objectives
    .map((o) => ({
      objective: o,
      from: inForce ? triadOfParameters(inForce.parameters)[o] : null,
      to: triadOfParameters(draft.parameters)[o],
    }))
    .filter((t) => t.from !== t.to);

  const parameters: RevisionDelta["parameters"] = [];
  for (const key of Object.keys(parameterLabels) as (keyof SystemParameters)[]) {
    if (key === "confidentiality" || key === "integrity" || key === "availability") continue;
    const from = inForce ? String(inForce.parameters[key]) : "—";
    const to = String(draft.parameters[key]);
    if (from !== to) parameters.push({ key: parameterLabels[key], from, to });
  }

  const prevApplied = new Set(inForce?.overlays.filter((d) => d.applied).map((d) => d.overlay));
  const overlays: RevisionDelta["overlays"] = [];
  for (const d of draft.overlays) {
    const from = prevApplied.has(d.overlay);
    if (from === d.applied) continue;
    const overlay = overlayById(d.overlay);
    if (overlay) overlays.push({ overlay, from, to: d.applied, rationale: d.rationale });
  }

  const added = controls.filter((c) => c.kind === "added");
  const removed = controls.filter((c) => c.kind === "removed");
  return {
    triad,
    parameters,
    overlays,
    controls,
    added: added.length,
    removed: removed.length,
    retiring: removed.map((c) => c.work).filter((w): w is ControlWork => w !== null),
    opening: added.filter((c) => c.work === null).length,
    empty:
      inForce !== null &&
      controls.length === 0 &&
      triad.length === 0 &&
      parameters.length === 0 &&
      overlays.length === 0,
  };
}

/** The consequence, in one sentence, before it is taken. */
export function approvalConsequence(rev: ControlSetRevision, delta: RevisionDelta): string {
  const scope = scopeById.get(rev.scope);
  const name = scope?.name ?? rev.scope;
  const prior = rev.supersedes ? revisionById(rev.supersedes) : null;
  const parts = [
    `v${rev.number} becomes the control set in force for ${name}`,
    prior ? `v${prior.number} is superseded` : null,
    delta.retiring.length
      ? `${delta.retiring.length} work record${delta.retiring.length === 1 ? "" : "s"} retire${delta.retiring.length === 1 ? "s" : ""}`
      : null,
    delta.opening
      ? `${delta.opening} new obligation${delta.opening === 1 ? "" : "s"} open unassigned`
      : null,
  ].filter((p): p is string => p !== null);
  return `${parts.join("; ")}. Evidence on a retired record stays on the record.`;
}

/* ------------------------------------------------------------------ Gates */

export type RevisionGateKey = "overlay-rationale" | "tailoring-rationale" | "separation" | "delta";

export type RevisionGate = {
  key: RevisionGateKey;
  label: string;
  met: boolean;
  detail: string;
};

/**
 * The program's categorization ceiling — the highest level any sibling scope
 * holds per objective. A scope sitting below it on any objective owes a
 * separation basis: `scopes.ts` — "a lower categorization is earned with a
 * demonstrated boundary, not asserted."
 */
export function siblingCeiling(programId: string, excludeScope: string | null): Triad | null {
  const siblings = scopesForProgram(programId).filter((s) => s.id !== excludeScope);
  if (siblings.length === 0) return null;
  const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };
  const out: Triad = { Confidentiality: "Low", Integrity: "Low", Availability: "Low" };
  for (const s of siblings) {
    const t = triadOfParameters(s.parameters);
    for (const o of objectives) if (rank[t[o]] > rank[out[o]]) out[o] = t[o];
  }
  return out;
}

export function objectivesBelow(p: SystemParameters, ceiling: Triad | null): Objective[] {
  if (!ceiling) return [];
  const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };
  const t = triadOfParameters(p);
  return objectives.filter((o) => rank[t[o]] < rank[ceiling[o]]);
}

export function gatesFor(
  draft: RevisionDraft,
  context: { inForce: RevisionDraft | null; ceiling: Triad | null; scopeId: string | null },
): RevisionGate[] {
  const contested = contestedOverlays(draft.overlays).filter((d) => !d.rationale.trim());
  const blankTailoring = draft.tailoring.filter((t) => !t.rationale.trim());
  const below = objectivesBelow(draft.parameters, context.ceiling);
  const delta = deltaOf(draft, context.inForce, context.scopeId);
  return [
    {
      key: "overlay-rationale",
      label: "Overlay rationale",
      met: contested.length === 0,
      detail: contested.length
        ? `${contested.length} overlay decision${contested.length === 1 ? "" : "s"} disagree${contested.length === 1 ? "s" : ""} with the recommendation and give${contested.length === 1 ? "s" : ""} no reason`
        : "Every decision that disagrees with the recommendation carries a reason",
    },
    {
      key: "tailoring-rationale",
      label: "Tailoring rationale",
      met: blankTailoring.length === 0,
      detail: blankTailoring.length
        ? `${blankTailoring.map((t) => t.control).join(", ")} tailored without a reason`
        : draft.tailoring.length
          ? `${draft.tailoring.length} hand-tailored control${draft.tailoring.length === 1 ? "" : "s"}, each with a reason`
          : "No controls tailored by hand",
    },
    {
      key: "separation",
      label: "Separation basis",
      met: below.length === 0 || draft.separationBasis.trim().length > 0,
      detail:
        below.length === 0
          ? "Categorized at or above every sibling scope"
          : draft.separationBasis.trim()
            ? `${below.join(", ")} below the program ceiling — basis recorded`
            : `${below.join(", ")} below the program ceiling — needs a separation basis`,
    },
    {
      key: "delta",
      label: "Changes something",
      met: !delta.empty,
      detail: delta.empty
        ? "No change against the revision in force"
        : context.inForce
          ? `${delta.added} added, ${delta.removed} removed`
          : "First revision for this scope",
    },
  ];
}

/* ---------------------------------------------------------------- Actions */

export type RevisionActionKey =
  "submit" | "withdraw" | "approve" | "request-changes" | "reopen" | "discard";

export type RevisionActionDef = {
  key: RevisionActionKey;
  label: string;
  roles: Role[];
  requires: RevisionGateKey[];
  note: "required" | "optional";
  tone: "primary" | "danger";
  available: (rev: ControlSetRevision) => boolean;
  apply: (rev: ControlSetRevision, note: string) => string;
};

export const revisionActions: RevisionActionDef[] = [
  {
    key: "submit",
    label: "Submit for approval",
    roles: ["Systems security engineer", "Program manager"],
    requires: ["overlay-rationale", "tailoring-rationale", "separation", "delta"],
    note: "optional",
    tone: "primary",
    available: (r) => r.state === "Draft",
    apply: (r) => {
      r.state = "Pending approval";
      r.submitted = datasetToday;
      return `v${r.number} submitted for approval`;
    },
  },
  {
    key: "withdraw",
    label: "Withdraw",
    roles: ["Systems security engineer", "Program manager"],
    requires: [],
    note: "required",
    tone: "primary",
    available: (r) => r.state === "Pending approval",
    apply: (r) => {
      r.state = "Draft";
      r.submitted = null;
      return `v${r.number} withdrawn from approval`;
    },
  },
  {
    key: "approve",
    label: "Approve",
    roles: ["Program manager", "Authorizing official"],
    requires: ["overlay-rationale", "tailoring-rationale", "separation", "delta"],
    note: "optional",
    tone: "primary",
    available: (r) => r.state === "Pending approval",
    apply: (r, note) => {
      const s = currentSession();
      r.state = "Approved";
      r.decidedBy = `${s.name} (${s.role})`;
      r.decided = datasetToday;
      r.note = note;
      return `v${r.number} approved — control set in force`;
    },
  },
  {
    key: "request-changes",
    label: "Request changes",
    roles: ["Program manager", "Authorizing official"],
    requires: [],
    note: "required",
    tone: "danger",
    available: (r) => r.state === "Pending approval",
    apply: (r, note) => {
      const s = currentSession();
      r.state = "Changes requested";
      r.decidedBy = `${s.name} (${s.role})`;
      r.decided = datasetToday;
      r.note = note;
      return `Changes requested on v${r.number}`;
    },
  },
  {
    key: "reopen",
    label: "Reopen as draft",
    roles: ["Systems security engineer", "Program manager"],
    requires: [],
    note: "optional",
    tone: "primary",
    available: (r) => r.state === "Changes requested",
    apply: (r) => {
      r.state = "Draft";
      r.submitted = null;
      return `v${r.number} reopened`;
    },
  },
  {
    key: "discard",
    label: "Discard",
    roles: ["Systems security engineer", "Program manager"],
    requires: [],
    note: "required",
    tone: "danger",
    available: (r) => r.state === "Draft" || r.state === "Changes requested",
    apply: (r) => {
      r.state = "Withdrawn";
      return `v${r.number} discarded`;
    },
  },
];

export type RevisionOffer = {
  def: RevisionActionDef;
  allowed: boolean;
  /** Why not, in one line. Null when allowed. */
  blocked: string | null;
  missing: RevisionGate[];
  roleBlocked: boolean;
};

export function offersFor(rev: ControlSetRevision, role: Role): RevisionOffer[] {
  const gates = gatesFor(rev, {
    inForce: inForceRevision(rev.scope),
    ceiling: siblingCeiling(rev.program, rev.scope),
    scopeId: rev.scope,
  });
  const byKey = new Map(gates.map((g) => [g.key, g]));
  return revisionActions
    .filter((d) => d.available(rev))
    .map((def) => {
      const missing = def.requires.map((k) => byKey.get(k)!).filter((g) => !g.met);
      const roleOk = def.roles.includes(role);
      return {
        def,
        allowed: roleOk && missing.length === 0,
        blocked: !roleOk
          ? `${def.roles.join(" or ")} only — signed in as ${role}`
          : missing.length
            ? `Needs ${missing.map((g) => g.label.toLowerCase()).join(", ")}`
            : null,
        missing,
        roleBlocked: !roleOk,
      };
    });
}

/** Why a new revision cannot be proposed right now, or null. */
export function proposeBlocked(scopeId: string, role: Role): string | null {
  const open = openRevision(scopeId);
  if (open) return `v${open.number} is ${open.state.toLowerCase()} — decide it first`;
  if (!["Systems security engineer", "Program manager"].includes(role)) {
    return `Systems security engineer or Program manager only — signed in as ${role}`;
  }
  return null;
}

/* ---------------------------------------------------------------- Events */

export type RevisionEventKind =
  | "created"
  | "submitted"
  | "withdrawn"
  | "approved"
  | "changes-requested"
  | "reopened"
  | "discarded";

export type RevisionEvent = {
  id: string;
  revision: string; // SCS-
  scope: string; // SYS-
  at: string;
  actor: string;
  role: Role;
  kind: RevisionEventKind;
  summary: string;
  note?: string;
};

const eventToneMap: Record<RevisionEventKind, Tone> = {
  created: "neutral",
  submitted: "information",
  withdrawn: "neutral",
  approved: "success",
  "changes-requested": "danger",
  reopened: "neutral",
  discarded: "neutral",
};

export function eventTone(kind: RevisionEventKind): Tone {
  return eventToneMap[kind];
}

const actionEvent: Record<RevisionActionKey, RevisionEventKind> = {
  submit: "submitted",
  withdraw: "withdrawn",
  approve: "approved",
  "request-changes": "changes-requested",
  reopen: "reopened",
  discard: "discarded",
};

/* ----------------------------------------------------------------- Store */

const revisions: ControlSetRevision[] = [];
const events: RevisionEvent[] = [];
const listeners = new Set<() => void>();
let version = 0;
let revSeq = 0;
let eventSeq = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

export function subscribeControlSets(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function controlSetVersion(): number {
  return version;
}

/** Stable-snapshot contract — see the note on `useRequirementsVersion`. */
export function useControlSetVersion(): number {
  return useSyncExternalStore(subscribeControlSets, controlSetVersion, controlSetVersion);
}

function log(
  rev: ControlSetRevision,
  kind: RevisionEventKind,
  summary: string,
  extra: { at?: string; actor?: string; role?: Role; note?: string } = {},
) {
  const s = currentSession();
  eventSeq += 1;
  events.push({
    id: `SCE-${String(eventSeq).padStart(4, "0")}`,
    revision: rev.id,
    scope: rev.scope,
    at: extra.at ?? datasetToday,
    actor: extra.actor ?? s.name,
    role: extra.role ?? s.role,
    kind,
    summary,
    ...(extra.note ? { note: extra.note } : {}),
  });
}

export function revisionById(id: string): ControlSetRevision | null {
  return revisions.find((r) => r.id === id) ?? null;
}

export function revisionsForScope(scopeId: string): ControlSetRevision[] {
  return revisions.filter((r) => r.scope === scopeId).sort((a, b) => b.number - a.number);
}

export function inForceRevision(scopeId: string): ControlSetRevision | null {
  return revisions.find((r) => r.scope === scopeId && r.state === "Approved") ?? null;
}

export function openRevision(scopeId: string): ControlSetRevision | null {
  return revisions.find((r) => r.scope === scopeId && openStates.includes(r.state)) ?? null;
}

/** The revision a reader most likely means: the open one, else the one in force. */
export function currentRevision(scopeId: string): ControlSetRevision | null {
  return openRevision(scopeId) ?? inForceRevision(scopeId);
}

export function revisionsForProgram(programId: string): ControlSetRevision[] {
  return revisions.filter((r) => r.program === programId);
}

/** Across programs — the approver's inbox. */
export function pendingRevisions(): ControlSetRevision[] {
  return revisions.filter((r) => r.state === "Pending approval");
}

export function decidedRevisions(): ControlSetRevision[] {
  return revisions
    .filter((r) => r.decided !== null)
    .sort((a, b) => (a.decided! < b.decided! ? 1 : -1));
}

export function eventsForScope(scopeId: string): RevisionEvent[] {
  return events
    .filter((e) => e.scope === scopeId)
    .slice()
    .reverse();
}

export function eventsForProgram(programId: string): RevisionEvent[] {
  const ids = new Set(revisionsForProgram(programId).map((r) => r.id));
  return events
    .filter((e) => ids.has(e.revision))
    .slice()
    .reverse();
}

/** What is recorded into the live scope when a revision takes effect. */
function applyRevision(rev: ControlSetRevision) {
  const { excluded, included } = decisionMaps(rev.tailoring);
  recordTailoring(
    rev.scope,
    { overlays: appliedOverlays(rev.overlays), excluded, included },
    { silent: true },
  );
  const scope = scopeById.get(rev.scope);
  if (scope) scope.separationBasis = rev.separationBasis;
  // Bumps the scopes store once; every surface reading the scope re-renders.
  setScopeParameter(rev.scope, { ...rev.parameters });
}

export type NewRevision = RevisionDraft & {
  program: string;
  scope: string;
  reason: string;
  framework?: FrameworkId;
  /** Start it submitted rather than as a draft. */
  submit?: boolean;
  /** Seed only: pre-decided history. */
  seed?: {
    state: RevisionState;
    author: string;
    created: string;
    submitted?: string;
    decidedBy?: string;
    decided?: string;
    note?: string;
  };
};

/**
 * Create the next revision for a scope. Numbering is per scope; a draft
 * supersedes the revision in force at the time it was cut.
 */
export function createRevision(input: NewRevision): ControlSetRevision {
  const prior = revisionsForScope(input.scope);
  const inForce = inForceRevision(input.scope);
  revSeq += 1;
  const s = currentSession();
  const seed = input.seed;
  const rev: ControlSetRevision = {
    id: `SCS-${String(revSeq).padStart(4, "0")}`,
    program: input.program,
    scope: input.scope,
    number: (prior[0]?.number ?? 0) + 1,
    state: seed?.state ?? (input.submit ? "Pending approval" : "Draft"),
    framework: input.framework ?? defaultFramework,
    parameters: { ...input.parameters },
    overlays: input.overlays.map((d) => ({ ...d })),
    tailoring: input.tailoring.map((t) => ({ ...t })),
    separationBasis: input.separationBasis,
    reason: input.reason,
    supersedes: inForce?.id ?? null,
    author: seed?.author ?? s.name,
    created: seed?.created ?? datasetToday,
    submitted: seed?.submitted ?? (input.submit ? datasetToday : null),
    decidedBy: seed?.decidedBy ?? null,
    decided: seed?.decided ?? null,
    note: seed?.note ?? "",
  };
  revisions.push(rev);
  log(rev, "created", `v${rev.number} created — ${rev.reason}`, {
    at: rev.created,
    actor: rev.author,
    role: seed ? "Systems security engineer" : s.role,
  });
  if (rev.state === "Pending approval") {
    log(rev, "submitted", `v${rev.number} submitted for approval`, {
      at: rev.submitted ?? datasetToday,
      actor: rev.author,
      role: seed ? "Systems security engineer" : s.role,
    });
  }
  if (rev.state === "Approved") {
    log(rev, "approved", `v${rev.number} approved — control set in force`, {
      at: rev.decided ?? datasetToday,
      actor: rev.decidedBy?.replace(/\s*\(.*\)$/, "") ?? s.name,
      role: "Program manager",
      ...(rev.note ? { note: rev.note } : {}),
    });
  }
  bump();
  return rev;
}

/** Copy the revision in force into a new draft. */
export function proposeRevision(scopeId: string, reason: string): ControlSetRevision | null {
  const blocked = proposeBlocked(scopeId, currentSession().role);
  if (blocked) return null;
  const scope = scopeById.get(scopeId);
  if (!scope) return null;
  const base = inForceRevision(scopeId);
  const draft: RevisionDraft = base
    ? {
        parameters: { ...base.parameters },
        overlays: base.overlays.map((d) => ({ ...d })),
        tailoring: base.tailoring.map((t) => ({ ...t })),
        separationBasis: base.separationBasis,
      }
    : {
        parameters: { ...scope.parameters },
        overlays: initialOverlayDecisions(scope.parameters),
        tailoring: [],
        separationBasis: scope.separationBasis,
      };
  return createRevision({
    ...draft,
    program: scope.program,
    scope: scopeId,
    reason: reason.trim() || "Proposed change",
  });
}

/** Edit an open draft. Refused once the revision is out of the author's hands. */
export function updateDraft(
  revisionId: string,
  patch: Partial<RevisionDraft & { reason: string }>,
): { ok: true } | { ok: false; reason: string } {
  const rev = revisionById(revisionId);
  if (!rev) return { ok: false, reason: "No such revision" };
  if (rev.state !== "Draft" && rev.state !== "Changes requested") {
    return {
      ok: false,
      reason: `v${rev.number} is ${rev.state.toLowerCase()} — reopen it to edit`,
    };
  }
  if (patch.parameters) {
    rev.parameters = { ...patch.parameters };
    rev.overlays = refreshOverlayDecisions(rev.parameters, patch.overlays ?? rev.overlays);
  } else if (patch.overlays) {
    rev.overlays = patch.overlays.map((d) => ({ ...d }));
  }
  if (patch.tailoring) rev.tailoring = patch.tailoring.map((t) => ({ ...t }));
  if (patch.separationBasis !== undefined) rev.separationBasis = patch.separationBasis;
  if (patch.reason !== undefined) rev.reason = patch.reason;
  bump();
  return { ok: true };
}

/**
 * Fire an action. The check lives here, so a disabled button is a courtesy
 * rather than the enforcement.
 */
export function performRevision(
  revisionId: string,
  key: RevisionActionKey,
  note: string,
): { ok: true } | { ok: false; reason: string } {
  const rev = revisionById(revisionId);
  if (!rev) return { ok: false, reason: "No such revision" };
  const offer = offersFor(rev, currentSession().role).find((o) => o.def.key === key);
  if (!offer) return { ok: false, reason: "That action is not available from here" };
  if (!offer.allowed) return { ok: false, reason: offer.blocked ?? "Blocked" };
  if (offer.def.note === "required" && !note.trim()) {
    return { ok: false, reason: "This action requires a reason" };
  }

  if (key === "approve") {
    const prior = inForceRevision(rev.scope);
    if (prior && prior.id !== rev.id) prior.state = "Superseded";
  }
  const summary = offer.def.apply(rev, note.trim());
  log(rev, actionEvent[key], summary, note.trim() ? { note: note.trim() } : {});
  if (key === "approve") applyRevision(rev);
  bump();
  return { ok: true };
}

/**
 * A first revision, recorded into the scope whatever its state so a new
 * program's Systems tab is never empty. Later revisions wait for approval.
 */
export function createInitialRevision(input: Omit<NewRevision, "seed">): ControlSetRevision {
  const rev = createRevision(input);
  applyRevision(rev);
  return rev;
}

/* ------------------------------------------------------------------ Seeds */

function seedApproved(scopeId: string, created: string, decided: string) {
  const scope = scopeById.get(scopeId);
  if (!scope) return;
  createRevision({
    program: scope.program,
    scope: scopeId,
    parameters: { ...scope.parameters },
    overlays: initialOverlayDecisions(scope.parameters),
    tailoring: [],
    separationBasis: scope.separationBasis,
    reason: "Initial control set",
    seed: {
      state: "Approved",
      author: "Sarah Chen",
      created,
      submitted: created,
      decidedBy: "Grace Hoppel (Program manager)",
      decided,
      note: "Approved at the scope review; ground segment holds the ceiling.",
    },
  });
}

// v1 for every seeded scope, so the change flow has history to stand on. The
// seeded scopes stay on the predicate path in `scopes.ts` — identical output.
for (const scope of assessmentScopes) seedApproved(scope.id, "Jun 12, 2026", "Jun 18, 2026");

// One proposed change awaiting the program manager, so the approval flow is
// demoable on first load: a coalition cross-domain link was added to the relay.
{
  const scope = scopeById.get("SYS-0003");
  if (scope) {
    const parameters: SystemParameters = { ...scope.parameters, crossDomain: true };
    createRevision({
      program: scope.program,
      scope: scope.id,
      parameters,
      overlays: initialOverlayDecisions(parameters),
      tailoring: [
        {
          control: "AU-4(1)",
          decision: "excluded",
          source: "system-tailoring",
          rationale:
            "The relay's audit store is fixed-size flash with no off-load path in DDIL; the ground segment's collector meets the transfer objective under AU-4 in SYS-0001 on reachback.",
          authority: "Marcus Ryde · Systems security engineer",
          at: "Aug 27, 2026",
        },
      ],
      separationBasis: scope.separationBasis,
      reason: "Coalition cross-domain link added to the relay (ECP-0142)",
      seed: {
        state: "Pending approval",
        author: "Marcus Ryde",
        created: "Aug 26, 2026",
        submitted: "Aug 28, 2026",
      },
    });
  }
}

/* --------------------------------------------------------------- Lookups */

export function controlById(id: string): NistControl | null {
  return nistControlById.get(id) ?? null;
}
