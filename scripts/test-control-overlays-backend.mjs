/**
 * The overlay commands and program creation with overlays, against the local stack, as a member
 * through PostgREST: save_control_overlay, set_control_overlay_decisions,
 * set_control_overlay_parameters, publish_control_overlay, create_control_overlay_version,
 * delete_control_overlay, create_program_wizard with `overlayIds`, and
 * set_program_baseline_overlays, which changes a program's stack after creation and takes a newer
 * version of an overlay in place of the one it applies. Each runs in a
 * disposable @example.test workspace (and a second one for another workspace's records), which is
 * removed at the end. Needs `npm run local:start` with the pinned reference data.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("overlays-backend");
const { client, tenantId } = workspace;
let other;

/** The answer of a request that must succeed. */
const ok = async (query, what) => {
  const { data, error } = await query;
  assert.equal(error, null, `${what}: ${error?.message}`);
  return data;
};
/** A request that must be refused with `code`; nothing is asked of its answer. */
const refused = async (query, code, what) => {
  const { error } = await query;
  assert.ok(error, `${what} unexpectedly succeeded`);
  assert.equal(error.code, code, `${what}: ${error.code} ${error.message}`);
  return error;
};
const count = async (table, filters = {}) => {
  let query = client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count: total, error } = await query;
  assert.equal(error, null, `${table} count: ${error?.message}`);
  return total;
};

const save = (id, expectedRevision, overlay, as = client, tenant = tenantId) =>
  as.rpc("save_control_overlay", {
    p_tenant_id: tenant,
    p_id: id,
    p_expected_revision: expectedRevision,
    p_overlay: overlay,
  });
const decide = (
  overlayId,
  expectedRevision,
  decisions,
  removed = [],
  as = client,
  tenant = tenantId,
) =>
  as.rpc("set_control_overlay_decisions", {
    p_tenant_id: tenant,
    p_overlay_id: overlayId,
    p_expected_revision: expectedRevision,
    p_decisions: decisions,
    p_removed: removed,
  });
const publish = (overlayId, expectedRevision, as = client, tenant = tenantId) =>
  as.rpc("publish_control_overlay", {
    p_tenant_id: tenant,
    p_overlay_id: overlayId,
    p_expected_revision: expectedRevision,
  });
const remove = (overlayId, expectedRevision, as = client, tenant = tenantId) =>
  as.rpc("delete_control_overlay", {
    p_tenant_id: tenant,
    p_overlay_id: overlayId,
    p_expected_revision: expectedRevision,
  });
const restack = (
  choiceId,
  expectedRevision,
  requestId,
  overlayIds,
  as = client,
  tenant = tenantId,
) =>
  as.rpc("set_program_baseline_overlays", {
    p_tenant_id: tenant,
    p_choice_id: choiceId,
    p_expected_revision: expectedRevision,
    p_request_id: requestId,
    p_overlay_ids: overlayIds,
  });
const include = (controlId, rationale = "The program needs it.") => ({
  controlId,
  action: "include",
  rationale,
});
const exclude = (controlId, rationale = "The program does not need it.") => ({
  controlId,
  action: "exclude",
  rationale,
});

/** A published overlay with these decisions, made through the three commands. */
async function overlay(
  code,
  catalogRevisionId,
  decisions,
  { as = client, tenant = tenantId } = {},
) {
  const id = randomUUID();
  const created = await ok(
    save(
      id,
      null,
      { code, title: `${code} overlay`, description: "", catalogRevisionId },
      as,
      tenant,
    ),
    `create ${code}`,
  );
  const decided = await ok(
    decide(id, created.revision, decisions, [], as, tenant),
    `decide ${code}`,
  );
  await ok(publish(id, decided.revision, as, tenant), `publish ${code}`);
  return id;
}

