import { useRows, type Row } from "./models";
import { daysBetween } from "./program-standing";

/**
 * A program's dated path to its authorization, as two lanes over one time axis: the authorization
 * events its packages record (each version submitted or published, each package review, each
 * authorization decision and the standing authorization's expiry) and its draft assessment results
 * waiting to be published in one lane, and its lifecycle gates in the other. Read only from what
 * the schema holds; a condition of a decision and an annual review are not records, so the path
 * does not draw them. A stop that waits on a role says so (`awaits`), and the view names who holds
 * it from the program's roles.
 */

export type ScheduleLane = "authorization" | "acquisition";
/** Where a stop stands, as the kit's dated path says it. */
export type ScheduleState = "done" | "current" | "upcoming" | "blocked";
/** A stop ahead that is at risk (`warning`) or late (`danger`). */
export type ScheduleTone = "warning" | "danger";

export type SchedulePackage = Pick<Row<"authorization_packages">, "id" | "title" | "system_id">;
export type ScheduleVersion = Pick<
  Row<"package_revisions">,
  "id" | "package_id" | "version_number" | "state" | "submitted_at" | "published_at"
>;
export type ScheduleDecision = Pick<
  Row<"authorization_decisions">,
  | "id"
  | "package_revision_id"
  | "decision"
  | "decided_at"
  | "expires_on"
  | "decision_maker_party_id"
>;
export type ScheduleReview = Pick<
  Row<"review_decisions">,
  "id" | "package_revision_id" | "decision" | "decided_at" | "reviewer_party_id"
>;
export type ScheduleGate = Pick<
  Row<"lifecycle_gates">,
  "id" | "title" | "status" | "due_on" | "decided_at" | "sequence_number"
>;

type Stop = {
  /** Unique on the path. */
  key: string;
  lane: ScheduleLane;
  /** The calendar day the stop stands on, `YYYY-MM-DD`; null for one with no date, drawn last. */
  day: string | null;
  /** The moment behind the day, where the stop records one, which orders a day's stops. */
  at: string | null;
  state: ScheduleState;
  tone?: ScheduleTone | undefined;
};
/** An authorization package's version: submitted, published, or still a draft with no date. */
export type VersionStop = Stop & {
  kind: "submitted" | "published" | "draft";
  packageId: string;
  systemId: string;
  version: number;
  /**
   * The package's latest submitted version, with no decision recorded on it: it waits on the
   * authorizing official, as the Review queue's Package to decide does.
   */
  awaits: boolean;
};
/** Draft assessment results that hold findings, which wait on the lead assessor to publish them. */
export type ResultsStop = Stop & {
  kind: "results";
  resultsId: string;
  campaignId: string | null;
  /** The campaign's title, which names the stop; the results' own where the reader holds none. */
  name: string;
  findings: number;
};
export type DecisionStop = Stop & {
  kind: "decision";
  /** The stored decision (`authorization_decisions.decision`). */
  decision: string;
  packageId: string;
  systemId: string;
  partyId: string;
};
export type ReviewStop = Stop & {
  kind: "review";
  /** The stored review decision (`review_decisions.decision`). */
  decision: string;
  packageId: string;
  systemId: string;
  partyId: string;
};
/** The day the standing authorization of a package ends: its newest decision's expiry. */
export type ExpiryStop = Stop & {
  kind: "expiry";
  decision: string;
  packageId: string;
  systemId: string;
  /** The day has passed: the authorization has lapsed. */
  passed: boolean;
};
export type GateStop = Stop & { kind: "gate"; gate: ScheduleGate };
export type ScheduleStop =
  VersionStop | DecisionStop | ReviewStop | ExpiryStop | GateStop | ResultsStop;

/** Draft results waiting to be published, as the path reads them, on their campaign's last day. */
export type ScheduleResults = {
  id: string;
  title: string;
  campaignId: string | null;
  campaignTitle: string | null;
  findings: number;
  /** The campaign's last day, `YYYY-MM-DD` or a moment; null where it records none. */
  endsAt: string | null;
};

export type AuthorizationSchedule = {
  /** Every stop of both lanes in date order, those with no date last. */
  stops: ScheduleStop[];
  /** Where today's rule stands: before `stops[today]`, or after every stop when it equals their count. */
  today: number;
  /** How many stops each lane holds. */
  lanes: Record<ScheduleLane, number>;
};

/** A gate decided one way or another; a failed gate is decided too, as the timeline reads it. */
const DONE_GATES = new Set(["completed", "passed", "waived"]);
const BLOCKED_GATES = new Set(["blocked", "failed"]);
const OPEN_GATES = new Set(["in_review", "in_progress", "at_risk"]);
/** An authorization decision that authorizes, whose expiry ends it. */
const AUTHORIZING = new Set(["authorized", "authorized_with_conditions"]);
/** A decision that refuses or withdraws authorization. */
const REFUSING = new Set(["denied", "revoked"]);
/** A review that sends the package back. */
const RETURNED = new Set(["changes_requested", "rejected"]);
/** How many days ahead an open gate's due day reads as soon, as a DateLabel says it. */
const GATE_SOON_DAYS = 2;
/** How many days ahead an expiry reads as soon, as the header's standing says it. */
export const EXPIRY_NOTICE_DAYS = 90;

