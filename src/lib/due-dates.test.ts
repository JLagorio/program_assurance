import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  INVALID_DUE_DATE,
  INVALID_PLANNED_COMPLETION,
  calendarDay,
  setPlannedCompletion,
  setTaskDue,
} = await import("./due-dates");
const { CHANGED_ELSEWHERE } = await import("./models");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const task = uuid(1);
const commitment = uuid(2);

function client(answer: FakeResult = { data: { id: task, revision: 5 }, error: null }) {
  return fakeClient(() => answer);
}

describe("a calendar day", () => {
  it("is an ISO day that exists", () => {
    const day = calendarDay("Enter a day.");
    expect(day.safeParse("2026-10-14").success).toBe(true);
    expect(day.safeParse("2028-02-29").success).toBe(true);
    expect(day.safeParse("2026-02-29").success).toBe(false);
    expect(day.safeParse("2026-10-14T17:00:00Z").success).toBe(false);
    expect(day.safeParse("Oct 14, 2026").success).toBe(false);
  });
});

describe("setting a task's due day", () => {
  it("writes the day as revision + 1 of the revision the reader saw", async () => {
    const { client: db, calls } = client();
    await setTaskDue(db, context, { id: task, revision: 4, day: "2026-10-14" });
    expect(calls[0]?.table).toBe("tasks");
    expect(args(calls[0], "update")[0]?.[0]).toEqual({ due_on: "2026-10-14", revision: 5 });
    expect(filter(calls[0], "eq", "id")).toBe(task);
    expect(filter(calls[0], "eq", "revision")).toBe(4);
  });

  it("clears the day when the field is emptied", async () => {
    const { client: db, calls } = client();
    await setTaskDue(db, context, { id: task, revision: 4, day: "" });
    expect(args(calls[0], "update")[0]?.[0]).toEqual({ due_on: null, revision: 5 });
    await setTaskDue(db, context, { id: task, revision: 4, day: null });
    expect(args(calls[1], "update")[0]?.[0]).toEqual({ due_on: null, revision: 5 });
  });

  it("refuses a moment or a day that does not exist without a request", async () => {
    const { client: db, calls } = client();
    await expect(
      setTaskDue(db, context, { id: task, revision: 4, day: "2026-10-14T17:00:00Z" }),
    ).rejects.toThrow(INVALID_DUE_DATE);
    await expect(
      setTaskDue(db, context, { id: task, revision: 4, day: "2026-02-30" }),
    ).rejects.toThrow(INVALID_DUE_DATE);
    expect(calls).toHaveLength(0);
  });

  it("says the task changed elsewhere when its revision moved on", async () => {
    const { client: db } = client({ data: null, error: { code: "PGRST116", message: "0 rows" } });
    await expect(
      setTaskDue(db, context, { id: task, revision: 4, day: "2026-10-14" }),
    ).rejects.toThrow(CHANGED_ELSEWHERE);
  });
});

describe("setting a remediation commitment's planned completion", () => {
  it("writes the day on the commitment at the revision the reader saw", async () => {
    const { client: db, calls } = client({ data: { id: commitment, revision: 2 }, error: null });
    await setPlannedCompletion(db, context, { id: commitment, revision: 1, day: "2026-12-31" });
    expect(calls[0]?.table).toBe("poam_item_revisions");
    expect(args(calls[0], "update")[0]?.[0]).toEqual({
      planned_completion_date: "2026-12-31",
      revision: 2,
    });
    expect(filter(calls[0], "eq", "revision")).toBe(1);
  });

  it("refuses text that is not a day", async () => {
    const { client: db, calls } = client();
    await expect(
      setPlannedCompletion(db, context, { id: commitment, revision: 1, day: "next week" }),
    ).rejects.toThrow(INVALID_PLANNED_COMPLETION);
    expect(calls).toHaveLength(0);
  });

  it("says what the server refused, such as a published commitment", async () => {
    const { client: db } = client({
      data: null,
      error: {
        code: "23514",
        message: "Published revisions are immutable; create a new draft revision",
      },
    });
    await expect(
      setPlannedCompletion(db, context, { id: commitment, revision: 1, day: "2026-12-31" }),
    ).rejects.toThrow("Published revisions are immutable");
  });
});
