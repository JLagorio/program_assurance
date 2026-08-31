/**
 * Chunk 9b of the CCI spine — posture over the composition graph.
 *
 * `composition.ts` says what the system is made of; `findings.ts` says what is
 * wrong with it. This module is the join, and it is the only place allowed to
 * hold both at once: `findings → spine`, `composition → spine`,
 * `graph-posture → findings + composition`. Nothing here may be imported back
 * into either of its two inputs.
 *
 * Invariants held here:
 *  - Rollup is a SET UNION of finding ids over the subtree, never a sum of
 *    per-node counters. A finding that sits on a part is counted once at the
 *    part, once at the host and once at the system — not three times at the
 *    system because three ancestors each added it in.
 *  - Open counts are taken on `mitigatedSeverity`, the value the AO actually
 *    adjudicates, and only over open lifecycles. A closed CAT I must not keep a
 *    node red forever.
 *  - A finding lands on the node it names. When it names none — or names one
 *    that no longer exists — it falls back to its asset's anchor node, so an
 *    ingested finding is visible before it has resolved a part.
 *  - Scanner-declared counts on `Asset` and register-derived counts from this
 *    module are never reconciled by overwriting one with the other. The delta
 *    is the product: `inventoryReconciliation` states it in a sentence.
 *  - Every selector reads OVERRIDE-RESOLVED nodes through the composition
 *    store's selectors, never the raw seed array, and every memo is keyed on
 *    `graphVersion()` so a runtime re-classification is never served stale.
 */

import type { Tone } from "@/components/app/ui";
import type {
  BomSource,
  CompositionEdge,
  CompositionNode,
  EdgeKind,
  NodeClass,
  SupplierOrigin,
} from "@/lib/composition";
import {
  ancestorsOf,
  bomDocuments,
  compositionNodes,
  crossesBoundary,
  descendantsOf,
  edgesTo,
  graphVersion,
  nodeForAsset,
  nodesForProgram,
  trustRank,
} from "@/lib/composition";
import type { Finding } from "@/lib/findings";
import { assets, findings, isOpen } from "@/lib/findings";
import type { FindingSeverity } from "@/lib/spine";

export type SeverityCounts = {
  catI: number;
  catII: number;
  catIII: number;
  open: number;
  total: number;
};

export type NodePosture = {
  node: string;
  /** Findings recorded directly against this node. */
  own: SeverityCounts;
  /** own plus every descendant, de-duplicated by finding id. */
  rolled: SeverityCounts;
  /** Open finding ids in the subtree, worst-severity first. */
  openFindings: string[];
  /** Node count of the subtree, including this node. */
  nodes: number;
  worst: FindingSeverity | null;
  /** The deepest node carrying the worst open finding — link the user to the part, not the host. */
  worstNode: string | null;
  /** Distinct suppliers in the subtree, sorted. */
  suppliers: string[];
  /** Subtree parts with attested === false. */
  unattested: number;
};

/* ── Severity ordering ───────────────────────────────────────────────────── */

const severityRank: Record<FindingSeverity, number> = { "CAT I": 0, "CAT II": 1, "CAT III": 2 };

const emptyCounts = (): SeverityCounts => ({ catI: 0, catII: 0, catIII: 0, open: 0, total: 0 });

/**
 * `total` is every finding regardless of lifecycle; the three CAT buckets and
 * `open` count OPEN findings only, on `mitigatedSeverity`.
 */
function countOf(list: Finding[]): SeverityCounts {
  const counts = emptyCounts();
  counts.total = list.length;
  for (const f of list) {
    if (!isOpen(f)) continue;
    counts.open += 1;
    if (f.mitigatedSeverity === "CAT I") counts.catI += 1;
    else if (f.mitigatedSeverity === "CAT II") counts.catII += 1;
    else counts.catIII += 1;
  }
  return counts;
}

/* ── Version-keyed memo ──────────────────────────────────────────────────── */

const postureCache = new Map<string, NodePosture>();
let cachedVersion = -1;
let resolvedNodes: Map<string, CompositionNode> | null = null;
let attachments: Map<string, Finding[]> | null = null;

/** Drops every memo. Called for free whenever `graphVersion()` moves. */
export function invalidatePostureCache() {
  postureCache.clear();
  resolvedNodes = null;
  attachments = null;
  cachedVersion = -1;
}

function ensureFresh(): number {
  const version = graphVersion();
  if (version !== cachedVersion) {
    postureCache.clear();
    resolvedNodes = null;
    attachments = null;
    cachedVersion = version;
  }
  return version;
}

