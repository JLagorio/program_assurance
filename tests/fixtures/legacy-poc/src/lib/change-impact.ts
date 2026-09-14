/**
 * Chunk 13b of the CCI spine — what a change invalidates in the traceability matrix.
 *
 * `@/lib/baselines` holds the pin (`BLD-`), the proposal to move it (`CHG-`) and
 * the cascade over the composition graph. This module is the layer above it: the
 * part of the analysis that has to name what stops being true, and a
 * determination is only ever named by an `SctmRow.key`. That is the whole reason
 * it is a separate file — `sctm.ts` reads the currency overlay from
 * `@/lib/baselines`, so anything that builds a matrix has to sit ABOVE the SCTM
 * rather than beside the change log. The layering runs one way, and only one
 * way: baselines -> sctm -> change-impact.
 *
 * Invariants held here:
 *  - **CM-3(2) is a gate, not a formality.** A change whose recorded security
 *    impact analysis says "None" or "Administrative" invalidates NOTHING. It
 *    still produces an audit record, because the reason forty rows did not turn
 *    amber is exactly as accountable as the reason they would have.
 *  - **A cascade is bounded by the build lifecycle, not just by the analysis.**
 *    A change the CCB has already absorbed into the authorized baseline cannot
 *    invalidate a determination taken after that approval, and a change staged in
 *    a candidate build has not reached the operating system at all, so it flags
 *    determinations rather than withdrawing them. See `postureOf`.
 *  - **The rows are built with the overlay suppressed, and the analysis is the
 *    only thing that may suppress it.** `withoutCurrencyOverlay` wraps the single
 *    call that builds the matrix, so the analysis always reads the base
 *    determination and the two modules cannot recurse through each other. No
 *    caller of `impactOf` wires anything: forgetting to would be the one failure
 *    mode worth designing against, so there is nothing to forget.
 *  - **Only a positive claim is retracted.** An invalidated Satisfied becomes
 *    "Not assessed" with the old value retained; an invalidated deficiency is
 *    left alone, because a change does not cure one and re-scoring it would sever
 *    the POA&M obligation. `buildSctm` applies the same rule to the row itself.
 *  - **`reopenCandidates` is a queue, never a mutation.** A finding closed
 *    against a configuration that no longer exists has not been proven closed
 *    against the one that does — but re-opening it is the assessor's decision.
 *  - Nothing here reads a clock. Every date is a seed string compared through
 *    `stampOf`, so the server and client renders agree.
 */

import {
  baselineVersion,
  changeById,
  changesForProgram,
  controlsFromProvider,
  evidenceCollectedOn,
  nodeName,
  postureOf,
  stampOf,
  touchedFor,
  withoutCurrencyOverlay,
  type ChangeImpact,
  type ChangeRecord,
  type RetestItem,
} from "@/lib/baselines";
import { objectivesForCci } from "@/lib/campaigns";
import { graphVersion } from "@/lib/composition";
import { controlMatrix } from "@/lib/control-matrix";
import { findings } from "@/lib/findings";
import { buildSctm, type ControlTextIndex, type SctmRow } from "@/lib/sctm";
import type { VerificationMethod } from "@/lib/spine";
import { proceduresForObjective } from "@/lib/test-execution";

/**
 * The 800-53A text index the impact analysis builds its rows from.
 *
 * `impactOf` names the rows it invalidates by `SctmRow.key`, and a key is only
 * useful if it resolves against the matrix the assessor actually reads. That
 * matrix rows per leaf assessment objective, which only exists once the 1.25 MB
 * catalog has been dynamic-imported — so the route that did the importing hands
 * the narrowed index here, and this module holds it rather than importing the
 * catalog itself and dragging it into every chunk. Until it is set the analysis
 * is control-grained, which is why `textVersion` is part of the cache identity:
 * results computed before the index arrived must be recomputed, never reused.
 */
let controlTextIndex: ControlTextIndex | null = null;
let textVersion = 0;

export function setControlTextIndex(next: ControlTextIndex): void {
  if (controlTextIndex === next) return;
  controlTextIndex = next;
  textVersion += 1;
}

