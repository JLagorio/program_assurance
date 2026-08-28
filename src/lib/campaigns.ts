/**
 * Chunk 3 of the CCI spine — Test campaigns, events and objectives.
 *
 * A Campaign (TC-) is a scoped body of cyber T&E work opened against a trigger.
 * It contains Events (TE-), each one execution — cooperative or adversarial.
 * An Event proves Test objectives, and each objective names the CCIs it covers.
 * Findings produced by an event join back to those same CCIs.
 */

import type { TestEventState } from "@/lib/spine";

export type CampaignTrigger =
  | "Gate entry"
  | "Baseline change"
  | "Major release"
  | "Incident"
  | "Annual assessment";

export type CampaignState = "Planning" | "Executing" | "Reporting" | "Closed";

export type Campaign = {
  id: string; // TC-
  name: string;
  program: string; // PRG-
  trigger: CampaignTrigger;
  gate: string;
  state: CampaignState;
  lead: string;
  opened: string;
  target: string;
  scope: string;
};

export type EventKind = "Cooperative" | "Adversarial" | "Regression" | "Table-top";

export type TestEvent = {
  id: string; // TE-
  campaign: string; // TC-
  name: string;
  kind: EventKind;
  state: TestEventState;
  window: string;
  team: string;
  assets: string[]; // AST-
  objectives: string[]; // TO-
  findings: string[]; // FND-
  notes: string;
};

export type ObjectiveResult = "Not run" | "Met" | "Partially met" | "Not met";

export type TestObjective = {
  id: string; // TO-
  statement: string;
  ccis: string[]; // CCI-
  method: "Demonstration" | "Interview" | "Examination" | "Penetration" | "Automated";
  result: ObjectiveResult;
  event?: string; // TE-
  evidence?: string; // EVD-
};

export const campaigns: Campaign[] = [
  {
    id: "TC-0031",
    name: "TRR readiness verification",
    program: "PRG-1041",
    trigger: "Gate entry",
    gate: "TRR",
    state: "Executing",
    lead: "Marcus Hale",
    opened: "Aug 04",
    target: "Sep 12",
    scope: "All CAT I-bearing CCIs on the ground segment plus the tactical edge boundary.",
  },
  {
    id: "TC-0034",
    name: "Adversarial assessment — mission API",
    program: "PRG-1041",
    trigger: "Major release",
    gate: "IATT",
    state: "Executing",
    lead: "Red cell (DT&E)",
    opened: "Aug 15",
    target: "Sep 04",
    scope: "External and enclave-adjacent attack surface of mission-api 2.14.",
  },
  {
    id: "TC-0028",
    name: "Overlay delta re-test",
    program: "PRG-1041",
    trigger: "Baseline change",
    gate: "CDR",
    state: "Reporting",
    lead: "Priya Raman",
    opened: "Jul 09",
    target: "Aug 29",
    scope: "Controls added by the tactical/DDIL overlay after the baseline was re-tailored.",
  },
  {
    id: "TC-0022",
    name: "Annual control assessment",
    program: "PRG-1041",
    trigger: "Annual assessment",
    gate: "ATO",
    state: "Closed",
    lead: "Whitcombe LLP",
    opened: "Feb 03",
    target: "Apr 18",
    scope: "Full 800-53A sampling against the moderate baseline.",
  },
];

export const events: TestEvent[] = [
  {
    id: "TE-0041",
    campaign: "TC-0031",
    name: "Host hardening verification — ground segment",
    kind: "Cooperative",
    state: "Reported",
    window: "Aug 12 – Aug 16",
    team: "Platform ops + SSE",
    assets: ["AST-0117", "AST-0118"],
    objectives: ["TO-101", "TO-102"],
    findings: ["FND-2214", "FND-2258"],
    notes: "STIG checklist walk with the assessor observing; two settings deviated.",
  },
  {
    id: "TE-0043",
    campaign: "TC-0031",
    name: "Audit offload timing test",
    kind: "Cooperative",
    state: "Data reduction",
    window: "Aug 21 – Aug 25",
    team: "Data platform",
    assets: ["AST-0507"],
    objectives: ["TO-104"],
    findings: ["FND-2240"],
    notes: "Spool drain measured over a 72-hour soak; results being reduced.",
  },
  {
    id: "TE-0044",
    campaign: "TC-0034",
    name: "Enclave boundary penetration run",
    kind: "Adversarial",
    state: "Reported",
    window: "Aug 20 – Aug 22",
    team: "Red cell",
    assets: ["AST-0203", "AST-0311"],
    objectives: ["TO-110", "TO-111"],
    findings: ["FND-2263", "FND-2231"],
    notes: "Reached /metrics from the untrusted enclave; telnet path confirmed on the edge switch.",
  },
  {
    id: "TE-0046",
    campaign: "TC-0034",
    name: "Credential abuse chain",
    kind: "Adversarial",
    state: "Executing",
    window: "Aug 26 – Sep 02",
    team: "Red cell",
    assets: ["AST-0402"],
    objectives: ["TO-112"],
    findings: ["FND-2251"],
    notes: "Break-glass account persistence under test.",
  },
  {
    id: "TE-0048",
    campaign: "TC-0031",
    name: "Retest — container flaw remediation",
    kind: "Regression",
    state: "Planned",
    window: "Sep 03 – Sep 05",
    team: "Mission software",
    assets: ["AST-0203"],
    objectives: ["TO-106"],
    findings: ["FND-2246"],
    notes: "Blocked until the rebuilt image is published to the registry.",
  },
  {
    id: "TE-0038",
    campaign: "TC-0028",
    name: "DDIL degraded-mode demonstration",
    kind: "Table-top",
    state: "Reported",
    window: "Aug 06 – Aug 07",
    team: "Systems engineering",
    assets: ["AST-0311"],
    objectives: ["TO-120"],
    findings: [],
    notes: "Degraded-comms procedures walked with the AO's staff; no findings.",
  },
];

