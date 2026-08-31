/**
 * The per-program control matrix — the object the RMF program actually turns on.
 *
 * The control list is the real thing: the SP 800-53B baseline for the program's
 * FIPS-199 impact level, taken from the NIST catalog, plus anything the
 * program's own records already reference (an overlay addition, an inherited
 * control, a control a workstream or a finding names). Ids, titles and text all
 * come from `nist-catalog`; nothing about the requirement side is invented.
 *
 * Every tailored control gets one row: assessment status, who implements it,
 * the POA&M section that carries the remediation, the findings that knocked it
 * down, a next action and a due date. Coverage percentages, the family
 * breakdown and the Overview coverage band are all derived from these rows, so
 * editing a control (or a finding rolling into a POA&M) moves the numbers.
 *
 * The program-side posture is mock data plus a small in-memory override store
 * so inline edits persist for the session.
 */

import { useSyncExternalStore } from "react";

import { controlFamilies, programControls, programs } from "@/lib/grc-data";
import { assetById, findings, isOpen, type Finding } from "@/lib/findings";
import {
  baselineControls,
  controlTitle,
  nistControlById,
  nistFamilies,
  nistFamilyName,
  type NistBaseline,
  type NistControl,
} from "@/lib/nist-catalog";
import { poamItems } from "@/lib/register";
import { inheritanceForProgram, staleThresholdDays } from "@/lib/reusable-components";
import { workstreamsForProgram } from "@/lib/people";
import { parseGateDate } from "@/lib/program-stage";
import { gatesForProgram } from "@/lib/grc-data";

export const controlStatuses = [
  "Satisfied",
  "Partial",
  "Other than satisfied",
  "Not assessed",
] as const;
export type ControlStatus = (typeof controlStatuses)[number];

export const controlStatusTone: Record<
  ControlStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  Satisfied: "success",
  Partial: "warning",
  "Other than satisfied": "danger",
  "Not assessed": "neutral",
};

export const implementations = ["System", "Inherited", "Hybrid", "Planned"] as const;
export type Implementation = (typeof implementations)[number];

export type ControlRow = {
  /** Natural key, verbatim from the catalog: "AC-2", "AC-2(3)". */
  id: string;
  /** Catalog title. Enhancements read "Base | Enhancement". */
  title: string;
  family: string;
  familyName: string;
  /** True when the row is a control enhancement rather than a base control. */
  enhancement: boolean;
  /** Base control an enhancement extends. */
  parent: string | null;
  /** SP 800-53B baselines that select this control. Empty = tailored in. */
  baselines: NistBaseline[];
  status: ControlStatus;
  implementation: Implementation;
  source: string;
  owner: string;
  assessed: string;
  /** "Sep 12, 2026" or "—". Remediation target when not satisfied. */
  due: string;
  /** POAM- id carrying the remediation, when one exists. */
  poam: string | null;
  findings: Finding[];
  openFindings: number;
  nextAction: string;
  workstream: string | null;
  stale: boolean;
};

