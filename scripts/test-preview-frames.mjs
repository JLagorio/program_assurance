#!/usr/bin/env node
/** Shared preview host: sibling replacement, linked-record context and nested Back/focus. */
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
const panel = () => page.locator('[data-shell-area="panel"]');
const table = (name) => page.getByRole("table", { name, exact: true });
const eye = (collection, id) =>
  collection
    .locator(`tbody tr[data-row-id="${id}"]`)
    .getByRole("button", { name: "Preview row", exact: true });
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
  const gate = await insert("lifecycle_gates", {
    program_id: program.id,
    title: `Review gate ${suffix}`,
    description: "Parent gate context survives the linked record preview.",
  });
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
  await panel().getByRole("button", { name: "Close details", exact: true }).click();
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
  const back = panel()
    .locator('[data-slot="shell-panel-header"]')
    .getByRole("button", { name: "Back to previous record", exact: true });
  await expect(back).toHaveCount(1);
  await back.click();
  await expectRecord("lifecycle_gates", gate.id, gate.title);
  await expect(panel().getByRole("table", { name: "Gate criteria", exact: true })).toBeVisible();
  await expect(criteriaSearch).toHaveValue(suffix);
  await panel().getByRole("button", { name: "Close details", exact: true }).click();
  await expect(panel()).toHaveCount(0);
  console.log("PASS linked ProgramCollection preserves its workflow context and Back target");

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
    await panel()
      .locator('[data-slot="shell-panel-header"]')
      .getByRole("button", { name: "Back to previous record", exact: true })
      .click();
    await expectRecord("observations", observation.id, observation.title);
    await expect(panel()).toBeFocused();
    await expect(citationSearch).toHaveValue(suffix);
    await expect(eye(citations, citation.id)).not.toHaveAttribute("aria-pressed", "true");
    await expect(panel().getByText(observation.description, { exact: true })).toBeVisible();
    await eye(citations, citation.id).click();
    await expectRecord("observation_evidence", citation.id, undefined, true);
    await panel().getByRole("button", { name: "Close details", exact: true }).click();
    await expectRecord("observations", observation.id, observation.title);
    await panel().getByRole("button", { name: "Close details", exact: true }).click();
    await expect(panel()).toHaveCount(0);
    await expect(eye(table("observations"), observation.id)).toBeFocused();
    console.log(
      `PASS ${width}px nested preview: one surface, keyboard opener, Back/Close, parent and focus restoration`,
    );
  }
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
