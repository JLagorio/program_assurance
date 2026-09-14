#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
context.setDefaultTimeout(45000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const programCode = `WIZ-${workspace.run.slice(0, 8)}`;
async function rows(table, filters = {}) {
  let query = workspace.client.from(table).select("*");
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
async function choose(label, name) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function login(target, path) {
  await target.goto(`${origin}${path}`);
  await target.getByLabel("Email", { exact: true }).fill(workspace.email);
  await target.getByLabel("Password", { exact: true }).fill(workspace.password);
  await target.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function completeNode(name, code) {
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Code", exact: true }).fill(code);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

try {
  const catalogs = await rows("catalog_revisions", { state: "published" });
  const profiles = await rows("profile_revisions", { state: "published" });
  const low = profiles.find((row) => /low/i.test(row.title));
  assert.ok(low, "Imported Low profile is available");
  await login(page, "/programs/new");
  await page.getByRole("textbox", { name: "Program name", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Save record", exact: true }).count(), 0);
  await page
    .getByRole("textbox", { name: "Program name", exact: true })
    .fill("Wizard validation program");
  await page.getByRole("textbox", { name: "Program code", exact: true }).fill(programCode);
  await page
    .getByRole("textbox", { name: "Mission", exact: true })
    .fill("Validate the complete program setup workflow.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: catalogs[0].title, exact: true }).check();
  await page.getByRole("checkbox", { name: low.title, exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("Unnamed system", { exact: true }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Validation platform");
  await page.getByRole("textbox", { name: "Code", exact: true }).fill(`${programCode}-SYS`);
  await page
    .getByRole("textbox", { name: "Function", exact: true })
    .fill("Exercise the system boundary and tailored profile.");
  await choose("Type", "Information system");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Add subsystem under Validation platform", exact: true })
    .click();
  await completeNode("Data plane", "DATA");
  await page.getByRole("button", { name: "Add subsystem under Data plane", exact: true }).click();
  await completeNode("Message service", "MESSAGES");
  await page.screenshot({ path: "/tmp/program-wizard-systems.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (const label of ["Confidentiality", "Integrity", "Availability"]) await choose(label, "Low");
  await page
    .getByRole("textbox", { name: "Categorization rationale", exact: true })
    .fill("A limited impact boundary for this isolated validation workspace.");
  await page.getByRole("combobox", { name: "Base profile", exact: true }).click();
  await page
    .getByRole("option", { name: new RegExp(low.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
    .click();
  await page.getByRole("button", { name: "Tailor controls", exact: true }).click();
  for (const [code, action, rationale] of [
    ["AC-2", "exclusion", "Account management is outside this validation boundary."],
    ["AC-4", "inclusion", "The message service requires explicit information flow enforcement."],
  ]) {
    await page.getByLabel("Search catalog controls", { exact: true }).fill(code);
    const control = (await rows("controls", { catalog_revision_id: catalogs[0].id, code }))[0];
    await page
      .getByRole("dialog")
      .getByRole("button", { name: control.title, exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Control decision rationale", exact: true })
      .fill(rationale);
    await page.getByRole("button", { name: `Record ${action}`, exact: true }).click();
  }
  await page.screenshot({ path: "/tmp/program-wizard-control-picker.png", fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: /^Parameters/ }).click();
  await page.getByRole("button", { name: "Set parameter values", exact: true }).click();
  await page.getByLabel("Search parameters", { exact: true }).fill("ac-1_prm_1");
  const parameter = (
    await rows("parameters", { catalog_revision_id: catalogs[0].id, source_id: "ac-1_prm_1" })
  )[0];
  await page
    .getByRole("dialog")
    .getByRole("button", { name: parameter.label, exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Parameter values", exact: true })
    .fill("Platform security team");
  await page
    .getByRole("textbox", { name: "Parameter override rationale", exact: true })
    .fill("This team owns policy distribution for this system.");
  await page.getByRole("button", { name: "Record parameter override", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Parameter override added" }).waitFor();
  await page.screenshot({ path: "/tmp/program-wizard-parameter-picker.png", fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({ path: "/tmp/program-wizard-tailoring.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Create program", exact: true }).waitFor();
  assert.ok(
    (await page.locator("body").innerText()).includes("Platform security team"),
    "Review contains the parameter override",
  );
  await page.screenshot({ path: "/tmp/program-wizard-review.png", fullPage: true });
  if (process.env.WIZARD_PREVIEW_ONLY === "1") {
    console.log("PASS program wizard browser preview through review");
  } else {
    await page.route("**/rest/v1/rpc/create_program_wizard", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          code: "23514",
          message: "Injected validation failure: draft must be retained",
        }),
      });
      await page.unroute("**/rest/v1/rpc/create_program_wizard");
    });
    await page.getByRole("button", { name: "Create program", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create program", exact: true })
      .click();
    await page
      .getByText("Injected validation failure: draft must be retained", { exact: true })
      .waitFor();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
    assert.equal((await rows("programs", { tenant_id: workspace.tenantId })).length, 0);
    assert.ok((await page.locator("body").innerText()).includes("Platform security team"));
    await page.getByRole("button", { name: "Create program", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create program", exact: true })
      .click();
    await page.waitForURL(/\/programs\/[0-9a-f-]+\?tab=System/, { timeout: 60000 });
    const programs = await rows("programs", { tenant_id: workspace.tenantId });
    assert.equal(programs.length, 1);
    assert.equal(programs[0].code, programCode);
    const systems = await rows("systems", { program_id: programs[0].id });
    assert.equal(systems.length, 1);
    assert.equal(systems[0].confidentiality_impact, "low");
    const nodes = await rows("composition_nodes", { system_id: systems[0].id });
    assert.equal(nodes.length, 2);
    assert.equal(
      nodes.find((row) => row.code === "MESSAGES").parent_id,
      nodes.find((row) => row.code === "DATA").id,
    );
    const requirements = await rows("implemented_requirements", { tenant_id: workspace.tenantId });
    assert.equal(requirements.length, 149);
    const authored = await rows("profile_revisions", { tenant_id: workspace.tenantId });
    assert.equal(authored.length, 1);
    assert.equal(authored[0].state, "draft");
    const docs = await rows("oscal_document_revisions", { id: authored[0].document_revision_id });
    assert.equal(docs.length, 1);
    const document = docs[0].original_content;
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(
      JSON.parse(
        readFileSync(
          new URL("./tests/fixtures/oscal-profile-1.2.2.schema.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    assert.ok(validate(document), JSON.stringify(validate.errors));
    assert.deepEqual(document.profile.imports[0]["exclude-controls"][0]["with-ids"], ["ac-2"]);
    assert.ok(document.profile.imports[0]["include-controls"][0]["with-ids"].includes("ac-4"));
    assert.deepEqual(
      document.profile.modify["set-parameters"].find((item) => item["param-id"] === "ac-1_prm_1")
        .values,
      ["Platform security team"],
    );
    for (const rule of await rows("profile_rules", { profile_revision_id: authored[0].id })) {
      const atPointer = rule.source_pointer
        .split("/")
        .slice(1)
        .reduce((value, key) => value?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], document);
      assert.deepEqual(
        atPointer,
        rule.definition,
        `Normalized ${rule.kind} rule matches authored source`,
      );
    }
    await page.screenshot({ path: "/tmp/program-wizard-created.png", fullPage: true });
    const fresh = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
    fresh.setDefaultTimeout(45000);
    const inspector = await fresh.newPage();
    inspector.on("pageerror", (error) => errors.push(error.message));
    await login(inspector, `/records/programs/${programs[0].id}`);
    await inspector
      .getByRole("heading", { name: "Wizard validation program", exact: true })
      .waitFor();
    assert.ok(
      (await inspector.locator("body").innerText()).includes(programCode),
      "Fresh session reads the same saved program in the schema inspector",
    );
    await fresh.close();
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS program wizard browser creation, failure recovery, and persisted control count",
    );
  }
} catch (error) {
  console.error("Program wizard browser check failed:", error.message);
  console.error((await page.locator("body").innerText()).slice(0, 7000));
  await page.screenshot({ path: "/tmp/program-wizard-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
