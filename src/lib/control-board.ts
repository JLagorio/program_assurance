/**
 * The control board projection: one row per control, six stages along the
 * canonical path — Selected, Allocated, Implemented, Evidenced, Assessed,
 * Current. The left half is the control side, the right half is the
 * implementation side, and a row reads as how far along that path it is.
 *
 * Nothing is stored here. Selected, Allocated, Evidenced, Assessed and Current
 * are aggregated from the SCTM's requirement rows; Implemented reads the work
 * store. Where a control has no work record yet, Implemented is inferred from
 * the legacy matrix status and flagged `inferred`, so the seam between the two
 * stores is visible on the board instead of hidden by it.
 */

import type { Tone } from "@/ds/primitives";
import { nodeById, pathLabel } from "@/lib/composition";
import { positionOf, workForScope, type ControlWork } from "@/lib/control-work";
import type { ControlOrigination, Sctm, SctmRow } from "@/lib/sctm";
import { scopesForProgram } from "@/lib/scopes";

/* ── Stages ──────────────────────────────────────────────────────────────── */

export const stageKeys = [
  "selected",
  "allocated",
  "implemented",
  "evidenced",
  "assessed",
  "current",
] as const;
export type StageKey = (typeof stageKeys)[number];

export const stageLabels: Record<StageKey, string> = {
  selected: "Selected",
  allocated: "Allocated",
  implemented: "Implemented",
  evidenced: "Evidenced",
  assessed: "Assessed",
  current: "Current",
};

/** What a control stuck at this stage needs next. */
export const stageNeeds: Record<StageKey, string> = {
  selected: "Not selected",
  allocated: "Needs allocation",
  implemented: "Needs implementation",
  evidenced: "Needs evidence",
  assessed: "Needs assessment",
  current: "Needs re-assessment",
};

/**
 * `hollow` is a tailored-out control: the strip keeps its shape so the family
 * keeps its catalog shape, but nothing is owed. `broken` is a determination of
 * Other than satisfied or an invalidated row; `suspect` is a row the assessor
 * has been asked to look at again.
 */
export type StageState = "hollow" | "empty" | "partial" | "full" | "broken" | "suspect";

export type Stage = {
  key: StageKey;
  label: string;
  state: StageState;
  /** 0..1, the share of owed rows through this stage. */
  fill: number;
  /** One line: what is there, or what is missing. */
  note: string;
  /** True when the value was read from the legacy matrix status, not the work record. */
  inferred: boolean;
};

export const stageStateTone: Record<StageState, Tone> = {
  hollow: "neutral",
  empty: "neutral",
  partial: "neutral",
  full: "neutral",
  broken: "danger",
  suspect: "warning",
};

/* ── Controls ────────────────────────────────────────────────────────────── */

export type BoardControl = {
  id: string;
  title: string;
  family: string;
  familyName: string;
  origination: ControlOrigination;
  responsibleParty: string;
  /** The work record in the preferred scope, or null when nobody has one. */
  work: ControlWork | null;
  owner: string | null;
  position: string;
  rows: SctmRow[];
  /** Rows that owe a determination: everything not tailored out. */
  owed: number;
  /**
   * Distinct CN- ids the owed rows are allocated to, excluding nodes present
   * only because a requirement is allocated to the system as a whole.
   */
  nodes: string[];
  /** True when any owed row is allocated to the boundary rather than a part. */
  boundary: boolean;
  /** Where the row sits in words — the bucket the Stage lens groups by. */
  bucket: Bucket;
  stages: Stage[];
  hollow: boolean;
  /** First stage that is not full; null when the control is through, or hollow. */
  stuckAt: StageKey | null;
  /** The next thing this control needs, in words. */
  next: string;
  nextTone: Tone;
  gaps: number;
  gap: string | null;
};

export type Bucket = StageKey | "other" | "invalidated" | "suspect" | "through" | "hollow";

export const bucketLabels: Record<Bucket, string> = {
  ...stageNeeds,
  other: "Other than satisfied",
  invalidated: "Invalidated",
  suspect: "Suspect",
  through: "Through",
  hollow: "Tailored out",
};

const bucketOrder: Bucket[] = [
  "other",
  "invalidated",
  "suspect",
  ...stageKeys,
  "through",
  "hollow",
];

