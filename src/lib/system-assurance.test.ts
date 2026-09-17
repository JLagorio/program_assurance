import { describe, expect, it } from "vitest";
import type { Row, TableName } from "./models";
import {
  baselineSource,
  buildSystemAssuranceRows,
  type SystemAssuranceInput,
} from "./system-assurance";
import type { SystemElement } from "./system-tree";

const record = <T extends TableName>(value: Partial<Row<T>>) => value as Row<T>;
const element = (id: string, values: Partial<SystemElement> = {}): SystemElement =>
  record<"systems">({
    id,
    code: id,
    name: id,
    tenant_id: "tenant",
    program_id: "program",
    boundary_system_id: "root",
    parent_system_id: id === "root" ? null : "root",
    confidentiality_impact: null,
    integrity_impact: null,
    availability_impact: null,
    ...values,
  });
const scope = (id: string, elementId: string | null, values: Partial<Row<"scopes">> = {}) =>
  record<"scopes">({
    id,
    code: id,
    tenant_id: "tenant",
    system_id: "root",
    composition_node_id: elementId,
    confidentiality_impact: null,
    integrity_impact: null,
    availability_impact: null,
    ...values,
  });
const baseline = (
  systemId: string,
  resolutionId: string | null,
  values: Partial<Row<"system_effective_baselines">> = {},
) =>
  record<"system_effective_baselines">({
    id: systemId,
    system_id: systemId,
    tenant_id: "tenant",
    boundary_system_id: "root",
    profile_resolution_id: resolutionId,
    source_system_id: "root",
    inherited: systemId !== "root",
    ...values,
  });
const selections = (resolutionId: string, controls: string[]) =>
  controls.map((controlId) =>
    record<"selected_controls">({ profile_resolution_id: resolutionId, control_id: controlId }),
  );
const fixture = (values: Partial<SystemAssuranceInput> = {}): SystemAssuranceInput => ({
  systems: [element("root"), element("child"), element("leaf", { parent_system_id: "child" })],
  scopes: [],
  baselines: [],
  selections: [],
  scopeBaselines: [],
  ...values,
});

