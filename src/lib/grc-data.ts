import type { Tone } from "@/components/app/ui";

export type Risk = {
  id: string;
  title: string;
  summary: string;
  owner: string;
  team: string;
  framework: string;
  control: string;
  inherent: number;
  residual: number;
  likelihood: string;
  impact: string;
  status: "Active" | "Mitigating" | "Accepted" | "Closed";
  tone: Tone;
  updated: string;
  opened: string;
  due: string;
  treatment: string;
};

export const risks: Risk[] = [
  {
    id: "RSK-2419",
    title: "IDOR on billing export endpoint",
    summary:
      "Object references on /v1/exports are not scoped to the requesting workspace, allowing cross-tenant document retrieval when an ID is guessed.",
    owner: "Linus Aarto",
    team: "Platform Security",
    framework: "SOC 2",
    control: "CC6.1",
    inherent: 92,
    residual: 71,
    likelihood: "Likely",
    impact: "Severe",
    status: "Active",
    tone: "danger",
    updated: "Aug 27, 09:41",
    opened: "Aug 12, 2026",
    due: "Sep 04, 2026",
    treatment: "Mitigate",
  },
  {
    id: "RSK-2402",
    title: "Configuration drift across production clusters",
    summary:
      "Terraform state and live cluster configuration diverge in us-east-2 after three manual hotfixes applied during the July incident window.",
    owner: "Marcus Ryde",
    team: "Infrastructure",
    framework: "ISO 27001",
    control: "A.8.9",
    inherent: 78,
    residual: 34,
    likelihood: "Possible",
    impact: "Major",
    status: "Mitigating",
    tone: "warning",
    updated: "Aug 26, 17:02",
    opened: "Jul 30, 2026",
    due: "Sep 15, 2026",
    treatment: "Mitigate",
  },
  {
    id: "RSK-2388",
    title: "Admin token issuance is not logged to the audit sink",
    summary:
      "Break-glass admin tokens bypass the structured audit pipeline, leaving a gap in privileged access evidence for auditor sampling.",
    owner: "Grace Hoppel",
    team: "Security Engineering",
    framework: "SOC 2",
    control: "CC7.2",
    inherent: 64,
    residual: 22,
    likelihood: "Unlikely",
    impact: "Major",
    status: "Mitigating",
    tone: "warning",
    updated: "Aug 26, 11:20",
    opened: "Jul 18, 2026",
    due: "Sep 30, 2026",
    treatment: "Mitigate",
  },
  {
    id: "RSK-2350",
    title: "Sub-processor lacks a current SOC 2 Type II report",
    summary:
      "Northwind Analytics has not delivered a refreshed report; the prior report expired Jun 30 and covers a superseded control set.",
    owner: "Priya Raghavan",
    team: "Vendor Risk",
    framework: "SOC 2",
    control: "CC9.2",
    inherent: 55,
    residual: 40,
    likelihood: "Possible",
    impact: "Moderate",
    status: "Active",
    tone: "danger",
    updated: "Aug 25, 08:55",
    opened: "Jul 02, 2026",
    due: "Sep 12, 2026",
    treatment: "Transfer",
  },
  {
    id: "RSK-2311",
    title: "Laptop disk encryption unverified for 6 contractors",
    summary:
      "MDM enrollment is missing for contractor devices onboarded through the agency channel in Q2.",
    owner: "Dana Whitlock",
    team: "IT Operations",
    framework: "ISO 27001",
    control: "A.8.1",
    inherent: 48,
    residual: 12,
    likelihood: "Rare",
    impact: "Moderate",
    status: "Closed",
    tone: "success",
    updated: "Aug 21, 14:33",
    opened: "Jun 11, 2026",
    due: "Aug 20, 2026",
    treatment: "Mitigate",
  },
  {
    id: "RSK-2290",
    title: "Retention policy not enforced on analytics warehouse",
    summary:
      "Event-level records older than 24 months persist in the warehouse beyond the documented retention commitment.",
    owner: "Marcus Ryde",
    team: "Data Platform",
    framework: "GDPR",
    control: "Art. 5(1)(e)",
    inherent: 61,
    residual: 45,
    likelihood: "Likely",
    impact: "Moderate",
    status: "Accepted",
    tone: "neutral",
    updated: "Aug 19, 10:07",
    opened: "May 28, 2026",
    due: "Dec 31, 2026",
    treatment: "Accept",
  },
];

export const riskStatusTone: Record<Risk["status"], Tone> = {
  Active: "danger",
  Mitigating: "warning",
  Accepted: "neutral",
  Closed: "success",
};

export const frameworks = [
  { name: "SOC 2 Type II", coverage: 94, controls: "118 / 126", window: "Window closes Oct 31", tone: "success" as const },
  { name: "ISO 27001:2022", coverage: 81, controls: "76 / 93", window: "Stage 2 audit Nov 12", tone: "info" as const },
  { name: "GDPR", coverage: 88, controls: "44 / 50", window: "Continuous", tone: "info" as const },
  { name: "HIPAA", coverage: 62, controls: "31 / 50", window: "Scoping in progress", tone: "warning" as const },
];

export type Control = {
  id: string;
  name: string;
  framework: string;
  owner: string;
  automation: "Automated" | "Manual";
  lastRun: string;
  evidence: number;
  state: "Passing" | "Failing" | "Needs review";
};

