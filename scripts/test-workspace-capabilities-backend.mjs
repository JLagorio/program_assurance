/** Disposable-workspace regression: saved views, source search and revision-specific attention. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("workspace-capabilities");
const { client, tenantId } = workspace;
let outsider;
let joined = false;
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
async function refuse(query, code) {
  const response = await query;
  assert.ok(response.error, "Request must be refused");
  if (code) assert.equal(response.error.code, code, response.error.message);
}
const insert = (table, values, actor = workspace) =>
  data(
    actor.client
      .from(table)
      .insert({ tenant_id: actor.tenantId, ...values })
      .select()
      .single(),
  );
const save = (view, db = client, tenant = tenantId) =>
  db.rpc("save_assurance_view", {
    p_tenant_id: tenant,
    p_id: view.id,
    p_scope: view.scope,
    p_name: view.name,
    p_visibility: view.visibility,
    p_definition: view.definition,
    p_revision: view.revision ?? null,
  });
const remove = (view, db = client, tenant = tenantId) =>
  db.rpc("delete_assurance_view", {
    p_tenant_id: tenant,
    p_id: view.id,
    p_revision: view.revision,
  });
const search = (query, db = client, tenant = tenantId, limit = 40) =>
  db.rpc("search_assurance_records", { p_tenant_id: tenant, p_query: query, p_limit: limit });
const attention = (state = "open", db = client, tenant = tenantId, offset = 0, limit = 25) =>
  db.rpc("read_assurance_attention", {
    p_tenant_id: tenant,
    p_state: state,
    p_offset: offset,
    p_limit: limit,
  });
const review = (command, db = client) =>
  db.rpc("command_assurance_review", {
    p_tenant_id: tenantId,
    p_request_id: randomUUID(),
    p_command: command,
  });
const ack = (item, state, actor = workspace, options = {}) =>
  actor.client.rpc("command_assurance_attention", {
    p_tenant_id: tenantId,
    p_request_id: options.requestId ?? randomUUID(),
    p_command: {
      itemKey: item.item_key,
      sourceRevision: item.source_revision,
      expectedVersion: item.ack_version,
      operation: options.observe ? "observe" : "set-state",
      state,
      ...options.command,
    },
  });
const advanced = (item, result) => ({ ...item, state: result.state, ack_version: result.version });
try {
  outsider = await localWorkspace("workspace-capabilities-outsider");
  const privateView = {
    id: randomUUID(),
    scope: "program:regression:requirements",
    name: "Open security requirements",
    visibility: "private",
    definition: {
      version: 1,
      kind: "table",
      question: { filters: [{ id: "type", value: "security" }] },
      layout: { columnOrder: ["code", "statement"] },
    },
  };
  const [created, retried] = await Promise.all([data(save(privateView)), data(save(privateView))]);
  assert.deepEqual(created, retried, "Concurrent exact create retries return one view");
  assert.equal(created.owner_id, workspace.userId);
  assert.equal(created.tenant_id, tenantId);
  const renamed = {
    ...privateView,
    name: "High-priority requirements",
    revision: created.revision,
  };
  const updated = await data(save(renamed));
  assert.equal(updated.revision, created.revision + 1);
  assert.deepEqual(
    await data(save(renamed)),
    updated,
    "Lost-response retry accepts the exact committed payload",
  );
  await refuse(save({ ...renamed, name: "Stale overwrite" }), "PT409");
  await refuse(save({ ...renamed, scope: "another-scope", revision: updated.revision }), "42501");
  await refuse(save({ ...privateView, id: randomUUID(), definition: [] }), "23514");
  await refuse(
    client.from("assurance_saved_views").insert({
      id: randomUUID(),
      tenant_id: tenantId,
      owner_id: workspace.userId,
      scope_key: "raw",
      name: "Raw",
      visibility: "private",
      definition: {},
    }),
    "42501",
  );
  await refuse(
    client.from("assurance_saved_views").update({ name: "Raw overwrite" }).eq("id", created.id),
    "42501",
  );
  const races = await Promise.all([
    save({ ...renamed, name: "Race one", revision: updated.revision }),
    save({ ...renamed, name: "Race two", revision: updated.revision }),
  ]);
  assert.equal(races.filter((response) => !response.error).length, 1);
  assert.equal(races.find((response) => response.error).error.code, "PT409");
  const winner = races.find((response) => !response.error).data;
  const shared = { ...privateView, id: randomUUID(), name: "Shared view", visibility: "workspace" };
  const sharedRow = await data(save(shared));
  assert.deepEqual(
    await data(outsider.client.from("assurance_saved_views").select().eq("tenant_id", tenantId)),
    [],
  );
  await refuse(save(shared, outsider.client), "42501");
  await refuse(remove({ id: shared.id, revision: sharedRow.revision }, outsider.client), "42501");

  const needle = `passage-${workspace.run}`;
  const foreignNeedle = `private-${outsider.run}`;
  const program = await insert("programs", {
    code: "CAPABILITIES",
    name: "Capabilities regression",
    description: needle,
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-CAPABILITIES",
  });
  await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Searchable current requirement",
    statement: `The system preserves ${needle}.`,
    acceptance_criteria: "A review record exists.",
    requirement_type: "security",
  });
  const foreignProgram = await insert(
    "programs",
    { code: "PRIVATE", name: "Other tenant", description: foreignNeedle },
    outsider,
  );
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Capabilities evidence",
    artifact_kind: "document",
    description: `Evidence description ${needle}`,
    source_uri: "https://example.test/capabilities.pdf",
  });
  const evidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    sha256: "a".repeat(64),
    state: "draft",
    description: `Evidence text ${needle}`,
  });
  const target = { kind: "requirement", recordId: requirement.id };
  const citation = await data(
    review({
      operation: "create-citation",
      target,
      evidenceVersionId: evidence.id,
      expectedEvidenceRevision: evidence.revision,
      passage: `Verified passage ${needle}`,
      page: 2,
    }),
  );
  const found = await data(search(needle));
  assert.ok(found.some((row) => row.kind === "program" && row.id === program.id));
  assert.ok(
    found.some(
      (row) =>
        row.kind === "requirement" && row.id === requirement.id && row.excerpt.includes(needle),
    ),
  );
  assert.ok(found.some((row) => row.kind === "evidence" && row.id === artifact.id));
  assert.ok(
    found.some(
      (row) =>
        row.kind === "citation" && row.id === citation.citationId && row.excerpt.includes(needle),
    ),
  );
  assert.deepEqual(
    await data(search(foreignNeedle)),
    [],
    "Cross-tenant source text is not searchable",
  );
  assert.deepEqual(
    await data(search(needle, outsider.client, outsider.tenantId)),
    [],
    "Outsider cannot find source or citation text",
  );
  assert.equal((await data(search(needle, client, tenantId, 1))).length, 1);
  assert.deepEqual(await data(search("a")), []);
  await refuse(search("x".repeat(201)), "23514");
  await refuse(search(needle, client, tenantId, 101), "23514");
  await refuse(search(needle, outsider.client), "42501");
  assert.deepEqual(
    await data(client.from("assurance_search_documents").select().eq("id", foreignProgram.id)),
    [],
  );

  const thread = await data(
    review({
      operation: "create-thread",
      target,
      subject: "Check current evidence",
      body: "A reviewer should confirm the cited version.",
    }),
  );
  let items = await data(attention());
  let item = items.rows.find((row) => row.item_key === `review:${thread.threadId}`);
  assert.ok(item);
  assert.equal(item.source_revision, "1");
  assert.equal(item.state, null);
  assert.equal(
    (await data(attention("unread"))).rows.some((row) => row.item_key === item.item_key),
    true,
  );
  assert.equal(item.ack_version, 0);
  const unreadItem = item;
  const seenRequest = randomUUID();
  const seenResult = await data(
    ack(item, "seen", workspace, { requestId: seenRequest, observe: true }),
  );
  item = advanced(item, seenResult);
  assert.equal(
    (await data(attention("unread"))).rows.some((row) => row.item_key === item.item_key),
    false,
  );
  assert.equal(
    (await data(attention("open"))).rows.some((row) => row.item_key === item.item_key),
    true,
  );
  item = advanced(item, await data(ack(item, "done")));
  assert.deepEqual(
    await data(ack(unreadItem, "seen", workspace, { requestId: seenRequest, observe: true })),
    seenResult,
    "Lost Seen response returns its original receipt after another tab marked Done",
  );
  const currentAck = async () =>
    (await data(attention("all"))).rows.find((row) => row.item_key === item.item_key);
  assert.equal((await currentAck()).state, "done", "Receipt retry cannot regress newer Done");
  assert.equal((await currentAck()).ack_version, item.ack_version);
  await refuse(ack(unreadItem, "done", workspace, { requestId: seenRequest }), "PT409");
  const observedDone = await data(ack(unreadItem, "seen", workspace, { observe: true }));
  assert.equal(observedDone.state, "done", "Opening a Done item never reopens it");
  assert.equal(observedDone.changed, false);
  await refuse(ack(unreadItem, null), "PT409");
  await refuse(ack(item, "done", workspace, { command: { expectedVersion: null } }), "23514");
  await refuse(ack(item, "done", workspace, { command: { expectedVersion: -1 } }), "23514");
  await refuse(ack(item, "done", workspace, { command: { userId: outsider.userId } }), "23514");
  // Keep clear tombstones: seen -> done -> seen must not admit an older seen command (ABA).
  item = advanced(item, await data(ack(item, "seen")));
  const oldSeen = item;
  item = advanced(item, await data(ack(item, "done")));
  item = advanced(item, await data(ack(item, "seen")));
  await refuse(ack(oldSeen, null), "PT409");
  assert.equal((await currentAck()).state, "seen");
  item = advanced(item, await data(ack(item, "done")));
  const beforeRestore = item;
  const restoreId = randomUUID();
  const restored = await data(ack(item, null, workspace, { requestId: restoreId }));
  item = advanced(item, restored);
  assert.equal((await currentAck()).ack_version, item.ack_version);
  assert.equal((await currentAck()).state, null);
  item = advanced(item, await data(ack(item, "done")));
  assert.deepEqual(
    await data(ack(beforeRestore, null, workspace, { requestId: restoreId })),
    restored,
  );
  assert.equal((await currentAck()).state, "done", "Lost Undo response cannot undo a newer Done");
  // Serialize two new commands against the same absent row, including different desired states.
  const raceThread = await data(
    review({
      operation: "create-thread",
      target,
      subject: "Attention CAS race",
      body: "Two tabs race.",
    }),
  );
  const raceItem = (await data(attention("unread"))).rows.find(
    (row) => row.item_key === `review:${raceThread.threadId}`,
  );
  const ackRace = await Promise.all([ack(raceItem, "seen"), ack(raceItem, "done")]);
  assert.equal(ackRace.filter((response) => !response.error).length, 1);
  assert.equal(ackRace.find((response) => response.error).error.code, "PT409");
  for (const request of [
    client
      .from("assurance_attention_acknowledgments")
      .update({ state: "seen" })
      .eq("tenant_id", tenantId),
    client.from("assurance_attention_acknowledgments").delete().eq("tenant_id", tenantId),
    client.from("assurance_attention_requests").select(),
  ])
    await refuse(request, "42501");
  assert.equal(
    (await data(attention("open"))).rows.some((row) => row.item_key === item.item_key),
    false,
  );
  assert.equal(
    (await data(attention("done"))).rows.some((row) => row.item_key === item.item_key),
    true,
  );
  assert.equal(
    (
      await data(
        client.from("assurance_review_threads").select().eq("id", thread.threadId).single(),
      )
    ).status,
    "open",
    "Acknowledgment does not resolve domain work",
  );
  await data(
    review({
      operation: "reply",
      threadId: thread.threadId,
      body: "New source revision requires another read.",
    }),
  );
  const renewed = (await data(attention("unread"))).rows.find(
    (row) => row.item_key === item.item_key,
  );
  assert.ok(renewed);
  assert.equal(renewed.source_revision, "2");
  assert.equal(renewed.state, null);
  assert.equal(
    (await data(attention("done"))).rows.some((row) => row.item_key === item.item_key),
    false,
    "Old revision acknowledgment does not mark new revision done",
  );
  await refuse(
    client.from("assurance_attention_acknowledgments").upsert({
      tenant_id: tenantId,
      user_id: outsider.userId,
      item_key: renewed.item_key,
      source_revision: renewed.source_revision,
      state: "done",
    }),
    "42501",
  );
  await refuse(ack(renewed, "done", outsider), "42501");
  await refuse(attention("open", outsider.client), "42501");
  await refuse(attention("invalid"), "23514");
  await refuse(attention("open", client, tenantId, -1), "23514");
  await refuse(attention("open", client, tenantId, 0, 0), "23514");

  await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 2,
    sha256: "b".repeat(64),
    state: "draft",
  });
  const outdated = (await data(attention("unread"))).rows.find(
    (row) => row.item_key === `citation:${citation.citationId}`,
  );
  assert.ok(outdated);
  assert.equal(outdated.reason, "A newer evidence version is available");
  await data(ack(outdated, "done"));
  await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 3,
    sha256: "c".repeat(64),
    state: "draft",
  });
  const newlyOutdated = (await data(attention("unread"))).rows.find(
    (row) => row.item_key === outdated.item_key,
  );
  assert.ok(newlyOutdated);
  assert.notEqual(newlyOutdated.source_revision, outdated.source_revision);

  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  joined = true;
  const visible = await data(
    outsider.client.from("assurance_saved_views").select().eq("tenant_id", tenantId),
  );
  assert.deepEqual(
    visible.map((row) => row.id),
    [shared.id],
    "Workspace views are shared; private views remain private",
  );
  await refuse(
    save({ ...shared, name: "Viewer edit", revision: sharedRow.revision }, outsider.client),
    "42501",
  );
  const viewerPrivate = { ...privateView, id: randomUUID(), name: "Reader preference" };
  const viewerRow = await data(save(viewerPrivate, outsider.client));
  assert.equal(viewerRow.owner_id, outsider.userId);
  await refuse(
    save(
      { ...viewerPrivate, visibility: "workspace", revision: viewerRow.revision },
      outsider.client,
    ),
    "42501",
  );
  assert.deepEqual(
    await data(client.from("assurance_saved_views").select().eq("id", viewerRow.id)),
    [],
    "Workspace owner cannot read another member's private preference",
  );
  assert.ok((await data(search(needle, outsider.client))).some((row) => row.kind === "citation"));
  await refuse(
    ack(unreadItem, "seen", outsider, { requestId: seenRequest, observe: true }),
    "PT409",
  );
  await data(ack(renewed, "done", outsider));
  assert.equal(
    (await data(attention("done", outsider.client))).rows.some(
      (row) => row.item_key === renewed.item_key,
    ),
    true,
  );
  assert.equal(
    (await data(attention("unread", client))).rows.some((row) => row.item_key === renewed.item_key),
    true,
    "Acknowledgments are personal",
  );
  assert.equal(
    (
      await data(
        client.from("assurance_attention_acknowledgments").select().eq("user_id", outsider.userId),
      )
    ).length,
    0,
  );
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "editor" })
      .eq("tenant_id", tenantId)
      .eq("user_id", outsider.userId),
  );
  const viewerShared = await data(
    save(
      { ...viewerPrivate, visibility: "workspace", revision: viewerRow.revision },
      outsider.client,
    ),
  );
  assert.equal(viewerShared.visibility, "workspace");
  await refuse(
    save(
      { ...shared, name: "Another editor overwrite", revision: sharedRow.revision },
      outsider.client,
    ),
    "42501",
  );
  await refuse(remove({ id: shared.id, revision: sharedRow.revision }, outsider.client), "42501");
  await refuse(remove({ id: winner.id, revision: created.revision }), "PT409");
  await data(remove({ id: winner.id, revision: winner.revision }));
  await data(remove({ id: winner.id, revision: winner.revision }));
  assert.deepEqual(
    await data(client.from("assurance_saved_views").select().eq("id", winner.id)),
    [],
  );
  await refuse(save({ ...privateView, revision: winner.revision }), "PT409");
  const paged = await data(attention("all", client, tenantId, 0, 1));
  assert.equal(paged.rows.length, 1);
  assert.ok(paged.count >= 2);
  await outsider.client.auth.signOut();
  await refuse(search(needle, outsider.client), "42501");
  await refuse(attention("all", outsider.client), "42501");
  await refuse(save(viewerPrivate, outsider.client), "42501");
  console.log(
    "PASS: saved-view private/shared ownership, reader/editor policy, CAS race and exact retry/delete; source/citation search and bounds; revision-specific personal attention, receipt retries, versioned Undo/ABA protection, concurrent writes, monotonic Seen, evidence reappearance, tenant and anonymous isolation.",
  );
} finally {
  if (joined)
    await data(
      client
        .from("tenant_memberships")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", outsider.userId),
    );
  await workspace.cleanup();
  if (outsider) await outsider.cleanup();
}
