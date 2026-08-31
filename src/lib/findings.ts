/**
 * Chunk 2 of the CCI spine — Assets and Findings.
 *
 * A Finding is a technical fact from any verification path. It always names one
 * CCI (the join key) and one Asset. It carries raw and mitigated severity
 * separately, and it rolls up to a POA&M item and then to a Risk.
 */

import type { FindingLifecycle, FindingSeverity } from "@/lib/spine";

export type AssetKind = "Host" | "Container image" | "Network device" | "Application";
export type Environment = "Production" | "Staging" | "Lab" | "Tactical edge";

export type Asset = {
  id: string; // AST-
  name: string;
  kind: AssetKind;
  technology: string; // joins to a Benchmark
  program: string; // PRG-
  environment: Environment;
  owner: string;
  lastScan: string;
  ccisCovered: number;
  openCatI: number;
  openCatII: number;
  openCatIII: number;
};

export type VerificationPath =
  "STIG checklist" | "ACAS scan" | "Code scan" | "Test event" | "Manual procedure";

export type AssessmentMethod = "Examine" | "Interview" | "Test";

/**
 * What the assessor actually did and concluded. This is the SAR entry behind
 * the finding: the 800-53A determination statement it was tested against, who
 * ran it, and the determination in the assessor's own words.
 */
export type FindingAssessment = {
  method: AssessmentMethod;
  /** 800-53A determination statement label and what was examined or tested. */
  procedure: string;
  assessedBy: string;
  assessedOn: string;
  determination: string;
  /** EVD- artifacts backing the determination. */
  evidence: string[];
};

export type Finding = {
  id: string; // FND-
  title: string;
  cci: string; // CCI-
  control: string; // natural key, e.g. AC-2(3)
  asset: string; // AST-
  rule?: string; // V-
  source: VerificationPath;
  sourceArtifact: string; // EVD-
  rawSeverity: FindingSeverity;
  mitigatedSeverity: FindingSeverity;
  mitigation?: string;
  lifecycle: FindingLifecycle;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  owner: string;
  poam?: string; // POAM-
  risk?: string; // RSK-
  /** The finding statement: the condition, stated against the requirement. */
  detail: string;
  assessment: FindingAssessment;
  /** What the assessor says should be done, whether or not it is scheduled. */
  recommendation: string;
};

export const assets: Asset[] = [
  {
    id: "AST-0117",
    name: "gcs-app-01",
    kind: "Host",
    technology: "RHEL 9",
    program: "PRG-1041",
    environment: "Production",
    owner: "Platform ops",
    lastScan: "Aug 27, 04:10",
    ccisCovered: 214,
    openCatI: 1,
    openCatII: 6,
    openCatIII: 11,
  },
  {
    id: "AST-0118",
    name: "gcs-app-02",
    kind: "Host",
    technology: "RHEL 9",
    program: "PRG-1041",
    environment: "Production",
    owner: "Platform ops",
    lastScan: "Aug 27, 04:10",
    ccisCovered: 214,
    openCatI: 0,
    openCatII: 4,
    openCatIII: 9,
  },
  {
    id: "AST-0203",
    name: "mission-api:2.14.0",
    kind: "Container image",
    technology: "Ubuntu 22.04 container",
    program: "PRG-1041",
    environment: "Production",
    owner: "Mission software",
    lastScan: "Aug 26, 22:48",
    ccisCovered: 96,
    openCatI: 0,
    openCatII: 3,
    openCatIII: 5,
  },
  {
    id: "AST-0311",
    name: "edge-sw-a1",
    kind: "Network device",
    technology: "Cisco IOS-XE",
    program: "PRG-1041",
    environment: "Tactical edge",
    owner: "Network engineering",
    lastScan: "Aug 24, 09:02",
    ccisCovered: 78,
    openCatI: 1,
    openCatII: 2,
    openCatIII: 3,
  },
  {
    id: "AST-0402",
    name: "keycloak-idp",
    kind: "Application",
    technology: "Keycloak 24",
    program: "PRG-1041",
    environment: "Production",
    owner: "Identity platform",
    lastScan: "Aug 27, 01:30",
    ccisCovered: 131,
    openCatI: 0,
    openCatII: 2,
    openCatIII: 4,
  },
  {
    id: "AST-0507",
    name: "gcs-db-01",
    kind: "Host",
    technology: "PostgreSQL 15",
    program: "PRG-1041",
    environment: "Production",
    owner: "Data platform",
    lastScan: "Aug 25, 03:44",
    ccisCovered: 102,
    openCatI: 0,
    openCatII: 5,
    openCatIII: 7,
  },
];

export const assetById = new Map(assets.map((a) => [a.id, a]));

