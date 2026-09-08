import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/reusable-components", () => ({ componentByKey: new Map() }));

beforeEach(() => {
  vi.resetModules();
  const entries = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    },
  });
});

describe("requirement selection by system element", () => {
  it("includes a subsystem's component allocations and excludes sibling allocations", async () => {
    const { registerPlatformStructure } = await import("./platform-structure");
    registerPlatformStructure();
    const { platformSeed } = await import("./platform-seed");
    const { platformProgramId, platformNodeId } = await import("./platform-ids");
    const { requirementsForProgramElement, allocationsForProgramElement } =
      await import("./requirement-context");
    const subsystemComponents = new Set(
      platformSeed.components
        .filter((component) => component.subsystem_id === "SUB-01")
        .map((component) => component.id),
    );
    const expected = platformSeed.requirements
      .filter((requirement) =>
        requirement.component_ids.some((component) => subsystemComponents.has(component)),
      )
      .map((requirement) => requirement.id);
    expect(
      requirementsForProgramElement(platformProgramId, platformNodeId("SUB-01")).map(
        (requirement) => requirement.id,
      ),
    ).toEqual(expected);
    const componentRequirements = requirementsForProgramElement(
      platformProgramId,
      platformNodeId("LRU-001"),
    );
    expect(componentRequirements.map((requirement) => requirement.id)).toEqual(
      platformSeed.requirements
        .filter((requirement) => requirement.component_ids.includes("LRU-001"))
        .map((requirement) => requirement.id),
    );
    for (const requirement of componentRequirements) {
      expect(
        allocationsForProgramElement(
          requirement.id,
          platformProgramId,
          platformNodeId("LRU-001"),
        ).map((allocation) => allocation.target),
      ).toEqual([platformNodeId("LRU-001")]);
    }
    expect(
      allocationsForProgramElement("REQ-002", platformProgramId, platformNodeId("LRU-001")),
    ).toEqual([]);
  });

  it("keeps independent unallocated requirements in Whole system and rejects foreign relationships", async () => {
    const { registerPlatformStructure } = await import("./platform-structure");
    registerPlatformStructure();
    const { addRequirement } = await import("./requirements");
    const { platformProgramId, platformNodeId } = await import("./platform-ids");
    const { requirementsForProgramElement, allocationsForProgramElement } =
      await import("./requirement-context");
    const requirement = addRequirement({
      program: platformProgramId,
      parent: null,
      type: "System security",
      text: "The console shall expose its maintenance state.",
      owner: "Systems engineer",
      method: "Test",
      successCriteria: "The maintainer can read the state.",
      derivations: [
        {
          sourceType: "Architecture decision",
          sourceId: "ADR-001",
          sourceLabel: "Maintenance interface",
          rationale: "Support maintenance.",
        },
      ],
    });
    expect(requirementsForProgramElement(platformProgramId).map((item) => item.id)).toContain(
      requirement.id,
    );
    expect(
      requirementsForProgramElement(platformProgramId, platformNodeId("SUB-01")).map(
        (item) => item.id,
      ),
    ).not.toContain(requirement.id);
    expect(requirementsForProgramElement(platformProgramId, "CN-0001")).toEqual(
      requirementsForProgramElement(platformProgramId),
    );
    expect(requirementsForProgramElement(platformProgramId, "CN-MISSING")).toEqual(
      requirementsForProgramElement(platformProgramId),
    );
    expect(allocationsForProgramElement("REQ-0042", platformProgramId)).toEqual([]);
  });
});
