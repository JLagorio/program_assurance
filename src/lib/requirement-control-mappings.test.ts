import { describe, expect, it } from "vitest";
import { isControlStatement, requirementMappingBaselines } from "./requirement-control-mappings";

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