export const controls: Control[] = [
  { id: "CC6.1", name: "Logical access provisioning", framework: "SOC 2", owner: "Grace Hoppel", automation: "Automated", lastRun: "12 min ago", evidence: 42, state: "Failing" },
  { id: "CC6.6", name: "Encryption in transit enforced", framework: "SOC 2", owner: "Marcus Ryde", automation: "Automated", lastRun: "12 min ago", evidence: 18, state: "Passing" },
  { id: "CC7.2", name: "Security event logging and review", framework: "SOC 2", owner: "Grace Hoppel", automation: "Automated", lastRun: "1 hr ago", evidence: 63, state: "Needs review" },
  { id: "A.8.9", name: "Configuration management", framework: "ISO 27001", owner: "Marcus Ryde", automation: "Manual", lastRun: "Aug 24", evidence: 9, state: "Failing" },
  { id: "A.6.3", name: "Security awareness training", framework: "ISO 27001", owner: "Dana Whitlock", automation: "Manual", lastRun: "Aug 15", evidence: 214, state: "Passing" },
  { id: "Art. 30", name: "Records of processing activities", framework: "GDPR", owner: "Priya Raghavan", automation: "Manual", lastRun: "Aug 02", evidence: 7, state: "Passing" },
  { id: "CC9.2", name: "Vendor due diligence", framework: "SOC 2", owner: "Priya Raghavan", automation: "Manual", lastRun: "Jul 28", evidence: 31, state: "Needs review" },
];

export const controlStateTone: Record<Control["state"], Tone> = {
  Passing: "success",
  Failing: "danger",
  "Needs review": "warning",
};

export const activity = [
  {
    tone: "success" as const,
    title: "Control CC6.6 verified",
    time: "12:04",
    body: "Automated check passed across 38 production instances.",
    actor: "Continuous monitor",
  },
  {
    tone: "danger" as const,
    title: "RSK-2419 escalated to critical",
    time: "09:41",
    body: "Scanner confirmed cross-tenant document retrieval on /v1/exports.",
    actor: "Linus Aarto",
  },
  {
    tone: "info" as const,
    title: "Evidence requested by auditor",
    time: "08:15",
    body: "Q3 physical access logs for the us-east-2 facility.",
    actor: "Whitcombe LLP",
  },
  {
    tone: "neutral" as const,
    title: "Policy AC-204 acknowledged",
    time: "07:52",
    body: "14 of 16 engineers have signed the updated access policy.",
    actor: "Dana Whitlock",
  },
];

/* ------------------------------------------------------------- Programs */
/* A program is how a system is assessed: scope, FIPS-199 categorization,
   a NIST SP 800-53 Rev. 5 baseline, and the assessment of those controls. */

export type ImpactLevel = "Low" | "Moderate" | "High";

export type ProgramStatus =
  | "Draft"
  | "In assessment"
  | "Authorized"
  | "POA&M open"
  | "Expired";

export type Program = {
  id: string;
  name: string;
  acronym: string;
  system: string;
  type: "Major application" | "General support system" | "Minor application";
  environment: "AWS GovCloud" | "AWS Commercial" | "Azure" | "On-premise";
  impact: ImpactLevel;
  confidentiality: ImpactLevel;
  integrity: ImpactLevel;
  availability: ImpactLevel;
  baseline: string;
  controlsTotal: number;
  controlsAssessed: number;
  controlsFailing: number;
  status: ProgramStatus;
  owner: string;
  assessor: string;
  authorizingOfficial: string;
  authorized: string;
  expires: string;
  updated: string;
  summary: string;
};

export const programStatusTone: Record<ProgramStatus, Tone> = {
  Draft: "neutral",
  "In assessment": "info",
  Authorized: "success",
  "POA&M open": "warning",
  Expired: "danger",
};

