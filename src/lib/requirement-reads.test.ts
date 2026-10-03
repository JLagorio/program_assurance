import { describe, expect, it, vi } from "vitest";
import { programRequirementScope, programRequirementTables } from "./requirement-reads";
import { fakeClient, filter, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { readRows, selectClause } = await import("./models");

const programId = uuid(7);

describe("a program's requirement records", () => {
  it("reads requirements by program, and everything else through the revision's requirement", () => {
    expect(programRequirementScope(programId, "engineering_requirements")).toEqual({
      program_id: programId,
    });
    expect(programRequirementScope(programId, "requirement_revisions")).toEqual({
      "engineering_requirements.program_id": programId,
    });
    for (const table of [
      "requirement_allocations",
      "requirement_control_links",
      "requirement_evidence",
      "requirement_implementations",
    ] as const)
      expect(programRequirementScope(programId, table)).toEqual({
        "requirement_revisions.engineering_requirements.program_id": programId,
      });
    expect(programRequirementTables).toHaveLength(6);
  });

  it("joins on the server and returns the rows without the join", async () => {
    const scope = programRequirementScope(programId, "requirement_revisions");
    expect(selectClause(["id", "title"], scope)).toBe("id,title,engineering_requirements!inner()");
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, { tenantId: uuid(900), token: "token" }, "requirement_revisions", scope);
    expect(filter(calls[0], "eq", "engineering_requirements.program_id")).toBe(programId);
  });
});
