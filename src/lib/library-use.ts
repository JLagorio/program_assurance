import type { Row } from "./models";
import { baselineSource, type SystemAssuranceRow } from "./system-assurance";

/** One row on an element's Library tab: what is applied here or inherited, with its four facts and three flags. */
export type LibraryUseRow = {
  id: string;
  kind: "Baseline" | "Component definition";
  name: string;
  detail: string | null;
  category: string | null;
  definitionId: string | null;
  revisionId: string | null;
  version: string | null;
  appliedAt: string | null;
  appliedBy: string | null;
  rationale: string | null;
  source: string;
  inherited: boolean;
  elementId: string;
  elementCode: string;
  systemComponentId: string | null;
  assignmentId: string | null;
  contributions: number;
  changedHere: number;
  updateAvailable: { revisionId: string; version: number } | null;
};

export type LibraryUseInput = {
  element: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  components: Row<"system_components">[];
  definedComponents: Row<"defined_components">[];
  revisions: Row<"component_definition_revisions">[];
  definitions: Row<"component_definitions">[];
  contributions: Row<"component_contributions">[];
  implementations: Row<"defined_component_implementations">[];
  /** Include the elements inside this one, within its boundary. */
  includeInside?: boolean | undefined;
};

const numeric = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function subtree(element: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const ids = new Set([element.id]);
  const queue = [element.id];
  while (queue.length) {
    const parentId = queue.shift();
    for (const child of rows) {
      if (
        child.parent_system_id !== parentId ||
        child.boundary_system_id !== element.boundary_system_id ||
        ids.has(child.id)
      )
        continue;
      ids.add(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

/** The newest published revision of a definition, when it is newer than the one in use. */
export function newerRevision(
  inUse: Row<"component_definition_revisions"> | undefined,
  revisions: Row<"component_definition_revisions">[],
) {
  if (!inUse) return null;
  const latest = revisions
    .filter(
      (candidate) =>
        candidate.component_definition_id === inUse.component_definition_id &&
        candidate.state === "published" &&
        candidate.version_number > inUse.version_number,
    )
    .sort((a, b) => b.version_number - a.version_number)[0];
  return latest ? { revisionId: latest.id, version: latest.version_number } : null;
}

/** Rows for one element: the baseline first, then each applied component definition by code. */
export function libraryUses(input: LibraryUseInput): LibraryUseRow[] {
  const targets = input.includeInside
    ? subtree(input.element, input.rows)
    : new Set([input.element.id]);
  const elementById = new Map(input.rows.map((row) => [row.id, row]));
  const definedById = new Map(input.definedComponents.map((row) => [row.id, row]));
  const revisionById = new Map(input.revisions.map((row) => [row.id, row]));
  const definitionById = new Map(input.definitions.map((row) => [row.id, row]));
  const implementationById = new Map(input.implementations.map((row) => [row.id, row]));
  const contributionsByComponent = new Map<string, Row<"component_contributions">[]>();
  for (const contribution of input.contributions) {
    const current = contributionsByComponent.get(contribution.system_component_id) ?? [];
    current.push(contribution);
    contributionsByComponent.set(contribution.system_component_id, current);
  }
  const out: LibraryUseRow[] = [];
  for (const id of targets) {
    const element = elementById.get(id);
    if (!element) continue;
    if (element.effectiveBaseline?.profile_resolution_id) {
      out.push({
        id: `baseline:${element.id}`,
        kind: "Baseline",
        name: element.baselineTitle ?? "Baseline",
        detail: element.controlCount === null ? null : `${element.controlCount} controls`,
        category: null,
        definitionId: null,
        revisionId: element.effectiveBaseline.profile_resolution_id,
        version: null,
        appliedAt: null,
        appliedBy: null,
        rationale: element.baseline_rationale,
        source: baselineSource(element),
        inherited: !!element.effectiveBaseline.inherited,
        elementId: element.id,
        elementCode: element.code,
        systemComponentId: null,
        assignmentId: null,
        contributions: 0,
        changedHere: element.baselineDraft ? 1 : 0,
        updateAvailable: null,
      });
    }
  }
  const components = input.components
    .filter((component) => {
      if (!component.defined_component_id) return false;
      const elementId = component.system_element_id ?? component.system_id;
      return targets.has(elementId);
    })
    .sort((a, b) => numeric(a.code, b.code));
  for (const component of components) {
    const defined = definedById.get(component.defined_component_id!);
    const revision = defined
      ? revisionById.get(defined.component_definition_revision_id)
      : undefined;
    const definition = revision ? definitionById.get(revision.component_definition_id) : undefined;
    const elementId = component.system_element_id ?? component.system_id;
    const element = elementById.get(elementId);
    const contributions = contributionsByComponent.get(component.id) ?? [];
    const changed = contributions.filter((contribution) => {
      const origin = contribution.library_implementation_id
        ? implementationById.get(contribution.library_implementation_id)
        : undefined;
      return (
        !!origin &&
        (origin.description !== contribution.description ||
          origin.implementation_status !== contribution.implementation_status)
      );
    }).length;
    out.push({
      id: component.id,
      kind: "Component definition",
      name: definition?.name ?? component.name,
      detail: defined ? defined.name : null,
      category: definition?.category ?? null,
      definitionId: definition?.id ?? null,
      revisionId: revision?.id ?? null,
      version: revision ? String(revision.version_number) : component.version,
      appliedAt: component.applied_at ?? component.created_at,
      appliedBy: component.applied_by ?? component.created_by,
      rationale: component.applied_rationale,
      source: "Applied here",
      inherited: false,
      elementId,
      elementCode: element?.code ?? "",
      systemComponentId: component.id,
      assignmentId: component.assignment_id,
      contributions: contributions.length,
      changedHere: changed,
      updateAvailable: newerRevision(revision, input.revisions),
    });
  }
  return out;
}

/** The program's roll-up: one row per definition and version, with the elements it is applied to. */
export type LibraryRollupRow = {
  id: string;
  name: string;
  category: string | null;
  definitionId: string;
  revisionId: string;
  version: number;
  elements: { id: string; code: string; name: string; systemComponentId: string }[];
  changedHere: number;
  updateAvailable: { revisionId: string; version: number } | null;
};

export function libraryRollup(input: Omit<LibraryUseInput, "element" | "includeInside">) {
  const rows = new Map<string, LibraryRollupRow>();
  const elementById = new Map(input.rows.map((row) => [row.id, row]));
  const definedById = new Map(input.definedComponents.map((row) => [row.id, row]));
  const revisionById = new Map(input.revisions.map((row) => [row.id, row]));
  const definitionById = new Map(input.definitions.map((row) => [row.id, row]));
  const implementationById = new Map(input.implementations.map((row) => [row.id, row]));
  for (const component of input.components) {
    if (!component.defined_component_id) continue;
    const defined = definedById.get(component.defined_component_id);
    const revision = defined
      ? revisionById.get(defined.component_definition_revision_id)
      : undefined;
    const definition = revision ? definitionById.get(revision.component_definition_id) : undefined;
    const element = elementById.get(component.system_element_id ?? component.system_id);
    if (!defined || !revision || !definition || !element) continue;
    const key = `${definition.id}:${revision.id}`;
    const current = rows.get(key) ?? {
      id: key,
      name: definition.name,
      category: definition.category,
      definitionId: definition.id,
      revisionId: revision.id,
      version: revision.version_number,
      elements: [],
      changedHere: 0,
      updateAvailable: newerRevision(revision, input.revisions),
    };
    current.elements.push({
      id: element.id,
      code: element.code,
      name: element.name,
      systemComponentId: component.id,
    });
    current.changedHere += input.contributions.filter((contribution) => {
      if (contribution.system_component_id !== component.id) return false;
      const origin = contribution.library_implementation_id
        ? implementationById.get(contribution.library_implementation_id)
        : undefined;
      return !!origin && origin.description !== contribution.description;
    }).length;
    rows.set(key, current);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      elements: [...row.elements].sort((a, b) => numeric(a.code, b.code)),
    }))
    .sort((a, b) => numeric(a.name, b.name) || a.version - b.version);
}
