#!/usr/bin/env node
/**
 * The page budgets, B1 to B16 of the UX proposal's pass one, measured on every route of the screen
 * inventory at 1440 by 900 (the fold) over the screen-family fixtures, as each route opens and under
 * each of its declared tabs. A route's ceilings are its `budgets` (as it opens) and `tabBudgets`
 * (each other declared tab) in docs/guides/screen-inventory.json; they may only fall, as the allow
 * lists do: check-allow-lists fails a ceiling that rose against the base ref, and this sweep fails a
 * page that measures over its ceiling, naming the route, the tab, the budget, the value and the
 * ceiling. A page under its ceiling passes and says the ceiling can fall.
 *
 *   node scripts/test-page-budgets.mjs            # measure and compare (APP_TEST_URL, else :8080)
 *   node scripts/test-page-budgets.mjs --update   # lower the ceilings to what was measured; record
 *                                                 # a route, tab or budget with none; never raise
 *   node scripts/test-page-budgets.mjs --gaps     # also print, per budget, the routes over pass
 *                                                 # one's target and the worst five
 *   --only <route path>, repeatable; --json <file> writes every measurement; --shots <dir> saves
 *   each view as measured.
 *
 * No budget is about a phone, so nothing is measured at 390. What a page cannot say about itself is
 * left to the lint or to review, and named in NOT_MEASURED.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import prettier from "prettier";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { routePath, seedScreenFixtures, signIn } from "./tests/screen-fixtures.mjs";

const expect = playwrightExpect.configure({ timeout: 30000 });
const INVENTORY = new URL("../docs/guides/screen-inventory.json", import.meta.url);
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const values = (name) => argv.flatMap((arg, i) => (arg === name ? [argv[i + 1]] : []));
const update = flag("--update");
const gaps = flag("--gaps");
const only = values("--only");
const jsonOut = values("--json")[0];
const shots = values("--shots")[0];
if (shots) await mkdir(shots, { recursive: true });
/** A file name for a view's capture: the route's file and the tab. */
const shotName = (screen, tab) =>
  `${shots}/${screen.file.replace(/\.tsx$/, "")}${tab ? `--${tab.replace(/[^a-z0-9]+/gi, "-")}` : ""}.png`;
const WIDTH = 1440;
const FOLD = 900;

/** Pass one's word budget above the fold, by page type (B1). */
const WORDS = {
  Home: 90,
  Overview: 80,
  Record: 120,
  Register: 40,
  Workspace: 60,
  Flow: 80,
  Library: 60,
};

/**
 * Each budget the sweep measures: its key in the inventory, the proposal's number, what it counts,
 * and pass one's target for a page of a type (a value over it is a gap). `route` budgets are
 * measured once a route, as it opens, never per tab.
 */
const BUDGETS = [
  ["words", "B1", "words above the fold in Main, outside table rows", (type) => WORDS[type]],
  ["primaries", "B2", "filled primaries in one surface (header, toolbar, footer, empty state)", 1],
  ["zeros", "B3", "Stat tiles, Stat rows, tray and key values that read 0", 0],
  ["constantColumns", "B4", "table columns whose values are all identical or empty", 0],
  ["repeatedPairs", "B5", "label and value pairs drawn more than once", 0],
  ["emptyFacts", "B6", "fact rows whose value is Absent", 0],
  ["railRows", "B6", "fact rows in the Details rail", 8],
  ["sections", "B7", "Sections above the fold", 3],
  ["adjacentEmptySections", "B7", "empty Sections right after another empty Section", 0],
  ["longDescriptions", "B8", "descriptions over 80 characters", 0],
  ["longStrings", "B9", "UI strings over 12 words (errors and authored prose aside)", 0],
  ["longEmptyLines", "B9", "empty-state lines over 10 words", 0],
  ["buttons", "B10", "visible buttons in Main outside table rows", 12],
  ["tabs", "B11", "tabs in one tab strip", 7, "route"],
  ["tabExceptions", "B11", "tab exceptions declared in the inventory", 0, "route"],
  ["cellMarks", "B12", "marks in one table cell (badges, icons, bars), row controls aside", 2],
  [
    "charts",
    "B13",
    "charts, maps and ladders outside a workspace",
    (type) => (type === "Workspace" ? Infinity : 1),
  ],
  ["constantStatuses", "B14", "status columns that say one status on every row", 0],
  ["cutNames", "B15", "row names cut while the row's other cells have the width they need", 0],
  ["foldedTables", "B15", "tables that fold fields into +N at 1440", 0],
  ["statusHues", "B16", "saturated status hues above the fold", 2],
].map(([key, id, says, target, scope]) => ({
  key,
  id,
  says,
  target: typeof target === "function" ? target : () => target,
  scope: scope ?? "view",
}));

