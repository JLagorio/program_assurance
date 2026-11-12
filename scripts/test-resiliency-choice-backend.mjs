/**
 * A program's choice for SA-24, Design for Cyber Resiliency, through the API. A program is set up
 * as the product sets it up (`create_program_wizard`: SA-24 tailored in, its five parameters set
 * to titles of the cyber resiliency vocabulary) and `program_resiliency_choice` answers with the
 * items' codes: for that program, for one layered on its stack, and for one without the control.
 * Runs against the local stack in a disposable workspace, with the pinned references installed.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { localWorkspace } from "./tests/local-workspace.mjs";

const FRAMEWORK = "nist-sp800-160v2r1-cref";
/** SA-24's parameters by source id, with the list each defines and the kinds of item it names. */
const PARAMETERS = [
  ["sa-24_odp.01", "goals", ["goal"]],
  ["sa-24_odp.02", "objectives", ["objective"]],
  ["sa-24_odp.03", "techniques", ["technique"]],
  ["sa-24_odp.04", "approaches", ["approach"]],
  [
    "sa-24_odp.05",
    "design_principles",
    ["strategic-design-principle", "structural-design-principle"],
  ],
];
const NOTHING = {
  goals: [],
  objectives: [],
  techniques: [],
  approaches: [],
  design_principles: [],
  unmatched: [],
};

const workspace = await localWorkspace("resiliency-choice");
const { client, tenantId } = workspace;
let outsider;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const choice = (programId, reader = client) =>
  data(reader.rpc("program_resiliency_choice", { p_program_id: programId }));

/** A program with one program profile, and one system that adopts it. */
async function program(code, catalogId, profile) {
  const key = randomUUID();
  const created = await data(
    client.rpc("create_program_wizard", {
      p_tenant_id: tenantId,
      p_draft: {
        requestId: randomUUID(),
        code,
        name: `${code} resiliency choice check`,
        description: "",
        sponsorPartyId: null,
        startsOn: null,
        endsOn: null,
        roles: [],
        catalogRevisionId: catalogId,
        profiles: [{ key, ...profile }],
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
            categorizationRationale: "A limited impact boundary for a disposable check.",
            profileKey: key,
            elements: [],
          },
        ],
      },
    }),
  );
  return { id: created.programId, resolutionId: created.profiles[0].profileResolutionId };
}

