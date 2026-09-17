#!/usr/bin/env node
/** The four-step program setup end to end in the browser, then the surfaces it feeds. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1700, height: 1100 } });
context.setDefaultTimeout(45000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const programCode = `WIZ-${workspace.run.slice(0, 8)}`;
const { client, tenantId } = workspace;
async function rows(table, filters = {}) {
  let query = client.from(table).select("*");
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
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
async function choose(label, name) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function chooseMatching(label, pattern) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: pattern }).first().click();
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
async function rowMenu(name, item) {
  await page.getByRole("button", { name: `Row actions for ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
}
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

try {
  const catalogs = await rows("catalog_revisions", { state: "published" });
  const profiles = await rows("profile_revisions", { state: "published" });
  const low = profiles.find((row) => /low/i.test(row.title));
  assert.ok(low, "Imported Low profile is available");
  // The names the product shows: the stable catalog and profile records, not the OSCAL document titles.
  const catalogTitle = (await rows("catalogs", { id: catalogs[0].catalog_id }))[0].title;
  const lowTitle = (await rows("profiles", { id: low.profile_id }))[0].title;
  const lowResolution = (await rows("profile_resolutions", { profile_revision_id: low.id }))[0];
  const lowSelected = await rows("selected_controls", { profile_resolution_id: lowResolution.id });
  const lowIds = new Set(lowSelected.map((row) => row.control_id));
  const catalogControls = await rows("controls", { catalog_revision_id: catalogs[0].id });
  const inLow = catalogControls.find((row) => lowIds.has(row.id) && row.code !== "AC-2");
  const outsideLow = catalogControls.find(
    (row) => !lowIds.has(row.id) && row.status === "active" && row.code !== "AC-4",
  );
  // A published library component: one claim inside the Low baseline, one outside it.
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
  });
  for (const [control, status] of [
    [inLow, "implemented"],
    [outsideLow, "planned"],
  ])
    await insert("defined_component_implementations", {
      component_definition_revision_id: v1.id,
      defined_component_id: policy.id,
      control_id: control.id,
      description: `Claim on ${control.code}.`,
      implementation_status: status,
    });
  await update("component_definition_revisions", v1, { state: "published" });

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

  // Step 2: the catalog edition, the Low base profile, tailored for this program.
  await page.getByRole("radio", { name: catalogTitle, exact: true }).check();
  assert.ok(
    await page.getByRole("link", { name: "Open catalog", exact: true }).first().isVisible(),
  );
  await page.getByRole("checkbox", { name: lowTitle, exact: true }).check();
  await page.getByRole("link", { name: "Open profile", exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Tailor for this program…", exact: true }).click();
  await page.getByRole("button", { name: "Tailor controls…", exact: true }).click();
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
  await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: /^Parameters/ }).click();
  await page.getByRole("button", { name: "Set parameter values…", exact: true }).click();
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
    .fill("This team owns policy distribution for this program.");
  await page.getByRole("button", { name: "Record parameter override", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Parameter override recorded" }).waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: /^Controls/ }).click();
  const editorText = await page.locator("body").innerText();
  assert.ok(editorText.includes("Tailored out"), "The editor shows the tailored-out count");
  assert.ok(editorText.includes("Tailored in"), "The editor shows the tailored-in count");
  await page.screenshot({ path: "/tmp/program-wizard-tailoring.png", fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Edit tailoring · Out 1 · In 1", exact: true }).waitFor();
  await page.screenshot({ path: "/tmp/program-wizard-profiles.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Step 3: the system with its categorization and program profile, a subsystem, a library component.
  await page.getByText("Unnamed system", { exact: true }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Validation platform");
  await page.getByRole("textbox", { name: "Code", exact: true }).fill(`${programCode}-SYS`);
  await page
    .getByRole("textbox", { name: "Function", exact: true })
    .fill("Exercise the system boundary and the program profile.");
  await choose("Type", "Information system");
  for (const label of ["Confidentiality", "Integrity", "Availability"]) await choose(label, "Low");
  await page
    .getByRole("textbox", { name: "Categorization rationale", exact: true })
    .fill("A limited impact boundary for this isolated validation workspace.");
  await chooseMatching("Program profile", new RegExp(escape(lowTitle)));
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await rowMenu("Validation platform", "Add subsystem");
  await completeNode("Data plane", "DATA");
  await rowMenu("Data plane", "Add from library…");
  await page
    .getByRole("dialog")
    .getByRole("row")
    .filter({ hasText: "wizard-audit" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Add Audit policy under Data plane", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Name", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: "Name", exact: true }).inputValue(),
    "Audit policy",
  );
  assert.equal(
    await page.getByRole("textbox", { name: "Code", exact: true }).inputValue(),
    "WIZARD-AUDIT",
  );
  await page
    .getByRole("textbox", { name: "Rationale", exact: true })
    .fill("The audit policy applies to the data plane from day one.");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText(/1 seed/).waitFor();
  await page.screenshot({ path: "/tmp/program-wizard-systems.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Step 4: review, then create (after one injected failure).
  await page.getByRole("button", { name: "Create program", exact: true }).waitFor();
  // The review is a checkout summary: one card per step, counts and names, nothing repeated in full.
  const reviewText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  assert.ok(reviewText.includes("1 out, 1 in · 1 parameter override"), "Review sums the tailoring");
  assert.ok(reviewText.includes("1 from the library"), "Review counts the library component");
  assert.equal(await page.getByRole("button", { name: /^Edit /, exact: false }).count(), 3);
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
    assert.ok((await page.locator("body").innerText()).includes("1 parameter override"));
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
    assert.equal(systems.length, 3, "The boundary, the subsystem and the library element");
    const root = systems.find((row) => row.is_authorization_boundary);
    const dataPlane = systems.find((row) => row.code === "DATA");
    const element = systems.find((row) => row.code === "WIZARD-AUDIT");
    assert.equal(root.confidentiality_impact, "low");
    assert.equal(dataPlane.parent_system_id, root.id);
    assert.equal(element.parent_system_id, dataPlane.id);
    assert.equal(element.system_type, "other");
    const components = await rows("system_components", { system_id: root.id });
    assert.equal(components.length, 1);
    assert.equal(components[0].system_element_id, element.id);
    assert.equal(components[0].defined_component_id, policy.id);
    const references = await rows("program_reference_choices", { program_id: programs[0].id });
    assert.equal(references.length, 1);
    const overlay = (
      await rows("profile_resolutions", { id: references[0].profile_resolution_id })
    )[0];
    assert.equal(overlay.state, "published");
    assert.equal(overlay.base_profile_resolution_id, lowResolution.id);
    assert.equal(root.adopted_profile_resolution_id, overlay.id);
    const authored = await rows("profile_revisions", { tenant_id: workspace.tenantId });
    assert.equal(authored.length, 1);
    assert.equal(authored[0].state, "published");
    const imports = await rows("profile_imports", { profile_revision_id: authored[0].id });
    assert.equal(
      imports.find((row) => row.ordinal === 0).imported_profile_revision_id,
      low.id,
      "The program profile imports the Low profile",
    );
    const requirements = await rows("implemented_requirements", { tenant_id: workspace.tenantId });
    assert.equal(requirements.length, 149);
    const docs = await rows("oscal_document_revisions", { id: authored[0].document_revision_id });
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
    assert.deepEqual(document.profile.imports[0]["include-all"], {});
    assert.deepEqual(document.profile.imports[0]["exclude-controls"][0]["with-ids"], ["ac-2"]);
    assert.deepEqual(document.profile.imports[1]["include-controls"][0]["with-ids"], ["ac-4"]);
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
      assert.deepEqual(atPointer, rule.definition, `Normalized ${rule.kind} rule matches source`);
    }
    const targets = await rows("library_assignment_targets", { tenant_id: workspace.tenantId });
    assert.deepEqual(targets.map((row) => row.state).sort(), ["accepted", "not_in_baseline"]);

    // The program page: the tree with the library element, the rail with the references.
    const treegrid = page.getByRole("treegrid").first();
    await treegrid.locator("tr[data-row-id]").nth(2).waitFor();
    assert.equal(await treegrid.locator("tr[data-row-id]").count(), 3);
    await treegrid.locator(`tr[data-row-id="${element.id}"]`).getByText("Library").waitFor();
    await page.screenshot({ path: "/tmp/program-wizard-created.png", fullPage: true });
    await page.goto(`${origin}/programs/${programs[0].id}?tab=Overview`);
    const rail = page.getByRole("complementary", { name: "Program properties", exact: true });
    await rail
      .getByRole("link", { name: `${catalogTitle} · ${catalogs[0].version}`, exact: true })
      .waitFor();
    const authoredProfile = (await rows("profiles", { id: authored[0].profile_id }))[0];
    assert.equal(
      authoredProfile.title,
      `${lowTitle} — ${programCode} overlay`,
      "The overlay is named after the base profile's short name",
    );
    const profileLink = rail.getByRole("link", { name: new RegExp(escape(authoredProfile.title)) });
    await profileLink.waitFor();
    await page.screenshot({ path: "/tmp/program-wizard-rail.png", fullPage: true });

    // The profile page: the chain and the diff.
    await profileLink.click();
    await page.getByRole("tab", { name: "Tailoring", exact: true }).click();
    await page.getByText("Tailored out", { exact: true }).first().waitFor();
    const tailoringText = await page.locator("body").innerText();
    assert.ok(tailoringText.includes("AC-2"), "The profile page lists the control tailored out");
    assert.ok(tailoringText.includes("AC-4"), "The profile page lists the control tailored in");
    // The overlay's own name starts with the base's, so the chain is checked by its link, version beside it.
    await page.getByRole("link", { name: `${lowTitle} · ${low.version}`, exact: true }).waitFor();
    await page.screenshot({ path: "/tmp/program-wizard-profile-page.png", fullPage: true });

    // The catalog page scoped to the edition, with who selects each control.
    await page.goto(`${origin}/catalog?edition=${catalogs[0].id}`);
    await page.getByRole("combobox", { name: "Catalog edition", exact: true }).waitFor();
    await page.getByPlaceholder("Find a control").fill("AC-4");
    await page
      .getByRole("table")
      .locator("thead")
      .getByRole("button", { name: "Selected by", exact: true })
      .waitFor();
    await page.getByRole("row").filter({ hasText: "AC-4" }).first().waitFor();
    await page.screenshot({ path: "/tmp/program-wizard-catalog.png", fullPage: true });

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
      "PASS program wizard browser: four steps, layered program profile, library component as an element, failure recovery, and the program, profile and catalog surfaces",
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
