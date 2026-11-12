import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { deriveStack, stackAt } from "./baseline-stack";
import { itemGuidance, type ResiliencyControlLink } from "./frameworks";
import {
  LADDER_KINDS,
  ladderAt,
  ladderByLayer,
  ladderControls,
  ladderItems,
  resiliencyLadder,
  type LadderSource,
  type ResiliencyLadder,
} from "./resiliency-ladder";

/*
 * The ladder is checked against what it is built from in the product: the pinned transcription of
 * NIST SP 800-160 Vol. 2 Rev. 1 (its items, Tables D-12 and D-13, and Table E-1) and the pinned
 * SP 800-53B High baseline, under the four layers the demo program WS-X90 stacks on it. The layers'
 * decisions are a copy of that program's, read from the local database on 2026-11-11; the numbers
 * asserted are the ones the same database answers in SQL for the program's saved baselines.
 */

const reference = fileURLToPath(new URL("../../supabase/reference", import.meta.url));
const manifest = JSON.parse(readFileSync(`${reference}/manifest.json`, "utf8")) as {
  sources: { id: string; file: string }[];
};
function pinned<T>(id: string): T {
  const source = manifest.sources.find((entry) => entry.id === id);
  if (!source) throw new Error(`The reference manifest pins no ${id}`);
  return JSON.parse(gunzipSync(readFileSync(`${reference}/${source.file}`)).toString("utf8")) as T;
}

type Transcription = {
  items: {
    code: string;
    kind: string;
    title: string;
    prose: string | null;
    parent: string | null;
    ordinal: number;
    props: Record<string, string | string[]>;
    printed_in: string;
  }[];
  item_links: { source: string; target: string; relation: string }[];
  control_links: {
    source_identifier: string;
    control: string;
    item: string;
    relation: string;
    ordinal: number | null;
    props: { technique?: string };
  }[];
};

/** A control as Table E-1 prints it, "AC-2(6)", as the catalog's source id, "ac-2.6". */
const sourceId = (label: string) => label.toLowerCase().replace("(", ".").replace(")", "");
/** And back: the code a control is read by. */
const codeOf = (id: string) => {
  const [control = "", enhancement] = id.toUpperCase().split(".");
  return enhancement ? `${control}(${enhancement})` : control;
};

