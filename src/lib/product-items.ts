import { useMemo } from "react";
import { useRows, type Row } from "./models";
import { labelFor } from "./records";
import type { ElementType, SystemWizardDraft } from "./program-wizard";

/** One element of a product version, with the library component it pins resolved. */
export type ProductElementSpec = {
  id: string;
  revisionId: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string;
  elementType: ElementType;
  position: number;
  definedComponentId: string | null;
  library: {
    revisionId: string;
    definitionId: string;
    definitionCode: string;
    definitionName: string;
    componentName: string;
    componentType: string;
    version: string;
  } | null;
};
export type ProductTreeRow = ProductElementSpec & { children: ProductTreeRow[] };
/** A published product version and one of its active configurations: what a program picks. */
export type ProductConfigurationItem = {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription: string;
  revisionId: string;
  version: number;
  publishedAt: string | null;
  configurationId: string;
  configurationCode: string;
  configurationName: string;
  configurationDescription: string;
  /** Members of the configuration, parents before children. */
  elements: ProductElementSpec[];
  libraryCount: number;
};

type Input = {
  elements: readonly Row<"product_elements">[];
  definedComponents: readonly Row<"defined_components">[];
  componentRevisions: readonly Row<"component_definition_revisions">[];
  definitions: readonly Row<"component_definitions">[];
};

