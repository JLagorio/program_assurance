/**
 * Chunk 11 of the CCI spine — the Cyber T&E phase model.
 *
 * The DoD Cybersecurity Test and Evaluation Guidebook defines SIX phases, not
 * three: understand the requirements, characterize the attack surface,
 * cooperative vulnerability identification (CVI), adversarial cybersecurity
 * DT&E (ACD), cooperative vulnerability and penetration assessment (CVPA) and
 * adversarial assessment (AA). Phases 1–4 are developmental, 5 and 6 are
 * operational. CVI is cooperative and white-box — the system owner helps. AA is
 * adversarial and mission-focused: it is scored in MISSION EFFECT, not in
 * findings count, and an AA that reports "12 CAT II findings" and no mission
 * effect has missed its own point.
 *
 * Invariants held here:
 *
 *  - **A gate criterion is DERIVED wherever the platform can judge it.** A
 *    checkbox gate is worthless. Twelve of the eighteen criteria are computed
 *    live from the SCTM, the finding register, the scan record, the run log,
 *    the change log and the composition graph, and `evaluateCriterion` always
 *    returns a SENTENCE WITH REAL NUMBERS plus the ids the judgement rests on —
 *    never a bare boolean. The six `Attested` criteria are the ones no platform
 *    can judge (a signed test plan, an approved threat portrayal, an ROE
 *    agreement, an OTA concurrence); each carries a real signer and date, or an
 *    em dash when unsigned so the gap shows rather than hides.
 *
 *  - **A phase's recorded state and its live readiness are different facts, and
 *    the product shows both.** PH-3 was signed off on Apr 18, 2026; re-read
 *    against today's register it no longer passes its own exit criteria,
 *    because FND-2231 (a CAT I) was raised on Aug 24 and two open deficiencies
 *    are still untracked. That divergence is the point of a derived gate. It is
 *    reported, never reconciled away, and a deficiency is never laundered into
 *    "not assessed".
 *
 *  - **Every `ThreatScenario.path` is traversable in the real composition
 *    graph.** Consecutive nodes are joined either by a `CompositionEdge` in the
 *    direction of travel or by a containment link (parent to child), which is
 *    how an adversary actually moves: over a connection, or down into what a
 *    thing is made of. A path that is not traversable is the same class of
 *    defect as a fabricated ATT&CK id, and `unwalkableSteps` exists so the
 *    claim can be checked rather than believed.
 *
 *  - **Every ATT&CK id is real, with its published name and tactic**, drawn
 *    from the Enterprise matrix and — for the tactical-edge switch — the ICS
 *    matrix. A wrong technique id discredits everything around it.
 *
 *  - **A scenario that achieved nothing is a RESULT.** MEF-0505 records "No
 *    effect": the PIV bypass was attempted and refused. A product that only
 *    records successes is lying about what the assessment found.
 *
 * No clock is read during render. Selectors that need "today" take a trailing
 * `asOf` string defaulting to the dataset's own today, Aug 30, 2026.
 */

import type { Tone } from "@ledger/design-system";
import { datasetToday } from "@/lib/dataset-clock";
import {
  authorizedBuild,
  candidateBuild,
  changesForProgram,
  nodeImpact,
  stampOf,
} from "@/lib/baselines";
import { campaignById, eventsByCampaign } from "@/lib/campaigns";
import {
  childrenOf,
  descendantsOf,
  edgesFrom,
  graphVersion,
  nodeById,
  nodeForAsset,
  nodesForProgram,
} from "@/lib/composition";
import { controlMatrix } from "@/lib/control-matrix";
import { assets, findings, isDeficiency, isOpen } from "@/lib/findings";
import { scansForProgram } from "@/lib/ingestion";
import { riskById } from "@/lib/register";
import { buildSctm, type Sctm } from "@/lib/sctm";
import type { AdversaryTier, EffectKind, PhaseState, ScenarioStatus } from "@/lib/spine";
import {
  objectiveDisagrees,
  objectivesForCampaign,
  proceduresForObjective,
  resolvedObjectiveResult,
  runsForCampaign,
  runVerdict,
} from "@/lib/test-execution";

export type { AdversaryTier, EffectKind, PhaseState, ScenarioStatus };

export const tePhaseIds = ["PH-1", "PH-2", "PH-3", "PH-4", "PH-5", "PH-6"] as const;
export type TePhaseId = (typeof tePhaseIds)[number];
export type PhaseKind = "Developmental" | "Operational";

export type CriterionKind = "Entry" | "Exit";
/** Whether the criterion can be judged by the platform or needs a human. */
export type CriterionBasis = "Derived" | "Attested";

export type PhaseCriterion = {
  id: string; // "PH-3-E1"
  phase: TePhaseId;
  kind: CriterionKind;
  statement: string;
  basis: CriterionBasis;
  /** For Derived criteria: which selector proves it, named in prose. */
  derivation: string;
  /** For Attested criteria only — who signed and when. "—" when unsigned. */
  attestedBy: string;
  attestedOn: string;
};

export type CriterionResult = {
  criterion: string;
  met: boolean;
  /** The actual computed sentence, with real numbers. Never a bare boolean. */
  finding: string;
  /** Ids the judgement rests on — FND-, SCN-, TR-, SctmRow keys, CHG-. */
  evidence: string[];
};

export type TePhase = {
  id: TePhaseId;
  n: number;
  name: string;
  short: string;
  kind: PhaseKind;
  program: string;
  state: PhaseState;
  purpose: string;
  window: string; // "Jun 08 – Jul 24, 2026"
  lead: string;
  /** TC- campaigns executing this phase. */
  campaigns: string[];
  /** The RMF gate this phase informs. */
  gate: string;
};

/** DoD Cyber Table Top adversary tiers I–VI. A tier is a property, not a posture. */
export const adversaryTiers: readonly AdversaryTier[] = ["I", "II", "III", "IV", "V", "VI"];

export type AttackTechnique = {
  /** Real ATT&CK id — "T1078", "T1190", "T0866" for ICS. */
  id: string;
  name: string;
  tactic: string;
  matrix: "Enterprise" | "ICS";
};

export type ThreatScenario = {
  id: string; // THR-
  name: string;
  program: string;
  /** The phase that exercises it. CVPA scenarios are cooperative; AA scenarios are not. */
  phase: TePhaseId;
  tier: AdversaryTier;
  /** The adversary's objective in mission terms, not technical terms. */
  objective: string;
  /** Where the adversary is assumed to start. */
  entryPoint: string; // CN-
  /** Ordered chain of techniques. */
  chain: AttackTechnique[];
  /** CN- ids the chain traverses, in order. */
  path: string[];
  /** The mission function at risk. */
  missionFunction: string;
  /** TE- event that executes it, or null when unexercised. */
  event: string | null;
  status: ScenarioStatus;
  note: string;
};

export type MissionEffect = {
  id: string; // MEF-
  scenario: string; // THR-
  missionFunction: string;
  effect: EffectKind;
  /** What actually happened, in mission terms an operator would recognize. */
  observed: string;
  /** How long the effect persisted. "—" when instantaneous or permanent. */
  duration: string;
  /** Operator workaround available, or "None identified". */
  workaround: string;
  /** TR- run or TE- event that confirmed it. */
  confirmedBy: string;
  /** FND- raised from this effect. */
  findings: string[];
  /** Whether the effect was reproduced on a second attempt. */
  reproduced: boolean;
};

export type PhaseReadiness = {
  phase: TePhaseId;
  entry: CriterionResult[];
  exit: CriterionResult[];
  entryMet: number;
  entryTotal: number;
  exitMet: number;
  exitTotal: number;
  canEnter: boolean;
  canExit: boolean;
  /** The single blocking sentence, or "—". */
  blocker: string;
};

/* ── Tone ────────────────────────────────────────────────────────────────── */