/** WS-X90's layers, in the order they apply, each with the controls it decides by source id. */
const LAYERS = [
  {
    key: "OVL-CNSSI-1253-ALLOCATION",
    title: "CNSSI 1253 National Security System Allocation",
    include:
      "ac-2.7 ac-2.9 ac-3.4 ac-6.8 ac-12.1 ac-12.2 ac-16 ac-16.6 ac-16.7 ac-17.6 ac-17.9 " +
      "ac-17.10 ac-20.3 ac-23 at-2.4 at-2.5 at-2.6 at-3.1 at-3.2 at-6 au-4.1 au-6.4 au-9.5 " +
      "au-9.6 au-11.1 au-14 au-14.1 au-14.3 au-16 au-16.1 au-16.2 ca-7.3 ca-7.5 ca-7.6 " +
      "ca-8.3 cm-3.5 cm-3.7 cm-3.8 cm-5.5 cm-5.6 cm-7.3 cm-7.8 cm-7.9 cm-10.1 cm-11.2 cm-14 " +
      "ia-2.6 ia-3.1 ia-4.9 ia-5.7 ia-5.8 ia-5.13 ia-5.14 ia-5.16 ia-9 ia-10 ia-12.1 ir-4.3 " +
      "ir-4.6 ir-4.7 ir-4.8 ir-4.10 ir-4.12 ir-4.13 ir-4.14 ir-6.2 ir-7.2 ir-9 ir-9.2 " +
      "ir-9.3 ir-9.4 ma-3.4 ma-3.5 ma-3.6 ma-4.1 ma-4.4 ma-4.6 ma-4.7 ma-6.1 pe-8.3 pe-22 " +
      "pe-23 pl-7 pl-8.1 pl-8.2 pl-9 ps-3.4 ps-4.1 ps-6.3 ra-3.2 ra-3.3 ra-5.10 ra-10 " +
      "sa-3.1 sa-3.2 sa-3.3 sa-4.3 sa-4.7 sa-8.1 sa-8.2 sa-8.3 sa-8.4 sa-8.5 sa-8.6 sa-8.7 " +
      "sa-8.8 sa-8.9 sa-8.10 sa-8.11 sa-8.12 sa-8.13 sa-8.14 sa-8.15 sa-8.16 sa-8.17 " +
      "sa-8.18 sa-8.19 sa-8.20 sa-8.21 sa-8.22 sa-8.23 sa-8.24 sa-8.25 sa-8.26 sa-8.27 " +
      "sa-8.28 sa-8.29 sa-8.30 sa-8.31 sa-8.32 sa-9.1 sa-9.3 sa-9.8 sa-10.1 sa-10.3 sa-10.7 " +
      "sa-11.1 sa-11.2 sa-15.7 sc-5.1 sc-5.2 sc-5.3 sc-7.9 sc-7.10 sc-7.11 sc-7.12 sc-7.13 " +
      "sc-7.14 sc-7.15 sc-7.25 sc-7.28 sc-7.29 sc-8.2 sc-16 sc-16.1 sc-16.2 sc-16.3 sc-18.1 " +
      "sc-18.2 sc-18.3 sc-18.4 sc-23.1 sc-23.3 sc-23.5 sc-28.3 sc-38 sc-41 sc-45 sc-45.1 " +
      "sc-47 si-2.3 si-2.4 si-2.6 si-3.10 si-4.1 si-4.11 si-4.15 si-4.16 si-4.19 si-4.23 " +
      "si-4.24 si-4.25 si-6.3 si-7.8 si-7.9 si-7.10 si-7.17 si-10.3 si-10.5 si-10.6 si-12.3 " +
      "si-15 si-21 sr-3.1 sr-3.2 sr-3.3 sr-4 sr-5.1 sr-5.2 sr-6.1 sr-7",
    exclude:
      "au-5.2 cp-2.2 cp-2.5 cp-3.1 cp-4.2 cp-6.2 cp-7.4 cp-8.3 cp-8.4 cp-9.2 cp-9.3 cp-10.4 " +
      "ia-12.5 pe-11.1 pe-15.1 pe-18 sc-12.1",
  },
  {
    key: "OVL-MISSION-ASSURANCE",
    title: "Mission Assurance Overlay",
    include: "sc-39 si-16 sr-11",
    exclude: "ac-18 ac-18.1 ac-18.3 ac-18.4 ac-18.5",
  },
  {
    key: "OVL-DEPLOYED-PLATFORM",
    title: "Deployed Platform Overlay",
    include: "cp-10 ma-5 pe-18",
    exclude: "",
  },
  {
    key: "OVL-CUSTOMER-A",
    title: "Customer A Tailoring",
    include: "ca-8 ra-5",
    exclude: "ac-20 ac-20.1 ac-20.2 ac-20.3",
  },
] as const;
const ids = (list: string) => list.split(" ").filter(Boolean);

