/**
 * The CCI spine — one object model, one status vocabulary.
 *
 * Rules encoded here (see §02–§03 of the IA spec):
 *  - Every object type owns exactly one ID prefix, globally unique, never reused.
 *  - Every status field belongs to exactly one vocabulary; no value appears twice.
 *  - Severity owns red / orange / olive. The accent hue is interaction only.
 *    Green means only "settled and good". Everything else is a neutral chip.
 */

import type { Tone } from "@/components/app/ui";

export type ObjectKind =
  | "program"
  | "system"
  | "component"
  | "asset"
  | "requirement"
  | "control"
  | "overlay"
  | "cci"
  | "benchmark"
  | "rule"
  | "campaign"
  | "event"
  | "finding"
  | "poam"
  | "risk"
  | "evidence"
  | "package";

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
    label: "Component",
    what: "Reusable inheritable definition — an IdP, a landing zone, a platform. Not an instance.",
    relates: "provides CCIs to many Programs",
  },
  asset: {
    prefix: "AST-",
    label: "Asset",
    what: "A concrete host, container image, network device or application instance in a boundary.",
    relates: "carries a Technology; scans and checklists attach here",
  },
  requirement: {
    prefix: "REQ-",
    label: "Capability requirement",
    what: "CSA 01–10 with its CSRC tier, plus derived technical requirements.",
    relates: "allocates to Controls and to Test objectives",
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
  testEventState: {
    object: "Test event",
    field: "State",
    source: "Cyber DT&E continuum",
    values: ["Planned", "Readiness review", "Executing", "Data reduction", "Reported", "Cancelled"],
  },
  authorization: {
    object: "Program",
    field: "Authorization",
    source: "DoD authorization types",
    values: [
      "Not authorized",
      "IATT",
      "ATO with conditions",
      "ATO",
      "cATO",
      "DATO",
      "Expired",
    ],
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
} as const;

export type VocabularyKey = keyof typeof vocabularies;

export type ControlImplementation =
  (typeof vocabularies.controlImplementation.values)[number];
export type ControlAssessment = (typeof vocabularies.controlAssessment.values)[number];
export type CciCompliance = (typeof vocabularies.cciCompliance.values)[number];
export type ChecklistStatus = (typeof vocabularies.checklistStatus.values)[number];
export type FindingSeverity = (typeof vocabularies.findingSeverity.values)[number];
export type FindingLifecycle = (typeof vocabularies.findingLifecycle.values)[number];
export type PoamStatus = (typeof vocabularies.poamStatus.values)[number];
export type RiskDisposition = (typeof vocabularies.riskDisposition.values)[number];
export type TestEventState = (typeof vocabularies.testEventState.values)[number];
export type AuthorizationState = (typeof vocabularies.authorization.values)[number];
export type GateState = (typeof vocabularies.gateState.values)[number];
export type PackageReviewState = (typeof vocabularies.packageReview.values)[number];

/* ── Colour rules ────────────────────────────────────────────────────────── */

/**
 * Green only for settled-and-good. Red/orange only for severity or a blocking
 * exception. Everything else is a neutral outline chip.
 */
const settled = new Set<string>([
  "Satisfied",
  "Compliant",
  "Not a Finding",
  "Closed",
  "Accepted",
  "Complete",
  "Completed",
  "Implemented",
  "SCA accepted",
  "Reported",
  "ATO",
  "cATO",
]);

const blocking = new Set<string>([
  "Other than satisfied",
  "Non-compliant",
  "Open",
  "Slipped",
  "Overdue",
  "Rejected",
  "DATO",
  "Expired",
  "Not authorized",
  "CAT I",
  "Returned",
]);

const caution = new Set<string>([
  "At risk",
  "Not implemented",
  "Pending AO",
  "Retest pending",
  "CAT II",
  "ATO with conditions",
  "IATT",
  "Deferred",
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
