/**
 * Chunk 9c of the CCI spine — the Security Controls Traceability Matrix.
 *
 * The SCTM is the one artifact that has to hold every side of the spine at
 * once: the requirement (a DISA CCI where one exists, an SP 800-53A assessment
 * objective where one is published, the control itself otherwise), the
 * implementation assertion, the component the requirement is allocated to, how
 * it is verified, what evidence exists, and the 800-53A determination. It is
 * therefore GENERATED LIVE from the program's control matrix and never stored:
 * there is exactly one authoritative matrix per program, and editing a control
 * or closing a finding moves it immediately.
 *
 * Invariants held here:
 *  - `Partial` maps to `Other than satisfied`, NEVER to `Not assessed`.
 *    SP 800-53A knows only Satisfied and Other than satisfied; laundering a
 *    deficiency into "not assessed" severs the POA&M obligation that a
 *    deficiency creates. The same rule governs inheritance: a common control
 *    provider reporting `Other than satisfied` propagates that determination to
 *    the consumer, it does not hide behind the consumer's blank assessment.
 *  - The requirement row set for a control is the catalog CCI decomposition
 *    UNIONED with the CCIs the control's own findings name. The finding
 *    register carries real DISA ids the loaded catalog slice does not, and
 *    dropping them would lose the only rows that have evidence behind them.
 *  - Every requirement a control decomposes to gets a row. The matrix exists to
 *    prove nothing was missed, so it is never truncated: a dropped requirement
 *    cannot be gapped, counted or exported, and a count is not a report.
 *  - The determination follows the DEFICIENCY set, not the operationally open
 *    set. An AO risk acceptance is recorded in the POA&M and the risk register;
 *    it does not turn an unremediated deficiency back into `Satisfied`.
 *  - Origination is the resolved SECURITY CONTROL DESIGNATION from
 *    `@/lib/inheritance`, never a re-reading of `ProvidedControl.model` and
 *    never `ControlRow.implementation`. The resolution has already run the CCP
 *    precedence ladder, evaluated the offer against this system's real
 *    inventory and split the responsibility, so the row can also say *why this
 *    provider* (`inheritanceState` / `inheritanceReason`) instead of only
 *    *which*.
 *  - **Currency is separate from determination.** A configuration change does
 *    not re-assess anything; it tells the assessor that what is on file was
 *    taken against a configuration that is no longer in force. So `currency`
 *    carries Invalidated / Suspect on its own axis, and only a positive claim
 *    is retracted: an invalidated **Satisfied** becomes "Not assessed" with the
 *    old value RETAINED in `priorDetermination` so the UI can strike it
 *    through and the assessor can see what was claimed and when it stopped
 *    counting. An invalidated **Other than satisfied** is left alone — a change
 *    does not cure a deficiency, and moving it to "Not assessed" would sever
 *    the POA&M obligation, which is the one thing this file must never do.
 *    "Not applicable" is a scoping decision, not an assessment, so a change
 *    does not disturb it either.
 *  - **An allocation to the whole system is not an allocation to every part.**
 *    `allocationRule` sends PE/PS/MP — and every family with no node-level rule
 *    — to the boundary root, and the basis string says so in words: "rather than
 *    to an individual part". Every ancestor chain also terminates at that root,
 *    so bare containment ascent would make one package bump flag awareness
 *    training and personnel screening, and an overlay that flags everything is
 *    indistinguishable from no overlay. `allocationScope` and
 *    `systemAllocatedNodes` carry the distinction to `rowCurrency`, which is
 *    what keeps `Current` a state the data can actually reach.
 *  - Nothing here reads a clock. `generated` is the dataset's own date, so the
 *    server and client renders agree.
 *
 * Layering: this module sits between the change log and the impact analysis.
 * `rowCurrency` comes from `@/lib/baselines`, which is computed from the
 * composition graph and the change log alone and never builds a matrix, so it is
 * the layer below. Everything that needs real `SctmRow.key` values — the CM-3
 * impact analysis — is the layer above, in `@/lib/change-impact`, and suppresses
 * the overlay while it builds its rows. Nothing imports back down into this file
 * from `@/lib/baselines`, which is what keeps the three acyclic.
 */

import { useMemo, useSyncExternalStore } from "react";

import type { Tone } from "@/components/app/ui";
import { rowCurrency } from "@/lib/baselines";
import { objectivesForCci, type TestObjective } from "@/lib/campaigns";
import { ccis, ccisByControl, rulesByCci, type Cci } from "@/lib/catalog";
import {
  graphVersion,
  nodeForAsset,
  nodesForProgram,
  subscribeGraph,
  type CompositionNode,
} from "@/lib/composition";
import { useControlMatrix, type ControlRow, type ControlStatus } from "@/lib/control-matrix";
import { threadEvidence } from "@/lib/digital-thread";
import { findings, isDeficiency, isOpen, type Finding } from "@/lib/findings";
import {
  resolveInheritance,
  type InheritanceState,
  type ResolvedInheritance,
} from "@/lib/inheritance";
import type { NistControlText, NistMethod, NistObjective } from "@/lib/nist-catalog";
import type { ControlOrigination, FindingSeverity, VerificationMethod } from "@/lib/spine";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type RequirementUnit = "CCI" | "Objective" | "Control";
export type Determination =
  "Satisfied" | "Other than satisfied" | "Not assessed" | "Not applicable";

/**
 * Whether the determination on file still describes the configuration in force.
 * Orthogonal to `Determination`: a row can be Satisfied and Suspect at once,
 * and that is exactly the state an assessor needs to see.
 */
export type RowCurrency = "Current" | "Invalidated" | "Suspect";

