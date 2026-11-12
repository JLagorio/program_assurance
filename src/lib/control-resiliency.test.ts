import { describe, expect, it, vi } from "vitest";
import type { SupportedTechnique, TechniqueSupport } from "./frameworks";

// frameworks.ts holds the hooks beside the readers this module uses; the hooks are not run here.
vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  selectedOf,
  splitByChoice,
  supportedGuidance,
  supportedOnce,
  techniqueControls,
  techniqueParam,
  techniqueSlug,
} = await import("./control-resiliency");

const construct = (kind: "technique" | "approach", slug: string, title: string) => ({
  code: `${kind}.${slug}`,
  title,
});
const segmentation = construct("technique", "segmentation", "Segmentation");
const positioning = construct("technique", "dynamic-positioning", "Dynamic Positioning");
const deception = construct("technique", "deception", "Deception");
const predefined = construct("approach", "predefined-segmentation", "Predefined Segmentation");
const dynamic = construct(
  "approach",
  "dynamic-segmentation-and-isolation",
  "Dynamic Segmentation and Isolation",
);
const relocation = construct("approach", "asset-mobility", "Asset Mobility");

describe("a technique in an address", () => {
  it("is named by its code after the kind", () => {
    expect(techniqueSlug("technique.segmentation")).toBe("segmentation");
    expect(techniqueSlug("technique.dynamic-positioning")).toBe("dynamic-positioning");
    // A code of another shape is kept whole rather than cut.
    expect(techniqueSlug("approach.obfuscation")).toBe("approach.obfuscation");
  });

  it("is read only from a value that could be a slug", () => {
    expect(techniqueParam("segmentation")).toBe("segmentation");
    expect(techniqueParam("non-persistence")).toBe("non-persistence");
    for (const value of [
      "",
      "Segmentation",
      "technique.segmentation",
      "a--b",
      "-a",
      "a b",
      7,
      null,
    ])
      expect(techniqueParam(value)).toBeUndefined();
    expect(techniqueParam(undefined)).toBeUndefined();
  });
});

describe("supportedOnce", () => {
  it("keeps one entry a technique, strongest first, with the approaches of every printing", () => {
    const supported: SupportedTechnique[] = [
      { technique: segmentation, approaches: [predefined], ordinal: 1 },
      { technique: positioning, approaches: [relocation], ordinal: 2 },
      { technique: segmentation, approaches: [predefined, dynamic], ordinal: 3 },
    ];
    expect(supportedOnce(supported)).toEqual([
      { technique: segmentation, approaches: [predefined, dynamic], ordinal: 1 },
      { technique: positioning, approaches: [relocation], ordinal: 2 },
    ]);
    // What it was given is left as it was.
    expect(supported[0]!.approaches).toEqual([predefined]);
    expect(supportedOnce([])).toEqual([]);
  });
});

describe("the controls behind a technique", () => {
  const control = (id: string, approaches = [predefined]) => ({
    id,
    code: id.toUpperCase(),
    title: id,
    approaches,
    ordinal: 1,
  });
  const support = new Map<string, TechniqueSupport>([
    [
      segmentation.code,
      {
        technique: segmentation,
        controls: [control("sc-7"), control("sc-7.21", [predefined, dynamic]), control("ac-4.2")],
      },
    ],
    [positioning.code, { technique: positioning, controls: [control("sc-30.3", [relocation])] }],
  ]);
  const techniques = [positioning, segmentation, deception];

  it("lists every technique in the order given, with the controls a screen counts", () => {
    // AC-4(2) stands for a control the catalog withdrew: the screen leaves it out.
    const behind = techniqueControls(techniques, support, (id) => id !== "ac-4.2");
    expect(behind.map((technique) => [technique.slug, [...technique.controls.keys()]])).toEqual([
      ["dynamic-positioning", ["sc-30.3"]],
      ["segmentation", ["sc-7", "sc-7.21"]],
      // A technique no control of this catalog supports is still listed, with none.
      ["deception", []],
    ]);
    expect(behind[1]).toMatchObject({ code: "technique.segmentation", title: "Segmentation" });
    expect(behind[1]!.controls.get("sc-7.21")).toEqual([predefined, dynamic]);
  });

  it("counts the controls a baseline selects, layer by layer", () => {
    const [moving, segmenting, deceiving] = techniqueControls(techniques, support, () => true);
    const reference = new Set(["sc-7", "ac-1"]);
    const afterOverlay = new Set(["sc-7", "ac-1", "sc-7.21", "sc-30.3"]);
    expect([selectedOf(segmenting!, reference), segmenting!.controls.size]).toEqual([1, 3]);
    expect(selectedOf(segmenting!, afterOverlay)).toBe(2);
    expect(selectedOf(moving!, reference)).toBe(0);
    expect(selectedOf(moving!, afterOverlay)).toBe(1);
    expect(selectedOf(deceiving!, afterOverlay)).toBe(0);
  });
});