/** The reads the ladder is built from, as the views answer them, and WS-X90's stack on High. */
function world(choice?: LadderSource["choice"]) {
  const cref = pinned<Transcription>("nist-sp800-160v2r1-cref-transcription");
  const high = pinned<{
    profile: { imports: { "include-controls": { "with-ids": string[] }[] }[] };
  }>("nist-sp800-53b-high-profile");
  const baselineIds = high.profile.imports.flatMap((entry) =>
    entry["include-controls"].flatMap((rule) => rule["with-ids"]),
  );
  const titles = new Map(cref.items.map((item) => [item.code, item.title]));
  const kinds = new Map(cref.items.map((item) => [item.code, item.kind]));
  const controlLinks = cref.control_links.map((link): ResiliencyControlLink => ({
    // The views order controls by a natural key; a padded source id orders the same way here.
    control_order: sourceId(link.control).replace(/\d+/g, (digits) => digits.padStart(4, "0")),
    ordinal: link.ordinal,
    source_identifier: link.source_identifier,
    control_id: sourceId(link.control),
    technique_code: link.props.technique ?? null,
    technique_title: titles.get(link.props.technique ?? "") ?? null,
    item_kind: kinds.get(link.item) ?? "",
    item_code: link.item,
    item_title: titles.get(link.item) ?? "",
  }));
  // The catalog, as far as these reads name it: a control is its source id here.
  const named = new Set([
    ...baselineIds,
    ...LAYERS.flatMap((layer) => [...ids(layer.include), ...ids(layer.exclude)]),
    ...controlLinks.map((link) => link.control_id ?? ""),
  ]);
  const controls = new Map(
    [...named].map((id) => [
      id,
      { id, source_id: id, code: codeOf(id), title: `Control ${codeOf(id)}`, status: "active" },
    ]),
  );
  const source: LadderSource = {
    // An id of the revision read: the ladder never keys on it.
    items: cref.items.map((item, index) => ({
      id: `item-${index}`,
      kind: item.kind,
      code: item.code,
      title: item.title,
      prose: item.prose,
      ordinal: item.ordinal,
      props: item.props,
      parent_code: item.parent,
      printed_in: item.printed_in,
    })),
    itemLinks: cref.item_links.map((link) => ({
      relation: link.relation,
      source_code: link.source,
      target_code: link.target,
    })),
    controlLinks,
    controls: controls as LadderSource["controls"],
    choice,
  };
  const derivation = deriveStack(
    baselineIds,
    LAYERS.map((layer) => ({
      key: layer.key,
      kind: "overlay" as const,
      title: layer.title,
      decisions: [
        ...ids(layer.include).map((controlId) => ({
          controlId,
          action: "include" as const,
          rationale: null,
        })),
        ...ids(layer.exclude).map((controlId) => ({
          controlId,
          action: "exclude" as const,
          rationale: null,
        })),
      ],
    })),
  );
  return { source, derivation, ladder: resiliencyLadder(source) };
}

const titlesOf = (ladder: ResiliencyLadder, codes: Iterable<string>) =>
  [...codes].map((code) => ladder.byCode.get(code)?.title);
/** "8/23": what the baseline holds of the controls behind an item. */
const heldOf = (ladder: ResiliencyLadder, standing: ReturnType<typeof ladderAt>, title: string) => {
  const item = ladderItems(ladder).find((entry) => entry.title === title);
  const counts = item ? standing.byItem.get(item.code) : undefined;
  return counts ? `${counts.held}/${counts.total}` : undefined;
};

