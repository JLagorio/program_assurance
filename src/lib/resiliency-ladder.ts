import type { BaselineControl } from "./baseline-reads";
import {
  controlStanding,
  stackAt,
  type BaselineDerivation,
  type ControlStanding,
  type StackStep,
} from "./baseline-stack";
import {
  resiliencyByTechnique,
  type FrameworkItem,
  type FrameworkItemLink,
  type FrameworkProps,
  type ResiliencyControlLink,
} from "./frameworks";
import type { ResiliencyChoice } from "./resiliency-choice";

/*
 * A program's cyber resiliency as one picture. NIST SP 800-160 Vol. 2 Rev. 1 names what a system
 * is resilient for as a ladder: 4 goals rest on 8 objectives (Table D-12), the objectives on 14
 * techniques and their 50 approaches (Table D-13), and Table E-1 says which SP 800-53 controls
 * support each approach. A program's control baseline, layer by layer, decides how much of the
 * ladder has a control behind it. This module only regroups what the reads answer (frameworks,
 * baseline-reads, resiliency-choice): the ladder with every relation the publication prints, where
 * it stands after each layer of the stack, and the controls behind one item. Every item is named
 * by its code, never its id, which changes whenever the publication is read again.
 */

/** The ladder's levels, from what a system is resilient for down to how. */
export const LADDER_KINDS = ["goal", "objective", "technique", "approach"] as const;
export type LadderKind = (typeof LADDER_KINDS)[number];

const isLadderKind = (kind: string): kind is LadderKind =>
  (LADDER_KINDS as readonly string[]).includes(kind);

/** One item of the ladder with what stands behind it. */
export type LadderItem = {
  /** The framework item's row in the revision read: what a preview of it names. Never a key. */
  id: string;
  code: string;
  kind: LadderKind;
  title: string;
  /** Its definition, as the publication prints it. */
  prose: string | null;
  /** What the publication prints with it beside its definition: a discussion, examples. */
  props: FrameworkProps;
  /** Where the publication prints it: "Table D-4". */
  printedIn: string;
  /** The technique an approach is listed under, by code; none on the other levels. */
  technique: string | null;
  /**
   * The controls that support it, by id, in the catalog's order. An approach's are the controls
   * Table E-1 prints with it and a technique's the controls printed under it; an objective's are
   * those of the approaches that support it (Table D-13), and a goal's those of its objectives
   * (Table D-12). A control is counted once however many ways it reaches the item.
   */
  controls: readonly string[];
  /** The approaches behind it, by code, in the ladder's order: itself for an approach. */
  approaches: readonly string[];
  /** The program named it in its choice for SA-24. */
  chosen: boolean;
};

/** One relation between two items of the ladder, by their codes: `from` supports `to`. */
export type LadderLink = { from: string; to: string };

/** A control Table E-1 names, as the catalog names it. */
export type LadderCatalogControl = { id: string; code: string; title: string };

export type ResiliencyLadder = {
  /** Each level in the publication's order; an approach after the approaches of the techniques before its own. */
  levels: Record<LadderKind, LadderItem[]>;
  byCode: ReadonlyMap<string, LadderItem>;
  /**
   * Every relation the publication prints between the ladder's items. First the ones between
   * neighbouring levels, which a drawing joins with a line: an objective supports a goal, a
   * technique an objective, and an approach is listed under its technique. Then the ones that pass
   * over a level: the objectives an approach supports itself (Table D-13), which say which of a
   * technique's approaches belong with an objective. An approach's first link names its technique.
   */
  links: readonly LadderLink[];
  /** Every control Table E-1 names that the catalog counts, by id, in the catalog's order. */
  controls: readonly string[];
  /** Those controls by id, for their codes and titles. */
  catalog: ReadonlyMap<string, LadderCatalogControl>;
  /** The program named at least one item for SA-24: only then does a mark say which. */
  chose: boolean;
};

