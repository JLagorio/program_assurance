import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));
let storage: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  setItem = vi.fn((key: string, value: string) => storage.set(key, value));
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem },
  });
});
const draft = {
  program: "PRG-1041",
  label: "Secure boot release evidence",
  collected: "2026-09-07",
  owner: "Nadia Fournier",
  kind: "Test result" as const,
  version: "2",
  provenance: "Production-key boot validation on the released switch image",
  url: "https://evidence.example/secure-boot-v2.pdf",
  scopeIds: ["SYS-0003"],
};

describe("shared evidence workflow", () => {
  it("scopes inventory, validates URLs and retains links and review after reload", async () => {
    let evidence = await import("./evidence-catalog");
    const artifact = evidence.createEvidence(draft);
    expect(evidence.evidenceForProgram("PRG-1042").some((row) => row.id === artifact.id)).toBe(
      false,
    );
    expect(() => evidence.createEvidence({ ...draft, url: "javascript:alert(1)" })).toThrow(
      "http or https",
    );
    expect(() =>
      evidence.linkArtifact(artifact.id, { kind: "requirement", id: "REQ-NOT-REAL" }),
    ).toThrow("belong to this program");
    evidence.linkArtifact(artifact.id, { kind: "requirement", id: "REQ-0042.4" });
    evidence.reviewEvidence(
      artifact.id,
      "Accepted",
      "Dana Whitlock",
      "The production build and signature match the requirement's test configuration.",
    );
    vi.resetModules();
    evidence = await import("./evidence-catalog");
    evidence.restoreEvidence();
    expect(evidence.evidenceForTarget("PRG-1041", "requirement", "REQ-0042.4")).toContainEqual(
      expect.objectContaining({ id: artifact.id, review: "Accepted", url: draft.url }),
    );
  });

  it("keeps control links bidirectional and propagates narrative/evidence into traceability and SSP", async () => {
    const evidence = await import("./evidence-catalog");
    const work = await import("./control-work");
    const { buildSctm } = await import("./sctm");
    const { controlMatrix } = await import("./control-matrix");
    const { oscalSsp } = await import("./oscal");
    const artifact = evidence.createEvidence(draft);
    const control = work.workFor("PRG-1041", "SYS-0003", "SI-7");
    const narrative =
      "The released edge switch verifies the production signature before boot and rejects a modified image.";
    work.setNarrative(control.id, narrative);
    work.linkEvidence(control.id, artifact.id);
    expect(
      evidence.evidenceForTarget("PRG-1041", "control", "SI-7", "SYS-0003").map((row) => row.id),
    ).toContain(artifact.id);
    let rows = buildSctm("PRG-1041", controlMatrix("PRG-1041"), null).rows.filter(
      (row) => row.control === "SI-7",
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) => row.assertion === narrative && row.evidence.includes(artifact.id)),
    ).toBe(true);
    const document = JSON.stringify(oscalSsp("PRG-1041", rows).json);
    expect(document).toContain(narrative);
    expect(document).toContain(draft.url);
    expect(document).toContain('"artifact-version","value":"2"');
    evidence.unlinkArtifact(artifact.id, { kind: "control", id: "SI-7", scopeId: "SYS-0003" });
    expect(control.evidence).not.toContain(artifact.id);
    rows = buildSctm("PRG-1041", controlMatrix("PRG-1041"), null).rows.filter(
      (row) => row.control === "SI-7",
    );
    expect(rows.every((row) => !row.evidence.includes(artifact.id))).toBe(true);
  });

  it("restores authored control statements and shared evidence links after reload", async () => {
    let evidence = await import("./evidence-catalog");
    let work = await import("./control-work");
    const artifact = evidence.createEvidence(draft);
    const control = work.workFor("PRG-1041", "SYS-0003", "SI-7");
    work.setNarrative(control.id, "Production signatures are checked before execution.");
    work.linkEvidence(control.id, artifact.id);
    vi.resetModules();
    evidence = await import("./evidence-catalog");
    work = await import("./control-work");
    evidence.restoreEvidence();
    work.restoreWork();
    const restored = work.workFor("PRG-1041", "SYS-0003", "SI-7");
    expect(restored.narrative).toBe("Production signatures are checked before execution.");
    expect(restored.evidence).toContain(artifact.id);
    expect(work.activityFor(restored.id)).toContainEqual(
      expect.objectContaining({ kind: "evidence-linked", after: artifact.id }),
    );
  });

  it("refuses evidence from a different system and keeps failed writes out of the inventory", async () => {
    const evidence = await import("./evidence-catalog");
    const work = await import("./control-work");
    const artifact = evidence.createEvidence(draft);
    const wrongScope = work.workFor("PRG-1041", "SYS-0001", "SI-7");
    expect(() => work.linkEvidence(wrongScope.id, artifact.id)).toThrow("another system scope");
    const before = evidence.evidenceForProgram(draft.program).length;
    setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => evidence.createEvidence({ ...draft, label: "Must not appear" })).toThrow(
      "Quota exceeded",
    );
    expect(evidence.evidenceForProgram(draft.program)).toHaveLength(before);
  });

  it("does not treat a sibling requirement's artifact as evidence for another requirement", async () => {
    const { createEvidence, linkArtifact } = await import("./evidence-catalog");
    const { buildSctm } = await import("./sctm");
    const { controlMatrix } = await import("./control-matrix");
    const artifact = createEvidence(draft);
    linkArtifact(artifact.id, { kind: "requirement", id: "REQ-0042.4" });
    const rows = buildSctm("PRG-1041", controlMatrix("PRG-1041"), null).rows;
    expect(
      rows
        .filter((row) => row.unit === "Requirement" && row.requirement === "REQ-0042.4")
        .every((row) => row.evidence.includes(artifact.id)),
    ).toBe(true);
    expect(
      rows
        .filter((row) => row.unit === "Requirement" && row.requirement === "REQ-0042.5")
        .every((row) => !row.evidence.includes(artifact.id)),
    ).toBe(true);
  });

  it("emits each imported POA&M once", async () => {
    const { oscalPoam } = await import("./oscal");
    const { poamsForProgram } = await import("./register");
    const document = (oscalPoam("PRG-1041").json as Record<string, unknown>)[
      "plan-of-action-and-milestones"
    ] as Record<string, unknown>;
    expect(document["poam-items"]).toHaveLength(poamsForProgram("PRG-1041").length);
  });

  it("exports a newly authored assessment through its engineering requirement and preserves Interview", async () => {
    const { createEvidence, evidenceById } = await import("./evidence-catalog");
    const { createAssessment } = await import("./assessment-store");
    const { events } = await import("./campaigns");
    const { procedures, createTestRun, recordStep, setRunState } = await import("./test-execution");
    const { buildSctm } = await import("./sctm");
    const { controlMatrix } = await import("./control-matrix");
    const { oscalAssessmentPlan, oscalAssessmentResults, oscalSsp } = await import("./oscal");
    const artifact = createEvidence({
      ...draft,
      scopeIds: [],
      label: "Production ceremony interview transcript",
    });
    const assessment = createAssessment({
      program: "PRG-1041",
      title: "Production ceremony interview",
      owner: "Dana Whitlock",
      scope: "Production signing process",
      requirement: "REQ-0042.5",
      asset: "",
      objective: "Confirm production key stewardship",
      method: "Interview",
      action: "Interview the two key custodians",
      expected: "Both describe the required dual control",
      start: "2026-09-07",
      end: "2026-09-08",
    });
    const event = events.find((event) => event.campaign === assessment.id)!;
    const procedure = procedures.find((procedure) =>
      event.objectives.includes(procedure.objective),
    )!;
    const run = createTestRun({
      event: event.id,
      procedure: procedure.id,
      operator: "Dana Whitlock",
      build: "Production signing enclave v2",
    });
    recordStep(run.id, procedure.steps[0]!.id, {
      result: "Pass",
      observed: "Both custodians correctly described and demonstrated dual authorization.",
      evidence: [artifact.id],
      at: "2026-09-07T12:00:00Z",
    });
    setRunState(run.id, "Complete");
    const rows = buildSctm("PRG-1041", controlMatrix("PRG-1041"), null).rows;
    const requirementRows = rows.filter(
      (row) => row.unit === "Requirement" && row.requirement === "REQ-0042.5",
    );
    expect(requirementRows.length).toBeGreaterThan(0);
    expect(requirementRows.every((row) => row.evidence.includes(artifact.id))).toBe(true);
    expect(evidenceById(artifact.id)?.links).toContainEqual({ kind: "assessment", id: run.id });
    const plan = JSON.stringify(oscalAssessmentPlan("PRG-1041").json);
    expect(plan).toContain(procedure.id);
    expect(plan).toContain('"engineering-requirement","value":"REQ-0042.5"');
    expect(plan).toContain('"method","value":"INTERVIEW"');
    const results = JSON.stringify(oscalAssessmentResults("PRG-1041", rows).json);
    expect(results).toContain(run.id);
    expect(results).toContain('"methods":["INTERVIEW"]');
    expect(results).toContain(artifact.url);
    expect(JSON.stringify(oscalSsp("PRG-1041", rows).json)).toContain(artifact.url);
    expect(JSON.stringify(oscalAssessmentPlan("PRG-1042").json)).not.toContain(procedure.id);
  });
});
