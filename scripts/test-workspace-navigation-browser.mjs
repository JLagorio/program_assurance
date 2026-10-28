import assert from "node:assert/strict";
import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";
const workspace = await localWorkspace("navigation-browser");
const { client, tenantId } = workspace;
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
let browser, page;
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
async function launcher(query = "") {
  await page
    .getByRole("button", { name: "Search records, views, and actions", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Search and actions", exact: true });
  await dialog.getByRole("combobox").fill(query);
  return dialog;
}
try {
  const programs = await data(
    client
      .from("programs")
      .insert([
        { tenant_id: tenantId, code: "NAV-ALPHA", name: "Navigation Alpha" },
        { tenant_id: tenantId, code: "NAV-BETA", name: "Navigation Beta" },
      ])
      .select(),
  );
  const alpha = programs.find((x) => x.code === "NAV-ALPHA");
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
  await page.getByRole("link", { name: "Navigation Alpha", exact: true }).click();
  await page.waitForURL((url) => url.pathname === `/programs/${alpha.id}`);
  await page.getByRole("button", { name: "Add to favorites", exact: true }).click();
  await page.getByRole("button", { name: "Remove from favorites", exact: true }).waitFor();
  await eventually(async () => {
    const items = await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId }));
    return items.some(
      (x) => x.favorite && x.destination?.title === "Navigation Alpha" && x.visitedAt,
    );
  }, "Opened favorite must be persisted");
  await page.reload();
  await page.getByRole("button", { name: "Remove from favorites", exact: true }).waitFor();
  let dialog = await launcher();
  assert.equal(
    await dialog.getByRole("option", { name: "Navigation Alpha", exact: true }).count(),
    1,
    "Favorite appears before query",
  );
  await page.keyboard.press("Escape");
  await page.goto(`${origin}/programs`);
  const find = page.getByRole("searchbox", { name: "Find programs", exact: true });
  await find.fill("Alpha");
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitem", { name: "Save current view…", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Save current view", exact: true });
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Alpha review view");
  await dialog.getByRole("button", { name: "Save current view", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await find.fill("Beta");
  dialog = await launcher("Alpha review");
  await dialog.getByRole("button", { name: "Views", exact: true }).click();
  await dialog.getByRole("option").filter({ hasText: "Alpha review view" }).click();
  await eventually(
    async () => (await find.inputValue()) === "Alpha",
    "Launcher must apply saved filter, not just open register",
  );
  await eventually(
    async () => !new URL(page.url()).searchParams.has("savedView"),
    "Applied-view link is consumed once",
  );
  await find.fill("Beta");
  dialog = await launcher("Alpha review");
  await dialog.getByRole("option").filter({ hasText: "Alpha review view" }).click();
  await eventually(
    async () => (await find.inputValue()) === "Alpha",
    "Reopening the same saved view must apply again",
  );
  const saved = await data(client.from("assurance_saved_views").select().eq("tenant_id", tenantId));
  assert.equal(saved.length, 1);
  assert.ok(saved[0].definition.destination.href.startsWith("/programs?"));
  await eventually(
    async () =>
      (await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId }))).some(
        (x) => x.target.kind === "saved-view" && x.visitedAt,
      ),
    "Applied saved view enters private recents",
  );
  dialog = await launcher("Manage favorites");
  await dialog.getByRole("button", { name: "Actions", exact: true }).click();
  await dialog
    .getByRole("option")
    .filter({ hasText: "Manage favorites and recent records" })
    .click();
  dialog = page.getByRole("dialog", { name: "Favorites and recent records", exact: true });
  await dialog.waitFor();
  assert.match(await dialog.textContent(), /Only you can see/);
  await dialog.getByRole("button", { name: "Clear history", exact: true }).click();
  await eventually(
    async () =>
      !(await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId }))).some(
        (x) => x.visitedAt,
      ),
    "Clear history removes recency",
  );
  assert.ok(
    (await data(client.rpc("read_assurance_navigation", { p_tenant_id: tenantId }))).some(
      (x) => x.favorite,
    ),
    "Clear history retains favorite",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).last().click();
  await page.goto(`${origin}/programs/${alpha.id}/workbook`);
  await page.getByRole("grid").first().waitFor();
  const launcherChord = (await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform)))
    ? "Meta+k"
    : "Control+k";
  await page.keyboard.press(launcherChord);
  await page.getByRole("dialog", { name: "Search and actions", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("dialog").count(),
    1,
    "One global shortcut owns the launcher over the workbook",
  );
  await page.keyboard.press("Escape");
  dialog = await launcher("Save analysis");
  await dialog.getByRole("button", { name: "Actions", exact: true }).click();
  const unavailable = dialog.getByRole("option").filter({ hasText: "Save analysis" });
  assert.equal(
    await unavailable.getAttribute("aria-disabled"),
    "true",
    "Unavailable workbook action stays explained",
  );
  await page.keyboard.press("Escape");
  dialog = await launcher("Find and replace");
  await dialog.getByRole("option").filter({ hasText: "Find and replace" }).click();
  await page.getByRole("dialog", { name: "Find and replace", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  dialog = await launcher("Navigation");
  await dialog.getByRole("button", { name: "Records", exact: true }).click();
  await dialog.getByRole("option").filter({ hasText: "Navigation Beta" }).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "Phone launcher stays contained",
  );
  await eventually(
    async () => (await dialog.locator("[cmdk-list]").getAttribute("aria-busy")) !== "true",
    "Remote search settles before visual inspection",
  );
  await page.screenshot({
    path: "/private/tmp/navigation-launcher-phone.png",
    animations: "disabled",
  });
  await dialog.getByRole("option").filter({ hasText: "Navigation Beta" }).click();
  await page.getByRole("heading", { name: "Navigation Beta", exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  dialog = await launcher();
  await dialog.getByRole("button", { name: "All", exact: true }).click();
  await page.screenshot({
    path: "/private/tmp/navigation-launcher-desktop.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  console.log(
    "PASS navigation browser: favorite persistence, private recent list, saved-view exact application, categories/actions, clear history, desktop/phone launcher",
  );
} catch (error) {
  if (page) console.error(await page.locator("body").textContent());
  if (page)
    await page.screenshot({ path: "/private/tmp/navigation-browser-failure.png", fullPage: true });
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
