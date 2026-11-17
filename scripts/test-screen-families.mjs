#!/usr/bin/env node
/**
 * The declared route inventory drives identity, collection and touch-preview checks, the check
 * that no route outside the schema inspector reads the record schema as it opens, the check
 * that no such route draws a link into the schema inspector, and the side nav's scope and current
 * entry on each route. A route whose tabs draw no strip, since the side nav reaches them (a
 * program's parts), declares `tabAddress`: each is opened at its address and named by its h1.
 */

// From the product pattern contract's What checks it, moved beside the check on 2026-11-16.
//
// `test-screen-families.mjs` reads this inventory to check every product route at desktop and touch
// widths, including every global register’s search, name link, visible eye and panel navigation,
// with real named fixtures where that family can be independently seeded and missing-record checks
// for dependent records. It also counts the `rpc/app_schema` reads each route makes as it opens and
// as each of its declared tabs opens, and fails a route other than /schema and /records/* that
// makes one, naming the route, the tab and the request. The same sweep fails such a route that
// draws a link into /records/* or /schema in Main, naming the route, the tab and the link: a name
// never leads into the schema inspector. It also fails one whose button, link or checkbox carries a
// record id in its name, so a link row is named by the record it links. A register or a tab whose
// first-listed records have no page of their own (the Suppliers, the catalog's CCIs, Observations,
// a Library tab's baselines) is declared `previewOnly` in the inventory, and its name is checked to
// open its preview, which offers no fuller record. Domain workflow suites supply the deeper
// linked-record fixtures.
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import {
  name,
  routePath as fixturePath,
  seedScreenFixtures,
  signIn,
} from "./tests/screen-fixtures.mjs";

const expect = playwrightExpect.configure({ timeout: 30000 });
const inventory = JSON.parse(
  await readFile(new URL("../docs/guides/screen-inventory.json", import.meta.url), "utf8"),
);
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const artifacts = process.env.PATTERN_ARTIFACT_DIR || "/tmp/pattern-screen-families";
await mkdir(artifacts, { recursive: true });
const workspace = await localWorkspace("screen-families");
let fixtures = {};
let browser;
let page;
const errors = [];
/**
 * A register, a record page, a tab and a Details rail never read the record schema: only the schema
 * inspector does (/schema and /records/*), and a create or edit Dialog, a preview or a picker as it
 * opens. The schema loads once a session, so the reads are counted as a route opens and as each of
 * its declared tabs opens, before any preview, and every read names the route, the tab and the
 * request.
 */
const readsSchema = (path) => path === "/schema" || path.startsWith("/records/");
const schemaReads = [];
/** The route, or the route's tab, being opened; null while a surface that may read the schema is. */
let opening = null;
/**
 * A name never leads into the schema inspector. A record's page is where its name goes; a record
 * with no page of its own is named by a button that opens its preview; and the inspector is
 * reached from a record's Actions menu or from Settings. So a route other than /schema and
 * /records/* draws no link to /records/* or /schema in Main, as it opens or under any of its
 * declared tabs. Every one found names the route, the tab and where it leads.
 */
const schemaLinks = [];
async function sweepSchemaLinks(width, where) {
  const found = await page
    .getByRole("main")
    .locator('a[href^="/records/"], a[href="/schema"]')
    .evaluateAll((links) =>
      links
        .filter((link) => link.getClientRects().length > 0)
        .map((link) => `${link.getAttribute("href")} "${link.textContent?.trim().slice(0, 40)}"`),
    );
  for (const link of found) schemaLinks.push(`${width}px ${where}: ${link}`);
}
/**
 * A control is named by what a reader knows: a record's name, never its id. So on the same routes
 * no button, link or checkbox in Main carries a record id in its name, as the route opens or
 * under any of its declared tabs: a link row is named by the record it links (Preview Signature
 * test report), and a record with no name is "Unnamed risk".
 */