const impactCache = new Map<string, ChangeImpact>();
const programCache = new Map<string, ChangeImpact[]>();
let cachedGraph = -1;
let cachedAck = -1;
let cachedText = -1;

function checkCaches() {
  const graph = graphVersion();
  const ack = baselineVersion();
  if (graph !== cachedGraph || ack !== cachedAck || textVersion !== cachedText) {
    impactCache.clear();
    programCache.clear();
    cachedGraph = graph;
    cachedAck = ack;
    cachedText = textVersion;
  }
}

function containedImpact(change: ChangeRecord): ChangeImpact {
  const verdict =
    change.impact === "None"
      ? "found no security impact"
      : "found the impact to be administrative only";
  return {
    change: change.id,
    contained: true,
    touched: [],
    invalidatedRows: [],
    suspectRows: [],
    invalidatedEvidence: [],
    reopenCandidates: [],
    invalidatedInheritance: [],
    retests: [],
    records: [
      {
        id: `INV-${change.id.slice(4)}-00`,
        scope: "Change",
        ref: change.id,
        from: "Proposed",
        to: "Contained",
        why: `CM-3(2) security impact analysis ${verdict}, so the change was not cascaded. ${change.analysis} No determination, evidence item or inheritance reference is invalidated by ${change.id}.`,
      },
    ],
  };
}

/**
 * The BASE matrix — the one the currency overlay has not been applied to.
 *
 * `withoutCurrencyOverlay` is what makes the two modules a layering rather than
 * a recursion, and it is also what makes the answer right: the analysis has to
 * see the determination this change would withdraw, not one another change has
 * already struck through. Suppression is a wrapper rather than a flag the caller
 * sets, so it cannot be left on and there is no second way to build these rows.
 */
function rowsFor(programId: string): SctmRow[] {
  return withoutCurrencyOverlay(
    () => buildSctm(programId, controlMatrix(programId), controlTextIndex).rows,
  );
}

/** TP- that can execute the requirement, when the campaign model knows one. */
function procedureFor(row: SctmRow, nodeId: string): string | null {
  if (row.unit !== "CCI") return null;
  const candidates = objectivesForCci(row.requirement).flatMap((o) => proceduresForObjective(o.id));
  if (candidates.length === 0) return null;
  return (candidates.find((p) => p.nodes.includes(nodeId)) ?? candidates[0]!).id;
}

