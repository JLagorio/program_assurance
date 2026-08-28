import type { Tone } from "@/components/app/ui";

/* ------------------------------------------------------------------ types */

export type ConnectorKind = "Jira" | "GitHub" | "GitLab" | "Cameo/SysML";
export type ConnectorHealth = "Connected" | "Degraded" | "Not connected";

export type Connector = {
  id: string;
  kind: ConnectorKind;
  project: string;
  scope: string;
  health: ConnectorHealth;
  lastSync: string;
  ingested: number;
  mapped: number;
};

export type MappingRuleSignal = "Label" | "Path glob" | "Commit trailer" | "SysML stereotype" | "Issue type";

export type MappingRule = {
  id: string;
  name: string;
  source: ConnectorKind;
  signal: MappingRuleSignal;
  match: string;
  controls: string[];
  confidence: "High" | "Medium" | "Low";
  enabled: boolean;
  hits: number;
  owner: string;
};

export type EvidenceStatus = "Auto-mapped" | "Accepted" | "Needs review" | "Rejected";
export type ArtifactKind = "Jira issue" | "Pull request" | "Merge request" | "SysML model" | "Drawing";

export type ThreadEvidence = {
  id: string;
  ref: string;
  kind: ArtifactKind;
  title: string;
  controls: string[];
  rule: string;
  status: EvidenceStatus;
  engineer: string;
  reviewer: string | null;
  closed: string;
  narrative: string;
  statement: string;
};

export type SspSection = {
  id: string;
  name: string;
  description: string;
  controls: number;
  evidence: number;
  ready: boolean;
  blocker: string | null;
};

/* ------------------------------------------------------------------ tones */

export const healthTone: Record<ConnectorHealth, Tone> = {
  Connected: "success",
  Degraded: "warning",
  "Not connected": "neutral",
};

export const evidenceStatusTone: Record<EvidenceStatus, Tone> = {
  "Auto-mapped": "info",
  Accepted: "success",
  "Needs review": "warning",
  Rejected: "danger",
};

export const artifactTone: Record<ArtifactKind, Tone> = {
  "Jira issue": "info",
  "Pull request": "neutral",
  "Merge request": "neutral",
  "SysML model": "info",
  Drawing: "neutral",
};

export const artifactShort: Record<ArtifactKind, string> = {
  "Jira issue": "Issue",
  "Pull request": "PR",
  "Merge request": "MR",
  "SysML model": "SysML",
  Drawing: "Drawing",
};

/* ------------------------------------------------------------------- data */

export const connectors: Connector[] = [
  {
    id: "CN-01",
    kind: "Jira",
    project: "TRIDENT-SW",
    scope: "Epics + stories in Cyber & Platform boards",
    health: "Connected",
    lastSync: "4 min ago",
    ingested: 1284,
    mapped: 386,
  },
  {
    id: "CN-02",
    kind: "GitHub",
    project: "navsea/trident-flight-sw",
    scope: "Merged PRs on main, signed commits",
    health: "Connected",
    lastSync: "11 min ago",
    ingested: 942,
    mapped: 214,
  },
  {
    id: "CN-03",
    kind: "GitLab",
    project: "il5/trident-ground-seg",
    scope: "MRs + pipeline SBOM artifacts",
    health: "Degraded",
    lastSync: "3 hr ago",
    ingested: 311,
    mapped: 64,
  },
  {
    id: "CN-04",
    kind: "Cameo/SysML",
    project: "Trident MBSE — Rev C",
    scope: "«security» stereotyped blocks and IBDs",
    health: "Connected",
    lastSync: "Yesterday",
    ingested: 178,
    mapped: 97,
  },
];