/* --------------------------------------------------------- generation */

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmt(d: Date) {
  return `${monthNames[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

function shift(from: Date, days: number) {
  return fmt(new Date(from.getTime() + days * 86_400_000));
}

/** Deterministic per-program jitter so two programs don't look identical. */
function seed(programId: string) {
  let h = 0;
  for (const ch of programId) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}

function nextActionFor(row: Omit<ControlRow, "nextAction">): string {
  if (row.openFindings > 0)
    return `Remediate ${row.openFindings} open finding${row.openFindings > 1 ? "s" : ""}`;
  if (row.status === "Other than satisfied") return "Open a POA&M section";
  if (row.status === "Partial") return "Complete implementation statement";
  if (row.status === "Not assessed") return "Schedule assessment";
  if (row.stale) return "Refresh inherited evidence";
  return "—";
}

const familyOrder = new Map(nistFamilies.map((f, i) => [f.id, i]));
const familyPosture = new Map(controlFamilies.map((f) => [f.id, f]));

/** SP 800-53B selects a baseline from the FIPS-199 high-water mark. */
export function baselineFor(programId: string): NistBaseline {
  return programs.find((p) => p.id === programId)?.impact ?? "Moderate";
}

/**
 * The controls this program actually carries. The baseline is the floor; a
 * control any of the program's records already names is tailored in on top of
 * it, the way an overlay or a system-specific addition would be.
 */
function tailoredControls(programId: string, inherited: Iterable<string>): NistControl[] {
  const picked = new Map<string, NistControl>();
  for (const c of baselineControls(baselineFor(programId))) picked.set(c.id, c);

  const named = [
    ...programControls.map((c) => c.id),
    ...inherited,
    ...workstreamsForProgram(programId).flatMap((w) => w.controls),
    ...findings.filter((f) => assetById.get(f.asset)?.program === programId).map((f) => f.control),
  ];
  for (const id of named) {
    if (picked.has(id)) continue;
    const c = nistControlById.get(id);
    if (c) picked.set(id, c);
  }
  return [...picked.values()];
}

function buildMatrix(programId: string): ControlRow[] {
  const inheritance = inheritanceForProgram(programId);
  const poams = poamItems.filter((p) => p.program === programId);
  const authored = new Map(programControls.map((c) => [c.id, c]));
  const poamById = new Map(poams.map((p) => [p.id, p]));

  const findingsByControl = new Map<string, Finding[]>();
  for (const f of findings) {
    if (assetById.get(f.asset)?.program !== programId) continue;
    findingsByControl.set(f.control, [...(findingsByControl.get(f.control) ?? []), f]);
  }

  const workstreamByControl = new Map<string, string>();
  for (const w of workstreamsForProgram(programId)) {
    for (const c of w.controls) if (!workstreamByControl.has(c)) workstreamByControl.set(c, w.id);
  }

  const gates = gatesForProgram(programId);
  const nextGate = gates.find((g) => g.status !== "Complete");
  const anchor = (nextGate && parseGateDate(nextGate.planned)) || new Date();
  const jitter = seed(programId);

  const byFamily = new Map<string, NistControl[]>();
  for (const c of tailoredControls(programId, inheritance.keys())) {
    byFamily.set(c.family, [...(byFamily.get(c.family) ?? []), c]);
  }

  const rows: ControlRow[] = [];

  const families = [...byFamily.entries()].sort(
    (a, b) => (familyOrder.get(a[0]) ?? 99) - (familyOrder.get(b[0]) ?? 99),
  );

  for (const [famId, famControls] of families) {
    const posture = familyPosture.get(famId);
    const owner = posture?.owner ?? "Unassigned";
    const total = famControls.length;
    const satisfiedCount = Math.round(total * (posture?.posture.satisfied ?? 0.8));
    const partialCount = Math.round(total * (posture?.posture.partial ?? 0.1));
    const otherCount = Math.round(total * (posture?.posture.other ?? 0.05));

    // Spread the family rollup across the list deterministically so the matrix
    // doesn't read as one satisfied block followed by one failing block.
    const order = Array.from({ length: total }, (_, n) => n).sort(
      (a, b) => ((a * 7919 + jitter) % 1013) - ((b * 7919 + jitter) % 1013),
    );
    const statusByIndex = new Array<ControlStatus>(total).fill("Not assessed");
    order.forEach((idx, rank) => {
      statusByIndex[idx] =
        rank < satisfiedCount
          ? "Satisfied"
          : rank < satisfiedCount + partialCount
            ? "Partial"
            : rank < satisfiedCount + partialCount + otherCount
              ? "Other than satisfied"
              : "Not assessed";
    });

    famControls.forEach((nc, i) => {
      const id = nc.id;
      const author = authored.get(id);
      const edge = inheritance.get(id);
      const fnds = findingsByControl.get(id) ?? [];
      const open = fnds.filter(isOpen);

      // Baseline distribution matches the family rollup, then real signals win.
      let status: ControlStatus = statusByIndex[i]!;

      if (author) {
        status =
          author.assessment === "Satisfied"
            ? "Satisfied"
            : author.assessment === "Not assessed"
              ? "Not assessed"
              : author.implementation === "Partially implemented"
                ? "Partial"
                : "Other than satisfied";
      }
      if (open.length > 0) status = "Other than satisfied";

      const implementation: Implementation = edge
        ? "Inherited"
        : author?.implementation === "Planned"
          ? "Planned"
          : author?.implementation === "Partially implemented"
            ? "Hybrid"
            : status === "Not assessed"
              ? "Planned"
              : "System";

      const poam = open.find((f) => f.poam)?.poam ?? null;
      const stale = !!edge && edge.control.evidenceAge > staleThresholdDays;

      const due =
        status === "Satisfied"
          ? "—"
          : poam
            ? (poamById.get(poam)?.scheduledCompletion ?? shift(anchor, 14))
            : shift(anchor, ((i * 7 + jitter) % 90) - 10);

      const assessed =
        status === "Not assessed"
          ? "—"
          : (author?.assessed ?? shift(anchor, -30 - ((i + jitter) % 60)));

      const partial: Omit<ControlRow, "nextAction"> = {
        id,
        title: controlTitle(nc),
        family: nc.family,
        familyName: nistFamilyName.get(nc.family) ?? nc.family,
        enhancement: nc.parent !== null,
        parent: nc.parent,
        baselines: nc.baselines,
        status,
        implementation,
        source: edge
          ? `${edge.component.name} (inherited)`
          : (author?.source ?? "System-implemented"),
        owner,
        assessed,
        due,
        poam,
        findings: fnds,
        openFindings: open.length,
        workstream: workstreamByControl.get(id) ?? null,
        stale,
      };

      rows.push({ ...partial, nextAction: nextActionFor(partial) });
    });
  }

  return rows;
}

/* ------------------------------------------------------------- store */

type Patch = Partial<
  Pick<ControlRow, "status" | "nextAction" | "due" | "owner" | "implementation">
>;

const overrides = new Map<string, Map<string, Patch>>();
const cache = new Map<string, ControlRow[]>();
const listeners = new Set<() => void>();

function snapshot(programId: string): ControlRow[] {
  const hit = cache.get(programId);
  if (hit) return hit;
  const patches = overrides.get(programId);
  const rows = buildMatrix(programId).map((r) => {
    const patch = patches?.get(r.id);
    return patch ? { ...r, ...patch } : r;
  });
  cache.set(programId, rows);
  return rows;
}

export function controlMatrix(programId: string): ControlRow[] {
  return snapshot(programId);
}

export function updateControl(programId: string, id: string, patch: Patch) {
  const map = overrides.get(programId) ?? new Map<string, Patch>();
  map.set(id, { ...map.get(id), ...patch });
  overrides.set(programId, map);
  cache.delete(programId);
  for (const l of listeners) l();
}

export function useControlMatrix(programId: string): ControlRow[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot(programId),
    () => snapshot(programId),
  );
}
