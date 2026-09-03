/**
 * Working a control.
 *
 * Everything else in this app is a projection: the matrix, the SCTM, the
 * composition tree, the requirement records. They all answer "what is true?"
 * None of them answers "what do I do, and what happens when I do it?" — and an
 * assurance product that cannot answer the second question is a report, not a
 * tool.
 *
 * The unit of work is one control inside one assessment scope. Not a
 * requirement and not a component: those are how the work decomposes, but the
 * control is what gets assessed and what ships in the package. A person is
 * assigned one, advances it through states, and leaves a trail.
 *
 * Three things make this a workflow rather than a status dropdown:
 *
 *  - **Gates.** A transition names the conditions that must hold before it can
 *    fire. "Implemented" requires a written implementation narrative AND at
 *    least one contributor that is an allocated requirement or an accepted
 *    inheritance. That is `§15.2`'s invariant — "a selected system control
 *    cannot be marked assessed-satisfied solely because a component advertises
 *    support" — expressed as something the UI can refuse to do.
 *  - **Roles.** An engineer writes implementation and links evidence; only an
 *    assessor records a determination; only the risk authority accepts residual
 *    risk. `§13`'s separation of duty, and the reason "automation proposes,
 *    authority approves" is more than a slogan.
 *  - **A log.** Every mutation appends an immutable event with actor, role,
 *    field, before and after. `programActivity()` *derives* a feed from source
 *    records, which can tell you a control's status changed but never who
 *    changed it or why. This records it.
 */

import { useSyncExternalStore } from "react";

import { datasetToday } from "@/lib/dataset-clock";
import type { Tone } from "@/ds/primitives";

/* ------------------------------------------------------------------- Roles */

/** `§13`. Only the roles that touch control work; the catalogue is wider. */
export type Role =
  | "Systems security engineer"
  | "Component engineer"
  | "Verification engineer"
  | "Assessor"
  | "Authorizing official"
  | "Program manager";

export const roles: Role[] = [
  "Systems security engineer",
  "Component engineer",
  "Verification engineer",
  "Assessor",
  "Authorizing official",
  "Program manager",
];

/**
 * Who is driving. A prototype needs a current user for the gates to mean
 * anything — a workflow where everyone can do everything is a dropdown with
 * extra steps. The role is switchable so the separation of duty is visible
 * rather than asserted: switch to Assessor and the determination action
 * appears, switch away and it refuses.
 */
export type Session = { name: string; role: Role };

let session: Session = { name: "Priya Raghavan", role: "Systems security engineer" };

export function currentSession(): Session {
  return session;
}

export function setSession(next: Partial<Session>) {
  session = { ...session, ...next };
  bump();
}

/* ------------------------------------------------------------------ States */

/**
 * Two axes, not a fifth vocabulary.
 *
 * This module previously invented `WorkState` — Unassigned / Planned /
 * Implemented / Ready / Satisfied / Other than satisfied / Risk accepted —
 * which overlapped `controlImplementation` and `controlAssessment` in the
 * spine and brought the number of competing answers to "is this control OK"
 * to five, across fifteen surfaces. It is gone.
 *
 * RMF already separates the two claims and they are genuinely orthogonal:
 *
 *  - **Implementation** is what the engineer asserts the system does.
 *  - **Assessment** is what the assessor determined after looking.
 *
 * A control can be Implemented and Other than satisfied — that is the normal
 * outcome of a failed assessment, and a single collapsed state cannot say it.
 * Origination (System / Inherited / Hybrid) is a third, separate attribute and
 * is deliberately not part of this: it says *who* implements, not *how far
 * along* it is.
 *
 * "Submitted" is the one genuinely new fact, and it is a flag rather than a
 * vocabulary: it records that the engineer has handed the control to the
 * assessor and is waiting.
 */

export const implementationStates = [
  "Not implemented",
  "Planned",
  "Partially implemented",
  "Implemented",
] as const;
export type ImplementationState = (typeof implementationStates)[number];

export const assessmentStates = ["Not assessed", "Satisfied", "Other than satisfied"] as const;
export type AssessmentState = (typeof assessmentStates)[number];

export const implementationTone: Record<ImplementationState, Tone> = {
  "Not implemented": "neutral",
  Planned: "neutral",
  "Partially implemented": "warning",
  Implemented: "information",
};

