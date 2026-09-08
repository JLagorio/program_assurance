import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn() } }));

import { registerPlatformData } from "./platform-ingestion";
import { platformSeed } from "./platform-seed";
import {
  platformNodeId,
  platformProgramId,
  platformRootNodeId,
  platformScopeId,
} from "./platform-ids";
import { nodesForProgram, ancestorsOf } from "./composition";
import { scopesForProgram } from "./scopes";
import { closestProgramScope, programElementIds, resolveProgramElement } from "./program-scope";

beforeAll(registerPlatformData);

describe("shared program scope", () => {
  it("includes a subsystem's children without its siblings and narrows a component to itself", () => {
    const subsystem = platformSeed.subsystems[0]!;
    const expected = [
      subsystem.id,
      ...platformSeed.components
        .filter((component) => component.subsystem_id === subsystem.id)
        .map((component) => component.id),
    ];
    expect([...programElementIds(platformProgramId, platformNodeId(subsystem.id))].sort()).toEqual(
      expected.map(platformNodeId).sort(),
    );
    const component = platformSeed.components[0]!;
    expect([...programElementIds(platformProgramId, platformNodeId(component.id))]).toEqual([
      platformNodeId(component.id),
    ]);
    expect(programElementIds(platformProgramId)).toHaveLength(27);
    expect(programElementIds(platformProgramId, platformRootNodeId)).toHaveLength(27);
  });

  it("discards invalid or other-program selections instead of leaking another program's elements", () => {
    const other = nodesForProgram("PRG-1041")[0]!;
    expect(resolveProgramElement(platformProgramId, other.id)).toBeUndefined();
    expect(resolveProgramElement(platformProgramId, "missing")).toBeUndefined();
    expect(programElementIds(platformProgramId, other.id)).toEqual(
      programElementIds(platformProgramId),
    );
    expect(programElementIds(platformProgramId, other.id).has(other.id)).toBe(false);
  });

  it("uses local control sets first, then the nearest ancestor for components without a local set", () => {
    const component = platformSeed.components[0]!;
    expect(closestProgramScope(platformProgramId, platformNodeId(component.id))?.id).toBe(
      platformScopeId(component.id),
    );
    const legacyScopes = scopesForProgram("PRG-1041");
    const leaf = nodesForProgram("PRG-1041").find(
      (node) =>
        !legacyScopes.some((scope) => scope.element === node.id) &&
        ancestorsOf(node.id).some((ancestor) =>
          legacyScopes.some((scope) => scope.element === ancestor.id),
        ),
    )!;
    expect(leaf).toBeDefined();
    const nearestAncestor = ancestorsOf(leaf.id).find((ancestor) =>
      legacyScopes.some((scope) => scope.element === ancestor.id),
    )!;
    expect(closestProgramScope("PRG-1041", leaf.id)?.element).toBe(nearestAncestor.id);
  });
});