describe("the ladder of NIST SP 800-160 Vol. 2", () => {
  const { ladder } = world();

  it("has four levels in the publication's order", () => {
    expect(LADDER_KINDS.map((kind) => ladder.levels[kind].length)).toEqual([4, 8, 14, 50]);
    expect(ladder.levels.goal.map((item) => item.title)).toEqual([
      "Anticipate",
      "Withstand",
      "Recover",
      "Adapt",
    ]);
    expect(ladder.levels.objective.map((item) => item.title)).toEqual([
      "Prevent or Avoid",
      "Prepare",
      "Continue",
      "Constrain",
      "Reconstitute",
      "Understand",
      "Transform",
      "Re-Architect",
    ]);
    expect(ladder.levels.technique[0]?.title).toBe("Adaptive Response");
    expect(ladder.levels.technique.at(-1)?.title).toBe("Unpredictability");
    // An approach follows the approaches of the techniques before its own.
    expect(ladder.levels.approach.slice(0, 4).map((item) => item.title)).toEqual([
      "Dynamic Reconfiguration",
      "Dynamic Resource Allocation",
      "Adaptive Management",
      "Monitoring and Damage Assessment",
    ]);
    expect(ladder.levels.approach.at(-1)?.title).toBe("Contextual Unpredictability");
    // The design principles the framework also holds are off the ladder.
    expect(ladderItems(ladder)).toHaveLength(76);
  });

  it("holds every relation the publication prints, the ones a drawing joins first", () => {
    const between = (from: string, to: string) =>
      ladder.links.filter(
        (link) =>
          ladder.byCode.get(link.from)?.kind === from && ladder.byCode.get(link.to)?.kind === to,
      ).length;
    // Table D-12, Table D-13's technique rows, and each approach under its own technique.
    expect(between("objective", "goal")).toBe(19);
    expect(between("technique", "objective")).toBe(59);
    expect(between("approach", "technique")).toBe(50);
    // Table D-13's approach rows pass over the techniques.
    expect(between("approach", "objective")).toBe(145);
    expect(ladder.links).toHaveLength(273);
    expect(new Set(ladder.links.map((link) => `${link.from}>${link.to}`)).size).toBe(273);
    // An approach's first link names the technique it is listed under: where its row stands.
    for (const approach of ladder.levels.approach)
      expect(ladder.links.find((link) => link.from === approach.code)?.to).toBe(approach.technique);
    expect(ladder.byCode.get("approach.dynamic-reconfiguration")?.technique).toBe(
      "technique.adaptive-response",
    );
    expect(
      ladder.links
        .filter(
          (link) =>
            link.from === "approach.dynamic-reconfiguration" && link.to.startsWith("objective."),
        )
        .map((link) => link.to),
    ).toEqual([
      "objective.prevent-or-avoid",
      "objective.continue",
      "objective.constrain",
      "objective.reconstitute",
      "objective.understand",
    ]);
  });

  it("carries what the publication prints of an item, for the guidance read from it", () => {
    const approach = ladder.byCode.get("approach.dynamic-reconfiguration");
    expect(approach?.printedIn).toBe("Table D-4");
    expect(approach?.prose).toMatch(/^Make changes to/);
    expect(approach && itemGuidance(approach).examples).toHaveLength(2);
    expect(approach && itemGuidance(approach).informalDescription).toBe(
      "Change how resources are or can be used.",
    );
    // A goal is printed with its definition alone.
    const goal = ladder.byCode.get("goal.anticipate");
    expect(goal && itemGuidance(goal)).toEqual({
      definition: "Maintain a state of informed preparedness for adversity.",
      informalDescription: undefined,
      discussion: undefined,
      examples: [],
    });
  });

  it("counts the controls Table E-1 names behind every item, each once", () => {
    expect(ladder.controls).toHaveLength(265);
    const total = (code: string) => ladder.byCode.get(code)?.controls.length;
    expect(total("technique.segmentation")).toBe(41);
    expect(total("technique.substantiated-integrity")).toBe(58);
    expect(total("approach.dynamic-reconfiguration")).toBe(9);
    expect(total("approach.integrity-checks")).toBe(38);
    expect(total("objective.prevent-or-avoid")).toBe(149);
    expect(total("goal.anticipate")).toBe(255);
    expect(total("goal.recover")).toBe(261);
    // In the catalog's order: AC-2(6) before AC-2(12), AC before SC.
    expect(ladder.byCode.get("approach.dynamic-privileges")?.controls.slice(0, 2)).toEqual([
      "ac-2.6",
      "ac-2.8",
    ]);
  });

  it("reads a link's technique from the table, never from the approach's parent", () => {
    // SR-7 supports Self-Challenge, a Coordinated Protection approach, in a Deception group.
    expect(ladder.byCode.get("approach.self-challenge")?.technique).toBe(
      "technique.coordinated-protection",
    );
    expect(ladder.byCode.get("approach.self-challenge")?.controls).toContain("sr-7");
    expect(ladder.byCode.get("technique.deception")?.controls).toContain("sr-7");
    expect(ladder.byCode.get("technique.coordinated-protection")?.controls).not.toContain("sr-7");
  });

  it("keys nothing on an item's id", () => {
    const { source } = world();
    const reread = resiliencyLadder({
      ...source,
      items: source.items.map((item) => ({ ...item, id: `again-${item.id}` })),
    });
    expect(reread.links).toEqual(ladder.links);
    expect(reread.levels.approach.map((item) => [item.code, item.controls])).toEqual(
      ladder.levels.approach.map((item) => [item.code, item.controls]),
    );
    expect(reread.byCode.get("goal.adapt")?.id).toBe(
      `again-${ladder.byCode.get("goal.adapt")?.id}`,
    );
  });
});

