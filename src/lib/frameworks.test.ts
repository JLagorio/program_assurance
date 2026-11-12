import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid, type FakeCall } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { frameworkItemWords, productColumnLabel, productRecordNoun } =
  await import("./product-records");

const {
  ATTACK_FRAMEWORK,
  CYBER_RESILIENCY_FRAMEWORK,
  LIFE_CYCLE_FRAMEWORK,
  frameworkProps,
  itemGuidance,
  itemReference,
  itemsByParent,
  propList,
  propText,
  readFrameworkControlLinks,
  readFrameworkItemLinks,
  readFrameworkItems,
  readFrameworks,
  readResiliencyControlLinks,
  resiliencyByControl,
  resiliencyByTechnique,
} = await import("./frameworks");
type FrameworkControlLink = import("./frameworks").FrameworkControlLink;
type FrameworkItem = import("./frameworks").FrameworkItem;

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const catalogRevision = uuid(700);

/** The view's sort key for a label: each run of digits padded, the rest in lower case. */
const order = (label: string) =>
  label.replace(/\d+/g, (digits) => digits.padStart(12, "0")).toLowerCase();
const words = (slug: string) =>
  slug.replace(
    /(^|-)([a-z])/g,
    (_match, gap: string, letter: string) => `${gap ? " " : ""}${letter.toUpperCase()}`,
  );
const controlIds: Record<string, string> = {
  "AC-2(6)": uuid(1),
  "AC-2(8)": uuid(2),
  "AC-10": uuid(3),
  "SI-4": uuid(4),
};

let next = 100;
/** One Table E-1 link: a control, the technique group's place, the approach's place in the group. */
function support(
  control: string,
  group: number | null,
  place: number,
  approach: string,
  technique: string,
  overrides: Partial<FrameworkControlLink> = {},
): FrameworkControlLink {
  return {
    id: uuid(next++),
    framework_code: CYBER_RESILIENCY_FRAMEWORK,
    framework_revision_id: uuid(800),
    relation: "supports",
    ordinal: group,
    props: { technique: `technique.${technique}` },
    source_identifier: `E-1:${control}:${group}:${place}`,
    printed_in: "Table E-1",
    item_id: uuid(500 + approach.length),
    item_code: `approach.${approach}`,
    item_kind: "approach",
    item_title: words(approach),
    parent_item_id: uuid(600 + technique.length),
    parent_item_code: `technique.${technique}`,
    parent_item_kind: "technique",
    parent_item_title: words(technique),
    control_label: control,
    control_order: order(control),
    resolution_status: "resolved",
    control_id: controlIds[control] ?? null,
    control_code: control,
    control_title: `${control} title`,
    catalog_revision_id: catalogRevision,
    // The group the table prints the approach in, which the view reads from the link's row.
    technique_item_id: uuid(600 + technique.length),
    technique_code: `technique.${technique}`,
    technique_title: words(technique),
    ...overrides,
  };
}

/** Table E-1's rows for a few controls, out of order, as a read in parts could return them. */
const tableE1 = () => [
  support("SI-4", 1, 1, "monitoring-and-damage-assessment", "analytic-monitoring"),
  support("AC-2(8)", 2, 1, "dynamic-privileges", "privilege-restriction"),
  support("AC-2(8)", 1, 10, "adaptive-management", "adaptive-response"),
  support("AC-2(8)", 1, 2, "dynamic-reconfiguration", "adaptive-response"),
  support("AC-2(8)", 1, 1, "dynamic-resource-allocation", "adaptive-response"),
  support("AC-10", 1, 1, "dynamic-privileges", "privilege-restriction"),
  support("AC-2(6)", 2, 1, "dynamic-reconfiguration", "adaptive-response"),
  support("AC-2(6)", 1, 1, "dynamic-privileges", "privilege-restriction"),
];

describe("the framework codes", () => {
  it("name the three pinned transcriptions", () => {
    expect(CYBER_RESILIENCY_FRAMEWORK).toBe("nist-sp800-160v2r1-cref");
    expect(ATTACK_FRAMEWORK).toBe("nist-sp800-160v2r1-attack");
    expect(LIFE_CYCLE_FRAMEWORK).toBe("nist-sp800-160v1r1-processes");
  });
});

