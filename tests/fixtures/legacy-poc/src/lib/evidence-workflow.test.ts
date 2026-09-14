import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn(), close: vi.fn() } }));
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

async function platformStores() {
  const { registerPlatformStructure } = await import("./platform-structure");
  const { registerPlatformControls } = await import("./platform-controls");
  const { registerPlatformAssurance } = await import("./platform-assurance");
  registerPlatformStructure();
  registerPlatformControls();
  registerPlatformAssurance();
  const evidence = await import("./evidence-catalog");
  const work = await import("./control-work");
  evidence.restoreEvidence();
  work.restoreWork();
  return { evidence, work };
}

const missionScope = "SYS-109101";
const platformDraft = {
  ...draft,
  program: "PRG-1090",
  label: "Mission Computer audit review procedure",
  scopeIds: [missionScope],
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

  it("shows only the selected component's implementation and explicitly allocated requirement support", async () => {
    const { evidence, work } = await platformStores();
    const { controlEvidence, availableControlEvidence } = await import("./control-evidence");
    const control = work.workFor("PRG-1090", missionScope, "AU-6");
    expect(controlEvidence(control).find((row) => row.artifact.id === "EVD-015")?.supports).toEqual(
      [
        { kind: "control", id: "AU-6", scopeId: missionScope },
        { kind: "requirement", id: "REQ-015", scopeId: "SYS-1090" },
      ],
    );
    const sibling = work.workFor("PRG-1090", "SYS-109113", "AU-6");
    expect(availableControlEvidence(sibling).some((row) => row.id === "EVD-015")).toBe(false);
    expect(controlEvidence(sibling).find((row) => row.artifact.id === "EVD-089")?.supports).toEqual(
      [
        { kind: "control", id: "AU-6", scopeId: sibling.scope },
        { kind: "requirement", id: "REQ-089", scopeId: "SYS-1090" },
      ],
    );

    const artifact = evidence.createEvidence({ ...platformDraft, scopeIds: [] });
    evidence.linkArtifact(artifact.id, {
      kind: "requirement",
      id: "REQ-089",
      scopeId: missionScope,
    });
    expect(
      controlEvidence(control).find((row) => row.artifact.id === artifact.id)?.supports,
    ).toEqual([{ kind: "requirement", id: "REQ-089", scopeId: missionScope }]);
    expect(control.evidence).not.toContain(artifact.id);
    expect(controlEvidence(sibling).some((row) => row.artifact.id === artifact.id)).toBe(false);
    expect(() =>
      evidence.linkArtifact(artifact.id, {
        kind: "requirement",
        id: "REQ-015",
        scopeId: sibling.scope,
      }),
    ).toThrow("allocated within this system scope");

    evidence.linkArtifact(artifact.id, { kind: "requirement", id: "REQ-089" });
    expect(controlEvidence(sibling).some((row) => row.artifact.id === artifact.id)).toBe(true);
  });

  it("keeps artifact review, implementation support, and requirement assessment separate", async () => {
    const { evidence, work } = await platformStores();
    const { controlEvidence } = await import("./control-evidence");
    const { getRequirement } = await import("./requirements");
    const { coverageOf } = await import("./requirement-verification");
    const control = work.workFor("PRG-1090", missionScope, "AU-6");
    const priorControl = {
      implementation: control.implementation,
      implementationRecorded: control.implementationRecorded,
      assessment: control.assessment,
      submitted: control.submitted,
    };
    const requirement = getRequirement("REQ-015")!;
    const priorRequirement = { state: requirement.state, coverage: coverageOf(requirement) };
    const artifact = evidence.createEvidence({
      ...platformDraft,
      links: [{ kind: "requirement", id: requirement.id, scopeId: missionScope }],
    });
    evidence.reviewEvidence(
      artifact.id,
      "Accepted",
      "Assessor",
      "Authenticity and version checked.",
    );
    expect(control.evidence).not.toContain(artifact.id);
    expect(
      controlEvidence(control).find((row) => row.artifact.id === artifact.id)?.supports,
    ).toEqual([{ kind: "requirement", id: requirement.id, scopeId: missionScope }]);
    work.linkEvidence(control.id, artifact.id);
    expect(control.evidence).toContain(artifact.id);
    work.unlinkEvidence(control.id, artifact.id);
    expect(control.evidence).not.toContain(artifact.id);
    expect(
      evidence.evidenceForTarget("PRG-1090", "requirement", requirement.id, missionScope),
    ).toContainEqual(expect.objectContaining({ id: artifact.id, review: "Accepted" }));
    expect(control).toMatchObject(priorControl);
    expect({ state: requirement.state, coverage: coverageOf(requirement) }).toEqual(
      priorRequirement,
    );
  });

  it("restores the edited Mission Computer statement and exact source unlink in SSP without changing peers", async () => {
    let { evidence, work } = await platformStores();
    const control = work.workFor("PRG-1090", missionScope, "AU-6");
    const parentBefore = { ...work.workFor("PRG-1090", "SYS-1090", "AU-6") };
    const siblingBefore = { ...work.workFor("PRG-1090", "SYS-109118", "AU-6") };
    const artifact = evidence.createEvidence(platformDraft);
    const narrative =
      "Mission Computer operators review signed audit records after each mission; exceptions are retained in the mission audit review.";
    work.setNarrative(control.id, narrative);
    work.linkEvidence(control.id, artifact.id);
    work.unlinkEvidence(control.id, "EVD-015");
    expect(work.workFor("PRG-1090", "SYS-1090", "AU-6")).toEqual(parentBefore);
    expect(work.workFor("PRG-1090", "SYS-109118", "AU-6")).toEqual(siblingBefore);

    vi.resetModules();
    ({ evidence, work } = await platformStores());
    const restored = work.workFor("PRG-1090", missionScope, "AU-6");
    expect(restored.narrative).toBe(narrative);
    expect(restored.evidence).toContain(artifact.id);
    expect(restored.evidence).not.toContain("EVD-015");
    expect(work.workFor("PRG-1090", "SYS-109118", "AU-6").evidence).toContain("EVD-015");
    expect(evidence.evidenceById("EVD-015")?.links).toContainEqual({
      kind: "requirement",
      id: "REQ-015",
      scopeId: "SYS-1090",
    });
    const { platformExportSnapshot, buildSnapshotSsp } = await import("./platform-oscal");
    const value = platformExportSnapshot();
    const document = buildSnapshotSsp(value) as {
      "system-security-plan": {
        "control-implementation": {
          "implemented-requirements": Array<{
            "control-id": string;
            remarks: string;
            "by-components": Array<{
              "component-uuid": string;
              description: string;
              links: Array<{ href: string; rel: string }>;
            }>;
          }>;
        };
      };
    };
    const exported = document["system-security-plan"]["control-implementation"][
      "implemented-requirements"
    ].find((row) => row["control-id"] === "au-6")!;
    const missionUuid = value.dataset.components.find((row) => row.id === "LRU-001")!.uuid;
    const contribution = exported["by-components"].find(
      (row) => row["component-uuid"] === missionUuid,
    )!;
    const artifactUuid = value.dataset.evidence.find((row) => row.id === artifact.id)!.uuid;
    const originalUuid = value.dataset.evidence.find((row) => row.id === "EVD-015")!.uuid;
    expect(contribution.description).toBe(narrative);
    expect(contribution.links).toContainEqual({ href: `#${artifactUuid}`, rel: "evidence" });
    expect(contribution.links).not.toContainEqual({ href: `#${originalUuid}`, rel: "evidence" });
    expect(exported.remarks).toContain(parentBefore.narrative);
    expect(
      exported["by-components"]
        .filter((row) => row !== contribution)
        .every(
          (row) =>
            row.description !== narrative &&
            !row.links.some((link) => link.href === `#${artifactUuid}`),
        ),
    ).toBe(true);
  });

  it("does not publish an unsaved statement, review, or partial control link when storage fails", async () => {
    const { evidence, work } = await platformStores();
    const { activityForProgram } = await import("./activity");
    const control = work.workFor("PRG-1090", missionScope, "AU-6");
    const artifact = evidence.createEvidence(platformDraft);
    const priorWork = { ...control };
    const priorEvents = work.activityFor(control.id);
    const priorActivity = activityForProgram("PRG-1090");
    setItem.mockImplementation((key: string, value: string) => {
      if (key === "equinox.control-work.v1") throw new Error("Quota exceeded");
      storage.set(key, value);
    });
    expect(() => work.setNarrative(control.id, "Must not replace the saved narrative.")).toThrow(
      "Quota exceeded",
    );
    expect(() => work.linkEvidence(control.id, artifact.id)).toThrow("Quota exceeded");
    expect(() => work.unlinkEvidence(control.id, "EVD-015")).toThrow("Quota exceeded");
    expect(control).toEqual(priorWork);
    expect(work.activityFor(control.id)).toEqual(priorEvents);
    expect(activityForProgram("PRG-1090")).toEqual(priorActivity);
    expect(
      JSON.parse(storage.get("equinox.evidence.v1")!).find(
        (row: { id: string }) => row.id === artifact.id,
      ).links,
    ).toEqual([]);
    setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => evidence.reviewEvidence(artifact.id, "Accepted", "Assessor", "Reviewed.")).toThrow(
      "Quota exceeded",
    );
    expect(evidence.evidenceById(artifact.id)?.review).toBe("Pending review");
  });

  it("exports a first-authored component control from its scope even without an imported contribution", async () => {
    const { evidence, work } = await platformStores();
    const { controlSetFor } = await import("./scopes");
    const { platformExportSnapshot } = await import("./platform-oscal");
    const existing = new Set(work.workForScope(missionScope).map((item) => item.control));
    const selected = controlSetFor(missionScope)!.controls.find(
      (item) => !existing.has(item.control.id),
    )!;
    const control = work.workFor("PRG-1090", missionScope, selected.control.id);
    expect(control.componentId).toBeUndefined();
    expect(platformExportSnapshot().contributions.some((item) => item.id === control.id)).toBe(
      false,
    );
    const artifact = evidence.createEvidence(platformDraft);
    work.setNarrative(
      control.id,
      "Mission Computer implementation recorded for this locally applicable control.",
    );
    work.linkEvidence(control.id, artifact.id);
    expect(platformExportSnapshot().contributions).toContainEqual(
      expect.objectContaining({
        id: control.id,
        componentId: "LRU-001",
        controlId: control.control,
        narrative: control.narrative,
        evidenceIds: [artifact.id],
      }),
    );
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