export const programs: Program[] = [
  {
    id: "PRG-1041",
    name: "Atlas payments platform",
    acronym: "ATLAS",
    system: "atlas-prod",
    type: "Major application",
    environment: "AWS GovCloud",
    impact: "High",
    confidentiality: "High",
    integrity: "High",
    availability: "Moderate",
    baseline: "NIST SP 800-53 Rev. 5 — High",
    controlsTotal: 370,
    controlsAssessed: 318,
    controlsFailing: 11,
    status: "In assessment",
    owner: "Grace Hoppel",
    assessor: "Whitcombe LLP",
    authorizingOfficial: "R. Feldman",
    authorized: "—",
    expires: "—",
    updated: "Aug 27, 10:12",
    summary:
      "Cardholder and settlement processing for the Atlas platform, assessed against the High baseline ahead of the FY27 authorization package.",
  },
  {
    id: "PRG-1028",
    name: "Northwind data warehouse",
    acronym: "NDW",
    system: "ndw-analytics",
    type: "General support system",
    environment: "AWS Commercial",
    impact: "Moderate",
    confidentiality: "Moderate",
    integrity: "Moderate",
    availability: "Low",
    baseline: "NIST SP 800-53 Rev. 5 — Moderate",
    controlsTotal: 287,
    controlsAssessed: 287,
    controlsFailing: 3,
    status: "POA&M open",
    owner: "Marcus Ryde",
    assessor: "Internal assessment team",
    authorizingOfficial: "R. Feldman",
    authorized: "Feb 14, 2026",
    expires: "Feb 14, 2029",
    updated: "Aug 26, 16:40",
    summary:
      "Event and reporting warehouse. Authorized with three open POA&M items covering retention enforcement and audit record review.",
  },
  {
    id: "PRG-1013",
    name: "Corporate identity provider",
    acronym: "IDP",
    system: "idp-core",
    type: "General support system",
    environment: "Azure",
    impact: "High",
    confidentiality: "High",
    integrity: "High",
    availability: "High",
    baseline: "NIST SP 800-53 Rev. 5 — High",
    controlsTotal: 370,
    controlsAssessed: 370,
    controlsFailing: 0,
    status: "Authorized",
    owner: "Dana Whitlock",
    assessor: "Whitcombe LLP",
    authorizingOfficial: "R. Feldman",
    authorized: "Nov 03, 2025",
    expires: "Nov 03, 2028",
    updated: "Aug 22, 09:05",
    summary:
      "Workforce SSO and privileged access brokering for all internal systems. Full High baseline assessed with no outstanding findings.",
  },
  {
    id: "PRG-1007",
    name: "Field operations mobile",
    acronym: "FOM",
    system: "fom-mobile",
    type: "Minor application",
    environment: "AWS Commercial",
    impact: "Low",
    confidentiality: "Low",
    integrity: "Low",
    availability: "Low",
    baseline: "NIST SP 800-53 Rev. 5 — Low",
    controlsTotal: 149,
    controlsAssessed: 62,
    controlsFailing: 4,
    status: "Draft",
    owner: "Priya Raghavan",
    assessor: "Unassigned",
    authorizingOfficial: "Pending",
    authorized: "—",
    expires: "—",
    updated: "Aug 18, 13:27",
    summary:
      "Technician scheduling and job capture app. Scoping in progress; control inheritance from IDP not yet confirmed.",
  },
  {
    id: "PRG-0994",
    name: "Legacy billing gateway",
    acronym: "LBG",
    system: "lbg-edge",
    type: "Major application",
    environment: "On-premise",
    impact: "Moderate",
    confidentiality: "Moderate",
    integrity: "High",
    availability: "Moderate",
    baseline: "NIST SP 800-53 Rev. 5 — Moderate",
    controlsTotal: 287,
    controlsAssessed: 240,
    controlsFailing: 18,
    status: "Expired",
    owner: "Linus Aarto",
    assessor: "Internal assessment team",
    authorizingOfficial: "R. Feldman",
    authorized: "Jul 01, 2023",
    expires: "Jul 01, 2026",
    updated: "Aug 11, 11:55",
    summary:
      "Batch invoice transmission to partner banks. Authorization lapsed in July; reassessment scheduled against the Moderate baseline.",
  },
];

export const baselineCounts: Record<ImpactLevel, number> = {
  Low: 149,
  Moderate: 287,
  High: 370,
};

export type ControlFamily = {
  id: string;
  name: string;
  total: number;
  satisfied: number;
  other: number;
  failing: number;
  inherited: number;
  owner: string;
};

export const controlFamilies: ControlFamily[] = [
  { id: "AC", name: "Access control", total: 49, satisfied: 41, other: 5, failing: 3, inherited: 12, owner: "Grace Hoppel" },
  { id: "AU", name: "Audit and accountability", total: 22, satisfied: 18, other: 2, failing: 2, inherited: 4, owner: "Grace Hoppel" },
  { id: "CA", name: "Assessment, authorization, monitoring", total: 18, satisfied: 16, other: 2, failing: 0, inherited: 3, owner: "Sarah Chen" },
  { id: "CM", name: "Configuration management", total: 31, satisfied: 24, other: 4, failing: 3, inherited: 6, owner: "Marcus Ryde" },
  { id: "CP", name: "Contingency planning", total: 25, satisfied: 22, other: 3, failing: 0, inherited: 8, owner: "Marcus Ryde" },
  { id: "IA", name: "Identification and authentication", total: 27, satisfied: 25, other: 1, failing: 1, inherited: 19, owner: "Dana Whitlock" },
  { id: "IR", name: "Incident response", total: 18, satisfied: 17, other: 1, failing: 0, inherited: 5, owner: "Linus Aarto" },
  { id: "RA", name: "Risk assessment", total: 15, satisfied: 12, other: 2, failing: 1, inherited: 2, owner: "Sarah Chen" },
  { id: "SC", name: "System and communications protection", total: 48, satisfied: 43, other: 4, failing: 1, inherited: 14, owner: "Marcus Ryde" },
  { id: "SI", name: "System and information integrity", total: 36, satisfied: 32, other: 4, failing: 0, inherited: 7, owner: "Grace Hoppel" },
];

export type ProgramControl = {
  id: string;
  title: string;
  family: string;
  implementation: "Implemented" | "Partially implemented" | "Planned" | "Inherited";
  assessment: "Satisfied" | "Other than satisfied" | "Not assessed";
  source: string;
  assessed: string;
};