const idNames = [];
async function sweepIdNames(width, where) {
  const found = await page
    .getByRole("main")
    .locator("button, a, [role=checkbox]")
    .evaluateAll((controls) => {
      // An id standing as a word of the name ("Preview 558d8944-…"), not one inside an address.
      const id = /(^|\s)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\s|$)/i;
      const name = (control) =>
        control.getAttribute("aria-label") ||
        (control.getAttribute("aria-labelledby") ?? "")
          .split(" ")
          .map((part) => document.getElementById(part)?.textContent ?? "")
          .join(" ")
          .trim() ||
        (control.textContent ?? "").trim();
      return controls
        .filter((control) => control.getClientRects().length > 0)
        .map(name)
        .filter((text) => id.test(text))
        .map((text) => text.slice(0, 80));
    });
  for (const name of found) idNames.push(`${width}px ${where}: "${name}"`);
}
function routePath(screen, path = screen.path) {
  return fixturePath(fixtures, screen, path);
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
  // The collection's records have no page of their own: a name opens the preview, and the
  // preview has no fuller record to open.
  const previewOnly =
    screen.previewOnly === true ||
    (Array.isArray(screen.previewOnly) && screen.previewOnly.includes(tabName));
  const table = page.getByRole("table").or(page.getByRole("treegrid")).first();
  // Retained tab panels stay mounted but hidden, so only the visible region's empty counts.
  const empty = page
    .getByRole("main")
    .locator('[data-slot="empty"]')
    .filter({ visible: true })
    .first();
  // The kit replaces a genuinely empty register with its illustrated first-record state.
  await expect(table.or(empty).first()).toBeVisible();
  // A loading table shows placeholder rows under aria-busy; read the collection once it settles.
  await expect(
    page.getByRole("table").or(page.getByRole("treegrid")).and(page.locator('[aria-busy="true"]')),
  ).toHaveCount(0);
  await expect(page.locator('[data-slot="page-header-description"]')).toHaveCount(0);
  // The work area repeats no collection heading. An empty state's title heads its own region,
  // the Details beside a collection are a region of their own whose Inspector groups are h2s by
  // design, and provenance may sit in a collapsed Details section (its heading is the closed
  // disclosure). A chart under the collection (the Guidance page's by-family matrix) is titled for
  // what it counts, never the collection.
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { level: 2 })
      .and(page.locator(':not([data-slot="empty-title"])'))
      .and(page.locator(':not([data-slot="shell-aside"] *)'))
      .and(page.locator(':not([data-slot="chart-frame"] *)'))
      .and(page.locator(':not(:has(> [aria-expanded="false"]))')),
  ).toHaveCount(0);
  if (!(await table.count())) {
    assert.ok(tabName, `${screen.path}: the seeded primary register must contain records`);
    await expect(empty.locator('[data-slot="empty-title"]')).not.toHaveText("");
    await expect(empty.locator('[data-slot="empty-description"]')).not.toHaveText("");
    // An illustration, or an icon for a compact collection beside other content. EmptyMedia
    // (data-slot="empty-icon") also wraps an illustration, so only its icon variant counts.
    await expect(
      empty.locator(
        '[data-slot="empty-illustration"], [data-slot="empty-icon"][data-variant="icon"]',
      ),
    ).toHaveCount(1);
    await bounds(width, `${screen.path} ${tabName} empty collection`);
    return;
  }
  await expect(page.getByRole("searchbox").first()).toBeVisible();
  const row = table.locator("tbody tr[data-row-id]").first();
  if (!(await row.count())) {
    await expect(table.locator('[data-slot="empty-title"]')).toHaveCount(1);
    await expect(table.locator('[data-slot="empty-description"]')).not.toHaveText("");
    await expect(
      table.locator(
        '[data-slot="empty-illustration"], [data-slot="empty-icon"][data-variant="icon"]',
      ),
    ).toHaveCount(1);
    await bounds(width, `${screen.path} ${tabName ?? ""} empty collection`);
    return;
  }
  // The row names its record: a link to its page, or, for a record with no page, a button that
  // opens its preview. Never a link into the schema inspector, outside the inspector's own
  // registers, whose names open schema records.
  const inspector = screen.family === "schema-register";
  if (inspector)
    await expect(row.getByRole("link").first()).toHaveAttribute("href", /^\/records\//);
  else await expect(row.locator('a[href^="/records/"], a[href="/schema"]')).toHaveCount(0);
  if (inspector) {
    // Checked above.
  } else if (previewOnly) {
    const nameButton = row.locator('[data-slot="button"]').first();
    await expect(nameButton).toBeVisible();
    await nameButton.click();
    await expect(page.getByRole("button", { name: /^Close (details|.+ preview)$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open full record/ })).toHaveCount(0);
    await page.getByRole("button", { name: /^Close (details|.+ preview)$/ }).click();
  } else await expect(row.getByRole("link").first()).toHaveAttribute("href", /^\/(?!records\/)/);
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
  await expect(page.getByRole("button", { name: /^Close (details|.+ preview)$/ })).toBeVisible();
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
  if (previewOnly) await expect(fullRecord).toHaveCount(0);
  else {
    await expect(fullRecord).toHaveAttribute("target", "_blank");
    await expect(fullRecord).toHaveAttribute(
      "href",
      inspector ? /^\/records\// : /^\/(?!records\/)/,
    );
  }
  await bounds(width, `${screen.path} with preview`);
  await page.screenshot({
    path: `${artifacts}/${screen.file.replaceAll(".tsx", "")}-${tabName?.replaceAll(/[^a-z0-9]/gi, "-") ?? "default"}-${width}-preview.png`,
  });
  await page.getByRole("button", { name: /^Close (details|.+ preview)$/ }).click();
  assert.deepEqual(
    (
      await table
        .locator("tbody tr[data-row-id]")
        .evaluateAll((elements) => elements.map((element) => element.dataset.rowId))
    ).slice(0, 2),
    before.slice(0, 2),
  );
}

