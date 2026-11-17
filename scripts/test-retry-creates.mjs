#!/usr/bin/env node
/**
 * The dedicated creates are safe to retry (Create once): Create configuration, Create element,
 * Create product assessment and Create compliance statement. Each insert reaches the server and its
 * answer is lost; the Dialog keeps the draft and says trying again makes no second record, and the
 * same primary, pressed again in the same Dialog, finds the first try, so one record exists.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("retry-creates");
const { client, tenantId } = workspace;
const errors = [];
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
const rows = async (table, filters) => {
  let query = client.from(table).select("*").eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  return data(query);
};

/** Lets the next POST to `table` reach the server, then answers the browser with a network failure. */
async function loseAnswer(page, table) {
  let reached;
  const done = new Promise((resolve) => {
    reached = resolve;
  });
  const pattern = `**/rest/v1/${table}*`;
  let lost = false;
  await page.route(pattern, async (route) => {
    if (lost || route.request().method() !== "POST") return route.continue();
    lost = true;
    const response = await route.fetch();
    reached(response.status());
    await route.abort("failed");
  });
  return { reached: done, restore: () => page.unroute(pattern) };
}

/**
 * Presses the Dialog's primary while its insert's answer is lost, checks the draft is kept with the
 * words that say a retry makes no second record, then presses it again in the same Dialog.
 */
async function retryCreate(page, { dialog, primary, table, field, value, title, words }) {
  const lost = await loseAnswer(page, table);
  await primary.click();
  assert.equal(await lost.reached, 201, `${table}: the first try's insert reached the server`);
  const alert = dialog.getByRole("alert");
  await expect(alert).toContainText(title);
  await expect(alert).toContainText(words);
  await expect(field).toHaveValue(value);
  await expect(primary).toBeFocused();
  await lost.restore();
  await primary.click();
  await expect(dialog).toBeHidden();
}