/** What the sweep does not measure, and why. */
const NOT_MEASURED = [
  ["B2", "a page with no filled primary at all: a ceiling cannot hold a floor; --gaps lists them"],
  [
    "B5",
    "one fact said in two shapes (a header badge and a rail row): only identical label and value pairs are compared",
  ],
  [
    "B8",
    "whether a description is authored or computed copy: the DOM holds only the result (lint: description-budget)",
  ],
  ["B9", "strings in dialogs, menus and toasts that are closed as a page opens"],
  [
    "B13",
    "a trend's 7 points: a line's points are not in the DOM as data; MIN_TREND_DAYS holds it in code",
  ],
  ["B14", "a status pill outside a table: only a table column that says one status throughout"],
];

const inventory = JSON.parse(await readFile(INVENTORY, "utf8"));
const measured = inventory.filter(
  (screen) =>
    !["redirect", "exception"].includes(screen.family) &&
    (!only.length || only.includes(screen.path)),
);

/**
 * Everything one page is measured on, in the page, at the top of its scroll. Main is the work area:
 * the top nav and the side nav are the shell's, not the page's.
 */
function measure({ fold }) {
  const main = document.querySelector("main");
  // A page the dev server is reloading has no Main yet: measured again once it has.
  if (!main || !main.querySelector("h1")) return null;
  const visible = (element) =>
    element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
    [...element.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1);
  // A table's rows are its data; an empty state drawn in a table's body is the page's.
  const inRows = (element) =>
    Boolean(element.closest("tbody tr")) && !element.closest('[data-slot="empty"]');
  const top = (element) => element.getBoundingClientRect().top;
  const aboveFold = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < fold && rect.bottom > 0;
  };
  const text = (element) =>
    (element?.innerText ?? element?.textContent ?? "").replace(/\s+/g, " ").trim();
  const wordCount = (value) =>
    value.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  const all = (selector, root = main) => [...root.querySelectorAll(selector)].filter(visible);
  /** The words an element draws: its text nodes with a box, a visually hidden label left out. */
  const drawnText = (element) => {
    const parts = [];
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      if ([...range.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1))
        parts.push(node.textContent);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };
  /** Each element once, the outermost: a mark inside a counted mark is part of it. */
  const outermost = (elements) => {
    const set = new Set(elements);
    return elements.filter((element) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement)
        if (set.has(parent)) return false;
      return true;
    });
  };

  // B1: words above the fold, a moment (<time>) one word, whatever its words say.
  let words = 0;
  const times = new Set();
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || inRows(parent) || parent.closest("script, style, template")) continue;
    const time = parent.closest("time");
    if (time) {
      if (!times.has(time) && visible(time) && aboveFold(time)) words += 1;
      times.add(time);
      continue;
    }
    if (!/[\p{L}\p{N}]/u.test(node.textContent)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 1);
    if (!rects.length || !parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
      continue;
    // A visually hidden label is 1px square: it is heard, not read.
    if (rects.every((rect) => rect.top >= fold || rect.bottom <= 0)) continue;
    words += wordCount(node.textContent);
  }

  // B2: filled primaries, by the surface they sit in.
  const SURFACES = [
    '[data-slot="page-header"]',
    '[data-slot="data-table-toolbar"]',
    '[data-slot="data-table-selection-bar"]',
    '[data-slot="toolbar"]',
    '[data-slot="foot-bar"]',
    '[data-slot="empty"]',
    '[data-slot="section-header"]',
    '[data-slot="related-header"]',
    '[data-slot="card"]',
    '[data-slot="tray"]',
  ].join(", ");
  const filled = all('[data-button-variant="primary"], [data-button-variant="sign"]').filter(
    (element) => !inRows(element),
  );
  const bySurface = new Map();
  for (const button of filled) {
    const surface = button.closest(SURFACES) ?? main;
    bySurface.set(surface, (bySurface.get(surface) ?? 0) + 1);
  }
  const primaries = Math.max(0, ...bySurface.values());
  const label = (button) =>
    text(button.querySelector('[data-slot="button-loading-label"]') ?? button) ||
    button.getAttribute("aria-label") ||
    "";
  const first = (selector) => filled.find((button) => button.closest(selector));
  const primary =
    first('[data-slot="page-header"]') ??
    first('[data-slot="data-table-toolbar"], [data-slot="toolbar"]') ??
    first('[data-slot="foot-bar"]') ??
    filled[0];

  // B3: a zero drawn as a figure: a Stat tile, a Stat row, a tray's value or a key's count.
  const figures = [
    ...all('[data-slot="stat-tile"] .font-figure, [data-slot="stat"] .font-figure'),
    ...all(
      '[data-slot="stat-row-value"], [data-slot="tray-value"], [data-slot="tile-map-key-value"], [data-slot="ladder-figure-value"]',
    ),
  ];
  const zeros = figures.filter((element) => /^0(\.0+)?\s?%?$/.test(text(element))).length;

  // Tables: their data rows (an empty state's row spans the table), by column.
  const tables = all("table").map((table) => {
    const header = table.tHead?.rows[table.tHead.rows.length - 1];
    // A column a reader sees is headed by words drawn, not by a label heard alone.
    const headings = header ? [...header.cells].map((cell) => drawnText(cell)) : [];
    const rows = [...(table.tBodies[0]?.rows ?? [])].filter(
      (row) => visible(row) && row.cells.length > 1 && row.cells.length === headings.length,
    );
    return { table, headings, rows };
  });
  let constantColumns = 0;
  let constantStatuses = 0;
  for (const { headings, rows } of tables) {
    if (rows.length < 2) continue;
    headings.forEach((heading, index) => {
      if (!heading) return;
      const cells = rows.map((row) => row.cells[index]);
      const said = cells.map((cell) => text(cell));
      if (said.every((value) => value === said[0])) {
        constantColumns += 1;
        if (cells.every((cell) => cell.querySelector('[data-slot="badge"]'))) constantStatuses += 1;
      }
    });
  }

  // B5 and B6: facts, as a label and its value.
  const pairs = [];
  for (const row of all('[data-slot="key-value"]')) {
    const term = row.querySelector("dt");
    const value = row.querySelector("dd");
    if (term && value) pairs.push({ row, label: text(term), value: text(value), dd: value });
  }
  for (const tile of all('[data-slot="stat-tile"]')) {
    const figure = tile.querySelector(".font-figure");
    const content = tile.querySelector('[data-slot="stat-link"]') ?? tile;
    const name = content.querySelector(":scope > div:first-child");
    if (figure) pairs.push({ label: text(name === figure ? null : name), value: text(figure) });
  }
  for (const row of all('[data-slot="stat-row"]'))
    pairs.push({
      label: text(row.querySelector('[data-slot="stat-row-label"]')),
      value: text(row.querySelector('[data-slot="stat-row-value"]')),
    });
  const seen = new Map();
  for (const { label, value } of pairs) {
    const key = `${label}\u0000${value}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const repeatedPairs = [...seen.values()].reduce((sum, count) => sum + count - 1, 0);
  const emptyFacts = pairs.filter(({ dd }) => {
    const absent = dd?.querySelector('[data-slot="absent"]');
    return absent && text(dd) === text(absent);
  }).length;
  const rail = [...main.querySelectorAll('[data-slot="shell-aside"]')].filter(visible);
  const railRows = rail.reduce(
    (sum, aside) => sum + all('[data-slot="key-value"]', aside).length,
    0,
  );

  // B7: Sections above the fold, and an empty one right after another.
  const sectionList = all('[data-slot="section"]');
  const sections = sectionList.filter(aboveFold).length;
  const isEmpty = (section) =>
    section?.matches?.('[data-slot="section"]') &&
    section.querySelector('[data-slot="empty"]') &&
    !section.querySelector("tbody tr[data-row-id]");
  const adjacentEmptySections = sectionList.filter(
    (section) => isEmpty(section) && isEmpty(section.previousElementSibling),
  ).length;

  // B8: descriptions over 80 characters.
  const longDescriptions = all(
    '[data-slot="page-header-description"], [data-slot="section-description"], [data-slot="card-description"], [data-slot="chart-frame-caption"] > :not(:first-child)',
  ).filter((element) => text(element).length > 80).length;

  // B9: UI strings over 12 words, each string once (the innermost element that holds it), outside
  // table rows, authored prose and error alerts; empty-state lines over 10.
  const STRINGS =
    'h1, h2, h3, h4, h5, h6, p, button, a, label, legend, dt, dd, th, li, [data-slot$="-title"], [data-slot$="-description"], [data-slot$="-label"]';
  const strings = all(STRINGS).filter(
    (element) =>
      !inRows(element) &&
      !element.closest('[data-slot="prose"], [role="alert"], [data-slot="empty"]') &&
      ![...element.querySelectorAll(STRINGS)].some(visible),
  );
  const longStrings = strings.filter((element) => wordCount(text(element)) > 12).length;
  const longEmptyLines = all('[data-slot="empty-title"], [data-slot="empty-description"]').filter(
    (element) => wordCount(text(element)) > 10,
  ).length;

  // B10: buttons a reader sees in Main, outside table rows; a tab, a checkbox, a switch and a radio
  // are other controls.
  const buttons = new Set(
    all(
      'button, [role="button"], a[data-slot="link-button"], a[data-slot="link-icon-button"]',
    ).filter(
      (element) =>
        !inRows(element) &&
        !["tab", "checkbox", "switch", "radio", "menuitem", "option"].includes(
          element.getAttribute("role"),
        ),
    ),
  ).size;

  // B11: the longest tab strip.
  const tabs = Math.max(
    0,
    ...all('[role="tablist"]').map((list) => list.querySelectorAll('[role="tab"]').length),
  );

  // B12: marks in one table cell, row controls (the eye, a row's menu, its checkbox, its +N) aside.
  const MARKS =
    '[data-slot="badge"], [data-slot="dot"], [data-slot="indicator"], [data-slot="tally"], [data-slot="progress"], [data-slot="meter"], [data-slot="chart-sparkline"], [data-slot="avatar"], [data-slot="count"], svg';
  let cellMarks = 0;
  for (const { rows } of tables)
    for (const row of rows)
      for (const cell of row.cells) {
        const marks = outermost(
          [...cell.querySelectorAll(MARKS)].filter(
            (mark) =>
              visible(mark) &&
              !mark.closest(
                'button, [role="checkbox"], [data-slot="preview-eye"], [data-slot="data-table-more-fields"]',
              ),
          ),
        );
        cellMarks = Math.max(cellMarks, marks.length);
      }

  // B13: charts, maps and ladders, outside table cells.
  const charts = outermost(
    all('[data-slot="chart-frame"], [data-slot="tile-map"], [data-slot="ladder"]').filter(
      (element) => !inRows(element),
    ),
  ).length;

  // B15: a row's name cut while the other cells of its row leave more room than it lacks, and a
  // table that folds fields into +N at this width.
  const contentWidth = (cell) => {
    let left = Infinity;
    let right = -Infinity;
    const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      let rects;
      if (node.nodeType === Node.TEXT_NODE) {
        if (!/\S/.test(node.textContent)) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        rects = [...range.getClientRects()];
      } else if (node.matches("svg, img, input, [data-slot='badge']"))
        rects = [...node.getClientRects()];
      else continue;
      for (const rect of rects) {
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
      }
    }
    return right > left ? right - left : 0;
  };
  const room = (cell) => {
    const style = getComputedStyle(cell);
    return cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  };
  let cutNames = 0;
  for (const { rows } of tables)
    for (const row of rows) {
      const name =
        row.querySelector('th[scope="row"]') ??
        row.querySelector('[data-slot="table-name"]')?.closest("td, th");
      if (!name) continue;
      const lack = Math.max(
        0,
        ...[name, ...name.querySelectorAll("*")]
          .filter((element) => getComputedStyle(element).textOverflow === "ellipsis")
          .map((element) => element.scrollWidth - element.clientWidth),
      );
      if (lack <= 1) continue;
      const spare = [...row.cells]
        .filter((cell) => cell !== name && text(cell))
        .reduce((sum, cell) => sum + Math.max(0, room(cell) - contentWidth(cell)), 0);
      if (spare >= lack) cutNames += 1;
    }
  const foldedTables = tables.filter(({ table }) =>
    [...table.querySelectorAll('[data-slot="data-table-more-fields"]')].some(visible),
  ).length;

  // B16: status hues above the fold, by a part's tone or a tone's colour class.
  const HUES = {
    danger: "red",
    warning: "amber",
    success: "green",
    information: "blue",
    changed: "teal",
  };
  const hues = new Set();
  for (const element of main.querySelectorAll("[data-tone], [class]")) {
    // A required field's mark is the form's, not a status.
    if (element.closest('[data-slot="field-required"]')) continue;
    const tone = element.getAttribute("data-tone");
    const classes = typeof element.className === "string" ? element.className : "";
    const found = [
      ...(tone && HUES[tone] ? [HUES[tone]] : []),
      ...[
        ...classes.matchAll(
          /(?:^|\s)(?:text|bg|icon|fill)-(?:chart-)?(danger|warning|success|information|changed)(?:-bold)?(?=\s|$)/g,
        ),
      ].map((match) => HUES[match[1]]),
    ];
    if (!found.length || !visible(element) || !aboveFold(element)) continue;
    for (const hue of found) hues.add(hue);
  }

  return {
    values: {
      words,
      primaries,
      zeros,
      constantColumns,
      repeatedPairs,
      emptyFacts,
      railRows,
      sections,
      adjacentEmptySections,
      longDescriptions,
      longStrings,
      longEmptyLines,
      buttons,
      tabs,
      cellMarks,
      charts,
      constantStatuses,
      cutNames,
      foldedTables,
      statusHues: hues.size,
    },
    primary: primary ? label(primary) : null,
    hues: [...hues].sort(),
    top: top(main),
  };
}

/**
 * Waits until the page has had no read in flight for 750ms, and nothing in Main is busy. A read
 * still open after 15 seconds (one whose end the browser never reported) no longer holds the wait.
 */
async function settle(page, inflight) {
  const deadline = Date.now() + 30000;
  let quietSince = Date.now();
  while (Date.now() < deadline) {
    const open = [...inflight.values()].some((started) => Date.now() - started < 15000);
    const busy = await page
      .locator('main [aria-busy="true"], main [data-slot="skeleton"]')
      .filter({ visible: true })
      .count();
    if (open || busy) quietSince = Date.now();
    else if (Date.now() - quietSince >= 750) break;
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => document.fonts.ready);
}

/** Measures the page once it reads the same twice in a row. */
async function stableMeasure(page, inflight) {
  let last;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await settle(page, inflight);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      for (const element of document.querySelectorAll("main, main *"))
        if (element.scrollTop) element.scrollTop = 0;
    });
    const next = await page.evaluate(measure, { fold: FOLD });
    if (!next) continue;
    if (last && JSON.stringify(last.values) === JSON.stringify(next.values)) return next;
    last = next;
    await page.waitForTimeout(400);
  }
  assert.ok(last, `${page.url()}: the page drew no Main to measure`);
  return last;
}

/** A declared tab, by its name before any count. */
function tabNamed(tabs, tabName) {
  return tabs.getByRole("tab").filter({
    hasText: new RegExp(`^${tabName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|\\d|$)`),
  });
}

const results = [];
const workspace = await localWorkspace("page-budgets");
let browser;
try {
  const { fixtures, implementation } = await seedScreenFixtures(workspace);
  // The program's control record opens on its recorded implementation, so its budget is the
  // record's and not the not-found page's.
  fixtures.implemented_requirements = [implementation];
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: FOLD },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const inflight = new Map();
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/rest/v1/")) inflight.set(request, Date.now());
  });
  for (const event of ["requestfinished", "requestfailed"])
    page.on(event, (request) => inflight.delete(request));
  await signIn(page, origin, workspace, expect);
  for (const screen of measured) {
    const path = routePath(fixtures, screen);
    await page.goto(`${origin}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const opened = await stableMeasure(page, inflight);
    if (shots) await page.screenshot({ path: shotName(screen) });
    const fixture = fixtures[screen.model]?.[0];
    const result = {
      screen,
      // A record the fixtures do not seed is measured on its not-found page.
      notFound: Boolean(screen.missingRecord) && !fixture,
      route: { ...opened.values, tabExceptions: Object.keys(screen.tabExceptions ?? {}).length },
      primary: opened.primary,
      hues: opened.hues,
      tabs: {},
    };
    if (screen.tabList && fixture) {
      const strip = page.getByRole("tablist", { name: screen.tabList, exact: true });
      await expect(strip).toBeVisible();
      const selected = (await strip.getByRole("tab", { selected: true }).first().textContent())
        ?.replace(/\s*[\d,]+\+?\s*$/, "")
        .trim();
      for (const tabName of [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)]) {
        if (tabName === selected) continue;
        await tabNamed(strip, tabName).click();
        await expect(tabNamed(strip, tabName)).toHaveAttribute("aria-selected", "true");
        const view = await stableMeasure(page, inflight);
        if (shots) await page.screenshot({ path: shotName(screen, tabName) });
        const { tabs: _strip, ...perTab } = view.values;
        result.tabs[tabName] = perTab;
      }
    }
    results.push(result);
    console.log(
      `MEASURED ${screen.path}${Object.keys(result.tabs).length ? ` and ${Object.keys(result.tabs).length} tabs` : ""}`,
    );
  }
  assert.deepEqual(errors, [], "Every measured route renders without a browser exception");
} finally {
  await browser?.close();
  await workspace.cleanup();
}

