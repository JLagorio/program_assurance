import { describe, expect, it } from "vitest";
import type { Row } from "./models";
import {
  expandProductConfiguration,
  productConfigurationItems,
  productElementSpecs,
  productTree,
} from "./product-items";

const tenant = "00000000-0000-4000-8000-000000000001";
const stamp = { revision: 1, created_at: "", updated_at: "", created_by: null, updated_by: null };
const product = {
  id: "p1",
  tenant_id: tenant,
  code: "MSL-A",
  name: "Missile A",
  description: "Air-to-ground missile.",
  state: "active",
  ...stamp,
} as Row<"products">;
const retired = { ...product, id: "p2", code: "OLD", name: "Old product", state: "retired" };
const revisions = [
  {
    id: "r1",
    tenant_id: tenant,
    product_id: "p1",
    version_number: 1,
    state: "published",
    published_at: "2026-09-16T00:00:00Z",
    effective_from: null,
    remarks: null,
    ...stamp,
  },
  {
    id: "r2",
    tenant_id: tenant,
    product_id: "p1",
    version_number: 2,
    state: "draft",
    published_at: null,
    effective_from: null,
    remarks: null,
    ...stamp,
  },
  {
    id: "r3",
    tenant_id: tenant,
    product_id: "p2",
    version_number: 1,
    state: "published",
    published_at: "2026-09-16T00:00:00Z",
    effective_from: null,
    remarks: null,
    ...stamp,
  },
] as Row<"product_revisions">[];
const configurations = [
  {
    id: "c1",
    tenant_id: tenant,
    product_id: "p1",
    code: "GL",
    name: "Ground launch",
    description: "From a launcher.",
    state: "active",
    ...stamp,
  },
  {
    id: "c2",
    tenant_id: tenant,
    product_id: "p1",
    code: "AL",
    name: "Air launch",
    description: null,
    state: "retired",
    ...stamp,
  },
] as Row<"product_configurations">[];
const element = (
  id: string,
  code: string,
  parent: string | null,
  position: number,
  pin: string | null = null,
  type = "subsystem",
) =>
  ({
    id,
    tenant_id: tenant,
    product_revision_id: "r1",
    parent_element_id: parent,
    code,
    name: code.toLowerCase(),
    description: null,
    element_type: type,
    defined_component_id: pin,
    position,
    ...stamp,
  }) as Row<"product_elements">;
const elements = [
  element("e-mc", "MC", "e-guid", 0, "dc1", "hardware"),
  element("e-guid", "GUID", null, 1),
  element("e-air", "AIRFRAME", null, 0),
  element("e-lnch", "LNCH", null, 2),
];
const memberships = ["e-air", "e-guid", "e-mc", "e-lnch"].map(
  (elementId) =>
    ({
      id: `m-${elementId}`,
      tenant_id: tenant,
      product_revision_id: "r1",
      product_configuration_id: "c1",
      product_element_id: elementId,
      ...stamp,
    }) as Row<"product_configuration_elements">,
);
const library = {
  definedComponents: [
    {
      id: "dc1",
      tenant_id: tenant,
      component_definition_revision_id: "cr1",
      name: "Mission computer",
      component_type: "hardware",
      description: null,
      oscal_uuid: null,
      supplier_party_id: null,
      ...stamp,
    },
  ] as Row<"defined_components">[],
  componentRevisions: [
    {
      id: "cr1",
      tenant_id: tenant,
      component_definition_id: "cd1",
      version_number: 3,
      state: "published",
      published_at: "",
      oscal_uuid: null,
      remarks: null,
      effective_from: null,
      review_due: null,
      conditions: null,
      consumer_responsibilities: null,
      ...stamp,
    },
  ] as Row<"component_definition_revisions">[],
  definitions: [
    {
      id: "cd1",
      tenant_id: tenant,
      code: "mc",
      name: "Mission computer definition",
      description: null,
      category: "catalog_product",
      ...stamp,
    },
  ] as Row<"component_definitions">[],
};

describe("productElementSpecs", () => {
  it("resolves the pinned library component and sorts by position then code", () => {
    const specs = productElementSpecs({ elements, ...library }, "r1");
    expect(specs.map((spec) => spec.code)).toEqual(["AIRFRAME", "MC", "GUID", "LNCH"]);
    expect(specs.find((spec) => spec.code === "MC")?.library).toMatchObject({
      definitionName: "Mission computer definition",
      version: "3",
      revisionId: "cr1",
    });
    expect(productTree(specs).map((row) => row.code)).toEqual(["AIRFRAME", "GUID", "LNCH"]);
  });
});

describe("productConfigurationItems", () => {
  it("keeps active products at their latest published version and active configurations", () => {
    const items = productConfigurationItems({
      products: [product, retired],
      revisions,
      configurations,
      elements,
      memberships,
      ...library,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "r1:c1", version: 1, libraryCount: 1 });
    expect(items[0]!.elements.map((spec) => spec.code)).toEqual(["AIRFRAME", "GUID", "MC", "LNCH"]);
  });
});

describe("expandProductConfiguration", () => {
  it("builds a variant draft with remapped parents, kept pins and lineage", () => {
    const [item] = productConfigurationItems({
      products: [product],
      revisions,
      configurations,
      elements,
      memberships,
      ...library,
    });
    const draft = expandProductConfiguration(item!, { profileKey: "profile-key" });
    expect(draft).toMatchObject({
      code: "MSL-A-GL",
      name: "Missile A · Ground launch",
      description: "From a launcher.",
      type: "platform",
      profileKey: "profile-key",
      product: { revisionId: "r1", configurationId: "c1" },
    });
    const guid = draft.elements.find((row) => row.code === "GUID")!;
    const mc = draft.elements.find((row) => row.code === "MC")!;
    expect(mc.parentKey).toBe(guid.key);
    expect(mc.type).toBe("hardware");
    expect(mc.productElementId).toBe("e-mc");
    expect(mc.library).toEqual({
      definedComponentId: "dc1",
      revisionId: "cr1",
      rationale: "Inherited from Missile A v1 · Ground launch",
    });
    expect(guid.library).toBeNull();
    expect(new Set(draft.elements.map((row) => row.key)).size).toBe(4);
  });
});
