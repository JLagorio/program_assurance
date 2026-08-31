/**
 * Chunk 15 of the CCI spine — continuous monitoring and authorization drift.
 *
 * Before an ATO the question is "was this ever assessed". After one it is "is
 * what we authorized still what is running". Every input needed to answer that
 * already exists in this codebase — the build pins, the change log, the SCTM's
 * currency overlay, the ingestion register, the inheritance resolution and the
 * POA&M dates — and this module is the one that asks the question and says how
 * far apart the authorized state and the operating state have drifted.
 *
 * Invariants held here:
 *
 *  - **Exactly one table is authored, and it is a strategy, not a status.**
 *    `slcmProfiles` records the eMASS system-level continuous monitoring
 *    strategy: for each control, how often it is checked, by what method, by
 *    whom, and when it was last checked. That is a document a real ISSM writes
 *    and signs. Everything else in this file — every due date, every schedule
 *    status, every freshness class, every cadence verdict, every slip, every
 *    drift factor and every alert — is COMPUTED from that table plus the
 *    records the rest of the app already holds. There is no hand-authored
 *    status field anywhere below, and adding one would make the whole module a
 *    lie: a monitoring system that is told its own answers monitors nothing.
 *
 *  - **A missed schedule is never laundered into "Not assessed".**
 *    `AssessmentStatus` is a SCHEDULE fact. A control whose 800-53A
 *    determination is "Other than satisfied" still carries a schedule status
 *    here, and a control nobody has ever looked at reads "Never assessed" on
 *    the schedule while its determination stays exactly what the matrix says.
 *    The two axes never collapse into each other.
 *
 *  - **The drift score uses the same auditable-factor shape as
 *    `risk-scoring.ts`**, deliberately, so a reader who has learned one can
 *    read the other. Every `DriftFactor` carries the raw input it read, the
 *    ids it read them from, and one rationale sentence a human can disagree
 *    with. The contributions sum to the score; there is no hidden term.
 *
 *  - **A factor that cannot be computed is a CAVEAT, not a silent zero.** A
 *    program with no ConMon strategy authored has no assessment factor and no
 *    evidence factor at all — those weights are simply not applied and the
 *    reader is told which. Scoring a missing input as 0 would quietly say
 *    "perfectly aligned", which is a much stronger claim than "not known".
 *
 *  - **An alert with no underlying record is not emitted.** An empty alert
 *    list on a healthy program is the correct output, not a failure to find
 *    something to say. Every alert's `statement` carries the numbers it rests
 *    on and every `action` names the next step a person can take.
 *
 * The weight arithmetic, so a reader can check it:
 *
 *     configuration    0.25   unrecorded pin movements + unacknowledged
 *                             Significant changes, weighted by whether they
 *                             are live against the authorized baseline or
 *                             still staged in a candidate
 *     determination    0.25   share of SCTM rows whose currency is Invalidated
 *     evidence         0.15   share of monitored requirement rows whose
 *                             evidence is Stale or Expired against its SLA
 *     assessment       0.15   share of the SLCM schedule that is Overdue
 *     cadence          0.10   share of (asset, scan format) pairs producing no
 *                             reconciled result inside their window
 *     inheritance      0.10   share of resolved inherited controls not Current
 *     ─────────────────────
 *     total            1.00   →  100 points at full value on every factor
 *
 *     contribution = round(value × weight × 100)
 *     score        = clamp(Σ contribution, 0, 100)
 *
 * No clock is read at module scope and none should be read during render. Every
 * selector takes `now` as a trailing injectable parameter; the ConMon route
 * passes the fixed as-of date `conmonAsOf` and labels it on screen, so SSR and
 * CSR agree on every date in the page.
 */

import type { Tone } from "@/components/app/ui";
import {
  authorizedBuild,
  candidateBuild,
  changesForProgram,
  evidenceCollectedOn,
  postureOf,
  unrecordedChanges,
  baselineVersion,
  type ChangeRecord,
} from "@/lib/baselines";
import { descendantsOf, graphVersion, nodeById, nodesForProgram } from "@/lib/composition";
import { controlMatrix } from "@/lib/control-matrix";
import { programs, poamItems as oscalPoamItems } from "@/lib/grc-data";
import { scansForProgram, type ScanFormat, type ScanRun } from "@/lib/ingestion";
import { resolveInheritance, type ResolvedInheritance } from "@/lib/inheritance";
import { controlTitle, nistControlById } from "@/lib/nist-catalog";
import { parseGateDate } from "@/lib/program-stage";
import { findingsForPoam, poamItems, type PoamItem } from "@/lib/register";
import { buildSctm, type Sctm, type SctmRow } from "@/lib/sctm";
import {
  vocabularies,
  type AssessmentStatus,
  type DriftBand,
  type InheritanceState,
  type SlcmFrequency,
  type SlcmMethod,
} from "@/lib/spine";

/* ── Vocabulary ──────────────────────────────────────────────────────────── */

/**
 * eMASS SLCM frequency, verbatim, in eMASS's own order. Declared once in the
 * spine and surfaced here because this is the module that consumes it.
 */
export const slcmFrequencies = vocabularies.slcmFrequency.values;

export type { AssessmentStatus, DriftBand, SlcmFrequency, SlcmMethod } from "@/lib/spine";

/**
 * How current the evidence behind a monitored requirement is, measured against
 * the SLA the control's own SLCM frequency implies. Owned here rather than in
 * the spine because four of the five values are only ever read through
 * `freshnessTone`; the fifth, "Expired", is already a blocking word there
 * because the authorization vocabulary put it there first, and this map agrees
 * with it.
 */
export type FreshnessClass = "Fresh" | "Aging" | "Stale" | "Expired" | "Never collected";

/* ── Tones ───────────────────────────────────────────────────────────────── */

/**
 * A schedule status IS a verdict, so it carries colour. "Due" stays neutral on
 * purpose: an assessment that is scheduled and not yet late is a plan, not a
 * caution, and colouring it amber would leave nothing left to say when it goes
 * overdue. "Overdue" agrees with `statusTone`, which already reads it as
 * danger.
 */
export const assessmentStatusTone: Record<AssessmentStatus, Tone> = {
  Current: "success",
  Due: "neutral",
  Overdue: "danger",
  "Never assessed": "warning",
};

/**
 * "Expired" agrees with `statusTone`, which already publishes it as danger.
 * "Never collected" is amber rather than red because it is a gap in the record
 * rather than a proven lapse — nobody has claimed a check that did not happen.
 */
export const freshnessTone: Record<FreshnessClass, Tone> = {
  Fresh: "success",
  Aging: "neutral",
  Stale: "warning",
  Expired: "danger",
  "Never collected": "warning",
};

/** Agrees with `statusTone` on all four values; stated here so a reader can check. */
export const driftBandTone: Record<DriftBand, Tone> = {
  Aligned: "success",
  "Minor drift": "neutral",
  "Material drift": "warning",
  Diverged: "danger",
};

/**
 * The four severity words are also categorization impact levels, control
 * baseline levels, Nessus risk factors and POA&M severities across the app, so
 * the spine deliberately leaves them out of its tone sets and this map owns
 * their colour. It matches `poamSeverityTone` in `grc-data.ts` exactly: a
 * Critical and a High alert both stop the same person on the same morning.
 */
export const alertSeverityTone: Record<ConMonAlert["severity"], Tone> = {
  Critical: "danger",
  High: "danger",
  Moderate: "warning",
  Low: "neutral",
};

/**
 * An SLCM method is a PROPERTY, not a status, so three of its four values are
 * neutral chips. "Undetermined" is the exception and it is not a styling
 * choice: an eMASS ConMon strategy that cannot say how a control is monitored
 * is an Appendix J blocker, and `statusTone` already reads the word as
 * caution. Route a method column through this map, never through `statusTone`,
 * if you want the other three to stay quiet.
 */
export const slcmMethodTone: Record<SlcmMethod, Tone> = {
  Automated: "neutral",
  "Semi-Automated": "neutral",
  Manual: "neutral",
  Undetermined: "warning",
};

/* ── The dataset's as-of date ────────────────────────────────────────────── */

/**
 * The fixed "today" the ConMon views run against. Routes pass this rather than
 * calling the clock, so the server-rendered page and the hydrated one agree on
 * every due date, age and slip in the document.
 */
export const conmonAsOf = new Date("2026-08-30T12:00:00Z");

/** How that date is labelled on screen. */
export const conmonAsOfLabel = "Aug 30, 2026";