async function verifyTabs(screen, width, path, fixture) {
  if (screen.tabAddress) {
    // A page whose tabs the side nav reaches draws no strip: each is opened at its address and
    // named by its h1, as a page of its own.
    for (const tabName of [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)]) {
      await openPart(screen, path, tabName, fixture);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      if (screen.collectionTabs.includes(tabName)) await verifyCollection(screen, width, tabName);
      else assert.ok(screen.tabExceptions[tabName], `${screen.path}: ${tabName} has a reason`);
      await bounds(width, `${screen.path} ${tabName}`);
      console.log(`PASS ${width}px part ${screen.path} ${tabName}`);
    }
    return;
  }
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
    const tab = tabNamed(tabs, tabName);
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    if (screen.collectionTabs.includes(tabName)) await verifyCollection(screen, width, tabName);
    else assert.ok(screen.tabExceptions[tabName], `${screen.path}: ${tabName} has a reason`);
    await bounds(width, `${screen.path} ${tabName}`);
    console.log(`PASS ${width}px tab ${screen.path} ${tabName}`);
  }
}

/**
 * A part of a page with no tab strip (a program's, which the side nav reaches), opened at its
 * address (`?tab=Requirements`). Its h1 names it: the part the route opens on names the record,
 * every other part itself.
 */
async function openPart(screen, path, tabName, fixture) {
  const url = new URL(`${origin}${path}`);
  url.searchParams.set(screen.tabAddress.search, tabName);
  await page.goto(url.href);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    tabName === screen.tabAddress.opens && fixture ? name(fixture) : tabName,
  );
}

/**
 * Waits until the page has had no read in flight for half a second. A read still open after five
 * seconds (one whose end the browser never reported) no longer holds the wait: what is counted is
 * each read as it starts.
 */
async function settled(inflight) {
  const deadline = Date.now() + 15000;
  let quietSince = Date.now();
  while (Date.now() < deadline) {
    const open = [...inflight.values()].some((started) => Date.now() - started < 5000);
    if (open) quietSince = Date.now();
    else if (Date.now() - quietSince >= 500) return;
    await page.waitForTimeout(100);
  }
}

/** A declared tab, by its name before any count. */
function tabNamed(tabs, tabName) {
  return tabs.getByRole("tab").filter({
    hasText: new RegExp(`^${tabName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|\\d|$)`),
  });
}