/**
 * A phase state is a lifecycle position, not a verdict, so only "Complete" is
 * green and nothing is red. Readiness carries the colour; the state does not
 * pretend to.
 */
export const phaseStateTone: Record<PhaseState, Tone> = {
  "Not started": "neutral",
  Planning: "neutral",
  Executing: "neutral",
  Reporting: "neutral",
  Complete: "success",
};

/**
 * "No effect" is the only green: the adversary tried and the mission held.
 * Everything the adversary achieved is red or orange by how much it achieved.
 */
export const effectTone: Record<EffectKind, Tone> = {
  "No effect": "success",
  Degraded: "warning",
  Manipulated: "warning",
  Denied: "danger",
  Destroyed: "danger",
  Exfiltrated: "danger",
};

export const scenarioStatusTone: Record<ScenarioStatus, Tone> = {
  Proposed: "neutral",
  Approved: "neutral",
  Executed: "neutral",
  Blocked: "danger",
  "Not exercised": "warning",
};

/* ── Phases ──────────────────────────────────────────────────────────────── */

export const phases: TePhase[] = [
  {
    id: "PH-1",
    n: 1,
    name: "Understand Cybersecurity Requirements",
    short: "Requirements",
    kind: "Developmental",
    program: "PRG-1041",
    state: "Complete",
    purpose:
      "Turn the categorization and the tailored 800-53 baseline into testable requirements: one SCTM row per CCI, an organization-defined parameter value for every control that carries one, and a named verification method for each. No campaign was opened against this phase — it produces the matrix that every later phase is judged against, not an execution.",
    window: "Apr 07 – Jun 18, 2025",
    lead: "Marcus Ryde",
    campaigns: [],
    gate: "RMF-2 — Select security controls",
  },
  {
    id: "PH-2",
    n: 2,
    name: "Characterize the Attack Surface",
    short: "Attack surface",
    kind: "Developmental",
    program: "PRG-1041",
    state: "Complete",
    purpose:
      "Build the picture an adversary would build: the composition graph down to the part level, the reachability edges between the three segments, the trust-zone ranks, and the first threat scenarios written from them. This is the phase that produced THR-0301 through THR-0308 as candidate storylines; it did not execute any of them.",
    window: "Jul 07 – Dec 12, 2025",
    lead: "Priya Raman",
    campaigns: [],
    gate: "CDR — Critical Design Review",
  },
  {
    id: "PH-3",
    n: 3,
    name: "Cooperative Vulnerability Identification",
    short: "CVI",
    kind: "Developmental",
    program: "PRG-1041",
    state: "Complete",
    purpose:
      "White-box, cooperative, with the system owner in the room: run the benchmarks, read the configurations, and identify what is wrong before anyone tries to exploit it. TC-0022 carried the phase as a full 800-53A sampling by the independent assessor. The phase was signed off on Apr 18, 2026 — its exit criteria are re-read live below, and they no longer pass, because FND-2231 was raised in August against the same cooperative record.",
    window: "Jan 12 – Apr 18, 2026",
    lead: "Nadia Fournier",
    campaigns: ["TC-0022"],
    gate: "TRR — Test Readiness Review",
  },
  {
    id: "PH-4",
    n: 4,
    name: "Adversarial Cybersecurity DT&E",
    short: "ACD",
    kind: "Developmental",
    program: "PRG-1041",
    state: "Complete",
    purpose:
      "A developmental red cell operating against the system under a stated threat portrayal, still inside DT&E: exploit what CVI identified and find what it missed. TC-0034 carried it, and the phase closed on the TE-0044 report of Aug 22. TC-0034 itself is still open because TE-0046's credential-abuse chain was carried forward as the pathfinder for the adversarial assessment rather than re-scoped back into ACD.",
    window: "May 04 – Aug 22, 2026",
    lead: "Wes Duarte (Red cell — DT&E)",
    campaigns: ["TC-0034"],
    gate: "RMF-5 — Interim Authority to Test (IATT) renewal",
  },
  {
    id: "PH-5",
    n: 5,
    name: "Cooperative Vulnerability and Penetration Assessment",
    short: "CVPA",
    kind: "Operational",
    program: "PRG-1041",
    state: "Executing",
    purpose:
      "Operational, cooperative, and broader than CVI: the operational test agency walks the system with the program's help to characterize what an adversary could reach, and hands the AA team a scoped surface rather than a blank map. TC-0031 verifies TRR readiness and TC-0028 closes out the overlay delta; TE-0046 is still running to Sep 02, which is why THR-0304 is approved and not yet executed.",
    window: "Jul 09 – Sep 12, 2026",
    lead: "Marcus Hale",
    campaigns: ["TC-0031", "TC-0028"],
    gate: "RMF-6 — Final assessment & SAR",
  },
  {
    id: "PH-6",
    n: 6,
    name: "Adversarial Assessment",
    short: "AA",
    kind: "Operational",
    program: "PRG-1041",
    state: "Planning",
    purpose:
      "The operational red team under a validated threat portrayal, with the mission running and the defenders in the loop. The AA is scored in mission effect — what the adversary did to payment settlement, to telemetry ingest, to attribution — not in findings count. Planning only: the ROE is unsigned, two Significant changes are unacknowledged against the authorized baseline, and the tier V portrayal for THR-0309 has not been approved.",
    window: "Sep 14 – Sep 30, 2026",
    lead: "Amara Bell (Operational test agency)",
    campaigns: [],
    gate: "RMF-7 — Authority to Operate (ATO)",
  },
];

export const phaseById = new Map(phases.map((p) => [p.id, p]));

/* ── Criteria ────────────────────────────────────────────────────────────── */

