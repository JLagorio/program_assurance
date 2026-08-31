/**
 * Chunk 14 of the CCI spine — residual risk scoring with mission and threat context.
 *
 * CAT I/II/III is a SEVERITY, not a risk. Severity says how badly the
 * requirement is missed; it says nothing about whether the weakness can be
 * reached, whether anyone has ever exploited it, what it costs the mission, or
 * whether the evidence that lowered it is still true. This module combines
 * those into one 0-100 residual, and it carries the whole calculation with it.
 *
 * Invariants held here:
 *
 *  - **A score with no trail is worse than no score**, because it launders
 *    judgement as arithmetic. Every `ScoreFactor` carries the raw input it read,
 *    the ids it read them from, and one rationale sentence a human can read and
 *    disagree with. Nothing is a constant: all six factors are computed from the
 *    composition graph, the finding register, the VEX record, the change log and
 *    the mission-effect record.
 *
 *  - **The contributions sum to the score.** `contribution` is
 *    `round(value × weight × 100)` and `score` is the clamped sum of exactly the
 *    factors listed. There is no hidden term, no curve and no fudge; if the
 *    clamp ever bites, it is stated as a caveat rather than absorbed silently.
 *
 *  - **A factor that cannot be computed is a CAVEAT, not a silent zero.** A
 *    finding that resolves to no composition node has no exposure, mission or
 *    currency factor at all — those weights are simply not applied, the score is
 *    marked provisional, and the reader is told which weight is missing. Scoring
 *    a missing input as 0 would quietly say "not exposed", which is a different
 *    and much stronger claim than "not known".
 *
 *  - **Mitigation is a visible CREDIT, never a silent adjustment.** It carries a
 *    negative weight and shows as a negative contribution, so the reader can see
 *    exactly how many points the compensating control bought and argue about it.
 *    `inherent` is the same sum with the credit withheld.
 *
 *  - **Exposure is derived from the graph, and it cites the actual path.** This
 *    is what the composition graph exists to make computable:
 *    `exposurePathsTo` is walked and the winning path is named node by node in
 *    the rationale. "Reachable from the Public zone" with no path behind it is
 *    an assertion; "CN-0310 edge-sw-a1 → CN-0210 mission-api → CN-0130 gcs-db-01"
 *    is a claim the reader can check.
 *
 *  - **Currency closes the loop between features 7 and 9.** An `Invalidated`
 *    node means the configuration the mitigation evidence was taken against no
 *    longer exists, so the evidence no longer holds and the score goes UP. A
 *    change staged in a candidate build only makes the node `Suspect`, and moves
 *    the score less. That is the same asymmetry the cascade itself holds.
 *
 *  - **The authored register numbers are never overwritten.** `RegisterRisk`
 *    carries an authored `inherent`/`residual` an assessor wrote down; this
 *    module computes its own and shows it BESIDE, exactly as tranche 1 kept
 *    scanner-declared counts beside register-tracked ones.
 *    `authoredComparison` states the delta in a sentence. Where they disagree,
 *    the disagreement is the information.
 *
 * The weight arithmetic, so a reader can check it:
 *
 *     severity         0.30      raw CAT grade
 *     mission          0.25      node criticality + confirmed mission effect
 *     exploitability   0.20      KEV / demonstrated / VEX / STIG rule / origin
 *     exposure         0.15      exposurePathsTo — entry zone and entry count
 *     currency         0.10      nodeImpact + assessment age
 *     ───────────────────────
 *     positive total   1.00   →  100 points at full value on every factor
 *     mitigation      -0.20   →  up to 20 points of visible credit
 *
 *     contribution = round(value × weight × 100)
 *     score        = clamp(Σ contribution, 0, 100)
 *     inherent     = clamp(Σ contribution over positive weights, 0, 100)
 *
 * No clock is read. Selectors that need "today" take a trailing `asOf` string
 * defaulting to the dataset's own today, Aug 30, 2026, so SSR and CSR agree.
 */

import type { Tone } from "@/components/app/ui";
import { datasetToday } from "@/lib/dataset-clock";
import { nodeImpact, stampOf, type ImpactState } from "@/lib/baselines";
import type { CompositionNode, Criticality } from "@/lib/composition";
import {
  ancestorsOf,
  descendantsOf,
  graphVersion,
  nodeById,
  nodeForAsset,
  nodesForProgram,
  trustRank,
} from "@/lib/composition";
import { assetById, findings, isDeficiency, type Finding } from "@/lib/findings";
import { exposurePathsTo, type ExposurePath } from "@/lib/graph-posture";
import { nativeResults } from "@/lib/ingestion";
import { findingsForRisk, registerRisks, riskById, type RegisterRisk } from "@/lib/register";
import type { FindingSeverity } from "@/lib/spine";
import { missionEffects, threatScenarios, type EffectKind } from "@/lib/te-phases";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type FactorKey =
  "severity" | "mitigation" | "exploitability" | "exposure" | "mission" | "currency";

export type ScoreFactor = {
  key: FactorKey;
  label: string;
  /** The raw input, as a readable string — "CAT I", "KEV-listed", "2 zone crossings". */
  input: string;
  /** 0-1 normalised. */
  value: number;
  weight: number;
  /** value * weight * 100, rounded — what this factor added or removed. */
  contribution: number;
  /** One sentence a human can disagree with. */
  rationale: string;
  /** Ids this factor rests on. */
  evidence: string[];
};

export type RiskBand = "Very low" | "Low" | "Moderate" | "High" | "Very high";

export type ResidualScore = {
  subject: string; // FND- or RSK-
  kind: "Finding" | "Risk";
  /** 0-100. */
  score: number;
  band: RiskBand;
  factors: ScoreFactor[];
  /** The score before mitigation credit, so the credit is visible. */
  inherent: number;
  /** What would most reduce this score, in one sentence. */
  leverage: string;
  /** Set when a factor could not be computed, so the score is provisional. */
  caveats: string[];
};

/* ── Weights, bands and tone ─────────────────────────────────────────────── */

export const factorWeights: Record<FactorKey, number> = {
  severity: 0.3,
  mission: 0.25,
  exploitability: 0.2,
  exposure: 0.15,
  currency: 0.1,
  mitigation: -0.2,
};

const factorLabels: Record<FactorKey, string> = {
  severity: "Severity",
  mitigation: "Mitigation credit",
  exploitability: "Exploitability",
  exposure: "Exposure",
  mission: "Mission impact",
  currency: "Evidence currency",
};