export const findings: Finding[] = [
  {
    id: "FND-2214",
    title: "SSH permits GSSAPI authentication",
    cci: "CCI-000765",
    control: "IA-2(1)",
    asset: "AST-0117",
    rule: "V-257984",
    source: "STIG checklist",
    sourceArtifact: "EVD-8841",
    rawSeverity: "CAT I",
    mitigatedSeverity: "CAT II",
    mitigation: "Bastion-only reachability; no direct SSH from user VLANs.",
    lifecycle: "Triaged",
    firstSeen: "Aug 12",
    lastSeen: "Aug 27",
    occurrences: 4,
    owner: "Platform ops",
    poam: "POAM-0071",
    risk: "RSK-0014",
    detail:
      "sshd_config sets GSSAPIAuthentication yes, allowing a non-PIV authentication path to a privileged interface.",
    assessment: {
      method: "Examine",
      procedure:
        "IA-02(01)(a) — examine the authenticator configuration on the privileged interface for multifactor enforcement.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 27, 2026",
      determination:
        "Objective not met. sshd on gcs-app-01 accepts GSSAPI as an independent authentication path, so network access to a privileged account can complete without the PIV credential the CCI requires. Bastion-only reachability limits who can reach the interface but does not change what the interface accepts, so it reduces severity rather than satisfying the objective.",
      evidence: ["EVD-8841"],
    },
    recommendation:
      "Set GSSAPIAuthentication no in the golden sshd baseline, enforce it through the Ansible drift job, and re-run V-257984 across every RHEL 9 host in the boundary.",
  },
  {
    id: "FND-2231",
    title: "Router management plane accepts unencrypted telnet",
    cci: "CCI-001453",
    control: "SC-8(1)",
    asset: "AST-0311",
    rule: "V-215807",
    source: "STIG checklist",
    sourceArtifact: "EVD-8846",
    rawSeverity: "CAT I",
    mitigatedSeverity: "CAT I",
    lifecycle: "Open",
    firstSeen: "Aug 24",
    lastSeen: "Aug 24",
    occurrences: 1,
    owner: "Network engineering",
    risk: "RSK-0021",
    detail:
      "line vty 0 4 permits telnet transport input. Management traffic on the tactical edge segment is not cryptographically protected.",
    assessment: {
      method: "Examine",
      procedure:
        "SC-08(01)(a) — examine the device configuration for cryptographic mechanisms protecting transmitted information.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 24, 2026",
      determination:
        "Objective not met. line vty 0 4 accepts transport input telnet, so management sessions to edge-sw-a1 cross the tactical edge segment in cleartext and are readable by anything on the path. No compensating control was offered at assessment, so the finding carries its raw severity.",
      evidence: ["EVD-8846"],
    },
    recommendation:
      "Remove telnet from transport input, restrict the vty lines to SSHv2 with FIPS-validated ciphers, and confirm the change against the Cisco IOS XE NDM STIG before the next edge deployment.",
  },
  {
    id: "FND-2240",
    title: "Audit records not offloaded within 24 hours",
    cci: "CCI-001851",
    control: "AU-4",
    asset: "AST-0507",
    source: "ACAS scan",
    sourceArtifact: "EVD-8852",
    rawSeverity: "CAT II",
    mitigatedSeverity: "CAT II",
    lifecycle: "Remediating",
    firstSeen: "Aug 06",
    lastSeen: "Aug 25",
    occurrences: 6,
    owner: "Data platform",
    poam: "POAM-0064",
    risk: "RSK-0014",
    detail:
      "rsyslog forwarding to the aggregator is queued but the spool drains on a 36-hour cycle, exceeding the CCI's 24-hour offload statement.",
    assessment: {
      method: "Test",
      procedure:
        "AU-04(a) — test that audit record storage and offload meet the organization-defined retention window.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 25, 2026",
      determination:
        "Objective not met. Measured spool drain across three cycles averaged 36 hours against a 24-hour statement. Forwarding is configured and the aggregator is healthy, so this is a capacity and scheduling gap rather than a missing capability — records are never lost, they are simply late.",
      evidence: ["EVD-8852"],
    },
    recommendation:
      "Increase aggregator ingest capacity, shorten the rsyslog drain cycle to 12 hours, and alert on queue depth so the window cannot silently slip again.",
  },
  {
    id: "FND-2246",
    title: "Container image ships with unpatched openssl",
    cci: "CCI-002605",
    control: "SI-2",
    asset: "AST-0203",
    source: "Code scan",
    sourceArtifact: "EVD-8858",
    rawSeverity: "CAT II",
    mitigatedSeverity: "CAT III",
    mitigation: "Vulnerable code path not reachable; TLS terminated at the mesh sidecar.",
    lifecycle: "Retest pending",
    firstSeen: "Aug 19",
    lastSeen: "Aug 26",
    occurrences: 3,
    owner: "Mission software",
    poam: "POAM-0069",
    detail:
      "Base layer pins openssl 3.0.11; CVE-2024-2511 remains unremediated in the published tag.",
    assessment: {
      method: "Examine",
      procedure: "SI-02(c) — examine the flaw remediation record for the component as deployed.",
      assessedBy: "Joel Barrantes",
      assessedOn: "Aug 26, 2026",
      determination:
        "Objective not met as published. The tag running in production pins openssl 3.0.11 and CVE-2024-2511 is unremediated in that layer. The assessor accepted that the mesh sidecar terminates TLS ahead of the vulnerable code path, which lowers the mitigated severity, but the component itself still carries the flaw.",
      evidence: ["EVD-8858"],
    },
    recommendation:
      "Rebase the image on the hardened parent carrying openssl 3.0.13, republish as 2.14.1, and re-run the code scan gate before the tag is promoted.",
  },
  {
    id: "FND-2251",
    title: "Emergency accounts lack automatic disable",
    cci: "CCI-000016",
    control: "AC-2(3)",
    asset: "AST-0402",
    source: "Manual procedure",
    sourceArtifact: "EVD-8861",
    rawSeverity: "CAT II",
    mitigatedSeverity: "CAT II",
    lifecycle: "Open",
    firstSeen: "Aug 21",
    lastSeen: "Aug 27",
    occurrences: 2,
    owner: "Identity platform",
    detail:
      "Break-glass realm accounts have no expiry policy; the CCI requires automatic disable of emergency accounts after an organization-defined period.",
    assessment: {
      method: "Examine",
      procedure:
        "AC-02(03)(d) — examine the account configuration for automatic disable after the organization-defined period of inactivity.",
      assessedBy: "Amara Bell",
      assessedOn: "Aug 27, 2026",
      determination:
        "Objective not met. The break-glass realm carries no expiry or inactivity policy, so an emergency account stays enabled indefinitely once issued. Interviews confirmed that disabling is a manual runbook step with no automated backstop and no alert when it is skipped.",
      evidence: ["EVD-8861"],
    },
    recommendation:
      "Set an expiry and inactivity policy on the break-glass realm, alert on any emergency account still enabled after the window, and record the organization-defined period in the SSP.",
  },
  {
    id: "FND-2258",
    title: "Session lock not enforced after 15 minutes",
    cci: "CCI-000057",
    control: "AC-11",
    asset: "AST-0118",
    rule: "V-257258",
    source: "STIG checklist",
    sourceArtifact: "EVD-8841",
    rawSeverity: "CAT II",
    mitigatedSeverity: "CAT III",
    mitigation: "Physical access to the console is limited to a controlled facility.",
    lifecycle: "Risk accepted",
    firstSeen: "Jul 30",
    lastSeen: "Aug 27",
    occurrences: 8,
    owner: "Platform ops",
    risk: "RSK-0009",
    detail: "tmux lock-after-time is unset on interactive shells for the operator group.",
    assessment: {
      method: "Test",
      procedure:
        "AC-11(a) — test that the system initiates a session lock after the organization-defined period of inactivity.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 27, 2026",
      determination:
        "Objective not met. Interactive shells for the operator group did not lock across a 30-minute idle test on gcs-app-02. Exploitation requires physical presence at a console inside a facility with two-person badge entry, which the AO weighed when accepting the residual.",
      evidence: ["EVD-8841"],
    },
    recommendation:
      "Set lock-after-time on the operator profile so the control is satisfied technically rather than by facility access, and retire the acceptance at the next annual reauthorization.",
  },
  {
    id: "FND-2263",
    title: "Boundary test found unauthenticated metrics endpoint",
    cci: "CCI-001414",
    control: "AC-4",
    asset: "AST-0203",
    source: "Test event",
    sourceArtifact: "EVD-8866",
    rawSeverity: "CAT II",
    mitigatedSeverity: "CAT II",
    lifecycle: "Triaged",
    firstSeen: "Aug 22",
    lastSeen: "Aug 22",
    occurrences: 1,
    owner: "Mission software",
    poam: "POAM-0072",
    detail:
      "TE-0044 adversarial run reached /metrics from the untrusted enclave; information flow policy does not permit that path.",
    assessment: {
      method: "Test",
      procedure:
        "AC-04(a) — test enforcement of approved authorizations for controlling information flow within the system.",
      assessedBy: "Wes Duarte",
      assessedOn: "Aug 22, 2026",
      determination:
        "Objective not met. During TE-0044 the red team reached /metrics on mission-api from the untrusted enclave with no credential. The approved flow policy does not permit that path, so the authorization exists on paper but is not enforced at the mesh.",
      evidence: ["EVD-8866"],
    },
    recommendation:
      "Deny /metrics at the sidecar for every non-management identity, add the path to the flow policy test set, and re-run TE-0044 to confirm the request is refused.",
  },
  {
    id: "FND-2269",
    title: "Supplier SBOM missing for two transitive packages",
    cci: "CCI-003128",
    control: "SR-4",
    asset: "AST-0203",
    source: "Code scan",
    sourceArtifact: "EVD-8871",
    rawSeverity: "CAT III",
    mitigatedSeverity: "CAT III",
    lifecycle: "Open",
    firstSeen: "Aug 18",
    lastSeen: "Aug 26",
    occurrences: 2,
    owner: "Mission software",
    detail: "CycloneDX output omits provenance for two vendored Go modules.",
    assessment: {
      method: "Examine",
      procedure:
        "SR-04(a) — examine provenance documentation for system components and their supply chain.",
      assessedBy: "Joel Barrantes",
      assessedOn: "Aug 26, 2026",
      determination:
        "Objective partially met. The CycloneDX output covers the build graph but omits provenance for two vendored Go modules, so the chain of custody cannot be established end to end for those components.",
      evidence: ["EVD-8871"],
    },
    recommendation:
      "Vendor the two modules through the internal proxy so provenance is captured at fetch time, and fail the build when a component reaches the SBOM without it.",
  },
  {
    id: "FND-2274",
    title: "Duplicate of FND-2214 reported by ACAS",
    cci: "CCI-000765",
    control: "IA-2(1)",
    asset: "AST-0117",
    source: "ACAS scan",
    sourceArtifact: "EVD-8852",
    rawSeverity: "CAT I",
    mitigatedSeverity: "CAT II",
    lifecycle: "False positive",
    firstSeen: "Aug 25",
    lastSeen: "Aug 25",
    occurrences: 1,
    owner: "Platform ops",
    detail: "Plugin 71049 fired on the same sshd_config setting already tracked as FND-2214.",
    assessment: {
      method: "Examine",
      procedure:
        "IA-02(01)(a) — examine the authenticator configuration on the privileged interface.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 25, 2026",
      determination:
        "Not a separate weakness. Plugin 71049 fired on the same sshd_config setting already tracked as FND-2214. Closed as a duplicate; the underlying condition stays open under the original finding.",
      evidence: ["EVD-8852"],
    },
    recommendation:
      "No action. Suppress plugin 71049 against hosts already carrying FND-2214 so the same condition is not counted twice in the SAR.",
  },
  {
    id: "FND-2281",
    title: "Flaw remediation SLA exceeded on two hosts",
    cci: "CCI-002617",
    control: "SI-2(3)",
    asset: "AST-0507",
    source: "ACAS scan",
    sourceArtifact: "EVD-8852",
    rawSeverity: "CAT III",
    mitigatedSeverity: "CAT III",
    lifecycle: "Closed",
    firstSeen: "Jul 14",
    lastSeen: "Aug 20",
    occurrences: 5,
    owner: "Data platform",
    poam: "POAM-0058",
    detail: "Patch cadence slipped past the 30-day window in July; August cycle closed the gap.",
    assessment: {
      method: "Examine",
      procedure:
        "SI-02(03)(b) — examine records of the time taken to remediate flaws against the organization-defined benchmark.",
      assessedBy: "Nadia Fournier",
      assessedOn: "Aug 20, 2026",
      determination:
        "Objective met on re-test. The July patch cadence exceeded the 30-day window on two hosts. The August cycle completed inside the window on every affected host and the evidence supports closure.",
      evidence: ["EVD-8852"],
    },
    recommendation:
      "Keep the patch window ahead of the monthly maintenance freeze and hold the change until two consecutive cycles land inside 30 days.",
  },
];

export const openLifecycles: FindingLifecycle[] = [
  "Open",
  "Triaged",
  "Remediating",
  "Retest pending",
];

export function isOpen(f: Finding) {
  return openLifecycles.includes(f.lifecycle);
}

export function findingsByAsset(assetId: string) {
  return findings.filter((f) => f.asset === assetId);
}

export function findingsByCci(cci: string) {
  return findings.filter((f) => f.cci === cci);
}

const severityRank: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

export function bySeverity(a: Finding, b: Finding) {
  return severityRank[a.mitigatedSeverity] - severityRank[b.mitigatedSeverity];
}