/**
 * Lets the route's reads finish, then opens each declared tab in turn and lets its reads finish,
 * before any preview, so a tab's schema read is counted against it. It ends on the tab the route
 * opened on, so the checks after it start where the route did.
 */
async function sweepSchemaReads(screen, withTabs, inflight, width, path, fixture) {
  await settled(inflight);
  await sweepSchemaLinks(width, screen.path);
  await sweepIdNames(width, screen.path);
  if (withTabs && screen.tabAddress) {
    for (const tabName of [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)]) {
      opening = `${screen.path} part ${tabName}`;
      await openPart(screen, path, tabName, fixture);
      await settled(inflight);
      await sweepSchemaLinks(width, opening);
      await sweepIdNames(width, opening);
    }
    opening = null;
    await page.goto(`${origin}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  } else if (withTabs && screen.tabList) {
    const tabs = page.getByRole("tablist", { name: screen.tabList, exact: true });
    const opened = await tabs
      .getByRole("tab")
      .evaluateAll((elements) =>
        elements.findIndex((element) => element.getAttribute("aria-selected") === "true"),
      );
    for (const tabName of [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)]) {
      opening = `${screen.path} tab ${tabName}`;
      await tabNamed(tabs, tabName).click();
      await settled(inflight);
      await sweepSchemaLinks(width, opening);
      await sweepIdNames(width, opening);
    }
    opening = null;
    const openedTab = tabs.getByRole("tab").nth(Math.max(opened, 0));
    await openedTab.click();
    await expect(openedTab).toHaveAttribute("aria-selected", "true");
  }
  opening = null;
}

/**
 * The side nav marks the route's own entry in the scope it opens, as the inventory declares (`nav`):
 * the organization's, or a program's or product's work, whose switcher leads back to the
 * Portfolio. A product's page whose product cannot be found is in the organization, at Products.
 * A program's record at an address of its own (`program-record`) opens its program's work once the
 * record names it (every fixture is a record of the first program), and is in the organization,
 * at its register (`organization`), where its record cannot be found.
 */
async function verifyNavigation(screen, fixture) {
  const expected =
    screen.nav.scope === "product" && !fixture
      ? { scope: "organization", current: "Products" }
      : screen.nav.scope === "program-record"
        ? fixture
          ? { scope: "program", current: screen.nav.current }
          : { scope: "organization", current: screen.nav.organization }
        : screen.nav;
  const nav = page.getByRole("navigation", { name: "Side navigation", exact: true });
  const current = nav.locator('[aria-current="page"]');
  await expect(current).toHaveCount(expected.current === null ? 0 : 1);
  if (expected.current !== null) await expect(current).toHaveText(expected.current);
  const switcher = nav.locator('a[data-slot="shell-profile"]');
  if (expected.scope === "organization") await expect(switcher).toHaveCount(0);
  else await expect(switcher).toHaveAttribute("href", "/");
  if (expected.scope === "program") await expect(switcher).toContainText(fixtures.programs[0].code);
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
  const seeded = await seedScreenFixtures(workspace);
  fixtures = seeded.fixtures;
  const { implementation, implementedControl, unimplementedControl } = seeded;
  browser = await chromium.launch({ headless: true });
  // The views the side nav names, read from the nav where it is drawn (a phone keeps it closed).
  const navNamedViews = new Set();
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      isMobile: width === 390,
    });
    page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    // The REST reads in flight, each with when it started.
    const inflight = new Map();
    page.on("request", (request) => {
      const { pathname } = new URL(request.url());
      if (!pathname.startsWith("/rest/v1/")) return;
      inflight.set(request, Date.now());
      // Counted against the route being opened only when that page asked: the schema inspector,
      // left as the sweep moves on, can still make its own read after the next route is named.
      if (
        opening &&
        pathname === "/rest/v1/rpc/app_schema" &&
        !readsSchema(new URL(request.frame().url()).pathname)
      )
        schemaReads.push(`${width}px ${opening}: ${request.method()} ${request.url()}`);
    });
    for (const event of ["requestfinished", "requestfailed"])
      page.on(event, (request) => inflight.delete(request));
    await signIn(page, origin, workspace, expect);
    for (const screen of inventory) {
      if (screen.family === "exception") continue;
      const path = routePath(screen);
      opening = readsSchema(screen.path) ? null : screen.path;
      await page.goto(`${origin}${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const fixture = fixtures[screen.model]?.[0];
      const view = screen.family === "program-view";
      const named = ["record", "program-view", "schema-record"].includes(screen.family);
      // A loaded record leads its browser title with its name; a missing one keeps the type. A
      // program's focused view leads with the view, its h1, then names its program.
      if (screen.family !== "redirect")
        await expect(page).toHaveTitle(
          named && fixture
            ? view
              ? `${screen.title} — ${name(fixture)} — Program Assurance`
              : `${name(fixture)} — ${screen.title} — Program Assurance`
            : `${screen.title} — Program Assurance`,
        );
      if (named) {
        if (fixture)
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            view ? screen.title : name(fixture),
          );
        else await verifyMissingRecord(screen);
      }
      // The desktop side nav, on the address the route opened at, before any tab is chosen; on a
      // phone it is the closed overlay.
      if (width === 1440 && screen.nav) await verifyNavigation(screen, fixture);
      if (screen.family === "redirect") {
        assert.ok(screen.redirectTo, `${screen.path}: declare the canonical redirect destination`);
        // The same destination, however the query encodes a space (`%20` or `+`).
        const destination = new URL(`${origin}${routePath(screen, screen.redirectTo)}`);
        await expect(page).toHaveURL(
          (url) =>
            url.origin === destination.origin &&
            url.pathname === destination.pathname &&
            url.searchParams.toString() === destination.searchParams.toString(),
        );
        // A redirect to a program's part lands on the part, which its h1 names (`heading`).
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          screen.heading ?? name(fixture),
        );
      }
      if (opening) {
        const found = schemaReads.length;
        const linked = schemaLinks.length;
        const named = idNames.length;
        await sweepSchemaReads(screen, !!fixture, inflight, width, path, fixture);
        for (const read of schemaReads.slice(found)) console.log(`FAIL schema read ${read}`);
        for (const link of schemaLinks.slice(linked)) console.log(`FAIL schema link ${link}`);
        for (const control of idNames.slice(named)) console.log(`FAIL id name ${control}`);
      }
      if (["register", "schema-register"].includes(screen.family)) {
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          screen.heading ?? screen.title,
        );
        await verifyCollection(screen, width);
      }
      if (fixture) await verifyTabs(screen, width, path, fixture);
      await bounds(width, path);
      console.log(`PASS ${width}px ${screen.family} ${path}`);
    }
    // The Controls tab's name link opens the implemented control's record, not its schema row.
    const program = fixtures.programs[0];
    const controlPath = `/programs/${program.id}/controls/${implementation.id}`;
    await page.goto(`${origin}/programs/${program.id}?tab=Controls`);
    const assembly = page.getByRole("table", { name: "SSP control assembly", exact: true });
    await expect(assembly).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Find selected controls", exact: true })
      .fill(implementedControl.code);
    const controlLink = assembly.locator(`a[href="${controlPath}"]`);
    await expect(controlLink).toHaveCount(1);
    // The Control column names each control by its code and title together.
    await expect(controlLink).toHaveText(`${implementedControl.code} ${implementedControl.title}`);
    await controlLink.click();
    await expect(page).toHaveURL(`${origin}${controlPath}`);
    // The record is titled by the control's code and title together, in its h1 and its tab.
    const implementedName = `${implementedControl.code} ${implementedControl.title}`;
    await expect(page).toHaveTitle(`${implementedName} — Program control — Program Assurance`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(implementedName);
    await bounds(width, controlPath);
    console.log(`PASS ${width}px program Controls name link opens ${controlPath}`);
    // A control with no implementation names no schema row: its name opens its preview.
    await page.goto(`${origin}/programs/${program.id}?tab=Controls`);
    await page
      .getByRole("searchbox", { name: "Find selected controls", exact: true })
      .fill(unimplementedControl.code);
    await expect(assembly.locator('a[href^="/records/"]')).toHaveCount(0);
    await assembly
      .getByRole("button", {
        name: `${unimplementedControl.code} ${unimplementedControl.title}`,
        exact: true,
      })
      .click();
    await expect(
      page
        .locator("[data-record-preview-header]")
        .filter({ visible: true })
        .getByRole("heading", { level: 2 }),
    ).toHaveText(`${unimplementedControl.code} ${unimplementedControl.title}`);
    await expect(page).toHaveURL(new RegExp(`/programs/${program.id}\\?tab=Controls`));
    await page.getByRole("button", { name: "Close SSP control preview", exact: true }).click();
    console.log(
      `PASS ${width}px program Controls name without an implementation opens its preview`,
    );
    // Every focused view is a link in the row of views on one part of the program's record, never
    // only inside a menu, unless the side nav names it (Baseline, Authorization), which no row
    // repeats. A view that applies to some programs alone is listed where it applies: the swept
    // program has no variant and no requirements document, so Product delta and the Compliance
    // matrix are left out of its rows.
    const record = inventory.find((screen) => screen.path === "/programs/$programId");
    const listed = new Map();
    for (const tabName of [...record.collectionTabs, ...Object.keys(record.tabExceptions)]) {
      await openPart(record, `/programs/${program.id}`, tabName, program);
      await settled(inflight);
      const links = page
        .getByRole("navigation", { name: `${tabName} views`, exact: true })
        .getByRole("link");
      for (const link of await links.all())
        listed.set(await link.getAttribute("href"), {
          tab: tabName,
          name: (await link.textContent()).trim(),
        });
    }
    const conditional = new Set([
      "/programs/$programId/product-delta",
      "/programs/$programId/compliance",
    ]);
    const sideNav = page.getByRole("navigation", { name: "Side navigation", exact: true });
    for (const screen of inventory.filter((item) => item.family === "program-view")) {
      const href = routePath(screen);
      if (await sideNav.locator(`a[href="${href}"]`).count()) navNamedViews.add(href);
      if (navNamedViews.has(href)) {
        assert.ok(!listed.has(href), `${screen.path}, which the side nav names, is in no row`);
        continue;
      }
      if (conditional.has(screen.path)) {
        assert.ok(!listed.has(href), `${screen.path} is listed only where it applies`);
        continue;
      }
      assert.equal(listed.get(href)?.name, screen.title, `${screen.path} is in a row of views`);
    }
    // A view's page is named by its h1 and trailed up to the part that lists it, after the
    // program's code, with no level for itself.
    const posture = routePath(inventory.find((screen) => screen.title === "Posture"));
    const postureTab = listed.get(posture).tab;
    await page.goto(`${origin}/programs/${program.id}?tab=${encodeURIComponent(postureTab)}`);
    await page
      .getByRole("navigation", { name: `${postureTab} views`, exact: true })
      .getByRole("link", { name: "Posture", exact: true })
      .click();
    await expect(page).toHaveURL(`${origin}${posture}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Posture");
    const trail = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(trail.getByRole("link", { name: postureTab, exact: true })).toHaveAttribute(
      "href",
      `/programs/${program.id}?tab=${encodeURIComponent(postureTab).replace(/%20/g, "+")}`,
    );
    await expect(trail.getByRole("listitem")).toHaveText([program.code, postureTab]);
    await bounds(width, posture);
    console.log(
      `PASS ${width}px every program view is in a row of views on its part or in the side nav`,
    );
    await context.close();
  }
  assert.deepEqual(errors, [], "Every declared product route renders without a browser exception");
  assert.deepEqual(
    schemaReads,
    [],
    `A route other than /schema and /records/* reads the record schema as it opens:\n${schemaReads.join("\n")}`,
  );
  assert.deepEqual(
    schemaLinks,
    [],
    `A route other than /schema and /records/* links into the schema inspector:\n${schemaLinks.join("\n")}`,
  );
  assert.deepEqual(
    idNames,
    [],
    `A route other than /schema and /records/* names a control by a record id:\n${idNames.join("\n")}`,
  );
} catch (error) {
  await page?.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
  console.error("Browser errors:", errors);
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
