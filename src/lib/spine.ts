/**
 * The CCI spine — one object model, one status vocabulary.
 *
 * Rules encoded here (see §02–§03 of the IA spec):
 *  - Every object type owns exactly one ID prefix, and no two registry entries
 *    share one. That is weaker than "globally unique across every string in the
 *    product": the ConMon alert prefix "CM-" is also the natural-key prefix of
 *    the 800-53 Configuration Management family, so "CM-6" is a control and
 *    "CM-0004" is an alert. Controls are the one object with no synthetic
 *    prefix (`"—"` below) precisely because they carry natural keys, so nothing
 *    in the registry is duplicated — but never resolve an object kind by
 *    string prefix alone, and nothing in the app does.
 *  - Every status field belongs to exactly one vocabulary, and a vocabulary is
 *    the only place a field's legal values are declared. A few words ("Planned",
 *    "Complete", "In progress", "Not applicable", "Not assessed", "Open",
 *    "Rejected", "Risk accepted") deliberately recur across vocabularies because
 *    the domain uses the same word for the same idea in two places; `statusTone`
 *    is a flat lookup, so those words share one tone by design rather than by
 *    accident. "Draft" and "Evidence stale" recur the same way; "Evidence
 *    stale" is also a `ComponentHealth` value in `reusable-components.ts`,
 *    whose own tone map already reads it as warning, so the flat lookup and
 *    that map agree. The T&E phase model added five more recurrences:
 *    "Not started", "Planning", "Executing" and "Reporting" (a phase state
 *    reuses the campaign state and the gate state wording on purpose, and
 *    all four stay neutral), "Approved" (also a tailoring approval state,
 *    also neutral), "Blocked" (also a gate status, a workstream status and
 *    a remediation task status — all three of those already publish it as
 *    danger in their own maps, so the flat lookup agrees), "Degraded" (also
 *    a `ConnectorHealth` value whose map already reads warning) and "Very
 *    high" (also the top `ResidualRisk.residual` level, whose `residualTone`
 *    already reads danger). Continuous monitoring added four more: "Current"
 *    (an assessment schedule status, an `InheritanceState`, an SCTM
 *    `RowCurrency`, a `ComponentHealth` and a package artifact state — five
 *    vocabularies, all meaning "up to date", and left NEUTRAL here because
 *    `rowCurrencyTone` and `inheritanceStateTone` already publish it as
 *    success where it is a status and the word is also a plain column label),
 *    "Overdue" (a POA&M status and an assessment schedule status — already
 *    blocking, and both readings want danger), "Expired" (an authorization
 *    state and an evidence freshness class — already blocking, and
 *    `evidence.tsx` reads it as danger too) and "Automated"/"Manual" (SLCM
 *    methods, a test-objective method and an evidence collector — all three
 *    stay neutral, since a method is a property, not a status).
 *  - The values deliberately LEFT OUT of the sets, beyond "High" below:
 *    "Due" (an assessment that is scheduled and not yet late is not a caution,
 *    and today the word is only ever a field label), "Changed" and "Added on
 *    this side" (a reconciliation difference is a fact to read, not a verdict),
 *    "Minor drift", "Never assessed", and the ConMon alert severities
 *    "Critical"/"High"/"Moderate"/"Low" — those four are also categorization
 *    impact levels, control baseline levels, Nessus risk factors and POA&M
 *    severities across 15 files, so `alertSeverityTone` in `conmon.ts` owns
 *    their colour. Evidence freshness ("Fresh", "Aging", "Stale", "Never
 *    collected") is likewise owned by `freshnessTone`; only its "Expired"
 *    value lands here, and only because the authorization vocabulary put it
 *    there first.
 *  - "High" is the one risk-band value deliberately LEFT OUT of the sets.
 *    The word is also a categorization impact level, a control baseline
 *    level, a Nessus risk factor and a POA&M severity; `programs.tsx` and
 *    `authorization.ts` already render it as danger, so a caution entry here
 *    would contradict them and tint every High-baseline chip in the product.
 *    Risk bands take their colour from `bandTone` in `risk-scoring.ts` —
 *    the same second pattern `programStatusTone` and `gateStatusTone` use.
 *  - Severity owns red / orange / olive. The accent hue is interaction only.
 *    Green means only "settled and good". Everything else is a neutral chip.
 */

import type { Tone } from "@ledger/design-system";

