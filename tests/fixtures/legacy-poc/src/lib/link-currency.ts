/**
 * Currency of a link in the requirements layer: the DOORS and PTC rule that a
 * link goes suspect when what it hangs from changes, and stays suspect until
 * a named person re-reads it. Four upstreams: a control's text changed with
 * the framework edition, a control left the in-force set of the scope the
 * requirement is allocated into, the requirement was revised after the
 * allocation was made, and a configuration change touched the element (the
 * same change-impact walk the SCTM's currency uses). A review records what it
 * was made against, so the next upstream change makes the link suspect again.
 */

import { useSyncExternalStore } from "react";

import { changeById } from "@/lib/baselines";
import { impactForProgram } from "@/lib/change-impact";
import { nodeById } from "@/lib/composition";
import { editionChanges } from "@/lib/frameworks";
import {
  allocationsFor,
  allocationsOn,
  requirementById,
  requirementsForProgram,
  resolveAllocation,
  type Allocation,
  type Derivation,
  type Requirement,
} from "@/lib/requirements";
import { controlSetFor, scopesForProgram, type AssessmentScope } from "@/lib/scopes";

export type LinkRef =
  { kind: "allocation"; id: string } | { kind: "derivation"; requirement: string; source: string };

export type Currency = "Current" | "Suspect" | "Invalidated";

export type SuspectCause = {
  /** Stable key a review is recorded against. */
  key: string;
  currency: "Suspect" | "Invalidated";
  detail: string;
  on: string;
};

export type LinkReview = { by: string; on: string; against: string[] };

export function linkKey(ref: LinkRef): string {
  return ref.kind === "allocation"
    ? `allocation:${ref.id}`
    : `derivation:${ref.requirement}:${ref.source}`;
}

/* ------------------------------------------------------------------ Store */

const reviews = new Map<string, LinkReview>();
const listeners = new Set<() => void>();
let version = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

export function useLinkCurrencyVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => version,
    () => version,
  );
}

/* ----------------------------------------------------------------- Causes */

function scopeOfNode(nodeId: string, programId: string): AssessmentScope | null {
  const scopes = scopesForProgram(programId);
  let cursor: string | null = nodeId;
  while (cursor) {
    const id: string = cursor;
    const hit = scopes.find((s) => s.element === id);
    if (hit) return hit;
    cursor = nodeById.get(id)?.parent ?? null;
  }
  return null;
}

function baseControl(id: string): string {
  return id.replace(/\(.*\)$/, "");
}

function causesForAllocation(input: Allocation): SuspectCause[] {
  const a = resolveAllocation(input);
  const r = requirementById.get(a.requirement);
  const out: SuspectCause[] = [];
  if (r && r.revision > 1)
    out.push({
      key: `revision:${r.id}:${r.revision}`,
      currency: "Suspect",
      detail: `${r.id} is at revision ${r.revision}; the allocation predates it.`,
      on: "",
    });
  if (r && a.targetKind === "node") {
    for (const impact of impactForProgram(r.program)) {
      const touched = impact.touched.find((t) => t.node === a.target);
      if (!touched) continue;
      const change = changeById(impact.change);
      out.push({
        key: `change:${impact.change}`,
        currency: touched.state,
        detail: `${impact.change} changed ${nodeById.get(a.target)?.name ?? a.target}: ${touched.reason}`,
        on: change?.requested ?? "",
      });
    }
  }
  return out;
}