/** A program set up through the wizard with one program profile and one system adopting it. */
function wizardDraft(code, catalogRevisionId, profile) {
  const key = randomUUID();
  return {
    requestId: randomUUID(),
    code,
    name: `${code} overlays test`,
    description: "",
    sponsorPartyId: null,
    startsOn: null,
    endsOn: null,
    roles: [],
    catalogRevisionId,
    profiles: [{ key, tailoring: [], parameters: [], overlayIds: [], ...profile }],
    systems: [
      {
        key: randomUUID(),
        code: `${code}-SYS`,
        name: `${code} system`,
        description: "",
        type: "information_system",
        ownerPartyId: null,
        confidentiality: "low",
        integrity: "low",
        availability: "low",
        categorizationRationale: "A limited impact boundary for a disposable test.",
        profileKey: key,
        elements: [],
      },
    ],
  };
}

/** A program profile's stack bottom up: root, each overlay layer by its overlay's code, tailoring. */
async function stack(choiceId) {
  const choice = await ok(
    client
      .from("program_reference_choices")
      .select("profile_resolution_id")
      .eq("id", choiceId)
      .single(),
    "read the choice",
  );
  const layers = [];
  const resolutions = [];
  let cursor = choice.profile_resolution_id;
  while (cursor) {
    const resolution = await ok(
      client
        .from("profile_resolutions")
        .select("id, base_profile_resolution_id")
        .eq("id", cursor)
        .single(),
      "read a layer",
    );
    const applications = await ok(
      client
        .from("profile_overlay_applications")
        .select("overlay_id")
        .eq("profile_resolution_id", cursor),
      "read a layer's overlay",
    );
    let name = resolution.base_profile_resolution_id ? "tailoring" : "root";
    if (applications[0]) {
      const applied = await ok(
        client
          .from("control_overlays")
          .select("code")
          .eq("id", applications[0].overlay_id)
          .single(),
        "read an applied overlay",
      );
      name = applied.code;
    }
    layers.unshift(name);
    resolutions.unshift(resolution.id);
    cursor = resolution.base_profile_resolution_id;
  }
  return { layers, resolutions };
}

const selects = async (resolutionId, controlId) =>
  (
    await ok(
      client
        .from("selected_controls")
        .select("id")
        .eq("profile_resolution_id", resolutionId)
        .eq("control_id", controlId),
      "read a selection",
    )
  ).length === 1;