export const criteria: PhaseCriterion[] = [
  {
    id: "PH-1-E1",
    phase: "PH-1",
    kind: "Entry",
    statement:
      "The system categorization, the tailored control baseline and every organization-defined parameter value are under configuration control before requirements analysis opens.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "Marcus Ryde — Chief engineer",
    attestedOn: "Apr 07, 2025",
  },
  {
    id: "PH-1-X1",
    phase: "PH-1",
    kind: "Exit",
    statement:
      "Every requirement in the SCTM is allocated to at least one composition node, so no control leaves this phase without an owner in the architecture.",
    basis: "Derived",
    derivation:
      "buildSctm(program, controlMatrix(program), null).rows, counting rows whose responsibleNodes array is empty.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-2-E1",
    phase: "PH-2",
    kind: "Entry",
    statement:
      "The system boundary, the mission threads it carries and the mission-critical functions are agreed with the operational sponsor.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "Grace Hoppel — Program manager",
    attestedOn: "Jul 07, 2025",
  },
  {
    id: "PH-2-X1",
    phase: "PH-2",
    kind: "Exit",
    statement:
      "The composition graph accounts for the whole boundary: every tracked asset anchors to exactly one node, and every finding on record resolves to a node that exists.",
    basis: "Derived",
    derivation:
      "nodesForProgram + nodeForAsset over the asset inventory, and nodeById over every Finding.node.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-3-E1",
    phase: "PH-3",
    kind: "Entry",
    statement:
      "An automated scan covering every boundary asset has been ingested within the last 30 days.",
    basis: "Derived",
    derivation:
      "scansForProgram(program) matched against each asset's anchor subtree via nodeForAsset + descendantsOf, taking the most recent completed scan per asset.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-3-E2",
    phase: "PH-3",
    kind: "Entry",
    statement:
      "A signed cooperative vulnerability identification test plan naming the assets, the tooling, the operator accounts and the data handling is on file.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "Nadia Fournier — Security assessment lead",
    attestedOn: "Jan 09, 2026",
  },
  {
    id: "PH-3-X1",
    phase: "PH-3",
    kind: "Exit",
    statement:
      "Every CAT I identified on the cooperative record is remediated, carries a POA&M item, or is accepted by the AO.",
    basis: "Derived",
    derivation:
      "findings filtered by isDeficiency and a mitigatedSeverity of CAT I on a cooperative verification path, checked against poam, and against riskById(...).disposition for an AO acceptance.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-3-X2",
    phase: "PH-3",
    kind: "Exit",
    statement:
      "Every open deficiency leaving CVI is tracked — it carries a POA&M item or a register risk, so nothing walks out of the phase unowned.",
    basis: "Derived",
    derivation:
      "findings filtered by isOpen and isDeficiency, checked for a poam or risk reference.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-4-E1",
    phase: "PH-4",
    kind: "Entry",
    statement:
      "The developmental threat portrayal and the rules of engagement for the DT&E red cell are approved, including the abort criteria and the production-safety constraints.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "Grace Hoppel — Program manager",
    attestedOn: "May 01, 2026",
  },
  {
    id: "PH-4-X1",
    phase: "PH-4",
    kind: "Exit",
    statement:
      "Every ACD test run has reached a recorded verdict: none is left planned or in progress, and any aborted run has been re-executed to completion on the same procedure.",
    basis: "Derived",
    derivation:
      "runsForCampaign over the phase's campaigns with runVerdict, treating an Aborted run as accounted for only when a later Complete run exists for its procedure.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-4-X2",
    phase: "PH-4",
    kind: "Exit",
    statement:
      "No ACD objective's declared result contradicts the result its runs actually produced.",
    basis: "Derived",
    derivation:
      "objectivesForCampaign with objectiveDisagrees and resolvedObjectiveResult, which reconciles the declared TestObjective.result against the worst completed run per procedure.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-5-E1",
    phase: "PH-5",
    kind: "Entry",
    statement:
      "The SCTM has no unevidenced row on a control in the assessment scope, so the CVPA team starts from an evidenced position rather than re-deriving one.",
    basis: "Derived",
    derivation:
      "buildSctm(program, controlMatrix(program), null).rows where evidence.length === 0, restricted to the controls the phase's campaigns actually raised findings against.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-5-E2",
    phase: "PH-5",
    kind: "Entry",
    statement:
      "The operational test agency concurs with the CVPA scope, the asset list and the data collection plan.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "Amara Bell — Operational test agency",
    attestedOn: "Jul 02, 2026",
  },
  {
    id: "PH-5-X1",
    phase: "PH-5",
    kind: "Exit",
    statement: "Every approved CVPA scenario has been executed or formally waived.",
    basis: "Derived",
    derivation:
      "threatScenarios for the phase, counting status Executed against Approved, Proposed and Blocked.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-6-E1",
    phase: "PH-6",
    kind: "Entry",
    statement:
      "The configuration under test is an authorized baseline with no unacknowledged Significant change filed against it.",
    basis: "Derived",
    derivation:
      "authorizedBuild(program) with changesForProgram(program) filtered to a Significant impact that is not acknowledged, split by the build the change is filed against.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-6-E2",
    phase: "PH-6",
    kind: "Entry",
    statement:
      "A rules-of-engagement agreement covering the adversarial assessment — signed by the program manager, the authorizing official and the operational test agency — is on file.",
    basis: "Attested",
    derivation: "—",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-6-X1",
    phase: "PH-6",
    kind: "Exit",
    statement:
      "Every confirmed mission effect on record has a finding and an operator workaround, or a documented acceptance.",
    basis: "Derived",
    derivation:
      "missionEffects with an effect other than No effect, checked for a non-empty findings array and a workaround other than None identified.",
    attestedBy: "—",
    attestedOn: "—",
  },
  {
    id: "PH-6-X2",
    phase: "PH-6",
    kind: "Exit",
    statement:
      "No Significant change has invalidated a node on an executed scenario path since the scenario ran.",
    basis: "Derived",
    derivation:
      "nodeImpact(program, node) from @/lib/baselines over the distinct nodes of every executed scenario path — Invalidated on the node itself, Suspect on what merely contains it.",
    attestedBy: "—",
    attestedOn: "—",
  },
];

export const criterionById = new Map(criteria.map((c) => [c.id, c]));

/* ── Threat scenarios ────────────────────────────────────────────────────── */

const t = {
  activeScanning: {
    id: "T1595",
    name: "Active Scanning",
    tactic: "Reconnaissance",
    matrix: "Enterprise",
  },
  exploitPublicFacing: {
    id: "T1190",
    name: "Exploit Public-Facing Application",
    tactic: "Initial Access",
    matrix: "Enterprise",
  },
  serviceDiscovery: {
    id: "T1046",
    name: "Network Service Discovery",
    tactic: "Discovery",
    matrix: "Enterprise",
  },
  automatedCollection: {
    id: "T1119",
    name: "Automated Collection",
    tactic: "Collection",
    matrix: "Enterprise",
  },
  exfilAltProtocol: {
    id: "T1048",
    name: "Exfiltration Over Alternative Protocol",
    tactic: "Exfiltration",
    matrix: "Enterprise",
  },
  networkSniffing: {
    id: "T1040",
    name: "Network Sniffing",
    tactic: "Credential Access",
    matrix: "Enterprise",
  },
  unsecuredCredentials: {
    id: "T1552",
    name: "Unsecured Credentials",
    tactic: "Credential Access",
    matrix: "Enterprise",
  },
  validAccountsInitial: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Initial Access",
    matrix: "Enterprise",
  },
  validAccountsPersistence: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Persistence",
    matrix: "Enterprise",
  },
  accountManipulation: {
    id: "T1098",
    name: "Account Manipulation",
    tactic: "Persistence",
    matrix: "Enterprise",
  },
  altAuthMaterial: {
    id: "T1550",
    name: "Use Alternate Authentication Material",
    tactic: "Lateral Movement",
    matrix: "Enterprise",
  },
  modifyAuthProcess: {
    id: "T1556",
    name: "Modify Authentication Process",
    tactic: "Credential Access",
    matrix: "Enterprise",
  },
  createAccount: {
    id: "T1136",
    name: "Create Account",
    tactic: "Persistence",
    matrix: "Enterprise",
  },
  endpointDos: {
    id: "T1499",
    name: "Endpoint Denial of Service",
    tactic: "Impact",
    matrix: "Enterprise",
  },
  indicatorRemoval: {
    id: "T1070",
    name: "Indicator Removal",
    tactic: "Defense Evasion",
    matrix: "Enterprise",
  },
  impairDefenses: {
    id: "T1562",
    name: "Impair Defenses",
    tactic: "Defense Evasion",
    matrix: "Enterprise",
  },
  supplyChain: {
    id: "T1195",
    name: "Supply Chain Compromise",
    tactic: "Initial Access",
    matrix: "Enterprise",
  },
  dataManipulation: {
    id: "T1565",
    name: "Data Manipulation",
    tactic: "Impact",
    matrix: "Enterprise",
  },
  aitm: {
    id: "T1557",
    name: "Adversary-in-the-Middle",
    tactic: "Credential Access",
    matrix: "Enterprise",
  },
  dataDestruction: {
    id: "T1485",
    name: "Data Destruction",
    tactic: "Impact",
    matrix: "Enterprise",
  },
  icsRemoteServices: {
    id: "T0866",
    name: "Exploitation of Remote Services",
    tactic: "Initial Access",
    matrix: "ICS",
  },
  icsDenialOfService: {
    id: "T0814",
    name: "Denial of Service",
    tactic: "Inhibit Response Function",
    matrix: "ICS",
  },
} satisfies Record<string, AttackTechnique>;