describe("where WS-X90 stands on the ladder", () => {
  const { ladder, derivation } = world();
  const layers = ladderByLayer(ladder, derivation);
  const top = layers.at(-1)!.standing;
  const first = layers[0]!.standing;

  it("stacks the layers the saved baselines hold", () => {
    expect(derivation.baselineCount).toBe(370);
    expect(derivation.layers.map((layer) => layer.total)).toEqual([554, 549, 550, 546]);
  });

  it("holds 131 of the 265 controls, and leaves 11 of 50 approaches with nothing behind them", () => {
    expect(top.upto).toBe(4);
    expect(top.all).toEqual({ held: 131, added: 70, removed: 3, total: 265 });
    // The key: in the reference baseline, added, removed, never selected.
    expect(top.all.held - top.all.added).toBe(61);
    expect(top.all.total - top.all.held - top.all.removed).toBe(131);
    expect(top.empty.size).toBe(11);
    expect(titlesOf(ladder, top.empty)).toEqual([
      "Misdirection",
      "Tainting",
      "Architectural Diversity",
      "Design Diversity",
      "Information Diversity",
      "Functional Relocation of Sensors",
      "Functional Relocation of Cyber Resources",
      "Asset Mobility",
      "Fragmentation",
      "Replacement",
      "Contextual Unpredictability",
    ]);
  });

  it("counts each level at the top of the stack", () => {
    const at = (title: string) => heldOf(ladder, top, title);
    expect(ladder.levels.goal.map((item) => at(item.title))).toEqual([
      "128/255",
      "128/255",
      "131/261",
      "119/233",
    ]);
    expect(ladder.levels.objective.map((item) => at(item.title))).toEqual([
      "69/149",
      "43/83",
      "73/140",
      "85/160",
      "92/166",
      "83/149",
      "29/60",
      "47/109",
    ]);
    expect(ladder.levels.technique.map((item) => at(item.title))).toEqual([
      "8/23",
      "34/50",
      "13/19",
      "20/33",
      "8/21",
      "7/21",
      "1/8",
      "5/13",
      "19/31",
      "14/27",
      "8/16",
      "16/41",
      "35/58",
      "2/7",
    ]);
    expect(at("Dynamic Reconfiguration")).toBe("2/9");
    expect(at("Integrity Checks")).toBe("25/38");
    expect(at("Supply Chain Diversity")).toBe("4/4");
  });

  it("counts the approaches with nothing behind them under every item", () => {
    const gaps = (title: string) =>
      top.gaps.get(ladderItems(ladder).find((item) => item.title === title)?.code ?? "");
    expect(ladder.levels.goal.map((item) => gaps(item.title))).toEqual([10, 10, 11, 7]);
    expect(ladder.levels.objective.map((item) => gaps(item.title))).toEqual([
      5, 3, 5, 3, 2, 3, 1, 4,
    ]);
    expect(
      ladder.levels.technique
        .filter((item) => gaps(item.title))
        .map((item) => [item.title, gaps(item.title)]),
    ).toEqual([
      ["Deception", 2],
      ["Diversity", 3],
      ["Dynamic Positioning", 4],
      ["Realignment", 1],
      ["Unpredictability", 1],
    ]);
    expect(gaps("Misdirection")).toBe(1);
    expect(gaps("Obfuscation")).toBe(0);
  });

  it("shows what each layer bought: 64, then 131 with +70 −3, then no change", () => {
    expect(layers.map((layer) => layer.upto)).toEqual([0, 1, 2, 3, 4]);
    expect(layers.map((layer) => layer.key)).toEqual([null, ...LAYERS.map((layer) => layer.key)]);
    expect(layers.map((layer) => layer.standing.all.held)).toEqual([64, 131, 131, 131, 131]);
    expect(layers.map((layer) => layer.change)).toEqual([
      { added: 0, removed: 0 },
      { added: 70, removed: 3 },
      { added: 0, removed: 0 },
      { added: 0, removed: 0 },
      { added: 0, removed: 0 },
    ]);
    expect(layers.map((layer) => layer.standing.empty.size)).toEqual([21, 11, 11, 11, 11]);
    // The reference baseline alone: nothing is added or removed yet.
    expect(first.all).toEqual({ held: 64, added: 0, removed: 0, total: 265 });
    expect(ladder.levels.technique.map((item) => heldOf(ladder, first, item.title))).toEqual([
      "4/23",
      "19/50",
      "5/19",
      "9/33",
      "5/21",
      "2/21",
      "0/8",
      "2/13",
      "9/31",
      "6/27",
      "6/16",
      "7/41",
      "20/58",
      "1/7",
    ]);
  });

  it("says what a layer did to each item, and leaves out the items it left alone", () => {
    const cnssi = layers[1]!;
    expect(cnssi.changes.get("technique.adaptive-response")).toEqual({ added: 5, removed: 1 });
    expect(cnssi.changes.get("approach.architectural-diversity")).toEqual({
      added: 0,
      removed: 1,
    });
    expect(cnssi.changes.get("technique.segmentation")).toEqual({ added: 9, removed: 0 });
    // Supply Chain Diversity goes from none of its four to all of them in one layer.
    expect(heldOf(ladder, first, "Supply Chain Diversity")).toBe("0/4");
    expect(cnssi.changes.get("approach.supply-chain-diversity")).toEqual({
      added: 4,
      removed: 0,
    });
    expect(cnssi.changes.has("approach.misdirection")).toBe(false);
    expect(layers[0]!.changes.size).toBe(0);
    expect(layers[2]!.changes.size).toBe(0);
  });

  it("lists the controls behind an approach: those in the baseline, then the rest", () => {
    const requirements = new Map([
      ["ir-4.3", 1],
      ["ir-4.11", 1],
    ]);
    const counts = top.byItem.get("approach.dynamic-reconfiguration");
    expect(counts).toEqual({ held: 2, added: 1, removed: 1, total: 9 });
    const { held, rest } = ladderControls(
      ladder,
      "approach.dynamic-reconfiguration",
      stackAt(derivation, 4),
      requirements,
    );
    expect(held).toEqual([
      {
        id: "ir-4.3",
        code: "IR-4(3)",
        title: "Control IR-4(3)",
        status: "added",
        layerKey: "OVL-CNSSI-1253-ALLOCATION",
        requirements: 1,
      },
      {
        id: "ir-4.11",
        code: "IR-4(11)",
        title: "Control IR-4(11)",
        status: "in_baseline",
        layerKey: null,
        requirements: 1,
      },
    ]);
    expect(rest.map((control) => [control.code, control.status])).toEqual([
      ["AC-2(6)", "not_selected"],
      ["AC-2(8)", "not_selected"],
      ["AC-4(3)", "not_selected"],
      ["CP-2(5)", "removed"],
      ["IR-4(2)", "not_selected"],
      ["IR-4(9)", "not_selected"],
      ["SC-7(20)", "not_selected"],
    ]);
    expect(rest.find((control) => control.code === "CP-2(5)")?.layerKey).toBe(
      "OVL-CNSSI-1253-ALLOCATION",
    );
    expect(rest.every((control) => control.requirements === 0)).toBe(true);
    // Before any layer, CP-2(5) is still in the baseline and IR-4(3) not yet.
    const before = ladderControls(
      ladder,
      "approach.dynamic-reconfiguration",
      stackAt(derivation, 0),
      requirements,
    );
    expect(before.held.map((control) => control.code)).toEqual(["CP-2(5)", "IR-4(11)"]);
    expect(
      ladderControls(ladder, "approach.unknown", stackAt(derivation, 4), requirements),
    ).toEqual({ held: [], rest: [] });
  });
});

