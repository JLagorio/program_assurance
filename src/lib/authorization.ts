import type { Tone } from "@/components/app/ui";

/* ------------------------------------------------------------------ types */

export type PackageArtifactKind = "SSP" | "SAR" | "POA&M" | "Attachment";
export type PackageStatus = "Draft" | "In review" | "SCA accepted" | "Returned" | "Locked";

export type PackageArtifact = {
  id: string;
  kind: PackageArtifactKind;
  name: string;
  version: string;
  status: PackageStatus;
  pages: number;
  updated: string;
  owner: string;
  note: string;
};

export type EnclaveRole = "SCA" | "SCA team" | "AO" | "AODR" | "Program";
export type EnclaveGrant = {
  id: string;
  person: string;
  org: string;
  role: EnclaveRole;
  access: "Read only" | "Read + comment" | "Sign authority";
  lastViewed: string;
  status: "Active" | "Invited" | "Expired";
};

export type ScaObservationStatus =
  | "Logged"
  | "Triaged"
  | "Jira assigned"
  | "In remediation"
  | "Remediated"
  | "Risk accepted";

export type ScaObservation = {
  id: string;
  title: string;
  severity: "CAT I" | "CAT II" | "CAT III";
  control: string;
  loggedBy: string;
  logged: string;
  status: ScaObservationStatus;
  jira: string | null;
  assignee: string;
  due: string;
  detail: string;
  response: string;
};

export type ResidualRisk = {
  id: string;
  title: string;
  control: string;
  likelihood: "Low" | "Moderate" | "High";
  impact: "Low" | "Moderate" | "High";
  residual: "Low" | "Moderate" | "High" | "Very high";
  mitigation: string;
  poam: string;
  decision: "Pending AO" | "Accepted" | "Rejected" | "Deferred";
  rationale: string;
};

/* ------------------------------------------------------------------ tones */

export const packageStatusTone: Record<PackageStatus, Tone> = {
  Draft: "neutral",
  "In review": "info",
  "SCA accepted": "success",
  Returned: "danger",
  Locked: "success",
};

export const observationTone: Record<ScaObservationStatus, Tone> = {
  Logged: "danger",
  Triaged: "warning",
  "Jira assigned": "info",
  "In remediation": "info",
  Remediated: "success",
  "Risk accepted": "neutral",
};

export const residualTone: Record<ResidualRisk["residual"], Tone> = {
  Low: "success",
  Moderate: "warning",
  High: "danger",
  "Very high": "danger",
};

export const decisionTone: Record<ResidualRisk["decision"], Tone> = {
  "Pending AO": "warning",
  Accepted: "success",
  Rejected: "danger",
  Deferred: "neutral",
};

export const grantTone: Record<EnclaveGrant["status"], Tone> = {
  Active: "success",
  Invited: "info",
  Expired: "neutral",
};

/* ------------------------------------------------------------------- data */

export const authorization = {
  decision: "Pending AO briefing",
  type: "ATO with conditions (36 months)",
  ao: "Ms. R. Calloway, SES — PEO Digital",
  aodr: "Lt Col M. Prieto",
  sca: "Mr. D. Okafor — Navy SCA, NAVWAR",
  briefing: "Sep 24, 2026",
  targetSignature: "Oct 02, 2026",
  milestoneC: "Nov 12, 2026",
  packageSubmitted: "Aug 21, 2026",
  enclave: "equinox.enclave/prg-1041 · IL5 · read-only",
};

