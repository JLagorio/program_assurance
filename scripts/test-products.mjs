#!/usr/bin/env node
/** Products in the browser: authoring a product, its configurations and elements, publishing, then a variant created from it in the wizard and on an existing program, and the surfaces that show the lineage. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("products");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1700, height: 1100 } });
context.setDefaultTimeout(45000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (prompt) => {
  errors.push(`Unexpected native dialog: ${prompt.message()}`);
  void prompt.dismiss();
});
page.on("console", (message) => {
  if (message.type() === "error") console.log("console error:", message.text().slice(0, 300));
});
const programCode = `PRD-${workspace.run.slice(0, 8)}`;
const { client, tenantId } = workspace;
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
/** Global reference rows carry no tenant; read them without the workspace filter. */
const reference = async (table, filters = {}) => {
  let query = client.from(table).select("*");
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
const dialog = () => page.getByRole("dialog");
async function saveElement(noun = "element") {
  await dialog()
    .getByRole("button", { name: `Create ${noun}`, exact: true })
    .click();
  await dialog().waitFor({ state: "hidden" });
}
async function structureRowMenu(text, item) {
  await page
    .getByRole("treegrid", { name: "Product structure", exact: true })
    .getByRole("row")
    .filter({ hasText: text })
    .first()
    .getByRole("button", { name: "Row actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
}
async function wizardRowMenu(name, item) {
  await page.getByRole("button", { name: `Row actions for ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
}
async function newConfiguration(code, name, description) {
  await page.getByRole("button", { name: "Create configuration", exact: true }).first().click();
  await dialog().getByRole("textbox", { name: "Code", exact: true }).fill(code);
  await dialog().getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await dialog().getByRole("textbox", { name: "Description", exact: true }).fill(description);
  await dialog().getByRole("button", { name: "Create configuration", exact: true }).click();
  await dialog().waitFor({ state: "hidden" });
}
async function newElement(name, code, type, untick = []) {
  await page.getByRole("button", { name: "Create element", exact: true }).first().click();
  await dialog().getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await dialog().getByRole("textbox", { name: "Code", exact: true }).fill(code);
  await choose("Type", type);
  for (const configuration of untick)
    await dialog().getByRole("checkbox", { name: configuration, exact: true }).uncheck();
  await saveElement();
}

try {
  const catalogs = await reference("catalog_revisions", { state: "published" });
  const profiles = await reference("profile_revisions", { state: "published" });
  const low = profiles.find((row) => /low/i.test(row.title));
  assert.ok(low, "Imported Low profile is available");
  // The names the product shows: the stable catalog and profile records, not the OSCAL document titles.
  const catalogTitle = (await reference("catalogs", { id: catalogs[0].catalog_id }))[0].title;
  const lowTitle = (await reference("profiles", { id: low.profile_id }))[0].title;
  const lowResolution = (
    await reference("profile_resolutions", { profile_revision_id: low.id })
  )[0];
  const lowSelected = await reference("selected_controls", {
    profile_resolution_id: lowResolution.id,
  });
  const lowIds = new Set(lowSelected.map((row) => row.control_id));
  const catalogControls = await reference("controls", { catalog_revision_id: catalogs[0].id });
  const inLow = catalogControls.find((row) => lowIds.has(row.id));
  const outsideLow = catalogControls.find((row) => !lowIds.has(row.id) && row.status === "active");
  // A published library component with one claim inside the Low baseline and one outside it.
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

  // The library: a product, its first version, two configurations and four elements.
  await login(page, "/library/products");
  await page.getByRole("heading", { name: "Products", exact: true }).waitFor();
  assert.ok(await page.getByRole("link", { name: "Products", exact: true }).first().isVisible());
  await page.getByRole("button", { name: "Create product", exact: true }).click();
  await dialog().getByRole("textbox", { name: /^Code/ }).fill("MSL-A");
  await dialog().getByRole("textbox", { name: /^Name/ }).fill("Missile A");
  await dialog()
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Air-to-ground missile.");
  await dialog().getByRole("button", { name: "Create product", exact: true }).click();
  await page.waitForURL(/\/library\/products\/[0-9a-f-]{36}/);
  const productId = new URL(page.url()).pathname.split("/").at(-1);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Create product version", exact: true }).click();
  await page.getByRole("combobox", { name: "Version", exact: true }).waitFor();
  assert.match(
    await page.getByRole("combobox", { name: "Version", exact: true }).innerText(),
    /1 · draft/,
  );
  assert.ok(await page.getByRole("button", { name: "Publish version", exact: true }).isDisabled());
  await page.getByRole("tab", { name: /^Configurations/ }).click();
  await newConfiguration("GL", "Ground launch", "Launched from a ground launcher.");
  await newConfiguration("AL", "Air launch", "Carried on an aircraft pylon.");
  await page
    .getByRole("table", { name: "Product configurations", exact: true })
    .getByRole("row")
    .filter({ hasText: "Air launch" })
    .waitFor();
  const configurations = await rows("product_configurations", { product_id: productId });
  assert.equal(configurations.length, 2);
  const ground = configurations.find((row) => row.code === "GL");
  const air = configurations.find((row) => row.code === "AL");
  await page.screenshot({ path: "/tmp/products-configurations.png", fullPage: true });

  await page.getByRole("tab", { name: /^Structure/ }).click();
  await page.getByRole("button", { name: "Create element", exact: true }).first().click();
  assert.ok(
    await dialog().getByRole("checkbox", { name: "Ground launch", exact: true }).isChecked(),
  );
  assert.ok(await dialog().getByRole("checkbox", { name: "Air launch", exact: true }).isChecked());
  await dialog().getByRole("textbox", { name: "Name", exact: true }).fill("Guidance section");
  await dialog().getByRole("textbox", { name: "Code", exact: true }).fill("GUID");
  await choose("Type", "Subsystem");
  await saveElement();
  await structureRowMenu("Guidance section", "Add from library…");
  await page.getByLabel("Search the library", { exact: true }).fill("wizard-audit");
  await dialog().getByRole("row").filter({ hasText: "wizard-audit" }).first().click();
  await page
    .getByRole("button", { name: "Add Audit policy under Guidance section", exact: true })
    .click();
  await dialog().getByRole("heading", { name: "Create component", exact: true }).waitFor();
  assert.equal(
    await dialog().getByRole("textbox", { name: "Code", exact: true }).inputValue(),
    "WIZARD-AUDIT",
  );
  assert.ok((await dialog().innerText()).includes("from the component"));
  await page.screenshot({ path: "/tmp/products-element-dialog.png", fullPage: true });
  await saveElement("component");
  await newElement("Ground launcher", "LNCH", "Subsystem", ["Air launch"]);
  await newElement("Air-launch pylon", "PYLN", "Subsystem", ["Ground launch"]);
  const structure = page.getByRole("treegrid", { name: "Product structure", exact: true });
  await structure.getByRole("row").filter({ hasText: "Air-launch pylon" }).waitFor();
  const structureText = await structure.innerText();
  assert.ok(
    structureText.includes("All configurations"),
    "Common elements read as all configurations",
  );
  const launcherRow = structure.getByRole("row").filter({ hasText: "Ground launcher" }).first();
  assert.ok((await launcherRow.innerText()).includes("Ground launch"));
  assert.ok(!(await launcherRow.innerText()).includes("Air launch"));
  const auditRow = structure.getByRole("row").filter({ hasText: "Audit policy" }).first();
  assert.ok((await auditRow.innerText()).includes("Library"));
  const elements = await rows("product_elements");
  assert.equal(elements.length, 4);
  const guidance = elements.find((row) => row.code === "GUID");
  const audit = elements.find((row) => row.code === "WIZARD-AUDIT");
  const launcher = elements.find((row) => row.code === "LNCH");
  const pylon = elements.find((row) => row.code === "PYLN");
  assert.equal(audit.parent_element_id, guidance.id);
  assert.equal(audit.defined_component_id, policy.id);
  assert.equal((await rows("product_configuration_elements")).length, 6);
  await page.screenshot({ path: "/tmp/products-structure.png", fullPage: true });

  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await page.getByRole("button", { name: "Export OSCAL", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Create element", exact: true }).count(), 0);
  const revision = (await rows("product_revisions", { product_id: productId }))[0];
  assert.equal(revision.state, "published");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export OSCAL", exact: true }).click(),
  ]);
  assert.match(download.suggestedFilename(), /MSL-A-v1-component-definition\.json$/);
  await page.screenshot({ path: "/tmp/products-published.png", fullPage: true });

  // The wizard: a Ground-launch variant, one inherited element pruned, one customer element added.
  await page.goto(`${origin}/programs/new`);
  await page.getByRole("textbox", { name: "Program name", exact: true }).waitFor();
  await page
    .getByRole("textbox", { name: "Program name", exact: true })
    .fill("Products validation program");
  await page.getByRole("textbox", { name: "Program code", exact: true }).fill(programCode);
  await page
    .getByRole("textbox", { name: "Mission", exact: true })
    .fill("Validate a variant created from a product configuration.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: catalogTitle, exact: true }).check();
  await page.getByRole("checkbox", { name: lowTitle, exact: true }).check();
  await page.getByRole("link", { name: "Open profile", exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "From a product…", exact: true }).click();
  await page.getByLabel("Search products", { exact: true }).fill("Missile");
  await dialog().getByRole("row").filter({ hasText: "Ground launch" }).first().click();
  await page.getByRole("button", { name: "Add Missile A · Ground launch", exact: true }).click();
  await dialog()
    .getByRole("heading", { name: "Variant · Missile A · Ground launch", exact: true })
    .waitFor();
  assert.equal(
    await dialog().getByRole("textbox", { name: "Code", exact: true }).inputValue(),
    "MSL-A-GL",
  );
  for (const label of ["Confidentiality", "Integrity", "Availability"]) await choose(label, "Low");
  await page
    .getByRole("textbox", { name: "Categorization rationale", exact: true })
    .fill("A low impact variant for this validation workspace.");
  assert.match(await dialog().innerText(), /Elements inherited\s*3/);
  await page.screenshot({ path: "/tmp/products-wizard-variant.png", fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await dialog().waitFor({ state: "hidden" });
  await wizardRowMenu("unnamed system", "Remove");
  await page
    .getByRole("alertdialog", { name: "Remove system?" })
    .getByRole("button", { name: "Remove system", exact: true })
    .click();
  await wizardRowMenu("Ground launcher", "Remove");
  await page
    .getByRole("alertdialog", { name: "Remove element?" })
    .getByRole("button", { name: "Remove element", exact: true })
    .click();
  await wizardRowMenu("Guidance section", "Add component");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Customer telemetry");
  await page.getByRole("textbox", { name: "Code", exact: true }).fill("CUST");
  await choose("Type", "Software");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await dialog().waitFor({ state: "hidden" });
  const tree = page.getByRole("tree", { name: "Systems and components", exact: true });
  assert.equal(await tree.getByText("Variant", { exact: true }).count(), 1);
  assert.equal(await tree.getByText("Product", { exact: true }).count(), 2);
  await page.screenshot({ path: "/tmp/products-wizard-tree.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // The review names the variant's lineage and what it kept, dropped and added.
  await page
    .getByText(/^Variant of /)
    .first()
    .waitFor();
  const reviewText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  assert.ok(reviewText.includes("Missile A · Ground launch · v1"), "Review names the lineage");
  assert.ok(reviewText.includes("2 inherited · 1 removed · 1 added"), "Review counts the elements");
  await page.screenshot({ path: "/tmp/products-wizard-review.png", fullPage: true });
  await page.getByRole("button", { name: "Create program", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Create program", exact: true })
    .click();
  await page.waitForURL(/\/programs\/[0-9a-f-]{36}\?tab=System/);
  const programId = new URL(page.url()).pathname.split("/").at(-1);
  const systems = await rows("systems", { program_id: programId });
  assert.equal(systems.length, 4);
  const boundary = systems.find((row) => row.code === "MSL-A-GL");
  assert.equal(boundary.product_revision_id, revision.id);
  assert.equal(boundary.product_configuration_id, ground.id);
  assert.equal(boundary.system_type, "platform");
  assert.equal(systems.find((row) => row.code === "GUID").product_element_id, guidance.id);
  assert.equal(systems.find((row) => row.code === "WIZARD-AUDIT").product_element_id, audit.id);
  assert.equal(systems.find((row) => row.code === "CUST").product_element_id, null);
  assert.ok(!systems.some((row) => row.product_element_id === launcher.id));
  const components = await rows("system_components", { system_id: boundary.id });
  assert.equal(components.length, 1);
  assert.equal(components[0].defined_component_id, policy.id);
  assert.equal(components[0].applied_rationale, "Inherited from Missile A v1 · Ground launch");

  // The program's surfaces show the lineage.
  const programTree = page.getByRole("treegrid", { name: "Program systems", exact: true });
  await programTree.getByRole("row").filter({ hasText: "Customer telemetry" }).waitFor();
  assert.equal(await programTree.getByText("Variant", { exact: true }).count(), 1);
  assert.equal(await programTree.getByText("Product", { exact: true }).count(), 2);
  await page.screenshot({ path: "/tmp/products-program-tree.png", fullPage: true });
  await page.goto(`${origin}/programs/${programId}`);
  const rail = page.getByRole("complementary", { name: "Program properties", exact: true });
  await rail.getByRole("link", { name: "Missile A v1 · Ground launch", exact: true }).click();
  await page.waitForURL(new RegExp(`/library/products/${productId}\\?version=${revision.id}`));
  await page.getByRole("tab", { name: /^Variants/ }).click();
  const variantsText = await page.locator("body").innerText();
  assert.ok(variantsText.includes("Products validation program"));
  assert.ok(variantsText.includes("Missile A · Ground launch"));
  const variantsTable = page.getByRole("table", { name: "Product variants", exact: true });
  const groundVariantRow = variantsTable
    .getByRole("row")
    .filter({ hasText: "Missile A · Ground launch" });
  assert.deepEqual(
    (await groundVariantRow.getByRole("cell").allTextContents()).map((text) => text.trim()),
    [
      "MSL-A-GL",
      "Missile A · Ground launch",
      "Products validation program",
      "Ground launch",
      "1",
      "2",
      "1",
    ],
  );
  assert.equal(
    await groundVariantRow
      .getByRole("link", { name: "Missile A · Ground launch", exact: true })
      .getAttribute("href"),
    `/programs/${programId}/systems/${boundary.id}`,
  );
  await page.screenshot({
    path: "/tmp/products-variants-tab.png",
    fullPage: true,
    animations: "disabled",
  });

  // Version history remains an explicit selector; metadata belongs to Overview.
  await page.getByRole("tab", { name: "Versions", exact: true }).click();
  await page.getByRole("button", { name: "Open version", exact: true }).click();
  assert.match(await page.getByRole("combobox", { name: "Version", exact: true }).innerText(), /1/);
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("complementary", { name: "Product details", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  // The aside animates into the grid; visibility alone can capture its narrow first frame.
  await page.waitForFunction(() => {
    const aside = document.querySelector('aside[data-slot="shell-aside"]');
    return (
      aside &&
      aside.getBoundingClientRect().width >= 272 &&
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    );
  });
  await page.screenshot({
    path: "/tmp/products-overview-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/products-overview-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: /^Variants/ }).click();
  await variantsTable.waitFor();
  assert.equal(
    await page.getByRole("complementary", { name: "Product details", exact: true }).count(),
    0,
  );
  assert.ok(await page.getByRole("searchbox", { name: "Find variants", exact: true }).isVisible());
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
    "The mobile document stays within the viewport; the table owns horizontal scrolling.",
  );
  await page.screenshot({
    path: "/tmp/products-variants-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1700, height: 1100 });
  await page.goto(`${origin}/programs/${programId}/systems/${boundary.id}`);
  await page
    .getByRole("complementary", { name: "Record details", exact: true })
    .getByRole("link", { name: "Missile A v1 · Ground launch", exact: true })
    .waitFor();
  const guidanceSystem = systems.find((row) => row.code === "GUID");
  await page.goto(`${origin}/programs/${programId}/systems/${guidanceSystem.id}`);
  await page
    .getByRole("complementary", { name: "Record details", exact: true })
    .getByRole("link", { name: "GUID · Guidance section", exact: true })
    .waitFor();

  // Post-create: the Air-launch variant on the same program.
  await page.goto(`${origin}/programs/${programId}?tab=System`);
  await page.getByRole("button", { name: "From a product…", exact: true }).click();
  await dialog().getByRole("row").filter({ hasText: "Air launch" }).first().click();
  await page.getByRole("button", { name: "Add Missile A · Air launch", exact: true }).click();
  await dialog().getByRole("heading", { name: "Add system from a product", exact: true }).waitFor();
  for (const label of ["Confidentiality", "Integrity", "Availability"]) await choose(label, "Low");
  await page
    .getByRole("textbox", { name: "Categorization rationale", exact: true })
    .fill("A second variant on the same program.");
  await page.screenshot({ path: "/tmp/products-add-system.png", fullPage: true });
  await dialog().getByRole("button", { name: "Add system", exact: true }).click();
  await page
    .getByRole("treegrid", { name: "Program systems", exact: true })
    .getByRole("row")
    .filter({ hasText: "Air-launch pylon" })
    .waitFor();
  const afterSystems = await rows("systems", { program_id: programId });
  const airBoundary = afterSystems.find((row) => row.code === "MSL-A-AL");
  assert.equal(airBoundary.product_configuration_id, air.id);
  const airElements = afterSystems.filter(
    (row) => row.boundary_system_id === airBoundary.id && !row.is_authorization_boundary,
  );
  assert.equal(airElements.length, 3);
  assert.ok(airElements.some((row) => row.product_element_id === pylon.id));
  assert.equal((await rows("system_components", { system_id: airBoundary.id })).length, 1);
  await page.screenshot({ path: "/tmp/products-two-variants.png", fullPage: true });

  assert.deepEqual(errors, []);
  console.log(
    "PASS products: library authoring (product, version, configurations, elements incl. from the library, publish, export), a wizard variant with pruning and a customer element, lineage on the tree, rails and the Variants tab, and a second variant added post-create.",
  );
} finally {
  await browser.close();
  await workspace.cleanup();
}