/** Presentation order: the positive factors by weight, then the credit. */
export const factorOrder: FactorKey[] = [
  "severity",
  "mission",
  "exploitability",
  "exposure",
  "currency",
  "mitigation",
];

export function bandFor(score: number): RiskBand {
  if (score >= 80) return "Very high";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very low";
}

/**
 * A band IS a verdict, unlike a criticality or a trust zone, so it carries
 * colour. "Moderate" stays neutral rather than amber: the amber has to mean
 * something, and it means "this is close to the line".
 */
export const bandTone: Record<RiskBand, Tone> = {
  "Very low": "success",
  Low: "success",
  Moderate: "neutral",
  High: "warning",
  "Very high": "danger",
};

/* ── Small numerics ──────────────────────────────────────────────────────── */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Two decimals, so the published `value` and the arithmetic agree on paper. */
function round2(value: number): number {
  return Math.round(clamp01(value) * 100) / 100;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function contributionOf(key: FactorKey, value: number): number {
  return Math.round(value * factorWeights[key] * 100);
}

function factor(
  key: FactorKey,
  input: string,
  rawValue: number,
  rationale: string,
  evidence: string[],
): ScoreFactor {
  const value = round2(rawValue);
  return {
    key,
    label: factorLabels[key],
    input,
    value,
    weight: factorWeights[key],
    contribution: contributionOf(key, value),
    rationale,
    evidence,
  };
}

/**
 * A factor and, where one applies, the value it WOULD have taken without the
 * live signal that moved it. `programRiskPosture` reads this to say which
 * findings moved because of an invalidation or a KEV listing, without scoring
 * anything twice.
 */
type BuiltFactor = { factor: ScoreFactor; baseline?: { value: number; why: string } };

/* ── Override-resolved node lookup ───────────────────────────────────────── */

let nodeIndex: Map<string, CompositionNode> | null = null;
let nodeIndexVersion = -1;

/**
 * Every node, with the composition store's runtime patches applied. Criticality
 * and trust zone are both operator-editable, and scoring the seed value after
 * someone has re-classified a node would silently serve a stale mission factor.
 */
function liveNodes(): Map<string, CompositionNode> {
  const version = graphVersion();
  if (nodeIndex && nodeIndexVersion === version) return nodeIndex;
  const index = new Map<string, CompositionNode>();
  for (const programId of new Set([...nodeById.values()].map((n) => n.program))) {
    for (const node of nodesForProgram(programId)) index.set(node.id, node);
  }
  nodeIndex = index;
  nodeIndexVersion = version;
  return index;
}

function liveNode(nodeId: string | undefined): CompositionNode | null {
  if (!nodeId) return null;
  return liveNodes().get(nodeId) ?? null;
}

/** The node a finding hangs on: the part it names, else its asset's anchor. */
function nodeOf(f: Finding): CompositionNode | null {
  return liveNode(f.node) ?? nodeForAsset(f.asset);
}

function nameOf(nodeId: string): string {
  return liveNode(nodeId)?.name ?? nodeId;
}

/** The tracked boundary asset the part is delivered inside, nearest first. */
function anchorOf(node: CompositionNode): CompositionNode | null {
  if (node.asset) return node;
  for (const ancestor of ancestorsOf(node.id)) {
    if (ancestor.asset) return liveNode(ancestor.id) ?? ancestor;
  }
  return null;
}

function programOf(f: Finding): string {
  return assetById.get(f.asset)?.program ?? nodeOf(f)?.program ?? "";
}

/* ── VEX index ───────────────────────────────────────────────────────────── */

type VexStatement = {
  scan: string;
  purl: string;
  vulnerability: string;
  cvss: number;
  kev: boolean;
  analysisState: "exploitable" | "not_affected" | "in_triage";
};

/**
 * VEX statements keyed by the purl they name, which is exactly the composition
 * graph's `partKey`. That equality is what lets a CVE record be read against a
 * finding at all: both sides are talking about the same component coordinate.
 */
const vexByPurl = new Map<string, VexStatement[]>();
for (const native of nativeResults) {
  if (native.format !== "SCA CycloneDX-VEX") continue;
  const statement: VexStatement = {
    scan: native.scan,
    purl: native.purl,
    vulnerability: native.vulnerability,
    cvss: native.cvss,
    kev: native.kev,
    analysisState: native.analysisState,
  };
  const bucket = vexByPurl.get(native.purl);
  if (bucket) bucket.push(statement);
  else vexByPurl.set(native.purl, [statement]);
}

/** Statements against this component and against the parts inside it. */
function vexForComponent(node: CompositionNode): VexStatement[] {
  const out: VexStatement[] = [];
  for (const part of [node, ...descendantsOf(node.id)]) {
    for (const row of vexByPurl.get(part.partKey) ?? []) {
      if (row.analysisState !== "not_affected") out.push(row);
    }
  }
  return out;
}

/**
 * KEV statements against the deliverable the part ships inside — the image or
 * the host — but not against the part itself. Deliberately kept separate from
 * `vexForComponent`: it is a weaker fact and it is reported as one.
 */
function kevAboveComponent(node: CompositionNode): { row: VexStatement; node: string } | null {
  const anchor = anchorOf(node);
  if (!anchor || anchor.id === node.id) return null;
  const chain = [anchor, ...ancestorsOf(node.id).filter((a) => a.id !== anchor.id)];
  for (const container of chain) {
    if (container.id === node.id) continue;
    if (!ancestorsOf(node.id).some((a) => a.id === container.id)) continue;
    for (const row of vexByPurl.get(container.partKey) ?? []) {
      if (row.kev && row.analysisState !== "not_affected") return { row, node: container.id };
    }
  }
  return null;
}

/* ── Factor 1 — severity ─────────────────────────────────────────────────── */

const severityValue: Record<FindingSeverity, number> = {
  "CAT I": 1,
  "CAT II": 0.6,
  "CAT III": 0.3,
};

/**
 * `creditShownHere` is false when the caller knows the credit row on the same
 * table was won by a DIFFERENT finding — an aggregate risk mixing members. The
 * forward reference "taken separately below" is only true when the credit line
 * beneath it belongs to this same finding; asserting it otherwise points the
 * reader at a row that does not exist.
 */
function severityFactor(f: Finding, creditShownHere = true): BuiltFactor {
  const value = severityValue[f.rawSeverity];
  const graded =
    f.rawSeverity === f.mitigatedSeverity
      ? `it was graded ${f.rawSeverity} and no compensating control moved it`
      : `it was graded ${f.rawSeverity} at discovery and adjudicated ${f.mitigatedSeverity}${creditShownHere ? ", and the credit for that is taken separately below rather than folded into this line" : ""}`;
  return {
    factor: factor(
      "severity",
      f.rawSeverity,
      value,
      `${f.rule ? `${f.rule} on ` : ""}${f.control} (${f.cci}) is a ${f.rawSeverity} weakness — ${graded}.`,
      [f.id, f.cci, ...(f.rule ? [f.rule] : [])],
    ),
  };
}

/* ── Factor 2 — mitigation credit ────────────────────────────────────────── */

const severityRank: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

/**
 * The credit is the distance the adjudicated grade travelled below the raw
 * grade, plus a smaller allowance for a written compensating control. It is
 * capped at 1.0 and therefore at 20 points, and it is the only factor that can
 * take points off.
 */
function mitigationFactor(f: Finding): BuiltFactor {
  const steps = severityRank[f.mitigatedSeverity] - severityRank[f.rawSeverity];
  const stepCredit = Math.max(0, steps) * 0.4;
  const proseCredit = f.mitigation ? 0.2 : 0;
  const value = stepCredit + proseCredit;

  const input =
    steps > 0
      ? `${f.rawSeverity} → ${f.mitigatedSeverity}${f.mitigation ? " with a recorded compensating control" : ""}`
      : f.mitigation
        ? `No severity change; compensating control recorded`
        : "None";

  const rationale =
    steps > 0
      ? `The assessor moved the grade ${steps} step${steps === 1 ? "" : "s"} from ${f.rawSeverity} to ${f.mitigatedSeverity}${f.mitigation ? ` on the strength of one recorded control — "${f.mitigation}" — which is worth a further ${Math.round(proseCredit * 20)} points` : " with no compensating control written down, so only the grade movement earns credit"}. Credit is shown as a negative contribution so it can be argued with rather than assumed.`
      : f.mitigation
        ? `The raw and adjudicated grades are both ${f.rawSeverity}, so no severity credit is owed; the recorded control — "${f.mitigation}" — earns the written-mitigation allowance alone.`
        : `Raw and adjudicated severity are both ${f.rawSeverity} and no compensating control is recorded, so nothing offsets the weakness and the credit is zero.`;

  return {
    factor: factor("mitigation", input, value, rationale, [f.id, ...f.assessment.evidence]),
  };
}

/* ── Factor 3 — exploitability ───────────────────────────────────────────── */

/**
 * A first-match ladder, worst rung first, so the winning clause is always the
 * strongest evidence available rather than an average of everything:
 *
 *   1.00  KEV-listed against this component or a part inside it
 *   0.90  demonstrated on THIS system — a confirmed mission effect names it,
 *         or it was raised by a red-team test event
 *   0.45 + cvss × 0.05   an `exploitable` VEX statement on the component
 *   0.35 + cvss × 0.03   an `in_triage` VEX statement on the component
 *   0.70  a machine-checkable STIG rule id exists — trivially findable
 *   0.60  an ACAS network plugin found it remotely with no rule id
 *   0.40  a code scan / SAST origin with no public exploit
 *   0.20  a manual procedure — someone had to be told where to look
 *
 * A KEV listing against the enclosing image or host, rather than against the
 * component itself, is a separate and weaker fact: it adds 0.15 and is capped
 * at 0.90, and the rationale names the CVE and the node it is actually against
 * so the reader is never left thinking the part itself is KEV-listed.
 */
function exploitabilityFactor(f: Finding, node: CompositionNode | null): BuiltFactor {
  const namingEffect = missionEffects.find(
    (e) => e.findings.includes(f.id) && e.effect !== "No effect",
  );
  const statements = node ? vexForComponent(node) : [];
  const kevHere = statements.find((s) => s.kev);
  const exploitable = statements
    .filter((s) => s.analysisState === "exploitable")
    .sort((a, b) => b.cvss - a.cvss)[0];
  const triage = statements
    .filter((s) => s.analysisState === "in_triage")
    .sort((a, b) => b.cvss - a.cvss)[0];

  let base: number;
  let input: string;
  let rationale: string;
  const evidence: string[] = [f.id];

  if (kevHere && node) {
    base = 1;
    input = `KEV-listed — ${kevHere.vulnerability}`;
    rationale = `${kevHere.vulnerability} is in the CISA Known Exploited Vulnerabilities catalog against ${node.partKey}, the exact component this finding names. Observed exploitation in the wild is the top of the ladder: a weakness someone has already used is not graded on how hard it looks.`;
    evidence.push(kevHere.scan, node.id);
  } else if (namingEffect) {
    base = 0.9;
    input = `Demonstrated — ${namingEffect.id} (${namingEffect.effect})`;
    rationale = `${namingEffect.id} records a confirmed "${namingEffect.effect.toLowerCase()}" mission effect raised from this finding and ${namingEffect.reproduced ? "reproduced on a second attempt" : "observed once and not reproduced"}, so exploitation is not a hypothesis about this system — it was carried out on it under ${namingEffect.confirmedBy}.`;
    evidence.push(namingEffect.id, namingEffect.confirmedBy);
  } else if (f.source === "Test event") {
    base = 0.9;
    input = "Demonstrated in a test event";
    rationale = `The finding was raised by a test event rather than by a scanner, which means a tester reached the condition on the running system: "${f.detail}"`;
    evidence.push(f.sourceArtifact);
  } else if (exploitable) {
    base = 0.45 + exploitable.cvss * 0.05;
    input = `VEX exploitable — ${exploitable.vulnerability}, CVSS ${exploitable.cvss.toFixed(1)}`;
    rationale = `The supplier's VEX statement grades ${exploitable.vulnerability} "exploitable" against ${node?.partKey ?? "this component"} at CVSS ${exploitable.cvss.toFixed(1)}, so the flawed code path is present and the vendor is not claiming otherwise.`;
    evidence.push(exploitable.scan, ...(node ? [node.id] : []));
  } else if (triage) {
    base = 0.35 + triage.cvss * 0.03;
    input = `VEX in triage — ${triage.vulnerability}, CVSS ${triage.cvss.toFixed(1)}`;
    rationale = `${triage.vulnerability} is still "in_triage" against ${node?.partKey ?? "this component"} at CVSS ${triage.cvss.toFixed(1)}: the component is affected and nobody has yet decided whether the path is reachable, which is credited below an adjudicated exploitable statement rather than at it.`;
    evidence.push(triage.scan, ...(node ? [node.id] : []));
  } else if (f.rule) {
    base = 0.7;
    input = `Machine-checkable rule ${f.rule}`;
    rationale = `${f.rule} is a published benchmark rule, so the condition is found by running the same checklist the assessor ran — no research and no tooling of the attacker's own is required to locate it.`;
    evidence.push(f.rule, f.sourceArtifact);
  } else if (f.source === "ACAS scan") {
    base = 0.6;
    input = "Remotely detected by a network scanner";
    rationale = `An ACAS plugin found this over the network with no rule id behind it, so the condition is visible to anything that can reach the host and can be enumerated at scale — but no public exploit is recorded against it.`;
    evidence.push(f.sourceArtifact);
  } else if (f.source === "Code scan") {
    base = 0.4;
    input = "Static analysis, no public exploit";
    rationale = `The weakness came out of a code or composition scan and no public exploit or KEV listing is recorded against the component, so exploitation would require an attacker to do the same analysis first.`;
    evidence.push(f.sourceArtifact);
  } else {
    base = 0.2;
    input = "Manual procedure";
    rationale = `The condition was found by an assessor following a written procedure, not by any tool. An attacker would have to already know the configuration to know it was worth attacking, which is the bottom of the ladder — not zero, because insiders do know.`;
    evidence.push(f.sourceArtifact);
  }

  let value = base;
  let baseline: { value: number; why: string } | undefined;
  const above = node && base < 0.9 ? kevAboveComponent(node) : null;
  if (above) {
    value = Math.min(0.9, base + 0.15);
    baseline = {
      value: base,
      why: `${above.row.vulnerability} is KEV-listed against ${above.node} ${nameOf(above.node)}, the deliverable this part ships inside.`,
    };
    rationale += ` Raised ${Math.round((value - base) * 20)} points because ${above.row.vulnerability} is KEV-listed against ${above.node} (${nameOf(above.node)}), the ${liveNode(above.node)?.kind.toLowerCase() ?? "component"} this part is delivered inside — the listing is against the container, not against this component, so it lifts the reading rather than setting it.`;
    evidence.push(above.row.scan, above.node);
  }

  const built: BuiltFactor = {
    factor: factor("exploitability", input, value, rationale, dedupe(evidence)),
  };
  if (baseline) built.baseline = baseline;
  return built;
}

/* ── Factor 4 — exposure ─────────────────────────────────────────────────── */

/**
 * Derived from `exposurePathsTo`, which is the reason the composition graph
 * exists. The value is set by the least-trusted ground any inbound path reaches
 * back to, widened slightly by how many distinct entry points there are and by
 * whether the whole path runs over edges with no redundant alternative.
 *
 * A node with NO inbound path is not automatically unexposed: a part sitting
 * inside a chassis that is itself in the Public zone is the trust boundary
 * rather than something behind it, and that is scored — and said — separately
 * from a genuinely interior node.
 */
const entryZoneValue: Record<string, number> = {
  Public: 1,
  DMZ: 0.75,
  Enclave: 0.5,
  Management: 0.4,
  Isolated: 0.3,
};

function describePath(path: ExposurePath, targetId: string): string {
  const ids: string[] = [];
  for (const hop of path.hops) {
    if (ids.length === 0) ids.push(hop.from);
    ids.push(hop.to);
  }
  const walk = ids.map((id) => `${id} ${nameOf(id)}`).join(" → ");
  const landing = ids[ids.length - 1];
  const tail =
    landing && landing !== targetId ? `, which contains ${targetId} ${nameOf(targetId)}` : "";
  return `${walk}${tail}`;
}

function exposureFactor(node: CompositionNode | null): BuiltFactor | { caveat: string } {
  if (!node) {
    return {
      caveat:
        "Exposure could not be computed: the finding resolves to no composition node, so there is no graph position to walk inbound paths to. The 0.15 exposure weight is not applied and the score is out of 85 rather than 100.",
    };
  }

  const paths = exposurePathsTo(node.id);
  const closure = [node, ...ancestorsOf(node.id)];

  if (paths.length === 0) {
    const outermost = closure.slice().sort((a, b) => trustRank(a.zone) - trustRank(b.zone))[0];
    const rank = outermost ? trustRank(outermost.zone) : trustRank(node.zone);
    if (outermost && rank <= trustRank("DMZ")) {
      const value = outermost.zone === "Public" ? 0.55 : 0.35;
      return {
        factor: factor(
          "exposure",
          `No inbound path; sits inside ${outermost.zone}`,
          value,
          `No modelled connection reaches ${node.id} ${node.name} from less-trusted ground, but it is contained in ${outermost.id} ${outermost.name}, which sits in the ${outermost.zone} zone — the part is at the trust boundary rather than behind it, so it is reachable by anything that can reach the enclosure.`,
          [node.id, outermost.id],
        ),
      };
    }
    return {
      factor: factor(
        "exposure",
        "No inbound path",
        0.1,
        `\`exposurePathsTo\` finds no inbound connection into ${node.id} ${node.name} — or into anything containing it — from a less-trusted zone than its own ${node.zone}. An interior node still scores above zero because the graph models declared connectivity, not every packet that could exist.`,
        [node.id],
      ),
    };
  }

  const best = paths[0]!;
  const entryZone = liveNode(best.entry)?.zone ?? node.zone;
  const entries = new Set(paths.map((p) => p.entry));
  const anyCritical = paths.some((p) => p.critical);
  const base = entryZoneValue[entryZone] ?? 0.5;
  // The widening is capped HERE, where it is reasoned about, rather than being
  // absorbed silently by `round2`'s clamp. A Public entry is already at 1.00,
  // so the widening only separates entries at DMZ or deeper — and where it is
  // absorbed the rationale says so rather than leaving the reader to apply a
  // term the arithmetic never took.
  const widening = Math.min(0.1, (entries.size - 1) * 0.05) + (anyCritical ? 0.05 : 0);
  const value = Math.min(1, base + widening);
  const cappedAway = base + widening > 1;

  const crossings = best.zonesCrossed;
  const input = `${entries.size} entry point${entries.size === 1 ? "" : "s"}, worst from ${entryZone}`;
  const rationale =
    `Reachable from the ${entryZone} zone: ${describePath(best, node.id)} — ${best.hops.length} hop${best.hops.length === 1 ? "" : "s"}, ` +
    `${crossings} trust boundar${crossings === 1 ? "y" : "ies"} crossed, ${best.critical ? "every hop over a connection with no redundant alternative" : "at least one hop over a redundant connection"}. ` +
    `${entries.size === 1 ? "It is the only inbound entry point the graph carries" : `${entries.size} distinct inbound entry points reach it (${[...entries].join(", ")})`}${anyCritical && !best.critical ? ", and at least one of them runs entirely over critical edges" : ""}.` +
    `${cappedAway ? ` The ${widening.toFixed(2)} widening for entry count and all-critical edges does not move the value: a ${entryZone} entry is already at the 1.00 ceiling, so exposure is capped there rather than raised.` : ""}`;

  return {
    factor: factor(
      "exposure",
      input,
      value,
      rationale,
      dedupe([node.id, ...entries, ...best.hops.map((h) => h.to)]),
    ),
  };
}

/* ── Factor 5 — mission impact ───────────────────────────────────────────── */

const criticalityValue: Record<Criticality, number> = {
  "Mission critical": 0.9,
  "Mission essential": 0.65,
  "Mission support": 0.4,
  "Non-critical": 0.15,
};

/** How much of the mission the adversary actually took. */
const effectValue: Record<EffectKind, number> = {
  Destroyed: 1,
  Denied: 1,
  Exfiltrated: 0.9,
  Manipulated: 0.85,
  Degraded: 0.7,
  "No effect": 0,
};

const effectRank: Record<EffectKind, number> = {
  Destroyed: 0,
  Denied: 1,
  Exfiltrated: 2,
  Manipulated: 3,
  Degraded: 4,
  "No effect": 5,
};

/**
 * Scenarios whose declared path runs through this node, its container or a part
 * inside it — the same containment reasoning exposure uses. Reaching the
 * chassis reaches the package inside it, and a scenario that traverses the host
 * traverses what the host is made of.
 */
function scenariosTouching(node: CompositionNode): Map<string, string> {
  const relation = new Map<string, "self" | "container" | "part">();
  relation.set(node.id, "self");
  for (const a of ancestorsOf(node.id)) relation.set(a.id, "container");
  for (const d of descendantsOf(node.id)) relation.set(d.id, "part");

  const out = new Map<string, string>();
  for (const scenario of threatScenarios) {
    // Nearest relation first: naming the node itself is stronger than naming
    // its enclosure, and the rationale must say which one the path actually
    // contains rather than implying the path listed this node when it did not.
    const hit =
      scenario.path.find((p) => relation.get(p) === "self") ??
      scenario.path.find((p) => relation.get(p) === "part") ??
      scenario.path.find((p) => relation.get(p) === "container");
    if (!hit) continue;
    const how =
      hit === node.id
        ? `runs through ${node.id} ${node.name} itself`
        : relation.get(hit) === "part"
          ? `runs through ${hit} ${nameOf(hit)}, a part inside ${node.id} ${node.name}`
          : `runs through ${hit} ${nameOf(hit)}, which contains ${node.id} ${node.name}`;
    out.set(scenario.id, how);
  }
  return out;
}

function missionFactor(f: Finding, node: CompositionNode | null): BuiltFactor | { caveat: string } {
  if (!node) {
    return {
      caveat:
        "Mission impact could not be computed: the finding resolves to no composition node, so neither a criticality nor a scenario path can be read for it. The 0.25 mission weight is not applied.",
    };
  }

  const base = criticalityValue[node.criticality];
  const named = missionEffects.filter((e) => e.findings.includes(f.id));
  const touching = scenariosTouching(node);
  const nearby = missionEffects.filter((e) => touching.has(e.scenario));
  const pool = named.length > 0 ? named : nearby;
  const worst = pool.slice().sort((a, b) => effectRank[a.effect] - effectRank[b.effect])[0];

  if (!worst) {
    return {
      factor: factor(
        "mission",
        `${node.criticality}, no confirmed effect`,
        base,
        `No confirmed mission effect touches ${node.id} ${node.name} or any scenario path through it, so this rests on criticality alone: the component is graded ${node.criticality} in the criticality analysis. That is a statement about what the component is for, not evidence about what an adversary achieved against it.`,
        [node.id],
      ),
    };
  }

  const direct = named.length > 0;
  const provenance = direct
    ? `${worst.id} was raised from this finding`
    : `${worst.id} was confirmed on ${worst.scenario}, whose declared path ${touching.get(worst.scenario) ?? `reaches ${node.id} ${node.name}`}`;

  if (worst.effect === "No effect") {
    const value = Math.max(0.1, base - 0.15);
    return {
      factor: factor(
        "mission",
        `${node.criticality}, adversary achieved no effect`,
        value,
        `${provenance} and records NO mission effect: ${worst.observed.split(".")[0]}. The component is ${node.criticality}, so the exposure would matter — but the objective was attempted and refused, which is evidence and is credited as such rather than ignored.`,
        [node.id, worst.id, worst.confirmedBy],
      ),
    };
  }

  const raw = Math.max(base, effectValue[worst.effect]);
  const value = worst.reproduced ? raw : raw - 0.1;
  const rationale =
    `${provenance}: a confirmed "${worst.effect}" against ${worst.missionFunction}${worst.duration === "—" ? "" : ` lasting ${worst.duration.replace(/\.$/, "")}`}, ` +
    `${worst.reproduced ? "reproduced on a second attempt" : "observed once and NOT reproduced, which takes 2 points back off"}. ` +
    `The component is graded ${node.criticality}${effectValue[worst.effect] > base ? `, and the observed effect is worse than the criticality alone would predict, so the effect governs` : `, which governs because it is the harsher reading`}. ` +
    `Operator workaround: ${worst.workaround === "None identified" ? "none identified" : worst.workaround.replace(/\.$/, "")}.`;

  return {
    factor: factor(
      "mission",
      `${node.criticality}, confirmed ${worst.effect}`,
      value,
      rationale,
      dedupe([node.id, worst.id, worst.scenario, worst.confirmedBy]),
    ),
  };
}

/* ── Factor 6 — evidence currency ────────────────────────────────────────── */

const impactValue: Record<ImpactState, number> = { Invalidated: 1, Suspect: 0.55 };

/**
 * The loop between configuration management and risk. A determination is only
 * ever true OF A CONFIGURATION; when the configuration moves, the evidence that
 * bought the mitigation credit stops describing the thing that is running, and
 * the residual goes UP rather than staying where the last assessor left it.
 *
 * Where nothing has moved, the factor still is not a constant: it grades how old
 * the assessment behind the finding is, because evidence decays even when the
 * configuration does not.
 */
function currencyFactor(
  f: Finding,
  node: CompositionNode | null,
  asOf: string,
): BuiltFactor | { caveat: string } {
  if (!node) {
    return {
      caveat:
        "Evidence currency could not be computed: with no composition node there is no configuration item for the change log to invalidate. The 0.10 currency weight is not applied.",
    };
  }

  const programId = node.program;
  const state = nodeImpact(programId, node.id);
  const ageDays = Math.round((stampOf(asOf) - stampOf(f.assessment.assessedOn)) / 86_400_000);
  const stale = ageDays > 180 ? 0.4 : ageDays > 90 ? 0.25 : 0.15;

  const ageSentence = Number.isFinite(ageDays)
    ? `The determination was taken by ${f.assessment.assessedBy} on ${f.assessment.assessedOn}, ${ageDays} day${ageDays === 1 ? "" : "s"} before ${asOf}`
    : `The determination was taken by ${f.assessment.assessedBy} on ${f.assessment.assessedOn}`;

  if (!state) {
    return {
      factor: factor(
        "currency",
        `Current, evidence ${ageDays} days old`,
        stale,
        `No unacknowledged Significant change touches ${node.id} ${node.name}, so the configuration the evidence was taken against is still the one in force. ${ageSentence}, which is ${ageDays > 180 ? "old enough to owe a re-test on age alone" : ageDays > 90 ? "beginning to age" : "recent"}.`,
        [node.id, ...f.assessment.evidence],
      ),
    };
  }

  const value = Math.max(stale, impactValue[state]);
  const evidenceClause = f.mitigation
    ? ` The compensating control this finding claims credit for — "${f.mitigation}" — was evidenced against that configuration and is no longer proven.`
    : "";
  const rationale =
    state === "Invalidated"
      ? `${node.id} ${node.name} is INVALIDATED by the change log: a Significant change against the authorized baseline moved this component after the determination was taken, so the configuration the assessment describes is no longer the one running.${evidenceClause} The evidence does not hold, so the residual rises rather than staying where the last assessor left it. ${ageSentence}.`
      : `${node.id} ${node.name} is SUSPECT: a Significant change reaches it — through containment ascent or a critical connection, or staged in a candidate build that has not shipped — so the determination stands and is flagged rather than withdrawn. That is worth roughly half the movement an outright invalidation is worth. ${ageSentence}.`;

  return {
    factor: factor("currency", state, value, rationale, [node.id, ...f.assessment.evidence]),
    baseline: {
      value: stale,
      why: `${node.id} ${nameOf(node.id)} is ${state.toLowerCase()} by an unacknowledged Significant change.`,
    },
  };
}

/* ── Assembly ────────────────────────────────────────────────────────────── */

function dedupe(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => id && id !== "—"))];
}