export const assessmentTone: Record<AssessmentState, Tone> = {
  "Not assessed": "neutral",
  Satisfied: "success",
  "Other than satisfied": "danger",
};

export type ControlWork = {
  id: string; // WRK-
  program: string; // PRG-
  scope: string; // SYS-
  control: string; // AC-2
  implementation: ImplementationState;
  assessment: AssessmentState;
  /** Handed to the assessor and awaiting a determination. */
  submitted: boolean;
  owner: string | null;
  /** The SSP implementation statement. The actual deliverable. */
  narrative: string;
  /** Bumped on every narrative change; the text is never silently replaced. */
  narrativeRevision: number;
  /** Assessor's conclusion, set when the control is assessed. */
  determinationNote: string;
  /** EVD- ids linked as proof. */
  evidence: string[];
  /** Risk authority's acceptance rationale, when residual risk is accepted. */
  riskAcceptance: string;
};

/** Where the work sits, derived from the two axes rather than stored. */
export function positionOf(work: ControlWork): string {
  if (!work.owner) return "Unassigned";
  if (work.assessment !== "Not assessed") return work.assessment;
  if (work.submitted) return "With the assessor";
  if (work.implementation === "Implemented") return "Implemented";
  return work.implementation;
}

/* ------------------------------------------------------------------- Gates */

export type GateKey = "owner" | "narrative" | "contributor" | "evidence" | "determination";

export type Gate = {
  key: GateKey;
  label: string;
  met: boolean;
  /** What is missing, or what satisfies it. */
  detail: string;
};

/**
 * Contributors are supplied by the caller rather than imported.
 *
 * `requirements.ts` and `inheritance.ts` both know how to answer "what
 * contributes to this control", and importing either here would make this
 * module depend on the whole requirement graph — and eventually cycle, since a
 * requirement's own state will want to read work state. The route resolves
 * contributors and passes the count in.
 */
export type WorkContext = {
  /** Allocated requirements + accepted inheritances that contribute. */
  contributors: number;
  contributorDetail: string;
};

export function gatesFor(work: ControlWork, context: WorkContext): Gate[] {
  return [
    {
      key: "owner",
      label: "Owner assigned",
      met: !!work.owner,
      detail: work.owner ?? "Nobody is accountable for this control yet",
    },
    {
      key: "narrative",
      label: "Implementation written",
      met: work.narrative.trim().length > 0,
      detail: work.narrative.trim()
        ? `Revision ${work.narrativeRevision}`
        : "The SSP has nothing to say about this control",
    },
    {
      key: "contributor",
      label: "At least one contributor",
      met: context.contributors > 0,
      detail: context.contributorDetail,
    },
    {
      key: "evidence",
      label: "Evidence linked",
      met: work.evidence.length > 0,
      detail: work.evidence.length
        ? `${work.evidence.length} artifact${work.evidence.length === 1 ? "" : "s"}`
        : "Nothing demonstrates the claim",
    },
    {
      key: "determination",
      label: "Determination recorded",
      met: work.determinationNote.trim().length > 0,
      detail: work.determinationNote.trim() || "No assessor conclusion on file",
    },
  ];
}

/* ----------------------------------------------------------------- Actions */

/**
 * What a person can do, rather than what state the record can be in.
 *
 * Each action names the field it moves, who may move it, and what must be true
 * first. A blocked action is still offered — with its reason — because a
 * disabled control that will not say why is how a workflow turns into folklore.
 */
export type ActionDef = {
  key: string;
  label: string;
  roles: Role[];
  requires: GateKey[];
  note: "required" | "optional";
  /** Whether the action makes sense from where the work currently sits. */
  available: (w: ControlWork) => boolean;
  apply: (w: ControlWork, note: string) => string;
};

