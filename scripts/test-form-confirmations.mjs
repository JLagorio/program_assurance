#!/usr/bin/env node
/** Shared async confirmations retain drafts, nest focus, and hold forms during saves. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("form-confirmations");
const artifacts = process.env.PATTERN_ARTIFACT_DIR
  ? join(process.env.PATTERN_ARTIFACT_DIR, "forms")
  : await mkdtemp(join(tmpdir(), "form-confirmations-"));
await mkdir(artifacts, { recursive: true });
let browser, page, releaseSave;
const errors = [];
const prompt = () => page.getByRole("alertdialog", { name: "Discard changes?", exact: true });
const organization = () => page.getByRole("dialog", { name: "Create organization", exact: true });
const task = () => page.getByRole("dialog", { name: "Create task", exact: true });
const orgName = () => organization().getByRole("textbox", { name: /^Name/ });
async function openOrganization() {
  await page
    .getByRole("button", { name: /^(Create|Add) organization$/ })
    .first()
    .click();
  await expect(organization()).toBeVisible();
}
async function cancelDiscard(surface) {
  await expect(prompt()).toBeVisible();
  await expect(prompt().getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await prompt().getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(prompt()).toBeHidden();
  await expect(surface()).toBeVisible();
}
async function discard() {
  await prompt().getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(prompt()).toBeHidden();
}
async function footer(surface, primaryLabel) {
  const actions = surface.locator('[data-slot="dialog-footer"]');
  await expect(actions.getByRole("button")).toHaveText(["Cancel", primaryLabel]);
  const ownsForm = await actions
    .getByRole("button", { name: primaryLabel, exact: true })
    .evaluate((button) => button.type === "submit" && button.form instanceof HTMLFormElement);
  assert.ok(ownsForm, "The primary submits its own form");
}
async function insert(table, values) {
  const result = await workspace.client
    .from(table)
    .insert({ tenant_id: workspace.tenantId, ...values })
    .select()
    .single();
  assert.ifError(result.error);
  return result.data;
}
async function captureForm(surface, name, primaryLabel) {
  await footer(surface, primaryLabel);
  await page.screenshot({ path: join(artifacts, `${name}-desktop.png`), animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 });
  const rectangle = await surface.boundingBox();
  assert.ok(rectangle && rectangle.x >= 0 && rectangle.x + rectangle.width <= 390);
  await expect(surface.getByRole("button", { name: primaryLabel, exact: true })).toBeInViewport();
  await page.screenshot({ path: join(artifacts, `${name}-mobile.png`), animations: "disabled" });
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  const created = await workspace.client
    .from("programs")
    .insert({
      tenant_id: workspace.tenantId,
      code: `FORM-${workspace.run.slice(0, 8)}`,
      name: "Form confirmation checks",
    })
    .select()
    .single();
  assert.ifError(created.error);
  const program = created.data;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/vendors`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await openOrganization();
  await footer(organization(), "Create organization");
  await expect(organization().getByRole("combobox", { name: /^Party type/ })).toBeDisabled();
  await organization().getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(organization()).toBeHidden();
  await expect(prompt()).toBeHidden();

  await openOrganization();
  await orgName().fill("Retained organization draft");
  await organization().getByRole("button", { name: "Cancel", exact: true }).click();
  await cancelDiscard(organization);
  await expect(orgName()).toHaveValue("Retained organization draft");
  await page.keyboard.press("Escape");
  await expect(prompt()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(prompt()).toBeHidden();
  await expect(organization()).toBeVisible();
  await expect(orgName()).toHaveValue("Retained organization draft");
  await page.locator('[data-slot="alert-dialog-content"]').waitFor({ state: "detached" });
  await page.screenshot({ path: join(artifacts, "organization-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  const rectangle = await organization().boundingBox();
  assert.ok(rectangle && rectangle.x >= 0 && rectangle.x + rectangle.width <= 390);
  await expect(
    organization().getByRole("button", { name: "Create organization", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: join(artifacts, "organization-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });

  let saveStarted;
  const started = new Promise((resolve) => {
    saveStarted = resolve;
  });
  const held = new Promise((resolve) => {
    releaseSave = resolve;
  });
  await page.route("**/rest/v1/parties*", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    saveStarted();
    await held;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary confirmation-test failure" }),
    });
  });
  await organization().getByRole("button", { name: "Create organization", exact: true }).click();
  await started;
  await expect(orgName()).toBeDisabled();
  await expect(organization().getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(organization()).toBeVisible();
  await expect(prompt()).toBeHidden();
  releaseSave();
  releaseSave = null;
  await expect(organization().getByRole("alert")).toContainText(
    "Temporary confirmation-test failure",
  );
  await expect(orgName()).toBeEnabled();
  await expect(orgName()).toHaveValue("Retained organization draft");
  await page.unroute("**/rest/v1/parties*");
  await organization().getByRole("button", { name: "Create organization", exact: true }).click();
  await expect(organization()).toBeHidden();

  await page.getByRole("button", { name: "Preview row", exact: true }).first().click();
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Edit organization", exact: true })
    .click();
  const editedParty = () => page.getByRole("dialog", { name: "Edit person", exact: true });
  await page
    .getByRole("dialog", { name: "Edit organization", exact: true })
    .getByRole("combobox", { name: /^Party type/ })
    .click();
  await page.getByRole("option", { name: "Person", exact: true }).click();
  await expect(editedParty()).toBeVisible();
  await footer(editedParty(), "Edit person");
  await editedParty().getByRole("button", { name: "Cancel", exact: true }).click();
  await discard();
  await expect(editedParty()).toBeHidden();
  // Two SPA entries let browser Back exercise TanStack's async blocker.
  await page.getByRole("link", { name: "My work", exact: true }).click();
  await page.getByRole("link", { name: "Suppliers", exact: true }).click();
  await openOrganization();
  await orgName().fill("Navigation draft");
  await page.evaluate(() => history.back());
  await cancelDiscard(organization);
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(orgName()).toHaveValue("Navigation draft");
  await page.evaluate(() => history.back());
  await expect(prompt()).toBeVisible();
  await discard();
  await expect(page).toHaveURL(/\/work$/);
  await expect(organization()).toBeHidden();

  await page
    .getByRole("button", { name: /^(Create|Add) task$/ })
    .first()
    .click();
  await expect(task()).toBeVisible();
  await footer(task(), "Create task");
  await task()
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill("Retained task draft");
  await task().getByRole("combobox", { name: "Program", exact: true }).click();
  await page
    .getByRole("option", { name: `${program.code} · ${program.name}`, exact: true })
    .click();
  await task().getByRole("button", { name: "Cancel", exact: true }).click();
  await cancelDiscard(task);
  await expect(task().getByRole("textbox", { name: "Task title", exact: true })).toHaveValue(
    "Retained task draft",
  );
  await page.keyboard.press("Escape");
  await discard();
  await expect(task()).toBeHidden();
  // A wizard's page blocker must preserve an open descendant Sheet on Cancel and Escape.
  await page.getByRole("link", { name: "Programs", exact: true }).click();
  await page.getByRole("link", { name: "Create program", exact: true }).first().click();
  await page
    .getByRole("textbox", { name: "Program name", exact: true })
    .fill("Nested wizard draft");
  await page.getByRole("textbox", { name: "Program code", exact: true }).fill("NESTED-GUARD");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Tailor for this program…", exact: true }).click();
  await page.getByRole("button", { name: "Tailor controls", exact: true }).click();
  const controls = () => page.getByRole("dialog", { name: /^Tailor controls/ });
  await expect(controls()).toBeVisible();
  await page.evaluate(() => history.back());
  await cancelDiscard(controls);
  await page.evaluate(() => history.back());
  await expect(prompt()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(prompt()).toBeHidden();
  await expect(controls()).toBeVisible();
  await controls().getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(controls()).toBeHidden();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("Unnamed system", { exact: true }).click();
  const system = () => page.getByRole("dialog", { name: /^System ·/ });
  await system().getByRole("textbox", { name: "Name", exact: true }).fill("Nested system draft");
  await page.evaluate(() => history.back());
  await cancelDiscard(system);
  await page.evaluate(() => history.back());
  await expect(prompt()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(prompt()).toBeHidden();
  await expect(system()).toBeVisible();
  await expect(system().getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
    "Nested system draft",
  );
  await page.evaluate(() => history.back());
  await expect(prompt()).toBeVisible();
  await discard();
  await expect(page).toHaveURL(/\/programs$/);
  await expect(system()).toBeHidden();
  const organizations = await workspace.client
    .from("parties")
    .select("id")
    .eq("tenant_id", workspace.tenantId)
    .eq("party_type", "organization");
  assert.ifError(organizations.error);
  assert.equal(
    organizations.data.length,
    1,
    "Retry creates one record; cancelled drafts create none",
  );
  // LibraryEditor must use the same domain noun as RecordEditor's primary.
  const definition = await insert("component_definitions", {
    code: "FORM-COMPONENT",
    name: "Form naming component",
    category: "organizational_baseline",
  });
  await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 1,
  });
  await page.goto(`${origin}/library/components/${definition.id}`);
  await page.getByRole("tab", { name: "Structure", exact: true }).click();
  await page.getByRole("button", { name: "Create component", exact: true }).first().click();
  const component = page.getByRole("dialog", { name: "Create component", exact: true });
  await expect(component).toBeVisible();
  await captureForm(component, "library-component", "Create component");
  await component.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(component).toBeHidden();
  await expect(prompt()).toBeHidden();

  const product = await insert("products", { code: "FORM-PRODUCT", name: "Form naming product" });
  await insert("product_revisions", { product_id: product.id, version_number: 1 });
  const configuration = await insert("product_configurations", {
    product_id: product.id,
    code: "FORM-CONFIGURATION",
    name: "Form naming configuration",
  });
  await page.goto(`${origin}/library/products/${product.id}`);
  await page.getByRole("tab", { name: /^Configurations/ }).click();
  await page
    .getByRole("table", { name: "Product configurations", exact: true })
    .getByRole("row")
    .filter({ hasText: configuration.name })
    .getByRole("button", { name: "Row actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Edit configuration", exact: true }).click();
  const editedConfiguration = page.getByRole("dialog", { name: "Edit configuration", exact: true });
  await expect(editedConfiguration).toBeVisible();
  await captureForm(editedConfiguration, "library-configuration", "Edit configuration");
  await editedConfiguration.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editedConfiguration).toBeHidden();
  await expect(prompt()).toBeHidden();
  assert.deepEqual(errors, []);
  console.log(`PASS shared form confirmations; screenshots ${artifacts}`);
} catch (error) {
  if (page)
    await page.screenshot({ path: join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  console.error(`Form confirmation artifacts: ${artifacts}`);
  throw error;
} finally {
  releaseSave?.();
  await browser?.close();
  await workspace.cleanup();
}