function isCaveat(value: BuiltFactor | { caveat: string }): value is { caveat: string } {
  return "caveat" in value;
}

function leverageFor(subject: string, kind: "Finding" | "Risk", factors: ScoreFactor[]): string {
  const positive = factors
    .filter((x) => x.weight > 0)
    .slice()
    .sort((a, b) => b.contribution - a.contribution);
  const top = positive[0];
  const noun = kind === "Finding" ? subject : `the findings under ${subject}`;
  if (!top) {
    return `Nothing can be computed for ${subject}, so there is no leverage to name — resolve the missing inputs first.`;
  }
  const credit = factors.find((x) => x.key === "mitigation");
  const creditTail =
    credit && credit.contribution === 0
      ? " No mitigation credit is being claimed at all, so a written and evidenced compensating control is worth up to 20 points on its own."
      : "";

  switch (top.key) {
    case "severity":
      return `Remediating ${noun} outright removes the ${top.contribution}-point severity term, which is the largest single contributor; no compensating control can offset more than 20 points of it.${creditTail}`;
    case "mission": {
      // `missionFactor` emits exactly three input shapes, and only the first
      // has an effect on file to re-run against. Telling a reader to re-run a
      // scenario that recorded nothing — or that recorded a refusal already at
      // the floor — is advice about evidence the subject does not have.
      const refused = top.input.endsWith("adversary achieved no effect");
      const noEffect = top.input.endsWith("no confirmed effect");
      if (noEffect)
        return `The ${top.contribution}-point mission term is driven by ${top.input.toLowerCase()} — no mission effect on file reaches this component or any scenario path through it, so the term rests on the criticality grade alone. Re-scoping the criticality analysis, or reducing the component's mission role so the grade drops, is what moves it; exercising a scenario against it and recording a refused objective is the only other move. Patching does not touch this term.${creditTail}`;
      if (refused)
        return `The ${top.contribution}-point mission term is driven by ${top.input.toLowerCase()} — the scenario was run and the objective refused, so the term is already at its floor for that path and re-running it buys nothing. Only the criticality grade underneath it can move it further.${creditTail}`;
      return `The ${top.contribution}-point mission term is driven by ${top.input.toLowerCase()} — restoring an operator workaround and re-running the scenario to show the effect no longer lands is what moves it, not patching alone.${creditTail}`;
    }
    case "exploitability":
      return `Exploitability contributes ${top.contribution} points on the strength of ${top.input.toLowerCase()}; upgrading the component past the affected version is the only thing that retires that input.${creditTail}`;
    case "exposure":
      return `Exposure contributes ${top.contribution} points because of ${top.input.toLowerCase()} — cutting or authenticating the inbound path named in the rationale removes the reachability the score rests on, without touching the weakness itself.${creditTail}`;
    case "currency":
      return `Currency contributes ${top.contribution} points because the configuration moved under the evidence; re-running the assessment against the current baseline and acknowledging the change restores it.${creditTail}`;
    default:
      return `The largest term on ${subject} is ${top.label.toLowerCase()} at ${top.contribution} points.${creditTail}`;
  }
}

