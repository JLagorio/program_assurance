import { describe, expect, it } from "vitest";
import {
  WHOLE_CONTROL,
  WHOLE_CONTROL_CHOICE,
  coverageOf,
  coveredObjectives,
  coversTarget,
  isControlStatement,
  isMappingTarget,
  mappingCoverage,
  requirementMappingBaselines,
  requirementMappingStanding,
} from "./requirement-control-mappings";

describe("requirement control statement choices", () => {
  const part = (
    id: string,
    name: string,
    parent: string | null = null,
    prose: string | null = id,
  ) => ({ id, name, parent_part_id: parent, prose, control_id: "control" });
  it("allows statement items and rejects assessment methods, objectives, guidance and their items", () => {
    const parts = [
      part("statement", "statement"),
      part("item", "item", "statement"),
      part("nested", "item", "item"),
      part("interview", "assessment-method"),
      part("guidance", "guidance"),
      part("objective", "assessment-objective"),
      part("objective-item", "item", "objective"),
      part("empty", "statement", null, null),
    ];
    expect(parts.filter((row) => isControlStatement(row, parts)).map((row) => row.id)).toEqual([
      "statement",
      "item",
      "nested",
    ]);
  });
  it("takes an assessment objective of the mapped control as a target, beside a statement", () => {
    const parts = [
      part("statement", "statement"),
      part("item", "item", "statement"),
      part("objective", "assessment-objective"),
      part("leaf", "assessment-objective", "objective"),
      part("interview", "assessment-method"),
      part("guidance", "guidance"),
    ];
    expect(parts.filter((row) => isMappingTarget(row, parts)).map((row) => row.id)).toEqual([
      "statement",
      "item",
      "objective",
      "leaf",
    ]);
    // Another control's objective is a recorded target to review.
    expect(isMappingTarget(part("leaf", "assessment-objective"), parts, "other")).toBe(false);
    expect(isMappingTarget(part("leaf", "assessment-objective"), parts, "control")).toBe(true);
  });
  it("does not accept incomplete, cross-control or cyclic ancestry", () => {
    const missing = part("missing", "item", "unknown");
    const cyclic = part("cycle", "item", "cycle");
    const parent = { ...part("parent", "statement"), control_id: "other" };
    const child = part("child", "item", "parent");
    expect(
      [missing, cyclic, child].map((row) =>
        isControlStatement(row, [missing, cyclic, parent, child]),
      ),
    ).toEqual([false, false, false]);
  });
});

describe("effective profiles for allocated systems", () => {
  const input = {
    systems: [
      { id: "boundary", code: "SYS", name: "Boundary" },
      { id: "child", code: "CPU", name: "Controller" },
      { id: "sibling", code: "NET", name: "Network" },
    ],
    allocations: [{ system_id: "child" }],
    baselines: [
      {
        system_id: "boundary",
        profile_resolution_id: "root-profile",
        source_system_id: "boundary",
        inherited: false,
        source_label: "Latest SSP",
      },
      {
        system_id: "child",
        profile_resolution_id: "child-profile",
        source_system_id: "child",
        inherited: false,
        source_label: "Explicit adoption",
      },
      {
        system_id: "sibling",
        profile_resolution_id: "root-profile",
        source_system_id: "boundary",
        inherited: true,
        source_label: "Latest SSP",
      },
    ],
  };
  it("uses the exact allocated element profile instead of merging parent and sibling selections", () => {
    const result = requirementMappingBaselines(input);
    expect(result.sources.map((row) => row.resolutionId)).toEqual(["child-profile"]);
    expect(result.sources[0]?.systemName).toBe("CPU · Controller");
  });
  it("preserves inherited profile provenance and supports direct boundary allocations", () => {
    const result = requirementMappingBaselines({
      ...input,
      allocations: [{ system_id: "sibling" }, { system_id: "boundary" }],
    });
    expect(result.sources.find((row) => row.systemId === "sibling")).toMatchObject({
      inherited: true,
      sourceSystemId: "boundary",
    });
    expect(result.sources.find((row) => row.systemId === "boundary")).toMatchObject({
      inherited: false,
    });
  });
  it("does not widen unallocated or unavailable targets to all program systems", () => {
    expect(requirementMappingBaselines({ ...input, allocations: [] }).sources).toEqual([]);
    expect(
      requirementMappingBaselines({ ...input, allocations: [{ system_id: "missing" }] }).sources,
    ).toEqual([]);
    expect(requirementMappingBaselines({ ...input, baselines: [] }).sources).toEqual([]);
  });
});