export const threatScenarios: ThreatScenario[] = [
  {
    id: "THR-0301",
    name: "Tactical uplink to mission telemetry",
    program: "PRG-1041",
    phase: "PH-4",
    tier: "III",
    objective:
      "Read what the settlement run is built from — live payment telemetry — without ever holding a credential the program issued.",
    entryPoint: "CN-0310",
    chain: [
      t.activeScanning,
      t.exploitPublicFacing,
      t.serviceDiscovery,
      t.automatedCollection,
      t.exfilAltProtocol,
    ],
    path: ["CN-0310", "CN-0210", "CN-0215"],
    missionFunction: "Mission telemetry ingest",
    event: "TE-0044",
    status: "Executed",
    note: "The tactical uplink crosses Public into DMZ on the only edge that carries it, so the switch is the assumed foothold rather than a compromise to be proven. The telemetry leaves the way it was reached — over the same untrusted-enclave HTTPS path the request arrived on, not over a channel the adversary established, which is why the chain carries an alternative-protocol exfiltration and no command-and-control step at all. Executed in TE-0044 and confirmed by TR-0103; it raised FND-2263.",
  },
  {
    id: "THR-0302",
    name: "Cleartext management plane at the tactical edge",
    program: "PRG-1041",
    phase: "PH-4",
    tier: "II",
    objective:
      "Recover a device management credential at the edge and use it to change what the forward relay forwards, without the ground segment seeing a fault.",
    entryPoint: "CN-0300",
    chain: [t.networkSniffing, t.unsecuredCredentials, t.validAccountsInitial],
    path: ["CN-0300", "CN-0310", "CN-0313"],
    missionFunction: "Tactical uplink and forward relay",
    event: "TE-0044",
    status: "Executed",
    note: "A tier II portrayal is enough because the credential is on the wire: FND-2231 records telnet still enabled on the IOS-XE management plane. Confirmed by TR-0104.",
  },
  {
    id: "THR-0303",
    name: "Forwarding ASIC denial at the tactical edge",
    program: "PRG-1041",
    phase: "PH-4",
    tier: "IV",
    objective:
      "Take the forward relay off the air for the length of a settlement window without ever touching the ground segment.",
    entryPoint: "CN-0310",
    chain: [t.icsRemoteServices, t.icsDenialOfService],
    path: ["CN-0310", "CN-0311", "CN-0312"],
    missionFunction: "Tactical uplink and forward relay",
    event: null,
    status: "Blocked",
    note: "Written against the ICS matrix because the target is the forwarding plane, not the host: the Marvell 88E6390 ASIC is unattested and reached over the line board's MDIO strap. The red cell was denied authority to execute a denial technique against the only relay in the exercise; the scenario is carried to the AA against a bench-representative switch.",
  },
  {
    id: "THR-0304",
    name: "Break-glass account persistence",
    program: "PRG-1041",
    phase: "PH-5",
    tier: "II",
    objective:
      "Keep a working operator identity after the emergency account that created it should have been disabled, so access survives the incident that justified it.",
    entryPoint: "CN-0220",
    chain: [t.validAccountsPersistence, t.accountManipulation, t.altAuthMaterial],
    path: ["CN-0220", "CN-0221"],
    missionFunction: "Operator authentication",
    event: "TE-0046",
    status: "Approved",
    note: "Approved against FND-2251 — emergency accounts on the Keycloak realm have no automatic disable. TE-0046 runs to Sep 02, so no mission effect is recorded yet and the CVPA exit criterion reads it as outstanding rather than as a pass.",
  },
  {
    id: "THR-0305",
    name: "Audit offload starvation on the settlement store",
    program: "PRG-1041",
    phase: "PH-5",
    tier: "III",
    objective:
      "Make privileged activity on the settlement database unattributable for longer than the reporting window the SOC works to.",
    entryPoint: "CN-0110",
    chain: [t.validAccountsInitial, t.endpointDos, t.indicatorRemoval],
    path: ["CN-0110", "CN-0130", "CN-0132"],
    missionFunction: "Audit and attribution",
    event: "TE-0043",
    status: "Executed",
    note: "The application tier already reaches the database on TCP 5432, so the scenario needs no new path — only a write burst large enough to outrun the offload. Confirmed by TR-0106; it raised FND-2240.",
  },
  {
    id: "THR-0306",
    name: "Settlement pool exhaustion from the mission service",
    program: "PRG-1041",
    phase: "PH-4",
    tier: "II",
    objective: "Stop the platform settling payments for the length of a settlement window.",
    entryPoint: "CN-0310",
    chain: [t.exploitPublicFacing, t.validAccountsInitial, t.endpointDos],
    path: ["CN-0310", "CN-0210", "CN-0130"],
    missionFunction: "Payment settlement",
    event: "TE-0044",
    status: "Executed",
    note: "Every hop is a real reachability edge: the tactical uplink into mission-api, then mission-api's own critical connection to the settlement store. Executed inside TE-0044 as a pivot from THR-0301 and stopped by the observer at 26 minutes.",
  },
  {
    id: "THR-0307",
    name: "PIV bypass on the identity provider console",
    program: "PRG-1041",
    phase: "PH-5",
    tier: "III",
    objective:
      "Get an administrative session on the identity provider without a PIV-derived credential, so operator accounts can be created at will.",
    entryPoint: "CN-0210",
    chain: [t.validAccountsInitial, t.modifyAuthProcess, t.createAccount],
    path: ["CN-0210", "CN-0220", "CN-0221"],
    missionFunction: "Operator authentication",
    event: "TE-0046",
    status: "Executed",
    note: "mission-api authenticates to Keycloak on TCP 8443, so a compromised service identity is the assumed start. The scenario was executed and did not achieve its objective — MEF-0505 records the No effect.",
  },
  {
    id: "THR-0308",
    name: "Degraded-communications window as cover",
    program: "PRG-1041",
    phase: "PH-5",
    tier: "II",
    objective:
      "Act during a DDIL window, when the tactical edge is expected to be silent, so that the watch cannot tell a suppressed alarm from a quiet one.",
    entryPoint: "CN-0300",
    chain: [t.impairDefenses, t.indicatorRemoval],
    path: ["CN-0300", "CN-0310", "CN-0313"],
    missionFunction: "Degraded-mode operations",
    event: "TE-0038",
    status: "Executed",
    note: "Walked as a table-top in TE-0038 with the AO's staff and then measured live in TR-0114. The local spool held, which is the good half; the console lost the security-function status page, which is the other half.",
  },
  {
    id: "THR-0309",
    name: "Supplier substitution in the mission image",
    program: "PRG-1041",
    phase: "PH-6",
    tier: "V",
    objective:
      "Change what the platform settles without ever touching the operator's network — by getting into what the platform is built from.",
    entryPoint: "CN-0200",
    chain: [t.supplyChain, t.validAccountsPersistence, t.dataManipulation],
    path: ["CN-0200", "CN-0210", "CN-0213"],
    missionFunction: "Payment settlement",
    event: null,
    status: "Proposed",
    note: "Written against FND-2269: gorilla/mux and jwx carry no supplier SBOM and no attestation, so there is nothing to compare a substituted build against. Proposed only — a tier V portrayal has not been approved for this assessment.",
  },
  {
    id: "THR-0310",
    name: "Cryptographic downgrade on the settlement channel",
    program: "PRG-1041",
    phase: "PH-6",
    tier: "IV",
    objective:
      "Read and alter settlement traffic in flight between the mission service and the settlement store, leaving both ends believing the channel held.",
    entryPoint: "CN-0310",
    chain: [t.exploitPublicFacing, t.aitm, t.networkSniffing, t.dataManipulation],
    path: ["CN-0310", "CN-0210", "CN-0130"],
    missionFunction: "Payment settlement",
    event: null,
    status: "Approved",
    note: "The uplink into mission-api is the same walk THR-0306 takes, so a foothold on the DMZ service is the assumed position for the intercept — the adversary cannot sit on the settlement leg from the Public-zone switch alone. libcrypto is behind every outbound call the service makes, which is where the downgrade is staged. Approved for the AA, but CHG-0431 moves the image's OpenSSL from 3.0.11 to 3.0.13 and changes the offered signature algorithms with it. The scenario has to be re-planned against the rebuilt image before it is executed, or it will test a configuration that will not ship.",
  },
  {
    id: "THR-0311",
    name: "Destructive action on the settlement record",
    program: "PRG-1041",
    phase: "PH-6",
    tier: "II",
    objective:
      "Deny the mission permanently: destroy the settlement record itself so that it cannot be replayed from anywhere inside the boundary.",
    entryPoint: "CN-0110",
    chain: [t.validAccountsInitial, t.dataDestruction],
    path: ["CN-0110", "CN-0130", "CN-0132"],
    missionFunction: "Payment settlement",
    event: null,
    status: "Not exercised",
    note: "A destructive portrayal is out of scope for an assessment run on production infrastructure — the action is irreversible and no representative environment exists to run it in. The low tier is the point: the chain needs no capability beyond a privileged ground-segment identity, and nothing in the graph stops it once that identity is held. Recorded so the residual is explicit rather than absent.",
  },
];