function assemble(
  subject: string,
  kind: "Finding" | "Risk",
  built: ScoreFactor[],
  caveats: string[],
): ResidualScore {
  const ordered = factorOrder
    .map((key) => built.find((x) => x.key === key))
    .filter((x): x is ScoreFactor => x !== undefined);

  const raw = ordered.reduce((sum, x) => sum + x.contribution, 0);
  const score = clampScore(raw);
  const positiveRaw = ordered
    .filter((x) => x.weight > 0)
    .reduce((sum, x) => sum + x.contribution, 0);
  const inherent = clampScore(positiveRaw);

  const notes = [...caveats];
  if (score !== raw) {
    notes.push(
      `The factor contributions sum to ${raw}, which falls outside the 0-100 range; the published score is clamped to ${score}. Read the factor table for the arithmetic.`,
    );
  }

  return {
    subject,
    kind,
    score,
    band: bandFor(score),
    factors: ordered,
    inherent,
    leverage: leverageFor(subject, kind, ordered),
    caveats: notes,
  };
}

/* ── Public scoring ──────────────────────────────────────────────────────── */

function buildFindingFactors(
  f: Finding,
  asOf: string,
): { built: BuiltFactor[]; caveats: string[] } {
  const node = nodeOf(f);
  const caveats: string[] = [];
  const built: BuiltFactor[] = [
    severityFactor(f),
    mitigationFactor(f),
    exploitabilityFactor(f, node),
  ];

  for (const candidate of [
    exposureFactor(node),
    missionFactor(f, node),
    currencyFactor(f, node, asOf),
  ]) {
    if (isCaveat(candidate)) caveats.push(candidate.caveat);
    else built.push(candidate);
  }

  if (!f.node && node) {
    caveats.push(
      `${f.id} names no part, so exposure, mission impact and currency were read against its asset anchor ${node.id} (${node.name}) rather than against the exact component. The three factors are whole-asset readings.`,
    );
  }

  // A withdrawn or closed finding is still scored — the trail has to survive
  // closure, and an assessor comparing a re-opened finding against its old
  // score needs the old score to exist. It is NOT part of what the program is
  // carrying, and saying so here is what stops the number being read as if it
  // were.
  if (!isDeficiency(f)) {
    caveats.push(
      f.lifecycle === "False positive"
        ? `${f.id} was withdrawn as a false positive, so this is the residual the reported condition WOULD have carried, not risk the program is holding. It is excluded from the aggregate in \`programRiskPosture\`.`
        : `${f.id} is ${f.lifecycle.toLowerCase()}, so this is the residual the condition carried while it was open rather than risk the program is holding today. It is excluded from the aggregate in \`programRiskPosture\`.`,
    );
  }
  return { built, caveats };
}