export const programControls: ProgramControl[] = [
  { id: "AC-2", title: "Account management", family: "AC", implementation: "Implemented", assessment: "Satisfied", source: "idp-core (inherited)", assessed: "Aug 26" },
  { id: "AC-2(3)", title: "Disable accounts", family: "AC", implementation: "Partially implemented", assessment: "Other than satisfied", source: "atlas-prod", assessed: "Aug 26" },
  { id: "AC-6(9)", title: "Log use of privileged functions", family: "AC", implementation: "Implemented", assessment: "Other than satisfied", source: "atlas-prod", assessed: "Aug 25" },
  { id: "AU-6", title: "Audit record review, analysis, reporting", family: "AU", implementation: "Partially implemented", assessment: "Other than satisfied", source: "atlas-prod", assessed: "Aug 25" },
  { id: "CM-6", title: "Configuration settings", family: "CM", implementation: "Implemented", assessment: "Satisfied", source: "atlas-prod", assessed: "Aug 24" },
  { id: "CM-8(3)", title: "Automated unauthorized component detection", family: "CM", implementation: "Planned", assessment: "Not assessed", source: "atlas-prod", assessed: "—" },
  { id: "IA-5(1)", title: "Password-based authentication", family: "IA", implementation: "Inherited", assessment: "Satisfied", source: "idp-core (inherited)", assessed: "Aug 20" },
  { id: "SC-13", title: "Cryptographic protection", family: "SC", implementation: "Implemented", assessment: "Satisfied", source: "atlas-prod", assessed: "Aug 19" },
  { id: "SI-4", title: "System monitoring", family: "SI", implementation: "Implemented", assessment: "Satisfied", source: "atlas-prod", assessed: "Aug 19" },
  { id: "RA-5", title: "Vulnerability monitoring and scanning", family: "RA", implementation: "Partially implemented", assessment: "Other than satisfied", source: "atlas-prod", assessed: "Aug 18" },
];

export const assessmentTone: Record<ProgramControl["assessment"], Tone> = {
  Satisfied: "success",
  "Other than satisfied": "danger",
  "Not assessed": "neutral",
};

export const programTimeline = [
  { tone: "info" as const, title: "Assessment window opened for AU family", time: "Aug 27, 10:12", actor: "Whitcombe LLP" },
  { tone: "danger" as const, title: "AC-6(9) marked other than satisfied", time: "Aug 25, 15:48", actor: "Whitcombe LLP" },
  { tone: "success" as const, title: "IA family inheritance confirmed from idp-core", time: "Aug 20, 09:31", actor: "Dana Whitlock" },
  { tone: "neutral" as const, title: "Baseline tailored — 12 controls marked not applicable", time: "Aug 12, 14:02", actor: "Sarah Chen" },
  { tone: "neutral" as const, title: "Program created and categorized as High", time: "Aug 04, 08:15", actor: "Sarah Chen" },
];

/* ------------------------------------------------------- POA&M (OSCAL) */
/* Modeled on the NIST OSCAL Plan of Action and Milestones metaschema.
   Field names mirror the OSCAL assembly so an export maps 1:1. */

export type OscalProp = {
  /** token */
  name: string;
  value: string;
  /** token — optional taxonomy qualifier */
  class?: string;
  ns?: string;
};

export type OscalLink = {
  /** uri */
  href: string;
  /** token */
  rel: string;
  /** markup-line */
  text: string;
};

export type MilestoneStatus = "Planned" | "In progress" | "Completed" | "Missed";

export type Milestone = {
  /** uuid */
  uuid: string;
  /** token */
  id: string;
  /** markup-line */
  title: string;
  /** markup-multiline */
  description: string;
  /** date-time-with-timezone */
  targetDate: string;
  /** date-time-with-timezone | null */
  completedDate: string | null;
  status: MilestoneStatus;
};

export type RelatedObservation = {
  /** uuid */
  observationUuid: string;
  /** token */
  method: "EXAMINE" | "INTERVIEW" | "TEST";
  /** markup-line */
  title: string;
  /** date-time-with-timezone */
  collected: string;
  /** uri */
  href: string;
};

export type AssociatedRisk = {
  /** uuid */
  riskUuid: string;
  /** local record id */
  riskId: string;
  title: string;
};

export type PoamStatus = "Open" | "Ongoing" | "Risk accepted" | "Completed" | "Deferred";
export type PoamSeverity = "Low" | "Moderate" | "High" | "Critical";

export type PoamItem = {
  /** uuid */
  uuid: string;
  /** program this item belongs to */
  programId: string;
  /** token — agency-facing sequential identifier */
  poamId: string;
  /** markup-line */
  title: string;
  /** markup-multiline */
  description: string;
  /** markup-multiline */
  remarks: string;
  status: PoamStatus;
  severity: PoamSeverity;
  /** token — control(s) the weakness maps to */
  controls: string[];
  /** origin actor */
  origin: string;
  detectionSource: string;
  pointOfContact: string;
  /** date-time-with-timezone */
  published: string;
  lastModified: string;
  scheduledCompletion: string;
  props: OscalProp[];
  milestones: Milestone[];
  relatedObservations: RelatedObservation[];
  associatedRisks: AssociatedRisk[];
  links: OscalLink[];
};

export const poamStatusTone: Record<PoamStatus, Tone> = {
  Open: "danger",
  Ongoing: "warning",
  "Risk accepted": "neutral",
  Completed: "success",
  Deferred: "neutral",
};

export const poamSeverityTone: Record<PoamSeverity, Tone> = {
  Critical: "danger",
  High: "danger",
  Moderate: "warning",
  Low: "neutral",
};

export const milestoneStatusTone: Record<MilestoneStatus, Tone> = {
  Planned: "neutral",
  "In progress": "info",
  Completed: "success",
  Missed: "danger",
};