export type ObjectKind =
  | "program"
  | "system"
  | "component"
  | "asset"
  | "node"
  | "bom"
  | "build"
  | "change"
  | "requirement"
  | "allocation"
  | "process"
  | "control"
  | "overlay"
  | "cci"
  | "benchmark"
  | "rule"
  | "phase"
  | "campaign"
  | "event"
  | "procedure"
  | "run"
  | "scenario"
  | "effect"
  | "scan"
  | "finding"
  | "poam"
  | "risk"
  | "alert"
  | "evidence"
  | "package"
  | "bundle";

export const objectRegistry: Record<
  ObjectKind,
  { prefix: string; label: string; what: string; relates: string }
> = {
  program: {
    prefix: "PRG-",
    label: "Program",
    what: "One system pursuing one authorization. The root record.",
    relates: "has one System, one lifecycle, many Test campaigns",
  },
  system: {
    prefix: "SYS-",
    label: "System & boundary",
    what: "Authorization boundary, data flows, interconnections, categorization inputs.",
    relates: "composed of Components; produces the boundary diagram",
  },
  component: {
    prefix: "CMP-",
    label: "Provider",
    what: "Reusable inheritable capability — an IdP, a landing zone, a signing enclave, a provisioning line. Not an instance, and not part of any one system.",
    relates: "offers inheritable controls to many Programs; receives Requirement allocations",
  },
  asset: {
    prefix: "AST-",
    label: "Asset",
    what: "A concrete host, container image, network device or application instance in a boundary.",
    relates: "carries a Technology; scans and checklists attach here",
  },
  node: {
    prefix: "CN-",
    label: "Component",
    what: "One part of the system as built — a subsystem, chassis, board, chip, bootloader, OS, container or package. The line-replaceable ones are the LRUs; the taxonomy does not separate them, because what is field-swappable is a property of the part, not a different kind of thing.",
    relates:
      "hangs beneath a parent Component; anchors an Asset; receives Requirement allocations; reaches Controls only by derived trace",
  },
  bom: {
    prefix: "BOM-",
    label: "BOM document",
    what: "One delivered CycloneDX, SPDX, hardware part list or firmware manifest, with its hash and producer.",
    relates: "asserts a subtree of Composition nodes",
  },
  build: {
    prefix: "BLD-",
    label: "Build baseline",
    what: "One configuration baseline — every Composition node pinned to a version and digest, with the organization-defined parameter values in force when the CCB approved it.",
    relates:
      "pins Composition nodes for one Program; supersedes an earlier build; Change records are raised against it",
  },
  change: {
    prefix: "CHG-",
    label: "Change record",
    what: "One proposed configuration change carrying its CM-3(2) security impact analysis — the verdict that decides whether prior determinations still hold.",
    relates:
      "raised against a Build; scoped to a Composition node, a control parameter or a provider; invalidates SCTM rows, Evidence and inheritance",
  },
  requirement: {
    prefix: "REQ-",
    label: "Security requirement",
    what: "An engineering shall statement the system owns, with its own provenance. Derives from a control statement, an overlay, policy, a threat, an architecture decision or a finding — never from only one of them by construction.",
    relates:
      "decomposes into child Requirements; allocates to Nodes, provider Components and Processes; the Controls it reaches are computed, never stored",
  },
  allocation: {
    prefix: "ALC-",
    label: "Allocation",
    what: "One element's bounded share of one requirement — responsibility, coverage and the scope of the claim. The record that replaces a component column on a control row.",
    relates: "joins one Requirement to one Node, provider Component or Process",
  },
  process: {
    prefix: "PRC-",
    label: "Security process",
    what: "An operational, manufacturing or maintenance process that carries security obligations — a key ceremony, a release gate, a provisioning step. Outside the boundary, inside the argument.",
    relates: "receives Requirement allocations; produces evidence",
  },
  control: {
    prefix: "—",
    label: "Control",
    what: "800-53 Rev 5 control or enhancement as tailored by overlays. Natural key: AC-2(3).",
    relates: "decomposes into CCIs; scoped by Overlay",
  },
  overlay: {
    prefix: "OVL-",
    label: "Overlay",
    what: "CNSSI 1253 appendix — classified, tactical/DDIL, space, safety. Carries its own delta.",
    relates: "modifies the Control set for a Program",
  },
  cci: {
    prefix: "CCI-",
    label: "CCI",
    what: "DISA control correlation identifier. The join key. Natural key: CCI-000213.",
    relates: "belongs to a Control; covered by Rules, Procedures, Objectives",
  },
  benchmark: {
    prefix: "BM-",
    label: "Benchmark",
    what: "A STIG or SRG at a specific version.",
    relates: "applies to a Technology; contains Rules",
  },
  rule: {
    prefix: "V-",
    label: "Rule",
    what: "A single machine-checkable setting. Natural key: V-222387.",
    relates: "maps to one or more CCIs",
  },
  phase: {
    prefix: "PH-",
    label: "T&E phase",
    what: "One of the six DoD Cybersecurity T&E phases — requirements, attack surface, cooperative vulnerability identification, adversarial DT&E, CVPA, adversarial assessment — carrying the entry and exit criteria that gate it.",
    relates:
      "sequenced within one Program; executed by Test campaigns; informs one RMF gate; judged from the SCTM, Findings, Scan runs and Test runs",
  },
  campaign: {
    prefix: "TC-",
    label: "Test campaign",
    what: "A scoped body of cyber T&E work opened against a trigger condition.",
    relates: "contains Events; scoped to a Program",
  },
  event: {
    prefix: "TE-",
    label: "Test event",
    what: "One execution — cooperative or adversarial.",
    relates: "proves Test objectives; yields Findings",
  },
  procedure: {
    prefix: "TP-",
    label: "Test procedure",
    what: "The written steps that prove one Test objective — action, pass criterion and the artifact to collect, at a stated version.",
    relates: "executes one Test objective; executed by many Test runs",
  },
  run: {
    prefix: "TR-",
    label: "Test run",
    what: "One execution of a Procedure against a named build and configuration, with a per-step record of what was observed.",
    relates: "runs one Procedure at one Test event; may retest an earlier Run; yields Findings",
  },
  scenario: {
    prefix: "THR-",
    label: "Threat scenario",
    what: "One adversary storyline at a stated tier — the objective in mission terms, the assumed entry point and the ordered ATT&CK technique chain, walked over a real path through the composition graph.",
    relates:
      "exercises one T&E phase; enters at a Composition node and traverses others; executed by a Test event; produces Mission effects",
  },
  effect: {
    prefix: "MEF-",
    label: "Mission effect",
    what: "What an executed threat scenario actually did to a mission function — degraded, denied, manipulated, destroyed, exfiltrated, or nothing at all. The unit an adversarial assessment is scored in, not the finding count.",
    relates:
      "observed on one Threat scenario; confirmed by a Test run or Test event; raises Findings; drives the mission factor of a residual score",
  },
  scan: {
    prefix: "SCN-",
    label: "Scan run",
    what: "One tool execution against one set of targets — a STIG checklist, a SCAP evaluation, an ACAS job, a SAST analysis, an SBOM/VEX ingest, a fuzzing campaign, a firmware image analysis.",
    relates:
      "supersedes an earlier run of the same format and target; normalizes into results that dedupe into Findings",
  },
  finding: {
    prefix: "FND-",
    label: "Finding",
    what: "A technical fact from any verification path, with raw and mitigated severity.",
    relates: "against one CCI and one Asset; rolls up to a Risk",
  },
  poam: {
    prefix: "POAM-",
    label: "POA&M item",
    what: "The remediation commitment: scheduled completion, milestones, resources, funding.",
    relates: "closes one or more Findings",
  },
  risk: {
    prefix: "RSK-",
    label: "Risk",
    what: "A mission-level statement the AO accepts or rejects. Impact terms, not settings.",
    relates: "aggregates Findings; carries residual after mitigation",
  },
  alert: {
    prefix: "CM-",
    label: "ConMon alert",
    what: "One divergence between the authorized state and the running state, raised by continuous monitoring — an unrecorded change, an invalidated determination, expired evidence, a missed assessment or scan window, a slipped POA&M date, drifted inheritance, an expiring authorization.",
    relates:
      "derived for one Program, never authored; names the object that diverged and cites the Change, Finding, Evidence, Scan run or POA&M item it was computed from",
  },
  evidence: {
    prefix: "EVD-",
    label: "Evidence artifact",
    what: "Scan output, checklist, screenshot, config export, test report, engineering ticket.",
    relates: "attaches to a CCI, a Finding, or a Test event",
  },
  package: {
    prefix: "PKG-",
    label: "Authorization package",
    what: "Versioned, lockable assembly of SSP, SAR, POA&M and attachments.",
    relates: "submitted to SCA; decided by AO",
  },
  bundle: {
    prefix: "BND-",
    label: "Transfer bundle",
    what: "One air-gap transfer set — the OSCAL documents and eMASS exports generated for a Build, each artifact carrying its own digest, under one manifest hash and signature block.",
    relates:
      "describes one Build of one Program; reconciled path by path against a bundle received from the other side of the gap",
  },
};