// Compare with the ceilings; with --update, lower them and record what had none.
const failures = [];
const lower = [];
const recorded = [];
const order = BUDGETS.map((budget) => budget.key);
const sorted = (object) =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)),
  );
function compare(where, ceilings, values, scope) {
  const next = { ...(ceilings ?? {}) };
  for (const budget of BUDGETS) {
    if (scope === "tab" && budget.scope === "route") continue;
    const value = values[budget.key];
    const ceiling = ceilings?.[budget.key];
    if (ceiling === undefined) {
      if (update) {
        next[budget.key] = value;
        recorded.push(`${where} ${budget.key} (${budget.id}) recorded at ${value}`);
      } else
        failures.push(
          `${where} ${budget.key} (${budget.id}) has no ceiling; it measures ${value} (--update records it)`,
        );
    } else if (value > ceiling)
      failures.push(
        `${where} ${budget.key} (${budget.id}, ${budget.says}) is ${value}, over its ceiling ${ceiling}`,
      );
    else if (value < ceiling) {
      lower.push(
        `${where} ${budget.key} (${budget.id}) is ${value}, under its ceiling ${ceiling}: the ceiling can fall`,
      );
      if (update) next[budget.key] = value;
    }
  }
  return sorted(next);
}
for (const result of results) {
  const { screen } = result;
  screen.budgets = compare(screen.path, screen.budgets, result.route, "route");
  const tabNames = Object.keys(result.tabs);
  if (tabNames.length) {
    const tabBudgets = { ...(screen.tabBudgets ?? {}) };
    for (const tabName of tabNames)
      tabBudgets[tabName] = compare(
        `${screen.path} tab ${tabName}`,
        tabBudgets[tabName],
        result.tabs[tabName],
        "tab",
      );
    screen.tabBudgets = tabBudgets;
  }
  if (
    !result.notFound &&
    screen.primary !== undefined &&
    screen.primary !== (result.primary ?? "none")
  )
    console.log(
      `NOTE ${screen.path} declares its primary as "${screen.primary}"; as it opens it shows "${result.primary ?? "none"}"`,
    );
}
for (const line of lower) console.log(`LOWER ${line}`);
for (const line of recorded) console.log(`RECORDED ${line}`);
if (update && (lower.length || recorded.length) && !only.length) {
  const config = await prettier.resolveConfig(INVENTORY.pathname);
  await writeFile(
    INVENTORY,
    await prettier.format(JSON.stringify(inventory, null, 2), { ...config, parser: "json" }),
  );
  console.log(`Wrote ${lower.length} lower and ${recorded.length} new ceilings to the inventory.`);
} else if (update && only.length)
  console.log("--only measures part of the inventory: nothing written.");

