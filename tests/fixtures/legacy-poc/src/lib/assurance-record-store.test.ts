import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn() } }));
vi.mock("@/lib/grc-data", () => ({
  programs: [{ id: "PRG-1041" }, { id: "PRG-OTHER" }],
  poamItems: [
    {
      uuid: "legacy-uuid",
      programId: "PRG-1041",
      poamId: "V-0001",
      title: "Imported weakness",
      status: "Open",
      pointOfContact: "Assessor",
      props: [],
      scheduledCompletion: "2026-10-01",
      remarks: "Imported record",
      description: "Apply the configuration",
      controls: ["AC-2"],
      milestones: [],
      associatedRisks: [],
    },
  ],
}));
vi.mock("@/lib/scopes", () => ({
  scopeById: new Map([
    ["SYS-1", { program: "PRG-1041" }],
    ["SYS-2", { program: "PRG-OTHER" }],
  ]),
}));
vi.mock("@/lib/requirements", () => ({
  getRequirement: (id: string) =>
    id === "REQ-1"
      ? { program: "PRG-1041" }
      : id === "REQ-2"
        ? { program: "PRG-OTHER" }
        : undefined,
}));
vi.mock("@/lib/campaigns", () => ({
  campaignById: new Map([
    ["TC-1", { program: "PRG-1041" }],
    ["TC-2", { program: "PRG-OTHER" }],
  ]),
}));
vi.mock("@/lib/evidence-catalog", () => ({
  notifyEvidenceSourcesChanged: vi.fn(),
  evidenceById: (id: string) =>
    id === "EVD-1"
      ? { id, program: "PRG-1041" }
      : id === "EVD-2"
        ? { id, program: "PRG-OTHER" }
        : undefined,
}));

let entries: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  entries = new Map();
  setItem = vi.fn((key: string, value: string) => entries.set(key, value));
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => entries.get(key) ?? null, setItem },
  });
});
const findingDraft = {
  program: "PRG-1041",
  scope: "SYS-1",
  title: "Session control missing",
  detail: "The console does not lock after the required idle interval.",
  control: "AC-11",
  owner: "Assessor",
  severity: "Moderate" as const,
  requirements: ["REQ-1"],
};
const poamDraft = {
  program: "PRG-1041",
  title: "Enforce console lock",
  owner: "Platform team",
  remediation: "Apply the idle-lock policy and verify the timed lock.",
  scheduledCompletion: "2026-10-01",
};