export const poamItems: PoamItem[] = [
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d401",
    programId: "PRG-1041",
    poamId: "V-0001",
    title: "Privileged function invocations are not forwarded to the audit sink",
    description:
      "Sampling of 20 break-glass sessions on the settlement service found 6 with no corresponding record in the centralized audit pipeline, so privileged use cannot be reconstructed for the assessment period.",
    remarks:
      "Interim compensating control: nightly reconciliation report reviewed by the security duty officer.",
    status: "Open",
    severity: "High",
    controls: ["AC-6(9)", "AU-6"],
    origin: "Whitcombe LLP (assessor)",
    detectionSource: "Security assessment — SAR finding 14",
    pointOfContact: "Grace Hoppel",
    published: "2026-08-25T15:48:00-04:00",
    lastModified: "2026-08-27T09:12:00-04:00",
    scheduledCompletion: "2026-10-12T17:00:00-04:00",
    props: [
      { name: "marking", value: "CUI//SP-PRIV", class: "banner" },
      { name: "weakness-source", value: "assessment", ns: "https://equinox.example/ns/oscal" },
      { name: "risk-adjusted", value: "no" },
      { name: "vendor-dependency", value: "no" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2201",
        id: "MS-1",
        title: "Instrument privileged session broker with audit forwarder",
        description: "Deploy the sidecar forwarder to all settlement broker nodes in us-east-2.",
        targetDate: "2026-09-15T17:00:00-04:00",
        completedDate: "2026-09-11T13:22:00-04:00",
        status: "Completed",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2202",
        id: "MS-2",
        title: "Backfill and validate 90 days of privileged events",
        description: "Replay archived broker logs into the audit sink and verify record counts.",
        targetDate: "2026-09-30T17:00:00-04:00",
        completedDate: null,
        status: "In progress",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2203",
        id: "MS-3",
        title: "Re-test AC-6(9) with assessor sampling",
        description: "Assessor draws a fresh sample of 25 sessions and confirms full coverage.",
        targetDate: "2026-10-12T17:00:00-04:00",
        completedDate: null,
        status: "Planned",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa10",
        method: "TEST",
        title: "Audit sink coverage sampling — 20 privileged sessions",
        collected: "2026-08-25T14:05:00-04:00",
        href: "/evidence",
      },
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa11",
        method: "EXAMINE",
        title: "Break-glass runbook and forwarder configuration review",
        collected: "2026-08-24T10:40:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [
      {
        riskUuid: "f0a71b3c-1d55-4b2a-9d47-88c1b2e5f001",
        riskId: "RSK-2388",
        title: "Admin token issuance is not logged to the audit sink",
      },
    ],
    links: [
      { href: "/evidence", rel: "evidence", text: "SAR finding 14 workpaper" },
      { href: "/controls", rel: "related", text: "Control CC7.2 monitoring history" },
    ],
  },
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d402",
    programId: "PRG-1041",
    poamId: "V-0002",
    title: "Disable-accounts automation does not cover contractor federation",
    description:
      "AC-2(3) automation disables idle accounts in the primary directory only; federated contractor identities remain enabled beyond the 35-day threshold.",
    remarks: "Dependent on the IDP federation upgrade tracked under PRG-1013.",
    status: "Ongoing",
    severity: "Moderate",
    controls: ["AC-2(3)"],
    origin: "Internal continuous monitoring",
    detectionSource: "Automated control check — daily",
    pointOfContact: "Dana Whitlock",
    published: "2026-08-19T09:02:00-04:00",
    lastModified: "2026-08-26T16:40:00-04:00",
    scheduledCompletion: "2026-11-30T17:00:00-05:00",
    props: [
      { name: "marking", value: "CUI", class: "banner" },
      { name: "weakness-source", value: "continuous-monitoring", ns: "https://equinox.example/ns/oscal" },
      { name: "vendor-dependency", value: "yes" },
      { name: "deviation-requested", value: "no" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2211",
        id: "MS-1",
        title: "Extend idle-account job to federated principals",
        description: "Include SCIM-provisioned contractor identities in the disable sweep.",
        targetDate: "2026-10-20T17:00:00-04:00",
        completedDate: null,
        status: "In progress",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2212",
        id: "MS-2",
        title: "Evidence 30 days of clean sweep output",
        description: "Collect job output and exception report for the assessor.",
        targetDate: "2026-11-30T17:00:00-05:00",
        completedDate: null,
        status: "Planned",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa20",
        method: "TEST",
        title: "Idle contractor account query — 14 accounts over threshold",
        collected: "2026-08-19T08:50:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [
      {
        riskUuid: "f0a71b3c-1d55-4b2a-9d47-88c1b2e5f002",
        riskId: "RSK-2311",
        title: "Laptop disk encryption unverified for 6 contractors",
      },
    ],
    links: [{ href: "/programs/PRG-1013", rel: "depends-on", text: "IDP federation upgrade" }],
  },
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d403",
    programId: "PRG-1041",
    poamId: "V-0003",
    title: "Automated unauthorized component detection not deployed",
    description:
      "CM-8(3) is planned but not implemented; unauthorized hardware and software components are detected only by quarterly manual inventory reconciliation.",
    remarks: "Tooling procurement approved; deployment window follows the Q4 change freeze.",
    status: "Deferred",
    severity: "Moderate",
    controls: ["CM-8(3)"],
    origin: "Whitcombe LLP (assessor)",
    detectionSource: "Security assessment — SAR finding 22",
    pointOfContact: "Marcus Ryde",
    published: "2026-08-12T14:02:00-04:00",
    lastModified: "2026-08-22T11:31:00-04:00",
    scheduledCompletion: "2027-01-31T17:00:00-05:00",
    props: [
      { name: "marking", value: "CUI", class: "banner" },
      { name: "weakness-source", value: "assessment", ns: "https://equinox.example/ns/oscal" },
      { name: "deviation-requested", value: "yes" },
      { name: "risk-adjusted", value: "yes" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2221",
        id: "MS-1",
        title: "Award component discovery tooling",
        description: "Complete procurement and security review of the discovery agent.",
        targetDate: "2026-09-05T17:00:00-04:00",
        completedDate: "2026-09-02T15:10:00-04:00",
        status: "Completed",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2222",
        id: "MS-2",
        title: "Pilot agent on 10% of the production fleet",
        description: "Validate detection fidelity and performance impact.",
        targetDate: "2026-09-28T17:00:00-04:00",
        completedDate: null,
        status: "Missed",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2223",
        id: "MS-3",
        title: "Fleet-wide rollout and alert routing",
        description: "Deploy to all production accounts and route alerts to the SOC queue.",
        targetDate: "2027-01-31T17:00:00-05:00",
        completedDate: null,
        status: "Planned",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa30",
        method: "INTERVIEW",
        title: "Configuration management team walkthrough",
        collected: "2026-08-11T13:15:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [
      {
        riskUuid: "f0a71b3c-1d55-4b2a-9d47-88c1b2e5f003",
        riskId: "RSK-2402",
        title: "Configuration drift across production clusters",
      },
    ],
    links: [{ href: "/evidence", rel: "evidence", text: "Q2 manual inventory reconciliation" }],
  },
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d404",
    programId: "PRG-1028",
    poamId: "V-0001",
    title: "Retention enforcement absent on the analytics warehouse",
    description:
      "Event-level records older than 24 months persist beyond the documented retention commitment; no automated purge job exists for the partitioned event tables.",
    remarks: "Purge job written; awaiting legal hold review before enablement in production.",
    status: "Ongoing",
    severity: "High",
    controls: ["SI-12", "AU-11"],
    origin: "Internal assessment team",
    detectionSource: "Annual assessment — finding 03",
    pointOfContact: "Marcus Ryde",
    published: "2026-05-28T10:07:00-04:00",
    lastModified: "2026-08-26T16:40:00-04:00",
    scheduledCompletion: "2026-12-31T17:00:00-05:00",
    props: [
      { name: "marking", value: "CUI//SP-PRVCY", class: "banner" },
      { name: "weakness-source", value: "assessment", ns: "https://equinox.example/ns/oscal" },
      { name: "risk-adjusted", value: "no" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2231",
        id: "MS-1",
        title: "Legal hold review of purge scope",
        description: "Confirm no litigation hold applies to the affected partitions.",
        targetDate: "2026-09-30T17:00:00-04:00",
        completedDate: null,
        status: "In progress",
      },
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2232",
        id: "MS-2",
        title: "Enable partition purge in production",
        description: "Schedule the retention job and alert on failures.",
        targetDate: "2026-12-31T17:00:00-05:00",
        completedDate: null,
        status: "Planned",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa40",
        method: "TEST",
        title: "Warehouse partition age query — 41 partitions over 24 months",
        collected: "2026-05-27T18:22:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [
      {
        riskUuid: "f0a71b3c-1d55-4b2a-9d47-88c1b2e5f004",
        riskId: "RSK-2290",
        title: "Retention policy not enforced on analytics warehouse",
      },
    ],
    links: [{ href: "/risks/RSK-2290", rel: "related-risk", text: "RSK-2290 risk record" }],
  },
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d405",
    programId: "PRG-1028",
    poamId: "V-0002",
    title: "Audit record review is not performed at the documented cadence",
    description:
      "AU-6 requires weekly review of warehouse access records; review evidence exists for 9 of the last 16 weeks.",
    remarks: "",
    status: "Open",
    severity: "Moderate",
    controls: ["AU-6"],
    origin: "Internal assessment team",
    detectionSource: "Annual assessment — finding 07",
    pointOfContact: "Grace Hoppel",
    published: "2026-06-14T09:30:00-04:00",
    lastModified: "2026-08-25T08:15:00-04:00",
    scheduledCompletion: "2026-10-31T17:00:00-04:00",
    props: [
      { name: "marking", value: "CUI", class: "banner" },
      { name: "weakness-source", value: "assessment", ns: "https://equinox.example/ns/oscal" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2241",
        id: "MS-1",
        title: "Automate weekly review packet generation",
        description: "Generate and route the review packet to the reviewer queue every Monday.",
        targetDate: "2026-10-31T17:00:00-04:00",
        completedDate: null,
        status: "Planned",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa50",
        method: "EXAMINE",
        title: "Review sign-off records, 16-week sample",
        collected: "2026-06-13T16:00:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [],
    links: [],
  },
  {
    uuid: "3d5a1c88-2f14-4f0e-9a1b-6c0f2a71d406",
    programId: "PRG-1028",
    poamId: "V-0003",
    title: "Backup restoration test not evidenced for the current period",
    description:
      "CP-9 restoration testing was performed but the results were not retained in the evidence repository.",
    remarks: "Retest completed Aug 20 with results attached; pending assessor closure review.",
    status: "Completed",
    severity: "Low",
    controls: ["CP-9"],
    origin: "Internal continuous monitoring",
    detectionSource: "Evidence freshness check",
    pointOfContact: "Marcus Ryde",
    published: "2026-07-08T11:45:00-04:00",
    lastModified: "2026-08-21T14:33:00-04:00",
    scheduledCompletion: "2026-08-20T17:00:00-04:00",
    props: [
      { name: "marking", value: "CUI", class: "banner" },
      { name: "weakness-source", value: "continuous-monitoring", ns: "https://equinox.example/ns/oscal" },
    ],
    milestones: [
      {
        uuid: "9b1e4f22-77aa-4d16-8b03-1c4f9d1a2251",
        id: "MS-1",
        title: "Re-run restoration test and attach results",
        description: "Full restore of the nightly snapshot into the staging warehouse.",
        targetDate: "2026-08-20T17:00:00-04:00",
        completedDate: "2026-08-20T15:12:00-04:00",
        status: "Completed",
      },
    ],
    relatedObservations: [
      {
        observationUuid: "c81d2a40-5e9f-4a2c-95bb-2f3a41d0aa60",
        method: "TEST",
        title: "Restoration test run 2026-08-20",
        collected: "2026-08-20T15:12:00-04:00",
        href: "/evidence",
      },
    ],
    associatedRisks: [],
    links: [{ href: "/evidence", rel: "evidence", text: "Restore test output" }],
  },
];