/** A code another record holds is the Code field's own error, and nothing more is written. */
async function expectCodeTaken(page, { operation, code, message }) {
  await page.getByRole("button", { name: operation, exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: operation, exact: true });
  const field = dialog.getByRole("textbox", { name: "Code", exact: true });
  await field.fill(code);
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(`Another ${code}`);
  await dialog.getByRole("button", { name: operation, exact: true }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveAccessibleDescription(new RegExp(message.replace(/\./g, "\\.")));
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  console.log(`${operation}: a code another record holds is the Code field's error`);
}

let browser;
try {
  // A product with a draft version (one element) and another with a published version.
  const product = await insert("products", { code: "RETRY", name: "Retry product" });
  const draft = await insert("product_revisions", { product_id: product.id, version_number: 1 });
  const processor = await insert("product_elements", {
    product_revision_id: draft.id,
    code: "PROC",
    name: "Processor",
    element_type: "hardware",
  });
  const assessed = await insert("products", { code: "RETRY-PUB", name: "Retry assessed product" });
  const published = await insert("product_revisions", {
    product_id: assessed.id,
    version_number: 1,
  });
  await insert("product_elements", {
    product_revision_id: published.id,
    code: "CORE",
    name: "Core",
    element_type: "subsystem",
  });
  await data(
    client
      .from("product_revisions")
      .update({ state: "published", revision: published.revision + 1 })
      .eq("id", published.id)
      .select()
      .single(),
  );
  // A program that has received a customer's requirements document of one requirement.
  const program = await insert("programs", { code: "RETRY-PRG", name: "Retry program" });
  const imported = await data(
    client.rpc("import_customer_requirements", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_request_id: crypto.randomUUID(),
      p_source: { code: "CUS-RETRY", title: "Retry customer requirements" },
      p_requirements: [
        { reference: "3.1", title: "Arming interlock", statement: "The unit shall interlock." },
      ],
    }),
  );
  const requirementId = imported.requirementIds[0];
  assert.ok(requirementId, "The customer's requirement was imported");

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (prompt) => {
    errors.push(`Unexpected native ${prompt.type()}: ${prompt.message()}`);
    void prompt.dismiss();
  });
  await page.goto(`${origin}/library/products/${product.id}?tab=Configurations`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // Create configuration, with every element of the draft version included.
  await page.getByRole("button", { name: "Create configuration", exact: true }).first().click();
  const configuration = page.getByRole("dialog", { name: "Create configuration", exact: true });
  const code = configuration.getByRole("textbox", { name: "Code", exact: true });
  await code.fill("GL");
  await configuration.getByRole("textbox", { name: "Name", exact: true }).fill("Ground launch");
  await retryCreate(page, {
    dialog: configuration,
    primary: configuration.getByRole("button", { name: "Create configuration", exact: true }),
    table: "product_configurations",
    field: code,
    value: "GL",
    title: "The configuration was not created",
    words: "trying again will not make a second configuration",
  });
  const configurations = await rows("product_configurations", { product_id: product.id });
  assert.equal(configurations.length, 1, "A retried Create configuration makes one configuration");
  assert.equal(configurations[0].revision, 1, "The retry wrote nothing over the first try");
  const included = await rows("product_configuration_elements", {
    product_configuration_id: configurations[0].id,
  });
  assert.deepEqual(
    included.map((row) => row.product_element_id),
    [processor.id],
    "The retry included the version's element once",
  );
  console.log("Create configuration: one configuration after a lost answer and a retry");
  await expectCodeTaken(page, {
    operation: "Create configuration",
    code: "GL",
    message: "Another configuration of this product has the code GL. Choose another code.",
  });

  // Create element, in the configuration just created.
  await page.goto(`${origin}/library/products/${product.id}?tab=Structure`);
  await page.getByRole("button", { name: "Create element", exact: true }).first().click();
  const element = page.getByRole("dialog", { name: "Create element", exact: true });
  await element.getByRole("textbox", { name: "Name", exact: true }).fill("Guidance unit");
  const elementCode = element.getByRole("textbox", { name: "Code", exact: true });
  await elementCode.fill("GUID");
  await retryCreate(page, {
    dialog: element,
    primary: element.getByRole("button", { name: "Create element", exact: true }),
    table: "product_elements",
    field: elementCode,
    value: "GUID",
    title: "The element was not saved",
    words: "trying again will not make a second element",
  });
  const elements = await rows("product_elements", { product_revision_id: draft.id, code: "GUID" });
  assert.equal(elements.length, 1, "A retried Create element makes one element");
  assert.equal(elements[0].revision, 1, "The retry wrote nothing over the first try");
  const memberships = await rows("product_configuration_elements", {
    product_element_id: elements[0].id,
  });
  assert.deepEqual(
    memberships.map((row) => row.product_configuration_id),
    [configurations[0].id],
    "The element joined its configuration once",
  );
  console.log("Create element: one element after a lost answer and a retry");
  await expectCodeTaken(page, {
    operation: "Create element",
    code: "GUID",
    message: "Another element of this version has the code GUID. Choose another code.",
  });

  // Create product assessment, of the published version against a published control baseline.
  await page.goto(`${origin}/library/products/${assessed.id}?tab=Assessment`);
  await page
    .getByRole("button", { name: "Create product assessment", exact: true })
    .first()
    .click();
  const assessment = page.getByRole("dialog", { name: "Create product assessment", exact: true });
  const title = assessment.getByRole("textbox", { name: "Title", exact: true });
  await title.fill("Retry product assessment");
  await assessment.getByRole("combobox", { name: "Control baseline", exact: true }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  await retryCreate(page, {
    dialog: assessment,
    primary: assessment.getByRole("button", { name: "Create product assessment", exact: true }),
    table: "product_assessments",
    field: title,
    value: "Retry product assessment",
    title: "The product assessment was not created",
    words: "trying again will not make a second product assessment",
  });
  const assessments = await rows("product_assessments", { product_revision_id: published.id });
  assert.equal(assessments.length, 1, "A retried Create product assessment makes one assessment");
  await page.waitForURL(`**/library/product-assessments/${assessments[0].id}`);
  console.log("Create product assessment: one assessment after a lost answer and a retry");

  // Create compliance statement, from the requirement's preview in the Compliance matrix.
  await page.goto(`${origin}/programs/${program.id}/compliance`);
  await page.getByRole("button", { name: "Preview 3.1 Arming interlock", exact: true }).click();
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Create compliance statement", exact: true })
    .click();
  const answer = page.getByRole("dialog", { name: "Create compliance statement", exact: true });
  await answer.getByRole("combobox", { name: "Compliance", exact: true }).click();
  await page.getByRole("option", { name: "Compliant", exact: true }).click();
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  const statement = answer.getByRole("textbox", { name: /^Compliance statement/ });
  await statement.fill("Shown in the arming test.");
  await retryCreate(page, {
    dialog: answer,
    primary: answer.getByRole("button", { name: "Create compliance statement", exact: true }),
    table: "requirement_compliance",
    field: statement,
    value: "Shown in the arming test.",
    title: "The compliance statement was not saved",
    words: "trying again will not make a second compliance statement",
  });
  const answers = await rows("requirement_compliance", {
    engineering_requirement_id: requirementId,
  });
  assert.equal(answers.length, 1, "A retried Create compliance statement records one answer");
  assert.equal(answers[0].revision, 1, "The retry wrote nothing over the first try");
  console.log("Create compliance statement: one answer after a lost answer and a retry");

  assert.deepEqual(errors, []);
  console.log("Retry creates passed: four Dialogs, one record each.");
} finally {
  await browser?.close();
  await workspace.cleanup();
}