/**
 * Every node in the graph, override-resolved. Built by unioning
 * `nodesForProgram` over the programs the seed names, so the store's patches
 * are always applied — the raw `compositionNodes` array is read for its
 * immutable `program` field and nothing else.
 */
function resolvedIndex(): Map<string, CompositionNode> {
  ensureFresh();
  if (resolvedNodes) return resolvedNodes;
  const index = new Map<string, CompositionNode>();
  const programIds = new Set(compositionNodes.map((n) => n.program));
  for (const programId of programIds) {
    for (const node of nodesForProgram(programId)) index.set(node.id, node);
  }
  resolvedNodes = index;
  return index;
}

function resolveNode(nodeId: string): CompositionNode | null {
  return resolvedIndex().get(nodeId) ?? null;
}

/** The node a finding hangs on: the part it names, else its asset's anchor. */
function attachNodeOf(f: Finding): string | null {
  if (f.node && resolveNode(f.node)) return f.node;
  return nodeForAsset(f.asset)?.id ?? null;
}

function attachmentIndex(): Map<string, Finding[]> {
  ensureFresh();
  if (attachments) return attachments;
  const index = new Map<string, Finding[]>();
  for (const f of findings) {
    const target = attachNodeOf(f);
    if (!target) continue;
    const bucket = index.get(target);
    if (bucket) bucket.push(f);
    else index.set(target, [f]);
  }
  attachments = index;
  return index;
}

/** Depth from the root, root itself being 0. */
function depthOf(nodeId: string): number {
  return ancestorsOf(nodeId).length;
}

/* ── Posture ─────────────────────────────────────────────────────────────── */

function emptyPosture(nodeId: string): NodePosture {
  return {
    node: nodeId,
    own: emptyCounts(),
    rolled: emptyCounts(),
    openFindings: [],
    nodes: 0,
    worst: null,
    worstNode: null,
    suppliers: [],
    unattested: 0,
  };
}

export function postureOf(nodeId: string): NodePosture {
  const version = ensureFresh();
  const key = `${version}:${nodeId}`;
  const hit = postureCache.get(key);
  if (hit) return hit;

  const self = resolveNode(nodeId);
  if (!self) {
    const miss = emptyPosture(nodeId);
    postureCache.set(key, miss);
    return miss;
  }

  const subtree = [self, ...descendantsOf(nodeId)];
  const index = attachmentIndex();

  // Set union by finding id — never a sum of per-node counters.
  const rolledById = new Map<string, Finding>();
  for (const node of subtree) {
    for (const f of index.get(node.id) ?? []) rolledById.set(f.id, f);
  }
  const rolledList = [...rolledById.values()];

  const openList = rolledList.filter(isOpen);
  openList.sort((a, b) => {
    const bySev = severityRank[a.mitigatedSeverity] - severityRank[b.mitigatedSeverity];
    return bySev !== 0 ? bySev : a.id.localeCompare(b.id);
  });

  let worst: FindingSeverity | null = null;
  let worstNode: string | null = null;
  let worstDepth = -1;
  for (const f of openList) {
    if (worst === null || severityRank[f.mitigatedSeverity] < severityRank[worst]) {
      worst = f.mitigatedSeverity;
      worstNode = null;
      worstDepth = -1;
    }
    if (f.mitigatedSeverity !== worst) continue;
    const attached = attachNodeOf(f);
    if (!attached) continue;
    const depth = depthOf(attached);
    if (depth > worstDepth) {
      worstDepth = depth;
      worstNode = attached;
    }
  }

  const supplierSet = new Set<string>();
  let unattested = 0;
  for (const node of subtree) {
    supplierSet.add(node.supplier);
    if (!node.attested) unattested += 1;
  }

  const posture: NodePosture = {
    node: nodeId,
    own: countOf(index.get(nodeId) ?? []),
    rolled: countOf(rolledList),
    openFindings: openList.map((f) => f.id),
    nodes: subtree.length,
    worst,
    worstNode,
    suppliers: [...supplierSet].sort((a, b) => a.localeCompare(b)),
    unattested,
  };
  postureCache.set(key, posture);
  return posture;
}

export function assetPosture(assetId: string): NodePosture | null {
  const anchor = nodeForAsset(assetId);
  return anchor ? postureOf(anchor.id) : null;
}

export function postureTone(p: NodePosture): Tone {
  if (p.rolled.catI > 0) return "danger";
  if (p.rolled.catII > 0) return "warning";
  if (p.rolled.open === 0) return "success";
  return "neutral";
}