try {
  // ---------------------------------------------------------------------------------------------
  // The pinned references: the smallest reference baseline on the newest published catalog.
  // ---------------------------------------------------------------------------------------------
  const catalogs = await ok(
    client
      .from("catalog_revisions")
      .select("id, created_at")
      .is("tenant_id", null)
      .eq("state", "published")
      .order("created_at", { ascending: false }),
    "read the catalog editions",
  );
  assert.ok(catalogs.length, "No catalog edition is installed: run npm run local:start");
  const catalogId = catalogs[0].id;
  const roots = await ok(
    client
      .from("profile_resolutions")
      .select("id, profile_revision_id")
      .is("tenant_id", null)
      .is("base_profile_resolution_id", null)
      .eq("state", "published"),
    "read the reference baselines",
  );
  const rootImports = await ok(
    client
      .from("profile_imports")
      .select("profile_revision_id")
      .eq("catalog_revision_id", catalogId)
      .in(
        "profile_revision_id",
        roots.map((row) => row.profile_revision_id),
      ),
    "read the reference baselines' catalogs",
  );
  const sizes = [];
  for (const root of roots.filter((row) =>
    rootImports.some((item) => item.profile_revision_id === row.profile_revision_id),
  )) {
    const { count: total } = await client
      .from("selected_controls")
      .select("id", { count: "exact", head: true })
      .eq("profile_resolution_id", root.id);
    sizes.push({ id: root.id, total });
  }
  sizes.sort((a, b) => a.total - b.total || a.id.localeCompare(b.id));
  assert.ok(sizes.length, "No reference baseline is installed on the newest catalog edition");
  const baseId = sizes[0].id;
  const baseIds = new Set(
    (
      await ok(
        client.from("selected_controls").select("control_id").eq("profile_resolution_id", baseId),
        "read the reference baseline",
      )
    ).map((row) => row.control_id),
  );
  const controls = await ok(
    client
      .from("controls")
      .select("id, code, source_id, status")
      .eq("catalog_revision_id", catalogId)
      .order("source_id")
      .range(0, 999),
    "read the catalog's controls",
  );
  const outside = controls.filter((row) => row.status === "active" && !baseIds.has(row.id));
  const inside = controls.filter((row) => baseIds.has(row.id));
  assert.ok(
    outside.length >= 6 && inside.length >= 6,
    "The reference baseline leaves no room for the test",
  );
  const [x1, x2, x3, x4, x5, x6] = outside;
  const [y1, y2, , , , y6] = inside.slice(-6);
  const parameter = (
    await ok(
      client
        .from("parameters")
        .select("id, control_id, source_id")
        .eq("catalog_revision_id", catalogId)
        .eq("has_selection", false)
        .in(
          "control_id",
          inside.slice(0, 40).map((row) => row.id),
        )
        .order("source_id")
        .limit(1),
      "read a parameter",
    )
  )[0];
  assert.ok(parameter, "No parameter without choices on the reference baseline's first controls");

  // ---------------------------------------------------------------------------------------------
  // save_control_overlay: create, a request sent again, an edit at the revision the reader saw.
  // ---------------------------------------------------------------------------------------------
  const draftId = randomUUID();
  const details = {
    code: "OB-DRAFT",
    title: "Draft overlay",
    description: "A draft.",
    catalogRevisionId: catalogId,
  };
  const created = await ok(save(draftId, null, details), "create a draft overlay");
  assert.equal(created.state, "draft");
  assert.equal(created.revision, 1);
  const again = await ok(save(draftId, null, details), "create the same overlay again");
  assert.equal(again.revision, 1, "A create sent again wrote something");
  await refused(
    save(draftId, null, { ...details, title: "Another title" }),
    "PT409",
    "the same id with other details",
  );
  const edited = await ok(
    save(draftId, 1, { ...details, title: "Draft overlay, edited" }),
    "edit the draft",
  );
  assert.equal(edited.revision, 2);
  await refused(
    save(draftId, 1, { ...details, title: "A stale edit" }),
    "PT409",
    "an edit at a stale revision",
  );
  await refused(
    save(randomUUID(), null, { ...details, title: "Same code" }),
    "23505",
    "another overlay with the same code",
  );
  await refused(
    save(randomUUID(), null, { ...details, code: "" }),
    "23514",
    "an overlay with no code",
  );

  // set_control_overlay_decisions: decisions and removals in one request, sent again, stale.
  await refused(decide(draftId, 2, []), "23514", "no decision at all");
  const decided = await ok(
    decide(draftId, 2, [include(x1.id), exclude(y1.id)]),
    "record two decisions",
  );
  assert.equal(decided.revision, 3);
  assert.equal(await count("control_overlay_decisions", { overlay_id: draftId }), 2);
  const decidedAgain = await ok(
    decide(draftId, 2, [include(x1.id), exclude(y1.id)]),
    "the same decisions again",
  );
  assert.equal(decidedAgain.revision, 3, "Decisions sent again wrote something");
  await refused(decide(draftId, 2, [include(x2.id)]), "PT409", "a decision at a stale revision");
  await refused(
    decide(draftId, 3, [include(x2.id), include(x2.id)]),
    "23514",
    "one control decided twice",
  );
  await refused(
    decide(draftId, 3, [include(randomUUID())]),
    "23514",
    "a control outside the catalog edition",
  );
  const trimmed = await ok(
    decide(draftId, 3, [include(x2.id)], [y1.id]),
    "add one decision and remove one",
  );
  assert.equal(trimmed.revision, 4);
  assert.equal(await count("control_overlay_decisions", { overlay_id: draftId }), 2);

  // publish_control_overlay: refused without decisions or at a stale revision; frozen after.
  const emptyId = randomUUID();
  const empty = await ok(
    save(emptyId, null, { ...details, code: "OB-EMPTY", title: "Empty" }),
    "create an empty draft",
  );
  await refused(publish(emptyId, empty.revision), "23514", "publish an overlay with no decisions");
  const frozenId = randomUUID();
  const frozen = await ok(
    save(frozenId, null, { ...details, code: "OB-FROZEN", title: "Frozen" }),
    "create a draft to publish",
  );
  const frozenDecided = await ok(
    decide(frozenId, frozen.revision, [include(x3.id)]),
    "decide on it",
  );
  await refused(
    publish(frozenId, frozenDecided.revision - 1),
    "PT409",
    "publish at a stale revision",
  );
  const published = await ok(publish(frozenId, frozenDecided.revision), "publish it");
  assert.equal(published.state, "published");
  const publishedAgain = await ok(publish(frozenId, frozenDecided.revision), "publish it again");
  assert.equal(publishedAgain.revision, published.revision, "Publishing again wrote something");
  await refused(
    save(frozenId, published.revision, {
      ...details,
      code: "OB-FROZEN",
      title: "Changed after publishing",
    }),
    "23514",
    "edit a published overlay",
  );
  await refused(
    decide(frozenId, published.revision, [include(x4.id)]),
    "23514",
    "decide on a published overlay",
  );

  // delete_control_overlay: a draft goes with its decisions; sent again it finds nothing; a stale
  // revision and a published overlay are refused.
  await refused(remove(draftId, 3), "PT409", "delete a draft at a stale revision");
  assert.equal(await ok(remove(draftId, 4), "delete the draft"), true);
  assert.equal(await count("control_overlays", { id: draftId }), 0);
  assert.equal(await count("control_overlay_decisions", { overlay_id: draftId }), 0);
  assert.equal(await ok(remove(draftId, 4), "delete it again"), false);
  await refused(remove(frozenId, published.revision), "23514", "delete a published overlay");
  assert.equal(await count("control_overlays", { id: frozenId }), 1);

  // ---------------------------------------------------------------------------------------------
  // Overlays for the stacks. A adds and removes, and decides once more on what is already true;
  // B adds; C adds what the program's tailoring adds; SAME adds only what A adds.
  // ---------------------------------------------------------------------------------------------
  const a = await overlay("OB-A", catalogId, [
    include(x1.id, "A adds it."),
    exclude(y2.id, "A removes it."),
    include(inside[0].id, "A adds what the baseline already selects."),
    exclude(x6.id, "A removes what the baseline leaves out."),
  ]);
  const b = await overlay("OB-B", catalogId, [include(x2.id, "B adds it.")]);
  const c = await overlay("OB-C", catalogId, [include(x4.id, "C adds what the tailoring adds.")]);
  const same = await overlay("OB-SAME", catalogId, [include(x1.id, "It adds what A adds.")]);
  const draftOverlay = randomUUID();
  const draftRow = await ok(
    save(draftOverlay, null, { ...details, code: "OB-UNPUBLISHED", title: "Unpublished" }),
    "create an unpublished overlay",
  );
  await ok(
    decide(draftOverlay, draftRow.revision, [include(x5.id)]),
    "decide on the unpublished overlay",
  );

  // Another workspace, with a published overlay of its own.
  other = await localWorkspace("overlays-other");
  const foreign = await overlay("OB-FOREIGN", catalogId, [include(x5.id)], {
    as: other.client,
    tenant: other.tenantId,
  });
  await refused(
    remove(foreign, 1, other.client, tenantId),
    "42501",
    "an outsider deletes in this workspace's name",
  );
  await refused(
    remove(frozenId, published.revision, other.client, other.tenantId),
    "23514",
    "an outsider deletes this workspace's overlay",
  );

  // ---------------------------------------------------------------------------------------------
  // create_program_wizard with overlayIds: the base, each overlay as a layer, the tailoring last.
  // ---------------------------------------------------------------------------------------------
  const tailoring = [
    include(x4.id, "The program adds it itself."),
    exclude(y6.id, "The program removes it itself."),
  ];
  const parameters = [
    { parameterId: parameter.id, values: ["every week"], rationale: "The program sets it." },
  ];
  const draft = wizardDraft("OB-PROG", catalogId, {
    baseResolutionId: baseId,
    overlayIds: [a, b],
    tailoring,
    parameters,
  });
  const programs = await count("programs");
  // What stops a program before anything is written.
  for (const [overlayIds, what] of [
    [[a, draftOverlay], "an unpublished overlay"],
    [[a, foreign], "another workspace's overlay"],
    [[a, same], "an overlay that changes nothing where it sits"],
    [[a, a], "one overlay twice"],
    [[a, b, c, same, frozenId, draftOverlay, foreign], "more than six overlays"],
  ]) {
    const refusedDraft = wizardDraft(`OB-NO-${randomUUID().slice(0, 4)}`, catalogId, {
      baseResolutionId: baseId,
      overlayIds,
    });
    await refused(
      client.rpc("create_program_wizard", { p_tenant_id: tenantId, p_draft: refusedDraft }),
      "23514",
      what,
    );
  }
  assert.equal(await count("programs"), programs, "A refused program left a record");
  const result = await ok(
    client.rpc("create_program_wizard", { p_tenant_id: tenantId, p_draft: draft }),
    "create the program",
  );
  assert.equal(result.profiles[0].tailored, true);
  const resent = await ok(
    client.rpc("create_program_wizard", { p_tenant_id: tenantId, p_draft: draft }),
    "create it again",
  );
  assert.deepEqual(resent, result, "Program creation sent again answered differently");
  assert.equal(
    await count("programs"),
    programs + 1,
    "Program creation sent again made a second program",
  );
  const choice = await ok(
    client
      .from("program_reference_choices")
      .select("id, revision, profile_resolution_id")
      .eq("program_id", result.programId)
      .single(),
    "read the program's choice",
  );
  assert.equal(choice.profile_resolution_id, result.profiles[0].profileResolutionId);
  const created0 = await stack(choice.id);
  assert.deepEqual(created0.layers, ["root", "OB-A", "OB-B", "tailoring"]);
  // A's layer records what it found already decided.
  const application = await ok(
    client
      .from("profile_overlay_applications")
      .select("reaffirmed_control_ids, not_applicable_control_ids")
      .eq("profile_resolution_id", created0.resolutions[1])
      .single(),
    "read A's application",
  );
  assert.deepEqual(application.reaffirmed_control_ids, [inside[0].id]);
  assert.deepEqual(application.not_applicable_control_ids, [x6.id]);
  const top0 = created0.resolutions.at(-1);
  assert.ok(await selects(top0, x1.id), "The stack does not select what A adds");
  assert.ok(!(await selects(top0, y2.id)), "The stack selects what A removes");
  assert.ok(await selects(top0, x4.id), "The stack does not select what the tailoring adds");

  // The system adopts the top; its SSP is published, and a draft after it pins the same top.
  const system = await ok(
    client
      .from("systems")
      .select("id, adopted_profile_resolution_id")
      .eq("id", result.systemIds[0])
      .single(),
    "read the system",
  );
  assert.equal(system.adopted_profile_resolution_id, top0);
  const ssp = await ok(
    client
      .from("ssp_revisions")
      .select("id, revision, profile_resolution_id")
      .eq("system_id", system.id)
      .single(),
    "read the SSP",
  );
  await ok(
    client
      .from("ssp_revisions")
      .update({ state: "published", revision: ssp.revision + 1 })
      .eq("id", ssp.id)
      .eq("revision", ssp.revision)
      .select()
      .single(),
    "publish the SSP",
  );
  const nextDraft = await ok(
    client
      .from("ssp_revisions")
      .insert({
        tenant_id: tenantId,
        system_id: system.id,
        profile_resolution_id: top0,
        version_number: 2,
      })
      .select()
      .single(),
    "start the next SSP draft",
  );
  const implemented = await count("implemented_requirements", { ssp_revision_id: ssp.id });

  // ---------------------------------------------------------------------------------------------
  // set_program_baseline_overlays: add, a request sent again, stale, reorder, remove.
  // ---------------------------------------------------------------------------------------------
  const addRequest = randomUUID();
  const added = await ok(restack(choice.id, choice.revision, addRequest, [a, b, c]), "add C");
  assert.equal(added.changed, true);
  assert.equal(added.revision, choice.revision + 1);
  const afterAdd = await stack(choice.id);
  assert.deepEqual(afterAdd.layers, ["root", "OB-A", "OB-B", "OB-C", "tailoring"]);
  assert.deepEqual(
    afterAdd.resolutions.slice(0, 3),
    created0.resolutions.slice(0, 3),
    "Adding C did not keep A's and B's layers",
  );
  // C adds what the tailoring adds: the tailoring keeps its removal and its parameter, and says so.
  assert.deepEqual(added.tailoring, {
    authored: true,
    decisions: 1,
    parameters: 1,
    alreadySelected: [x4.code],
    notInBaseline: [],
    parametersDropped: [],
  });
  assert.deepEqual(added.systems, [{ id: system.id, code: "OB-PROG-SYS" }]);
  assert.deepEqual(
    added.ssps.map((row) => [row.version, row.state]),
    [
      [1, "published"],
      [2, "draft"],
    ],
  );
  const movedSystem = await ok(
    client.from("systems").select("adopted_profile_resolution_id").eq("id", system.id).single(),
    "read the system again",
  );
  assert.equal(movedSystem.adopted_profile_resolution_id, added.profileResolutionId);
  const answeredAgain = await ok(
    restack(choice.id, choice.revision, addRequest, [a, b, c]),
    "add C again",
  );
  assert.deepEqual(answeredAgain, added, "The request sent again answered differently");
  await refused(
    restack(choice.id, choice.revision, addRequest, [a, c]),
    "PT409",
    "the same request id for another change",
  );
  await refused(
    restack(choice.id, choice.revision, randomUUID(), [a]),
    "PT409",
    "a change at a stale revision",
  );

  const reordered = await ok(
    restack(choice.id, added.revision, randomUUID(), [b, a, c]),
    "reorder",
  );
  assert.deepEqual((await stack(choice.id)).layers, ["root", "OB-B", "OB-A", "OB-C", "tailoring"]);
  assert.equal(reordered.controls.added, 0);
  assert.equal(reordered.controls.removed, 0);
  const removed = await ok(
    restack(choice.id, reordered.revision, randomUUID(), [b]),
    "remove A and C",
  );
  assert.deepEqual((await stack(choice.id)).layers, ["root", "OB-B", "tailoring"]);
  assert.ok(!(await selects(removed.profileResolutionId, x1.id)), "A's add stayed after A left");
  assert.ok(await selects(removed.profileResolutionId, y2.id), "A's removal stayed after A left");

  // What stops a change: nothing of it is written.
  const profiles = await count("profiles");
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [b, draftOverlay]),
    "23514",
    "stack an unpublished overlay",
  );
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [b, foreign]),
    "23514",
    "stack another workspace's overlay",
  );
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [b, a, same]),
    "23514",
    "stack an overlay that changes nothing",
  );
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [b, b]),
    "23514",
    "stack one overlay twice",
  );
  assert.equal(await count("profiles"), profiles, "A refused change left a profile");

  // Someone outside the workspace may not change the stack, in either workspace's name.
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [], other.client),
    "42501",
    "an outsider changes the stack",
  );
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [], other.client, other.tenantId),
    "23514",
    "an outsider changes the stack in their own workspace's name",
  );
  // Made a viewer, they read the program and still may not change its stack or delete an overlay.
  await ok(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: other.userId, role: "viewer" }),
    "make the outsider a viewer",
  );
  const seen = await ok(
    other.client.from("program_reference_choices").select("id").eq("id", choice.id),
    "a viewer reads the choice",
  );
  assert.equal(seen.length, 1);
  await refused(
    restack(choice.id, removed.revision, randomUUID(), [], other.client),
    "42501",
    "a viewer changes the stack",
  );
  await refused(
    remove(frozenId, published.revision, other.client),
    "42501",
    "a viewer deletes an overlay",
  );
  assert.equal(
    (
      await ok(
        client.from("program_reference_choices").select("revision").eq("id", choice.id).single(),
        "read the choice",
      )
    ).revision,
    removed.revision,
    "An outsider or a viewer changed the stack",
  );

  // Through every change the SSP revisions kept the resolution they were written against.
  const ssps = await ok(
    client
      .from("ssp_revisions")
      .select("id, state, profile_resolution_id")
      .eq("system_id", system.id)
      .order("version_number"),
    "read the SSP revisions",
  );
  assert.deepEqual(
    ssps.map((row) => [row.id, row.state, row.profile_resolution_id]),
    [
      [ssp.id, "published", top0],
      [nextDraft.id, "draft", top0],
    ],
  );
  assert.equal(await count("implemented_requirements", { ssp_revision_id: ssp.id }), implemented);

  // An overlay a program's stack applies cannot be deleted, whatever its state says.
  await refused(remove(a, 3), "23514", "delete an applied overlay");

  // ---------------------------------------------------------------------------------------------
  // Parameter values: set on a draft, sent again, published with values alone, held once
  // published, and applied as the layer's own settings, which program_control_parameters reads.
  // ---------------------------------------------------------------------------------------------
  const setValues = (overlayId, expectedRevision, parameters, removed = [], as = client) =>
    as.rpc("set_control_overlay_parameters", {
      p_tenant_id: tenantId,
      p_overlay_id: overlayId,
      p_expected_revision: expectedRevision,
      p_parameters: parameters,
      p_removed: removed,
    });
  const quarterly = [
    { parameterId: parameter.id, values: [" every quarter "], rationale: "The overlay sets it." },
  ];
  const valuesId = randomUUID();
  const valuesDraft = await ok(
    save(valuesId, null, {
      code: "OB-VALUES",
      title: "Values overlay",
      description: "",
      catalogRevisionId: catalogId,
    }),
    "create a values overlay",
  );
  const valued = await ok(setValues(valuesId, valuesDraft.revision, quarterly), "set a value");
  const valuedAgain = await ok(
    setValues(valuesId, valuesDraft.revision, quarterly),
    "the same values sent again",
  );
  assert.equal(valuedAgain.revision, valued.revision, "Values sent again wrote again");
  await refused(
    setValues(valuesId, valued.revision, [{ ...quarterly[0], values: [] }]),
    "23514",
    "a value set with no value",
  );
  await refused(
    setValues(valuesId, valued.revision, quarterly, [], other.client),
    "42501",
    "a viewer sets a value",
  );
  const valuesPublished = await ok(
    publish(valuesId, valued.revision),
    "publish an overlay with values alone",
  );
  await refused(
    setValues(valuesId, valuesPublished.revision, [{ ...quarterly[0], values: ["daily"] }]),
    "23514",
    "change a published overlay's value",
  );
  const valuesProgram = await ok(
    client.rpc("create_program_wizard", {
      p_tenant_id: tenantId,
      p_draft: wizardDraft("OB-VALPROG", catalogId, {
        baseResolutionId: baseId,
        overlayIds: [valuesId],
      }),
    }),
    "create a program with a values-only overlay",
  );
  const valuesChoice = await ok(
    client
      .from("program_reference_choices")
      .select("id, revision, profile_resolution_id")
      .eq("program_id", valuesProgram.programId)
      .single(),
    "read the values program's choice",
  );
  assert.deepEqual((await stack(valuesChoice.id)).layers, ["root", "OB-VALUES"]);
  /** The values a resolution's own setting gives the test parameter. */
  const settingOf = async (resolutionId) => {
    const resolution = await ok(
      client
        .from("profile_resolutions")
        .select("profile_revision_id")
        .eq("id", resolutionId)
        .single(),
      "read a layer's profile",
    );
    const settings = await ok(
      client
        .from("profile_parameter_settings")
        .select("id")
        .eq("profile_revision_id", resolution.profile_revision_id)
        .eq("parameter_id", parameter.id),
      "read a layer's setting",
    );
    if (!settings[0]) return null;
    const values = await ok(
      client
        .from("profile_parameter_values")
        .select("value, ordinal")
        .eq("setting_id", settings[0].id)
        .order("ordinal"),
      "read a setting's values",
    );
    return values.map((row) => row.value);
  };
  assert.deepEqual(await settingOf(valuesChoice.profile_resolution_id), ["every quarter"]);
  const read = await ok(
    client.rpc("program_control_parameters", {
      p_program_id: valuesProgram.programId,
      p_control_id: parameter.control_id,
    }),
    "read the program's values for the control",
  );
  const readValue = read.stacks[0]?.parameters.find((row) => row.parameter_id === parameter.id);
  assert.deepEqual(readValue?.values, ["every quarter"]);
  assert.equal(readValue?.source?.kind, "overlay");
  assert.equal(readValue?.source?.title, "Values overlay");

  // ---------------------------------------------------------------------------------------------
  // Versions: the next version of a published overlay carries its values, a request sent again
  // answers the same draft, a deleted draft version leaves the published one, and a program keeps
  // the version it applied until its stack takes the newer one in its place.
  // ---------------------------------------------------------------------------------------------
  const nextVersion = (overlayId, versionId, as = client) =>
    as.rpc("create_control_overlay_version", {
      p_tenant_id: tenantId,
      p_overlay_id: overlayId,
      p_version_id: versionId,
    });
  const draftVersionId = randomUUID();
  const draftVersion = await ok(nextVersion(valuesId, draftVersionId), "create version 2");
  assert.equal(draftVersion.version, 2);
  assert.equal(draftVersion.state, "draft");
  assert.equal(draftVersion.code, "OB-VALUES");
  assert.equal(await count("control_overlay_parameters", { overlay_id: draftVersionId }), 1);
  const draftVersionAgain = await ok(
    nextVersion(valuesId, draftVersionId),
    "create version 2 again",
  );
  assert.equal(
    draftVersionAgain.revision,
    draftVersion.revision,
    "A version sent again wrote again",
  );
  await refused(nextVersion(valuesId, randomUUID()), "23514", "a second next version");
  await refused(nextVersion(draftVersionId, randomUUID()), "23514", "the next version of a draft");
  await refused(
    nextVersion(valuesId, randomUUID(), other.client),
    "42501",
    "a viewer creates a version",
  );
  assert.equal(
    await ok(remove(draftVersionId, draftVersion.revision), "delete the draft version"),
    true,
  );
  assert.equal(await count("control_overlays", { id: valuesId, state: "published" }), 1);
  assert.equal(await count("control_overlay_parameters", { overlay_id: valuesId }), 1);
  const secondId = randomUUID();
  const second = await ok(nextVersion(valuesId, secondId), "create version 2 again, anew");
  assert.equal(second.version, 2);
  const monthly = await ok(
    setValues(secondId, second.revision, [
      {
        parameterId: parameter.id,
        values: ["every month"],
        rationale: "Version 2 sets it monthly.",
      },
    ]),
    "edit version 2's value",
  );
  await ok(publish(secondId, monthly.revision), "publish version 2");
  // The program still applies version 1.
  const stillFirst = await ok(
    client
      .from("profile_overlay_applications")
      .select("overlay_id")
      .eq("profile_resolution_id", valuesChoice.profile_resolution_id)
      .single(),
    "read the applied version",
  );
  assert.equal(stillFirst.overlay_id, valuesId, "Publishing version 2 moved the program's stack");
  const taken = await ok(
    restack(valuesChoice.id, valuesChoice.revision, randomUUID(), [secondId]),
    "take version 2 into the program's stack",
  );
  assert.equal(taken.changed, true);
  const takenApplication = await ok(
    client
      .from("profile_overlay_applications")
      .select("overlay_id")
      .eq("profile_resolution_id", taken.profileResolutionId)
      .single(),
    "read the version the stack applies now",
  );
  assert.equal(takenApplication.overlay_id, secondId);
  assert.deepEqual(await settingOf(taken.profileResolutionId), ["every month"]);
  console.log("Control overlay commands and program stacks: all checks passed.");
} finally {
  await other?.cleanup();
  await workspace.cleanup();
}
