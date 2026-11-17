/**
 * What a product version takes from the library, and who else takes it: the reads behind the
 * product's Structure (its library component column, its "Elements by reuse" strip and its slot).
 *
 * A pinned component is read from the Components register's view, `component_rows`, scoped to the
 * component sets the version's elements pin (one row a component of each set's latest published
 * version): whether it is assessed once, how many products and programs use it, and how many of
 * its controls a newer version left to review. Where a component is used by more programs or
 * products than take this one, `component_consumers` names who else (Also in), read only for
 * those components.
 */
import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { readComponentConsumers, type ComponentConsumers } from "./component-reuse";
import { useRows } from "./models";
import type { ProductElementSpec } from "./product-items";
import { serverRead, useServerResultRows, useStaleOnWrite, type ServerRow } from "./server-table";

/** A pinned component as the Structure reads it, from the Components register's view. */
export const componentReuseRead = serverRead({
  source: "component_rows",
  model: "defined_components",
  models: [
    "component_definitions",
    "component_definition_revisions",
    "component_assessments",
    "component_determinations",
    "component_version_changes",
    "component_version_change_controls",
    "system_components",
    "systems",
    "product_elements",
    "product_revisions",
  ],
  columns: [
    "id",
    "name",
    "component_definition_id",
    "component_definition_revision_id",
    "version",
    "published_at",
    "products",
    "programs",
    "assessment_id",
    "controls_to_review",
  ],
});

export type ComponentReuseRow = ServerRow<
  "component_rows",
  | "id"
  | "name"
  | "component_definition_id"
  | "component_definition_revision_id"
  | "version"
  | "published_at"
  | "products"
  | "programs"
  | "assessment_id"
  | "controls_to_review"
>;

/** What an element of the version takes from the library. */
export type ElementReuse = {
  /** Its library component's row in the register, at the set's latest published version. */
  component: ComponentReuseRow | null;
  /** Its library component has a published component assessment: assessed once, used here. */
  assessedOnce: boolean;
  /** The programs and products outside this product that use its library component, by name. */
  alsoIn: string[];
  /** Its code is not in the version before. */
  isNew: boolean;
  /** A part with nothing inside it that pins no library component. */
  noLibrary: boolean;
};

type Spec = Pick<ProductElementSpec, "id" | "parentId" | "code" | "library">;

/** The register row of an element's pinned component: its set, by the component's name. */
const rowOf = (spec: Spec, components: readonly ComponentReuseRow[]) =>
  spec.library
    ? (components.find(
        (row) =>
          row.component_definition_id === spec.library!.definitionId &&
          row.name === spec.library!.componentName,
      ) ?? null)
    : null;

/**
 * The components worth asking who else uses them: more products than this one, or more programs
 * than take this product. Their register rows' ids, which `component_consumers` reads.
 */
export function sharedCandidates(
  specs: readonly Spec[],
  components: readonly ComponentReuseRow[],
  productPrograms: number,
): string[] {
  const ids = new Set<string>();
  for (const spec of specs) {
    const row = rowOf(spec, components);
    if (row && ((row.products ?? 0) > 1 || (row.programs ?? 0) > productPrograms)) ids.add(row.id);
  }
  return [...ids];
}

/** Who uses a component outside a product: other products, then programs not taking it, by name. */
export function outsideConsumers(
  consumers: Pick<ComponentConsumers, "products" | "systems">,
  productId: string,
  productPrograms: ReadonlySet<string>,
): string[] {
  const products = consumers.products
    .filter((item) => item.current && item.productId !== productId)
    .map((item) => item.productName);
  const programs = consumers.systems
    .filter((item) => !productPrograms.has(item.programId))
    .map((item) => item.programName);
  return [...new Set([...products, ...programs])];
}

/** Each element of the version and what it takes from the library, by the element's id. */
export function elementReuse(input: {
  specs: readonly Spec[];
  components: readonly ComponentReuseRow[];
  /** The codes of the version before; none for a first version, where nothing is new. */
  previousCodes: ReadonlySet<string> | null;
  /** Who else uses a component, by its register row's id. */
  outside: ReadonlyMap<string, readonly string[]>;
}): Map<string, ElementReuse> {
  const parents = new Set(input.specs.map((spec) => spec.parentId).filter(Boolean));
  return new Map(
    input.specs.map((spec) => {
      const component = rowOf(spec, input.components);
      return [
        spec.id,
        {
          component,
          assessedOnce: !!component?.assessment_id,
          alsoIn: component ? [...(input.outside.get(component.id) ?? [])] : [],
          isNew: !!input.previousCodes && !input.previousCodes.has(spec.code),
          noLibrary: !spec.library && !parents.has(spec.id),
        },
      ];
    }),
  );
}

/** A newer published version of a pinned component that leaves controls to review. */
export type ComponentToReview = {
  name: string;
  /** The component's record: the version that leaves controls to review. */
  componentId: string;
  definitionId: string;
  revisionId: string;
  version: number;
  publishedAt: string | null;
  controlsToReview: number;
};