export function scoreFinding(findingId: string, asOf: string = datasetToday): ResidualScore | null {
  const f = findings.find((x) => x.id === findingId);
  if (!f) return null;
  const { built, caveats } = buildFindingFactors(f, asOf);
  return assemble(
    f.id,
    "Finding",
    built.map((b) => b.factor),
    caveats,
  );
}

/**
 * A risk takes the WORST of its member findings on every factor, and the
 * rationale names which finding drove it. A risk is not more mitigated than its
 * least-mitigated component, which is why the same "highest contribution wins"
 * rule works for the credit too: the largest (least negative) contribution is
 * the weakest credit in the set.
 *
 * A risk with no finding joined to it returns null. Scoring it from its authored
 * likelihood and impact would be exactly the laundering this module exists to
 * prevent — the authored numbers are shown as authored, never re-badged as
 * computed.
 */
export function scoreRisk(riskId: string, asOf: string = datasetToday): ResidualScore | null {
  const risk = riskById.get(riskId);
  if (!risk) return null;
  const members = findingsForRisk(riskId);
  if (members.length === 0) return null;

  const perFinding = members.map((f) => ({ f, ...buildFindingFactors(f, asOf) }));
  const caveats = dedupe(perFinding.flatMap((m) => m.caveats));

  // Two passes. Every winner has to be known BEFORE any rationale is composed,
  // because the severity row's wording depends on whether the credit row on the
  // same table was won by the same finding — and severity is built first.
  type Winner = { finding: string; factor: ScoreFactor; others: number };
  const winners = new Map<FactorKey, Winner>();
  for (const key of factorOrder) {
    const candidates = perFinding
      .map((m) => ({ finding: m.f.id, factor: m.built.find((b) => b.factor.key === key)?.factor }))
      .filter((c): c is { finding: string; factor: ScoreFactor } => c.factor !== undefined)
      .sort((a, b) => b.factor.contribution - a.factor.contribution);
    const winner = candidates[0];
    if (!winner) {
      caveats.push(
        `No member finding of ${riskId} could be scored on ${factorLabels[key].toLowerCase()}, so the ${factorWeights[key]} weight is not applied to the aggregate.`,
      );
      continue;
    }
    winners.set(key, { ...winner, others: candidates.length - 1 });
  }

  const sevWinner = winners.get("severity");
  const mitWinner = winners.get("mitigation");
  const sevFinding = perFinding.find((m) => m.f.id === sevWinner?.finding)?.f;
  // The aggregate takes the worst member on every factor independently, so the
  // severity row and the credit row can come from different findings. When they
  // do, the severity row must not point at a credit line that is not its own,
  // and the credit row has to say where the missing points went.
  const mix =
    sevWinner &&
    mitWinner &&
    sevFinding &&
    sevWinner.finding !== mitWinner.finding &&
    sevFinding.rawSeverity !== sevFinding.mitigatedSeverity
      ? {
          sevFinding,
          sevId: sevWinner.finding,
          mitId: mitWinner.finding,
          credit:
            perFinding
              .find((m) => m.f.id === sevWinner.finding)
              ?.built.find((b) => b.factor.key === "mitigation")?.factor.contribution ?? 0,
        }
      : null;

  const factors: ScoreFactor[] = [];
  for (const key of factorOrder) {
    const winner = winners.get(key);
    if (!winner) continue;
    const others = winner.others;
    const base =
      mix && key === "severity" ? severityFactor(mix.sevFinding, false).factor : winner.factor;
    const mixTail =
      mix && key === "mitigation"
        ? ` The severity term above was read from ${mix.sevId}, whose own credit of ${Math.abs(mix.credit)} points is not carried here: the aggregate takes the least-mitigated member, ${mix.mitId}.`
        : "";
    factors.push({
      ...base,
      rationale:
        `Worst of the ${members.length} finding${members.length === 1 ? "" : "s"} under ${riskId} is ${winner.finding}${others > 0 ? ` (${others} other${others === 1 ? "" : "s"} score lower on this factor)` : ""}. ` +
        base.rationale +
        mixTail,
      evidence: dedupe([winner.finding, ...base.evidence]),
    });
  }

  const score = assemble(risk.id, "Risk", factors, caveats);
  return score;
}

