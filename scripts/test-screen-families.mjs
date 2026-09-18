#!/usr/bin/env node
/** The declared route inventory drives identity, collection and touch-preview checks. */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const expect = playwrightExpect.configure({ timeout: 30000 });
const inventory = JSON.parse(
  await readFile(new URL("../docs/guides/screen-inventory.json", import.meta.url), "utf8"),
);
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const artifacts = process.env.PATTERN_ARTIFACT_DIR || "/tmp/pattern-screen-families";
await mkdir(artifacts, { recursive: true });
const workspace = await localWorkspace("screen-families");
const fixtures = {};
const missing = randomUUID();
let browser;
let page;
const errors = [];
async function insert(model, values) {
  const result = await workspace.client
    .from(model)
    .insert({ ...values, tenant_id: workspace.tenantId })
    .select()
    .single();
  assert.ifError(result.error);
  (fixtures[model] ??= []).push(result.data);
  return result.data;
}
function name(row) {
  return row?.name ?? row?.title ?? row?.code;
}
function routePath(screen, path = screen.path) {
  return path.replace(/\$(\w+)/g, (_, parameter) => {
    if (parameter === "collection") return "parties";
    if (parameter === "programId") return fixtures.programs[0].id;
    return fixtures[screen.model]?.[0]?.id ?? missing;
  });
}
async function bounds(width, label) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), {
      message: `${label}: page fits ${width}px after the rail transition`,
      timeout: 5000,
    })
    .toBeLessThanOrEqual(1);
  const previewHeader = page.locator("[data-record-preview-header]").filter({ visible: true });
  const identity = (await previewHeader.count())
    ? previewHeader.getByRole("heading", { level: 2 })
    : page.getByRole("heading", { level: 1 });
  await expect(identity).toBeVisible();
  const heading = await identity.boundingBox();
  assert.ok(heading && heading.x >= -1 && heading.x + heading.width <= width + 1, label);
}
async function verifyCollection(screen, width, tabName) {
  const table = page.getByRole("table").or(page.getByRole("treegrid")).first();
  const empty = page.getByRole("main").locator('[data-slot="empty"]').first();
  // The kit replaces a genuinely empty register with its illustrated first-record state.
  await expect(table.or(empty).first()).toBeVisible();
  await expect(page.locator('[data-slot="page-header-description"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  if (!(await table.count())) {
    assert.ok(tabName, `${screen.path}: the seeded primary register must contain records`);
    await expect(empty.locator('[data-slot="empty-title"]')).not.toHaveText("");
    await expect(empty.locator('[data-slot="empty-description"]')).not.toHaveText("");
    await expect(empty.locator('[data-slot="empty-illustration"]')).toHaveCount(1);
    await bounds(width, `${screen.path} ${tabName} empty collection`);
    return;
  }
  await expect(page.getByRole("searchbox").first()).toBeVisible();
  const row = table.locator("tbody tr[data-row-id]").first();
  if (!(await row.count())) {
    await expect(table.locator('[data-slot="empty-title"]')).toHaveCount(1);
    await expect(table.locator('[data-slot="empty-description"]')).not.toHaveText("");
    await expect(table.locator('[data-slot="empty-illustration"]')).toHaveCount(1);
    await bounds(width, `${screen.path} ${tabName ?? ""} empty collection`);
    return;
  }
  await expect(row.getByRole("link").first()).toHaveAttribute("href", /\//);
  const eye = row.getByRole("button", { name: /Preview/ }).first();
  await expect(eye).toBeVisible();
  if (width === 390) {
    const opacity = await eye.evaluate((element) => {
      let node = element;
      while (node && node.tagName !== "TR") {
        if (getComputedStyle(node).opacity === "0") return 0;
        node = node.parentElement;
      }
      return 1;
    });
    assert.equal(opacity, 1, `${screen.path}: preview is discoverable without hover`);
  }
  const before = await table
    .locator("tbody tr[data-row-id]")
    .evaluateAll((elements) => elements.map((element) => element.dataset.rowId));
  await eye.click();
  await expect(page.getByRole("button", { name: "Close details", exact: true })).toBeVisible();
  const header = page.locator("[data-record-preview-header]").filter({ visible: true });
  await expect(header.getByRole("heading", { level: 2 })).toHaveCount(1);
  const next = page.getByRole("button", { name: "Next record", exact: true });
  if (before.length > 1) {
    await expect(next).toBeEnabled();
    const first = await header.innerText();
    await next.click();
    await expect.poll(() => header.innerText()).not.toBe(first);
    await expect(page.getByRole("button", { name: "Previous record", exact: true })).toBeEnabled();
  } else await expect(next).toBeDisabled();
  const fullRecord = page.getByRole("link", { name: /Open full record/ }).first();
  await expect(fullRecord).toHaveAttribute("target", "_blank");
  await expect(fullRecord).toHaveAttribute("href", /\//);
  await bounds(width, `${screen.path} with preview`);
  await page.screenshot({
    path: `${artifacts}/${screen.file.replaceAll(".tsx", "")}-${tabName?.replaceAll(/[^a-z0-9]/gi, "-") ?? "default"}-${width}-preview.png`,
  });
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  assert.deepEqual(
    (
      await table
        .locator("tbody tr[data-row-id]")
        .evaluateAll((elements) => elements.map((element) => element.dataset.rowId))
    ).slice(0, 2),
    before.slice(0, 2),
  );
}

async function verifyTabs(screen, width) {
  if (!screen.tabList) return;
  const tabs = page.getByRole("tablist", { name: screen.tabList, exact: true });
  await expect(tabs).toBeVisible();
  const declared = [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)];
  const actual = await tabs.getByRole("tab").allTextContents();
  assert.deepEqual(
    actual.map((text) => text.replace(/\s*[\d,]+\+?\s*$/, "").trim()).sort(),
    [...declared].sort(),
    `${screen.path}: every tab declares its collection shape or a reason`,
  );
  for (const tabName of declared) {
    const tab = tabs.getByRole("tab").filter({
      hasText: new RegExp(`^${tabName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|\\d|$)`),
    });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    if (screen.collectionTabs.includes(tabName)) await verifyCollection(screen, width, tabName);
    else assert.ok(screen.tabExceptions[tabName], `${screen.path}: ${tabName} has a reason`);
    await bounds(width, `${screen.path} ${tabName}`);
    console.log(`PASS ${width}px tab ${screen.path} ${tabName}`);
  }
}

async function verifyMissingRecord(screen) {
  const expected = screen.missingRecord;
  assert.ok(
    expected?.reason,
    `${screen.path}: a missing fixture needs an explicit dependency reason`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(expected.kind);
  const empty = page.locator('[data-slot="empty"]').filter({
    has: page
      .locator('[data-slot="empty-title"]')
      .filter({ hasText: `${expected.kind} not found` }),
  });
  await expect(empty).toBeVisible();
  await expect(empty.locator('[data-slot="empty-illustration"]')).toHaveCount(1);
  await expect(empty.locator('[data-slot="empty-description"]')).not.toHaveText("");
  await expect(empty.getByRole("link")).toHaveAttribute("href", expected.backTo);
  await expect(page.getByRole("alert")).toHaveCount(0);
}

try {
  for (const label of ["Alpha", "Beta"]) {
    const program = await insert("programs", {
      code: `SCREEN-${label}`,
      name: `${label} assurance program`,
    });
    const system = await insert("systems", {
      program_id: program.id,
      code: `SYS-${label}`,
      name: `${label} system`,
      system_type: "information_system",
    });
    const person = (
      await workspace.client
        .from("parties")
        .select("*")
        .eq("auth_user_id", workspace.userId)
        .single()
    ).data;
    const task = await insert("tasks", {
      program_id: program.id,
      title: `${label} assurance task`,
    });
    await insert("task_assignments", {
      task_id: task.id,
      party_id: person.id,
      assignment_role: "responsible",
    });
    await insert("risks", { program_id: program.id, title: `${label} risk` });
    await insert("assessment_campaigns", { program_id: program.id, title: `${label} campaign` });
    await insert("operational_issues", {
      program_id: program.id,
      title: `${label} operational issue`,
    });
    await insert("workstreams", { program_id: program.id, title: `${label} workstream` });
    const document = await insert("poam_documents", {
      program_id: program.id,
      title: `${label} remediation plan`,
    });
    await insert("poam_items", {
      poam_document_id: document.id,
      title: `${label} remediation item`,
    });
    await insert("authorization_packages", {
      program_id: program.id,
      system_id: system.id,
      title: `${label} authorization package`,
    });
    await insert("parties", { party_type: "organization", name: `${label} supplier` });
    await insert("evidence_artifacts", {
      program_id: program.id,
      title: `${label} evidence`,
      artifact_kind: "document",
    });
    const component = await insert("component_definitions", {
      code: `COMP-${label}`,
      name: `${label} component`,
    });
    await insert("component_definition_revisions", {
      component_definition_id: component.id,
      version_number: 1,
    });
    const product = await insert("products", { code: `PROD-${label}`, name: `${label} product` });
    await insert("product_revisions", { product_id: product.id, version_number: 1 });
    await insert("requirement_definitions", {
      code: `REQ-${label}`,
      title: `${label} requirement`,
    });
  }
  for (const model of ["profiles", "controls"]) {
    const result = await workspace.client.from(model).select("*").limit(2);
    assert.ifError(result.error);
    fixtures[model] = result.data;
  }
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      isMobile: width === 390,
    });
    page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/work`);
    await page.getByLabel("Email", { exact: true }).fill(workspace.email);
    await page.getByLabel("Password", { exact: true }).fill(workspace.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
    for (const screen of inventory) {
      if (screen.family === "exception") continue;
      const path = routePath(screen);
      await page.goto(`${origin}${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (screen.family !== "redirect")
        await expect(page).toHaveTitle(`${screen.title} — Program Assurance`);
      const fixture = fixtures[screen.model]?.[0];
      if (["record", "program-view", "schema-record"].includes(screen.family)) {
        if (fixture)
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(name(fixture));
        else await verifyMissingRecord(screen);
      }
      if (screen.family === "redirect") {
        assert.ok(screen.redirectTo, `${screen.path}: declare the canonical redirect destination`);
        await expect(page).toHaveURL(`${origin}${routePath(screen, screen.redirectTo)}`);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(name(fixture));
      }
      if (["register", "schema-register"].includes(screen.family)) {
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          screen.heading ?? screen.title,
        );
        await verifyCollection(screen, width);
      }
      if (fixture) await verifyTabs(screen, width);
      await bounds(width, path);
      console.log(`PASS ${width}px ${screen.family} ${path}`);
    }
    await context.close();
  }
  assert.deepEqual(errors, [], "Every declared product route renders without a browser exception");
} catch (error) {
  await page?.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
  console.error("Browser errors:", errors);
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