/* ── Status vocabularies ─────────────────────────────────────────────────── */

export const vocabularies = {
  controlImplementation: {
    object: "Control",
    field: "Implementation",
    source: "RMF / SSP convention",
    values: [
      "Not implemented",
      "Planned",
      "Partially implemented",
      "Implemented",
      "Inherited",
      "Not applicable",
    ],
  },
  controlAssessment: {
    object: "Control",
    field: "Assessment result",
    source: "NIST SP 800-53A",
    values: ["Not assessed", "Satisfied", "Other than satisfied", "Not applicable"],
  },
  controlOrigination: {
    object: "Control",
    field: "Origination",
    source: "NIST SP 800-53 §2.4 / eMASS",
    values: ["System specific", "Common", "Hybrid"],
  },
  controlDesignation: {
    object: "Control",
    field: "Security control designation",
    source: "NIST SP 800-53 §2.4 / eMASS",
    values: ["Common", "Hybrid", "System-Specific"],
  },
  responsibilityShare: {
    object: "Inherited control",
    field: "Responsibility",
    source: "Shared responsibility model — who implements, not who is authorized",
    values: ["Provider", "Consumer", "Shared"],
  },
  ccpTier: {
    object: "Component",
    field: "Common control provider tier",
    source: "eMASS common control provider — nearest provider last",
    values: ["DoD", "Component", "Enclave", "System"],
  },
  inheritanceState: {
    object: "Inherited control",
    field: "State",
    source: "Product-defined — the consumer's standing view of the provider's offer",
    values: [
      "Current",
      "Provider failed",
      "Version drift",
      "Evidence stale",
      "Not applicable",
      "Revoked",
    ],
  },
  slcmFrequency: {
    object: "Control",
    field: "SLCM frequency",
    source: "eMASS system-level continuous monitoring — verbatim",
    values: [
      "Constantly",
      "Daily",
      "Weekly",
      "Monthly",
      "Quarterly",
      "Semi-Annually",
      "Annually",
      "Every Two Years",
      "Every Three Years",
    ],
  },
  slcmMethod: {
    object: "Control",
    field: "SLCM method",
    source: "eMASS system-level continuous monitoring",
    values: ["Automated", "Semi-Automated", "Manual", "Undetermined"],
  },
  /**
   * "Never assessed" is a SCHEDULE fact — the ConMon strategy names a control
   * nobody has looked at yet. It is not the 800-53A determination
   * "Not assessed" in `controlAssessment`, and a control whose determination is
   * "Other than satisfied" still carries a schedule status here. Never collapse
   * the two: that is how a deficiency gets laundered into "Not assessed".
   */
  assessmentStatus: {
    object: "Control",
    field: "Assessment schedule status",
    source: "Product-defined — derived from last assessed plus the SLCM frequency, never authored",
    values: ["Current", "Due", "Overdue", "Never assessed"],
  },
  verificationMethod: {
    object: "SCTM row",
    field: "Verification method",
    source: "DoD T&E — Test / Demonstration / Analysis / Inspection",
    values: ["Test", "Demonstration", "Analysis", "Inspection"],
  },
  nodeCriticality: {
    object: "Composition node",
    field: "Criticality",
    source: "DoDI 5200.44 criticality analysis",
    values: ["Mission critical", "Mission essential", "Mission support", "Non-critical"],
  },
  trustZone: {
    object: "Composition node",
    field: "Trust zone",
    source: "Product-defined",
    values: ["Public", "DMZ", "Enclave", "Management", "Isolated"],
  },
  buildState: {
    object: "Build",
    field: "Configuration state",
    source: "NIST SP 800-53 CM-2 baseline configuration",
    values: ["Draft", "Under test", "Authorized baseline", "Superseded"],
  },
  securityImpact: {
    object: "Change record",
    field: "Security impact",
    source: "NIST SP 800-53 CM-3(2) security impact analysis",
    values: ["None", "Administrative", "Significant"],
  },
  cciCompliance: {
    object: "CCI",
    field: "Compliance",
    source: "eMASS convention",
    values: ["Compliant", "Non-compliant", "Not applicable", "Not assessed"],
  },
  checklistStatus: {
    object: "Rule result",
    field: "Checklist status",
    source: "STIG Viewer — verbatim",
    values: ["Not a Finding", "Open", "Not Applicable", "Not Reviewed"],
  },
  scanState: {
    object: "Scan run",
    field: "Ingestion state",
    source: "Product-defined",
    values: ["Received", "Normalized", "Reconciled", "Rejected"],
  },
  findingSeverity: {
    object: "Finding",
    field: "Severity",
    source: "Raw and mitigated shown separately",
    values: ["CAT I", "CAT II", "CAT III"],
  },
  findingLifecycle: {
    object: "Finding",
    field: "Lifecycle",
    source: "Product-defined",
    values: [
      "Open",
      "Triaged",
      "Remediating",
      "Retest pending",
      "Closed",
      "Risk accepted",
      "False positive",
    ],
  },
  poamStatus: {
    object: "POA&M",
    field: "Status",
    source: "eMASS convention",
    values: ["Ongoing", "Completed", "Risk accepted", "Overdue"],
  },
  riskDisposition: {
    object: "Risk",
    field: "AO disposition",
    source: "Product-defined",
    values: ["Pending AO", "Accepted", "Deferred", "Rejected"],
  },
  riskBand: {
    object: "Residual score",
    field: "Band",
    source: "Product-defined — the 0–100 residual score bucketed for reading",
    values: ["Very low", "Low", "Moderate", "High", "Very high"],
  },
  driftBand: {
    object: "Program",
    field: "Authorization drift band",
    source: "Product-defined — the 0–100 drift score bucketed for reading",
    values: ["Aligned", "Minor drift", "Material drift", "Diverged"],
  },
  phaseState: {
    object: "T&E phase",
    field: "State",
    source: "DoD Cybersecurity T&E Guidebook — phase execution",
    values: ["Not started", "Planning", "Executing", "Reporting", "Complete"],
  },
  scenarioStatus: {
    object: "Threat scenario",
    field: "Status",
    source: "Product-defined — the test team's standing view of the scenario",
    values: ["Proposed", "Approved", "Executed", "Blocked", "Not exercised"],
  },
  effectKind: {
    object: "Mission effect",
    field: "Effect",
    source: "Adversarial assessment mission-effect taxonomy",
    values: ["No effect", "Degraded", "Denied", "Manipulated", "Destroyed", "Exfiltrated"],
  },
  adversaryTier: {
    object: "Threat scenario",
    field: "Adversary tier",
    source: "DoD Cyber Table Top adversary tiers I–VI",
    values: ["I", "II", "III", "IV", "V", "VI"],
  },
  testEventState: {
    object: "Test event",
    field: "State",
    source: "Cyber DT&E continuum",
    values: ["Planned", "Readiness review", "Executing", "Data reduction", "Reported", "Cancelled"],
  },
  stepResult: {
    object: "Procedure step",
    field: "Result",
    source: "T&E procedure step record",
    values: ["Pass", "Fail", "Inconclusive", "Not run"],
  },
  runState: {
    object: "Test run",
    field: "State",
    source: "Product-defined",
    values: ["Planned", "In progress", "Complete", "Aborted"],
  },
  authorization: {
    object: "Program",
    field: "Authorization",
    source: "DoD authorization types",
    values: ["Not authorized", "IATT", "ATO with conditions", "ATO", "cATO", "DATO", "Expired"],
  },
  gateState: {
    object: "Gate",
    field: "Schedule state",
    source: "Product-defined",
    values: ["Not started", "In progress", "At risk", "Slipped", "Complete"],
  },
  packageReview: {
    object: "Package",
    field: "Review state",
    source: "Product-defined",
    values: ["Draft", "Locked", "Submitted", "In SCA review", "Returned", "SCA accepted"],
  },
  reconcileState: {
    object: "Bundle artifact",
    field: "Reconciliation state",
    source: "Product-defined — a received manifest compared path by path against the local one",
    values: ["Identical", "Changed", "Added on this side", "Missing on this side"],
  },
} as const;