export type FunnelStage = {
  key: StageKey;
  label: string;
  /** Controls through this stage. */
  reached: number;
  /** Controls whose first incomplete stage is this one. */
  stuck: number;
  /** Controls broken at this stage: other than satisfied, or invalidated. */
  broken: number;
  /** Controls the assessor has been asked to look at again. */
  suspect: number;
};

export type Board = {
  controls: BoardControl[];
  funnel: FunnelStage[];
  /** Controls that owe anything, so the funnel's denominator. */
  total: number;
  hollow: number;
  through: number;
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function share(n: number, d: number): number {
  return d === 0 ? 0 : n / d;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

function stateOf(fill: number): StageState {
  return fill >= 1 ? "full" : fill > 0 ? "partial" : "empty";
}

function nodeNames(ids: string[]): string {
  const names = ids.slice(0, 2).map((id) => nodeById.get(id)?.name ?? id);
  return ids.length > 2 ? `${names.join(", ")} +${ids.length - 2}` : names.join(", ");
}

function stage(
  key: StageKey,
  state: StageState,
  fill: number,
  note: string,
  inferred = false,
): Stage {
  return { key, label: stageLabels[key], state, fill, note, inferred };
}

/** Catalog order: family, base number, enhancement number. */
function sortKey(id: string): [string, number, number] {
  const m = /^([A-Z]+)-(\d+)(?:\((\d+)\))?/.exec(id);
  return m ? [m[1]!, Number(m[2]), m[3] ? Number(m[3]) : 0] : [id, 0, 0];
}

function byCatalog(a: string, b: string): number {
  const [fa, na, ea] = sortKey(a);
  const [fb, nb, eb] = sortKey(b);
  return fa.localeCompare(fb) || na - nb || ea - eb;
}

/**
 * The work record per control, without creating one. `workFor` creates on
 * miss, which is right for a record page and wrong for a board that looks at
 * every control in the baseline. Prefers a record somebody has started.
 */
export function workIndex(programId: string): Map<string, ControlWork> {
  const map = new Map<string, ControlWork>();
  for (const scope of scopesForProgram(programId)) {
    for (const w of workForScope(scope.id)) {
      const prev = map.get(w.control);
      if (!prev || (!prev.owner && w.owner)) map.set(w.control, w);
    }
  }
  return map;
}

/* ── Projection ──────────────────────────────────────────────────────────── */

function projectControl(id: string, rows: SctmRow[], work: ControlWork | null): BoardControl {
  const first = rows[0]!;
  const owed = rows.filter((r) => r.determination !== "Not applicable");
  const hollow = owed.length === 0;
  const nodes = [
    ...new Set(
      owed.flatMap((r) => r.responsibleNodes.filter((n) => !r.systemAllocatedNodes.includes(n))),
    ),
  ];
  const boundary = owed.some((r) => r.allocationScope === "system");

  // Selected
  const selected = hollow
    ? stage(
        "selected",
        "hollow",
        0,
        `Not applicable · ${rows.length} ${plural(rows.length, "row")} tailored out`,
      )
    : stage(
        "selected",
        "full",
        1,
        `${owed.length} ${plural(owed.length, "requirement")} owed${
          first.origination === "System specific" ? "" : ` · ${first.origination}`
        }`,
      );

  // Allocated
  const allocatedRows = owed.filter((r) => r.responsibleNodes.length > 0);
  const allocatedFill = share(allocatedRows.length, owed.length);
  const allocated = stage(
    "allocated",
    hollow ? "hollow" : stateOf(allocatedFill),
    allocatedFill,
    allocatedRows.length
      ? `${allocatedRows.length} of ${owed.length} allocated · ${
          nodes.length ? nodeNames(nodes) : "the system boundary"
        }`
      : "Nothing allocated",
  );

  // Implemented
  let implemented: Stage;
  if (hollow) {
    implemented = stage("implemented", "hollow", 0, "—");
  } else if (first.origination === "Common") {
    implemented = stage("implemented", "full", 1, `Provided by ${first.responsibleParty}`);
  } else if (work) {
    const fill: Record<ControlWork["implementation"], number> = {
      Implemented: 1,
      "Partially implemented": 0.5,
      Planned: 0,
      "Not implemented": 0,
    };
    const f = fill[work.implementation];
    implemented = stage(
      "implemented",
      stateOf(f),
      f,
      `${work.implementation} · ${work.owner ?? "unassigned"}${
        first.origination === "Hybrid" ? ` · with ${first.responsibleParty}` : ""
      }`,
    );
  } else {
    const sat = owed.filter((r) => r.determination === "Satisfied").length;
    const other = owed.filter((r) => r.determination === "Other than satisfied").length;
    const f = sat === owed.length ? 1 : sat + other > 0 ? 0.5 : 0;
    implemented = stage(
      "implemented",
      stateOf(f),
      f,
      f > 0 ? "Inferred from matrix status · no work record" : "No work record",
      true,
    );
  }

  // Evidenced
  const evidencedRows = owed.filter((r) => r.evidence.length > 0);
  const linked = work?.evidence.length ?? 0;
  const evidencedFill = Math.max(share(evidencedRows.length, owed.length), linked > 0 ? 1 : 0);
  const evidenced = stage(
    "evidenced",
    hollow ? "hollow" : stateOf(evidencedFill),
    evidencedFill,
    evidencedRows.length || linked
      ? [
          evidencedRows.length ? `${evidencedRows.length} of ${owed.length} rows evidenced` : null,
          linked ? `${linked} ${plural(linked, "artifact")} linked on the work record` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Nothing demonstrates the claim",
  );

  // Assessed
  const sat = owed.filter((r) => r.determination === "Satisfied").length;
  const other = owed.filter((r) => r.determination === "Other than satisfied").length;
  const notAssessed = owed.length - sat - other;
  const assessedFill = share(sat, owed.length);
  const assessed = stage(
    "assessed",
    hollow ? "hollow" : other > 0 ? "broken" : stateOf(assessedFill),
    assessedFill,
    sat + other === 0
      ? "Not assessed"
      : [
          sat ? `${sat} satisfied` : null,
          other ? `${other} other than satisfied` : null,
          notAssessed ? `${notAssessed} not assessed` : null,
        ]
          .filter(Boolean)
          .join(" · "),
  );

  // Current
  const everAssessed = owed.filter(
    (r) => r.determination !== "Not assessed" || r.priorDetermination !== null,
  );
  const invalidated = owed.filter((r) => r.currency === "Invalidated");
  const suspect = owed.filter((r) => r.currency === "Suspect");
  let current: Stage;
  if (hollow) {
    current = stage("current", "hollow", 0, "—");
  } else if (everAssessed.length === 0) {
    current = stage("current", "empty", 0, "Nothing assessed yet");
  } else {
    const f = share(everAssessed.length - invalidated.length - suspect.length, everAssessed.length);
    current = stage(
      "current",
      invalidated.length ? "broken" : suspect.length ? "suspect" : "full",
      f,
      invalidated.length
        ? `${invalidated.length} invalidated · ${invalidated[0]!.currencyReason}`
        : suspect.length
          ? `${suspect.length} suspect · ${suspect[0]!.currencyReason}`
          : "All determinations current",
    );
  }

  const stages = [selected, allocated, implemented, evidenced, assessed, current];
  const stuck = hollow ? null : (stages.find((s) => s.state !== "full") ?? null);
  const stuckAt = stuck?.key ?? null;

  // The words agree with the colour: a break anywhere on the strip is what
  // the row needs to say, even when an earlier stage is merely incomplete.
  const broken = stages.find((s) => s.state === "broken") ?? null;
  const suspectStage = stages.find((s) => s.state === "suspect") ?? null;
  let bucket: Bucket;
  let nextTone: Tone;
  if (hollow) {
    bucket = "hollow";
    nextTone = "neutral";
  } else if (broken) {
    bucket = broken.key === "assessed" ? "other" : "invalidated";
    nextTone = "danger";
  } else if (suspectStage) {
    bucket = "suspect";
    nextTone = "warning";
  } else if (!stuck) {
    bucket = "through";
    nextTone = "success";
  } else {
    bucket = stuck.key;
    nextTone = "neutral";
  }
  const next = bucketLabels[bucket];

  const gapRows = rows.filter((r) => r.gap !== null);

  return {
    id,
    title: first.controlTitle,
    family: first.family,
    familyName: first.familyName,
    origination: first.origination,
    responsibleParty: first.responsibleParty,
    work,
    owner: work?.owner ?? null,
    position: work ? positionOf(work) : "—",
    rows,
    owed: owed.length,
    nodes,
    boundary,
    bucket,
    stages,
    hollow,
    stuckAt,
    next,
    nextTone,
    gaps: gapRows.length,
    gap: gapRows[0]?.gap ?? null,
  };
}

export function buildBoard(programId: string, sctm: Sctm): Board {
  const byControl = new Map<string, SctmRow[]>();
  for (const row of sctm.rows) {
    const list = byControl.get(row.control);
    if (list) list.push(row);
    else byControl.set(row.control, [row]);
  }

  const works = workIndex(programId);
  const controls = [...byControl.entries()]
    .map(([id, rows]) => projectControl(id, rows, works.get(id) ?? null))
    .sort((a, b) => byCatalog(a.id, b.id));

  const owed = controls.filter((c) => !c.hollow);
  const funnel: FunnelStage[] = stageKeys.map((key, i) => ({
    key,
    label: stageLabels[key],
    reached: owed.filter((c) => c.stages[i]!.state === "full").length,
    stuck: owed.filter((c) => c.stuckAt === key).length,
    broken: owed.filter((c) => c.stages[i]!.state === "broken").length,
    suspect: owed.filter((c) => c.stages[i]!.state === "suspect").length,
  }));

  return {
    controls,
    funnel,
    total: owed.length,
    hollow: controls.length - owed.length,
    through: owed.filter((c) => c.stuckAt === null).length,
  };
}

/* ── Lenses ──────────────────────────────────────────────────────────────── */

export type Lens = "family" | "stage" | "owner" | "component";

export const lensLabels: Record<Lens, string> = {
  family: "Family",
  stage: "Stage",
  owner: "Owner",
  component: "Component",
};

export type BoardGroup = {
  key: string;
  label: string;
  meta: string;
  controls: BoardControl[];
};

function throughMeta(controls: BoardControl[]): string {
  const owed = controls.filter((c) => !c.hollow);
  const through = owed.filter((c) => c.stuckAt === null).length;
  return `${through} of ${owed.length} through`;
}

function ownerOf(c: BoardControl): string {
  if (c.owner) return c.owner;
  if (c.origination === "Common") return c.responsibleParty;
  return "Unassigned";
}

/** Same rows, regrouped. The row never changes; only what it sits under. */
export function groupBoard(controls: BoardControl[], lens: Lens): BoardGroup[] {
  if (lens === "family") {
    const map = new Map<string, BoardControl[]>();
    for (const c of controls) (map.get(c.family) ?? map.set(c.family, []).get(c.family)!).push(c);
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, list]) => ({
        key,
        label: `${key} · ${list[0]!.familyName}`,
        meta: throughMeta(list),
        controls: list,
      }));
  }

  if (lens === "stage") {
    return bucketOrder
      .map((b) => ({ key: b, controls: controls.filter((c) => c.bucket === b) }))
      .filter((b) => b.controls.length > 0)
      .map((b) => ({
        key: b.key,
        label: bucketLabels[b.key],
        meta: `${b.controls.length} ${plural(b.controls.length, "control")}`,
        controls: b.controls,
      }));
  }

  if (lens === "owner") {
    const map = new Map<string, BoardControl[]>();
    for (const c of controls) {
      const k = ownerOf(c);
      (map.get(k) ?? map.set(k, []).get(k)!).push(c);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b)))
      .map(([key, list]) => ({ key, label: key, meta: throughMeta(list), controls: list }));
  }

  // component: a control sits under every node it is allocated to.
  const map = new Map<string, BoardControl[]>();
  const boundary: BoardControl[] = [];
  const unallocated: BoardControl[] = [];
  for (const c of controls) {
    if (c.hollow) continue;
    if (c.nodes.length === 0) {
      (c.boundary ? boundary : unallocated).push(c);
      continue;
    }
    for (const n of c.nodes) (map.get(n) ?? map.set(n, []).get(n)!).push(c);
  }
  const groups = [...map.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([key, list]) => ({
      key,
      label: nodeById.get(key)?.name ?? key,
      meta: `${key} · ${pathLabel(key)} · ${throughMeta(list)}`,
      controls: list,
    }));
  if (boundary.length) {
    groups.push({
      key: "boundary",
      label: "System boundary",
      meta: `Allocated to the system as a whole · ${throughMeta(boundary)}`,
      controls: boundary,
    });
  }
  if (unallocated.length) {
    groups.push({
      key: "unallocated",
      label: "Unallocated",
      meta: `${unallocated.length} ${plural(unallocated.length, "control")}`,
      controls: unallocated,
    });
  }
  return groups;
}
