import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));
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

const assessment = {
  program: "PRG-1041",
  title: "Operational readiness assessment",
  owner: "Alex",
  scope: "Mission compute module",
  requirement: "",
  asset: "",
  objective: "Reject unsigned firmware",
  method: "Test" as const,
  action: "Attempt to load unsigned firmware",
  expected: "The boot chain refuses the image",
  start: "2026-10-01",
  end: "2026-10-03",
};

describe("assessment schedule integration", () => {
  it("moves the assessment and schedule into execution when a run starts", async () => {
    const store = await import("./assessment-store");
    const campaign = store.createAssessment(assessment);
    const data = await import("./campaigns");
    const execution = await import("./test-execution");
    const event = data.eventsByCampaign(campaign.id)[0]!;
    const procedure = execution.proceduresForCampaign(campaign.id)[0]!;
    expect(store.assessmentState(campaign)).toBe("Planning");
    event.state = "Reported";
    execution.createTestRun({
      procedure: procedure.id,
      event: event.id,
      operator: "Alex",
      build: "candidate-2",
    });
    expect(store.assessmentState(campaign)).toBe("Executing");
    const schedule = await import("./program-schedule");
    expect(
      schedule.scheduleForProgram(assessment.program).find((row) => row.sourceId === event.id),
    ).toMatchObject({ status: "Executing", complete: false });
    campaign.state = "Closed";
    expect(store.assessmentState(campaign)).toBe("Closed");
  });
  it("creates program-scoped source records and restores independently edited campaign/event windows", async () => {
    let store = await import("./assessment-store");
    const updated = vi.fn();
    store.subscribeAssessments(updated);
    const campaign = store.createAssessment(assessment);
    const data = await import("./campaigns");
    const event = data.eventsByCampaign(campaign.id)[0]!;
    store.updateAssessmentSchedule(
      campaign.id,
      { start: "2026-10-05", end: "2026-10-09", owner: "Assessment lead" },
      "Alex",
    );
    store.updateEventSchedule(
      event.id,
      { start: "2026-10-06", end: "2026-10-08", owner: "Test team" },
      "Alex",
    );
    expect(updated).toHaveBeenCalled();
    const schedule = await import("./program-schedule");
    expect(
      schedule.scheduleForProgram("PRG-1041").find((row) => row.sourceId === campaign.id),
    ).toMatchObject({ due: "2026-10-09", owner: "Assessment lead" });
    expect(schedule.scheduleForProgram("PRG-1028").some((row) => row.sourceId === event.id)).toBe(
      false,
    );
    vi.resetModules();
    store = await import("./assessment-store");
    store.restoreAssessments();
    const restored = await import("./campaigns");
    expect(restored.campaignById.get(campaign.id)).toMatchObject({
      opened: "2026-10-05",
      target: "2026-10-09",
      lead: "Assessment lead",
    });
    expect(restored.eventById.get(event.id)).toMatchObject({
      start: "2026-10-06",
      end: "2026-10-08",
      team: "Test team",
    });
  });

  it("preserves the RMF assessment method separately from the engineering verification method", async () => {
    const store = await import("./assessment-store");
    const campaign = store.createAssessment({ ...assessment, method: "Interview" });
    const { eventsByCampaign } = await import("./campaigns");
    const { procedures } = await import("./test-execution");
    const objective = eventsByCampaign(campaign.id)[0]!.objectives[0];
    expect(procedures.find((procedure) => procedure.objective === objective)).toMatchObject({
      assessmentMethod: "Interview",
      method: "Analysis",
    });
  });

  it("rejects nonexistent dates, wrong source types, and cross-program assessment scope", async () => {
    const store = await import("./assessment-store");
    expect(() => store.createAssessment({ ...assessment, start: "2026-02-31" })).toThrow(
      "calendar date",
    );
    expect(() =>
      store.createAssessment({ ...assessment, program: "PRG-1028", requirement: "REQ-0042" }),
    ).toThrow("this program");
    expect(() =>
      store.updateEventSchedule("TC-0031", {
        start: "2026-10-01",
        end: "2026-10-02",
        owner: "Alex",
      }),
    ).toThrow("Test event not found");
    expect(() =>
      store.updateAssessmentSchedule("TC-0031", {
        start: "2026-11-02",
        end: "2026-11-01",
        owner: "Alex",
      }),
    ).toThrow("end date");
  });

  it("validates saved schedules before registering any new assessment", async () => {
    let store = await import("./assessment-store");
    const campaign = store.createAssessment(assessment);
    const saved = JSON.parse(storage.get("equinox.assessments.v1")!);
    saved.schedule["TC-UNKNOWN"] = { start: "2026-10-01", end: "2026-10-03", owner: "Alex" };
    storage.set("equinox.assessments.v1", JSON.stringify(saved));
    vi.resetModules();
    store = await import("./assessment-store");
    expect(() => store.restoreAssessments()).toThrow("unknown assessment");
    const { campaignById } = await import("./campaigns");
    expect(campaignById.has(campaign.id)).toBe(false);
  });

  it("preserves the source record when a schedule write fails", async () => {
    const store = await import("./assessment-store");
    const campaign = store.createAssessment(assessment);
    write.mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() =>
      store.updateAssessmentSchedule(
        campaign.id,
        { start: "2026-12-01", end: "2026-12-02", owner: "Changed owner" },
        "Alex",
      ),
    ).toThrow("Storage full");
    expect(campaign).toMatchObject({
      opened: assessment.start,
      target: assessment.end,
      lead: assessment.owner,
    });
  });
});

