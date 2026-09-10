import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn() } }));
let records: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  records = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => {
        records.set(key, value);
      },
    },
  });
});
async function load() {
  const store = await import("./assurance-library");
  store.restoreLibrary();
  return store;
}
const input = {
  programId: "PRG-1041",
  entryId: "system-a",
  versionId: "system-a@1.0",
  name: "System A installation",
  targetNodeId: "CN-0001",
  role: "Component" as const,
};
describe("versioned component and overlay workflow", () => {
  it("preserves the existing landing-zone identity and separates policy profiles", async () => {
    const s = await load();
    expect(s.libraryEntry("govcloud-landing-zone")).toMatchObject({
      id: "CMP-021",
      kind: "Component",
      versions: [expect.objectContaining({ version: "v9.6" })],
    });
    expect(s.libraryEntries("Overlay").map((e) => e.key)).toContain("enterprise-secpol");
    expect(s.libraryEntries()).toHaveLength(19);
  });
  it("creates a complete nested use atomically, pins versions, and preserves local work through publishing and reload", async () => {
    let s = await load();
    const a = s.addLibraryUse(input);
    expect(
      s.libraryUses(input.programId).filter((u) => u.id === a.id || u.parentUseId === a.id),
    ).toHaveLength(3);
    const descendants = s
      .libraryUses(input.programId)
      .filter((u) => u.entryId.startsWith("component-a"));
    expect(descendants).toHaveLength(4);
    s.saveLibraryDecision(a.id, "AU-2", {
      narrative: "Atlas mission-event mapping",
      implementation: "Planned",
    });
    s.startLibraryDraft("system-a", "2.0");
    const draft = structuredClone(s.libraryEntry("system-a")!.draft!);
    draft.controls.find((c) => c.id === "AU-2")!.implementation = "Revised product mapping";
    s.saveLibraryDraft("system-a", draft);
    s.publishLibraryDraft("system-a");
    expect(s.libraryUses(input.programId).find((u) => u.id === a.id)!.versionId).toBe(
      "system-a@1.0",
    );
    expect(s.librarySources(a.id, "AU-2")[0]!.control.implementation).not.toBe(
      "Revised product mapping",
    );
    vi.resetModules();
    s = await load();
    expect(s.libraryDecision(a.id, "AU-2").narrative).toBe("Atlas mission-event mapping");
    expect(s.libraryUses(input.programId).find((u) => u.id === a.id)!.versionId).toBe(
      "system-a@1.0",
    );
  });
  it("rejects invalid nested/base references and duplicate versions without saving", async () => {
    const s = await load();
    s.startLibraryDraft("system-a", "2.0");
    const before = records.get(s.libraryStorageKey);
    const draft = structuredClone(s.libraryEntry("system-a")!.draft!);
    draft.children.push({
      entryId: "system-a",
      versionId: "system-a@1.0",
      slot: "cycle",
      name: "cycle",
    });
    expect(() => s.saveLibraryDraft("system-a", draft)).toThrow(/cycle/);
    expect(records.get(s.libraryStorageKey)).toBe(before);
    draft.children.pop();
    draft.version = "1.0";
    expect(() => s.saveLibraryDraft("system-a", draft)).toThrow(/Versions must be unique/);
  });
  it("isolates repeated instance decisions and supports complementary overlay sources", async () => {
    const s = await load();
    const a = s.addLibraryUse(input);
    const b = s.addLibraryUse({ ...input, name: "Second system" });
    s.assignLibraryOverlay({
      programId: input.programId,
      entryId: "company-a",
      versionId: "company-a@3.0",
      targetIds: [a.id],
    });
    const sources = s.librarySources(a.id, "AU-2");
    expect(sources).toHaveLength(2);
    s.saveLibraryDecision(a.id, "AU-2", {
      sourceDecisions: Object.fromEntries(sources.map((source) => [source.id, "Confirmed"])),
      narrative: "Local decision",
    });
    expect(s.libraryDecision(b.id, "AU-2").narrative).toBe("");
    expect(s.librarySources(b.id, "AU-2")).toHaveLength(1);
    s.saveLibraryDecision(a.id, "AU-2", {
      sourceDecisions: Object.fromEntries(sources.map((source) => [source.id, "Excluded"])),
    });
    expect(s.libraryControlIds(a.id)).toContain("AU-2");
    expect(s.libraryDecision(a.id, "AU-2").assessment).toBe("Not assessed");
  });
  it("requires the exact base overlay on the same targets and retains obligations when removed", async () => {
    const s = await load();
    const a = s.addLibraryUse(input);
    const b = s.addLibraryUse(input);
    const overlay = {
      programId: input.programId,
      entryId: "europe",
      versionId: "europe@1.1",
      targetIds: [a.id],
    };
    expect(() => s.assignLibraryOverlay(overlay)).toThrow(/base overlay/);
    s.assignLibraryOverlay({
      ...overlay,
      entryId: "company-a",
      versionId: "company-a@3.0",
      targetIds: [b.id],
    });
    expect(() => s.assignLibraryOverlay(overlay)).toThrow(/base overlay/);
    s.assignLibraryOverlay({ ...overlay, entryId: "company-a", versionId: "company-a@3.0" });
    s.assignLibraryOverlay(overlay);
    const assignments = s.libraryAssignments(input.programId);
    const base = assignments.find((o) => o.entryId === "company-a")!;
    expect(() => s.removeLibraryAssignment(base.id)).toThrow(/base overlay/);
    s.removeLibraryAssignment(assignments.find((o) => o.entryId === "europe")!.id);
    expect(s.libraryControlIds(a.id)).toContain("AU-9");
  });
  it("allows program-wide overlay work without a component and exposes scope contributors", async () => {
    const s = await load();
    s.assignLibraryOverlay({
      programId: input.programId,
      entryId: "company-a",
      versionId: "company-a@3.0",
      targetIds: ["program"],
    });
    const target = s.libraryProgramTarget(input.programId);
    expect(s.libraryControlIds(target.id)).toContain("AU-2");
    const source = s
      .librarySources(target.id, "AU-2")
      .find((source) => source.entry.id === "company-a")!;
    s.saveLibraryDecision(target.id, "AU-2", { sourceDecisions: { [source.id]: "Confirmed" } });
    expect(
      s
        .librarySourcesForScope(input.programId, "CN-0001", "AU-2")
        .some((item) => item.id === source.id && item.decision === "Confirmed"),
    ).toBe(true);
    expect(s.libraryDecision(target.id, "AU-2").assessment).toBe("Not assessed");
  });
  it("keeps source conclusions separate and gates independent program assessment", async () => {
    const s = await load();
    const use = s.addLibraryUse(input);
    expect(s.librarySources(use.id, "CM-2")[0]!.control.assessment).toBe("Satisfied");
    expect(s.libraryDecision(use.id, "CM-2").assessment).toBe("Not assessed");
    expect(() => s.saveLibraryDecision(use.id, "CM-2", { assessment: "Satisfied" })).toThrow(
      /Assessor/,
    );
    const { setSession } = await import("./control-work");
    setSession({ role: "Assessor" });
    expect(() =>
      s.saveLibraryDecision(use.id, "CM-2", { assessment: "Satisfied", determination: "Reviewed" }),
    ).toThrow(/local implementation/);
    const proof = s.addLibraryProgramEvidence(use.id, {
      title: "Installed configuration check",
      kind: "Test",
      date: "2026-09-09",
      reference: "",
    });
    s.saveLibraryDecision(use.id, "CM-2", {
      narrative: "Verified installed serials",
      implementation: "Implemented",
      evidenceIds: [proof.id],
      assessment: "Satisfied",
      determination: "Deployment evidence reviewed",
    });
    expect(s.libraryDecision(use.id, "CM-2").assessment).toBe("Satisfied");
    s.saveLibraryDecision(use.id, "CM-2", { narrative: "Configuration changed" });
    expect(s.libraryDecision(use.id, "CM-2").assessment).toBe("Not assessed");
  });
  it("rejects cross-instance evidence and cross-program host/system references", async () => {
    const s = await load();
    const a = s.addLibraryUse(input);
    const b = s.addLibraryUse(input);
    const proof = s.addLibraryProgramEvidence(a.id, {
      title: "Instance A evidence",
      kind: "Test",
      date: "2026-09-09",
      reference: "",
    });
    expect(() => s.saveLibraryDecision(b.id, "AU-2", { evidenceIds: [proof.id] })).toThrow(
      /this program instance/,
    );
    expect(() => s.setLibraryUseTarget(a.id, "CN-109101")).toThrow(
      /system element in this program/,
    );
    expect(() => s.setLibraryHost(a.id, b.id)).toThrow(/another host/);
  });
  it("keeps all memory and saved records unchanged when a write fails", async () => {
    const s = await load();
    const count = s.libraryUses().length;
    const before = s.libraryVersion();
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(() => s.addLibraryUse(input)).toThrow(/could not be saved/);
    expect(s.libraryUses()).toHaveLength(count);
    expect(s.libraryVersion()).toBe(before);
  });
  it("uses program overlay decisions by default and honors instance exclusions without duplicate scope sources", async () => {
    const s = await load();
    const use = s.addLibraryUse(input);
    s.assignLibraryOverlay({
      programId: input.programId,
      entryId: "company-a",
      versionId: "company-a@3.0",
      targetIds: ["program"],
    });
    const root = s.libraryProgramTarget(input.programId);
    const source = s.librarySources(root.id, "AU-2").find((row) => row.entry.id === "company-a")!;
    s.saveLibraryDecision(root.id, "AU-2", { sourceDecisions: { [source.id]: "Confirmed" } });
    expect(s.librarySources(use.id, "AU-2").find((row) => row.id === source.id)?.decision).toBe(
      "Confirmed",
    );
    s.saveLibraryDecision(use.id, "AU-2", { sourceDecisions: { [source.id]: "Excluded" } });
    const scoped = s
      .librarySourcesForScope(input.programId, "CN-0001", "AU-2")
      .filter((row) => row.id === source.id);
    expect(scoped).toHaveLength(1);
    expect(scoped[0]!.decision).toBe("Excluded");
    s.saveLibraryDecision(use.id, "AU-2", { sourceDecisions: { [source.id]: "Pending" } });
    expect(s.librarySources(use.id, "AU-2").find((row) => row.id === source.id)?.decision).toBe(
      "Pending",
    );
  });
  it("retains host obligations and reopens local assessment when an attachment changes", async () => {
    const s = await load();
    const use = s.addLibraryUse(input);
    const host = s.addLibraryUse({
      ...input,
      entryId: "host-h",
      versionId: "host-h@3.2",
      role: "Host",
      name: "Aircraft host",
    });
    s.setLibraryHost(use.id, host.id);
    const hostOnly = s
      .libraryRelease(host.entryId, host.versionId)!
      .controls.find(
        (c) =>
          !s
            .libraryRelease(use.entryId, use.versionId)!
            .controls.some((local) => local.id === c.id),
      );
    const { setSession } = await import("./control-work");
    setSession({ role: "Assessor" });
    const proof = s.addLibraryProgramEvidence(use.id, {
      title: "Attachment verification",
      kind: "Test",
      date: "2026-09-09",
      reference: "",
    });
    s.saveLibraryDecision(use.id, "CM-2", {
      narrative: "Installed version matched",
      implementation: "Implemented",
      evidenceIds: [proof.id],
      assessment: "Satisfied",
      determination: "Verified",
    });
    s.setLibraryHost(use.id, null);
    expect(s.libraryDecision(use.id, "CM-2").assessment).toBe("Not assessed");
    if (hostOnly) expect(s.libraryControlIds(use.id)).toContain(hostOnly.id);
    expect(s.librarySources(use.id, "CM-2").some((source) => source.kind === "Host")).toBe(false);
  });
  it("creates readable catalog IDs and clears stale master assessment attribution", async () => {
    const s = await load();
    const created = s.createLibraryEntry({
      kind: "Component",
      name: "New compute unit",
      category: "Hardware",
      owner: "Product engineering",
      version: "1.0",
    });
    expect(created.id).toMatch(/^CMP-\d{3}$/);
    const another = s.createLibraryEntry({
      kind: "Component",
      name: "Another compute unit",
      category: "Hardware",
      owner: "Product engineering",
      version: "1.0",
    });
    expect(another.id).not.toBe(created.id);
    s.startLibraryDraft("system-a", "2.0");
    const draft = structuredClone(s.libraryEntry("system-a")!.draft!);
    draft.controls.find((c) => c.id === "CM-2")!.assessment = "Not assessed";
    s.saveLibraryDraft("system-a", draft);
    expect(s.libraryEntry("system-a")!.draft!.controls.find((c) => c.id === "CM-2")).toMatchObject({
      assessor: "",
      assessedOn: "",
    });
    expect(
      s.libraryRelease("system-a", "system-a@1.0")!.controls.find((c) => c.id === "CM-2")!
        .assessment,
    ).toBe("Satisfied");
  });
});
