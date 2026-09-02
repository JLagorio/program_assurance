/**
 * Chunk 10 of the CCI spine — automated ingestion.
 *
 * There is no backend here and no file upload, so this module does not pretend
 * to parse a file the user picked. What it models faithfully is the shape of
 * what real scanners emit — a STIG checklist row carries a Vuln number and a
 * CCI reference list, a Nessus row carries a plugin id and a risk factor, a
 * SonarQube issue carries a rule key and a CWE list, a CycloneDX-VEX statement
 * carries a purl and an analysis state — and then it runs the part of a real
 * pipeline that actually has logic in it: normalization, node resolution,
 * deduplication by source authority, correlation to the existing register, and
 * scan-over-scan diff.
 *
 * Invariants held here:
 *  - A `NativeResult` is a discriminated union on `format`. Every normalizer
 *    sees the fields its own format really carries and nothing else, which is
 *    the only way the mapping rules below can be written honestly.
 *  - Nothing is invented. A CCI is used when the format states one, when the
 *    XCCDF idents carry one, or when a rule id resolves through the catalog's
 *    inverse rule index. Formats that assert vulnerabilities against components
 *    rather than requirements (SAST, SCA, fuzzing, firmware) get `cci: null`
 *    and an `unresolved` entry naming exactly what is missing.
 *  - Every mapping decision reports its own basis string. `severityBasis` names
 *    the native value it came from, `nodeBasis` names the resolution clause that
 *    fired, `DedupGroup.basis` names the authority rule that picked the primary.
 *    The UI shows these; a pipeline whose reasoning is invisible is a pipeline
 *    nobody will sign off on.
 *  - A clean row (the tool says pass / not applicable / not affected) still
 *    normalizes, because it is evidence of coverage, but it never becomes a
 *    proposed finding and it never accumulates requirement-side `unresolved`
 *    entries — it is not a candidate finding, so there is nothing to resolve.
 *    Node resolution failures ARE always recorded, clean or not, so no result
 *    can sit without a node and without a reason.
 *  - Nothing reads a clock. Timestamps are display strings and ordering is done
 *    by parsing them into a sortable integer, so the server and client renders
 *    agree.
 *
 * Imports run one way: this module reads composition, findings and the control
 * catalog. None of them import it back.
 */

import type { Tone } from "@/ds/primitives";
import { ccis, rulesByCci } from "@/lib/catalog";
import {
  ancestorsOf,
  compositionNodes,
  graphVersion,
  nodeById,
  nodeForAsset,
  nodesByPartKey,
} from "@/lib/composition";
import { assets, findings, isDeficiency, type VerificationPath } from "@/lib/findings";
import type { ChecklistStatus, FindingSeverity, ScanState } from "@/lib/spine";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type ScanFormat =
  | "STIG CKL"
  | "STIG CKLB"
  | "SCAP XCCDF"
  | "ACAS Nessus"
  | "SAST SonarQube"
  | "SCA CycloneDX-VEX"
  | "Fuzzing"
  | "Firmware analysis";

/**
 * Declared once in the spine. Re-exported so consumers can keep importing the
 * ingestion vocabulary from the module that produces the rows.
 */
export type { ScanState } from "@/lib/spine";

export type ScanRun = {
  id: string; // SCN-
  format: ScanFormat;
  tool: string;
  /** BM- or the benchmark name and version, "—" when not applicable. */
  benchmark: string;
  program: string; // PRG-
  /** CN- ids the scan actually covered. */
  targets: string[];
  operator: string;
  started: string; // "MMM DD, YYYY HH:MM"
  completed: string;
  file: string;
  sha256: string;
  /** Native record count before normalization. */
  rawItems: number;
  state: ScanState;
  /** SCN- this run supersedes for the same target and format, or null. */
  supersedes: string | null;
  note: string;
};

/**
 * One native record as the tool emits it, before normalization. The union is
 * discriminated on `format` so each normalizer sees the real fields that format
 * actually carries — this is where a real pipeline earns its keep.
 */
export type NativeResult =
  | {
      format: "STIG CKL" | "STIG CKLB";
      scan: string;
      vulnNum: string;
      ruleId: string;
      ruleTitle: string;
      severity: "high" | "medium" | "low";
      status: ChecklistStatus;
      findingDetails: string;
      comments: string;
      cciRefs: string[];
    }
  | {
      format: "SCAP XCCDF";
      scan: string;
      ruleId: string;
      title: string;
      result: "pass" | "fail" | "notapplicable" | "notchecked";
      severity: "high" | "medium" | "low";
      idents: string[];
    }
  | {
      format: "ACAS Nessus";
      scan: string;
      pluginId: string;
      pluginName: string;
      riskFactor: "Critical" | "High" | "Medium" | "Low" | "None";
      cve: string[];
      cvss: number;
      host: string;
      port: number;
      output: string;
      /**
       * Audit-file compliance fields, present only on rows an audit file
       * produced. Plugin 21157 (Unix) / 21156 (Windows) is the single generic
       * compliance plugin every check reports under, so the plugin id says only
       * "this row came from an audit file"; the per-check identity lives in
       * `cm:compliance-check-name`, the verdict in `cm:compliance-result`, and
       * the requirement in `cm:compliance-reference`
       * (`CAT|…,CCI|…,Rule-ID|…,Vuln-ID|…`). Modelling them is the only way the
       * CCI can be read from the record rather than asserted about it.
       */
      complianceCheckName?: string;
      complianceResult?: "PASSED" | "FAILED" | "WARNING" | "ERROR";
      complianceReference?: string;
    }
  | {
      format: "SAST SonarQube";
      scan: string;
      key: string;
      rule: string;
      message: string;
      type: "VULNERABILITY" | "BUG" | "CODE_SMELL";
      sonarSeverity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR";
      component: string;
      line: number;
      cwe: string[];
    }
  | {
      format: "SCA CycloneDX-VEX";
      scan: string;
      purl: string;
      vulnerability: string;
      cvss: number;
      kev: boolean;
      analysisState: "exploitable" | "not_affected" | "in_triage";
      justification: string;
      fixedIn: string;
    }
  | {
      format: "Fuzzing";
      scan: string;
      campaign: string;
      crashId: string;
      signal: string;
      stackHash: string;
      reproducible: boolean;
      iterations: number;
      target: string;
    }
  | {
      format: "Firmware analysis";
      scan: string;
      imageDigest: string;
      checkId: string;
      check: string;
      verdict: "pass" | "fail" | "warn";
      detail: string;
      offset: string;
    };

/** The common shape every format normalizes into. */
export type NormalizedResult = {
  /** `${scan}:${nativeId}` — stable and traceable back to the tool. */
  id: string;
  scan: string; // SCN-
  format: ScanFormat;
  nativeId: string;
  /** CCI- when the format or the rule map yields one, else null. */
  cci: string | null;
  /** The clause that produced (or declined to produce) the CCI, named in full. */
  cciBasis: string;
  /** Control natural key when derivable from the CCI, else null. */
  control: string | null;
  rule: string | null; // V- when the source is rule-based
  /** CN- the result lands on. Resolved, never guessed silently. */
  node: string | null;
  nodeBasis: string;
  title: string;
  severity: FindingSeverity;
  /** The native value it was mapped from, and the clause that mapped it. */
  severityBasis: string;
  /** True when the tool says the check passed, is not applicable, or is not affected. */
  clean: boolean;
  detail: string;
  /**
   * Anything the normalizer could not resolve; a non-empty list means the row
   * needs an analyst before it can become a Finding.
   */
  unresolved: string[];
};

export type DedupGroup = {
  /** `${cci ?? "—"}|${node ?? "—"}|${rule ?? nativeId}` */
  key: string;
  /** The result kept, chosen by source authority. */
  primary: NormalizedResult;
  duplicates: NormalizedResult[];
  /** Distinct formats that reported it — the provenance the analyst reads. */
  sources: ScanFormat[];
  /** Why `primary` won. */
  basis: string;
  /** FND- the primary already corresponds to, when one exists. */
  existing: string | null;
  /**
   * Every FND- any member of the group corresponds to. A cross-format duplicate
   * pair that was filed twice in the register resolves to both ids here, which
   * is how the register learns the second row was never a second weakness.
   */
  existingAll: string[];
};

export type IngestDiffState = "New" | "Persistent" | "Fixed" | "Reappeared";

export type IngestDiffRow = {
  key: string;
  state: IngestDiffState;
  title: string;
  severity: FindingSeverity;
  node: string | null;
  /** SCN- it was last seen in. */
  lastSeen: string;
  firstSeen: string;
  occurrences: number;
};

/**
 * A finding the superseded run reported and this run does not, which is
 * nonetheless NOT clear for closure because another run the program currently
 * relies on still reports the same condition. Reported rather than silently
 * dropped: two current runs disagreeing about one requirement on one asset is
 * exactly the fact an assessor needs to see.
 */
export type ContestedClosure = {
  /** FND- that would otherwise have been queued for closure. */
  finding: string;
  /** SCN- ids of current runs that still report it, newest first. */
  scans: string[];
  /** The contradiction, spelled out for the rail. */
  basis: string;
};

export type IngestBatch = {
  scan: string;
  groups: DedupGroup[];
  /** Groups with no matching Finding — the analyst's queue. */
  proposed: DedupGroup[];
  /**
   * Existing deficiencies the superseded run reported, this scan no longer
   * reports, and no other current run of the program reports either — the only
   * ones the evidence actually clears for closure.
   */
  closable: string[]; // FND-
  /** The ones the scan stopped reporting that another current run still holds open. */
  contested: ContestedClosure[];
  diff: IngestDiffRow[];
  counts: { raw: number; normalized: number; clean: number; deduped: number; unresolved: number };
};

/* ── Tone maps ───────────────────────────────────────────────────────────── */

/**
 * A format is a property, not a status, so most of these are neutral outline
 * chips. The three benchmark formats read `info` because they are the
 * authoritative statement about a configuration setting and the Duplicates tab
 * needs the winner to be legible at a glance.
 */
export const formatTone: Record<ScanFormat, Tone> = {
  "STIG CKL": "info",
  "STIG CKLB": "info",
  "SCAP XCCDF": "info",
  "ACAS Nessus": "neutral",
  "SAST SonarQube": "neutral",
  "SCA CycloneDX-VEX": "neutral",
  Fuzzing: "neutral",
  "Firmware analysis": "neutral",
};

export const scanStateTone: Record<ScanState, Tone> = {
  Received: "neutral",
  Normalized: "info",
  Reconciled: "success",
  Rejected: "danger",
};

export const diffStateTone: Record<IngestDiffState, Tone> = {
  New: "info",
  Persistent: "warning",
  Fixed: "success",
  Reappeared: "danger",
};

/* ── Scan runs ───────────────────────────────────────────────────────────── */