export const actionDefs: ActionDef[] = [
  {
    key: "plan",
    label: "Mark planned",
    roles: ["Systems security engineer", "Program manager"],
    requires: ["owner"],
    note: "optional",
    available: (w) => w.implementation === "Not implemented",
    apply: (w) => {
      w.implementation = "Planned";
      return "Implementation set to Planned";
    },
  },
  {
    key: "partial",
    label: "Mark partially implemented",
    roles: ["Systems security engineer", "Component engineer"],
    requires: ["owner", "narrative"],
    note: "optional",
    available: (w) => w.implementation !== "Implemented" && !w.submitted,
    apply: (w) => {
      w.implementation = "Partially implemented";
      return "Implementation set to Partially implemented";
    },
  },
  {
    key: "implement",
    label: "Mark implemented",
    roles: ["Systems security engineer", "Component engineer"],
    // The invariant: a control cannot be claimed implemented because a
    // component advertises support. Something has to have been written, and
    // something has to have been made responsible.
    requires: ["owner", "narrative", "contributor"],
    note: "optional",
    available: (w) => w.implementation !== "Implemented" && !w.submitted,
    apply: (w) => {
      w.implementation = "Implemented";
      return "Implementation set to Implemented";
    },
  },
  {
    key: "submit",
    label: "Submit for assessment",
    roles: ["Systems security engineer", "Verification engineer"],
    requires: ["owner", "narrative", "contributor", "evidence"],
    note: "optional",
    available: (w) => w.implementation === "Implemented" && !w.submitted,
    apply: (w) => {
      w.submitted = true;
      return "Submitted for assessment";
    },
  },
  {
    key: "withdraw",
    label: "Withdraw",
    roles: ["Systems security engineer"],
    requires: [],
    note: "required",
    available: (w) => w.submitted && w.assessment === "Not assessed",
    apply: (w) => {
      w.submitted = false;
      return "Withdrawn from assessment";
    },
  },
  {
    key: "satisfy",
    label: "Record satisfied",
    roles: ["Assessor"],
    requires: ["narrative", "contributor", "evidence", "determination"],
    note: "required",
    available: (w) => w.submitted && w.assessment !== "Satisfied",
    apply: (w) => {
      w.assessment = "Satisfied";
      w.submitted = false;
      return "Assessed Satisfied";
    },
  },
  {
    key: "fail",
    label: "Record other than satisfied",
    roles: ["Assessor"],
    requires: ["determination"],
    note: "required",
    available: (w) => w.submitted || w.assessment === "Satisfied",
    apply: (w) => {
      w.assessment = "Other than satisfied";
      w.submitted = false;
      return "Assessed Other than satisfied";
    },
  },
  {
    key: "accept-risk",
    label: "Accept residual risk",
    roles: ["Authorizing official"],
    requires: ["determination"],
    note: "required",
    available: (w) => w.assessment === "Other than satisfied" && !w.riskAcceptance,
    apply: (w, note) => {
      w.riskAcceptance = note;
      return "Residual risk accepted";
    },
  },
];

export type Offer = {
  def: ActionDef;
  allowed: boolean;
  /** Why not, in one line. Null when allowed. */
  blocked: string | null;
  missing: Gate[];
  roleBlocked: boolean;
};

