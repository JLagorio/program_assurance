import { describe, expect, it } from "vitest";
import { libraryRollup, libraryUses, newerRevision } from "./library-use";
import type { Row, TableName } from "./models";
import type { SystemAssuranceRow } from "./system-assurance";

const record = <T extends TableName>(value: Partial<Row<T>>) => value as Row<T>;
const element = (id: string, values: Partial<SystemAssuranceRow> = {}): SystemAssuranceRow =>
  ({
    id,
    code: id.toUpperCase(),
    name: id,
    tenant_id: "tenant",
    program_id: "program",
    boundary_system_id: "root",
    parent_system_id: id === "root" ? null : "root",
    is_authorization_boundary: id === "root",
    baseline_rationale: null,
    baselineTitle: null,
    baselineDraft: false,
    controlCount: null,
    effectiveBaseline: undefined,
    inheritedFrom: undefined,
    ...values,
  }) as SystemAssuranceRow;

const definitions = [
  record<"component_definitions">({
    id: "def",
    name: "Corporate audit policy",
    category: "organizational_baseline",
  }),
];
const revisions = [
  record<"component_definition_revisions">({
    id: "v1",
    component_definition_id: "def",
    version_number: 1,
    state: "published",
  }),
  record<"component_definition_revisions">({
    id: "v2",
    component_definition_id: "def",
    version_number: 2,
    state: "published",
  }),
  record<"component_definition_revisions">({
    id: "v3",
    component_definition_id: "def",
    version_number: 3,
    state: "draft",
  }),
];
const definedComponents = [
  record<"defined_components">({
    id: "policy-v1",
    component_definition_revision_id: "v1",
    name: "Audit policy",
  }),
];
const implementations = [
  record<"defined_component_implementations">({
    id: "impl-a",
    description: "Library text A",
    implementation_status: "implemented",
  }),
  record<"defined_component_implementations">({
    id: "impl-b",
    description: "Library text B",
    implementation_status: "implemented",
  }),
];
const components = [
  record<"system_components">({
    id: "cmp-child",
    system_id: "root",
    system_element_id: "child",
    defined_component_id: "policy-v1",
    code: "CMP-1",
    name: "Audit policy",
    version: "1",
    applied_at: "2026-09-15T10:00:00Z",
    applied_by: "user",
    applied_rationale: "Operated from Sierra Vista.",
    assignment_id: "asg-1",
    created_at: "2026-09-15T09:00:00Z",
    created_by: "user",
  }),
  record<"system_components">({
    id: "cmp-leaf",
    system_id: "root",
    system_element_id: "leaf",
    defined_component_id: "policy-v1",
    code: "CMP-2",
    name: "Audit policy",
    version: "1",
    applied_at: null,
    applied_by: null,
    applied_rationale: null,
    assignment_id: "asg-1",
    created_at: "2026-09-15T09:30:00Z",
    created_by: "user",
  }),
  record<"system_components">({
    id: "cmp-plain",
    system_id: "root",
    system_element_id: "child",
    defined_component_id: null,
    code: "CMP-3",
    name: "Hand-made",
  }),
];
const contributions = [
  record<"component_contributions">({
    id: "c1",
    system_component_id: "cmp-child",
    library_implementation_id: "impl-a",
    description: "Library text A",
    implementation_status: "implemented",
  }),
  record<"component_contributions">({
    id: "c2",
    system_component_id: "cmp-child",
    library_implementation_id: "impl-b",
    description: "Local text B",
    implementation_status: "implemented",
  }),
  record<"component_contributions">({
    id: "c3",
    system_component_id: "cmp-leaf",
    library_implementation_id: "impl-a",
    description: "Library text A",
    implementation_status: "planned",
  }),
];
const rows = [
  element("root", {
    baselineTitle: "NIST Low",
    controlCount: 100,
    effectiveBaseline: record<"system_effective_baselines">({
      profile_resolution_id: "res",
      inherited: false,
      source_label: "Explicit system adoption",
    }),
  }),
  element("child", {
    baselineTitle: "NIST Low",
    controlCount: 100,
    effectiveBaseline: record<"system_effective_baselines">({
      profile_resolution_id: "res",
      inherited: true,
      source_label: "Inherited system adoption",
    }),
    inheritedFrom: element("root"),
  }),
  element("leaf", { parent_system_id: "child" }),
];

describe("library uses", () => {
  it("lists the baseline and each applied definition with its facts and flags", () => {
    const uses = libraryUses({
      element: rows[1]!,
      rows,
      components,
      definedComponents,
      revisions,
      definitions,
      contributions,
      implementations,
    });
    expect(uses.map((use) => use.id)).toEqual(["baseline:child", "cmp-child"]);
    expect(uses[0]).toMatchObject({
      kind: "Baseline",
      name: "NIST Low",
      source: "Inherited from ROOT",
      inherited: true,
    });
    expect(uses[1]).toMatchObject({
      kind: "Component definition",
      name: "Corporate audit policy",
      detail: "Audit policy",
      category: "organizational_baseline",
      version: "1",
      appliedAt: "2026-09-15T10:00:00Z",
      rationale: "Operated from Sierra Vista.",
      contributions: 2,
      changedHere: 1,
      updateAvailable: { revisionId: "v2", version: 2 },
    });
  });
  it("includes everything inside on request, falling back to the record's own stamps", () => {
    const uses = libraryUses({
      element: rows[1]!,
      rows,
      components,
      definedComponents,
      revisions,
      definitions,
      contributions,
      implementations,
      includeInside: true,
    });
    expect(uses.map((use) => use.id)).toEqual(["baseline:child", "cmp-child", "cmp-leaf"]);
    expect(uses[2]).toMatchObject({
      elementCode: "LEAF",
      appliedAt: "2026-09-15T09:30:00Z",
      changedHere: 1,
    });
  });
  it("ignores draft revisions when looking for an update", () => {
    expect(newerRevision(revisions[1], revisions)).toBeNull();
    expect(newerRevision(revisions[0], revisions)).toEqual({ revisionId: "v2", version: 2 });
  });
  it("rolls the program up to one row per definition and version", () => {
    const rollup = libraryRollup({
      rows,
      components,
      definedComponents,
      revisions,
      definitions,
      contributions,
      implementations,
    });
    expect(rollup).toHaveLength(1);
    expect(rollup[0]).toMatchObject({
      name: "Corporate audit policy",
      version: 1,
      changedHere: 1,
      updateAvailable: { version: 2 },
    });
    expect(rollup[0]!.elements.map((item) => item.code)).toEqual(["CHILD", "LEAF"]);
  });
});