/**
 * Whether a requirement is allocated to named components or to the whole
 * authorization boundary.
 *
 * The distinction is load-bearing for currency, not for display. A `system`
 * allocation is the positive statement that NO individual part implements the
 * requirement — physical, personnel and media protection are the archetype —
 * so "a part somewhere inside the boundary moved" says nothing about it. A
 * change that really moves the system as a whole still reaches those rows,
 * through its own node, through an ODP change or through a provider
 * re-assessment; what must not reach them is bare ancestry.
 */
export type AllocationScope = "component" | "system";

export const rowCurrencyTone: Record<RowCurrency, Tone> = {
  Current: "success",
  Invalidated: "danger",
  Suspect: "warning",
};

/**
 * Both vocabularies are declared once, in the spine. Re-exported here so the
 * SCTM's public surface is unchanged and consumers keep importing them from the
 * module that produces the rows.
 */
export type { ControlOrigination, VerificationMethod } from "@/lib/spine";

/** The 800-53A text catalog, keyed by control id — the dynamic-import shape. */
export type ControlTextIndex = Record<string, NistControlText>;

export type SctmRow = {
  /** Stable row key: `${control}|${unit}|${requirement}`. */
  key: string;
  control: string;
  controlTitle: string;
  family: string;
  familyName: string;
  unit: RequirementUnit;
  /** CCI id, 800-53A objective label, or the control id. */
  requirement: string;
  /** The atomic testable statement. "—" when nothing is published. */
  statement: string;
  /** The SSP implementation assertion. */
  assertion: string;
  origination: ControlOrigination;
  /** Provider name for Common/Hybrid rows, else the family owner. */
  responsibleParty: string;
  /** What the consuming program still owes on a Hybrid row. "—" otherwise. */
  consumerResponsibility: string;
  /** CN- ids the requirement is allocated to. */
  responsibleNodes: string[];
  allocationBasis: string;
  /** Whether the allocation names components or the boundary as a whole. */
  allocationScope: AllocationScope;
  /**
   * The subset of `responsibleNodes` present ONLY because the requirement is
   * allocated to the system as a whole — never a node the control's own
   * findings name. The currency overlay ignores bare ancestry on these and on
   * nothing else, so the gate can be applied per node rather than per row.
   */
  systemAllocatedNodes: string[];
  method: VerificationMethod;
  methodBasis: string;
  /** EVD- ids and provider evidence labels, de-duplicated. */
  evidence: string[];
  determination: Determination;
  determinationNote: string;
  /**
   * The determination this row carried before the currency overlay retracted
   * it, or null when nothing was retracted. Retained rather than overwritten so
   * the matrix can show what was claimed AND that it stopped counting; an
   * assessor cannot audit a value that was silently replaced.
   */
  priorDetermination: Determination | null;
  /** Whether the determination still describes the configuration in force. */
  currency: RowCurrency;
  /** Why, in one or two sentences. "—" when the row is current. */
  currencyReason: string;
  /** The resolved inheritance state, or null when the row is not inherited. */
  inheritanceState: InheritanceState | null;
  /** The resolution's own prose. "—" when the row is not inherited. */
  inheritanceReason: string;
  assessed: string;
  findings: string[];
  openFindings: number;
  worstSeverity: string;
  /** Why this row cannot ship in the package, or null. */
  gap: string | null;
};

export type Sctm = {
  program: string;
  rows: SctmRow[];
  generated: string;
  counts: {
    total: number;
    satisfied: number;
    other: number;
    notAssessed: number;
    notApplicable: number;
    /** Rows whose determination no longer describes the configuration in force. */
    invalidated: number;
    /** Rows the assessor is asked to look at again, determination intact. */
    suspect: number;
  };
  byMethod: { method: VerificationMethod; count: number }[];
  byOrigination: { origination: ControlOrigination; count: number }[];
  gaps: number;
  /** Rows with no evidence at all. */
  unevidenced: number;
  coverage: number;
};

export const verificationMethodTone: Record<VerificationMethod, Tone> = {
  Test: "info",
  Demonstration: "info",
  Analysis: "neutral",
  Inspection: "neutral",
};

export const determinationTone: Record<Determination, Tone> = {
  Satisfied: "success",
  "Other than satisfied": "danger",
  "Not assessed": "neutral",
  "Not applicable": "neutral",
};

/* ── Authored implementation statements ──────────────────────────────────── */

/**
 * The SSP implementation paragraph for the controls this program's own records
 * actually name. Written against THIS system: the components are the ones in
 * the composition graph, and where the assertion is not yet true it says so
 * rather than claiming a capability the finding register contradicts.
 */
