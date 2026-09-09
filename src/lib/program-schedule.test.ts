import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn() } }));
let storage: Map<string, string>;
let write: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  write = vi.fn((key: string, value: string) => storage.set(key, value));
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: write },
  });
});

const milestone = (id = "MS-0001") => ({
  id,
  name: "Ready for operational assessment",
  kind: "RMF action" as const,
  phase: "Assessment",
  status: "Planned" as const,
  planned: "2026-10-12",
  actual: "",
  owner: "Assessment team",
  artifact: "",
  description: "Review evidence with the assessor.",
  cyberGate: "Assessment plan approved",
  dependsOn: [],
  workstreams: [],
});

describe("program schedule records", () => {
  it("starts new programs with an empty plan rather than another program's milestones", async () => {
    const schedule = await import("./program-schedule");
    const { programs } = await import("./grc-data");
    programs.push({ ...programs[0]!, id: "PRG-new-schedule", status: "Draft" });
    expect(schedule.scheduleForProgram("PRG-new-schedule")).toEqual([]);
    schedule.saveProgramMilestone("PRG-new-schedule", milestone(), "Alex");
    expect(schedule.programScheduleMilestones("PRG-new-schedule")).toHaveLength(1);
    expect(
      schedule.programScheduleMilestones("PRG-1041").some((gate) => gate.id === "MS-0001"),
    ).toBe(false);
  });

  it("restores milestone edits into the shared gate selector after a reload", async () => {
    let schedule = await import("./program-schedule");
    const data = await import("./grc-data");
    const existing = data.gatesForProgram("PRG-1041").find((gate) => gate.id === "RMF-6")!;
    schedule.saveProgramMilestone(
      "PRG-1041",
      { ...existing, planned: "2026-10-12", owner: "Assessment team" },
      "Alex",
    );
    expect(data.gatesForProgram("PRG-1041").find((gate) => gate.id === "RMF-6")?.planned).toBe(
      "2026-10-12",
    );
    vi.resetModules();
    schedule = await import("./program-schedule");
    schedule.restoreProgramSchedule();
    expect(
      schedule.scheduleForProgram("PRG-1041").find((row) => row.sourceId === "RMF-6"),
    ).toMatchObject({ due: "2026-10-12", owner: "Assessment team", track: "RMF" });
    expect(
      schedule.programScheduleMilestones("PRG-1028").find((gate) => gate.id === "RMF-6")?.owner,
    ).not.toBe("Assessment team");
  });

  it("rejects cross-program or cyclic dependencies and invalid completion dates", async () => {
    const schedule = await import("./program-schedule");
    schedule.saveProgramMilestone("PRG-1028", milestone("OTHER"), "Alex");
    expect(() =>
      schedule.saveProgramMilestone("PRG-1041", { ...milestone(), dependsOn: ["OTHER"] }, "Alex"),
    ).toThrow("this program");
    schedule.saveProgramMilestone("PRG-1041", milestone("A"), "Alex");
    schedule.saveProgramMilestone("PRG-1041", { ...milestone("B"), dependsOn: ["A"] }, "Alex");
    expect(() =>
      schedule.saveProgramMilestone("PRG-1041", { ...milestone("A"), dependsOn: ["B"] }, "Alex"),
    ).toThrow("cycle");
    expect(() =>
      schedule.saveProgramMilestone("PRG-1041", { ...milestone(), status: "Complete" }, "Alex"),
    ).toThrow("actual date");
    expect(() =>
      schedule.saveProgramMilestone("PRG-1041", { ...milestone(), planned: "2026-02-31" }, "Alex"),
    ).toThrow("valid planned date");
  });

  it("projects live POA&M/task dates once, with program scoping", async () => {
    const schedule = await import("./program-schedule");
    const { poamsForProgram } = await import("./register");
    const tasks = await import("./tasks");
    const poam = poamsForProgram("PRG-1041")[0]!;
    poam.scheduledCompletion = "2026-11-02";
    const task = tasks.createTask({
      program: "PRG-1041",
      title: "Retest the control",
      subject: { kind: "program", id: "PRG-1041" },
      assignee: "Alex",
      requester: "Alex",
      due: "2026-11-01",
    });
    tasks.setTaskDue(task.id, "2026-11-03", "Alex");
    const rows = schedule.scheduleForProgram("PRG-1041");
    expect(rows.filter((row) => row.sourceId === poam.id)).toHaveLength(1);
    expect(rows.find((row) => row.sourceId === poam.id)?.due).toBe("2026-11-02");
    expect(rows.find((row) => row.sourceId === task.id)?.due).toBe("2026-11-03");
    expect(
      schedule
        .scheduleForProgram("PRG-1028")
        .some((row) => row.sourceId === task.id || row.sourceId === poam.id),
    ).toBe(false);
  });

  it("preserves records when saving fails and rejects malformed storage before applying it", async () => {
    let schedule = await import("./program-schedule");
    const before = schedule.programScheduleMilestones("PRG-1041");
    write.mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => schedule.saveProgramMilestone("PRG-1041", milestone(), "Alex")).toThrow(
      "Storage full",
    );
    expect(schedule.programScheduleMilestones("PRG-1041")).toEqual(before);
    storage.set("equinox.program-schedule.v1", JSON.stringify({ "PRG-1041": [{ id: "BAD" }] }));
    vi.resetModules();
    schedule = await import("./program-schedule");
    expect(() => schedule.restoreProgramSchedule()).toThrow();
    expect(schedule.programScheduleMilestones("PRG-1041").some((gate) => gate.id === "BAD")).toBe(
      false,
    );
  });
});

describe("task persistence", () => {
  it("restores creation, reassignment, due dates and completion with stable IDs", async () => {
    let tasks = await import("./tasks");
    const task = tasks.createTask({
      program: "PRG-1041",
      title: "Collect acceptance evidence",
      subject: { kind: "requirement", id: "REQ-0042" },
      assignee: "Alex",
      requester: "Sam",
      due: "2026-10-01",
    });
    tasks.reassignTask(task.id, "Priya Raghavan", "Sam");
    tasks.setTaskDue(task.id, "2026-10-09", "Sam");
    tasks.completeTask(task.id, "Priya Raghavan");
    vi.resetModules();
    tasks = await import("./tasks");
    tasks.restoreTasks();
    expect(tasks.taskById(task.id)).toMatchObject({
      assignee: "Priya Raghavan",
      due: "2026-10-09",
      state: "Done",
      subject: { kind: "requirement", id: "REQ-0042" },
    });
    const next = tasks.createTask({
      program: "PRG-1041",
      title: "Review",
      subject: { kind: "program", id: "PRG-1041" },
      assignee: "Alex",
      requester: "Sam",
    });
    expect(next.id).not.toBe(task.id);
  });

  it("does not claim completion when browser persistence fails", async () => {
    const tasks = await import("./tasks");
    const task = tasks.createTask({
      program: "PRG-1041",
      title: "Review",
      subject: { kind: "program", id: "PRG-1041" },
      assignee: "Alex",
      requester: "Sam",
    });
    write.mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => tasks.completeTask(task.id, "Alex")).toThrow("Storage full");
    expect(tasks.taskById(task.id)?.state).toBe("Open");
  });
});