export const scenarioById = new Map(threatScenarios.map((s) => [s.id, s]));

/* ── Mission effects ─────────────────────────────────────────────────────── */

export const missionEffects: MissionEffect[] = [
  {
    id: "MEF-0501",
    scenario: "THR-0301",
    missionFunction: "Mission telemetry ingest",
    effect: "Exfiltrated",
    observed:
      "From the tactical-edge foothold the team pulled 41 minutes of live settlement telemetry off the unauthenticated metrics listener on mission-api — merchant identifiers, per-batch amounts and queue depths — without presenting a credential. It is enough to reconstruct the settlement batch and to time an action against it.",
    duration: "41 minutes of collection; the path itself stayed open for the whole event window.",
    workaround:
      "Operators can disable the metrics listener at the service, at the cost of losing the queue-depth alerting the settlement watch runs on.",
    confirmedBy: "TR-0103",
    findings: ["FND-2263"],
    reproduced: true,
  },
  {
    id: "MEF-0502",
    scenario: "THR-0302",
    missionFunction: "Tactical uplink and forward relay",
    effect: "Manipulated",
    observed:
      "With the enable credential recovered from the cleartext management session the team rewrote the relay ACL so that two of the six forward flows were silently dropped, while the switch continued to report all six interfaces up. The ground segment saw a quiet uplink, not a failed one.",
    duration: "18 minutes, until the observer had the configuration restored.",
    workaround:
      "The watch officer can fail the relay over to the secondary uplink, but only after noticing the loss — there is no alarm on a silently dropped flow.",
    confirmedBy: "TR-0104",
    findings: ["FND-2231"],
    reproduced: true,
  },
  {
    id: "MEF-0503",
    scenario: "THR-0305",
    missionFunction: "Audit and attribution",
    effect: "Degraded",
    observed:
      "Under a synthetic write burst the audit offload fell 31 hours behind the 24-hour requirement. No record was lost — the local spool held throughout — but for 31 hours no privileged action on gcs-db-01 was visible to the SOC, which is exactly the window an insider would need.",
    duration: "31 hours.",
    workaround:
      "The duty analyst can pull the local audit spool off the host over the management VLAN. It is manual, it is not alerted, and it does not scale past one host.",
    confirmedBy: "TR-0106",
    findings: ["FND-2240"],
    reproduced: true,
  },
  {
    id: "MEF-0504",
    scenario: "THR-0306",
    missionFunction: "Payment settlement",
    effect: "Denied",
    observed:
      "Holding the mission-api service identity, the team opened and held every connection in the settlement pool. Settlement stopped for 26 minutes, the submission queue backed up to roughly 9,400 payments, and the platform returned a hard failure to every submitting partner rather than degrading.",
    duration: "26 minutes, ended by the observer aborting the run rather than by any control.",
    workaround: "None identified",
    confirmedBy: "TE-0044",
    findings: [],
    reproduced: true,
  },
  {
    id: "MEF-0505",
    scenario: "THR-0307",
    missionFunction: "Operator authentication",
    effect: "No effect",
    observed:
      "Every attempt to reach the Keycloak administrative console without a PIV-derived certificate was refused at the x509 authenticator — the direct-grant path, the two service identities recovered earlier in the chain, and a replayed browser session. No console session was ever issued. The objective was not achieved, and this is the same refusal TR-0105 recorded under the TRR checklist on Aug 18.",
    duration: "—",
    workaround: "Not required — no mission effect occurred.",
    confirmedBy: "TE-0046",
    findings: [],
    reproduced: true,
  },
  {
    id: "MEF-0506",
    scenario: "THR-0308",
    missionFunction: "Degraded-mode operations",
    effect: "Degraded",
    observed:
      "In the simulated DDIL window the local audit spool held every record — TR-0113 measured 96 hours of headroom at the edge collector — but the live demonstration showed the operator console loses the security-function status page entirely while the link is down. The watch keeps the mission and loses its view of whether the mission is being interfered with.",
    duration: "For the length of the DDIL window; 4 hours 20 minutes as exercised.",
    workaround:
      "The watch runs the printed degraded-mode checklist and polls the edge collector by radio every 30 minutes. It detects loss of comms; it does not detect tampering.",
    confirmedBy: "TR-0114",
    findings: [],
    reproduced: false,
  },
];

export const effectById = new Map(missionEffects.map((e) => [e.id, e]));

const effectsByScenario = new Map<string, MissionEffect[]>();
for (const e of missionEffects) {
  const list = effectsByScenario.get(e.scenario);
  if (list) list.push(e);
  else effectsByScenario.set(e.scenario, [e]);
}

/* ── Selectors ───────────────────────────────────────────────────────────── */

export function phasesForProgram(programId: string): TePhase[] {
  return phases.filter((p) => p.program === programId);
}

export function criteriaFor(phaseId: TePhaseId, kind: CriterionKind): PhaseCriterion[] {
  return criteria.filter((c) => c.phase === phaseId && c.kind === kind);
}

export function scenariosForPhase(phaseId: TePhaseId, programId: string): ThreatScenario[] {
  return threatScenarios.filter((s) => s.phase === phaseId && s.program === programId);
}

export function effectsForScenario(scenarioId: string): MissionEffect[] {
  return effectsByScenario.get(scenarioId) ?? [];
}

export function scenariosForProgram(programId: string): ThreatScenario[] {
  return threatScenarios.filter((s) => s.program === programId);
}

/**
 * The steps of a scenario path that are NOT traversable in the composition
 * graph, as `"CN-a → CN-b"` labels. A real path yields an empty array.
 *
 * A step is traversable when a reachability edge runs from one node to the
 * next, or when the next node is contained in the current one. Both are ways an
 * adversary actually moves; a step that is neither is a fabricated path.
 */
export function unwalkableSteps(scenarioId: string): string[] {
  const scenario = scenarioById.get(scenarioId);
  if (!scenario) return [];
  const bad: string[] = [];
  for (let i = 0; i < scenario.path.length - 1; i += 1) {
    const from = scenario.path[i];
    const to = scenario.path[i + 1];
    if (!from || !to) continue;
    if (!nodeById.has(from) || !nodeById.has(to)) {
      bad.push(`${from} → ${to}`);
      continue;
    }
    const byEdge = edgesFrom(from).some((e) => e.to === to);
    const byContainment = childrenOf(from).some((c) => c.id === to);
    if (!byEdge && !byContainment) bad.push(`${from} → ${to}`);
  }
  return bad;
}

export function attackSurfaceCoverage(programId: string): {
  techniques: number;
  tactics: string[];
  exercised: number;
  unexercised: string[];
  nodesTargeted: number;
  nodesUntargeted: number;
} {
  const scoped = scenariosForProgram(programId);
  const techniques = new Set<string>();
  const tactics = new Set<string>();
  const targeted = new Set<string>();
  for (const s of scoped) {
    for (const step of s.chain) {
      techniques.add(step.id);
      tactics.add(step.tactic);
    }
    for (const node of s.path) targeted.add(node);
  }
  const programNodes = nodesForProgram(programId);
  const hit = programNodes.filter((n) => targeted.has(n.id)).length;
  return {
    techniques: techniques.size,
    tactics: [...tactics].sort((a, b) => a.localeCompare(b)),
    exercised: scoped.filter((s) => s.status === "Executed").length,
    unexercised: scoped.filter((s) => s.status !== "Executed").map((s) => s.id),
    nodesTargeted: hit,
    nodesUntargeted: programNodes.length - hit,
  };
}

