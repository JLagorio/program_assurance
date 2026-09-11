import { describe, expect, it, vi } from "vitest";
import { prioritizeTasks, type Task } from "./tasks";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn() } }));

const task = (id: string, state: Task["state"], due: string | null): Task => ({
  id,
  state,
  due,
  program: "PRG-1041",
  title: id,
  subject: { kind: "control", id: "AC-2" },
  assignee: "Owner",
  requester: "Assessor",
  waitingOn: null,
  note: "",
  createdAt: "2026-08-01T12:00:00Z",
  doneAt: state === "Done" ? "2026-08-28T12:00:00Z" : null,
  gate: null,
});

describe("program priority tasks", () => {
  it("surfaces overdue asks across states, then blockers and dated work; excludes completed asks", () => {
    const tasks = [
      task("undated", "Open", null),
      task("done", "Done", "2026-08-01"),
      task("tomorrow", "Open", "2026-08-31"),
      task("today", "Open", "2026-08-30"),
      task("blocker", "Blocked", null),
      task("overdue-open", "Open", "2026-08-29"),
      task("overdue-waiting", "Waiting", "2026-08-27"),
    ];
    const original = [...tasks];
    expect(prioritizeTasks(tasks, new Date("2026-08-30T12:00:00Z")).map((task) => task.id)).toEqual(
      ["overdue-waiting", "overdue-open", "blocker", "today", "tomorrow", "undated"],
    );
    expect(tasks).toEqual(original);
  });

  it("removes a completed priority and promotes the next commitment", () => {
    const tasks = [task("first", "Open", "2026-08-25"), task("next", "Waiting", "2026-08-26")];
    tasks[0]!.state = "Done";
    expect(prioritizeTasks(tasks, new Date("2026-08-30T12:00:00Z")).map((task) => task.id)).toEqual(
      ["next"],
    );
  });
});
