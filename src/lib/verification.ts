import type { Tone } from "@/components/app/ui";

/* ------------------------------------------------------------------ types */

export type ScanSource =
  | "STIG Viewer"
  | "ACAS / Nessus"
  | "SonarQube"
  | "Manual statement";

export type IngestStatus = "Parsed" | "Parsing" | "Stale" | "Failed";

export type ScanIngest = {
  id: string;
  source: ScanSource;
  artifact: string;
  asset: string;
  ingested: string;
  status: IngestStatus;
  findings: number;
  catI: number;
  catII: number;
  catIII: number;
  coverage: number;
};

export type Severity = "CAT I" | "CAT II" | "CAT III";
export type FindingStatus = "Open" | "Mitigating" | "Risk accepted" | "Closed" | "False positive";

export type Finding = {
  id: string;
  ref: string;
  source: ScanSource;
  title: string;
  severity: Severity;
  control: string;
  asset: string;
  status: FindingStatus;
  age: number;
  due: string;
  owner: string;
  detail: string;
  mitigation: string;
};

export type CheckVerdict = "Pass" | "Fail" | "At risk" | "Not started";

export type ScaCheck = {
  id: string;
  name: string;
  requirement: string;
  verdict: CheckVerdict;
  gate: "TRR" | "IATT" | "SAR";
  finding: string;
  evidence: string;
};

export type TestEvent = {
  id: string;
  name: string;
  range: string;
  start: string;
  end: string;
  status: "Scheduled" | "In progress" | "Complete" | "At risk";
  requires: string;
};

/* ------------------------------------------------------------------ tones */

export const ingestTone: Record<IngestStatus, Tone> = {
  Parsed: "success",
  Parsing: "info",
  Stale: "warning",
  Failed: "danger",
};

export const severityTone: Record<Severity, Tone> = {
  "CAT I": "danger",
  "CAT II": "warning",
  "CAT III": "neutral",
};

export const findingStatusTone: Record<FindingStatus, Tone> = {
  Open: "danger",
  Mitigating: "warning",
  "Risk accepted": "info",
  Closed: "success",
  "False positive": "neutral",
};

export const verdictTone: Record<CheckVerdict, Tone> = {
  Pass: "success",
  Fail: "danger",
  "At risk": "warning",
  "Not started": "neutral",
};

export const testStatusTone: Record<TestEvent["status"], Tone> = {
  Scheduled: "info",
  "In progress": "warning",
  Complete: "success",
  "At risk": "danger",
};

export const sourceShort: Record<ScanSource, string> = {
  "STIG Viewer": "STIG",
  "ACAS / Nessus": "ACAS",
  SonarQube: "SAST",
  "Manual statement": "Manual",
};

/* ------------------------------------------------------------------- data */

export const scanIngests: ScanIngest[] = [
  {
    id: "ING-2201",
    source: "STIG Viewer",
    artifact: "RHEL9_V2R1_mission-compute.ckl",
    asset: "Mission compute (x4)",
    ingested: "Aug 26, 2026 14:02",
    status: "Parsed",
    findings: 88,
    catI: 3,
    catII: 51,
    catIII: 34,
    coverage: 96,
  },
  {
    id: "ING-2202",
    source: "ACAS / Nessus",
    artifact: "acas_uuv_segment_20260826.nessus",
    asset: "UUV payload segment",
    ingested: "Aug 26, 2026 09:41",
    status: "Parsed",
    findings: 142,
    catI: 2,
    catII: 63,
    catIII: 77,
    coverage: 91,
  },
  {
    id: "ING-2203",
    source: "SonarQube",
    artifact: "sonar-report-autonomy-core@1.14.2",
    asset: "Autonomy core (C++)",
    ingested: "Aug 25, 2026 22:18",
    status: "Parsed",
    findings: 47,
    catI: 1,
    catII: 18,
    catIII: 28,
    coverage: 88,
  },
  {
    id: "ING-2204",
    source: "STIG Viewer",
    artifact: "Cisco_IOS_XE_V3R2_range-net.ckl",
    asset: "Range network stack",
    ingested: "Aug 19, 2026 11:07",
    status: "Stale",
    findings: 34,
    catI: 0,
    catII: 12,
    catIII: 22,
    coverage: 74,
  },
  {
    id: "ING-2205",
    source: "Manual statement",
    artifact: "PE-family-implementation-statements.md",
    asset: "Integration lab (SCIF)",
    ingested: "Aug 24, 2026 16:35",
    status: "Parsed",
    findings: 0,
    catI: 0,
    catII: 0,
    catIII: 0,
    coverage: 100,
  },
  {
    id: "ING-2206",
    source: "ACAS / Nessus",
    artifact: "acas_ground_station_20260827.nessus",
    asset: "Ground station",
    ingested: "Aug 27, 2026 06:12",
    status: "Parsing",
    findings: 0,
    catI: 0,
    catII: 0,
    catIII: 0,
    coverage: 0,
  },
];

