/** Explicit pin/peek workflow, independent positions and narrow retained preview state. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("record-comparison-browser");
const { client, tenantId } = workspace;
let browser, page;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
try {
  const sponsor = await insert("parties", { name: "Comparison sponsor", party_type: "person" });
  const program = await insert("programs", {
    sponsor_party_id: sponsor.id,
    code: "COMPARE",
    name: "Comparison validation",
    status: "active",
  });
  const records = [];
  for (const name of ["Alpha reference", "Beta working requirement"]) {
    const requirement = await insert("engineering_requirements", {
      program_id: program.id,
      code: name.startsWith("Alpha") ? "REQ-A" : "REQ-B",
    });
    await insert("requirement_revisions", {
      engineering_requirement_id: requirement.id,
      version_number: 1,
      title: name,
      statement: Array.from(
        { length: 20 },
        (_, i) => `${name}: paragraph ${i + 1} defines the recorded assurance obligation.`,
      ).join("\n\n"),
      acceptance_criteria: "The source can be compared without replacing the working record.",
      requirement_type: "security",
    });
    records.push(requirement);
  }
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/programs`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Comparison validation", exact: true }).waitFor();
  await page.goto(
    `${origin}/programs/${program.id}?tab=requirements&requirementId=${records[0].id}`,
  );
  await page.getByRole("button", { name: "Pin reference for comparison", exact: true }).click();
  const reference = page.locator("[data-record-reference]");
  await reference.getByRole("heading", { name: "Alpha reference", exact: true }).waitFor();
  const next = page.getByRole("button", { name: "Next record", exact: true });
  await next.click();
  const working = page.locator('[data-slot="comparison-primary"]');
  await working.getByRole("heading", { name: "Beta working requirement", exact: true }).waitFor();
  assert.equal(
    await reference.getByRole("heading", { name: "Alpha reference", exact: true }).count(),
    1,
  );
  const referencePane = page.locator('[data-slot="comparison-secondary"]');
  await referencePane.evaluate((node) => {
    node.scrollTop = 160;
  });
  const position = await referencePane.evaluate((node) => node.scrollTop);
  await page.screenshot({
    path: "/private/tmp/record-comparison-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Working record", exact: true }).click();
  await working.getByRole("heading", { name: "Beta working requirement", exact: true }).waitFor();
  await page.getByRole("button", { name: "Pinned reference", exact: true }).click();
  await reference.getByRole("heading", { name: "Alpha reference", exact: true }).waitFor();
  assert.equal(
    await working.locator("h2").filter({ hasText: "Beta working requirement" }).count(),
    1,
    "Working record stays mounted while hidden",
  );
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({
    path: "/private/tmp/record-comparison-mobile.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.locator('[data-slot="comparison"][data-layout="split"]').waitFor();
  await page.waitForFunction(
    (expected) =>
      (() => {
        const pane = document.querySelector('[data-slot="comparison-secondary"]');
        return pane && pane.scrollTop === Math.min(expected, pane.scrollHeight - pane.clientHeight);
      })(),
    position,
  );
  assert.equal(
    await referencePane.evaluate((node) => node.scrollTop),
    await referencePane.evaluate(
      (node, original) => Math.min(original, node.scrollHeight - node.clientHeight),
      position,
    ),
    "Pinned reference keeps its independent scroll position within the new scroll bounds",
  );
  console.log(
    "PASS: pin, independent preview navigation, mobile pane retention and resize position.",
  );
  const main = page.locator('[data-shell-area="main"]');
  const collectionActions = main.getByRole("button", { name: "Collection actions", exact: true });
  if (!(await collectionActions.isVisible()))
    await main.getByRole("button", { name: /^More (filters|display)/ }).click();
  await page.getByRole("button", { name: "Collection actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Open workbook", exact: true }).click();
  await page.waitForURL(`**/programs/${program.id}/workbook`);
  await page.getByRole("grid").first().waitFor();
  await reference.getByRole("heading", { name: "Alpha reference", exact: true }).waitFor();
  await page.screenshot({
    path: "/private/tmp/record-comparison-workbook.png",
    animations: "disabled",
  });
  console.log("PASS: pinned source remains beside the workbook.");
  await page.getByRole("link", { name: "Programs", exact: true }).first().click();
  await page.getByRole("link", { name: "Comparison validation", exact: true }).waitFor();
  await reference.getByRole("heading", { name: "Alpha reference", exact: true }).waitFor();
  await page.getByRole("button", { name: "Unpin reference", exact: true }).click();
  await reference.waitFor({ state: "detached" });
  assert.equal(
    await page.locator('[data-shell-area="panel"]').count(),
    0,
    "No comparison rail remains after unpinning",
  );
  await page.goto(`${origin}/programs/${program.id}`);
  const peek = page.getByRole("button", { name: "Preview Comparison sponsor", exact: true });
  await peek.click();
  const popup = page.getByRole("dialog", { name: "Preview Comparison sponsor", exact: true });
  await popup.getByRole("link", { name: "Open record", exact: true }).waitFor();
  await popup.getByRole("button", { name: "Compare", exact: true }).click();
  await page
    .locator("[data-record-reference]")
    .getByRole("heading", { name: "Comparison sponsor", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: explicit pin/next, retained narrow panes and independent position, route persistence, unpin, lazy linked-record peek and Compare.",
  );
} catch (error) {
  if (page) {
    console.error(
      "Comparison geometry",
      await page.locator('[data-slot^="comparison"]').evaluateAll((nodes) =>
        nodes.map((node) => ({
          slot: node.getAttribute("data-slot"),
          top: node.scrollTop,
          height: node.clientHeight,
          scroll: node.scrollHeight,
          width: node.clientWidth,
          hidden: node.hidden,
        })),
      ),
    );
    console.error((await page.locator("body").innerText()).slice(0, 11000));
    await page.screenshot({ path: "/private/tmp/record-comparison-failure.png" }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
