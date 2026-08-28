/**
 * Chunk 5 of the CCI spine — the unified POA&M and risk register.
 *
 * Two objects, one register. A POA&M item is the commitment to close a set of
 * findings by a date. A Risk is the aggregation the AO adjudicates: it owns
 * residual exposure and a disposition, and it points at the POA&M items that
 * reduce it. Both join to the spine only through findings, never directly to a
 * control — the CCI is always reached through FND-.
 */

import type { FindingSeverity, PoamStatus, RiskDisposition } from "@/lib/spine";
import { findings, isOpen, type Finding } from "@/lib/findings";

export type PoamItem = {
  id: string; // POAM-
  title: string;
  program: string; // PRG-
  status: PoamStatus;
  owner: string;
  resources: string;
  scheduledCompletion: string;
  originalCompletion: string;
  milestoneNote: string;
  risk?: string; // RSK-
  remediation: string;
};

export type RegisterRisk = {
  id: string; // RSK-
  title: string;
  program: string; // PRG-
  owner: string;
  disposition: RiskDisposition;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  inherent: number;
  residual: number;
  treatment: "Mitigate" | "Accept" | "Transfer" | "Avoid";
  statement: string;
  aoNote?: string;
  reviewed: string;
};

export const poamItems: PoamItem[] = [
  {
    id: "POAM-0071",
    title: "Remove non-PIV authentication paths from privileged interfaces",
    program: "PRG-1041",
    status: "Ongoing",
    owner: "Platform ops",
    resources: "2 eng-weeks, config baseline change",
    scheduledCompletion: "Sep 26, 2026",
    originalCompletion: "Sep 12, 2026",
    milestoneNote: "Baseline PR merged; fleet rollout pending change window.",
    risk: "RSK-0014",
    remediation:
      "Disable GSSAPIAuthentication in the golden sshd baseline and enforce it via the Ansible drift job on every RHEL 9 host in the boundary.",
  },
  {
    id: "POAM-0064",
    title: "Bring audit offload inside the 24-hour statement",
    program: "PRG-1041",
    status: "Ongoing",
    owner: "Data platform",
    resources: "Aggregator capacity increase",
    scheduledCompletion: "Sep 09, 2026",
    originalCompletion: "Sep 09, 2026",
    milestoneNote: "Spool cycle reduced to 12h in staging; production cutover scheduled.",
    risk: "RSK-0014",
    remediation:
      "Shorten the rsyslog spool drain cycle and add a queue-depth alert so the offload window cannot silently exceed 24 hours.",
  },
  {
    id: "POAM-0069",
    title: "Rebuild mission-api base layer on patched openssl",
    program: "PRG-1041",
    status: "Ongoing",
    owner: "Mission software",
    resources: "Pipeline change, 1 eng-week",
    scheduledCompletion: "Sep 04, 2026",
    originalCompletion: "Aug 21, 2026",
    milestoneNote: "Awaiting retest of 2.14.1 candidate image.",
    remediation:
      "Rebase the image on the hardened Ubuntu 22.04 parent carrying openssl 3.0.13 and re-run the code scan gate.",
  },
  {
    id: "POAM-0072",
    title: "Close unauthenticated metrics path from untrusted enclave",
    program: "PRG-1041",
    status: "Overdue",
    owner: "Mission software",
    resources: "Mesh policy change",
    scheduledCompletion: "Aug 22, 2026",
    originalCompletion: "Aug 22, 2026",
    milestoneNote: "Policy authored, not applied — blocked on mesh maintenance window.",
    risk: "RSK-0021",
    remediation:
      "Deny /metrics at the sidecar for all non-management identities and re-run TE-0044 to confirm the flow is refused.",
  },
  {
    id: "POAM-0058",
    title: "Restore 30-day flaw remediation cadence",
    program: "PRG-1041",
    status: "Completed",
    owner: "Data platform",
    resources: "None — process change",
    scheduledCompletion: "Aug 20, 2026",
    originalCompletion: "Aug 20, 2026",
    milestoneNote: "August cycle patched within window; evidence attached to EVD-8852.",
    remediation: "Move the patch window ahead of the monthly maintenance freeze.",
  },
  {
    id: "POAM-0079",
    title: "Accept console session lock exposure in controlled facility",
    program: "PRG-1041",
    status: "Risk accepted",
    owner: "Platform ops",
    resources: "None",
    scheduledCompletion: "—",
    originalCompletion: "Oct 15, 2026",
    milestoneNote: "AO accepted residual on the strength of the facility access control.",
    risk: "RSK-0009",
    remediation: "No technical remediation planned; revisit at annual reauthorization.",
  },
];