/** What the ladder is built from: the reads of frameworks, baseline-reads and resiliency-choice. */
export type LadderSource = {
  /** The cyber resiliency framework's items; kinds off the ladder are passed over. */
  items: readonly Pick<
    FrameworkItem,
    "id" | "kind" | "code" | "title" | "prose" | "ordinal" | "props" | "parent_code" | "printed_in"
  >[];
  /** Its item links; only `supports` between two of the ladder's items is read. */
  itemLinks: readonly Pick<FrameworkItemLink, "relation" | "source_code" | "target_code">[];
  /** Table E-1 for the program's catalog revision. */
  controlLinks: readonly ResiliencyControlLink[];
  /** The catalog's controls by id. A control it lacks, or one withdrawn, supports nothing. */
  controls: ReadonlyMap<
    string,
    Pick<BaselineControl, "id" | "source_id" | "code" | "title" | "status">
  >;
  /** What the program chose for SA-24, where it chose. */
  choice?:
    Pick<ResiliencyChoice, "goals" | "objectives" | "techniques" | "approaches"> | null | undefined;
};

/** Which levels may support which: the pairs Tables D-12 and D-13 print. */
const SUPPORTS: Readonly<Record<LadderKind, LadderKind | null>> = {
  goal: null,
  objective: "goal",
  technique: "objective",
  approach: "objective",
};

/**
 * The ladder of one catalog revision: its four levels, the lines between them and the controls
 * behind every item. Reference data that is not loaded gives a ladder with nothing in it.
 */