/* ── Authored versus computed ────────────────────────────────────────────── */

export type AuthoredComparison = {
  risk: string;
  /** What the assessor wrote in the register. Never overwritten. */
  authored: { inherent: number; residual: number; likelihood: number; impact: number };
  /** What this module derives from the evidence, beside it. */
  computed: { inherent: number; residual: number; band: RiskBand };
  /** computed.residual - authored.residual. */
  delta: number;
  note: string;
};

/**
 * The authored register numbers and the computed ones, side by side. Tranche 1
 * kept scanner-declared counts beside register-tracked ones for the same
 * reason: collapsing one into the other erases the question, and the question
 * is the product.
 */
export function authoredComparison(
  riskId: string,
  asOf: string = datasetToday,
): AuthoredComparison | null {
  const risk = riskById.get(riskId);
  if (!risk) return null;
  const computed = scoreRisk(riskId, asOf);
  if (!computed) return null;
  const delta = computed.score - risk.residual;
  const size = Math.abs(delta);
  const note =
    size <= 5
      ? `The assessor's residual of ${risk.residual} and the computed residual of ${computed.score} agree within ${size} point${size === 1 ? "" : "s"}. The evidence supports the number that was written down.`
      : delta > 0
        ? `The computed residual of ${computed.score} sits ${size} points ABOVE the assessor's ${risk.residual}. The evidence carries more weight than the register does — read the factor table before adjusting either, because one of them is wrong and the disagreement is the finding.`
        : `The computed residual of ${computed.score} sits ${size} points BELOW the assessor's ${risk.residual}. The assessor is holding a judgement the evidence does not carry on its own, which may be entirely right — it is recorded here so that it is a decision rather than an accident.`;
  return {
    risk: risk.id,
    authored: {
      inherent: risk.inherent,
      residual: risk.residual,
      likelihood: risk.likelihood,
      impact: risk.impact,
    },
    computed: { inherent: computed.inherent, residual: computed.score, band: computed.band },
    delta,
    note,
  };
}