export const packageArtifacts: PackageArtifact[] = [
  {
    id: "PKG-01",
    kind: "SSP",
    name: "System Security Plan",
    version: "v4.2",
    status: "SCA accepted",
    pages: 412,
    updated: "Aug 21, 2026",
    owner: "S. Ibarra",
    note: "Generated from live control narratives",
  },
  {
    id: "PKG-02",
    kind: "SAR",
    name: "Security Assessment Report",
    version: "v2.0",
    status: "In review",
    pages: 168,
    updated: "Aug 26, 2026",
    owner: "D. Okafor (SCA)",
    note: "12 observations pending program response",
  },
  {
    id: "PKG-03",
    kind: "POA&M",
    name: "Plan of Action & Milestones (OSCAL)",
    version: "v11",
    status: "In review",
    pages: 46,
    updated: "Aug 27, 2026",
    owner: "K. Nawaz",
    note: "Live — syncs with remediation tracker",
  },
  {
    id: "PKG-04",
    kind: "Attachment",
    name: "Contingency plan & test results",
    version: "v1.3",
    status: "SCA accepted",
    pages: 58,
    updated: "Jul 30, 2026",
    owner: "P. Lund",
    note: "CP-2, CP-4 evidence",
  },
  {
    id: "PKG-05",
    kind: "Attachment",
    name: "Privacy impact assessment",
    version: "v1.0",
    status: "Draft",
    pages: 22,
    updated: "Aug 18, 2026",
    owner: "J. Reyes",
    note: "Awaiting privacy officer signature",
  },
  {
    id: "PKG-06",
    kind: "Attachment",
    name: "Supply chain risk management plan",
    version: "v2.1",
    status: "Returned",
    pages: 34,
    updated: "Aug 24, 2026",
    owner: "T. Alvarez",
    note: "SCA requested SR-5 sub-tier detail",
  },
];

export const enclaveGrants: EnclaveGrant[] = [
  {
    id: "ACC-01",
    person: "D. Okafor",
    org: "NAVWAR SCA",
    role: "SCA",
    access: "Read + comment",
    lastViewed: "Aug 27 '26 09:14",
    status: "Active",
  },
  {
    id: "ACC-02",
    person: "A. Whitfield",
    org: "NAVWAR SCA team",
    role: "SCA team",
    access: "Read only",
    lastViewed: "Aug 26 '26 16:02",
    status: "Active",
  },
  {
    id: "ACC-03",
    person: "R. Calloway",
    org: "PEO Digital",
    role: "AO",
    access: "Sign authority",
    lastViewed: "Aug 22 '26 11:47",
    status: "Active",
  },
  {
    id: "ACC-04",
    person: "M. Prieto",
    org: "PEO Digital",
    role: "AODR",
    access: "Read + comment",
    lastViewed: "Aug 25 '26 08:31",
    status: "Active",
  },
  {
    id: "ACC-05",
    person: "H. Zheng",
    org: "DCSA",
    role: "SCA team",
    access: "Read only",
    lastViewed: "—",
    status: "Invited",
  },
];

