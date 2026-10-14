/** Atomic workbook edits, complete program projections and persisted analysis in disposable tenants. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("assurance-workbook");
const { client, tenantId } = workspace;
let guest;
let joined = false;
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
const row = (table, id) => data(client.from(table).select().eq("id", id).single());
const refuse = async (query, code) => {
  const result = await query;
  assert.ok(result.error, "The request must be refused");
  if (code) assert.equal(result.error.code, code, result.error.message);
};

try {
  const program = await insert("programs", { code: "WORKBOOK", name: "Workbook validation" });
  const otherProgram = await insert("programs", { code: "OTHER", name: "Other program" });
  async function requirement(code, programId = program.id) {
    const identity = await insert("engineering_requirements", { program_id: programId, code });
    const content = await insert("requirement_revisions", {
      engineering_requirement_id: identity.id,
      version_number: 1,
      title: `${code} title`,
      statement: `${code} statement`,
      acceptance_criteria: `${code} criteria`,
      requirement_type: "security",
    });
    return { identity, content };
  }
  const first = await requirement("REQ-1");
  const second = await requirement("REQ-2");
  const outside = await requirement("REQ-OTHER", otherProgram.id);
  const selection = await data(
    client
      .from("selected_controls")
      .select("id,control_id,profile_resolution_id")
      .is("tenant_id", null)
      .order("id")
      .limit(1)
      .single(),
  );
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS-1",
    name: "Validation system",
    system_type: "information_system",
  });
  await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: selection.profile_resolution_id,
    version_number: 1,
  });
  const inheritedSystem = await insert("systems", {
    program_id: program.id,
    code: "SYS-2",
    name: "Inherited validation system",
    system_type: "information_system",
    parent_system_id: system.id,
    is_authorization_boundary: false,
  });
  const allocation = await insert("requirement_allocations", {
    requirement_revision_id: first.content.id,
    system_id: system.id,
    rationale: "Allocated explicitly",
  });
  const legacy = await insert("requirement_control_links", {
    requirement_revision_id: first.content.id,
    control_id: selection.control_id,
    relationship_type: "derived_from",
    rationale: "Catalog reference with no system selected",
  });
  const snapshotArgs = { p_tenant_id: tenantId, p_program_id: program.id, p_row_limit: 10000 };
  let snapshot = await data(client.rpc("read_assurance_workbook", snapshotArgs));
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.requirements.length, 2);
  assert.equal(snapshot.counts.requirements, 2);
  assert.equal(
    snapshot.requirements.find((r) => r.id === first.identity.id).acceptance_criteria,
    "REQ-1 criteria",
  );
  assert.equal(
    snapshot.requirements.find((r) => r.id === first.identity.id).revision,
    first.content.revision,
  );
  assert.equal(snapshot.mappings[0].scope_label, "No explicit system context");
  assert.equal(snapshot.mappings[0].system_id, null);
  assert.equal(snapshot.allocations[0].id, allocation.id);
  assert.ok(
    snapshot.selectedControls.some(
      (r) => r.id === selection.id && r.profile_resolution_id === selection.profile_resolution_id,
    ),
  );
  assert.equal(
    snapshot.systems.find((r) => r.id === inheritedSystem.id).profile_resolution_id,
    selection.profile_resolution_id,
  );
  assert.equal(
    snapshot.selectedControls.filter((r) => r.id === selection.id).length,
    1,
    "An inherited baseline is represented once, with applicability through each system's resolution",
  );
  assert.equal(snapshot.workbook, null);
  await refuse(client.rpc("read_assurance_workbook", { ...snapshotArgs, p_row_limit: 1 }), "54000");

  const batch = {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_requirements: [
      {
        requirementId: first.identity.id,
        contentId: first.content.id,
        expectedRevision: first.content.revision,
        patch: { title: "Edited together", acceptanceCriteria: "Measured criteria" },
      },
    ],
    p_mappings: [
      {
        operation: "update",
        id: legacy.id,
        expectedRevision: legacy.revision,
        patch: { rationale: "Reviewed source" },
      },
    ],
  };
  const applied = await data(client.rpc("apply_assurance_changes", batch));
  assert.equal(applied.requirements[0].contentId, first.content.id);
  assert.equal(applied.requirements[0].revision, first.content.revision + 1);
  assert.equal(applied.mappings[0].before.rationale, legacy.rationale);
  assert.equal(applied.mappings[0].after.rationale, "Reviewed source");
  assert.equal(
    (await row("requirement_allocations", allocation.id)).requirement_revision_id,
    first.content.id,
  );
  const event = await row("activity_events", applied.requirements[0].activityEventId);
  assert.deepEqual(event.changes.title, { before: first.content.title, after: "Edited together" });
  assert.deepEqual(
    await data(client.rpc("apply_assurance_changes", batch)),
    applied,
    "Exact retry returns its original receipt",
  );
  await refuse(
    client.rpc("apply_assurance_changes", {
      ...batch,
      p_requirements: [{ ...batch.p_requirements[0], patch: { title: "Different payload" } }],
    }),
    "PT409",
  );

  // A valid requirement edit followed by a stale mapping rolls back the content, audit and receipt.
  const beforeFailure = await row("requirement_revisions", second.content.id);
  const eventsBefore = await data(
    client.from("activity_events").select("id").eq("tenant_id", tenantId),
  );
  await refuse(
    client.rpc("apply_assurance_changes", {
      ...batch,
      p_request_id: randomUUID(),
      p_requirements: [
        {
          requirementId: second.identity.id,
          contentId: second.content.id,
          expectedRevision: 1,
          patch: { title: "Must roll back" },
        },
      ],
      p_mappings: batch.p_mappings,
    }),
    "PT409",
  );
  assert.deepEqual(await row("requirement_revisions", second.content.id), beforeFailure);
  assert.equal(
    (await data(client.from("activity_events").select("id").eq("tenant_id", tenantId))).length,
    eventsBefore.length,
  );

  const mappingId = randomUUID();
  const createBatch = {
    ...batch,
    p_request_id: randomUUID(),
    p_requirements: [],
    p_mappings: [
      {
        operation: "create",
        id: mappingId,
        contentId: first.content.id,
        controlId: selection.control_id,
        systemId: system.id,
        selectedControlId: selection.id,
        relationshipType: "maps_to",
        rationale: "Explicit allocated scope",
      },
    ],
  };
  const created = await data(client.rpc("apply_assurance_changes", createBatch));
  assert.equal(created.mappings[0].after.system_id, system.id);
  assert.deepEqual(await data(client.rpc("apply_assurance_changes", createBatch)), created);
  await refuse(
    client.rpc("apply_assurance_changes", {
      ...createBatch,
      p_request_id: randomUUID(),
      p_mappings: [
        { ...createBatch.p_mappings[0], id: randomUUID(), contentId: second.content.id },
      ],
    }),
    "23514",
  );
  await refuse(
    client.rpc("apply_assurance_changes", {
      ...createBatch,
      p_request_id: randomUUID(),
      p_mappings: [
        { ...createBatch.p_mappings[0], id: randomUUID(), systemId: null, selectedControlId: null },
      ],
    }),
    "23514",
  );
  await refuse(
    client.rpc("apply_assurance_changes", {
      ...batch,
      p_request_id: randomUUID(),
      p_mappings: [],
      p_requirements: [
        {
          requirementId: outside.identity.id,
          contentId: outside.content.id,
          expectedRevision: 1,
          patch: { title: "Wrong program" },
        },
      ],
    }),
    "23514",
  );
  const deleteBatch = {
    ...createBatch,
    p_request_id: randomUUID(),
    p_mappings: [
      { operation: "delete", id: mappingId, expectedRevision: created.mappings[0].revision },
    ],
  };
  const deleted = await data(client.rpc("apply_assurance_changes", deleteBatch));
  assert.equal(deleted.mappings[0].after, null);
  assert.equal(deleted.mappings[0].before.id, mappingId);
  assert.deepEqual(await data(client.rpc("apply_assurance_changes", deleteBatch)), deleted);

  const save = {
    p_tenant_id: tenantId,
    p_program_id: program.id,
    p_request_id: randomUUID(),
    p_workbook_id: randomUUID(),
    p_expected_revision: 0,
    p_name: "Assurance analysis",
    p_document: {
      schemaVersion: 1,
      sheets: [{ id: "analysis", cells: { A1: { formula: "=1+2" } } }],
      source: { programId: program.id, capturedAt: snapshot.capturedAt },
    },
  };
  const saved = await data(client.rpc("save_assurance_workbook", save));
  assert.equal(saved.revision, 1);
  assert.deepEqual(await data(client.rpc("save_assurance_workbook", save)), saved);
  await refuse(
    client.rpc("save_assurance_workbook", {
      ...save,
      p_request_id: randomUUID(),
      p_name: "Stale save",
    }),
    "PT409",
  );
  const updated = await data(
    client.rpc("save_assurance_workbook", {
      ...save,
      p_request_id: randomUUID(),
      p_expected_revision: 1,
      p_name: "Saved analysis",
    }),
  );
  assert.equal(updated.revision, 2);
  snapshot = await data(client.rpc("read_assurance_workbook", snapshotArgs));
  assert.equal(snapshot.workbook.name, "Saved analysis");
  assert.deepEqual(snapshot.workbook.document, save.p_document);
  assert.equal(
    snapshot.requirements.find((r) => r.id === first.identity.id).title,
    "Edited together",
  );
  await refuse(
    client.from("assurance_workbooks").update({ name: "Bypass", revision: 3 }).eq("id", saved.id),
    "42501",
  );

  guest = await localWorkspace("assurance-workbook-guest");
  const presenceTopic = `assurance-workbook:${tenantId}:${program.id}`;
  assert.equal(
    await data(client.rpc("can_join_assurance_workbook", { p_topic: presenceTopic })),
    true,
  );
  for (const p_topic of [
    `assurance-workbook:${guest.tenantId}:${program.id}`,
    `assurance-workbook:${tenantId}:${randomUUID()}`,
    `${presenceTopic}:unscoped`,
    "assurance-workbook:invalid",
  ])
    assert.equal(await data(client.rpc("can_join_assurance_workbook", { p_topic })), false);
  assert.equal(
    await data(guest.client.rpc("can_join_assurance_workbook", { p_topic: presenceTopic })),
    false,
  );
  await refuse(client.rpc("install_assurance_workbook_presence_policies"), "42501");
  await refuse(guest.client.rpc("read_assurance_workbook", snapshotArgs), "42501");
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: guest.userId, role: "viewer" }),
  );
  joined = true;
  assert.equal(
    await data(guest.client.rpc("can_join_assurance_workbook", { p_topic: presenceTopic })),
    true,
  );
  assert.equal(
    (await data(guest.client.rpc("read_assurance_workbook", snapshotArgs))).complete,
    true,
  );
  await refuse(guest.client.rpc("apply_assurance_changes", createBatch), "42501");
  await refuse(guest.client.rpc("save_assurance_workbook", save), "42501");
  assert.deepEqual(
    await data(guest.client.from("program_sctm_rows").select("id").eq("tenant_id", guest.tenantId)),
    [],
  );
  await guest.client.auth.signOut();
  await refuse(
    guest.client.rpc("can_join_assurance_workbook", { p_topic: presenceTopic }),
    "42501",
  );
  console.log(
    "PASS: complete scoped snapshots, missing-system semantics, atomic mixed edits/audit/rollback, exact retries, mapping allocation guards, stale writes, workbook persistence, private presence authorization and viewer/tenant boundaries.",
  );
} finally {
  if (joined)
    await data(
      client
        .from("tenant_memberships")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", guest.userId),
    );
  if (guest) await guest.cleanup();
  await workspace.cleanup();
}
