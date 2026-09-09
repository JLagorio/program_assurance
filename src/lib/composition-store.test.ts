import { beforeEach, describe, expect, it, vi } from "vitest";

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

async function load() {
  const { registerPlatformData } = await import("./platform-ingestion");
  registerPlatformData();
  const store = await import("./composition-store");
  store.restoreCompositionChanges();
  return {
    store,
    graph: await import("./composition"),
    scopes: await import("./scopes"),
    revisions: await import("./control-set"),
  };
}

describe("editing the existing system tree", () => {
  it("renames and moves a seeded component without losing allocations, evidence, work, or source metadata on reload", async () => {
    let { store, graph, scopes } = await load();
    const requirements = await import("./requirements");
    const evidence = await import("./evidence-catalog");
    const work = await import("./control-work");
    const source = structuredClone(graph.nodeById.get("CN-109101")!.sourceRecord);
    const allocations = structuredClone(requirements.allocationsFor("REQ-001"));
    const artifact = structuredClone(evidence.evidenceById("EVD-015"));
    const implementation = structuredClone(work.workById("WRK-109064"));
    const edges = structuredClone(graph.compositionEdges);

    store.updateCompositionNode("CN-109101", {
      name: "Mission Computer Block 2",
      version: "2",
      supplier: "Recorded supplier",
      note: "Integration unit",
    });
    store.moveCompositionNode("CN-109101", "CN-109002");
    expect(graph.childrenOf("CN-109001").map((node) => node.id)).not.toContain("CN-109101");
    expect(graph.childrenOf("CN-109002").map((node) => node.id)).toContain("CN-109101");
    expect(graph.ancestorsOf("CN-109101").map((node) => node.id)).toEqual([
      "CN-109002",
      "CN-109000",
    ]);
    expect(graph.descendantsOf("CN-109000")).toHaveLength(26);
    expect(scopes.scopeById.get("SYS-109101")).toMatchObject({
      name: "Mission Computer Block 2",
      selectionSource: { parentScope: "SYS-1092" },
    });
    expect(graph.nodeById.get("CN-109101")!.sourceRecord).toEqual(source);
    expect(graph.compositionEdges).toEqual(edges);
    expect(requirements.allocationsFor("REQ-001")).toEqual(allocations);
    expect(evidence.evidenceById("EVD-015")).toEqual(artifact);
    expect(work.workById("WRK-109064")).toEqual(implementation);

    vi.resetModules();
    ({ store, graph, scopes } = await load());
    expect(graph.nodeById.get("CN-109101")).toMatchObject({
      name: "Mission Computer Block 2",
      version: "2",
      parent: "CN-109002",
      sourceRecord: source,
    });
    expect(graph.pathLabel("CN-109101")).toContain("Mission Computer Block 2");
    expect(graph.nodeForAsset("AST-109001")?.name).toBe("Mission Computer Block 2");
    expect(scopes.scopeById.get("SYS-109101")?.selectionSource?.parentScope).toBe("SYS-1092");
    expect((await import("./requirements")).allocationsFor("REQ-001")).toEqual(allocations);
    expect((await import("./evidence-catalog")).evidenceById("EVD-015")).toEqual(artifact);
    expect((await import("./control-work")).workById("WRK-109064")).toEqual(implementation);
    store.restoreCompositionChanges();
    expect(graph.nodesForProgram("PRG-1090")).toHaveLength(27);
  });

  it("uses the new ancestor's exact controls while preserving local tailoring and approved revision history", async () => {
    const { store, scopes, revisions } = await load();
    const approved = structuredClone(revisions.inForceRevision("SYS-109101"));
    scopes.recordTailoring("SYS-1092", {
      overlays: [],
      excluded: new Map([["AC-2", "Locally excluded by parent"]]),
      included: new Map(),
    });
    scopes.recordTailoring("SYS-109101", {
      overlays: [],
      excluded: new Map([["AU-2", "Local component tailoring"]]),
      included: new Map(),
    });
    expect(scopes.controlSetFor("SYS-109101")!.controls.map((row) => row.control.id)).toContain(
      "AC-2",
    );
    store.moveCompositionNode("CN-109101", "CN-109002");
    const ids = scopes.controlSetFor("SYS-109101")!.controls.map((row) => row.control.id);
    expect(ids).not.toContain("AC-2");
    expect(ids).not.toContain("AU-2");
    expect(scopes.recordedTailoring("SYS-109101")?.excluded.get("AU-2")).toBe(
      "Local component tailoring",
    );
    expect(revisions.inForceRevision("SYS-109101")).toEqual(approved);
    const draft = revisions.proposeRevision(
      "SYS-109101",
      "Review controls after relocating component",
    );
    expect(draft?.selectionSource?.parentScope).toBe("SYS-1092");
    expect(draft?.selectionSource?.startingControlIds).not.toContain("AC-2");
  });

  it("rejects cycles, root moves and cross-program parents before changing the graph or saved data", async () => {
    const { store, graph } = await load();
    const before = graph.graphVersion();
    expect(() => store.moveCompositionNode("CN-109000", "CN-109001")).toThrow("root");
    expect(() => store.moveCompositionNode("CN-109001", "CN-109101")).toThrow("descendants");
    expect(() => store.moveCompositionNode("CN-109101", "CN-109101")).toThrow("itself");
    expect(() => store.moveCompositionNode("CN-109101", "CN-0100")).toThrow("same program");
    expect(() => store.moveCompositionNode("CN-109101", "missing")).toThrow("same program");
    expect(() => store.updateCompositionNode("CN-109101", { name: "  " })).toThrow("name");
    expect(graph.graphVersion()).toBe(before);
    expect(entries.has(store.compositionStorageKey)).toBe(false);
    expect(store.validCompositionParents("CN-109000")).toEqual([]);
    expect(
      store
        .validCompositionParents("CN-109001")
        .every(
          (node) =>
            node.program === "PRG-1090" &&
            node.id !== "CN-109001" &&
            !graph.ancestorsOf(node.id).some((ancestor) => ancestor.id === "CN-109001"),
        ),
    ).toBe(true);
  });

  it("creates subsystem and component scopes with exact inherited controls and stable IDs across reload", async () => {
    let { store, graph, scopes, revisions } = await load();
    const baseline = scopes
      .controlSetFor("SYS-1090")!
      .controls.map((row) => row.control.id)
      .sort();
    const subsystem = store.createCompositionNode(
      {
        id: graph.nextNodeId(),
        program: "PRG-1090",
        parent: "CN-109000",
        name: "Payload integration",
        kind: "Subsystem",
        class: "System",
      },
      { owner: "Integration team" },
    );
    const component = store.createCompositionNode({
      id: graph.nextNodeId(),
      program: "PRG-1090",
      parent: subsystem.id,
      name: "Payload processor",
      kind: "Chassis",
      class: "Hardware",
    });
    const subsystemScope = scopes
      .scopesForProgram("PRG-1090")
      .find((scope) => scope.element === subsystem.id)!;
    const componentScope = scopes
      .scopesForProgram("PRG-1090")
      .find((scope) => scope.element === component.id)!;
    const initial = structuredClone(revisions.currentRevision(componentScope.id));
    const history = structuredClone(revisions.eventsForScope(componentScope.id));
    expect(componentScope.selectionSource?.parentScope).toBe(subsystemScope.id);
    expect(
      scopes
        .controlSetFor(componentScope.id)!
        .controls.map((row) => row.control.id)
        .sort(),
    ).toEqual(baseline);
    expect(component).toMatchObject({
      origin: "Unknown",
      criticality: "Unspecified",
      zone: "Unspecified",
      attested: false,
    });
    expect(initial).toMatchObject({ state: "Draft", overlays: [], tailoring: [] });
    const { programControlImplementations } = await import("./program-controls");
    expect(programControlImplementations("PRG-1090", "AU-6", component.id)).toEqual([
      expect.objectContaining({
        scopeId: componentScope.id,
        elementId: component.id,
        implementation: "Unrecorded",
        assessment: "Not assessed",
        evidence: 0,
      }),
    ]);
    const requirements = await import("./requirements");
    const allocation = requirements.addAllocation({
      requirement: "REQ-001",
      target: component.id,
      targetKind: "node",
      responsibility: "Primary",
      coverage: "Full",
      scope: "Payload integration",
      owner: "Integration team",
      rationale: "Allocated to new processor",
    });

    vi.resetModules();
    ({ store, graph, scopes, revisions } = await load());
    (await import("./requirements")).restoreRequirements();
    expect(graph.nodeById.get(component.id)?.parent).toBe(subsystem.id);
    expect(scopes.scopeById.get(componentScope.id)?.element).toBe(component.id);
    expect(revisions.currentRevision(componentScope.id)).toEqual(initial);
    expect(revisions.eventsForScope(componentScope.id)).toEqual(history);
    expect(
      scopes
        .controlSetFor(componentScope.id)!
        .controls.map((row) => row.control.id)
        .sort(),
    ).toEqual(baseline);
    expect((await import("./requirements")).allocationsFor("REQ-001")).toContainEqual(allocation);
    expect(
      (await import("./program-controls")).programControlImplementations(
        "PRG-1090",
        "AU-6",
        component.id,
      )[0],
    ).toMatchObject({ scopeId: componentScope.id, implementation: "Unrecorded" });
  });

  it("leaves graph, scope and revision state untouched when browser storage fails", async () => {
    const { store, graph, scopes, revisions } = await load();
    const before = {
      graph: graph.graphVersion(),
      scopes: scopes.scopesVersion(),
      revisions: revisions.revisionsForProgram("PRG-1090").length,
      nextId: graph.nextNodeId(),
    };
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => store.updateCompositionNode("CN-109101", { name: "Unsaved" })).toThrow(
      "could not be saved",
    );
    expect(() => store.moveCompositionNode("CN-109101", "CN-109002")).toThrow("could not be saved");
    expect(() =>
      store.createCompositionNode({
        id: before.nextId,
        program: "PRG-1090",
        parent: "CN-109000",
        name: "Unsaved subsystem",
        kind: "Subsystem",
        class: "System",
      }),
    ).toThrow("could not be saved");
    expect(graph.graphVersion()).toBe(before.graph);
    expect(scopes.scopesVersion()).toBe(before.scopes);
    expect(revisions.revisionsForProgram("PRG-1090")).toHaveLength(before.revisions);
    expect(graph.nextNodeId()).toBe(before.nextId);
    expect(graph.nodeById.get("CN-109101")).toMatchObject({
      name: "Mission Computer",
      parent: "CN-109001",
    });
  });

  it("keeps an uncategorized legacy root usable and resumes inherited controls after a move back", async () => {
    let { store, graph, scopes } = await load();
    const subsystem = store.createCompositionNode({
      id: graph.nextNodeId(),
      program: "PRG-1041",
      parent: "CN-0001",
      name: "New unclassified branch",
      kind: "Subsystem",
      class: "System",
    });
    expect(
      scopes.scopesForProgram("PRG-1041").find((scope) => scope.element === subsystem.id),
    ).toBeUndefined();
    const component = store.createCompositionNode({
      id: graph.nextNodeId(),
      program: "PRG-1041",
      parent: "CN-0100",
      name: "Replacement board",
      kind: "Board",
      class: "Hardware",
    });
    const scopeId = scopes
      .scopesForProgram("PRG-1041")
      .find((scope) => scope.element === component.id)!.id;
    store.moveCompositionNode(component.id, subsystem.id);
    expect(scopes.scopeById.get(scopeId)?.selectionSource).toMatchObject({
      inheritance: "containment",
    });
    expect(scopes.scopeById.get(scopeId)?.selectionSource?.parentScope).toBeUndefined();
    store.moveCompositionNode(component.id, "CN-0200");
    store.updateCompositionNode("CN-0200", { name: "Renamed mission software" });
    expect(scopes.scopeById.get(scopeId)?.selectionSource).toMatchObject({
      parentScope: "SYS-0002",
      label: "Inherited from Renamed mission software",
    });
    vi.resetModules();
    ({ store, graph, scopes } = await load());
    expect(scopes.scopeById.get(scopeId)?.selectionSource?.parentScope).toBe("SYS-0002");
    expect(scopes.scopeById.get("SYS-0002")?.name).toBe("Renamed mission software");
  });

  it("validates saved scope history globally before registering a new node", async () => {
    const { store, graph, revisions } = await load();
    const node = store.createCompositionNode({
      id: graph.nextNodeId(),
      program: "PRG-1090",
      parent: "CN-109000",
      name: "Saved processor",
      kind: "Chassis",
      class: "Hardware",
    });
    const saved = JSON.parse(entries.get(store.compositionStorageKey)!);
    saved.created[0].assessment.history[0].id = revisions.eventsForScope("SYS-0001")[0]!.id;
    entries.set(store.compositionStorageKey, JSON.stringify(saved));
    vi.resetModules();
    (await import("./platform-ingestion")).registerPlatformData();
    const restoredStore = await import("./composition-store");
    expect(() => restoredStore.restoreCompositionChanges()).toThrow("history");
    expect((await import("./composition")).nodeById.has(node.id)).toBe(false);
    expect((await import("./scopes")).scopeById.has(saved.created[0].assessment.scope.id)).toBe(
      false,
    );
  });

  it("rejects invalid saved containment without applying part of the edit", async () => {
    const { store } = await load();
    entries.set(
      store.compositionStorageKey,
      JSON.stringify({
        created: [],
        updates: [
          { id: "CN-109101", program: "PRG-1090", patch: { name: "Do not apply" } },
          { id: "CN-109001", program: "PRG-1090", patch: { parent: "CN-109101" } },
        ],
      }),
    );
    vi.resetModules();
    const { registerPlatformData } = await import("./platform-ingestion");
    registerPlatformData();
    const restore = await import("./composition-store");
    expect(() => restore.restoreCompositionChanges()).toThrow("descendants");
    const graph = await import("./composition");
    expect(graph.nodeById.get("CN-109101")?.name).toBe("Mission Computer");
    expect(graph.nodeById.get("CN-109001")?.parent).toBe("CN-109000");
  });
});
