#!/usr/bin/env node
/** Form handoff, dirty dismissal, pending protection and failed-save recovery at desktop and phone widths. */
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
const workspace = await localWorkspace("pattern-form-edges");
const out = process.env.PATTERN_ARTIFACT_DIR
  ? join(process.env.PATTERN_ARTIFACT_DIR, "form-edges")
  : await mkdtemp(join(tmpdir(), "pattern-form-edges-"));
const errors = [];
await mkdir(out, { recursive: true });
const data = async (q) => {
  const r = await q;
  assert.ifError(r.error);
  return r.data;
};
const insert = (table, values) =>
  data(
    workspace.client
      .from(table)
      .insert({ tenant_id: workspace.tenantId, ...values })
      .select()
      .single(),
  );
let browser, release;
try {
  const product = await insert("products", { code: "AUDIT-VARIANT", name: "Audit product" });
  const rev = await insert("product_revisions", { product_id: product.id, version_number: 1 });
  const config = await insert("product_configurations", {
    product_id: product.id,
    code: "BASE",
    name: "Base configuration",
  });
  const element = await insert("product_elements", {
    product_revision_id: rev.id,
    code: "PROCESSOR",
    name: "Audit processor",
    element_type: "hardware",
  });
  await insert("product_configuration_elements", {
    product_revision_id: rev.id,
    product_configuration_id: config.id,
    product_element_id: element.id,
  });
  const program = await insert("programs", { code: "AUDIT-PROGRAM", name: "Variant form audit" });
  const resolutions = await data(
    workspace.client.from("profile_resolutions").select().eq("state", "published").limit(1),
  );
  assert.ok(resolutions.length);
  const selected = await data(
    workspace.client
      .from("selected_controls")
      .select("control_id")
      .eq("profile_resolution_id", resolutions[0].id)
      .limit(1),
  );
  const control = await data(
    workspace.client.from("controls").select().eq("id", selected[0].control_id).single(),
  );
  await insert("program_reference_choices", {
    program_id: program.id,
    profile_resolution_id: resolutions[0].id,
    catalog_revision_id: control.catalog_revision_id,
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/library/products/${product.id}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("tab", { name: /^Configurations/ }).click();
  await page.getByRole("button", { name: "Create configuration", exact: true }).first().click();
  const create = page.getByRole("dialog", { name: "Create configuration", exact: true });
  await expect(create.getByRole("textbox", { name: "Code", exact: true })).toBeFocused();
  await create
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Retained configuration draft");
  await create.getByRole("button", { name: "Cancel", exact: true }).click();
  const prompt = page.getByRole("alertdialog", { name: "Discard changes?", exact: true });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(create.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
    "Retained configuration draft",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ animations: "disabled", path: `${out}/configuration-create-mobile.png` });
  await create.getByRole("button", { name: "Cancel", exact: true }).click();
  await prompt.getByRole("button", { name: "Discard changes", exact: true }).click();
  await data(
    workspace.client
      .from("product_revisions")
      .update({ state: "published", revision: rev.revision + 1 })
      .eq("id", rev.id)
      .select()
      .single(),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await page.getByRole("button", { name: "Create system", exact: true }).first().click();
  await page.getByRole("menuitem", { name: "Add system from product", exact: true }).click();
  await page.getByRole("row").filter({ hasText: "Base configuration" }).first().click();
  await page
    .getByRole("button", { name: "Add Audit product · Base configuration", exact: true })
    .click();
  const variant = page.getByRole("dialog", { name: "Add system from product", exact: true });
  const name = variant.getByRole("textbox", { name: "Name", exact: true });
  await expect(name).toBeFocused();
  await name.fill("Retained variant draft");
  await variant.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(name).toHaveValue("Retained variant draft");
  const submit = variant.getByRole("button", { name: "Add system from product", exact: true });
  assert.equal(
    await submit.evaluate(
      (button) => button.type === "submit" && button.form instanceof HTMLFormElement,
    ),
    true,
  );
  await submit.click();
  await expect(variant.getByRole("alert")).toContainText("Choose confidentiality");
  for (const label of ["Confidentiality", "Integrity", "Availability"]) {
    await variant.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: "Low", exact: true }).click();
  }
  await variant
    .getByRole("textbox", { name: "Categorization rationale", exact: true })
    .fill("Local form guard check");
  await page.screenshot({ animations: "disabled", path: `${out}/variant-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(submit).toBeInViewport();
  await page.screenshot({ animations: "disabled", path: `${out}/variant-mobile.png` });
  let entered;
  const enteredPromise = new Promise((resolve) => (entered = resolve));
  await page.route("**/rest/v1/rpc/add_program_system", async (route) => {
    entered();
    await new Promise((resolve) => (release = resolve));
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Test save failure" }),
    });
  });
  await submit.click();
  await enteredPromise;
  await expect(name).toBeDisabled();
  await expect(submit).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(variant).toBeVisible();
  release();
  release = null;
  await expect(variant.getByRole("alert")).toContainText("Test save failure");
  await expect(name).toHaveValue("Retained variant draft");
  await expect(name).toBeEnabled();
  await page.unroute("**/rest/v1/rpc/add_program_system");
  await submit.click();
  await expect(variant).toBeHidden();
  const systems = await data(
    workspace.client
      .from("systems")
      .select()
      .eq("program_id", program.id)
      .eq("name", "Retained variant draft"),
  );
  assert.equal(systems.length, 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS configuration dirty protection and variant first focus, native form, validation, dirty cancel, pending Escape/edit blocking, failed-save retention and successful retry passed at 1440px and 390px.",
  );
} finally {
  release?.();
  await browser?.close();
  await workspace.cleanup();
}