describe("where a control's Map a requirement puts a requirement's mappings", () => {
  // Two systems whose control baselines select the control, each by its own selection; a third
  // whose baseline does not.
  const carriers = new Map([
    ["flight", "selection-flight"],
    ["ground", "selection-ground"],
  ]);
  const requirement = (systemIds: string[], revisionId: string | null = "revision") => ({
    revisionId,
    systemIds,
  });
  /** A mapping of the whole control on each system named. */
  const whole = (...systems: string[]) =>
    new Map(systems.map((system) => [system, new Set([WHOLE_CONTROL])]));

  it("maps on each system the requirement is allocated to that selects the control", () => {
    expect(
      requirementMappingStanding(requirement(["flight", "ground", "lab"]), carriers, new Map()),
    ).toEqual({
      kind: "targets",
      targets: [
        { systemId: "flight", selectedControlId: "selection-flight", objectiveId: null },
        { systemId: "ground", selectedControlId: "selection-ground", objectiveId: null },
      ],
      mapped: 0,
      eligible: 2,
    });
  });

  it("adds only the systems still missing, and says how many carry one already", () => {
    expect(
      requirementMappingStanding(requirement(["flight", "ground"]), carriers, whole("flight")),
    ).toEqual({
      kind: "targets",
      targets: [{ systemId: "ground", selectedControlId: "selection-ground", objectiveId: null }],
      mapped: 1,
      eligible: 2,
    });
  });

  it("has nothing to add once every such system carries a mapping", () => {
    expect(
      requirementMappingStanding(
        requirement(["flight", "ground", "lab"]),
        carriers,
        whole("flight", "ground"),
      ),
    ).toEqual({ kind: "mapped", eligible: 2 });
  });

  it("maps a system it is allocated to twice once", () => {
    const standing = requirementMappingStanding(
      requirement(["ground", "ground"]),
      carriers,
      new Map(),
    );
    expect(standing.kind === "targets" && standing.targets).toEqual([
      { systemId: "ground", selectedControlId: "selection-ground", objectiveId: null },
    ]);
  });

  it("says why a requirement can take no mapping", () => {
    expect(requirementMappingStanding(requirement(["flight"], null), carriers, new Map())).toEqual({
      kind: "no_details",
    });
    expect(requirementMappingStanding(requirement([]), carriers, new Map())).toEqual({
      kind: "unallocated",
    });
    expect(requirementMappingStanding(requirement(["lab"]), carriers, new Map())).toEqual({
      kind: "not_selected",
    });
  });

  // A control with two headings: a. over a.1 and a.2, and b. a leaf of its own.
  const objectives = [
    { id: "a.1", ancestors: ["root", "a"] },
    { id: "a.2", ancestors: ["root", "a"] },
    { id: "b", ancestors: ["root"] },
  ];

  it("maps one row an objective chosen, on each system, and leaves out what a system covers", () => {
    // On flight the requirement maps heading a. already, which covers a.1 and a.2.
    const mappedOn = new Map([["flight", coverageOf(objectives, ["a"])]]);
    expect(
      requirementMappingStanding(
        requirement(["flight", "ground"]),
        carriers,
        mappedOn,
        ["a.1", "b"],
        objectives,
      ),
    ).toEqual({
      kind: "targets",
      targets: [
        { systemId: "flight", selectedControlId: "selection-flight", objectiveId: "b" },
        { systemId: "ground", selectedControlId: "selection-ground", objectiveId: "a.1" },
        { systemId: "ground", selectedControlId: "selection-ground", objectiveId: "b" },
      ],
      mapped: 0,
      eligible: 2,
    });
  });

  it("holds the whole control where a system covers every objective, however it was mapped", () => {
    const everyObjective = new Map([
      ["flight", coverageOf(objectives, ["a", "b"])],
      ["ground", coverageOf(objectives, ["root"])],
    ]);
    expect(
      requirementMappingStanding(
        requirement(["flight", "ground"]),
        carriers,
        everyObjective,
        WHOLE_CONTROL_CHOICE,
        objectives,
      ),
    ).toEqual({ kind: "mapped", eligible: 2 });
    // The whole control covers any objective chosen.
    expect(
      requirementMappingStanding(
        requirement(["flight", "ground"]),
        carriers,
        whole("flight", "ground"),
        ["a.2"],
        objectives,
      ),
    ).toEqual({ kind: "mapped", eligible: 2 });
    // Some objectives on a system leave the whole control to map there.
    const some = requirementMappingStanding(
      requirement(["flight"]),
      carriers,
      new Map([["flight", coverageOf(objectives, ["a.1"])]]),
      WHOLE_CONTROL_CHOICE,
      objectives,
    );
    expect(some.kind === "targets" && some.targets).toEqual([
      { systemId: "flight", selectedControlId: "selection-flight", objectiveId: null },
    ]);
  });

  it("reads nothing chosen as the whole control", () => {
    expect(
      requirementMappingStanding(
        requirement(["flight"]),
        carriers,
        whole("flight"),
        [],
        objectives,
      ),
    ).toEqual({ kind: "mapped", eligible: 1 });
  });
});

