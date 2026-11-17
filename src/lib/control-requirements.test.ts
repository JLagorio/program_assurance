import { describe, expect, it } from "vitest";

const { requirementsByControl } = await import("./control-requirements");

const requirements = [
  { id: "r10", code: "REQ-10" },
  { id: "r9", code: "REQ-9" },
  { id: "r64", code: "REQ-064" },
];
const revisions = [
  { id: "r10.1", engineering_requirement_id: "r10", version_number: 1 },
  { id: "r10.2", engineering_requirement_id: "r10", version_number: 2 },
  { id: "r9.1", engineering_requirement_id: "r9", version_number: 1 },
  { id: "r64.1", engineering_requirement_id: "r64", version_number: 1 },
];

describe("the requirements behind each control", () => {
  it("names each control's requirements by code, in their natural order", () => {
    const byControl = requirementsByControl(requirements, revisions, [
      { control_id: "si-2", requirement_revision_id: "r64.1" },
      { control_id: "ac-2", requirement_revision_id: "r10.2" },
      { control_id: "ac-2", requirement_revision_id: "r9.1" },
    ]);
    expect(byControl.get("si-2")).toEqual(["REQ-064"]);
    expect(byControl.get("ac-2")).toEqual(["REQ-9", "REQ-10"]);
    expect(byControl.has("au-7")).toBe(false);
  });

  it("reads each requirement at its latest revision only", () => {
    const byControl = requirementsByControl(requirements, revisions, [
      { control_id: "ac-2", requirement_revision_id: "r10.1" },
      { control_id: "ac-3", requirement_revision_id: "r10.2" },
    ]);
    expect(byControl.has("ac-2")).toBe(false);
    expect(byControl.get("ac-3")).toEqual(["REQ-10"]);
  });

  it("names a requirement once however many of its mappings reach the control", () => {
    const byControl = requirementsByControl(requirements, revisions, [
      { control_id: "si-2", requirement_revision_id: "r64.1" },
      { control_id: "si-2", requirement_revision_id: "r64.1" },
    ]);
    expect(byControl.get("si-2")).toEqual(["REQ-064"]);
  });

  it("names nothing through a revision of a requirement it was not given", () => {
    const byControl = requirementsByControl(
      [],
      [{ id: "x.1", engineering_requirement_id: "x", version_number: 1 }],
      [{ control_id: "si-2", requirement_revision_id: "x.1" }],
    );
    expect(byControl.size).toBe(0);
  });
});
