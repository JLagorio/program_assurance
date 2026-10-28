/** Exact passage/edit anchors and their source snapshot are server validated. */
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { evidenceAssessmentFixture } from "./tests/evidence-assessment-fixture.mjs";
const w = await localWorkspace("evidence-anchors");
const { client, tenantId } = w;
let outsider;
const paths = [];
const data = async (q) => {
  const r = await q;
  assert.ifError(r.error);
  return r.data;
};
const insert = (table, value) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...value })
      .select()
      .single(),
  );
const run = (target, id = randomUUID(), db = client) =>
  db.rpc("command_assurance_review", {
    p_tenant_id: tenantId,
    p_request_id: id,
    p_command: {
      operation: "create-thread",
      target,
      subject: "Review anchored source",
      body: "Confirm this exact source.",
    },
  });
const refuse = async (q) =>
  assert.ok((await q).error, "Invalid/unauthorized target must be rejected");
try {
  const program = await insert("programs", { code: "ANCHORS", name: "Exact anchor checks" });
  const req = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-ANCHOR",
  });
  const content = await insert("requirement_revisions", {
    engineering_requirement_id: req.id,
    version_number: 1,
    title: "Original title",
    statement: "First recorded line.\nSecond recorded line.",
    requirement_type: "security",
    acceptance_criteria: "Verify source evidence.",
  });
  const event = await data(
    client.from("activity_events").select().eq("requirement_revision_id", content.id).single(),
  );
  const target = {
    kind: "requirement-change",
    recordId: req.id,
    editId: event.id,
    field: "statement",
    side: "after",
    startLine: 1,
    endLine: 2,
  };
  const request = randomUUID();
  const created = await data(run(target, request));
  assert.deepEqual(await data(run(target, request)), created);
  const captured = await data(
    client.from("assurance_review_threads").select().eq("id", created.threadId).single(),
  );
  assert.equal(captured.target_context.value, content.statement);
  assert.equal(captured.target_context.selectedText, content.statement);
  for (const patch of [
    { recordId: randomUUID() },
    { editId: randomUUID() },
    { field: "invented" },
    { side: "future" },
    { startLine: 3, endLine: 4 },
    { startLine: 2, endLine: 1 },
    { startLine: 1.5 },
  ])
    await refuse(run({ ...target, ...patch }));
  // Match Diff's CRLF/CR normalization and removal of a terminal empty line.
  const normalizedReq = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-NORMALIZED",
  });
  const normalized = await insert("requirement_revisions", {
    engineering_requirement_id: normalizedReq.id,
    version_number: 1,
    title: "Normalized lines",
    statement: "First\r\nSecond\rThird\n",
    requirement_type: "security",
    acceptance_criteria: "Verify source evidence.",
  });
  const normalizedEvent = await data(
    client.from("activity_events").select().eq("requirement_revision_id", normalized.id).single(),
  );
  const normalizedTarget = {
    ...target,
    recordId: normalizedReq.id,
    editId: normalizedEvent.id,
    startLine: 2,
    endLine: 3,
  };
  const normalizedThread = await data(run(normalizedTarget));
  const normalizedContext = await data(
    client
      .from("assurance_review_threads")
      .select("target_context")
      .eq("id", normalizedThread.threadId)
      .single(),
  );
  assert.equal(normalizedContext.target_context.selectedText, "Second\nThird");
  await refuse(run({ ...normalizedTarget, endLine: 4 }));
  const broad = await data(run({ kind: "requirement", recordId: req.id }));
  await data(
    client
      .from("requirement_revisions")
      .update({ statement: "Changed later.", revision: content.revision + 1 })
      .eq("id", content.id),
  );
  const original = await data(
    client.from("assurance_review_threads").select().eq("id", broad.threadId).single(),
  );
  assert.equal(original.target_context.statement, content.statement);
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Pinned source file",
    artifact_kind: "document",
  });
  const id = randomUUID(),
    path = `${tenantId}/${artifact.id}/${id}/source.pdf`,
    bytes = Buffer.from("%PDF-1.4 immutable source");
  paths.push(path);
  await insert("evidence_versions", {
    id,
    artifact_id: artifact.id,
    version_number: 1,
    state: "draft",
    storage_object_name: path,
  });
  const uploaded = await data(
    client.storage.from("evidence").upload(path, bytes, { contentType: "application/pdf" }),
  );
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const version = await data(
    client
      .from("evidence_versions")
      .update({ storage_object_id: uploaded.id, sha256, revision: 2 })
      .eq("id", id)
      .select()
      .single(),
  );
  const passage = {
    kind: "passage",
    recordId: id,
    sha256,
    page: 2,
    passage: "Selected source.",
    rectangle: { x: 0.1, y: 0.2, width: 0.5, height: 0.1 },
  };
  const anchored = await data(run(passage));
  const saved = await data(
    client.from("assurance_review_threads").select().eq("id", anchored.threadId).single(),
  );
  assert.equal(saved.target_context.sourceStorageObjectName, path);
  for (const patch of [
    { sha256: "0".repeat(64) },
    { page: 0 },
    { rectangle: { x: 0.9, y: 0, width: 0.2, height: 0.1 } },
    { extra: "forged" },
  ])
    await refuse(run({ ...passage, ...patch }));
  await refuse(
    client.storage
      .from("evidence")
      .update(path, Buffer.from("changed"), { contentType: "application/pdf" }),
  );
  const cite = await data(
    client.rpc("command_assurance_review", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        operation: "create-citation",
        target: { kind: "requirement", recordId: req.id },
        evidenceVersionId: id,
        expectedEvidenceRevision: version.revision,
        passage: "Selected source.",
        page: 2,
        rectangle: passage.rectangle,
      },
    }),
  );
  const citationThread = await data(run({ kind: "citation", recordId: cite.citationId }));
  const citationContext = await data(
    client.from("assurance_review_threads").select().eq("id", citationThread.threadId).single(),
  );
  assert.equal(citationContext.target_context.passage, "Selected source.");
  assert.equal(citationContext.target_context.sha256, sha256);
  const finding = await evidenceAssessmentFixture(client, tenantId, program.id);
  const findingTarget = { kind: "assessment-finding", recordId: finding.id };
  const findingThread = await data(run(findingTarget));
  assert.equal(
    (
      await data(
        client
          .from("assurance_review_threads")
          .select("program_id")
          .eq("id", findingThread.threadId)
          .single(),
      )
    ).program_id,
    program.id,
  );
  const findingCitation = await data(
    client.rpc("command_assurance_review", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        operation: "create-citation",
        target: findingTarget,
        evidenceVersionId: id,
        expectedEvidenceRevision: version.revision,
        passage: "Assessment source.",
        page: 2,
        rectangle: passage.rectangle,
      },
    }),
  );
  assert.equal(
    (
      await data(
        client
          .from("assurance_citations")
          .select("program_id")
          .eq("id", findingCitation.citationId)
          .single(),
      )
    ).program_id,
    program.id,
  );
  outsider = await localWorkspace("evidence-anchor-outsider");
  await refuse(run(passage, randomUUID(), outsider.client));
  await refuse(run({ kind: "citation", recordId: cite.citationId }, randomUUID(), outsider.client));
  assert.deepEqual(
    await data(outsider.client.from("assurance_review_threads").select().eq("tenant_id", tenantId)),
    [],
  );
  console.log(
    "PASS: exact edit/line ownership and bounds, immutable captured requirement context, exact citation/passage targets, private byte pinning, retries and cross-tenant denial.",
  );
} finally {
  await w.cleanup();
  if (paths.length) await data(w.admin.storage.from("evidence").remove(paths));
  if (outsider) await outsider.cleanup();
}