describe("what mappings cover", () => {
  const objectives = [
    { id: "a.1", ancestors: ["root", "a"] },
    { id: "a.2", ancestors: ["root", "a"] },
    { id: "b", ancestors: ["root"] },
  ];

  it("covers the objective a mapping names and every objective under it", () => {
    expect([...mappingCoverage(objectives, "a.1")]).toEqual(["a.1"]);
    expect([...mappingCoverage(objectives, "a")]).toEqual(["a.1", "a.2"]);
    expect([...mappingCoverage(objectives, "root")]).toEqual(["a.1", "a.2", "b"]);
  });

  it("covers the whole control where a mapping names no part, or a part that is not an objective", () => {
    expect([...mappingCoverage(objectives, null)]).toEqual([WHOLE_CONTROL]);
    expect([...mappingCoverage(objectives, "statement-item")]).toEqual([WHOLE_CONTROL]);
    // A control the catalog gives no objective is covered by any mapping of it.
    expect(coversTarget(coverageOf([], [null]), null, [])).toBe(true);
    expect(coversTarget(coverageOf([], []), null, [])).toBe(false);
  });

  it("counts the objectives several mappings cover together, and whether they hold a target", () => {
    const coverage = coverageOf(objectives, ["a.1", "b", "b"]);
    expect(coveredObjectives(coverage, objectives)).toBe(2);
    expect(coversTarget(coverage, "a.2", objectives)).toBe(false);
    expect(coversTarget(coverage, "b", objectives)).toBe(true);
    expect(coversTarget(coverage, null, objectives)).toBe(false);
    expect(coversTarget(coverageOf(objectives, ["a", "b"]), null, objectives)).toBe(true);
    expect(coveredObjectives(coverageOf(objectives, [null]), objectives)).toBe(3);
  });

  it("counts a heading that prints a sentence of its own: its own mapping covers it, its leaves' do not", () => {
    // AC-08a. prints a sentence of its own over AC-08a.01 and AC-08a.02, so the control counts it.
    const withHeading = [
      { id: "a", ancestors: ["root"] },
      { id: "a.1", ancestors: ["root", "a"] },
      { id: "a.2", ancestors: ["root", "a"] },
      { id: "b", ancestors: ["root"] },
    ];
    const leaves = coverageOf(withHeading, ["a.1", "a.2", "b"]);
    expect(coveredObjectives(leaves, withHeading)).toBe(3);
    expect(coversTarget(leaves, "a", withHeading)).toBe(false);
    expect(coversTarget(leaves, null, withHeading)).toBe(false);
    expect([...mappingCoverage(withHeading, "a")]).toEqual(["a", "a.1", "a.2"]);
    expect(coversTarget(coverageOf(withHeading, ["a", "b"]), null, withHeading)).toBe(true);
    // What is left to map once the leaves are: the heading alone.
    expect(
      requirementMappingStanding(
        { revisionId: "revision", systemIds: ["system"] },
        new Map([["system", "selection"]]),
        new Map([["system", leaves]]),
        ["a"],
        withHeading,
      ),
    ).toEqual({
      kind: "targets",
      targets: [{ systemId: "system", selectedControlId: "selection", objectiveId: "a" }],
      mapped: 0,
      eligible: 1,
    });
  });
});
