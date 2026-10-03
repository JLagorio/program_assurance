import { describe, expect, it, vi } from "vitest";
import { uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { createTaskSchema } = await import("./task-create");
const { INVALID_DUE_DATE } = await import("./due-dates");

const values = {
  programId: uuid(1),
  workstreamId: null,
  title: "Collect the access review evidence",
  description: "",
  assigneePartyId: null,
  dueOn: null,
  priority: null,
};
const dueIssue = (dueOn: unknown) =>
  createTaskSchema
    .safeParse({ ...values, dueOn })
    .error?.issues.find((issue) => issue.path[0] === "dueOn")?.message;

describe("a task's due date at creation", () => {
  it("is a calendar day, or none", () => {
    expect(createTaskSchema.parse({ ...values, dueOn: "2026-10-14" }).dueOn).toBe("2026-10-14");
    expect(createTaskSchema.parse(values).dueOn).toBeNull();
  });

  it("is never a moment, and only a day that exists", () => {
    expect(dueIssue("2026-10-14T17:00:00Z")).toBe(INVALID_DUE_DATE);
    expect(dueIssue("2026-02-30")).toBe(INVALID_DUE_DATE);
  });

  it("takes no due moment", () => {
    const { dueOn: _dueOn, ...rest } = values;
    expect(createTaskSchema.safeParse({ ...rest, dueAt: "2026-10-14T17:00:00Z" }).success).toBe(
      false,
    );
  });
});
