/**
 * Chunk 12 of the CCI spine — inheritance and shared-responsibility resolution.
 *
 * A reusable component (`CMP-`) *offers* controls. A program *accepts* them. Those
 * are two different facts and the product used to record only the first: the old
 * `inheritanceForProgram` walked `systemComponents` in array order and let the
 * first writer win, so which provider a control came from was an accident of seed
 * ordering, the consumer's own obligation on a Shared control vanished, and an
 * offer applied to a consumer whether or not the consumer owned anything it could
 * apply to.
 *
 * This module resolves the offer against the consumer in five observable stages:
 * candidates → applicability → precedence → responsibility split → state. Every
 * stage records its reasoning in prose, because an AO reviewing an inherited
 * control asks two questions the matrix has to answer: *why this provider* and
 * *what do I still owe*.
 *
 * Invariants held here:
 *  - **A deficiency never becomes "Not assessed".** A failing common control
 *    provider resolves to `"Provider failed"`, which downstream maps to
 *    "Other than satisfied" on the consumer's SCTM row. Laundering it into
 *    "Not assessed" would sever the POA&M obligation, and that is the one thing
 *    an inheritance model must not do.
 *  - **Losers are never discarded.** A candidate that loses the CCP tier ladder
 *    becomes an `InheritanceConflict` on the winner, not a dropped row.
 *  - **Applicability is evaluated against real inventory** — the program's
 *    composition nodes and its assets — never against a hand-set flag. An offer
 *    that reaches nothing the consumer owns is `"Not applicable"` and leaves the
 *    matrix through `offeredNotApplicable`, not through silence.
 *  - **An absent inventory is unknown, not disqualifying.** A constraint can only
 *    be missed by a consumer that has something to compare against. A program
 *    with no composition delivered and no assets registered has not demonstrated
 *    that it carries nothing — it has demonstrated nothing at all, and deriving
 *    an AO-approved "Not applicable" tailoring decision from that silence would
 *    discharge controls the program formally accepted and signed for. Such an
 *    offer stays applicable, is flagged `applicabilityEvaluable: false`, and is
 *    carried on the accepted reference until an inventory delivery can confirm
 *    or exclude it. A demonstrated miss on any dimension still wins outright.
 *  - **Inheritance is a versioned reference, not a snapshot.** What the consumer
 *    accepted is pinned; when the provider moves past it the reference reads
 *    `"Version drift"` until someone re-accepts.
 *
 * Layering: `reusable-components.ts` is the layer below. It owns the offers, the
 * types they are authored in (`ApplicabilityRule`, `ProvidedControl`) and the
 * staleness threshold; this module owns every decision taken over them, including
 * the `inheritanceForProgram` projection its call sites read. The dependency runs
 * one way only — logic reads data, never the reverse.
 */

import type { Tone } from "@/ds/primitives";
import { graphVersion, nodesForProgram } from "@/lib/composition";
import { assets, findings, isDeficiency, isOpen } from "@/lib/findings";
import { programs, type Program } from "@/lib/grc-data";
import { parseGateDate } from "@/lib/program-stage";
import {
  staleThresholdDays,
  systemComponents,
  type ApplicabilityRule,
  type Consumer,
  type ProvidedControl,
  type SystemComponent,
} from "@/lib/reusable-components";

/** eMASS "Common control provider" — also the precedence ladder, highest last. */
export const ccpTiers = ["DoD", "Component", "Enclave", "System"] as const;
export type CcpTier = (typeof ccpTiers)[number];

export type SecurityControlDesignation = "Common" | "Hybrid" | "System-Specific";
export type ResponsibilityShare = "Provider" | "Consumer" | "Shared";

export type InheritanceState =
  "Current" | "Provider failed" | "Version drift" | "Evidence stale" | "Not applicable" | "Revoked";

/** eMASS implementation status carried on the consumer's row for an inherited control. */
export type EmassStatus =
  "Planned" | "Implemented" | "Inherited" | "Manually Inherited" | "Not Applicable";

/**
 * Authored with the offers it scopes, in `@/lib/reusable-components`, and
 * re-exported here because every reader of the rule reads it through the
 * resolution that evaluates it.
 */
export type { ApplicabilityRule };

