/**
 * Verification is a link to a test with a result per event, not a state
 * field. A requirement is covered by the test objectives that name it; it is
 * "not covered" when none does, and that is a state the bar shows as a hole,
 * never inferred from an allocation being Verified. The traceability matrix
 * is a projection of these links: one row per requirement and objective, one
 * result column per test event.
 */

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { allTestRuns, resolvedObjectiveResult, useRunLogVersion } from "@/lib/test-execution";

import { suspectLinksFor } from "@/lib/link-currency";

import {
  eventById,
  campaignById,
  objectiveById,
  objectives,
  type ObjectiveResult,
  type TestEvent,
  type TestObjective,
} from "@/lib/campaigns";
import {
  allocationsFor,
  getRequirement,
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
let restored = false;
const storageKey = "equinox.requirement-verification.v1";
const removedLinks = new Set<string>();
const linkKey = (l: Pick<VerificationLink, "requirement" | "objective">) =>
  `${l.requirement}/${l.objective}`;

export function restoreVerificationLinks(): void {
  if (restored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(storageKey);
  if (raw) {
    const saved = z
      .object({
        links: z.array(
          z.object({
            requirement: z.string(),
            objective: z.string(),
            linkedBy: z.string(),
            linkedOn: z.string(),
          }),
        ),
        removed: z.array(z.string()),
      })
      .parse(JSON.parse(raw));
    for (const key of saved.removed) removedLinks.add(key);
    const merged = new Map([...links, ...saved.links].map((l) => [linkKey(l), l]));
    links.splice(
      0,
      links.length,
      ...[...merged.values()].filter((l) => !removedLinks.has(linkKey(l))),
    );
  }
  restored = true;
  bump();
}

function saveLinks(next: VerificationLink[]): void {
  const deleted = new Set(removedLinks);
  for (const link of links)
    if (!next.some((l) => linkKey(l) === linkKey(link))) deleted.add(linkKey(link));
  for (const link of next) deleted.delete(linkKey(link));
  if (typeof window !== "undefined")
    window.localStorage.setItem(storageKey, JSON.stringify({ links: next, removed: [...deleted] }));
  removedLinks.clear();
  for (const key of deleted) removedLinks.add(key);
  links.splice(0, links.length, ...next);
  bump();
}

/** Initial relationship persisted with an assessment; explicit unlink overrides survive restore. */
export function registerAssessmentVerification(link: VerificationLink): void {
  restoreVerificationLinks();
  if (removedLinks.has(linkKey(link)) || links.some((l) => linkKey(l) === linkKey(link))) return;
  links.push(link);
  bump();
}

export function objectiveProgram(objectiveId: string): string | undefined {
  const objective = objectiveById.get(objectiveId);
  const event = objective?.event ? eventById.get(objective.event) : undefined;
  return event ? campaignById.get(event.campaign)?.program : undefined;
}

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
  useEffect(() => restoreVerificationLinks(), []);
  const runs = useRunLogVersion();
  return (
    runs +
    useSyncExternalStore(
      subscribeVerification,
      () => version,
      () => version,
    )
  );
}

export function linkVerification(requirementId: string, objectiveId: string, by: string): void {
  restoreVerificationLinks();
  const requirement = getRequirement(requirementId);
  if (!requirement || objectiveProgram(objectiveId) !== requirement.program)
    throw new Error("Choose an assessment objective from this requirement's program.");
  if (links.some((l) => l.requirement === requirementId && l.objective === objectiveId)) return;
  if (!objectiveById.has(objectiveId)) return;
  saveLinks([
    ...links,
    {
      requirement: requirementId,
      objective: objectiveId,
      linkedBy: by,
      linkedOn: new Date().toISOString(),
    },
  ]);
}

export function unlinkVerification(requirementId: string, objectiveId: string): void {
  restoreVerificationLinks();
  const i = links.findIndex((l) => l.requirement === requirementId && l.objective === objectiveId);
  if (i < 0) return;
  saveLinks(links.filter((_, index) => index !== i));
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
  const requirement = getRequirement(requirementId);
  return requirement
    ? objectives.filter((o) => !mine.has(o.id) && objectiveProgram(o.id) === requirement.program)
    : [];
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
  for (const o of objs) c[bucket(resolvedObjectiveResult(o.id).result)] += 1;
  return c;
}

/** One phrase for a cell: the result when there is one, the count when there are several. */
export function coverageWord(c: RequirementCoverage): string {
  const total = coverageTotal(c);
  if (total === 1) {
    if (c.met) return "Met";
    if (c.partial) return "Partially met";
    if (c.notMet) return "Not met";
    if (c.notRun) return "Not run";
    return "No assessment linked";
  }
  return `${c.met} of ${total} met`;
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
        results: Object.fromEntries(
          events.map((e) => [e.id, e.id === o.event ? resolvedObjectiveResult(o.id).result : ""]),
        ),
        evidence: objectiveEvidence(o.id).join("; "),
      });
  }
  return { events, rows };
}

export function objectiveEvidence(objectiveId: string): string[] {
  const resolved = resolvedObjectiveResult(objectiveId);
  if (resolved.source === "Run" && resolved.run) {
    return [
      ...new Set(
        allTestRuns()
          .find((r) => r.id === resolved.run)
          ?.records.flatMap((r) => r.evidence) ?? [],
      ),
    ];
  }
  const evidence = objectiveById.get(objectiveId)?.evidence;
  return evidence ? [evidence] : [];
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