export const scanRuns: ScanRun[] = [
  {
    id: "SCN-1001",
    format: "STIG CKL",
    tool: "STIG Viewer 2.18",
    benchmark: "BM-RHEL9 V2R1",
    program: "PRG-1041",
    targets: ["CN-0110"],
    operator: "Marta Vinsley",
    started: "Jul 30, 2026 02:10",
    completed: "Jul 30, 2026 03:41",
    file: "gcs-app-01_RHEL_9_STIG_V2R1.ckl",
    sha256: "f725207831fb84d7eeb0f2ed331ce2ebe2e2f10add1179eaea15c7c5f012e104",
    rawItems: 5,
    state: "Reconciled",
    supersedes: null,
    note: "Quarterly manual checklist against the V2R1 benchmark. Only the rules that moved off Not Reviewed in this cycle are carried into the register; the rest of the 386-rule benchmark kept its prior answer.",
  },
  {
    id: "SCN-1002",
    format: "STIG CKL",
    tool: "STIG Viewer 2.18",
    benchmark: "BM-RHEL9 V2R3",
    program: "PRG-1041",
    targets: ["CN-0110"],
    operator: "Marta Vinsley",
    started: "Aug 13, 2026 02:05",
    completed: "Aug 13, 2026 03:22",
    file: "gcs-app-01_RHEL_9_STIG_V2R3.ckl",
    sha256: "ffc96eb02f4505e4aefac269c450a076becfb1d96478255a142233f81f579a43",
    rawItems: 5,
    state: "Reconciled",
    supersedes: "SCN-1001",
    note: "First run on V2R3 after the July benchmark drop. The audit offload and account lockout rules answered Not a Finding for the first time in this cycle.",
  },
  {
    id: "SCN-1003",
    format: "STIG CKL",
    tool: "STIG Viewer 2.18",
    benchmark: "BM-RHEL9 V2R3",
    program: "PRG-1041",
    targets: ["CN-0110"],
    operator: "Marta Vinsley",
    started: "Aug 27, 2026 04:10",
    completed: "Aug 27, 2026 05:36",
    file: "gcs-app-01_RHEL_9_STIG_V2R3_20260827.ckl",
    sha256: "426ab1eede74d2f82c59e3a4af7d15c64281289867fbd23d13829ae90699b03f",
    rawItems: 6,
    state: "Reconciled",
    supersedes: "SCN-1002",
    note: "Current checklist of record for gcs-app-01. The audit offload rule answered Open again after the aggregator capacity change was rolled back on Aug 21.",
  },
  {
    id: "SCN-1004",
    format: "STIG CKLB",
    tool: "Evaluate-STIG 1.2508.1",
    benchmark: "BM-RHEL9 V2R3",
    program: "PRG-1041",
    targets: ["CN-0122"],
    operator: "Automation — evaluate-stig-runner",
    started: "Aug 27, 2026 04:10",
    completed: "Aug 27, 2026 04:29",
    file: "gcs-app-02_RHEL_9_STIG_V2R3.cklb",
    sha256: "9efabf85a642f630da6effdb39653cd428061e6db5741e6a7e30d3e00968f41b",
    rawItems: 4,
    state: "Reconciled",
    supersedes: null,
    note: "Automated CKLB scoped to the RHEL 9.4 build rather than the chassis, which is how Evaluate-STIG reports. gcs-app-02 answers Not a Finding on GSSAPI where gcs-app-01 does not — the two application hosts have drifted apart.",
  },
  {
    id: "SCN-1005",
    format: "SCAP XCCDF",
    tool: "SCC 5.10.1",
    benchmark: "BM-RHEL9 V2R3",
    program: "PRG-1041",
    targets: ["CN-0131"],
    operator: "Automation — scc-nightly",
    started: "Aug 25, 2026 03:44",
    completed: "Aug 25, 2026 03:58",
    file: "gcs-db-01_RHEL_9_STIG_SCAP_1-3_Benchmark-xccdf.results.xml",
    sha256: "714559444709299688dee8827889f25ac809d9c0bde29465428852bdb14a533d",
    rawItems: 4,
    state: "Reconciled",
    supersedes: null,
    note: "Nightly SCAP run on the database host. One rule result carries a V-id in its idents but no CCI, so it is held for analyst mapping rather than guessed at.",
  },
  {
    id: "SCN-1006",
    format: "SCAP XCCDF",
    tool: "OpenSCAP 1.3.10",
    benchmark: "BM-RHEL9 V2R3",
    program: "PRG-1041",
    targets: ["CN-0113"],
    operator: "Automation — oscap-nightly",
    started: "Aug 27, 2026 03:30",
    completed: "Aug 27, 2026 03:47",
    file: "gcs-app-01_rhel9_oscap-xccdf.results.xml",
    sha256: "49d56b9c0f9792397a45356ec4995d0d6d4c9e3c50f9dddff47e9832c5f22198",
    rawItems: 4,
    state: "Reconciled",
    supersedes: null,
    note: "Filesystem and sshd hardening subset run by the OS build pipeline. Scoped to the RHEL 9.4 kernel node, so its results land on the same part key as the gcs-app-02 and gcs-db-01 runs.",
  },
  {
    id: "SCN-1007",
    format: "ACAS Nessus",
    tool: "Tenable.sc 6.4.1 / Nessus 10.8.3",
    benchmark: "RHEL 9 DISA STIG audit file v2r3",
    program: "PRG-1041",
    targets: ["CN-0110", "CN-0120", "CN-0130"],
    operator: "Dmitri Kolar",
    started: "Aug 12, 2026 01:00",
    completed: "Aug 12, 2026 02:14",
    file: "ACAS_GCS_credentialed_20260812.nessus",
    sha256: "c8265124e126b096b70e07aa3cddb078496c37bfd474415e621a18356a866429",
    rawItems: 4,
    state: "Reconciled",
    supersedes: null,
    note: "Credentialed sweep of the ground control segment with the DISA compliance audit file attached. The audit-file check RHEL-09-653080 reported the audit offload failing on gcs-db-01; the Aug 25 ACAS run no longer reports it, but the Aug 25 SCAP run still does against the same host, so FND-2240 is held open rather than queued for closure.",
  },
  {
    id: "SCN-1008",
    format: "ACAS Nessus",
    tool: "Tenable.sc 6.4.1 / Nessus 10.8.3",
    benchmark: "RHEL 9 DISA STIG audit file v2r3",
    program: "PRG-1041",
    targets: ["CN-0110", "CN-0120", "CN-0130"],
    operator: "Dmitri Kolar",
    started: "Aug 25, 2026 01:00",
    completed: "Aug 25, 2026 02:21",
    file: "ACAS_GCS_credentialed_20260825.nessus",
    sha256: "4dae6d3229c656f000d27bb4af11a98a3aa2b033670e5c7ba829079f426768be",
    rawItems: 4,
    state: "Reconciled",
    supersedes: "SCN-1007",
    note: "Current ACAS run of record. Plugin 71049 fires on gcs-app-01 for the same sshd_config setting the manual checklist already reports, which is what the duplicate reconciliation exists to catch.",
  },
  {
    id: "SCN-1009",
    format: "SAST SonarQube",
    tool: "SonarQube 10.6 (Enterprise)",
    benchmark: "—",
    program: "PRG-1041",
    targets: ["CN-0210", "CN-0215"],
    operator: "Automation — mission-api CI",
    started: "Aug 26, 2026 22:31",
    completed: "Aug 26, 2026 22:48",
    file: "sonar-report-atlas-mission-api-2.14.0.json",
    sha256: "00682f18c58cf9cec0310ac72a6c6080f02de65bcb8d67594604f6f2d073383e",
    rawItems: 5,
    state: "Normalized",
    supersedes: null,
    note: "Static analysis of the 2.14.0 tag. SonarQube asserts CWEs, not CCIs, so every issue here is held for analyst mapping — the pipeline reports what it could not resolve instead of guessing a control.",
  },
  {
    id: "SCN-1010",
    format: "SCA CycloneDX-VEX",
    tool: "Dependency-Track 4.11.4 (CycloneDX 1.6)",
    benchmark: "—",
    program: "PRG-1041",
    targets: ["CN-0210"],
    operator: "Automation — mission-api CI",
    started: "Aug 26, 2026 22:49",
    completed: "Aug 26, 2026 22:53",
    file: "mission-api-2.14.0-vex.cdx.json",
    sha256: "0a50354a450a4a3e1ffc1a673349faefc7155b4b6a618c0431dccec891191f79",
    rawItems: 6,
    state: "Normalized",
    supersedes: null,
    note: "VEX statements against the BOM-0001 component list. One statement is not_affected with a real justification, one carries a KEV listing that overrides its CVSS, and one names a component that is in the image but not in the composition graph.",
  },
  {
    id: "SCN-1011",
    format: "Fuzzing",
    tool: "libFuzzer / OSS-Fuzz harness 2.14.0-fuzz",
    benchmark: "—",
    program: "PRG-1041",
    targets: ["CN-0215"],
    operator: "Wes Duarte",
    started: "Aug 18, 2026 09:00",
    completed: "Aug 20, 2026 09:00",
    file: "mission-api-fuzz-20260820-summary.json",
    sha256: "f4be63a390d37d393a66fde645b87b8dc708a80044ff1bd32c00fbfbec6bfec6",
    rawItems: 4,
    state: "Received",
    supersedes: null,
    note: "48-hour continuous fuzz across three harnesses ahead of TE-0044. Crash e5510b8d did not reproduce on replay and is floored at CAT III rather than dropped.",
  },
  {
    id: "SCN-1012",
    format: "Firmware analysis",
    tool: "binwalk 2.3.4 + FACT 4.2",
    benchmark: "—",
    program: "PRG-1041",
    targets: ["CN-0310"],
    operator: "Priya Raghunathan",
    started: "Aug 24, 2026 08:15",
    completed: "Aug 24, 2026 09:02",
    file: "edge-sw-a1_iosxe_17.9.4a_fwreport.json",
    sha256: "f93d579a12c7f0ef822a20f0b78fae151fae9bc67cc230ce3c909cb4f4911665",
    rawItems: 5,
    state: "Received",
    supersedes: null,
    note: "Offline analysis of the extracted IOS-XE and ROMMON images. Every check reports against an image digest, so results land on the firmware node rather than the chassis.",
  },
];

export const scanById = new Map(scanRuns.map((s) => [s.id, s]));

/* ── Native results ──────────────────────────────────────────────────────── */