export const scaObservations: ScaObservation[] = [
  {
    id: "OBS-118",
    title: "Session termination not enforced on maintenance console",
    severity: "CAT I",
    control: "AC-12",
    loggedBy: "D. Okafor (SCA)",
    logged: "Aug 27 '26 09:20",
    status: "Logged",
    jira: null,
    assignee: "—",
    due: "Sep 10, 2026",
    detail:
      "Console sessions on the mission compute maintenance path persist after 60 minutes of inactivity. Observed on two of four nodes during the credentialed walkthrough.",
    response: "",
  },
  {
    id: "OBS-117",
    title: "Audit records not forwarded from autonomy core within 5 minutes",
    severity: "CAT II",
    control: "AU-6(3)",
    loggedBy: "A. Whitfield (SCA team)",
    logged: "Aug 26 '26 15:40",
    status: "Jira assigned",
    jira: "TRIDENT-4412",
    assignee: "L. Moreau",
    due: "Sep 05, 2026",
    detail:
      "Forwarder batches at 15 minutes, exceeding the 5 minute requirement in the tailored overlay.",
    response: "Batch interval config change staged; regression test scheduled with TE-04.",
  },
  {
    id: "OBS-116",
    title: "FIPS module version drift on ground station TLS terminator",
    severity: "CAT I",
    control: "SC-13",
    loggedBy: "D. Okafor (SCA)",
    logged: "Aug 25 '26 10:05",
    status: "In remediation",
    jira: "TRIDENT-4388",
    assignee: "P. Lund",
    due: "Sep 02, 2026",
    detail: "Deployed OpenSSL build is not on the validated FIPS 140-3 certificate list.",
    response: "Rebuilt against validated module; awaiting redeploy to the range enclave.",
  },
  {
    id: "OBS-115",
    title: "Least privilege exceptions undocumented for 3 service accounts",
    severity: "CAT II",
    control: "AC-6(5)",
    loggedBy: "A. Whitfield (SCA team)",
    logged: "Aug 24 '26 13:22",
    status: "Remediated",
    jira: "TRIDENT-4351",
    assignee: "S. Ibarra",
    due: "Aug 29, 2026",
    detail: "Service accounts hold broad roles without documented justification.",
    response: "Roles scoped down and justification memo attached to the SSP (AC-6 narrative).",
  },
  {
    id: "OBS-114",
    title: "Boundary diagram omits telemetry egress to analytics tenant",
    severity: "CAT III",
    control: "CA-3",
    loggedBy: "D. Okafor (SCA)",
    logged: "Aug 22 '26 08:58",
    status: "Triaged",
    jira: null,
    assignee: "J. Reyes",
    due: "Sep 12, 2026",
    detail: "Authorization boundary graphic does not show the one-way telemetry feed.",
    response: "",
  },
  {
    id: "OBS-113",
    title: "Residual CAT II vulnerabilities on legacy payload controller",
    severity: "CAT II",
    control: "RA-5",
    loggedBy: "D. Okafor (SCA)",
    logged: "Aug 20 '26 14:11",
    status: "Risk accepted",
    jira: null,
    assignee: "K. Nawaz",
    due: "—",
    detail: "Vendor firmware lags two revisions; no patch available before Milestone C.",
    response: "Compensating control (segmented VLAN + monitoring) accepted pending AO decision.",
  },
];

export const residualRisks: ResidualRisk[] = [
  {
    id: "RSK-401",
    title: "Legacy payload controller firmware cannot be patched before MS-C",
    control: "RA-5 / SI-2",
    likelihood: "Moderate",
    impact: "High",
    residual: "High",
    mitigation: "Segmented VLAN, deny-by-default egress, continuous monitoring",
    poam: "POAM-0031",
    decision: "Pending AO",
    rationale: "",
  },
  {
    id: "RSK-402",
    title: "Session termination gap on maintenance console",
    control: "AC-12",
    likelihood: "High",
    impact: "Moderate",
    residual: "High",
    mitigation: "Physical access control in the SCIF until the fix ships",
    poam: "POAM-0044",
    decision: "Pending AO",
    rationale: "",
  },
  {
    id: "RSK-403",
    title: "Telemetry egress to analytics tenant outside boundary",
    control: "CA-3",
    likelihood: "Low",
    impact: "Moderate",
    residual: "Moderate",
    mitigation: "One-way data diode, no PII in telemetry schema",
    poam: "POAM-0038",
    decision: "Accepted",
    rationale: "Diode verified by SCA on Aug 25; residual accepted for the ATO term.",
  },
  {
    id: "RSK-404",
    title: "Supply chain sub-tier visibility limited for two components",
    control: "SR-5",
    likelihood: "Moderate",
    impact: "Moderate",
    residual: "Moderate",
    mitigation: "SBOM attestation at each build; quarterly vendor review",
    poam: "POAM-0029",
    decision: "Deferred",
    rationale: "Revisit at the 12-month continuous monitoring checkpoint.",
  },
  {
    id: "RSK-405",
    title: "Audit forwarding latency exceeds overlay requirement",
    control: "AU-6(3)",
    likelihood: "Moderate",
    impact: "Low",
    residual: "Low",
    mitigation: "Config change staged, verification at TE-04",
    poam: "POAM-0046",
    decision: "Accepted",
    rationale: "Low residual; closure expected before the authorization memo is signed.",
  },
];

export const jiraProjects = ["TRIDENT", "AUTONOMY", "GROUND", "SECOPS"];
export const jiraAssignees = [
  "L. Moreau",
  "P. Lund",
  "S. Ibarra",
  "K. Nawaz",
  "J. Reyes",
  "T. Alvarez",
];
