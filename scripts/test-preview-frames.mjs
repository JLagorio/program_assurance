#!/usr/bin/env node
/**
 * Shared preview host: sibling replacement, linked-record context, nested Back and focus, Close and
 * Escape ending the whole preview, previous/next walking every displayed row across pages with the
 * shown row on screen, and a preview that keeps one frame (and focus) as it steps.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { expectPreviewHeader } from "./tests/preview-header.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("preview-frames");
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "preview-frames-")));
await mkdir(screenshots, { recursive: true });
const errors = [];
let browser;
let page;

async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
function insert(table, values) {
  return data(
    workspace.client
      .from(table)
      .insert({ ...values, tenant_id: workspace.tenantId })
      .select()
      .single(),
  );
}
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const panel = () => page.locator('[data-shell-area="panel"]');
const header = () => panel().locator('[data-slot="shell-panel-header"]');
const table = (name) => page.getByRole("table", { name, exact: true });
// The eye is named after its row ("Preview Review gate …").
const eye = (collection, id) =>
  collection
    .locator(`tbody tr[data-row-id="${id}"]`)
    .getByRole("button", { name: /^Preview /, exact: true });
const status = () => header().locator('[data-slot="preview-navigation"] [role="status"]');
const step = (name) => header().getByRole("button", { name, exact: true });
/** Close is named after the panel, and the panel's name is sentence case. */
async function closeButton() {
  const label = await panel().getAttribute("aria-label");
  assert.match(label ?? "", /^\p{Lu}.* preview$/u, `The panel is named in sentence case: ${label}`);
  const close = header().getByRole("button", { name: `Close ${label}`, exact: true });
  await expect(close).toBeVisible();
  return close;
}
/** Escape ends the preview; a tooltip open on the focused control takes the first press. */
async function escapePreview() {
  await expect
    .poll(
      async () => {
        if (await panel().count()) await page.keyboard.press("Escape");
        return panel().count();
      },
      { intervals: [300], message: "Escape closes the whole preview" },
    )
    .toBe(0);
}
/** The row shows inside every scroller that holds it, clear of its sticky header, and in the window. */
const onScreen = (row) =>
  row.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    for (let node = element.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (!/auto|scroll/.test(style.overflowY) || node.scrollHeight <= node.clientHeight + 1)
        continue;
      const box = node.getBoundingClientRect();
      const top = box.top + (parseFloat(style.scrollPaddingTop) || 0);
      if (rect.top < top - 1 || rect.bottom > box.bottom + 1) return false;
    }
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
async function expectRecord(model, id, title, nested = false) {
  await expect(panel()).toHaveCount(1);
  if (title) await expect(panel().getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(
    panel().getByRole("link", { name: "Open full record in new tab", exact: true }),
  ).toHaveAttribute("href", `/records/${model}/${id}`);
  await expectPreviewHeader(page, { title, nested });
}

try {
  const suffix = workspace.run.slice(0, 8);
  const program = await insert("programs", {
    code: `FRM-${suffix}`,
    name: `Preview frames ${suffix}`,
  });
  const person = await data(
    workspace.client
      .from("parties")
      .select("*")
      .eq("tenant_id", workspace.tenantId)
      .eq("auth_user_id", workspace.userId)
      .single(),
  );
  // The gates run in sequence: the review gate leads, and 21 more fill a second table page (20).
  const gate = await insert("lifecycle_gates", {
    program_id: program.id,
    title: `Review gate ${suffix}`,
    sequence_number: 1,
    description: "Parent gate context survives the linked record preview.",
  });
  const walk = await data(
    workspace.client
      .from("lifecycle_gates")
      .insert(
        Array.from({ length: 21 }, (_, index) => ({
          tenant_id: workspace.tenantId,
          program_id: program.id,
          title: `Walk gate ${String(index + 2).padStart(2, "0")} ${suffix}`,
          sequence_number: index + 2,
        })),
      )
      .select(),
  );
  assert.equal(walk.length, 21);
  const criterion = await insert("gate_criteria", {
    gate_id: gate.id,
    title: `Review criterion ${suffix}`,
  });
  const responsibility = await insert("program_role_assignments", {
    program_id: program.id,
    party_id: person.id,
    role: "reviewer",
  });
  const observation = await insert("observations", {
    program_id: program.id,
    title: `Review observation ${suffix}`,
    method: "examine",
    description: "Parent observation context survives the citation preview.",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: `Review artifact ${suffix}`,
    artifact_kind: "document",
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: `https://example.test/${suffix}/evidence`,
  });
  const citation = await insert("observation_evidence", {
    observation_id: observation.id,
    evidence_version_id: version.id,
    description: `Citation context ${suffix}`,
  });
  // A package with two versions, whose preview steps from one version to the other.
  const system = await insert("systems", {
    program_id: program.id,
    code: `SYS-${suffix}`,
    name: `Preview boundary ${suffix}`,
    system_type: "information_system",
  });
  const pkg = await insert("authorization_packages", {
    program_id: program.id,
    system_id: system.id,
    title: `Preview package ${suffix}`,
  });
  const packageVersions = [];
  for (const number of [1, 2])
    packageVersions.push(
      await insert("package_revisions", {
        package_id: pkg.id,
        version_number: number,
        description: `Package version ${number} ${suffix}`,
      }),
    );

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/programs/${program.id}?tab=Schedule`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: program.name, exact: true }),
  ).toBeVisible();
  await page.goto(`${origin}/programs/${program.id}?tab=Schedule`);

  await eye(table("Lifecycle gates"), gate.id).click();
  await expectRecord("lifecycle_gates", gate.id, gate.title);
  await expect(eye(table("Lifecycle gates"), gate.id)).toHaveAttribute("aria-pressed", "true");
  await eye(table("Program responsibilities"), responsibility.id).click();
  await expectRecord("program_role_assignments", responsibility.id);
  await expect(eye(table("Lifecycle gates"), gate.id)).not.toHaveAttribute("aria-pressed", "true");
  await expect(eye(table("Program responsibilities"), responsibility.id)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    panel().getByRole("button", { name: "Back to previous record", exact: true }),
  ).toHaveCount(0);
  await (await closeButton()).click();
  await expect(panel()).toHaveCount(0);
  await expect(eye(table("Program responsibilities"), responsibility.id)).toBeFocused();
  await expect(eye(table("Program responsibilities"), responsibility.id)).not.toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await eye(table("Lifecycle gates"), gate.id).click();
  await expectRecord("lifecycle_gates", gate.id, gate.title);
  await eye(table("Program responsibilities"), responsibility.id).click();
  await expectRecord("program_role_assignments", responsibility.id);
  await panel().focus();
  await page.keyboard.press("Escape");
  await expect(panel()).toHaveCount(0);
  await expect(eye(table("Program responsibilities"), responsibility.id)).toBeFocused();
  console.log("PASS sibling registers replace one panel and clear the prior active selection");

  await eye(table("Lifecycle gates"), gate.id).click();
  await expectRecord("lifecycle_gates", gate.id, gate.title);
  const criteriaSearch = panel().getByPlaceholder("Find gate criteria", { exact: true });
  await criteriaSearch.fill(suffix);
  await eye(
    panel().getByRole("table", { name: "Gate criteria", exact: true }),
    criterion.id,
  ).click();
  await expectRecord("gate_criteria", criterion.id, criterion.title, true);
  const back = header().getByRole("button", { name: "Back to previous record", exact: true });
  await expect(back).toHaveCount(1);
  await back.click();
  await expectRecord("lifecycle_gates", gate.id, gate.title);
  await expect(panel().getByRole("table", { name: "Gate criteria", exact: true })).toBeVisible();
  await expect(criteriaSearch).toHaveValue(suffix);
  await (await closeButton()).click();
  await expect(panel()).toHaveCount(0);
  console.log("PASS linked ProgramCollection preserves its workflow context and Back target");

  // Previous and next walk every displayed row, across the table's pages, and the table turns to
  // the page that holds the shown record.
  const gates = table("Lifecycle gates");
  const firstPage = gates.locator("tbody tr[data-row-id]");
  await expect(firstPage).toHaveCount(20);
  const pageOne = await firstPage.evaluateAll((rows) => rows.map((row) => row.dataset.rowId));
  assert.equal(pageOne[0], gate.id, "The first gate in sequence leads the first page");
  const last = pageOne.at(-1);
  const pressed = gates.locator('tbody tr[data-row-id]:has(button[aria-pressed="true"])');
  const expectStep = async (position) => {
    const title = await panel().locator("[data-record-preview-header] h2").innerText();
    await expect(status()).toHaveText(new RegExp(`^${escape(title)}, ${position} of 22 records$`));
    await expect(pressed).toHaveCount(1);
    await expect(pressed).toContainText(title);
    await expect
      .poll(() => onScreen(pressed), { message: "The shown record's row is on screen" })
      .toBe(true);
    return pressed.getAttribute("data-row-id");
  };
  // Opening a preview from the keyboard moves focus into the panel, at every width.
  await eye(gates, last).focus();
  await page.keyboard.press("Enter");
  await expect(panel()).toBeFocused();
  assert.equal(await expectStep(20), last);
  await step("Next record").click();
  const twentyFirst = await expectStep(21);
  assert.ok(!pageOne.includes(twentyFirst), "Next crossed onto the second page");
  await expect(gates.locator(`tbody tr[data-row-id="${last}"]`)).toHaveCount(0);
  await step("Previous record").click();
  assert.equal(await expectStep(20), last, "Previous turned back to the first page");
  await step("Next record").click();
  await expectStep(21);
  await step("Next record").click();
  const lastRecord = await expectStep(22);
  // At the end the control the reader used stays focused and says it is unavailable.
  await expect(step("Next record")).toBeFocused();
  await expect(step("Next record")).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  await expectStep(22);
  await expect(step("Previous record")).not.toHaveAttribute("aria-disabled", "true");
  await page.screenshot({ path: join(screenshots, "walk-1600.png") });
  await escapePreview();
  // Close returns to the shown record's eye, not to the eye that opened the preview.
  await expect(eye(gates, lastRecord)).toBeFocused();
  console.log("PASS previous/next walk every page, turn the table's page and announce the record");

  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/programs/${program.id}?tab=Findings`);
    await eye(table("observations"), observation.id).click();
    await expectRecord("observations", observation.id, observation.title);
    const citations = panel().getByRole("table", { name: "evidence citations", exact: true });
    const citationSearch = panel().getByPlaceholder("Search evidence citations", { exact: true });
    await citationSearch.fill(suffix);
    await eye(citations, citation.id).focus();
    await page.keyboard.press("Enter");
    await expectRecord("observation_evidence", citation.id, undefined, true);
    await expect(panel()).toBeFocused();
    await expect(
      panel().getByRole("definition").filter({ hasText: citation.description }),
    ).toBeVisible();
    await expect(
      panel().getByRole("heading", { name: observation.title, exact: true }),
    ).toHaveCount(0);
    await page.screenshot({ path: join(screenshots, `nested-${width}.png`) });
    await header().getByRole("button", { name: "Back to previous record", exact: true }).click();
    await expectRecord("observations", observation.id, observation.title);
    // Back returns focus to the control in the parent frame that opened the nested record.
    await expect(eye(citations, citation.id)).toBeFocused();
    await expect(citationSearch).toHaveValue(suffix);
    await expect(eye(citations, citation.id)).not.toHaveAttribute("aria-pressed", "true");
    await expect(panel().getByText(observation.description, { exact: true })).toBeVisible();
    // Close in a nested frame ends the whole preview and returns to the record's eye in Main.
    await eye(citations, citation.id).click();
    await expectRecord("observation_evidence", citation.id, undefined, true);
    await (await closeButton()).click();
    await expect(panel()).toHaveCount(0);
    await expect(eye(table("observations"), observation.id)).toBeFocused();
    await expect(eye(table("observations"), observation.id)).not.toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // So does Escape.
    await eye(table("observations"), observation.id).click();
    await expectRecord("observations", observation.id, observation.title);
    await eye(citations, citation.id).click();
    await expectRecord("observation_evidence", citation.id, undefined, true);
    await page.mouse.move(0, 0);
    await escapePreview();
    await expect(eye(table("observations"), observation.id)).toBeFocused();
    console.log(
      `PASS ${width}px nested preview: one surface, keyboard opener, Back pops one frame, Close and Escape end the preview`,
    );
  }
  // The package version preview keeps one frame while previous and next step through versions:
  // the new version replaces the content, and focus stays on the control the reader pressed.
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`${origin}/packages/${pkg.id}`);
  const versionTable = page.getByRole("table", { name: /^package versions$/i });
  const versionRows = versionTable.locator("tbody tr[data-row-id]");
  await expect(versionRows).toHaveCount(2);
  const versionIds = await versionRows.evaluateAll((rows) => rows.map((row) => row.dataset.rowId));
  const packageVersion = (id) => packageVersions.find((item) => item.id === id);
  const versionTitle = (id) => `Version ${packageVersion(id).version_number}`;
  await eye(versionTable, versionIds[0]).focus();
  await page.keyboard.press("Enter");
  await expect(panel()).toBeFocused();
  const inner = panel().locator("[data-record-preview-header] h2");
  await expect(inner).toHaveText(versionTitle(versionIds[0]));
  const frame = await panel().elementHandle();
  await step("Next record").focus();
  await page.keyboard.press("Enter");
  await expect(inner).toHaveText(versionTitle(versionIds[1]));
  await expect(status()).toHaveText(`${versionTitle(versionIds[1])}, 2 of 2 records`);
  await expect(step("Next record")).toBeFocused();
  assert.ok(
    await frame.evaluate((element) => element.isConnected),
    "The panel stays mounted across the step",
  );
  await expect(
    panel().getByText(packageVersion(versionIds[1]).description, { exact: true }),
  ).toBeVisible();
  await step("Previous record").focus();
  await page.keyboard.press("Enter");
  await expect(inner).toHaveText(versionTitle(versionIds[0]));
  await expect(step("Previous record")).toBeFocused();
  await escapePreview();
  await expect(eye(versionTable, versionIds[0])).toBeFocused();
  console.log("PASS package version preview keeps its frame and focus on previous and next");

  assert.deepEqual(errors, [], "Browser has no uncaught errors or native dialogs");
  console.log(`Preview screenshots: ${screenshots}`);
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-12000));
    await page
      .screenshot({ path: join(screenshots, "failure.png"), fullPage: true })
      .catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