export const nativeResults: NativeResult[] = [
  /* SCN-1001 — STIG CKL, gcs-app-01, V2R1, Jul 30 */
  {
    format: "STIG CKL",
    scan: "SCN-1001",
    vulnNum: "V-257984",
    ruleId: "SV-257984r991589_rule",
    ruleTitle: "RHEL 9 SSH daemon must not allow GSSAPI authentication.",
    severity: "high",
    status: "Open",
    findingDetails:
      "grep -i gssapi /etc/ssh/sshd_config returns 'GSSAPIAuthentication yes'. The setting is present in the running configuration and survives an sshd reload.",
    comments:
      "Kerberos single sign-on was enabled for the operator group in 2024 and never retired after the PIV rollout.",
    cciRefs: ["CCI-000765"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1001",
    vulnNum: "V-258145",
    ruleId: "SV-258145r958424_rule",
    ruleTitle: "RHEL 9 must offload audit records onto a different system in real time.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "rsyslog omfwd is configured to the aggregator but the disk-assisted queue drains on a 36-hour cycle, so records reach the aggregator well outside the defined window.",
    comments: "Aggregator ingest capacity is the constraint, not the forwarder configuration.",
    cciRefs: ["CCI-001851"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1001",
    vulnNum: "V-257824",
    ruleId: "SV-257824r991554_rule",
    ruleTitle: "RHEL 9 must implement a FIPS 140-3 approved cryptographic module.",
    severity: "high",
    status: "Open",
    findingDetails:
      "fips-mode-setup --check reports 'FIPS mode is disabled.' and /proc/sys/crypto/fips_enabled reads 0.",
    comments: "Host was rebuilt on Jul 18 from an image that predates the FIPS kickstart change.",
    cciRefs: ["CCI-000803"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1001",
    vulnNum: "V-258201",
    ruleId: "SV-258201r958388_rule",
    ruleTitle:
      "RHEL 9 must automatically lock an account when three unsuccessful logon attempts occur.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "faillock deny is set to 5 in /etc/security/faillock.conf, above the organization-defined limit of 3.",
    comments: "Value inherited from the pre-migration Ansible role.",
    cciRefs: ["CCI-000044"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1001",
    vulnNum: "V-257777",
    ruleId: "SV-257777r958524_rule",
    ruleTitle: "RHEL 9 must be a vendor-supported release.",
    severity: "high",
    status: "Not a Finding",
    findingDetails:
      "cat /etc/redhat-release reports 'Red Hat Enterprise Linux release 9.4 (Plow)', inside the vendor support window until May 2032.",
    comments: "—",
    cciRefs: ["CCI-000366"],
  },

  /* SCN-1002 — STIG CKL, gcs-app-01, V2R3, Aug 13 */
  {
    format: "STIG CKL",
    scan: "SCN-1002",
    vulnNum: "V-257984",
    ruleId: "SV-257984r991589_rule",
    ruleTitle: "RHEL 9 SSH daemon must not allow GSSAPI authentication.",
    severity: "high",
    status: "Open",
    findingDetails:
      "GSSAPIAuthentication yes is still present in /etc/ssh/sshd_config. The Ansible drift job does not manage this key.",
    comments: "Tracked under POAM-0071; the golden sshd baseline change is scheduled for Sep.",
    cciRefs: ["CCI-000765"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1002",
    vulnNum: "V-257824",
    ruleId: "SV-257824r991554_rule",
    ruleTitle: "RHEL 9 must implement a FIPS 140-3 approved cryptographic module.",
    severity: "high",
    status: "Open",
    findingDetails:
      "fips-mode-setup --check still reports FIPS mode disabled. Enabling it requires a reboot that has not been scheduled inside a maintenance window.",
    comments: "Change request CHG-4471 raised on Aug 05.",
    cciRefs: ["CCI-000803"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1002",
    vulnNum: "V-258011",
    ruleId: "SV-258011r958424_rule",
    ruleTitle: "RHEL 9 must have the auditd service enabled and active.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "systemctl is-active auditd returns 'inactive'. The service failed to start after the Aug 09 kernel update and no alert fired.",
    comments: "New rule in V2R3; this host was not evaluated against it before Aug 13.",
    cciRefs: ["CCI-000169"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1002",
    vulnNum: "V-258145",
    ruleId: "SV-258145r958424_rule",
    ruleTitle: "RHEL 9 must offload audit records onto a different system in real time.",
    severity: "medium",
    status: "Not a Finding",
    findingDetails:
      "Measured spool drain across three cycles after the Aug 07 aggregator capacity increase averaged 9 hours, inside the 24-hour statement.",
    comments: "Re-tested against the same procedure used on Jul 30.",
    cciRefs: ["CCI-001851"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1002",
    vulnNum: "V-258201",
    ruleId: "SV-258201r958388_rule",
    ruleTitle:
      "RHEL 9 must automatically lock an account when three unsuccessful logon attempts occur.",
    severity: "medium",
    status: "Not a Finding",
    findingDetails:
      "faillock deny now reads 3 and unlock_time 0; a fourth failed attempt locked the test account as expected.",
    comments: "Ansible role updated on Aug 11.",
    cciRefs: ["CCI-000044"],
  },

  /* SCN-1003 — STIG CKL, gcs-app-01, V2R3, Aug 27 (current checklist of record) */
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-257984",
    ruleId: "SV-257984r991589_rule",
    ruleTitle: "RHEL 9 SSH daemon must not allow GSSAPI authentication.",
    severity: "high",
    status: "Open",
    findingDetails:
      "sshd_config sets GSSAPIAuthentication yes, allowing a non-PIV authentication path to a privileged interface. Confirmed against the running daemon with sshd -T.",
    comments:
      "Bastion-only reachability limits who can reach the interface but does not change what the interface accepts.",
    cciRefs: ["CCI-000765"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-258011",
    ruleId: "SV-258011r958424_rule",
    ruleTitle: "RHEL 9 must have the auditd service enabled and active.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "systemctl is-active auditd still returns 'inactive'. The unit is enabled but exits 1 on start because /var/log/audit is out of inodes.",
    comments: "Blocked on the separate audit partition change tracked by V-258066.",
    cciRefs: ["CCI-000169"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-258145",
    ruleId: "SV-258145r958424_rule",
    ruleTitle: "RHEL 9 must offload audit records onto a different system in real time.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "Spool drain measured at 31 hours on Aug 26. The Aug 07 aggregator capacity increase was rolled back on Aug 21 during the storage incident and was never re-applied.",
    comments: "Answered Not a Finding on Aug 13; the condition has returned.",
    cciRefs: ["CCI-001851"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-258066",
    ruleId: "SV-258066r958524_rule",
    ruleTitle: "RHEL 9 must allocate audit record storage capacity on a separate file system.",
    severity: "low",
    status: "Open",
    findingDetails:
      "findmnt /var/log/audit returns no separate mount; audit records share the root file system with application logs.",
    comments: "First evaluation of this rule on gcs-app-01.",
    cciRefs: ["CCI-001849"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-257824",
    ruleId: "SV-257824r991554_rule",
    ruleTitle: "RHEL 9 must implement a FIPS 140-3 approved cryptographic module.",
    severity: "high",
    status: "Not a Finding",
    findingDetails:
      "fips-mode-setup --check reports 'FIPS mode is enabled.' after the Aug 22 maintenance reboot; /proc/sys/crypto/fips_enabled reads 1.",
    comments: "Closed under CHG-4471.",
    cciRefs: ["CCI-000803"],
  },
  {
    format: "STIG CKL",
    scan: "SCN-1003",
    vulnNum: "V-257777",
    ruleId: "SV-257777r958524_rule",
    ruleTitle: "RHEL 9 must be a vendor-supported release.",
    severity: "high",
    status: "Not a Finding",
    findingDetails: "Release 9.4 (Plow) is inside the vendor support window until May 2032.",
    comments: "—",
    cciRefs: ["CCI-000366"],
  },

  /* SCN-1004 — STIG CKLB, gcs-app-02 */
  {
    format: "STIG CKLB",
    scan: "SCN-1004",
    vulnNum: "V-257258",
    ruleId: "SV-257258r958402_rule",
    ruleTitle: "RHEL 9 must initiate a session lock after 15 minutes of inactivity.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "tmux lock-after-time is unset for the operator group; a 30-minute idle test on an interactive shell did not lock the session.",
    comments: "Physical access to the console is limited to a controlled facility.",
    cciRefs: ["CCI-000057"],
  },
  {
    format: "STIG CKLB",
    scan: "SCN-1004",
    vulnNum: "V-257984",
    ruleId: "SV-257984r991589_rule",
    ruleTitle: "RHEL 9 SSH daemon must not allow GSSAPI authentication.",
    severity: "high",
    status: "Not a Finding",
    findingDetails:
      "sshd -T reports gssapiauthentication no. gcs-app-02 was rebuilt on Aug 04 from the hardened image that sets the key explicitly.",
    comments: "The same rule is Open on gcs-app-01 — the two application hosts have drifted apart.",
    cciRefs: ["CCI-000765"],
  },
  {
    format: "STIG CKLB",
    scan: "SCN-1004",
    vulnNum: "V-258011",
    ruleId: "SV-258011r958424_rule",
    ruleTitle: "RHEL 9 must have the auditd service enabled and active.",
    severity: "medium",
    status: "Open",
    findingDetails:
      "systemctl is-active auditd returns 'inactive'. Same failure mode as gcs-app-01 after the Aug 09 kernel update.",
    comments: "Fleet-wide condition on the RHEL 9.4 build, not a per-host misconfiguration.",
    cciRefs: ["CCI-000169"],
  },
  {
    format: "STIG CKLB",
    scan: "SCN-1004",
    vulnNum: "V-257936",
    ruleId: "SV-257936r991589_rule",
    ruleTitle: "RHEL 9 must not have the telnet-server package installed.",
    severity: "high",
    status: "Not Applicable",
    findingDetails:
      "The minimal build excludes the telnet-server package entirely; rpm -q telnet-server returns 'package telnet-server is not installed'.",
    comments: "Marked Not Applicable per the benchmark's own applicability statement.",
    cciRefs: ["CCI-000381"],
  },

  /* SCN-1005 — SCAP XCCDF, gcs-db-01 */
  {
    format: "SCAP XCCDF",
    scan: "SCN-1005",
    ruleId: "xccdf_mil.disa.stig_rule_SV-258145r958424_rule",
    title: "RHEL 9 must offload audit records onto a different system in real time.",
    result: "fail",
    severity: "medium",
    idents: ["CCI-001851", "V-258145"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1005",
    ruleId: "xccdf_mil.disa.stig_rule_SV-258094r991589_rule",
    title: "RHEL 9 must encrypt all persistent volumes at rest.",
    result: "fail",
    severity: "medium",
    idents: ["CCI-001199", "V-258094"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1005",
    ruleId: "xccdf_mil.disa.stig_rule_SV-257777r958524_rule",
    title: "RHEL 9 must be a vendor-supported release.",
    result: "pass",
    severity: "high",
    idents: ["CCI-000366", "V-257777"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1005",
    ruleId: "xccdf_mil.disa.stig_rule_SV-258212r958788_rule",
    title: "RHEL 9 must restrict access to the kernel message buffer.",
    result: "fail",
    severity: "low",
    idents: ["V-258212"],
  },

  /* SCN-1006 — SCAP XCCDF, gcs-app-01 OS build */
  {
    format: "SCAP XCCDF",
    scan: "SCN-1006",
    ruleId: "xccdf_mil.disa.stig_rule_SV-258093r991589_rule",
    title: "RHEL 9 must mount /tmp with the nodev option.",
    result: "fail",
    severity: "medium",
    idents: ["CCI-001764", "V-258093"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1006",
    ruleId: "xccdf_mil.disa.stig_rule_SV-257991r991589_rule",
    title: "RHEL 9 SSH daemon must not allow known hosts authentication.",
    result: "fail",
    severity: "medium",
    idents: ["CCI-000366", "V-257991"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1006",
    ruleId: "xccdf_mil.disa.stig_rule_SV-257903r958524_rule",
    title: "RHEL 9 must enable the hardware random number generator entropy gatherer service.",
    result: "pass",
    severity: "low",
    idents: ["CCI-000366", "V-257903"],
  },
  {
    format: "SCAP XCCDF",
    scan: "SCN-1006",
    ruleId: "xccdf_mil.disa.stig_rule_SV-258104r958524_rule",
    title: "RHEL 9 must disable the Ctrl-Alt-Delete key sequence.",
    result: "notapplicable",
    severity: "low",
    idents: ["CCI-000366", "V-258104"],
  },

  /* SCN-1007 — ACAS Nessus, GCS fleet, Aug 12 */
  {
    format: "ACAS Nessus",
    scan: "SCN-1007",
    pluginId: "71049",
    pluginName: "DISA STIG RHEL 9 compliance — sshd GSSAPIAuthentication must be disabled",
    riskFactor: "High",
    cve: [],
    cvss: 0,
    host: "gcs-app-01",
    port: 22,
    complianceCheckName: "RHEL-09-255045",
    complianceResult: "FAILED",
    complianceReference: "CAT|I,CCI|CCI-000765,Rule-ID|SV-257984r991589_rule,Vuln-ID|V-257984",
    output:
      '"GSSAPIAuthentication" is set to "yes" in /etc/ssh/sshd_config. Policy value expected: "no".',
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1007",
    pluginId: "51192",
    pluginName: "SSL Certificate Cannot Be Trusted",
    riskFactor: "Medium",
    cve: [],
    cvss: 6.5,
    host: "gcs-db-01",
    port: 5432,
    output:
      "The certificate presented on TCP 5432 is self-signed and its issuer is not in the DoD PKI trust store.",
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1007",
    pluginId: "156032",
    pluginName: "RHEL 9 : kernel (RHSA-2024:3618)",
    riskFactor: "High",
    cve: ["CVE-2024-26643", "CVE-2024-26642"],
    cvss: 7.8,
    host: "gcs-app-02",
    port: 0,
    output:
      "Installed package : kernel-5.14.0-427.13.1.el9_4 / Fixed package : kernel-5.14.0-427.28.1.el9_4",
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1007",
    pluginId: "21157",
    pluginName:
      "Unix Compliance Checks — RHEL-09-653080 audit records must be offloaded in real time",
    riskFactor: "Medium",
    cve: [],
    cvss: 0,
    host: "gcs-db-01",
    port: 0,
    complianceCheckName: "RHEL-09-653080",
    complianceResult: "FAILED",
    complianceReference: "CAT|II,CCI|CCI-001851,Rule-ID|SV-258145r958424_rule,Vuln-ID|V-258145",
    output: 'Audit forwarding queue drain measured at 36 hours against a policy value of "24".',
  },

  /* SCN-1008 — ACAS Nessus, GCS fleet, Aug 25 (current run of record) */
  {
    format: "ACAS Nessus",
    scan: "SCN-1008",
    pluginId: "71049",
    pluginName: "DISA STIG RHEL 9 compliance — sshd GSSAPIAuthentication must be disabled",
    riskFactor: "High",
    cve: [],
    cvss: 0,
    host: "gcs-app-01",
    port: 22,
    complianceCheckName: "RHEL-09-255045",
    complianceResult: "FAILED",
    complianceReference: "CAT|I,CCI|CCI-000765,Rule-ID|SV-257984r991589_rule,Vuln-ID|V-257984",
    output:
      '"GSSAPIAuthentication" is set to "yes" in /etc/ssh/sshd_config. Policy value expected: "no".',
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1008",
    pluginId: "51192",
    pluginName: "SSL Certificate Cannot Be Trusted",
    riskFactor: "Medium",
    cve: [],
    cvss: 6.5,
    host: "gcs-db-01",
    port: 5432,
    output:
      "The certificate presented on TCP 5432 is self-signed and its issuer is not in the DoD PKI trust store.",
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1008",
    pluginId: "179234",
    pluginName: "RHEL 9 : openssh (RHSA-2024:4616)",
    riskFactor: "High",
    cve: ["CVE-2024-6387"],
    cvss: 8.1,
    host: "gcs-app-01",
    port: 22,
    output:
      "Installed package : openssh-server-8.7p1-38.el9 / Fixed package : openssh-server-8.7p1-38.el9_4.1",
  },
  {
    format: "ACAS Nessus",
    scan: "SCN-1008",
    pluginId: "10287",
    pluginName: "Traceroute Information",
    riskFactor: "None",
    cve: [],
    cvss: 0,
    host: "gcs-app-02",
    port: 0,
    output: "For your information, here is the traceroute from the scanner to 10.42.6.21.",
  },

  /* SCN-1009 — SAST SonarQube, mission-api */
  {
    format: "SAST SonarQube",
    scan: "SCN-1009",
    key: "AZmT4kQ1c8pVfW2nX0aB",
    rule: "go:S2068",
    message: "Revoke and change this password, as it is compromised.",
    type: "VULNERABILITY",
    sonarSeverity: "BLOCKER",
    component: "atlas-mission-api:internal/auth/token.go",
    line: 142,
    cwe: ["CWE-798", "CWE-259"],
  },
  {
    format: "SAST SonarQube",
    scan: "SCN-1009",
    key: "AZmT4kQ1c8pVfW2nX0aC",
    rule: "go:S4830",
    message: "Enable server certificate validation on this SSL/TLS connection.",
    type: "VULNERABILITY",
    sonarSeverity: "MAJOR",
    component: "atlas-mission-api:internal/telemetry/client.go",
    line: 88,
    cwe: ["CWE-295"],
  },
  {
    format: "SAST SonarQube",
    scan: "SCN-1009",
    key: "AZmT4kQ1c8pVfW2nX0aD",
    rule: "go:S5542",
    message: "Use a secure cipher mode and padding scheme.",
    type: "VULNERABILITY",
    sonarSeverity: "CRITICAL",
    component: "atlas-mission-api:vendor/github.com/lestrrat-go/jwx/jwe/jwe.go",
    line: 311,
    cwe: ["CWE-327"],
  },
  {
    format: "SAST SonarQube",
    scan: "SCN-1009",
    key: "AZmT4kQ1c8pVfW2nX0aE",
    rule: "go:S1854",
    message: 'Remove this useless assignment to variable "buf".',
    type: "CODE_SMELL",
    sonarSeverity: "MINOR",
    component: "atlas-mission-api:cmd/mission-api/main.go",
    line: 57,
    cwe: [],
  },
  {
    format: "SAST SonarQube",
    scan: "SCN-1009",
    key: "AZmT4kQ1c8pVfW2nX0aF",
    rule: "docker:S6471",
    message: "Replace this image tag with a digest-pinned base image reference.",
    type: "CODE_SMELL",
    sonarSeverity: "MAJOR",
    component: "atlas-mission-api:deploy/Dockerfile",
    line: 1,
    cwe: [],
  },

  /* SCN-1010 — SCA CycloneDX-VEX, mission-api image */
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:oci/mission-api@2.14.0",
    vulnerability: "CVE-2023-44487",
    cvss: 7.5,
    kev: true,
    analysisState: "exploitable",
    justification:
      "HTTP/2 rapid reset. The published tag serves the tactical uplink over HTTP/2 on the Go runtime it was built against, so a client can open and cancel streams faster than the server retires them. Added to the CISA Known Exploited Vulnerabilities catalog on Oct 10, 2023.",
    fixedIn: "2.14.1 (Go 1.21.3)",
  },
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:deb/openssl@3.0.11",
    vulnerability: "CVE-2024-2511",
    cvss: 5.9,
    kev: false,
    analysisState: "exploitable",
    justification:
      "Unbounded session cache growth in the TLS server path. The published tag pins the affected 3.0.11 build; the mesh sidecar terminates client TLS ahead of it, which is why the register grades the mitigated severity lower, but the flawed code is present in the image.",
    fixedIn: "3.0.13-0ubuntu3",
  },
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:deb/openssl@3.0.11",
    vulnerability: "CVE-2024-4741",
    cvss: 7.5,
    kev: false,
    analysisState: "in_triage",
    justification:
      "Use-after-free in SSL_free_buffers. The mesh sidecar team has not yet confirmed whether the buffer-release path is entered under the current listener configuration.",
    fixedIn: "3.0.14-0ubuntu1",
  },
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:oci/ubuntu@22.04",
    vulnerability: "CVE-2024-3094",
    cvss: 10,
    kev: false,
    analysisState: "not_affected",
    justification:
      "component_not_present — the base layer pins xz-utils 5.2.5-2ubuntu1. The backdoored 5.6.0 and 5.6.1 tarballs never entered the Ubuntu 22.04 archive, and the layer digest is unchanged since Apr 2026.",
    fixedIn: "—",
  },
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:golang/github.com/lestrrat-go/jwx@v2.0.19",
    vulnerability: "CVE-2024-21664",
    cvss: 6.5,
    kev: false,
    analysisState: "exploitable",
    justification:
      "Unbounded memory allocation when decrypting a JWE with a crafted compression header. mission-api accepts JWE tokens from the tactical uplink, so the path is reachable from outside the boundary.",
    fixedIn: "v2.0.21",
  },
  {
    format: "SCA CycloneDX-VEX",
    scan: "SCN-1010",
    purl: "pkg:deb/zlib1g@1.2.11",
    vulnerability: "CVE-2018-25032",
    cvss: 7.5,
    kev: false,
    analysisState: "exploitable",
    justification:
      "Memory corruption in deflate when compressing many distinct literals. The component is present in the image SBOM but was never declared in the composition graph.",
    fixedIn: "1.2.11.dfsg-2ubuntu9.2",
  },

  /* SCN-1011 — Fuzzing, mission-api */
  {
    format: "Fuzzing",
    scan: "SCN-1011",
    campaign: "mission-api-jwt-parse",
    crashId: "c7f3a1e9",
    signal: "SIGSEGV",
    stackHash: "8f2b1d4c9a0e5573",
    reproducible: true,
    iterations: 42_800_000,
    target: "fuzz_jwt_parse",
  },
  {
    format: "Fuzzing",
    scan: "SCN-1011",
    campaign: "mission-api-telemetry-decode",
    crashId: "b21d0447",
    signal: "SIGABRT",
    stackHash: "1c9e77aa30b4f612",
    reproducible: true,
    iterations: 18_400_000,
    target: "fuzz_telemetry_decode",
  },
  {
    format: "Fuzzing",
    scan: "SCN-1011",
    campaign: "mission-api-flow-policy",
    crashId: "4a9c33f0",
    signal: "SIGFPE",
    stackHash: "d40b8e1f6c72a915",
    reproducible: true,
    iterations: 9_100_000,
    target: "fuzz_flow_policy",
  },
  {
    format: "Fuzzing",
    scan: "SCN-1011",
    campaign: "mission-api-jwt-parse",
    crashId: "e5510b8d",
    signal: "SIGSEGV",
    stackHash: "77c0f9ab24d3e186",
    reproducible: false,
    iterations: 61_200_000,
    target: "fuzz_jwt_parse",
  },

  /* SCN-1012 — Firmware analysis, edge-sw-a1 */
  {
    format: "Firmware analysis",
    scan: "SCN-1012",
    imageDigest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
    checkId: "FW-SB-002",
    check: "Image signature chain validates to the platform root of trust",
    verdict: "fail",
    detail:
      "The running image is signed by a Cisco development key that is not present in the platform trust anchor. show software authenticity running reports 'Not Verified' and secure boot is in permissive mode.",
    offset: "0x00000200",
  },
  {
    format: "Firmware analysis",
    scan: "SCN-1012",
    imageDigest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
    checkId: "FW-RB-004",
    check: "Anti-rollback counter is enforced against the fuse bank",
    verdict: "fail",
    detail:
      "The efuse rollback counter reads 0, so a 17.6.x image can be flashed over 17.9.4a with no downgrade block.",
    offset: "0x0041c800",
  },
  {
    format: "Firmware analysis",
    scan: "SCN-1012",
    imageDigest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
    checkId: "FW-CF-014",
    check: "Packaged startup configuration disables cleartext management transports",
    verdict: "fail",
    detail:
      "line vty 0 4 in the packaged startup-config permits transport input telnet alongside ssh.",
    offset: "0x00d2a1c0",
  },
  {
    format: "Firmware analysis",
    scan: "SCN-1012",
    imageDigest: "sha256:d5d8d1c5f2596340f5991076229cc22ce627c428e21987a377a7ea2431117624",
    checkId: "FW-CR-011",
    check: "No hardcoded credential material in the extracted filesystem",
    verdict: "warn",
    detail:
      "Two base64 strings in /etc/init.d/startup decode to legacy TAC support account names. No password or key material was recovered.",
    offset: "0x00c14f20",
  },
  {
    format: "Firmware analysis",
    scan: "SCN-1012",
    imageDigest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
    checkId: "FW-EX-021",
    check: "No unauthenticated debug or diagnostic shell in the image",
    verdict: "pass",
    detail:
      "No dev-shell entry point and no undocumented diagnostic handler found in the decompressed IOS-XE package.",
    offset: "—",
  },
];

/* ── Indexes ─────────────────────────────────────────────────────────────── */

const resultsByScan = new Map<string, NativeResult[]>();
for (const native of nativeResults) {
  const bucket = resultsByScan.get(native.scan);
  if (bucket) bucket.push(native);
  else resultsByScan.set(native.scan, [native]);
}

/**
 * CCI ids the seeded scanners reference that neither the catalog slice nor the
 * finding register carries. Real DISA mappings, authored here rather than
 * guessed at normalization time.
 */
const cciSupplement: Record<string, string> = {
  "CCI-000044": "AC-7",
  "CCI-000169": "AU-12",
  "CCI-000381": "CM-7",
  "CCI-000803": "IA-7",
  "CCI-001764": "CM-7(2)",
  "CCI-001849": "AU-4",
};

/**
 * CCI → control natural key: the catalog decomposition, unioned with the pairs
 * the finding register already asserts, then the supplement above.
 */
const cciControl = new Map<string, string>();
for (const cci of ccis) cciControl.set(cci.id, cci.control);
for (const f of findings) if (!cciControl.has(f.cci)) cciControl.set(f.cci, f.control);
for (const [id, control] of Object.entries(cciSupplement)) {
  if (!cciControl.has(id)) cciControl.set(id, control);
}

/** The inverse of `rulesByCci` — a V-id to the CCIs the rule declares it satisfies. */
export const ccisByRule = new Map<string, string[]>();
for (const [cci, ruleList] of rulesByCci) {
  for (const rule of ruleList) {
    const bucket = ccisByRule.get(rule.id);
    if (bucket) bucket.push(cci);
    else ccisByRule.set(rule.id, [cci]);
  }
}

const assetByName = new Map(assets.map((a) => [a.name, a]));

/**
 * Digest is not part of the graph store's override patch, so reading it off the
 * seed array is identical to reading it through a selector.
 */
const nodeByDigest = new Map<string, string>();
for (const node of compositionNodes) {
  if (node.digest && !nodeByDigest.has(node.digest)) nodeByDigest.set(node.digest, node.id);
}

/**
 * Authored source-path → node table for SonarQube components. SonarQube keys an
 * issue by `${projectKey}:${path}`, which is a build coordinate and not a
 * deployment one — nothing in the SBOM can resolve it, so the mapping is
 * declared by the mission software team and versioned with the code.
 */
const sastPathNodes: { prefix: string; node: string }[] = [
  { prefix: "atlas-mission-api:vendor/github.com/lestrrat-go/jwx/", node: "CN-0214" },
  { prefix: "atlas-mission-api:vendor/github.com/gorilla/mux/", node: "CN-0213" },
  { prefix: "atlas-mission-api:internal/", node: "CN-0215" },
  { prefix: "atlas-mission-api:cmd/", node: "CN-0215" },
].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Authored CWE → control family association. It is deliberately NOT a CCI map:
 * a CWE is a weakness class and a CCI is a testable requirement statement, and
 * collapsing one into the other is how ingestion pipelines end up asserting
 * compliance facts nobody wrote. The association is reported in `unresolved` so
 * an analyst can confirm it.
 */
const cweControlFamily: Record<string, string> = {
  "CWE-259": "IA-5 — authenticator management",
  "CWE-295": "SC-8 / SC-23 — transmission integrity and certificate validation",
  "CWE-327": "SC-13 — cryptographic protection",
  "CWE-798": "IA-5 — authenticator management",
};

/**
 * The audit-file compliance reference Tenable stamps on every compliance check
 * (`CAT|II,CCI|CCI-001851,Rule-ID|SV-258145r958424_rule,Vuln-ID|V-258145`),
 * split into its fields. This is where a .nessus states the requirement, so it
 * is where the requirement is read from — the plugin id says only that the row
 * came from an audit file (21157 Unix, 21156 Windows), and every Unix check in
 * the file shares it.
 */
type ComplianceReference = {
  cat: string | null;
  cci: string | null;
  ruleId: string | null;
  rule: string | null; // Vuln-ID
};

function parseComplianceReference(reference: string): ComplianceReference {
  const fields = new Map<string, string>();
  for (const part of reference.split(",")) {
    const [name, value] = part.split("|");
    if (name && value) fields.set(name.trim(), value.trim());
  }
  return {
    cat: fields.get("CAT") ?? null,
    cci: fields.get("CCI") ?? null,
    ruleId: fields.get("Rule-ID") ?? null,
    rule: fields.get("Vuln-ID") ?? null,
  };
}

const catSeverity: Record<string, FindingSeverity> = {
  I: "CAT I",
  II: "CAT II",
  III: "CAT III",
};

/** Firmware check families whose failure mode is the boot chain itself. */
const firmwareCriticalFamilies = new Set(["SB", "RB"]);

/** The verification path a format's results would be filed under in the register. */
const formatPath: Record<ScanFormat, VerificationPath> = {
  "STIG CKL": "STIG checklist",
  "STIG CKLB": "STIG checklist",
  "SCAP XCCDF": "STIG checklist",
  "ACAS Nessus": "ACAS scan",
  "SAST SonarQube": "Code scan",
  "SCA CycloneDX-VEX": "Code scan",
  Fuzzing: "Test event",
  "Firmware analysis": "Test event",
};

/**
 * Source authority, highest first. A benchmark checklist is the authoritative
 * statement about a configuration setting; a network scanner inferring the same
 * thing from the outside is corroboration, not a second weakness.
 */
export const sourceAuthority: ScanFormat[] = [
  "STIG CKLB",
  "STIG CKL",
  "SCAP XCCDF",
  "ACAS Nessus",
  "SCA CycloneDX-VEX",
  "Firmware analysis",
  "SAST SonarQube",
  "Fuzzing",
];

const authorityRank = new Map(sourceAuthority.map((f, i) => [f, i]));

/* ── Timestamps ──────────────────────────────────────────────────────────── */

const monthIndex: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/** "MMM DD, YYYY HH:MM" to a sortable integer. No clock is read. */
function timestampRank(value: string): number {
  const m = value.trim().match(/^([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{4})(?:\s(\d{1,2}):(\d{2}))?$/);
  if (!m) return 0;
  const month = monthIndex[m[1] ?? ""];
  if (month === undefined) return 0;
  return (
    Number(m[3]) * 100_000_000 +
    month * 1_000_000 +
    Number(m[2]) * 10_000 +
    Number(m[4] ?? 0) * 100 +
    Number(m[5] ?? 0)
  );
}

/* ── Node resolution ─────────────────────────────────────────────────────── */

type NodeResolution = { node: string | null; basis: string; unresolved: string[] };

function withinTargets(nodeId: string, targets: string[]): boolean {
  if (targets.includes(nodeId)) return true;
  return ancestorsOf(nodeId).some((a) => targets.includes(a.id));
}

function resolveNode(native: NativeResult, scan: ScanRun | undefined): NodeResolution {
  const targets = scan?.targets ?? [];

  // 1 — a package coordinate matching a composition node's part key.
  if (native.format === "SCA CycloneDX-VEX") {
    const matches = nodesByPartKey(native.purl);
    const only = matches[0];
    if (matches.length === 1 && only) {
      return {
        node: only.id,
        basis: `Part key match: purl ${native.purl} names exactly one node in the composition graph (${only.name}).`,
        unresolved: [],
      };
    }
    if (matches.length > 1) {
      const scoped = matches.filter((n) => withinTargets(n.id, targets));
      const pick = scoped[0];
      if (scoped.length === 1 && pick) {
        return {
          node: pick.id,
          basis: `Part key match: purl ${native.purl} names ${matches.length} fleet instances; scoped to ${pick.id} because it is the only one inside the scan targets (${targets.join(", ")}).`,
          unresolved: [],
        };
      }
      return {
        node: null,
        basis: `Part key ${native.purl} names ${matches.length} fleet instances and the scan targets do not narrow it to one.`,
        unresolved: [
          `Ambiguous component: purl ${native.purl} matches ${matches.length} composition nodes (${matches.map((n) => n.id).join(", ")}) and the VEX document does not say which instance it describes.`,
        ],
      };
    }
    return {
      node: null,
      basis: `No part key in the composition graph matches purl ${native.purl}.`,
      unresolved: [
        `Unmodelled component: purl ${native.purl} is in the image SBOM but has no node in the composition graph, so the result cannot be allocated.`,
      ],
    };
  }

  // 2 — an image digest matching a firmware or container node.
  if (native.format === "Firmware analysis") {
    const hit = nodeByDigest.get(native.imageDigest);
    if (hit) {
      const node = nodeById.get(hit);
      return {
        node: hit,
        basis: `Digest match: ${native.imageDigest.slice(0, 23)}… is the recorded digest of ${hit}${node ? ` (${node.name})` : ""}.`,
        unresolved: [],
      };
    }
    return {
      node: null,
      basis: `No composition node carries digest ${native.imageDigest.slice(0, 23)}….`,
      unresolved: [
        `Unknown image: digest ${native.imageDigest} matches no firmware or container node, so the analysis cannot be attributed to a part.`,
      ],
    };
  }

  // 3 — a scanned host name matching a tracked asset.
  if (native.format === "ACAS Nessus") {
    const asset = assetByName.get(native.host);
    if (asset) {
      const anchor = nodeForAsset(asset.id);
      if (anchor) {
        return {
          node: anchor.id,
          basis: `Host match: "${native.host}" is asset ${asset.id}, anchored to ${anchor.id} (${anchor.name}).`,
          unresolved: [],
        };
      }
    }
  }

  // 4 — an unambiguous scan target.
  const soleTarget = targets.length === 1 ? targets[0] : undefined;
  if (soleTarget && nodeById.has(soleTarget)) {
    const node = nodeById.get(soleTarget);
    return {
      node: soleTarget,
      basis: `Scan scope: ${scan?.id ?? "the run"} declares exactly one target, ${soleTarget}${node ? ` (${node.name})` : ""}, so every result it produced lands there.`,
      unresolved: [],
    };
  }

  // 5 — a source path prefix from the authored SAST table.
  if (native.format === "SAST SonarQube") {
    const hit = sastPathNodes.find((entry) => native.component.startsWith(entry.prefix));
    if (hit) {
      const node = nodeById.get(hit.node);
      return {
        node: hit.node,
        basis: `Source path match: component "${native.component}" is under "${hit.prefix}", which the authored path table allocates to ${hit.node}${node ? ` (${node.name})` : ""}.`,
        unresolved: [],
      };
    }
    return {
      node: null,
      basis: `No entry in the authored source-path table covers "${native.component}".`,
      unresolved: [
        `Unallocated source path: "${native.component}" matches no prefix in the mission software path table, so the issue cannot be tied to a deployed component.`,
      ],
    };
  }

  // 6 — nothing fired.
  return {
    node: null,
    basis:
      targets.length > 1
        ? `No format-specific anchor resolved and ${scan?.id ?? "the run"} declares ${targets.length} targets, so the scope is ambiguous.`
        : "No format-specific anchor resolved and the run declares no target.",
    unresolved: [
      "Unresolved component: no part key, digest, host name or scan target identified where this result belongs.",
    ],
  };
}

/* ── Severity ────────────────────────────────────────────────────────────── */

type SeverityResolution = { severity: FindingSeverity; clean: boolean; basis: string };

const stigSeverity: Record<"high" | "medium" | "low", FindingSeverity> = {
  high: "CAT I",
  medium: "CAT II",
  low: "CAT III",
};

function severityFromCvss(cvss: number): FindingSeverity {
  if (cvss >= 9) return "CAT I";
  if (cvss >= 7) return "CAT II";
  return "CAT III";
}

function resolveSeverity(native: NativeResult): SeverityResolution {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB": {
      const severity = stigSeverity[native.severity];
      const clean = native.status === "Not a Finding" || native.status === "Not Applicable";
      return {
        severity,
        clean,
        basis: `Checklist severity "${native.severity}" maps to ${severity}; status "${native.status}" is ${clean ? "a clean result" : "a reportable result"}.`,
      };
    }
    case "SCAP XCCDF": {
      const severity = stigSeverity[native.severity];
      const clean = native.result === "pass" || native.result === "notapplicable";
      return {
        severity,
        clean,
        basis: `XCCDF severity "${native.severity}" maps to ${severity}; rule result "${native.result}" is ${clean ? "a clean result" : "a reportable result"}.`,
      };
    }
    case "ACAS Nessus": {
      if (native.complianceResult) {
        const reference = native.complianceReference
          ? parseComplianceReference(native.complianceReference)
          : null;
        const check = native.complianceCheckName ?? `plugin ${native.pluginId}`;
        const clean = native.complianceResult === "PASSED";
        const cat = reference?.cat ? catSeverity[reference.cat] : undefined;
        if (cat) {
          return {
            severity: cat,
            clean,
            basis: `Audit-file check ${check} returned "${native.complianceResult}"; its compliance reference grades the rule CAT|${reference?.cat ?? "—"}, which is ${cat}. ${clean ? "A passing compliance check is clean coverage." : "A failing compliance check is a reportable result."}`,
          };
        }
        const severity: FindingSeverity =
          native.riskFactor === "Critical" || native.riskFactor === "High"
            ? "CAT I"
            : native.riskFactor === "Medium"
              ? "CAT II"
              : "CAT III";
        return {
          severity,
          clean,
          basis: `Audit-file check ${check} returned "${native.complianceResult}" and its compliance reference states no CAT, so the plugin riskFactor "${native.riskFactor}" governs and maps to ${severity}.`,
        };
      }
      if (native.riskFactor === "None") {
        return {
          severity: "CAT III",
          clean: true,
          basis: 'Nessus riskFactor "None" is informational output, recorded as clean coverage.',
        };
      }
      const severity: FindingSeverity =
        native.riskFactor === "Critical" || native.riskFactor === "High"
          ? "CAT I"
          : native.riskFactor === "Medium"
            ? "CAT II"
            : "CAT III";
      return {
        severity,
        clean: false,
        basis: `Nessus riskFactor "${native.riskFactor}" maps to ${severity}${native.cvss > 0 ? ` (plugin CVSS ${native.cvss.toFixed(1)} is recorded, but the risk factor governs)` : ""}.`,
      };
    }
    case "SAST SonarQube": {
      if (native.type === "CODE_SMELL") {
        return {
          severity: "CAT III",
          clean: false,
          basis: `SonarQube severity "${native.sonarSeverity}" on a CODE_SMELL is floored at CAT III — maintainability is not a security weakness however loudly the tool grades it.`,
        };
      }
      const severity: FindingSeverity =
        native.sonarSeverity === "BLOCKER" || native.sonarSeverity === "CRITICAL"
          ? "CAT I"
          : native.sonarSeverity === "MAJOR"
            ? "CAT II"
            : "CAT III";
      return {
        severity,
        clean: false,
        basis: `SonarQube ${native.type} at severity "${native.sonarSeverity}" maps to ${severity}.`,
      };
    }
    case "SCA CycloneDX-VEX": {
      if (native.analysisState === "not_affected") {
        return {
          severity: severityFromCvss(native.cvss),
          clean: true,
          basis: `VEX analysisState "not_affected" suppresses the result; CVSS ${native.cvss.toFixed(1)} is retained for the record but the component is not exposed.`,
        };
      }
      if (native.kev) {
        return {
          severity: "CAT I",
          clean: false,
          basis: `CVSS ${native.cvss.toFixed(1)} alone maps to ${severityFromCvss(native.cvss)}, but the KEV listing forces CAT I: a vulnerability with observed exploitation is not graded on its base score.`,
        };
      }
      const severity = severityFromCvss(native.cvss);
      return {
        severity,
        clean: false,
        basis: `CVSS ${native.cvss.toFixed(1)} maps to ${severity} (analysisState "${native.analysisState}", not in the KEV catalog).`,
      };
    }
    case "Fuzzing": {
      if (!native.reproducible) {
        return {
          severity: "CAT III",
          clean: false,
          basis: `Crash ${native.crashId} did not reproduce on replay, so it is floored at CAT III rather than graded on its ${native.signal}.`,
        };
      }
      const fatal = native.signal === "SIGSEGV" || native.signal === "SIGABRT";
      return {
        severity: fatal ? "CAT I" : "CAT II",
        clean: false,
        basis: fatal
          ? `Reproducible ${native.signal} is a memory-safety failure in a reachable parser, mapped to CAT I.`
          : `Reproducible crash on ${native.signal} is not a memory-safety failure, mapped to CAT II.`,
      };
    }
    case "Firmware analysis": {
      if (native.verdict === "pass") {
        return {
          severity: "CAT III",
          clean: true,
          basis: `Firmware check ${native.checkId} passed, recorded as clean coverage.`,
        };
      }
      if (native.verdict === "warn") {
        return {
          severity: "CAT III",
          clean: false,
          basis: `Firmware check ${native.checkId} returned "warn", mapped to CAT III.`,
        };
      }
      const family = native.checkId.split("-")[1] ?? "";
      const critical = firmwareCriticalFamilies.has(family);
      return {
        severity: critical ? "CAT I" : "CAT II",
        clean: false,
        basis: critical
          ? `Firmware check ${native.checkId} failed and family "${family}" is in the secure-boot / anti-rollback set, so the boot chain itself is untrusted — CAT I.`
          : `Firmware check ${native.checkId} failed outside the secure-boot / anti-rollback set, mapped to CAT II.`,
      };
    }
    default:
      return { severity: "CAT III", clean: false, basis: "Unrecognized format." };
  }
}

/* ── Requirement resolution ──────────────────────────────────────────────── */

type CciResolution = {
  cci: string | null;
  rule: string | null;
  unresolved: string[];
  /** The clause that produced the CCI, or the reason there is none. */
  basis: string;
};

/** `xccdf_mil.disa.stig_rule_SV-258145r958424_rule` → `V-258145`. */
function vulnIdFromXccdf(ruleId: string): string | null {
  const m = ruleId.match(/SV-(\d+)r/);
  return m?.[1] ? `V-${m[1]}` : null;
}

function resolveRequirement(native: NativeResult): CciResolution {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB": {
      const cci = native.cciRefs.find((c) => c.startsWith("CCI-")) ?? null;
      if (cci) {
        return {
          cci,
          rule: native.vulnNum,
          unresolved: [],
          basis: `${cci} read from the CCI reference list the checklist carries on ${native.vulnNum}${native.cciRefs.length > 1 ? ` (first of ${native.cciRefs.length}: ${native.cciRefs.join(", ")})` : ""}.`,
        };
      }
      const inferred = ccisByRule.get(native.vulnNum)?.[0] ?? null;
      if (inferred) {
        return {
          cci: inferred,
          rule: native.vulnNum,
          unresolved: [],
          basis: `The checklist row for ${native.vulnNum} carries no CCI reference; ${inferred} comes from the local catalog's inverse rule index for ${native.vulnNum}.`,
        };
      }
      const reason = `No CCI: the checklist row for ${native.vulnNum} carries no CCI reference and the rule is not in the local catalog.`;
      return { cci: null, rule: native.vulnNum, unresolved: [reason], basis: reason };
    }
    case "SCAP XCCDF": {
      const rule = native.idents.find((i) => i.startsWith("V-")) ?? vulnIdFromXccdf(native.ruleId);
      const cci = native.idents.find((i) => i.startsWith("CCI-")) ?? null;
      if (cci) {
        return {
          cci,
          rule,
          unresolved: [],
          basis: `${cci} read from the XCCDF idents on ${native.ruleId} (${native.idents.join(", ")}).`,
        };
      }
      const inferred = rule ? (ccisByRule.get(rule)?.[0] ?? null) : null;
      if (inferred) {
        return {
          cci: inferred,
          rule,
          unresolved: [],
          basis: `The XCCDF idents on ${native.ruleId} carry no CCI; ${inferred} comes from the local catalog's inverse rule index for ${rule ?? "the rule"}.`,
        };
      }
      const reason = `No CCI: the XCCDF idents for ${native.ruleId} carry ${rule ?? "no rule id"} but no CCI, and ${rule ?? "the rule"} is not in the local rule catalog. An analyst must map it before this becomes a finding.`;
      return { cci: null, rule, unresolved: [reason], basis: reason };
    }
    case "ACAS Nessus": {
      // The plugin id is not the check. 21157 is Tenable's one generic Unix
      // compliance plugin, so the requirement is read from the compliance
      // reference the audit file stamps on the row, or from nothing at all.
      if (native.complianceReference) {
        const reference = parseComplianceReference(native.complianceReference);
        const check = native.complianceCheckName ?? `plugin ${native.pluginId}`;
        if (reference.cci) {
          return {
            cci: reference.cci,
            rule: reference.rule,
            unresolved: [],
            basis: `${reference.cci} read from the compliance reference ${native.complianceReference} stamped on audit-file check ${check}; plugin ${native.pluginId} states only that the row came from an audit file.`,
          };
        }
        const inferred = reference.rule ? (ccisByRule.get(reference.rule)?.[0] ?? null) : null;
        if (inferred) {
          return {
            cci: inferred,
            rule: reference.rule,
            unresolved: [],
            basis: `The compliance reference on ${check} names ${reference.rule ?? "no rule"} but no CCI; ${inferred} comes from the local catalog's inverse rule index.`,
          };
        }
        const reason = `No CCI: the compliance reference on audit-file check ${check} (${native.complianceReference}) states no CCI and ${reference.rule ?? "no rule id"} is not in the local rule catalog.`;
        return { cci: null, rule: reference.rule, unresolved: [reason], basis: reason };
      }
      const reason = `No CCI: ACAS plugin ${native.pluginId} carries no audit-file compliance reference — it is a vulnerability check, which states a plugin id and CVEs rather than a requirement${native.cve.length > 0 ? `; ${native.cve.join(", ")} must be mapped to a control by an analyst` : ""}.`;
      return { cci: null, rule: null, unresolved: [reason], basis: reason };
    }
    case "SAST SonarQube": {
      const family = native.cwe.map((c) => cweControlFamily[c]).find((v) => v !== undefined);
      const reason =
        native.cwe.length > 0
          ? `No CCI: SonarQube rule ${native.rule} asserts ${native.cwe.join(", ")}, which the authored CWE table associates with ${family ?? "no control family"}. A CWE is a weakness class, not a requirement statement, so the control is left for an analyst to confirm.`
          : `No CCI: SonarQube rule ${native.rule} carries no CWE and no requirement reference of any kind.`;
      return { cci: null, rule: null, unresolved: [reason], basis: reason };
    }
    case "SCA CycloneDX-VEX": {
      const reason = `No CCI: CycloneDX-VEX asserts vulnerabilities against components, not control requirements. ${native.vulnerability} on ${native.purl} needs an analyst mapping before it becomes a finding.`;
      return { cci: null, rule: null, unresolved: [reason], basis: reason };
    }
    case "Fuzzing": {
      const reason = `No CCI: fuzzing crashes carry no rule or requirement reference. Crash ${native.crashId} in ${native.target} must be triaged to a control by the T&E lead.`;
      return { cci: null, rule: null, unresolved: [reason], basis: reason };
    }
    case "Firmware analysis": {
      const reason = `No CCI: firmware check ${native.checkId} is a vendor-defined integrity check with no DISA reference. An analyst must map it before it becomes a finding.`;
      return { cci: null, rule: null, unresolved: [reason], basis: reason };
    }
    default:
      return {
        cci: null,
        rule: null,
        unresolved: ["Unrecognized format."],
        basis: "Unrecognized format.",
      };
  }
}

/* ── Normalization ───────────────────────────────────────────────────────── */

function nativeIdOf(native: NativeResult): string {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB":
      return native.vulnNum;
    case "SCAP XCCDF":
      return native.ruleId;
    case "ACAS Nessus": {
      // An audit-file row is identified by its check, not by the generic
      // compliance plugin every such row shares. A vulnerability row is the
      // plugin as it fired on one port, so 51192 on 5432 and on 443 stay apart.
      if (native.complianceCheckName) return native.complianceCheckName;
      if (native.complianceReference) {
        const rule = parseComplianceReference(native.complianceReference).rule;
        if (rule) return rule;
      }
      return native.port > 0 ? `${native.pluginId}@${native.port}` : native.pluginId;
    }
    case "SAST SonarQube":
      return native.key;
    case "SCA CycloneDX-VEX":
      return `${native.purl}#${native.vulnerability}`;
    case "Fuzzing":
      return native.stackHash;
    case "Firmware analysis":
      return native.checkId;
    default:
      return "—";
  }
}

function titleOf(native: NativeResult): string {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB":
      return native.ruleTitle;
    case "SCAP XCCDF":
      return native.title;
    case "ACAS Nessus":
      return native.pluginName;
    case "SAST SonarQube":
      return native.message;
    case "SCA CycloneDX-VEX":
      return `${native.vulnerability} in ${native.purl}`;
    case "Fuzzing":
      return `${native.signal} in ${native.target} (${native.campaign})`;
    case "Firmware analysis":
      return native.check;
    default:
      return "—";
  }
}

function detailOf(native: NativeResult): string {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB":
      return native.findingDetails.trim().length > 0 ? native.findingDetails : native.comments;
    case "SCAP XCCDF":
      return `Rule ${native.ruleId} returned "${native.result}" at ${native.severity} severity. Idents: ${native.idents.length > 0 ? native.idents.join(", ") : "none"}.`;
    case "ACAS Nessus":
      return native.output;
    case "SAST SonarQube":
      return `${native.component}:${native.line} — ${native.rule} (${native.type}, ${native.sonarSeverity})${native.cwe.length > 0 ? `, ${native.cwe.join(", ")}` : ""}.`;
    case "SCA CycloneDX-VEX":
      return `${native.justification} Fixed in ${native.fixedIn}.`;
    case "Fuzzing":
      return `Crash ${native.crashId}, stack hash ${native.stackHash}, ${native.iterations.toLocaleString("en-US")} iterations against ${native.target}. ${native.reproducible ? "Reproduced on replay." : "Did not reproduce on replay."}`;
    case "Firmware analysis":
      return `${native.detail} Offset ${native.offset}.`;
    default:
      return "—";
  }
}

export function normalize(native: NativeResult): NormalizedResult {
  const scan = scanById.get(native.scan);
  const nativeId = nativeIdOf(native);
  const severity = resolveSeverity(native);
  const requirement = resolveRequirement(native);
  const location = resolveNode(native, scan);

  // A clean row is evidence of coverage, not a candidate finding, so there is no
  // requirement left to resolve against it. A missing node is recorded either
  // way: no result may sit without a node and without a reason.
  const unresolved = severity.clean
    ? [...location.unresolved]
    : [...requirement.unresolved, ...location.unresolved];

  return {
    id: `${native.scan}:${nativeId}`,
    scan: native.scan,
    format: native.format,
    nativeId,
    cci: requirement.cci,
    cciBasis: requirement.basis,
    control: requirement.cci ? (cciControl.get(requirement.cci) ?? null) : null,
    rule: requirement.rule,
    node: location.node,
    nodeBasis: location.basis,
    title: titleOf(native),
    severity: severity.severity,
    severityBasis: severity.basis,
    clean: severity.clean,
    detail: detailOf(native),
    unresolved,
  };
}

const normalizedCache = new Map<string, NormalizedResult[]>();
let normalizedCacheVersion = -1;

export function normalizedForScan(scanId: string): NormalizedResult[] {
  if (normalizedCacheVersion !== graphVersion()) {
    normalizedCache.clear();
    normalizedCacheVersion = graphVersion();
  }
  const hit = normalizedCache.get(scanId);
  if (hit) return hit;
  const rows = (resultsByScan.get(scanId) ?? []).map(normalize);
  normalizedCache.set(scanId, rows);
  return rows;
}

/* ── Correlation to the finding register ─────────────────────────────────── */

/** The nearest ancestor (or the node itself) carrying an AST- anchor. */
function owningAsset(nodeId: string): string | null {
  const self = nodeById.get(nodeId);
  if (self?.asset) return self.asset;
  for (const a of ancestorsOf(nodeId)) if (a.asset) return a.asset;
  return null;
}

/**
 * Findings this result corresponds to, best match first. A finding records the
 * verification path it came from, so a result arriving on that same path is the
 * row the register already filed for it; the rule id then disambiguates within a
 * path, and an exact node match breaks the remaining tie. This is what lets one
 * condition reported by a checklist and by ACAS resolve to the two separate rows
 * the register filed for it instead of collapsing onto the first one found.
 */
function matchingFindings(result: NormalizedResult): string[] {
  if (!result.cci || !result.node) return [];
  const node = result.node;
  const asset = owningAsset(node);
  const path = formatPath[result.format];
  return findings
    .filter(
      (f) => f.cci === result.cci && (f.node === node || (asset !== null && f.asset === asset)),
    )
    .map((f) => {
      let score = 0;
      if (f.source === path) score -= 2;
      if (result.rule !== null && f.rule === result.rule) score -= 1;
      if (f.node === node) score -= 0.5;
      return { id: f.id, score };
    })
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .map((m) => m.id);
}

function bestMatch(result: NormalizedResult): string | null {
  return matchingFindings(result)[0] ?? null;
}

/* ── Deduplication ───────────────────────────────────────────────────────── */

export function dedupKey(result: NormalizedResult): string {
  return `${result.cci ?? "—"}|${result.node ?? "—"}|${result.rule ?? result.nativeId}`;
}

const severityOrder: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

export function dedupe(results: NormalizedResult[]): DedupGroup[] {
  const byKey = new Map<string, NormalizedResult[]>();
  for (const r of results) {
    const key = dedupKey(r);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(r);
    else byKey.set(key, [r]);
  }

  const groups: DedupGroup[] = [];
  for (const [key, members] of byKey) {
    const ranked = [...members].sort((a, b) => {
      const ra = authorityRank.get(a.format) ?? sourceAuthority.length;
      const rb = authorityRank.get(b.format) ?? sourceAuthority.length;
      if (ra !== rb) return ra - rb;
      const ta = timestampRank(scanById.get(a.scan)?.completed ?? "");
      const tb = timestampRank(scanById.get(b.scan)?.completed ?? "");
      if (ta !== tb) return tb - ta;
      return a.id.localeCompare(b.id);
    });
    const primary = ranked[0];
    if (!primary) continue;
    const duplicates = ranked.slice(1);

    const sources: ScanFormat[] = [];
    for (const r of ranked) if (!sources.includes(r.format)) sources.push(r.format);

    const otherFormats = sources.filter((f) => f !== primary.format);
    const rank = (authorityRank.get(primary.format) ?? 0) + 1;
    const plural = duplicates.length === 1 ? "" : "s";
    const basis =
      duplicates.length === 0
        ? `Only ${primary.format} reported this key — nothing to reconcile.`
        : otherFormats.length > 0
          ? `${primary.format} outranks ${otherFormats.join(" and ")} on source authority (rank ${rank} of ${sourceAuthority.length}), so ${primary.scan} is kept and ${duplicates.length} corroborating result${plural} folded in as duplicate${plural}.`
          : `${ranked.length} results from ${primary.format} share this key; the later run ${primary.scan} (completed ${scanById.get(primary.scan)?.completed ?? "—"}) is kept.`;

    const existingAll: string[] = [];
    for (const r of ranked) {
      const match = bestMatch(r);
      if (match && !existingAll.includes(match)) existingAll.push(match);
    }

    groups.push({
      key,
      primary,
      duplicates,
      sources,
      basis,
      existing: bestMatch(primary) ?? existingAll[0] ?? null,
      existingAll,
    });
  }

  return groups.sort(
    (a, b) =>
      severityOrder[a.primary.severity] - severityOrder[b.primary.severity] ||
      a.key.localeCompare(b.key),
  );
}

const groupCache = new Map<string, DedupGroup[]>();
let groupCacheVersion = -1;

/** Dedup of one scan's own results — what the diff compares scan over scan. */
function groupsForScan(scanId: string): DedupGroup[] {
  if (groupCacheVersion !== graphVersion()) {
    groupCache.clear();
    groupCacheVersion = graphVersion();
  }
  const hit = groupCache.get(scanId);
  if (hit) return hit;
  const rows = dedupe(normalizedForScan(scanId));
  groupCache.set(scanId, rows);
  return rows;
}

/* ── Selectors ───────────────────────────────────────────────────────────── */

export function scansForProgram(programId: string): ScanRun[] {
  return scanRuns
    .filter((s) => s.program === programId)
    .sort((a, b) => timestampRank(b.completed) - timestampRank(a.completed));
}

/** Scans nothing else supersedes — the program's current picture. */
export function currentScansForProgram(programId: string): ScanRun[] {
  const superseded = new Set<string>();
  for (const s of scanRuns) if (s.supersedes) superseded.add(s.supersedes);
  return scansForProgram(programId).filter((s) => !superseded.has(s.id));
}

/** Every normalized result, across every scan, that resolved to this finding. */
export function provenanceFor(findingId: string): { scan: ScanRun; result: NormalizedResult }[] {
  const out: { scan: ScanRun; result: NormalizedResult }[] = [];
  for (const scan of scanRuns) {
    for (const result of normalizedForScan(scan.id)) {
      if (bestMatch(result) === findingId) out.push({ scan, result });
    }
  }
  return out.sort((a, b) => timestampRank(b.scan.completed) - timestampRank(a.scan.completed));
}

/* ── Scan over scan ──────────────────────────────────────────────────────── */

function reportedGroups(scanId: string | null | undefined): DedupGroup[] {
  if (!scanId) return [];
  return groupsForScan(scanId).filter((g) => !g.primary.clean);
}

function keySet(scanId: string | null | undefined): Set<string> {
  return new Set(reportedGroups(scanId).map((g) => g.key));
}

export function scanDiff(previousScanId: string | null, currentScanId: string): IngestDiffRow[] {
  const current = reportedGroups(currentScanId);
  const previous = reportedGroups(previousScanId);
  const previousKeys = keySet(previousScanId);
  const grandparentId = previousScanId ? (scanById.get(previousScanId)?.supersedes ?? null) : null;
  const grandparentKeys = keySet(grandparentId);

  // The supersede chain, current first, used for occurrence count and first-seen.
  const chain: string[] = [currentScanId];
  const walked = new Set<string>([currentScanId]);
  let cursor = previousScanId;
  while (cursor && !walked.has(cursor)) {
    walked.add(cursor);
    chain.push(cursor);
    cursor = scanById.get(cursor)?.supersedes ?? null;
  }
  const chainKeys = chain.map((id) => ({ id, keys: keySet(id) }));

  function history(key: string, fallback: string) {
    const hits = chainKeys.filter((c) => c.keys.has(key));
    const oldest = hits[hits.length - 1];
    return { occurrences: Math.max(hits.length, 1), firstSeen: oldest?.id ?? fallback };
  }

  const rows: IngestDiffRow[] = [];

  for (const group of current) {
    const state: IngestDiffState = previousKeys.has(group.key)
      ? "Persistent"
      : grandparentKeys.has(group.key)
        ? "Reappeared"
        : "New";
    const { occurrences, firstSeen } = history(group.key, currentScanId);
    rows.push({
      key: group.key,
      state,
      title: group.primary.title,
      severity: group.primary.severity,
      node: group.primary.node,
      lastSeen: currentScanId,
      firstSeen,
      occurrences,
    });
  }

  const currentKeys = new Set(current.map((g) => g.key));
  for (const group of previous) {
    if (currentKeys.has(group.key)) continue;
    const fallback = previousScanId ?? currentScanId;
    const { occurrences, firstSeen } = history(group.key, fallback);
    rows.push({
      key: group.key,
      state: "Fixed",
      title: group.primary.title,
      severity: group.primary.severity,
      node: group.primary.node,
      lastSeen: fallback,
      firstSeen,
      occurrences,
    });
  }

  const stateOrder: Record<IngestDiffState, number> = {
    Reappeared: 0,
    New: 1,
    Persistent: 2,
    Fixed: 3,
  };
  return rows.sort(
    (a, b) =>
      stateOrder[a.state] - stateOrder[b.state] ||
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.key.localeCompare(b.key),
  );
}

/* ── Batch reconciliation ────────────────────────────────────────────────── */

const emptyCounts = { raw: 0, normalized: 0, clean: 0, deduped: 0, unresolved: 0 };

/**
 * One scan's results, reconciled against everything the program currently
 * reports. The batch is deduplicated against the other current scans rather
 * than against itself alone, because that is where a cross-format duplicate
 * lives: the checklist and the network scanner are two runs, not two rows.
 */
export function ingestBatch(scanId: string): IngestBatch {
  const scan = scanById.get(scanId);
  if (!scan) {
    return {
      scan: scanId,
      groups: [],
      proposed: [],
      closable: [],
      contested: [],
      diff: [],
      counts: emptyCounts,
    };
  }

  const own = normalizedForScan(scanId);
  const ownIds = new Set(own.map((r) => r.id));
  const corroborating = currentScansForProgram(scan.program)
    .filter((s) => s.id !== scanId)
    .flatMap((s) => normalizedForScan(s.id));

  const groups = dedupe([...own, ...corroborating]).filter(
    (g) => ownIds.has(g.primary.id) || g.duplicates.some((d) => ownIds.has(d.id)),
  );

  const proposed = groups.filter((g) => !g.primary.clean && g.existing === null);

  // Closure is a claim about the program, not about one run, so it is tested
  // against every scan the program currently relies on — including this one.
  // Testing at the finding level rather than the dedup-key level is what makes
  // the granularity split answerable: `matchingFindings` resolves through the
  // owning asset, so a host reported at chassis level (CN-0130) by ACAS and at
  // component level (CN-0131) by SCAP answers alike, where the two keys never
  // could. A finding another current run still reports is not closable; saying
  // so, by name, is more use to an assessor than dropping it from the list.
  const reportedBy = new Map<string, string[]>();
  const witnesses = [scan, ...currentScansForProgram(scan.program).filter((s) => s.id !== scanId)];
  for (const other of witnesses) {
    for (const result of normalizedForScan(other.id)) {
      if (result.clean) continue;
      for (const id of matchingFindings(result)) {
        const seen = reportedBy.get(id);
        if (!seen) reportedBy.set(id, [other.id]);
        else if (!seen.includes(other.id)) seen.push(other.id);
      }
    }
  }

  const describe = (id: string) => {
    const run = scanById.get(id);
    return run ? `${id} (${run.format}, completed ${run.completed})` : id;
  };

  const closable: string[] = [];
  const contested: ContestedClosure[] = [];
  for (const group of reportedGroups(scan.supersedes)) {
    for (const id of group.existingAll) {
      const finding = findings.find((f) => f.id === id);
      if (!finding || !isDeficiency(finding)) continue;
      const holders = reportedBy.get(id) ?? [];
      // This run still reports it — under this key or, at another granularity,
      // under a different one. Nothing stopped being reported, so it is neither
      // closable nor a contradiction.
      if (holders.includes(scanId)) continue;
      if (holders.length === 0) {
        if (!closable.includes(id)) closable.push(id);
        continue;
      }
      if (contested.some((c) => c.finding === id)) continue;
      contested.push({
        finding: id,
        scans: holders,
        basis: `${scanId} no longer reports this condition, but ${holders.map(describe).join(" and ")} still ${holders.length === 1 ? "reports" : "report"} it against the same asset, so ${id} is not clear for closure.`,
      });
    }
  }

  return {
    scan: scanId,
    groups,
    proposed,
    closable,
    contested,
    diff: scanDiff(scan.supersedes, scanId),
    counts: {
      raw: scan.rawItems,
      normalized: own.length,
      clean: own.filter((r) => r.clean).length,
      deduped: groups.reduce((n, g) => n + g.duplicates.length, 0),
      unresolved: own.filter((r) => r.unresolved.length > 0).length,
    },
  };
}
