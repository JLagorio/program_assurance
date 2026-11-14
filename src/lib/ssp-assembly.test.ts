import { describe, expect, it } from "vitest";
import type { Row, TableName } from "./models";
import { args, fakeClient, uuid } from "./testing/fake-client";

const { assembleSsp, assembleSspControl, readSspControlDetail, readSspControlRows } =
  await import("./ssp-assembly");
type SspAssemblyInput = import("./ssp-assembly").SspAssemblyInput;

const record = <T extends TableName>(value: Partial<Row<T>>) => value as Row<T>;
function fixture(): SspAssemblyInput {
  return {
    plan: record<"ssp_revisions">({
      id: "ssp",
      system_id: "root",
      profile_resolution_id: "baseline",
    }),
    systems: [
      record<"systems">({
        id: "root",
        name: "Boundary",
        boundary_system_id: "root",
        parent_system_id: null,
      }),
      record<"systems">({
        id: "child",
        name: "Child",
        boundary_system_id: "root",
        parent_system_id: "root",
      }),
      record<"systems">({ id: "other", name: "Other boundary", boundary_system_id: "other" }),
    ],
    selections: [
      record<"selected_controls">({
        id: "selected",
        control_id: "control",
        profile_resolution_id: "baseline",
        ordinal: 0,
      }),
      record<"selected_controls">({
        id: "missing",
        control_id: "second",
        profile_resolution_id: "baseline",
        ordinal: 1,
      }),
      record<"selected_controls">({
        id: "child-selected",
        control_id: "control",
        profile_resolution_id: "child-baseline",
        ordinal: 0,
      }),
      record<"selected_controls">({
        id: "child-extra",
        control_id: "third",
        profile_resolution_id: "child-baseline",
        ordinal: 1,
      }),
    ],
    controls: [
      record<"controls">({ id: "control", code: "AC-1", title: "Access control" }),
      record<"controls">({ id: "second", code: "AC-2", title: "Accounts" }),
      record<"controls">({ id: "third", code: "AC-3", title: "Enforcement" }),
    ],
    implementations: [
      record<"implemented_requirements">({
        id: "implementation",
        ssp_revision_id: "ssp",
        selected_control_id: "selected",
        description: "Actual control narrative",
        implementation_status: "partial",
      }),
    ],
    requirements: [record<"engineering_requirements">({ id: "requirement", code: "REQ-1" })],
    contents: [
      record<"requirement_revisions">({
        id: "content",
        engineering_requirement_id: "requirement",
        statement: "Authored requirement",
      }),
    ],
    allocations: [
      record<"requirement_allocations">({ requirement_revision_id: "content", system_id: "child" }),
    ],
    effectiveBaselines: [
      record<"system_effective_baselines">({
        id: "child",
        system_id: "child",
        boundary_system_id: "root",
        profile_resolution_id: "child-baseline",
      }),
    ],
    parts: [],
    statements: [],
    contributions: [],
    components: [],
    componentElements: [],
    requirementLinks: [],
    controlMappings: [],
    requirementEvidence: [],
    implementationEvidence: [],
    artifacts: [],
    versions: [],
    acceptances: [],
    offerings: [],
    offeredContributions: [],
  };
}