describe("new program persistence", () => {
  it("restores a wizard-created boundary, scopes and initial control-set IDs before linked records", async () => {
    let setup = await import("./program-setup");
    const draft = setup.emptyDraft();
    draft.name = "Flight computer security";
    draft.systems[0]!.name = "Mission computer";
    draft.systems[0]!.subsystems.push({
      key: "radio",
      name: "Tactical radio",
      function: "Radio link",
      owner: "Alex",
    });
    draft.scopes = setup.reconcileScopes(draft);
    const created = setup.createProgramFromDraft(draft);
    let controls = await import("./control-set");
    const revision = controls.revisionsForProgram(created.program.id)[0]!;
    const scopeId = created.scopes[0]!.id;
    const nodeId = created.scopes[0]!.element;
    const history = controls.eventsForProgram(created.program.id);
    const before = (await import("./scopes"))
      .controlSetFor(scopeId)
      ?.controls.map((control) => control.control.id);
    vi.resetModules();
    setup = await import("./program-setup");
    setup.restoreProgramSetups();
    const { scopeById, controlSetFor } = await import("./scopes");
    const { nodeById } = await import("./composition");
    controls = await import("./control-set");
    expect(scopeById.get(scopeId)).toMatchObject({ program: created.program.id, element: nodeId });
    expect(nodeById.get(nodeId)).toMatchObject({
      program: created.program.id,
      name: "Tactical radio",
    });
    expect(controls.revisionById(revision.id)).toEqual(revision);
    expect(controls.eventsForProgram(created.program.id)).toEqual(history);
    expect(controlSetFor(scopeId)?.controls.map((control) => control.control.id)).toEqual(before);
    expect(controls.revisionsForProgram(created.program.id)).toHaveLength(1);
    setup.restoreProgramSetups();
    expect(controls.revisionsForProgram(created.program.id)).toHaveLength(1);
  });
  it("restores a new program before its assessment, including program edits and command patches", async () => {
    let programsStore = await import("./program-store");
    const { programs } = await import("./grc-data");
    const program = programsStore.addProgram({
      ...programs[0]!,
      id: "PRG-9001",
      name: "New weapon system",
      status: "Draft",
    });
    programsStore.updateProgram(program.id, { summary: "Updated mission scope" });
    programsStore.saveProgramCommand(program.id, { assessmentScheduled: "2026-10-01" });
    let assessments = await import("./assessment-store");
    const campaign = assessments.createAssessment({ ...assessment, program: program.id });
    vi.resetModules();
    assessments = await import("./assessment-store");
    assessments.restoreAssessments();
    programsStore = await import("./program-store");
    programsStore.restoreProgramCommands();
    const restored = await import("./grc-data");
    const data = await import("./campaigns");
    expect(restored.programs.find((item) => item.id === program.id)).toMatchObject({
      name: "New weapon system",
      summary: "Updated mission scope",
      assessmentScheduled: "2026-10-01",
    });
    expect(data.campaignById.get(campaign.id)?.program).toBe(program.id);
    expect(programsStore.nextProgramId()).not.toBe(program.id);
  });

  it("does not publish a program in memory when storage fails and rejects conflicting saved IDs", async () => {
    let store = await import("./program-store");
    let data = await import("./grc-data");
    write.mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => store.addProgram({ ...data.programs[0]!, id: "PRG-9001" })).toThrow(
      "Storage full",
    );
    expect(data.programs.some((program) => program.id === "PRG-9001")).toBe(false);
    storage.set(
      "equinox.programs.v1",
      JSON.stringify([{ ...data.programs[0]!, name: "Replaced seed" }]),
    );
    vi.resetModules();
    store = await import("./program-store");
    expect(() => store.restorePrograms()).toThrow("conflict");
    data = await import("./grc-data");
    expect(data.programs[0]!.name).not.toBe("Replaced seed");
  });
});
