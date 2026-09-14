import { describe, expect, it } from "vitest";
import type { Row, TableName } from "./models";
import { assembleSsp, sspSelectionGaps, type SspAssemblyInput } from "./ssp-assembly";

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

  it("shows child additions outside the plan without merging them into the SSP selection", () => {
    const input = fixture();
    expect(
      sspSelectionGaps(input).map((gap) => [
        gap.system.id,
        gap.controls.map((control) => control.code),
      ]),
    ).toEqual([["child", ["AC-3"]]]);
    expect(assembleSsp(input).map((row) => row.code)).not.toContain("AC-3");
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
