/** The library apply, adopt, evidence-use and update commands, only in a disposable local workspace. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("library-reuse");
const { client, tenantId } = workspace;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
const update = (table, record, values) =>
  data(
    client
      .from(table)
      .update({ ...values, revision: record.revision + 1 })
      .eq("id", record.id)
      .eq("revision", record.revision)
      .select()
      .single(),
  );
const row = (table, id) => data(client.from(table).select().eq("id", id).single());
const rows = (table, filters = {}) => {
  let query = client.from(table).select().eq("tenant_id", tenantId);
  for (const [field, value] of Object.entries(filters)) query = query.eq(field, value);
  return data(query.order("id"));
};
async function rpc(name, args) {
  const result = await client.rpc(name, args);
  return result;
}
async function expectError(promise, pattern) {
  const result = await promise;
  assert.ok(result.error, `Expected an error matching ${pattern}`);
  assert.match(result.error.message, pattern);
}

try {
  const profile = await data(
    client
      .from("profile_revisions")
      .select()
      .eq("state", "published")
      .ilike("title", "%Low%")
      .limit(1)
      .single(),
  );
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select()
      .eq("profile_revision_id", profile.id)
      .eq("state", "published")
      .single(),
  );
  const selected = await data(
    client.from("selected_controls").select().eq("profile_resolution_id", resolution.id),
  );
  assert.ok(selected.length > 3);
  const selectedIds = new Set(selected.map((item) => item.control_id));
  const inBaseline = await data(
    client
      .from("controls")
      .select()
      .in("id", [selected[0].control_id, selected[1].control_id, selected[2].control_id]),
  );
  const catalogId = inBaseline[0].catalog_revision_id;
  const candidates = await data(
    client.from("controls").select().eq("catalog_revision_id", catalogId).limit(400),
  );
  const outside = candidates.find((control) => !selectedIds.has(control.id));
  assert.ok(outside, "A catalog control outside the Low baseline exists");
  const [controlA, controlB, controlC] = inBaseline;

  const program = await insert("programs", { code: "LIBRARY", name: "Library reuse validation" });
  const root = await insert("systems", {
    program_id: program.id,
    code: "SYS-ROOT",
    name: "Recorded boundary",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: root.id,
    is_authorization_boundary: false,
    code: "SYS-CHILD",
    name: "Ground segment",
    system_type: "subsystem",
  });
  const grandchild = await insert("systems", {
    program_id: program.id,
    parent_system_id: child.id,
    is_authorization_boundary: false,
    code: "SYS-LEAF",
    name: "Mission computer",
    system_type: "hardware",
  });
  const ssp = await insert("ssp_revisions", {
    system_id: root.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  assert.equal(ssp.state, "draft");

  // A library source: an organizational baseline with one policy component and three claims.
  const definition = await insert("component_definitions", {
    code: "corp-audit",
    name: "Corporate audit policy",
    category: "organizational_baseline",
  });
  const v1 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 1,
    conditions: "Applies to systems operated from the Sierra Vista site.",
    consumer_responsibilities: "Name the local audit reviewer.",
  });
  const policy = await insert("defined_components", {
    component_definition_revision_id: v1.id,
    name: "Audit policy",
    component_type: "policy",
    description: "The corporate audit and accountability policy.",
  });
  const claimA = await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: controlA.id,
    description: "The corporate policy assigns audit responsibilities.",
    implementation_status: "implemented",
    coverage: "partial",
    consumer_responsibility: "Record the local reviewer.",
  });
  const claimB = await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: controlB.id,
    description: "Audit events are defined by the corporate event list.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: outside.id,
    description: "A claim on a control the program's baseline does not select.",
    implementation_status: "planned",
  });
  const artifact = await insert("evidence_artifacts", {
    title: "Corporate audit policy, signed",
    artifact_kind: "document",
  });
  const artifactVersion = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.test/policies/audit-v3.pdf",
  });
  await insert("defined_component_evidence", {
    component_definition_revision_id: v1.id,
    implementation_id: claimA.id,
    evidence_version_id: artifactVersion.id,
    claim: "The signed policy.",
  });
  const publishedV1 = await update("component_definition_revisions", v1, { state: "published" });
  assert.equal(publishedV1.state, "published");

  // Generic writes cannot fake an application.
  await expectError(
    client.from("system_components").insert({
      tenant_id: tenantId,
      system_id: root.id,
      defined_component_id: policy.id,
      code: "FAKE",
      name: "Fake",
      component_type: "policy",
    }),
    /Add from library/,
  );

  // Apply to the child element.
  const childRow = await row("systems", child.id);
  const requestId = randomUUID();
  const selection = {
    sourceRevisionId: v1.id,
    definedComponentId: policy.id,
    targets: [
      {
        systemId: child.id,
        expectedRevision: childRow.revision,
        code: "CMP-AUDIT-CHILD",
        name: "Audit policy",
      },
    ],
    controlIds: null,
    excluded: [],
    includeDescendants: false,
    rationale: "The ground segment is operated from Sierra Vista.",
  };
  const applied = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: requestId,
    p_selection: selection,
  });
  assert.ifError(applied.error);
  const target = applied.data.targets[0];
  assert.equal(target.state, "accepted");
  assert.equal(target.accepted, 2, "Two claims are in the boundary's SSP selection");
  assert.equal(target.notInBaseline, 1, "The claim outside the baseline is recorded, not seeded");
  const component = await row("system_components", target.systemComponentId);
  assert.equal(component.defined_component_id, policy.id);
  assert.equal(component.system_element_id, child.id);
  assert.equal(component.system_id, root.id);
  assert.equal(component.version, "1");
  assert.equal(component.applied_rationale, selection.rationale);
  assert.ok(component.applied_at);
  assert.equal(component.assignment_id, applied.data.assignmentId);
  const contributions = await rows("component_contributions", {
    system_component_id: component.id,
  });
  assert.equal(contributions.length, 2);
  assert.deepEqual(
    contributions.map((item) => item.library_implementation_id).sort(),
    [claimA.id, claimB.id].sort(),
  );
  const targets = await rows("library_assignment_targets", {
    assignment_id: applied.data.assignmentId,
  });
  assert.deepEqual(targets.map((item) => item.state).sort(), [
    "accepted",
    "accepted",
    "not_in_baseline",
  ]);
  const uses = await rows("evidence_uses", { program_id: program.id });
  assert.equal(uses.length, 1);
  assert.equal(uses[0].decision, "pending");
  assert.equal(uses[0].evidence_version_id, artifactVersion.id);

  // The same request reconciles; a stale revision is refused; a second apply is already applied.
  const replay = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: requestId,
    p_selection: selection,
  });
  assert.ifError(replay.error);
  assert.deepEqual(replay.data, applied.data);
  assert.equal((await rows("system_components", { system_id: root.id })).length, 1);
  await expectError(
    rpc("apply_library_source", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_request_id: randomUUID(),
      p_selection: { ...selection, targets: [{ ...selection.targets[0], code: "CMP-AGAIN" }] },
    }),
    /changed; reload/,
  );
  const childAfter = await row("systems", child.id);
  assert.equal(childAfter.revision, childRow.revision + 1);
  const again = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      ...selection,
      targets: [
        { ...selection.targets[0], expectedRevision: childAfter.revision, code: "CMP-AGAIN" },
      ],
    },
  });
  assert.ifError(again.error);
  assert.equal(again.data.targets[0].state, "already_applied");

  // Everything inside: the root and the leaf, with one control excluded on the leaf.
  const rootRow = await row("systems", root.id);
  const leafRow = await row("systems", grandchild.id);
  const wide = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      ...selection,
      includeDescendants: true,
      targets: [
        {
          systemId: root.id,
          expectedRevision: rootRow.revision,
          code: "CMP-AUDIT-ROOT",
          name: "Audit policy",
        },
        {
          systemId: grandchild.id,
          expectedRevision: leafRow.revision,
          code: "CMP-AUDIT-LEAF",
          name: "Audit policy",
        },
      ],
      excluded: [{ systemId: grandchild.id, controlId: controlB.id }],
    },
  });
  assert.ifError(wide.error);
  assert.equal(wide.data.targets[0].accepted, 2);
  assert.equal(wide.data.targets[1].accepted, 1);
  assert.equal(wide.data.targets[1].excluded, 1);
  const rootComponent = await row("system_components", wide.data.targets[0].systemComponentId);
  assert.equal(
    rootComponent.system_element_id,
    null,
    "The boundary's own instance is unbound to a nested element",
  );

  // Deciding an evidence use links the exact version as SSP support.
  const decided = await rpc("decide_evidence_use", {
    p_tenant_id: tenantId,
    p_use_id: uses[0].id,
    p_expected_revision: uses[0].revision,
    p_decision: "accepted",
    p_rationale: "The signed policy applies as published.",
  });
  assert.ifError(decided.error);
  assert.equal(decided.data.decision, "accepted");
  const decidedRow = await row("evidence_uses", uses[0].id);
  assert.equal(decidedRow.rationale, "The signed policy applies as published.");
  const support = await rows("implementation_evidence", {
    evidence_version_id: artifactVersion.id,
  });
  assert.equal(support.length, 1);
  assert.equal(
    support[0].component_contribution_id,
    contributions.find((item) => item.library_implementation_id === claimA.id).id,
  );
  await expectError(
    rpc("decide_evidence_use", {
      p_tenant_id: tenantId,
      p_use_id: uses[0].id,
      p_expected_revision: decided.data.revision,
      p_decision: "not_applicable",
      p_rationale: "Second decision",
    }),
    /already been decided/,
  );

  // A local edit on one contribution, then version 2 of the library: A changes, B stays, C is new.
  const contributionB = contributions.find((item) => item.library_implementation_id === claimB.id);
  await update("component_contributions", contributionB, {
    description:
      "Audit events are defined by the corporate event list, plus the mission event set.",
  });
  const v2 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 2,
  });
  const policyV2 = await insert("defined_components", {
    component_definition_revision_id: v2.id,
    name: "Audit policy",
    component_type: "policy",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v2.id,
    defined_component_id: policyV2.id,
    control_id: controlA.id,
    description: "The corporate policy assigns audit responsibilities and names the reviewer role.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v2.id,
    defined_component_id: policyV2.id,
    control_id: controlB.id,
    description: "Audit events are defined by the corporate event list.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v2.id,
    defined_component_id: policyV2.id,
    control_id: controlC.id,
    description: "Audit records are retained for one year.",
    implementation_status: "implemented",
  });
  await update("component_definition_revisions", v2, { state: "published" });
  const updated = await rpc("update_library_assignment", {
    p_tenant_id: tenantId,
    p_assignment_id: applied.data.assignmentId,
    p_new_revision_id: v2.id,
    p_request_id: randomUUID(),
    p_rationale: "Version 2 names the reviewer role.",
  });
  assert.ifError(updated.error);
  assert.equal(updated.data.repinned, 1);
  assert.equal(updated.data.updated, 1, "The unchanged narrative takes the new text");
  assert.equal(updated.data.keptLocal, 1, "The locally changed narrative is kept");
  assert.equal(updated.data.seeded, 1, "The newly covered control is seeded");
  const repinned = await row("system_components", component.id);
  assert.equal(repinned.defined_component_id, policyV2.id);
  assert.equal(repinned.version, "2");
  assert.equal(repinned.assignment_id, updated.data.assignmentId);
  const oldAssignment = await row("library_assignments", applied.data.assignmentId);
  assert.equal(oldAssignment.state, "superseded");
  assert.equal(oldAssignment.superseded_by_id, updated.data.assignmentId);
  const afterUpdate = await rows("component_contributions", { system_component_id: component.id });
  assert.equal(afterUpdate.length, 3);
  const keptB = afterUpdate.find((item) => item.id === contributionB.id);
  assert.match(keptB.description, /mission event set/);

  // Adopting a reusable requirement by reference, twice: one program requirement.
  const requirementDefinition = await insert("requirement_definitions", {
    code: "RQD-AUDIT-RETAIN",
    title: "Audit record retention",
  });
  const requirementV1 = await insert("requirement_definition_revisions", {
    requirement_definition_id: requirementDefinition.id,
    version_number: 1,
    statement: "The system shall retain audit records for one year.",
    acceptance_criteria: "Records older than one year are present in the archive.",
    requirement_type: "security",
  });
  await update("requirement_definition_revisions", requirementV1, { state: "published" });
  const adopted = await rpc("adopt_requirement_definition", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      definitionRevisionId: requirementV1.id,
      targets: [{ systemId: child.id }],
      rationale: "Retention applies to the ground segment.",
    },
  });
  assert.ifError(adopted.error);
  assert.equal(adopted.data.created, true);
  assert.equal(adopted.data.allocations, 1);
  const requirement = await row("engineering_requirements", adopted.data.requirementId);
  assert.equal(requirement.definition_revision_id, requirementV1.id);
  assert.equal(requirement.code, "RQD-AUDIT-RETAIN");
  const adoptedAgain = await rpc("adopt_requirement_definition", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      definitionRevisionId: requirementV1.id,
      targets: [{ systemId: child.id }, { systemId: grandchild.id }],
      rationale: "Also the mission computer.",
    },
  });
  assert.ifError(adoptedAgain.error);
  assert.equal(adoptedAgain.data.created, false);
  assert.equal(adoptedAgain.data.requirementId, adopted.data.requirementId);
  assert.equal(adoptedAgain.data.allocations, 1, "Only the new element is allocated");
  // Create as a child element: the component becomes an LRU of the tree under the chosen parent.
  const rootForElement = await row("systems", root.id);
  const asElement = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      ...selection,
      targets: [
        {
          systemId: root.id,
          expectedRevision: rootForElement.revision,
          code: "CMP-AUDIT-ELEM",
          name: "Audit policy",
          createElement: { code: "ELEM-AUDIT", name: "Audit policy element" },
        },
      ],
    },
  });
  assert.ifError(asElement.error);
  const elementTarget = asElement.data.targets[0];
  assert.equal(elementTarget.state, "accepted");
  assert.ok(elementTarget.elementId, "The target reports the element it created");
  const element = await row("systems", elementTarget.elementId);
  assert.equal(element.parent_system_id, root.id);
  assert.equal(element.boundary_system_id, root.id);
  assert.equal(element.is_authorization_boundary, false);
  assert.equal(element.system_type, "other", "A policy component becomes an element of type other");
  assert.equal(element.code, "ELEM-AUDIT");
  const elementComponent = await row("system_components", elementTarget.systemComponentId);
  assert.equal(elementComponent.system_element_id, element.id);
  assert.equal(elementComponent.system_id, root.id);
  assert.equal((await row("systems", root.id)).revision, rootForElement.revision + 1);
  const repeat = await rpc("apply_library_source", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_selection: {
      ...selection,
      targets: [
        {
          systemId: root.id,
          expectedRevision: rootForElement.revision + 1,
          code: "CMP-AUDIT-ELEM-2",
          name: "Audit policy",
          createElement: { code: "ELEM-AUDIT-2", name: "Audit policy element" },
        },
      ],
    },
  });
  assert.ifError(repeat.error);
  assert.equal(repeat.data.targets[0].state, "already_applied");
  assert.equal(repeat.data.targets[0].elementId, element.id);
  assert.equal(
    (await rows("systems", { parent_system_id: root.id })).length,
    2,
    "No second element",
  );
  await expectError(
    rpc("apply_library_source", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_request_id: randomUUID(),
      p_selection: {
        ...selection,
        targets: [
          {
            systemId: root.id,
            expectedRevision: rootForElement.revision + 1,
            code: "CMP-TYPE",
            name: "Audit policy",
            createElement: { code: "ELEM-TYPE", name: "Typed element", type: "hardware" },
          },
        ],
      },
    }),
    /type from the component definition/,
  );
  const leafForElement = await row("systems", grandchild.id);
  await expectError(
    rpc("apply_library_source", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_request_id: randomUUID(),
      p_selection: {
        ...selection,
        targets: [
          {
            systemId: grandchild.id,
            expectedRevision: leafForElement.revision,
            code: "CMP-CODE",
            name: "Audit policy",
            createElement: { code: "ELEM-AUDIT", name: "Duplicate code" },
          },
        ],
      },
    }),
    /already used in this boundary/,
  );
  console.log(
    "PASS library reuse: guarded facts, apply with seeding and exclusions, idempotent requests, element CAS, already-applied, evidence use decisions, update review keeping local changes, requirement adoption by reference, components created as elements",
  );
} finally {
  await workspace.cleanup();
}
