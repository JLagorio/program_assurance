#!/usr/bin/env node
/** Preview body headers preserve record commands, editor state, navigation and pending feedback. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect as baseExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
const expect = baseExpect.configure({ timeout: 30000 });
const ws = await localWorkspace("record-header-check");
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const artifacts = process.env.PATTERN_ARTIFACT_DIR
  ? join(process.env.PATTERN_ARTIFACT_DIR, "record-actions")
  : await mkdtemp(join(tmpdir(), "record-actions-"));
await mkdir(artifacts, { recursive: true });
let browser, page;
const data = async (q) => {
  const r = await q;
  assert.ifError(r.error);
  return r.data;
};
const insert = (table, values) =>
  data(
    ws.client
      .from(table)
      .insert({ tenant_id: ws.tenantId, ...values })
      .select()
      .single(),
  );
const publish = (table, row) =>
  data(
    ws.client
      .from(table)
      .update({
        state: "published",
        published_at: new Date().toISOString(),
        revision: row.revision + 1,
      })
      .eq("id", row.id)
      .select()
      .single(),
  );
const panel = () => page.locator('[data-shell-area="panel"]');
const header = () => panel().locator("[data-record-preview-header]");
const chrome = () => panel().locator('[data-slot="shell-panel-header"]');
const eye = (id) =>
  page.locator(`tr[data-row-id="${id}"]`).getByRole("button", { name: "Preview row", exact: true });
async function check(title, primary, more = false) {
  await expect(panel()).toHaveCount(1);
  await expect(header().getByRole("heading", { name: title, exact: true })).toHaveCount(1);
  await expect(chrome().getByRole("heading")).toHaveCount(0);
  await expect(chrome().getByRole("button", { name: /Edit|Complete|More/ })).toHaveCount(0);
  await expect(
    chrome().getByRole("link", { name: "Open full record in new tab", exact: true }),
  ).toBeVisible();
  await expect(header().getByRole("button", { name: primary, exact: true })).toBeVisible();
  await expect(header().getByRole("button")).toHaveCount(more ? 2 : 1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
}
async function cancelDialog() {
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
const errors = [];
try {
  const program = await insert("programs", {
    code: "HEADER-CHECK",
    name: "Record header validation",
  });
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS",
    name: "Header boundary",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: system.id,
    is_authorization_boundary: false,
    code: "CHILD",
    name: "Header hardware",
    system_type: "hardware",
  });
  const campaign = await insert("assessment_campaigns", {
    program_id: program.id,
    title: "Header campaign",
  });
  const procedure = await insert("procedures", {
    program_id: program.id,
    title: "Header procedure",
    description: "Disposable preview action validation.",
  });
  const revision = await insert("procedure_revisions", {
    procedure_id: procedure.id,
    version_number: 1,
    title: "Header draft revision",
    method: "test",
  });
  const publishedProcedure = await insert("procedure_revisions", {
    procedure_id: procedure.id,
    version_number: 2,
    title: "Header published revision",
    method: "test",
    state: "published",
    published_at: new Date().toISOString(),
  });
  const pkg = await insert("authorization_packages", {
    program_id: program.id,
    system_id: system.id,
    title: "Header package",
  });
  const pkgVersion = await insert("package_revisions", {
    package_id: pkg.id,
    version_number: 1,
    description: "Disposable draft package.",
  });
  await insert("package_revisions", {
    package_id: pkg.id,
    version_number: 2,
    description: "Second draft for preview navigation.",
  });
  const component = await insert("system_components", {
    system_id: system.id,
    system_element_id: child.id,
    code: "COMP",
    name: "Pinned component",
    component_type: "hardware",
  });
  const configuration = await insert("configuration_baselines", {
    system_id: system.id,
    version_number: 1,
    name: "Published test configuration",
  });
  await insert("component_pins", {
    system_id: system.id,
    configuration_baseline_id: configuration.id,
    system_component_id: component.id,
    version: "1",
  });
  await publish("configuration_baselines", configuration);
  const resolution = await data(
    ws.client
      .from("profile_resolutions")
      .select()
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1)
      .single(),
  );
  const selection = await data(
    ws.client
      .from("selected_controls")
      .select()
      .eq("profile_resolution_id", resolution.id)
      .limit(1)
      .single(),
  );
  const ssp = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: selection.id,
    description: "Disposable implementation narrative.",
  });
  await publish("ssp_revisions", ssp);
  const plan = await insert("assessment_plan_revisions", {
    campaign_id: campaign.id,
    ssp_revision_id: ssp.id,
    version_number: 1,
    title: "Header plan",
  });
  const run = await insert("test_runs", {
    title: "Header run",
    procedure_revision_id: publishedProcedure.id,
    configuration_baseline_id: configuration.id,
    plan_revision_id: plan.id,
  });
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/campaigns/${campaign.id}?tab=Procedures`);
  await page.getByLabel("Email", { exact: true }).fill(ws.email);
  await page.getByLabel("Password", { exact: true }).fill(ws.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: campaign.title, exact: true }),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/campaigns/${campaign.id}?tab=Procedures`);
    await eye(procedure.id).click();
    await check(procedure.title, "Edit procedure", true);
    if (width === 1440) {
      await eye(revision.id).click();
      await check(revision.title, "Edit revision");
      await eye(procedure.id).click();
      await check(procedure.title, "Edit procedure", true);
    }
    await page.screenshot({ path: `${artifacts}/procedure-${width}.png` });
    await header().getByRole("button", { name: "More actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Create procedure revision", exact: true }).click();
    await cancelDialog();
    await expect(panel()).toHaveCount(0);
    await eye(procedure.id).click();
    await header().getByRole("button", { name: "Edit procedure", exact: true }).click();
    await cancelDialog();
    await expect(panel()).toHaveCount(0);
    await eye(revision.id).click();
    await check(revision.title, "Edit revision");
    await header().getByRole("button", { name: "Edit revision", exact: true }).click();
    await cancelDialog();
    await expect(panel()).toHaveCount(0);
    await page.goto(`${origin}/packages/${pkg.id}`);
    await eye(pkgVersion.id).click();
    await check("Version 1", "Edit version");
    await expect(
      panel().getByRole("heading", { name: "Package version 1", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({ path: `${artifacts}/package-${width}.png` });
    await header().getByRole("button", { name: "Edit version", exact: true }).click();
    await cancelDialog();
    await check("Version 1", "Edit version");
    await chrome().getByRole("button", { name: "Next record", exact: true }).click();
    await check("Version 2", "Edit version");
    await chrome().getByRole("button", { name: "Previous record", exact: true }).click();
    await check("Version 1", "Edit version");
    await chrome().getByRole("button", { name: "Close details", exact: true }).click();
    await expect(eye(pkgVersion.id)).toBeFocused();
    console.log(
      `PASS campaign procedure/revision + package header/edit/cancel/navigation at ${width}px`,
    );
  }
  await page.goto(`${origin}/campaigns/${campaign.id}?tab=Runs`);
  await eye(run.id).click();
  await check(run.title, "Complete run", true);
  await header().getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit run", exact: true }).click();
  await cancelDialog();
  await expect(panel()).toHaveCount(0);
  await eye(run.id).click();
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route("**/rest/v1/test_runs**", async (route) => {
    if (route.request().method() !== "PATCH") return route.continue();
    writes++;
    await blocked;
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ code: "TEST_REJECTION", message: "Injected run completion failure" }),
    });
  });
  await header().getByRole("button", { name: "Complete run", exact: true }).click();
  await expect(header().getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  await expect(header().getByRole("button", { name: "More actions", exact: true })).toBeDisabled();
  assert.equal(writes, 1);
  release();
  await expect(panel().getByRole("alert")).toContainText("Injected run completion failure");
  await expect(header().getByRole("button", { name: "Complete run", exact: true })).toBeEnabled();
  await expect(header().getByRole("button", { name: "More actions", exact: true })).toBeEnabled();
  await page.unroute("**/rest/v1/test_runs**");
  const unchanged = await data(ws.client.from("test_runs").select().eq("id", run.id).single());
  assert.equal(unchanged.status, "planned");
  assert.equal(unchanged.completed_at, null);
  await page.screenshot({ path: `${artifacts}/run-failure-390.png` });
  console.log("PASS run Complete pending and injected error recovery; database state unchanged");
  assert.deepEqual(errors, []);
  console.log(`PASS no browser page errors; screenshots ${artifacts}`);
} catch (error) {
  if (page) {
    await page.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
    await writeFile(`${artifacts}/failure.txt`, await page.locator("body").innerText()).catch(
      () => {},
    );
  }
  throw error;
} finally {
  await browser?.close();
  await ws.cleanup();
}