describe("what a control supports", () => {
  it("lists a control's techniques strongest first, each with its approaches as printed", () => {
    const byControl = resiliencyByControl(tableE1());
    expect(byControl.get(controlIds["AC-2(8)"]!)).toEqual([
      {
        technique: { code: "technique.adaptive-response", title: "Adaptive Response" },
        // The table's order within the group: the second approach before the tenth.
        approaches: [
          { code: "approach.dynamic-resource-allocation", title: "Dynamic Resource Allocation" },
          { code: "approach.dynamic-reconfiguration", title: "Dynamic Reconfiguration" },
          { code: "approach.adaptive-management", title: "Adaptive Management" },
        ],
        ordinal: 1,
      },
      {
        technique: { code: "technique.privilege-restriction", title: "Privilege Restriction" },
        approaches: [{ code: "approach.dynamic-privileges", title: "Dynamic Privileges" }],
        ordinal: 2,
      },
    ]);
    expect(byControl.get(controlIds["AC-2(6)"]!)!.map((entry) => entry.technique.code)).toEqual([
      "technique.privilege-restriction",
      "technique.adaptive-response",
    ]);
    // The controls come in the catalog's order: AC-2(6) before AC-2(8) before AC-10.
    expect([...byControl.keys()]).toEqual([
      controlIds["AC-2(6)"],
      controlIds["AC-2(8)"],
      controlIds["AC-10"],
      controlIds["SI-4"],
    ]);
  });

  it("lists the controls behind a technique once each, in the catalog's order", () => {
    const byTechnique = resiliencyByTechnique(tableE1());
    expect([...byTechnique.keys()].sort()).toEqual([
      "technique.adaptive-response",
      "technique.analytic-monitoring",
      "technique.privilege-restriction",
    ]);
    const response = byTechnique.get("technique.adaptive-response")!;
    expect(response.technique).toEqual({
      code: "technique.adaptive-response",
      title: "Adaptive Response",
    });
    // A control is its id: the screen names it from the catalog rows it holds.
    expect(response.controls).toEqual([
      {
        id: controlIds["AC-2(6)"],
        approaches: [
          { code: "approach.dynamic-reconfiguration", title: "Dynamic Reconfiguration" },
        ],
        ordinal: 2,
      },
      {
        id: controlIds["AC-2(8)"],
        approaches: [
          { code: "approach.dynamic-resource-allocation", title: "Dynamic Resource Allocation" },
          { code: "approach.dynamic-reconfiguration", title: "Dynamic Reconfiguration" },
          { code: "approach.adaptive-management", title: "Adaptive Management" },
        ],
        ordinal: 1,
      },
    ]);
    expect(
      byTechnique.get("technique.privilege-restriction")!.controls.map((control) => control.id),
    ).toEqual([controlIds["AC-2(6)"], controlIds["AC-2(8)"], controlIds["AC-10"]]);
  });

  it("reads a link's technique from the group it is printed in, never the approach's parent", () => {
    // Table E-1 lists Self-Challenge, a Coordinated Protection approach, under Deception for SR-7.
    const printed = [
      support("SI-4", 1, 1, "obfuscation", "deception"),
      support("SI-4", 1, 2, "self-challenge", "deception", {
        parent_item_code: "technique.coordinated-protection",
        parent_item_title: "Coordinated Protection",
      }),
    ];
    expect(resiliencyByControl(printed).get(controlIds["SI-4"]!)).toEqual([
      {
        technique: { code: "technique.deception", title: "Deception" },
        approaches: [
          { code: "approach.obfuscation", title: "Obfuscation" },
          { code: "approach.self-challenge", title: "Self Challenge" },
        ],
        ordinal: 1,
      },
    ]);
    expect([...resiliencyByTechnique(printed).keys()]).toEqual(["technique.deception"]);
    // The link alone still says its group: the view names the technique on every row.
    expect(resiliencyByControl([printed[1]!]).get(controlIds["SI-4"]!)![0]!.technique).toEqual({
      code: "technique.deception",
      title: "Deception",
    });
  });

  it("takes a link to a technique as its own group, and leaves out one printed under none", () => {
    const none = { technique_item_id: null, technique_code: null, technique_title: null };
    // A link to a technique itself names no approach.
    const whole = support("SI-4", 2, 1, "unused", "unused", {
      ...none,
      props: {},
      item_code: "technique.deception",
      item_kind: "technique",
      item_title: "Deception",
      parent_item_id: null,
      parent_item_code: null,
      parent_item_kind: null,
      parent_item_title: null,
    });
    // An approach printed under no technique: its parent does not stand in.
    const loose = support("SI-4", 1, 1, "sensor-fusion-and-analysis", "analytic-monitoring", {
      ...none,
      props: {},
    });
    expect(resiliencyByControl([whole, loose]).get(controlIds["SI-4"]!)).toEqual([
      {
        technique: { code: "technique.deception", title: "Deception" },
        approaches: [],
        ordinal: 2,
      },
    ]);
    expect([...resiliencyByTechnique([whole, loose]).keys()]).toEqual(["technique.deception"]);
  });

  it("leaves out a link whose control is not resolved, and places a link with no order last", () => {
    const unresolved = support("AC-99", 1, 1, "dynamic-privileges", "privilege-restriction", {
      resolution_status: "unresolved",
      control_id: null,
      control_code: null,
      control_title: null,
      catalog_revision_id: null,
    });
    const unordered = support("SI-4", null, 1, "dynamic-privileges", "privilege-restriction");
    const byControl = resiliencyByControl([unordered, unresolved, ...tableE1()]);
    expect(byControl.size).toBe(4);
    expect(byControl.get(controlIds["SI-4"]!)!.map((entry) => entry.ordinal)).toEqual([1, null]);
    expect(resiliencyByTechnique([unresolved]).size).toBe(0);
  });
});

