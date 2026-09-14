/** Exact evidence pins, atomic relationship selection, retry and tenant boundaries. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("requirement-evidence");
const { client, tenantId } = workspace;
let outsider;
let joined = false;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values, actor = client, tenant = tenantId) =>
  data(
    actor
      .from(table)
      .insert({ tenant_id: tenant, ...values })
      .select()
      .single(),
  );
async function count() {
  const result = await client
    .from("requirement_evidence")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  assert.ifError(result.error);
  return result.count;
}
try {
  const program = await insert("programs", {
    code: "EVIDENCE-PINS",
    name: "Evidence linking validation",
  });
  const otherProgram = await insert("programs", {
    code: "OTHER-EVIDENCE-PINS",
    name: "Other program",
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-EVIDENCE",
  });
  const revision = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Evidence linking requirement",
    statement: "The test preserves exact evidence versions.",
    acceptance_criteria: "All selected links are committed together.",
    requirement_type: "security",
  });
  async function evidence(
    title,
    targetProgram,
    state = "published",
    actor = client,
    tenant = tenantId,
  ) {
    const artifact = await insert(
      "evidence_artifacts",
      { title, artifact_kind: "document", program_id: targetProgram },
      actor,
      tenant,
    );
    const version = await insert(
      "evidence_versions",
      {
        artifact_id: artifact.id,
        version_number: 1,
        state,
        external_uri: `https://example.test/evidence/${artifact.id}`,
      },
      actor,
      tenant,
    );
    return { artifact, version };
  }
  const first = await evidence("Pinned evidence", program.id);
  const newest = await insert("evidence_versions", {
    artifact_id: first.artifact.id,
    version_number: 2,
    state: "published",
    external_uri: "https://example.test/evidence/newest",
  });
  const unscoped = await evidence("Workspace evidence", null);
  const third = await evidence("Another eligible artifact", program.id);
  const draft = await evidence("Draft evidence", program.id, "draft");
  const wrongProgram = await evidence("Other program evidence", otherProgram.id);
  const link = (ids, options = {}) =>
    (options.actor ?? client).rpc("link_requirement_evidence", {
      p_tenant_id: options.tenant ?? tenantId,
      p_program_id: options.program ?? program.id,
      p_requirement_revision_id: options.revision ?? revision.id,
      p_evidence_version_ids: ids,
    });
  async function reject(ids, options = {}, code = "23514") {
    const before = await count();
    const result = await link(ids, options);
    assert.equal(result.error?.code, code, JSON.stringify(result));
    assert.equal(await count(), before);
  }

  const firstResult = await data(link([first.version.id, unscoped.version.id]));
  assert.equal(firstResult.linkIds.length, 2);
  assert.equal(await count(), 2);
  const firstLink = await data(
    client
      .from("requirement_evidence")
      .select()
      .eq("requirement_revision_id", revision.id)
      .eq("evidence_version_id", first.version.id)
      .single(),
  );
  assert.equal(firstLink.claim, null);
  assert.equal(firstLink.applicability_rationale, null);
  assert.equal(firstLink.created_by, workspace.userId);
  assert.notEqual(firstLink.evidence_version_id, newest.id);
  await data(
    client
      .from("requirement_evidence")
      .update({ claim: "An explicitly authored claim", revision: firstLink.revision + 1 })
      .eq("id", firstLink.id),
  );
  const retry = await data(link([unscoped.version.id, first.version.id, first.version.id]));
  assert.deepEqual(retry, firstResult);
  const unchanged = await data(
    client.from("requirement_evidence").select().eq("id", firstLink.id).single(),
  );
  assert.equal(unchanged.claim, "An explicitly authored claim");
  assert.equal(unchanged.revision, firstLink.revision + 1);
  assert.equal(await count(), 2);
  console.log(
    "PASS exact version pins, unscoped workspace evidence, multi-selection and retry preserve authored links",
  );

  await reject([third.version.id, wrongProgram.version.id]);
  await reject([third.version.id, draft.version.id]);
  await reject([third.version.id, randomUUID()]);
  await reject([third.version.id, null]);
  await reject([]);
  await reject(Array(501).fill(third.version.id));
  await reject([third.version.id], { program: otherProgram.id });
  await reject([third.version.id], { revision: randomUUID() });
  assert.equal(await count(), 2);
  console.log(
    "PASS mixed-invalid selections are atomic; draft, missing and wrong-program versions are rejected",
  );

  const concurrent = await Promise.all([link([third.version.id]), link([third.version.id])]);
  concurrent.forEach((result) => assert.ifError(result.error));
  assert.deepEqual(concurrent[0].data, concurrent[1].data);
  assert.equal(await count(), 3);
  console.log("PASS concurrent duplicate selections create one relationship");

  outsider = await localWorkspace("requirement-evidence-outsider");
  const foreign = await evidence(
    "Foreign workspace evidence",
    null,
    "published",
    outsider.client,
    outsider.tenantId,
  );
  await reject([newest.id, foreign.version.id]);
  await reject([first.version.id], { tenant: outsider.tenantId }, "42501");
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  joined = true;
  await reject([newest.id], { actor: outsider.client }, "42501");
  assert.equal(await count(), 3);
  console.log("PASS cross-tenant versions and viewer writes are rejected without partial links");

  await data(
    client
      .from("requirement_revisions")
      .update({ state: "published", revision: revision.revision + 1 })
      .eq("id", revision.id),
  );
  await data(link([newest.id]));
  await data(link([first.version.id]));
  assert.equal(await count(), 4);
  const immutableEvidence = await client
    .from("evidence_versions")
    .update({ external_uri: "https://example.test/changed", revision: first.version.revision + 1 })
    .eq("id", first.version.id);
  assert.equal(immutableEvidence.error?.code, "23514");
  console.log(
    "PASS current requirements remain linkable regardless of legacy state; published evidence versions remain immutable",
  );
} finally {
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