export const assertions: Record<string, string> = {
  "AC-2":
    "Interactive and service accounts on gcs-app-01, gcs-app-02 and gcs-db-01 are provisioned only through the idp-core account workflow; the sole local accounts are the platform-ops break-glass account and the PostgreSQL 15.6 service account, both reconciled against the weekly IAM export.",
  "AC-2(3)":
    "Keycloak 24.0.5 on keycloak-idp disables any realm account idle for 35 days and disables an activated break-glass account 24 hours after use, and the RHEL 9.4 baseline applies the same 35-day inactivity expiry to local accounts on the ground-control hosts through the Ansible drift job.",
  "AC-4":
    "Flow between the tactical edge and the DMZ is constrained to the mutually authenticated /v2 routes of the mission-api service: the GovCloud landing zone security groups admit only TCP 443 from edge-sw-a1, and the operator and diagnostic routes inside the mission-api:2.14.0 image are bound to the container loopback interface.",
  "AC-11":
    "Sessions on gcs-app-01 and gcs-app-02 lock after 15 minutes of inactivity through the tmux lock-command in /etc/profile.d, and openssh-server 8.7p1 terminates idle remote sessions at ClientAliveInterval 600 with ClientAliveCountMax 0.",
  "AU-4":
    "gcs-db-01 carries a dedicated 200 GB /var/log/audit volume sized from the measured kernel and PostgreSQL 15.6 record rate, and rsyslog forwards those records to the GovCloud landing zone log sink so local capacity is a buffer rather than the retention mechanism.",
  "CM-6":
    "The RHEL 9.4 hosts are configured from the DISA RHEL 9 STIG profile applied by Ansible and re-asserted every four hours, and the mission-api:2.14.0 image is rebuilt from a digest-pinned ubuntu 22.04 base layer so container settings cannot drift between deployments; documented deviations are recorded against the baseline rather than applied in place.",
  "CM-8":
    "The component inventory is generated from delivered machine-readable documents rather than maintained by hand — BOM-0001 (CycloneDX 1.6) for mission-api:2.14.0, BOM-0002 (SPDX 2.3) for the ground-control RHEL 9.4 golden image, BOM-0003 for the Dell PowerEdge part list, BOM-0004 for the Catalyst 9300 firmware manifest and BOM-0005 for keycloak-idp — each recorded with its producer and SHA-256 and reconciled against the asset register at every gate.",
  "IA-2":
    "Every organizational user authenticates at keycloak-idp, which brokers to the corporate identity provider over SAML; neither the mission-api service nor the ground-control hosts maintain an independent user store, so identification and authentication happen once at a single enforcement point.",
  "IA-2(1)":
    "Network access to privileged accounts requires PIV-derived multifactor authentication: openssh-server 8.7p1 on the ground-control hosts accepts only public-key authentication bound to the PIV certificate chain, and the Keycloak 24.0.5 admin console requires a second factor for the realm-admin role.",
  "IA-5(1)":
    "Password-based authentication is inherited from the corporate identity provider; the one local password that must exist — the RHEL 9.4 break-glass account — is governed by pam_pwquality with the STIG complexity, minimum lifetime, reuse and history parameters set by the Ansible baseline.",
  "IA-8":
    "Non-organizational users reach the mission-api service only through the federated broker on keycloak-idp, which accepts assertions from the two approved partner identity providers and maps them onto a least-privilege realm role; the mission-api:2.14.0 image exposes no anonymous route.",
  "SC-7":
    "The authorization boundary is enforced by the GovCloud landing zone: the mission software subsystem sits in a DMZ subnet reachable only through the load balancer, gcs-db-01 sits in an isolated subnet with no egress route, and edge-sw-a1 reaches the enclave over a single mutually authenticated tunnel rather than a routed path.",
  "SC-8(1)":
    "Transmitted information is protected with FIPS-validated cryptography — openssl 3.0.7 in FIPS mode on the RHEL 9.4 hosts, Bouncy Castle FIPS 1.0.2.4 under OpenJDK 21.0.3 at keycloak-idp, and TLS 1.2 or better on the mission-api service; the edge-sw-a1 management plane still accepts telnet on the vty lines and is being migrated to SSHv2 under POA&M.",
  "SI-2":
    "Flaw remediation runs on a two-week cycle: the RHEL 9.4 hosts patch from the Red Hat satellite mirror, and mission-api:2.14.0 is rebuilt from its pinned ubuntu 22.04 base layer whenever a CVE is published against a component named in BOM-0001 — openssl 3.0.11 is the currently outstanding rebuild.",
  "SR-4":
    "Provenance is asserted for each delivered component by a supplier SBOM naming the producer and the SHA-256 of what was built; two Go libraries inside mission-api:2.14.0 — github.com/gorilla/mux v1.8.0 and github.com/lestrrat-go/jwx v2.0.19 — arrive with no supplier attestation and are carried as an open supply chain deficiency rather than accepted on trust.",
  "SR-11":
    "Component authenticity is verified at receipt: Dell PowerEdge chassis are checked against the packing list and the iDRAC9 BMC firmware signature, and IOS-XE 17.9.4a is verified against the Cisco-published SHA-256 before load; the Marvell 88E6390 switch ASIC in edge-sw-a1 carries no vendor attestation and is tracked as an unverified foreign-origin part.",
};

/** Reuse of the digital-thread SSP sentences already accepted in the repo. */
const threadStatementByControl = new Map<string, string>();
for (const evidence of threadEvidence) {
  for (const control of evidence.controls) {
    if (!threadStatementByControl.has(control))
      threadStatementByControl.set(control, evidence.statement);
  }
}

const cciById = new Map(ccis.map((c) => [c.id, c]));

/* ── Per-CCI trace (shared with the package readiness view) ──────────────── */

export type CciTrace = {
  result: "Met" | "Partially met" | "Not met" | "Not run";
  objectives: string[];
  openFindings: number;
  worstSeverity: string;
  gap: string | null;
};

/**
 * What the test objectives and the finding register say about one CCI. This is
 * the single derivation behind both the SCTM and the package traceability
 * table — `packages.ts` used to hold a second copy of it.
 */
export function traceCci(cciId: string): CciTrace {
  const objs = objectivesForCci(cciId);
  const open = findings.filter((f) => f.cci === cciId && isOpen(f));
  // Severity and "is a deficiency recorded?" answer to the deficiency set; the
  // open set answers "is anything still being worked?".
  const deficient = findings.filter((f) => f.cci === cciId && isDeficiency(f));
  const worst =
    deficient.find((f) => f.mitigatedSeverity === "CAT I")?.mitigatedSeverity ??
    deficient.find((f) => f.mitigatedSeverity === "CAT II")?.mitigatedSeverity ??
    deficient[0]?.mitigatedSeverity ??
    "—";

  let result: CciTrace["result"] = "Not run";
  if (objs.some((o) => o.result === "Not met")) result = "Not met";
  else if (objs.some((o) => o.result === "Partially met")) result = "Partially met";
  else if (objs.length > 0 && objs.every((o) => o.result === "Met")) result = "Met";
  else if (objs.some((o) => o.result === "Met")) result = "Partially met";

  let gap: string | null = null;
  if (objs.length === 0) gap = "No test objective names this CCI";
  else if (result === "Not run") gap = "Objective written but never executed";
  else if (open.length > 0 && result === "Met") gap = "Marked met while findings remain open";
  else if (result === "Not met" && deficient.length === 0)
    gap = "Failed objective with no finding recorded";

  return {
    result,
    objectives: objs.map((o) => o.id),
    openFindings: open.length,
    worstSeverity: worst,
    gap,
  };
}

