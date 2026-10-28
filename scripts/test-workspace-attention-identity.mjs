/** Additive saved-view CAS and recurring allocation-attention identity regression. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";
const workspace = await localWorkspace("attention-identity");
const { client, tenantId } = workspace;
let outsider;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
async function refuse(query, code) {
  const result = await query;
  assert.ok(result.error, "Request must be refused");
  if (code) assert.equal(result.error.code, code, result.error.message);
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
const attention = () =>
  data(
    client.rpc("read_assurance_attention", {
      p_tenant_id: tenantId,
      p_state: "all",
      p_offset: 0,
      p_limit: 100,
    }),
  );
const context = (content, system, db = client) =>
  data(
    db.rpc("assurance_allocation_attention_context", {
      p_tenant_id: tenantId,
      p_requirement_revision_id: content,
      p_system_id: system,
    }),
  );
const save = (id, definition) =>
  client.rpc("save_assurance_view", {
    p_tenant_id: tenantId,
    p_id: id,
    p_scope: "identity",
    p_name: "Identity view",
    p_visibility: "private",
    p_definition: definition,
    p_revision: null,
  });
try {
  const id = randomUUID();
  const definition = { version: 1, kind: "table", question: {} };
  for (const invalid of [
    {},
    { version: 1, kind: "table" },
    { version: 1, kind: "unsupported", question: {} },
    { version: 1, kind: "table", question: [] },
    { ...definition, layout: null },
    { ...definition, version: "1" },
  ])
    await refuse(save(randomUUID(), invalid), "23514");
  const view = await data(save(id, definition));
  assert.deepEqual(
    await data(save(id, definition)),
    view,
    "Valid exact create retry preserves its revision",
  );
  await refuse(
    client.rpc("delete_assurance_view", { p_tenant_id: tenantId, p_id: id, p_revision: null }),
    "PT409",
  );
  assert.equal(
    (await data(client.from("assurance_saved_views").select("id").eq("id", id).single())).id,
    id,
  );
  await data(
    client.rpc("delete_assurance_view", {
      p_tenant_id: tenantId,
      p_id: id,
      p_revision: view.revision,
    }),
  );
  await data(
    client.rpc("delete_assurance_view", {
      p_tenant_id: tenantId,
      p_id: id,
      p_revision: view.revision,
    }),
  );
  const selected = await data(
    client
      .from("selected_controls")
      .select("id,control_id,profile_resolution_id")
      .is("tenant_id", null)
      .order("id")
      .limit(1)
      .single(),
  );
  const program = await insert("programs", {
    code: "IDENTITY",
    name: "Attention identity regression",
  });
  async function requirement(code) {
    const requirement = await insert("engineering_requirements", { program_id: program.id, code });
    return insert("requirement_revisions", {
      engineering_requirement_id: requirement.id,
      version_number: 1,
      title: code,
      statement: "A statement",
      acceptance_criteria: "Verify the statement.",
      requirement_type: "security",
    });
  }
  const content = await requirement("REQ-ONE"),
    otherContent = await requirement("REQ-OTHER");
  async function system(code) {
    const row = await insert("systems", {
      program_id: program.id,
      code,
      name: code,
      system_type: "information_system",
    });
    await insert("ssp_revisions", {
      system_id: row.id,
      profile_resolution_id: selected.profile_resolution_id,
      version_number: 1,
    });
    return row;
  }
  const a = await system("SYS-A"),
    b = await system("SYS-B");
  const allocate = (requirementId, systemId) =>
    insert("requirement_allocations", {
      requirement_revision_id: requirementId,
      system_id: systemId,
    });
  const map = (requirementId, systemId) =>
    insert("requirement_control_links", {
      requirement_revision_id: requirementId,
      system_id: systemId,
      selected_control_id: selected.id,
      control_id: selected.control_id,
      relationship_type: "derived_from",
    });
  const firstAllocation = await allocate(content.id, a.id);
  const mapping = await map(content.id, a.id);
  const bAllocation = await allocate(content.id, b.id);
  const mappingB = await map(content.id, b.id);
  const otherAllocation = await allocate(otherContent.id, a.id);
  const otherMapping = await map(otherContent.id, a.id);
  await data(
    client.from("requirement_allocations").delete().in("id", [bAllocation.id, otherAllocation.id]),
  );
  const before = await attention();
  const unaffectedB = before.rows.find((item) => item.item_key === `mapping:${mappingB.id}`);
  const unaffectedOther = before.rows.find(
    (item) => item.item_key === `mapping:${otherMapping.id}`,
  );
  assert.ok(unaffectedB && unaffectedOther);
  await data(client.from("requirement_allocations").delete().eq("id", firstAllocation.id));
  const first = (await attention()).rows.find((item) => item.item_key === `mapping:${mapping.id}`);
  assert.ok(first);
  assert.equal(first.state, null);
  const ack = await data(
    client.rpc("command_assurance_attention", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        operation: "set-state",
        itemKey: first.item_key,
        sourceRevision: first.source_revision,
        expectedVersion: first.ack_version,
        state: "done",
      },
    }),
  );
  assert.equal(ack.state, "done");
  const repair = await allocate(content.id, a.id);
  assert.equal(
    (await attention()).rows.some((item) => item.item_key === first.item_key),
    false,
    "Repaired allocation removes the issue",
  );
  await data(client.from("requirement_allocations").delete().eq("id", repair.id));
  const recurring = (await attention()).rows.find((item) => item.item_key === first.item_key);
  assert.ok(recurring);
  assert.notEqual(
    recurring.source_revision,
    first.source_revision,
    "Deleted allocations retain a new generation",
  );
  assert.equal(recurring.state, null, "Previous Done does not hide a recurring issue");
  assert.equal((await context(content.id, a.id))[0].generation, 4);
  const current = await allocate(content.id, a.id);
  const generation = (await context(content.id, a.id))[0].generation;
  const rationale = await data(
    client
      .from("requirement_allocations")
      .update({ rationale: "Authored note only", revision: current.revision + 1 })
      .eq("id", current.id)
      .select()
      .single(),
  );
  assert.equal(
    (await context(content.id, a.id))[0].generation,
    generation,
    "Rationale-only edits do not change applicability identity",
  );
  await data(
    client
      .from("requirement_allocations")
      .update({ system_id: b.id, revision: rationale.revision + 1 })
      .eq("id", current.id),
  );
  assert.equal(
    (await context(content.id, a.id))[0].generation,
    generation + 1,
    "Retarget advances old normalized context",
  );
  assert.equal(
    (await context(content.id, b.id))[0].generation,
    3,
    "Retarget advances new normalized context",
  );
  await data(client.from("requirement_allocations").delete().eq("id", current.id));
  const final = await attention();
  assert.notEqual(
    final.rows.find((item) => item.item_key === unaffectedB.item_key).source_revision,
    unaffectedB.source_revision,
  );
  assert.equal(
    final.rows.find((item) => item.item_key === unaffectedOther.item_key).source_revision,
    unaffectedOther.source_revision,
    "Another requirement context remains unchanged",
  );
  await refuse(client.from("assurance_allocation_attention_generations").select(), "42501");
  await refuse(
    client.from("assurance_allocation_attention_generations").insert({
      tenant_id: tenantId,
      requirement_revision_id: content.id,
      system_id: a.id,
      generation: 99,
      changed_at: new Date().toISOString(),
    }),
    "42501",
  );
  outsider = await localWorkspace("attention-identity-outsider");
  await refuse(
    outsider.client.rpc("assurance_allocation_attention_context", {
      p_tenant_id: tenantId,
      p_requirement_revision_id: content.id,
      p_system_id: a.id,
    }),
    "42501",
  );
  assert.deepEqual(
    await data(
      outsider.client.from("assurance_attention_sources").select().eq("tenant_id", tenantId),
    ),
    [],
  );
  console.log(
    "PASS: null-CAS deletion denied, valid saved envelopes/exact retry, recurring allocation issue returns unread, normalized retarget generations, no-op stability, unrelated context isolation and private generation access denial.",
  );
} finally {
  await workspace.cleanup();
  if (outsider) await outsider.cleanup();
}
