import { useMemo } from "react";
import { useRows, type Row } from "./models";
import { labelFor } from "./records";
import type { ElementType } from "./program-wizard";

/** One row per defined component at the latest published version of its definition. */
export type LibraryComponentItem = {
  /** The defined component id: what an element pins to. */
  id: string;
  definitionId: string;
  definitionCode: string;
  definitionName: string;
  componentName: string;
  componentType: string;
  category: string;
  version: string;
  revisionId: string;
  claimControlIds: string[];
  detail: string;
};

/** The element type a library component becomes in the tree; mirrors element_type_for_component. */
export function elementTypeForComponent(componentType: string): ElementType {
  switch (componentType) {
    case "hardware":
    case "software":
    case "service":
      return componentType;
    case "interconnection":
      return "network";
    default:
      return "other";
  }
}

export function libraryComponentItems(input: {
  definitions: readonly Row<"component_definitions">[];
  revisions: readonly Row<"component_definition_revisions">[];
  definedComponents: readonly Row<"defined_components">[];
  implementations: readonly Row<"defined_component_implementations">[];
  controlId?: string | undefined;
}): LibraryComponentItem[] {
  const latest = new Map<string, Row<"component_definition_revisions">>();
  for (const revision of input.revisions) {
    if (revision.state !== "published") continue;
    const current = latest.get(revision.component_definition_id);
    if (!current || current.version_number < revision.version_number)
      latest.set(revision.component_definition_id, revision);
  }
  return input.definedComponents
    .flatMap((defined) => {
      const revision = input.revisions.find(
        (row) => row.id === defined.component_definition_revision_id,
      );
      const definition = input.definitions.find(
        (row) => row.id === revision?.component_definition_id,
      );
      if (!revision || !definition || latest.get(definition.id)?.id !== revision.id) return [];
      const claims = input.implementations.filter(
        (row) => row.defined_component_id === defined.id && row.control_id,
      );
      if (input.controlId && !claims.some((row) => row.control_id === input.controlId)) return [];
      return [
        {
          id: defined.id,
          definitionId: definition.id,
          definitionCode: definition.code,
          definitionName: definition.name,
          componentName: defined.name,
          componentType: defined.component_type,
          category: labelFor(definition.category),
          version: String(revision.version_number),
          revisionId: revision.id,
          claimControlIds: claims.map((row) => row.control_id!),
          detail: `${defined.name} · ${labelFor(defined.component_type)}`,
        },
      ];
    })
    .sort((a, b) => a.definitionCode.localeCompare(b.definitionCode, undefined, { numeric: true }));
}

export function useLibraryComponentItems(controlId?: string) {
  const definitions = useRows("component_definitions");
  const revisions = useRows("component_definition_revisions");
  const definedComponents = useRows("defined_components");
  const implementations = useRows("defined_component_implementations");
  const queries = [definitions, revisions, definedComponents, implementations];
  const items = useMemo(
    () =>
      libraryComponentItems({
        definitions: definitions.data ?? [],
        revisions: revisions.data ?? [],
        definedComponents: definedComponents.data ?? [],
        implementations: implementations.data ?? [],
        controlId,
      }),
    [definitions.data, revisions.data, definedComponents.data, implementations.data, controlId],
  );
  return {
    items,
    queries,
    pending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error,
    ready: queries.every((query) => query.data !== undefined),
  };
}