export const findings: Finding[] = [
  {
    id: "F-9001",
    ref: "V-257777",
    source: "STIG Viewer",
    title: "FIPS 140-3 mode not enabled on mission compute boot chain",
    severity: "CAT I",
    control: "SC-13",
    asset: "Mission compute (x4)",
    status: "Mitigating",
    age: 12,
    due: "Sep 05, 2026",
    owner: "D. Okafor",
    detail:
      "Kernel crypto policy is set to DEFAULT rather than FIPS. STIG rule requires FIPS-validated modules for all cryptographic operations on the mission boot chain.",
    mitigation:
      "Rebuild golden image with fips=1 kernel arg; re-run CKL after image promotion to the integration lab.",
  },
  {
    id: "F-9002",
    ref: "CVE-2026-21841",
    source: "ACAS / Nessus",
    title: "Remote code execution in payload telemetry broker (unauthenticated)",
    severity: "CAT I",
    control: "SI-2",
    asset: "UUV payload segment",
    status: "Open",
    age: 4,
    due: "Aug 31, 2026",
    owner: "A. Rivera",
    detail:
      "ACAS plugin 219884 flags an unauthenticated RCE in the MQTT broker build shipped with payload telemetry 3.2.0. Reachable from the range test VLAN.",
    mitigation: "Pending — patch 3.2.4 in integration test, planned promotion Aug 30.",
  },
  {
    id: "F-9003",
    ref: "V-257812",
    source: "STIG Viewer",
    title: "Session lock not enforced after 15 minutes of inactivity",
    severity: "CAT II",
    control: "AC-11",
    asset: "Ground station",
    status: "Open",
    age: 9,
    due: "Sep 12, 2026",
    owner: "M. Chen",
    detail: "Operator consoles inherit a 30-minute idle timeout from the site GPO.",
    mitigation: "Override at the OU level for the program consoles; evidence via GPO export.",
  },
  {
    id: "F-9004",
    ref: "cpp:S3630",
    source: "SonarQube",
    title: "Unbounded memcpy in autonomy waypoint deserializer",
    severity: "CAT I",
    control: "SI-10",
    asset: "Autonomy core (C++)",
    status: "Mitigating",
    age: 6,
    due: "Sep 02, 2026",
    owner: "J. Patel",
    detail:
      "Static analysis flags a buffer write sized from an attacker-influenced length field in the waypoint packet parser.",
    mitigation: "Bounds check merged in PR #1841; awaiting re-scan to clear the blocker.",
  },
  {
    id: "F-9005",
    ref: "CVE-2025-40901",
    source: "ACAS / Nessus",
    title: "OpenSSL 3.0.x below patch level on range network stack",
    severity: "CAT II",
    control: "SI-2",
    asset: "Range network stack",
    status: "Risk accepted",
    age: 41,
    due: "Oct 15, 2026",
    owner: "S. Chen",
    detail: "Vendor firmware pins the OpenSSL build; no upstream patch until Q1.",
    mitigation: "Compensating control: segment isolation + IDS signature; accepted by AO through IATT.",
  },
  {
    id: "F-9006",
    ref: "V-257903",
    source: "STIG Viewer",
    title: "Audit records not offloaded to central collector every 15 minutes",
    severity: "CAT II",
    control: "AU-4",
    asset: "Mission compute (x4)",
    status: "Mitigating",
    age: 15,
    due: "Sep 08, 2026",
    owner: "D. Okafor",
    detail: "rsyslog forwarding configured but queue spills to disk under DDIL conditions.",
    mitigation: "Increase disk queue and add store-and-forward replay; re-test in DDIL profile.",
  },
  {
    id: "F-9007",
    ref: "java:S2245",
    source: "SonarQube",
    title: "Insecure random used for session nonce in ground services",
    severity: "CAT II",
    control: "SC-13",
    asset: "Ground station",
    status: "Closed",
    age: 22,
    due: "Aug 20, 2026",
    owner: "M. Chen",
    detail: "java.util.Random replaced with SecureRandom.",
    mitigation: "Fixed and verified in scan ING-2203.",
  },
  {
    id: "F-9008",
    ref: "V-258011",
    source: "STIG Viewer",
    title: "Removable media write not restricted on lab workstations",
    severity: "CAT III",
    control: "MP-7",
    asset: "Integration lab (SCIF)",
    status: "Open",
    age: 18,
    due: "Sep 30, 2026",
    owner: "R. Solano",
    detail: "USB mass storage class not blocked by policy on two lab workstations.",
    mitigation: "Apply device control policy; capture screenshot evidence for the assessor.",
  },
  {
    id: "F-9009",
    ref: "CVE-2026-11204",
    source: "ACAS / Nessus",
    title: "TLS 1.0 accepted by legacy telemetry ingest listener",
    severity: "CAT II",
    control: "SC-8",
    asset: "UUV payload segment",
    status: "Open",
    age: 7,
    due: "Sep 10, 2026",
    owner: "A. Rivera",
    detail: "Listener negotiates TLS 1.0 for backwards compatibility with the legacy test harness.",
    mitigation: "Retire the harness path; force TLS 1.2+ with DoD-approved cipher suite.",
  },
  {
    id: "F-9010",
    ref: "V-257650",
    source: "STIG Viewer",
    title: "Emergency administrator account lacks documented approval",
    severity: "CAT III",
    control: "AC-2",
    asset: "Range network stack",
    status: "False positive",
    age: 30,
    due: "—",
    owner: "S. Chen",
    detail: "Account is the vendor-required break-glass identity, documented in the SSP appendix.",
    mitigation: "Marked false positive with SSP reference; assessor artifact attached.",
  },
];

