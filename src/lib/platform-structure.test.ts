import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/reusable-components", () => ({ componentByKey: new Map() }));

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

describe("platform records in the existing program stores", () => {
  it("preserves the supplied data and registers every system, LRU, requirement and allocation", async () => {
    const { platformSeed } = await import("./platform-seed");
    const canonicalSnapshot = readFileSync("src/data/wsx90-platform-seed.json", "utf8");
    expect(createHash("sha256").update(canonicalSnapshot).digest("hex")).toBe(
      "dec4a04dedd0752761762135ce281e47c323c6591f357237bfc0cc8738544f32",
    );
    expect(platformSeed).toEqual(JSON.parse(canonicalSnapshot));
    const { registerPlatformStructure } = await import("./platform-structure");
    const ids = await import("./platform-ids");
    const composition = await import("./composition");
    const inventory = await import("./findings");
    const requirements = await import("./requirements");
    const existingCount = requirements.requirementsForProgram("PRG-1041").length;
    registerPlatformStructure();
    expect(composition.nodesForProgram(ids.platformProgramId)).toHaveLength(27);
    expect(
      inventory.assets.filter((asset) => asset.program === ids.platformProgramId),
    ).toHaveLength(20);
    expect(composition.childrenOf(ids.platformRootNodeId)).toHaveLength(6);
    expect(composition.descendantsOf(ids.platformRootNodeId)).toHaveLength(26);
    expect(requirements.requirementsForProgram(ids.platformProgramId)).toHaveLength(640);
    expect(requirements.requirementsForProgram("PRG-1041")).toHaveLength(existingCount);
    expect(
      platformSeed.requirements.flatMap((requirement) =>
        requirements.allocationsFor(requirement.id),
      ),
    ).toHaveLength(1326);
    for (const component of platformSeed.components) {
      expect(composition.nodeById.get(ids.platformNodeId(component.id))).toMatchObject({
        parent: ids.platformNodeId(component.subsystem_id),
        asset: ids.platformAssetId(component.id),
        sourceRecord: { id: component.id, uuid: component.uuid, data: component },
      });
      expect(composition.nodeForAsset(ids.platformAssetId(component.id))?.id).toBe(
        ids.platformNodeId(component.id),
      );
      expect(inventory.assetById.get(ids.platformAssetId(component.id))).toMatchObject({
        environment: "Unspecified",
        scanAvailable: false,
        node: ids.platformNodeId(component.id),
        sourceRecord: { id: component.id, uuid: component.uuid, data: component },
      });
    }
    for (const requirement of platformSeed.requirements) {
      const native = requirements.getRequirement(requirement.id)!;
      expect(native.sourceRecord?.data).toEqual(requirement);
      expect(native.assessmentMethod?.toLowerCase()).toBe(requirement.verification_method);
      expect(native.derivations.map((derivation) => derivation.sourceId)).toEqual(
        requirement.control_ids,
      );
      expect(native.derivations.every((derivation) => derivation.relation === "derived")).toBe(
        true,
      );
      expect(
        requirements.allocationsFor(requirement.id).map((allocation) => allocation.target),
      ).toEqual(requirement.component_ids.map(ids.platformNodeId));
      for (const componentId of requirement.component_ids) {
        const trace = requirements.derivedControlTrace(ids.platformNodeId(componentId));
        expect(trace.controls).toEqual(expect.arrayContaining(requirement.control_ids));
      }
    }
  });

  it("keeps native edits and source metadata through repeated ingestion and browser reload", async () => {
    let structure = await import("./platform-structure");
    let store = await import("./requirements");
    structure.registerPlatformStructure();
    store.setRequirementField("REQ-001", {
      owner: "Mission security team",
      assessmentMethod: "Interview",
      method: "Analysis",
    });
    const allocation = store.allocationsFor("REQ-001")[0]!;
    store.setAllocationField(allocation.id, {
      coverage: "Conditional",
      scope: "Authenticated maintenance sessions",
    });
    const version = store.requirementsVersion();
    structure.registerPlatformStructure();
    expect(store.requirementsVersion()).toBe(version);
    expect(store.getRequirement("REQ-001")?.owner).toBe("Mission security team");
    const original = store.getRequirement("REQ-001")?.sourceRecord;
    vi.resetModules();
    structure = await import("./platform-structure");
    store = await import("./requirements");
    structure.registerPlatformStructure();
    store.restoreRequirements();
    expect(store.getRequirement("REQ-001")).toMatchObject({
      owner: "Mission security team",
      sourceRecord: original,
      assessmentMethod: "Interview",
      method: "Analysis",
    });
    expect(store.allocationsFor("REQ-001")).toEqual([
      expect.objectContaining({
        id: allocation.id,
        coverage: "Conditional",
        scope: "Authenticated maintenance sessions",
        sourceRecord: allocation.sourceRecord,
      }),
    ]);
    expect(store.requirementsForProgram("PRG-1090")).toHaveLength(640);
  });

  it("merges a pre-ingestion saved browser snapshot and still permits independent native requirements", async () => {
    let store = await import("./requirements");
    store.setRequirementField("REQ-0042", { owner: "Existing program engineer" });
    vi.resetModules();
    const structure = await import("./platform-structure");
    store = await import("./requirements");
    structure.registerPlatformStructure();
    store.restoreRequirements();
    expect(store.getRequirement("REQ-0042")?.owner).toBe("Existing program engineer");
    expect(store.requirementsForProgram("PRG-1090")).toHaveLength(640);
    const authored = store.addRequirement({
      program: "PRG-1090",
      parent: null,
      type: "System security",
      text: "The console shall provide an accessible maintenance interface.",
      owner: "Engineering",
      method: "Test",
      successCriteria: "An operator completes the maintenance task.",
      derivations: [
        {
          sourceType: "Policy",
          sourceId: "POL-LOCAL",
          sourceLabel: "Maintenance policy",
          rationale: "Support maintainers.",
        },
      ],
    });
    expect(store.controlDerivationsForRequirement(authored.id)).toEqual([]);
    expect(store.requirementControlOrigin(authored)).toBe("No control");
    expect(store.requirementControlOrigin(store.getRequirement("REQ-001")!)).toBe("From a control");
    expect(store.requirementControlOrigin(store.getRequirement("REQ-0042")!)).toBe(
      "From a control",
    );
    expect(store.requirementMethodLabel(store.getRequirement("REQ-001")!)).toBe("Examine");
    expect(store.requirementMethodLabel(authored)).toBe("Test");
    expect(store.unmappedRequirements("PRG-1090").map((requirement) => requirement.id)).toContain(
      authored.id,
    );
    store.mapRequirementToControl(
      authored.id,
      "MA-2",
      "Controlled maintenance",
      "Satisfies the maintenance process.",
    );
    expect(store.getRequirement(authored.id)?.derivations.at(-1)).toMatchObject({
      relation: "mapped",
      sourceId: "MA-2",
    });
    expect(store.requirementControlOrigin(store.getRequirement(authored.id)!)).toBe(
      "Mapped to a control",
    );
    expect(store.getRequirement("REQ-001")?.sourceRecord?.id).toBe("REQ-001");
  });
});