describe("SSP assembly", () => {
  it("keeps every exact SSP selection without manufacturing implementations for missing controls", () => {
    const rows = assembleSsp(fixture());
    expect(rows.map((row) => row.code)).toEqual(["AC-1", "AC-2"]);
    expect(rows[0]?.status).toBe("partial");
    expect(rows[1]).toMatchObject({
      implementation: undefined,
      status: "unrecorded",
      narrative: "Not recorded",
      requirementCount: 0,
      evidenceCount: 0,
    });
    expect(rows[1]?.gaps).toContain("No implementation record");
  });

  it("retains child-baseline mappings and distinguishes subsequent stale baseline context", () => {
    const input = fixture();
    input.controlMappings.push(
      record<"requirement_control_links">({
        id: "mapping",
        requirement_revision_id: "content",
        control_id: "control",
        system_id: "child",
        selected_control_id: "child-selected",
        control_part_id: null,
      }),
    );
    let support = assembleSsp(input)[0]?.requirements[0];
    expect(support?.explicit).toBe(false);
    expect(support?.descriptions.join()).toContain("Child or separate system baseline");
    input.effectiveBaselines[0]!.profile_resolution_id = "new-child-baseline";
    support = assembleSsp(input)[0]?.requirements[0];
    expect(support?.descriptions.join()).toContain("Earlier system baseline; review mapping");
  });

  it("leaves a child's additions out of the SSP's own selection", () => {
    // What the child's baseline adds is said by the register's read (ssp_control_rows' gaps).
    expect(assembleSsp(fixture()).map((row) => row.code)).not.toContain("AC-3");
  });

  it("requires a boundary allocation for unscoped catalog mappings and validates statement ancestry", () => {
    const input = fixture();
    input.parts.push(
      record<"control_parts">({
        id: "item",
        control_id: "control",
        name: "item",
        prose: "An assessment item",
        parent_part_id: "guidance",
      }),
      record<"control_parts">({
        id: "guidance",
        control_id: "control",
        name: "guidance",
        prose: "Guidance",
        parent_part_id: null,
      }),
    );
    input.controlMappings.push(
      record<"requirement_control_links">({
        id: "mapping",
        requirement_revision_id: "content",
        control_id: "control",
        control_part_id: "item",
        system_id: null,
        selected_control_id: null,
      }),
    );
    expect(assembleSsp(input)[0]?.requirements[0]?.descriptions).toContain(
      "Control reference needs review",
    );
    input.allocations[0]!.system_id = "other";
    expect(assembleSsp(input)[0]?.requirements).toHaveLength(0);
  });

  it("names, by label, the objectives a requirement's mappings name", () => {
    const input = fixture();
    const objective = (id: string, label: string) =>
      record<"control_parts">({
        id,
        control_id: "control",
        name: "assessment-objective",
        prose: `What ${label} asks`,
        parent_part_id: null,
        props: [{ name: "label", class: "sp800-53a", value: label }],
      });
    input.parts.push(
      objective("objective-10", "AC-01a.10"),
      objective("objective-2", "AC-01a.02"),
      objective("objective-1", "AC-01a.01"),
    );
    const mapping = (id: string, part: string, system: string | null, rationale: string) =>
      record<"requirement_control_links">({
        id,
        requirement_revision_id: "content",
        control_id: "control",
        control_part_id: part,
        system_id: system,
        selected_control_id: system ? "selected" : null,
        rationale,
      });
    // Two objectives on the boundary and on its element: each named once, in the catalog's order.
    input.controlMappings.push(
      mapping("m1", "objective-10", "root", "Meets the tenth"),
      mapping("m2", "objective-2", "child", "Meets the second"),
      mapping("m3", "objective-10", "child", "Meets the tenth"),
    );
    input.effectiveBaselines.push(
      record<"system_effective_baselines">({
        id: "root",
        system_id: "root",
        boundary_system_id: "root",
        profile_resolution_id: "baseline",
      }),
    );
    input.effectiveBaselines[0]!.profile_resolution_id = "baseline";
    let support = assembleSsp(input)[0]?.requirements[0];
    expect(support?.descriptions).toEqual([
      "Mapped to objectives AC-01a.02 and AC-01a.10; no implementation claim implied",
    ]);
    expect(support?.rationale).toEqual(["Meets the tenth", "Meets the second"]);
    // One objective, beside a mapping of the whole control: each said as it is.
    input.controlMappings.splice(0, 3, mapping("m4", "objective-1", null, "Meets the first"));
    input.controlMappings.push(
      record<"requirement_control_links">({
        id: "whole",
        requirement_revision_id: "content",
        control_id: "control",
        control_part_id: null,
        system_id: null,
        selected_control_id: null,
      }),
    );
    support = assembleSsp(input)[0]?.requirements[0];
    expect(support?.descriptions).toEqual([
      "Mapped to control; no implementation claim implied",
      "Mapped to objective AC-01a.01; no implementation claim implied",
    ]);
    expect(support?.descriptions).not.toContain("Control reference needs review");
    expect(assembleSsp(input)[0]?.requirementCount).toBe(1);
  });

  it("deduplicates an exact evidence version while preserving direct and requirement claims", () => {
    const input = fixture();
    input.requirementLinks.push(
      record<"requirement_implementations">({
        id: "requirement-link",
        requirement_revision_id: "content",
        implemented_requirement_id: "implementation",
        component_contribution_id: null,
      }),
    );
    input.artifacts.push(
      record<"evidence_artifacts">({ id: "artifact", title: "Actual artifact" }),
    );
    input.versions.push(
      record<"evidence_versions">({
        id: "v1",
        artifact_id: "artifact",
        version_number: 1,
        state: "published",
      }),
      record<"evidence_versions">({
        id: "v2",
        artifact_id: "artifact",
        version_number: 2,
        state: "published",
      }),
    );
    input.requirementEvidence.push(
      record<"requirement_evidence">({
        id: "req-evidence",
        requirement_revision_id: "content",
        evidence_version_id: "v1",
        claim: "Requirement support",
      }),
    );
    input.implementationEvidence.push(
      record<"implementation_evidence">({
        id: "control-evidence",
        implemented_requirement_id: "implementation",
        implementation_statement_id: null,
        component_contribution_id: null,
        evidence_version_id: "v1",
        claim: "Control support",
      }),
    );
    const row = assembleSsp(input)[0]!;
    expect(row.evidenceCount).toBe(1);
    expect(row.evidence[0]?.version?.version_number).toBe(1);
    expect(row.evidence[0]?.origins.map((origin) => origin.claim)).toEqual([
      "Control support",
      "Requirement support",
    ]);
    expect(row.requirements[0]?.explicit).toBe(true);
  });

  it("keeps unresolved component identities visible without substituting the boundary", () => {
    const input = fixture();
    input.components.push(
      record<"system_components">({ id: "component", name: "Unbound component" }),
    );
    input.componentElements.push(
      record<"system_component_element_links">({
        id: "component",
        system_element_id: null,
        link_source: "ambiguous",
        inventory_element_count: 2,
      }),
    );
    input.contributions.push(
      record<"component_contributions">({
        id: "contribution",
        implemented_requirement_id: "implementation",
        system_component_id: "component",
        description: "Actual contribution",
      }),
    );
    const row = assembleSsp(input)[0]!;
    expect(row.contributions[0]).toMatchObject({
      element: undefined,
      binding: "ambiguous",
      path: "System element unresolved",
    });
    expect(row.gaps).toContain("Contributing system needs review");
  });
});