/* ── Derivation helpers ──────────────────────────────────────────────────── */

const findingById = new Map(findings.map((f) => [f.id, f]));

/** "FND-2251 and FND-2269", "SCN-1001, SCN-1002 and 3 more". */
function nameList(ids: string[], max = 3): string {
  if (ids.length === 0) return "none";
  if (ids.length <= max) {
    if (ids.length === 1) return ids[0]!;
    return `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]!}`;
  }
  return `${ids.slice(0, max).join(", ")} and ${ids.length - max} more`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** The SCTM is 375 rows on this program, so it is built once per graph version. */
const sctmCache = new Map<string, Sctm>();

function sctmFor(programId: string): Sctm {
  const key = `${programId}|${graphVersion()}`;
  const hit = sctmCache.get(key);
  if (hit) return hit;
  const built = buildSctm(programId, controlMatrix(programId), null);
  sctmCache.set(key, built);
  return built;
}

/** The date part of a "MMM DD, YYYY" or "MMM DD, YYYY HH:MM" stamp. */
function dayOf(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}

function daysBetween(earlier: string, later: string): number | null {
  const a = stampOf(dayOf(earlier));
  const b = stampOf(dayOf(later));
  if (a === 0 || b === 0) return null;
  return Math.round((b - a) / 86_400_000);
}

/** Every node in the asset's anchor subtree, so a part-level scan credits the asset. */
function anchorSubtree(assetId: string): Set<string> | null {
  const anchor = nodeForAsset(assetId);
  if (!anchor) return null;
  const out = new Set<string>([anchor.id]);
  for (const d of descendantsOf(anchor.id)) out.add(d.id);
  return out;
}

/** The cooperative verification paths — CVI is white-box, a test event is not. */
const cooperativePaths = new Set(["STIG checklist", "ACAS scan", "Code scan", "Manual procedure"]);

/** Controls the phase's campaigns actually raised findings against. */
function scopeControlsFor(phase: TePhase): string[] {
  const out = new Set<string>();
  for (const campaignId of phase.campaigns) {
    for (const event of eventsByCampaign(campaignId)) {
      for (const findingId of event.findings) {
        const f = findingById.get(findingId);
        if (f) out.add(f.control);
      }
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

type Derivation = (programId: string, asOf: string) => Omit<CriterionResult, "criterion">;

const derivations: Record<string, Derivation> = {
  "PH-1-X1": (programId) => {
    const sctm = sctmFor(programId);
    const unallocated = sctm.rows.filter((r) => r.responsibleNodes.length === 0);
    const allocated = sctm.rows.length - unallocated.length;
    return {
      met: unallocated.length === 0,
      finding:
        unallocated.length === 0
          ? `All ${sctm.rows.length} SCTM requirement rows generated for the tailored baseline are allocated to at least one composition node — ${allocated} allocated, 0 falling through to "Not allocated to a component".`
          : `${allocated} of ${sctm.rows.length} SCTM requirement rows are allocated to a composition node; ${unallocated.length} are not (${nameList(unallocated.map((r) => r.key))}).`,
      evidence:
        unallocated.length > 0
          ? unallocated.slice(0, 4).map((r) => r.key)
          : sctm.rows.slice(0, 3).map((r) => r.key),
    };
  },

  "PH-2-X1": (programId) => {
    const owned = assets.filter((a) => a.program === programId);
    const unanchored = owned.filter((a) => nodeForAsset(a.id) === null);
    const scoped = findings.filter((f) => {
      const asset = owned.find((a) => a.id === f.asset);
      return asset !== undefined;
    });
    const unresolved = scoped.filter((f) => f.node !== undefined && !nodeById.has(f.node));
    const nodes = nodesForProgram(programId);
    const unattested = nodes.filter((n) => !n.attested);
    const noSupplier = nodes.filter((n) => n.supplier === "Unknown" || n.supplier === "—");
    const met = unanchored.length === 0 && unresolved.length === 0;
    return {
      met,
      finding: met
        ? `All ${owned.length} boundary assets anchor to exactly one composition node and all ${scoped.length} findings on record resolve to a node that exists. The graph carries ${nodes.length} nodes, of which ${unattested.length} are unattested and ${noSupplier.length} name no supplier — recorded on the surface rather than resolved by it.`
        : `${owned.length - unanchored.length} of ${owned.length} assets anchor to a node (${nameList(unanchored.map((a) => a.id))} do not) and ${unresolved.length} of ${scoped.length} findings point at a node that does not exist (${nameList(unresolved.map((f) => f.id))}).`,
      evidence: [
        ...unanchored.map((a) => a.id),
        ...unresolved.map((f) => f.id),
        ...unattested.slice(0, 4).map((n) => n.id),
      ],
    };
  },

  "PH-3-E1": (programId, asOf) => {
    const owned = assets.filter((a) => a.program === programId);
    const scans = scansForProgram(programId).filter((s) => s.completed !== "—");
    const covered: { asset: string; scan: string; age: number }[] = [];
    const stale: string[] = [];
    const never: string[] = [];
    for (const asset of owned) {
      const subtree = anchorSubtree(asset.id);
      let best: { scan: string; age: number } | null = null;
      if (subtree) {
        for (const scan of scans) {
          if (!scan.targets.some((target) => subtree.has(target))) continue;
          const age = daysBetween(scan.completed, asOf);
          if (age === null) continue;
          if (best === null || age < best.age) best = { scan: scan.id, age };
        }
      }
      if (best === null) never.push(asset.id);
      else if (best.age > 30) stale.push(`${asset.id} (${best.scan}, ${best.age} days)`);
      else covered.push({ asset: asset.id, scan: best.scan, age: best.age });
    }
    const met = never.length === 0 && stale.length === 0;
    const oldest = covered.reduce((n, c) => Math.max(n, c.age), 0);
    const missing = owned.filter((a) => never.includes(a.id));
    return {
      met,
      finding: met
        ? `All ${owned.length} boundary assets carry an ingested scan completed within 30 days of ${asOf}; the oldest is ${oldest} ${plural(oldest, "day", "days")} old.`
        : `${covered.length} of ${owned.length} boundary assets carry an ingested scan completed within 30 days of ${asOf} (oldest ${oldest} ${plural(oldest, "day", "days")}). ${missing.length > 0 ? `${nameList(missing.map((a) => `${a.name} (${a.id})`))} ${plural(missing.length, "has", "have")} no ingested scan on record at all — the asset row declares a last scan of ${missing[0]?.lastScan ?? "—"}, which the scan register does not carry.` : ""}${stale.length > 0 ? ` ${nameList(stale)} ${plural(stale.length, "is", "are")} older than 30 days.` : ""}`.trim(),
      evidence: [...covered.slice(0, 4).map((c) => c.scan), ...never],
    };
  },

  "PH-3-X1": (programId) => {
    const scoped = findings.filter((f) => {
      const asset = assets.find((a) => a.id === f.asset);
      return asset?.program === programId && cooperativePaths.has(f.source);
    });
    const catI = scoped.filter((f) => isDeficiency(f) && f.mitigatedSeverity === "CAT I");
    const unresolved: string[] = [];
    for (const f of catI) {
      if (!isOpen(f)) continue;
      if (f.poam) continue;
      const risk = f.risk ? riskById.get(f.risk) : undefined;
      if (risk?.disposition === "Accepted") continue;
      unresolved.push(f.id);
    }
    const downgraded = scoped.filter(
      (f) => isDeficiency(f) && f.rawSeverity === "CAT I" && f.mitigatedSeverity !== "CAT I",
    );
    const met = unresolved.length === 0;
    const first = unresolved[0] ? findingById.get(unresolved[0]) : undefined;
    const firstRisk = first?.risk ? riskById.get(first.risk) : undefined;
    return {
      met,
      finding: met
        ? `${catI.length} CAT I ${plural(catI.length, "deficiency is", "deficiencies are")} on the cooperative record and every one is remediated, carries a POA&M item, or is AO-accepted. ${downgraded.length} further raw ${plural(downgraded.length, "CAT I is", "CAT Is are")} mitigated below CAT I (${nameList(downgraded.map((f) => f.id))}).`
        : `${catI.length} CAT I ${plural(catI.length, "deficiency is", "deficiencies are")} open on the cooperative record and ${unresolved.length} ${plural(unresolved.length, "is", "are")} not dispositioned: ${nameList(unresolved)}. ${first ? `${first.id} (${first.control} on ${first.asset}) is not remediated, carries no POA&M item, and its register risk ${first.risk ?? "—"} is ${firstRisk?.disposition ?? "not recorded"} rather than accepted.` : ""} ${downgraded.length} further raw ${plural(downgraded.length, "CAT I is", "CAT Is are")} mitigated below CAT I (${nameList(downgraded.map((f) => f.id))}) and ${plural(downgraded.length, "is", "are")} not counted here.`.trim(),
      evidence: [...unresolved, ...downgraded.map((f) => f.id)],
    };
  },

  "PH-3-X2": (programId) => {
    const scoped = findings.filter((f) => {
      const asset = assets.find((a) => a.id === f.asset);
      return asset?.program === programId;
    });
    const open = scoped.filter((f) => isOpen(f) && isDeficiency(f));
    const untracked = open.filter((f) => !f.poam && !f.risk);
    const tracked = open.length - untracked.length;
    return {
      met: untracked.length === 0,
      finding:
        untracked.length === 0
          ? `All ${open.length} open ${plural(open.length, "deficiency carries", "deficiencies carry")} a POA&M item or a register risk.`
          : `${tracked} of ${open.length} open deficiencies carry a POA&M item or a register risk. ${untracked.length} ${plural(untracked.length, "carries", "carry")} neither: ${untracked.map((f) => `${f.id} (${f.control}, ${f.mitigatedSeverity}, owner ${f.owner})`).join("; ")}.`,
      evidence: untracked.map((f) => f.id),
    };
  },

  "PH-4-X1": (programId) => {
    const phase = phaseById.get("PH-4");
    const campaignIds = (phase?.campaigns ?? []).filter(
      (id) => campaignById.get(id)?.program === programId,
    );
    const runs = campaignIds.flatMap((id) => runsForCampaign(id));
    const pending = runs.filter((r) => r.state === "Planned" || r.state === "In progress");
    const aborted = runs.filter((r) => r.state === "Aborted");
    const orphanAborts: string[] = [];
    const rerun: string[] = [];
    for (const r of aborted) {
      const later = runs.find(
        (o) =>
          o.id !== r.id &&
          o.procedure === r.procedure &&
          o.state === "Complete" &&
          stampOf(dayOf(o.completed)) >= stampOf(dayOf(r.completed)),
      );
      if (later) rerun.push(`${r.id} re-run to completion as ${later.id} on ${r.procedure}`);
      else orphanAborts.push(r.id);
    }
    const complete = runs.filter((r) => r.state === "Complete");
    const verdicts = complete.filter((r) => runVerdict(r.id) !== null);
    const met = pending.length === 0 && orphanAborts.length === 0;
    return {
      met,
      finding: met
        ? `${runs.length} runs are recorded against ${nameList(campaignIds)}; ${verdicts.length} completed with a computed verdict and none is left planned or in progress. ${rerun.length > 0 ? `${nameList(rerun, 2)}.` : ""}`.trim()
        : `${verdicts.length} of ${runs.length} runs against ${nameList(campaignIds)} reached a computed verdict. ${pending.length > 0 ? `${nameList(pending.map((r) => `${r.id} (${r.state})`))} ${plural(pending.length, "is", "are")} still outstanding.` : ""}${orphanAborts.length > 0 ? ` ${nameList(orphanAborts)} ${plural(orphanAborts.length, "was", "were")} aborted with no later completed run on the same procedure.` : ""}`.trim(),
      evidence: [
        ...pending.map((r) => r.id),
        ...orphanAborts,
        ...verdicts.slice(0, 3).map((r) => r.id),
      ],
    };
  },

  "PH-4-X2": (programId) => {
    const phase = phaseById.get("PH-4");
    const campaignIds = (phase?.campaigns ?? []).filter(
      (id) => campaignById.get(id)?.program === programId,
    );
    const objectiveIds = [...new Set(campaignIds.flatMap((id) => objectivesForCampaign(id)))];
    const disagreeing = objectiveIds.filter((id) => objectiveDisagrees(id));
    const unprocedured = objectiveIds.filter((id) => proceduresForObjective(id).length === 0);
    const resolved = objectiveIds
      .filter((id) => !unprocedured.includes(id))
      .map((id) => {
        const r = resolvedObjectiveResult(id);
        return `${id} resolves to ${r.result} from ${r.run ?? "its declared value"}`;
      });
    return {
      met: disagreeing.length === 0,
      finding:
        disagreeing.length === 0
          ? `${objectiveIds.length} objectives are declared across ${nameList(campaignIds)} and none disagrees with the result its runs produced — ${nameList(resolved, 2)}. ${unprocedured.length > 0 ? `${nameList(unprocedured)} ${plural(unprocedured.length, "has", "have")} no written procedure, so ${plural(unprocedured.length, "its", "their")} declared value stands unverified; that is a coverage caveat, not a disagreement.` : ""}`.trim()
          : `${disagreeing.length} of ${objectiveIds.length} objectives declare a result their runs contradict: ${nameList(disagreeing)}.`,
      evidence: [...disagreeing, ...unprocedured],
    };
  },

  "PH-5-E1": (programId) => {
    const phase = phaseById.get("PH-5");
    const sctm = sctmFor(programId);
    const scopeControls = phase ? scopeControlsFor(phase) : [];
    const inScope = sctm.rows.filter((r) => scopeControls.includes(r.control));
    const unevidenced = inScope.filter((r) => r.evidence.length === 0);
    const met = unevidenced.length === 0;
    return {
      met,
      finding: met
        ? `The assessment scope is ${scopeControls.length} ${plural(scopeControls.length, "control", "controls")} — ${nameList(scopeControls, 6)} — drawn from the findings the phase's campaigns actually raised. All ${inScope.length} of their SCTM rows carry at least one evidence artifact. Across the whole ${sctm.rows.length}-row matrix ${sctm.unevidenced} rows are unevidenced, but none of them is in scope for this phase.`
        : `${inScope.length - unevidenced.length} of ${inScope.length} SCTM rows on the ${scopeControls.length} in-scope controls (${nameList(scopeControls, 6)}) carry evidence; ${unevidenced.length} do not: ${nameList(unevidenced.map((r) => r.key))}.`,
      evidence:
        unevidenced.length > 0
          ? unevidenced.slice(0, 4).map((r) => r.key)
          : inScope.slice(0, 4).map((r) => r.key),
    };
  },

  "PH-5-X1": (programId) => {
    const scoped = scenariosForPhase("PH-5", programId);
    const executed = scoped.filter((s) => s.status === "Executed");
    const waived = scoped.filter((s) => s.status === "Not exercised");
    const outstanding = scoped.filter(
      (s) => s.status === "Approved" || s.status === "Proposed" || s.status === "Blocked",
    );
    const met = outstanding.length === 0;
    return {
      met,
      finding: met
        ? `All ${scoped.length} CVPA scenarios are accounted for: ${executed.length} executed and ${waived.length} formally waived.`
        : `${executed.length} of ${scoped.length} CVPA scenarios have been executed and ${waived.length} ${plural(waived.length, "is", "are")} formally waived. ${outstanding.length} ${plural(outstanding.length, "remains", "remain")} outstanding: ${outstanding.map((s) => `${s.id} (${s.status}${s.event ? `, ${s.event}` : ""})`).join("; ")}.`,
      evidence: [...outstanding.map((s) => s.id), ...executed.slice(0, 3).map((s) => s.id)],
    };
  },

  "PH-6-E1": (programId) => {
    const authorized = authorizedBuild(programId);
    const candidate = candidateBuild(programId);
    const significant = changesForProgram(programId).filter(
      (c) => c.impact === "Significant" && !c.acknowledged,
    );
    const againstAuthorized = authorized
      ? significant.filter((c) => c.build === authorized.id)
      : significant;
    const staged = candidate ? significant.filter((c) => c.build === candidate.id) : [];
    const met = authorized !== null && againstAuthorized.length === 0;
    if (!authorized) {
      return {
        met: false,
        finding: `${programId} has no build in the Authorized baseline state, so there is no authorized configuration for the assessment to run against.`,
        evidence: [],
      };
    }
    return {
      met,
      finding: met
        ? `The configuration under test is ${authorized.id} "${authorized.name}", authorized on ${authorized.approved}, with no unacknowledged Significant change filed against it. ${staged.length} Significant ${plural(staged.length, "change is", "changes are")} staged in the ${candidate?.id ?? "candidate"} build and do not affect the configuration in force.`
        : `The configuration under test is ${authorized.id} "${authorized.name}", authorized on ${authorized.approved}. ${againstAuthorized.length} Significant ${plural(againstAuthorized.length, "change is", "changes are")} filed against it and unacknowledged — ${againstAuthorized.map((c) => `${c.id} (${c.kind}, ${c.requested})`).join("; ")}. A further ${staged.length} ${plural(staged.length, "is", "are")} staged in ${candidate?.id ?? "the candidate build"} and would move the baseline under the assessment if it is authorized mid-execution.`,
      evidence: [authorized.id, ...againstAuthorized.map((c) => c.id), ...staged.map((c) => c.id)],
    };
  },

  "PH-6-X1": () => {
    const confirmed = missionEffects.filter((e) => e.effect !== "No effect");
    const noEffect = missionEffects.length - confirmed.length;
    const gaps = confirmed.filter(
      (e) => e.findings.length === 0 || e.workaround === "None identified",
    );
    const met = gaps.length === 0;
    return {
      met,
      finding: met
        ? `All ${confirmed.length} confirmed mission effects carry a finding and an operator workaround. ${noEffect} further ${plural(noEffect, "scenario was", "scenarios were")} executed with no mission effect and ${plural(noEffect, "is", "are")} recorded as such.`
        : `${confirmed.length - gaps.length} of ${confirmed.length} confirmed mission effects carry both a finding and an operator workaround. ${gaps
            .map((e) => {
              const missing: string[] = [];
              if (e.findings.length === 0) missing.push("no finding raised");
              if (e.workaround === "None identified") missing.push("no operator workaround");
              return `${e.id} (${e.effect} — ${e.missionFunction}) has ${missing.join(" and ")}`;
            })
            .join(
              "; ",
            )}. ${noEffect} further ${plural(noEffect, "scenario was", "scenarios were")} executed with no mission effect.`,
      evidence: gaps.map((e) => e.id),
    };
  },

  "PH-6-X2": (programId) => {
    const executed = scenariosForProgram(programId).filter((s) => s.status === "Executed");
    const nodes = [...new Set(executed.flatMap((s) => s.path))];
    const invalidated: string[] = [];
    const suspect: string[] = [];
    for (const nodeId of nodes) {
      const state = nodeImpact(programId, nodeId);
      if (state === "Invalidated") invalidated.push(nodeId);
      else if (state === "Suspect") suspect.push(nodeId);
    }
    const met = invalidated.length === 0;
    const named = invalidated
      .map((id) => `${id} (${nodeById.get(id)?.name ?? "unknown node"})`)
      .join("; ");
    return {
      met,
      finding: met
        ? `${nodes.length} distinct nodes sit on the ${executed.length} executed scenario paths and none is Invalidated. ${suspect.length} ${plural(suspect.length, "is", "are")} Suspect — a change moved something they contain, which flags them for the assessor without retracting the result.`
        : `${nodes.length} distinct nodes sit on the ${executed.length} executed scenario paths. ${invalidated.length} ${plural(invalidated.length, "is", "are")} Invalidated by an unacknowledged Significant change — ${named} — so any determination taken along ${plural(invalidated.length, "that path", "those paths")} was taken on a configuration that no longer exists. A further ${suspect.length} ${plural(suspect.length, "is", "are")} Suspect (${nameList(suspect, 4)}).`,
      evidence: [...invalidated, ...suspect.slice(0, 4)],
    };
  },
};

/* ── Evaluation ──────────────────────────────────────────────────────────── */

/**
 * Evaluate one criterion against live data.
 *
 * A `Derived` criterion is computed and returns a sentence with real numbers. An
 * `Attested` criterion reports its signature, or says plainly that there is
 * none — the platform cannot judge whether an ROE was negotiated in good faith,
 * and pretending otherwise would be the checkbox this module exists to avoid.
 */
export function evaluateCriterion(
  criterionId: string,
  programId: string,
  asOf: string = datasetToday,
): CriterionResult | null {
  const criterion = criterionById.get(criterionId);
  if (!criterion) return null;
  const phase = phaseById.get(criterion.phase);
  if (!phase || phase.program !== programId) return null;

  if (criterion.basis === "Attested") {
    const signed = criterion.attestedBy !== "—" && criterion.attestedOn !== "—";
    return {
      criterion: criterionId,
      met: signed,
      finding: signed
        ? `Attested by ${criterion.attestedBy} on ${criterion.attestedOn}. No platform can judge this one; the signature is the evidence.`
        : "Not attested — no signature is on file. The platform cannot judge this criterion, so it counts as unmet until a signer and a date are recorded.",
      evidence: [],
    };
  }

  const derive = derivations[criterionId];
  if (!derive) {
    return {
      criterion: criterionId,
      met: false,
      finding: `${criterionId} is declared Derived but no derivation is registered for it, so it cannot be judged.`,
      evidence: [],
    };
  }
  const computed = derive(programId, asOf);
  return { criterion: criterionId, ...computed };
}

export function phaseReadiness(
  phaseId: TePhaseId,
  programId: string,
  asOf: string = datasetToday,
): PhaseReadiness {
  const entry = criteriaFor(phaseId, "Entry")
    .map((c) => evaluateCriterion(c.id, programId, asOf))
    .filter((r): r is CriterionResult => r !== null);
  const exit = criteriaFor(phaseId, "Exit")
    .map((c) => evaluateCriterion(c.id, programId, asOf))
    .filter((r): r is CriterionResult => r !== null);

  const entryMet = entry.filter((r) => r.met).length;
  const exitMet = exit.filter((r) => r.met).length;
  const canEnter = entry.length > 0 && entryMet === entry.length;
  const canExit = canEnter && exit.length > 0 && exitMet === exit.length;

  const firstUnmet = entry.find((r) => !r.met) ?? exit.find((r) => !r.met) ?? null;

  return {
    phase: phaseId,
    entry,
    exit,
    entryMet,
    entryTotal: entry.length,
    exitMet,
    exitTotal: exit.length,
    canEnter,
    canExit,
    blocker: firstUnmet ? `${firstUnmet.criterion} — ${firstUnmet.finding}` : "—",
  };
}

/** Readiness for every phase of a program, in phase order. */
export function programReadiness(programId: string, asOf: string = datasetToday): PhaseReadiness[] {
  return phasesForProgram(programId).map((p) => phaseReadiness(p.id, programId, asOf));
}
