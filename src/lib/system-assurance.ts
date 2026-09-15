import type { Row } from "./models";
import { systemTree, type SystemElement, type SystemTreeNode } from "./system-tree";

export type Impact = "low" | "moderate" | "high";
export type ImpactDimension = "confidentiality" | "integrity" | "availability";
export type SystemImpact = {
  value: Impact | null;
  source: "system" | "scope" | "mixed" | "unrecorded";
  scopeValues: Impact[];
  conflict: boolean;
};
export type SystemScopeSelection = {
  scope: Row<"scopes">;
  profileResolutionId: string | null;
  controlCount: number | null;
  differs: boolean;
  conflicting: boolean;
};
export type SystemAssuranceRow = SystemElement & {
  directScopes: Row<"scopes">[];
  /** Current element and descendants within its authorization boundary. */
  subtreeScopeCount: number;
  impacts: Record<ImpactDimension, SystemImpact>;
  /** Maximum known descendant values, never an adopted system categorization. */
  childImpacts: Record<ImpactDimension, Impact | null>;
  effectiveBaseline: Row<"system_effective_baselines"> | undefined;
  controlIds: string[];
  controlCount: number | null;
  inheritedFrom: SystemElement | undefined;
  /** Unique known selections in this subtree; null means no resolved baseline. */
  subtreeControlCount: number | null;
  additionalChildControlCount: number;
  unresolvedDescendantCount: number;
  scopeSelections: SystemScopeSelection[];
};
export type SystemAssuranceInput = {
  systems: SystemElement[];
  scopes: Row<"scopes">[];
  baselines: Row<"system_effective_baselines">[];
  selections: Row<"selected_controls">[];
  scopeBaselines: Row<"scope_baselines">[];
};

const dimensions = ["confidentiality", "integrity", "availability"] as const;
const impactOrder: Impact[] = ["low", "moderate", "high"];
const impact = (value: string | null): Impact | null =>
  impactOrder.includes(value as Impact) ? (value as Impact) : null;
const maximum = (values: (Impact | null)[]): Impact | null =>
  [...impactOrder].reverse().find((candidate) => values.includes(candidate)) ?? null;

function systemImpact(
  system: SystemElement,
  scopes: Row<"scopes">[],
  dimension: ImpactDimension,
): SystemImpact {
  const field = `${dimension}_impact` as const;
  const value = impact(system[field]);
  const scopeValues = impactOrder.filter((candidate) =>
    scopes.some((scope) => scope[field] === candidate),
  );
  if (value) {
    return {
      value,
      source: "system",
      scopeValues,
      conflict: scopeValues.some((candidate) => candidate !== value),
    };
  }
  if (scopeValues.length > 1) return { value: null, source: "mixed", scopeValues, conflict: true };
  return {
    value: scopeValues[0] ?? null,
    source: scopeValues.length ? "scope" : "unrecorded",
    scopeValues,
    conflict: false,
  };
}