try {
  // SA-24 in the published catalog, and its five parameters: assignments the catalog gives no
  // value and no choices.
  const editions = await data(
    client.from("catalog_revisions").select("id").eq("state", "published"),
  );
  const [control] = await data(
    client
      .from("controls")
      .select("id, code, title, catalog_revision_id")
      .eq("source_id", "sa-24")
      .eq("status", "active")
      .in(
        "catalog_revision_id",
        editions.map((row) => row.id),
      ),
  );
  assert.ok(control, "The pinned catalog holds SA-24");
  const catalogId = control.catalog_revision_id;
  const parameters = await data(
    client
      .from("parameters")
      .select("id, source_id, label, has_selection")
      .eq("control_id", control.id),
  );
  const parameterOf = (sourceId) => parameters.find((row) => row.source_id === sourceId);
  for (const [sourceId] of PARAMETERS) {
    assert.ok(parameterOf(sourceId), `SA-24 has the parameter ${sourceId}`);
    assert.equal(parameterOf(sourceId).has_selection, false);
  }

  // The reference baselines on that catalog. None selects SA-24: a program tailors it in.
  const imports = await data(
    client
      .from("profile_imports")
      .select("profile_revision_id")
      .eq("catalog_revision_id", catalogId)
      .is("tenant_id", null),
  );
  const baselines = await data(
    client
      .from("profile_resolutions")
      .select("id")
      .eq("state", "published")
      .is("tenant_id", null)
      .is("base_profile_resolution_id", null)
      .in(
        "profile_revision_id",
        imports.map((row) => row.profile_revision_id),
      ),
  );
  assert.ok(baselines.length > 0, "The pinned references hold a reference baseline");
  const selecting = await data(
    client
      .from("selected_controls")
      .select("profile_resolution_id")
      .eq("control_id", control.id)
      .is("tenant_id", null),
  );
  assert.deepEqual(selecting, [], "No reference baseline selects SA-24");
  const sized = await Promise.all(
    baselines.map(async (baseline) => {
      const counted = await client
        .from("selected_controls")
        .select("id", { count: "exact", head: true })
        .eq("profile_resolution_id", baseline.id);
      assert.ifError(counted.error);
      return { id: baseline.id, controls: counted.count };
    }),
  );
  // The smallest keeps the check quick: every program drafts an implementation for each control.
  const base = sized.sort((a, b) => a.controls - b.controls || a.id.localeCompare(b.id))[0];

  // The vocabulary the parameters' values are chosen from.
  const items = await data(
    client.from("framework_item_rows").select("kind, code, title").eq("framework_code", FRAMEWORK),
  );
  const count = (kind) => items.filter((item) => item.kind === kind).length;
  assert.deepEqual(
    PARAMETERS.map(([, list, kinds]) => [list, kinds.map(count)]),
    [
      ["goals", [4]],
      ["objectives", [8]],
      ["techniques", [14]],
      ["approaches", [50]],
      ["design_principles", [5, 14]],
    ],
    "The cyber resiliency framework holds the vocabulary SA-24's parameters name",
  );
  const titles = (...codes) =>
    codes.map((code) => {
      const item = items.find((entry) => entry.code === code);
      assert.ok(item, `The framework holds ${code}`);
      return item.title;
    });
  const setting = (sourceId, values) => ({
    parameterId: parameterOf(sourceId).id,
    values,
    rationale: "Chosen for the resiliency choice check.",
  });
  const include = [
    {
      controlId: control.id,
      action: "include",
      rationale: "The program designs for cyber resiliency.",
    },
  ];
  console.log(
    `PASS ${control.code} ${control.title} has its five parameters, no reference baseline selects it, and the vocabulary is loaded`,
  );

  // The program as the form writes it: each value an item's title.
  const chosen = {
    goals: ["goal.anticipate", "goal.withstand"],
    objectives: ["objective.constrain", "objective.understand"],
    techniques: ["technique.deception", "technique.redundancy", "technique.segmentation"],
    approaches: [
      "approach.obfuscation",
      "approach.protected-backup-and-restore",
      "approach.predefined-segmentation",
    ],
    design_principles: [
      "strategic-principle.reduce-attack-surfaces",
      "structural-principle.limit-the-need-for-trust",
      "structural-principle.maintain-redundancy",
    ],
  };
  const written = await program("RESILIENCY-WRITTEN", catalogId, {
    baseResolutionId: base.id,
    tailoring: include,
    parameters: PARAMETERS.map(([sourceId, list]) => setting(sourceId, titles(...chosen[list]))),
  });
  assert.notEqual(written.resolutionId, base.id, "The program's tailoring is its own layer");
  const [reference] = await data(
    client.from("program_reference_choices").select("*").eq("program_id", written.id),
  );
  assert.equal(reference.profile_resolution_id, written.resolutionId);
  const selected = await data(
    client
      .from("selected_controls")
      .select("id")
      .eq("profile_resolution_id", written.resolutionId)
      .eq("control_id", control.id),
  );
  assert.equal(selected.length, 1, "SA-24 is in the program's control baseline");
  // The values stay text, as OSCAL has them: the stored setting and the authored profile both
  // read "Anticipate", "Withstand".
  const [resolution] = await data(
    client.from("profile_resolutions").select("profile_revision_id").eq("id", written.resolutionId),
  );
  const [goalSetting] = await data(
    client
      .from("profile_parameter_settings")
      .select("id, parameter_source_id")
      .eq("profile_revision_id", resolution.profile_revision_id)
      .eq("parameter_source_id", "sa-24_odp.01"),
  );
  const stored = await data(
    client
      .from("profile_parameter_values")
      .select("value, ordinal")
      .eq("setting_id", goalSetting.id)
      .order("ordinal"),
  );
  assert.deepEqual(
    stored.map((row) => row.value),
    ["Anticipate", "Withstand"],
  );
  const [revision] = await data(
    client
      .from("profile_revisions")
      .select("document_revision_id")
      .eq("id", resolution.profile_revision_id),
  );
  const [document] = await data(
    client
      .from("oscal_document_revisions")
      .select("original_content")
      .eq("id", revision.document_revision_id),
  );
  assert.deepEqual(
    document.original_content.profile.modify["set-parameters"].find(
      (entry) => entry["param-id"] === "sa-24_odp.01",
    ),
    { "param-id": "sa-24_odp.01", values: ["Anticipate", "Withstand"] },
  );
  assert.deepEqual(await choice(written.id), { selected: true, ...chosen, unmatched: [] });
  console.log(
    "PASS a program with SA-24 tailored in and its five parameters chosen answers with their codes",
  );

  // A program layered on that stack sets the techniques alone, typed by hand: the nearest layer's
  // techniques replace the ones beneath, the other four lists come from the layer beneath, and
  // words that name no technique are answered as written.
  const layered = await program("RESILIENCY-LAYERED", catalogId, {
    baseResolutionId: written.resolutionId,
    tailoring: [],
    parameters: [
      setting("sa-24_odp.03", [
        "  SEGMENTATION ",
        "Zero trust",
        "analytic monitoring",
        "Anticipate",
      ]),
    ],
  });
  assert.deepEqual(await choice(layered.id), {
    selected: true,
    ...chosen,
    techniques: ["technique.analytic-monitoring", "technique.segmentation"],
    unmatched: ["Zero trust", "Anticipate"],
  });
  console.log(
    "PASS a layered stack answers the nearest layer's value, in the publication's order, with what names nothing",
  );

  // Without the control: a reference baseline as it comes, and the stack with SA-24 tailored out.
  const plain = await program("RESILIENCY-PLAIN", catalogId, {
    baseResolutionId: base.id,
    tailoring: [],
    parameters: [],
  });
  assert.equal(plain.resolutionId, base.id);
  assert.deepEqual(await choice(plain.id), { selected: false, ...NOTHING });
  const out = await program("RESILIENCY-OUT", catalogId, {
    baseResolutionId: written.resolutionId,
    tailoring: [
      { controlId: control.id, action: "exclude", rationale: "Resiliency is designed elsewhere." },
    ],
    parameters: [],
  });
  assert.deepEqual(await choice(out.id), { selected: false, ...NOTHING });
  console.log("PASS a program without SA-24 answers not selected, with empty lists");

  // Another workspace and a session with no account are refused, never told "not selected".
  outsider = await localWorkspace("resiliency-choice-outsider");
  const refused = await outsider.client.rpc("program_resiliency_choice", {
    p_program_id: written.id,
  });
  assert.equal(refused.error?.code, "42501", JSON.stringify(refused));
  const status = JSON.parse(
    execFileSync("supabase", ["status", "--output", "json"], {
      env: workspace.dockerEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const anonymous = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedOut = await anonymous.rpc("program_resiliency_choice", { p_program_id: written.id });
  assert.equal(signedOut.error?.code, "42501", JSON.stringify(signedOut));
  console.log("PASS another workspace and a signed-out session are refused");
} finally {
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
}
