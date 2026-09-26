#!/usr/bin/env node
/** Browser regressions for shared headers, record openers, date sorting and element draft guards. */
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
const workspace = await localWorkspace("pattern-consistency");
const { client, tenantId } = workspace;
const suffix = workspace.run.slice(0, 8);
let browser;
let page;
let releaseSave;
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "pattern-consistency-")));
await mkdir(screenshots, { recursive: true });
const errors = [];

async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
function insert(table, values) {
  return data(
    client
      .from(table)
      .insert({ ...values, tenant_id: tenantId })
      .select()
      .single(),
  );
}
async function rows(table, filters = {}) {
  let query = client.from(table).select("*").eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  return data(query);
}
function tableRow(table, id) {
  return table.locator(`tbody tr[data-row-id="${id}"]`);
}
async function rowIds(table) {
  return table
    .locator("tbody tr[data-row-id]")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-row-id")));
}
async function checkDateSort(table, label, ascending) {
  const header = table.getByRole("columnheader").filter({
    has: page.getByRole("button", { name: label, exact: true }),
  });
  const sort = header.getByRole("button", { name: label, exact: true });
  for (const direction of ["ascending", "descending"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if ((await header.getAttribute("aria-sort")) === direction) break;
      await sort.click();
    }
    await expect(header).toHaveAttribute("aria-sort", direction);
    // Undefined dates use the table's normal placement: last ascending, first descending.
    await expect
      .poll(() => rowIds(table))
      .toEqual(direction === "ascending" ? ascending : [...ascending].reverse());
  }
}
async function checkHeader(path, title, width) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${origin}${path}`);
  const heading = page.getByRole("heading", { level: 1, name: title, exact: true });
  await expect(heading).toBeVisible();
  const header = page.locator('[data-slot="page-header"]').filter({ has: heading });
  await expect(header.locator('[data-slot="page-header-description"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/ — Program Assurance$/);
  await page.evaluate(() => document.fonts.ready);
  const titleBox = await heading.boundingBox();
  assert.ok(titleBox, `${path}: title has a layout box`);
  // The heading keeps its own width when that is shorter than its measure, so a short title is
  // narrow; crushed means broken across lines or clipped, not narrow.
  const fit = await heading.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
    return { lines: lines.size, clipped: element.scrollWidth - element.clientWidth };
  });
  assert.ok(
    titleBox.width > 0 && titleBox.height > 0 && fit.lines === 1 && fit.clipped <= 1,
    `${path}: title is not crushed (${fit.lines} lines, ${fit.clipped}px clipped)`,
  );
  assert.ok(titleBox.x >= -1 && titleBox.x + titleBox.width <= width + 1);
  if (width === 390) {
    const navigation = page.getByRole("banner", { name: "Top navigation" });
    const search = await navigation
      .getByRole("button", { name: "Search programs, risks, and findings", exact: true })
      .boundingBox();
    const actions = await navigation
      .getByRole("group", { name: "Actions", exact: true })
      .boundingBox();
    assert.ok(
      search && actions && search.x >= 0 && search.x + search.width <= actions.x + 1,
      "Phone search stays within its slot before navigation actions",
    );
  }
  await page.screenshot({ path: join(screenshots, `${path.slice(1)}-${width}.png`) });
}
const elementSheet = () => page.getByRole("dialog", { name: "Create element", exact: true });
const discardPrompt = () =>
  page.getByRole("alertdialog", { name: "Discard changes?", exact: true });
async function openElement() {
  await page.getByRole("button", { name: "Create element", exact: true }).first().click();
  await expect(elementSheet()).toBeVisible();
}
async function keepEditing() {
  await expect(discardPrompt()).toBeVisible();
  await discardPrompt().getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(discardPrompt()).toBeHidden();
  await expect(elementSheet()).toBeVisible();
}
async function discardChanges() {
  await expect(discardPrompt()).toBeVisible();
  await discardPrompt().getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(discardPrompt()).toBeHidden();
  await expect(elementSheet()).toBeHidden();
}

try {
  const program = await insert("programs", {
    code: `PAT-${suffix}`,
    name: `Pattern regression ${suffix}`,
  });
  const supplier = await insert("parties", {
    party_type: "organization",
    name: `Pattern supplier ${suffix}`,
  });
  const alphaSupplier = await insert("parties", {
    party_type: "organization",
    name: `Alpha supplier ${suffix}`,
  });
  const zetaSupplier = await insert("parties", {
    party_type: "organization",
    name: `Zeta supplier ${suffix}`,
  });
  const person = (await rows("parties", { auth_user_id: workspace.userId }))[0];
  assert.ok(person, "The disposable workspace has its user's person record");
  // Alphabetical month ordering and missing values must not masquerade as chronological sorting.
  const samples = [
    { key: "april", date: "2026-04-10T12:00:00Z" },
    { key: "missing", date: null },
    { key: "previous-year", date: "2025-12-20T12:00:00Z" },
    { key: "february", date: "2026-02-10T12:00:00Z" },
  ];
  for (const sample of samples) {
    sample.artifact = await insert("evidence_artifacts", {
      program_id: program.id,
      title: `Evidence ${sample.key} ${suffix}`,
      artifact_kind: "document",
      owner_party_id: supplier.id,
    });
    await insert("evidence_versions", {
      artifact_id: sample.artifact.id,
      version_number: 1,
      collected_at: sample.date,
      external_uri: `https://example.test/${suffix}/${sample.key}`,
    });
    sample.task = await insert("tasks", {
      program_id: program.id,
      title: `Task ${sample.key} ${suffix}`,
      due_at: sample.date,
    });
    await insert("task_assignments", {
      task_id: sample.task.id,
      party_id: person.id,
      assignment_role: "responsible",
    });
  }
  const chronological = [samples[2], samples[3], samples[0], samples[1]];
  const product = await insert("products", {
    code: `PAT-${suffix}`,
    name: `Pattern product ${suffix}`,
  });
  const revision = await insert("product_revisions", {
    product_id: product.id,
    version_number: 1,
  });
  const configurations = [];
  for (const key of ["A", "B"])
    configurations.push(
      await insert("product_configurations", {
        product_id: product.id,
        code: `${key}-${suffix}`,
        name: `Configuration ${key} ${suffix}`,
      }),
    );
  // Catalog records are shared reference data; only read an existing published edition.
  const catalog = await data(
    client.from("catalog_revisions").select("*").eq("state", "published").limit(1).single(),
  );
  const control = await data(
    client
      .from("controls")
      .select("*")
      .eq("catalog_revision_id", catalog.id)
      .order("code")
      .limit(1)
      .single(),
  );
  // An authorization boundary with a published SSP 1 and a draft SSP 2 that records one control.
  const resolution = await data(
    client.from("profile_resolutions").select("*").eq("state", "published").limit(1).single(),
  );
  const sspSelection = await data(
    client
      .from("selected_controls")
      .select("*")
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .limit(1)
      .single(),
  );
  const sspControl = await data(
    client.from("controls").select("*").eq("id", sspSelection.control_id).single(),
  );
  const boundary = await insert("systems", {
    program_id: program.id,
    code: `BND-${suffix}`,
    name: `Pattern boundary ${suffix}`,
    system_type: "information_system",
  });
  const publishedPlan = await insert("ssp_revisions", {
    system_id: boundary.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: publishedPlan.id,
    selected_control_id: sspSelection.id,
    description: "Published control narrative",
    implementation_status: "implemented",
  });
  await data(
    client
      .from("ssp_revisions")
      .update({ state: "published", revision: publishedPlan.revision + 1 })
      .eq("id", publishedPlan.id)
      .select()
      .single(),
  );
  const draftPlan = await insert("ssp_revisions", {
    system_id: boundary.id,
    profile_resolution_id: resolution.id,
    version_number: 2,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: draftPlan.id,
    selected_control_id: sspSelection.id,
    description: "Stored control narrative",
    implementation_status: "partial",
  });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
  });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/vendors`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Suppliers" })).toBeVisible();

  for (const width of [1600, 390]) {
    await checkHeader("/vendors", "Suppliers", width);
    await checkHeader("/findings", "Findings & assets", width);
  }
  console.log("PASS desktop/mobile title-only headers (390px) and browser titles");
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`${origin}/vendors`);
  const supplierTable = page.getByRole("table", { name: "organizations", exact: false });
  await expect(supplierTable.locator("tbody tr[data-row-id]")).toHaveCount(3);
  await checkDateSort(supplierTable, "Organization", [
    alphaSupplier.id,
    supplier.id,
    zetaSupplier.id,
  ]);
  // The second pass above leaves descending order: Zeta, Pattern, Alpha.
  const supplierEye = tableRow(supplierTable, supplier.id).getByRole("button", {
    name: "Preview row",
    exact: true,
  });
  await supplierEye.focus();
  await page.keyboard.press("Enter");
  const supplierPanel = page.locator('[data-shell-area="panel"]');
  await expect(
    supplierPanel.getByRole("heading", { name: supplier.name, exact: true }),
  ).toBeVisible();
  await expect(supplierPanel.getByRole("status")).toHaveText("2 of 3 records");
  await expect(
    supplierPanel.getByRole("link", { name: "Open full record in new tab" }),
  ).toHaveAttribute("href", `/records/parties/${supplier.id}`);
  await expect(
    supplierPanel.getByRole("link", { name: "Open full record in new tab" }),
  ).toHaveAttribute("target", "_blank");
  await supplierPanel.getByRole("button", { name: "Next record" }).click();
  await expect(
    supplierPanel.getByRole("heading", { name: alphaSupplier.name, exact: true }),
  ).toBeVisible();
  await expect(supplierPanel.getByRole("button", { name: "Next record" })).toBeDisabled();
  await supplierPanel.getByRole("button", { name: "Previous record" }).click();
  await supplierPanel.getByRole("button", { name: "Previous record" }).click();
  await expect(
    supplierPanel.getByRole("heading", { name: zetaSupplier.name, exact: true }),
  ).toBeVisible();
  await expect(supplierPanel.getByRole("button", { name: "Previous record" })).toBeDisabled();
  await page
    .getByRole("searchbox", { name: "Search organizations", exact: true })
    .fill(supplier.name);
  await expect(supplierPanel.getByRole("status")).toHaveText("Record outside the current results");
  await expect(supplierPanel.getByRole("button", { name: "Next record" })).toBeDisabled();
  await supplierPanel.getByRole("button", { name: "Close details", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search organizations", exact: true })
    .fill("No matching supplier");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(supplierTable.locator("tbody tr[data-row-id]")).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await tableRow(supplierTable, supplier.id)
    .getByRole("button", { name: "Preview row", exact: true })
    .click();
  await expect(
    supplierPanel.getByRole("heading", { name: supplier.name, exact: true }),
  ).toBeVisible();
  await expect(supplierPanel.getByRole("button", { name: "Previous record" })).toBeVisible();
  await page.screenshot({ path: join(screenshots, "supplier-preview-390.png") });
  await supplierPanel.getByRole("button", { name: "Close details", exact: true }).click();
  await page.setViewportSize({ width: 1600, height: 1000 });
  console.log(
    "PASS supplier preview follows sorted/filtered rows, endpoints, real links and mobile layout",
  );
  // An initial fetch failure is not an empty collection; Retry restores the same register.
  const rejectOrganizations = (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Injected organization load interruption" }),
    });
  await page.route("**/rest/v1/parties?*", rejectOrganizations);
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "Injected organization load interruption" }),
  ).toBeVisible();
  await expect(supplierTable).toBeHidden();
  await expect(page.getByText("No organizations yet", { exact: true })).toBeHidden();
  await page.unroute("**/rest/v1/parties?*", rejectOrganizations);
  await page.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(supplierTable.locator("tbody tr[data-row-id]")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Retry loading", exact: true })).toBeHidden();
  console.log(
    "PASS initial load failure stays distinct from empty data and Retry restores records",
  );
  // Reconnect refetch failures preserve the mounted table and its current search.
  const organizationSearch = page.getByRole("searchbox", {
    name: "Search organizations",
    exact: true,
  });
  await organizationSearch.fill(supplier.name);
  await page.route("**/rest/v1/parties?*", rejectOrganizations);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Showing the last loaded records" }),
  ).toBeVisible();
  await expect(supplierTable.locator("tbody tr[data-row-id]")).toHaveCount(1);
  await expect(organizationSearch).toHaveValue(supplier.name);
  await page.unroute("**/rest/v1/parties?*", rejectOrganizations);
  await page.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry loading", exact: true })).toBeHidden();
  await expect(organizationSearch).toHaveValue(supplier.name);
  await expect(tableRow(supplierTable, supplier.id)).toBeVisible();
  console.log("PASS failed refresh retains records and table state through Retry");
  await page.goto(`${origin}/programs/${program.id}?tab=Schedule`);
  await expect(page.getByRole("heading", { name: "Lifecycle gates", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Program responsibilities", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  console.log("PASS Schedule has one page heading");

  await page.goto(`${origin}/evidence`);
  const evidenceTable = page.getByRole("table", { name: "Evidence", exact: true });
  await expect(evidenceTable.locator("tbody tr[data-row-id]")).toHaveCount(samples.length);
  await checkDateSort(
    evidenceTable,
    "Collected",
    chronological.map((sample) => sample.artifact.id),
  );
  const artifact = samples[3].artifact;
  const evidenceOpener = tableRow(evidenceTable, artifact.id).getByRole("button", {
    name: "Preview row",
    exact: true,
  });
  await evidenceOpener.focus();
  await expect(evidenceOpener).toBeFocused();
  await page.keyboard.press("Enter");
  const preview = page.locator('[data-shell-area="panel"]');
  await expect(preview).toBeVisible();
  await expect(preview.getByRole("heading", { name: artifact.title, exact: true })).toBeVisible();
  await expect(
    preview.getByRole("link", { name: "Open full record in new tab", exact: true }),
  ).toHaveAttribute("href", `/records/evidence_artifacts/${artifact.id}`);
  await expect(preview.locator('[data-slot="preview-navigation"]').getByRole("status")).toHaveText(
    "3 of 4 records",
  );
  await preview.getByRole("button", { name: "Next record", exact: true }).click();
  const lastEvidence = page.locator('[data-shell-area="panel"]');
  await expect(lastEvidence).toBeVisible();
  await expect(lastEvidence.getByRole("button", { name: "Next record" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(lastEvidence).toBeHidden();
  await expect(
    tableRow(evidenceTable, artifact.id).getByRole("link", { name: artifact.title, exact: true }),
  ).toHaveAttribute("href", `/records/evidence_artifacts/${artifact.id}`);
  console.log("PASS Evidence keyboard preview and collected-date sorting, including missing dates");

  await page.goto(`${origin}/catalog?edition=${catalog.id}`);
  await page.getByPlaceholder("Find a control").fill(control.code);
  const catalogTable = page.getByRole("table", { name: "Catalog controls", exact: true });
  const catalogOpener = tableRow(catalogTable, control.id).getByRole("button", {
    name: "Preview row",
    exact: true,
  });
  await catalogOpener.focus();
  await expect(catalogOpener).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page
      .locator('[data-shell-area="panel"]')
      .getByRole("heading", { name: control.title, exact: true }),
  ).toBeVisible();
  console.log("PASS Catalog keyboard preview opens the selected record in its panel");

  await page.goto(`${origin}/work`);
  const workTable = page.getByRole("table", { name: "Tasks", exact: true });
  await expect(workTable.locator("tbody tr[data-row-id]")).toHaveCount(samples.length);
  await checkDateSort(
    workTable,
    "Due",
    chronological.map((sample) => sample.task.id),
  );
  const task = samples[0].task;
  const taskLink = tableRow(workTable, task.id).getByRole("link", {
    name: task.title,
    exact: true,
  });
  await expect(taskLink).toHaveAttribute("href", `/tasks/${task.id}`);
  await taskLink.focus();
  await expect(taskLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${origin}/tasks/${task.id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: task.title, exact: true }),
  ).toBeVisible();
  console.log("PASS Work uses a keyboard-accessible record link and chronological due dates");

  await page.goto(`${origin}/library/products`);
  await tableRow(
    page.getByRole("table", { name: "Product library", exact: true }),
    product.id,
  ).click();
  const productUrl = `${origin}/library/products/${product.id}`;
  await expect(page).toHaveURL(productUrl);
  await page.getByRole("tab", { name: /^Structure/ }).click();
  await openElement();
  await elementSheet().getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(elementSheet()).toBeHidden();
  await expect(discardPrompt()).toBeHidden();

  // Reverting to the initial membership selection must also count as clean.
  await openElement();
  const secondConfiguration = () =>
    elementSheet().getByRole("checkbox", { name: configurations[1].name, exact: true });
  await secondConfiguration().uncheck();
  await secondConfiguration().check();
  await page.keyboard.press("Escape");
  await expect(elementSheet()).toBeHidden();
  await expect(discardPrompt()).toBeHidden();

  await openElement();
  await secondConfiguration().uncheck();
  await page.keyboard.press("Escape");
  await keepEditing();
  await expect(secondConfiguration()).not.toBeChecked();
  const draft = {
    name: `Element ${suffix}`,
    code: `EL-${suffix}`,
    description: "Retain this draft.",
  };
  const field = (name) => elementSheet().getByRole("textbox", { name, exact: true });
  async function fillDraft() {
    await field("Name").fill(draft.name);
    await field("Code").fill(draft.code);
    await field("Description").fill(draft.description);
  }
  async function expectDraft() {
    await expect(field("Name")).toHaveValue(draft.name);
    await expect(field("Code")).toHaveValue(draft.code);
    await expect(field("Description")).toHaveValue(draft.description);
    await expect(secondConfiguration()).not.toBeChecked();
  }
  await fillDraft();
  await page.keyboard.press("Escape");
  await keepEditing();
  await expectDraft();
  // Browser Back is a user route change even while the modal makes page links inert.
  await page.evaluate(() => history.back());
  await keepEditing();
  await expect(page).toHaveURL(productUrl);
  await expectDraft();
  await elementSheet().getByRole("button", { name: "Cancel", exact: true }).click();
  await discardChanges();
  assert.deepEqual(await rows("product_elements", { product_revision_id: revision.id }), []);
  assert.deepEqual(await rows("product_configuration_elements"), []);
  console.log("PASS clean/reverted close, dirty Escape/Back preservation and explicit discard");

  await openElement();
  await fillDraft();
  await secondConfiguration().uncheck();
  const elementEndpoint = "**/rest/v1/product_elements*";
  function isDraftInsert(route) {
    const request = route.request();
    if (
      request.method() !== "POST" ||
      !new URL(request.url()).pathname.endsWith("/product_elements")
    )
      return false;
    const body = request.postDataJSON();
    const record = Array.isArray(body) ? body[0] : body;
    return record?.tenant_id === tenantId && record?.product_revision_id === revision.id;
  }
  let failedPosts = 0;
  const failedSave = async (route) => {
    if (!isDraftInsert(route)) return route.continue();
    failedPosts++;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ code: "PATTERN_TEST", message: "Simulated element save failure" }),
    });
  };
  await page.route(elementEndpoint, failedSave);
  const saveButton = () =>
    elementSheet().getByRole("button", { name: "Create element", exact: true });
  await saveButton().click();
  const saveFailure = elementSheet().getByRole("alert").filter({ hasText: "was not saved" });
  await expect(saveFailure.locator('[data-slot="alert-title"]')).toHaveText(
    "The element was not saved",
  );
  await expect(saveFailure).toContainText("Simulated element save failure");
  assert.equal(failedPosts, 1);
  await expectDraft();
  await expect(saveButton()).toBeEnabled();
  assert.deepEqual(await rows("product_elements", { product_revision_id: revision.id }), []);
  await page.unroute(elementEndpoint, failedSave);

  let slowPosts = 0;
  const gate = new Promise((resolve) => {
    releaseSave = resolve;
  });
  const slowSave = async (route) => {
    if (!isDraftInsert(route)) return route.continue();
    slowPosts++;
    await gate;
    await route.continue();
  };
  await page.route(elementEndpoint, slowSave);
  await saveButton().click();
  await expect.poll(() => slowPosts).toBe(1);
  await expect(saveButton()).toBeDisabled();
  await expect(elementSheet().getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
  for (const name of ["Name", "Code", "Description"]) await expect(field(name)).toBeDisabled();
  await expect(elementSheet().getByRole("combobox", { name: "Type", exact: true })).toBeDisabled();
  await expect(secondConfiguration()).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(elementSheet()).toBeVisible();
  await expect(discardPrompt()).toBeHidden();
  // Native activation on a disabled button must not submit a second mutation.
  await saveButton().evaluate((button) => button.click());
  await page.keyboard.type("must not alter the pending draft");
  await expectDraft();
  assert.equal(slowPosts, 1);
  releaseSave();
  await expect(elementSheet()).toBeHidden();
  await page.unroute(elementEndpoint, slowSave);
  const saved = await rows("product_elements", { product_revision_id: revision.id });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, draft.name);
  assert.equal(saved[0].code, draft.code);
  assert.equal(saved[0].description, draft.description);
  const memberships = await rows("product_configuration_elements", {
    product_element_id: saved[0].id,
  });
  assert.deepEqual(
    memberships.map((row) => row.product_configuration_id),
    [configurations[0].id],
  );
  assert.equal(slowPosts, 1);
  console.log(
    "PASS failed save retains draft; pending save blocks edits/close/repeat; retry saves once",
  );

  // A failed background refresh keeps an open SSP narrative draft, its focus and the register.
  await page.goto(`${origin}/programs/${program.id}?tab=Controls`);
  const sspTable = page.getByRole("table", { name: "SSP control assembly", exact: true });
  const revisionPicker = page.getByRole("combobox", { name: "SSP revision", exact: true });
  await expect(revisionPicker).toHaveText(/^SSP 2 · /);
  await page
    .getByRole("searchbox", { name: "Find selected controls", exact: true })
    .fill(sspControl.code);
  await tableRow(sspTable, sspSelection.id)
    .getByRole("button", { name: "Preview row", exact: true })
    .click();
  const sspPanel = page.locator('[data-shell-area="panel"]');
  await expect(
    sspPanel.getByRole("heading", { name: sspControl.title, exact: true }),
  ).toBeVisible();
  const editImplementation = sspPanel.getByRole("button", {
    name: "Edit control implementation",
    exact: true,
  });
  await editImplementation.click();
  const narrativeDialog = page.getByRole("dialog", {
    name: "Edit control implementation",
    exact: true,
  });
  const narrative = narrativeDialog.getByRole("textbox", { name: "Control narrative" });
  await expect(narrative).toHaveValue("Stored control narrative");
  await narrative.click();
  await narrative.press("End");
  await narrative.pressSequentially(" and its retained draft");
  const narrativeDraft = "Stored control narrative and its retained draft";
  await expect(narrative).toHaveValue(narrativeDraft);
  let failedRefreshes = 0;
  const refreshEndpoint =
    /\/rest\/v1\/(ssp_revisions|implemented_requirements|systems|selected_controls)\?/;
  const failRefresh = (route) => {
    if (route.request().method() !== "GET") return route.continue();
    failedRefreshes++;
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Injected SSP refresh failure" }),
    });
  };
  await page.route(refreshEndpoint, failRefresh);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => failedRefreshes).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.locator('[role="alert"]').filter({ hasText: "Showing the last loaded records" }).count(),
    )
    .toBeGreaterThan(0);
  await expect(narrativeDialog).toBeVisible();
  await expect(narrative).toHaveValue(narrativeDraft);
  await expect(narrative).toBeFocused();
  // The modal hides the page from the accessibility tree, so these read the DOM under it.
  await expect(page.locator(`main table tbody tr[data-row-id="${sspSelection.id}"]`)).toBeVisible();
  await expect(sspPanel.locator("h2").filter({ hasText: sspControl.title })).toBeVisible();
  await page.unroute(refreshEndpoint, failRefresh);
  await page.keyboard.press("Escape");
  await expect(discardPrompt()).toBeVisible();
  await discardPrompt().getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(narrative).toHaveValue(narrativeDraft);
  await page.keyboard.press("Escape");
  await discardPrompt().getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(narrativeDialog).toBeHidden();
  await expect(editImplementation).toBeFocused();
  await page.getByRole("button", { name: "Retry loading", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Retry loading", exact: true })).toHaveCount(0);
  await expect(tableRow(sspTable, sspSelection.id)).toBeVisible();
  const stored = await rows("implemented_requirements", { ssp_revision_id: draftPlan.id });
  assert.deepEqual(
    stored.map((row) => row.description),
    ["Stored control narrative"],
  );
  await sspPanel.getByRole("button", { name: "Close details", exact: true }).click();
  console.log("PASS failed SSP refresh keeps the open narrative draft, its focus and the register");

  // Choosing another SSP revision redraws the register and keeps focus on the picker.
  await revisionPicker.click();
  await page.getByRole("option", { name: /^SSP 1 · / }).click();
  await expect(revisionPicker).toHaveText(/^SSP 1 · /);
  await expect(revisionPicker).toBeFocused();
  await expect(tableRow(sspTable, sspSelection.id)).toBeVisible();
  await revisionPicker.press("ArrowDown");
  await expect(page.getByRole("option", { name: /^SSP 2 · / })).toBeVisible();
  // The newest revision is listed first; the open list highlights the chosen SSP 1.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(revisionPicker).toHaveText(/^SSP 2 · /);
  await expect(revisionPicker).toBeFocused();
  console.log("PASS choosing an SSP revision by pointer or keyboard keeps focus on its picker");
  assert.deepEqual(errors, [], "No uncaught browser errors or native confirmation dialogs");
  console.log(`PASS pattern consistency. Screenshots: ${screenshots}`);
} catch (error) {
  if (page && !page.isClosed())
    await page.screenshot({ path: join(screenshots, "failure.png") }).catch(() => {});
  console.error(`Pattern regression screenshots: ${screenshots}`);
  throw error;
} finally {
  releaseSave?.();
  try {
    await browser?.close();
  } finally {
    await workspace.cleanup();
  }
}
