/** Inline requirement edits update the same record and append actual edit history. */
import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("requirement-edit-history");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
context.setDefaultTimeout(30000);
const page = await context.newPage();
const errors = [];
let releaseSave;
page.on("pageerror", (error) => errors.push(error.message));
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
let requirement;
let program;
let original;
let initialEvents;
async function records() {
  return data(
    client.from("requirement_revisions").select().eq("engineering_requirement_id", requirement.id),
  );
}
async function history() {
  return data(
    client.from("activity_events").select().eq("program_id", program.id).order("occurred_at"),
  );
}
async function waitEdit(field, next, edits) {
  await expect.poll(async () => (await records())[0]?.[field]).toEqual(next);
  await expect.poll(async () => (await history()).length).toBe(initialEvents + edits);
  await expect(
    page.getByRole("group", { name: "Requirement details", exact: true }),
  ).not.toHaveAttribute("aria-busy", "true");
  const rows = await records();
  assert.equal(rows.length, 1, "Editing does not create revision records");
  assert.equal(rows[0].id, original.id);
  assert.equal(rows[0].version_number, original.version_number);
  return rows[0];
}
async function editText(label, next, multiline = false) {
  await page.getByRole("button", { name: new RegExp(`^${label}:`) }).click();
  const field = page.getByRole("textbox", { name: label, exact: true });
  await field.fill(next);
  await field.press(multiline ? "Control+Enter" : "Enter");
}
async function noRevisionControls(target = page) {
  assert.equal(
    await target
      .getByRole("button", { name: /^(New revision|Edit revision|Add first revision)$/ })
      .count(),
    0,
  );
  assert.equal(
    await target.getByRole("combobox", { name: "Requirement revision", exact: true }).count(),
    0,
  );
  assert.equal(
    await target.getByRole("table", { name: "Requirement revision history", exact: true }).count(),
    0,
  );
}
try {
  program = await insert("programs", {
    code: "EDITS",
    name: "Requirement edit history validation",
  });
  requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-EDIT",
  });
  const owner = await insert("parties", { name: "Alex Rivera", party_type: "person" });
  original = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Original boundary requirement",
    statement: "The service shall validate its boundary.",
    acceptance_criteria: "Every boundary case has a recorded result.",
    requirement_type: "security",
    state: "published",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Boundary evidence",
    artifact_kind: "document",
  });
  const evidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.test/boundary",
  });
  const evidenceLink = await insert("requirement_evidence", {
    requirement_revision_id: original.id,
    evidence_version_id: evidence.id,
  });
  initialEvents = (await history()).length;
  await page.goto(
    `${origin}/programs/${program.id}?tab=Requirements&requirementId=${requirement.id}`,
  );
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: /^Title: Original boundary requirement/ }).waitFor();
  await noRevisionControls();
  const panel = page.locator('[data-shell-area="panel"]');
  assert.equal(await panel.getByText("Version", { exact: true }).count(), 0);
  assert.equal(await panel.getByText("Published", { exact: true }).count(), 0);
  const table = page.getByRole("treegrid", { name: "Engineering requirements", exact: true });
  assert.equal(
    await table.getByRole("columnheader", { name: /Revision status|Version/ }).count(),
    0,
  );

  await page.getByRole("button", { name: /^Title:/ }).click();
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("");
  await page.getByRole("textbox", { name: "Title", exact: true }).press("Enter");
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("textbox", { name: "Title", exact: true }).press("Escape");
  assert.equal((await history()).length, initialEvents);

  const rpc = "**/rest/v1/rpc/edit_requirement";
  const gate = new Promise((resolve) => {
    releaseSave = resolve;
  });
  await page.route(rpc, async (route) => {
    await gate;
    await route.continue();
  });
  await editText("Title", "Updated boundary requirement");
  await expect(
    page.getByRole("group", { name: "Requirement details", exact: true }),
  ).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  await expect(panel).toBeVisible();
  assert.equal((await records())[0].title, original.title);
  releaseSave();
  await waitEdit("title", "Updated boundary requirement", 1);
  await page.unroute(rpc);
  assert.deepEqual(
    await data(client.from("requirement_evidence").select().eq("id", evidenceLink.id).single()),
    evidenceLink,
  );

  await page.getByRole("combobox", { name: /^Requirement type:/ }).click();
  await page.getByRole("option", { name: /^performance$/i }).click();
  await waitEdit("requirement_type", "performance", 2);
  await page.getByRole("combobox", { name: /^Owner:/ }).click();
  await page.getByRole("option", { name: owner.name, exact: true }).click();
  await waitEdit("owner_party_id", owner.id, 3);
  const statement =
    "The service shall validate every authorized boundary.\nThe result shall be recorded.";
  await editText("Statement", statement, true);
  await waitEdit("statement", statement, 4);
  await page.screenshot({
    path: "/tmp/requirement-edit-history-preview.png",
    animations: "disabled",
  });
  const edits = (await history()).slice(initialEvents);
  assert.ok(
    edits.every(
      (event) =>
        event.actor_party_id &&
        event.requirement_revision_id === original.id &&
        event.source_requirement_revision_id === null &&
        event.occurred_at,
    ),
  );
  assert.deepEqual(edits[0].changes.title, {
    before: original.title,
    after: "Updated boundary requirement",
  });
  await page.getByRole("tab", { name: "Edit history", exact: true }).click();
  await page.getByText(edits[0].description, { exact: true }).waitFor();
  await noRevisionControls();
  await page.screenshot({ path: "/tmp/requirement-edit-history.png", animations: "disabled" });

  await page.goto(`${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Statement`);
  await page.getByRole("button", { name: /^Title: Updated boundary requirement/ }).waitFor();
  await noRevisionControls();
  await editText("Rationale", "The boundary changed after review.", true);
  await waitEdit("rationale", "The boundary changed after review.", 5);
  await page.reload();
  await page
    .getByRole("button", { name: /^Rationale: The boundary changed after review\./ })
    .waitFor();

  await page.route(rpc, async (route) => {
    const response = await route.fetch();
    assert.equal(response.status(), 200);
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Test response interrupted after saving" }),
    });
  });
  await editText("Acceptance criteria", "Every updated boundary case has a recorded result.", true);
  await page.getByRole("button", { name: "Retry change", exact: true }).waitFor();
  assert.equal((await history()).length, initialEvents + 6);
  await page
    .getByText("Every updated boundary case has a recorded result.", { exact: true })
    .waitFor();
  await page.unroute(rpc);
  await page.getByRole("button", { name: "Retry change", exact: true }).click();
  await waitEdit("acceptance_criteria", "Every updated boundary case has a recorded result.", 6);

  const stale = await context.newPage();
  stale.on("pageerror", (error) => errors.push(error.message));
  await stale.goto(`${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Statement`);
  await stale.getByRole("button", { name: /^Title: Updated boundary requirement/ }).waitFor();
  await editText("Title", "Current boundary requirement");
  await waitEdit("title", "Current boundary requirement", 7);
  await stale.getByRole("button", { name: /^Title:/ }).click();
  await stale
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Stale unsaved boundary title");
  await stale.getByRole("textbox", { name: "Title", exact: true }).press("Enter");
  await stale.getByRole("button", { name: "Retry change", exact: true }).waitFor();
  await stale.getByText("Stale unsaved boundary title", { exact: true }).waitFor();
  assert.equal((await history()).length, initialEvents + 7);
  assert.equal((await records())[0].title, "Current boundary requirement");
  await stale.getByRole("button", { name: "Discard change", exact: true }).click();
  await stale.reload();
  await stale.getByRole("button", { name: /^Title: Current boundary requirement/ }).waitFor();
  await stale.close();
  const final = (await records())[0];
  assert.equal((await records()).length, 1);
  assert.equal(final.id, original.id);
  assert.equal(final.created_at, original.created_at);
  assert.equal(final.version_number, original.version_number);
  assert.deepEqual(
    await data(client.from("requirement_evidence").select().eq("id", evidenceLink.id).single()),
    evidenceLink,
  );
  const empty = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-EMPTY",
  });
  await page.goto(`${origin}/programs/${program.id}/requirements/${empty.id}`);
  await page.getByRole("button", { name: "Add requirement details", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Add requirement details", exact: true });
  assert.equal(await details.getByLabel(/^(Version|State|Published)$/i).count(), 0);
  await details
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("New requirement details");
  await details.getByRole("combobox", { name: "Requirement type", exact: true }).click();
  await page.getByRole("option", { name: "Security", exact: true }).click();
  await details
    .getByRole("textbox", { name: "Statement", exact: true })
    .fill("The new requirement has an authored statement.");
  await details
    .getByRole("textbox", { name: "Acceptance criteria", exact: true })
    .fill("The authored criterion can be verified.");
  await details.getByRole("button", { name: "Save requirement details", exact: true }).click();
  await details.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: /^Title: New requirement details/ }).waitFor();
  await noRevisionControls();
  const created = await data(
    client.from("requirement_revisions").select().eq("engineering_requirement_id", empty.id),
  );
  assert.equal(created.length, 1);
  assert.equal(created[0].owner_party_id, null);
  const creationEvent = await data(
    client.from("activity_events").select().eq("requirement_revision_id", created[0].id),
  );
  assert.equal(creationEvent.length, 1);
  assert.equal(creationEvent[0].event_type, "created");
  assert.deepEqual(errors, []);
  console.log(
    "PASS requirement edit history: no revision UI or row copies, inline same-record edits, preserved links, before/after actor history, pending guard, lost-response retry, stale edit recovery, full-page persistence.",
  );
} catch (error) {
  console.error((await page.locator("body").innerText()).slice(0, 6000));
  await page.screenshot({ path: "/tmp/requirement-edit-history-failure.png", fullPage: true });
  throw error;
} finally {
  releaseSave?.();
  await browser.close();
  await workspace.cleanup();
}