const context = { tenantId: uuid(900), token: "token" };

/** A detail answer as ssp_control_detail sends it: one control's records and nothing more. */
function detailAnswer() {
  const selection = {
    id: uuid(1),
    control_id: uuid(2),
    profile_resolution_id: uuid(3),
    ordinal: 0,
  };
  return {
    ssp_revision_id: uuid(10),
    selection,
    control: { id: uuid(2), code: "AC-2", title: "Account Management" },
    implementation: {
      id: uuid(20),
      tenant_id: uuid(900),
      ssp_revision_id: uuid(10),
      selected_control_id: uuid(1),
      implementation_status: "implemented",
      description: "Accounts are reviewed every quarter.",
      not_applicable_rationale: null,
      responsible_party_id: null,
      revision: 3,
    },
    statements: [],
    contributions: [
      {
        id: uuid(30),
        tenant_id: uuid(900),
        ssp_revision_id: uuid(10),
        implemented_requirement_id: uuid(20),
        implementation_statement_id: null,
        system_component_id: uuid(40),
        description: "The directory enforces it.",
        implementation_status: "implemented",
        responsible_party_id: null,
        library_implementation_id: null,
        revision: 1,
      },
    ],
    offered_contributions: [],
    components: [{ id: uuid(40), name: "Directory" }],
    component_elements: [{ id: uuid(40), system_element_id: uuid(51), link_source: "explicit" }],
    parts: [],
    requirement_links: [
      {
        id: uuid(60),
        requirement_revision_id: uuid(70),
        implemented_requirement_id: null,
        component_contribution_id: uuid(30),
        rationale: "The directory meets it.",
      },
    ],
    control_mappings: [
      // Inside the boundary, on its element.
      {
        id: uuid(61),
        requirement_revision_id: uuid(71),
        control_id: uuid(2),
        control_part_id: null,
        system_id: uuid(51),
        selected_control_id: uuid(1),
        rationale: null,
      },
      // On a system of another boundary: not behind this SSP's control.
      {
        id: uuid(62),
        requirement_revision_id: uuid(72),
        control_id: uuid(2),
        control_part_id: null,
        system_id: uuid(99),
        selected_control_id: uuid(5),
        rationale: null,
      },
    ],
    allocations: [],
    revisions: [70, 71, 72].map((n) => ({
      id: uuid(n),
      engineering_requirement_id: uuid(n + 10),
      title: `Requirement ${n}`,
      statement: "Shall.",
      acceptance_criteria: "Shown.",
      state: "published",
    })),
    requirements: [70, 71, 72].map((n) => ({
      id: uuid(n + 10),
      code: `REQ-${n}`,
      program_id: uuid(100),
    })),
    implementation_evidence: [],
    requirement_evidence: [
      {
        id: uuid(90),
        requirement_revision_id: uuid(71),
        evidence_version_id: uuid(91),
        claim: "Quarterly review record",
        applicability_rationale: null,
      },
    ],
    versions: [
      {
        id: uuid(91),
        artifact_id: uuid(92),
        version_number: 2,
        state: "published",
        collected_at: null,
        published_at: null,
        expires_at: null,
        external_uri: null,
        media_type: null,
        byte_size: null,
        sha256: null,
        provenance: null,
        storage_object_name: null,
        storage_object_id: null,
      },
    ],
    artifacts: [
      {
        id: uuid(92),
        title: "Account review",
        description: null,
        artifact_kind: "record",
        owner_party_id: null,
      },
    ],
    acceptances: [],
    offerings: [],
    source_selections: [
      // The plan's own selection, and the plan's selection of another control that a mapping on
      // the same baseline recorded: neither makes another row.
      selection,
      { id: uuid(5), control_id: uuid(6), profile_resolution_id: uuid(3), ordinal: 1 },
    ],
    effective_baselines: [{ system_id: uuid(51), profile_resolution_id: uuid(3) }],
  };
}