export const mappingRules: MappingRule[] = [
  {
    id: "MR-01",
    name: "Multifactor authentication",
    source: "Jira",
    signal: "Label",
    match: "sec:mfa OR component = Identity",
    controls: ["IA-2", "IA-2(1)", "IA-2(2)", "IA-5"],
    confidence: "High",
    enabled: true,
    hits: 34,
    owner: "Sarah Chen (SSE)",
  },
  {
    id: "MR-02",
    name: "Data-at-rest encryption",
    source: "GitHub",
    signal: "Path glob",
    match: "src/crypto/** , src/storage/kms/**",
    controls: ["SC-28", "SC-28(1)", "SC-13"],
    confidence: "High",
    enabled: true,
    hits: 21,
    owner: "M. Alvarez (PSE)",
  },
  {
    id: "MR-03",
    name: "Alternate storage / backup",
    source: "Jira",
    signal: "Issue type",
    match: 'type = "Continuity" AND label = backup',
    controls: ["CP-7", "CP-9", "CP-10"],
    confidence: "Medium",
    enabled: true,
    hits: 12,
    owner: "M. Alvarez (PSE)",
  },
  {
    id: "MR-04",
    name: "Audit record generation",
    source: "GitLab",
    signal: "Commit trailer",
    match: "Control: AU-*",
    controls: ["AU-2", "AU-3", "AU-12"],
    confidence: "High",
    enabled: true,
    hits: 18,
    owner: "D. Okafor (PSE)",
  },
  {
    id: "MR-05",
    name: "Boundary protection blocks",
    source: "Cameo/SysML",
    signal: "SysML stereotype",
    match: "«securityBoundary» on IBD ports",
    controls: ["SC-7", "SC-7(3)", "AC-4"],
    confidence: "Medium",
    enabled: true,
    hits: 9,
    owner: "R. Patel (SSE)",
  },
  {
    id: "MR-06",
    name: "Flaw remediation SLAs",
    source: "Jira",
    signal: "Label",
    match: "sec:vuln AND priority in (P1,P2)",
    controls: ["SI-2", "SI-2(2)", "RA-5"],
    confidence: "Low",
    enabled: false,
    hits: 0,
    owner: "Sarah Chen (SSE)",
  },
];

