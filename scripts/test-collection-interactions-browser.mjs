import assert from "node:assert/strict";
import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";
const workspace = await localWorkspace("collection-browser");
const { client, tenantId } = workspace;
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const eventually = async (check, message) => {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (await check()) return;
    await wait(100);
  }
  assert.fail(message);
};
let browser, page;
try {
  const programs = await data(
    client
      .from("programs")
      .insert(
        ["Alpha", "Beta", "Gamma"].map((name, index) => ({
          tenant_id: tenantId,
          code: `COL-${index}`,
          name: `Collection ${name}`,
        })),
      )
      .select(),
  );
  for (const item of programs)
    await data(
      client.rpc("command_assurance_navigation", {
        p_tenant_id: tenantId,
        p_operation: "favorite",
        p_target: { kind: "program", recordId: item.id },
        p_keys: null,
      }),
    );
  const readFavorites = async () =>
    (await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId })))
      .filter((item) => item.favorite)
      .sort((a, b) => a.position - b.position);
  const favoriteNames = async () => (await readFavorites()).map((item) => item.destination.title);
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/programs`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("searchbox", { name: "Find programs", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Search records, views, and actions", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Search and actions", exact: true });
  await dialog.getByRole("combobox").fill("Manage favorites");
  await dialog
    .getByRole("option")
    .filter({ hasText: "Manage favorites and recent records" })
    .click();
  dialog = page.getByRole("dialog", { name: "Favorites and recent records", exact: true });
  await dialog.waitFor();
  const source = dialog.getByRole("button", { name: "Reorder Collection Alpha", exact: true });
  const target = dialog.getByRole("button", { name: "Reorder Collection Gamma", exact: true });
  const start = await source.boundingBox();
  const end = await target.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 12, { steps: 3 });
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 10 });
  await dialog.locator('[data-slot="reorder-insertion"]').waitFor();
  await page.mouse.up();
  await eventually(
    async () =>
      (await favoriteNames()).join() === "Collection Beta,Collection Gamma,Collection Alpha",
    "Pointer reorder persists favorite order",
  );
  await eventually(async () => !(await source.isDisabled()), "Pending favorite reorder settles");
  await source.focus();
  await page.keyboard.press("Space");
  await dialog.locator("[data-dragging]").waitFor();
  await page.keyboard.press("ArrowUp");
  await dialog.locator('[data-slot="reorder-insertion"]').waitFor();
  await page.keyboard.press("Space");
  await eventually(
    async () =>
      (await favoriteNames()).join() === "Collection Beta,Collection Alpha,Collection Gamma",
    "Keyboard reorder persists favorite order",
  );
  await eventually(async () => !(await source.isDisabled()), "Keyboard reorder settles");
  // Keyboard focus keeps the handle tooltip open above the neighboring row. Dismiss it
  // before switching to pointer selection, exactly as a mixed-input user would.
  await page.keyboard.press("Escape");
  await dialog
    .getByRole("checkbox", { name: "Select favorite Collection Beta", exact: true })
    .click();
  await page.keyboard.down("Shift");
  await dialog
    .getByRole("checkbox", { name: "Select favorite Collection Gamma", exact: true })
    .click();
  await page.keyboard.up("Shift");
  assert.match(await dialog.textContent(), /3 selected/);
  await page.screenshot({
    path: "/private/tmp/collection-favorites-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({
    path: "/private/tmp/collection-favorites-phone.png",
    animations: "disabled",
  });
  await dialog.getByRole("button", { name: "Remove selected", exact: true }).click();
  await eventually(
    async () => (await readFavorites()).length === 0,
    "Selected favorites removed through existing authorized operation",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).last().click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/programs/${programs[0].id}/workbook`);
  await page.getByRole("grid").first().waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Reorder Requirements", exact: true }).count(),
    0,
    "Source sheets have no drag handle",
  );
  await page.getByRole("button", { name: "Add sheet", exact: true }).click();
  const add = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("textbox", { name: "Sheet name", exact: true }) });
  await add.getByRole("textbox", { name: "Sheet name", exact: true }).fill("Collection analysis");
  await add.getByRole("button", { name: "Add sheet", exact: true }).click();
  await add.waitFor({ state: "hidden" });
  const sheetHandle = page.getByRole("button", {
    name: "Reorder Collection analysis",
    exact: true,
  });
  await sheetHandle.focus();
  const before = await page
    .locator('[data-slot="spreadsheet-sheets"] button[data-sheet-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent));
  await page.keyboard.press("Space");
  await page.locator('[data-slot="spreadsheet-sheets"] [data-dragging]').waitFor();
  await page.keyboard.press("ArrowLeft");
  await page.locator('[data-slot="spreadsheet-sheets"] [data-slot="reorder-insertion"]').waitFor();
  await page.keyboard.press("Space");
  await eventually(async () => {
    const after = await page
      .locator('[data-slot="spreadsheet-sheets"] button[data-sheet-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    return after.indexOf("Collection analysis") === before.indexOf("Collection analysis") - 1;
  }, "Sheet handle moves analysis sheet without opening a different sheet");
  assert.equal(
    await page
      .getByRole("button", { name: "Collection analysis", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Save analysis", exact: true }).click();
  await eventually(
    async () => await page.getByRole("button", { name: "Save analysis", exact: true }).isDisabled(),
    "Workbook reorder saves",
  );
  await page.screenshot({
    path: "/private/tmp/collection-workbook-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({
    path: "/private/tmp/collection-workbook-phone.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS collection interactions: pointer/keyboard favorite reorder, range selection, bulk removal, protected source tabs, analysis sheet reorder/save, desktop/390px containment",
  );
} catch (error) {
  if (page) {
    await page.screenshot({ path: "/private/tmp/collection-browser-failure.png", fullPage: true });
    console.error(await page.locator("body").textContent());
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