export function offersFor(work: ControlWork, context: WorkContext, role: Role): Offer[] {
  const byKey = new Map(gatesFor(work, context).map((g) => [g.key, g]));
  return actionDefs
    .filter((d) => d.available(work))
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

/* ---------------------------------------------------------------- Activity */

export type EventKind =
  | "created"
  | "assigned"
  | "narrative"
  | "evidence-linked"
  | "evidence-unlinked"
  | "transition"
  | "comment";

/**
 * Append-only. Nothing here is ever updated or removed — `§15.2`: "deleting a
 * referenced object is prohibited; retire or supersede it instead". A
 * determination that silently changed cannot be audited, and neither can one
 * whose history was rewritten.
 */
export type WorkEvent = {
  id: string;
  work: string; // WRK-
  at: string; // "MMM DD, YYYY"
  actor: string;
  role: Role;
  kind: EventKind;
  summary: string;
  /** Field-level change, when the event carries one. */
  field?: string;
  before?: string;
  after?: string;
  /** The reason the actor gave, when the transition required one. */
  note?: string;
};

export type Comment = {
  id: string;
  work: string; // WRK-
  at: string;
  author: string;
  role: Role;
  body: string;
};

const events: WorkEvent[] = [];
const comments: Comment[] = [];
let eventSeq = 0;
let commentSeq = 0;

function log(work: string, kind: EventKind, summary: string, extra: Partial<WorkEvent> = {}) {
  eventSeq += 1;
  events.push({
    id: `EVT-${String(eventSeq).padStart(4, "0")}`,
    work,
    at: datasetToday,
    actor: session.name,
    role: session.role,
    kind,
    summary,
    ...extra,
  });
}

export function activityFor(workId: string): WorkEvent[] {
  return events
    .filter((e) => e.work === workId)
    .slice()
    .reverse();
}

export function commentsFor(workId: string): Comment[] {
  return comments.filter((c) => c.work === workId);
}

export function addComment(workId: string, body: string) {
  if (!body.trim()) return;
  commentSeq += 1;
  comments.push({
    id: `CMT-${String(commentSeq).padStart(4, "0")}`,
    work: workId,
    at: datasetToday,
    author: session.name,
    role: session.role,
    body: body.trim(),
  });
  log(workId, "comment", `${session.name} commented`);
}

/* -------------------------------------------------------------- The store */

const work: ControlWork[] = [];
const byKey = new Map<string, ControlWork>();
const listeners = new Set<() => void>();
let version = 0;
let workSeq = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

export function subscribeWork(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function workVersion(): number {
  return version;
}

/** Stable-snapshot contract — see the note on `useRequirementsVersion`. */
export function useWorkVersion(): number {
  return useSyncExternalStore(subscribeWork, workVersion, workVersion);
}

function keyOf(scope: string, control: string) {
  return `${scope}|${control}`;
}

function create(program: string, scope: string, control: string, seed: Partial<ControlWork> = {}) {
  workSeq += 1;
  const created: ControlWork = {
    id: `WRK-${String(workSeq).padStart(4, "0")}`,
    program,
    scope,
    control,
    implementation: "Not implemented",
    assessment: "Not assessed",
    submitted: false,
    owner: null,
    narrative: "",
    narrativeRevision: 0,
    determinationNote: "",
    evidence: [],
    riskAcceptance: "",
    ...seed,
  };
  work.push(created);
  byKey.set(keyOf(scope, control), created);
  return created;
}

/**
 * The work item for one control in one scope, created on demand.
 *
 * 373 controls across 3 scopes is over a thousand rows nobody has touched. They
 * are not stored until someone does something with one — an untouched record
 * carries no information a lookup cannot reconstruct.
 */
export function workFor(program: string, scope: string, control: string): ControlWork {
  return byKey.get(keyOf(scope, control)) ?? create(program, scope, control);
}

/**
 * The scope a reader most likely means for this control.
 *
 * A control exists in several scopes' sets, but usually only one has been
 * worked. Defaulting to the first scope alphabetically would show an untouched
 * Unassigned record and hide the real one, so prefer any scope where somebody
 * has already started.
 */
export function preferredScope(
  program: string,
  control: string,
  candidates: string[],
): string | null {
  const started = work.find((w) => w.program === program && w.control === control && !!w.owner);
  if (started && candidates.includes(started.scope)) return started.scope;
  return candidates[0] ?? null;
}

export function workById(id: string): ControlWork | undefined {
  return work.find((w) => w.id === id);
}

/** Only the items somebody has started. */
export function startedWork(programId: string): ControlWork[] {
  return work.filter((w) => w.program === programId && !!w.owner);
}

export function workForScope(scopeId: string): ControlWork[] {
  return work.filter((w) => w.scope === scopeId);
}

/* ----------------------------------------------------------- Mutations */

export function assignOwner(workId: string, owner: string) {
  const w = workById(workId);
  if (!w || w.owner === owner) return;
  const before = w.owner;
  w.owner = owner;
  log(workId, "assigned", `Owner set to ${owner}`, {
    field: "owner",
    before: before ?? "Unassigned",
    after: owner,
  });
  bump();
}

/**
 * A narrative change bumps a revision rather than overwriting silently. The
 * previous text is carried in the log, which is the only place it survives.
 */
export function setNarrative(workId: string, text: string) {
  const w = workById(workId);
  if (!w || w.narrative === text) return;
  const before = w.narrative;
  w.narrative = text;
  w.narrativeRevision += 1;
  log(workId, "narrative", `Implementation revised to r${w.narrativeRevision}`, {
    field: "narrative",
    before: before || "(empty)",
    after: text,
  });
  bump();
}

export function linkEvidence(workId: string, evidenceId: string) {
  const w = workById(workId);
  if (!w || w.evidence.includes(evidenceId)) return;
  w.evidence.push(evidenceId);
  log(workId, "evidence-linked", `Linked ${evidenceId}`, { field: "evidence", after: evidenceId });
  bump();
}

export function unlinkEvidence(workId: string, evidenceId: string) {
  const w = workById(workId);
  if (!w) return;
  w.evidence = w.evidence.filter((e) => e !== evidenceId);
  log(workId, "evidence-unlinked", `Unlinked ${evidenceId}`, {
    field: "evidence",
    before: evidenceId,
  });
  bump();
}

export function setDeterminationNote(workId: string, note: string) {
  const w = workById(workId);
  if (!w || w.determinationNote === note) return;
  w.determinationNote = note;
  bump();
}

/**
 * Fire a transition. Refuses when the role is wrong or a gate is unmet —
 * the check lives here rather than only in the UI, so a disabled button is a
 * courtesy and not the enforcement.
 */
/**
 * Fire an action. Refuses when the role is wrong or a gate is unmet — the check
 * lives here, so a disabled button is a courtesy rather than the enforcement.
 */
export function perform(
  workId: string,
  actionKey: string,
  context: WorkContext,
  note: string,
): { ok: true } | { ok: false; reason: string } {
  const w = workById(workId);
  if (!w) return { ok: false, reason: "No such work item" };

  const offer = offersFor(w, context, session.role).find((o) => o.def.key === actionKey);
  if (!offer) return { ok: false, reason: "That action is not available from here" };
  if (!offer.allowed) return { ok: false, reason: offer.blocked ?? "Blocked" };
  if (offer.def.note === "required" && !note.trim()) {
    return { ok: false, reason: "This action requires a reason" };
  }

  const before = positionOf(w);
  const summary = offer.def.apply(w, note.trim());
  log(workId, "transition", summary, {
    field: "position",
    before,
    after: positionOf(w),
    ...(note.trim() ? { note: note.trim() } : {}),
  });
  bump();
  return { ok: true };
}

/* ------------------------------------------------------------------ Queue */

export type QueueBucket = {
  key: string;
  label: string;
  items: ControlWork[];
};

/** What a person opens in the morning. Buckets are role-shaped. */
export function queueFor(programId: string, who: Session): QueueBucket[] {
  const mine = work.filter((w) => w.program === programId);
  const owned = mine.filter((w) => w.owner === who.name);

  if (who.role === "Assessor") {
    return [
      { key: "awaiting", label: "Awaiting assessment", items: mine.filter((w) => w.submitted) },
      {
        key: "deficient",
        label: "Other than satisfied",
        items: mine.filter((w) => w.assessment === "Other than satisfied"),
      },
    ];
  }

  if (who.role === "Authorizing official") {
    return [
      {
        key: "risk",
        label: "Awaiting a risk decision",
        items: mine.filter((w) => w.assessment === "Other than satisfied" && !w.riskAcceptance),
      },
      {
        key: "accepted",
        label: "Risk accepted",
        items: mine.filter((w) => !!w.riskAcceptance),
      },
    ];
  }

  return [
    {
      key: "narrative",
      label: "Needs an implementation",
      items: owned.filter((w) => !w.narrative.trim()),
    },
    {
      key: "evidence",
      label: "Needs evidence",
      items: owned.filter(
        (w) => w.implementation === "Implemented" && !w.submitted && w.evidence.length === 0,
      ),
    },
    { key: "submitted", label: "With the assessor", items: owned.filter((w) => w.submitted) },
    {
      key: "deficient",
      label: "Came back deficient",
      items: owned.filter((w) => w.assessment === "Other than satisfied"),
    },
  ];
}

/* ------------------------------------------------------------------- Seed */

/**
 * Eight controls partway through the work, so every queue bucket and every gate
 * state is reachable without clicking through a fresh workflow first.
 *
 * The narratives are the SSP implementation statements that used to sit frozen
 * in `assertions` in `sctm.ts`. Moving them here is the point: an implementation
 * statement is something a person writes, revises and is accountable for, not a
 * literal in a lookup table. The SCTM should read this, not the other way
 * round.
 */
type Seed = {
  scope: string;
  control: string;
  implementation: ImplementationState;
  assessment: AssessmentState;
  submitted: boolean;
  owner: string;
  narrative: string;
  evidence: string[];
  determinationNote?: string;
  history: {
    at: string;
    actor: string;
    role: Role;
    kind: EventKind;
    summary: string;
    note?: string;
  }[];
};

const seeds: Seed[] = [
  {
    scope: "SYS-0001",
    control: "AC-2",
    implementation: "Implemented",
    assessment: "Satisfied",
    submitted: false,
    owner: "Priya Raghavan",
    narrative:
      "Interactive and service accounts on gcs-app-01, gcs-app-02 and gcs-db-01 are provisioned only through the idp-core account workflow; the sole local accounts are the platform-ops break-glass account and the PostgreSQL 15.6 service account, both reconciled against the weekly IAM export.",
    evidence: ["EVD-8861", "EVD-8841"],
    determinationNote:
      "Sampled twelve accounts across the three hosts against the August IAM export. Provisioning path and the two declared local accounts both check out.",
    history: [
      {
        at: "Jul 14, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Priya Raghavan",
      },
      {
        at: "Jul 28, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 05, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Planned → Implemented",
      },
      {
        at: "Aug 12, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Implemented → Ready for assessment",
      },
      {
        at: "Aug 24, 2026",
        actor: "Dana Whitlock",
        role: "Assessor",
        kind: "transition",
        summary: "Ready for assessment → Satisfied",
        note: "Sampled twelve accounts; provisioning path confirmed.",
      },
    ],
  },
  {
    scope: "SYS-0001",
    control: "AC-11",
    implementation: "Implemented",
    assessment: "Not assessed",
    submitted: true,
    owner: "Priya Raghavan",
    narrative:
      "Sessions on gcs-app-01 and gcs-app-02 lock after 15 minutes of inactivity through the tmux lock-command in /etc/profile.d, and openssh-server 8.7p1 terminates idle remote sessions at ClientAliveInterval 600 with ClientAliveCountMax 0.",
    evidence: ["EVD-8841"],
    history: [
      {
        at: "Aug 02, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Priya Raghavan",
      },
      {
        at: "Aug 18, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 26, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Implemented → Ready for assessment",
      },
    ],
  },
  {
    scope: "SYS-0002",
    control: "AC-4",
    implementation: "Implemented",
    assessment: "Other than satisfied",
    submitted: false,
    owner: "Sarah Chen",
    narrative:
      "Flow between the tactical edge and the DMZ is constrained to the mutually authenticated /v2 routes of the mission-api service: the GovCloud landing zone security groups admit only TCP 443 from edge-sw-a1, and the operator and diagnostic routes inside the mission-api:2.14.0 image are bound to the container loopback interface.",
    evidence: ["EVD-8866"],
    determinationNote:
      "The diagnostic route is bound to loopback in the image, but the deployed manifest publishes it on the pod network. The claim does not describe the running configuration.",
    history: [
      {
        at: "Jun 30, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Sarah Chen",
      },
      {
        at: "Jul 21, 2026",
        actor: "Sarah Chen",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 08, 2026",
        actor: "Sarah Chen",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Implemented → Ready for assessment",
      },
      {
        at: "Aug 27, 2026",
        actor: "Dana Whitlock",
        role: "Assessor",
        kind: "transition",
        summary: "Ready for assessment → Other than satisfied",
        note: "Deployed manifest publishes the diagnostic route on the pod network.",
      },
    ],
  },
  {
    scope: "SYS-0003",
    control: "SI-7",
    implementation: "Implemented",
    assessment: "Not assessed",
    submitted: false,
    owner: "Marcus Ryde",
    narrative:
      "ROMMON on edge-sw-a1 authenticates IOS-XE against a production signing key before transferring execution, anchored to the fuse-backed key hash in the Marvell 88E6390 switch ASIC. Signing authority is held in the air-gapped enclave under two-person control and trust anchors are burned on the manufacturing line.",
    evidence: [],
    history: [
      {
        at: "Jul 02, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Marcus Ryde",
      },
      {
        at: "Aug 14, 2026",
        actor: "Marcus Ryde",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 20, 2026",
        actor: "Marcus Ryde",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Planned → Implemented",
      },
    ],
  },
  {
    scope: "SYS-0003",
    control: "SC-40",
    implementation: "Planned",
    assessment: "Not assessed",
    submitted: false,
    owner: "Marcus Ryde",
    narrative: "",
    evidence: [],
    history: [
      {
        at: "Aug 19, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Marcus Ryde",
      },
    ],
  },
  {
    scope: "SYS-0003",
    control: "AU-4(1)",
    implementation: "Planned",
    assessment: "Not assessed",
    submitted: false,
    owner: "Priya Raghavan",
    narrative: "",
    evidence: [],
    history: [
      {
        at: "Aug 21, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Priya Raghavan",
      },
    ],
  },
  {
    scope: "SYS-0001",
    control: "CP-9",
    implementation: "Implemented",
    assessment: "Not assessed",
    submitted: false,
    owner: "Priya Raghavan",
    narrative:
      "PostgreSQL 15.6 on gcs-db-01 streams WAL to the GovCloud landing zone backup account on a five-minute cadence with a nightly base backup; restore is exercised quarterly against a scratch instance in the same account.",
    evidence: [],
    history: [
      {
        at: "Jul 09, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Priya Raghavan",
      },
      {
        at: "Aug 11, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 11, 2026",
        actor: "Priya Raghavan",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Planned → Implemented",
      },
    ],
  },
  {
    scope: "SYS-0002",
    control: "SC-7",
    implementation: "Implemented",
    assessment: "Satisfied",
    submitted: false,
    owner: "Sarah Chen",
    narrative:
      "The tokenisation boundary in front of the settlement service is the scope's confidentiality separation: primary account numbers are exchanged for tokens at the landing-zone edge and the service holds no PAN at rest. The boundary itself is assessed here rather than assumed.",
    evidence: ["EVD-8846", "EVD-8893"],
    determinationNote:
      "Boundary configuration and a sampled transaction trace both confirm tokenisation occurs before the service. Supports the Moderate confidentiality categorization for this scope.",
    history: [
      {
        at: "Jun 18, 2026",
        actor: "Ray Colston",
        role: "Program manager",
        kind: "assigned",
        summary: "Assigned to Sarah Chen",
      },
      {
        at: "Jul 30, 2026",
        actor: "Sarah Chen",
        role: "Systems security engineer",
        kind: "narrative",
        summary: "Implementation written",
      },
      {
        at: "Aug 06, 2026",
        actor: "Sarah Chen",
        role: "Systems security engineer",
        kind: "transition",
        summary: "Implemented → Ready for assessment",
      },
      {
        at: "Aug 19, 2026",
        actor: "Dana Whitlock",
        role: "Assessor",
        kind: "transition",
        summary: "Ready for assessment → Satisfied",
        note: "Tokenisation confirmed ahead of the service; separation basis holds.",
      },
    ],
  },
];

for (const seed of seeds) {
  const created = create("PRG-1041", seed.scope, seed.control, {
    implementation: seed.implementation,
    assessment: seed.assessment,
    submitted: seed.submitted,
    owner: seed.owner,
    narrative: seed.narrative,
    narrativeRevision: seed.narrative ? 1 : 0,
    evidence: seed.evidence,
    determinationNote: seed.determinationNote ?? "",
  });
  for (const h of seed.history) {
    eventSeq += 1;
    events.push({
      id: `EVT-${String(eventSeq).padStart(4, "0")}`,
      work: created.id,
      at: h.at,
      actor: h.actor,
      role: h.role,
      kind: h.kind,
      summary: h.summary,
      ...(h.note ? { note: h.note } : {}),
    });
  }
}

const seedComments: {
  scope: string;
  control: string;
  at: string;
  author: string;
  role: Role;
  body: string;
}[] = [
  {
    scope: "SYS-0002",
    control: "AC-4",
    at: "Aug 27, 2026",
    author: "Dana Whitlock",
    role: "Assessor",
    body: "The narrative describes the image, not the deployment. Can you point me at the manifest that binds the diagnostic route, or confirm it is published?",
  },
  {
    scope: "SYS-0002",
    control: "AC-4",
    at: "Aug 28, 2026",
    author: "Sarah Chen",
    role: "Systems security engineer",
    body: "You are right — the Helm values publish 9090 on the pod network for the metrics sidecar and the diagnostic route rides the same listener. Fix is in CHG-0447; I will re-submit once it lands and the narrative is corrected to describe the deployed state.",
  },
  {
    scope: "SYS-0003",
    control: "SI-7",
    at: "Aug 22, 2026",
    author: "Nadia Fournier",
    role: "Verification engineer",
    body: "Holding evidence until the ceremony in WS-0103 completes — a boot test against a development key does not demonstrate this control, and linking it would put an artifact on file that proves the wrong thing.",
  },
];

for (const c of seedComments) {
  const w = byKey.get(keyOf(c.scope, c.control));
  if (!w) continue;
  commentSeq += 1;
  comments.push({
    id: `CMT-${String(commentSeq).padStart(4, "0")}`,
    work: w.id,
    at: c.at,
    author: c.author,
    role: c.role,
    body: c.body,
  });
}