/* ── Inventory reconciliation ────────────────────────────────────────────── */

export type ReconciliationRow = {
  asset: string;
  name: string;
  /** What the scanner declared on the asset row. */
  declared: { catI: number; catII: number; catIII: number; total: number };
  /** What the finding register actually carries for the subtree. */
  derived: { catI: number; catII: number; catIII: number; total: number };
  delta: number;
  agrees: boolean;
  /** One package-facing sentence, e.g. "17 scanner-declared open items are not in the register." */
  note: string;
};

function split(catI: number, catII: number, catIII: number): string {
  return `${catI} CAT I, ${catII} CAT II, ${catIII} CAT III`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function reconciliationNote(row: Omit<ReconciliationRow, "note">, lastScan: string): string {
  const { name, declared, derived, delta } = row;
  if (declared.total === 0 && derived.total === 0) {
    return `The ${lastScan} scan of ${name} declared no open items and the register carries none, so there is nothing to reconcile.`;
  }
  if (delta > 0) {
    const carried =
      derived.total === 0
        ? "the register carries no open findings against it"
        : `the register carries ${derived.total} (${split(derived.catI, derived.catII, derived.catIII)})`;
    const tail = plural(
      delta,
      `${delta} scanner-declared open item is not tracked as an open finding`,
      `${delta} scanner-declared open items are not tracked as open findings`,
    );
    return `${name} declared ${declared.total} open ${plural(declared.total, "item", "items")} at the ${lastScan} scan (${split(declared.catI, declared.catII, declared.catIII)}) and ${carried} — ${tail}.`;
  }
  if (delta < 0) {
    const extra = -delta;
    const tail = plural(
      extra,
      `${extra} tracked finding is not reflected in the scan counts`,
      `${extra} tracked findings are not reflected in the scan counts`,
    );
    return `The register carries ${derived.total} open ${plural(derived.total, "finding", "findings")} against ${name} (${split(derived.catI, derived.catII, derived.catIII)}) but the ${lastScan} scan declared only ${declared.total} — ${tail}.`;
  }
  if (row.agrees) {
    return `Scanner and register agree on ${name} at ${declared.total} open ${plural(declared.total, "item", "items")} (${split(declared.catI, declared.catII, declared.catIII)}).`;
  }
  return `${name} totals agree at ${declared.total}, but the severity split does not: the ${lastScan} scan declared ${split(declared.catI, declared.catII, declared.catIII)} against the register's ${split(derived.catI, derived.catII, derived.catIII)}.`;
}

/**
 * Scanner-declared open counts against register-tracked open counts, per asset,
 * for one program. Both columns are kept: the delta is what the package has to
 * explain, and collapsing one into the other would erase the question.
 */
export function inventoryReconciliation(programId: string): ReconciliationRow[] {
  ensureFresh();
  const rows: ReconciliationRow[] = [];
  for (const asset of assets) {
    if (asset.program !== programId) continue;
    const posture = assetPosture(asset.id);
    const declared = {
      catI: asset.openCatI,
      catII: asset.openCatII,
      catIII: asset.openCatIII,
      total: asset.openCatI + asset.openCatII + asset.openCatIII,
    };
    const derived = {
      catI: posture?.rolled.catI ?? 0,
      catII: posture?.rolled.catII ?? 0,
      catIII: posture?.rolled.catIII ?? 0,
      total: posture?.rolled.open ?? 0,
    };
    const base = {
      asset: asset.id,
      name: asset.name,
      declared,
      derived,
      delta: declared.total - derived.total,
      agrees:
        declared.catI === derived.catI &&
        declared.catII === derived.catII &&
        declared.catIII === derived.catIII,
    };
    rows.push({ ...base, note: reconciliationNote(base, asset.lastScan) });
  }
  return rows;
}

/* ── Exposure ────────────────────────────────────────────────────────────── */

export type ExposurePath = {
  entry: string;
  hops: CompositionEdge[];
  zonesCrossed: number;
  critical: boolean;
};

/** Containment reaches inward: an edge landing on a container reaches the part. */
const exposureKinds = new Set<EdgeKind>(["Connects to", "Flows to"]);

function containmentClosure(nodeId: string): string[] {
  const self = resolveNode(nodeId);
  if (!self) return [];
  return [self.id, ...ancestorsOf(nodeId).map((n) => n.id)];
}

/**
 * Inbound reachability into `nodeId` from less-trusted ground, walked backwards
 * over `Connects to` / `Flows to` edges. A hop is only taken when its source
 * sits at or below its target's trust rank, and a path is only kept when some
 * node on it is strictly less trusted than the target itself — otherwise it is
 * lateral movement inside one zone, not exposure across a boundary. An edge
 * that lands on an ancestor counts, because reaching the chassis reaches the
 * package inside it.
 */
export function exposurePathsTo(nodeId: string, maxHops = 4): ExposurePath[] {
  ensureFresh();
  const target = resolveNode(nodeId);
  if (!target) return [];
  const targetRank = trustRank(target.zone);

  type Step = { at: string; hops: CompositionEdge[]; minRank: number; seen: Set<string> };
  const out: ExposurePath[] = [];
  const emitted = new Set<string>();
  let frontier: Step[] = [{ at: nodeId, hops: [], minRank: targetRank, seen: new Set([nodeId]) }];

  for (let hop = 0; hop < Math.max(0, maxHops) && frontier.length > 0; hop += 1) {
    const next: Step[] = [];
    for (const step of frontier) {
      for (const landing of containmentClosure(step.at)) {
        for (const edge of edgesTo(landing)) {
          if (!exposureKinds.has(edge.kind)) continue;
          if (step.seen.has(edge.from)) continue;
          const from = resolveNode(edge.from);
          const to = resolveNode(edge.to);
          if (!from || !to) continue;
          if (trustRank(from.zone) > trustRank(to.zone)) continue;

          const hops = [edge, ...step.hops];
          const key = hops.map((h) => `${h.from}>${h.to}`).join("|");
          if (emitted.has(key)) continue;
          emitted.add(key);

          const minRank = Math.min(step.minRank, trustRank(from.zone));
          if (minRank < targetRank) {
            out.push({
              entry: edge.from,
              hops,
              zonesCrossed: hops.filter(crossesBoundary).length,
              critical: hops.every((h) => h.critical),
            });
          }
          const seen = new Set(step.seen);
          seen.add(edge.from);
          next.push({ at: edge.from, hops, minRank, seen });
        }
      }
    }
    frontier = next;
  }

  out.sort((a, b) => {
    const aRank = trustRank(resolveNode(a.entry)?.zone ?? target.zone);
    const bRank = trustRank(resolveNode(b.entry)?.zone ?? target.zone);
    if (aRank !== bRank) return aRank - bRank;
    if (a.hops.length !== b.hops.length) return a.hops.length - b.hops.length;
    return a.entry.localeCompare(b.entry);
  });
  return out;
}

/* ── BOM statistics ──────────────────────────────────────────────────────── */

export type BomStats = {
  nodes: number;
  byClass: { class: NodeClass; count: number }[];
  bySource: { source: BomSource; count: number }[];
  byOrigin: { origin: SupplierOrigin; count: number }[];
  suppliers: number;
  unattested: number;
  unsignedBoms: number;
  missionCritical: number;
};

const classOrder: NodeClass[] = ["System", "Hardware", "Firmware", "Software"];
const sourceOrder: BomSource[] = [
  "CycloneDX",
  "SPDX",
  "Hardware part list",
  "Firmware manifest",
  "Declared",
  "Discovery scan",
];
const originOrder: SupplierOrigin[] = ["Internal", "Domestic", "Allied", "Foreign", "Unknown"];

function tally<T extends string>(order: T[], values: T[]): { key: T; count: number }[] {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const rows: { key: T; count: number }[] = [];
  for (const key of order) {
    const count = counts.get(key);
    if (count) rows.push({ key, count });
  }
  return rows;
}

export function bomStats(programId: string): BomStats {
  ensureFresh();
  const nodes = nodesForProgram(programId);
  const suppliers = new Set(nodes.map((n) => n.supplier));
  return {
    nodes: nodes.length,
    byClass: tally(
      classOrder,
      nodes.map((n) => n.class),
    ).map((r) => ({ class: r.key, count: r.count })),
    bySource: tally(
      sourceOrder,
      nodes.map((n) => n.bomSource),
    ).map((r) => ({ source: r.key, count: r.count })),
    byOrigin: tally(
      originOrder,
      nodes.map((n) => n.origin),
    ).map((r) => ({ origin: r.key, count: r.count })),
    suppliers: suppliers.size,
    unattested: nodes.filter((n) => !n.attested).length,
    unsignedBoms: bomDocuments.filter((b) => b.program === programId && !b.signed).length,
    missionCritical: nodes.filter((n) => n.criticality === "Mission critical").length,
  };
}