/** The unconstrained rule — an offer that reaches every consuming system. */
export const anyConsumer: ApplicabilityRule = {
  nodeKinds: [],
  environments: [],
  zones: [],
  impact: [],
  programs: [],
};

/** What the consumer program has accepted, and when. The versioned reference. */
export type AcceptedInheritance = {
  program: string; // PRG-
  component: string; // CMP-
  control: string; // natural key
  acceptedVersion: string; // the provider's `version` at acceptance
  acceptedAssessmentVersion: string; // the provider's `assessmentVersion` at acceptance
  acceptedOn: string; // "MMM DD, YYYY"
  acceptedBy: string;
  note: string;
};

export type InheritanceConflict = {
  component: string;
  tier: CcpTier;
  model: string;
  reason: string;
};

export type ResolvedInheritance = {
  control: string; // natural key — the CONTROL ID, not the ProvidedControl
  component: SystemComponent;
  provided: ProvidedControl;
  tier: CcpTier;
  designation: SecurityControlDesignation;
  share: ResponsibilityShare;
  /** eMASS implementation status for this row. */
  emassStatus: EmassStatus;
  /** What the consuming program still owes. "—" for a fully inherited control. */
  consumerObligation: string;
  applicable: boolean;
  /**
   * False when the offer carries an inventory constraint the consumer has no
   * inventory to test against. The row is still applicable — it is carried on
   * the accepted reference — but it was not confirmed against anything, and an
   * AO must be able to tell that apart from a constraint that was checked and
   * passed.
   */
  applicabilityEvaluable: boolean;
  applicabilityReason: string;
  accepted: AcceptedInheritance | null;
  state: InheritanceState;
  stateReason: string;
  /** Candidates that lost precedence, with why. Answers "why this provider". */
  conflicts: InheritanceConflict[];
  evidenceAgeDays: number;
  stale: boolean;
};

/**
 * An offer a program accepted that the provider has since stopped publishing.
 *
 * This is the only inheritance fact that cannot be derived from the current
 * `systemComponents` catalogue: once the provider drops the control, nothing in
 * the offer table remembers it was ever inherited. Without this record the row
 * would simply vanish from the consumer's matrix — the consumer would appear to
 * owe nothing on a control nobody implements. Recording it keeps the obligation
 * visible and re-designates it System-Specific, which is what actually happened.
 */
export type WithdrawnOffer = {
  program: string; // PRG-
  component: string; // CMP-
  control: string; // natural key
  title: string;
  family: string;
  acceptedVersion: string;
  acceptedAssessmentVersion: string;
  acceptedOn: string; // "MMM DD, YYYY"
  acceptedBy: string;
  withdrawn: string; // "MMM DD, YYYY"
  /** Why the provider stopped offering it. */
  reason: string;
  /** What the consumer now owes in its place. */
  consumerObligation: string;
};

export const withdrawnOffers: WithdrawnOffer[] = [
  {
    program: "PRG-1013",
    component: "CMP-008",
    control: "PS-1",
    title: "Policy and procedures",
    family: "PS",
    acceptedVersion: "2025.2",
    acceptedAssessmentVersion: "AR-2025.2",
    acceptedOn: "Mar 09, 2025",
    acceptedBy: "Dana Whitlock",
    withdrawn: "Jan 12, 2026",
    reason:
      "The 2026.1 consolidation moved personnel security policy out of the enterprise set and back to each system owner, so CMP-008 no longer publishes PS-1 to its consumers.",
    consumerObligation:
      "Author, approve and publish a system-specific personnel security policy and procedure for idp-core, then re-baseline PS-1 as System-Specific.",
  },
];

export const inheritanceStateTone: Record<InheritanceState, Tone> = {
  Current: "success",
  "Provider failed": "danger",
  "Version drift": "warning",
  "Evidence stale": "warning",
  "Not applicable": "neutral",
  Revoked: "danger",
};

/**
 * Designation and responsibility are *properties*, not statuses — a Hybrid
 * control is not worse than a Common one — so both render as neutral chips.
 */
export const designationTone: Record<SecurityControlDesignation, Tone> = {
  Common: "neutral",
  Hybrid: "neutral",
  "System-Specific": "neutral",
};

export const shareTone: Record<ResponsibilityShare, Tone> = {
  Provider: "neutral",
  Consumer: "neutral",
  Shared: "neutral",
};