export const objectives: TestObjective[] = [
  {
    id: "TO-101",
    statement: "Privileged interfaces accept only PIV-derived multifactor authentication.",
    ccis: ["CCI-000765"],
    method: "Demonstration",
    result: "Not met",
    event: "TE-0041",
    evidence: "EVD-8841",
  },
  {
    id: "TO-102",
    statement: "Interactive sessions lock after the organization-defined inactivity period.",
    ccis: ["CCI-000057"],
    method: "Automated",
    result: "Not met",
    event: "TE-0041",
    evidence: "EVD-8841",
  },
  {
    id: "TO-104",
    statement: "Audit records reach the aggregator within 24 hours of generation.",
    ccis: ["CCI-001851"],
    method: "Examination",
    result: "Partially met",
    event: "TE-0043",
    evidence: "EVD-8852",
  },
  {
    id: "TO-106",
    statement: "Published images carry no unremediated flaws past the remediation window.",
    ccis: ["CCI-002605", "CCI-002617"],
    method: "Automated",
    result: "Not run",
    event: "TE-0048",
  },
  {
    id: "TO-110",
    statement: "Information flow policy blocks untrusted-enclave access to internal endpoints.",
    ccis: ["CCI-001414"],
    method: "Penetration",
    result: "Not met",
    event: "TE-0044",
    evidence: "EVD-8866",
  },
  {
    id: "TO-111",
    statement: "Management traffic is cryptographically protected in transit.",
    ccis: ["CCI-001453"],
    method: "Penetration",
    result: "Not met",
    event: "TE-0044",
    evidence: "EVD-8866",
  },
  {
    id: "TO-112",
    statement: "Emergency accounts are disabled automatically after the defined period.",
    ccis: ["CCI-000016"],
    method: "Penetration",
    result: "Not run",
    event: "TE-0046",
  },
  {
    id: "TO-120",
    statement: "Degraded-communications procedures preserve required security functions.",
    ccis: ["CCI-001414", "CCI-001453"],
    method: "Interview",
    result: "Met",
    event: "TE-0038",
    evidence: "EVD-8830",
  },
];

export const campaignById = new Map(campaigns.map((c) => [c.id, c]));
export const eventById = new Map(events.map((e) => [e.id, e]));
export const objectiveById = new Map(objectives.map((o) => [o.id, o]));

export function eventsByCampaign(id: string) {
  return events.filter((e) => e.campaign === id);
}

export function objectivesForEvent(id: string) {
  return objectives.filter((o) => o.event === id);
}

/** CCIs an event touches, derived through its objectives. Never stored twice. */
export function ccisForEvent(id: string) {
  return [...new Set(objectivesForEvent(id).flatMap((o) => o.ccis))];
}

export function objectivesForCci(cci: string) {
  return objectives.filter((o) => o.ccis.includes(cci));
}

export function campaignCoverage(id: string) {
  const evs = eventsByCampaign(id);
  const objs = evs.flatMap((e) => objectivesForEvent(e.id));
  const run = objs.filter((o) => o.result !== "Not run");
  return {
    events: evs.length,
    objectives: objs.length,
    run: run.length,
    notMet: objs.filter((o) => o.result === "Not met").length,
    findings: evs.reduce((n, e) => n + e.findings.length, 0),
  };
}

export const objectiveTone = (r: ObjectiveResult) =>
  r === "Met" ? "success" : r === "Not met" ? "danger" : r === "Partially met" ? "warning" : "neutral";