/** On one day, the order a package's stops happen in, then the gates. */
const KIND_ORDER: Record<ScheduleStop["kind"], number> = {
  submitted: 0,
  published: 1,
  results: 2,
  review: 3,
  decision: 4,
  expiry: 5,
  gate: 6,
  draft: 7,
};

/** A gate's place on the path: decided, under way, failed or blocked, or ahead. */
export function gateState(status: string): ScheduleState {
  if (DONE_GATES.has(status)) return "done";
  if (BLOCKED_GATES.has(status)) return "blocked";
  if (OPEN_GATES.has(status)) return "current";
  return "upcoming";
}

/**
 * The two lanes over one time axis. `dayOf` turns a stored moment into the reader's calendar day;
 * `today` is the reader's day. A gate stands on the day it was decided, else its due day; an open
 * gate past its due day is late (`danger`), one due within two days or at risk is `warning`. The
 * rule for today stands after every stop behind it, a late stop among them, and before the first
 * stop ahead; a stop with no date comes after it.
 */
export function authorizationSchedule({
  packages,
  versions,
  decisions,
  reviews,
  gates,
  results = [],
  today,
  dayOf,
}: {
  packages: readonly SchedulePackage[];
  versions: readonly ScheduleVersion[];
  decisions: readonly ScheduleDecision[];
  reviews: readonly ScheduleReview[];
  gates: readonly ScheduleGate[];
  /** Draft assessment results that hold findings. */
  results?: readonly ScheduleResults[] | undefined;
  today: string;
  dayOf: (moment: string) => string;
}): AuthorizationSchedule {
  const packageOf = new Map(packages.map((row) => [row.id, row]));
  const versionOf = new Map(versions.map((row) => [row.id, row]));
  /** The package a version belongs to, when the reader holds both. */
  const holder = (versionId: string | null) => {
    const version = versionId ? versionOf.get(versionId) : undefined;
    const pkg = version ? packageOf.get(version.package_id) : undefined;
    return version && pkg ? { version, pkg } : undefined;
  };
  const stops: ScheduleStop[] = [];
  const decidedVersions = new Set(decisions.map((decision) => decision.package_revision_id));
  /** Each package's latest submitted version, which a decision is waited on for. */
  const latestSubmitted = new Map<string, ScheduleVersion>();
  for (const version of versions) {
    if (version.state !== "published" || !version.submitted_at) continue;
    const before = latestSubmitted.get(version.package_id);
    if (!before || version.version_number > before.version_number)
      latestSubmitted.set(version.package_id, version);
  }
  for (const version of versions) {
    const pkg = packageOf.get(version.package_id);
    if (!pkg) continue;
    const base = {
      lane: "authorization" as const,
      packageId: pkg.id,
      systemId: pkg.system_id,
      version: version.version_number,
      awaits: latestSubmitted.get(pkg.id)?.id === version.id && !decidedVersions.has(version.id),
    };
    const at = version.submitted_at ?? version.published_at;
    if (at)
      stops.push({
        ...base,
        key: `version-${version.id}`,
        kind: version.submitted_at ? "submitted" : "published",
        day: dayOf(at),
        at,
        state: "done",
      });
    else if (version.state !== "published")
      stops.push({
        ...base,
        key: `version-${version.id}`,
        kind: "draft",
        day: null,
        at: null,
        state: "upcoming",
      });
  }
  for (const review of reviews) {
    const held = holder(review.package_revision_id);
    if (!held) continue;
    stops.push({
      key: `review-${review.id}`,
      kind: "review",
      lane: "authorization",
      day: dayOf(review.decided_at),
      at: review.decided_at,
      state: RETURNED.has(review.decision) ? "blocked" : "done",
      decision: review.decision,
      packageId: held.pkg.id,
      systemId: held.pkg.system_id,
      partyId: review.reviewer_party_id,
    });
  }
  /** Each package's newest decision, whose expiry is the day its authorization ends. */
  const newest = new Map<string, ScheduleDecision>();
  for (const decision of decisions) {
    const held = holder(decision.package_revision_id);
    if (!held) continue;
    stops.push({
      key: `decision-${decision.id}`,
      kind: "decision",
      lane: "authorization",
      day: dayOf(decision.decided_at),
      at: decision.decided_at,
      state: REFUSING.has(decision.decision) ? "blocked" : "done",
      decision: decision.decision,
      packageId: held.pkg.id,
      systemId: held.pkg.system_id,
      partyId: decision.decision_maker_party_id,
    });
    const before = newest.get(held.pkg.id);
    if (
      !before ||
      Date.parse(decision.decided_at) - Date.parse(before.decided_at) > 0 ||
      (decision.decided_at === before.decided_at && decision.id > before.id)
    )
      newest.set(held.pkg.id, decision);
  }
  for (const [packageId, decision] of newest) {
    if (!AUTHORIZING.has(decision.decision) || !decision.expires_on) continue;
    const pkg = packageOf.get(packageId)!;
    const day = decision.expires_on.slice(0, 10);
    const days = daysBetween(today, day);
    stops.push({
      key: `expiry-${decision.id}`,
      kind: "expiry",
      lane: "authorization",
      day,
      at: null,
      state: days < 0 ? "blocked" : "upcoming",
      ...(days >= 0 && days <= EXPIRY_NOTICE_DAYS ? { tone: "warning" as const } : {}),
      decision: decision.decision,
      packageId,
      systemId: pkg.system_id,
      passed: days < 0,
    });
  }
  for (const draft of results) {
    const day = draft.endsAt ? dayOf(draft.endsAt) : null;
    const days = day ? daysBetween(today, day) : null;
    stops.push({
      key: `results-${draft.id}`,
      kind: "results",
      lane: "authorization",
      day,
      at: null,
      state: "upcoming",
      ...(days !== null && days < 0
        ? { tone: "danger" as const }
        : days !== null && days <= GATE_SOON_DAYS
          ? { tone: "warning" as const }
          : {}),
      resultsId: draft.id,
      campaignId: draft.campaignId,
      name: draft.campaignTitle ?? draft.title,
      findings: draft.findings,
    });
  }
  for (const gate of gates) {
    const state = gateState(gate.status);
    const decided = state === "done" || state === "blocked" || !!gate.decided_at;
    const at = decided && gate.decided_at ? gate.decided_at : null;
    const day = at ? dayOf(at) : gate.due_on ? gate.due_on.slice(0, 10) : null;
    const days = !decided && gate.due_on ? daysBetween(today, gate.due_on) : null;
    const tone: ScheduleTone | undefined =
      days !== null && days < 0
        ? "danger"
        : (days !== null && days <= GATE_SOON_DAYS) || gate.status === "at_risk"
          ? "warning"
          : undefined;
    stops.push({
      key: `gate-${gate.id}`,
      kind: "gate",
      lane: "acquisition",
      day,
      at,
      state,
      ...(tone ? { tone } : {}),
      gate,
    });
  }
  stops.sort((a, b) => {
    if (a.day === null || b.day === null)
      return a.day === null && b.day === null
        ? (a.lane === b.lane ? 0 : a.lane === "authorization" ? -1 : 1) ||
            gateOrder(a, b) ||
            a.key.localeCompare(b.key)
        : a.day === null
          ? 1
          : -1;
    return (
      a.day.localeCompare(b.day) ||
      (a.at && b.at ? Date.parse(a.at) - Date.parse(b.at) : 0) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      gateOrder(a, b) ||
      a.key.localeCompare(b.key)
    );
  });
  // Behind today: every stop on an earlier day, a late one among them, and a settled one today.
  const behind = (stop: ScheduleStop) =>
    stop.day !== null &&
    (stop.day < today || (stop.day === today && stop.state !== "upcoming" && stop.at !== null));
  let at = stops.findIndex((stop) => !behind(stop));
  if (at < 0) at = stops.length;
  return {
    stops,
    today: at,
    lanes: {
      authorization: stops.filter((stop) => stop.lane === "authorization").length,
      acquisition: stops.filter((stop) => stop.lane === "acquisition").length,
    },
  };
}