/* ── Row generation ──────────────────────────────────────────────────────── */

/** The dataset's own "today". Never a clock — this value is rendered. */
const generatedOn = "Aug 30, 2026";

const severityRank: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

const statusToDetermination: Record<ControlStatus, Determination> = {
  Satisfied: "Satisfied",
  // A partial implementation is a deficiency, not an absence of assessment.
  Partial: "Other than satisfied",
  "Other than satisfied": "Other than satisfied",
  "Not assessed": "Not assessed",
};

const objectiveMethod: Record<TestObjective["method"], VerificationMethod> = {
  Automated: "Test",
  Penetration: "Test",
  Demonstration: "Demonstration",
  Examination: "Inspection",
  Interview: "Analysis",
};

type Requirement = {
  unit: RequirementUnit;
  id: string;
  statement: string;
  cci: Cci | null;
};

/** Leaves only: an objective with sub-items is a heading, not a testable item. */
function leafObjectives(list: NistObjective[]): NistObjective[] {
  const out: NistObjective[] = [];
  const walk = (objs: NistObjective[]) => {
    for (const o of objs) {
      if (o.items && o.items.length > 0) walk(o.items);
      else out.push(o);
    }
  };
  walk(list);
  return out;
}

/**
 * Narrow the 800-53A catalog to the SHAPE the matrix reads, and nothing more.
 *
 * The catalog file is 1.25 MB and is always dynamic-imported, so the index is
 * built by the caller that did the importing and handed here. Two call sites
 * need the identical shape — the SCTM route, which serialises it into the SSR
 * document, and `change-impact.ts`, whose impact analysis has to name real
 * `SctmRow.key` values — and a matrix built from a different shape produces
 * requirement identities that resolve against no rendered row. So the walk
 * lives here once: leaf assessment objectives as label and prose (an objective
 * with sub-items is a heading, not a testable item), and the published methods,
 * whose object lists are carried only for Test — the one `methodFor` inspects.
 */
export function buildControlTextIndex(
  controlText: Record<string, NistControlText>,
  controlIds?: readonly string[],
): ControlTextIndex {
  const out: ControlTextIndex = {};
  for (const id of controlIds ?? Object.keys(controlText)) {
    const full = controlText[id];
    if (!full) continue;
    out[id] = {
      statement: [],
      discussion: [],
      params: [],
      related: [],
      objectives: leafObjectives(full.objectives).map((o) => ({ label: o.label, prose: o.prose })),
      methods: full.methods.map((m) => ({
        method: m.method,
        objects: m.method === "Test" ? m.objects : [],
      })),
      references: [],
    };
  }
  return out;
}

function requirementsFor(row: ControlRow, text: ControlTextIndex | null): Requirement[] {
  const seen = new Set<string>();
  const out: Requirement[] = [];

  for (const cci of ccisByControl.get(row.id) ?? []) {
    if (seen.has(cci.id)) continue;
    seen.add(cci.id);
    out.push({ unit: "CCI", id: cci.id, statement: cci.definition, cci });
  }
  // The register names real DISA ids the loaded catalog slice does not carry.
  for (const f of row.findings) {
    if (seen.has(f.cci)) continue;
    seen.add(f.cci);
    const known = cciById.get(f.cci) ?? null;
    out.push({ unit: "CCI", id: f.cci, statement: known?.definition ?? "—", cci: known });
  }
  if (out.length > 0) return out;

  const published = text ? leafObjectives(text[row.id]?.objectives ?? []) : [];
  if (published.length > 0) {
    return published.map((o) => ({
      unit: "Objective" as const,
      id: o.label,
      statement: o.prose,
      cci: null,
    }));
  }

  return [{ unit: "Control", id: row.id, statement: row.fullTitle, cci: null }];
}

type Allocation = { nodes: string[]; basis: string; scope: AllocationScope };

