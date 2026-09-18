#!/usr/bin/env node
/** Responsive product compositions, confined to a disposable local workspace. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { expectPreviewHeader, minimizePreview } from "./tests/preview-header.mjs";
import { expectActionMenu, expectCenteredIcon } from "./tests/action-layout.mjs";
import { expectIconSideNavigation } from "./tests/side-navigation.mjs";
import { expectPatternMotion } from "./tests/pattern-motion.mjs";

const started = Date.now();
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("responsive-patterns");
const artifacts = process.env.PATTERN_ARTIFACT_DIR
  ? join(process.env.PATTERN_ARTIFACT_DIR, "responsive")
  : await mkdtemp(join(tmpdir(), "responsive-patterns-"));
await mkdir(artifacts, { recursive: true });
let browser, page;
const errors = [];
const panel = () => page.locator('[data-shell-area="panel"]');
const main = () => page.locator('[data-shell-area="main"]');
const row = (table, id) => table.locator(`tr[data-row-id="${id}"]`);
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const insert = (table, values) =>
  data(
    workspace.client
      .from(table)
      .insert({ tenant_id: workspace.tenantId, ...values })
      .select()
      .single(),
  );
async function screenshot(name) {
  await page.screenshot({ path: join(artifacts, `${name}.png`), animations: "disabled" });
}
async function documentFits() {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), {
      message: "The document has no horizontal overflow",
    })
    .toBe(true);
}
async function tableFits(table) {
  await expect
    .poll(
      () =>
        table.evaluate((element) => {
          const frame = element.closest('[data-responsive="true"]');
          if (!frame) return false;
          const bounds = element.getBoundingClientRect();
          const container = frame.getBoundingClientRect();
          return (
            bounds.width > 0 &&
            bounds.left >= container.left - 1 &&
            bounds.right <= container.right + 1 &&
            bounds.left >= -1 &&
            bounds.right <= innerWidth + 1
          );
        }),
      { message: "The table fits its own container without dropping its responsive opt-in" },
    )
    .toBe(true);
  await documentFits();
}
async function tabsFit(tabs, expectedNames) {
  if (expectedNames) await expect(tabs.getByRole("tab")).toHaveText(expectedNames);
  await expect
    .poll(
      () =>
        tabs.evaluate((element) => {
          const area = element.closest('[data-slot="tabs-scroll-area"]');
          const viewport = element.closest('[data-slot="scroll-area-viewport"]');
          const items = [...element.querySelectorAll('[role="tab"]')].map((tab) =>
            tab.getBoundingClientRect(),
          );
          const bounds = element.getBoundingClientRect();
          return (
            !!area &&
            !!viewport &&
            area.getBoundingClientRect().width >=
              area.parentElement.getBoundingClientRect().width - 1 &&
            items.length > 0 &&
            items.every((item) => Math.abs(item.top - items[0].top) < 1) &&
            bounds.width >= viewport.clientWidth - 1 &&
            Number.parseFloat(getComputedStyle(element).borderBottomWidth) > 0
          );
        }),
      { message: "Line tabs have one row and a full-width underline inside the kit scroller" },
    )
    .toBe(true);
}
async function revealLastTab(tabs) {
  await tabs.getByRole("tab").first().focus();
  await page.keyboard.press("End");
  const last = tabs.getByRole("tab").last();
  await expect(last).toBeFocused();
  await expect
    .poll(
      () =>
        last.evaluate((element) => {
          const viewport = element
            .closest('[data-slot="scroll-area-viewport"]')
            .getBoundingClientRect();
          const bounds = element.getBoundingClientRect();
          return bounds.left >= viewport.left - 1 && bounds.right <= viewport.right + 1;
        }),
      { message: "Keyboard focus reveals the last tab inside the shared scroller" },
    )
    .toBe(true);
  await tabs.getByRole("tab").first().click();
}
async function systemPreviewFits(name) {
  await expectPreviewHeader(page, {
    title: name,
    recordActions: ["Edit system", "More system actions"],
  });
  await documentFits();
}

async function systemActionsFit(name) {
  const overflow = panel().getByRole("button", { name: "More system actions", exact: true });
  await expectCenteredIcon(overflow);
  await overflow.click();
  await expectActionMenu(page, ["Create system", "Add from library"]);
  await screenshot(name);
  await page.keyboard.press("Escape");
}

try {
  const program = await insert("programs", {
    code: "RESPONSIVE",
    name: "Responsive pattern checks",
  });
  const boundary = await insert("systems", {
    program_id: program.id,
    code: "BOUNDARY",
    name: "Responsive boundary",
    description: "Authored boundary description retained in its labeled Details.",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: boundary.id,
    is_authorization_boundary: false,
    code: "CHILD",
    name: "Responsive child",
    system_type: "hardware",
  });
  const profile = await data(
    workspace.client
      .from("profile_revisions")
      .select()
      .is("tenant_id", null)
      .eq("state", "published")
      .ilike("title", "%Low%")
      .limit(1)
      .single(),
  );
  const resolution = await data(
    workspace.client
      .from("profile_resolutions")
      .select()
      .eq("profile_revision_id", profile.id)
      .eq("state", "published")
      .single(),
  );
  const selections = await data(
    workspace.client
      .from("selected_controls")
      .select("control_id")
      .eq("profile_resolution_id", resolution.id),
  );
  const imported = await data(
    workspace.client
      .from("profile_imports")
      .select("catalog_revision_id")
      .eq("profile_revision_id", profile.id)
      .not("catalog_revision_id", "is", null)
      .limit(1)
      .single(),
  );
  await data(
    workspace.client.rpc("adopt_system_baseline", {
      p_tenant_id: workspace.tenantId,
      p_system_id: boundary.id,
      p_expected_revision: boundary.revision,
      p_request_id: randomUUID(),
      p_selection: {
        mode: "adopt",
        catalogRevisionId: imported.catalog_revision_id,
        profileResolutionId: resolution.id,
        controlIds: selections.map((selection) => selection.control_id),
        rationale: "Use the published baseline for responsive checks.",
      },
    }),
  );
  const requirements = [];
  for (const [code, title, statement] of [
    ["REQ-A", "Responsive alpha", "Responsive alpha statement."],
    ["REQ-B", "Responsive bravo", "Responsive bravo statement."],
    ["REQ-C", "Responsive charlie", "Responsive charlie statement."],
    ["OTHER", "Unrelated requirement", "A separate statement excluded by the search."],
  ]) {
    const identity = await insert("engineering_requirements", { program_id: program.id, code });
    await insert("requirement_revisions", {
      engineering_requirement_id: identity.id,
      version_number: 1,
      title,
      statement,
      acceptance_criteria: "The visible layout retains each record and its available fields.",
      requirement_type: "security",
    });
    requirements.push({ ...identity, title, statement });
  }
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/programs/${program.id}/systems/${boundary.id}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const systems = () => page.getByRole("treegrid", { name: "Program systems", exact: true });
  await expect(
    row(systems(), child.id).getByRole("link", { name: child.name, exact: true }),
  ).toBeVisible();
  await expectIconSideNavigation(page, { screenshot });
  await expectPatternMotion(page, {
    recordSamples: (samples) =>
      writeFile(join(artifacts, "motion-samples.json"), JSON.stringify(samples, null, 2)),
    captureFrame: (name) =>
      page.screenshot({ path: join(artifacts, `${name}.png`), animations: "allow" }),
  });
  await expect(
    row(systems(), child.id).getByRole("link", { name: child.name, exact: true }),
  ).toBeVisible();
  await expect(main().getByText(boundary.description, { exact: true })).toHaveCount(0);
  await expect(
    page
      .locator('[data-shell-area="aside"]')
      .locator("dl")
      .filter({ has: page.getByText("Description", { exact: true }) })
      .locator("dd"),
  ).toHaveText(boundary.description);
  await tabsFit(page.getByRole("tablist", { name: "Element sections", exact: true }));
  await tableFits(systems());
  await screenshot("system-overview-1440");

  await page.getByRole("tab", { name: "Controls", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Change control baseline", exact: true }),
  ).toBeEnabled();
  const details = page.getByRole("button", { name: "Baseline details", exact: true });
  await expect(details).toHaveAttribute("aria-expanded", "false");
  const baselineSource = page
    .locator("dl")
    .filter({ has: page.getByText("Source", { exact: true }) });
  await expect(baselineSource).toBeHidden();
  await tableFits(page.getByRole("table", { name: "Controls", exact: true }));
  await details.click();
  await expect(baselineSource.locator("dd")).toHaveText("Applied here");
  await details.click();

  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  for (const width of [1440, 390, 340]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole("button", { name: "Create system", exact: true }).first().click();
    await expectActionMenu(page, ["Create system", "Add system from product"]);
    await screenshot(`system-create-actions-${width}`);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await row(systems(), child.id).getByRole("button", { name: "Preview row", exact: true }).click();
  for (const width of [1440, 390, 340]) {
    await page.setViewportSize({ width, height: 1000 });
    await systemPreviewFits(child.name);
    await screenshot(`system-preview-${width}`);
    await systemActionsFit(`system-overflow-actions-${width}`);
    if (width === 1440) {
      await minimizePreview(page);
      await systemPreviewFits(child.name);
      await screenshot("system-preview-panel-240");
      await systemActionsFit("system-overflow-actions-panel-240");
      await panel().getByRole("separator", { name: "Resize details", exact: true }).focus();
      await page.keyboard.press("End");
    }
  }
  await panel().getByRole("button", { name: "Close details", exact: true }).click();
  await tableFits(systems());
  const more = row(systems(), child.id).getByRole("button", {
    name: `More fields for ${child.code}`,
    exact: true,
  });
  await more.click();
  const overflow = page.locator(`[id="${await more.getAttribute("aria-controls")}"]`);
  await expect(overflow.getByText(child.code, { exact: true })).toBeVisible();
  await expect(overflow.getByText("Hardware", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/programs/${program.id}?tab=Requirements`);
  const table = page.locator('table[aria-label="Engineering requirements"]');
  const search = page.getByRole("searchbox", {
    name: "Find a requirement",
    exact: true,
    includeHidden: true,
  });
  await expect(row(table, requirements[3].id)).toBeVisible();
  await tabsFit(page.getByRole("tablist", { name: "Program work", exact: true }));
  await search.fill("Responsive");
  await expect(table.locator("tbody tr[data-row-id]")).toHaveCount(3);
  const sorted = table.locator("th").filter({
    has: page.getByRole("button", { name: "Requirement name", exact: true, includeHidden: true }),
  });
  await sorted.getByRole("button", { name: "Requirement name", exact: true }).click();
  await expect(sorted).toHaveAttribute("aria-sort", "ascending");
  const order = () =>
    table
      .locator("tbody tr[data-row-id]")
      .evaluateAll((rows) => rows.map((element) => element.getAttribute("data-row-id")));
  await expect.poll(order).toEqual(requirements.slice(0, 3).map((requirement) => requirement.id));
  const originalOrder = await order();
  await tableFits(table);
  await row(table, requirements[1].id)
    .getByRole("button", { name: "Preview row", exact: true })
    .click();
  const requirementTabs = () =>
    panel().getByRole("tablist", { name: "Requirement sections", exact: true });
  const tabNames = [
    "Overview",
    "Control mappings",
    "Allocation",
    "Verification",
    "Evidence",
    "Edit history",
  ];
  for (const [index, width] of [1440, 1100, 390, 340, 1440].entries()) {
    await page.setViewportSize({ width, height: 1000 });
    await expectPreviewHeader(page, { title: requirements[1].title });
    await tabsFit(requirementTabs(), tabNames);
    await revealLastTab(requirementTabs());
    await documentFits();
    if (await table.isVisible()) await tableFits(table);
    await expect(search).toHaveValue("Responsive");
    await expect(sorted).toHaveAttribute("aria-sort", "ascending");
    assert.deepEqual(
      await order(),
      originalOrder,
      "Resizing preserves displayed sort and filter order",
    );
    assert.equal(new URL(page.url()).searchParams.get("requirementId"), requirements[1].id);
    await screenshot(`requirement-preview-${width}`);
    if (index === 0) {
      await minimizePreview(page);
      await expectPreviewHeader(page, { title: requirements[1].title });
      await tabsFit(requirementTabs(), tabNames);
      await revealLastTab(requirementTabs());
      await tableFits(table);
      await expect(search).toHaveValue("Responsive");
      await expect(sorted).toHaveAttribute("aria-sort", "ascending");
      assert.deepEqual(await order(), originalOrder);
      await screenshot("requirement-preview-panel-240");
      await panel().getByRole("separator", { name: "Resize details", exact: true }).focus();
      await page.keyboard.press("End");
    }
  }
  await panel().getByRole("button", { name: "Close details", exact: true }).click();
  for (const width of [1440, 390, 340, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await tableFits(table);
    await expect(search).toHaveValue("Responsive");
    await expect(sorted).toHaveAttribute("aria-sort", "ascending");
    assert.deepEqual(await order(), originalOrder);
    await expect(
      row(table, requirements[1].id).getByRole("link", {
        name: requirements[1].title,
        exact: true,
      }),
    ).toBeVisible();
    await screenshot(`requirements-${width}`);
  }
  await row(table, requirements[1].id)
    .getByRole("button", { name: "Preview row", exact: true })
    .click();
  await expect(
    panel().getByRole("heading", { name: requirements[1].title, exact: true }),
  ).toBeVisible();
  assert.deepEqual(errors, [], "No uncaught browser errors or native dialogs");
  console.log(
    `PASS responsive navigation/system/requirement patterns in ${Math.round((Date.now() - started) / 1000)}s; artifacts ${artifacts}`,
  );
} catch (error) {
  if (page) {
    await screenshot("failure").catch(() => {});
    console.error((await page.locator("body").innerText()).slice(-10000));
  }
  console.error(`Responsive pattern artifacts: ${artifacts}`);
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