describe("the path a drawing keeps for a chosen item", () => {
  const { ladder, derivation } = world();

  /**
   * The rule Ledger's Ladder reads `links` by: an item of a further level is on a chosen item's
   * path when it is linked to the path in every level between them that it has links into, and in
   * one at least. The links are the model's; the rule is the drawing's, repeated here so a change
   * to what the model hands over shows as a change to what a choice keeps.
   */
  function kept(codes: readonly string[]) {
    const levels = LADDER_KINDS.map((kind) => ladder.levels[kind].map((item) => item.code));
    const levelOf = new Map(levels.flatMap((level, index) => level.map((code) => [code, index])));
    const linked = new Map<string, Map<number, string[]>>();
    const join = (from: string, to: string) => {
      const byLevel = linked.get(from) ?? new Map<number, string[]>();
      linked.set(from, byLevel);
      const level = levelOf.get(to) ?? -1;
      byLevel.set(level, [...(byLevel.get(level) ?? []), to]);
    };
    for (const link of ladder.links) {
      join(link.from, link.to);
      join(link.to, link.from);
    }
    const on = new Set<string>();
    for (const start of codes) {
      const origin = levelOf.get(start);
      if (origin === undefined) continue;
      on.add(start);
      for (const step of [1, -1]) {
        const members: (Set<string> | undefined)[] = [];
        members[origin] = new Set([start]);
        for (let at = origin + step; at >= 0 && at < levels.length; at += step) {
          const here = new Set<string>();
          for (const code of levels[at] ?? []) {
            const links = linked.get(code);
            let joined = false;
            let agrees = true;
            for (let between = origin; between !== at && agrees; between += step) {
              const there = links?.get(between);
              if (!there) continue;
              joined = true;
              agrees = there.some((other) => members[between]?.has(other));
            }
            if (joined && agrees) here.add(code);
          }
          members[at] = here;
          for (const code of here) on.add(code);
        }
      }
    }
    return {
      on,
      levels: levels.map((level) => level.filter((code) => on.has(code)).length),
    };
  }

  it("keeps an objective's goals, and the techniques and approaches the table prints for it", () => {
    const transform = kept(["objective.transform"]);
    expect(transform.levels).toEqual([2, 1, 4, 11]);
    expect(transform.on.has("goal.recover")).toBe(true);
    expect(transform.on.has("goal.adapt")).toBe(true);
    // Realignment supports Transform, and Purposing, one of its approaches, does not: the links
    // that pass over the techniques say so.
    expect(transform.on.has("technique.realignment")).toBe(true);
    expect(transform.on.has("approach.offloading")).toBe(true);
    expect(transform.on.has("approach.purposing")).toBe(false);
  });

  it("keeps everything under a goal", () => {
    expect(kept(["goal.adapt"]).levels).toEqual([1, 4, 12, 37]);
  });

  it("keeps a technique's approaches and the objectives and goals it supports", () => {
    // Prevent or Avoid and Understand, which between them reach every goal.
    expect(kept(["technique.deception"]).levels).toEqual([4, 2, 1, 4]);
  });

  it("keeps an approach's technique and the objectives it supports itself", () => {
    expect(kept(["approach.dynamic-reconfiguration"]).levels).toEqual([4, 5, 1, 1]);
    expect(kept(["approach.replication"]).levels).toEqual([4, 5, 1, 1]);
  });

  it("keeps the approaches with nothing behind them together, as the gaps", () => {
    const top = ladderAt(ladder, stackAt(derivation, 4));
    expect(kept([...top.empty]).levels).toEqual([4, 8, 5, 11]);
    const first = ladderAt(ladder, stackAt(derivation, 0));
    expect(kept([...first.empty]).levels).toEqual([4, 8, 10, 21]);
  });

  it("counts under each item the gaps on its path, as the standing does", () => {
    const top = ladderAt(ladder, stackAt(derivation, 4));
    for (const item of ladderItems(ladder)) {
      if (item.kind === "approach") continue;
      const ahead = [...kept([item.code]).on].filter(
        (code) => ladder.byCode.get(code)?.kind === "approach" && top.empty.has(code),
      );
      // A goal's path also runs back to nothing, so every approach on it lies ahead of it.
      expect(ahead.length, item.title).toBe(top.gaps.get(item.code));
    }
  });

  it("keeps nothing for a code the ladder does not hold", () => {
    expect(kept(["approach.unknown"]).levels).toEqual([0, 0, 0, 0]);
  });
});

