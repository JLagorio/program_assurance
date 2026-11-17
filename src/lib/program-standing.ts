import { useRows, type Row } from "./models";
import { authorizationStandings, impactLevels, statusLabel } from "./status";

/**
 * A program's standing, the one fact its header says beside its categorization: where its
 * authorization stands, in RMF's short words (`authorizationTypes` in status, read through
 * `authorizationStandings`), and its most urgent date ("ATO with conditions · PDR
 * 35d late"). Derived from what the program's Authorization and lifecycle reads already hold: the
 * decisions recorded on its packages' versions, the versions themselves and its lifecycle gates.
 */

export type AuthorizationStanding = keyof typeof authorizationStandings;

export type StandingDecision = Pick<
  Row<"authorization_decisions">,
  "id" | "package_revision_id" | "decision" | "decided_at" | "expires_on"
>;
export type StandingPackageVersion = Pick<
  Row<"package_revisions">,
  "id" | "state" | "submitted_at"
>;
export type StandingGate = Pick<Row<"lifecycle_gates">, "id" | "title" | "status" | "due_on">;
export type StandingBoundary = Pick<Row<"systems">, "authorization_status">;

/** The program's most urgent date: an open gate's due day, or the standing authorization's expiry. */
export type UrgentDate = {
  kind: "gate" | "expiry";
  /** The gate's title; for an expiry, the authorization's words from the vocabulary ("ATO"). */
  name: string;
  /** The calendar day, `YYYY-MM-DD`. */
  day: string;
  /** Days from the reader's today to the day: negative once it has passed. */
  days: number;
};

export type ProgramStanding = {
  standing: AuthorizationStanding;
  urgent: UrgentDate | null;
};

/** A gate decided one way or another is no longer due; a failed gate still is, as on the timeline. */
const DECIDED_GATES = new Set(["completed", "passed", "waived"]);

/** A boundary's recorded authorization that says a decision was made, in the standing's words. */
const recordedStandings: Record<string, AuthorizationStanding> = {
  authorized: "ato",
  denied: "dato",
  expired: "ato_expired",
};

const decisionStandings: Record<string, AuthorizationStanding> = {
  authorized: "ato",
  authorized_with_conditions: "ato_with_conditions",
  denied: "dato",
  revoked: "revoked",
};

/** Whole days from `from` to `to`, two `YYYY-MM-DD` calendar days. */
export function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [year, month, date] = day.slice(0, 10).split("-").map(Number);
    return Date.UTC(year!, month! - 1, date!);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * Where the program's authorization stands, and its most urgent date. The newest decision decides
 * the standing: an authorization (ATO, ATO with conditions) whose expiry has passed reads ATO
 * expired, a denial DATO and a revocation Revoked. With no decision recorded here, what the program
 * has instead: the authorization its boundaries record where every one records a decided one
 * (authorized, denied or expired, the worst of them), else a package version submitted to the
 * authorizing official, a package still in draft, or none. The
 * urgent date is the earliest of the open gates' due days and the standing authorization's expiry,
 * so an overdue gate leads ("PDR 35d late"); with neither, there is none.
 */
export function programStanding({
  decisions,
  versions,
  gates,
  boundaries = [],
  today,
}: {
  decisions: readonly StandingDecision[];
  versions: readonly StandingPackageVersion[];
  gates: readonly StandingGate[];
  /** The authorization each boundary records (`systems.authorization_status`). */
  boundaries?: readonly StandingBoundary[] | undefined;
  /** The reader's calendar day, `YYYY-MM-DD`. */
  today: string;
}): ProgramStanding {
  const latest = [...decisions].sort(
    (a, b) => Date.parse(b.decided_at) - Date.parse(a.decided_at) || b.id.localeCompare(a.id),
  )[0];
  let standing: AuthorizationStanding;
  let expiry: UrgentDate | null = null;
  if (latest) {
    standing = decisionStandings[latest.decision] ?? "no_package";
    const authorized = standing === "ato" || standing === "ato_with_conditions";
    if (authorized && latest.expires_on) {
      const days = daysBetween(today, latest.expires_on);
      if (days < 0) standing = "ato_expired";
      else
        expiry = {
          kind: "expiry",
          name: statusLabel(authorizationStandings, standing),
          day: latest.expires_on.slice(0, 10),
          days,
        };
    }
  } else if (
    boundaries.length > 0 &&
    boundaries.every((system) => system.authorization_status! in recordedStandings)
  )
    standing = boundaries
      .map((system) => recordedStandings[system.authorization_status!]!)
      .sort((a, b) => authorizationStandings[a].rank - authorizationStandings[b].rank)[0]!;
  else if (versions.some((version) => version.state === "published" && version.submitted_at))
    standing = "package_submitted";
  else if (versions.length > 0) standing = "package_draft";
  else standing = "no_package";
  const due = gates
    .filter((gate) => gate.due_on && !DECIDED_GATES.has(gate.status))
    .map((gate): UrgentDate => ({
      kind: "gate",
      name: gate.title,
      day: gate.due_on!.slice(0, 10),
      days: daysBetween(today, gate.due_on!),
    }));
  const urgent =
    [...due, ...(expiry ? [expiry] : [])].sort(
      (a, b) =>
        a.days - b.days ||
        (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "gate" ? -1 : 1),
    )[0] ?? null;
  return { standing, urgent };
}

type Impact = "low" | "moderate" | "high";
export type ImpactSystem = Pick<
  Row<"systems">,
  "confidentiality_impact" | "integrity_impact" | "availability_impact"
>;

/**
 * The program's security categorization: for each of confidentiality, integrity and availability,
 * the highest impact any of its authorization boundaries records. Null where no boundary records
 * one of the three, so a categorization is never half drawn.
 */
export function programCategorization(
  boundaries: readonly ImpactSystem[],
): [Impact, Impact, Impact] | null {
  const highest = (key: keyof ImpactSystem): Impact | null => {
    const recorded = boundaries
      .map((system) => system[key])
      .filter((value): value is Impact => !!value && value in impactLevels);
    if (!recorded.length) return null;
    return recorded.reduce((top, value) =>
      impactLevels[value].rank > impactLevels[top].rank ? value : top,
    );
  };
  const levels = [
    highest("confidentiality_impact"),
    highest("integrity_impact"),
    highest("availability_impact"),
  ];
  return levels.every((level): level is Impact => level !== null)
    ? (levels as [Impact, Impact, Impact])
    : null;
}

// What the standing reads, and what the Authorization view's path reads of the same rows, so the
// header and the path share one request each.
const VERSION_COLUMNS = [
  "id",
  "package_id",
  "version_number",
  "state",
  "submitted_at",
  "published_at",
] as const;
const DECISION_COLUMNS = [
  "id",
  "package_revision_id",
  "decision",
  "decided_at",
  "expires_on",
  "decision_maker_party_id",
] as const;

/**
 * The program's package versions and the decisions recorded on them, each one request scoped on the
 * server through the package the version belongs to: the reads behind the header's standing and
 * the Authorization view's path.
 */
export function useProgramAuthorization(programId: string) {
  const versions = useRows(
    "package_revisions",
    { "authorization_packages.program_id": programId },
    { columns: VERSION_COLUMNS },
  );
  const decisions = useRows(
    "authorization_decisions",
    { "package_revisions.authorization_packages.program_id": programId },
    { columns: DECISION_COLUMNS },
  );
  return { versions, decisions, queries: [versions, decisions] };
}