describe("program assurance records", () => {
  it("owns a finding before an asset, risk or POA&M exists and preserves that scope on reload", async () => {
    let store = await import("./assurance-record-store");
    const created = store.createFinding(findingDraft);
    expect(created).toMatchObject({
      program: "PRG-1041",
      scope: "SYS-1",
      asset: "",
      lifecycle: "Open",
    });
    expect(created.poam).toBeUndefined();
    const { programFindings } = await import("./findings");
    expect(programFindings("PRG-1041").some((finding) => finding.id === created.id)).toBe(true);
    expect(programFindings("PRG-OTHER")).not.toContain(created);
    vi.resetModules();
    store = await import("./assurance-record-store");
    store.restoreAssuranceRecords();
    const reloaded = await import("./findings");
    expect(
      reloaded.programFindings("PRG-1041").find((finding) => finding.id === created.id),
    ).toMatchObject({ scope: "SYS-1", title: findingDraft.title, requirements: ["REQ-1"] });
  });

  it("rejects relationships to another program before writing anything", async () => {
    const store = await import("./assurance-record-store");
    expect(() => store.createFinding({ ...findingDraft, scope: "SYS-2" })).toThrow(
      "Scope must belong",
    );
    expect(() => store.createFinding({ ...findingDraft, requirements: ["REQ-2"] })).toThrow(
      "Requirements must belong",
    );
    expect(() => store.createFinding({ ...findingDraft, evidence: ["EVD-2"] })).toThrow(
      "Evidence must be",
    );
    expect(() => store.createFinding({ ...findingDraft, assessmentId: "TC-2" })).toThrow(
      "Assessment must belong",
    );
    expect(setItem).not.toHaveBeenCalled();
  });

  it("creates one durable POA&M with an atomic finding link and imports legacy items once", async () => {
    let store = await import("./assurance-record-store");
    const finding = store.createFinding(findingDraft);
    const poam = store.createPoam({ ...poamDraft, findingIds: [finding.id] });
    let register = await import("./register");
    expect(register.findingsForPoam(poam.id)).toHaveLength(1);
    expect(register.findingsForPoam(poam.id)[0]).toMatchObject({
      id: finding.id,
      lifecycle: "Remediating",
    });
    expect(
      register.poamsForProgram("PRG-1041").filter((item) => item.legacyUuid === "legacy-uuid"),
    ).toHaveLength(1);
    vi.resetModules();
    store = await import("./assurance-record-store");
    store.restoreAssuranceRecords();
    register = await import("./register");
    expect(register.findingsForPoam(poam.id).map((item) => item.id)).toEqual([finding.id]);
    expect(register.poamById.get(poam.id)?.remediation).toBe(poamDraft.remediation);
    expect(register.poamItems.filter((item) => item.id === poam.id)).toHaveLength(1);
  });

  it("requires passing retest evidence and milestone completion before closing a commitment", async () => {
    const store = await import("./assurance-record-store");
    const finding = store.createFinding(findingDraft);
    const poam = store.createPoam({ ...poamDraft, findingIds: [finding.id] });
    const milestone = store.addPoamMilestone(poam.id, {
      title: "Verify idle lock",
      targetDate: "2026-09-25",
    });
    expect(() => store.updateFinding(finding.id, { lifecycle: "Closed" })).toThrow(
      "passing retest",
    );
    expect(() =>
      store.recordFindingRetest(finding.id, {
        result: "Passed",
        evidence: [],
        note: "Locked",
        assessor: "Assessor",
      }),
    ).toThrow("Attach retest evidence");
    expect(() =>
      store.recordFindingRetest(finding.id, {
        result: "Passed",
        evidence: ["EVD-2"],
        note: "Locked",
        assessor: "Assessor",
      }),
    ).toThrow("Evidence must be");
    store.recordFindingRetest(finding.id, {
      result: "Failed",
      evidence: ["EVD-1"],
      note: "Console still unlocked",
      assessor: "Assessor",
    });
    expect(() => store.updatePoam(poam.id, { status: "Completed" })).toThrow("Verify closure");
    store.recordFindingRetest(finding.id, {
      result: "Passed",
      evidence: ["EVD-1"],
      note: "Console locked at the required interval",
      assessor: "Assessor",
    });
    expect(() => store.updatePoam(poam.id, { status: "Completed" })).toThrow(
      "Complete the remediation milestones",
    );
    store.updatePoamMilestone(poam.id, milestone.id, { status: "Completed" });
    store.updatePoam(poam.id, { status: "Completed" });
    const register = await import("./register");
    expect(register.poamById.get(poam.id)?.status).toBe("Completed");
    expect(register.findingsForPoam(poam.id)[0]?.retests).toHaveLength(2);
    store.updateFinding(finding.id, { lifecycle: "Open" });
    expect(register.poamById.get(poam.id)?.status).toBe("Ongoing");
    expect(() => store.updatePoam(poam.id, { status: "Completed" })).toThrow("Verify closure");
  });

  it("rejects cross-program POA&M links and preserves the graph when storage fails", async () => {
    const store = await import("./assurance-record-store");
    const finding = store.createFinding(findingDraft);
    const otherPoam = store.createPoam({ ...poamDraft, program: "PRG-OTHER" });
    expect(() => store.linkFindingToPoam(finding.id, otherPoam.id)).toThrow("finding's program");
    const { findings } = await import("./findings");
    const { poamItems } = await import("./register");
    const previous = JSON.stringify({ findings, poamItems });
    setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => store.createPoam({ ...poamDraft, findingIds: [finding.id] })).toThrow(
      "Quota exceeded",
    );
    expect(JSON.stringify({ findings, poamItems })).toBe(previous);
  });

  it("does not replace live seeds with malformed persisted records", async () => {
    const store = await import("./assurance-record-store");
    const { findings } = await import("./findings");
    const previous = JSON.stringify(findings);
    entries.set(
      store.assuranceStorageKey,
      JSON.stringify({ findings: [{ id: "FND-bad" }], poams: [] }),
    );
    expect(() => store.restoreAssuranceRecords()).toThrow();
    expect(JSON.stringify(findings)).toBe(previous);
  });
});