function allocationRule(
  family: string,
  nodes: CompositionNode[],
  root: CompositionNode | null,
): Allocation {
  const rootLabel = root ? `${root.name} (${root.id})` : "the system root";
  const rootNodes = root ? [root.id] : [];
  const pick = (fn: (n: CompositionNode) => boolean) => nodes.filter(fn).map((n) => n.id);

  if (family === "PE" || family === "PS" || family === "MP") {
    return {
      nodes: rootNodes,
      scope: "system",
      basis: `Physical, personnel and media requirements are allocated to the system as a whole — ${rootLabel} — rather than to an individual part.`,
    };
  }
  if (family === "SR") {
    const picked = pick((n) => n.origin !== "Internal");
    return {
      nodes: picked.length > 0 ? picked : rootNodes,
      scope: picked.length > 0 ? "component" : "system",
      basis: `Supply chain requirements are allocated to every externally sourced item: ${picked.length} of ${nodes.length} components are not internally produced.`,
    };
  }
  if (family === "CM" || family === "SI") {
    const picked = pick((n) => n.digest !== undefined || n.version !== "—");
    return {
      nodes: picked.length > 0 ? picked : rootNodes,
      scope: picked.length > 0 ? "component" : "system",
      basis: `Configuration and integrity requirements are allocated to every versioned or digest-pinned item: ${picked.length} components carry a version or a measured digest.`,
    };
  }
  if (family === "IA" || family === "AC") {
    const picked = pick(
      (n) => n.kind === "Operating system" || n.kind === "Application" || n.kind === "Service",
    );
    return {
      nodes: picked.length > 0 ? picked : rootNodes,
      scope: picked.length > 0 ? "component" : "system",
      basis: `Identity and access requirements are allocated to the ${picked.length} operating system, application and service components that enforce them.`,
    };
  }
  if (family === "SC") {
    const picked = pick(
      (n) => n.kind === "Chassis" || n.kind === "Container image" || n.kind === "Service",
    );
    return {
      nodes: picked.length > 0 ? picked : rootNodes,
      scope: picked.length > 0 ? "component" : "system",
      basis: `Communications protection is allocated to the ${picked.length} chassis, container image and service components that terminate or forward traffic.`,
    };
  }
  if (family === "AU") {
    const picked = pick((n) => n.kind === "Operating system" || n.kind === "Application");
    return {
      nodes: picked.length > 0 ? picked : rootNodes,
      scope: picked.length > 0 ? "component" : "system",
      basis: `Audit requirements are allocated to the ${picked.length} operating system and application components that generate and retain records.`,
    };
  }
  return {
    nodes: rootNodes,
    scope: "system",
    basis: `No family-specific allocation rule applies to ${family}, so the requirement is allocated to ${rootLabel}.`,
  };
}

/** Worst finding in an ALREADY-FILTERED list — the caller chooses the predicate. */
function worstOf(list: Finding[]): Finding | null {
  let best: Finding | null = null;
  for (const f of list) {
    if (!best || severityRank[f.mitigatedSeverity] < severityRank[best.mitigatedSeverity]) best = f;
  }
  return best;
}

/**
 * Which 800-53A execution method wins when several objectives cover one CCI.
 * Ranked by rigour so the reported method is the strongest one actually
 * executed, rather than whichever objective happens to be first in the array.
 */
const objectiveRank: Record<TestObjective["method"], number> = {
  Automated: 0,
  Penetration: 0,
  Demonstration: 1,
  Examination: 2,
  Interview: 3,
};

/**
 * Families whose requirements are enforced by the system and can therefore be
 * exercised against it. Everything else — policy, personnel, planning,
 * acquisition, physical — is verified by examining records and interviewing the
 * people who hold them, whatever 800-53A's control-level Test flag says.
 */
const technicalFamilies = new Set(["AC", "AU", "CM", "IA", "SC", "SI", "MA"]);

/** A Test object naming a mechanism is evidence the control has testable behaviour. */
const mechanismObject = /mechanism|automated|scanning|configuration settings/i;

/**
 * Requirement prose addressed to people rather than to the system. Deliberately
 * narrow: it names the actors 800-53A interviews, not organizational nouns like
 * "configuration management", which describe an artifact to be examined.
 */
const personnelProse =
  /\b(personnel|individuals|employees|staff|officials|roles|responsibilities|training|screen(?:ed|ing)|agreements|awareness)\b/i;

/** Whether any CCI of this control carries a machine-checkable STIG rule. */
function controlHasStigRule(controlId: string): boolean {
  return (ccisByControl.get(controlId) ?? []).some((c) => (rulesByCci.get(c.id) ?? []).length > 0);
}