/* ── Program posture ─────────────────────────────────────────────────────── */

export type RiskMover = { subject: string; from: number; to: number; why: string };

export type ProgramRiskPosture = {
  scored: number;
  unscored: number;
  byBand: { band: RiskBand; count: number }[];
  /** Worst 10, highest score first. */
  top: ResidualScore[];
  /** Aggregate residual, weighted by mission criticality. */
  aggregate: number;
  /** Findings whose score moved because of an invalidation or a KEV listing. */
  movers: RiskMover[];
  /** Risks whose computed residual differs from the authored one. */
  disagreements: AuthoredComparison[];
};

const bandOrder: RiskBand[] = ["Very high", "High", "Moderate", "Low", "Very low"];

function findingsForProgram(programId: string): Finding[] {
  return findings.filter((f) => programOf(f) === programId);
}

/**
 * The counterfactual score: what this finding would score if nothing had
 * invalidated its evidence and no KEV listing sat above its component. The
 * difference is what `movers` reports, and it is computed by re-running the
 * same assembly with the recorded baseline values rather than by a second
 * scoring model.
 */
function moverFor(f: Finding, asOf: string): RiskMover | null {
  const { built, caveats } = buildFindingFactors(f, asOf);
  const moved = built.filter((b) => b.baseline !== undefined);
  if (moved.length === 0) return null;

  const to = assemble(
    f.id,
    "Finding",
    built.map((b) => b.factor),
    caveats,
  ).score;
  const from = assemble(
    f.id,
    "Finding",
    built.map((b) =>
      b.baseline
        ? factor(
            b.factor.key,
            b.factor.input,
            b.baseline.value,
            b.factor.rationale,
            b.factor.evidence,
          )
        : b.factor,
    ),
    caveats,
  ).score;
  if (from === to) return null;

  return {
    subject: f.id,
    from,
    to,
    why: moved
      .map((b) => b.baseline?.why ?? "")
      .filter(Boolean)
      .join(" "),
  };
}