/**
 * Stage 3's ladder. The nearest provider wins, because that is who the AO holds
 * accountable: an enclave platform is closer to the system than an enterprise
 * policy set, and a service the system actually calls is closer still.
 */
export function ccpTierFor(component: SystemComponent): CcpTier {
  switch (component.type) {
    case "Service":
      return "System";
    case "Platform":
      return "Enclave";
    case "Facility":
      return "Enclave";
    case "Policy":
      return "Component";
    default:
      return "Component";
  }
}

function tierRank(tier: CcpTier): number {
  return ccpTiers.indexOf(tier);
}

function listOf(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "—";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function listOr(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "—";
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}

function joinClauses(values: string[]): string {
  return listOf(values);
}

type Inventory = {
  program: Program | null;
  name: string;
  kinds: Set<string>;
  zones: Set<string>;
  environments: Set<string>;
  impact: string;
  nodeCount: number;
};

function inventoryOf(programId: string): Inventory {
  const program = programs.find((p) => p.id === programId) ?? null;
  const nodes = nodesForProgram(programId);
  const kinds = new Set<string>();
  const zones = new Set<string>();
  for (const node of nodes) {
    kinds.add(node.kind);
    zones.add(node.zone);
  }
  const environments = new Set<string>();
  for (const asset of assets) {
    if (asset.program === programId) environments.add(asset.environment);
  }
  return {
    program,
    name: program?.name ?? programId,
    kinds,
    zones,
    environments,
    impact: program?.impact ?? "—",
    nodeCount: nodes.length,
  };
}

function setList(values: Set<string>): string {
  return values.size > 0 ? [...values].sort().join(", ") : "nothing yet inventoried";
}

/**
 * Stage 2. Every constraint is a set intersection against what the consumer
 * actually owns; an empty array is no constraint at all.
 *
 * Each inventory-derived dimension resolves to one of three things, not two:
 * a demonstrated **miss** (the consumer has an inventory and the offer is not in
 * it), a **pass**, or an **unevaluable** constraint (the consumer has delivered
 * no inventory of that kind at all, so there is nothing to intersect). Only the
 * first is grounds for "Not applicable". Collapsing the third into the first is
 * how an undelivered CycloneDX manifest ends up revoking a signed acceptance.
 *
 * `programs` is always evaluable — the allow-list is compared against the
 * program id itself, which is never absent.
 */
function evaluateApplicability(
  component: SystemComponent,
  provided: ProvidedControl,
  inv: Inventory,
  programId: string,
): { applicable: boolean; evaluable: boolean; reason: string } {
  const rule = provided.applicability;
  const scopes: string[] = [];
  const misses: string[] = [];
  const unevaluable: string[] = [];

  if (rule.programs.length > 0) {
    scopes.push(`the named programs ${listOf(rule.programs)}`);
    if (!rule.programs.includes(programId)) misses.push("is not on that allow-list");
  }
  if (rule.nodeKinds.length > 0) {
    scopes.push(`systems carrying ${listOf(rule.nodeKinds)} components`);
    if (inv.nodeCount === 0) {
      unevaluable.push(
        "has no composition declared, so the component constraint could not be checked",
      );
    } else if (!rule.nodeKinds.some((k) => inv.kinds.has(k))) {
      misses.push(
        `carries no ${listOr(rule.nodeKinds)} component in its composition (${inv.nodeCount} nodes inventoried)`,
      );
    }
  }
  if (rule.environments.length > 0) {
    scopes.push(`${listOf(rule.environments)} inventory`);
    if (inv.environments.size === 0) {
      unevaluable.push(
        "has no asset inventory recorded, so the environment constraint could not be checked",
      );
    } else if (!rule.environments.some((e) => inv.environments.has(e))) {
      misses.push(
        `has no ${listOr(rule.environments)} asset (its inventory is ${setList(inv.environments)})`,
      );
    }
  }
  if (rule.zones.length > 0) {
    scopes.push(`the ${listOf(rule.zones)} trust zone${rule.zones.length > 1 ? "s" : ""}`);
    if (inv.nodeCount === 0) {
      unevaluable.push(
        "has no composition declared, so the trust-zone constraint could not be checked",
      );
    } else if (!rule.zones.some((z) => inv.zones.has(z))) {
      misses.push(
        `has no node in the ${listOr(rule.zones)} trust zone${rule.zones.length > 1 ? "s" : ""} (its zones are ${setList(inv.zones)})`,
      );
    }
  }
  if (rule.impact.length > 0) {
    scopes.push(`${listOf(rule.impact)} impact systems`);
    if (inv.impact === "—") {
      unevaluable.push(
        "has no FIPS-199 categorization recorded, so the impact constraint could not be checked",
      );
    } else if (!rule.impact.includes(inv.impact)) {
      misses.push(`is categorized ${inv.impact}`);
    }
  }

  if (scopes.length === 0) {
    return {
      applicable: true,
      evaluable: true,
      reason: `${component.name} scopes ${provided.id} to every consuming system; no inventory constraint applies.`,
    };
  }
  // A demonstrated miss is authoritative over an unevaluable dimension: the
  // consumer proved the offer does not reach it on at least one axis.
  if (misses.length > 0) {
    return {
      applicable: false,
      evaluable: true,
      reason: `${component.name} scopes ${provided.id} to ${joinClauses(scopes)}; ${inv.name} ${joinClauses(misses)}.`,
    };
  }
  if (unevaluable.length > 0) {
    return {
      applicable: true,
      evaluable: false,
      reason: `${component.name} scopes ${provided.id} to ${joinClauses(scopes)}; ${inv.name} ${joinClauses([...new Set(unevaluable)])} — the offer is carried on the accepted reference until an inventory delivery can confirm or exclude it.`,
    };
  }
  return {
    applicable: true,
    evaluable: true,
    reason: `${component.name} scopes ${provided.id} to ${joinClauses(scopes)}; ${inv.name} meets every constraint on the offer.`,
  };
}

/**
 * The consumer's own row, read from the consumer's own register rather than from
 * the provider — a Customer-configured offer is a knob, not an implementation,
 * so the provider's "Satisfied" says nothing about whether the consumer turned it.
 */
function consumerEmassStatus(programId: string, controlId: string): EmassStatus {
  const owned = new Set(assets.filter((a) => a.program === programId).map((a) => a.id));
  if (owned.size === 0) return "Planned";
  const openDeficiency = findings.some(
    (f) => owned.has(f.asset) && f.control === controlId && isOpen(f) && isDeficiency(f),
  );
  return openDeficiency ? "Planned" : "Implemented";
}

type Split = {
  designation: SecurityControlDesignation;
  share: ResponsibilityShare;
  emassStatus: EmassStatus;
  consumerObligation: string;
};

/** Stage 4. Derived from `ProvidedControl.model` — never authored twice. */
function responsibilitySplit(
  provided: ProvidedControl,
  programId: string,
  applicable: boolean,
): Split {
  const split: Split = ((): Split => {
    switch (provided.model) {
      case "Inherited":
        return {
          designation: "Common",
          share: "Provider",
          emassStatus: "Inherited",
          consumerObligation: "—",
        };
      case "Shared":
        return {
          designation: "Hybrid",
          share: "Shared",
          emassStatus: "Manually Inherited",
          consumerObligation: provided.consumerObligation,
        };
      case "Customer configured":
        return {
          designation: "System-Specific",
          share: "Consumer",
          emassStatus: consumerEmassStatus(programId, provided.id),
          consumerObligation: provided.consumerObligation,
        };
      default:
        return {
          designation: "System-Specific",
          share: "Consumer",
          emassStatus: "Planned",
          consumerObligation: provided.consumerObligation,
        };
    }
  })();
  if (!applicable) return { ...split, emassStatus: "Not Applicable" };
  return split;
}

function acceptedFrom(
  component: SystemComponent,
  consumer: Consumer,
  controlId: string,
): AcceptedInheritance | null {
  if (consumer.acceptedOn === "—" || consumer.acceptedVersion === "") return null;
  return {
    program: consumer.programId,
    component: component.id,
    control: controlId,
    acceptedVersion: consumer.acceptedVersion,
    acceptedAssessmentVersion: consumer.acceptedAssessmentVersion,
    acceptedOn: consumer.acceptedOn,
    acceptedBy: consumer.acceptedBy,
    note: `${consumer.programName} accepted ${controlId} from ${component.name} at ${consumer.acceptedVersion} / ${consumer.acceptedAssessmentVersion} on ${consumer.acceptedOn}, signed by ${consumer.acceptedBy}. Last synchronized ${consumer.lastSync}.`,
  };
}

/** Stage 5. First match wins; the order is the doctrine. */
function stateOf(
  component: SystemComponent,
  provided: ProvidedControl,
  applicable: boolean,
  applicabilityReason: string,
  accepted: AcceptedInheritance | null,
  withdrawn: WithdrawnOffer | null,
): { state: InheritanceState; stateReason: string } {
  if (!applicable) return { state: "Not applicable", stateReason: applicabilityReason };
  if (withdrawn) {
    return {
      state: "Revoked",
      stateReason: `${component.name} withdrew ${provided.id} on ${withdrawn.withdrawn} after it was accepted at ${withdrawn.acceptedVersion}. ${withdrawn.reason} The obligation did not go away with the offer — it reverts to this system.`,
    };
  }
  if (provided.status === "Other than satisfied") {
    return {
      state: "Provider failed",
      stateReason: `${component.name} reports ${provided.id} as Other than satisfied on its own assessment (${provided.evidence}, ${provided.evidenceAge} days old). The deficiency propagates to this system as Other than satisfied and stays a POA&M obligation here; it is not re-scored as Not assessed.`,
    };
  }
  if (!accepted) {
    return {
      state: "Version drift",
      stateReason: `Never accepted — ${component.name} ${component.version} offers ${provided.id}, but this system has no recorded acceptance, so nothing pins which version of the offer was inherited.`,
    };
  }
  if (accepted.acceptedVersion !== component.version) {
    return {
      state: "Version drift",
      stateReason: `Accepted at ${component.name} ${accepted.acceptedVersion} on ${accepted.acceptedOn}; the provider now ships ${component.version}. The inherited implementation has moved since it was assessed and the acceptance has not been re-signed.`,
    };
  }
  if (accepted.acceptedAssessmentVersion !== provided.assessmentVersion) {
    return {
      state: "Version drift",
      stateReason: `Accepted against assessment ${accepted.acceptedAssessmentVersion}; ${component.name} now evidences ${provided.id} under ${provided.assessmentVersion} (assessed ${provided.assessedOn}). The evidence behind the inheritance is not the evidence that was accepted.`,
    };
  }
  if (provided.evidenceAge > staleThresholdDays) {
    return {
      state: "Evidence stale",
      stateReason: `${provided.evidence} is ${provided.evidenceAge} days old against a ${staleThresholdDays}-day threshold. The offer is current and accepted; the evidence behind it is not fresh enough to ship in a package.`,
    };
  }
  return {
    state: "Current",
    stateReason: `Accepted at ${component.version} / ${provided.assessmentVersion} on ${accepted.acceptedOn}; the provider has not moved since and ${provided.evidence} is ${provided.evidenceAge} days old.`,
  };
}

function makeCandidate(
  component: SystemComponent,
  consumer: Consumer,
  provided: ProvidedControl,
  inv: Inventory,
  programId: string,
  withdrawn: WithdrawnOffer | null,
): ResolvedInheritance {
  const { applicable, evaluable, reason } = evaluateApplicability(
    component,
    provided,
    inv,
    programId,
  );
  const accepted = withdrawn
    ? {
        program: withdrawn.program,
        component: withdrawn.component,
        control: withdrawn.control,
        acceptedVersion: withdrawn.acceptedVersion,
        acceptedAssessmentVersion: withdrawn.acceptedAssessmentVersion,
        acceptedOn: withdrawn.acceptedOn,
        acceptedBy: withdrawn.acceptedBy,
        note: `${consumer.programName} accepted ${withdrawn.control} from ${component.name} at ${withdrawn.acceptedVersion} on ${withdrawn.acceptedOn}; the offer was withdrawn ${withdrawn.withdrawn}.`,
      }
    : acceptedFrom(component, consumer, provided.id);
  const split = responsibilitySplit(provided, programId, applicable);
  const { state, stateReason } = stateOf(
    component,
    provided,
    applicable,
    reason,
    accepted,
    withdrawn,
  );
  return {
    control: provided.id,
    component,
    provided,
    tier: ccpTierFor(component),
    designation: split.designation,
    share: split.share,
    emassStatus: split.emassStatus,
    consumerObligation: split.consumerObligation,
    applicable,
    applicabilityEvaluable: evaluable,
    applicabilityReason: reason,
    accepted,
    state,
    stateReason,
    conflicts: [],
    evidenceAgeDays: provided.evidenceAge,
    stale: provided.evidenceAge > staleThresholdDays,
  };
}

function withdrawnProvidedControl(w: WithdrawnOffer): ProvidedControl {
  return {
    id: w.control,
    title: w.title,
    family: w.family,
    model: "Customer configured",
    evidence: "—",
    evidenceAge: 0,
    status: "Not assessed",
    assessmentVersion: w.acceptedAssessmentVersion,
    assessedOn: w.acceptedOn,
    assertion: w.reason,
    consumerObligation: w.consumerObligation,
    applicability: anyConsumer,
  };
}

/** Deterministic ordering: nearest tier, then freshest assessment, then component id. */
function betterCandidate(a: ResolvedInheritance, b: ResolvedInheritance): number {
  const tier = tierRank(b.tier) - tierRank(a.tier);
  if (tier !== 0) return tier;
  const at = parseGateDate(a.provided.assessedOn)?.getTime() ?? 0;
  const bt = parseGateDate(b.provided.assessedOn)?.getTime() ?? 0;
  if (at !== bt) return bt - at;
  return a.component.id.localeCompare(b.component.id);
}

function conflictFrom(
  loser: ResolvedInheritance,
  winner: ResolvedInheritance,
): InheritanceConflict {
  const sameTier = loser.tier === winner.tier;
  const reason = sameTier
    ? `Deconflicted against ${loser.component.id} (${loser.tier} tier); both providers sit at the same tier, so ${winner.component.name} wins on the fresher assessment (${winner.provided.assessedOn} against ${loser.provided.assessedOn}).`
    : `Deconflicted against ${loser.component.id} (${loser.tier} tier); the ${winner.component.name.toLowerCase()} is the nearer provider for ${winner.control}.`;
  return {
    component: loser.component.id,
    tier: loser.tier,
    model: loser.provided.model,
    reason,
  };
}

type Resolution = {
  resolved: Map<string, ResolvedInheritance>;
  notApplicable: ResolvedInheritance[];
};

function compute(programId: string): Resolution {
  const inv = inventoryOf(programId);
  const candidates: ResolvedInheritance[] = [];

  // Stage 1 — candidates. Nothing is dropped yet.
  for (const component of systemComponents) {
    const consumer = component.consumers.find((c) => c.programId === programId);
    if (!consumer) continue;
    for (const provided of component.controls) {
      candidates.push(makeCandidate(component, consumer, provided, inv, programId, null));
    }
    for (const w of withdrawnOffers) {
      if (w.program !== programId || w.component !== component.id) continue;
      if (component.controls.some((c) => c.id === w.control)) continue;
      candidates.push(
        makeCandidate(component, consumer, withdrawnProvidedControl(w), inv, programId, w),
      );
    }
  }

  // Stage 2 — applicability already evaluated per candidate; split the two streams.
  const byControl = new Map<string, ResolvedInheritance[]>();
  const notApplicable: ResolvedInheritance[] = [];
  for (const candidate of candidates) {
    if (!candidate.applicable) {
      notApplicable.push(candidate);
      continue;
    }
    const bucket = byControl.get(candidate.control);
    if (bucket) bucket.push(candidate);
    else byControl.set(candidate.control, [candidate]);
  }

  // Stage 3 — precedence. Losers become conflicts on the winner.
  const resolved = new Map<string, ResolvedInheritance>();
  for (const [control, bucket] of byControl) {
    const ranked = [...bucket].sort(betterCandidate);
    const winner = ranked[0];
    if (!winner) continue;
    for (const loser of ranked.slice(1)) winner.conflicts.push(conflictFrom(loser, winner));
    resolved.set(control, winner);
  }

  notApplicable.sort(
    (a, b) => a.control.localeCompare(b.control) || a.component.id.localeCompare(b.component.id),
  );
  return { resolved, notApplicable };
}

let cachedVersion = -1;
const resolutionCache = new Map<string, Resolution>();

function resolutionFor(programId: string): Resolution {
  const version = graphVersion();
  if (version !== cachedVersion) {
    resolutionCache.clear();
    cachedVersion = version;
  }
  const hit = resolutionCache.get(programId);
  if (hit) return hit;
  const built = compute(programId);
  resolutionCache.set(programId, built);
  return built;
}

/** The authoritative inheritance picture for one consuming program, keyed by control id. */
export function resolveInheritance(programId: string): Map<string, ResolvedInheritance> {
  return resolutionFor(programId).resolved;
}

/**
 * Inheritance edges for a consuming program, keyed by control id.
 *
 * Shape preserved for its existing readers (`program-actions.ts`,
 * `programs.$programId.tsx`): the component and the offer it published, with no
 * resolution prose. The *content* is the precedence-resolved winner rather than
 * whichever provider happened to appear first in `systemComponents`, and offers
 * that do not apply to the program's inventory are excluded here and reachable
 * through `offeredNotApplicable`.
 */
export function inheritanceForProgram(programId: string) {
  const map = new Map<string, { component: SystemComponent; control: ProvidedControl }>();
  for (const [control, resolved] of resolveInheritance(programId)) {
    map.set(control, { component: resolved.component, control: resolved.provided });
  }
  return map;
}

/** Offered but not applicable — printed in the inherited-controls appendix, not the matrix. */
export function offeredNotApplicable(programId: string): ResolvedInheritance[] {
  return resolutionFor(programId).notApplicable;
}

/** Every candidate that lost precedence, flattened for the "why this provider" view. */
export function inheritanceConflicts(
  programId: string,
): { control: string; winner: ResolvedInheritance; conflict: InheritanceConflict }[] {
  const out: { control: string; winner: ResolvedInheritance; conflict: InheritanceConflict }[] = [];
  for (const winner of resolveInheritance(programId).values()) {
    for (const conflict of winner.conflicts) {
      out.push({ control: winner.control, winner, conflict });
    }
  }
  return out.sort((a, b) => a.control.localeCompare(b.control));
}

/** Hybrid and System-Specific rows carry work the consumer still owes. */
export function consumerObligations(programId: string): ResolvedInheritance[] {
  return [...resolveInheritance(programId).values()]
    .filter((r) => r.consumerObligation !== "—")
    .sort((a, b) => a.control.localeCompare(b.control));
}

export function inheritanceSummary(programId: string): {
  total: number;
  common: number;
  hybrid: number;
  systemSpecific: number;
  current: number;
  drifted: number;
  /** `state === "Provider failed"` only — the provider's own deficiency propagates. */
  failed: number;
  /** `state === "Revoked"` only — the offer was withdrawn and the obligation reverts. */
  revoked: number;
  /** `failed + revoked`, for the one place that legitimately buckets them together. */
  failedOrRevoked: number;
  stale: number;
  notApplicable: number;
  /** Resolved rows carried on an inventory constraint that could not be checked. */
  unevaluableScope: number;
  unaccepted: number;
} {
  const rows = [...resolveInheritance(programId).values()];
  const count = (fn: (r: ResolvedInheritance) => boolean) => rows.filter(fn).length;
  // "Provider failed" and "Revoked" are different obligations and must not share
  // a number: a failing provider propagates its deficiency to this system, while
  // a revoked offer leaves the determination where it is and reverts the
  // obligation to the consumer as System-Specific. Both counts are published so
  // a caller can label exactly what it is showing.
  const failed = count((r) => r.state === "Provider failed");
  const revoked = count((r) => r.state === "Revoked");
  return {
    total: rows.length,
    common: count((r) => r.designation === "Common"),
    hybrid: count((r) => r.designation === "Hybrid"),
    systemSpecific: count((r) => r.designation === "System-Specific"),
    current: count((r) => r.state === "Current"),
    drifted: count((r) => r.state === "Version drift"),
    failed,
    revoked,
    failedOrRevoked: failed + revoked,
    stale: count((r) => r.state === "Evidence stale"),
    notApplicable: offeredNotApplicable(programId).length,
    unevaluableScope: count((r) => !r.applicabilityEvaluable),
    unaccepted: count((r) => r.accepted === null),
  };
}
