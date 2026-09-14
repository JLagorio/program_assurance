import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn(), close: vi.fn() } }));
beforeEach(() => {
  vi.resetModules();
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});

const subject = { kind: "control" as const, id: "AC-2" };
describe("program-scoped record feeds", () => {
  it("isolates both direct and related activity for controls with the same ID", async () => {
    const { activityFor, record } = await import("./activity");
    const atlas = record({
      program: "PRG-1041",
      actor: "Atlas assessor",
      kind: "comment",
      subject,
      summary: "Atlas implementation review",
    });
    const platform = record({
      program: "PRG-1090",
      actor: "Platform assessor",
      kind: "comment",
      subject,
      summary: "WS-X90 implementation review",
    });
    const related = record({
      program: "PRG-1090",
      actor: "Platform assessor",
      kind: "link",
      subject: { kind: "evidence", id: "EVD-001" },
      about: subject,
      summary: "Linked source evidence",
    });
    record({
      program: null,
      actor: "Catalog editor",
      kind: "change",
      subject,
      summary: "Catalog change",
    });
    record({
      program: "PRG-1090",
      actor: "Platform assessor",
      kind: "comment",
      subject: { kind: "requirement", id: "AC-2" },
      summary: "Different record kind",
    });
    expect(
      activityFor(subject, "PRG-1090")
        .map((entry) => entry.id)
        .sort(),
    ).toEqual([platform.id, related.id].sort());
    expect(activityFor(subject, "PRG-1041").map((entry) => entry.id)).toEqual([atlas.id]);
    expect(activityFor(subject, "PRG-missing")).toEqual([]);
    expect(activityFor(subject)).toHaveLength(4);
  });

  it("keeps open and completed tasks and their generated activity inside the owning program after restore", async () => {
    let tasks = await import("./tasks");
    const atlas = tasks.createTask({
      program: "PRG-1041",
      title: "Atlas AC-2 review",
      subject,
      assignee: "Atlas assessor",
      requester: "Atlas lead",
    });
    tasks.completeTask(atlas.id, "Atlas assessor");
    const platform = tasks.createTask({
      program: "PRG-1090",
      title: "WS-X90 AC-2 review",
      subject,
      assignee: "Platform assessor",
      requester: "Platform lead",
    });
    tasks.createTask({
      program: "PRG-1090",
      title: "Other subject",
      subject: { kind: "requirement", id: "AC-2" },
      assignee: "Platform assessor",
      requester: "Platform lead",
    });
    expect(tasks.tasksFor(subject, "PRG-1090").map((task) => task.id)).toEqual([platform.id]);
    expect(
      tasks
        .tasksFor(subject, "PRG-1041")
        .some((task) => task.id === atlas.id && task.state === "Done"),
    ).toBe(true);
    const { activityFor } = await import("./activity");
    expect(activityFor(subject, "PRG-1090").every((entry) => entry.program === "PRG-1090")).toBe(
      true,
    );
    expect(activityFor(subject, "PRG-1090").some((entry) => entry.about?.id === atlas.id)).toBe(
      false,
    );
    vi.resetModules();
    tasks = await import("./tasks");
    tasks.restoreTasks();
    expect(tasks.tasksFor(subject, "PRG-1090").map((task) => task.id)).toEqual([platform.id]);
    expect(tasks.tasksFor(subject, "PRG-missing")).toEqual([]);
  });
});