function publishedMethods(methods: NistMethod[]): string {
  const names = [...new Set(methods.map((m) => m.method))];
  if (names.length === 0) return "no";
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]!}`;
}

/**
 * SP 800-53A publishes methods at CONTROL level only — there is no per-objective
 * method to read — so a control-level Test flag cannot by itself justify Test on
 * every leaf objective the control decomposes to. Precedence therefore runs:
 * an executed test objective against the CCI, a machine-checkable STIG rule,
 * the CCI's own type, then a control-level default in which Test has to earn
 * itself (a mechanism-bearing Test object in a technical family, or a STIG rule)
 * and Examine — 800-53A's universal method — is the fallback.
 */
function methodFor(
  req: Requirement,
  controlId: string,
  family: string,
  text: ControlTextIndex | null,
): { method: VerificationMethod; basis: string } {
  if (req.unit === "CCI") {
    const covering = objectivesForCci(req.id);
    const chosen = [...covering].sort(
      (a, b) => objectiveRank[a.method] - objectiveRank[b.method],
    )[0];
    if (chosen) {
      const others = covering.filter((o) => o.id !== chosen.id);
      return {
        method: objectiveMethod[chosen.method],
        basis:
          `Test objective ${chosen.id} covers this CCI; its execution method is ${chosen.method}.` +
          (others.length > 0
            ? ` Also covered by ${others.map((o) => `${o.id} (${o.method})`).join(", ")}; the most rigorous method is reported.`
            : ""),
      };
    }
    const stigRules = rulesByCci.get(req.id) ?? [];
    const firstRule = stigRules[0];
    if (firstRule) {
      return {
        method: "Test",
        basis: `STIG rule ${firstRule.id} is machine-checkable against this CCI, so the requirement is verified by test.`,
      };
    }
    if (req.cci && (req.cci.type === "Policy" || req.cci.type === "Procedural")) {
      return {
        method: "Inspection",
        basis: `The CCI is addressed to the organization (${req.cci.type.toLowerCase()}), so it is verified by inspecting the artifact rather than the system.`,
      };
    }
  }

  const methods = text?.[controlId]?.methods ?? [];
  const published = publishedMethods(methods);
  const testMethod = methods.find((m) => m.method === "Test");
  const mechanism = testMethod?.objects.find((o) => mechanismObject.test(o));

  if (mechanism && technicalFamilies.has(family)) {
    return {
      method: "Test",
      basis: `SP 800-53A publishes ${published} methods for ${controlId}, and its Test method is scoped to ${mechanism.toLowerCase()}; ${family} requirements are enforced by the system, so this row is exercised against it.`,
    };
  }
  if (controlHasStigRule(controlId)) {
    return {
      method: "Test",
      basis: `A machine-checkable STIG rule is published against ${controlId}, so the requirement is verified by test even though no per-objective 800-53A method exists.`,
    };
  }
  if (
    req.unit !== "Control" &&
    methods.some((m) => m.method === "Interview") &&
    personnelProse.test(req.statement)
  ) {
    return {
      method: "Analysis",
      basis: `SP 800-53A publishes ${published} methods for ${controlId}; no per-objective method is published, and this requirement is addressed to personnel rather than to the system, so the determination rests on analysis of the interview record.`,
    };
  }
  if (methods.some((m) => m.method === "Examine")) {
    return {
      method: "Inspection",
      basis: `SP 800-53A publishes ${published} methods for ${controlId}; no per-objective method is published, so this row takes the control-level default for a ${family} requirement — examination of the artifact.`,
    };
  }
  return {
    method: "Inspection",
    basis:
      "No published procedure or machine-checkable rule reaches this requirement; it is verified by inspection.",
  };
}

/* ── Origination and currency ────────────────────────────────────────────── */

/**
 * The resolution's eMASS designation projected onto 800-53's origination
 * vocabulary. One-to-one, so the matrix and the inheritance view can never
 * disagree about whether a control is common.
 */
const originationForDesignation: Record<ResolvedInheritance["designation"], ControlOrigination> = {
  Common: "Common",
  Hybrid: "Hybrid",
  "System-Specific": "System specific",
};

type Currency = { currency: RowCurrency; currencyReason: string };

/**
 * The currency overlay for one control's rows: what the change log says about
 * the components the requirement is allocated to, plus what the inheritance
 * resolution says about the reference it is inherited through.
 *
 * `rowCurrency` never builds a matrix — it reads the composition graph and the
 * change log — so calling it per control from inside `buildSctm` is safe even
 * though `change-impact.ts` builds the matrix to compute its own impact view.
 */
function currencyFor(
  programId: string,
  controlId: string,
  responsibleNodes: string[],
  systemAllocatedNodes: string[],
  assessed: string,
  edge: ResolvedInheritance | null,
  inheritanceSuspect: boolean,
): Currency {
  const hit = rowCurrency(programId, {
    control: controlId,
    responsibleNodes,
    // Which of those nodes carry the requirement only because the whole system
    // does, and when the determination was taken. Both are the row's own
    // identity, which is why they are passed rather than looked up: the overlay
    // never builds a matrix.
    systemNodes: systemAllocatedNodes,
    assessed,
    provider: edge?.component.id ?? null,
  });

  let currency: RowCurrency = hit?.state ?? "Current";
  const reasons: string[] = [];
  if (hit) reasons.push(hit.reason);
  if (inheritanceSuspect && edge) {
    if (currency === "Current") currency = "Suspect";
    // When a change already explains the row, the inheritance clause is a
    // pointer, not a second essay — the full prose is on `inheritanceReason`,
    // and a provider-assessment change usually IS the drift, so spelling both
    // out in full says the same thing twice.
    reasons.push(
      hit
        ? `The inherited reference to ${edge.component.name} also reads ${edge.state}.`
        : `The inherited reference to ${edge.component.name} reads ${edge.state}. ${edge.stateReason}`,
    );
  }
  return { currency, currencyReason: reasons.length > 0 ? reasons.join(" ") : "—" };
}

export function buildSctm(
  programId: string,
  rows: ControlRow[],
  text: ControlTextIndex | null,
): Sctm {
  const inheritance = resolveInheritance(programId);
  const graphNodes = nodesForProgram(programId);
  const root = graphNodes.find((n) => n.parent === null) ?? null;
  const allocationByFamily = new Map<string, Allocation>();

  const out: SctmRow[] = [];

  for (const row of rows) {
    const requirements = requirementsFor(row, text);
    // The resolution is authoritative for everything on the inheritance side.
    // It has already run the CCP precedence ladder, evaluated the offer against
    // this system's real inventory and split the responsibility, so nothing
    // here re-reads `ProvidedControl.model` and nothing falls back to
    // `row.implementation` when a resolved edge exists.
    const edge = inheritance.get(row.id) ?? null;
    const origination: ControlOrigination = edge
      ? originationForDesignation[edge.designation]
      : row.implementation === "Inherited"
        ? "Common"
        : row.implementation === "Hybrid"
          ? "Hybrid"
          : "System specific";
    // A Customer-configured offer is the consumer's to implement and evidence,
    // so the responsible party is the program's own family owner even though a
    // provider is named on the row.
    const responsibleParty =
      edge && (edge.share === "Provider" || edge.share === "Shared")
        ? edge.component.provider
        : row.owner;
    const consumerResponsibility = edge
      ? edge.consumerObligation
      : origination === "Hybrid"
        ? "The program implements the system-specific portion; no provider evidence is on file for the common portion."
        : "—";

    // Gated on the resolved STATE, not on origination: a Customer-configured
    // control is reported System specific but still carries the provider's
    // failure signal, and a failure is a deficiency the consumer owns too.
    const providerFailing = edge?.state === "Provider failed";
    // Every other non-Current state — never accepted, version drift, stale
    // evidence, a withdrawn offer — leaves the determination exactly where it
    // is and raises the row's currency instead. The inherited implementation
    // may well still hold; what is no longer certain is that the assessment on
    // file describes it.
    const inheritanceSuspect = edge !== null && !providerFailing && edge.state !== "Current";

    const allocation =
      allocationByFamily.get(row.family) ??
      (() => {
        const computed = allocationRule(row.family, graphNodes, root);
        allocationByFamily.set(row.family, computed);
        return computed;
      })();

    const findingNodes = [
      ...new Set(
        row.findings
          .map((f) => f.node ?? nodeForAsset(f.asset)?.id ?? null)
          .filter((id): id is string => id !== null),
      ),
    ];
    const responsibleNodes = [...new Set([...allocation.nodes, ...findingNodes])].sort();
    // A node the control's own findings name is implicated by name, not by the
    // boundary, so it never enters the whole-system set even when the
    // allocation rule also reached it.
    const systemAllocatedNodes =
      allocation.scope === "system"
        ? allocation.nodes.filter((id) => !findingNodes.includes(id))
        : [];
    const allocationBasis =
      responsibleNodes.length === 0
        ? "No composition node is recorded for this program, so the requirement is not allocated to a component."
        : findingNodes.length > 0
          ? `${allocation.basis} The control's findings name ${findingNodes.length} component${
              findingNodes.length > 1 ? "s" : ""
            } directly, ${findingNodes.length > 1 ? "which are" : "which is"} included.`
          : allocation.basis;

    // One call per control, not per requirement: currency is a property of the
    // control's allocation and its provider, and every requirement the control
    // decomposes to shares both.
    const { currency, currencyReason } = currencyFor(
      programId,
      row.id,
      responsibleNodes,
      systemAllocatedNodes,
      row.assessed,
      edge,
      inheritanceSuspect,
    );

    const assertion = assertions[row.id] ?? threadStatementByControl.get(row.id) ?? "—";

    for (const req of requirements) {
      const reqFindings =
        req.unit === "CCI" ? row.findings.filter((f) => f.cci === req.id) : row.findings;
      // `openList` is operational — what is still being worked. `deficient` is
      // the assessment set: a risk-accepted residual is no longer open, but it is
      // still a recorded deficiency and 800-53A knows no third determination.
      const openList = reqFindings.filter(isOpen);
      const deficient = reqFindings.filter(isDeficiency);
      const worst = worstOf(deficient);

      const covering = req.unit === "CCI" ? objectivesForCci(req.id) : [];
      const evidence = new Set<string>();
      for (const f of reqFindings) {
        evidence.add(f.sourceArtifact);
        for (const e of f.assessment.evidence) evidence.add(e);
      }
      for (const o of covering) if (o.evidence) evidence.add(o.evidence);
      // A withdrawn offer carries no evidence label; "—" is not an artifact id.
      if (edge && edge.provided.evidence !== "—") {
        evidence.add(edge.provided.evidence);
      }

      let determination = statusToDetermination[row.status];
      let determinationNote: string;
      if (worst) {
        determinationNote = worst.assessment.determination;
      } else if (providerFailing && edge) {
        determinationNote = edge.stateReason;
      } else if (row.status === "Partial") {
        determinationNote =
          "Implementation is partial: the capability is in place but does not yet meet the full requirement, so the row is reported other than satisfied rather than left unassessed.";
      } else if (row.status === "Satisfied") {
        determinationNote = `Assessed satisfied on ${row.assessed}; no open finding is recorded against this requirement.`;
      } else if (row.status === "Not assessed") {
        determinationNote = "No assessment has been executed against this requirement.";
      } else {
        determinationNote =
          row.nextAction === "—"
            ? `${row.id} is assessed other than satisfied; no remediation action is recorded yet.`
            : `${row.id} is assessed other than satisfied. Next action: ${row.nextAction}.`;
      }

      if (providerFailing && determination !== "Other than satisfied") {
        determination = "Other than satisfied";
        if (edge && !worst) {
          determinationNote = edge.stateReason;
        }
      }
      // Guarded on "Satisfied" so a row already Not assessed or Not applicable is
      // never silently re-determined by the presence of a deficiency.
      if (determination === "Satisfied" && deficient.length > 0) {
        const registerEntries = deficient
          .map((f) => f.risk ?? f.poam)
          .filter((id): id is string => !!id);
        determination = "Other than satisfied";
        determinationNote =
          `${deficient.map((f) => f.id).join(", ")} records an unremediated deficiency against this requirement. ` +
          `The residual is accepted in the register (${registerEntries.length > 0 ? [...new Set(registerEntries)].join(", ") : "no register entry"}); ` +
          `an acceptance decision does not change the assessor's determination.`;
      }
      if (req.cci?.compliance === "Not applicable") {
        determination = "Not applicable";
        determinationNote = `${req.id} is recorded as not applicable to this system, so no determination is owed against it.`;
      }

      const { method, basis } = methodFor(req, row.id, row.family, text);
      const evidenceList = [...evidence];

      let gap: string | null = null;
      if (evidenceList.length === 0 && determination === "Satisfied") {
        gap = "Satisfied with no evidence recorded";
      } else if (determination === "Satisfied" && deficient.length > 0) {
        gap = "Marked satisfied while a deficiency remains";
      } else if (req.unit === "Control") {
        gap = "No CCI or 800-53A objective published for this control";
      } else if (assertion === "—") {
        gap = "No implementation statement authored";
      } else if (responsibleNodes.length === 0) {
        gap = "Not allocated to a component";
      }

      // ── Currency overlay ────────────────────────────────────────────────
      // Applied last, and deliberately narrow. An invalidation retracts a
      // POSITIVE claim: the assessor said Satisfied against a configuration
      // that is no longer in force, so the claim stops counting and the old
      // value is kept beside it. It does NOT retract a deficiency — a firmware
      // bump neither closes a finding nor excuses a POA&M, and re-scoring an
      // "Other than satisfied" row as "Not assessed" would sever exactly the
      // obligation this file exists to preserve. "Not applicable" is a scoping
      // decision rather than an assessment result, so it is untouched too.
      let priorDetermination: Determination | null = null;
      if (currency === "Invalidated") {
        if (determination === "Satisfied") {
          priorDetermination = determination;
          determination = "Not assessed";
          determinationNote =
            `The determination on file is invalidated. ${currencyReason} ` +
            `${priorDetermination} as of ${row.assessed} is retained for the audit trail; ` +
            `it does not count toward coverage until the requirement is re-verified against the build in force.`;
        } else if (determination === "Other than satisfied") {
          determinationNote =
            `${determinationNote} ${currencyReason} ` +
            `The deficiency determination stands: a configuration change neither closes the finding nor discharges the POA&M obligation, ` +
            `so this row is re-tested, not re-scored.`;
        } else {
          determinationNote = `${determinationNote} ${currencyReason}`;
        }
      } else if (currency === "Suspect") {
        determinationNote = `${determinationNote} ${currencyReason}`;
      }

      out.push({
        key: `${row.id}|${req.unit}|${req.id}`,
        control: row.id,
        controlTitle: row.fullTitle,
        family: row.family,
        familyName: row.familyName,
        unit: req.unit,
        requirement: req.id,
        statement: req.statement,
        assertion,
        origination,
        responsibleParty,
        consumerResponsibility,
        responsibleNodes,
        allocationBasis,
        allocationScope: allocation.scope,
        systemAllocatedNodes,
        method,
        methodBasis: basis,
        evidence: evidenceList,
        determination,
        determinationNote,
        priorDetermination,
        currency,
        currencyReason,
        inheritanceState: edge?.state ?? null,
        inheritanceReason: edge?.stateReason ?? "—",
        assessed: row.assessed,
        findings: reqFindings.map((f) => f.id),
        openFindings: openList.length,
        worstSeverity: worst?.mitigatedSeverity ?? "—",
        gap,
      });
    }
  }

  // Counted AFTER the currency overlay, so `satisfied` is what the program can
  // actually claim today rather than what it claimed before the build moved.
  const counts = {
    total: out.length,
    satisfied: out.filter((r) => r.determination === "Satisfied").length,
    other: out.filter((r) => r.determination === "Other than satisfied").length,
    notAssessed: out.filter((r) => r.determination === "Not assessed").length,
    notApplicable: out.filter((r) => r.determination === "Not applicable").length,
    invalidated: out.filter((r) => r.currency === "Invalidated").length,
    suspect: out.filter((r) => r.currency === "Suspect").length,
  };

  const methodOrder: VerificationMethod[] = ["Test", "Demonstration", "Analysis", "Inspection"];
  const originationOrder: ControlOrigination[] = ["System specific", "Common", "Hybrid"];

  const complete = out.filter((r) => r.determination !== "Not assessed" && r.gap === null).length;

  return {
    program: programId,
    rows: out,
    generated: generatedOn,
    counts,
    byMethod: methodOrder.map((method) => ({
      method,
      count: out.filter((r) => r.method === method).length,
    })),
    byOrigination: originationOrder.map((origination) => ({
      origination,
      count: out.filter((r) => r.origination === origination).length,
    })),
    gaps: out.filter((r) => r.gap !== null).length,
    unevidenced: out.filter((r) => r.evidence.length === 0).length,
    coverage: out.length === 0 ? 0 : Math.round((complete / out.length) * 100),
  };
}