export const scaChecks: ScaCheck[] = [
  {
    id: "SCA-01",
    name: "No open CAT I findings",
    requirement: "Zero unmitigated CAT I across all ingested scan sources",
    verdict: "Fail",
    gate: "IATT",
    finding: "F-9002 open, 2 CAT I mitigating",
    evidence: "ING-2201, ING-2202, ING-2203",
  },
  {
    id: "SCA-02",
    name: "CAT II mitigation plan on file",
    requirement: "Every open CAT II has a POA&M item with a scheduled completion",
    verdict: "At risk",
    gate: "TRR",
    finding: "2 CAT II without linked POA&M",
    evidence: "POA&M register",
  },
  {
    id: "SCA-03",
    name: "Scan currency",
    requirement: "All authorization-boundary assets scanned within 30 days",
    verdict: "At risk",
    gate: "TRR",
    finding: "Range network stack last scanned Aug 19",
    evidence: "ING-2204 (stale)",
  },
  {
    id: "SCA-04",
    name: "Asset coverage",
    requirement: "100% of boundary assets have a STIG or ACAS result",
    verdict: "Pass",
    gate: "TRR",
    finding: "6 of 6 assets covered",
    evidence: "Coverage report",
  },
  {
    id: "SCA-05",
    name: "Implementation statements complete",
    requirement: "Every selected control has an implementation statement in the SSP",
    verdict: "Pass",
    gate: "IATT",
    finding: "218 of 218 statements present",
    evidence: "SSP §13",
  },
  {
    id: "SCA-06",
    name: "Assessment procedures executed",
    requirement: "SAP test cases executed and results recorded for assessed controls",
    verdict: "At risk",
    gate: "SAR",
    finding: "41 of 62 procedures executed",
    evidence: "Test log TL-118",
  },
  {
    id: "SCA-07",
    name: "Continuous monitoring plan approved",
    requirement: "ConMon strategy signed prior to range operations",
    verdict: "Not started",
    gate: "SAR",
    finding: "Draft in review with ISSM",
    evidence: "—",
  },
];

export const testEvents: TestEvent[] = [
  {
    id: "TE-01",
    name: "Cyber table-top / SAP dry run",
    range: "Integration lab (SCIF)",
    start: "Sep 01, 2026",
    end: "Sep 03, 2026",
    status: "Scheduled",
    requires: "None",
  },
  {
    id: "TE-02",
    name: "Control validation — technical scans",
    range: "Integration lab (SCIF)",
    start: "Sep 07, 2026",
    end: "Sep 11, 2026",
    status: "Scheduled",
    requires: "Fresh ACAS on all assets",
  },
  {
    id: "TE-03",
    name: "TRR — Test Readiness Review",
    range: "Program office",
    start: "Sep 18, 2026",
    end: "Sep 18, 2026",
    status: "At risk",
    requires: "Zero open CAT I",
  },
  {
    id: "TE-04",
    name: "Range integration — Keyport, in-water",
    range: "NUWC Keyport range",
    start: "Oct 05, 2026",
    end: "Oct 23, 2026",
    status: "Scheduled",
    requires: "Active IATT",
  },
  {
    id: "TE-05",
    name: "Operational assessment event 1",
    range: "NUWC Keyport range",
    start: "Nov 09, 2026",
    end: "Nov 20, 2026",
    status: "At risk",
    requires: "IATT extension or ATO",
  },
];

export const iatt = {
  status: "Requested" as const,
  requested: "Aug 21, 2026",
  decisionTarget: "Sep 25, 2026",
  effective: "Oct 01, 2026",
  expires: "Dec 30, 2026",
  authorizing: "Navy AO — PEO USC",
  windowDays: 90,
};
