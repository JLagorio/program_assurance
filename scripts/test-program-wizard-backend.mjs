/** Transaction, authorization, and reference-integrity checks for the real wizard RPC (v2). */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
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
  "scope_baselines",
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
  "system_components",
  "library_assignments",
  "library_assignment_targets",
  "component_contributions",
  "evidence_uses",
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
const validateProfile = (() => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv.compile(
    JSON.parse(
      readFileSync(
        new URL("./tests/fixtures/oscal-profile-1.2.2.schema.json", import.meta.url),
        "utf8",
      ),
    ),
  );
})();

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
  const catalog = await data(
    client.from("catalog_revisions").select("*").eq("id", imported.catalog_revision_id).single(),
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
      .eq("catalog_revision_id", catalog.id)
      .in("control_id", baseIds)
      .eq("has_selection", false)
      .limit(1)
      .single(),
  );
  const catalogControls = await data(
    client
      .from("controls")
      .select("*")
      .eq("catalog_revision_id", catalog.id)
      .eq("status", "active")
      .limit(1000),
  );
  const included = catalogControls.find((control) => !baseIds.includes(control.id));
  assert.ok(included, "Test catalog needs an active control outside its Low baseline");
  const excludedId = baseIds.find((id) => id !== parameter.control_id);
  const excluded = await data(client.from("controls").select("*").eq("id", excludedId).single());
  const retainedId = baseIds.find((id) => id !== excludedId && id !== parameter.control_id);
  const party = await data(
    client
      .from("parties")
      .select("*")
      .eq("auth_user_id", userId)
      .eq("tenant_id", tenantId)
      .single(),
  );

  // A library source: one policy component claiming a retained base control, the control the
  // overlay tailors out, and the control it tailors in; one library evidence version; a draft v2.
  const definition = await insert("component_definitions", {
    code: "wizard-audit",
    name: "Wizard audit policy",
    category: "organizational_baseline",
  });
  const v1 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 1,
  });
  const policy = await insert("defined_components", {
    component_definition_revision_id: v1.id,
    name: "Audit policy",
    component_type: "policy",
    description: "The corporate audit policy.",
  });
  const claimA = await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: retainedId,
    description: "Assigns audit responsibilities.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: excludedId,
    description: "A claim on the control the overlay tailors out.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: included.id,
    description: "A claim on the control the overlay tailors in.",
    implementation_status: "planned",
  });
  const artifact = await insert("evidence_artifacts", {
    title: "Audit policy, signed",
    artifact_kind: "document",
  });
  const artifactVersion = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.test/policies/audit.pdf",
  });
  await insert("defined_component_evidence", {
    component_definition_revision_id: v1.id,
    implementation_id: claimA.id,
    evidence_version_id: artifactVersion.id,
    claim: "The signed policy.",
  });
  await update("component_definition_revisions", v1, { state: "published" });
  const v2 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 2,
  });
  const policyV2 = await insert("defined_components", {
    component_definition_revision_id: v2.id,
    name: "Audit policy",
    component_type: "policy",
  });

  const overlayKey = randomUUID();
  const plainKey = randomUUID();
  const parentKey = randomUUID();
  const childKey = randomUUID();
  const libraryKey = randomUUID();
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
    profileKey: overlayKey,
    elements: [
      {
        key: childKey,
        parentKey,
        code: "CHILD",
        name: "Child subsystem",
        description: "",
        type: "subsystem",
        library: null,
      },
      {
        key: parentKey,
        parentKey: null,
        code: "PARENT",
        name: "Parent subsystem",
        description: "",
        type: "subsystem",
        library: null,
      },
      {
        key: libraryKey,
        parentKey,
        code: "LIB",
        name: "Audit policy",
        description: "",
        type: null,
        library: {
          revisionId: v1.id,
          definedComponentId: policy.id,
          rationale: "Applies from creation.",
        },
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
    catalogRevisionId: catalog.id,
    profiles: [
      {
        key: overlayKey,
        baseResolutionId: resolution.id,
        tailoring: [
          {
            controlId: included.id,
            action: "include",
            rationale: "Explicit additional test control.",
          },
          {
            controlId: excludedId,
            action: "exclude",
            rationale: "Explicit test boundary exclusion.",
          },
        ],
        parameters: [
          {
            parameterId: parameter.id,
            values: ["  90 days  "],
            rationale: "Explicit test parameter value.",
          },
        ],
      },
      { key: plainKey, baseResolutionId: resolution.id, tailoring: [], parameters: [] },
    ],
    systems: [
      system,
      {
        ...clone(system),
        key: randomUUID(),
        code: "WIZARD-SYSTEM-2",
        name: "Plain profile system",
        ownerPartyId: null,
        profileKey: plainKey,
        elements: [],
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
  const overlayResult = created.profiles.find((row) => row.key === overlayKey);
  const plainResult = created.profiles.find((row) => row.key === plainKey);
  assert.equal(plainResult.profileResolutionId, resolution.id);
  assert.equal(plainResult.tailored, false);
  assert.notEqual(overlayResult.profileResolutionId, resolution.id);
  assert.equal(overlayResult.tailored, true);
  assert.equal(created.elements.length, 3);
  const overlayId = overlayResult.profileResolutionId;

  const after = await counts();
  assert.equal(after.programs, 1);
  assert.equal(after.program_reference_choices, 2);
  assert.equal(after.program_role_assignments, 1);
  assert.equal(after.systems, 5);
  assert.equal(after.composition_nodes, 3);
  assert.equal(after.scopes, 0, "Scopes are an assessment register, not created at setup");
  assert.equal(after.scope_baselines, 0);
  assert.equal(after.ssp_revisions, 2);
  assert.equal(after.implemented_requirements, baseIds.length * 2);
  assert.equal(after.system_components, 1);
  assert.equal(after.library_assignments, 1);
  assert.equal(after.library_assignment_targets, 3);
  assert.equal(after.component_contributions, 2);
  assert.equal(after.evidence_uses, 1);

  const systems = await rows("systems");
  const root1 = systems.find((row) => row.code === "WIZARD-SYSTEM-1");
  const root2 = systems.find((row) => row.code === "WIZARD-SYSTEM-2");
  const parent = systems.find((row) => row.code === "PARENT");
  const child = systems.find((row) => row.code === "CHILD");
  const library = systems.find((row) => row.code === "LIB");
  assert.ok(root1.is_authorization_boundary && root2.is_authorization_boundary);
  assert.equal(root1.adopted_profile_resolution_id, overlayId);
  assert.equal(root2.adopted_profile_resolution_id, resolution.id);
  assert.ok(
    [root1, root2].every(
      (row) =>
        row.confidentiality_impact === "low" &&
        row.integrity_impact === "moderate" &&
        row.availability_impact === "high",
    ),
  );
  assert.equal(root2.system_owner_party_id, null);
  assert.equal(parent.parent_system_id, root1.id);
  assert.equal(child.parent_system_id, parent.id);
  assert.equal(library.parent_system_id, parent.id);
  assert.equal(library.boundary_system_id, root1.id);
  assert.equal(library.system_type, "other", "A policy component becomes an element of type other");
  const nodes = await rows("composition_nodes");
  assert.equal(nodes.find((row) => row.code === "CHILD").parent_id, parent.id);

  // The overlay: a published profile layered on the reference profile.
  const authoredResolutions = await rows("profile_resolutions");
  assert.equal(authoredResolutions.length, 1);
  const overlay = authoredResolutions[0];
  assert.equal(overlay.id, overlayId);
  assert.equal(overlay.state, "published");
  assert.equal(overlay.resolver_name, "program-assurance-layered-profile");
  assert.equal(overlay.base_profile_resolution_id, resolution.id);
  const overlayRevisions = await rows("profile_revisions");
  assert.equal(overlayRevisions.length, 1);
  assert.equal(overlayRevisions[0].state, "published");
  const overlayRevision = overlayRevisions[0];
  const documents = await rows("oscal_document_revisions");
  assert.equal(documents.length, 1);
  assert.equal(documents[0].state, "published");
  assert.ok(documents[0].published_at);
  const imports = (await rows("profile_imports", { profile_revision_id: overlayRevision.id })).sort(
    (a, b) => a.ordinal - b.ordinal,
  );
  assert.equal(imports.length, 2);
  assert.equal(imports[0].imported_profile_revision_id, profile.id);
  assert.equal(imports[0].catalog_revision_id, null);
  assert.equal(imports[0].include_all, true);
  assert.equal(imports[1].catalog_revision_id, catalog.id);
  assert.equal(imports[1].include_all, false);
  const rules = await rows("profile_rules", { profile_revision_id: overlayRevision.id });
  const excludeRule = rules.find((row) => row.kind === "exclude");
  assert.equal(excludeRule.source_pointer, "/profile/imports/0/exclude-controls/0");
  assert.deepEqual(excludeRule.definition["with-ids"], [excluded.source_id]);
  assert.equal(excludeRule.rationale, "Explicit test boundary exclusion.");
  const includeRule = rules.find((row) => row.kind === "include");
  assert.equal(includeRule.source_pointer, "/profile/imports/1/include-controls/0");
  assert.deepEqual(includeRule.definition["with-ids"], [included.source_id]);
  assert.equal(
    includeRule.rationale,
    "Explicit additional test control.",
    "Each tailored-in control carries its own rationale on its include rule",
  );
  assert.equal(rules.filter((row) => row.kind === "merge").length, 1);
  assert.equal(
    rules.find((row) => row.kind === "set-parameter").source_pointer,
    "/profile/modify/set-parameters/0",
  );
  const documentImports = (
    await rows("oscal_document_imports", { document_revision_id: documents[0].id })
  ).sort((a, b) => a.ordinal - b.ordinal);
  assert.equal(documentImports[0].referenced_revision_id, profile.document_revision_id);
  assert.equal(documentImports[1].referenced_revision_id, catalog.document_revision_id);
  const selected = await rows("selected_controls", { profile_resolution_id: overlayId });
  assert.equal(selected.length, baseIds.length);
  assert.ok(selected.some((row) => row.control_id === included.id));
  assert.ok(!selected.some((row) => row.control_id === excludedId));
  assert.deepEqual(
    selected.map((row) => row.ordinal).sort((a, b) => a - b),
    selected.map((_, index) => index),
  );
  const provenance = await rows("selection_provenance");
  const includedProvenance = provenance.find(
    (row) =>
      row.selected_control_id === selected.find((item) => item.control_id === included.id).id,
  );
  assert.equal(includedProvenance.profile_rule_id, includeRule.id);
  assert.equal(
    includedProvenance.source_pointer,
    "/profile/imports/1/include-controls/0/with-ids/0",
  );
  const retainedProvenance = provenance.find(
    (row) => row.selected_control_id === selected.find((item) => item.control_id === retainedId).id,
  );
  assert.equal(retainedProvenance.profile_rule_id, null);
  assert.equal(retainedProvenance.source_pointer, "/profile/imports/0/include-all");
  const inputs = await rows("profile_resolution_inputs", { profile_resolution_id: overlayId });
  for (const id of [documents[0].id, profile.document_revision_id, catalog.document_revision_id])
    assert.ok(
      inputs.some((row) => row.document_revision_id === id),
      `pins ${id}`,
    );
  const parameterValues = await rows("profile_parameter_values");
  assert.ok(parameterValues.some((row) => row.value === "90 days"));
  assert.ok(!parameterValues.some((row) => row.value === "  90 days  "));
  const document = documents[0].original_content;
  assert.ok(validateProfile(document), JSON.stringify(validateProfile.errors));
  assert.deepEqual(document.profile.imports[0]["include-all"], {});
  assert.deepEqual(document.profile.imports[0]["exclude-controls"][0]["with-ids"], [
    excluded.source_id,
  ]);
  assert.deepEqual(document.profile.imports[1]["include-controls"][0]["with-ids"], [
    included.source_id,
  ]);
  for (const rule of rules) {
    const atPointer = rule.source_pointer
      .split("/")
      .slice(1)
      .reduce((value, key) => value?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], document);
    assert.deepEqual(atPointer, rule.definition, `Normalized ${rule.kind} rule matches source`);
  }
  const chain = await data(
    client.from("profile_resolution_catalogs").select("*").eq("profile_resolution_id", overlayId),
  );
  assert.equal(chain.length, 1);
  assert.equal(chain[0].catalog_revision_id, catalog.id);
  assert.equal(chain[0].depth, 1);
  assert.equal(chain[0].layered, true);
  assert.equal(chain[0].root_profile_resolution_id, resolution.id);

  const ssps = await rows("ssp_revisions");
  assert.equal(ssps.find((row) => row.system_id === root1.id).profile_resolution_id, overlayId);
  assert.equal(ssps.find((row) => row.system_id === root2.id).profile_resolution_id, resolution.id);
  assert.ok(ssps.every((row) => row.state === "draft"));
  const requirements = await rows("implemented_requirements");
  assert.ok(
    requirements.every(
      (row) => row.implementation_status === "planned" && row.description === null,
    ),
  );

  // The library component is an element of the tree with the instance pinned to it.
  const components = await rows("system_components");
  assert.equal(components[0].system_id, root1.id);
  assert.equal(components[0].system_element_id, library.id);
  assert.equal(components[0].defined_component_id, policy.id);
  assert.equal(components[0].code, "LIB");
  assert.equal(components[0].version, "1");
  assert.equal(components[0].applied_rationale, "Applies from creation.");
  const assignments = await rows("library_assignments");
  assert.equal(assignments[0].system_id, library.id);
  assert.equal(assignments[0].source_revision_id, v1.id);
  assert.equal(assignments[0].request_id, draft.requestId);
  assert.equal(components[0].assignment_id, assignments[0].id);
  const targets = await rows("library_assignment_targets");
  assert.deepEqual(targets.map((row) => row.state).sort(), [
    "accepted",
    "accepted",
    "not_in_baseline",
  ]);
  assert.equal(
    targets.find((row) => row.state === "not_in_baseline").control_id,
    excludedId,
    "The claim on the tailored-out control is recorded, not seeded",
  );
  assert.equal(
    created.elements.find((row) => row.key === libraryKey).systemComponentId,
    components[0].id,
  );
  assert.equal((await rows("configuration_baselines")).length, 0);
  assert.equal((await rows("authorization_decisions")).length, 0);

  // Rejections leave nothing behind.
  await rejectsWithoutWrites({ ...draft, name: "Changed retry" }, "PT409");
  await rejectsWithoutWrites(changed(draft, draft.code), "23505");
  const unknownControl = changed(draft, "UNKNOWN-CONTROL");
  unknownControl.profiles[0].tailoring[0].controlId = randomUUID();
  await rejectsWithoutWrites(unknownControl, "23514");
  const missingCategory = changed(draft, "MISSING-CIA");
  missingCategory.systems[1].integrity = null;
  await rejectsWithoutWrites(missingCategory, "23514");
  const cyclic = changed(draft, "CYCLIC");
  cyclic.systems[0].elements[1].parentKey = cyclic.systems[0].elements[0].key;
  await rejectsWithoutWrites(cyclic, "23514");
  const unknownProfile = changed(draft, "UNKNOWN-PROFILE");
  unknownProfile.systems[1].profileKey = randomUUID();
  await rejectsWithoutWrites(unknownProfile, "23514");
  const duplicateElement = changed(draft, "DUPLICATE-ELEMENT");
  duplicateElement.systems[0].elements[0].code = "PARENT";
  await rejectsWithoutWrites(duplicateElement, "23514");
  const draftLibrary = changed(draft, "DRAFT-LIBRARY");
  draftLibrary.systems[0].elements[2].library = {
    revisionId: v2.id,
    definedComponentId: policyV2.id,
    rationale: "Draft version",
  };
  await rejectsWithoutWrites(draftLibrary, "23514");
  const wrongComponent = changed(draft, "WRONG-COMPONENT");
  wrongComponent.systems[0].elements[2].library.definedComponentId = policyV2.id;
  await rejectsWithoutWrites(wrongComponent, "23514");
  const wrongType = changed(draft, "WRONG-TYPE");
  wrongType.systems[0].elements[2].type = "hardware";
  await rejectsWithoutWrites(wrongType, "23514");
  const twicePlain = changed(draft, "TWICE-PLAIN");
  twicePlain.profiles = [
    { key: overlayKey, baseResolutionId: resolution.id, tailoring: [], parameters: [] },
    { key: plainKey, baseResolutionId: resolution.id, tailoring: [], parameters: [] },
  ];
  await rejectsWithoutWrites(twicePlain, "23514");
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

  // A system tailoring further layers on the program overlay instead of re-listing it.
  const childRow = await data(client.from("systems").select("*").eq("id", child.id).single());
  const layered = await data(
    client.rpc("adopt_system_baseline", {
      p_tenant_id: tenantId,
      p_system_id: child.id,
      p_expected_revision: childRow.revision,
      p_request_id: randomUUID(),
      p_selection: {
        mode: "adopt",
        catalogRevisionId: catalog.id,
        profileResolutionId: overlayId,
        controlIds: selected
          .filter((row) => row.control_id !== retainedId)
          .map((row) => row.control_id)
          .sort(),
        rationale: "The child does not carry the retained control.",
      },
    }),
  );
  assert.notEqual(layered.profileResolutionId, overlayId);
  const systemResolution = (await rows("profile_resolutions")).find(
    (row) => row.id === layered.profileResolutionId,
  );
  assert.equal(systemResolution.state, "published");
  assert.equal(systemResolution.base_profile_resolution_id, overlayId);
  const systemImports = await rows("profile_imports", {
    profile_revision_id: systemResolution.profile_revision_id,
  });
  assert.equal(systemImports.length, 1);
  assert.equal(systemImports[0].imported_profile_revision_id, overlayRevision.id);
  const systemRules = await rows("profile_rules", {
    profile_revision_id: systemResolution.profile_revision_id,
  });
  assert.equal(systemRules.filter((row) => row.kind === "exclude").length, 1);
  assert.equal(systemRules.filter((row) => row.kind === "include").length, 0);
  const systemChain = await data(
    client
      .from("profile_resolution_catalogs")
      .select("*")
      .eq("profile_resolution_id", systemResolution.id),
  );
  assert.equal(systemChain[0].catalog_revision_id, catalog.id);
  assert.equal(systemChain[0].depth, 2);
  assert.equal(systemChain[0].root_profile_resolution_id, resolution.id);
  const effective = await data(
    client.from("system_effective_baselines").select("*").eq("system_id", child.id),
  );
  assert.equal(effective[0].profile_resolution_id, systemResolution.id);
  assert.equal(effective[0].source_label, "Explicit system adoption");
  const systemDocument = (await rows("oscal_document_revisions")).find(
    (row) => row.source_uuid === systemResolution.profile_revision_id,
  );
  assert.ok(
    validateProfile(systemDocument.original_content),
    JSON.stringify(validateProfile.errors),
  );
  assert.equal(systemDocument.original_content.profile.imports.length, 1);
  console.log(
    "Program wizard backend passed: layered program profiles, idempotency, explicit CIA and roles, elements in the tree, library components as elements, tenant permissions, CAS, concurrent duplicate codes, and system tailoring layered on the overlay.",
  );
} finally {
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
  console.log("Disposable wizard accounts and workspace records cleaned.");
}
