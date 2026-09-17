/** Whole-control mapping creation and optional statement precision in a disposable local workspace. */
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
  let control, parts, method, statement;
  for (const candidate of controls) {
    const candidateParts = await data(
      client.from("control_parts").select().eq("control_id", candidate.id),
    );
    const candidateMethod = candidateParts.find((row) => row.name === "assessment-method");
    const candidateStatement = candidateParts.find((row) =>
      isControlStatement(row, candidateParts),
    );
    if (candidateMethod && candidateStatement) {
      control = candidate;
      parts = candidateParts;
      method = candidateMethod;
      statement = candidateStatement;
      break;
    }
  }
  assert.ok(
    control && parts && method && statement,
    "A real reference control supplies both statement and assessment method",
  );
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
  await table.getByRole("button", { name: "Edit mapping", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Edit control mapping", exact: true });
  assert.equal(
    await dialog.getByRole("button", { name: "Save mapping", exact: true }).isDisabled(),
    false,
  );
  await dialog
    .getByLabel("Rationale (optional)")
    .fill("Clarified catalog reference without changing context");
  await dialog.getByRole("button", { name: "Save mapping", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const metadataOnly = await data(
    client.from("requirement_control_links").select().eq("id", original.id).single(),
  );
  assert.equal(metadataOnly.system_id, null);
  assert.equal(metadataOnly.selected_control_id, null);
  assert.equal(metadataOnly.control_part_id, null);
  await table.getByRole("button", { name: "Edit mapping", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit control mapping", exact: true });
  await dialog.getByLabel("System", { exact: true }).click();
  await page.getByRole("option", { name: "NODE · Allocated element", exact: true }).click();
  await dialog.getByLabel("Control", { exact: true }).fill(control.code);
  await page
    .getByRole("option", { name: `${control.code} · ${control.title}`, exact: true })
    .click();
  await dialog.getByLabel("Statement or item (optional)", { exact: true }).click();
  const allowed = parts.filter((part) => isControlStatement(part, parts));
  const options = page.getByRole("option");
  await options.first().waitFor();
  assert.equal(
    await options.count(),
    allowed.length,
    "Only actual statement/item prose is eligible",
  );
  assert.equal(await options.filter({ hasText: method.source_id }).count(), 0);
  await options.filter({ hasText: statement.source_id }).first().click();
  await dialog.getByLabel("Rationale (optional)").fill("Repaired against the actual statement");
  await dialog.getByRole("button", { name: "Save mapping", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const repaired = await data(
    client.from("requirement_control_links").select().eq("id", original.id).single(),
  );
  assert.equal(repaired.control_part_id, statement.id);
  assert.equal(repaired.revision, original.revision + 2);
  assert.equal(repaired.relationship_type, "derived_from");
  assert.equal(await table.getByText("Needs review", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByText(/Choose an allocated system and a control/).waitFor();
  await dialog.getByLabel("Control", { exact: true }).fill(control.code);
  await page
    .getByRole("option", { name: `${control.code} · ${control.title}`, exact: true })
    .click();
  await dialog.getByText(/Inherited profile/).waitFor();
  await dialog.getByRole("button", { name: "Save mapping", exact: true }).click();
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
  await page.getByRole("button", { name: "Map control", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Map control", exact: true });
  await dialog.getByLabel("Rationale (optional)").fill("Discarded draft");
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
  assert.equal(links.length, 2);
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
  assert.equal(await table.getByRole("button", { name: "Edit mapping", exact: true }).count(), 0);
  await page.screenshot({
    path: "/tmp/requirement-control-mappings-viewer.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS control mappings: inherited profile/control labels, optional authored statements, CAS update, whole-control creation, discard, viewer read-only; disposable workspace cleaned",
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
