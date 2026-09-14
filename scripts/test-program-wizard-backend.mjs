/** Transaction, authorization, and reference-integrity checks for the real wizard RPC. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("wizard-backend");
let outsider;
const { client, tenantId, userId } = workspace;
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const rows = async (table, filters = {}) => {
  let query = client.from(table).select("*").eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  return data(query);
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const create = (draft, target = tenantId) =>
  client.rpc("create_program_wizard", { p_tenant_id: target, p_draft: draft });
const changed = (base, code) => ({
  ...clone(base),
  requestId: randomUUID(),
  code,
  systems: base.systems.map((system, index) => ({
    ...clone(system),
    key: randomUUID(),
    code: `${code}-${index + 1}`,
  })),
});
const countedTables = [
  "programs",
  "systems",
  "scopes",
  "composition_nodes",
  "program_role_assignments",
  "program_reference_choices",
  "oscal_documents",
  "oscal_document_revisions",
  "profiles",
  "profile_revisions",
  "profile_resolutions",
  "profile_rules",
  "profile_imports",
  "profile_parameter_settings",
  "profile_parameter_values",
  "selected_controls",
  "selection_provenance",
  "ssp_revisions",
  "implemented_requirements",
  "program_wizard_requests",
];
const counts = async () =>
  Object.fromEntries(
    await Promise.all(
      countedTables.map(async (table) => {
        const result = await client
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);
        assert.equal(
          result.error,
          null,
          `${table} count failed (${result.status}): ${JSON.stringify(result.error)}`,
        );
        return [table, result.count];
      }),
    ),
  );
const rejectsWithoutWrites = async (draft, expected, target = tenantId) => {
  const before = await counts();
  const result = await create(draft, target);
  assert.ok(result.error, "Invalid request unexpectedly succeeded");
  assert.equal(result.error.code, expected, result.error.message);
  assert.deepEqual(await counts(), before, "Rejected command left partial records");
};

try {
  const profile = await data(
    client
      .from("profile_revisions")
      .select("*")
      .eq("state", "published")
      .ilike("title", "%Low%")
      .limit(1)
      .single(),
  );
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select("*")
      .eq("profile_revision_id", profile.id)
      .eq("state", "published")
      .single(),
  );
  const imported = await data(
    client.from("profile_imports").select("*").eq("profile_revision_id", profile.id).single(),
  );
  const base = await data(
    client
      .from("selected_controls")
      .select("control_id")
      .eq("profile_resolution_id", resolution.id),
  );
  const baseIds = base.map((row) => row.control_id);
  const parameter = await data(
    client
      .from("parameters")
      .select("*")
      .eq("catalog_revision_id", imported.catalog_revision_id)
      .in("control_id", baseIds)
      .eq("has_selection", false)
      .limit(1)
      .single(),
  );
  const catalogControls = await data(
    client
      .from("controls")
      .select("*")
      .eq("catalog_revision_id", imported.catalog_revision_id)
      .eq("status", "active")
      .limit(1000),
  );
  const included = catalogControls.find((control) => !baseIds.includes(control.id));
  assert.ok(included, "Test catalog needs an active control outside its Low baseline");
  const excluded = baseIds.find((id) => id !== parameter.control_id);
  const party = await data(
    client
      .from("parties")
      .select("*")
      .eq("auth_user_id", userId)
      .eq("tenant_id", tenantId)
      .single(),
  );
  const parentKey = randomUUID();
  const system = {
    key: randomUUID(),
    code: "WIZARD-SYSTEM-1",
    name: "Explicitly categorized test system",
    description: "",
    type: "information_system",
    ownerPartyId: party.id,
    confidentiality: "low",
    integrity: "moderate",
    availability: "high",
    categorizationRationale: "Explicit test assessment of separate CIA impacts.",
    profileResolutionId: resolution.id,
    subsystems: [
      {
        key: randomUUID(),
        parentKey,
        code: "CHILD",
        name: "Child subsystem",
        description: "",
        type: "subsystem",
      },
      {
        key: parentKey,
        parentKey: null,
        code: "PARENT",
        name: "Parent subsystem",
        description: "",
        type: "subsystem",
      },
    ],
    tailoring: [
      { controlId: included.id, action: "include", rationale: "Explicit additional test control." },
      { controlId: excluded, action: "exclude", rationale: "Explicit test boundary exclusion." },
    ],
    parameters: [
      {
        parameterId: parameter.id,
        values: ["  90 days  "],
        rationale: "Explicit test parameter value.",
      },
    ],
  };
  const draft = {
    requestId: randomUUID(),
    code: "WIZARD-PROGRAM",
    name: "Atomic wizard integration test",
    description: "",
    sponsorPartyId: null,
    startsOn: null,
    endsOn: null,
    roles: [{ partyId: party.id, role: "program_manager" }],
    catalogRevisionId: imported.catalog_revision_id,
    availableProfileResolutionIds: [resolution.id],
    systems: [
      system,
      {
        ...clone(system),
        key: randomUUID(),
        code: "WIZARD-SYSTEM-2",
        name: "Parameter-only variation",
        ownerPartyId: null,
        subsystems: [],
        parameters: [
          { parameterId: parameter.id, values: ["180 days"], rationale: "Different test period." },
        ],
      },
    ],
  };
  const created = await data(create(draft));
  assert.equal(created.systemIds.length, 2);
  assert.deepEqual(
    await data(create(draft)),
    created,
    "Identical request retry must be idempotent",
  );
  assert.equal((await rows("programs")).length, 1);
  assert.equal((await rows("program_reference_choices")).length, 1);
  assert.equal((await rows("program_role_assignments")).length, 1);
  const systems = await rows("systems");
  assert.equal(systems.length, 2);
  assert.ok(
    systems.every(
      (row) =>
        row.confidentiality_impact === "low" &&
        row.integrity_impact === "moderate" &&
        row.availability_impact === "high",
    ),
  );
  assert.equal(systems.find((row) => row.code === "WIZARD-SYSTEM-2").system_owner_party_id, null);
  const nodes = await rows("composition_nodes");
  assert.equal(nodes.length, 2);
  assert.equal(
    nodes.find((row) => row.code === "CHILD").parent_id,
    nodes.find((row) => row.code === "PARENT").id,
  );
  const authoredResolutions = await rows("profile_resolutions");
  assert.equal(authoredResolutions.length, 2);
  assert.ok(authoredResolutions.every((row) => row.state === "draft"));
  assert.notEqual(
    authoredResolutions[0].output_sha256,
    authoredResolutions[1].output_sha256,
    "Parameter-only changes must change the resolution output hash",
  );
  for (const authored of authoredResolutions) {
    const selected = await rows("selected_controls", { profile_resolution_id: authored.id });
    assert.equal(selected.length, baseIds.length);
    assert.ok(selected.some((row) => row.control_id === included.id));
    assert.ok(!selected.some((row) => row.control_id === excluded));
  }
  const parameterValues = await rows("profile_parameter_values");
  assert.ok(parameterValues.some((row) => row.value === "90 days"));
  assert.ok(!parameterValues.some((row) => row.value === "  90 days  "));
  const ssps = await rows("ssp_revisions");
  assert.equal(ssps.length, 2);
  assert.ok(ssps.every((row) => row.state === "draft"));
  const requirements = await rows("implemented_requirements");
  assert.equal(requirements.length, baseIds.length * 2);
  assert.ok(
    requirements.every(
      (row) => row.implementation_status === "planned" && row.description === null,
    ),
  );
  assert.equal((await rows("configuration_baselines")).length, 0);
  assert.equal((await rows("authorization_decisions")).length, 0);
  await rejectsWithoutWrites({ ...draft, name: "Changed retry" }, "PT409");
  await rejectsWithoutWrites(changed(draft, draft.code), "23505");
  const unknownControl = changed(draft, "UNKNOWN-CONTROL");
  unknownControl.systems[1].tailoring[0].controlId = randomUUID();
  await rejectsWithoutWrites(unknownControl, "23514");
  const missingCategory = changed(draft, "MISSING-CIA");
  missingCategory.systems[1].integrity = null;
  await rejectsWithoutWrites(missingCategory, "23514");
  const cyclic = changed(draft, "CYCLIC");
  cyclic.systems[0].subsystems[1].parentKey = cyclic.systems[0].subsystems[0].key;
  await rejectsWithoutWrites(cyclic, "23514");
  outsider = await localWorkspace("wizard-outsider");
  const foreignParty = await data(
    outsider.client.from("parties").select("id").eq("auth_user_id", outsider.userId).single(),
  );
  const foreignOwner = changed(draft, "FOREIGN-OWNER");
  foreignOwner.systems[1].ownerPartyId = foreignParty.id;
  await rejectsWithoutWrites(foreignOwner, "23503");
  await rejectsWithoutWrites(changed(draft, "OUTSIDER"), "42501", outsider.tenantId);
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "viewer" }),
  );
  const beforeViewer = await counts();
  const viewerResult = await outsider.client.rpc("create_program_wizard", {
    p_tenant_id: tenantId,
    p_draft: changed(draft, "VIEWER"),
  });
  assert.equal(viewerResult.error?.code, "42501", viewerResult.error?.message);
  assert.deepEqual(await counts(), beforeViewer, "Viewer command left partial records");
  const program = (await rows("programs"))[0];
  const firstUpdate = await data(
    client
      .from("programs")
      .update({ name: "CAS updated program", revision: program.revision + 1 })
      .eq("id", program.id)
      .eq("revision", program.revision)
      .select(),
  );
  assert.equal(firstUpdate.length, 1);
  const staleUpdate = await data(
    client
      .from("programs")
      .update({ name: "Stale overwrite", revision: program.revision + 1 })
      .eq("id", program.id)
      .eq("revision", program.revision)
      .select(),
  );
  assert.equal(staleUpdate.length, 0);
  const racing = changed(draft, "RACING-CODE");
  const race = await Promise.all([create(racing), create({ ...racing, requestId: randomUUID() })]);
  assert.equal(race.filter((result) => !result.error).length, 1);
  assert.equal(race.find((result) => result.error).error.code, "23505");
  console.log(
    "Program wizard backend passed: atomic creation/rejection, idempotency, explicit CIA and roles, hierarchical composition, tailoring, parameter hashes, tenant permissions, CAS, and concurrent duplicate codes.",
  );
} finally {
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
  console.log("Disposable wizard accounts and workspace records cleaned.");
}