/* ── Small date helpers ──────────────────────────────────────────────────── */

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** UTC midnight of the given instant, so every day count is a whole number. */
function midnight(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** "MMM DD, YYYY" — the only format `parseGateDate` accepts. */
function fmtDay(ms: number): string {
  const d = new Date(ms);
  const month = monthNames[d.getUTCMonth()] ?? "Jan";
  return `${month} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

/** Epoch ms for a "MMM DD, YYYY" display string, or null when it is "—". */
function dayOf(value: string): number | null {
  return parseGateDate(value)?.getTime() ?? null;
}

/**
 * Epoch ms for an ingestion timestamp, which carries a clock time the date
 * parser does not accept: "Aug 27, 2026 05:36" — the first 12 characters are
 * the date, and the clock time is not material to a cadence measured in days.
 */
function dayOfStamp(value: string): number | null {
  return dayOf(value.slice(0, 12));
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.round((toMs - fromMs) / 86_400_000);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Two decimals, so the published `value` and the arithmetic agree on paper. */
function round2(value: number): number {
  return Math.round(clamp01(value) * 100) / 100;
}

function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

/** The catalog title, or "—" when the enhancement is outside this catalog slice. */
function titleFor(control: string): string {
  const nc = nistControlById.get(control);
  return nc ? controlTitle(nc) : "—";
}

function familyFor(control: string): string {
  const nc = nistControlById.get(control);
  if (nc) return nc.family;
  const head = control.split("-")[0];
  return head && head.length > 0 ? head : "—";
}

/* ── SLCM frequency arithmetic ───────────────────────────────────────────── */

/**
 * The monitoring period in days.
 *
 * "Constantly" and "Daily" both resolve to one day: a continuously monitored
 * control is expected to produce a result every day the system runs, and one
 * day is the finest grain the dataset's date format resolves. Quarterly is 91
 * days (a quarter, not three calendar months), semi-annual 182 and annual 365,
 * which is how eMASS itself counts a monitoring window.
 */
const frequencyDayTable: Record<SlcmFrequency, number> = {
  Constantly: 1,
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
  Quarterly: 91,
  "Semi-Annually": 182,
  Annually: 365,
  "Every Two Years": 730,
  "Every Three Years": 1095,
};

export function frequencyDays(f: SlcmFrequency): number {
  return frequencyDayTable[f];
}

/**
 * The frequency as an adjective ("the annual check") and as an adverb
 * ("monitored every three years"). eMASS's own labels are neither, so a
 * sentence that splices them in raw reads "a annually check"; these two maps
 * are the difference between prose and a template.
 */
const frequencyAdjective: Record<SlcmFrequency, string> = {
  Constantly: "continuous",
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  "Semi-Annually": "semi-annual",
  Annually: "annual",
  "Every Two Years": "two-year",
  "Every Three Years": "three-year",
};

const frequencyAdverb: Record<SlcmFrequency, string> = {
  Constantly: "constantly",
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  "Semi-Annually": "semi-annually",
  Annually: "annually",
  "Every Two Years": "every two years",
  "Every Three Years": "every three years",
};

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

/** How the strategy files the method, as a clause that can follow a semicolon. */
function methodClause(method: SlcmMethod): string {
  return method === "Undetermined"
    ? "the strategy files the method as Undetermined, so the check cannot be executed as written"
    : `the strategy files the method as ${method}`;
}

/**
 * How far ahead of the due date a check starts reading "Due" rather than
 * "Current": one third of the cycle, never less than a day and never more than
 * thirty. A weekly check is not "due" for five of its seven days, and an
 * annual one is not "due" for four months — a single flat window would make
 * one of those two readings useless.
 */
function dueWindowDays(f: SlcmFrequency): number {
  return Math.max(1, Math.min(30, Math.round(frequencyDays(f) / 3)));
}

/* ── The authored ConMon strategy ────────────────────────────────────────── */

export type SlcmProfile = {
  control: string; // natural key
  program: string; // PRG-
  frequency: SlcmFrequency;
  method: SlcmMethod;
  responsible: string;
  /** "MMM DD, YYYY", or "—" when the control has never been assessed. */
  lastAssessed: string;
  note: string;
};

/**
 * The system-level continuous monitoring strategy for PRG-1041, as an ISSM
 * would file it in eMASS: every control the finding register names, every
 * control the program inherits, and the technical families a High-baseline
 * system is expected to watch between assessments.
 *
 * The three `"Undetermined"` methods are not placeholders. An eMASS ConMon
 * strategy that cannot state how a control is monitored fails the Appendix J
 * review, and the strategy is filed in that state because the responsible
 * entity has not answered — which is exactly the condition this module exists
 * to surface.
 */
export const slcmProfiles: SlcmProfile[] = [
  {
    control: "AC-1",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Enterprise security policy office (CMP-008)",
    lastAssessed: "Jul 26, 2026",
    note: "Access control policy and procedures are inherited whole from the enterprise security policy set. The annual review is the provider's; the program's obligation is to confirm the published version still names atlas-prod in scope.",
  },
  {
    control: "AC-2",
    program: "PRG-1041",
    frequency: "Quarterly",
    method: "Semi-Automated",
    responsible: "Identity platform",
    lastAssessed: "Jun 12, 2026",
    note: "Quarterly account review. The IdP exports the account inventory and the entitlement report automatically; a human still adjudicates the exceptions and signs the review, which is why this is not filed as fully automated.",
  },
  {
    control: "AC-2(3)",
    program: "PRG-1041",
    frequency: "Quarterly",
    method: "Automated",
    responsible: "Identity platform",
    lastAssessed: "May 28, 2026",
    note: "Disable-inactive-accounts automation is checked by replaying the 35-day idle rule against the directory and the federation broker. FND-2251 records that the federated contractor path is not covered by the job.",
  },
  {
    control: "AC-4",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Mission software",
    lastAssessed: "Jul 15, 2026",
    note: "Mesh policy is exported monthly and diffed against the approved flow matrix. The unauthenticated metrics path on CN-0215 is the open item and is tracked under POAM-0072.",
  },
  {
    control: "AC-6(9)",
    program: "PRG-1041",
    frequency: "Weekly",
    method: "Automated",
    responsible: "Security operations",
    lastAssessed: "Aug 25, 2026",
    note: "Weekly reconciliation of privileged-session broker records against the audit sink. The sampling gap the assessor raised is carried as an open POA&M weakness in the agency register.",
  },
  {
    control: "AC-7",
    program: "PRG-1041",
    frequency: "Quarterly",
    method: "Manual",
    responsible: "Identity platform",
    lastAssessed: "Jul 04, 2026",
    note: "Unsuccessful logon handling is inherited from the corporate identity provider. The quarterly obligation is to confirm the lockout thresholds published in the offer still match what the program requires.",
  },
  {
    control: "AC-11",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Manual",
    responsible: "Platform ops",
    lastAssessed: "Aug 03, 2026",
    note: "Session lock is verified by console inspection on a sample of RHEL 9 hosts. FND-2258 records gcs-app-02 out of compliance; the residual is accepted under POAM-0079 on the strength of facility access control.",
  },
  {
    control: "AU-1",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Enterprise security policy office (CMP-008)",
    lastAssessed: "Jul 26, 2026",
    note: "Audit policy is inherited from the enterprise set. The program reviews the published policy annually against the audit record types it actually generates.",
  },
  {
    control: "AU-4",
    program: "PRG-1041",
    frequency: "Daily",
    method: "Automated",
    responsible: "Data platform",
    lastAssessed: "Aug 27, 2026",
    note: "Audit storage capacity and the offload spool depth are checked every day. FND-2240 records the 24-hour offload statement being exceeded; POAM-0064 carries the aggregator capacity increase.",
  },
  {
    control: "AU-6",
    program: "PRG-1041",
    frequency: "Weekly",
    method: "Semi-Automated",
    responsible: "Security operations",
    lastAssessed: "Aug 22, 2026",
    note: "Weekly audit record review. Correlation rules run continuously; the review itself is a duty-officer activity with a signed worksheet, and the worksheet is the artifact the assessor asks for.",
  },
  {
    control: "AU-9",
    program: "PRG-1041",
    frequency: "Quarterly",
    method: "Manual",
    responsible: "Data platform",
    lastAssessed: "Jul 10, 2026",
    note: "Protection of audit information is inherited from the GovCloud landing zone. The quarterly obligation is to confirm the sink IAM policy still denies delete to every program principal.",
  },
  {
    control: "CA-7",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Semi-Automated",
    responsible: "Security operations",
    lastAssessed: "Aug 18, 2026",
    note: "The continuous monitoring strategy reviews itself monthly: frequencies, methods and responsible entities are re-confirmed against what the program is actually able to collect.",
  },
  {
    control: "CM-6",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Platform ops",
    lastAssessed: "Aug 24, 2026",
    note: "Configuration settings are enforced by the drift job and evidenced by the monthly baseline scan published by the landing zone.",
  },
  {
    control: "CM-8",
    program: "PRG-1041",
    frequency: "Weekly",
    method: "Automated",
    responsible: "Platform ops",
    lastAssessed: "Aug 27, 2026",
    note: "The component inventory is reconciled weekly against the composition graph and the delivered BOMs. Parts with no attestation on file are reported as exceptions rather than dropped.",
  },
  {
    control: "CP-4",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Data platform",
    lastAssessed: "Sep 19, 2025",
    note: "Contingency plan testing is a full annual failover exercise with the mission owner present. The FY26 exercise is scheduled inside the next window.",
  },
  {
    control: "CP-9",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Data platform",
    lastAssessed: "Aug 28, 2026",
    note: "Backup job results are inherited from the landing zone and re-checked monthly against the program's own restore-point objective.",
  },
  {
    control: "IA-2",
    program: "PRG-1041",
    frequency: "Semi-Annually",
    method: "Automated",
    responsible: "Identity platform",
    lastAssessed: "Jul 25, 2026",
    note: "Identification and authentication of organizational users is inherited from the corporate identity provider; the semi-annual check re-runs the SSO enforcement report against the program's own service list.",
  },
  {
    control: "IA-2(1)",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Identity platform",
    lastAssessed: "Jul 24, 2026",
    note: "Multifactor authentication to privileged accounts is checked monthly by scanning the sshd baseline across the boundary. FND-2214 records a surviving GSSAPI path on gcs-app-01; POAM-0071 carries the fleet rollout.",
  },
  {
    control: "IA-5(1)",
    program: "PRG-1041",
    frequency: "Semi-Annually",
    method: "Automated",
    responsible: "Identity platform",
    lastAssessed: "Aug 20, 2026",
    note: "Password-based authenticator management is inherited. The semi-annual check compares the provider's published attestation against the program's own directory policy export.",
  },
  {
    control: "IA-8",
    program: "PRG-1041",
    frequency: "Semi-Annually",
    method: "Undetermined",
    responsible: "Identity platform",
    lastAssessed: "Jul 10, 2026",
    note: "Identification of non-organizational users is inherited, but the federation broker moved to the 2026.2 assessment and nobody has yet stated how the program will monitor it. The method is filed Undetermined rather than guessed at.",
  },
  {
    control: "IR-1",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Enterprise security policy office (CMP-008)",
    lastAssessed: "Jul 26, 2026",
    note: "Incident response policy is inherited from the enterprise set. The annual review confirms the published escalation path still reaches this program's duty officer.",
  },
  {
    control: "IR-4",
    program: "PRG-1041",
    frequency: "Semi-Annually",
    method: "Manual",
    responsible: "Security operations",
    lastAssessed: "Feb 20, 2026",
    note: "Incident handling is exercised twice a year against a written scenario. The spring exercise is on file; the autumn one has not been run.",
  },
  {
    control: "MP-6",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Undetermined",
    responsible: "Platform ops",
    lastAssessed: "—",
    note: "Media sanitization applies to the decommissioning path for boundary hosts and to the courier media used for air-gap transfer. Neither the method nor a first assessment has been recorded since the control was added to the strategy.",
  },
  {
    control: "PE-2",
    program: "PRG-1041",
    frequency: "Semi-Annually",
    method: "Manual",
    responsible: "Facility security officer — Sierra Vista",
    lastAssessed: "Jul 25, 2026",
    note: "Physical access authorizations are inherited from the Sierra Vista facility. The semi-annual obligation is to reconcile the badge roster against the program's own personnel list.",
  },
  {
    control: "PE-3",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Facility security officer — Sierra Vista",
    lastAssessed: "Jul 24, 2026",
    note: "Physical access control is evidenced by the facility's SOC 2 Type II physical security section, reviewed annually when the report is reissued.",
  },
  {
    control: "PE-13",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Manual",
    responsible: "Facility security officer — Sierra Vista",
    lastAssessed: "Jul 10, 2026",
    note: "Fire protection is inherited from the facility and evidenced by the annual suppression inspection certificate.",
  },
  {
    control: "PS-3",
    program: "PRG-1041",
    frequency: "Every Three Years",
    method: "Manual",
    responsible: "Personnel security office",
    lastAssessed: "Nov 14, 2024",
    note: "Personnel screening is re-verified on the national reinvestigation cycle. Interim moves are handled by the access request workflow rather than by this check.",
  },
  {
    control: "RA-5",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Security operations",
    lastAssessed: "Aug 25, 2026",
    note: "Vulnerability scanning is credentialed ACAS across the boundary plus SCA against the delivered SBOMs. The monthly checkpoint is the reconciliation of scanner output into the finding register, not the scan itself.",
  },
  {
    control: "SC-7",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Semi-Automated",
    responsible: "Network engineering",
    lastAssessed: "Aug 21, 2026",
    note: "Boundary protection is shared with the landing zone. The program exports its own security group and mesh policy monthly and diffs it against the approved boundary diagram.",
  },
  {
    control: "SC-8(1)",
    program: "PRG-1041",
    frequency: "Quarterly",
    method: "Automated",
    responsible: "Network engineering",
    lastAssessed: "Jul 12, 2026",
    note: "Cryptographic protection in transit is probed quarterly on every listener in the boundary. FND-2231 records telnet still answering on the edge switch management plane.",
  },
  {
    control: "SI-2",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Automated",
    responsible: "Platform ops",
    lastAssessed: "Jul 25, 2026",
    note: "Flaw remediation is measured monthly as the age of the oldest unpatched CAT I and CAT II item. FND-2246 records the mission-api base layer still carrying openssl 3.0.11.",
  },
  {
    control: "SI-2(3)",
    program: "PRG-1041",
    frequency: "Monthly",
    method: "Undetermined",
    responsible: "Platform ops",
    lastAssessed: "Jun 30, 2026",
    note: "Time to remediate flaws is named by FND-2281 but the enhancement is outside the catalog slice this system carries, so no assessment procedure has been bound to it and no method has been stated. Filed Undetermined until the benchmark is mapped.",
  },
  {
    control: "SI-3",
    program: "PRG-1041",
    frequency: "Daily",
    method: "Automated",
    responsible: "Platform ops",
    lastAssessed: "Aug 29, 2026",
    note: "Malicious code protection reports signature currency and scan coverage every day. A host that misses two consecutive reports is treated as unmonitored, not as clean.",
  },
  {
    control: "SI-4",
    program: "PRG-1041",
    frequency: "Constantly",
    method: "Automated",
    responsible: "Security operations",
    lastAssessed: "Aug 30, 2026",
    note: "System monitoring is continuous by construction — the sensor fleet reports to the SOC without a scheduled checkpoint — so the strategy files it Constantly and measures the freshness of the sensor heartbeat instead.",
  },
  {
    control: "SR-4",
    program: "PRG-1041",
    frequency: "Every Two Years",
    method: "Manual",
    responsible: "Supply chain risk management office",
    lastAssessed: "Jul 12, 2026",
    note: "Provenance is re-established on the supplier review cycle. FND-2269 records two Go libraries in the mission-api image with no supplier SBOM on file.",
  },
  {
    control: "SR-11",
    program: "PRG-1041",
    frequency: "Annually",
    method: "Semi-Automated",
    responsible: "Mission software",
    lastAssessed: "Jul 16, 2026",
    note: "Component authenticity is checked annually by verifying delivered image digests and firmware signatures against the supplier manifests. The Marvell switch ASIC on the edge board still has no attestation on file.",
  },
];

const profilesByProgram = new Map<string, SlcmProfile[]>();
for (const p of slcmProfiles) {
  const list = profilesByProgram.get(p.program) ?? [];
  list.push(p);
  profilesByProgram.set(p.program, list);
}

/** The authored strategy rows for one program, in control order. */
export function slcmProfilesFor(programId: string): SlcmProfile[] {
  return [...(profilesByProgram.get(programId) ?? [])];
}

/* ── The matrix this module reads ────────────────────────────────────────── */

type SctmCacheEntry = { rows: unknown; graph: number; baseline: number; sctm: Sctm };

const sctmCache = new Map<string, SctmCacheEntry>();

/**
 * The SCTM for a program, built once per (control matrix, graph, baseline)
 * generation. `controlMatrix` already returns a reference-stable array, so
 * comparing it by identity is enough to notice an inline control edit; the two
 * version counters catch a node re-classification and a change acknowledgement.
 *
 * Built with a null text index on purpose. ConMon reads currency, evidence and
 * determination, none of which the 800-53A objective prose changes, and the
 * cheap skeleton keeps this module out of the 1.25 MB catalog entirely.
 */
function sctmFor(programId: string): Sctm {
  const rows = controlMatrix(programId);
  const graph = graphVersion();
  const baseline = baselineVersion();
  const hit = sctmCache.get(programId);
  if (hit && hit.rows === rows && hit.graph === graph && hit.baseline === baseline) return hit.sctm;
  const sctm = buildSctm(programId, rows, null);
  sctmCache.set(programId, { rows, graph, baseline, sctm });
  return sctm;
}

/* ── Assessment schedule ─────────────────────────────────────────────────── */

export type ScheduleRow = {
  control: string;
  controlTitle: string;
  family: string;
  frequency: SlcmFrequency;
  method: SlcmMethod;
  responsible: string;
  lastAssessed: string;
  /** Computed from `lastAssessed + frequencyDays(frequency)`. "—" when never assessed. */
  nextDue: string;
  daysOut: number | null;
  status: AssessmentStatus;
  /** The sentence a ConMon lead reads. */
  finding: string;
};

function scheduleFinding(
  profile: SlcmProfile,
  nextDue: string,
  daysOut: number | null,
  status: AssessmentStatus,
): string {
  const period = frequencyDays(profile.frequency);
  const adj = frequencyAdjective[profile.frequency];
  const how = methodClause(profile.method);
  if (status === "Never assessed") {
    return `${profile.responsible} owns ${article(adj)} ${adj} check on ${profile.control} and no assessment has ever been recorded against it, so there is no baseline to measure drift from — the first run establishes the window rather than closing it. Here ${how}.`;
  }
  if (daysOut === null) {
    return `${profile.control} carries ${article(adj)} ${adj} obligation but its last assessed date "${profile.lastAssessed}" is not a readable date, so no window can be computed. Correct the strategy record before the next review.`;
  }
  if (status === "Overdue") {
    const late = Math.abs(daysOut);
    const cycles = Math.floor(late / period);
    const cycleNote =
      cycles >= 1
        ? ` That is ${cycles} full ${plural(cycles, "cycle", "cycles")} of the ${period}-day period, so the last result no longer covers the period it is being read for.`
        : "";
    return `Last assessed ${profile.lastAssessed}; the ${nextDue} window closed ${late} ${plural(late, "day", "days")} ago and no result has been recorded since.${cycleNote} ${profile.responsible} owes the ${adj} check; ${how}.`;
  }
  if (status === "Due") {
    const inDays = daysOut === 0 ? "today" : `in ${daysOut} ${plural(daysOut, "day", "days")}`;
    return `Last assessed ${profile.lastAssessed}; the next ${adj} check falls due ${inDays} on ${nextDue}. ${profile.responsible} has the action; ${how}.`;
  }
  return `Last assessed ${profile.lastAssessed} and inside its ${period}-day window; the next ${adj} check is not due until ${nextDue}, ${daysOut} ${plural(daysOut, "day", "days")} out.`;
}

/**
 * The SLCM schedule for a program.
 *
 * Nothing here is authored except the four strategy fields. `nextDue` is
 * `lastAssessed + frequencyDays(frequency)`, `daysOut` is the distance from
 * `now` to that date, and `status` is read off `daysOut` against the control's
 * own due window. A control whose recorded date cannot be parsed keeps its
 * deficiency visible as an unreadable schedule rather than being quietly
 * rewritten to "Never assessed".
 */
export function assessmentSchedule(programId: string, now: Date = new Date()): ScheduleRow[] {
  const today = midnight(now);
  const rows: ScheduleRow[] = [];
  for (const profile of slcmProfilesFor(programId)) {
    const last = dayOf(profile.lastAssessed);
    const period = frequencyDays(profile.frequency);
    const dueMs = last === null ? null : last + period * 86_400_000;
    const nextDue = dueMs === null ? "—" : fmtDay(dueMs);
    const daysOut = dueMs === null ? null : daysBetween(today, dueMs);

    let status: AssessmentStatus;
    if (profile.lastAssessed === "—") status = "Never assessed";
    else if (daysOut === null) status = "Overdue";
    else if (daysOut < 0) status = "Overdue";
    else if (daysOut <= dueWindowDays(profile.frequency)) status = "Due";
    else status = "Current";

    rows.push({
      control: profile.control,
      controlTitle: titleFor(profile.control),
      family: familyFor(profile.control),
      frequency: profile.frequency,
      method: profile.method,
      responsible: profile.responsible,
      lastAssessed: profile.lastAssessed,
      nextDue,
      daysOut,
      status,
      finding: scheduleFinding(profile, nextDue, daysOut, status),
    });
  }
  const statusRank: Record<AssessmentStatus, number> = {
    Overdue: 0,
    "Never assessed": 1,
    Due: 2,
    Current: 3,
  };
  return rows.sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      (a.daysOut ?? 0) - (b.daysOut ?? 0) ||
      a.control.localeCompare(b.control),
  );
}

/* ── Evidence freshness ──────────────────────────────────────────────────── */

export type EvidenceSlaRow = {
  requirement: string; // SctmRow.key
  control: string;
  evidence: string[]; // EVD- ids and provider evidence labels
  collected: string;
  ageDays: number | null;
  /** The SLA that applies, derived from the control's SLCM frequency. */
  slaDays: number;
  freshness: FreshnessClass;
  finding: string;
};

/**
 * The freshness bands, stated once:
 *
 *     age ≤ sla/2      Fresh    — comfortably inside the monitoring window
 *     age ≤ sla        Aging    — still inside it, but the next collection is
 *                                 the one that keeps it there
 *     age ≤ 2 × sla    Stale    — the window has closed on this artifact
 *     age >  2 × sla   Expired  — a full second window has closed too
 *
 * The SLA is the control's own SLCM period, because that is the interval the
 * program committed to. A daily control with five-day-old evidence is expired
 * on exactly the same rule that leaves an annual control with a seven-month-old
 * policy attestation merely aging.
 */
function freshnessFor(ageDays: number | null, slaDays: number): FreshnessClass {
  if (ageDays === null) return "Never collected";
  if (ageDays <= slaDays / 2) return "Fresh";
  if (ageDays <= slaDays) return "Aging";
  if (ageDays <= slaDays * 2) return "Stale";
  return "Expired";
}

function freshnessFinding(
  row: SctmRow,
  evidence: string[],
  collected: string,
  ageDays: number | null,
  slaDays: number,
  freshness: FreshnessClass,
  frequency: SlcmFrequency,
): string {
  const adverb = frequencyAdverb[frequency];
  const adj = frequencyAdjective[frequency];
  if (freshness === "Never collected") {
    return `${row.control} is monitored ${adverb}, so its evidence SLA is ${slaDays} ${plural(slaDays, "day", "days")}, and no dated artifact is attached to this requirement at all. There is nothing on file to age, which is a wider gap than stale evidence, not a narrower one.`;
  }
  const items =
    evidence.length === 1
      ? (evidence[0] ?? "—")
      : `${evidence.length} artifacts, newest ${evidence[0] ?? "—"}`;
  const age = ageDays ?? 0;
  if (freshness === "Expired") {
    const over = age - slaDays;
    return `Newest evidence (${items}) was collected ${collected}, ${age} ${plural(age, "day", "days")} ago, against a ${slaDays}-day SLA from the ${adj} SLCM frequency — ${over} ${plural(over, "day", "days")} past the window and more than a full second window besides. This artifact no longer evidences anything.`;
  }
  if (freshness === "Stale") {
    const over = age - slaDays;
    return `Newest evidence (${items}) was collected ${collected}, ${age} ${plural(age, "day", "days")} ago, ${over} ${plural(over, "day", "days")} past the ${slaDays}-day SLA the ${adj} frequency sets. Re-collect before the row is cited in the package.`;
  }
  if (freshness === "Aging") {
    const left = slaDays - age;
    return `Newest evidence (${items}) was collected ${collected} and is ${age} ${plural(age, "day", "days")} old against a ${slaDays}-day SLA — inside the window with ${left} ${plural(left, "day", "days")} left, and the next ${adj} collection is what keeps it there.`;
  }
  return `Newest evidence (${items}) was collected ${collected}, ${age} ${plural(age, "day", "days")} ago, comfortably inside the ${slaDays}-day SLA the ${adj} frequency sets.`;
}

/**
 * Evidence age for every SCTM row of a control the ConMon strategy covers.
 *
 * The scope is deliberate: an evidence SLA only exists where a monitoring
 * frequency was committed to, so a row whose control carries no `SlcmProfile`
 * has no SLA to be measured against and is not invented one.
 *
 * Two dated sources are read, and the NEWEST wins, because the question is
 * "can this requirement be shown to rest on something recent": the collection
 * date `@/lib/baselines` indexes for each `EVD-` artifact, and — for an
 * inherited row citing the provider's own evidence label — the date the
 * provider assessed the offer.
 */
export function evidenceFreshness(programId: string, now: Date = new Date()): EvidenceSlaRow[] {
  const today = midnight(now);
  const byControl = new Map(slcmProfilesFor(programId).map((p) => [p.control, p]));
  if (byControl.size === 0) return [];
  const inheritance = resolveInheritance(programId);
  const out: EvidenceSlaRow[] = [];

  for (const row of sctmFor(programId).rows) {
    const profile = byControl.get(row.control);
    if (!profile) continue;
    const slaDays = frequencyDays(profile.frequency);
    const edge = inheritance.get(row.control) ?? null;

    const dated: { id: string; on: string; ms: number }[] = [];
    for (const id of row.evidence) {
      const collectedOn = evidenceCollectedOn(id);
      if (collectedOn) {
        const ms = dayOf(collectedOn);
        if (ms !== null) dated.push({ id, on: collectedOn, ms });
        continue;
      }
      if (edge && id === edge.provided.evidence) {
        const ms = dayOf(edge.provided.assessedOn);
        if (ms !== null) dated.push({ id, on: edge.provided.assessedOn, ms });
      }
    }
    dated.sort((a, b) => b.ms - a.ms);

    const newest = dated[0] ?? null;
    const ageDays = newest ? daysBetween(newest.ms, today) : null;
    const collected = newest ? newest.on : "—";
    const freshness = freshnessFor(ageDays, slaDays);
    const evidence = dated.length > 0 ? dated.map((d) => d.id) : [...row.evidence];

    out.push({
      requirement: row.key,
      control: row.control,
      evidence,
      collected,
      ageDays,
      slaDays,
      freshness,
      finding: freshnessFinding(
        row,
        evidence,
        collected,
        ageDays,
        slaDays,
        freshness,
        profile.frequency,
      ),
    });
  }

  const rank: Record<FreshnessClass, number> = {
    Expired: 0,
    Stale: 1,
    "Never collected": 2,
    Aging: 3,
    Fresh: 4,
  };
  return out.sort(
    (a, b) =>
      rank[a.freshness] - rank[b.freshness] ||
      (b.ageDays ?? -1) - (a.ageDays ?? -1) ||
      a.requirement.localeCompare(b.requirement),
  );
}

/* ── Scan cadence ────────────────────────────────────────────────────────── */

export type CadenceRow = {
  target: string; // CN-
  targetName: string;
  /** A `ScanFormat`, or "—" when no scan of any format has ever been ingested. */
  format: string;
  /**
   * The monitoring window for the format, in days — and exactly 0 on the "—"
   * row, where no format has ever been ingested and so no window exists to
   * measure against. Render that case as "—", not as a zero-day cadence.
   */
  expectedDays: number;
  lastScan: string;
  actualDays: number | null;
  compliant: boolean;
  /** Consecutive missed windows. */
  missed: number;
  finding: string;
};

/**
 * The monitoring window each scan format is expected to produce a result
 * inside, as a DoD ConMon strategy would set them: the automated network and
 * component scans weekly, the automated benchmark run monthly, the manual
 * checklist quarterly, the campaign-driven analyses on their own longer
 * cycles. These are intervals, not judgements — the judgement is what the row
 * says about a window that closed with nothing in it.
 */
const cadenceWindow: Record<ScanFormat, number> = {
  "ACAS Nessus": 7,
  "SCAP XCCDF": 7,
  "SCA CycloneDX-VEX": 7,
  "STIG CKLB": 30,
  "SAST SonarQube": 30,
  "STIG CKL": 90,
  Fuzzing: 90,
  "Firmware analysis": 182,
};

function cadenceFinding(
  anchorName: string,
  format: string,
  expectedDays: number,
  reconciled: ScanRun | null,
  latest: ScanRun | null,
  actualDays: number | null,
  effectiveAge: number | null,
  missed: number,
  coveredNode: string | null,
): string {
  if (!latest) {
    return `${anchorName} has no scan run of any format in the ingestion register, and neither do the parts beneath it. Nothing this asset reports is being monitored, so no cadence can be computed against it.`;
  }
  const scanned = coveredNode && coveredNode !== "" ? ` (covering ${coveredNode})` : "";
  if (!reconciled) {
    const age = effectiveAge ?? 0;
    return `${latest.id}${scanned} completed ${latest.completed} and is still in ${latest.state} state, so ${age} ${plural(age, "day", "days")} into the ${expectedDays}-day ${format} window it has produced no reconciled result in the finding register. A scan nobody processed is not a monitoring signal.`;
  }
  if (missed > 0 || actualDays === null || actualDays > expectedDays) {
    const age = actualDays ?? effectiveAge ?? 0;
    return `Last reconciled ${format} result is ${reconciled.id}${scanned}, completed ${reconciled.completed} — ${age} ${plural(age, "day", "days")} ago against a ${expectedDays}-day window, so ${missed} ${plural(missed, "window has", "windows have")} closed with no result.`;
  }
  const age = actualDays;
  return `Last reconciled ${format} result is ${reconciled.id}${scanned}, completed ${reconciled.completed}, ${age} ${plural(age, "day", "days")} ago and inside the ${expectedDays}-day window.`;
}

/**
 * Scan cadence, one row per (boundary asset, scan format) pair.
 *
 * The unit is the tracked asset rather than the raw scan target because that
 * is the question an ISSM asks — "is everything in my boundary being watched"
 * — and because the tools disagree about what they name: Evaluate-STIG reports
 * against the RHEL build, the checklist against the chassis and SonarQube
 * against the service. A run counts for an asset when it targets the asset's
 * anchor node or anything in the subtree beneath it.
 *
 * `lastScan` is the newest RECONCILED run, not the newest completed one. A run
 * sitting in Received or Normalized state has not reached the finding register,
 * so it has produced no monitoring result, and counting it would let an
 * unprocessed upload paper over a closed window. Where that is what happened,
 * `actualDays` is null, the row is not compliant and the finding says which run
 * is stuck and in what state.
 */
export function scanCadence(programId: string, now: Date = new Date()): CadenceRow[] {
  const today = midnight(now);
  const anchors = nodesForProgram(programId).filter((n) => n.asset !== null);
  if (anchors.length === 0) return [];
  const runs = scansForProgram(programId);
  const out: CadenceRow[] = [];

  for (const anchor of anchors) {
    const subtree = new Set<string>([anchor.id, ...descendantsOf(anchor.id).map((n) => n.id)]);
    const mine = runs.filter((r) => r.targets.some((t) => subtree.has(t)));

    if (mine.length === 0) {
      out.push({
        target: anchor.id,
        targetName: anchor.name,
        format: "—",
        expectedDays: 0,
        lastScan: "—",
        actualDays: null,
        compliant: false,
        missed: 0,
        finding: cadenceFinding(anchor.name, "—", 0, null, null, null, null, 0, null),
      });
      continue;
    }

    const formats = [...new Set(mine.map((r) => r.format))].sort();
    for (const format of formats) {
      const ofFormat = mine
        .filter((r) => r.format === format)
        .sort((a, b) => (dayOfStamp(b.completed) ?? 0) - (dayOfStamp(a.completed) ?? 0));
      const latest = ofFormat[0] ?? null;
      const reconciled = ofFormat.find((r) => r.state === "Reconciled") ?? null;
      const expectedDays = cadenceWindow[format];

      const reconciledMs = reconciled ? dayOfStamp(reconciled.completed) : null;
      const latestMs = latest ? dayOfStamp(latest.completed) : null;
      const actualDays = reconciledMs === null ? null : daysBetween(reconciledMs, today);
      const effectiveAge = actualDays ?? (latestMs === null ? null : daysBetween(latestMs, today));
      const missed =
        effectiveAge === null || expectedDays <= 0
          ? 0
          : Math.max(0, Math.floor(effectiveAge / expectedDays));
      const compliant = actualDays !== null && actualDays <= expectedDays;
      const covered = latest
        ? latest.targets
            .filter((t) => subtree.has(t))
            .map((t) => nodeById.get(t)?.name ?? t)
            .join(", ")
        : "";
      const coveredNode = covered.length > 0 ? covered : null;

      out.push({
        target: anchor.id,
        targetName: anchor.name,
        format,
        expectedDays,
        lastScan: reconciled ? reconciled.completed : "—",
        actualDays,
        compliant,
        missed,
        finding: cadenceFinding(
          anchor.name,
          format,
          expectedDays,
          reconciled,
          latest,
          actualDays,
          effectiveAge,
          missed,
          coveredNode,
        ),
      });
    }
  }

  return out.sort(
    (a, b) =>
      Number(a.compliant) - Number(b.compliant) ||
      b.missed - a.missed ||
      a.targetName.localeCompare(b.targetName) ||
      a.format.localeCompare(b.format),
  );
}

/* ── POA&M slippage ──────────────────────────────────────────────────────── */

export type SlippageRow = {
  poam: string; // POAM-
  title: string;
  original: string;
  scheduled: string;
  /** Positive = slipped by N days. */
  slipDays: number;
  /** Times the date has moved, from the milestone record where one exists. */
  revisions: number;
  status: string;
  finding: string;
};

/**
 * Milestone target dates the agency-facing OSCAL POA&M holds for a control.
 *
 * The register's own item carries the original commitment and the date in
 * force, which proves at most one movement. Where the OSCAL record joins — same
 * program, overlapping control — each milestone whose target has already been
 * missed is a further recorded movement of the commitment, and that is the only
 * second-hand source of a revision count in this dataset. Where nothing joins,
 * the count falls back to what the register itself can prove; inventing a
 * revision would be inventing an audit trail.
 */
function recordedRevisions(
  item: PoamItem,
  controls: Set<string>,
): { missed: number; refs: string[] } {
  const refs: string[] = [];
  let missed = 0;
  for (const oscal of oscalPoamItems) {
    if (oscal.programId !== item.program) continue;
    if (!oscal.controls.some((c) => controls.has(c))) continue;
    const hit = oscal.milestones.filter((m) => m.status === "Missed");
    if (hit.length === 0) continue;
    missed += hit.length;
    refs.push(oscal.poamId);
  }
  return { missed, refs };
}

function slippageFinding(
  item: PoamItem,
  slipDays: number,
  revisions: number,
  overdueBy: number | null,
  refs: string[],
): string {
  const original = item.originalCompletion;
  const scheduled = item.scheduledCompletion;
  const trail =
    refs.length > 0
      ? ` The agency record ${refs.join(", ")} carries missed milestone targets against the same controls.`
      : "";
  if (scheduled === "—") {
    return `The completion date was withdrawn when the AO accepted the residual; the original commitment was ${original === "—" ? "not recorded" : original}. ${item.milestoneNote} Nothing is being tracked to a date, which is the correct state for an accepted risk and the wrong state for anything else.${trail}`;
  }
  if (overdueBy !== null && overdueBy > 0) {
    return `Committed ${scheduled} and ${overdueBy} ${plural(overdueBy, "day", "days")} past it with the section still ${item.status.toLowerCase()}${slipDays > 0 ? `, after already slipping ${slipDays} ${plural(slipDays, "day", "days")} from the original ${original}` : ` against an unmoved original date of ${original}`}. ${item.milestoneNote}${trail}`;
  }
  if (slipDays > 0) {
    return `Scheduled completion moved from ${original} to ${scheduled}, a slip of ${slipDays} ${plural(slipDays, "day", "days")} across ${revisions} recorded ${plural(revisions, "revision", "revisions")}. ${item.milestoneNote}${trail}`;
  }
  if (slipDays < 0) {
    const pulled = Math.abs(slipDays);
    return `Scheduled completion was pulled in ${pulled} ${plural(pulled, "day", "days")} from the original ${original} to ${scheduled}. ${item.milestoneNote}${trail}`;
  }
  return `Holding the original commitment of ${original} with no recorded revision. ${item.milestoneNote}${trail}`;
}

/**
 * Every POA&M section for a program, with the distance between the date it
 * originally committed to and the date in force.
 *
 * `slipDays` is `scheduledCompletion - originalCompletion` in days: positive is
 * a slip, negative is a section pulled in, zero is a commitment held. Nothing
 * is authored — the register carries both dates and this is their difference.
 */
export function poamSlippage(programId: string, now: Date = new Date()): SlippageRow[] {
  const today = midnight(now);
  const rows: SlippageRow[] = [];

  for (const item of poamItems) {
    if (item.program !== programId) continue;
    const original = dayOf(item.originalCompletion);
    const scheduled = dayOf(item.scheduledCompletion);
    const slipDays = original !== null && scheduled !== null ? daysBetween(original, scheduled) : 0;

    const controls = new Set(findingsForPoam(item.id).map((f) => f.control));
    const { missed, refs } = recordedRevisions(item, controls);
    const moved = original !== null && scheduled !== null && slipDays !== 0 ? 1 : 0;
    const revisions = moved + missed;

    const overdueBy =
      scheduled !== null && item.status !== "Completed" && item.status !== "Risk accepted"
        ? daysBetween(scheduled, today)
        : null;

    rows.push({
      poam: item.id,
      title: item.title,
      original: item.originalCompletion,
      scheduled: item.scheduledCompletion,
      slipDays,
      revisions,
      status: item.status,
      finding: slippageFinding(item, slipDays, revisions, overdueBy, refs),
    });
  }

  // Overdue first, then by how far the commitment moved. A section that is past
  // a date it never revised is more urgent than one that revised its date and
  // is still inside it, so slip alone is the wrong first key.
  return rows.sort(
    (a, b) =>
      Number(b.status === "Overdue") - Number(a.status === "Overdue") ||
      b.slipDays - a.slipDays ||
      a.poam.localeCompare(b.poam),
  );
}

/* ── Drift score ─────────────────────────────────────────────────────────── */

/** Same auditable-factor shape as `risk-scoring.ts`, deliberately. */
export type DriftFactor = {
  key: "configuration" | "determination" | "evidence" | "assessment" | "cadence" | "inheritance";
  label: string;
  input: string;
  value: number; // 0-1
  weight: number;
  contribution: number;
  rationale: string;
  evidence: string[];
};

export type DriftScore = {
  program: string;
  /** 0-100, 0 = perfectly aligned with the authorized state. */
  score: number;
  band: DriftBand;
  factors: DriftFactor[];
  /** The single most useful sentence about this program's drift. */
  headline: string;
  caveats: string[];
};

export const driftFactorWeights: Record<DriftFactor["key"], number> = {
  configuration: 0.25,
  determination: 0.25,
  evidence: 0.15,
  assessment: 0.15,
  cadence: 0.1,
  inheritance: 0.1,
};

const driftFactorLabels: Record<DriftFactor["key"], string> = {
  configuration: "Configuration",
  determination: "Determination currency",
  evidence: "Evidence freshness",
  assessment: "Assessment schedule",
  cadence: "Scan cadence",
  inheritance: "Inheritance",
};

/** Presentation order: by weight, then by how directly the factor names a change. */
export const driftFactorOrder: DriftFactor["key"][] = [
  "configuration",
  "determination",
  "evidence",
  "assessment",
  "cadence",
  "inheritance",
];

export function driftBandFor(score: number): DriftBand {
  if (score >= 55) return "Diverged";
  if (score >= 30) return "Material drift";
  if (score >= 10) return "Minor drift";
  return "Aligned";
}

function makeFactor(
  key: DriftFactor["key"],
  raw: number,
  input: string,
  rationale: string,
  evidence: string[],
): DriftFactor {
  const value = round2(raw);
  const weight = driftFactorWeights[key];
  return {
    key,
    label: driftFactorLabels[key],
    input,
    value,
    weight,
    contribution: Math.round(value * weight * 100),
    rationale,
    evidence,
  };
}

/**
 * The configuration factor scales against six unreviewed movements. Six is the
 * point at which a change board has visibly stopped keeping up with a system
 * of this size; it is a stated scale, not a measurement, and it is the only
 * number in this module that is neither counted nor derived.
 */
const configurationScale = 6;

function configurationFactor(programId: string): {
  factor: DriftFactor | null;
  caveat: string | null;
} {
  const authorized = authorizedBuild(programId);
  const candidate = candidateBuild(programId);
  const changes = changesForProgram(programId);
  if (!authorized || changes.length === 0) {
    return {
      factor: null,
      caveat: `No ${authorized ? "change record" : "authorized baseline"} exists for ${programId}, so configuration drift from the authorized state cannot be measured and the ${driftFactorWeights.configuration} weight is not applied. The score below is the sum of the factors that could be computed, not a statement that the configuration is unchanged.`,
    };
  }

  const unrecorded = unrecordedChanges(programId);
  const unacknowledgedSignificant = changes.filter(
    (c: ChangeRecord) => c.impact === "Significant" && !c.acknowledged,
  );
  const live = unacknowledgedSignificant.filter((c) => postureOf(c).posture === "Live");
  const staged = unacknowledgedSignificant.filter((c) => postureOf(c).posture === "Candidate");

  // An "Incorporated" change is already inside the authorized baseline, so it
  // is not drift FROM that baseline even when nobody acknowledged it — its
  // effect on the assessment is counted once, by the determination factor.
  const raw =
    (unrecorded.length * 1 + live.length * 0.75 + staged.length * 0.4) / configurationScale;

  const evidence = [
    authorized.id,
    ...(candidate ? [candidate.id] : []),
    ...unrecorded.map((d) => d.node),
    ...live.map((c) => c.id),
    ...staged.map((c) => c.id),
  ];

  const unrecordedNote =
    unrecorded.length > 0
      ? `${unrecorded.length} pin ${plural(unrecorded.length, "movement", "movements")} between ${authorized.id} and ${candidate?.id ?? "the candidate"} ${plural(unrecorded.length, "carries", "carry")} no change record at all (${unrecorded.map((d) => `${d.label}: ${d.from} → ${d.to}`).join("; ")}), which is a CM-3 failure rather than a diff — nobody proposed ${plural(unrecorded.length, "it", "them")}, nobody analysed ${plural(unrecorded.length, "it", "them")} and there is nobody to ask what ${plural(unrecorded.length, "it was", "they were")} meant to do. `
      : "No pin has moved without a change record. ";

  return {
    factor: makeFactor(
      "configuration",
      raw,
      `${unrecorded.length} unrecorded, ${live.length} live unacknowledged Significant, ${staged.length} staged`,
      `${unrecordedNote}${live.length} unacknowledged Significant ${plural(live.length, "change is", "changes are")} live against ${authorized.id} and ${staged.length} more ${plural(staged.length, "is", "are")} staged in the candidate build, which counts at 0.4 because a staged change has not yet reached the running system. Scaled against ${configurationScale} unreviewed movements.`,
      evidence,
    ),
    caveat: null,
  };
}

function determinationFactor(
  programId: string,
  sctm: Sctm,
): { factor: DriftFactor | null; caveat: string | null } {
  const total = sctm.rows.length;
  if (total === 0) {
    return {
      factor: null,
      caveat: `The control matrix for ${programId} produced no SCTM rows, so determination currency cannot be measured and the ${driftFactorWeights.determination} weight is not applied.`,
    };
  }
  const invalidated = sctm.counts.invalidated;
  const suspect = sctm.counts.suspect;
  const drivers = new Set<string>();
  for (const row of sctm.rows) {
    if (row.currency !== "Invalidated") continue;
    for (const m of row.currencyReason.matchAll(/CHG-\d+/g)) drivers.add(m[0]);
  }
  return {
    factor: makeFactor(
      "determination",
      share(invalidated, total),
      `${invalidated} of ${total} SCTM rows Invalidated`,
      `${invalidated} ${plural(invalidated, "row's determination", "rows' determinations")} no longer ${plural(invalidated, "describes", "describe")} the configuration in force (${pct(invalidated, total)} of the matrix)${drivers.size > 0 ? `, driven by ${[...drivers].sort().join(", ")}` : ""}. A further ${suspect} ${plural(suspect, "row is", "rows are")} Suspect and are NOT counted here: an ancestor holding something that moved is a reason to look again, not a retracted claim.`,
      [...drivers].sort(),
    ),
    caveat: null,
  };
}

function evidenceFactor(
  programId: string,
  rows: EvidenceSlaRow[],
): { factor: DriftFactor | null; caveat: string | null } {
  if (rows.length === 0) {
    return {
      factor: null,
      caveat: `No control in ${programId} carries an SLCM frequency, so no evidence SLA exists to measure against and the ${driftFactorWeights.evidence} weight is not applied.`,
    };
  }
  const stale = rows.filter((r) => r.freshness === "Stale");
  const expired = rows.filter((r) => r.freshness === "Expired");
  const never = rows.filter((r) => r.freshness === "Never collected");
  const worst = [...expired, ...stale].sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0))[0];
  return {
    factor: makeFactor(
      "evidence",
      share(stale.length + expired.length, rows.length),
      `${expired.length} expired + ${stale.length} stale of ${rows.length} monitored rows`,
      `${expired.length + stale.length} of ${rows.length} monitored requirement rows rest on evidence older than the SLA their SLCM frequency sets${worst ? `, worst ${worst.control} at ${worst.ageDays ?? 0} days against a ${worst.slaDays}-day SLA` : ""}. ${never.length} further ${plural(never.length, "row has", "rows have")} no dated artifact at all; that is a wider gap and it is reported as unevidenced rather than folded into this ratio, which would understate it as merely old.`,
      [...expired, ...stale].slice(0, 8).map((r) => r.requirement),
    ),
    caveat: null,
  };
}

function assessmentFactor(
  programId: string,
  rows: ScheduleRow[],
): { factor: DriftFactor | null; caveat: string | null } {
  if (rows.length === 0) {
    return {
      factor: null,
      caveat: `No continuous monitoring strategy is on file for ${programId}, so there is no assessment schedule to fall behind and the ${driftFactorWeights.assessment} weight is not applied. An empty strategy is a finding in its own right, not an aligned program.`,
    };
  }
  const overdue = rows.filter((r) => r.status === "Overdue");
  const never = rows.filter((r) => r.status === "Never assessed");
  const worst = overdue.reduce<ScheduleRow | null>(
    (acc, r) => (acc === null || (r.daysOut ?? 0) < (acc.daysOut ?? 0) ? r : acc),
    null,
  );
  return {
    factor: makeFactor(
      "assessment",
      share(overdue.length, rows.length),
      `${overdue.length} of ${rows.length} SLCM checks Overdue`,
      `${overdue.length} of the ${rows.length} controls in the strategy have passed their next-due date with no result recorded (${pct(overdue.length, rows.length)})${worst ? `, worst ${worst.control} at ${Math.abs(worst.daysOut ?? 0)} days past its ${worst.frequency.toLowerCase()} window` : ""}. ${never.length} ${plural(never.length, "control has", "controls have")} never been assessed at all and ${plural(never.length, "is", "are")} reported separately, because a first assessment establishes a window rather than missing one.`,
      overdue.slice(0, 8).map((r) => r.control),
    ),
    caveat: null,
  };
}

function cadenceFactor(
  programId: string,
  rows: CadenceRow[],
): { factor: DriftFactor | null; caveat: string | null } {
  if (rows.length === 0) {
    return {
      factor: null,
      caveat: `No tracked asset in ${programId} anchors a composition node, so scan cadence cannot be measured and the ${driftFactorWeights.cadence} weight is not applied.`,
    };
  }
  const failing = rows.filter((r) => !r.compliant);
  const missedWindows = rows.reduce((sum, r) => sum + (r.compliant ? 0 : r.missed), 0);
  const uncovered = rows.filter((r) => r.format === "—");
  return {
    factor: makeFactor(
      "cadence",
      share(failing.length, rows.length),
      `${failing.length} of ${rows.length} (asset, format) pairs outside cadence`,
      `${failing.length} of ${rows.length} monitored (asset, scan format) pairs have produced no reconciled result inside their window, accounting for ${missedWindows} fully missed ${plural(missedWindows, "window", "windows")}${uncovered.length > 0 ? ` and including ${uncovered.length} ${plural(uncovered.length, "asset", "assets")} with no scan of any format on file` : ""}. A run that completed but never reached the finding register counts as no result, because that is what it is.`,
      [...new Set(failing.map((r) => r.target))].slice(0, 8),
    ),
    caveat: null,
  };
}

function inheritanceFactor(programId: string): {
  factor: DriftFactor | null;
  caveat: string | null;
} {
  const resolved = [...resolveInheritance(programId).values()];
  if (resolved.length === 0) {
    return {
      factor: null,
      caveat: `${programId} inherits no controls from a common control provider, so inheritance drift cannot be measured and the ${driftFactorWeights.inheritance} weight is not applied.`,
    };
  }
  const notCurrent = resolved.filter((r) => r.state !== "Current");
  const byState = new Map<InheritanceState, number>();
  for (const r of notCurrent) byState.set(r.state, (byState.get(r.state) ?? 0) + 1);
  const breakdown = [...byState]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([state, n]) => `${n} ${state}`)
    .join(", ");
  return {
    factor: makeFactor(
      "inheritance",
      share(notCurrent.length, resolved.length),
      `${notCurrent.length} of ${resolved.length} inherited controls not Current`,
      `${notCurrent.length} of ${resolved.length} resolved inheritance edges no longer read Current (${breakdown}). The consuming program is carrying determinations that rest on a provider assessment it has not reviewed, a provider that is itself failing, or an offer that has been withdrawn.`,
      [...new Set(notCurrent.map((r) => r.component.id))].sort(),
    ),
    caveat: null,
  };
}

function driftHeadline(
  programId: string,
  score: number,
  band: DriftBand,
  factors: DriftFactor[],
  caveats: string[],
): string {
  const name = programs.find((p) => p.id === programId)?.name ?? (programId || "This program");
  if (factors.length === 0) {
    return `No drift factor could be computed for ${name}: there is no change record, no control matrix, no monitoring strategy and no inheritance to read, so the score is not a claim that the system is aligned — it is the absence of one.`;
  }
  const ranked = [...factors].sort((a, b) => b.contribution - a.contribution);
  const top = ranked[0];
  const second = ranked[1];
  const applied = factors.reduce((sum, f) => sum + f.weight, 0);
  const unmeasured = Math.round((1 - applied) * 100);
  // A band is a positive claim, and a positive claim cannot rest on evidence
  // that was never gathered. Where weight is missing the headline leads with
  // the share of the model that was measured rather than with the word
  // "aligned", which would read as a clean bill of health for a program the
  // module could barely see.
  const lead =
    unmeasured > 0
      ? `${name} scores ${score}/100 on the ${Math.round(applied * 100)}% of the drift model that could be measured; ${unmeasured} points of weight are unmeasured, so the "${band}" band is what is known, not a finding that the system is aligned.`
      : `${name} scores ${score}/100 against its authorized state — ${band.toLowerCase()}.`;
  const drivers = top
    ? ` ${top.label} carries ${top.contribution} of those points (${top.input})${second && second.contribution > 0 ? ` and ${second.label.toLowerCase()} ${second.contribution} (${second.input})` : ""}.`
    : "";
  return `${lead}${drivers}`;
}

/**
 * How far the running system has drifted from the state that was authorized,
 * on the same auditable-factor model as the residual risk score.
 *
 * Zero is perfect alignment. Every factor is computed from a record elsewhere
 * in the app; every contribution is `round(value × weight × 100)`; the score is
 * the clamped sum of exactly the factors listed, and a factor whose inputs do
 * not exist is omitted with a caveat rather than scored zero.
 */
export function driftScore(programId: string, now: Date = new Date()): DriftScore {
  const sctm = sctmFor(programId);
  const schedule = assessmentSchedule(programId, now);
  const freshness = evidenceFreshness(programId, now);
  const cadence = scanCadence(programId, now);

  const built = [
    configurationFactor(programId),
    determinationFactor(programId, sctm),
    evidenceFactor(programId, freshness),
    assessmentFactor(programId, schedule),
    cadenceFactor(programId, cadence),
    inheritanceFactor(programId),
  ];

  const caveats = built.map((b) => b.caveat).filter((c): c is string => c !== null);
  const present = built.map((b) => b.factor).filter((f): f is DriftFactor => f !== null);
  const factors = driftFactorOrder
    .map((key) => present.find((f) => f.key === key))
    .filter((f): f is DriftFactor => f !== undefined);

  const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
  const score = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;
  const appliedWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const unmeasured = Math.round((1 - appliedWeight) * 100);
  if (unmeasured > 0) {
    caveats.push(
      `Only ${Math.round(appliedWeight * 100)} of the model's 100 points of weight were applied; ${unmeasured} ${plural(unmeasured, "point is", "points are")} unmeasured. The score could be as high as ${Math.min(100, score + unmeasured)} once the missing factors are computed, so read the band as a floor rather than a verdict.`,
    );
  }
  if (score !== raw) {
    caveats.push(
      `The factor contributions sum to ${raw}, which falls outside the 0-100 range; the published score is clamped to ${score}. Read the factor table for the arithmetic.`,
    );
  }
  const band = driftBandFor(score);

  return {
    program: programId,
    score,
    band,
    factors,
    headline: driftHeadline(programId, score, band, factors, caveats),
    caveats,
  };
}

