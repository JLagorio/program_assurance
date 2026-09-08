import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/composition", () => ({
  nodeById: new Map([
    ["CN-TEST", { id: "CN-TEST", program: "PRG-1041", name: "Console" }],
    ["CN-OTHER", { id: "CN-OTHER", program: "PRG-OTHER", name: "Other console" }],
  ]),
  pathLabel: () => "Console",
}));
vi.mock("@/lib/reusable-components", () => ({ componentByKey: new Map() }));

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
  program: "PRG-1041",
  parent: null,
  type: "System security" as const,
  text: "The console shall lock after fifteen minutes of inactivity.",
  owner: "Engineer",
  method: "Test" as const,
  successCriteria: "Session locks at fifteen minutes.",
  derivations: [
    {
      sourceType: "Policy" as const,
      sourceId: "POL-1",
      sourceLabel: "Console policy",
      rationale: "Protect unattended sessions.",
    },
  ],
};
const allocationDraft = {
  target: "CN-TEST",
  targetKind: "node" as const,
  responsibility: "Primary" as const,
  coverage: "Full" as const,
  scope: "Interactive console sessions",
  owner: "Console team",
  rationale: "The console enforces the session timer.",
};

describe("requirement persistence", () => {
  it("traces the control from a parent to an assessment's leaf requirement", async () => {
    const store = await import("./requirements");
    expect(
      store
        .getRequirement("REQ-0042.4")
        ?.derivations.some((source) => source.sourceType === "Control statement"),
    ).toBe(false);
    expect(
      store.controlDerivationsForRequirement("REQ-0042.4").map((source) => source.sourceId),
    ).toEqual(["SI-7"]);
    expect(store.controlDerivationsForRequirement("REQ-MISSING")).toEqual([]);
  });
  it("restores new requirements, control trace, allocations and accepted edits together", async () => {
    let store = await import("./requirements");
    const requirement = store.addRequirement(draft);
    store.mapRequirementToControl(
      requirement.id,
      "AC-11",
      "Device lock",
      "The lock satisfies AC-11.",
    );
    const allocation = store.addAllocation({ ...allocationDraft, requirement: requirement.id });
    store.setRequirementField(requirement.id, { owner: "New owner", state: "Approved" });
    store.setAllocationField(allocation.id, { state: "Accepted", coverage: "Conditional" });
    vi.resetModules();
    store = await import("./requirements");
    store.restoreRequirements();
    expect(store.getRequirement(requirement.id)).toMatchObject({
      owner: "New owner",
      state: "Approved",
      text: draft.text,
    });
    expect(store.requirementsForControl("AC-11", "PRG-1041").map((item) => item.id)).toContain(
      requirement.id,
    );
    expect(store.allocationsFor(requirement.id)).toEqual([
      expect.objectContaining({ id: allocation.id, state: "Accepted", coverage: "Conditional" }),
    ]);
    expect(store.addRequirement(draft).id).not.toBe(requirement.id);
  });

  it("writes an applicability decision and its allocation atomically, with no event on storage failure", async () => {
    const store = await import("./requirements");
    const requirement = store.addRequirement(draft);
    const before = JSON.stringify({
      decisions: store.decisionsFor(requirement.id),
      allocations: store.allocationsFor(requirement.id),
    });
    const listener = vi.fn();
    store.subscribeRequirements(listener);
    setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() =>
      store.decideApplicability({
        requirement: requirement.id,
        target: "CN-TEST",
        targetKind: "node",
        applies: true,
        rationale: "The console owns session control",
        decidedBy: "Assessor",
        allocation: allocationDraft,
      }),
    ).toThrow("Quota exceeded");
    expect(
      JSON.stringify({
        decisions: store.decisionsFor(requirement.id),
        allocations: store.allocationsFor(requirement.id),
      }),
    ).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects foreign parent and allocation relationships and malformed saved records", async () => {
    const store = await import("./requirements");
    const requirement = store.addRequirement(draft);
    expect(() =>
      store.addRequirement({ ...draft, program: "PRG-OTHER", parent: requirement.id }),
    ).toThrow("Parent requirement");
    expect(() =>
      store.addAllocation({ ...allocationDraft, requirement: requirement.id, target: "CN-OTHER" }),
    ).toThrow("Allocated element");
    entries.set(
      store.requirementsStorageKey,
      JSON.stringify({ requirements: [{ id: "invalid" }] }),
    );
    vi.resetModules();
    const reloaded = await import("./requirements");
    const before = JSON.stringify(reloaded.requirements);
    expect(() => reloaded.restoreRequirements()).toThrow();
    expect(JSON.stringify(reloaded.requirements)).toBe(before);
  });
});
