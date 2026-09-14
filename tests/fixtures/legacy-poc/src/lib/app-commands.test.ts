import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn() } }));
vi.mock("@/lib/grc-data", () => ({
  risks: [
    {
      id: "RSK-2419",
      title: "Existing risk",
      summary: "A risk",
      owner: "Alex",
      team: "Security",
      framework: "SOC 2",
      control: "CC6.1",
      inherent: 60,
      residual: 60,
      likelihood: "3",
      impact: "5",
      status: "Active",
      tone: "warning",
      updated: "2026-09-06",
      opened: "2026-09-06",
      due: "—",
      treatment: "Mitigate",
    },
  ],
  programs: [
    { id: "PRG-1", name: "One", status: "In assessment" },
    { id: "PRG-2", name: "Two", status: "Authorized" },
  ],
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

const draft = {
  title: "New risk",
  summary: "Description survives reopening",
  owner: "Alex",
  framework: "SOC 2",
  control: "CC6.1",
  treatment: "Mitigate",
  likelihood: "3",
  impact: "4",
};

describe("risk command outcomes", () => {
  it("restores a saved draft, creates a record, and preserves its treatment after a reload", async () => {
    let store = await import("./risk-store");
    store.saveRiskDraft(draft);
    vi.resetModules();
    store = await import("./risk-store");
    store.restoreRisks();
    expect(store.riskDraft()).toEqual(draft);
    const risk = store.createRisk(draft);
    expect(risk.residual).toBe(risk.inherent);
    expect(store.riskDraft()).toBeNull();
    store.addRiskTreatment({
      riskId: risk.id,
      action: "Mitigate",
      plan: "Rotate the credential",
      assignee: "Alex",
      due: "2026-10-01",
    });
    vi.resetModules();
    store = await import("./risk-store");
    store.restoreRisks();
    const { risks } = await import("./grc-data");
    expect(risks.find((item) => item.id === risk.id)).toMatchObject({
      title: draft.title,
      summary: draft.summary,
      status: "Mitigating",
      due: "2026-10-01",
    });
    expect(store.treatmentsForRisk(risk.id)).toEqual([
      expect.objectContaining({ plan: "Rotate the credential", assignee: "Alex" }),
    ]);
  });

  it("rejects invalid scores and preserves existing data when storage fails", async () => {
    const store = await import("./risk-store");
    const { risks } = await import("./grc-data");
    const before = JSON.stringify(risks);
    expect(() => store.createRisk({ ...draft, likelihood: "6" })).toThrow("whole numbers");
    setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => store.createRisk(draft)).toThrow("Quota exceeded");
    expect(JSON.stringify(risks)).toBe(before);
    expect(store.riskDraft()).toBeNull();
  });

  it("rejects malformed saved records without replacing the seed records", async () => {
    entries.set(
      "equinox.risks.v1",
      JSON.stringify({
        risks: [{ id: "bad", title: "Missing scoring fields" }],
        treatments: [],
        draft: null,
      }),
    );
    const store = await import("./risk-store");
    expect(() => store.restoreRisks()).toThrow();
    const { risks } = await import("./grc-data");
    expect(risks[0]?.id).toBe("RSK-2419");
  });
});

describe("program command outcomes", () => {
  it("restores archive and scheduling state, then restores the archived program", async () => {
    let store = await import("./program-store");
    store.saveProgramCommand("PRG-1", { archivedAt: "2026-09-06T00:00:00Z" });
    store.saveProgramCommands(["PRG-1", "PRG-2"], { assessmentScheduled: "2026-10-01" });
    vi.resetModules();
    store = await import("./program-store");
    store.restoreProgramCommands();
    const { programs } = await import("./grc-data");
    expect(programs[0]).toMatchObject({
      archivedAt: "2026-09-06T00:00:00Z",
      assessmentScheduled: "2026-10-01",
    });
    expect(programs[1]?.assessmentScheduled).toBe("2026-10-01");
    store.saveProgramCommand("PRG-1", { archivedAt: "" });
    expect(programs[0]?.archivedAt).toBe("");
  });

  it("does not partially update a bulk command if storage fails", async () => {
    const store = await import("./program-store");
    const { programs } = await import("./grc-data");
    const before = JSON.stringify(programs);
    setItem.mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(() =>
      store.saveProgramCommands(["PRG-1", "PRG-2"], { archivedAt: "2026-09-06" }),
    ).toThrow();
    expect(JSON.stringify(programs)).toBe(before);
  });
});