/**
 * The pinned components whose set has published a newer version than the one pinned and left
 * controls of the component to review: the most controls first, then by name.
 */
export function componentsToReview(
  specs: readonly Spec[],
  components: readonly ComponentReuseRow[],
): ComponentToReview[] {
  const found = new Map<string, ComponentToReview>();
  for (const spec of specs) {
    const row = rowOf(spec, components);
    if (!row || !spec.library || row.version === null || row.version === undefined) continue;
    if (row.version <= Number(spec.library.version) || !row.controls_to_review) continue;
    if (!row.component_definition_id || !row.component_definition_revision_id || !row.name)
      continue;
    found.set(row.id, {
      name: row.name,
      componentId: row.id,
      definitionId: row.component_definition_id,
      revisionId: row.component_definition_revision_id,
      version: row.version,
      publishedAt: row.published_at,
      controlsToReview: row.controls_to_review,
    });
  }
  return [...found.values()].sort(
    (a, b) => b.controlsToReview - a.controlsToReview || a.name.localeCompare(b.name),
  );
}

/** What a consumer's standing is read from: a write to one reads who uses a component again. */
const CONSUMER_MODELS = [
  "system_components",
  "systems",
  "product_elements",
  "product_revisions",
  "defined_components",
  "component_definition_revisions",
] as const;

/** Who uses each of several components, through every version of its set, by register row id. */
export function useComponentsConsumers(
  ids: readonly string[],
): ReadonlyMap<string, UseQueryResult<ComponentConsumers, Error>> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_consumers"];
  useStaleOnWrite(workspace.tenantId, CONSUMER_MODELS, key);
  const answers = useQueries({
    queries: ids.map((id) => ({
      queryKey: [...key, id],
      retry: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        readComponentConsumers(database(), { token: await requireIdentity(workspace) }, id, signal),
    })),
  });
  return new Map(
    ids.map((id, index) => [id, answers[index] as UseQueryResult<ComponentConsumers, Error>]),
  );
}

/**
 * What a product version's elements take from the library: the register rows of the components
 * they pin, who else uses the shared ones, and the version before's codes. One read each, for the
 * Structure and its slot alike.
 */
export function useProductReuse({
  productId,
  previousRevisionId,
  versionIds,
  specs,
}: {
  productId: string;
  /** The version before the one shown, by number; none for a first version. */
  previousRevisionId: string | null;
  /** Every version of the product, whose variants take it. */
  versionIds: readonly string[];
  specs: readonly Spec[];
}) {
  const definitionIds = useMemo(
    () => [...new Set(specs.flatMap((spec) => (spec.library ? [spec.library.definitionId] : [])))],
    [specs],
  );
  const components = useServerResultRows<ComponentReuseRow>(
    componentReuseRead,
    { filters: [{ id: "component_definition_id", value: definitionIds }] },
    { enabled: definitionIds.length > 0 },
  );
  // The programs that take the product: a component they use through it is not used elsewhere.
  const variants = useRows(
    "systems",
    { product_revision_id: [...versionIds], is_authorization_boundary: true },
    { columns: ["id", "program_id"] as const, enabled: versionIds.length > 0 },
  );
  const previous = useRows(
    "product_elements",
    { product_revision_id: previousRevisionId ?? "" },
    { columns: ["id", "code"] as const, enabled: !!previousRevisionId },
  );
  const programs = useMemo(
    () => new Set((variants.data ?? []).map((row) => row.program_id)),
    [variants.data],
  );
  const rows = components.data;
  const candidates = useMemo(
    () => (rows && variants.data ? sharedCandidates(specs, rows, programs.size) : []),
    [rows, variants.data, specs, programs],
  );
  const consumers = useComponentsConsumers(candidates);
  // Who else uses each shared component, as a key that changes only with the answers' names.
  const outsideKey = JSON.stringify(
    candidates.map((id) => {
      const data = consumers.get(id)?.data;
      return [id, data ? outsideConsumers(data, productId, programs) : null] as const;
    }),
  );
  const outside = useMemo(
    () =>
      new Map(
        (JSON.parse(outsideKey) as [string, string[] | null][]).flatMap(([id, names]) =>
          names ? [[id, names] as const] : [],
        ),
      ),
    [outsideKey],
  );
  const previousCodes = useMemo(
    () => (previous.data ? new Set(previous.data.map((row) => row.code)) : null),
    [previous.data],
  );
  const reuse = useMemo(
    () => elementReuse({ specs, components: rows ?? [], previousCodes, outside }),
    [specs, rows, previousCodes, outside],
  );
  const toReview = useMemo(() => componentsToReview(specs, rows ?? []), [specs, rows]);
  return {
    reuse,
    toReview,
    queries: [components, variants, previous, ...consumers.values()],
  };
}