export function poamForProgram(programId: string) {
  return poamItems.filter((i) => i.programId === programId);
}

/** Renders an OSCAL date-time-with-timezone as a compact display string. */
export function formatOscalDate(value: string | null, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

/* --------------------------------------------- Acquisition lifecycle */
/* The digital thread: DoD acquisition milestones, systems-engineering
   technical reviews and the RMF/AO-SCA actions that gate each of them.
   Tracked per program so SE and cyber see one chronology. */

export type GateKind =
  | "Milestone decision"
  | "Engineering review"
  | "RMF action"
  | "Operational";

export type GateStatus =
  | "Complete"
  | "In progress"
  | "At risk"
  | "Blocked"
  | "Planned";

export type LifecycleGate = {
  id: string;
  phase: string;
  kind: GateKind;
  name: string;
  description: string;
  /** Cyber dependency: what RMF artifact or approval must exist to pass. */
  cyberGate: string;
};

export const gateStatusTone: Record<GateStatus, Tone> = {
  Complete: "success",
  "In progress": "info",
  "At risk": "warning",
  Blocked: "danger",
  Planned: "neutral",
};

export const gateKindTone: Record<GateKind, Tone> = {
  "Milestone decision": "info",
  "Engineering review": "neutral",
  "RMF action": "warning",
  Operational: "success",
};

export const lifecyclePhases = [
  "1 — Material solution analysis",
  "2 — Technology maturation & risk reduction",
  "3 — Engineering & manufacturing development",
  "4 — Integration, test & production approval",
  "5 — Production, deployment & operations",
];

export const lifecycleGates: LifecycleGate[] = [
  { id: "ASR", phase: lifecyclePhases[0]!, kind: "Engineering review", name: "Alternative Systems Review", description: "Program office evaluates candidate concepts against user requirements.", cyberGate: "Preliminary boundary and data types identified" },
  { id: "MS-A", phase: lifecyclePhases[0]!, kind: "Milestone decision", name: "Milestone A decision", description: "Funding approved for prototyping and technology maturation.", cyberGate: "System categorization brief accepted" },
  { id: "RMF-1", phase: lifecyclePhases[0]!, kind: "RMF action", name: "Categorize the system", description: "PM and security team set confidentiality, integrity and availability impact levels.", cyberGate: "FIPS-199 categorization signed by the AO" },
  { id: "SRR", phase: lifecyclePhases[1]!, kind: "Engineering review", name: "System Requirements Review", description: "All system performance requirements are defined, actionable and understood.", cyberGate: "Security requirements traced into the spec" },
  { id: "SFR", phase: lifecyclePhases[1]!, kind: "Engineering review", name: "System Functional Review", description: "Functional baseline established against the specification.", cyberGate: "Functional decomposition of the security boundary" },
  { id: "RMF-2", phase: lifecyclePhases[1]!, kind: "RMF action", name: "Select security controls", description: "NIST SP 800-53 Rev. 5 baseline selected and tailored to the system type.", cyberGate: "Tailored baseline approved by the SCA" },
  { id: "PDR", phase: lifecyclePhases[1]!, kind: "Engineering review", name: "Preliminary Design Review", description: "Allocated baseline reviewed for readiness to enter detailed design.", cyberGate: "SCA review of the conceptual boundary" },
  { id: "RMF-3", phase: lifecyclePhases[1]!, kind: "RMF action", name: "AO approval of RMF strategy", description: "Authorizing Official approves the security strategy before Milestone B.", cyberGate: "Signed RMF security strategy memo" },
  { id: "MS-B", phase: lifecyclePhases[2]!, kind: "Milestone decision", name: "Milestone B decision", description: "Formal program start; detailed engineering and manufacturing development authorized.", cyberGate: "AO-approved RMF strategy on file" },
  { id: "RMF-4", phase: lifecyclePhases[2]!, kind: "RMF action", name: "Develop the System Security Plan", description: "Implementation statements showing how hardware and software meet each control.", cyberGate: "SSP baselined in the authorization package" },
  { id: "CDR", phase: lifecyclePhases[2]!, kind: "Engineering review", name: "Critical Design Review", description: "Detailed design mature and stable (75–90% of drawings) and ready for fabrication.", cyberGate: "SCA assessment of the SSP — design must support selected controls" },
  { id: "TRR", phase: lifecyclePhases[3]!, kind: "Engineering review", name: "Test Readiness Review", description: "System, facilities and safety protocols ready for formal developmental test.", cyberGate: "IATT prerequisites: scans and safety checks complete" },
  { id: "RMF-5", phase: lifecyclePhases[3]!, kind: "RMF action", name: "Interim Authority to Test (IATT)", description: "Time-bound AO approval to connect the system to a government test range or network.", cyberGate: "Signed IATT memo with expiry" },
  { id: "SVR", phase: lifecyclePhases[3]!, kind: "Engineering review", name: "System Verification Review", description: "Physical system verified against design specifications.", cyberGate: "Control verification results recorded" },
  { id: "PRR", phase: lifecyclePhases[3]!, kind: "Engineering review", name: "Production Readiness Review", description: "Manufacturing line audited for the ability to produce at scale.", cyberGate: "Supply-chain risk controls (SR family) assessed" },
  { id: "RMF-6", phase: lifecyclePhases[4]!, kind: "RMF action", name: "Final assessment & SAR", description: "Independent penetration test, code analysis and scans; SCA issues the Security Assessment Report.", cyberGate: "SAR delivered with risk recommendation to the AO" },
  { id: "MS-C", phase: lifecyclePhases[4]!, kind: "Milestone decision", name: "Milestone C decision", description: "Low-Rate Initial Production authorized.", cyberGate: "SAR risk posture accepted" },
  { id: "RMF-7", phase: lifecyclePhases[4]!, kind: "RMF action", name: "Authority to Operate (ATO)", description: "AO signs the ATO memo accepting residual cybersecurity risk.", cyberGate: "ATO memo with POA&M and expiry date" },
  { id: "IOC", phase: lifecyclePhases[4]!, kind: "Operational", name: "Initial Operational Capability", description: "First units delivered to operational squadrons; continuous monitoring / cATO begins.", cyberGate: "ConMon plan and cATO pipeline controls active" },
];

export type ProgramGate = LifecycleGate & {
  status: GateStatus;
  planned: string;
  actual: string;
  owner: string;
  artifact: string;
};

type GateOverride = {
  status?: GateStatus;
  planned?: string;
  actual?: string;
  owner?: string;
  artifact?: string;
};

const programLifecycle: Record<
  string,
  { current: string; owners: Partial<Record<GateKind, string>>; overrides?: Record<string, GateOverride> }
> = {
  "PRG-1041": {
    current: "RMF-6",
    owners: { "Engineering review": "M. Ryde", "RMF action": "Whitcombe LLP", "Milestone decision": "R. Feldman", Operational: "G. Hoppel" },
    overrides: {
      "RMF-6": { status: "At risk", planned: "Sep 18, 2026", artifact: "SAR draft v0.4" },
      "RMF-5": { artifact: "IATT-2026-114 (expired Jun 30)" },
      PRR: { status: "In progress", planned: "Sep 04, 2026" },
    },
  },
  "PRG-1028": { current: "CDR", owners: { "Engineering review": "L. Aarto", "RMF action": "Whitcombe LLP", "Milestone decision": "R. Feldman", Operational: "M. Ryde" } },
  "PRG-1013": {
    current: "RMF-3",
    owners: { "Engineering review": "D. Whitlock", "RMF action": "S. Chen", "Milestone decision": "R. Feldman", Operational: "M. Ryde" },
    overrides: { "RMF-3": { status: "Blocked", artifact: "Strategy returned by AO — boundary unclear" } },
  },
  "PRG-1007": { current: "IOC", owners: { "Engineering review": "M. Ryde", "RMF action": "G. Hoppel", "Milestone decision": "R. Feldman", Operational: "G. Hoppel" } },
  "PRG-0994": { current: "SRR", owners: { "Engineering review": "L. Aarto", "RMF action": "S. Chen", "Milestone decision": "R. Feldman", Operational: "M. Ryde" } },
};

const gateDates = [
  "Jan 14, 2025", "Feb 27, 2025", "Mar 11, 2025", "Apr 22, 2025", "May 30, 2025",
  "Jun 18, 2025", "Jul 29, 2025", "Aug 21, 2025", "Sep 25, 2025", "Nov 06, 2025",
  "Dec 12, 2025", "Feb 05, 2026", "Feb 26, 2026", "Apr 16, 2026", "May 28, 2026",
  "Jul 09, 2026", "Aug 20, 2026", "Oct 01, 2026", "Nov 19, 2026",
];

export function gatesForProgram(programId: string): ProgramGate[] {
  const cfg = programLifecycle[programId] ?? programLifecycle["PRG-1028"]!;
  const currentIndex = lifecycleGates.findIndex((g) => g.id === cfg.current);
  return lifecycleGates.map((gate, i) => {
    const base: ProgramGate = {
      ...gate,
      status: i < currentIndex ? "Complete" : i === currentIndex ? "In progress" : "Planned",
      planned: gateDates[i] ?? "—",
      actual: i < currentIndex ? gateDates[i] ?? "—" : "—",
      owner: cfg.owners[gate.kind] ?? "Unassigned",
      artifact: i < currentIndex ? `${gate.id} package` : "—",
    };
    return { ...base, ...(cfg.overrides?.[gate.id] ?? {}) };
  });
}