export type VocabularyKey = keyof typeof vocabularies;

export type ControlImplementation = (typeof vocabularies.controlImplementation.values)[number];
export type ControlAssessment = (typeof vocabularies.controlAssessment.values)[number];
export type ControlOrigination = (typeof vocabularies.controlOrigination.values)[number];
export type ControlDesignation = (typeof vocabularies.controlDesignation.values)[number];
export type ResponsibilityShare = (typeof vocabularies.responsibilityShare.values)[number];
export type CcpTier = (typeof vocabularies.ccpTier.values)[number];
export type InheritanceState = (typeof vocabularies.inheritanceState.values)[number];
export type SlcmFrequency = (typeof vocabularies.slcmFrequency.values)[number];
export type SlcmMethod = (typeof vocabularies.slcmMethod.values)[number];
export type AssessmentStatus = (typeof vocabularies.assessmentStatus.values)[number];
export type VerificationMethod = (typeof vocabularies.verificationMethod.values)[number];
export type NodeCriticality = (typeof vocabularies.nodeCriticality.values)[number];
export type NodeTrustZone = (typeof vocabularies.trustZone.values)[number];
export type BuildState = (typeof vocabularies.buildState.values)[number];
export type SecurityImpact = (typeof vocabularies.securityImpact.values)[number];
export type CciCompliance = (typeof vocabularies.cciCompliance.values)[number];
export type ChecklistStatus = (typeof vocabularies.checklistStatus.values)[number];
export type ScanState = (typeof vocabularies.scanState.values)[number];
export type FindingSeverity = (typeof vocabularies.findingSeverity.values)[number];
export type FindingLifecycle = (typeof vocabularies.findingLifecycle.values)[number];
export type PoamStatus = (typeof vocabularies.poamStatus.values)[number];
export type RiskDisposition = (typeof vocabularies.riskDisposition.values)[number];
export type RiskBand = (typeof vocabularies.riskBand.values)[number];
export type DriftBand = (typeof vocabularies.driftBand.values)[number];
export type PhaseState = (typeof vocabularies.phaseState.values)[number];
export type ScenarioStatus = (typeof vocabularies.scenarioStatus.values)[number];
export type EffectKind = (typeof vocabularies.effectKind.values)[number];
export type AdversaryTier = (typeof vocabularies.adversaryTier.values)[number];
export type TestEventState = (typeof vocabularies.testEventState.values)[number];
export type StepResult = (typeof vocabularies.stepResult.values)[number];
export type RunState = (typeof vocabularies.runState.values)[number];
export type AuthorizationState = (typeof vocabularies.authorization.values)[number];
export type GateState = (typeof vocabularies.gateState.values)[number];
export type PackageReviewState = (typeof vocabularies.packageReview.values)[number];
export type ReconcileState = (typeof vocabularies.reconcileState.values)[number];

