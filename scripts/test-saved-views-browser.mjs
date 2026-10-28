/** Generic Ledger saved-view surfaces bound to real host persistence and permissions. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("saved-views-browser");
const { client, tenantId } = workspace;
let browser;
let page;
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
async function eventually(check, message) {
  const until = Date.now() + 30000;
  while (Date.now() < until) {
    if (await check()) return;
    await wait(100);
  }
  assert.fail(message);
}
const records = () => data(client.from("assurance_saved_views").select().eq("tenant_id", tenantId));
const dialog = (name) => page.getByRole("dialog", { name, exact: true });
async function picker(action) {
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}
async function manage() {
  await picker("Manage saved views…");
  const manager = dialog("Saved views");
  await manager.waitFor();
  return manager;
}
async function contained(label) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${label} stays inside the viewport`,
  );
}
try {
  await data(
    client.from("programs").insert([
      { tenant_id: tenantId, code: "SV-ALPHA", name: "Saved Alpha", status: "active" },
      { tenant_id: tenantId, code: "SV-BETA", name: "Saved Beta", status: "planned" },
    ]),
  );
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/programs`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const find = page.getByRole("searchbox", { name: "Find programs", exact: true });
  await find.waitFor();
  await find.fill("Alpha");
  await picker("Save current view…");
  let editor = dialog("Save current view");
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Alpha review");
  let lost = false;
  await page.route("**/rest/v1/rpc/save_assurance_view", async (route) => {
    if (!lost) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await editor.getByRole("button", { name: "Save current view", exact: true }).click();
  await editor.getByRole("alert").waitFor();
  assert.equal(
    await editor.getByRole("textbox", { name: "Name", exact: true }).inputValue(),
    "Alpha review",
  );
  await editor.getByRole("button", { name: "Save current view", exact: true }).click();
  await editor.waitFor({ state: "hidden" });
  await page.unroute("**/rest/v1/rpc/save_assurance_view");
  let saved = await records();
  assert.equal(saved.length, 1, "Lost save response retries the same identity");
  const originalId = saved[0].id;
  const originalDefinition = saved[0].definition;
  assert.ok(originalDefinition.question.serialized.includes("Alpha"));
  await find.fill("Beta");
  let manager = await manage();
  let row = manager.getByRole("listitem", { name: "Alpha review", exact: true });
  await row.getByRole("button", { name: "Favorite", exact: true }).click();
  await row.getByRole("button", { name: "Unfavorite", exact: true }).waitFor();
  await eventually(
    async () =>
      (await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId }))).some(
        (item) => item.key === `saved-view:${originalId}` && item.favorite,
      ),
    "Favorite persists in the current user's navigation",
  );
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  editor = dialog("Edit saved view");
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Shared alpha review");
  await editor.getByRole("combobox", { name: "Visibility", exact: true }).click();
  await page.getByRole("option", { name: "Workspace", exact: true }).click();
  await editor.getByRole("button", { name: "Save view", exact: true }).click();
  await editor.waitFor({ state: "hidden" });
  await manager.waitFor();
  saved = await records();
  assert.equal(saved[0].name, "Shared alpha review");
  assert.equal(saved[0].visibility, "workspace");
  assert.deepEqual(
    saved[0].definition,
    originalDefinition,
    "Renaming/sharing preserves saved settings unless replacement is chosen",
  );
  row = manager.getByRole("listitem", { name: "Shared alpha review", exact: true });
  await row.getByRole("button", { name: "Duplicate", exact: true }).click();
  editor = dialog("Duplicate saved view");
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Alpha copy");
  await editor.getByRole("button", { name: "Create copy", exact: true }).click();
  await editor.waitFor({ state: "hidden" });
  saved = await records();
  const copy = saved.find((view) => view.name === "Alpha copy");
  assert.ok(copy);
  assert.notEqual(copy.id, originalId);
  assert.equal(copy.visibility, "private");
  assert.deepEqual(
    copy.definition,
    originalDefinition,
    "Duplicate copies selected view, not current Beta filter",
  );
  await manager.getByRole("searchbox", { name: "Find saved views" }).fill("nothing");
  await manager.getByText("No views match this search.", { exact: true }).waitFor();
  await manager.getByRole("searchbox", { name: "Find saved views" }).fill("");
  await manager
    .getByRole("listitem", { name: "Alpha copy", exact: true })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  editor = dialog("Edit saved view");
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Do not save");
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  let confirmation = page.getByRole("alertdialog", { name: "Discard changes?", exact: true });
  await confirmation.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(
    await editor.getByRole("textbox", { name: "Name", exact: true }).inputValue(),
    "Do not save",
  );
  await page.keyboard.press("Escape");
  await confirmation.getByRole("button", { name: "Discard changes", exact: true }).click();
  await editor.waitFor({ state: "hidden" });
  await manager.waitFor();
  assert.equal((await records()).find((view) => view.id === copy.id).name, "Alpha copy");
  await manager
    .getByRole("listitem", { name: "Alpha copy", exact: true })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  editor = dialog("Edit saved view");
  await editor
    .getByRole("checkbox", { name: "Replace settings with the current view", exact: true })
    .check();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/rpc/save_assurance_view", async (route) => {
    await gate;
    await route.continue();
  });
  await editor.getByRole("button", { name: "Save view", exact: true }).click();
  await eventually(
    async () => (await editor.getAttribute("aria-busy")) === "true",
    "Save enters pending state",
  );
  await page.keyboard.press("Escape");
  assert.ok(await editor.isVisible(), "Pending save blocks Escape");
  assert.ok(await editor.getByRole("textbox", { name: "Name", exact: true }).isDisabled());
  release();
  await editor.waitFor({ state: "hidden" });
  await page.unroute("**/rest/v1/rpc/save_assurance_view");
  saved = await records();
  assert.ok(
    saved.find((view) => view.id === copy.id).definition.question.serialized.includes("Beta"),
    "Explicit settings replacement captures the current query",
  );
  await contained("Desktop saved-view manager");
  await page.screenshot({
    path: "/private/tmp/ledger-saved-views-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await contained("Phone saved-view manager");
  row = manager.getByRole("listitem", { name: "Alpha copy", exact: true });
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  confirmation = page.getByRole("alertdialog", { name: "Delete Alpha copy?", exact: true });
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await row.waitFor();
  await page.screenshot({
    path: "/private/tmp/ledger-saved-views-mobile.png",
    animations: "disabled",
  });
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await confirmation.getByRole("button", { name: "Delete view", exact: true }).click();
  await confirmation.waitFor({ state: "hidden" });
  await row.waitFor({ state: "hidden" });
  assert.equal((await records()).length, 1);
  await manager.getByRole("button", { name: "Close", exact: true }).last().click();
  await manager.waitFor({ state: "hidden" });
  await picker("Shared alpha review");
  await eventually(
    async () => (await find.inputValue()) === "Alpha",
    "Selected shared view restores saved filter",
  );
  await page.reload();
  await find.waitFor();
  await picker("Shared alpha review");
  await eventually(
    async () => (await find.inputValue()) === "Alpha",
    "Saved filter still applies after reload",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Ledger picker/manager/editor integration; create and lost-response retry; rename/share preserving settings; source-definition duplication; favorite; manager search; dirty discard/keep; pending close protection; explicit settings replacement; confirmed deletion; shared apply after reload; desktop and 390px.",
  );
} catch (error) {
  if (page) {
    await page
      .screenshot({ path: "/private/tmp/ledger-saved-views-failure.png", animations: "disabled" })
      .catch(() => {});
    console.error((await page.locator("body").innerText()).slice(0, 12000));
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