/** Every element of one version, sorted by position then code. */
export function productElementSpecs(input: Input, revisionId: string): ProductElementSpec[] {
  return input.elements
    .filter((row) => row.product_revision_id === revisionId)
    .map((row) => {
      const defined = row.defined_component_id
        ? input.definedComponents.find((item) => item.id === row.defined_component_id)
        : undefined;
      const revision = defined
        ? input.componentRevisions.find(
            (item) => item.id === defined.component_definition_revision_id,
          )
        : undefined;
      const definition = revision
        ? input.definitions.find((item) => item.id === revision.component_definition_id)
        : undefined;
      return {
        id: row.id,
        revisionId: row.product_revision_id,
        parentId: row.parent_element_id,
        code: row.code,
        name: row.name,
        description: row.description ?? "",
        elementType: row.element_type as ElementType,
        position: row.position,
        definedComponentId: row.defined_component_id,
        library:
          defined && revision && definition
            ? {
                revisionId: revision.id,
                definitionId: definition.id,
                definitionCode: definition.code,
                definitionName: definition.name,
                componentName: defined.name,
                componentType: defined.component_type,
                version: String(revision.version_number),
              }
            : null,
      };
    })
    .sort(
      (a, b) =>
        a.position - b.position || a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
}

/** Containment from parent ids; an element whose parent is missing becomes a root. */
export function productTree(specs: readonly ProductElementSpec[]): ProductTreeRow[] {
  const nodes = new Map(
    specs.map((spec) => [spec.id, { ...spec, children: [] as ProductTreeRow[] }]),
  );
  const roots: ProductTreeRow[] = [];
  for (const spec of specs) {
    const node = nodes.get(spec.id)!;
    const parent = spec.parentId ? nodes.get(spec.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Parents before children, siblings by position: the order a draft can be built in. */
function orderedMembers(specs: readonly ProductElementSpec[], memberIds: Set<string>) {
  const result: ProductElementSpec[] = [];
  const visit = (rows: ProductTreeRow[]) => {
    for (const row of rows) {
      if (!memberIds.has(row.id)) continue;
      const { children, ...spec } = row;
      result.push(spec);
      visit(children);
    }
  };
  visit(productTree(specs));
  return result;
}

export function productConfigurationItems(
  input: Input & {
    products: readonly Row<"products">[];
    revisions: readonly Row<"product_revisions">[];
    configurations: readonly Row<"product_configurations">[];
    memberships: readonly Row<"product_configuration_elements">[];
  },
): ProductConfigurationItem[] {
  const latest = new Map<string, Row<"product_revisions">>();
  for (const revision of input.revisions) {
    if (revision.state !== "published") continue;
    const current = latest.get(revision.product_id);
    if (!current || current.version_number < revision.version_number)
      latest.set(revision.product_id, revision);
  }
  return input.products
    .filter((product) => product.state === "active" && latest.has(product.id))
    .flatMap((product) => {
      const revision = latest.get(product.id)!;
      const specs = productElementSpecs(input, revision.id);
      return input.configurations
        .filter((row) => row.product_id === product.id && row.state === "active")
        .map((configuration) => {
          const memberIds = new Set(
            input.memberships
              .filter(
                (row) =>
                  row.product_revision_id === revision.id &&
                  row.product_configuration_id === configuration.id,
              )
              .map((row) => row.product_element_id),
          );
          const elements = orderedMembers(specs, memberIds);
          return {
            id: `${revision.id}:${configuration.id}`,
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            productDescription: product.description ?? "",
            revisionId: revision.id,
            version: revision.version_number,
            publishedAt: revision.published_at,
            configurationId: configuration.id,
            configurationCode: configuration.code,
            configurationName: configuration.name,
            configurationDescription: configuration.description ?? "",
            elements,
            libraryCount: elements.filter((element) => element.library).length,
          };
        });
    })
    .sort(
      (a, b) =>
        a.productCode.localeCompare(b.productCode, undefined, { numeric: true }) ||
        a.configurationCode.localeCompare(b.configurationCode, undefined, { numeric: true }),
    );
}

/** The configuration item a draft system was created from, or null once it is no longer offered. */
export function productItemFor(
  system: Pick<SystemWizardDraft, "product">,
  productItems: readonly ProductConfigurationItem[],
) {
  return system.product
    ? (productItems.find(
        (item) => item.id === `${system.product!.revisionId}:${system.product!.configurationId}`,
      ) ?? null)
    : null;
}

/** A draft system that is a variant of the configuration: the members become elements, pins kept. */
export function expandProductConfiguration(
  item: ProductConfigurationItem,
  options: { profileKey: string },
): SystemWizardDraft {
  const keys = new Map(item.elements.map((element) => [element.id, crypto.randomUUID()]));
  const lineage = `${item.productName} v${item.version} · ${item.configurationName}`;
  return {
    key: crypto.randomUUID(),
    code: `${item.productCode}-${item.configurationCode}`.toUpperCase(),
    name: `${item.productName} · ${item.configurationName}`,
    description: item.configurationDescription || item.productDescription,
    type: "platform",
    ownerPartyId: null,
    confidentiality: null,
    integrity: null,
    availability: null,
    categorizationRationale: "",
    profileKey: options.profileKey,
    product: { revisionId: item.revisionId, configurationId: item.configurationId },
    elements: item.elements.map((element) => ({
      key: keys.get(element.id)!,
      parentKey: element.parentId ? (keys.get(element.parentId) ?? null) : null,
      code: element.code,
      name: element.name,
      description: element.description,
      type: element.elementType,
      library: element.library
        ? {
            definedComponentId: element.definedComponentId!,
            revisionId: element.library.revisionId,
            rationale: `Inherited from ${lineage}`,
          }
        : null,
      productElementId: element.id,
    })),
  };
}

export function useProductConfigurationItems() {
  const products = useRows("products");
  const revisions = useRows("product_revisions");
  const configurations = useRows("product_configurations");
  const elements = useRows("product_elements");
  const memberships = useRows("product_configuration_elements");
  const definedComponents = useRows("defined_components");
  const componentRevisions = useRows("component_definition_revisions");
  const definitions = useRows("component_definitions");
  const queries = [
    products,
    revisions,
    configurations,
    elements,
    memberships,
    definedComponents,
    componentRevisions,
    definitions,
  ];
  const items = useMemo(
    () =>
      productConfigurationItems({
        products: products.data ?? [],
        revisions: revisions.data ?? [],
        configurations: configurations.data ?? [],
        elements: elements.data ?? [],
        memberships: memberships.data ?? [],
        definedComponents: definedComponents.data ?? [],
        componentRevisions: componentRevisions.data ?? [],
        definitions: definitions.data ?? [],
      }),
    [
      products.data,
      revisions.data,
      configurations.data,
      elements.data,
      memberships.data,
      definedComponents.data,
      componentRevisions.data,
      definitions.data,
    ],
  );
  return {
    items,
    queries,
    pending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error,
    ready: queries.every((query) => query.data !== undefined),
  };
}

/** Labels for lineage shown on program surfaces: product, version and configuration by id. */
export function useProductLookup() {
  const products = useRows("products");
  const revisions = useRows("product_revisions");
  const configurations = useRows("product_configurations");
  const elements = useRows("product_elements");
  const queries = [products, revisions, configurations, elements];
  const lookup = useMemo(() => {
    const byRevision = new Map((revisions.data ?? []).map((row) => [row.id, row]));
    const byProduct = new Map((products.data ?? []).map((row) => [row.id, row]));
    const byConfiguration = new Map((configurations.data ?? []).map((row) => [row.id, row]));
    const byElement = new Map((elements.data ?? []).map((row) => [row.id, row]));
    return {
      /** "Missile A v1 · Ground launch" for a variant, or null while unknown. */
      variant(system: {
        product_revision_id: string | null;
        product_configuration_id: string | null;
      }) {
        const revision = system.product_revision_id
          ? byRevision.get(system.product_revision_id)
          : undefined;
        const product = revision ? byProduct.get(revision.product_id) : undefined;
        const configuration = system.product_configuration_id
          ? byConfiguration.get(system.product_configuration_id)
          : undefined;
        if (!revision || !product) return null;
        return {
          product,
          revision,
          configuration: configuration ?? null,
          label: `${product.name} v${revision.version_number}${configuration ? ` · ${configuration.name}` : ""}`,
        };
      },
      /** The product element an inherited element instantiates. */
      element(system: { product_revision_id: string | null; product_element_id: string | null }) {
        const element = system.product_element_id
          ? byElement.get(system.product_element_id)
          : undefined;
        const revision = element ? byRevision.get(element.product_revision_id) : undefined;
        const product = revision ? byProduct.get(revision.product_id) : undefined;
        if (!element || !revision || !product) return null;
        return { element, revision, product, label: `${element.code} · ${element.name}` };
      },
    };
  }, [products.data, revisions.data, configurations.data, elements.data]);
  return {
    ...lookup,
    queries,
    pending: queries.some((query) => query.isPending),
    ready: queries.every((query) => query.data !== undefined),
  };
}

/** Every element inside one, transitively. */
export function descendantsOf(specs: readonly ProductElementSpec[], id: string) {
  const result = new Set<string>();
  let size = -1;
  while (size !== result.size) {
    size = result.size;
    for (const spec of specs)
      if (spec.parentId && (spec.parentId === id || result.has(spec.parentId))) result.add(spec.id);
  }
  return [...result];
}

/** Parents before children, siblings by position: the order memberships can be written in. */
export function elementIdsInOrder(specs: readonly ProductElementSpec[]) {
  const result: string[] = [];
  const visit = (rows: ProductTreeRow[]) => {
    for (const row of rows) {
      result.push(row.id);
      visit(row.children);
    }
  };
  visit(productTree(specs));
  return result;
}

export const elementTypeLabel = (type: string) => labelFor(type);