export const registerRisks: RegisterRisk[] = [
  {
    id: "RSK-0014",
    title: "Privileged access and audit trail can be defeated together",
    program: "PRG-1041",
    owner: "Marcus Ryde",
    disposition: "Pending AO",
    likelihood: 3,
    impact: 5,
    inherent: 84,
    residual: 52,
    treatment: "Mitigate",
    statement:
      "A non-PIV path into a privileged interface combined with an audit offload window beyond 24 hours means privileged misuse could go unattributed for more than a day.",
    reviewed: "Aug 27, 2026",
  },
  {
    id: "RSK-0021",
    title: "Untrusted enclave reaches management-plane surfaces",
    program: "PRG-1041",
    owner: "Priya Raghavan",
    disposition: "Pending AO",
    likelihood: 4,
    impact: 4,
    inherent: 88,
    residual: 71,
    treatment: "Mitigate",
    statement:
      "Cleartext management transport at the tactical edge and an open metrics path from the untrusted enclave give an adversary a reconnaissance and credential-capture route into the management plane.",
    reviewed: "Aug 26, 2026",
  },
  {
    id: "RSK-0009",
    title: "Unattended console sessions in a controlled facility",
    program: "PRG-1041",
    owner: "Sarah Chen",
    disposition: "Accepted",
    likelihood: 2,
    impact: 2,
    inherent: 36,
    residual: 18,
    treatment: "Accept",
    statement:
      "Interactive shells do not lock after 15 minutes. Exploitation requires physical presence inside an access-controlled facility with two-person badge entry.",
    aoNote:
      "Accepted through the next annual reauthorization. Revisit if the facility access model changes.",
    reviewed: "Aug 27, 2026",
  },
];

export const poamById = new Map(poamItems.map((p) => [p.id, p]));
export const riskById = new Map(registerRisks.map((r) => [r.id, r]));

export function findingsForPoam(id: string): Finding[] {
  return findings.filter((f) => f.poam === id);
}

export function findingsForRisk(id: string): Finding[] {
  const direct = findings.filter((f) => f.risk === id);
  const viaPoam = findings.filter(
    (f) => !f.risk && f.poam && poamById.get(f.poam)?.risk === id,
  );
  return [...direct, ...viaPoam];
}

export function poamsForRisk(id: string): PoamItem[] {
  return poamItems.filter((p) => p.risk === id);
}

const severityRank: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

export function worstSeverity(list: Finding[]): FindingSeverity | null {
  if (list.length === 0) return null;
  return list
    .slice()
    .sort((a, b) => severityRank[a.mitigatedSeverity] - severityRank[b.mitigatedSeverity])[0]!
    .mitigatedSeverity;
}

export function openCount(list: Finding[]) {
  return list.filter(isOpen).length;
}

/** Findings that carry neither a POA&M nor a risk — the register's own backlog. */
export function unrolledFindings(): Finding[] {
  return findings.filter((f) => isOpen(f) && !f.poam && !f.risk);
}

export function ccisForRisk(id: string): string[] {
  return Array.from(new Set(findingsForRisk(id).map((f) => f.cci))).sort();
}
