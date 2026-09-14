/** Atomic artifact + draft version creation, tenant authorization and safe retry checks. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("evidence-create");
const { client, tenantId } = workspace;
let outsider;
let joined = false;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
async function counts() {
  return Object.fromEntries(
    await Promise.all(
      ["evidence_artifacts", "evidence_versions"].map(async (table) => {
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
const create = (values, requestId = randomUUID(), targetTenant = tenantId, actor = client) =>
  actor.rpc("create_evidence_with_version", {
    p_tenant_id: targetTenant,
    p_request_id: requestId,
    p_evidence: values,
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
      .insert({
        tenant_id: tenantId,
        code: "EVIDENCE-CREATE-1",
        name: "Evidence creation validation",
      })
      .select()
      .single(),
  );
  const otherProgram = await data(
    client
      .from("programs")
      .insert({
        tenant_id: tenantId,
        code: "EVIDENCE-CREATE-2",
        name: "Other evidence validation program",
      })
      .select()
      .single(),
  );
  const system = await data(
    client
      .from("systems")
      .insert({
        tenant_id: tenantId,
        program_id: program.id,
        code: "EVIDENCE-SYSTEM-1",
        name: "Evidence validation system",
        system_type: "information_system",
      })
      .select()
      .single(),
  );
  const otherSystem = await data(
    client
      .from("systems")
      .insert({
        tenant_id: tenantId,
        program_id: otherProgram.id,
        code: "EVIDENCE-SYSTEM-2",
        name: "Other evidence validation system",
        system_type: "information_system",
      })
      .select()
      .single(),
  );
  const scope = await data(
    client
      .from("scopes")
      .insert({
        tenant_id: tenantId,
        system_id: system.id,
        code: "EVIDENCE-SCOPE-1",
        name: "Evidence validation scope",
      })
      .select()
      .single(),
  );
  const otherScope = await data(
    client
      .from("scopes")
      .insert({
        tenant_id: tenantId,
        system_id: otherSystem.id,
        code: "EVIDENCE-SCOPE-2",
        name: "Other program scope",
      })
      .select()
      .single(),
  );
  const owner = await data(
    client
      .from("parties")
      .select()
      .eq("tenant_id", tenantId)
      .eq("auth_user_id", workspace.userId)
      .single(),
  );
  const values = {
    title: "Access review export",
    artifactKind: "dataset",
    programId: program.id,
    scopeId: scope.id,
    ownerPartyId: owner.id,
    description: "A captured account review export.",
    externalUri: "https://example.test/review/export",
    collectedAt: "2026-09-12T15:30:00.000Z",
    provenance: "Exported by the named owner during the account review.",
  };
  const requestId = randomUUID();
  const created = await data(create(values, requestId));
  const artifact = await data(
    client.from("evidence_artifacts").select().eq("id", created.artifactId).single(),
  );
  const version = await data(
    client.from("evidence_versions").select().eq("id", created.versionId).single(),
  );
  assert.equal(artifact.title, values.title);
  assert.equal(artifact.artifact_kind, values.artifactKind);
  assert.equal(artifact.program_id, program.id);
  assert.equal(artifact.scope_id, scope.id);
  assert.equal(artifact.owner_party_id, owner.id);
  assert.equal(artifact.description, values.description);
  assert.equal(artifact.source_uri, values.externalUri);
  assert.equal(artifact.created_by, workspace.userId);
  assert.equal(version.artifact_id, artifact.id);
  assert.equal(version.version_number, 1);
  assert.equal(version.state, "draft");
  assert.equal(version.external_uri, values.externalUri);
  assert.equal(version.provenance, values.provenance);
  assert.equal(new Date(version.collected_at).toISOString(), values.collectedAt);
  assert.equal(version.created_by, workspace.userId);
  for (const field of [
    "published_at",
    "published_by_party_id",
    "media_type",
    "byte_size",
    "sha256",
    "storage_object_name",
    "storage_object_id",
    "expires_at",
  ])
    assert.equal(version[field], null, field);
  assert.deepEqual(await data(create(values, requestId)), created);
  assert.deepEqual(await counts(), { evidence_artifacts: 1, evidence_versions: 1 });
  const changed = await create({ ...values, title: "Different payload" }, requestId);
  assert.equal(changed.error?.code, "PT409");
  console.log(
    "PASS artifact + initial draft version, actual metadata, no invented upload/publication, identical retry",
  );

  const concurrentId = randomUUID();
  const concurrent = await Promise.all([
    create({ ...values, title: "Concurrent evidence" }, concurrentId),
    create({ ...values, title: "Concurrent evidence" }, concurrentId),
  ]);
  concurrent.forEach((result) => assert.ifError(result.error));
  assert.deepEqual(concurrent[0].data, concurrent[1].data);
  assert.deepEqual(await counts(), { evidence_artifacts: 2, evidence_versions: 2 });
  const minimal = {
    title: "An intentionally unscoped artifact",
    artifactKind: "document",
    programId: null,
    scopeId: null,
    ownerPartyId: null,
    description: "",
    externalUri: "",
    collectedAt: null,
    provenance: "",
  };
  const plainResult = await data(create(minimal));
  const plain = await data(
    client.from("evidence_artifacts").select().eq("id", plainResult.artifactId).single(),
  );
  const plainVersion = await data(
    client.from("evidence_versions").select().eq("id", plainResult.versionId).single(),
  );
  for (const field of ["program_id", "scope_id", "owner_party_id", "description", "source_uri"])
    assert.equal(plain[field], null, field);
  for (const field of ["external_uri", "collected_at", "provenance"])
    assert.equal(plainVersion[field], null, field);
  console.log("PASS concurrent retry creates one pair; optional business values remain null");

  await reject({ ...values, title: " " });
  await reject({ ...values, artifactKind: "invented_kind" });
  await reject({ ...values, description: "x".repeat(10001) });
  await reject({ ...values, provenance: "x".repeat(10001) });
  await reject({ ...values, scopeId: otherScope.id });
  await reject({ ...values, programId: null });
  await reject({ ...values, ownerPartyId: randomUUID() });
  await reject({ ...values, externalUri: "javascript:alert(1)" });
  await reject({ ...values, externalUri: "relative/file.txt" });
  await reject({ ...values, collectedAt: "2026-02-30T12:00:00Z" });
  await reject({ ...values, collectedAt: "2026-09-12T12:00:00" });
  await reject({ ...values, sha256: "0".repeat(64) });
  await reject({ ...values, state: "published" });
  outsider = await localWorkspace("evidence-outsider");
  const foreignProgram = await data(
    outsider.client
      .from("programs")
      .insert({
        tenant_id: outsider.tenantId,
        code: "FOREIGN-EVIDENCE",
        name: "Other tenant evidence validation",
      })
      .select()
      .single(),
  );
  const foreignOwner = await data(
    outsider.client
      .from("parties")
      .select()
      .eq("tenant_id", outsider.tenantId)
      .eq("auth_user_id", outsider.userId)
      .single(),
  );
  await reject({ ...values, programId: foreignProgram.id });
  await reject({ ...values, ownerPartyId: foreignOwner.id });
  await reject(values, "42501", outsider.tenantId);
  const forged = await client.from("evidence_create_requests").insert({
    id: randomUUID(),
    tenant_id: tenantId,
    artifact_id: artifact.id,
    version_id: version.id,
    created_by: workspace.userId,
    payload_sha256: "0".repeat(64),
  });
  assert.ok(forged.error);
  console.log(
    "PASS invalid metadata, wrong-program scope, cross-tenant references and private receipts",
  );

  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  joined = true;
  const beforeViewer = await counts();
  const forbidden = await create(values, randomUUID(), tenantId, outsider.client);
  assert.equal(forbidden.error?.code, "42501");
  assert.deepEqual(await counts(), beforeViewer);
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "editor" })
      .eq("tenant_id", tenantId)
      .eq("user_id", outsider.userId),
  );
  const otherActor = await create(values, requestId, tenantId, outsider.client);
  assert.equal(otherActor.error?.code, "PT409");
  assert.deepEqual(await counts(), beforeViewer);
  console.log("PASS viewer cannot create and another writer cannot reuse the creator's receipt");

  await data(client.from("evidence_versions").delete().eq("id", version.id));
  assert.equal((await create(values, requestId)).error?.code, "PT409");
  await data(client.from("evidence_artifacts").delete().eq("id", artifact.id));
  assert.equal((await create(values, requestId)).error?.code, "PT409");
  console.log("PASS deleting original records does not recreate them on an old request retry");
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
