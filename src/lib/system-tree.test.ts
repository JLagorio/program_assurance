import { describe, expect, it } from "vitest";
import { systemTree } from "./system-tree";

describe("canonical system containment", () => {
  const records = [
    { id: "boundary", parent_system_id: null },
    { id: "system", parent_system_id: "boundary" },
    { id: "component", parent_system_id: "system" },
    { id: "other-boundary", parent_system_id: null },
  ];
  it("uses exact parent identities and scopes a record view to its whole subtree", () => {
    const roots = systemTree(records);
    expect(roots.map((row) => row.id)).toEqual(["boundary", "other-boundary"]);
    expect(roots[0]?.children[0]?.children[0]?.id).toBe("component");
    expect(systemTree(records, "system").map((row) => row.id)).toEqual(["system"]);
    expect(systemTree(records, "system")[0]?.children[0]?.id).toBe("component");
    expect(systemTree(records, "missing")).toEqual([]);
    expect(records[0]).not.toHaveProperty("children");
  });
  it("keeps unresolved and circular containment visible without fabricating a parent", () => {
    const roots = systemTree([
      { id: "a", parent_system_id: "b" },
      { id: "b", parent_system_id: "a" },
      { id: "c", parent_system_id: "absent" },
      { id: "d", parent_system_id: "d" },
    ]);
    expect(roots.map((row) => row.id)).toEqual(["a", "b", "c", "d"]);
    expect(roots.every((row) => row.children.length === 0)).toBe(true);
  });
});