export function impactOf(changeId: string, maxHops = 3): ChangeImpact | null {
  const change = changeById(changeId);
  if (!change) return null;

  checkCaches();
  const key = `${changeId}|${maxHops}`;
  const hit = impactCache.get(key);
  if (hit) return hit;

  // THE GATE. CM-3(2) says a change is analysed before it is cascaded, and an
  // analysis that finds no security impact is a result, not an omission. A UEFI
  // dot-release on a host whose determinations do not depend on the BIOS build
  // must not turn forty rows amber — and the reason it did not goes on the
  // record, because that is the part a reviewer has to be able to audit.
  if (change.impact !== "Significant") {
    const contained = containedImpact(change);
    impactCache.set(key, contained);
    return contained;
  }

  const touchedMap = touchedFor(change, maxHops);
  const touched = [...touchedMap.values()].sort(
    (a, b) => a.hops - b.hops || a.state.localeCompare(b.state) || a.node.localeCompare(b.node),
  );
  const invalidNodes = new Set(touched.filter((t) => t.state === "Invalidated").map((t) => t.node));
  const suspectNodes = new Set(touched.filter((t) => t.state === "Suspect").map((t) => t.node));

  const providerControls =
    change.kind === "Provider assessment"
      ? controlsFromProvider(change.program, change.subject)
      : new Set<string>();

  // Every ancestor chain terminates at the boundary root, and `allocationRule`
  // puts PE/PS/MP and every family with no node-level rule on that root alone.
  // Bare containment ascent onto a whole-system allocation therefore says only
  // "this program has an unacknowledged significant change" — a program-level
  // fact, rendered once per row as if it were a row-level one. Applied here as
  // well as in `rowCurrency` because this loop is the ledger the baseline page
  // reads: gating one and not the other would have the SCTM call a row Current
  // while the ledger recorded it going Suspect.
  const ascentOnlyNodes = new Set(touched.filter((t) => t.ascentOnly).map((t) => t.node));
  const reaches = (row: SctmRow, nodes: Set<string>) =>
    row.responsibleNodes.some(
      (id) => nodes.has(id) && !(ascentOnlyNodes.has(id) && row.systemAllocatedNodes.includes(id)),
    );

  // The build lifecycle decides what the cascade may do, not whether it runs.
  const { posture, asOf } = postureOf(change);
  const asOfStamp = stampOf(asOf);

  const rows = rowsFor(change.program);
  const invalidatedRowObjects: SctmRow[] = [];
  const suspectRowObjects: SctmRow[] = [];
  const incorporatedRowObjects: SctmRow[] = [];
  /**
   * Rows the cascade reaches head-on, before the lifecycle cap. A candidate
   * build withdraws nothing, but the regression campaign that has to run before
   * it ships owes exactly this work, so the re-test queue is built from here
   * rather than from what was withdrawn.
   */
  const retestRowObjects: SctmRow[] = [];

  for (const row of rows) {
    // An ODP is a property of the requirement, not of a component, so a
    // parameter change reaches every row of its control wherever the graph put
    // it. A provider re-assessment reaches every row inherited from that
    // provider, for the same reason.
    const hitsRequirement =
      (change.kind === "Control parameter" && row.control === change.subject) ||
      (change.kind === "Provider assessment" && providerControls.has(row.control));
    const invalidated = hitsRequirement || reaches(row, invalidNodes);
    const suspected = !invalidated && reaches(row, suspectNodes);
    if (!invalidated && !suspected) continue;

    // The determination was taken on or after the CCB baselined the result, so
    // it describes the configuration this change produced, not the one it
    // replaced. Same test `invalidatedEvidence` already applies to evidence,
    // extended to the determination the evidence supports.
    if (posture === "Incorporated" && stampOf(row.assessed) >= asOfStamp) {
      incorporatedRowObjects.push(row);
      continue;
    }
    if (invalidated) retestRowObjects.push(row);
    if (invalidated && posture !== "Candidate") {
      invalidatedRowObjects.push(row);
      continue;
    }
    suspectRowObjects.push(row);
  }

  const invalidatedRows = invalidatedRowObjects.map((r) => r.key);
  const suspectRows = suspectRowObjects.map((r) => r.key);

  // Evidence follows invalidation, not suspicion: a suspect row's determination
  // still stands, so the evidence behind it is not superseded. Evidence
  // collected after the change was requested survives — it describes the
  // configuration the change produced, not the one it replaced.
  const requestedStamp = stampOf(change.requested);
  const evidence = new Set<string>();
  for (const row of invalidatedRowObjects) {
    for (const id of row.evidence) {
      if (!id.startsWith("EVD-")) continue;
      const collected = evidenceCollectedOn(id);
      if (collected !== undefined && stampOf(collected) >= requestedStamp) continue;
      evidence.add(id);
    }
  }

  // A queue, never a mutation. A finding closed against a configuration that no
  // longer exists has not been proven closed against the one that does — but
  // re-opening it is the assessor's call.
  const reopen: string[] = [];
  for (const f of findings) {
    if (f.lifecycle !== "Closed") continue;
    const anchor = f.node ?? null;
    if (anchor === null) continue;
    if (!invalidNodes.has(anchor) && !suspectNodes.has(anchor)) continue;
    reopen.push(f.id);
  }

  const invalidatedInheritance =
    change.kind === "Provider assessment"
      ? [...providerControls]
          .sort()
          .map((control) => `${change.program}|${change.subject}|${control}`)
      : [];

  // Distinct (control, requirement, node, method) from the invalidated rows.
  const subjectLabel =
    change.node === "—" ? change.subject : `${nodeName(change.node)} (${change.node})`;
  const retestSeen = new Set<string>();
  const retests: RetestItem[] = [];
  for (const row of retestRowObjects) {
    const scoped = row.responsibleNodes.filter((n) => invalidNodes.has(n));
    const nodes = scoped.length > 0 ? scoped : row.responsibleNodes;
    const targets = nodes.length > 0 ? nodes : ["—"];
    for (const node of targets) {
      const method: VerificationMethod = row.method;
      const dedupe = `${row.control}|${row.requirement}|${node}|${method}`;
      if (retestSeen.has(dedupe)) continue;
      retestSeen.add(dedupe);
      retests.push({
        control: row.control,
        requirement: row.requirement,
        node,
        method,
        reason:
          posture === "Candidate"
            ? `${change.id} changes ${subjectLabel} — ${change.from} → ${change.to} — in ${change.build}, which is not the authorized baseline. The determination on file for ${row.requirement} still describes the configuration in force, so the row is re-tested before the candidate is authorized rather than withdrawn now.`
            : `${change.id} changes ${subjectLabel} — ${change.from} → ${change.to}. The determination on file for ${row.requirement} was taken against the configuration it replaces.`,
        procedure: node === "—" ? null : procedureFor(row, node),
      });
    }
  }

  let sequence = 0;
  const nextId = () => {
    sequence += 1;
    return `INV-${change.id.slice(4)}-${String(sequence).padStart(2, "0")}`;
  };

  const postureNote =
    posture === "Candidate"
      ? ` The change is filed against ${change.build}, which is not the authorized baseline: it has not shipped, so it flags the determinations on the configuration in force rather than withdrawing them.`
      : posture === "Incorporated"
        ? ` ${change.build} was authorized on ${asOf} with this change in it, so determinations taken on or after that date were taken against the configuration it produced; ${incorporatedRowObjects.length} row${incorporatedRowObjects.length === 1 ? " is" : "s are"} left standing on that basis.`
        : "";

  const records: ChangeImpact["records"] = [
    {
      id: `INV-${change.id.slice(4)}-00`,
      scope: "Change",
      ref: change.id,
      from: "Proposed",
      to: "Cascaded",
      why: `CM-3(2) security impact analysis found the change significant, so it was cascaded to ${touched.length} composition node${touched.length === 1 ? "" : "s"}, ${invalidatedRows.length} invalidated and ${suspectRows.length} suspect requirement row${suspectRows.length === 1 ? "" : "s"}.${postureNote} ${change.analysis}`,
    },
  ];

  if (incorporatedRowObjects.length > 0) {
    records.push({
      id: nextId(),
      scope: "Build",
      ref: change.build,
      from: "Proposed",
      to: "Incorporated",
      why: `${change.build} was authorized on ${asOf} with ${change.id} incorporated, so it is the configuration in force. ${incorporatedRowObjects.length} requirement row${incorporatedRowObjects.length === 1 ? " was" : "s were"} assessed on or after that date, against the configuration this change produced rather than the one it replaced, so ${incorporatedRowObjects.length === 1 ? "it is" : "they are"} not invalidated by it.`,
    });
  }

  for (const node of touched) {
    records.push({
      id: nextId(),
      scope: "Composition node",
      ref: node.node,
      from: "Current",
      to: node.state,
      why: node.reason,
    });
  }
  // Mirrors `buildSctm`'s overlay exactly, and carries the result as data. Only
  // a POSITIVE claim is withdrawn: a deficiency is retained and owed a re-test,
  // because re-scoring it to "Not assessed" would sever the POA&M obligation,
  // and "Not applicable" / "Not assessed" are not assessment results to retract.
  for (const row of invalidatedRowObjects) {
    const withdrawn = row.determination === "Satisfied";
    const deficiency = row.determination === "Other than satisfied";
    records.push({
      id: nextId(),
      scope: "SCTM row",
      ref: row.key,
      from: row.determination,
      to: "Invalidated",
      toDetermination: withdrawn ? "Not assessed" : row.determination,
      outcome: withdrawn
        ? "Withdrawn — not assessed"
        : deficiency
          ? "Retained — re-test owed"
          : "Unchanged — re-test owed",
      why: withdrawn
        ? `The determination was taken against the configuration ${change.id} replaces. It is retained as the prior determination and no longer counts toward coverage until the requirement is re-verified.`
        : deficiency
          ? `The determination was taken against the configuration ${change.id} replaces, so the row is re-tested. The deficiency determination stands: a configuration change neither closes the finding nor discharges the POA&M obligation, so this row is re-tested, not re-scored.`
          : `The row was taken against the configuration ${change.id} replaces. ${row.determination} is a scoping decision rather than an assessment result, so it is undisturbed; the row is queued for re-verification against the build in force.`,
    });
  }
  for (const row of suspectRowObjects) {
    records.push({
      id: nextId(),
      scope: "SCTM row",
      ref: row.key,
      from: row.determination,
      to: "Suspect",
      toDetermination: row.determination,
      outcome: "Stands — flagged",
      why:
        posture === "Candidate"
          ? `${change.build} is not the authorized baseline, so the change has not reached the configuration this determination describes. It stands and is flagged for the assessor, and the re-test is owed before the candidate is authorized.`
          : "Allocated to a component that contains or reaches the change but is not itself altered by it. The determination stands and is flagged for the assessor rather than withdrawn.",
    });
  }
  for (const id of [...evidence].sort()) {
    records.push({
      id: nextId(),
      scope: "Evidence",
      ref: id,
      from: "Current",
      to: "Superseded",
      why: `Collected ${evidenceCollectedOn(id) ?? "on an unrecorded date"}, before ${change.id} was requested on ${change.requested}, so it describes the configuration the change replaces.`,
    });
  }
  for (const id of reopen) {
    records.push({
      id: nextId(),
      scope: "Finding",
      ref: id,
      from: "Closed",
      to: "Reopen candidate",
      why: `${id} is closed against a component ${change.id} alters. A closure is only ever a closure against a configuration, so the assessor is asked to confirm it still holds on the one the change produces. The finding is queued, never re-opened automatically.`,
    });
  }
  for (const reference of invalidatedInheritance) {
    records.push({
      id: nextId(),
      scope: "Inheritance",
      ref: reference,
      from: "Accepted",
      to: "Invalidated",
      why: `${change.subject} moved from ${change.from} to ${change.to}. The accepted reference names the assessment the program actually reviewed, and that is no longer the one the provider publishes.`,
    });
  }

  const impact: ChangeImpact = {
    change: change.id,
    contained: false,
    touched,
    invalidatedRows,
    suspectRows,
    invalidatedEvidence: [...evidence].sort(),
    reopenCandidates: reopen,
    invalidatedInheritance,
    retests,
    records,
  };
  impactCache.set(key, impact);
  return impact;
}

/**
 * Live impact for a program — every change the operator has not acknowledged.
 * Acknowledging is the operator saying "I re-ran it"; it stops the change
 * suppressing determinations and does nothing else.
 */
export function impactForProgram(programId: string): ChangeImpact[] {
  checkCaches();
  const hit = programCache.get(programId);
  if (hit) return hit;
  const rows = changesForProgram(programId)
    .filter((c) => !c.acknowledged)
    .map((c) => impactOf(c.id))
    .filter((i): i is ChangeImpact => i !== null);
  programCache.set(programId, rows);
  return rows;
}

/** Everything the live changes say has to be re-verified, de-duplicated. */
export function retestQueue(programId: string): RetestItem[] {
  const seen = new Set<string>();
  const out: RetestItem[] = [];
  for (const impact of impactForProgram(programId)) {
    for (const item of impact.retests) {
      const key = `${item.control}|${item.requirement}|${item.node}|${item.method}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out.sort(
    (a, b) =>
      a.control.localeCompare(b.control) ||
      a.requirement.localeCompare(b.requirement) ||
      a.node.localeCompare(b.node),
  );
}