/** Project recorded scopes and canonical baseline selections without inventing inheritance. */
export function buildSystemAssuranceRows(input: SystemAssuranceInput): SystemAssuranceRow[] {
  const byId = new Map(input.systems.map((system) => [system.id, system]));
  const scopesByElement = new Map<string, Row<"scopes">[]>();
  for (const scope of input.scopes) {
    const elementId = scope.composition_node_id ?? scope.system_id;
    const element = byId.get(elementId);
    if (
      !element ||
      element.tenant_id !== scope.tenant_id ||
      element.boundary_system_id !== scope.system_id
    )
      continue;
    const current = scopesByElement.get(elementId) ?? [];
    current.push(scope);
    scopesByElement.set(elementId, current);
  }
  const baselineBySystem = new Map(
    input.baselines.map((baseline) => [baseline.system_id, baseline]),
  );
  const controlsByResolution = new Map<string, Set<string>>();
  for (const selection of input.selections) {
    const controls = controlsByResolution.get(selection.profile_resolution_id) ?? new Set<string>();
    controls.add(selection.control_id);
    controlsByResolution.set(selection.profile_resolution_id, controls);
  }
  const adoptionsByScope = new Map<string, Row<"scope_baselines">[]>();
  for (const adoption of input.scopeBaselines) {
    const current = adoptionsByScope.get(adoption.scope_id) ?? [];
    current.push(adoption);
    adoptionsByScope.set(adoption.scope_id, current);
  }
  const rows: SystemAssuranceRow[] = input.systems.map((system) => {
    const candidate = baselineBySystem.get(system.id);
    const effectiveBaseline =
      candidate?.tenant_id === system.tenant_id &&
      candidate.boundary_system_id === system.boundary_system_id
        ? candidate
        : undefined;
    const resolutionId = effectiveBaseline?.profile_resolution_id;
    const directScopes = [...(scopesByElement.get(system.id) ?? [])].sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
    const controlIds = [...(controlsByResolution.get(resolutionId ?? "") ?? [])].sort();
    const source = byId.get(effectiveBaseline?.source_system_id ?? "");
    return {
      ...system,
      directScopes,
      subtreeScopeCount: directScopes.length,
      impacts: {
        confidentiality: systemImpact(system, directScopes, "confidentiality"),
        integrity: systemImpact(system, directScopes, "integrity"),
        availability: systemImpact(system, directScopes, "availability"),
      },
      childImpacts: { confidentiality: null, integrity: null, availability: null },
      effectiveBaseline,
      controlIds,
      controlCount: resolutionId ? controlIds.length : null,
      inheritedFrom:
        effectiveBaseline?.inherited &&
        source?.tenant_id === system.tenant_id &&
        source.boundary_system_id === system.boundary_system_id
          ? source
          : undefined,
      subtreeControlCount: resolutionId ? controlIds.length : null,
      additionalChildControlCount: 0,
      unresolvedDescendantCount: 0,
      scopeSelections: directScopes.map((scope) => {
        const adoptions = (adoptionsByScope.get(scope.id) ?? []).filter(
          (adoption) => adoption.tenant_id === scope.tenant_id,
        );
        const latest = Math.max(...adoptions.map((adoption) => Date.parse(adoption.adopted_at)));
        const resolutions = new Set(
          adoptions
            .filter((adoption) => Date.parse(adoption.adopted_at) === latest)
            .map((adoption) => adoption.profile_resolution_id),
        );
        const profileResolutionId = resolutions.size === 1 ? [...resolutions][0]! : null;
        return {
          scope,
          profileResolutionId,
          controlCount: profileResolutionId
            ? (controlsByResolution.get(profileResolutionId)?.size ?? 0)
            : null,
          differs: !!profileResolutionId && !!resolutionId && profileResolutionId !== resolutionId,
          conflicting: resolutions.size > 1,
        };
      }),
    };
  });

  // Reuse the same cycle/orphan handling as the visible tree. A nested boundary
  // remains visible in containment but never contributes to its parent's rollup.
  const nodes = new Map<string, SystemTreeNode<SystemAssuranceRow>>();
  const pending = systemTree(rows);
  while (pending.length) {
    const node = pending.pop()!;
    nodes.set(node.id, node);
    pending.push(...node.children);
  }
  for (const row of rows) {
    const descendants: SystemAssuranceRow[] = [];
    const pendingChildren = [...(nodes.get(row.id)?.children ?? [])];
    while (pendingChildren.length) {
      const child = pendingChildren.pop()!;
      if (
        child.boundary_system_id !== row.boundary_system_id ||
        child.tenant_id !== row.tenant_id ||
        child.program_id !== row.program_id
      )
        continue;
      descendants.push(child);
      pendingChildren.push(...child.children);
    }
    row.subtreeScopeCount += descendants.reduce(
      (total, child) => total + child.directScopes.length,
      0,
    );
    for (const dimension of dimensions) {
      row.childImpacts[dimension] = maximum(
        descendants.flatMap((child) => [
          child.impacts[dimension].value,
          ...child.impacts[dimension].scopeValues,
        ]),
      );
    }
    const allControls = new Set([
      ...row.controlIds,
      ...descendants.flatMap((child) => child.controlIds),
    ]);
    row.subtreeControlCount =
      row.controlCount !== null || descendants.some((child) => child.controlCount !== null)
        ? allControls.size
        : null;
    const ownControls = new Set(row.controlIds);
    row.additionalChildControlCount = [...allControls].filter((id) => !ownControls.has(id)).length;
    row.unresolvedDescendantCount = descendants.filter(
      (child) => child.controlCount === null,
    ).length;
  }
  return rows;
}
