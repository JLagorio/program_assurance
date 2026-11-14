/**
 * Whole-control mapping creation, objective-level precision (Map control's Objectives: the whole
 * control or chosen objectives, one mapping each) and a recorded statement in a disposable local
 * workspace.
 */
import assert from "node:assert/strict";
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
    "PASS control mappings: inherited profile/control labels, objectives (one an edit, several a new mapping), a recorded statement, CAS update, whole-control creation, discard, viewer read-only; disposable workspace cleaned",
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
