#!/usr/bin/env node
/** Products: authoring guards, publishing, systems created from a configuration (wizard and post-create), lineage, and the OSCAL export. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("products-backend");
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
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
const update = (table, record, values) =>
  data(
    client
      .from(table)
      .update({ ...values, revision: record.revision + 1 })
      .eq("id", record.id)
      .eq("revision", record.revision)
      .select()
      .single(),
  );
const rpc = (name, params) => client.rpc(name, params);
const expectError = async (promise, pattern, code) => {
  const result = await promise;
  assert.ok(result.error, `Expected an error matching ${pattern}`);
  assert.match(result.error.message, pattern);
  if (code) assert.equal(result.error.code, code, result.error.message);
  return result.error;
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const create = (draft, target = tenantId) =>
  rpc("create_program_wizard", { p_tenant_id: target, p_draft: draft });
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
  "program_reference_choices",
  "ssp_revisions",
  "implemented_requirements",
  "system_components",
  "library_assignments",
  "library_assignment_targets",
  "component_contributions",
  "evidence_uses",
  "program_wizard_requests",
  "products",
  "product_revisions",
  "product_configurations",
  "product_elements",
  "product_configuration_elements",
];
const counts = async () =>
  Object.fromEntries(
    await Promise.all(
      countedTables.map(async (table) => {
        const result = await client
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);
        assert.equal(result.error, null, `${table} count failed: ${JSON.stringify(result.error)}`);
        return [table, result.count];
      }),
    ),
  );
const rejectsWithoutWrites = async (run, expected, pattern) => {
  const before = await counts();
  const result = await run();
  assert.ok(result.error, "Invalid request unexpectedly succeeded");
  assert.equal(result.error.code, expected, result.error.message);
  if (pattern) assert.match(result.error.message, pattern);
  assert.deepEqual(await counts(), before, "Rejected command left partial records");
};
const validateComponentDefinition = (() => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv.compile(
    JSON.parse(
      readFileSync(
        new URL("./tests/fixtures/oscal-component-definition-1.2.2.schema.json", import.meta.url),
        "utf8",
      ),
    ),
  );
})();

try {
  // Reference data: the published Low baseline and one active control outside it.
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
  const catalog = await data(
    client.from("catalog_revisions").select("*").eq("id", imported.catalog_revision_id).single(),
  );
  const catalogDocument = await data(
    client
      .from("oscal_document_revisions")
      .select("*")
      .eq("id", catalog.document_revision_id)
      .single(),
  );
  const base = await data(
    client
      .from("selected_controls")
      .select("control_id")
      .eq("profile_resolution_id", resolution.id),
  );
  const baseIds = base.map((row) => row.control_id);
  const catalogControls = await data(
    client
      .from("controls")
      .select("*")
      .eq("catalog_revision_id", catalog.id)
      .eq("status", "active")
      .limit(1000),
  );
  const claimedOut = catalogControls.find((control) => !baseIds.includes(control.id));
  assert.ok(claimedOut, "Test catalog needs an active control outside its Low baseline");
  const claimedIn = catalogControls.find((control) => control.id === baseIds[0]);
  assert.ok(claimedIn);
  const party = await data(
    client
      .from("parties")
      .select("*")
      .eq("auth_user_id", userId)
      .eq("tenant_id", tenantId)
      .single(),
  );

  // The library: a Mission computer with a claim inside the baseline and one outside; a draft v2.
  const definition = await insert("component_definitions", {
    code: "missile-mc",
    name: "Mission computer",
    category: "catalog_product",
  });
  const v1 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 1,
  });
  const mc = await insert("defined_components", {
    component_definition_revision_id: v1.id,
    name: "Mission computer",
    component_type: "hardware",
    description: "Flight mission computer.",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: mc.id,
    control_id: claimedIn.id,
    description: "Implemented in the mission computer firmware.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: mc.id,
    control_id: claimedOut.id,
    description: "Planned for the next firmware release.",
    implementation_status: "planned",
  });
  await update("component_definition_revisions", v1, { state: "published" });
  const v2 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 2,
  });
  const mcV2 = await insert("defined_components", {
    component_definition_revision_id: v2.id,
    name: "Mission computer",
    component_type: "hardware",
  });

  // The product: Missile A v1 with two configurations.
  const product = await insert("products", {
    code: "MISSILE-A",
    name: "Missile A",
    description: "Air-to-ground missile.",
  });
  let rev1 = await insert("product_revisions", { product_id: product.id, version_number: 1 });
  const airframe = await insert("product_elements", {
    product_revision_id: rev1.id,
    code: "AIRFRAME",
    name: "Airframe",
    element_type: "subsystem",
    position: 0,
  });
  const guidance = await insert("product_elements", {
    product_revision_id: rev1.id,
    code: "GUIDANCE",
    name: "Guidance section",
    element_type: "subsystem",
    position: 1,
  });
  const mcElement = await insert("product_elements", {
    product_revision_id: rev1.id,
    parent_element_id: guidance.id,
    code: "MC",
    name: "Mission computer",
    element_type: "hardware",
    defined_component_id: mc.id,
  });
  const launcher = await insert("product_elements", {
    product_revision_id: rev1.id,
    code: "LAUNCHER",
    name: "Ground launcher",
    element_type: "subsystem",
    position: 2,
  });
  const pylon = await insert("product_elements", {
    product_revision_id: rev1.id,
    code: "PYLON",
    name: "Air-launch pylon",
    element_type: "subsystem",
    position: 3,
  });
  const ground = await insert("product_configurations", {
    product_id: product.id,
    code: "GL",
    name: "Ground launch",
  });
  const air = await insert("product_configurations", {
    product_id: product.id,
    code: "AL",
    name: "Air launch",
  });
  const member = (configuration, element) =>
    insert("product_configuration_elements", {
      product_revision_id: rev1.id,
      product_configuration_id: configuration.id,
      product_element_id: element.id,
    });

  // Authoring guards.
  await expectError(
    client.from("product_configuration_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      product_configuration_id: ground.id,
      product_element_id: mcElement.id,
    }),
    /parent element/,
  );
  for (const element of [airframe, guidance, mcElement, launcher]) await member(ground, element);
  for (const element of [airframe, guidance, mcElement, pylon]) await member(air, element);
  await expectError(
    client
      .from("product_configuration_elements")
      .delete()
      .eq("product_element_id", guidance.id)
      .eq("product_configuration_id", ground.id),
    /children of this element/,
  );
  await expectError(
    client.from("product_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      code: "MC2",
      name: "Draft mission computer",
      element_type: "hardware",
      defined_component_id: mcV2.id,
    }),
    /published library version/,
  );
  await expectError(
    client.from("product_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      code: "MC3",
      name: "Mistyped mission computer",
      element_type: "software",
      defined_component_id: mc.id,
    }),
    /type from the component definition/,
  );
  await expectError(
    client
      .from("product_elements")
      .update({ parent_element_id: mcElement.id, revision: guidance.revision + 1 })
      .eq("id", guidance.id)
      .eq("revision", guidance.revision),
    /cycle/,
  );
  await expectError(
    client
      .from("product_elements")
      .update({ parent_element_id: launcher.id, revision: mcElement.revision + 1 })
      .eq("id", mcElement.id)
      .eq("revision", mcElement.revision),
    /each of its configurations/,
  );
  const otherProduct = await insert("products", { code: "OTHER", name: "Other product" });
  const otherConfiguration = await insert("product_configurations", {
    product_id: otherProduct.id,
    code: "X",
    name: "Other configuration",
  });
  await expectError(
    client.from("product_configuration_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      product_configuration_id: otherConfiguration.id,
      product_element_id: airframe.id,
    }),
    /configuration of this product/,
  );
  const rev2 = await insert("product_revisions", { product_id: product.id, version_number: 2 });
  await expectError(
    client
      .from("product_revisions")
      .update({ state: "published", revision: rev2.revision + 1 })
      .eq("id", rev2.id)
      .eq("revision", rev2.revision),
    /at least one element/,
  );

  // Publish v1: frozen from then on.
  rev1 = await update("product_revisions", rev1, { state: "published" });
  assert.equal(rev1.state, "published");
  assert.ok(rev1.published_at);
  await expectError(
    client.from("product_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      code: "LATE",
      name: "Late element",
      element_type: "subsystem",
    }),
    /published revision/,
  );
  await expectError(
    client.from("product_configuration_elements").insert({
      tenant_id: tenantId,
      product_revision_id: rev1.id,
      product_configuration_id: ground.id,
      product_element_id: pylon.id,
    }),
    /published revision/,
  );
  await expectError(
    client
      .from("product_revisions")
      .update({ remarks: "x", revision: rev1.revision + 1 })
      .eq("id", rev1.id)
      .eq("revision", rev1.revision),
    /immutable/,
  );

  // Lineage columns are the command's alone.
  const program0 = await insert("programs", { code: "DIRECT", name: "Direct write program" });
  await expectError(
    client.from("systems").insert({
      tenant_id: tenantId,
      program_id: program0.id,
      code: "DIRECT-SYS",
      name: "Direct system",
      system_type: "platform",
      product_revision_id: rev1.id,
      product_configuration_id: ground.id,
    }),
    /Add from products/,
  );

  // The wizard: a Ground-launch variant, the airframe pruned, a customer element added.
  const guidanceKey = randomUUID();
  const mcKey = randomUUID();
  const launcherKey = randomUUID();
  const telemetryKey = randomUUID();
  const profileKey = randomUUID();
  const variant = {
    key: randomUUID(),
    code: "MISSILE-A-GL",
    name: "Missile A · Ground launch",
    description: "",
    type: "platform",
    ownerPartyId: party.id,
    confidentiality: "low",
    integrity: "low",
    availability: "low",
    categorizationRationale: "Low impact test variant.",
    profileKey,
    product: { revisionId: rev1.id, configurationId: ground.id },
    elements: [
      {
        key: mcKey,
        parentKey: guidanceKey,
        code: "MC",
        name: "Mission computer",
        description: "",
        type: null,
        library: {
          revisionId: v1.id,
          definedComponentId: mc.id,
          rationale: "Inherited from Missile A v1 · Ground launch.",
        },
        productElementId: mcElement.id,
      },
      {
        key: guidanceKey,
        parentKey: null,
        code: "GUIDANCE",
        name: "Guidance section",
        description: "",
        type: null,
        library: null,
        productElementId: guidance.id,
      },
      {
        key: launcherKey,
        parentKey: null,
        code: "LAUNCHER",
        name: "Ground launcher",
        description: "",
        type: "subsystem",
        library: null,
        productElementId: launcher.id,
      },
      {
        key: telemetryKey,
        parentKey: guidanceKey,
        code: "TELEMETRY",
        name: "Customer telemetry",
        description: "Customer-specific addition.",
        type: "hardware",
        library: null,
        productElementId: null,
      },
    ],
  };
  const draft = {
    requestId: randomUUID(),
    code: "MISSILE-PROGRAM",
    name: "Missile A for customer XYZ",
    description: "",
    sponsorPartyId: null,
    startsOn: null,
    endsOn: null,
    roles: [{ partyId: party.id, role: "program_manager" }],
    catalogRevisionId: catalog.id,
    profiles: [{ key: profileKey, baseResolutionId: resolution.id, tailoring: [], parameters: [] }],
    systems: [variant],
  };
  const before = await counts();
  const created = await data(create(draft));
  assert.deepEqual(await data(create(draft)), created, "Identical retry is idempotent");
  assert.equal(created.systemIds.length, 1);
  assert.equal(created.elements.length, 4);
  const after = await counts();
  assert.equal(after.programs - before.programs, 1);
  assert.equal(after.systems - before.systems, 5);
  assert.equal(after.ssp_revisions - before.ssp_revisions, 1);
  assert.equal(after.implemented_requirements - before.implemented_requirements, baseIds.length);
  assert.equal(after.system_components - before.system_components, 1);
  assert.equal(after.library_assignments - before.library_assignments, 1);
  assert.equal(after.library_assignment_targets - before.library_assignment_targets, 2);
  assert.equal(after.component_contributions - before.component_contributions, 1);
  assert.equal(after.program_wizard_requests - before.program_wizard_requests, 1);
  const systems = await rows("systems", { program_id: created.programId });
  const boundary = systems.find((row) => row.code === "MISSILE-A-GL");
  const guidanceRow = systems.find((row) => row.code === "GUIDANCE");
  const mcRow = systems.find((row) => row.code === "MC");
  const launcherRow = systems.find((row) => row.code === "LAUNCHER");
  const telemetryRow = systems.find((row) => row.code === "TELEMETRY");
  assert.ok(boundary.is_authorization_boundary);
  assert.equal(boundary.product_revision_id, rev1.id);
  assert.equal(boundary.product_configuration_id, ground.id);
  assert.equal(boundary.product_element_id, null);
  assert.equal(boundary.adopted_profile_resolution_id, resolution.id);
  assert.equal(guidanceRow.product_element_id, guidance.id);
  assert.equal(guidanceRow.product_revision_id, rev1.id);
  assert.equal(guidanceRow.product_configuration_id, null);
  assert.equal(
    guidanceRow.system_type,
    "subsystem",
    "A null type inherits the product element's type",
  );
  assert.equal(mcRow.parent_system_id, guidanceRow.id);
  assert.equal(mcRow.system_type, "hardware");
  assert.equal(mcRow.product_element_id, mcElement.id);
  assert.equal(launcherRow.product_element_id, launcher.id);
  assert.equal(telemetryRow.product_revision_id, null);
  assert.equal(telemetryRow.product_element_id, null);
  assert.equal(telemetryRow.parent_system_id, guidanceRow.id);
  assert.ok(
    !systems.some((row) => row.product_element_id === airframe.id),
    "The airframe was pruned",
  );
  const components = await rows("system_components", { system_id: boundary.id });
  assert.equal(components.length, 1);
  assert.equal(components[0].system_element_id, mcRow.id);
  assert.equal(components[0].defined_component_id, mc.id);
  assert.equal(components[0].applied_rationale, "Inherited from Missile A v1 · Ground launch.");
  const assignments = await rows("library_assignments", { program_id: created.programId });
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0].request_id, draft.requestId);
  assert.equal(components[0].assignment_id, assignments[0].id);
  const targets = await rows("library_assignment_targets", { assignment_id: assignments[0].id });
  assert.deepEqual(targets.map((row) => row.state).sort(), ["accepted", "not_in_baseline"]);
  assert.equal(targets.find((row) => row.state === "not_in_baseline").control_id, claimedOut.id);
  assert.equal(
    created.elements.find((row) => row.key === mcKey).systemComponentId,
    components[0].id,
  );

  // Rejections leave nothing behind.
  const notInConfiguration = changed(draft, "NOT-IN-CONFIGURATION");
  notInConfiguration.systems[0].elements.push({
    key: randomUUID(),
    parentKey: null,
    code: "PYLON",
    name: "Air-launch pylon",
    description: "",
    type: null,
    library: null,
    productElementId: pylon.id,
  });
  await rejectsWithoutWrites(
    () => create(notInConfiguration),
    "23514",
    /not part of the selected configuration/,
  );
  const draftVersion = changed(draft, "DRAFT-VERSION");
  draftVersion.systems[0].product.revisionId = rev2.id;
  await rejectsWithoutWrites(() => create(draftVersion), "23514", /published product version/);
  const unpinned = changed(draft, "UNPINNED");
  unpinned.systems[0].elements[0].library = null;
  unpinned.systems[0].elements[0].type = "hardware";
  await rejectsWithoutWrites(() => create(unpinned), "23514", /library pin/);
  const wrongPin = changed(draft, "WRONG-PIN");
  wrongPin.systems[0].elements[0].library.definedComponentId = mcV2.id;
  wrongPin.systems[0].elements[0].library.revisionId = v2.id;
  await rejectsWithoutWrites(() => create(wrongPin), "23514");
  const moved = changed(draft, "MOVED");
  moved.systems[0].elements[0].parentKey = null;
  await rejectsWithoutWrites(() => create(moved), "23514", /place in the product structure/);
  const unknownConfiguration = changed(draft, "UNKNOWN-CONFIGURATION");
  unknownConfiguration.systems[0].product.configurationId = randomUUID();
  await rejectsWithoutWrites(
    () => create(unknownConfiguration),
    "23514",
    /configuration of the selected product/,
  );
  const otherConfigurationDraft = changed(draft, "OTHER-CONFIGURATION");
  otherConfigurationDraft.systems[0].product.configurationId = otherConfiguration.id;
  await rejectsWithoutWrites(
    () => create(otherConfigurationDraft),
    "23514",
    /configuration of the selected product/,
  );
  const noProduct = changed(draft, "NO-PRODUCT");
  noProduct.systems[0].product = null;
  await rejectsWithoutWrites(() => create(noProduct), "23514", /system created from a product/);
  const duplicated = changed(draft, "DUPLICATED");
  duplicated.systems[0].elements[3].productElementId = guidance.id;
  await rejectsWithoutWrites(() => create(duplicated), "23514", /once per system/);
  const retyped = changed(draft, "RETYPED");
  retyped.systems[0].elements[1].type = "hardware";
  await rejectsWithoutWrites(() => create(retyped), "23514", /type from the product/);
  const unknownElement = changed(draft, "UNKNOWN-ELEMENT");
  unknownElement.systems[0].elements[2].productElementId = randomUUID();
  await rejectsWithoutWrites(
    () => create(unknownElement),
    "23514",
    /not found in this product version/,
  );

  // Post-create: an Air-launch variant through add_program_system, then the guards around it.
  const airframeKey = randomUUID();
  const airGuidanceKey = randomUUID();
  const airMcKey = randomUUID();
  const pylonKey = randomUUID();
  const airSystem = {
    key: randomUUID(),
    code: "MISSILE-A-AL",
    name: "Missile A · Air launch",
    description: "",
    type: "platform",
    ownerPartyId: null,
    confidentiality: "moderate",
    integrity: "moderate",
    availability: "low",
    categorizationRationale: "Moderate impact test variant.",
    profileResolutionId: resolution.id,
    product: { revisionId: rev1.id, configurationId: air.id },
    elements: [
      {
        key: airframeKey,
        parentKey: null,
        code: "AIRFRAME",
        name: "Airframe",
        description: "",
        type: "subsystem",
        library: null,
        productElementId: airframe.id,
      },
      {
        key: airGuidanceKey,
        parentKey: null,
        code: "GUIDANCE",
        name: "Guidance section",
        description: "",
        type: "subsystem",
        library: null,
        productElementId: guidance.id,
      },
      {
        key: airMcKey,
        parentKey: airGuidanceKey,
        code: "MC",
        name: "Mission computer",
        description: "",
        type: null,
        library: {
          revisionId: v1.id,
          definedComponentId: mc.id,
          rationale: "Inherited from Missile A v1 · Air launch.",
        },
        productElementId: mcElement.id,
      },
      {
        key: pylonKey,
        parentKey: null,
        code: "PYLON",
        name: "Air-launch pylon",
        description: "",
        type: "subsystem",
        library: null,
        productElementId: pylon.id,
      },
    ],
  };
  const addRequest = randomUUID();
  const add = (system, requestId = addRequest, target = tenantId, programId = created.programId) =>
    rpc("add_program_system", {
      p_tenant_id: target,
      p_program_id: programId,
      p_request_id: requestId,
      p_system: system,
    });
  const added = await data(add(airSystem));
  assert.ok(added.systemId);
  assert.equal(added.elements.length, 4);
  assert.deepEqual(await data(add(airSystem)), added, "Identical retry is idempotent");
  await expectError(
    add({ ...airSystem, name: "Changed" }),
    /already used with different details/,
    "PT409",
  );
  await rejectsWithoutWrites(
    () =>
      add({ ...airSystem, code: "MISSILE-A-AL2", profileResolutionId: randomUUID() }, randomUUID()),
    "23514",
    /program's profiles/,
  );
  await rejectsWithoutWrites(
    () => add({ ...airSystem, code: "MISSILE-A-AL3" }, randomUUID(), randomUUID()),
    "42501",
  );
  await rejectsWithoutWrites(
    () => add({ ...airSystem, code: "MISSILE-A-AL4" }, randomUUID(), tenantId, randomUUID()),
    "23514",
    /Program was not found/,
  );
  const afterAdd = await counts();
  assert.equal(afterAdd.systems - after.systems, 5);
  assert.equal(afterAdd.system_components - after.system_components, 1);
  assert.equal(afterAdd.library_assignments - after.library_assignments, 1);
  assert.equal(afterAdd.program_wizard_requests - after.program_wizard_requests, 1);
  assert.equal(afterAdd.ssp_revisions - after.ssp_revisions, 1);
  const airRows = await rows("systems", { program_id: created.programId });
  const airBoundary = airRows.find((row) => row.id === added.systemId);
  assert.equal(airBoundary.product_configuration_id, air.id);
  assert.equal(airBoundary.product_revision_id, rev1.id);
  assert.equal(airBoundary.adopted_profile_resolution_id, resolution.id);
  assert.equal(airRows.find((row) => row.code === "PYLON").product_element_id, pylon.id);
  const receipts = await rows("program_wizard_requests", { program_id: created.programId });
  assert.equal(receipts.length, 2);
  const retiredGround = await update("product_configurations", ground, { state: "retired" });
  assert.equal(retiredGround.state, "retired");
  await rejectsWithoutWrites(
    () =>
      add(
        {
          ...variant,
          code: "MISSILE-A-GL2",
          profileKey: undefined,
          profileResolutionId: resolution.id,
        },
        randomUUID(),
      ),
    "23514",
    /configuration is retired/,
  );
  await update("product_configurations", retiredGround, { state: "active" });

  // New version: a copy of v1's tree and memberships as draft v3 (v2 is the empty draft above).
  const copied = await data(
    rpc("copy_product_revision", { p_tenant_id: tenantId, p_source_revision_id: rev1.id }),
  );
  const rev3 = (await rows("product_revisions", { id: copied }))[0];
  assert.equal(rev3.state, "draft");
  assert.equal(rev3.version_number, 3);
  const copiedElements = await rows("product_elements", { product_revision_id: rev3.id });
  assert.equal(copiedElements.length, 5);
  const copiedMc = copiedElements.find((row) => row.code === "MC");
  assert.equal(
    copiedMc.parent_element_id,
    copiedElements.find((row) => row.code === "GUIDANCE").id,
  );
  assert.equal(copiedMc.defined_component_id, mc.id);
  const copiedMemberships = await rows("product_configuration_elements", {
    product_revision_id: rev3.id,
  });
  assert.equal(copiedMemberships.length, 8);
  await expectError(
    rpc("copy_product_revision", { p_tenant_id: randomUUID(), p_source_revision_id: rev1.id }),
    /write access/,
    "42501",
  );

  // The OSCAL component-definition of v1.
  const exported = await data(
    rpc("product_component_definition", { p_tenant_id: tenantId, p_revision_id: rev1.id }),
  );
  assert.ok(
    validateComponentDefinition(exported),
    JSON.stringify(validateComponentDefinition.errors),
  );
  const document = exported["component-definition"];
  assert.equal(document.uuid, rev1.id);
  assert.equal(document.metadata["oscal-version"], "1.2.2");
  assert.equal(document.metadata.version, "1");
  assert.equal(document.metadata.title, "Missile A v1");
  assert.equal(document.components.length, 5);
  const prop = (item, name) => item.props.find((row) => row.name === name)?.value;
  const mcComponent = document.components.find((row) => row.uuid === mcElement.id);
  assert.equal(mcComponent.type, "hardware");
  assert.equal(prop(mcComponent, "defined-component"), mc.id);
  assert.equal(prop(mcComponent, "definition-version"), "1");
  assert.equal(prop(mcComponent, "parent-element"), guidance.id);
  assert.equal(mcComponent.links[0].href, `urn:uuid:${v1.id}`);
  assert.equal(mcComponent["control-implementations"].length, 1);
  const implementation = mcComponent["control-implementations"][0];
  assert.equal(implementation.source, `urn:uuid:${catalogDocument.source_uuid}`);
  assert.deepEqual(
    implementation["implemented-requirements"].map((row) => row["control-id"]).sort(),
    [claimedIn.source_id, claimedOut.source_id].sort(),
  );
  const planned = implementation["implemented-requirements"].find(
    (row) => row["control-id"] === claimedOut.source_id,
  );
  assert.equal(planned.props.find((row) => row.name === "implementation-status").value, "planned");
  const airframeComponent = document.components.find((row) => row.uuid === airframe.id);
  assert.equal(airframeComponent["control-implementations"], undefined);
  assert.equal(airframeComponent.type, "subsystem");
  assert.equal(document.capabilities.length, 2);
  const groundCapability = document.capabilities.find((row) => row.uuid === ground.id);
  assert.deepEqual(
    groundCapability["incorporates-components"].map((row) => row["component-uuid"]).sort(),
    [airframe.id, guidance.id, mcElement.id, launcher.id].sort(),
  );
  assert.equal(prop(groundCapability, "configuration-code"), "GL");
  assert.deepEqual(
    await data(
      rpc("product_component_definition", { p_tenant_id: tenantId, p_revision_id: rev1.id }),
    ),
    exported,
    "The export is deterministic",
  );
  await expectError(
    rpc("product_component_definition", { p_tenant_id: tenantId, p_revision_id: rev2.id }),
    /published product version/,
  );
  await expectError(
    rpc("product_component_definition", { p_tenant_id: randomUUID(), p_revision_id: rev1.id }),
    /read access/,
    "42501",
  );

  console.log(
    "Products backend passed: membership and pin guards, publish freeze, lineage written only by the command, wizard v3 with pruning and a customer element, rejections without writes, add_program_system with receipts, copy_product_revision, and a schema-valid OSCAL component-definition.",
  );
} finally {
  await workspace.cleanup();
  console.log("Disposable products workspace cleaned.");
}
