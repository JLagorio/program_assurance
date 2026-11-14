/**
 * Whole-control mapping creation, objective-level precision (Map control's Objectives: the whole
 * control or chosen objectives, one mapping each) and a recorded statement in a disposable local
 * workspace.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { isControlStatement } from "../src/lib/requirement-control-mappings.ts";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("control-mapping");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
page.setDefaultTimeout(30000);
const errors = [];
let otherOwner;
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => {
  errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
  void dialog.dismiss();
});
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
async function insert(table, values) {
  return data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
}
try {
  const resolution = (
    await data(
      client
        .from("profile_resolutions")
        .select()
        .is("tenant_id", null)
        .eq("state", "published")
        .limit(1),
    )
  )[0];
  assert.ok(resolution);
  const selected = await data(
    client.from("selected_controls").select().eq("profile_resolution_id", resolution.id),
  );
  const controls = await data(
    client
      .from("controls")
      .select()
      .in(
        "id",
        selected.slice(0, 50).map((row) => row.control_id),
      )
      .order("code"),
  );
  /**
   * The objectives a control counts: its leaf assessment objectives, and each heading that prints a
   * sentence of its own besides them (objective_prints_own_sentence).
   */
  const leafObjectives = (candidateParts) =>
    candidateParts.filter(
      (row) =>
        row.name === "assessment-objective" &&
        (!candidateParts.some(
          (child) => child.parent_part_id === row.id && child.name === "assessment-objective",
        ) ||
          /\S/.test((row.prose ?? "").replace(/^\s*determine if:/i, ""))),
    );
  let control, parts, method, statement, objectives;
  for (const candidate of controls) {
    const candidateParts = await data(
      client.from("control_parts").select().eq("control_id", candidate.id),
    );
    const candidateMethod = candidateParts.find((row) => row.name === "assessment-method");
    const candidateStatement = candidateParts.find((row) =>
      isControlStatement(row, candidateParts),
    );
    const candidateObjectives = leafObjectives(candidateParts);
    if (candidateMethod && candidateStatement && candidateObjectives.length >= 3) {
      control = candidate;
      parts = candidateParts;
      method = candidateMethod;
      statement = candidateStatement;
      objectives = candidateObjectives;
      break;
    }
  }
  assert.ok(
    control && parts && method && statement && objectives,
    "A real reference control supplies a statement, an assessment method and objectives",
  );
  const label = (part) => part.props.find((prop) => prop.name === "label")?.value;
  const program = await insert("programs", {
    code: "MAPPING",
    name: "Control mapping walkthrough",
  });
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS",
    name: "Allocated system",
    system_type: "information_system",
  });
  const node = await insert("composition_nodes", {
    system_id: system.id,
    code: "NODE",
    name: "Allocated element",
    node_type: "subsystem",
  });
  await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-MAP",
  });
  const content = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Mapping check",
    statement: "The system shall satisfy its allocated requirement.",
    acceptance_criteria: "The recorded test demonstrates this requirement.",
    requirement_type: "security",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: content.id,
    composition_node_id: node.id,
  });
  const original = await insert("requirement_control_links", {
    requirement_revision_id: content.id,
    control_id: control.id,
    relationship_type: "derived_from",
    rationale: "Whole-control reference",
  });
  const url = `${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Control%20mappings`;
  await page.goto(url);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const table = page.getByRole("table", { name: "Requirement control mappings", exact: true });
  await table.getByText("Whole control", { exact: true }).waitFor();
  await table.getByText(`${control.code} · ${control.title}`, { exact: true }).waitFor();
  // Row commands live in the row's actions menu; the menu item repeats the dialog's operation.
  async function editFromRow() {
    await table
      .getByRole("button", {
        name: `Row actions for ${control.code} · ${control.title}`,
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Edit control mapping", exact: true }).click();
  }
  await editFromRow();
  let dialog = page.getByRole("dialog", { name: "Edit control mapping", exact: true });
  assert.equal(
    await dialog.getByRole("button", { name: "Edit control mapping", exact: true }).isDisabled(),
    false,
  );
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("Clarified catalog reference without changing context");
  await dialog.getByRole("button", { name: "Edit control mapping", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const metadataOnly = await data(
    client.from("requirement_control_links").select().eq("id", original.id).single(),
  );
  assert.equal(metadataOnly.system_id, null);
  assert.equal(metadataOnly.selected_control_id, null);
  assert.equal(metadataOnly.control_part_id, null);
  await editFromRow();
  dialog = page.getByRole("dialog", { name: "Edit control mapping", exact: true });
  await dialog.getByRole("combobox", { name: "System", exact: true }).click();
  await page.getByRole("option", { name: "NODE · Allocated element", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Control", exact: true }).fill(control.code);
  await page
    .getByRole("option", { name: `${control.code} · ${control.title}`, exact: true })
    .click();
  // What the mapping covers: the whole control, unsaid, or one of the control's objectives.
  assert.equal(
    await dialog.getByRole("radio", { name: "Whole control", exact: true }).isChecked(),
    true,
  );
  await dialog.getByRole("radio", { name: "Chosen objectives", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Objective to map", exact: true }).click();
  const options = page.getByRole("option");
  await options.first().waitFor();
  assert.equal(
    await options.count(),
    objectives.length,
    "Every objective the control counts is offered, and nothing else",
  );
  // Options read by their SP 800-53A label, with the text under it; never a source id or a method.
  const opening = (part) => (part.prose ?? "").split("{{")[0].trim().slice(0, 50);
  assert.equal(await options.filter({ hasText: objectives[0].source_id }).count(), 0);
  if (opening(method)) assert.equal(await options.filter({ hasText: opening(method) }).count(), 0);
  const objective = objectives.find((part) => label(part)) ?? objectives[0];
  await page.getByRole("option", { name: label(objective), exact: true }).click();
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("Repaired against the actual objective");
  await dialog.getByRole("button", { name: "Edit control mapping", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const repaired = await data(
    client.from("requirement_control_links").select().eq("id", original.id).single(),
  );
  assert.equal(repaired.control_part_id, objective.id);
  await table.getByText(label(objective), { exact: true }).waitFor();
  assert.equal(repaired.revision, original.revision + 2);
  assert.equal(repaired.relationship_type, "derived_from");
  assert.equal(await table.getByText("Needs review", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByText(/Choose an allocated system and a control/).waitFor();
  await dialog.getByRole("combobox", { name: "Control", exact: true }).fill(control.code);
  await page
    .getByRole("option", { name: `${control.code} · ${control.title}`, exact: true })
    .click();
  await dialog.getByText(/Inherited profile/).waitFor();
  await dialog.getByRole("button", { name: "Map control", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  let links = await data(
    client.from("requirement_control_links").select().eq("requirement_revision_id", content.id),
  );
  assert.equal(links.length, 2);
  assert.ok(
    links.some(
      (link) =>
        link.relationship_type === "maps_to" &&
        link.control_id === control.id &&
        link.control_part_id === null &&
        link.system_id === node.id,
    ),
  );
  // Chosen objectives: one mapping each, in one write.
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByRole("combobox", { name: "Control", exact: true }).fill(control.code);
  await page
    .getByRole("option", { name: `${control.code} · ${control.title}`, exact: true })
    .click();
  await dialog.getByRole("radio", { name: "Chosen objectives", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Objectives to map", exact: true }).click();
  const chosen = objectives.filter((part) => label(part)).slice(1, 3);
  for (const part of chosen)
    await page.getByRole("option", { name: label(part), exact: true }).click();
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Map control", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  links = await data(
    client.from("requirement_control_links").select().eq("requirement_revision_id", content.id),
  );
  assert.equal(links.length, 4);
  assert.deepEqual(
    links
      .filter((link) => chosen.some((part) => part.id === link.control_part_id))
      .map((link) => [link.system_id, link.relationship_type]),
    chosen.map(() => [node.id, "maps_to"]),
  );
  // A mapping recorded against a statement of the control's text is named by it, not reviewed.
  await insert("requirement_control_links", {
    requirement_revision_id: content.id,
    control_id: control.id,
    control_part_id: statement.id,
    relationship_type: "satisfies",
    rationale: "Recorded against a statement",
  });
  await page.reload();
  await table.waitFor();
  await table.getByText("Recorded against a statement", { exact: true }).waitFor();
  assert.equal(await table.getByText("Needs review", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByLabel("Rationale", { exact: true }).fill("Discarded draft");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await dialog.waitFor({ state: "hidden" });
  links = await data(
    client.from("requirement_control_links").select().eq("requirement_revision_id", content.id),
  );
  assert.equal(links.length, 5);
  // A heading chosen covers the objectives under it (AC-8's AC-08a., which prints a sentence of its
  // own over AC-08a.01 to AC-08a.04): they read Covered by AC-08a., cannot be chosen apart from it,
  // an objective under it chosen first is taken out, and the write maps the heading alone.
  const ac8 = (
    await data(
      client
        .from("controls")
        .select("id, code, title, catalog_revision_id")
        .eq("code", "AC-8")
        .eq("catalog_revision_id", control.catalog_revision_id),
    )
  )[0];
  const [ac8Selection] = ac8
    ? await data(
        client
          .from("selected_controls")
          .select("profile_resolution_id")
          .eq("control_id", ac8.id)
          .is("tenant_id", null)
          .limit(1),
      )
    : [];
  assert.ok(ac8 && ac8Selection, "The pinned catalog holds AC-8 in a reference baseline");
  const headingSystem = await insert("systems", {
    program_id: program.id,
    code: "SYS-AC8",
    name: "Notification system",
    system_type: "information_system",
  });
  await insert("ssp_revisions", {
    system_id: headingSystem.id,
    profile_resolution_id: ac8Selection.profile_resolution_id,
    version_number: 1,
  });
  const banner = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-BANNER",
  });
  const bannerContent = await insert("requirement_revisions", {
    engineering_requirement_id: banner.id,
    version_number: 1,
    title: "Use notification",
    statement: "The system shall show a use notification before granting access.",
    acceptance_criteria: "The banner is shown and acknowledged.",
    requirement_type: "security",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: bannerContent.id,
    system_id: headingSystem.id,
  });
  await page.goto(
    `${origin}/programs/${program.id}/requirements/${banner.id}?tab=Control%20mappings`,
  );
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByRole("combobox", { name: "Control", exact: true }).fill("AC-8");
  await page.getByRole("option", { name: `AC-8 · ${ac8.title}`, exact: true }).click();
  await dialog.getByRole("radio", { name: "Chosen objectives", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Objectives to map", exact: true }).click();
  await page.getByRole("option", { name: "AC-08a.01", exact: true }).click();
  await page.getByRole("option", { name: "AC-08a.", exact: true }).click();
  for (const under of ["AC-08a.01", "AC-08a.02", "AC-08a.03", "AC-08a.04"])
    assert.equal(
      await page.getByRole("option", { name: under, exact: true }).getAttribute("aria-disabled"),
      "true",
      `${under} is covered by AC-08a.`,
    );
  assert.ok(await page.getByText("Covered by AC-08a.").count());
  await page.keyboard.press("Escape");
  await dialog.getByText("AC-08a. and 4 under it", { exact: true }).waitFor();
  assert.equal(await dialog.getByText("AC-08a.01", { exact: true }).count(), 0);
  await dialog.getByText(/^Covers 5 of 9 objectives\./).waitFor();
  await dialog.getByRole("button", { name: "Map control", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const heading = (
    await data(
      client
        .from("control_parts")
        .select("id, props")
        .eq("control_id", ac8.id)
        .eq("name", "assessment-objective"),
    )
  ).find((part) => label(part) === "AC-08a.");
  assert.deepEqual(
    (
      await data(
        client
          .from("requirement_control_links")
          .select("control_part_id, system_id")
          .eq("requirement_revision_id", bannerContent.id),
      )
    ).map((link) => [link.control_part_id, link.system_id]),
    [[heading.id, headingSystem.id]],
    "The heading alone, one mapping on the system",
  );
  // Every system counts. A program with two systems on one baseline: a control mapped on the first
  // is short on the second, whose step allocates a requirement there first (Allocate to SYS-TWO),
  // then maps on it (Map on SYS-TWO), the picker saying each system's standing and opening on the
  // requirements allocated there. A heading chosen in the picker maps alone, once on each system.
  const profileKey = randomUUID();
  const twoSystems = await data(
    client.rpc("create_program_wizard", {
      p_tenant_id: tenantId,
      p_draft: {
        requestId: randomUUID(),
        code: "EVERY",
        name: "Every system counts",
        description: "",
        sponsorPartyId: null,
        startsOn: null,
        endsOn: null,
        roles: [],
        catalogRevisionId: control.catalog_revision_id,
        profiles: [
          {
            key: profileKey,
            baseResolutionId: ac8Selection.profile_resolution_id,
            tailoring: [],
            parameters: [],
          },
        ],
        systems: ["ONE", "TWO"].map((code) => ({
          key: randomUUID(),
          code: `SYS-${code}`,
          name: `System ${code.toLowerCase()}`,
          description: "",
          type: "information_system",
          ownerPartyId: null,
          confidentiality: "low",
          integrity: "low",
          availability: "low",
          categorizationRationale: "A limited impact boundary for a disposable check.",
          profileKey,
          elements: [],
        })),
      },
    }),
  );
  const everySystems = await data(
    client.from("systems").select("id, code").eq("program_id", twoSystems.programId),
  );
  const sysOne = everySystems.find((row) => row.code === "SYS-ONE").id;
  const sysTwo = everySystems.find((row) => row.code === "SYS-TWO").id;
  const ac1 = (
    await data(
      client
        .from("controls")
        .select("id, code, title")
        .eq("code", "AC-1")
        .eq("catalog_revision_id", control.catalog_revision_id),
    )
  )[0];
  const [sysOneBaseline] = await data(
    client
      .from("system_effective_baselines")
      .select("profile_resolution_id")
      .eq("system_id", sysOne),
  );
  const [ac1Selection] = await data(
    client
      .from("selected_controls")
      .select("id")
      .eq("profile_resolution_id", sysOneBaseline.profile_resolution_id)
      .eq("control_id", ac1.id),
  );
  const everyRequirement = async (code, title, systemId) => {
    const identity = await insert("engineering_requirements", {
      program_id: twoSystems.programId,
      code,
    });
    const revision = await insert("requirement_revisions", {
      engineering_requirement_id: identity.id,
      version_number: 1,
      title,
      statement: `The system shall ${title.toLowerCase()}.`,
      acceptance_criteria: "The recorded test demonstrates it.",
      requirement_type: "security",
    });
    for (const target of systemId ? [systemId].flat() : [])
      await insert("requirement_allocations", {
        requirement_revision_id: revision.id,
        system_id: target,
      });
    return revision;
  };
  const policyOne = await everyRequirement("REQ-ONE", "Keep a policy on system one", sysOne);
  const policyTwo = await everyRequirement("REQ-TWO", "Keep a policy on system two");
  const banners = await everyRequirement("REQ-BANNERS", "Show a use notification");
  await insert("requirement_control_links", {
    requirement_revision_id: policyOne.id,
    control_id: ac1.id,
    system_id: sysOne,
    selected_control_id: ac1Selection.id,
    relationship_type: "maps_to",
  });
  await page.goto(`${origin}/programs/${twoSystems.programId}/controls/${ac1.id}`);
  const nextStep = page.locator('[data-slot="key-value"]', { hasText: "Next step" }).first();
  await page.getByText("0 of 17 objectives · 0 with evidence", { exact: true }).waitFor();
  await nextStep.getByRole("button", { name: "Allocate to SYS-TWO", exact: true }).click();
  let sheet = page.getByRole("dialog", { name: "Allocate requirements", exact: true });
  await sheet.getByRole("checkbox", { name: /REQ-TWO/ }).click();
  await sheet.getByRole("button", { name: "Allocate 1 to SYS-TWO", exact: true }).click();
  await sheet.waitFor({ state: "hidden" });
  await nextStep.getByRole("button", { name: "Map on SYS-TWO", exact: true }).click();
  sheet = page.getByRole("dialog", { name: "Map a requirement", exact: true });
  await sheet.getByText("17 of 17 objectives mapped", { exact: true }).waitFor();
  await sheet.getByText("0 of 17 objectives mapped", { exact: true }).waitFor();
  await sheet.getByRole("checkbox", { name: /REQ-TWO/ }).waitFor();
  assert.equal(
    await sheet.getByRole("checkbox", { name: /REQ-ONE/ }).count(),
    0,
    "The picker opens on the requirements allocated in SYS-TWO",
  );
  await sheet.getByRole("checkbox", { name: /REQ-TWO/ }).click();
  await sheet.getByRole("button", { name: "Map 1 requirement to AC-1", exact: true }).click();
  await sheet.waitFor({ state: "hidden" });
  assert.deepEqual(
    (
      await data(
        client
          .from("requirement_control_links")
          .select("system_id, control_part_id")
          .eq("requirement_revision_id", policyTwo.id),
      )
    ).map((link) => [link.system_id, link.control_part_id]),
    [[sysTwo, null]],
  );
  await nextStep.getByText("Link evidence to REQ-ONE", { exact: true }).waitFor();
  await page.getByText("17 of 17 objectives · 0 with evidence", { exact: true }).waitFor();
  // AC-8 from its own page: AC-08a. chosen covers the four under it and maps once on each system.
  for (const target of [sysOne, sysTwo])
    await insert("requirement_allocations", {
      requirement_revision_id: banners.id,
      system_id: target,
    });
  await page.goto(`${origin}/programs/${twoSystems.programId}/controls/${ac8.id}`);
  await nextStep.getByRole("button", { name: "Map a requirement", exact: true }).click();
  sheet = page.getByRole("dialog", { name: "Map a requirement", exact: true });
  await sheet.getByRole("radio", { name: "Chosen objectives", exact: true }).click();
  await sheet.getByRole("combobox", { name: "Objectives to map", exact: true }).click();
  await page.getByRole("option", { name: "AC-08a.", exact: true }).click();
  assert.equal(
    await page
      .getByRole("option", { name: "AC-08a.04", exact: true })
      .getAttribute("aria-disabled"),
    "true",
  );
  await page.keyboard.press("Escape");
  await sheet.getByText("AC-08a. and 4 under it", { exact: true }).waitFor();
  await sheet.getByRole("checkbox", { name: /REQ-BANNERS/ }).click();
  await sheet.getByRole("button", { name: "Map 1 requirement to AC-8", exact: true }).click();
  await sheet.waitFor({ state: "hidden" });
  const headingId = (
    await data(
      client
        .from("control_parts")
        .select("id, props")
        .eq("control_id", ac8.id)
        .eq("name", "assessment-objective"),
    )
  ).find((part) => label(part) === "AC-08a.").id;
  assert.deepEqual(
    (
      await data(
        client
          .from("requirement_control_links")
          .select("system_id, control_part_id")
          .eq("requirement_revision_id", banners.id),
      )
    )
      .map(
        (link) =>
          `${link.system_id === sysOne ? "SYS-ONE" : "SYS-TWO"} ${link.control_part_id === headingId}`,
      )
      .sort(),
    ["SYS-ONE true", "SYS-TWO true"],
  );
  await nextStep.getByText("Map 4 more objectives", { exact: true }).waitFor();
  // Back to the first requirement's Control mappings, which a viewer reads next.
  await page.goto(url);
  otherOwner = await localWorkspace("control-mapping-owner");
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: otherOwner.userId, role: "owner" }),
  );
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "viewer" })
      .eq("tenant_id", tenantId)
      .eq("user_id", workspace.userId),
  );
  await page.reload();
  await table.waitFor();
  assert.equal(await page.getByRole("button", { name: "Map control", exact: true }).count(), 0);
  assert.equal(
    await table.getByRole("button", { name: /^Row actions for / }).count(),
    0,
    "A viewer has no row commands",
  );
  assert.equal(
    await page.getByRole("button", { name: "Edit control mapping", exact: true }).count(),
    0,
  );
  await page.screenshot({
    path: "/tmp/requirement-control-mappings-viewer.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS control mappings: inherited profile/control labels, objectives (one an edit, several a new mapping), a heading chosen covering the objectives under it and written alone in both Map dialogs, every system counting (Allocate to SYS-TWO, then Map on SYS-TWO), a recorded statement, CAS update, whole-control creation, discard, viewer read-only; disposable workspace cleaned",
  );
} catch (error) {
  await page.screenshot({
    path: "/tmp/requirement-control-mappings-failure.png",
    animations: "disabled",
  });
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
  if (otherOwner) await otherOwner.cleanup();
}
