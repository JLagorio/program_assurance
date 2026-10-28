/** Isolated review/citation security, concurrency and exact retry regression. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { randomUUID, createHash } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";
const workspace = await localWorkspace("assurance-review");
const { client, tenantId } = workspace;
let outsider;
let joined = false;
const storedPaths = [];
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
const run = (command, id = randomUUID(), db = client, tenant = tenantId) =>
  db.rpc("command_assurance_review", { p_tenant_id: tenant, p_request_id: id, p_command: command });
try {
  const program = await insert("programs", { code: "REVIEW", name: "Review regression" });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-REVIEW",
  });
  const target = { kind: "requirement", recordId: requirement.id };
  const create = {
    operation: "create-thread",
    target,
    subject: "Verify the evidence basis",
    body: "Please confirm the cited passage.",
  };
  const requestId = randomUUID();
  const [first, retry] = await Promise.all([
    data(run(create, requestId)),
    data(run(create, requestId)),
  ]);
  assert.deepEqual(first, retry, "Concurrent exact retries share one result");
  await refuse(run({ ...create, body: "Changed payload" }, requestId), "PT409");
  await refuse(run({ ...create, created_by: randomUUID() }), "23514");
  const stored = await data(
    client.from("assurance_review_threads").select().eq("id", first.threadId).single(),
  );
  assert.equal(stored.created_by, workspace.userId);
  assert.equal(stored.program_id, program.id);
  assert.equal(
    (await data(client.from("assurance_review_messages").select().eq("thread_id", first.threadId)))
      .length,
    1,
  );
  const reply = await data(
    run({
      operation: "reply",
      threadId: first.threadId,
      parentId: first.messageId,
      body: "Confirmed against the signed version.",
    }),
  );
  assert.equal(reply.revision, 2);
  await refuse(
    run({
      operation: "set-status",
      threadId: first.threadId,
      expectedRevision: 1,
      status: "resolved",
    }),
    "PT409",
  );
  const statusRequest = randomUUID();
  const resolve = {
    operation: "set-status",
    threadId: first.threadId,
    expectedRevision: 2,
    status: "resolved",
  };
  const resolved = await data(run(resolve, statusRequest));
  assert.equal(resolved.revision, 3);
  assert.deepEqual(await data(run(resolve, statusRequest)), resolved);
  const race = await Promise.all([
    run({ operation: "set-status", threadId: first.threadId, expectedRevision: 3, status: "open" }),
    run({ operation: "set-status", threadId: first.threadId, expectedRevision: 3, status: "open" }),
  ]);
  assert.equal(
    race.filter((result) => !result.error).length,
    1,
    "One of two competing transitions wins",
  );
  assert.equal(race.find((result) => result.error).error.code, "PT409");
  const second = await data(run({ ...create, subject: "Another thread" }));
  await refuse(
    run({
      operation: "reply",
      threadId: second.threadId,
      parentId: first.messageId,
      body: "Wrong parent",
    }),
    "23514",
  );
  await refuse(
    client.from("assurance_review_threads").update({ status: "resolved" }).eq("id", first.threadId),
    "42501",
  );
  await refuse(
    client.from("assurance_review_messages").insert({
      tenant_id: tenantId,
      thread_id: first.threadId,
      body: "forged",
      created_by: workspace.userId,
      author_name: "Forged author",
    }),
    "42501",
  );
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Signed test report",
    artifact_kind: "document",
    source_uri: "https://example.test/report.pdf?edition=1",
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    sha256: "a".repeat(64),
    state: "draft",
  });
  const citation = {
    operation: "create-citation",
    target,
    evidenceVersionId: version.id,
    expectedEvidenceRevision: version.revision,
    passage: "All monitored events shall be retained.",
    page: 3,
    rectangle: { x: 0.1, y: 0.2, width: 0.5, height: 0.1 },
  };
  const citationRequest = randomUUID();
  const cited = await data(run(citation, citationRequest));
  assert.deepEqual(await data(run(citation, citationRequest)), cited);
  let saved = await data(
    client.from("assurance_citations").select().eq("id", cited.citationId).single(),
  );
  assert.equal(saved.evidence_sha256, "a".repeat(64));
  assert.equal(saved.source_uri, artifact.source_uri);
  assert.deepEqual(saved.target, target);
  await data(
    client
      .from("evidence_versions")
      .update({ sha256: "b".repeat(64), revision: version.revision + 1 })
      .eq("id", version.id),
  );
  saved = await data(
    client.from("assurance_citations").select().eq("id", cited.citationId).single(),
  );
  assert.equal(
    saved.evidence_sha256,
    "a".repeat(64),
    "Citation preserves the original identity snapshot",
  );
  await refuse(run(citation), "PT409");
  for (const patch of [
    { page: null },
    { page: 0 },
    { rectangle: { x: 0.9, y: 0, width: 0.2, height: 0.1 } },
    { source_uri: "https://forged.test" },
  ])
    await refuse(run({ ...citation, expectedEvidenceRevision: 2, ...patch }), "23514");
  const unverified = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 2,
    state: "draft",
  });
  await refuse(
    run({ ...citation, evidenceVersionId: unverified.id, expectedEvidenceRevision: 1 }),
    "23514",
  );
  const storedArtifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Uploaded report",
    artifact_kind: "document",
  });
  const storedId = randomUUID();
  const storedPath = `${tenantId}/${storedArtifact.id}/${storedId}/report.txt`;
  const bytes = Buffer.from("The stored report is the citation source.");
  const digest = createHash("sha256").update(bytes).digest("hex");
  await insert("evidence_versions", {
    id: storedId,
    artifact_id: storedArtifact.id,
    version_number: 1,
    state: "draft",
    storage_object_name: storedPath,
  });
  const uploaded = await data(
    client.storage.from("evidence").upload(storedPath, bytes, { contentType: "text/plain" }),
  );
  storedPaths.push(storedPath);
  const storedVersion = await data(
    client
      .from("evidence_versions")
      .update({ storage_object_id: uploaded.id, sha256: digest, revision: 2 })
      .eq("id", storedId)
      .select()
      .single(),
  );
  const storedResult = await data(
    run({
      ...citation,
      evidenceVersionId: storedId,
      expectedEvidenceRevision: storedVersion.revision,
    }),
  );
  const captured = await data(
    client.from("assurance_citations").select().eq("id", storedResult.citationId).single(),
  );
  assert.equal(captured.source_uri, `storage://evidence/${storedPath}`);
  assert.equal(captured.source_storage_object_id, uploaded.id);
  assert.equal(captured.source_storage_object_name, storedPath);
  assert.equal(captured.evidence_sha256, digest);
  assert.equal(
    await (await data(client.storage.from("evidence").download(storedPath))).text(),
    bytes.toString(),
  );
  await refuse(
    client.storage
      .from("evidence")
      .update(storedPath, Buffer.from("mutated"), { contentType: "text/plain" }),
  );
  // Storage DELETE may return success with no matching RLS-visible rows; bytes must survive.
  await client.storage.from("evidence").remove([storedPath]);
  assert.equal(
    await (await data(client.storage.from("evidence").download(storedPath))).text(),
    bytes.toString(),
  );
  // Hold a newly captured citation uncommitted while a genuine Storage overwrite
  // starts. It must wait, then reject after the citation commits, with no byte change.
  const raceId = randomUUID();
  const racePath = `${tenantId}/${storedArtifact.id}/${raceId}/concurrent.txt`;
  await insert("evidence_versions", {
    id: raceId,
    artifact_id: storedArtifact.id,
    version_number: 2,
    state: "draft",
    storage_object_name: racePath,
  });
  const raceUpload = await data(
    client.storage.from("evidence").upload(racePath, bytes, { contentType: "text/plain" }),
  );
  storedPaths.push(racePath);
  await data(
    client
      .from("evidence_versions")
      .update({ storage_object_id: raceUpload.id, sha256: digest, revision: 2 })
      .eq("id", raceId),
  );
  const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const lock = spawn(
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
    { env: workspace.dockerEnv, stdio: ["pipe", "pipe", "pipe"] },
  );
  let output = "",
    errors = "";
  lock.stderr.on("data", (chunk) => {
    errors += chunk.toString();
  });
  const closed = new Promise((resolve, reject) => {
    lock.once("error", reject);
    lock.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Citation lock transaction failed: ${errors}`)),
    );
  });
  const ready = new Promise((resolve, reject) => {
    lock.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes("CITATION_LOCK_HELD")) resolve();
    });
    closed.catch(reject);
  });
  const lockCommand = { ...citation, evidenceVersionId: raceId, expectedEvidenceRevision: 2 };
  lock.stdin.write(`begin;
set local statement_timeout='15s';
select set_config('request.jwt.claim.sub',${sqlLiteral(workspace.userId)},true);
select public.command_assurance_review(${sqlLiteral(tenantId)}::uuid,${sqlLiteral(randomUUID())}::uuid,${sqlLiteral(JSON.stringify(lockCommand))}::jsonb);
\\echo CITATION_LOCK_HELD
`);
  try {
    await Promise.race([
      ready,
      wait(10000).then(() => {
        throw new Error("Citation lock did not become ready");
      }),
    ]);
    let writeSettled = false;
    const overwrite = client.storage
      .from("evidence")
      .update(racePath, Buffer.from("race mutation"), { contentType: "text/plain" })
      .then((result) => {
        writeSettled = true;
        return result;
      });
    await wait(250);
    assert.equal(
      writeSettled,
      false,
      "Storage overwrite waits for the active citation transaction",
    );
    lock.stdin.end("commit;\n");
    await closed;
    await refuse(overwrite);
    assert.equal(
      await (await data(client.storage.from("evidence").download(racePath))).text(),
      bytes.toString(),
    );
  } finally {
    if (!lock.stdin.writableEnded) lock.stdin.end("rollback;\n");
    await closed;
  }
  const savedWorkbook = await data(
    client.rpc("save_assurance_workbook", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_request_id: randomUUID(),
      p_workbook_id: randomUUID(),
      p_expected_revision: 0,
      p_name: "Review workbook",
      p_document: {
        version: 1,
        analysis: {
          version: 1,
          id: "analysis-doc",
          name: "Analysis",
          revision: 0,
          sheets: [
            {
              id: "analysis",
              name: "Analysis",
              mode: "freeform",
              rows: [{ id: "r1" }],
              columns: [{ id: "c1", name: "A" }],
              cells: {},
              frozenRows: 0,
              frozenColumns: 0,
            },
          ],
        },
      },
    }),
  );
  const cell = {
    kind: "cell",
    programId: program.id,
    workbookId: savedWorkbook.id,
    sheetId: "analysis",
    rowId: "r1",
    columnId: "c1",
  };
  await data(run({ ...create, target: cell }));
  await refuse(run({ ...create, target: { ...cell, rowId: "missing" } }), "23514");
  await data(
    run({
      ...create,
      target: { ...cell, sheetId: "requirements", rowId: requirement.id, columnId: "code" },
    }),
  );
  outsider = await localWorkspace("assurance-review-outsider");
  await refuse(outsider.client.storage.from("evidence").download(storedPath));
  assert.deepEqual(
    await data(outsider.client.from("assurance_review_threads").select().eq("tenant_id", tenantId)),
    [],
  );
  await refuse(run(create, randomUUID(), outsider.client), "42501");
  await refuse(
    run({ ...create, target: { kind: "requirement", recordId: randomUUID() } }),
    "23514",
  );
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  joined = true;
  assert.equal(
    await (await data(outsider.client.storage.from("evidence").download(storedPath))).text(),
    bytes.toString(),
    "A workspace viewer can read the captured file",
  );
  assert.ok(
    (
      await data(
        outsider.client.from("assurance_review_threads").select().eq("tenant_id", tenantId),
      )
    ).length > 0,
  );
  await refuse(run(create, randomUUID(), outsider.client), "42501");
  await refuse(run(citation, randomUUID(), outsider.client), "42501");
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "editor" })
      .eq("tenant_id", tenantId)
      .eq("user_id", outsider.userId),
  );
  await refuse(run(create, requestId, outsider.client), "PT409");
  await data(
    run(
      { operation: "reply", threadId: first.threadId, body: "Another authorized reviewer." },
      randomUUID(),
      outsider.client,
    ),
  );
  await outsider.client.auth.signOut();
  await refuse(run(create, randomUUID(), outsider.client), "42501");
  console.log(
    "PASS: authored threads/replies, status history/CAS race, exact concurrent retry, immutable citations/hash snapshots, private stored object capture/download/write denial and concurrent capture/write serialization, page/rectangle guards, saved cell targets, raw-table write denial, tenant/viewer/anonymous boundaries.",
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
  if (storedPaths.length) await data(workspace.admin.storage.from("evidence").remove(storedPaths));
  if (outsider) await outsider.cleanup();
}