/* ── Alerts ──────────────────────────────────────────────────────────────── */

/**
 * The eight things a ConMon queue is allowed to be about. "Assessment overdue"
 * is the broadest of them and covers the schedule's own execution defects as
 * well as its lateness — a control never assessed, and a control whose SLCM
 * method nobody has stated, are both reasons the strategy is not being carried
 * out. Each alert's `statement` says which of those it is; the kind is the
 * bucket, never the claim.
 */
export type AlertKind =
  | "Unrecorded change"
  | "Determination invalidated"
  | "Evidence expired"
  | "Assessment overdue"
  | "Scan cadence missed"
  | "POA&M slipped"
  | "Inheritance drifted"
  | "Authorization expiring";

export type ConMonAlert = {
  id: string; // CM-
  kind: AlertKind;
  severity: "Critical" | "High" | "Moderate" | "Low";
  /** The object the alert is about. */
  subject: string;
  since: string;
  /** What diverged, in one sentence, with the numbers in it. */
  statement: string;
  /** What to do about it. */
  action: string;
  evidence: string[];
};

const severityRank: Record<ConMonAlert["severity"], number> = {
  Critical: 0,
  High: 1,
  Moderate: 2,
  Low: 3,
};

/**
 * A stable id from the alert's identity rather than its position in the list,
 * so an alert keeps the same `CM-` number while the queue around it changes.
 * FNV-1a over "kind|subject", collisions resolved by walking forward.
 */
