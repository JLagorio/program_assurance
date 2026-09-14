import { describe, expect, it } from "vitest";
import { requirementIdentityLinks, requirementTree } from "./requirement-tree";

const records = ["a", "b", "c", "d"].map((id) => ({ id, revisionId: `${id}-v2` }));
const edge = (parent: string, child: string) => ({
  parent_requirement_revision_id: `${parent}-v2`,
  child_requirement_revision_id: `${child}-v2`,
});

describe("current requirement relationships", () => {
  const content = (id: string, requirement: string, version: number) => ({
    id,
    engineering_requirement_id: requirement,
    version_number: version,
  });
  it("shows one parent when the retired workflow copied the same derivation across six snapshots", () => {
    const contents = [
      ...[4, 5, 6, 7, 8, 9].map((version) => content(`parent-${version}`, "parent", version)),
      content("child-2", "child", 2),
    ];
    const links = [4, 5, 6, 7, 8, 9].map((version) => ({
      parent_requirement_revision_id: `parent-${version}`,
      child_requirement_revision_id: "child-2",
    }));
    expect(requirementIdentityLinks(links, contents)).toEqual([
      {
        ...links[5],
        parentRequirementId: "parent",
        childRequirementId: "child",
      },
    ]);
    expect(links).toHaveLength(6);
  });

  it("keeps recorded identity pairs when the child was saved into later legacy snapshots", () => {
    const contents = [
      content("a-v1", "a", 1),
      content("a-v2", "a", 2),
      content("b-v1", "b", 1),
      content("b-v2", "b", 2),
    ];
    const result = requirementIdentityLinks(
      [
        { parent_requirement_revision_id: "a-v1", child_requirement_revision_id: "b-v1" },
        { parent_requirement_revision_id: "a-v2", child_requirement_revision_id: "b-v1" },
      ],
      contents,
    );
    expect(result).toEqual([
      { ...edge("a", "b"), parentRequirementId: "a", childRequirementId: "b" },
    ]);
    expect(requirementTree(records, result).rows[0]?.parts.map((row) => row.id)).toEqual(["b"]);
  });

  it("never creates an identity pair without a resolvable recorded link", () => {
    const contents = [content("a-v2", "a", 2), content("b-v2", "b", 2)];
    expect(requirementIdentityLinks([], contents)).toEqual([]);
    expect(
      requirementIdentityLinks(
        [{ parent_requirement_revision_id: "missing", child_requirement_revision_id: "b-v2" }],
        contents,
      ),
    ).toEqual([]);
  });

  it("keeps distinct current parents and agrees with the table hierarchy", () => {
    const contents = [content("a-v2", "a", 2), content("b-v2", "b", 2), content("c-v2", "c", 2)];
    const links = [edge("a", "c"), edge("b", "c")];
    const projected = requirementIdentityLinks(links, contents);
    expect(projected).toHaveLength(2);
    expect(projected.map((link) => link.parentRequirementId)).toEqual(["a", "b"]);
    expect(requirementTree(records, projected).unstructuredCount).toBe(1);
  });
});

describe("requirement tree", () => {
  it("nests only the displayed revisions and leaves unrelated records visible", () => {
    const result = requirementTree(records, [
      edge("a", "b"),
      edge("b", "c"),
      { parent_requirement_revision_id: "a-v1", child_requirement_revision_id: "d-v2" },
    ]);
    expect(result.rows.map((row) => row.id)).toEqual(["a", "d"]);
    expect(result.rows[0]?.parts[0]?.parts[0]?.id).toBe("c");
    expect(result.unstructuredCount).toBe(0);
    expect(records).not.toHaveProperty("0.parts");
  });

  it("does not invent a primary parent or duplicate multiply linked requirements", () => {
    const result = requirementTree(records, [edge("a", "c"), edge("b", "c")]);
    expect(result.rows.map((row) => row.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.unstructuredCount).toBe(1);
  });

  it("keeps cyclic and self-linked records visible without recursive rendering", () => {
    const result = requirementTree(records, [edge("a", "b"), edge("b", "a"), edge("c", "c")]);
    expect(result.rows.map((row) => row.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.unstructuredCount).toBe(3);
    expect(result.rows.every((row) => row.parts.length === 0)).toBe(true);
  });
});
