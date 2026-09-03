/**
 * Verification is a link to a test with a result per event, not a state
 * field. A requirement is covered by the test objectives that name it; it is
 * "not covered" when none does, and that is a state the bar shows as a hole,
 * never inferred from an allocation being Verified. The traceability matrix
 * is a projection of these links: one row per requirement and objective, one
 * result column per test event.
 */

import { useSyncExternalStore } from "react";

import { suspectLinksFor } from "@/lib/link-currency";

import {
  eventById,
  objectiveById,
  objectives,
  type ObjectiveResult,
  type TestEvent,
  type TestObjective,
} from "@/lib/campaigns";
import {
  allocationsFor,
  childrenOfRequirement,
  needsOf,
  requirementsForProgram,
  resolveTarget,
  type Requirement,
  type RequirementNeed,
} from "@/lib/requirements";

export type VerificationLink = {
  requirement: string; // REQ-
  objective: string; // TO-
  linkedBy: string;
  linkedOn: string;
};

const links: VerificationLink[] = [
  {
    requirement: "REQ-0042.1",
    objective: "TO-130",
    linkedBy: "Sarah Chen",
    linkedOn: "Aug 20, 2026",
  },
  {
    requirement: "REQ-0042.2",
    objective: "TO-130",
    linkedBy: "Sarah Chen",
    linkedOn: "Aug 20, 2026",
  },
  {
    requirement: "REQ-0042.3",
    objective: "TO-132",
    linkedBy: "Sarah Chen",
    linkedOn: "Aug 20, 2026",
  },
  {
    requirement: "REQ-0042.4",
    objective: "TO-131",
    linkedBy: "Marcus Ryde",
    linkedOn: "Aug 22, 2026",
  },
];

/* ------------------------------------------------------------------ Store */

const listeners = new Set<() => void>();
let version = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