describe("system assurance projection", () => {
  it("attaches scopes to exact elements, retains root scopes, and does not inherit CIA downward", () => {
    const rows = buildSystemAssuranceRows(
      fixture({
        systems: [
          element("root", { confidentiality_impact: "high" }),
          element("child"),
          element("leaf", { parent_system_id: "child" }),
        ],
        scopes: [
          scope("root-scope", null),
          scope("child-scope", "child", { confidentiality_impact: "moderate" }),
          scope("orphan", "missing"),
          scope("foreign", "child", { tenant_id: "other" }),
        ],
      }),
    );
    expect(rows[0]?.directScopes.map((item) => item.id)).toEqual(["root-scope"]);
    expect(rows[0]?.subtreeScopeCount).toBe(2);
    expect(rows[1]?.directScopes.map((item) => item.id)).toEqual(["child-scope"]);
    expect(rows[1]?.impacts.confidentiality).toMatchObject({ value: "moderate", source: "scope" });
    expect(rows[2]?.impacts.confidentiality).toMatchObject({ value: null, source: "unrecorded" });
  });

  it("preserves recorded CIA, exposes disagreement, and rolls up mixed known child impacts separately", () => {
    const rows = buildSystemAssuranceRows(
      fixture({
        systems: [
          element("root", { availability_impact: "moderate" }),
          element("child", { confidentiality_impact: "low" }),
        ],
        scopes: [
          scope("scope-a", "child", {
            confidentiality_impact: "high",
            integrity_impact: "low",
            availability_impact: "high",
          }),
          scope("scope-b", "child", { integrity_impact: "high", availability_impact: "high" }),
          scope("unknown", "child"),
        ],
      }),
    );
    expect(rows[1]?.impacts.confidentiality).toMatchObject({
      value: "low",
      source: "system",
      conflict: true,
      scopeValues: ["high"],
    });
    expect(rows[1]?.impacts.integrity).toEqual({
      value: null,
      source: "mixed",
      conflict: true,
      scopeValues: ["low", "high"],
    });
    expect(rows[1]?.impacts.availability).toMatchObject({
      value: "high",
      source: "scope",
      conflict: false,
    });
    expect(rows[0]?.impacts.availability).toMatchObject({ value: "moderate", source: "system" });
    expect(rows[0]?.childImpacts).toEqual({
      confidentiality: "high",
      integrity: "high",
      availability: "high",
    });
  });

  it("deduplicates subtree controls, preserves child overrides, and excludes independent boundaries", () => {
    const rows = buildSystemAssuranceRows(
      fixture({
        systems: [
          element("root"),
          element("child"),
          element("leaf", { parent_system_id: "child" }),
          element("separate", { boundary_system_id: "separate", is_authorization_boundary: true }),
          element("separate-child", {
            boundary_system_id: "separate",
            parent_system_id: "separate",
          }),
        ],
        scopes: [
          scope("child-scope", "child", { confidentiality_impact: "moderate" }),
          scope("separate-scope", null, { system_id: "separate", confidentiality_impact: "high" }),
        ],
        baselines: [
          baseline("root", "base"),
          baseline("child", "tailored", { inherited: false, source_system_id: "child" }),
          baseline("leaf", "tailored", { source_system_id: "child" }),
          baseline("separate", "other", { boundary_system_id: "separate" }),
        ],
        selections: [
          ...selections("base", ["a", "b", "a"]),
          ...selections("tailored", ["b", "c"]),
          ...selections("other", ["outside"]),
        ],
      }),
    );
    expect(rows[0]).toMatchObject({
      controlIds: ["a", "b"],
      controlCount: 2,
      subtreeControlCount: 3,
      additionalChildControlCount: 1,
      unresolvedDescendantCount: 0,
      subtreeScopeCount: 1,
    });
    expect(rows[0]?.childImpacts.confidentiality).toBe("moderate");
    expect(rows[1]?.controlIds).toEqual(["b", "c"]);
    expect(rows[1]?.inheritedFrom).toBeUndefined();
    expect(rows[2]?.inheritedFrom?.id).toBe("child");
    expect(rows[3]?.unresolvedDescendantCount).toBe(1);
  });

  it("distinguishes unresolved baselines from a recorded empty selection and known partial rollups", () => {
    const input = fixture({ baselines: [baseline("root", null), baseline("leaf", "empty")] });
    const rows = buildSystemAssuranceRows(input);
    expect(rows[0]).toMatchObject({
      controlCount: null,
      subtreeControlCount: 0,
      unresolvedDescendantCount: 1,
    });
    expect(rows[1]).toMatchObject({ controlCount: null, subtreeControlCount: 0 });
    expect(rows[2]).toMatchObject({ controlCount: 0, subtreeControlCount: 0 });
    expect(buildSystemAssuranceRows(fixture())[0]?.subtreeControlCount).toBeNull();
  });

  it("keeps latest scope adoption separate from system inheritance and refuses ambiguous timestamp ties", () => {
    const adoption = (id: string, profileId: string, time: string) =>
      record<"scope_baselines">({
        id,
        tenant_id: "tenant",
        scope_id: "scope",
        profile_resolution_id: profileId,
        adopted_at: time,
      });
    const input = fixture({
      scopes: [scope("scope", "child")],
      baselines: [baseline("child", "base")],
      selections: [...selections("base", ["a", "b"]), ...selections("scope-only", ["c"])],
      scopeBaselines: [
        adoption("old", "base", "2026-01-01T00:00:00Z"),
        adoption("latest", "scope-only", "2026-02-01T00:00:00Z"),
      ],
    });
    let child = buildSystemAssuranceRows(input)[1]!;
    expect(child.controlIds).toEqual(["a", "b"]);
    expect(child.scopeSelections[0]).toMatchObject({
      profileResolutionId: "scope-only",
      controlCount: 1,
      differs: true,
      conflicting: false,
    });
    input.scopeBaselines.push(adoption("tie", "base", "2026-01-31T16:00:00-08:00"));
    child = buildSystemAssuranceRows(input)[1]!;
    expect(child.scopeSelections[0]).toMatchObject({
      profileResolutionId: null,
      controlCount: null,
      differs: false,
      conflicting: true,
    });
    expect(child.controlCount).toBe(2);
  });

  it("accepts duplicate latest adoptions of one resolution and handles cyclic containment without fabricated rollups", () => {
    const input = fixture({
      systems: [element("root", { parent_system_id: "child" }), element("child")],
      scopes: [scope("scope", "child", { confidentiality_impact: "high" })],
      scopeBaselines: ["a", "b"].map((id) =>
        record<"scope_baselines">({
          id,
          tenant_id: "tenant",
          scope_id: "scope",
          profile_resolution_id: "base",
          adopted_at: "2026-02-01T00:00:00Z",
        }),
      ),
    });
    const rows = buildSystemAssuranceRows(input);
    expect(rows[1]?.scopeSelections[0]).toMatchObject({
      profileResolutionId: "base",
      controlCount: 0,
      conflicting: false,
    });
    expect(rows[0]?.subtreeScopeCount).toBe(0);
    expect(rows[0]?.childImpacts.confidentiality).toBeNull();
    expect(input.systems[0]).not.toHaveProperty("impacts");
  });

  it("counts exact allocations per element, unions them over the subtree, and names the effective profile", () => {
    const allocation = (id: string, systemId: string | null, revisionId: string) =>
      record<"requirement_allocations">({
        id,
        tenant_id: "tenant",
        system_id: systemId,
        requirement_revision_id: revisionId,
      });
    const rows = buildSystemAssuranceRows(
      fixture({
        baselines: [
          baseline("root", "resolution", {
            inherited: false,
            source_label: "Explicit system adoption",
          }),
          baseline("child", "resolution", { source_label: "Inherited system adoption" }),
          baseline("leaf", "resolution", { source_label: "Inherited system adoption" }),
        ],
        selections: selections("resolution", ["ac-1"]),
        allocations: [
          allocation("a", "root", "req-1"),
          allocation("b", "child", "req-2"),
          allocation("c", "child", "req-2"),
          allocation("d", "leaf", "req-2"),
          allocation("e", "leaf", "req-3"),
          allocation("f", null, "req-4"),
          allocation("g", "missing", "req-5"),
        ],
        resolutions: [
          record<"profile_resolutions">({
            id: "resolution",
            profile_revision_id: "profile",
            state: "draft",
          }),
        ],
        profiles: [record<"profile_revisions">({ id: "profile", title: "NIST High" })],
      }),
    );
    expect(rows.map((row) => row.requirementCount)).toEqual([1, 1, 2]);
    expect(rows.map((row) => row.subtreeRequirementCount)).toEqual([3, 2, 2]);
    expect(rows[0]?.baselineTitle).toBe("NIST High");
    expect(rows[0]?.baselineDraft).toBe(true);
    expect(baselineSource(rows[0]!)).toBe("Applied here");
    expect(baselineSource(rows[1]!)).toBe("Inherited from root");
    expect(baselineSource({ ...rows[2]!, effectiveBaseline: undefined })).toBe("Not set");
  });
});
