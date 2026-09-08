import { controlMatrix } from "./control-matrix";
import { nistControls } from "./nist-catalog";
import { beforeAll, describe, expect, it } from "vitest";
import { registerPlatformStructure } from "./platform-structure";
import { registerPlatformControls } from "./platform-controls";
import { registerPlatformAssurance } from "./platform-assurance";
import { platformNodeId, platformScopeId } from "./platform-ids";
import {
  programControlRows,
  controlRequirementsInElement,
  controlFindingsInElement,
  controlAllocationCount,
  programControlScopes,
} from "./program-controls";
import { controlSetFor, recordTailoring, recordedTailoring } from "./scopes";
import { allocationsFor, requirementsForControl } from "./requirements";
import { findings } from "./findings";
import { programElementIds } from "./program-scope";

beforeAll(() => {
  registerPlatformStructure();
  registerPlatformControls();
  registerPlatformAssurance();
});
describe("program controls within a shared element selection", () => {
  it("keeps the exact native set and applies local tailoring without changing siblings", () => {
    const element = platformNodeId("LRU-001");
    const scope = platformScopeId("LRU-001");
    expect(programControlRows("PRG-1090")).toHaveLength(74);
    expect(programControlRows("PRG-1090", element)).toHaveLength(74);
    recordTailoring(scope, {
      overlays: [],
      excluded: new Map([["AC-2", "Not applicable to this component"]]),
      included: new Map(),
    });
    expect(programControlRows("PRG-1090", element).some((row) => row.id === "AC-2")).toBe(false);
    expect(
      programControlRows("PRG-1090", platformNodeId("LRU-007")).some((row) => row.id === "AC-2"),
    ).toBe(true);
    expect(programControlRows("PRG-1090").some((row) => row.id === "AC-2")).toBe(true);
    recordTailoring(scope, { overlays: [], excluded: new Map(), included: new Map() });
  });
  it("restricts requirements, allocations and findings to the selected subsystem", () => {
    const element = platformNodeId("SUB-01");
    const ids = programElementIds("PRG-1090", element);
    const requirements = controlRequirementsInElement("PRG-1090", "AC-2", element);
    expect(requirements.length).toBeGreaterThan(0);
    for (const requirement of requirements) {
      const expected = allocationsFor(requirement.id).filter(
        (allocation) => allocation.targetKind === "node" && ids.has(allocation.target),
      );
      expect(expected.length).toBeGreaterThan(0);
      expect(controlAllocationCount("PRG-1090", requirement.id, element)).toBe(expected.length);
    }
    const scopedFindings = programControlRows("PRG-1090", element).flatMap((row) => row.findings);
    expect(scopedFindings.length).toBeGreaterThan(0);
    expect(
      scopedFindings.every((finding) =>
        (finding.nodes ?? [finding.node]).some((node) => !!node && ids.has(node)),
      ),
    ).toBe(true);
    const siblingOnly = findings.find(
      (finding) =>
        finding.program === "PRG-1090" &&
        finding.nodes?.length &&
        finding.nodes.every((node) => !ids.has(node)),
    )!;
    expect(siblingOnly).toBeDefined();
    expect(
      controlFindingsInElement("PRG-1090", siblingOnly.control, element).map(
        (finding) => finding.id,
      ),
    ).not.toContain(siblingOnly.id);
  });
  it("separates unrecorded component implementation from the aggregate system claim", () => {
    const component = programControlRows("PRG-1090", platformNodeId("LRU-001")).find(
      (row) => row.id === "AC-2",
    )!;
    const system = programControlRows("PRG-1090").find((row) => row.id === "AC-2")!;
    expect(component.implementation).toBe("Unrecorded");
    expect(system.implementation).toBe("Partially implemented");
    expect(component.scopeIds).toEqual([platformScopeId("LRU-001")]);
    expect(component.assessment).toBeDefined();
  });
  it("uses a parent control set for a leaf without attributing the parent's implementation or assessment to it", () => {
    const element = "CN-0114";
    const scopes = programControlScopes("PRG-1041", element);
    expect(scopes.map((scope) => scope.id)).toEqual(["SYS-0001"]);
    const row = programControlRows("PRG-1041", element).find((control) => control.id === "AC-2")!;
    expect(
      controlSetFor("SYS-0001")!.controls.some((control) => control.control.id === row.id),
    ).toBe(true);
    expect(row.appliesTo).toContain("via Ground control segment");
    expect(row.implementation).toBe("Unrecorded");
    expect(row.assessment).toBe("Not assessed");
    expect(row.owner).toBe("Unassigned");
    expect(row.evidence).toBe(0);
    expect(requirementsForControl("AC-2", "PRG-1041").length).toBeGreaterThanOrEqual(
      controlRequirementsInElement("PRG-1041", "AC-2", element).length,
    );
  });
  it("does not turn one assessed scope into a satisfied program-wide control", () => {
    const selected = programControlRows("PRG-1041", "CN-0100").find((row) => row.id === "AC-2")!;
    const program = programControlRows("PRG-1041").find((row) => row.id === "AC-2")!;
    expect(selected.implementation).toBe("Implemented");
    expect(selected.assessment).toBe("Satisfied");
    expect(program.scopeIds.length).toBeGreaterThan(1);
    expect(program.implementation).toBe("Mixed");
    expect(program.assessment).toBe("Not assessed");
  });
  it("shows newly included controls outside a legacy program baseline", () => {
    const before = controlSetFor("SYS-0001")!;
    const prior = recordedTailoring("SYS-0001");
    const existing = new Set(controlMatrix("PRG-1041").map((row) => row.id));
    const additional = nistControls.find((control) => !existing.has(control.id))!;
    expect(additional).toBeDefined();
    recordTailoring("SYS-0001", {
      overlays: before.overlays,
      included: new Map([[additional.id, "Local requirement"]]),
      excluded: new Map(),
    });
    expect(programControlRows("PRG-1041", "CN-0100").some((row) => row.id === additional.id)).toBe(
      true,
    );
    expect(programControlRows("PRG-1041", "CN-0200").some((row) => row.id === additional.id)).toBe(
      false,
    );
    recordTailoring(
      "SYS-0001",
      prior ?? { overlays: before.overlays, included: new Map(), excluded: new Map() },
    );
  });
});