function alertIdFor(seed: string, taken: Set<string>): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let n = ((h >>> 0) % 9000) + 1000;
  let id = `CM-${n}`;
  while (taken.has(id)) {
    n = n >= 9999 ? 1000 : n + 1;
    id = `CM-${n}`;
  }
  taken.add(id);
  return id;
}

type DraftAlert = Omit<ConMonAlert, "id">;

/**
 * The continuous monitoring queue for a program.
 *
 * Every alert rests on a record: a pin that moved with no change proposal, a
 * change that retracted determinations, evidence past its SLA, a schedule that
 * has passed its date, a scan window that closed empty, a commitment that
 * moved, an inheritance edge that stopped being current, an authorization
 * running out. Where there is no such record, no alert is emitted — an empty
 * queue on a healthy program is the right answer, and a manufactured one would
 * teach the reader to ignore the list.
 *
 * Aggregated where the individual rows are read together (a ConMon lead works
 * the overdue schedule as one queue) and itemised where they are worked apart
 * (each unrecorded change is somebody's separate conversation with the board).
 */
export function conmonAlerts(programId: string, now: Date = new Date()): ConMonAlert[] {
  const today = midnight(now);
  const drafts: DraftAlert[] = [];

  /* Unrecorded change — one per pin that moved with no CM-3 proposal. */
  const authorized = authorizedBuild(programId);
  const candidate = candidateBuild(programId);
  for (const delta of unrecordedChanges(programId)) {
    const node = nodeById.get(delta.node);
    const critical =
      node?.criticality === "Mission critical" || node?.criticality === "Mission essential";
    drafts.push({
      kind: "Unrecorded change",
      severity: critical ? "Critical" : "High",
      subject: delta.node,
      // A movement nobody proposed has no proposal date. Printing one would be
      // inventing the very record whose absence this alert is about.
      since: "—",
      statement: `${delta.label} moved ${delta.from} → ${delta.to} between ${authorized?.id ?? "the authorized baseline"} and ${candidate?.id ?? "the candidate build"} with no change record against it. The ${delta.kind.toLowerCase()} was never proposed, never analysed under CM-3(2) and never approved${node ? `, and it sits on a ${node.criticality.toLowerCase()} node in the ${node.zone} zone` : ""}.`,
      action: `Raise a CHG- record against ${delta.node} for the ${delta.from} → ${delta.to} movement, run the CM-3(2) security impact analysis, and put it in front of the board before ${candidate?.id ?? "the candidate"} is proposed for authorization.`,
      evidence: [
        delta.node,
        ...(authorized ? [authorized.id] : []),
        ...(candidate ? [candidate.id] : []),
      ],
    });
  }

  /* Determination invalidated — grouped by the change that retracted them. */
  const sctm = sctmFor(programId);
  const invalidatedBy = new Map<string, string[]>();
  for (const row of sctm.rows) {
    if (row.currency !== "Invalidated") continue;
    for (const m of row.currencyReason.matchAll(/CHG-\d+/g)) {
      const list = invalidatedBy.get(m[0]) ?? [];
      list.push(row.key);
      invalidatedBy.set(m[0], list);
    }
  }
  const changeById = new Map(changesForProgram(programId).map((c) => [c.id, c]));
  for (const [changeId, keys] of [...invalidatedBy].sort()) {
    const change = changeById.get(changeId);
    const count = keys.length;
    drafts.push({
      kind: "Determination invalidated",
      severity: count >= 25 ? "Critical" : count >= 5 ? "High" : "Moderate",
      subject: changeId,
      since: change?.requested ?? "—",
      statement: `${changeId} (${change?.kind.toLowerCase() ?? "change"}${change ? `, ${change.from} → ${change.to}` : ""}) retracted the determination on ${count} of ${sctm.rows.length} SCTM ${plural(count, "row", "rows")} — the evidence behind them was taken against a configuration that no longer exists${change && !change.acknowledged ? ", and nobody has acknowledged the change" : ""}.`,
      action: `Re-test the ${count} invalidated ${plural(count, "requirement", "requirements")} against the current configuration, then acknowledge ${changeId} so the matrix stops reading the old result. The retest queue already carries the procedures.`,
      evidence: [changeId, ...keys.slice(0, 6)],
    });
  }

  /* Evidence expired — one queue, because it is worked as one. */
  const freshness = evidenceFreshness(programId, now);
  const expired = freshness.filter((r) => r.freshness === "Expired");
  const stale = freshness.filter((r) => r.freshness === "Stale");
  if (expired.length > 0 || stale.length > 0) {
    const worst = [...expired, ...stale][0];
    drafts.push({
      kind: "Evidence expired",
      severity: expired.length > 0 ? "High" : "Moderate",
      subject: worst?.control ?? programId,
      since: worst?.collected ?? "—",
      statement: `${expired.length} monitored ${plural(expired.length, "requirement rests", "requirements rest")} on expired evidence and ${stale.length} more on stale evidence, out of ${freshness.length} rows the ConMon strategy covers${worst ? `. The worst is ${worst.control}: newest artifact collected ${worst.collected}, ${worst.ageDays ?? 0} days ago against a ${worst.slaDays}-day SLA` : ""}.`,
      action: `Re-collect the ${expired.length + stale.length} ${plural(expired.length + stale.length, "artifact", "artifacts")} named on the Evidence freshness tab, starting with ${worst?.control ?? "the oldest"}, before any of these rows is cited in the authorization package.`,
      evidence: [...expired, ...stale].slice(0, 8).map((r) => r.requirement),
    });
  }

  /* Assessment overdue — one queue, plus its own escalation. */
  const schedule = assessmentSchedule(programId, now);
  const overdue = schedule.filter((r) => r.status === "Overdue");
  if (overdue.length > 0) {
    const worst = overdue[0];
    const late = Math.abs(worst?.daysOut ?? 0);
    const fullCycles = overdue.filter(
      (r) => Math.abs(r.daysOut ?? 0) >= frequencyDays(r.frequency),
    );
    drafts.push({
      kind: "Assessment overdue",
      severity: fullCycles.length > 0 ? "High" : "Moderate",
      subject: worst?.control ?? programId,
      since: worst?.nextDue ?? "—",
      statement: `${overdue.length} of ${schedule.length} controls in the SLCM strategy have passed their next-due date with no result recorded${worst ? `, worst ${worst.control} — ${late} days past its ${worst.nextDue} window` : ""}${fullCycles.length > 0 ? `, and ${fullCycles.length} of them ${plural(fullCycles.length, "is", "are")} a full monitoring cycle late` : ""}.`,
      action: `Run the ${overdue.length} overdue ${plural(overdue.length, "check", "checks")} on the Assessment schedule tab and record the result against each control; escalate ${worst?.responsible ?? "the responsible entity"} on ${worst?.control ?? "the worst row"} first.`,
      evidence: overdue.slice(0, 8).map((r) => r.control),
    });
  }

  /* Never assessed is a different obligation and gets its own row. */
  const neverAssessed = schedule.filter((r) => r.status === "Never assessed");
  if (neverAssessed.length > 0) {
    const first = neverAssessed[0];
    drafts.push({
      kind: "Assessment overdue",
      severity: "Moderate",
      subject: first?.control ?? programId,
      since: "—",
      statement: `${neverAssessed.length} ${plural(neverAssessed.length, "control", "controls")} in the SLCM strategy (${neverAssessed.map((r) => r.control).join(", ")}) ${plural(neverAssessed.length, "has", "have")} never been assessed, so there is no baseline result to measure drift against — the strategy names an owner and a frequency for a check nobody has run.`,
      action: `Run the first assessment on ${neverAssessed.map((r) => r.control).join(", ")} to establish the window, or withdraw ${plural(neverAssessed.length, "it", "them")} from the strategy with a written justification.`,
      evidence: neverAssessed.map((r) => r.control),
    });
  }

  /* Undetermined SLCM method — a check that cannot be run as written. */
  const undetermined = slcmProfilesFor(programId).filter((p) => p.method === "Undetermined");
  if (undetermined.length > 0) {
    const statusOf = new Map(schedule.map((r) => [r.control, r.status]));
    const behind = undetermined.filter((p) => {
      const s = statusOf.get(p.control);
      return s === "Overdue" || s === "Never assessed";
    });
    const withStatus = undetermined
      .map((p) => `${p.control} (${statusOf.get(p.control) ?? "not on the schedule"})`)
      .join(", ");
    drafts.push({
      kind: "Assessment overdue",
      severity: behind.length > 0 ? "High" : "Moderate",
      subject: behind[0]?.control ?? undetermined[0]?.control ?? programId,
      since: "—",
      statement: `${undetermined.length} ${plural(undetermined.length, "control", "controls")} in the ConMon strategy carry an Undetermined SLCM method — ${withStatus} — so the strategy names a frequency and a responsible entity for a check nobody has written down a method for${behind.length > 0 ? `, and ${behind.length} of them ${plural(behind.length, "is", "are")} already behind schedule, which means the check that is late cannot be executed as written` : ""}.`,
      action: `Have ${[...new Set(undetermined.map((p) => p.responsible))].join(" and ")} state the monitoring method for ${undetermined.map((p) => p.control).join(", ")} — Automated, Semi-Automated or Manual — before the Appendix J review of the ConMon strategy; an Undetermined method is a documented reason the schedule cannot be met.`,
      evidence: undetermined.map((p) => p.control),
    });
  }

  /* Scan cadence — itemised, because each is a different tool owner. */
  for (const row of scanCadence(programId, now)) {
    if (row.compliant) continue;
    const uncovered = row.format === "—";
    drafts.push({
      kind: "Scan cadence missed",
      severity: uncovered ? "High" : row.missed > 0 ? "High" : "Moderate",
      subject: row.target,
      since: row.lastScan === "—" ? "—" : row.lastScan.slice(0, 12),
      statement: row.finding,
      action: uncovered
        ? `Bring ${row.targetName} into the scan schedule — assign it a benchmark and a credentialed scan target — so the asset stops reporting a posture nothing in the register can corroborate.`
        : `Normalize and reconcile the outstanding ${row.format} run for ${row.targetName} into the finding register, or re-run it if the upload is unusable; a completed scan that never reached the register has monitored nothing.`,
      evidence: [row.target],
    });
  }

  /* POA&M slippage — itemised, one owner per section. */
  for (const row of poamSlippage(programId, now)) {
    const scheduled = dayOf(row.scheduled);
    const overdueBy =
      scheduled !== null && row.status !== "Completed" && row.status !== "Risk accepted"
        ? daysBetween(scheduled, today)
        : 0;
    if (row.slipDays <= 0 && overdueBy <= 0) continue;
    drafts.push({
      kind: "POA&M slipped",
      severity: overdueBy > 0 ? "High" : "Moderate",
      subject: row.poam,
      since: overdueBy > 0 ? row.scheduled : row.original,
      statement:
        overdueBy > 0
          ? `${row.poam} "${row.title}" is ${overdueBy} ${plural(overdueBy, "day", "days")} past its committed completion of ${row.scheduled}${row.slipDays > 0 ? `, which had already slipped ${row.slipDays} ${plural(row.slipDays, "day", "days")} from the original ${row.original}` : ""}, and the section still reads ${row.status}.`
          : `${row.poam} "${row.title}" moved its completion date from ${row.original} to ${row.scheduled}, a slip of ${row.slipDays} ${plural(row.slipDays, "day", "days")} across ${row.revisions} recorded ${plural(row.revisions, "revision", "revisions")}.`,
      action:
        overdueBy > 0
          ? `Close ${row.poam} or file a dated extension with the AO stating the new completion and what changed; an overdue section with no revision on file is the finding the assessor writes up.`
          : `Record the reason for the ${row.slipDays}-day movement on ${row.poam} and confirm the new date with the AO, so the revision is on the record rather than in the milestone note.`,
      evidence: [row.poam],
    });
  }

  /* Inheritance — grouped by provider and state, which is how it is fixed. */
  const groups = new Map<string, ResolvedInheritance[]>();
  for (const r of resolveInheritance(programId).values()) {
    if (r.state === "Current") continue;
    const key = `${r.component.id}|${r.state}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  for (const [key, rows] of [...groups].sort()) {
    const first = rows[0];
    if (!first) continue;
    const state = first.state;
    const controls = rows.map((r) => r.control).sort();
    const newest = rows
      .map((r) => ({ on: r.provided.assessedOn, ms: dayOf(r.provided.assessedOn) ?? 0 }))
      .sort((a, b) => b.ms - a.ms)[0];
    drafts.push({
      kind: "Inheritance drifted",
      severity: state === "Provider failed" || state === "Revoked" ? "High" : "Moderate",
      subject: first.component.id,
      since: newest?.on ?? "—",
      statement: `${controls.length} ${plural(controls.length, "control", "controls")} inherited from ${first.component.name} (${first.component.id}) ${plural(controls.length, "reads", "read")} ${state} — ${controls.join(", ")}. ${first.stateReason}`,
      action:
        state === "Provider failed"
          ? `Treat the ${controls.length} affected ${plural(controls.length, "row", "rows")} as Other than satisfied on this system and open the consumer-side remediation; a failing provider propagates its deficiency, it does not hide as Not assessed.`
          : state === "Revoked"
            ? `Re-designate ${controls.join(", ")} as System-Specific and author the implementation the provider used to carry; the obligation reverted to this program when the offer was withdrawn.`
            : `Review ${first.component.id}'s ${key.split("|")[1] === "Evidence stale" ? "current evidence" : "new assessment"} and re-accept the reference for ${controls.join(", ")}, or record why the program is not accepting it.`,
      evidence: [first.component.id, ...controls],
    });
  }

  /* Authorization expiry — only where an ATO with a date actually exists. */
  const program = programs.find((p) => p.id === programId);
  const expiresMs = program ? dayOf(program.expires) : null;
  if (program && expiresMs !== null) {
    const daysLeft = daysBetween(today, expiresMs);
    if (daysLeft <= 90) {
      const past = daysLeft < 0;
      drafts.push({
        kind: "Authorization expiring",
        severity: past ? "Critical" : daysLeft <= 30 ? "High" : "Moderate",
        subject: program.id,
        since: program.expires,
        statement: past
          ? `The authorization for ${program.name} expired on ${program.expires}, ${Math.abs(daysLeft)} days ago, and the program record still reads ${program.status}. The system is operating without a current authorization decision.`
          : `The authorization for ${program.name} expires on ${program.expires}, ${daysLeft} ${plural(daysLeft, "day", "days")} out, against a package that was authorized on ${program.authorized}.`,
        action: past
          ? `Obtain an interim decision from ${program.authorizingOfficial} or take the system off the network; continued operation past expiry is an authorization finding, not a ConMon one.`
          : `Start the reauthorization package now — the ConMon record on this page is the evidence base for it — and book the decision brief with ${program.authorizingOfficial}.`,
        evidence: [program.id],
      });
    }
  }

  const taken = new Set<string>();
  return drafts
    .map((d) => ({ id: alertIdFor(`${d.kind}|${d.subject}`, taken), ...d }))
    .sort((a, b) => {
      const bySeverity = severityRank[a.severity] - severityRank[b.severity];
      if (bySeverity !== 0) return bySeverity;
      const aMs = dayOf(a.since);
      const bMs = dayOf(b.since);
      if (aMs !== bMs) return (bMs ?? -Infinity) - (aMs ?? -Infinity);
      return a.id.localeCompare(b.id);
    });
}
