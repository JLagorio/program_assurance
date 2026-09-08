import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvidenceArtifact } from "./evidence-catalog";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));
beforeEach(() => {
  vi.resetModules();
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});
async function setup() {
  const { registerPlatformData } = await import("./platform-ingestion");
  registerPlatformData();
  return {
    evidence: await import("./evidence-catalog"),
    presentation: await import("./evidence-presentation"),
    ids: await import("./platform-ids"),
  };
}

describe("evidence supporting-record presentation", () => {
  it("keeps each implementation scope distinct and resolves the actual assessment run", async () => {
    const { evidence, presentation, ids } = await setup();
    const artifact = evidence.evidenceById("EVD-015")!;
    const rows = presentation.evidenceSupportRows(artifact);
    const root = rows.find(
      (row) => row.link.id === "AU-6" && row.link.scopeId === ids.platformRootScopeId,
    )!;
    const component = rows.find(
      (row) => row.link.id === "AU-6" && row.link.scopeId === ids.platformScopeId("LRU-001"),
    )!;
    expect(root.available).toBe(true);
    expect(component.available).toBe(true);
    expect(root.key).not.toBe(component.key);
    expect(component.elementId).toBe(ids.platformNodeId("LRU-001"));
    expect(component.context).toBe("Mission Computer");
    expect(rows.find((row) => row.link.id === "TR-109015")).toMatchObject({
      kind: "Run",
      available: true,
      campaignId: "TC-1090",
      runId: "TR-109015",
    });
    expect(rows.find((row) => row.link.id === "REQ-015")?.kind).toBe("Requirement");
    expect(presentation.evidenceSupportSummary(artifact)).toContain("1 run");
    expect(artifact.url).toBeUndefined();
    expect(artifact.referenceUri).toBe("urn:demo:evidence:evd-015");
  });

  it("does not expose or navigate another program's target metadata", async () => {
    const { evidence, presentation } = await setup();
    const artifact: EvidenceArtifact = {
      ...evidence.evidenceById("EVD-015")!,
      scopeIds: ["SYS-0001"],
      links: [
        { kind: "control", id: "AC-2", scopeId: "SYS-0001" },
        { kind: "requirement", id: "REQ-0042" },
        { kind: "finding", id: "FND-2214" },
        { kind: "assessment", id: "TR-0101" },
      ],
    };
    const rows = presentation.evidenceSupportRows(artifact);
    expect(rows.every((row) => !row.available)).toBe(true);
    expect(
      rows.every((row) => row.title === row.link.id && row.context === "Unavailable record"),
    ).toBe(true);
    expect(rows.every((row) => !row.campaignId && !row.runId && !row.elementId)).toBe(true);
    expect(presentation.evidenceScopeNames(artifact)).toEqual([]);
  });

  it("refreshes from an exact scoped unlink without hiding other supporting claims", async () => {
    const { evidence, presentation, ids } = await setup();
    const link = { kind: "control" as const, id: "AU-6", scopeId: ids.platformScopeId("LRU-001") };
    const before = presentation.evidenceSupportRows(evidence.evidenceById("EVD-015")!);
    evidence.unlinkArtifact("EVD-015", link);
    const after = presentation.evidenceSupportRows(evidence.evidenceById("EVD-015")!);
    expect(after).toHaveLength(before.length - 1);
    expect(after.some((row) => row.link.id === link.id && row.link.scopeId === link.scopeId)).toBe(
      false,
    );
    expect(
      after.some((row) => row.link.id === "AU-6" && row.link.scopeId === ids.platformRootScopeId),
    ).toBe(true);
    expect(after.some((row) => row.link.id === "REQ-015")).toBe(true);
    expect(after.some((row) => row.runId === "TR-109015")).toBe(true);
  });
});