describe("the SSP assembly's reads", () => {
  it("reads one SSP revision's register in one request", async () => {
    const { client, calls } = fakeClient(() => ({
      data: {
        ssp_revision_id: uuid(10),
        rows: [
          {
            id: uuid(1),
            control_id: uuid(2),
            code: "AC-2",
            title: "Account Management",
            implementation_id: uuid(20),
            implementation_status: "implemented",
            narrative: true,
            contributions: 1,
            requirements: 2,
            evidence: 1,
          },
          {
            id: uuid(5),
            control_id: uuid(6),
            code: null,
            title: null,
            implementation_id: null,
            implementation_status: null,
            narrative: false,
            contributions: 0,
            requirements: 0,
            evidence: 0,
          },
        ],
        requirements: 2,
        evidence: 1,
        boundary_differs: true,
        gaps: [{ system_id: uuid(51), name: "Element", codes: ["AC-3"] }],
        baseline_title: "High baseline",
        imported_demo: false,
      },
      error: null,
    }));
    const answer = await readSspControlRows(client, context, uuid(10));
    expect(calls[0]?.table).toBe("rpc:ssp_control_rows");
    expect(args(calls[0], "rpc")).toEqual([[{ p_ssp_revision_id: uuid(10) }]]);
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
    expect(answer.rows.map((row) => [row.code, row.implementationId, row.requirements])).toEqual([
      ["AC-2", uuid(20), 2],
      [null, null, 0],
    ]);
    expect(answer).toMatchObject({
      requirements: 2,
      evidence: 1,
      boundaryDiffers: true,
      gaps: [{ systemId: uuid(51), name: "Element", codes: ["AC-3"] }],
      baselineTitle: "High baseline",
      importedDemo: false,
    });
  });

  it("says a refusal, and refuses an answer it cannot read", async () => {
    const refused = fakeClient(() => ({
      data: null,
      error: { message: "SSP access is required" },
    }));
    await expect(readSspControlRows(refused.client, context, uuid(10))).rejects.toThrow(
      "SSP access is required",
    );
    const malformed = fakeClient(() => ({ data: { rows: "none" }, error: null }));
    await expect(readSspControlRows(malformed.client, context, uuid(10))).rejects.toThrow();
  });

  it("reads one control's records as its preview opens, and assembles them by the register's rules", async () => {
    const { client, calls } = fakeClient(() => ({ data: detailAnswer(), error: null }));
    const detail = await readSspControlDetail(client, context, uuid(10), uuid(1));
    expect(calls[0]?.table).toBe("rpc:ssp_control_detail");
    expect(args(calls[0], "rpc")).toEqual([
      [{ p_ssp_revision_id: uuid(10), p_selected_control_id: uuid(1) }],
    ]);
    // The records the preview edits keep every column the server sent: the form starts from them,
    // and offers an edit only of a record of the reader's workspace.
    expect(detail.implementations[0]).toMatchObject({
      id: uuid(20),
      revision: 3,
      tenant_id: uuid(900),
    });
    expect(detail.contributions[0]).toMatchObject({ library_implementation_id: null, revision: 1 });
    const control = assembleSspControl(detail, {
      plan: { id: uuid(10), system_id: uuid(50), profile_resolution_id: uuid(3) },
      systems: [
        { id: uuid(50), name: "Boundary", boundary_system_id: uuid(50), parent_system_id: null },
        { id: uuid(51), name: "Element", boundary_system_id: uuid(50), parent_system_id: uuid(50) },
        { id: uuid(99), name: "Elsewhere", boundary_system_id: uuid(99), parent_system_id: null },
      ],
    });
    expect(control?.id).toBe(uuid(1));
    expect(control?.code).toBe("AC-2");
    // The contribution's requirement and the boundary's mapping; not the other boundary's.
    expect(control?.requirements.map((row) => [row.requirement.code, row.explicit])).toEqual([
      ["REQ-70", true],
      ["REQ-71", false],
    ]);
    expect(control?.requirements[0]?.descriptions).toEqual(["Linked to Directory"]);
    expect(control?.evidence.map((row) => [row.artifact?.title, row.origins[0]?.label])).toEqual([
      ["Account review", "REQ-71 · mapped requirement"],
    ]);
    expect(control?.contributions[0]?.path).toBe("Boundary / Element");
    expect(control?.gaps).toEqual([]);
    expect([control?.requirementCount, control?.evidenceCount, control?.contributionCount]).toEqual(
      [2, 1, 1],
    );
  });

  it("refuses a detail it cannot read", async () => {
    const answer = { ...detailAnswer(), versions: [{ id: uuid(91) }] };
    const { client } = fakeClient(() => ({ data: answer, error: null }));
    await expect(readSspControlDetail(client, context, uuid(10), uuid(1))).rejects.toThrow();
  });
});
