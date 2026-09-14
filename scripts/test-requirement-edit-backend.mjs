/** Same-row requirement editing, stable relationships and transactional edit history. */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("requirement-edit");
const { client, tenantId } = workspace;
let outsider;
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
const rows = (table, filters = {}) => {
  let query = client.from(table).select().eq("tenant_id", tenantId);
  for (const [field, value] of Object.entries(filters)) query = query.eq(field, value);
  return data(query.order("id"));
};
async function totals() {
  return Object.fromEntries(
    await Promise.all(
      [
        "requirement_revisions",
        "activity_events",
        "requirement_evidence",
        "requirement_allocations",
        "requirement_decompositions",
        "requirement_control_links",
        "requirement_implementations",
        "requirement_verifications",
      ].map(async (table) => [table, (await rows(table)).length]),
    ),
  );
}
const copied = {
  requirement_decompositions: [
    "parent_requirement_revision_id",
    ["child_requirement_revision_id", "rationale"],
  ],
  requirement_control_links: [
    "requirement_revision_id",
    ["control_part_id", "relationship_type", "rationale"],
  ],
  requirement_allocations: [
    "requirement_revision_id",
    ["composition_node_id", "provider_capability_id", "security_process_id", "rationale"],
  ],
  requirement_implementations: [
    "requirement_revision_id",
    ["component_contribution_id", "rationale"],
  ],
  requirement_evidence: [
    "requirement_revision_id",
    ["evidence_version_id", "claim", "applicability_rationale"],
  ],
  requirement_verifications: ["requirement_revision_id", ["procedure_revision_id", "rationale"]],
};
const dbEnv = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
};
for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete dbEnv[key];
function sql(input) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_program-assurance",
      "psql",
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
    ],
    { env: dbEnv, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
}
async function directCrudWhileRpcWaits(content, startRpc) {
  const session = spawn(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_program-assurance",
      "psql",
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
    ],
    { env: dbEnv, stdio: ["pipe", "pipe", "pipe"] },
  );
  let output = "";
  let errors = "";
  let announce;
  const locked = new Promise((resolve) => {
    announce = resolve;
  });
  session.stdout.on("data", (chunk) => {
    output += chunk.toString();
    if (output.includes("CONTENT_LOCK_READY")) announce();
  });
  session.stderr.on("data", (chunk) => {
    errors += chunk.toString();
  });
  const finished = new Promise((resolve, reject) => {
    session.on("error", reject);
    session.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(errors || `SQL session exited ${code}`)),
    );
  });
  const timeout = setTimeout(() => session.kill(), 10000);
  try {
    session.stdin.write(
      `begin; set local role authenticated; set local request.jwt.claim.sub = '${workspace.userId}'; select id from public.requirement_revisions where id = '${content.id}'::uuid for update;\n\\echo CONTENT_LOCK_READY\n`,
    );
    await Promise.race([locked, finished]);
    const pending = Promise.resolve(startRpc());
    await new Promise((resolve) => setTimeout(resolve, 150));
    session.stdin.end(
      `update public.requirement_revisions set title = 'Direct lock ordering edit', revision = ${content.revision + 1} where id = '${content.id}'::uuid; commit;\n`,
    );
    await finished;
    return await pending;
  } finally {
    clearTimeout(timeout);
    if (session.exitCode === null) session.kill();
  }
}
let faultInstalled = false;
try {
  const program = await insert("programs", {
    code: "REVISION-TEST",
    name: "Requirement revision validation",
  });
  const actor = await data(
    client
      .from("parties")
      .select()
      .eq("tenant_id", tenantId)
      .eq("auth_user_id", workspace.userId)
      .single(),
  );
  const newOwner = await insert("parties", {
    party_type: "person",
    name: "Explicitly selected validation owner",
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-REVISION",
  });
  const initial = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Original title",
    statement: "Original statement",
    acceptance_criteria: "Original criteria",
    rationale: "Original rationale",
    requirement_type: "security",
    owner_party_id: actor.id,
  });
  async function relatedRequirement(code) {
    const identity = await insert("engineering_requirements", { program_id: program.id, code });
    return insert("requirement_revisions", {
      engineering_requirement_id: identity.id,
      version_number: 1,
      title: code,
      statement: `${code} statement`,
      acceptance_criteria: `${code} criteria`,
      requirement_type: "functional",
    });
  }
  const child = await relatedRequirement("REQ-CHILD");
  const parent = await relatedRequirement("REQ-PARENT");
  await insert("requirement_decompositions", {
    parent_requirement_revision_id: initial.id,
    child_requirement_revision_id: child.id,
    rationale: "Authored outgoing hierarchy",
  });
  const incoming = await insert("requirement_decompositions", {
    parent_requirement_revision_id: parent.id,
    child_requirement_revision_id: initial.id,
    rationale: "Incoming historical pin",
  });
  const securityProcess = await insert("security_processes", {
    program_id: program.id,
    code: "REV-PROCESS",
    name: "Validation process",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: initial.id,
    security_process_id: securityProcess.id,
    rationale: "Exact allocation",
  });
  const controlPart = await data(
    client.from("control_parts").select().is("tenant_id", null).limit(1).single(),
  );
  await insert("requirement_control_links", {
    requirement_revision_id: initial.id,
    control_part_id: controlPart.id,
    relationship_type: "maps_to",
    rationale: "Exact control part",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Published validation evidence",
    artifact_kind: "document",
  });
  const evidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.test/requirement-revision/evidence",
  });
  await insert("requirement_evidence", {
    requirement_revision_id: initial.id,
    evidence_version_id: evidence.id,
    claim: "Authored claim",
    applicability_rationale: "Authored evidence applicability",
  });
  const procedure = await insert("procedures", {
    program_id: program.id,
    title: "Validation procedure",
  });
  const procedureRevision = await insert("procedure_revisions", {
    procedure_id: procedure.id,
    version_number: 1,
    title: "Pinned procedure",
    method: "test",
  });
  await insert("requirement_verifications", {
    requirement_revision_id: initial.id,
    procedure_revision_id: procedureRevision.id,
    rationale: "Verification method pin",
  });
  const system = await insert("systems", {
    program_id: program.id,
    code: "REV-SYSTEM",
    name: "Revision validation system",
    system_type: "information_system",
  });
  const scope = await insert("scopes", {
    system_id: system.id,
    code: "REV-SCOPE",
    name: "Revision validation scope",
  });
  const decision = await insert("requirement_applicability", {
    requirement_revision_id: initial.id,
    scope_id: scope.id,
    decision: "applicable",
    rationale: "Decision applies to original requirement",
    decided_by_party_id: actor.id,
    decided_at: new Date().toISOString(),
  });
  const task = await insert("tasks", {
    program_id: program.id,
    title: "Task pinned to original requirement",
  });
  const taskPin = await insert("task_requirements", {
    task_id: task.id,
    requirement_revision_id: initial.id,
  });
  const request = await insert("change_requests", {
    title: "Request about original requirement",
    requirement_revision_id: initial.id,
  });
  const profileRevision = await data(
    client.from("profile_revisions").select().is("tenant_id", null).limit(1).single(),
  );
  const hash = createHash("sha256")
    .update(JSON.stringify({ control: controlPart.control_id, test: tenantId }))
    .digest("hex");
  const resolution = await insert("profile_resolutions", {
    profile_revision_id: profileRevision.id,
    resolver_name: "requirement-revision-test",
    resolver_version: "1",
    input_sha256: hash,
    output_sha256: hash,
  });
  const referenceControl = await row("controls", controlPart.control_id);
  const catalogRevision = await row("catalog_revisions", referenceControl.catalog_revision_id);
  await insert("profile_resolution_inputs", {
    profile_resolution_id: resolution.id,
    document_revision_id: catalogRevision.document_revision_id,
    ordinal: 0,
  });
  const selectedControl = await insert("selected_controls", {
    profile_resolution_id: resolution.id,
    control_id: controlPart.control_id,
    ordinal: 0,
  });
  const ssp = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  const implemented = await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: selectedControl.id,
  });
  const component = await insert("system_components", {
    system_id: system.id,
    code: "REV-COMP",
    name: "Validation component",
    component_type: "software",
  });
  const contribution = await insert("component_contributions", {
    ssp_revision_id: ssp.id,
    implemented_requirement_id: implemented.id,
    system_component_id: component.id,
    description: "Recorded contribution",
  });
  await insert("requirement_implementations", {
    requirement_revision_id: initial.id,
    component_contribution_id: contribution.id,
    rationale: "Exact implementation pin",
  });
  const originalChildren = Object.fromEntries(
    await Promise.all(
      Object.entries(copied).map(async ([table, [field]]) => [
        table,
        await rows(table, { [field]: initial.id }),
      ]),
    ),
  );
  const edit = (content, patch, options = {}) =>
    (options.actor ?? client).rpc("edit_requirement", {
      p_tenant_id: options.tenant ?? tenantId,
      p_request_id: options.requestId ?? randomUUID(),
      p_requirement_id: options.requirementId ?? requirement.id,
      p_content_id: content.id,
      p_expected_revision: options.expectedRevision ?? content.revision,
      p_patch: patch,
    });
  async function reject(content, patch, options = {}, code = "23514") {
    const before = await totals();
    const result = await edit(content, patch, options);
    assert.equal(result.error?.code, code, JSON.stringify(result));
    assert.deepEqual(await totals(), before);
  }
  const creation = (await rows("activity_events", { requirement_revision_id: initial.id }))[0];
  assert.equal(creation.event_type, "created");
  assert.equal(creation.source_requirement_revision_id, null);
  assert.equal(creation.actor_party_id, actor.id);
  assert.deepEqual(creation.changes.title, { before: null, after: initial.title });
  // Legacy storage state no longer controls whether a current requirement can be edited.
  await data(
    client
      .from("requirement_revisions")
      .update({ state: "published", revision: initial.revision + 1 })
      .eq("id", initial.id),
  );
  let current = await row("requirement_revisions", initial.id);
  const sourceRecord = { ...current };
  const startingTotals = await totals();
  const patch = {
    title: "Edited title",
    statement: "Edited statement",
    acceptanceCriteria: "Edited criteria",
    rationale: null,
    requirementType: "performance",
    ownerPartyId: newOwner.id,
  };
  const requestId = randomUUID();
  const result = await data(edit(current, patch, { requestId }));
  current = await row("requirement_revisions", initial.id);
  assert.equal(result.contentId, initial.id);
  assert.equal(result.requirementId, requirement.id);
  assert.equal(result.revision, sourceRecord.revision + 1);
  assert.equal(result.changed, true);
  assert.equal(current.id, initial.id);
  assert.equal(current.version_number, initial.version_number);
  assert.equal(current.state, sourceRecord.state);
  assert.equal(current.published_at, sourceRecord.published_at);
  assert.equal(current.created_at, initial.created_at);
  assert.equal(current.created_by, initial.created_by);
  assert.equal(current.updated_by, workspace.userId);
  assert.equal(current.title, patch.title);
  assert.equal(current.statement, patch.statement);
  assert.equal(current.acceptance_criteria, patch.acceptanceCriteria);
  assert.equal(current.rationale, null);
  assert.equal(current.requirement_type, patch.requirementType);
  assert.equal(current.owner_party_id, newOwner.id);
  const event = await row("activity_events", result.activityEventId);
  assert.equal(event.program_id, program.id);
  assert.equal(event.requirement_revision_id, initial.id);
  assert.equal(event.source_requirement_revision_id, null);
  assert.equal(event.actor_party_id, actor.id);
  assert.equal(event.created_by, workspace.userId);
  assert.equal(event.event_type, "updated");
  assert.deepEqual(event.changes.title, { before: initial.title, after: patch.title });
  assert.deepEqual(event.changes.ownerPartyId, { before: actor.id, after: newOwner.id });
  assert.deepEqual(event.changes.rationale, { before: initial.rationale, after: null });
  assert.equal(Object.keys(event.changes).length, 6);
  assert.match(event.description, /edited Acceptance criteria/);
  const afterEdit = await totals();
  assert.deepEqual(afterEdit, {
    ...startingTotals,
    activity_events: startingTotals.activity_events + 1,
  });
  for (const [table, [field]] of Object.entries(copied))
    assert.deepEqual(await rows(table, { [field]: initial.id }), originalChildren[table]);
  assert.deepEqual(await row("requirement_decompositions", incoming.id), incoming);
  assert.deepEqual(await row("requirement_applicability", decision.id), decision);
  assert.deepEqual(await row("task_requirements", taskPin.id), taskPin);
  assert.deepEqual(await row("change_requests", request.id), request);
  console.log(
    "PASS editing updates the same requirement row, preserves every relationship/ID and records actual before/after actor history",
  );

  assert.deepEqual(await data(edit(sourceRecord, patch, { requestId })), result);
  await reject(sourceRecord, { title: "Conflicting retry" }, { requestId }, "PT409");
  await reject(sourceRecord, { title: "Stale edit" }, {}, "PT409");
  await reject(current, { title: "Wrong counter" }, { expectedRevision: 99 }, "PT409");
  const noop = await data(edit(current, { title: "  Edited title  ", ownerPartyId: newOwner.id }));
  assert.equal(noop.changed, false);
  assert.equal(noop.contentId, current.id);
  assert.equal(noop.revision, current.revision);
  assert.equal(noop.activityEventId, null);
  assert.deepEqual(await totals(), afterEdit);
  console.log(
    "PASS identical retries, no-op suppression and optimistic concurrency create no extra content or history",
  );

  await data(
    client
      .from("requirement_revisions")
      .update({ title: "Edited through schema CRUD", revision: current.revision + 1 })
      .eq("id", current.id),
  );
  current = await row("requirement_revisions", current.id);
  const directEvents = await rows("activity_events", { requirement_revision_id: current.id });
  const direct = directEvents.find(
    (item) => item.changes?.title?.after === "Edited through schema CRUD",
  );
  assert.ok(direct);
  assert.equal(direct.actor_party_id, actor.id);
  assert.deepEqual(direct.changes.title, { before: patch.title, after: current.title });
  assert.equal(directEvents.length, 3);
  assert.equal(
    (await rows("requirement_revisions", { engineering_requirement_id: requirement.id })).length,
    1,
  );
  await reject(current, { title: " " });
  await reject(current, { statement: null });
  await reject(current, { requirementType: "invented" });
  await reject(current, { ownerPartyId: randomUUID() });
  await reject(current, { version_number: 999 });
  await reject(current, { state: "draft" });
  const extra = await client.from("requirement_revisions").insert({
    tenant_id: tenantId,
    engineering_requirement_id: requirement.id,
    version_number: 2,
    title: "Unwanted copy",
    statement: "No clone",
    acceptance_criteria: "No clone",
    requirement_type: "security",
  });
  assert.equal(extra.error?.code, "23514");
  const oldEndpoint = await client.rpc("revise_requirement", {
    p_tenant_id: tenantId,
    p_request_id: randomUUID(),
    p_source_revision_id: current.id,
    p_expected_revision: current.revision,
    p_patch: { title: "No clone" },
    p_force_new: true,
  });
  assert.equal(oldEndpoint.error?.code, "42501");
  const forged = await client.from("activity_events").insert({
    tenant_id: tenantId,
    program_id: program.id,
    requirement_revision_id: current.id,
    source_requirement_revision_id: null,
    changes: { title: { before: "false", after: "false" } },
    actor_party_id: newOwner.id,
    event_type: "updated",
    occurred_at: new Date().toISOString(),
  });
  assert.equal(forged.error?.code, "42501");
  assert.ok((await client.from("requirement_edit_requests").select()).error);
  console.log(
    "PASS direct CRUD is audited; invalid patches, extra content rows, retired cloning and forged edit events are rejected",
  );

  const attempts = await Promise.all([
    edit(current, { title: "Concurrent A" }),
    edit(current, { title: "Concurrent B" }),
  ]);
  assert.equal(attempts.filter((item) => !item.error).length, 1);
  assert.equal(attempts.find((item) => item.error).error.code, "PT409");
  current = await row("requirement_revisions", current.id);
  assert.equal(
    (await rows("requirement_revisions", { engineering_requirement_id: requirement.id })).length,
    1,
  );
  const simultaneousId = randomUUID();
  const duplicateAttempts = await Promise.all([
    edit(current, { rationale: "Same retry" }, { requestId: simultaneousId }),
    edit(current, { rationale: "Same retry" }, { requestId: simultaneousId }),
  ]);
  duplicateAttempts.forEach((item) => assert.ifError(item.error));
  assert.deepEqual(duplicateAttempts[0].data, duplicateAttempts[1].data);
  current = await row("requirement_revisions", current.id);

  const eventsBeforeRace = (await rows("activity_events")).length;
  const waitingRpc = await directCrudWhileRpcWaits(current, () =>
    edit(current, { title: "Stale waiting RPC" }),
  );
  assert.equal(waitingRpc.error?.code, "PT409");
  current = await row("requirement_revisions", current.id);
  assert.equal(current.title, "Direct lock ordering edit");
  assert.equal((await rows("activity_events")).length, eventsBeforeRace + 1);
  assert.equal(
    (await rows("requirement_revisions", { engineering_requirement_id: requirement.id })).length,
    1,
  );
  console.log(
    "PASS direct CRUD audit completes while the RPC waits on content; stale RPC fails without a deadlock or duplicate history",
  );

  // Existing published requirements still support normal relationships. Evidence
  // versions themselves remain explicit published pins.
  const laterEvidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 2,
    state: "published",
    external_uri: "https://example.test/requirement-edit/later-evidence",
  });
  await data(
    client.rpc("link_requirement_evidence", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_requirement_revision_id: current.id,
      p_evidence_version_ids: [laterEvidence.id],
    }),
  );
  const laterLink = (
    await rows("requirement_evidence", { evidence_version_id: laterEvidence.id })
  )[0];
  await data(
    client
      .from("requirement_evidence")
      .update({ claim: "Same current requirement", revision: laterLink.revision + 1 })
      .eq("id", laterLink.id),
  );
  await data(client.from("requirement_evidence").delete().eq("id", laterLink.id));
  const draftEvidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 3,
    external_uri: "https://example.test/requirement-edit/draft-evidence",
  });
  assert.equal(
    (
      await client.rpc("link_requirement_evidence", {
        p_tenant_id: tenantId,
        p_program_id: program.id,
        p_requirement_revision_id: current.id,
        p_evidence_version_ids: [draftEvidence.id],
      })
    ).error?.code,
    "23514",
  );
  console.log(
    "PASS concurrent edits/retries stay on one record; legacy published requirements remain linkable to published evidence",
  );

  outsider = await localWorkspace("requirement-edit-outsider");
  const foreignOwner = await data(
    outsider.client
      .from("parties")
      .select()
      .eq("tenant_id", outsider.tenantId)
      .eq("auth_user_id", outsider.userId)
      .single(),
  );
  await reject(current, { ownerPartyId: foreignOwner.id });
  await reject(current, { title: "Foreign workspace" }, { tenant: outsider.tenantId }, "42501");
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  joined = true;
  await reject(current, { title: "Viewer edit" }, { actor: outsider.client }, "42501");
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "editor" })
      .eq("tenant_id", tenantId)
      .eq("user_id", outsider.userId),
  );
  await reject(sourceRecord, patch, { requestId, actor: outsider.client }, "PT409");
  console.log(
    "PASS owner references, role boundaries and retry identities are authenticated and tenant scoped",
  );

  sql(
    "create function public.test_requirement_edit_fault() returns trigger language plpgsql as $$ begin if new.tenant_id = '" +
      tenantId +
      "'::uuid and new.requirement_revision_id is not null then raise exception 'Deliberate edit audit failure' using errcode='23514'; end if; return new; end $$; create trigger z_test_requirement_edit_fault before insert on public.activity_events for each row execute function public.test_requirement_edit_fault();",
  );
  faultInstalled = true;
  await reject(current, { title: "Rollback validation" });
  assert.deepEqual(await row("requirement_revisions", current.id), current);
  const failedDirect = await client
    .from("requirement_revisions")
    .update({ title: "Direct rollback", revision: current.revision + 1 })
    .eq("id", current.id);
  assert.equal(failedDirect.error?.code, "23514");
  assert.deepEqual(await row("requirement_revisions", current.id), current);
  sql(
    "drop trigger z_test_requirement_edit_fault on public.activity_events; drop function public.test_requirement_edit_fault();",
  );
  faultInstalled = false;
  console.log(
    "PASS failed activity recording rolls back both RPC and direct CRUD edits atomically",
  );

  // Fixture-only archived compatibility rows prove migration preserves and freezes
  // pre-existing history; this transaction is restricted to the disposable tenant.
  const archiveIdentity = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-ARCHIVE-COMPAT",
  });
  const archivedId = randomUUID();
  const activeId = randomUUID();
  sql(
    "begin; set local session_replication_role=replica; insert into public.requirement_revisions (id,tenant_id,engineering_requirement_id,version_number,title,statement,acceptance_criteria,requirement_type) values ('" +
      archivedId +
      "','" +
      tenantId +
      "','" +
      archiveIdentity.id +
      "',1,'Archived compatibility','Original','Criteria','security'),('" +
      activeId +
      "','" +
      tenantId +
      "','" +
      archiveIdentity.id +
      "',2,'Current compatibility','Current','Criteria','security'); commit;",
  );
  const archived = await row("requirement_revisions", archivedId);
  await reject(
    archived,
    { title: "Archived rewrite" },
    { requirementId: archiveIdentity.id },
    "PT409",
  );
  assert.equal(
    (
      await client
        .from("requirement_revisions")
        .update({ title: "No rewrite", revision: archived.revision + 1 })
        .eq("id", archived.id)
    ).error?.code,
    "23514",
  );
  const active = await row("requirement_revisions", activeId);
  await data(
    edit(active, { title: "Edited existing compatibility" }, { requirementId: archiveIdentity.id }),
  );
  assert.equal(
    (await rows("requirement_revisions", { engineering_requirement_id: archiveIdentity.id }))
      .length,
    2,
  );
  assert.deepEqual(await row("requirement_revisions", archived.id), archived);
  console.log(
    "PASS existing archived compatibility rows stay unchanged while only their current record is edited",
  );
} finally {
  if (faultInstalled)
    sql(
      "drop trigger if exists z_test_requirement_edit_fault on public.activity_events; drop function if exists public.test_requirement_edit_fault();",
    );
  if (outsider && joined)
    await data(
      client
        .from("tenant_memberships")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", outsider.userId),
    );
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
}