describe("splitByChoice", () => {
  const techniques = [deception, positioning, segmentation];

  it("sets the techniques a program chose apart, each list in the order given", () => {
    expect(
      splitByChoice(techniques, [segmentation.code, "technique.unknown", deception.code]),
    ).toEqual({ chosen: [deception, segmentation], others: [positioning] });
  });

  it("leaves one list when the program chose none", () => {
    expect(splitByChoice(techniques, [])).toEqual({ chosen: [], others: techniques });
  });
});

describe("the guidance for what a control supports", () => {
  const item = (code: string, prose: string | null, props: Record<string, unknown> = {}) => ({
    code,
    prose,
    props: props as never,
  });
  const items = [
    item(segmentation.code, "Define and separate system elements.", {
      discussion: "Segmentation limits the spread of damage.",
    }),
    item(predefined.code, "Define enclaves so that they can be protected separately.", {
      informal_description: "Define enclaves to protect them separately.",
      discussion: "Predefined segmentation is set before use.",
      examples: ["Use virtualization.", "", "Isolate security functions."],
    }),
    item(dynamic.code, "Change the configuration of enclaves.", {
      informal_description: "Change the configuration of enclaves.",
      examples: ["Isolate a compromised host."],
    }),
  ];

  it("keeps the table's order and counts the examples a row opens onto", () => {
    const supported: SupportedTechnique[] = [
      { technique: segmentation, approaches: [predefined, dynamic], ordinal: 1 },
      { technique: positioning, approaches: [relocation], ordinal: 2 },
    ];
    const [first, second] = supportedGuidance(supported, items);
    expect(first).toMatchObject({
      technique: {
        code: "technique.segmentation",
        title: "Segmentation",
        definition: "Define and separate system elements.",
        informalDescription: undefined,
        discussion: "Segmentation limits the spread of damage.",
        examples: [],
      },
      examples: 3,
      guided: true,
    });
    // An approach keeps what Table D-4 says of it, in the names frameworks gives the four parts.
    expect(first!.approaches[0]).toEqual({
      code: "approach.predefined-segmentation",
      title: "Predefined Segmentation",
      definition: "Define enclaves so that they can be protected separately.",
      informalDescription: "Define enclaves to protect them separately.",
      discussion: "Predefined segmentation is set before use.",
      examples: ["Use virtualization.", "Isolate security functions."],
    });
    expect(first!.approaches.map((approach) => [approach.title, approach.examples.length])).toEqual(
      [
        ["Predefined Segmentation", 2],
        ["Dynamic Segmentation and Isolation", 1],
      ],
    );
    // A technique and an approach the items do not hold keep their names and open onto nothing.
    expect(second).toMatchObject({
      technique: { title: "Dynamic Positioning", definition: undefined },
      approaches: [{ title: "Asset Mobility", examples: [] }],
      examples: 0,
      guided: false,
    });
    expect(supportedGuidance(supported, []).map((row) => row.guided)).toEqual([false, false]);
  });
});