function causesForDerivation(r: Requirement, d: Derivation): SuspectCause[] {
  if (d.sourceType !== "Control statement") return [];
  const out: SuspectCause[] = [];
  for (const c of editionChanges)
    if (c.control === d.sourceId || c.control === baseControl(d.sourceId))
      out.push({
        key: `edition:${c.control}:${c.edition}`,
        currency: "Suspect",
        detail: `${c.control} changed in ${c.edition}: ${c.summary}`,
        on: c.on,
      });
  const seen = new Set<string>();
  for (const a of allocationsFor(r.id)) {
    if (a.targetKind !== "node") continue;
    const scope = scopeOfNode(a.target, r.program);
    if (!scope || seen.has(scope.id)) continue;
    seen.add(scope.id);
    const set = controlSetFor(scope.id);
    if (!set) continue;
    const present = set.controls.some(
      (c) => c.control.id === d.sourceId || c.control.id === baseControl(d.sourceId),
    );
    if (!present)
      out.push({
        key: `set:${scope.id}:${d.sourceId}`,
        currency: "Suspect",
        detail: `${d.sourceId} is not in the control set of ${scope.name}.`,
        on: "",
      });
  }
  return out;
}

export function causesFor(ref: LinkRef): SuspectCause[] {
  if (ref.kind === "allocation") {
    const found = findAllocation(ref.id);
    return found ? causesForAllocation(found) : [];
  }
  const r = requirementById.get(ref.requirement);
  const d = r?.derivations.find((x) => x.sourceId === ref.source);
  return r && d ? causesForDerivation(r, d) : [];
}

function findAllocation(id: string): Allocation | null {
  for (const r of requirementById.values()) {
    const hit = allocationsFor(r.id).find((a) => a.id === id);
    if (hit) return hit;
  }
  return null;
}

/* ------------------------------------------------------------- Currency */

export type LinkCurrency = {
  currency: Currency;
  /** Causes the last review did not cover. */
  causes: SuspectCause[];
  review: LinkReview | null;
};

export function currencyOf(ref: LinkRef): LinkCurrency {
  const review = reviews.get(linkKey(ref)) ?? null;
  const covered = new Set(review?.against ?? []);
  const causes = causesFor(ref).filter((c) => !covered.has(c.key));
  const currency: Currency = causes.some((c) => c.currency === "Invalidated")
    ? "Invalidated"
    : causes.length
      ? "Suspect"
      : "Current";
  return { currency, causes, review };
}

/** "Reviewed, still holds": recorded against every cause standing today. */
export function reviewLink(ref: LinkRef, by: string): void {
  reviews.set(linkKey(ref), {
    by,
    on: "Sep 2, 2026",
    against: causesFor(ref).map((c) => c.key),
  });
  bump();
}

/** Every link of one requirement that is not Current. */
export function suspectLinksFor(requirement: Requirement): { ref: LinkRef; state: LinkCurrency }[] {
  const out: { ref: LinkRef; state: LinkCurrency }[] = [];
  for (const d of requirement.derivations) {
    const ref: LinkRef = { kind: "derivation", requirement: requirement.id, source: d.sourceId };
    const state = currencyOf(ref);
    if (state.currency !== "Current") out.push({ ref, state });
  }
  for (const a of allocationsFor(requirement.id)) {
    const ref: LinkRef = { kind: "allocation", id: a.id };
    const state = currencyOf(ref);
    if (state.currency !== "Current") out.push({ ref, state });
  }
  return out;
}

/** Allocations on these elements that are not Current: the tree row's count. */
export function suspectAllocationsUnder(nodeIds: string[]): number {
  let n = 0;
  for (const id of nodeIds)
    for (const a of allocationsOn(id))
      if (currencyOf({ kind: "allocation", id: a.id }).currency !== "Current") n += 1;
  return n;
}

export function suspectRequirements(programId: string): Requirement[] {
  return requirementsForProgram(programId).filter((r) => suspectLinksFor(r).length > 0);
}

/* ------------------------------------------------------------------ Seeds */

// Revisions before today were re-read when they happened; one was not.
for (const r of requirementsForProgram("PRG-1041")) {
  if (r.revision <= 1 || r.id === "REQ-0042.3") continue;
  for (const a of allocationsFor(r.id))
    reviews.set(linkKey({ kind: "allocation", id: a.id }), {
      by: "Sarah Chen",
      on: "Aug 18, 2026",
      against: [`revision:${r.id}:${r.revision}`],
    });
}
