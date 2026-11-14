import { describe, expect, it } from "vitest";
import {
  isControlStatement,
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

  it("maps on each system the requirement is allocated to that selects the control", () => {
    expect(
      requirementMappingStanding(requirement(["flight", "ground", "lab"]), carriers, new Set()),
    ).toEqual({
      kind: "targets",
      targets: [
        { systemId: "flight", selectedControlId: "selection-flight" },
        { systemId: "ground", selectedControlId: "selection-ground" },
      ],
      mapped: 0,
      eligible: 2,
    });
  });

  it("adds only the systems still missing, and says how many carry one already", () => {
    expect(
      requirementMappingStanding(requirement(["flight", "ground"]), carriers, new Set(["flight"])),
    ).toEqual({
      kind: "targets",
      targets: [{ systemId: "ground", selectedControlId: "selection-ground" }],
      mapped: 1,
      eligible: 2,
    });
  });

  it("has nothing to add once every such system carries a mapping", () => {
    expect(
      requirementMappingStanding(
        requirement(["flight", "ground", "lab"]),
        carriers,
        new Set(["flight", "ground"]),
      ),
    ).toEqual({ kind: "mapped", eligible: 2 });
  });

  it("maps a system it is allocated to twice once", () => {
    const standing = requirementMappingStanding(
      requirement(["ground", "ground"]),
      carriers,
      new Set(),
    );
    expect(standing.kind === "targets" && standing.targets).toEqual([
      { systemId: "ground", selectedControlId: "selection-ground" },
    ]);
  });

  it("says why a requirement can take no mapping", () => {
    expect(requirementMappingStanding(requirement(["flight"], null), carriers, new Set())).toEqual({
      kind: "no_details",
    });
    expect(requirementMappingStanding(requirement([]), carriers, new Set())).toEqual({
      kind: "unallocated",
    });
    expect(requirementMappingStanding(requirement(["lab"]), carriers, new Set())).toEqual({
      kind: "not_selected",
    });
  });
});