/* ── Colour rules ────────────────────────────────────────────────────────── */

/**
 * Green only for settled-and-good. Red/orange only for severity or a blocking
 * exception. Everything else is a neutral outline chip.
 */
const settled = new Set<string>([
  "Satisfied",
  "Compliant",
  "Not a Finding",
  "Pass",
  "Closed",
  "Accepted",
  "Complete",
  "Completed",
  "Implemented",
  "SCA accepted",
  "Reported",
  "ATO",
  "cATO",
  "Authorized baseline",
  "No effect",
  "Aligned",
  "Identical",
]);

const blocking = new Set<string>([
  "Other than satisfied",
  "Non-compliant",
  "Open",
  "Fail",
  "Slipped",
  "Overdue",
  "Rejected",
  "Aborted",
  "DATO",
  "Expired",
  "Not authorized",
  "CAT I",
  "Returned",
  "Provider failed",
  "Revoked",
  "Invalidated",
  "Blocked",
  "Denied",
  "Destroyed",
  "Exfiltrated",
  "Very high",
  "Diverged",
  "Missing on this side",
]);

const caution = new Set<string>([
  "At risk",
  "Not implemented",
  "Pending AO",
  "Retest pending",
  "Inconclusive",
  "CAT II",
  "ATO with conditions",
  "IATT",
  "Deferred",
  "Under test",
  "Version drift",
  "Evidence stale",
  "Significant",
  "Degraded",
  "Manipulated",
  "Material drift",
  "Undetermined",
]);

export function statusTone(value: string): Tone {
  if (settled.has(value)) return "success";
  if (blocking.has(value)) return "danger";
  if (caution.has(value)) return "warning";
  return "neutral";
}

/** Severity owns its own scale and is never rendered as the accent hue. */
export function severityTone(sev: FindingSeverity): Tone {
  return sev === "CAT I" ? "danger" : sev === "CAT II" ? "warning" : "neutral";
}