/** Two gates on one day, or with none, in their recorded workflow order, then by name. */
function gateOrder(a: ScheduleStop, b: ScheduleStop) {
  if (a.kind !== "gate" || b.kind !== "gate") return 0;
  const left = a.gate.sequence_number;
  const right = b.gate.sequence_number;
  if (left !== null && right !== null && left !== right) return left - right;
  if ((left === null) !== (right === null)) return left === null ? 1 : -1;
  return a.gate.title.localeCompare(b.gate.title);
}

const PACKAGE_COLUMNS = ["id", "title", "system_id"] as const;
const REVIEW_COLUMNS = [
  "id",
  "package_revision_id",
  "decision",
  "decided_at",
  "reviewer_party_id",
] as const;

/**
 * What the program's Authorization path reads beside the header's reads (its versions, decisions
 * and gates): its packages and the reviews recorded on their versions, each one request scoped on
 * the server to the program.
 */
export function useAuthorizationRecords(programId: string) {
  const packages = useRows(
    "authorization_packages",
    { program_id: programId },
    { columns: PACKAGE_COLUMNS },
  );
  const reviews = useRows(
    "review_decisions",
    { "package_revisions.authorization_packages.program_id": programId },
    { columns: REVIEW_COLUMNS },
  );
  return { packages, reviews };
}
