import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TestRun } from "@/lib/test-execution";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn(), close: vi.fn() } }));
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

const plan = {
  program: "PRG-1041",
  title: "Verify rollback protection",
  owner: "Nadia Fournier",
  scope: "Tactical edge production build",
  requirement: "REQ-0042.4",
  asset: "AST-0311",
  objective: "Reject images with an older security version.",
  method: "Test" as const,
  action: "Attempt to install the earlier signed image.",
  expected: "Installation is rejected and the rejection is logged.",
  start: "2026-09-07",
  end: "2026-09-08",
};

describe("assessment and requirement workflow", () => {
  it.each(["procedure", "step", "retest cycle", "duplicate ID"] as const)(
    "rejects a malformed saved %s without applying valid records or overrides first",
    async (problem) => {
      const execution = await import("./test-execution");
      // Read the seed array directly, leaving the run snapshot cache unprimed.
      const before = structuredClone(execution.testRuns);
      const base = before[0]!;
      const valid: TestRun = {
        ...base,
        id: "TR-9001",
        state: "In progress",
        records: [],
        retestOf: null,
      };
      const malformed = { ...valid, id: "TR-9002" };
      const created = [valid, malformed];
      if (problem === "procedure") malformed.procedure = "TP-missing";
      if (problem === "step")
        created[1] = {
          ...malformed,
          records: [
            {
              step: "STEP-from-another-procedure",
              result: "Pass",
              observed: "Observed",
              evidence: [],
              at: "2026-09-07T10:00:00Z",
            },
          ],
        };
      if (problem === "retest cycle") created[1] = { ...malformed, retestOf: malformed.id };
      if (problem === "duplicate ID") malformed.id = valid.id;
      storage.set(
        "equinox.assessment-runs.v1",
        JSON.stringify({ created, overrides: [[base.id, { state: "Aborted" }]] }),
      );
      expect(() => execution.restoreTestRuns()).toThrow();
      expect(execution.allTestRuns()).toEqual(before);
      expect(execution.runLogVersion()).toBe(0);
      expect(write).not.toHaveBeenCalled();
    },
  );

  it("keeps observations, requirement coverage, retests and reload on the same result", async () => {
    let assessments = await import("./assessment-store");
    let execution = await import("./test-execution");
    let verification = await import("./requirement-verification");
    let campaigns = await import("./campaigns");
    const evidence = await import("./evidence-catalog");
    const { getRequirement } = await import("./requirements");
    const campaign = assessments.createAssessment(plan);
    const event = campaigns.eventsByCampaign(campaign.id)[0]!;
    const objective = campaigns.objectivesForEvent(event.id)[0]!;
    const procedure = execution.proceduresForObjective(objective.id)[0]!;
    const artifact = evidence.createEvidence({
      program: plan.program,
      label: "Rollback attempt",
      collected: "2026-09-07",
      owner: plan.owner,
      kind: "Test result",
      version: "1",
      provenance: "Observed on production image at the edge",
      url: "https://evidence.example/rollback-log.txt",
    });
    expect(verification.objectivesForRequirement(plan.requirement).map((o) => o.id)).toContain(
      objective.id,
    );
    const before = verification.coverageOf(getRequirement(plan.requirement)!);
    const run = execution.createTestRun({
      procedure: procedure.id,
      event: event.id,
      operator: plan.owner,
      build: "edge-1",
    });
    execution.recordStep(run.id, procedure.steps[0]!.id, {
      result: "Fail",
      observed: "The earlier image was installed.",
      evidence: [artifact.id],
      at: "2026-09-07T10:00:00Z",
    });
    // An unfinished execution cannot replace the last completed result.
    expect(execution.resolvedObjectiveResult(objective.id).result).toBe("Not run");
    execution.setRunState(run.id, "Complete");
    expect(execution.resolvedObjectiveResult(objective.id).result).toBe("Not met");
    expect(verification.coverageOf(getRequirement(plan.requirement)!).notMet).toBe(
      before.notMet + 1,
    );
    expect(
      verification.rtm(plan.program).rows.find((r) => r.objective === objective.id)?.evidence,
    ).toContain(artifact.id);
    expect(() => execution.recordStep(run.id, procedure.steps[0]!.id, { result: "Pass" })).toThrow(
      "assessment history",
    );
    const retest = execution.createTestRun({
      procedure: procedure.id,
      event: event.id,
      operator: plan.owner,
      build: "edge-2",
      retestOf: run.id,
    });
    execution.recordStep(retest.id, procedure.steps[0]!.id, {
      result: "Pass",
      observed: "The earlier image was rejected and logged.",
      evidence: [artifact.id],
      at: "2026-09-08T10:00:00Z",
    });
    execution.setRunState(retest.id, "Complete");
    expect(execution.resolvedObjectiveResult(objective.id).result).toBe("Met");
    expect(execution.runVerdict(run.id)?.result).toBe("Not met");
    expect(verification.coverageOf(getRequirement(plan.requirement)!).notMet).toBe(before.notMet);
    vi.resetModules();
    assessments = await import("./assessment-store");
    execution = await import("./test-execution");
    verification = await import("./requirement-verification");
    campaigns = await import("./campaigns");
    assessments.restoreAssessments();
    execution.restoreTestRuns();
    verification.restoreVerificationLinks();
    expect(campaigns.campaignById.get(campaign.id)?.name).toBe(plan.title);
    expect(execution.runById(retest.id)?.retestOf).toBe(run.id);
    expect(execution.resolvedObjectiveResult(objective.id).result).toBe("Met");
    expect(verification.objectivesForRequirement(plan.requirement).map((o) => o.id)).toContain(
      objective.id,
    );
  });

  it("requires observations/evidence and preserves incomplete objectives", async () => {
    const assessments = await import("./assessment-store");
    const execution = await import("./test-execution");
    const campaigns = await import("./campaigns");
    const campaign = assessments.createAssessment(plan);
    const event = campaigns.eventsByCampaign(campaign.id)[0]!;
    const objective = campaigns.objectivesForEvent(event.id)[0]!;
    const procedure = execution.proceduresForObjective(objective.id)[0]!;
    const run = execution.createTestRun({
      procedure: procedure.id,
      event: event.id,
      operator: plan.owner,
      build: "edge-1",
    });
    execution.recordStep(run.id, procedure.steps[0]!.id, { result: "Pass", observed: "Passed" });
    expect(execution.completionBlockedBy(run.id)).toContain("supporting evidence");
    execution.setRunState(run.id, "Complete");
    expect(execution.runById(run.id)?.state).toBe("In progress");
    expect(execution.runVerdict(run.id)?.result).toBe("Partially met");
    execution.recordStep(run.id, procedure.steps[0]!.id, { evidence: ["EVD-8870"] });
    execution.setRunState(run.id, "Complete");
    const additional = {
      ...procedure,
      id: "TP-additional",
      steps: [{ ...procedure.steps[0]!, id: "TP-additional-S1" }],
    };
    execution.procedures.push(additional);
    execution.procedureById.set(additional.id, additional);
    expect(execution.resolvedObjectiveResult(objective.id).result).toBe("Partially met");
  });

  it("rejects program mismatches and does not create a partial plan on storage failure", async () => {
    const assessments = await import("./assessment-store");
    const campaigns = await import("./campaigns");
    const verification = await import("./requirement-verification");
    expect(() => assessments.createAssessment({ ...plan, program: "PRG-1028" })).toThrow(
      "requirement",
    );
    const other = assessments.createAssessment({
      ...plan,
      program: "PRG-1028",
      requirement: "",
      asset: "",
    });
    const objective = campaigns.eventsByCampaign(other.id)[0]!.objectives[0]!;
    expect(() => verification.linkVerification(plan.requirement, objective, plan.owner)).toThrow(
      "program",
    );
    expect(verification.unlinkedObjectives(plan.requirement).some((o) => o.id === objective)).toBe(
      false,
    );
    const count = campaigns.campaigns.length;
    write.mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => assessments.createAssessment(plan)).toThrow("Storage full");
    expect(campaigns.campaigns).toHaveLength(count);
  });

  it("keeps an explicitly removed requirement link removed after assessment restoration", async () => {
    let assessments = await import("./assessment-store");
    let verification = await import("./requirement-verification");
    const campaigns = await import("./campaigns");
    const campaign = assessments.createAssessment(plan);
    const id = campaigns.eventsByCampaign(campaign.id)[0]!.objectives[0]!;
    verification.unlinkVerification(plan.requirement, id);
    vi.resetModules();
    assessments = await import("./assessment-store");
    verification = await import("./requirement-verification");
    assessments.restoreAssessments();
    verification.restoreVerificationLinks();
    expect(verification.objectivesForRequirement(plan.requirement).some((o) => o.id === id)).toBe(
      false,
    );
  });
});