if (jsonOut)
  await writeFile(
    jsonOut,
    `${JSON.stringify(
      results.map(({ screen, route, tabs, primary, hues, notFound }) => ({
        path: screen.path,
        archetype: screen.archetype,
        notFound,
        primary,
        hues,
        route,
        tabs,
      })),
      null,
      2,
    )}\n`,
  );

if (gaps) {
  console.log(
    "\nGaps against pass one's targets, by budget (route as it opens, or its worst tab):",
  );
  for (const budget of BUDGETS) {
    const over = [];
    for (const { screen, route, tabs } of results) {
      const target = budget.target(screen.archetype);
      const views = [["", route], ...Object.entries(tabs)].filter(
        ([, values]) => values[budget.key] !== undefined,
      );
      const worst = views.reduce((a, b) => (b[1][budget.key] > a[1][budget.key] ? b : a));
      if (worst[1][budget.key] > target)
        over.push({
          where: `${screen.path}${worst[0] ? ` › ${worst[0]}` : ""}`,
          value: worst[1][budget.key],
          target,
        });
    }
    over.sort((a, b) => b.value - a.value);
    console.log(
      `${budget.id} ${budget.key} (${budget.says}): ${over.length} of ${results.length} routes over target${
        over.length
          ? `; worst: ${over
              .slice(0, 5)
              .map(
                ({ where, value, target }) =>
                  `${where} ${value}${Number.isFinite(target) ? `/${target}` : ""}`,
              )
              .join(", ")}`
          : ""
      }`,
    );
  }
  const none = results.filter(({ primary }) => !primary).map(({ screen }) => screen.path);
  console.log(`B2 no filled primary as the route opens: ${none.length} routes: ${none.join(", ")}`);
  console.log("\nNot measured:");
  for (const [id, why] of NOT_MEASURED) console.log(`${id}: ${why}`);
}

if (failures.length) {
  console.error(`\nPages over their budget ceilings:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `PASS ${results.length} routes within their budget ceilings${lower.length ? `; ${lower.length} ceilings can fall (--update)` : ""}`,
);