describe("what a program chose for SA-24", () => {
  it("marks the items the choice names, on every level", () => {
    const { ladder } = world({
      goals: ["goal.withstand"],
      objectives: ["objective.constrain"],
      techniques: ["technique.segmentation", "technique.redundancy"],
      approaches: ["approach.replication"],
    });
    expect(ladder.chose).toBe(true);
    expect(
      ladderItems(ladder)
        .filter((item) => item.chosen)
        .map((item) => item.title),
    ).toEqual(["Withstand", "Constrain", "Redundancy", "Segmentation", "Replication"]);
  });

  it("marks nothing where the program chose nothing, or its choice was not read", () => {
    for (const choice of [
      undefined,
      null,
      { goals: [], objectives: [], techniques: [], approaches: [] },
      // A code that names none of the ladder's items is passed over.
      { goals: [], objectives: [], techniques: ["technique.unknown"], approaches: [] },
    ]) {
      const { ladder } = world(choice);
      expect(ladder.chose).toBe(false);
      expect(ladderItems(ladder).some((item) => item.chosen)).toBe(false);
    }
  });
});

describe("a catalog and reference data that do not hold everything", () => {
  it("counts no control the catalog lacks or has withdrawn", () => {
    const { source, derivation } = world();
    const controls = new Map(source.controls);
    // IR-4(3) is withdrawn in this catalog, and IR-4(11) is not in it at all.
    controls.set("ir-4.3", { ...controls.get("ir-4.3")!, status: "withdrawn" });
    controls.delete("ir-4.11");
    const ladder = resiliencyLadder({ ...source, controls });
    expect(ladder.controls).toHaveLength(263);
    expect(ladder.byCode.get("approach.dynamic-reconfiguration")?.controls).toHaveLength(7);
    const top = ladderAt(ladder, stackAt(derivation, 4));
    expect(top.all.held).toBe(129);
    // Nothing of Dynamic Reconfiguration is left in the baseline: one more gap.
    expect(top.byItem.get("approach.dynamic-reconfiguration")?.held).toBe(0);
    expect(top.empty.size).toBe(12);
  });

  it("is empty where the framework is not loaded", () => {
    const { source, derivation } = world();
    for (const partial of [
      { ...source, items: [] },
      { ...source, items: [], itemLinks: [], controlLinks: [] },
    ]) {
      const ladder = resiliencyLadder(partial);
      expect(ladderItems(ladder)).toEqual([]);
      expect(ladder.links).toEqual([]);
      expect(ladderAt(ladder, stackAt(derivation, 4)).empty.size).toBe(0);
    }
    // The items without Table E-1: the ladder stands, with no control behind it.
    const unlinked = resiliencyLadder({ ...source, controlLinks: [] });
    expect(ladderItems(unlinked)).toHaveLength(76);
    expect(unlinked.controls).toEqual([]);
    expect(ladderAt(unlinked, stackAt(derivation, 4)).all).toEqual({
      held: 0,
      added: 0,
      removed: 0,
      total: 0,
    });
  });

  it("stands on a baseline with no layers", () => {
    const { ladder, derivation } = world();
    const bare = { layers: [], selected: stackAt(derivation, 0).selected };
    const layers = ladderByLayer(ladder, bare);
    expect(layers).toHaveLength(1);
    expect(layers[0]!.standing.all.held).toBe(64);
    expect(layers[0]!.key).toBeNull();
  });
});
