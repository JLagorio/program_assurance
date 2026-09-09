import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));
let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});
async function boot() {
  const { registerPlatformData } = await import("./platform-ingestion");
  registerPlatformData();
  return {
    registerPlatformData,
    seed: (await import("./platform-seed")).platformSeed,
    assurance: await import("./assurance-record-store"),
    findings: await import("./findings"),
    register: await import("./register"),
    evidence: await import("./evidence-catalog"),
    execution: await import("./test-execution"),
    campaigns: await import("./campaigns"),
    verification: await import("./requirement-verification"),
    schedule: await import("./program-schedule"),
    ids: await import("./platform-ids"),
    adapter: await import("./platform-assurance"),
  };
}

describe("platform records in the existing program workflow", () => {
  it("registers once and preserves every finding, control, component, evidence and remediation join", async () => {
    const app = await boot();
    app.registerPlatformData();
    // One campaign per imported assessment, and every result and finding lands on the
    // campaign its assessment_id names.
    expect(app.campaigns.campaigns.filter((row) => row.program === "PRG-1090")).toHaveLength(2);
    expect(
      app.campaigns.campaigns.filter((row) => row.program === "PRG-1090").map((row) => row.id),
    ).toEqual(["TC-1090", "TC-1090-2"]);
    for (const [index, assessment] of app.seed.assessments.entries()) {
      const event = app.campaigns.eventById.get(app.adapter.platformEventIdFor(index))!;
      expect(event.campaign).toBe(app.adapter.platformCampaignIdFor(index));
      expect(event.objectives).toHaveLength(
        app.seed.assessment_results.filter(
          (row) => (row.assessment_id ?? app.seed.assessments[0]!.id) === assessment.id,
        ).length,
      );
      expect(new Set(event.findings)).toEqual(
        new Set(
          app.seed.findings
            .filter((row) => (row.assessment_id ?? app.seed.assessments[0]!.id) === assessment.id)
            .map((row) => row.id),
        ),
      );
    }
    expect(app.findings.programFindings("PRG-1090")).toHaveLength(52);
    expect(app.register.poamsForProgram("PRG-1090")).toHaveLength(40);
    expect(app.evidence.evidenceForProgram("PRG-1090")).toHaveLength(368);
    for (const source of app.seed.findings) {
      const finding = app.findings.programFindings("PRG-1090").find((row) => row.id === source.id)!;
      expect(finding.controls).toEqual(source.control_ids);
      expect(finding.assets).toEqual(source.component_ids.map(app.ids.platformAssetId));
      expect(finding.requirements).toEqual(source.requirement_ids);
      expect(finding.assessment.evidence).toEqual(source.evidence_ids);
      expect(finding.sourceUuid).toBe(source.uuid);
    }
    for (const source of app.seed.evidence) {
      const artifact = app.evidence.evidenceById(source.id)!;
      expect(artifact.label).toBe(source.title);
      expect(artifact.referenceUri).toBe(source.uri);
      expect(artifact.url).toBeUndefined();
      expect(artifact.sha256).toBe(source.sha256);
      for (const id of source.requirement_ids)
        expect(artifact.links).toContainEqual({
          kind: "requirement",
          id,
          scopeId: app.ids.platformRootScopeId,
        });
      for (const id of source.control_ids)
        expect(artifact.links).toContainEqual({
          kind: "control",
          id,
          scopeId: app.ids.platformRootScopeId,
        });
    }
    for (const source of app.seed.poam_items) {
      expect(app.register.findingsForPoam(source.id).map((row) => row.id)).toEqual(
        source.finding_ids,
      );
      for (const risk of source.risk_ids)
        expect(app.register.poamsForRisk(risk).some((row) => row.id === source.id)).toBe(true);
    }
    const { postureOf } = await import("./graph-posture");
    for (const component of app.seed.findings[0]!.component_ids)
      expect(postureOf(app.ids.platformNodeId(component)).openFindings).toContain("FND-001");
    for (const component of app.seed.findings[0]!.component_ids)
      expect(
        app.findings
          .findingsByAsset(app.ids.platformAssetId(component))
          .some((finding) => finding.id === "FND-001"),
      ).toBe(true);
    expect(postureOf(app.ids.platformRootNodeId).rolled.total).toBe(52);
  });

  it("retains source outcomes and explicitly leaves missing evidence, retests and milestone dates missing", async () => {
    const app = await boot();
    let unsupportedPasses = 0;
    for (const [index, source] of app.seed.assessment_results.entries()) {
      const objectiveId = app.adapter.platformObjectiveId(index);
      expect(app.verification.requirementsForObjective(objectiveId)).toContain(
        source.requirement_id,
      );
      const run = app.execution.runById(app.adapter.platformRunId(index));
      if (source.outcome === "not-assessed") {
        expect(run).toBeNull();
        continue;
      }
      expect(run?.records[0]?.evidence).toEqual(source.evidence_ids);
      expect(run?.nodes).toEqual(source.component_ids.map(app.ids.platformNodeId));
      if (source.outcome === "pass" && !source.evidence_ids.length) {
        unsupportedPasses++;
        expect(run?.records[0]?.result).toBe("Pass");
        expect(app.execution.resolvedObjectiveResult(objectiveId).result).toBe("Partially met");
      }
    }
    expect(unsupportedPasses).toBe(23);
    const closed = app.findings
      .programFindings("PRG-1090")
      .filter((row) => row.lifecycle === "Closed");
    expect(closed).toHaveLength(9);
    // No closure carries an invented retest record. The three closures the source
    // cannot support are still flagged; the six that name a later passing result are not.
    expect(closed.every((finding) => !finding.retests?.length)).toBe(true);
    expect(
      closed.filter((finding) => finding.sourceIssues?.some((issue) => issue.includes("closed"))),
    ).toHaveLength(3);
    const milestones = app.register
      .poamsForProgram("PRG-1090")
      .flatMap((item) => item.milestones ?? []);
    expect(milestones).toHaveLength(129);
    // The first campaign's POA&M supplied no dates and none are invented for it.
    expect(milestones.filter((item) => item.targetDate === "")).toHaveLength(48);
    expect(milestones.filter((item) => item.targetDate !== "")).toHaveLength(81);
    expect(app.register.riskById.get("RSK-001")?.residual).toBeNull();
    expect(app.register.riskById.get("RSK-001")?.sourceRating?.overall).toBe("high");
    const schedule = app.schedule
      .scheduleForProgram("PRG-1090")
      .filter((row) => row.kind === "POA&M milestone");
    expect(schedule.filter((row) => row.due === null)).toHaveLength(48);
    expect(schedule.every((row) => (row.due === null) === (row.dates === "Unscheduled"))).toBe(
      true,
    );
  });

  it("uses existing edit, review and milestone commands and restores them over the imported records", async () => {
    let app = await boot();
    app.assurance.updateFinding("FND-001", {
      title: "Updated source finding",
      owner: "Review team",
    });
    app.assurance.updatePoam("POAM-001", { owner: "Remediation team" });
    app.assurance.updatePoamMilestone("POAM-001", "POAM-001-M1", { targetDate: "2026-10-02" });
    app.evidence.reviewEvidence("EVD-001", "Accepted", "Assessor", "Reviewed source capture");
    app.registerPlatformData();
    expect(app.findings.programFindings("PRG-1090")[0]?.title).toBe("Updated source finding");
    vi.resetModules();
    app = await boot();
    app.assurance.restoreAssuranceRecords();
    app.evidence.restoreEvidence();
    const finding = app.findings.programFindings("PRG-1090").find((row) => row.id === "FND-001")!;
    expect(finding.title).toBe("Updated source finding");
    expect(finding.controls).toEqual(["AC-11", "AU-4"]);
    expect(finding.assets).toHaveLength(2);
    expect(app.register.poamById.get("POAM-001")?.owner).toBe("Remediation team");
    expect(app.register.poamById.get("POAM-001")?.milestones?.[0]?.targetDate).toBe("2026-10-02");
    expect(app.register.poamById.get("POAM-001")?.milestones?.[1]?.targetDate).toBe("");
    expect(app.evidence.evidenceById("EVD-001")?.review).toBe("Accepted");
    expect(app.evidence.evidenceById("EVD-001")?.referenceUri).toBe("urn:demo:evidence:evd-001");
  });

  it("retests an imported failure through the existing run log and retains the original assessment on reload", async () => {
    let app = await boot();
    const index = app.seed.assessment_results.findIndex(
      (result) => result.requirement_id === "REQ-008",
    );
    const objectiveId = app.adapter.platformObjectiveId(index);
    const originalId = app.adapter.platformRunId(index);
    const artifact = app.evidence.createEvidence({
      program: "PRG-1090",
      label: "Session control retest",
      collected: "2026-09-09",
      owner: "Assessor",
      kind: "Test result",
      version: "1",
      provenance: "Retest capture for the affected components",
      url: "https://example.test/retest.txt",
      links: [{ kind: "requirement", id: "REQ-008" }],
    });
    const run = app.execution.createTestRun({
      procedure: app.adapter.platformProcedureId(index),
      event: app.adapter.platformEventId,
      operator: "Assessor",
      build: "WS-X90 remediation build 2",
      retestOf: originalId,
    });
    app.execution.recordStep(run.id, `${run.procedure}-S1`, {
      result: "Pass",
      observed: "Both components enforced the defined controls",
      evidence: [artifact.id],
    });
    app.execution.setRunState(run.id, "Complete");
    expect(app.execution.resolvedObjectiveResult(objectiveId).result).toBe("Met");
    expect(app.execution.runById(originalId)?.records[0]?.result).toBe("Fail");
    app.assurance.recordFindingRetest("FND-001", {
      result: "Passed",
      evidence: [artifact.id],
      note: "Retest confirmed the correction",
      assessor: "Assessor",
    });
    const { postureOf } = await import("./graph-posture");
    for (const component of app.seed.findings[0]!.component_ids)
      expect(postureOf(app.ids.platformNodeId(component)).openFindings).not.toContain("FND-001");
    expect(
      app.findings.programFindings("PRG-1090").find((row) => row.id === "FND-001")?.lifecycle,
    ).toBe("Closed");
    vi.resetModules();
    app = await boot();
    app.execution.restoreTestRuns();
    app.evidence.restoreEvidence();
    app.assurance.restoreAssuranceRecords();
    expect(app.execution.runById(run.id)?.retestOf).toBe(originalId);
    expect(app.execution.resolvedObjectiveResult(objectiveId).result).toBe("Met");
    expect(app.execution.runById(originalId)?.records[0]?.evidence).toEqual([]);
    expect(
      app.findings.programFindings("PRG-1090").find((row) => row.id === "FND-001")?.retests,
    ).toHaveLength(1);
  });
});
