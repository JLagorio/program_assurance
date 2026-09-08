import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));
let entries: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  entries = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    },
  });
});

it("loads WS-X90 through the existing program restore path and keeps native edits on reload", async () => {
  let restore = await import("./workspace-restore");
  expect(restore.restoreWorkspaceRecords()).toEqual([]);
  const { programFindings, assets } = await import("./findings");
  const { requirementsForProgram, allocationsFor, setRequirementField } =
    await import("./requirements");
  const { controlMatrix } = await import("./control-matrix");
  const { evidenceForProgram } = await import("./evidence-catalog");
  const { scheduleForProgram } = await import("./program-schedule");
  const { programCoverage, rtm } = await import("./requirement-verification");
  const { poamsForProgram } = await import("./register");
  const { updateFinding, updatePoamMilestone } = await import("./assurance-record-store");
  const { platformSeed } = await import("./platform-seed");
  const { platformProgram } = await import("./platform-program");
  const { stageOf } = await import("./stages");
  const { programState, daysUntil } = await import("./program-stage");
  const id = platformProgram.id;
  expect(requirementsForProgram(id)).toHaveLength(120);
  expect(requirementsForProgram(id).flatMap((row) => allocationsFor(row.id))).toHaveLength(240);
  expect(assets.filter((asset) => asset.program === id)).toHaveLength(20);
  expect(
    controlMatrix(id)
      .map((row) => row.id)
      .sort(),
  ).toEqual([...platformSeed.profiles[0]!.effective_control_ids].sort());
  expect(evidenceForProgram(id)).toHaveLength(90);
  expect(programFindings(id)).toHaveLength(16);
  expect(poamsForProgram(id)).toHaveLength(16);
  expect(rtm(id).rows).toHaveLength(120);
  expect(Object.values(programCoverage(id)).reduce((total, count) => total + count, 0)).toBe(120);
  const milestones = scheduleForProgram(id).filter((row) => row.kind === "POA&M milestone");
  expect(milestones).toHaveLength(48);
  expect(milestones.every((row) => row.due === null && row.dates === "Unscheduled")).toBe(true);
  expect(scheduleForProgram(id).filter((row) => row.track === "Acquisition")).toHaveLength(0);
  expect(stageOf(id)).toBe("Assess");
  expect(programState(platformProgram).currentStage).toBe("Assess");
  expect(daysUntil("2026-10-01", new Date("2026-09-01T00:00:00Z"))).toBe(30);

  const finding = programFindings(id).find((row) => row.lifecycle === "Open")!;
  const poam = poamsForProgram(id).find((row) => row.status !== "Completed")!;
  const milestone = poam.milestones![0]!;
  setRequirementField("REQ-001", { owner: "Mission assurance team" });
  updateFinding(finding.id, { owner: "Remediation lead" });
  updatePoamMilestone(poam.id, milestone.id, { targetDate: "2026-10-01" });
  expect(
    scheduleForProgram(id).find((row) => row.sourceId === `${poam.id}/${milestone.id}`)?.due,
  ).toBe("2026-10-01");

  vi.resetModules();
  restore = await import("./workspace-restore");
  expect(restore.restoreWorkspaceRecords()).toEqual([]);
  const requirements = await import("./requirements");
  const findings = await import("./findings");
  const schedule = await import("./program-schedule");
  expect(requirements.getRequirement("REQ-001")?.owner).toBe("Mission assurance team");
  expect(findings.programFindings(id).find((row) => row.id === finding.id)).toMatchObject({
    owner: "Remediation lead",
    controls: finding.controls,
    requirements: finding.requirements,
  });
  expect(
    schedule.scheduleForProgram(id).find((row) => row.sourceId === `${poam.id}/${milestone.id}`)
      ?.due,
  ).toBe("2026-10-01");
  expect(requirements.requirementsForProgram(id)).toHaveLength(120);
  expect(findings.programFindings("PRG-1041").some((row) => row.id === finding.id)).toBe(false);
});