export function subscribeVerification(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useVerificationVersion(): number {
  return useSyncExternalStore(
    subscribeVerification,
    () => version,
    () => version,
  );
}

export function linkVerification(requirementId: string, objectiveId: string, by: string): void {
  if (links.some((l) => l.requirement === requirementId && l.objective === objectiveId)) return;
  if (!objectiveById.has(objectiveId)) return;
  links.push({
    requirement: requirementId,
    objective: objectiveId,
    linkedBy: by,
    linkedOn: "Sep 2, 2026",
  });
  bump();
}

export function unlinkVerification(requirementId: string, objectiveId: string): void {
  const i = links.findIndex((l) => l.requirement === requirementId && l.objective === objectiveId);
  if (i < 0) return;
  links.splice(i, 1);
  bump();
}

/* ------------------------------------------------------------------ Reads */

export function objectivesForRequirement(requirementId: string): TestObjective[] {
  return links
    .filter((l) => l.requirement === requirementId)
    .map((l) => objectiveById.get(l.objective))
    .filter((o): o is TestObjective => !!o);
}

export function requirementsForObjective(objectiveId: string): string[] {
  return links.filter((l) => l.objective === objectiveId).map((l) => l.requirement);
}

/** Objectives no requirement names yet: what a Verify action can pick from. */
export function unlinkedObjectives(requirementId: string): TestObjective[] {
  const mine = new Set(
    links.filter((l) => l.requirement === requirementId).map((l) => l.objective),
  );
  return objectives.filter((o) => !mine.has(o.id));
}

export type RequirementCoverage = {
  met: number;
  partial: number;
  notMet: number;
  notRun: number;
  /** Leaves with no objective. A hole, not an outcome. */
  notCovered: number;
};

const empty = (): RequirementCoverage => ({
  met: 0,
  partial: 0,
  notMet: 0,
  notRun: 0,
  notCovered: 0,
});

function add(a: RequirementCoverage, b: RequirementCoverage): RequirementCoverage {
  return {
    met: a.met + b.met,
    partial: a.partial + b.partial,
    notMet: a.notMet + b.notMet,
    notRun: a.notRun + b.notRun,
    notCovered: a.notCovered + b.notCovered,
  };
}

function bucket(result: ObjectiveResult): keyof RequirementCoverage {
  return result === "Met"
    ? "met"
    : result === "Partially met"
      ? "partial"
      : result === "Not met"
        ? "notMet"
        : "notRun";
}

/** A leaf counts its objectives, or one hole. A parent is the sum of its children. */
export function coverageOf(requirement: Requirement): RequirementCoverage {
  const children = childrenOfRequirement(requirement.id);
  if (children.length) return children.map(coverageOf).reduce(add, empty());
  const objs = objectivesForRequirement(requirement.id);
  if (objs.length === 0) return { ...empty(), notCovered: 1 };
  const c = empty();
  for (const o of objs) c[bucket(o.result)] += 1;
  return c;
}

export function coverageTotal(c: RequirementCoverage): number {
  return c.met + c.partial + c.notMet + c.notRun + c.notCovered;
}

/** Over the program's leaves. */
export function programCoverage(programId: string): RequirementCoverage {
  return requirementsForProgram(programId)
    .filter((r) => childrenOfRequirement(r.id).length === 0)
    .map(coverageOf)
    .reduce(add, empty());
}

/** Leaves with no objective. */
export function notCoveredRequirements(programId: string): Requirement[] {
  return requirementsForProgram(programId).filter(
    (r) => childrenOfRequirement(r.id).length === 0 && objectivesForRequirement(r.id).length === 0,
  );
}

/* ------------------------------------------------------------ The matrix */

export type RtmRow = {
  requirement: string;
  statement: string;
  /** Control statements the requirement derives from. */
  sources: string[];
  /** Names of the elements, providers and processes that carry it. */
  allocatedTo: string[];
  method: string;
  objective: string | null;
  objectiveStatement: string;
  /** One entry per event column; "" where the objective did not run in that event. */
  results: Record<string, ObjectiveResult | "">;
  evidence: string;
};

/** One row per requirement and objective, one result column per event. */
export function rtm(programId: string): { events: TestEvent[]; rows: RtmRow[] } {
  const leaves = requirementsForProgram(programId).filter(
    (r) => childrenOfRequirement(r.id).length === 0,
  );
  const eventIds = new Set<string>();
  for (const r of leaves)
    for (const o of objectivesForRequirement(r.id)) if (o.event) eventIds.add(o.event);
  const events = [...eventIds]
    .map((id) => eventById.get(id))
    .filter((e): e is TestEvent => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));

  const rows: RtmRow[] = [];
  for (const r of leaves) {
    const base = {
      requirement: r.id,
      statement: r.text,
      sources: r.derivations
        .filter((d) => d.sourceType === "Control statement")
        .map((d) => d.sourceId),
      allocatedTo: allocationsFor(r.id).map((a) => resolveTarget(a).name),
      method: r.method,
    };
    const objs = objectivesForRequirement(r.id);
    if (objs.length === 0) {
      rows.push({
        ...base,
        objective: null,
        objectiveStatement: "",
        results: Object.fromEntries(events.map((e) => [e.id, ""])),
        evidence: "",
      });
      continue;
    }
    for (const o of objs)
      rows.push({
        ...base,
        objective: o.id,
        objectiveStatement: o.statement,
        results: Object.fromEntries(events.map((e) => [e.id, e.id === o.event ? o.result : ""])),
        evidence: o.evidence ?? "",
      });
  }
  return { events, rows };
}

/** The matrix as CSV, for the assessor's spreadsheet. */
export function rtmCsv(programId: string): string {
  const { events, rows } = rtm(programId);
  const head = [
    "Requirement",
    "Statement",
    "Source controls",
    "Allocated to",
    "Method",
    "Objective",
    "Objective statement",
    ...events.map((e) => `${e.id} ${e.name}`),
    "Evidence",
  ];
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [
      r.requirement,
      r.statement,
      r.sources.join("; "),
      r.allocatedTo.join("; "),
      r.method,
      r.objective ?? "",
      r.objectiveStatement,
      ...events.map((e) => r.results[e.id] ?? ""),
      r.evidence,
    ]
      .map(cell)
      .join(","),
  );
  return [head.map(cell).join(","), ...lines].join("\n");
}

/* ------------------------------------------------------------------ Needs */

/** The requirement's needs plus the one only a test can meet. */
export function needsWithVerification(requirement: Requirement): RequirementNeed[] {
  const out = needsOf(requirement);
  const leaf = childrenOfRequirement(requirement.id).length === 0;
  const past = requirement.state === "Approved" || requirement.state === "Verified";
  if (leaf && past && objectivesForRequirement(requirement.id).length === 0)
    out.push({ key: "verify", label: "Verify", reason: "No test objective names it." });
  const suspect = suspectLinksFor(requirement);
  if (suspect.length)
    out.push({
      key: "review",
      label: "Review",
      reason:
        suspect.length === 1
          ? (suspect[0]?.state.causes[0]?.detail ?? "A link is suspect.")
          : `${suspect.length} links are suspect.`,
    });
  return out;
}
