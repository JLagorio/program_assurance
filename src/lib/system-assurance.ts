import type { Row } from "./models";
import type { SystemCounts } from "./system-counts";
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
  /** The controls its control baseline selects; null without one. */
  controlCount: number | null;
  inheritedFrom: SystemElement | undefined;
  /** Unique known selections in this subtree; null means no resolved baseline. */
  subtreeControlCount: number | null;
  additionalChildControlCount: number;
  unresolvedDescendantCount: number;
  scopeSelections: SystemScopeSelection[];
  /** Distinct requirement revisions allocated to this element exactly. */
  requirementCount: number;
  /** Distinct requirement revisions allocated to this element or anything inside it, within its boundary. */
  subtreeRequirementCount: number;
  /**
   * The effective profile's short name (the stable `profiles.title`), when its resolution and
   * revision are known. Falls back to the revision's own title only when no stable record is
   * loaded.
   */
  baselineTitle: string | null;
  /** The effective profile revision's own document title: provenance only, never the name. */
  baselineDocumentTitle: string | null;
  /** The effective resolution is a draft tailored profile authored for a system. */
  baselineDraft: boolean;
};
/**
 * The columns the projection reads from each input, so a caller reads no more than these. What it
 * counts (the controls a baseline selects, the requirements allocated) the server counts, so no
 * selection and no allocation is read (`program_system_counts`).
 */
export const systemAssuranceColumns = {
  scopeBaselines: ["id", "tenant_id", "scope_id", "profile_resolution_id", "adopted_at"],
  resolutions: ["id", "tenant_id", "profile_revision_id", "state"],
  profiles: ["id", "tenant_id", "profile_id", "title"],
  profileRecords: ["id", "tenant_id", "title"],
} as const;
type Columns<K extends keyof typeof systemAssuranceColumns> =
  (typeof systemAssuranceColumns)[K][number];

export type SystemAssuranceInput = {
  systems: SystemElement[];
  scopes: Row<"scopes">[];
  baselines: Row<"system_effective_baselines">[];
  scopeBaselines: Pick<Row<"scope_baselines">, Columns<"scopeBaselines">>[];
  /**
   * What the server counts of each element and of everything inside it within its boundary: the
   * controls its baseline selects and the requirement revisions allocated to it, each once. Until
   * they are read an element counts no control (zero where it has a baseline) and no requirement.
   */
  counts?: readonly SystemCounts[] | undefined;
  /** Resolutions and profile revisions name the effective baseline. */
  resolutions?: Pick<Row<"profile_resolutions">, Columns<"resolutions">>[] | undefined;
  profiles?: Pick<Row<"profile_revisions">, Columns<"profiles">>[] | undefined;
  /** The stable profile records, whose `title` is the short name shown for every revision. */
  profileRecords?: Pick<Row<"profiles">, Columns<"profileRecords">>[] | undefined;
};

/** What the Baseline column and the preview say about where the effective set comes from. */
export function baselineSource(row: SystemAssuranceRow): string {
  if (!row.effectiveBaseline?.profile_resolution_id) return "Not set";
  if (row.inheritedFrom) return `Inherited from ${row.inheritedFrom.code}`;
  switch (row.effectiveBaseline.source_label) {
    case "Explicit system adoption":
      return "Applied here";
    case "Inherited system adoption":
      return "Inherited";
    case "Authorization boundary SSP":
      return "From the boundary SSP";
    case "Authorization boundary scope adoption":
      return "From a boundary scope";
    case "Conflicting authorization boundary scope adoptions":
      return "Conflicting scope adoptions";
    default:
      return row.effectiveBaseline.source_label ?? "Not set";
  }
}

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
  const countsBySystem = new Map((input.counts ?? []).map((counts) => [counts.systemId, counts]));
  const adoptionsByScope = new Map<string, SystemAssuranceInput["scopeBaselines"]>();
  for (const adoption of input.scopeBaselines) {
    const current = adoptionsByScope.get(adoption.scope_id) ?? [];
    current.push(adoption);
    adoptionsByScope.set(adoption.scope_id, current);
  }
  const resolutionById = new Map((input.resolutions ?? []).map((row) => [row.id, row]));
  const profileById = new Map((input.profiles ?? []).map((row) => [row.id, row]));
  const profileRecordById = new Map((input.profileRecords ?? []).map((row) => [row.id, row]));
  const rows: SystemAssuranceRow[] = input.systems.map((system) => {
    const candidate = baselineBySystem.get(system.id);
    const effectiveBaseline =
      candidate?.tenant_id === system.tenant_id &&
      candidate.boundary_system_id === system.boundary_system_id
        ? candidate
        : undefined;
    const resolutionId = effectiveBaseline?.profile_resolution_id;
    const resolution = resolutionId ? resolutionById.get(resolutionId) : undefined;
    const profile = resolution ? profileById.get(resolution.profile_revision_id) : undefined;
    const counted = countsBySystem.get(system.id);
    const directScopes = [...(scopesByElement.get(system.id) ?? [])].sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
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
      controlCount: counted ? counted.controlCount : resolutionId ? 0 : null,
      inheritedFrom:
        effectiveBaseline?.inherited &&
        source?.tenant_id === system.tenant_id &&
        source.boundary_system_id === system.boundary_system_id
          ? source
          : undefined,
      subtreeControlCount: counted ? counted.subtreeControlCount : resolutionId ? 0 : null,
      additionalChildControlCount: counted?.additionalChildControlCount ?? 0,
      unresolvedDescendantCount: counted?.unresolvedDescendantCount ?? 0,
      requirementCount: counted?.requirementCount ?? 0,
      subtreeRequirementCount: counted?.subtreeRequirementCount ?? 0,
      baselineTitle: profile
        ? (profileRecordById.get(profile.profile_id)?.title ?? profile.title)
        : null,
      baselineDocumentTitle: profile?.title ?? null,
      baselineDraft: resolution?.state === "draft",
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
          differs: !!profileResolutionId && !!resolutionId && profileResolutionId !== resolutionId,
          conflicting: resolutions.size > 1,
        };
      }),
    };
  });

  // Reuse the same cycle/orphan handling as the visible tree. A nested boundary
  // remains visible in containment but never contributes to its parent's rollup. The server
  // counts the controls and requirements the same way (`program_system_counts`).
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
  }
  return rows;
}