/* ── Export ──────────────────────────────────────────────────────────────── */

const csvHeader = [
  "Control",
  "Control title",
  "Family",
  "Family name",
  "Requirement unit",
  "Requirement",
  "Requirement statement",
  "Implementation statement",
  "Origination",
  "Responsible party",
  "Consumer responsibility",
  "Responsible components",
  "Allocation basis",
  "Verification method",
  "Method basis",
  "Evidence",
  "Determination",
  "Determination note",
  "Prior determination",
  "Currency",
  "Currency reason",
  "Inheritance state",
  "Inheritance reason",
  "Assessed",
  "Findings",
  "Open findings",
  "Worst severity",
  "Gap",
];

/** RFC 4180: double every quote, and wrap anything that could break a parser. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function sctmCsv(sctm: Sctm): string {
  const lines = [csvHeader.map(csvField).join(",")];
  for (const r of sctm.rows) {
    lines.push(
      [
        r.control,
        r.controlTitle,
        r.family,
        r.familyName,
        r.unit,
        r.requirement,
        r.statement,
        r.assertion,
        r.origination,
        r.responsibleParty,
        r.consumerResponsibility,
        r.responsibleNodes.join("; "),
        r.allocationBasis,
        r.method,
        r.methodBasis,
        r.evidence.join("; "),
        r.determination,
        r.determinationNote,
        r.priorDetermination ?? "—",
        r.currency,
        r.currencyReason,
        r.inheritanceState ?? "—",
        r.inheritanceReason,
        r.assessed,
        r.findings.join("; "),
        String(r.openFindings),
        r.worstSeverity,
        r.gap ?? "—",
      ]
        .map(csvField)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

/**
 * The live matrix. It is a composition of two stores — the control matrix and
 * the composition graph — and the result is memoized so the returned object is
 * reference-stable across renders. An unstable snapshot here would loop React.
 */
export function useSctm(programId: string, text: ControlTextIndex | null): Sctm {
  const rows = useControlMatrix(programId);
  const version = useSyncExternalStore(subscribeGraph, graphVersion, graphVersion);
  return useMemo(
    // `version` moves whenever a node is re-classified, which changes control
    // allocation; it belongs in the key even though buildSctm reads the graph
    // itself rather than taking the number.
    () => buildSctm(programId, rows, text),
    [programId, rows, text, version],
  );
}