export const threadEvidence: ThreadEvidence[] = [
  {
    id: "EV-4821",
    ref: "TRIDENT-2291",
    kind: "Jira issue",
    title: "Enforce PIV/CAC step-up auth on maintenance console",
    controls: ["IA-2(1)", "IA-2(2)"],
    rule: "MR-01",
    status: "Accepted",
    engineer: "J. Whitfield",
    reviewer: "Sarah Chen",
    closed: "Aug 24 '26",
    narrative:
      "Maintenance console now brokers all sessions through the PKI gateway; local password fallback removed in build 4.7.2.",
    statement:
      "The system implements multifactor authentication for privileged accounts using DoD PKI hardware tokens (PIV/CAC) at the maintenance console boundary.",
  },
  {
    id: "EV-4819",
    ref: "PR #1184",
    kind: "Pull request",
    title: "AES-256-GCM envelope encryption for mission recorder volumes",
    controls: ["SC-28", "SC-28(1)"],
    rule: "MR-02",
    status: "Auto-mapped",
    engineer: "L. Barros",
    reviewer: null,
    closed: "Aug 26 '26",
    narrative:
      "Mission recorder writes through an envelope-encryption layer keyed by the onboard HSM; keys rotate per sortie.",
    statement:
      "Information at rest on mission recorder media is protected using FIPS 140-3 validated AES-256-GCM with HSM-held keys.",
  },
  {
    id: "EV-4815",
    ref: "TRIDENT-2178",
    kind: "Jira issue",
    title: "Stand up alternate ground-segment storage site (Site B)",
    controls: ["CP-7", "CP-9"],
    rule: "MR-03",
    status: "Needs review",
    engineer: "K. Moreau",
    reviewer: null,
    closed: "Aug 21 '26",
    narrative:
      "Site B replication configured at 15-minute RPO; failover rehearsal scheduled ahead of CDR.",
    statement:
      "An alternate storage site geographically separated from the primary provides recovery of mission data within the defined RPO.",
  },
  {
    id: "EV-4808",
    ref: "MR !338",
    kind: "Merge request",
    title: "Structured audit events for command authorization path",
    controls: ["AU-3", "AU-12"],
    rule: "MR-04",
    status: "Accepted",
    engineer: "D. Okafor",
    reviewer: "Sarah Chen",
    closed: "Aug 19 '26",
    narrative:
      "All command-authorization decisions emit signed CEF records to the ground SIEM with actor, outcome and source.",
    statement:
      "The system generates audit records containing the required content for command authorization events and forwards them to the SIEM.",
  },
  {
    id: "EV-4802",
    ref: "IBD-Trident-SecBoundary-C",
    kind: "SysML model",
    title: "Rev C internal block diagram — red/black boundary ports",
    controls: ["SC-7", "AC-4"],
    rule: "MR-05",
    status: "Auto-mapped",
    engineer: "R. Patel",
    reviewer: null,
    closed: "Aug 18 '26",
    narrative:
      "Rev C IBD stereotypes each cross-domain port and constrains allowed flows to the guard-approved schema set.",
    statement:
      "The architecture enforces boundary protection between security domains via a guard with schema-constrained information flows.",
  },
  {
    id: "EV-4796",
    ref: "DWG-TR-4410-B",
    kind: "Drawing",
    title: "Ground segment rack elevation and cable plant (Rev B)",
    controls: ["PE-3", "SC-7"],
    rule: "MR-05",
    status: "Accepted",
    engineer: "H. Nakamura",
    reviewer: "M. Alvarez",
    closed: "Aug 14 '26",
    narrative:
      "Rack elevations show physically separated red/black cable runs and the controlled-access cage for crypto equipment.",
    statement:
      "Physical access to crypto and processing equipment is restricted to an access-controlled enclosure per the ground segment design.",
  },
  {
    id: "EV-4790",
    ref: "PR #1152",
    kind: "Pull request",
    title: "Retire legacy TLS 1.1 listener on telemetry ingest",
    controls: ["SC-8", "SC-13"],
    rule: "MR-02",
    status: "Rejected",
    engineer: "L. Barros",
    reviewer: "Sarah Chen",
    closed: "Aug 11 '26",
    narrative:
      "Change reverted before merge — telemetry partner has not completed TLS 1.3 migration; tracked as POA&M.",
    statement:
      "Rejected: implementation not in the CDR baseline; residual weakness tracked in POA&M.",
  },
];

export const sspSections: SspSection[] = [
  {
    id: "1",
    name: "System identification & categorization",
    description: "FIPS-199 categorization, system boundary narrative, PII determination.",
    controls: 0,
    evidence: 6,
    ready: true,
    blocker: null,
  },
  {
    id: "2",
    name: "System architecture & data flows",
    description: "SysML IBDs, network drawings, red/black separation, external interfaces.",
    controls: 24,
    evidence: 31,
    ready: true,
    blocker: null,
  },
  {
    id: "3",
    name: "Control implementation statements",
    description: "Per-control narratives generated from accepted digital-thread evidence.",
    controls: 214,
    evidence: 186,
    ready: false,
    blocker: "12 controls have only auto-mapped evidence awaiting PSE acceptance",
  },
  {
    id: "4",
    name: "Inherited & common controls",
    description: "Provider responsibility matrix for IL5 hosting and enterprise identity.",
    controls: 61,
    evidence: 14,
    ready: true,
    blocker: null,
  },
  {
    id: "5",
    name: "Engineering artifacts appendix",
    description: "Drawings, SBOMs, interface control documents, crypto key management plan.",
    controls: 0,
    evidence: 47,
    ready: true,
    blocker: null,
  },
  {
    id: "6",
    name: "Open items & POA&M crosswalk",
    description: "Residual weaknesses mapped to OSCAL POA&M items with milestones.",
    controls: 9,
    evidence: 9,
    ready: true,
    blocker: null,
  },
];

export const connectorSignals: Record<ConnectorKind, MappingRuleSignal[]> = {
  Jira: ["Label", "Issue type"],
  GitHub: ["Path glob", "Commit trailer", "Label"],
  GitLab: ["Path glob", "Commit trailer", "Label"],
  "Cameo/SysML": ["SysML stereotype"],
};
