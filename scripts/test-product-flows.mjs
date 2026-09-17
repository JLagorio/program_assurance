import assert from "node:assert/strict";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("product-flows");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
context.setDefaultTimeout(45000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const records = async (table) => {
  const result = await workspace.client.from(table).select("*").eq("tenant_id", workspace.tenantId);
  assert.ifError(result.error);
  return result.data;
};
async function open(path, action, title) {
  await page.goto(`${origin}${path}`);
  await page.getByRole("button", { name: action, exact: true }).first().click();
  await page.getByRole("dialog", { name: title, exact: true }).waitFor();
  assert.equal(await page.getByRole("dialog").count(), 1, "Only one dialog is open");
  assert.equal(
    await page.getByRole("main").locator("form").count(),
    0,
    "No inline form replaces the page",
  );
}
async function choose(label, value) {
  await page.getByRole("dialog").getByLabel(label, { exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function save(label) {
  const id = await page.getByRole("dialog").getAttribute("id");
  await page.getByRole("dialog").getByRole("button", { name: label, exact: true }).click();
  await page.locator(`[id="${id}"]`).waitFor({ state: "hidden" });
}

try {
  const inserted = await workspace.client
    .from("programs")
    .insert({ tenant_id: workspace.tenantId, code: "FLOW-CHECK", name: "Product flow check" })
    .select()
    .single();
  assert.ifError(inserted.error);
  const program = inserted.data;
  await page.goto(`${origin}/risks`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Risk register", exact: true }).waitFor();

  await open("/risks", "Create risk", "Create risk");
  await page
    .getByRole("dialog")
    .getByLabel("Title *", { exact: true })
    .fill("Supply dependency review");
  await choose("Program *", program.name);
  await page.screenshot({ path: "/tmp/product-risk-dialog.png" });
  await save("Create risk");
  assert.equal((await records("risks"))[0].title, "Supply dependency review");
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit risk", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Title *", { exact: true }).fill("Unsaved change");
  await page.keyboard.press("Escape");
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("dialog").count(), 1, "Declining discard retains the dialog");
  assert.equal(
    await page.getByRole("dialog").getByLabel("Title *", { exact: true }).inputValue(),
    "Unsaved change",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal((await records("risks"))[0].title, "Supply dependency review");

  await open("/work", "Create task", "Create task");
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill("Review the system boundary");
  await page.getByRole("dialog").getByRole("combobox", { name: "Program", exact: true }).click();
  await page
    .getByRole("option", { name: `${program.code} · ${program.name}`, exact: true })
    .click();
  const assignee = (await records("parties")).find(
    (party) => party.auth_user_id === workspace.userId,
  );
  await choose("Responsible assignee", assignee.name);
  await save("Create task");
  assert.equal((await records("tasks"))[0].title, "Review the system boundary");
  assert.equal((await records("task_assignments"))[0].party_id, assignee.id);

  await open("/profiles", "Create profile", "Create profile");
  await page
    .getByRole("dialog")
    .getByLabel("Title *", { exact: true })
    .fill("Workspace profile check");
  await page.getByRole("dialog").getByLabel("Code *", { exact: true }).fill("FLOW-PROFILE");
  await save("Create profile");
  assert.equal((await records("profiles"))[0].code, "FLOW-PROFILE");

  await open(`/programs/${program.id}?tab=System`, "Create system", "Create system");
  assert.equal(
    await page.getByRole("dialog").getByLabel("Find Program", { exact: true }).count(),
    0,
    "Parent program stays fixed by context",
  );
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill("Boundary check system");
  await page.getByRole("dialog").getByLabel("Code", { exact: true }).fill("FLOW-SYSTEM");
  await choose("System type", "Information system");
  await save("Create system");
  const systems = await records("systems");
  assert.equal(systems[0].program_id, program.id);

  await open("/evidence", "Create evidence artifact", "Create evidence artifact");
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Artifact title", exact: true })
    .fill("Boundary review notes");
  await page.getByRole("dialog").getByRole("combobox", { name: "Kind", exact: true }).click();
  await page.getByRole("option", { name: "Document", exact: true }).click();
  await choose("Program", `${program.code} · ${program.name}`);
  await page
    .getByRole("dialog")
    .getByLabel("External reference", { exact: true })
    .fill("https://example.test/review-notes");
  await save("Create evidence artifact");
  assert.equal((await records("evidence_artifacts"))[0].title, "Boundary review notes");
  const version = (await records("evidence_versions"))[0];
  assert.equal(version.version_number, 1);
  assert.equal(version.state, "draft");
  assert.equal(version.external_uri, "https://example.test/review-notes");
  assert.equal(version.storage_object_name, null);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS product dialogs: risks, tasks, profiles, contextual systems, evidence, dirty cancellation, and real persistence",
  );
} catch (error) {
  console.error((await page.locator("body").innerText()).slice(0, 8000));
  await page.screenshot({ path: "/tmp/product-flow-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