describe("reading a framework's items", () => {
  const item = (code: string, kind: string, parent: string | null, ordinal: number) =>
    ({
      id: uuid(next++),
      framework_code: LIFE_CYCLE_FRAMEWORK,
      framework_revision_id: uuid(801),
      kind,
      code,
      code_order: order(code),
      title: code,
      prose: null,
      ordinal,
      props: {},
      printed_in: "Appendix H",
      parent_item_id: parent ? uuid(1) : null,
      parent_code: parent,
      parent_kind: parent ? "process" : null,
      parent_title: parent,
    }) satisfies FrameworkItem;

  it("asks the view for the framework's kinds, in the workspace's scope, in code order", async () => {
    const rows = [
      item("outcome.BA.10", "outcome", "process.BA", 10),
      item("outcome.BA.2", "outcome", "process.BA", 2),
    ];
    const { client, calls } = fakeClient(() => ({ data: rows, error: null, count: rows.length }));
    const items = await readFrameworkItems(client, context, LIFE_CYCLE_FRAMEWORK, [
      "process",
      "outcome",
      "outcome",
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("framework_item_rows");
    expect(args(calls[0], "select")[0]).toEqual([
      "id,framework_code,framework_revision_id,kind,code,code_order,title,prose,ordinal,props,printed_in,parent_item_id,parent_code,parent_kind,parent_title",
      { count: "exact", head: false },
    ]);
    expect(filter(calls[0], "eq", "framework_code")).toBe(LIFE_CYCLE_FRAMEWORK);
    // Each kind once, in one spelling.
    expect(filter(calls[0], "in", "kind")).toEqual(["outcome", "process"]);
    expect(args(calls[0], "or")[0]).toEqual([`tenant_id.eq.${tenantId},tenant_id.is.null`]);
    expect(args(calls[0], "order")).toEqual([
      ["code_order", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    // The second outcome before the tenth.
    expect(items.map((row) => row.code)).toEqual(["outcome.BA.2", "outcome.BA.10"]);
  });

  it("reads every kind when none is named, a page of rows at a time", async () => {
    const rows = Array.from({ length: 620 }, (_, index) =>
      item(`outcome.BA.${index + 1}`, "outcome", "process.BA", index + 1),
    );
    const { client, calls } = fakeClient((call) => {
      const [from, to] = args(call, "range")[0] as [number, number];
      return { data: rows.slice(from, to + 1), error: null, count: rows.length };
    });
    const items = await readFrameworkItems(client, context, LIFE_CYCLE_FRAMEWORK);
    expect(items).toHaveLength(620);
    expect(calls.map((call) => args(call, "range")[0])).toEqual([
      [0, 499],
      [500, 999],
    ]);
    expect(filter(calls[0], "in", "kind")).toBeUndefined();
  });

  it("groups items under the item that holds them, in the publication's order", () => {
    const held = itemsByParent([
      item("outcome.BA.2", "outcome", "process.BA", 2),
      item("process.BA", "process", null, 1),
      item("outcome.AQ.1", "outcome", "process.AQ", 1),
      item("outcome.BA.1", "outcome", "process.BA", 1),
    ]);
    expect(held.get("process.BA")!.map((row) => row.code)).toEqual([
      "outcome.BA.1",
      "outcome.BA.2",
    ]);
    expect(held.get("process.AQ")!.map((row) => row.code)).toEqual(["outcome.AQ.1"]);
    expect(held.get(null)!.map((row) => row.code)).toEqual(["process.BA"]);
  });

  it("says a failed read", async () => {
    const { client } = fakeClient(() => ({
      data: null,
      error: { message: "permission denied for view framework_item_rows" },
      count: null,
    }));
    await expect(readFrameworkItems(client, context, LIFE_CYCLE_FRAMEWORK)).rejects.toThrow(
      "permission denied for view framework_item_rows",
    );
  });
});

describe("reading control links", () => {
  /** Answers each request with one link per control it names. */
  const answering = (call: FakeCall) => {
    const controls = (filter(call, "in", "control_id") as string[] | undefined) ?? [];
    const data = controls.map((id) =>
      support("SI-4", 1, 1, "dynamic-privileges", "privilege-restriction", {
        control_id: id,
        control_order: id,
      }),
    );
    return { data, error: null, count: data.length };
  };

  it("reads Table E-1 for one catalog revision in one request", async () => {
    const rows = tableE1();
    const { client, calls } = fakeClient(() => ({ data: rows, error: null, count: rows.length }));
    const links = await readFrameworkControlLinks(client, context, CYBER_RESILIENCY_FRAMEWORK, {
      catalogRevisionId: catalogRevision,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("framework_control_link_rows");
    expect(filter(calls[0], "eq", "framework_code")).toBe(CYBER_RESILIENCY_FRAMEWORK);
    expect(filter(calls[0], "eq", "catalog_revision_id")).toBe(catalogRevision);
    expect(args(calls[0], "in")).toEqual([]);
    expect(args(calls[0], "order")).toEqual([
      ["control_order", { ascending: true, nullsFirst: false }],
      ["ordinal", { ascending: true, nullsFirst: false }],
      ["source_identifier", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    // The catalog's order of controls, then the table's order within a control.
    expect(links.map((link) => link.source_identifier)).toEqual([
      "E-1:AC-2(6):1:1",
      "E-1:AC-2(6):2:1",
      "E-1:AC-2(8):1:1",
      "E-1:AC-2(8):1:2",
      "E-1:AC-2(8):1:10",
      "E-1:AC-2(8):2:1",
      "E-1:AC-10:1:1",
      "E-1:SI-4:1:1",
    ]);
  });

  it("reads Table E-1 whole with the columns the regrouping reads, and no other", async () => {
    const columns = [
      "control_order",
      "ordinal",
      "source_identifier",
      "control_id",
      "technique_code",
      "technique_title",
      "item_kind",
      "item_code",
      "item_title",
    ] as const;
    const whole = tableE1();
    // What the view answers for those columns: each link without the rest of its row.
    const rows = whole.map((link) =>
      Object.fromEntries(columns.map((column) => [column, link[column]])),
    );
    const { client, calls } = fakeClient(() => ({ data: rows, error: null, count: rows.length }));
    const links = await readResiliencyControlLinks(client, context, catalogRevision);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("framework_control_link_rows");
    expect(args(calls[0], "select")[0]).toEqual([
      columns.join(","),
      { count: "exact", head: false },
    ]);
    expect(filter(calls[0], "eq", "framework_code")).toBe(CYBER_RESILIENCY_FRAMEWORK);
    expect(filter(calls[0], "eq", "catalog_revision_id")).toBe(catalogRevision);
    expect(args(calls[0], "in")).toEqual([]);
    expect(args(calls[0], "order")).toEqual([
      ["control_order", { ascending: true, nullsFirst: false }],
      ["ordinal", { ascending: true, nullsFirst: false }],
      ["source_identifier", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    // The catalog's order of controls, then the table's, as a read of whole links gives them.
    expect(links.map((link) => link.source_identifier)).toEqual([
      "E-1:AC-2(6):1:1",
      "E-1:AC-2(6):2:1",
      "E-1:AC-2(8):1:1",
      "E-1:AC-2(8):1:2",
      "E-1:AC-2(8):1:10",
      "E-1:AC-2(8):2:1",
      "E-1:AC-10:1:1",
      "E-1:SI-4:1:1",
    ]);
    expect(Object.keys(links[0]!).sort()).toEqual([...columns].sort());
    // The narrowed links regroup as whole links do.
    expect(resiliencyByControl(links)).toEqual(resiliencyByControl(whole));
    expect(resiliencyByTechnique(links)).toEqual(resiliencyByTechnique(whole));
    expect(resiliencyByControl(links).size).toBe(4);
  });

  it("reads a long list of controls in parts and puts them back in order", async () => {
    const ids = Array.from({ length: 250 }, (_, index) => uuid(index + 1));
    const { client, calls } = fakeClient(answering);
    const links = await readFrameworkControlLinks(client, context, ATTACK_FRAMEWORK, {
      // Out of order, with a repeat and an empty id.
      controlIds: [...[...ids].reverse(), ids[0], null],
      relation: "mitigates",
    });
    expect(calls.map((call) => (filter(call, "in", "control_id") as string[]).length)).toEqual([
      100, 100, 50,
    ]);
    for (const call of calls) {
      expect(filter(call, "eq", "framework_code")).toBe(ATTACK_FRAMEWORK);
      expect(filter(call, "eq", "relation")).toBe("mitigates");
    }
    expect(links.map((link) => link.control_id)).toEqual(ids);
  });

  it("narrows by the linked items and by the technique the links are printed under", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readFrameworkControlLinks(client, context, ATTACK_FRAMEWORK, {
      itemCodes: ["T1595.001", "T1595"],
    });
    await readFrameworkControlLinks(client, context, CYBER_RESILIENCY_FRAMEWORK, {
      techniqueCodes: ["technique.deception"],
      catalogRevisionId: catalogRevision,
    });
    await readFrameworkControlLinks(client, context, ATTACK_FRAMEWORK, { itemIds: [uuid(5)] });
    expect(filter(calls[0], "in", "item_code")).toEqual(["T1595", "T1595.001"]);
    expect(filter(calls[1], "in", "technique_code")).toEqual(["technique.deception"]);
    expect(filter(calls[1], "eq", "catalog_revision_id")).toBe(catalogRevision);
    expect(filter(calls[2], "in", "item_id")).toEqual([uuid(5)]);
  });

  it("reads nothing for an empty list", async () => {
    const { client, calls } = fakeClient(answering);
    await expect(
      readFrameworkControlLinks(client, context, ATTACK_FRAMEWORK, { controlIds: [] }),
    ).resolves.toEqual([]);
    await expect(
      readFrameworkControlLinks(client, context, ATTACK_FRAMEWORK, {
        controlIds: [uuid(1)],
        itemCodes: [],
      }),
    ).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("reading item links", () => {
  it("narrows by relation and by the items' codes, in the publication's order", async () => {
    const link = (identifier: string) => ({
      id: uuid(next++),
      framework_code: ATTACK_FRAMEWORK,
      framework_revision_id: uuid(802),
      relation: "affected-by",
      ordinal: null,
      props: { effects: ["Detect", "Contain"] },
      source_identifier: identifier,
      printed_in: "Table F-3",
      source_item_id: uuid(1),
      source_code: "T1595",
      source_kind: "attack-technique",
      source_title: "Active Scanning",
      source_framework_code: ATTACK_FRAMEWORK,
      target_item_id: uuid(2),
      target_code: "approach.obfuscation",
      target_kind: "approach",
      target_title: "Obfuscation",
      target_framework_code: CYBER_RESILIENCY_FRAMEWORK,
    });
    const rows = [link("F:T1595:10"), link("F:T1595:2")];
    const { client, calls } = fakeClient(() => ({ data: rows, error: null, count: rows.length }));
    const links = await readFrameworkItemLinks(client, context, ATTACK_FRAMEWORK, {
      relation: "affected-by",
      sourceCodes: ["T1595"],
      targetCodes: ["approach.obfuscation"],
    });
    expect(calls[0]!.table).toBe("framework_item_link_rows");
    expect(filter(calls[0], "eq", "framework_code")).toBe(ATTACK_FRAMEWORK);
    expect(filter(calls[0], "eq", "relation")).toBe("affected-by");
    expect(filter(calls[0], "in", "source_code")).toEqual(["T1595"]);
    expect(filter(calls[0], "in", "target_code")).toEqual(["approach.obfuscation"]);
    expect(links.map((row) => row.source_identifier)).toEqual(["F:T1595:2", "F:T1595:10"]);
    expect(propList(links[0]!.props, "effects")).toEqual(["Detect", "Contain"]);
    expect(propText(links[0]!.props, "tactic")).toBeUndefined();
  });
});

describe("reading the frameworks", () => {
  const row = {
    id: uuid(10),
    code: CYBER_RESILIENCY_FRAMEWORK,
    title: "Cyber resiliency constructs",
    framework_revision_id: uuid(11),
    version: "Rev. 1",
    format: "reference-framework/1",
    content_sha256: "a".repeat(64),
    catalog_revision_id: catalogRevision,
    source_document: {
      title: "Developing Cyber-Resilient Systems",
      url: "https://example.test/source.pdf",
      sha256: "b".repeat(64),
      pages: 310,
      rights_statement: null,
    },
    method: { tool: "pdftotext", tool_version: "26.04.0", script: "a-script.mjs" },
    corrections: [
      { printed_in: "Table E-1", printed: "Adaptve", transcribed: "Adaptive", reason: "Misprint." },
    ],
    recorded_at: "2026-11-11T00:00:00+00:00",
    authority: "A transcription",
    authoritative: false,
    rights: null,
    notes: null,
  };

  it("reads each framework at its current revision, with its source and corrections", async () => {
    const { client, calls } = fakeClient(() => ({ data: [row], error: null, count: 1 }));
    const frameworks = await readFrameworks(client, context);
    expect(calls[0]!.table).toBe("framework_rows");
    expect(args(calls[0], "order")).toEqual([
      ["code", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    expect(frameworks).toEqual([row]);
    expect(frameworks[0]!.source_document.pages).toBe(310);
    expect(frameworks[0]!.corrections[0]!.transcribed).toBe("Adaptive");
  });

  it("refuses a row that is not a framework at a revision", async () => {
    const { client } = fakeClient(() => ({
      data: [{ ...row, framework_revision_id: null }],
      error: null,
      count: 1,
    }));
    await expect(readFrameworks(client, context)).rejects.toThrow();
  });
});

describe("a link's or an item's properties", () => {
  it("reads a text and a list, and nothing from another shape", () => {
    const props = { tactic: "tactic.reconnaissance", effects: ["Detect", 3, "Contain"], empty: "" };
    expect(propText(props, "tactic")).toBe("tactic.reconnaissance");
    expect(propText(props, "empty")).toBeUndefined();
    expect(propText(props, "effects")).toBeUndefined();
    expect(propList(props, "effects")).toEqual(["Detect", "Contain"]);
    expect(propList(props, "tactic")).toEqual([]);
    expect(propList(props, "absent")).toEqual([]);
  });

  it("reads a reference to an item of the same framework or of another", () => {
    expect(itemReference("tactic.reconnaissance", ATTACK_FRAMEWORK)).toEqual({
      framework: ATTACK_FRAMEWORK,
      code: "tactic.reconnaissance",
    });
    expect(
      itemReference(`${CYBER_RESILIENCY_FRAMEWORK}:approach.obfuscation`, ATTACK_FRAMEWORK),
    ).toEqual({ framework: CYBER_RESILIENCY_FRAMEWORK, code: "approach.obfuscation" });
  });
});

describe("an item's guidance", () => {
  const approach = {
    prose: "Define enclaves so that they can be protected separately.",
    props: {
      informal_description: "Define enclaves to protect them separately.",
      discussion: "Predefined enclaves facilitate the use of other techniques.",
      examples: ["Use cryptographic separation for maintenance.", "Employ system partitioning."],
    },
  };

  it("reads the definition from the prose and the rest from the properties", () => {
    expect(itemGuidance(approach)).toEqual({
      definition: "Define enclaves so that they can be protected separately.",
      informalDescription: "Define enclaves to protect them separately.",
      discussion: "Predefined enclaves facilitate the use of other techniques.",
      // One a bullet, in the order printed.
      examples: ["Use cryptographic separation for maintenance.", "Employ system partitioning."],
    });
    // A technique has a definition and a discussion; the table lists its examples by approach.
    expect(
      itemGuidance({
        prose: "Define and separate system elements.",
        props: { discussion: "Reduce the adversary's scope for lateral movement." },
      }),
    ).toEqual({
      definition: "Define and separate system elements.",
      informalDescription: undefined,
      discussion: "Reduce the adversary's scope for lateral movement.",
      examples: [],
    });
  });

  it("answers with what is there for an item the publication prints no guidance for", () => {
    // A security outcome is its sentence alone; an ATT&CK technique's properties say other things.
    expect(itemGuidance({ prose: null, props: {} })).toEqual({
      definition: undefined,
      informalDescription: undefined,
      discussion: undefined,
      examples: [],
    });
    expect(
      itemGuidance({
        prose: "",
        props: { discussion: 3, examples: "not a list", informal_description: ["x"] },
      }),
    ).toEqual({
      definition: undefined,
      informalDescription: undefined,
      discussion: undefined,
      examples: [],
    });
    expect(
      itemGuidance({ prose: null, props: { examples: ["Kept.", 7, "", null] } }).examples,
    ).toEqual(["Kept."]);
  });

  it("reads a stored props value as properties, and anything else as none", () => {
    expect(frameworkProps(approach.props)).toBe(approach.props);
    for (const value of [null, undefined, "text", 3, true, ["a"]])
      expect(frameworkProps(value)).toEqual({});
    // The two columns of a framework_items row, as a generic read returns them.
    const row: Record<string, unknown> = { prose: approach.prose, props: approach.props };
    expect(
      itemGuidance({
        prose: typeof row["prose"] === "string" ? row["prose"] : null,
        props: frameworkProps(row["props"]),
      }).examples,
    ).toHaveLength(2);
  });

  it("reads Table D-4's guidance from the pinned cyber resiliency constructs", () => {
    const reference = fileURLToPath(new URL("../../supabase/reference", import.meta.url));
    const manifest = JSON.parse(readFileSync(`${reference}/manifest.json`, "utf8")) as {
      sources: { id: string; file: string }[];
    };
    const source = manifest.sources.find(
      (entry) => entry.id === `${CYBER_RESILIENCY_FRAMEWORK}-transcription`,
    )!;
    const { items } = JSON.parse(
      gunzipSync(readFileSync(`${reference}/${source.file}`)).toString("utf8"),
    ) as { items: { code: string; kind: string; prose: string | null; props: unknown }[] };
    const guidance = new Map(
      items.map((item) => [
        item.code,
        {
          kind: item.kind,
          ...itemGuidance({ prose: item.prose, props: frameworkProps(item.props) }),
        },
      ]),
    );
    const ofKind = (kind: string) => [...guidance.values()].filter((entry) => entry.kind === kind);
    // Every technique and approach has a definition and a discussion.
    expect(ofKind("technique")).toHaveLength(14);
    expect(ofKind("approach")).toHaveLength(50);
    for (const entry of [...ofKind("technique"), ...ofKind("approach")]) {
      expect(entry.definition).toBeTruthy();
      expect(entry.discussion).toBeTruthy();
    }
    // The informal description and the examples are an approach's.
    for (const entry of ofKind("technique")) {
      expect(entry.informalDescription).toBeUndefined();
      expect(entry.examples).toEqual([]);
    }
    for (const entry of ofKind("approach")) {
      expect(entry.informalDescription).toBeTruthy();
      expect(entry.examples.length).toBeGreaterThan(0);
    }
    expect(ofKind("approach").reduce((count, entry) => count + entry.examples.length, 0)).toBe(193);
    // No other kind carries a discussion or examples: a goal, an objective and a design
    // principle answer with their definition alone.
    for (const entry of guidance.values())
      if (entry.kind !== "technique" && entry.kind !== "approach") {
        expect(entry.definition).toBeTruthy();
        expect(entry.discussion).toBeUndefined();
        expect(entry.examples).toEqual([]);
      }
    const predefined = guidance.get("approach.predefined-segmentation")!;
    expect(predefined.examples).toHaveLength(13);
    expect(predefined.examples[0]).toBe(
      "Use virtualization to maintain separate processing domains based on user privileges.",
    );
    expect(predefined.examples[3]).toBe("Isolate security functions from non-security functions.");
    expect(guidance.get("technique.segmentation")!.discussion).toBe(
      "Reduce the adversary’s scope for lateral movement or command and control (C2).",
    );
  });
});

describe("a framework item in the product's words", () => {
  const reference = fileURLToPath(new URL("../../supabase/reference", import.meta.url));

  /** Every item of the transcriptions the reference manifest pins, with how many items hold it. */
  function pinnedItems() {
    const manifest = JSON.parse(readFileSync(`${reference}/manifest.json`, "utf8")) as {
      sources: { file: string; format: string }[];
    };
    return manifest.sources
      .filter((source) => source.format.startsWith("reference-framework/"))
      .flatMap((source) => {
        const { items } = JSON.parse(
          gunzipSync(readFileSync(`${reference}/${source.file}`)).toString("utf8"),
        ) as { items: { code: string; kind: string; parent: string | null }[] };
        const parents = new Map(items.map((item) => [item.code, item.parent]));
        return items.map((item) => {
          let depth = 0;
          for (let held = item.parent; held; held = parents.get(held) ?? null) depth += 1;
          return { code: item.code, kind: item.kind, depth };
        });
      });
  }

  it("has words for every kind the pinned transcriptions hold, and for what holds each", () => {
    const items = pinnedItems();
    expect(items.length).toBeGreaterThan(600);
    const deepest = new Map<string, number>();
    for (const item of items) {
      const words = frameworkItemWords(item.kind);
      expect(words, `${item.kind} has no words in src/lib/product-records.ts`).toBeDefined();
      deepest.set(item.kind, Math.max(deepest.get(item.kind) ?? 0, item.depth));
      // A code the transcription made up is `<kind>.<name>`; the publication's own identifier
      // (T1190, M1016, CM1101) leads the item's name.
      expect(words!.coded, item.code).toBe(!/^[a-z-]+\./.test(item.code));
    }
    // One label for each item that can hold one of the kind: an outcome's process and its group.
    for (const [kind, depth] of deepest)
      expect(frameworkItemWords(kind)!.holders, kind).toHaveLength(depth);
  });

  it("names an item for what it is, and the item that holds it for what it is to it", () => {
    expect(productRecordNoun("framework_items", { kind: "outcome" })).toBe("security outcome");
    expect(productRecordNoun("framework_items", { kind: "process" })).toBe("life cycle process");
    expect(productRecordNoun("framework_items", { kind: "technique" })).toBe(
      "resiliency technique",
    );
    expect(productRecordNoun("framework_item_rows", { kind: "attack-technique" })).toBe(
      "ATT&CK technique",
    );
    expect(frameworkItemWords("outcome")!.holders).toEqual(["Process", "Group"]);
    expect(productColumnLabel("framework_items", "parent_item_id", { kind: "outcome" })).toBe(
      "Process",
    );
    expect(productColumnLabel("framework_item_rows", "parent_item_id", { kind: "approach" })).toBe(
      "Technique",
    );
    expect(frameworkItemWords("approach")!.text).toBe("Definition");
    expect(frameworkItemWords("candidate-mitigation")!.text).toBe("Description");
  });

  it("leaves a kind it has no words for, and a record that is not an item, as they were", () => {
    expect(frameworkItemWords("something-new")).toBeUndefined();
    expect(frameworkItemWords("toString")).toBeUndefined();
    expect(frameworkItemWords(null)).toBeUndefined();
    expect(productRecordNoun("framework_items", { kind: "something-new" })).toBe("framework item");
    expect(productRecordNoun("framework_items")).toBe("framework item");
    expect(productRecordNoun("risks", { kind: "outcome" })).toBe("risk");
    // A goal is held by nothing, so its parent column keeps the column's own words.
    expect(
      productColumnLabel("framework_items", "parent_item_id", { kind: "goal" }),
    ).toBeUndefined();
    expect(productColumnLabel("framework_items", "parent_item_id")).toBeUndefined();
    expect(
      productColumnLabel("framework_items", "printed_in", { kind: "outcome" }),
    ).toBeUndefined();
    expect(productColumnLabel("risks", "parent_item_id", { kind: "outcome" })).toBeUndefined();
  });
});