export function programRiskPosture(
  programId: string,
  asOf: string = datasetToday,
): ProgramRiskPosture {
  const pool = findingsForProgram(programId);
  const scores: ResidualScore[] = [];
  let unscored = 0;
  for (const f of pool) {
    const score = scoreFinding(f.id, asOf);
    if (score) scores.push(score);
    else unscored += 1;
  }

  const counts = new Map<RiskBand, number>();
  for (const s of scores) counts.set(s.band, (counts.get(s.band) ?? 0) + 1);

  // The aggregate is taken over DEFICIENCIES only. A closed finding and a
  // withdrawn false positive are both still scored — the trail has to survive
  // closure — but neither is part of what the program is carrying today.
  const live = scores.filter((s) => {
    const f = findings.find((x) => x.id === s.subject);
    return f ? isDeficiency(f) : false;
  });
  let weightSum = 0;
  let weighted = 0;
  for (const s of live) {
    const f = findings.find((x) => x.id === s.subject);
    const node = f ? nodeOf(f) : null;
    const w = node ? criticalityValue[node.criticality] : 0.5;
    weightSum += w;
    weighted += s.score * w;
  }
  const aggregate = weightSum > 0 ? Math.round(weighted / weightSum) : 0;

  const movers: RiskMover[] = [];
  for (const f of pool) {
    const mover = moverFor(f, asOf);
    if (mover) movers.push(mover);
  }
  movers.sort((a, b) => b.to - b.from - (a.to - a.from));

  const disagreements: AuthoredComparison[] = [];
  for (const risk of registerRisks) {
    if (risk.program !== programId) continue;
    const comparison = authoredComparison(risk.id, asOf);
    if (comparison && Math.abs(comparison.delta) > 5) disagreements.push(comparison);
  }
  disagreements.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    scored: scores.length,
    unscored,
    byBand: bandOrder.map((band) => ({ band, count: counts.get(band) ?? 0 })),
    top: scores
      .slice()
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.subject.localeCompare(b.subject),
      )
      .slice(0, 10),
    aggregate,
    movers,
    disagreements,
  };
}

/** Every register risk of a program that can be scored, worst first. */
export function scoredRisks(programId: string, asOf: string = datasetToday): ResidualScore[] {
  const out: ResidualScore[] = [];
  for (const risk of registerRisks) {
    if (risk.program !== programId) continue;
    const score = scoreRisk(risk.id, asOf);
    if (score) out.push(score);
  }
  return out.sort((a, b) => b.score - a.score);
}

/** The authored register row behind a computed risk score, for side-by-side display. */
export function authoredRisk(riskId: string): RegisterRisk | null {
  return riskById.get(riskId) ?? null;
}