export function resiliencyLadder(source: LadderSource): ResiliencyLadder {
  const counted = (id: string) => {
    const control = source.controls.get(id);
    return !!control && control.status !== "withdrawn";
  };
  const collator = new Intl.Collator("en", { numeric: true });
  const place = (id: string) => source.controls.get(id)?.source_id ?? id;
  const inCatalogOrder = (ids: Iterable<string>) =>
    [...new Set(ids)].sort((a, b) => collator.compare(place(a), place(b)));

  // The levels, each in the publication's order.
  const named = source.items.filter((item) => isLadderKind(item.kind));
  const ordinals = new Map(named.map((item) => [item.code, item.ordinal]));
  const holder = (item: (typeof named)[number]) =>
    item.kind === "approach"
      ? (ordinals.get(item.parent_code ?? "") ?? Number.MAX_SAFE_INTEGER)
      : 0;
  const ordered = [...named].sort(
    (a, b) =>
      holder(a) - holder(b) ||
      a.ordinal - b.ordinal ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  const kindOf = new Map(ordered.map((item) => [item.code, item.kind as LadderKind]));

  // What supports what: the pairs the publication prints between the ladder's own items.
  const supports = new Map<string, string[]>();
  const supportedBy = new Map<string, string[]>();
  for (const link of source.itemLinks) {
    if (link.relation !== "supports") continue;
    const from = kindOf.get(link.source_code);
    const to = kindOf.get(link.target_code);
    if (!from || !to || SUPPORTS[from] !== to) continue;
    const targets = supports.get(link.source_code) ?? [];
    if (!targets.includes(link.target_code)) targets.push(link.target_code);
    supports.set(link.source_code, targets);
    const sources = supportedBy.get(link.target_code) ?? [];
    if (!sources.includes(link.source_code)) sources.push(link.source_code);
    supportedBy.set(link.target_code, sources);
  }
  // Each list in the ladder's order, so a trace and a count read the same way every time.
  const rank = new Map(ordered.map((item, index) => [item.code, index]));
  const inLadderOrder = (codes: Iterable<string>) =>
    [...new Set(codes)].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  for (const [code, codes] of supports) supports.set(code, inLadderOrder(codes));
  for (const [code, codes] of supportedBy) supportedBy.set(code, inLadderOrder(codes));
  const supporters = (code: string, kind: LadderKind) =>
    (supportedBy.get(code) ?? []).filter((other) => kindOf.get(other) === kind);

  // The controls behind an approach are the ones the table prints with it; behind a technique,
  // the ones it prints under it, which for one row is not the technique the approach sits under.
  const approachControls = new Map<string, string[]>();
  const every = new Set<string>();
  for (const link of source.controlLinks) {
    if (!link.control_id || !counted(link.control_id)) continue;
    every.add(link.control_id);
    if (kindOf.get(link.item_code) !== "approach") continue;
    const controls = approachControls.get(link.item_code) ?? [];
    controls.push(link.control_id);
    approachControls.set(link.item_code, controls);
  }
  const byTechnique = resiliencyByTechnique(source.controlLinks);
  const techniqueControls = (code: string) =>
    (byTechnique.get(code)?.controls ?? [])
      .map((control) => control.id)
      .filter((id) => counted(id));

  const approachesOf = (item: (typeof ordered)[number]): string[] => {
    switch (item.kind as LadderKind) {
      case "approach":
        return [item.code];
      case "technique":
        return ordered
          .filter((other) => other.kind === "approach" && other.parent_code === item.code)
          .map((other) => other.code);
      case "objective":
        return supporters(item.code, "approach");
      case "goal":
        return inLadderOrder(
          supporters(item.code, "objective").flatMap((objective) =>
            supporters(objective, "approach"),
          ),
        );
    }
  };

  const chosen = new Set([
    ...(source.choice?.goals ?? []),
    ...(source.choice?.objectives ?? []),
    ...(source.choice?.techniques ?? []),
    ...(source.choice?.approaches ?? []),
  ]);
  const levels: Record<LadderKind, LadderItem[]> = {
    goal: [],
    objective: [],
    technique: [],
    approach: [],
  };
  const byCode = new Map<string, LadderItem>();
  for (const item of ordered) {
    const kind = item.kind as LadderKind;
    const approaches = approachesOf(item);
    const entry: LadderItem = {
      id: item.id,
      code: item.code,
      kind,
      title: item.title,
      prose: item.prose,
      props: item.props,
      printedIn: item.printed_in,
      technique:
        kind === "approach" && kindOf.get(item.parent_code ?? "") === "technique"
          ? item.parent_code
          : null,
      controls: inCatalogOrder(
        kind === "technique"
          ? techniqueControls(item.code)
          : approaches.flatMap((approach) => approachControls.get(approach) ?? []),
      ),
      approaches,
      chosen: chosen.has(item.code),
    };
    levels[kind].push(entry);
    byCode.set(entry.code, entry);
  }

  const links: LadderLink[] = [];
  for (const kind of ["objective", "technique"] as const)
    for (const item of levels[kind])
      for (const to of supports.get(item.code) ?? []) links.push({ from: item.code, to });
  for (const approach of levels.approach)
    if (approach.technique) links.push({ from: approach.code, to: approach.technique });
  for (const approach of levels.approach)
    for (const to of supports.get(approach.code) ?? []) links.push({ from: approach.code, to });

  const controls = inCatalogOrder(every);
  const catalog = new Map<string, LadderCatalogControl>();
  for (const id of controls) {
    const control = source.controls.get(id);
    if (control) catalog.set(id, { id, code: control.code, title: control.title });
  }
  return {
    levels,
    byCode,
    links,
    controls,
    catalog,
    chose: ordered.some((item) => chosen.has(item.code)),
  };
}

/** The ladder's items, level after level. */
export function ladderItems(ladder: Pick<ResiliencyLadder, "levels">): LadderItem[] {
  return LADDER_KINDS.flatMap((kind) => ladder.levels[kind]);
}

/* ——— Where the ladder stands at a step of the stack ————————————————————————————————————————— */

/** How many of some controls a baseline holds at a step. */
export type LadderCounts = {
  /** In the baseline: there from the reference baseline, or added by a layer. */
  held: number;
  /** Of those held, the ones a layer added. */
  added: number;
  /** Selected before, and removed by a layer. */
  removed: number;
  /** Every control behind the item, whatever its standing. */
  total: number;
};

/** The ladder after some of the stack's layers. */
export type LadderStanding = {
  /** How many layers are applied: 0 is the reference baseline alone. */
  upto: number;
  /** Every control Table E-1 names: the 131 of 265. */
  all: LadderCounts;
  /** The same for each item, by code. */
  byItem: ReadonlyMap<string, LadderCounts>;
  /** The approaches with nothing behind them: no control that supports one is in the baseline. */
  empty: ReadonlySet<string>;
  /** How many of the approaches behind each item have nothing behind them, by code. */
  gaps: ReadonlyMap<string, number>;
};

function tally(controls: readonly string[], step: StackStep): LadderCounts {
  const counts: LadderCounts = { held: 0, added: 0, removed: 0, total: controls.length };
  for (const id of controls) {
    const { status } = controlStanding(step, id);
    if (status === "in_baseline" || status === "added") counts.held += 1;
    if (status === "added") counts.added += 1;
    if (status === "removed") counts.removed += 1;
  }
  return counts;
}

/** Where the ladder stands at a step: what the baseline holds of the controls behind each item. */
export function ladderAt(
  ladder: Pick<ResiliencyLadder, "levels" | "controls">,
  step: StackStep,
): LadderStanding {
  const items = ladderItems(ladder);
  const byItem = new Map(items.map((item) => [item.code, tally(item.controls, step)]));
  const empty = new Set(
    ladder.levels.approach
      .filter((approach) => (byItem.get(approach.code)?.held ?? 0) === 0)
      .map((approach) => approach.code),
  );
  const gaps = new Map(
    items.map((item) => [
      item.code,
      item.approaches.filter((approach) => empty.has(approach)).length,
    ]),
  );
  return { upto: step.upto, all: tally(ladder.controls, step), byItem, empty, gaps };
}

/** What one layer did among some controls: how many it added and how many it removed. */
export type LayerChange = { added: number; removed: number };

/** One step of the stack as the ladder reads it. */
export type LadderLayer = {
  /** How many layers are applied: 0 is the reference baseline alone. */
  upto: number;
  /** The layer applied last, by its key; none for the reference baseline. */
  key: string | null;
  /** Where the ladder stands once it is applied. */
  standing: LadderStanding;
  /** What this layer alone did among the controls Table E-1 names: the +70 −3. */
  change: LayerChange;
  /** The same for each item it changed, by code. An item it left alone is absent. */
  changes: ReadonlyMap<string, LayerChange>;
};

/**
 * The ladder after each layer of a stack, the reference baseline first: what each layer bought.
 * The last entry is the program's baseline.
 */
export function ladderByLayer(
  ladder: Pick<ResiliencyLadder, "levels" | "controls">,
  derivation: Pick<BaselineDerivation, "layers" | "selected">,
): LadderLayer[] {
  const items = ladderItems(ladder);
  const counted = new Set(ladder.controls);
  return Array.from({ length: derivation.layers.length + 1 }, (_, upto): LadderLayer => {
    const layer = upto > 0 ? derivation.layers[upto - 1] : undefined;
    const added = new Set<string>();
    const removed = new Set<string>();
    for (const row of layer?.effects ?? []) {
      if (!counted.has(row.controlId)) continue;
      if (row.effect === "added") added.add(row.controlId);
      else if (row.effect === "removed") removed.add(row.controlId);
    }
    const changes = new Map<string, LayerChange>();
    if (added.size || removed.size)
      for (const item of items) {
        const change = {
          added: item.controls.filter((id) => added.has(id)).length,
          removed: item.controls.filter((id) => removed.has(id)).length,
        };
        if (change.added || change.removed) changes.set(item.code, change);
      }
    return {
      upto,
      key: layer?.key ?? null,
      standing: ladderAt(ladder, stackAt(derivation, upto)),
      change: { added: added.size, removed: removed.size },
      changes,
    };
  });
}

/* ——— The controls behind one item —————————————————————————————————————————————————————————— */

/** A control behind an item, with where it stands and how much of the program maps it. */
export type LadderControl = LadderCatalogControl & {
  status: ControlStanding["status"];
  /** The layer that added or removed it, by its key; none for a control no layer changed. */
  layerKey: string | null;
  /** How many of the program's requirements map it. */
  requirements: number;
};

/**
 * The controls behind an item at a step, apart: those the baseline holds, then those it does not,
 * each list in the catalog's order. `requirements` counts the program's requirements by control.
 */
export function ladderControls(
  ladder: Pick<ResiliencyLadder, "byCode" | "catalog">,
  code: string,
  step: StackStep,
  requirements: ReadonlyMap<string, number>,
): { held: LadderControl[]; rest: LadderControl[] } {
  const held: LadderControl[] = [];
  const rest: LadderControl[] = [];
  for (const id of ladder.byCode.get(code)?.controls ?? []) {
    const control = ladder.catalog.get(id);
    if (!control) continue;
    const { status, layerKey } = controlStanding(step, id);
    const row = { ...control, status, layerKey, requirements: requirements.get(id) ?? 0 };
    if (status === "in_baseline" || status === "added") held.push(row);
    else rest.push(row);
  }
  return { held, rest };
}
