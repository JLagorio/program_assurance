/** Atomic task creation, authorization, context validation, and safe retry checks. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("task-create");
let outsider;
let viewerId;
const { client, tenantId } = workspace;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
async function counts() {
  return Object.fromEntries(
    await Promise.all(
      ["tasks", "task_assignments"].map(async (table) => {
        const result = await client
          .from(table)
          .select("id", { head: true, count: "exact" })
          .eq("tenant_id", tenantId);
        assert.ifError(result.error);
        return [table, result.count];
      }),
    ),
  );
}
const create = (values, requestId = randomUUID(), targetTenant = tenantId) =>
  client.rpc("create_task_with_assignment", {
    p_tenant_id: targetTenant,
    p_request_id: requestId,
    p_task: values,
  });
async function reject(values, code = "23514", targetTenant = tenantId) {
  const before = await counts();
  const result = await create(values, randomUUID(), targetTenant);
  assert.equal(result.error?.code, code, JSON.stringify(result));
  assert.deepEqual(await counts(), before);
}
try {
  const program = await data(
    client
      .from("programs")
      .insert({ tenant_id: tenantId, code: "TASK-CREATE-1", name: "Task creation validation" })
      .select()
      .single(),
  );
  const otherProgram = await data(
    client
      .from("programs")
      .insert({ tenant_id: tenantId, code: "TASK-CREATE-2", name: "Other validation program" })
      .select()
      .single(),
  );
  const workstream = await data(
    client
      .from("workstreams")
      .insert({ tenant_id: tenantId, program_id: program.id, title: "Validation workstream" })
      .select()
      .single(),
  );
  const wrongWorkstream = await data(
    client
      .from("workstreams")
      .insert({
        tenant_id: tenantId,
        program_id: otherProgram.id,
        title: "Other program workstream",
      })
      .select()
      .single(),
  );
  const party = await data(
    client
      .from("parties")
      .select()
      .eq("tenant_id", tenantId)
      .eq("auth_user_id", workspace.userId)
      .single(),
  );
  const values = {
    programId: program.id,
    workstreamId: workstream.id,
    title: "Review the control implementation",
    description: "Check the authored control statement and its evidence.",
    assigneePartyId: party.id,
    dueAt: "2026-12-31T16:30:00.000Z",
    priority: "high",
  };
  const requestId = randomUUID();
  const created = await data(create(values, requestId));
  const task = await data(client.from("tasks").select().eq("id", created.taskId).single());
  const assignment = await data(
    client.from("task_assignments").select().eq("id", created.assignmentId).single(),
  );
  assert.equal(task.program_id, program.id);
  assert.equal(task.workstream_id, workstream.id);
  assert.equal(task.title, values.title);
  assert.equal(task.description, values.description);
  assert.equal(task.status, "open");
  assert.equal(task.priority, "high");
  assert.equal(new Date(task.due_at).toISOString(), values.dueAt);
  assert.equal(task.created_by, workspace.userId);
  assert.equal(task.updated_by, workspace.userId);
  assert.equal(assignment.task_id, task.id);
  assert.equal(assignment.party_id, party.id);
  assert.equal(assignment.assignment_role, "responsible");
  assert.equal(assignment.created_by, workspace.userId);
  assert.deepEqual(await data(create(values, requestId)), created);
  assert.deepEqual(await counts(), { tasks: 1, task_assignments: 1 });
  const changedRetry = await create({ ...values, title: "Different request payload" }, requestId);
  assert.equal(changedRetry.error?.code, "PT409");
  console.log(
    "PASS atomic task + responsible assignment, authored values, audit identity, and identical retry",
  );

  const concurrentId = randomUUID();
  const concurrent = await Promise.all([
    create({ ...values, title: "Concurrent retry" }, concurrentId),
    create({ ...values, title: "Concurrent retry" }, concurrentId),
  ]);
  concurrent.forEach((result) => assert.ifError(result.error));
  assert.deepEqual(concurrent[0].data, concurrent[1].data);
  assert.deepEqual(await counts(), { tasks: 2, task_assignments: 2 });
  const minimal = {
    programId: program.id,
    workstreamId: null,
    title: "Intentionally unassigned task",
    description: "",
    assigneePartyId: null,
    dueAt: null,
    priority: null,
  };
  const unassigned = await data(create(minimal));
  assert.equal(unassigned.assignmentId, null);
  const plain = await data(client.from("tasks").select().eq("id", unassigned.taskId).single());
  assert.equal(plain.description, null);
  assert.equal(plain.priority, null);
  assert.equal(plain.due_at, null);
  assert.equal(plain.workstream_id, null);
  console.log("PASS concurrent retry and optional values stay unassigned/unset");

  await reject({ ...values, title: " " });
  await reject({ ...values, description: "x".repeat(10001) });
  await reject({ ...values, workstreamId: wrongWorkstream.id });
  await reject({ ...values, assigneePartyId: randomUUID() });
  await reject({ ...values, priority: "made-up-priority" });
  await reject({ ...values, dueAt: "2026-02-30T12:00:00Z" });
  await reject({ ...values, dueAt: "2026-12-31T16:30:00" });
  await reject({ ...values, requesterPartyId: party.id });
  outsider = await localWorkspace("task-outsider");
  const foreignProgram = await data(
    outsider.client
      .from("programs")
      .insert({ tenant_id: outsider.tenantId, code: "OUTSIDER", name: "Isolated task test" })
      .select()
      .single(),
  );
  const foreignParty = await data(
    outsider.client
      .from("parties")
      .select()
      .eq("tenant_id", outsider.tenantId)
      .eq("auth_user_id", outsider.userId)
      .single(),
  );
  await reject({ ...values, programId: foreignProgram.id });
  await reject({ ...values, assigneePartyId: foreignParty.id });
  await reject(values, "42501", outsider.tenantId);
  const receiptInsert = await client.from("task_create_requests").insert({
    id: randomUUID(),
    tenant_id: tenantId,
    task_id: task.id,
    created_by: workspace.userId,
    payload_sha256: "0".repeat(64),
  });
  assert.ok(receiptInsert.error, "Clients must not be able to forge command receipts");
  console.log(
    "PASS invalid requests, wrong-program workstream, foreign tenant references, and private receipts",
  );

  const viewer = await data(
    workspace.admin.auth.admin.createUser({
      email: `task-viewer-${randomUUID()}@example.test`,
      password: `Aa1!${randomUUID()}`,
      email_confirm: true,
    }),
  );
  viewerId = viewer.user.id;
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: viewerId, role: "viewer" }),
  );
  const impersonation = await workspace.admin.auth.admin.generateLink({
    type: "magiclink",
    email: viewer.user.email,
  });
  assert.ifError(impersonation.error);
  const { createClient } = await import("@supabase/supabase-js");
  const viewerClient = createClient(client.supabaseUrl, client.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await viewerClient.auth.verifyOtp({
    token_hash: impersonation.data.properties.hashed_token,
    type: "email",
  });
  assert.ifError(signedIn.error);
  const beforeViewer = await counts();
  const forbidden = await viewerClient.rpc("create_task_with_assignment", {
    p_tenant_id: tenantId,
    p_request_id: randomUUID(),
    p_task: values,
  });
  assert.equal(forbidden.error?.code, "42501");
  assert.deepEqual(await counts(), beforeViewer);
  console.log("PASS viewer cannot invoke composite task creation");

  await data(client.from("task_assignments").delete().eq("id", assignment.id));
  const afterRemoval = await data(create(values, requestId));
  assert.equal(afterRemoval.taskId, task.id);
  assert.equal(afterRemoval.assignmentId, null);
  await data(client.from("tasks").delete().eq("id", task.id));
  const deletedRetry = await create(values, requestId);
  assert.equal(deletedRetry.error?.code, "PT409");
  console.log(
    "PASS receipts do not block assignment/task deletion or recreate a deleted task on retry",
  );
} finally {
  if (viewerId) {
    await data(
      client.from("tenant_memberships").delete().eq("tenant_id", tenantId).eq("user_id", viewerId),
    );
    const removed = await workspace.admin.auth.admin.deleteUser(viewerId);
    assert.ifError(removed.error);
  }
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
}
