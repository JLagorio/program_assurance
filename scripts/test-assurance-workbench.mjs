/** Real workbook UI, workers and atomic record application in a disposable local workspace. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import { chromium } from "playwright";
import ExcelJS from "exceljs";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL ?? process.env.APP_BASE_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("assurance-workbench");
const { client, tenantId } = workspace;
let browser;
let page;
const errors = [];
const consoleErrors = [];
const originalStatement =
  "The system shall record each authorized action.\nEach record shall identify the authorized actor.";
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
async function eventually(check, message) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await wait(100);
  }
  assert.fail(message);
}
async function selectCell(address) {
  const location = page.getByRole("textbox", { name: "Go to cell", exact: true });
  await location.fill(address);
  await location.press("Enter");
  const editor = page.getByRole("textbox", {
    name: `Value or formula for ${address}`,
    exact: true,
  });
  await editor.waitFor();
  return editor;
}
async function editCell(address, value) {
  const editor = await selectCell(address);
  await editor.fill(value);
  await page.getByRole("button", { name: "Apply cell edit", exact: true }).click();
  await eventually(
    async () => (await editor.inputValue()) === value,
    `${address} source was not edited`,
  );
}
async function sheet(name) {
  await page
    .getByRole("group", { name: "Workbook sheets" })
    .getByRole("button", { name, exact: true })
    .click();
  await page.getByRole("grid", { name: `${name} spreadsheet`, exact: true }).waitFor();
}
async function action(name) {
  await page.getByRole("button", { name: "Workbook actions", exact: true }).click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}
async function view(name) {
  await page.getByRole("combobox", { name: "View", exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function applyChanges(count) {
  await page.getByRole("button", { name: `Review changes (${count})`, exact: true }).click();
  const review = page.getByRole("dialog", { name: "Review source changes", exact: true });
  await review.waitFor();
  await review.getByRole("button", { name: "Apply changes", exact: true }).click();
  await review.waitFor({ state: "hidden" });
  await page
    .getByText("Changes applied. The recorded values and audit history are up to date.", {
      exact: true,
    })
    .waitFor();
}
async function assertFits(width) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${width}px page should contain the grid's internal horizontal scroll`,
  );
}

async function verifySheetContextActions() {
  const tabs = page.getByRole("group", { name: "Workbook sheets", exact: true });
  const tab = (name) => tabs.getByRole("button", { name, exact: true });
  const sheetIds = () =>
    tabs
      .locator("button[data-sheet-id]")
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-sheet-id")));
  await sheet("Requirements");
  await tab("Requirements").dblclick();
  assert.equal(await page.getByRole("dialog", { name: "Rename sheet", exact: true }).count(), 0);
  await tab("Requirements").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Duplicate as analysis", exact: true }).waitFor();
  assert.equal(await page.getByRole("menuitem", { name: "Rename", exact: true }).count(), 0);
  assert.equal(await page.getByRole("menuitem", { name: "Delete", exact: true }).count(), 0);
  await page.keyboard.press("Escape");

  const before = await sheetIds();
  await tab("Analysis").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await page.getByRole("grid", { name: "Analysis copy spreadsheet", exact: true }).waitFor();
  assert.equal(await (await selectCell("B12")).inputValue(), "=SUM(A12,5)");
  const copiedId = (await sheetIds()).find((id) => !before.includes(id));
  assert.ok(copiedId, "Duplicating an inactive tab creates a distinct sheet");

  await tab("Analysis copy").dblclick();
  const rename = page.getByRole("dialog", { name: "Rename sheet", exact: true });
  await rename.getByRole("textbox", { name: "Sheet name", exact: true }).fill("Copy draft");
  await rename.getByRole("button", { name: "Rename sheet", exact: true }).click();
  await rename.waitFor({ state: "hidden" });
  assert.equal(await tab("Copy draft").getAttribute("data-sheet-id"), copiedId);
  await sheet("Requirements");
  await tab("Copy draft").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await rename.getByRole("textbox", { name: "Sheet name", exact: true }).fill("Context actions");
  await rename.getByRole("button", { name: "Rename sheet", exact: true }).click();
  await rename.waitFor({ state: "hidden" });
  await tab("Context actions").waitFor();
  await page.getByRole("grid", { name: "Requirements spreadsheet", exact: true }).waitFor();
  assert.equal(await tab("Context actions").getAttribute("data-sheet-id"), copiedId);

  const indexBefore = (await sheetIds()).indexOf(copiedId);
  await page
    .getByRole("button", { name: "Sheet actions for Context actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Move left", exact: true }).click();
  await eventually(
    async () => (await sheetIds()).indexOf(copiedId) === indexBefore - 1,
    "Moving an inactive sheet changes that stable sheet ID's position",
  );
  await page.getByRole("grid", { name: "Requirements spreadsheet", exact: true }).waitFor();
  await sheet("Analysis");
  console.log(
    "Inactive sheet right-click duplicate/rename and chevron reorder preserve the intended target.",
  );
  return { copiedId, copiedIndex: indexBefore - 1 };
}

const richFormat = {
  fontFamily: "Georgia",
  fontSize: 14,
  color: "#8a1438",
  background: "#fff1c2",
  verticalAlign: "bottom",
};
async function assertRichFormatting() {
  await selectCell("B12");
  const cell = page.getByRole("gridcell", { name: /^B12, .*: 12$/ });
  const style = await cell.evaluate((element) => {
    const css = getComputedStyle(element);
    return {
      fontFamily: css.fontFamily,
      fontSize: parseFloat(css.fontSize),
      alignItems: css.alignItems,
      decorations: css.textDecorationLine,
      color: css.color,
      fill: css.getPropertyValue("--spreadsheet-cell-background").trim(),
      borders: [
        css.borderTopWidth,
        css.borderRightWidth,
        css.borderBottomWidth,
        css.borderLeftWidth,
      ],
      borderColors: [
        css.borderTopColor,
        css.borderRightColor,
        css.borderBottomColor,
        css.borderLeftColor,
      ],
    };
  });
  assert.ok(style.fontFamily.includes("Georgia"));
  assert.equal(style.alignItems, "flex-end", "Bottom vertical alignment is rendered");
  assert.ok(Math.abs(style.fontSize - (14 * 4) / 3) < 0.01, "Workbook font sizes use points");
  assert.ok(style.decorations.includes("line-through") && style.decorations.includes("underline"));
  assert.equal(style.color, "rgb(138, 20, 56)");
  assert.equal(style.fill, richFormat.background);
  assert.deepEqual(style.borders, ["1px", "1px", "2px", "1px"]);
  assert.deepEqual(style.borderColors, Array(4).fill("rgb(138, 20, 56)"));
  assert.equal(await cell.getAttribute("data-wrap"), "true");
}
async function verifyDirectNumberFormats() {
  await editCell("D20", "0.25");
  await selectCell("D20");
  const display = (value) => page.getByRole("gridcell", { name: `D20, D: ${value}`, exact: true });
  await page.getByRole("button", { name: "Format as currency", exact: true }).click();
  await display("$0.25").waitFor();
  await page.getByRole("button", { name: "Format as percent", exact: true }).click();
  await display("25.0%").waitFor();
  await page.getByRole("button", { name: "Decrease decimal places", exact: true }).click();
  await display("25%").waitFor();
  assert.ok(
    await page.getByRole("button", { name: "Decrease decimal places", exact: true }).isDisabled(),
  );
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Undo", exact: true }).click();
  await display("0.25").waitFor();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("D20")).inputValue(), "");
  await sheet("Requirements");
  await selectCell("C2");
  assert.ok(
    await page.getByRole("button", { name: "Format as currency", exact: true }).isDisabled(),
  );
  assert.ok(
    await page.getByRole("button", { name: "Format as percent", exact: true }).isDisabled(),
  );
  await sheet("Analysis");
  console.log(
    "Direct currency/percent controls and decimal precision preserve source types and undo one change at a time.",
  );
}

async function verifyRichFormatting() {
  await selectCell("B12");
  await page.getByRole("combobox", { name: "Font family", exact: true }).click();
  await page.getByRole("option", { name: "Georgia", exact: true }).click();
  await page.getByRole("textbox", { name: "Font size", exact: true }).fill("14");
  await page.getByRole("textbox", { name: "Font size", exact: true }).press("Enter");
  const strike = page.getByRole("button", { name: "Strikethrough", exact: true });
  await strike.click();
  assert.equal(await strike.getAttribute("aria-pressed"), "true");
  await strike.click();
  assert.equal(await strike.getAttribute("aria-pressed"), "false");
  await strike.click();
  for (const [label, value] of [
    ["Text color", richFormat.color],
    ["Fill color", richFormat.background],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    const input = page.getByLabel(label, { exact: true }).and(page.locator('input[type="color"]'));
    await input.waitFor();
    // Headless Chromium cannot interact with the operating-system color picker.
    // Exercise the actual native input and React change handler, not the workbook model.
    await input.evaluate((element, next) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, next);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    assert.equal(await input.inputValue(), value);
    await page.keyboard.press("Escape");
  }
  for (const item of ["Bottom border", "All borders", "Thick bottom border"]) {
    await page.getByRole("button", { name: "Cell borders", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Cell borders", exact: true })
      .getByRole("button", { name: item, exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Wrap text", exact: true }).click();
  await page.getByRole("button", { name: "Vertical alignment", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Align bottom", exact: true }).click();
  await page.keyboard.press("Escape");
  await assertRichFormatting();
  console.log(
    "Georgia14pt, strikethrough, native text/fill color, four borders and wrap render through the shared toolbar.",
  );
}
async function verifySavedRichFormatting(programId) {
  const saved = await data(
    client
      .from("assurance_workbooks")
      .select("document")
      .eq("tenant_id", tenantId)
      .eq("program_id", programId)
      .single(),
  );
  const analysis = saved.document.analysis.sheets.find((entry) => entry.name === "Analysis");
  assert.ok(analysis);
  assert.equal(analysis.conditionalFormats?.length, 1, "The authored conditional rule is saved");
  assert.equal(
    analysis.conditionalFormats[0].style.bold,
    undefined,
    "An unchecked bold option inherits typography instead of clearing font emphasis",
  );
  const cell = analysis.cells[analysis.rows[11].id][analysis.columns[1].id];
  for (const [key, value] of Object.entries(richFormat)) assert.equal(cell.style[key], value);
  for (const key of ["bold", "underline", "strikethrough", "wrap"])
    assert.equal(cell.style[key], true);
  for (const edge of ["Top", "Right", "Bottom", "Left"]) {
    assert.deepEqual(cell.style[`border${edge}`], {
      style: "solid",
      color: richFormat.color,
      width: edge === "Bottom" ? 2 : 1,
    });
  }
  await assertRichFormatting();
  console.log(
    "Rich formatting survives Save/reload in both the recorded workbook document and rendered cell.",
  );
}

const rowNarrative =
  "The reviewer checks every recorded decision and the supporting evidence before publication. This complete explanation stays readable as the selected font grows and the text wraps across several lines.";
async function cellHeight(address) {
  return page
    .getByRole("gridcell", { name: new RegExp(`^${address},`) })
    .evaluate((element) => element.getBoundingClientRect().height);
}
async function rowMenu(address, label) {
  await selectCell(address);
  const cell = page.getByRole("gridcell", { name: new RegExp(`^${address},`) });
  const rowId = await cell.getAttribute("data-row-id");
  await page.locator(`[role="rowheader"][data-row-id="${rowId}"]`).click({ button: "right" });
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}
async function verifySourceWrapping(contentId) {
  await selectCell("C2");
  const statement = page.getByRole("gridcell", { name: /^C2, Statement:/ });
  for (const name of ["Wrap text", "Vertical alignment"])
    assert.equal(await page.getByRole("button", { name, exact: true }).isEnabled(), true);
  assert.equal(
    await page.getByRole("combobox", { name: "Font family", exact: true }).isEnabled(),
    true,
  );
  assert.equal(
    await page.getByRole("combobox", { name: "Number format", exact: true }).isDisabled(),
    true,
  );
  for (const name of ["Decrease decimal places", "Increase decimal places"])
    assert.equal(await page.getByRole("button", { name, exact: true }).isDisabled(), true);
  const before = await data(
    client.from("requirement_revisions").select("statement,revision").eq("id", contentId).single(),
  );
  const wrap = page.getByRole("button", { name: "Wrap text", exact: true });
  if ((await wrap.getAttribute("aria-pressed")) !== "true") await wrap.click();
  await eventually(
    async () => (await statement.getAttribute("data-wrap")) === "true",
    "Source prose wraps",
  );
  const expanded = await cellHeight("C2");
  await wrap.click();
  await eventually(
    async () => (await cellHeight("C2")) < expanded,
    "Turning off source wrapping reduces the row height",
  );
  await wrap.click();
  await eventually(
    async () => (await cellHeight("C2")) >= expanded,
    "Source wrapping restores its automatic row height",
  );
  assert.deepEqual(
    await data(
      client
        .from("requirement_revisions")
        .select("statement,revision")
        .eq("id", contentId)
        .single(),
    ),
    before,
    "Visual source formatting never edits the canonical statement or revision",
  );
  console.log(
    "Source prose wraps with automatic height while record values and number semantics remain protected.",
  );
}
async function verifyAutomaticRowSizing() {
  await editCell("A14", rowNarrative);
  await editCell("A15", "Manual row height persists.");
  await selectCell("A14");
  const initial = await cellHeight("A14");
  await page.getByRole("button", { name: "Wrap text", exact: true }).click();
  await eventually(
    async () => (await cellHeight("A14")) > initial,
    "Wrapped analysis prose grows its row",
  );
  const wrapped = await cellHeight("A14");
  await page.getByRole("textbox", { name: "Font size", exact: true }).fill("24");
  await page.getByRole("textbox", { name: "Font size", exact: true }).press("Enter");
  await eventually(
    async () => (await cellHeight("A14")) > wrapped,
    "Larger wrapped type grows the row again",
  );
  const automatic = await cellHeight("A14");
  await rowMenu("A14", "Row height…");
  const dialog = page.getByRole("dialog", { name: "Row height", exact: true });
  await dialog.getByRole("spinbutton", { name: "Height in pixels", exact: true }).fill("56");
  await dialog.getByRole("button", { name: "Apply size", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    Math.round(await cellHeight("A14")),
    56,
    "An explicit size overrides automatic wrapping",
  );
  await rowMenu("A14", "Fit to data");
  await eventually(
    async () => Math.round(await cellHeight("A14")) === Math.min(240, Math.round(automatic)),
    "Fit to data measures current typography within explicit limits",
  );
  await rowMenu("A14", "Automatic row height");
  await eventually(
    async () => Math.round(await cellHeight("A14")) === Math.round(automatic),
    "Automatic restores style-responsive height",
  );

  await selectCell("A15");
  const divider = page.getByRole("separator", { name: "Resize row 15", exact: true });
  await divider.scrollIntoViewIfNeeded();
  const bounds = await divider.boundingBox();
  assert.ok(bounds);
  const current = await cellHeight("A15");
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 64 - current, { steps: 5 });
  await page.mouse.up();
  await eventually(
    async () => Math.round(await cellHeight("A15")) === 64,
    "Dragging the row divider commits an explicit64px height",
  );
  await selectCell("A14");
  const narrative = page.getByRole("gridcell", { name: /^A14,/ });
  assert.ok(
    await narrative.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
    "Automatically wrapped prose fits within its row",
  );
  await assertFits(1440);
  await page.screenshot({ path: "/tmp/program-assurance-row-height-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await selectCell("A14");
  await assertFits(390);
  await page.screenshot({ path: "/tmp/program-assurance-row-height-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  console.log(
    "Wrapped font-driven row growth, explicit sizing, fit/reset, and pointer row resizing verified at desktop and390px.",
  );
}
async function verifySavedRowSizing(programId) {
  const saved = await data(
    client
      .from("assurance_workbooks")
      .select("document")
      .eq("tenant_id", tenantId)
      .eq("program_id", programId)
      .single(),
  );
  const analysis = saved.document.analysis.sheets.find((sheet) => sheet.name === "Analysis");
  assert.equal(
    analysis.rows[13].height,
    undefined,
    "Automatic row sizing persists as an omitted explicit height",
  );
  assert.equal(analysis.rows[14].height, 64, "Manual row height persists by stable identity");
  const narrative = analysis.cells[analysis.rows[13].id][analysis.columns[0].id];
  assert.equal(narrative.input, rowNarrative);
  assert.equal(narrative.style.wrap, true);
  assert.equal(narrative.style.fontSize, 24);
  const sourceStyle = saved.document.layouts.requirements.styles.find(
    (entry) => entry.columnId === "statement",
  );
  assert.equal(sourceStyle.style.wrap, true, "Source wrapping is saved as presentation metadata");
  await sheet("Requirements");
  await selectCell("C2");
  assert.equal(
    await page.getByRole("gridcell", { name: /^C2, Statement:/ }).getAttribute("data-wrap"),
    "true",
  );
  await sheet("Analysis");
  await selectCell("A14");
  assert.ok(
    (await cellHeight("A14")) > 56,
    "Restored automatic row measures its saved wrapping/font",
  );
  await selectCell("A15");
  assert.equal(Math.round(await cellHeight("A15")), 64);
  console.log(
    "Automatic reset, manual row height, source wrapping and analysis typography survive saved reload.",
  );
}

async function verifyContextClipboard() {
  const menu = async (address, label) => {
    await selectCell(address);
    await page
      .getByRole("gridcell", { name: new RegExp(`^${address},`) })
      .click({ button: "right" });
    await page.getByRole("menuitem", { name: label, exact: true }).click();
  };
  await menu("B12", "Copy");
  await eventually(
    async () => (await page.evaluate(() => navigator.clipboard.readText())) === "=SUM(A12,5)",
    "Context Copy writes the formula source to the system clipboard",
  );
  await menu("E12", "Paste values");
  assert.equal(
    await (await selectCell("E12")).inputValue(),
    "12",
    "Paste values materializes the evaluated formula",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("E12")).inputValue(), "");

  await menu("A12", "Cut");
  await eventually(
    async () => (await page.evaluate(() => navigator.clipboard.readText())) === "7",
    "Context Cut writes its source to the system clipboard",
  );
  assert.equal(
    await (await selectCell("A12")).inputValue(),
    "7",
    "Cut keeps source intact until a paste succeeds",
  );
  await menu("F12", "Paste");
  assert.equal(await (await selectCell("F12")).inputValue(), "7");
  assert.equal(await (await selectCell("A12")).inputValue(), "");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("A12")).inputValue(), "7");
  assert.equal(
    await (await selectCell("F12")).inputValue(),
    "",
    "One undo restores both sides of a cut/paste",
  );
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  console.log(
    "Actual context clipboard copy/paste-values and atomic cut/paste/undo preserve formula and source semantics.",
  );
}

async function verifyCrossSheetClipboard() {
  await sheet("Analysis");
  await selectCell("B12");
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await eventually(
    async () => (await page.evaluate(() => navigator.clipboard.readText())) === "=SUM(A12,5)",
    "Formula clipboard ready",
  );
  await sheet("Requirements");
  await sheet("Context actions");
  await selectCell("E12");
  await page.getByRole("gridcell", { name: /^E12,/ }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Paste values", exact: true }).click();
  assert.equal(
    await (await selectCell("E12")).inputValue(),
    "12",
    "Cross-sheet paste values retains the copied calculation",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("E12")).inputValue(), "");
  await selectCell("F12");
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  assert.equal(
    await (await selectCell("F12")).inputValue(),
    "=SUM(E12,5)",
    "Cross-sheet copy retains relative source coordinates",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();

  await sheet("Analysis");
  await selectCell("E18");
  await page.getByRole("combobox", { name: "Number format", exact: true }).click();
  await page.getByRole("option", { name: "Text", exact: true }).click();
  await editCell("E18", "=1+1");
  await selectCell("E18");
  await page.getByRole("gridcell", { name: /^E18, .*: =1\+1$/ }).waitFor();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await eventually(
    async () => (await page.evaluate(() => navigator.clipboard.readText())) === "=1+1",
    "Text-formatted input retains its system clipboard representation",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("E18")).inputValue(), "");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await sheet("Requirements");
  await sheet("Context actions");
  await selectCell("E18");
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  assert.equal(
    await (await selectCell("E18")).inputValue(),
    "=1+1",
    "Rich copy retains literal source text while carrying its authored Text format",
  );
  assert.equal(
    await page
      .getByRole("combobox", { name: "Number format", exact: true })
      .getAttribute("aria-description"),
    "Current format: Text",
    "The incoming text format prevents formula evaluation without adding an authored apostrophe",
  );
  await page.getByRole("gridcell", { name: /^E18, .*: =1\+1$/ }).waitFor();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("E18")).inputValue(), "");
  assert.equal(
    await page
      .getByRole("combobox", { name: "Number format", exact: true })
      .getAttribute("aria-description"),
    "Current format: General",
    "One undo restores both the destination value and its previous format",
  );
  await sheet("Analysis");
  console.log(
    "Cross-sheet copy preserves evaluated values, relative formulas and literal text across source and analysis tabs.",
  );
}

async function verifyBorderRangesAndCustomFont() {
  await editCell("C16", "Border demo");
  await selectCell("C16");
  const cell = (address) => page.getByRole("gridcell", { name: new RegExp(`^${address},`) });
  const size = page.getByRole("textbox", { name: "Font size", exact: true });
  await size.fill("13");
  assert.equal(
    await cell("C16").evaluate((node) => node.style.fontSize),
    "",
    "Font typing keeps a local draft",
  );
  await size.press("Enter");
  await eventually(
    async () => (await cell("C16").evaluate((node) => node.style.fontSize)) === "13pt",
    "Custom font size commits",
  );
  await size.fill("19");
  await size.press("Escape");
  assert.equal(
    await cell("C16").evaluate((node) => node.style.fontSize),
    "13pt",
    "Escape cancels the custom-size draft",
  );
  assert.equal(await size.inputValue(), "13");
  await page.getByRole("button", { name: "Increase Font size", exact: true }).click();
  await eventually(
    async () => (await cell("C16").evaluate((node) => node.style.fontSize)) === "14pt",
    "Font-size stepper commits",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await cell("C16").evaluate((node) => node.style.fontSize), "13pt");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(
    await cell("C16").evaluate((node) => node.style.fontSize),
    "",
    "One undo reverts custom size without intermediate history",
  );
  await size.fill("13");
  await size.press("Enter");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await cell("C16").click();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  const borderStyle = (address) =>
    cell(address).evaluate((node) =>
      ["Top", "Right", "Bottom", "Left"].map((side) => node.style[`border${side}`]),
    );
  await page.getByRole("button", { name: "Cell borders", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Cell borders", exact: true });
  await dialog.getByRole("combobox", { name: "Border style", exact: true }).click();
  await page.getByRole("option", { name: "Dashed", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Border width", exact: true }).click();
  await page.getByRole("option", { name: "Medium", exact: true }).click();
  const color = dialog
    .getByLabel("Border color", { exact: true })
    .and(page.locator('input[type="color"]'));
  await color.evaluate((element) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
      element,
      "#13579b",
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.deepEqual(
    await borderStyle("C16"),
    ["", "", "", ""],
    "Choosing border pen settings does not mutate cells",
  );
  await page.screenshot({
    path: "/tmp/program-assurance-border-controls.png",
    fullPage: true,
    animations: "disabled",
  });
  await dialog.getByRole("button", { name: "Outside borders", exact: true }).click();
  const border = "2px dashed rgb(19, 87, 155)";
  assert.deepEqual(await borderStyle("C16"), [border, "", "", border]);
  assert.deepEqual(await borderStyle("D17"), ["", border, border, ""]);
  await page.getByRole("button", { name: "Cell borders", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Cell borders", exact: true });
  await dialog.getByRole("button", { name: "Inside borders", exact: true }).click();
  assert.deepEqual(await borderStyle("C16"), ["", border, border, ""]);
  assert.deepEqual(await borderStyle("D17"), [border, "", "", border]);
  await page.getByRole("button", { name: "Cell borders", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Cell borders", exact: true })
    .getByRole("button", { name: "No borders", exact: true })
    .click();
  assert.deepEqual(await borderStyle("C16"), ["", "", "", ""]);
  assert.equal(await cell("C16").evaluate((node) => node.style.fontSize), "13pt");
  assert.equal(
    await cell("C16").getAttribute("data-bold"),
    "true",
    "Clearing borders retains font styling and values",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.deepEqual(
    await borderStyle("C16"),
    ["", border, border, ""],
    "Range border changes undo atomically",
  );
  await selectCell("B12");
  console.log(
    "Custom font sizes commit once; outside/inside borders follow the selected range, retain typography and undo atomically.",
  );
}

async function verifyHeaderContextActions() {
  const grid = page.getByRole("grid", { name: "Analysis spreadsheet", exact: true });
  await selectCell("B12");
  const cell = page.getByRole("gridcell", { name: /^B12,/ });
  const columnId = await cell.getAttribute("data-column-id");
  const rowId = await cell.getAttribute("data-row-id");
  assert.ok(columnId && rowId, "Context targets expose stable row and column IDs");
  const column = grid.locator(`[role="columnheader"][data-column-id="${columnId}"]`);
  const row = grid.locator(`[role="rowheader"][data-row-id="${rowId}"]`);

  await column.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Column width…", exact: true }).click();
  const columnSize = page.getByRole("dialog", { name: "Column width", exact: true });
  await columnSize.getByRole("spinbutton", { name: "Width in pixels", exact: true }).fill("196");
  await columnSize.getByRole("button", { name: "Apply size", exact: true }).click();
  await columnSize.waitFor({ state: "hidden" });
  assert.equal(Math.round((await column.boundingBox()).width), 196);
  await column.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Hide selected columns", exact: true }).click();
  await column.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await page.getByRole("menuitem", { name: "Unhide all columns", exact: true }).click();
  await selectCell("B12");
  assert.equal(await (await selectCell("B12")).inputValue(), "=SUM(A12,5)");

  await row.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Row height…", exact: true }).click();
  const rowSize = page.getByRole("dialog", { name: "Row height", exact: true });
  await rowSize.getByRole("spinbutton", { name: "Height in pixels", exact: true }).fill("56");
  await rowSize.getByRole("button", { name: "Apply size", exact: true }).click();
  await rowSize.waitFor({ state: "hidden" });
  assert.equal(Math.round((await row.boundingBox()).height), 56);
  await row.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Hide selected rows", exact: true }).click();
  await row.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await page.getByRole("menuitem", { name: "Unhide all rows", exact: true }).click();
  await selectCell("B12");
  await row.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Insert 1 row above", exact: true }).click();
  await page.getByRole("gridcell", { name: /^B13, .*: 12$/ }).waitFor();
  assert.equal(await (await selectCell("B13")).inputValue(), "=SUM(A13,5)");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("B12")).inputValue(), "=SUM(A12,5)");
  console.log(
    "Right-click header sizing/hide/unhide and reversible row insertion preserve canonical formula addresses.",
  );
}

async function captureWorkbookContexts() {
  await selectCell("B12");
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-desktop.png",
    fullPage: true,
  });
  await selectCell("C12");
  await page.getByRole("gridcell", { name: /^C12,/ }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Edit comment", exact: true }).waitFor();
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-cell-menu.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  const columnId = await page
    .getByRole("gridcell", { name: /^B12,/ })
    .getAttribute("data-column-id");
  await page
    .locator(`[role="columnheader"][data-column-id="${columnId}"]`)
    .click({ button: "right" });
  await page.getByRole("menuitem", { name: "Insert 1 column left", exact: true }).waitFor();
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-column-menu.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("group", { name: "Workbook sheets", exact: true })
    .getByRole("button", { name: "Analysis", exact: true })
    .click({ button: "right" });
  await page.getByRole("menuitem", { name: "Rename", exact: true }).waitFor();
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-sheet-menu.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await selectCell("B12");
  await assertFits(390);
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-mobile.png",
    fullPage: true,
  });
  await sheet("SCTM");
  await selectCell("A2");
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-sctm-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    animations: "disabled",
    path: "/private/tmp/workbook-context-sctm-desktop.png",
    fullPage: true,
  });
  await sheet("Analysis");
}

async function verifyCellMetadata() {
  const comment = "Reviewed calculation.\nRetain this note across saved reloads.";
  await selectCell("C12");
  const commented = page.getByRole("gridcell", { name: /^C12,/ });
  await commented.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Comment", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cell comment", exact: true });
  await dialog.getByRole("textbox", { name: "Comment", exact: true }).fill(comment);
  await dialog.getByRole("button", { name: "Save comment", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await commented.getAttribute("data-comment"), "true");
  assert.ok((await commented.getAttribute("aria-description")).includes(comment));

  await selectCell("D12");
  const choice = page.getByRole("gridcell", { name: /^D12,/ });
  await choice.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Dropdown…", exact: true }).click();
  const dropdown = page.getByRole("dialog", { name: "Cell dropdown", exact: true });
  await dropdown
    .getByRole("textbox", { name: "Dropdown choices", exact: true })
    .fill("Pending\nReady");
  await dropdown.getByRole("button", { name: "Apply dropdown", exact: true }).click();
  await dropdown.waitFor({ state: "hidden" });
  await selectCell("D12");
  await page.getByRole("grid", { name: "Analysis spreadsheet", exact: true }).press("F2");
  await page.getByRole("option", { name: "Ready", exact: true }).click();
  await page.getByRole("gridcell", { name: /^D12, .*: Ready$/ }).waitFor();
  console.log("Real cell context menus add a multiline comment and editable dropdown metadata.");
  return comment;
}

async function verifySavedContextActions({ copiedId, copiedIndex }, comment) {
  const tabs = page.getByRole("group", { name: "Workbook sheets", exact: true });
  const ids = await tabs
    .locator("button[data-sheet-id]")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-sheet-id")));
  assert.equal(ids.indexOf(copiedId), copiedIndex, "Saved sheet order survives reload");
  await selectCell("B12");
  const resized = page.getByRole("gridcell", { name: /^B12,/ });
  const resizedBounds = await resized.boundingBox();
  assert.ok(resizedBounds);
  assert.equal(Math.round(resizedBounds.width), 196, "Saved column width survives reload");
  assert.equal(Math.round(resizedBounds.height), 56, "Saved row height survives reload");

  assert.equal(
    await tabs
      .getByRole("button", { name: "Context actions", exact: true })
      .getAttribute("data-sheet-id"),
    copiedId,
    "Saved sheet rename preserves identity",
  );
  await selectCell("C12");
  const commented = page.getByRole("gridcell", { name: /^C12,/ });
  assert.equal(await commented.getAttribute("data-comment"), "true");
  assert.ok((await commented.getAttribute("aria-description")).includes(comment));
  assert.equal(await (await selectCell("D12")).inputValue(), "Ready");
  await page.getByRole("grid", { name: "Analysis spreadsheet", exact: true }).press("F2");
  await page.getByRole("option", { name: "Pending", exact: true }).waitFor();
  await page.getByRole("option", { name: "Ready", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("listbox").waitFor({ state: "hidden" });

  await tabs
    .getByRole("button", { name: "Context actions", exact: true })
    .click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const deletion = page.getByRole("alertdialog", { name: "Delete Context actions?", exact: true });
  await deletion.getByRole("button", { name: "Delete sheet", exact: true }).click();
  await deletion.waitFor({ state: "hidden" });
  await tabs
    .getByRole("button", { name: "Context actions", exact: true })
    .waitFor({ state: "hidden" });
  await page.getByRole("grid", { name: "Analysis spreadsheet", exact: true }).waitFor();
  console.log(
    "Sheet identity/order, comment and dropdown survive saved reload; deleting an inactive copy preserves the active sheet.",
  );
}

async function verifyColumnControls(width) {
  const toolbar = page.getByRole("group", {
    name: "Requirements spreadsheet actions",
    exact: true,
  });
  assert.equal(await toolbar.count(), 1, "The grid and workbook share one action strip");
  for (const name of ["Copy", "Columns", "Filter", "Sort", "Import workbook", "Workbook actions"])
    assert.equal(await toolbar.getByRole("button", { name, exact: true }).count(), 1);
  assert.equal(await toolbar.getByRole("combobox", { name: "View", exact: true }).count(), 1);
  const first = toolbar.getByRole("button", { name: "Copy", exact: true });
  const last = toolbar.getByRole("button", { name: "Workbook actions", exact: true });
  await last.focus();
  const firstBounds = await first.boundingBox();
  const lastBounds = await last.boundingBox();
  assert.ok(
    firstBounds && lastBounds && Math.abs(firstBounds.y - lastBounds.y) <= 1,
    "Workbook and cell actions stay on one horizontal row",
  );

  await selectCell("A2");
  const grid = page.getByRole("grid", { name: "Requirements spreadsheet", exact: true });
  const options = page.getByRole("button", { name: "Column options for Requirement", exact: true });
  const headerWidth = () =>
    options.evaluate(
      (element) => element.closest('[role="columnheader"]').getBoundingClientRect().width,
    );
  const originalWidth = await headerWidth();
  await options.click();
  assert.equal(
    await page.getByRole("menuitem", { name: "Insert 1 column left", exact: true }).count(),
    0,
    "Canonical source columns cannot be inserted or deleted",
  );
  await page.getByRole("menuitem", { name: "Narrow column", exact: true }).click();
  await eventually(
    async () => (await headerWidth()) < originalWidth,
    "Narrowing changes the selected column",
  );
  await options.click();
  await page.getByRole("menuitem", { name: "Reset column width", exact: true }).click();
  await eventually(
    async () => (await headerWidth()) === originalWidth,
    "Reset restores the configured width",
  );
  await page.getByRole("separator", { name: "Resize Requirement", exact: true }).dblclick();
  await eventually(
    async () => (await headerWidth()) !== originalWidth,
    "Double-clicking the divider autofits the column",
  );
  await options.click();
  await page.getByRole("menuitem", { name: "Reset column width", exact: true }).click();
  await selectCell("A2");
  await grid.press("Alt+ArrowDown");
  await page.getByRole("menuitem", { name: "Sort sheet A to Z", exact: true }).click();
  await page.getByRole("button", { name: /^Sort/ }).click();
  assert.equal(
    await page.getByRole("combobox", { name: "Sort view by", exact: true }).textContent(),
    "Requirement",
  );
  await page.getByRole("button", { name: "Clear sort", exact: true }).click();
  await page.keyboard.press("Escape");
  await assertFits(width);
  console.log(
    `Unified toolbar, pointer sizing/autofit/reset and keyboard column sorting verified at ${width}px.`,
  );
}

async function verifyCheckboxLabel(dialog, name) {
  const checkbox = dialog.getByRole("checkbox", { name, exact: true });
  const label = dialog.getByText(name, { exact: true });
  assert.ok(await checkbox.isVisible(), `${name} has an accessible checkbox`);
  assert.ok(await label.isVisible(), `${name} has a visible label`);
  assert.equal(await checkbox.isChecked(), false);
  await label.click();
  assert.equal(await checkbox.isChecked(), true, `${name} label activates its checkbox`);
  await label.click();
  assert.equal(await checkbox.isChecked(), false, `${name} can be cleared`);
}

async function verifyAuthoringTools() {
  await sheet("Analysis");
  await editCell("A25", "7");
  await editCell("B25", "8");
  await editCell("C25", "=SUM(A25:B25)");
  await page.getByRole("gridcell", { name: /^C25, .*: 15$/ }).waitFor();
  await selectCell("A25");
  await page
    .getByRole("grid", { name: "Analysis spreadsheet", exact: true })
    .press("Shift+ArrowRight");
  await page
    .locator('[data-slot="spreadsheet-summary"]')
    .getByText(/Sum.*15/)
    .waitFor();
  await selectCell("A25");
  await page.getByRole("button", { name: "Conditional formatting", exact: true }).click();
  const rules = page.getByRole("dialog", { name: "Conditional formatting", exact: true });
  assert.equal(
    await rules.getByRole("combobox", { name: "Condition type", exact: true }).textContent(),
    "Number",
  );
  assert.equal(
    await rules.getByRole("combobox", { name: "Comparison", exact: true }).textContent(),
    "Greater than",
  );
  await verifyCheckboxLabel(rules, "Bold text");
  await rules.getByRole("combobox", { name: "Condition type", exact: true }).click();
  await page.getByRole("option", { name: "Text", exact: true }).click();
  await verifyCheckboxLabel(rules, "Match case");
  await rules.getByRole("combobox", { name: "Condition type", exact: true }).click();
  await page.getByRole("option", { name: "Number", exact: true }).click();
  await rules.getByRole("textbox", { name: "Compare with", exact: true }).fill("5");
  await rules.getByRole("button", { name: "Add rule", exact: true }).click();
  await rules.getByText(/Rule 1: Greater than 5/).waitFor();
  await rules
    .locator('[data-slot="dialog-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  const cell = (address) => page.getByRole("gridcell", { name: new RegExp(`^${address},`) });
  assert.equal(
    await cell("A25").evaluate((node) =>
      node.style.getPropertyValue("--spreadsheet-cell-background"),
    ),
    "#fff2cc",
  );
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  const menu = async (address, label) => {
    await selectCell(address);
    await cell(address).click({ button: "right" });
    await page.getByRole("menuitem", { name: label, exact: true }).click();
  };
  await menu("A25", "Copy");
  await menu("A27", "Paste");
  assert.equal(await (await selectCell("A27")).inputValue(), "7");
  assert.equal(await cell("A27").getAttribute("data-bold"), "true");
  assert.notEqual(
    await cell("A27").evaluate((node) =>
      node.style.getPropertyValue("--spreadsheet-cell-background"),
    ),
    "#fff2cc",
    "Conditional output is not copied as authored style",
  );
  await editCell("B27", "Keep this value");
  await menu("A25", "Copy");
  await menu("B27", "Paste formatting");
  assert.equal(await (await selectCell("B27")).inputValue(), "Keep this value");
  assert.equal(await cell("B27").getAttribute("data-bold"), "true");
  await editCell("A26", "WorkbenchNeedle");
  await page.getByRole("button", { name: "Find and replace", exact: true }).click();
  const find = page.getByRole("dialog", { name: "Find and replace", exact: true });
  assert.equal(
    await find.getByRole("combobox", { name: "Search scope", exact: true }).textContent(),
    "Current sheet",
  );
  assert.equal(
    await find.getByRole("combobox", { name: "Search values", exact: true }).textContent(),
    "Authored inputs",
  );
  await verifyCheckboxLabel(find, "Match case");
  await verifyCheckboxLabel(find, "Whole cell");
  await find.getByRole("textbox", { name: "Find", exact: true }).fill("WorkbenchNeedle");
  await find.getByRole("textbox", { name: "Replace with", exact: true }).fill("Replaced once");
  await find.getByRole("button", { name: "Replace all editable matches", exact: true }).click();
  await find.getByText(/Replaced 1 cells/).waitFor();
  await find
    .locator('[data-slot="dialog-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  assert.equal(await (await selectCell("A26")).inputValue(), "Replaced once");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("A26")).inputValue(), "WorkbenchNeedle");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitem", { name: "Save current view…", exact: true }).click();
  const saveView = page.getByRole("dialog", { name: "Save current view", exact: true });
  await saveView.getByRole("textbox", { name: "Name", exact: true }).fill("Analysis working view");
  await saveView.getByRole("button", { name: "Save current view", exact: true }).click();
  await saveView.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitem", { name: "Manage saved views…", exact: true }).click();
  const managedViews = page.getByRole("dialog", { name: "Saved views", exact: true });
  await managedViews.getByRole("button", { name: "Edit", exact: true }).click();
  const editView = page.getByRole("dialog", { name: "Edit saved view", exact: true });
  await verifyCheckboxLabel(editView, "Replace settings with the current view");
  await editView.getByRole("button", { name: "Cancel", exact: true }).click();
  await managedViews
    .locator('[data-slot="dialog-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await sheet("Requirements");
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitem", { name: "Analysis working view", exact: true }).click();
  await page.getByRole("grid", { name: "Analysis spreadsheet", exact: true }).waitFor();
  await selectCell("A25");
  console.log(
    "Workbook find/replace+undo, conditional rules, rich paste, calculated totals and named views verified.",
  );
}

try {
  const program = await insert("programs", {
    code: "WORKBOOK-UI",
    name: "Workbook browser validation",
  });
  const identity = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-WB",
  });
  const owner = await insert("parties", {
    name: "Workbook validation owner",
    party_type: "person",
  });
  const content = await insert("requirement_revisions", {
    engineering_requirement_id: identity.id,
    version_number: 1,
    title: "Original workbook title",
    statement: originalStatement,
    acceptance_criteria: "A recorded action can be retrieved.",
    requirement_type: "security",
  });
  const selected = await data(
    client
      .from("selected_controls")
      .select("id,control_id,profile_resolution_id")
      .is("tenant_id", null)
      .order("id")
      .limit(1)
      .single(),
  );
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS-WB",
    name: "Workbook system",
    system_type: "information_system",
  });
  await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: selected.profile_resolution_id,
    version_number: 1,
  });
  await insert("requirement_allocations", {
    requirement_revision_id: content.id,
    system_id: system.id,
  });
  const mapping = await insert("requirement_control_links", {
    requirement_revision_id: content.id,
    control_id: selected.control_id,
    relationship_type: "derived_from",
    rationale: "Original mapping rationale",
  });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  context.setDefaultTimeout(30_000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (event) => {
    if (event.type() === "error") consoleErrors.push(event.text());
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`${origin}/programs/${program.id}/workbook`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("grid", { name: "Requirements spreadsheet", exact: true }).waitFor();
  await assertFits(1440);
  console.log("Workbook loaded at desktop width.");
  await verifyColumnControls(1440);

  assert.equal(
    await (await selectCell("A2")).getAttribute("readonly"),
    "",
    "Canonical identity is read only",
  );
  await editCell("B2", "Reviewed workbook title");
  assert.equal(
    (await data(client.from("requirement_revisions").select("title").eq("id", content.id).single()))
      .title,
    "Original workbook title",
    "Editing stages a draft before review",
  );
  await sheet("SCTM");
  await editCell("H2", "Reviewed workbook mapping rationale");
  await applyChanges(2);
  console.log("Requirement and SCTM edits reviewed and applied together.");
  assert.equal(
    (await data(client.from("requirement_revisions").select("title").eq("id", content.id).single()))
      .title,
    "Reviewed workbook title",
  );
  assert.equal(
    (
      await data(
        client.from("requirement_control_links").select("rationale").eq("id", mapping.id).single(),
      )
    ).rationale,
    "Reviewed workbook mapping rationale",
  );

  await sheet("Requirements");
  assert.equal(await (await selectCell("C2")).inputValue(), originalStatement);
  const requirementsGrid = page.getByRole("grid", {
    name: "Requirements spreadsheet",
    exact: true,
  });
  await requirementsGrid.press("F2");
  const statementEditor = page.getByRole("textbox", { name: "Edit Statement", exact: true });
  await statementEditor.waitFor();
  assert.equal(await statementEditor.evaluate((element) => element.tagName), "TEXTAREA");
  assert.equal(await statementEditor.inputValue(), originalStatement);
  assert.deepEqual(
    await statementEditor.evaluate((element) => [element.selectionStart, element.selectionEnd]),
    [originalStatement.length, originalStatement.length],
    "F2 preserves the complete multiline statement and places the caret at its end",
  );
  await statementEditor.press("Alt+Enter");
  await statementEditor.pressSequentially("Each record shall retain its original timestamp.");
  const reviewedStatement = `${originalStatement}\nEach record shall retain its original timestamp.`;
  assert.equal(await statementEditor.inputValue(), reviewedStatement);
  await page.screenshot({
    path: "/tmp/program-assurance-workbook-inline-desktop.png",
    fullPage: true,
  });
  assert.equal(
    (
      await data(
        client.from("requirement_revisions").select("statement").eq("id", content.id).single(),
      )
    ).statement,
    originalStatement,
    "Typing in the inline editor never writes canonical source records",
  );

  // Click Review directly while the cell draft is active. An actual pointer prevents
  // locator waiting from concealing a focus-settlement race.
  const reviewButton = page.getByRole("button", { name: /^Review changes(?: \(\d+\))?$/ });
  assert.equal(
    await reviewButton.isEnabled(),
    true,
    "Review remains focusable during a source draft so its first pointer click can settle and review it",
  );
  const reviewBounds = await reviewButton.boundingBox();
  assert.ok(reviewBounds);
  await page.mouse.click(
    reviewBounds.x + reviewBounds.width / 2,
    reviewBounds.y + reviewBounds.height / 2,
  );
  const inlineReview = page.getByRole("dialog", { name: "Review source changes", exact: true });
  await inlineReview.waitFor();
  await statementEditor.waitFor({ state: "hidden" });
  assert.equal(
    (
      await data(
        client.from("requirement_revisions").select("statement").eq("id", content.id).single(),
      )
    ).statement,
    originalStatement,
    "Clicking Review commits the cell to the staged workbook, without a database write",
  );
  await inlineReview.getByRole("button", { name: "Apply changes", exact: true }).click();
  await inlineReview.waitFor({ state: "hidden" });
  await eventually(
    async () =>
      (
        await data(
          client.from("requirement_revisions").select("statement").eq("id", content.id).single(),
        )
      ).statement === reviewedStatement,
    "Apply must preserve all original and Alt+Enter statement line breaks",
  );
  assert.equal(await (await selectCell("C2")).inputValue(), reviewedStatement);
  console.log("One-click Review settles the multiline cell before opening the source review.");

  // Dismissing the choice popover is a complete cancellation, not a stranded editor.
  for (const dismissal of ["escape", "outside"]) {
    await selectCell("F2");
    await requirementsGrid.press("F2");
    const typeEditor = page.getByRole("combobox", { name: "Edit Type", exact: true });
    await typeEditor.waitFor();
    await page.getByRole("listbox").waitFor();
    if (dismissal === "escape") await page.keyboard.press("Escape");
    else {
      const headingBounds = await page
        .getByRole("heading", { name: "Workbook browser validation", exact: true })
        .boundingBox();
      assert.ok(headingBounds);
      // Select owns a dismissal backdrop; click the outside point, not the covered target.
      await page.mouse.click(
        headingBounds.x + headingBounds.width / 2,
        headingBounds.y + headingBounds.height / 2,
      );
    }
    await typeEditor.waitFor({ state: "hidden" });
    await page.getByRole("listbox").waitFor({ state: "hidden" });
    assert.equal(await (await selectCell("F2")).inputValue(), "security");
    assert.equal(
      await reviewButton.isDisabled(),
      true,
      "Dismissal must not stage an unchanged value",
    );
    assert.equal(
      await page.getByRole("button", { name: "Workbook actions", exact: true }).isEnabled(),
      true,
      `${dismissal} dismissal must leave workbook actions usable`,
    );
  }
  await requirementsGrid.press("F2");
  await page.getByRole("option", { name: "Functional", exact: true }).click();
  await page.getByRole("gridcell", { name: /^F2, Type: Functional$/ }).waitFor();
  assert.equal(
    (
      await data(
        client
          .from("requirement_revisions")
          .select("requirement_type")
          .eq("id", content.id)
          .single(),
      )
    ).requirement_type,
    "security",
    "Selecting a choice stages the value until review and apply",
  );
  await applyChanges(1);
  assert.equal(
    (
      await data(
        client
          .from("requirement_revisions")
          .select("requirement_type")
          .eq("id", content.id)
          .single(),
      )
    ).requirement_type,
    "functional",
  );
  console.log(
    "Multiline inline editing, direct Review focus settlement and choice dismissal verified.",
  );

  await selectCell("G2");
  await page.getByRole("gridcell", { name: /^G2, Owner: Unassigned$/ }).waitFor();
  await requirementsGrid.press("F2");
  await page.getByRole("option", { name: owner.name, exact: true }).click();
  await page.getByRole("gridcell", { name: /^G2, Owner: Workbook validation owner$/ }).waitFor();
  assert.equal(
    (
      await data(
        client.from("requirement_revisions").select("owner_party_id").eq("id", content.id).single(),
      )
    ).owner_party_id,
    null,
  );
  await applyChanges(1);
  assert.equal(
    (
      await data(
        client.from("requirement_revisions").select("owner_party_id").eq("id", content.id).single(),
      )
    ).owner_party_id,
    owner.id,
  );
  const findRequirements = page.getByRole("textbox", { name: "Find in Requirements", exact: true });
  await selectCell("G2");
  await requirementsGrid.press("Alt+ArrowDown");
  await page.getByRole("menuitem", { name: "Filter by this column", exact: true }).click();
  const filterColumn = page.getByRole("combobox", { name: "Filter column", exact: true });
  assert.equal(await filterColumn.textContent(), "Owner");
  await findRequirements.fill(owner.name);
  await page.getByRole("gridcell", { name: /^A2, Requirement: REQ-WB$/ }).waitFor();
  await filterColumn.click();
  await page.getByRole("option", { name: "Title", exact: true }).click();
  assert.equal(
    await page.getByRole("gridcell", { name: /^A2, Requirement: REQ-WB$/ }).count(),
    0,
    "A field filter does not match a different column's visible owner name",
  );
  await filterColumn.click();
  await page.getByRole("option", { name: "Owner", exact: true }).click();
  await page.getByRole("gridcell", { name: /^A2, Requirement: REQ-WB$/ }).waitFor();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await page.keyboard.press("Escape");
  await selectCell("G2");
  await requirementsGrid.press("F2");
  await page.getByRole("option", { name: "Unassigned", exact: true }).click();
  await applyChanges(1);
  assert.equal(
    (
      await data(
        client.from("requirement_revisions").select("owner_party_id").eq("id", content.id).single(),
      )
    ).owner_party_id,
    null,
  );
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await findRequirements.fill("Unassigned");
  await page.getByRole("gridcell", { name: /^A2, Requirement: REQ-WB$/ }).waitFor();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await page.keyboard.press("Escape");
  console.log("Owner names and Unassigned remain usable choices and searchable display values.");
  await verifySourceWrapping(content.id);

  await sheet("Analysis");
  await editCell("A12", "7");
  await editCell("B12", "=SUM(A12,5)");
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await (await selectCell("B12")).inputValue(), "");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  await selectCell("B12");
  const analysisColumnId = await page
    .getByRole("gridcell", { name: /^B12,/ })
    .getAttribute("data-column-id");
  await page
    .locator(`[role="columnheader"][data-column-id="${analysisColumnId}"]`)
    .click({ button: "right" });
  await page.getByRole("menuitem", { name: "Insert 1 column left", exact: true }).click();
  await page.getByRole("gridcell", { name: /^C12, .*: 12$/ }).waitFor();
  assert.equal(await (await selectCell("C12")).inputValue(), "=SUM(A12,5)");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  console.log("Analysis column insertion preserves formulas and undoes as one operation.");
  await selectCell("B12");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await page.getByRole("button", { name: "Underline", exact: true }).click();
  await page.getByRole("button", { name: "Text alignment", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Align center", exact: true }).click();
  await page.keyboard.press("Escape");
  const formatted = page.getByRole("gridcell", { name: /^B12, .*: 12$/ });
  assert.equal(await formatted.getAttribute("data-bold"), "true");
  assert.ok(
    await formatted.evaluate((element) =>
      getComputedStyle(element).textDecorationLine.includes("underline"),
    ),
  );
  assert.equal(
    await formatted.evaluate((element) => getComputedStyle(element).textAlign),
    "center",
  );
  await page.screenshot({
    path: "/tmp/program-assurance-toolbar-analysis-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await eventually(
    () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "Analysis fits the phone after the layout has measured its new width",
  );
  await assertFits(390);
  await page.screenshot({
    path: "/tmp/program-assurance-toolbar-analysis-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  console.log("Analysis bold, underline and alignment verified at desktop and phone widths.");
  await verifyContextClipboard();
  await verifyDirectNumberFormats();
  await verifyRichFormatting();
  await verifyHeaderContextActions();
  const sheetContext = await verifySheetContextActions();
  await verifyCrossSheetClipboard();
  await verifyBorderRangesAndCustomFont();
  const savedComment = await verifyCellMetadata();
  await verifyAutomaticRowSizing();
  await captureWorkbookContexts();
  await verifyAuthoringTools();
  await page.getByRole("button", { name: "Save analysis", exact: true }).click();
  await page
    .getByText("Analysis and sheet layout saved. Staged source edits remain unapplied.", {
      exact: true,
    })
    .waitFor();
  await eventually(
    async () =>
      !(await page.evaluate(() =>
        Object.keys(sessionStorage).some((key) => key.startsWith("assurance-workbook:")),
      )),
    "Clean saved workbook recovery should clear",
  );
  await page.reload();
  await page.getByRole("grid", { name: "Requirements spreadsheet", exact: true }).waitFor();
  assert.equal(await (await selectCell("B2")).inputValue(), "Reviewed workbook title");
  assert.equal(await (await selectCell("C2")).inputValue(), reviewedStatement);
  await sheet("Analysis");
  assert.equal(await (await selectCell("B12")).inputValue(), "=SUM(A12,5)");
  await page.getByRole("gridcell", { name: /^B12, .*: 12$/ }).waitFor();
  await page.screenshot({ path: "/tmp/program-assurance-workbook-desktop.png", fullPage: true });
  console.log("Analysis calculation, history and persisted reload verified.");
  await selectCell("A25");
  assert.equal(
    await page
      .getByRole("gridcell", { name: /^A25,/ })
      .evaluate((node) => node.style.getPropertyValue("--spreadsheet-cell-background")),
    "#fff2cc",
    "Conditional rule survives reload",
  );
  await page.getByRole("button", { name: "Discuss selected cell", exact: true }).click();
  const cellReview = page.getByRole("dialog", { name: "Cell review", exact: true });
  await cellReview
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill("Verify this saved calculation");
  await cellReview.getByRole("button", { name: "Start discussion", exact: true }).click();
  await cellReview
    .getByRole("button", { name: "Verify this saved calculation", exact: true })
    .waitFor();
  await cellReview
    .locator('[data-slot="dialog-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  const cellThread = await data(
    client
      .from("assurance_review_threads")
      .select("target")
      .eq("tenant_id", tenantId)
      .eq("subject", "Verify this saved calculation")
      .single(),
  );
  assert.equal(cellThread.target.kind, "cell");
  assert.equal(cellThread.target.rowId, "analysis-row-25");
  await verifySavedRichFormatting(program.id);
  await verifySavedContextActions(sheetContext, savedComment);
  await verifySavedRowSizing(program.id);

  const downloadPromise = page.waitForEvent("download");
  await action("Export workbook XLSX");
  const exported = await downloadPromise;
  assert.equal(exported.suggestedFilename(), "assurance-workbook.xlsx");
  const exportedWorkbook = new ExcelJS.Workbook();
  await exportedWorkbook.xlsx.load(await readFile(await exported.path()));
  assert.equal(
    exportedWorkbook.getWorksheet("Requirements").getCell("B2").value,
    "Reviewed workbook title",
  );
  assert.equal(
    exportedWorkbook.getWorksheet("Requirements").getCell("C2").value,
    reviewedStatement,
  );
  assert.deepEqual(exportedWorkbook.getWorksheet("Analysis").getCell("B12").value, {
    formula: "SUM(A12,5)",
    result: 12,
  });
  const exportedRules = exportedWorkbook.getWorksheet("Analysis").conditionalFormattings;
  assert.ok(
    exportedRules.some(
      (rule) =>
        /^A25(?::A25)?$/.test(rule.ref) &&
        rule.rules.some((condition) =>
          condition.formulae?.some((formula) => formula.includes("A25>5")),
        ),
    ),
    "XLSX retains the authored conditional rule and its target range",
  );
  const incoming = new ExcelJS.Workbook();
  const importedSheet = incoming.addWorksheet("Imported analysis");
  importedSheet.getCell("A1").value = 8;
  importedSheet.getCell("B1").value = { formula: "SUM(A1,5)", result: 13 };
  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import workbook", exact: true }).click();
  await (
    await fileChooser
  ).setFiles({
    name: "analysis.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await incoming.xlsx.writeBuffer()),
  });
  await page.getByRole("grid", { name: "Imported analysis spreadsheet", exact: true }).waitFor();
  await selectCell("B1");
  await page.getByRole("gridcell", { name: /^B1, .*: 13$/ }).waitFor();
  console.log("XLSX export and import verified through actual workers.");

  await page.setViewportSize({ width: 390, height: 844 });
  await sheet("Requirements");
  await assertFits(390);
  await verifyColumnControls(390);
  await selectCell("C2");
  await requirementsGrid.press("F2");
  await statementEditor.waitFor();
  assert.equal(await statementEditor.inputValue(), reviewedStatement);
  await assertFits(390);
  await page.screenshot({
    path: "/tmp/program-assurance-workbook-inline-mobile.png",
    fullPage: true,
  });
  await statementEditor.press("Escape");
  await statementEditor.waitFor({ state: "hidden" });
  await editCell("B2", "Mobile reviewed workbook title");
  await applyChanges(1);
  assert.equal(
    (await data(client.from("requirement_revisions").select("title").eq("id", content.id).single()))
      .title,
    "Mobile reviewed workbook title",
  );
  await page.screenshot({ path: "/tmp/program-assurance-workbook-mobile.png", fullPage: true });

  // The database commits, but the browser never receives the receipt. Recovery
  // must keep that exact request across a reload instead of submitting a new edit.
  const beforeLostResponse = await data(
    client.from("requirement_revisions").select("revision").eq("id", content.id).single(),
  );
  const beforeAudit = await data(
    client.from("activity_events").select("id").eq("tenant_id", tenantId),
  );
  const attempts = [];
  let committedReceipt;
  await page.route("**/rest/v1/rpc/apply_assurance_changes", async (route) => {
    attempts.push(route.request().postDataJSON());
    if (attempts.length === 1) {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      committedReceipt = await response.json();
      await route.abort("failed");
    } else await route.continue();
  });
  await editCell("B2", "Recovered exact retry title");
  await page.getByRole("button", { name: "Review changes (1)", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Review source changes" })
    .getByRole("button", { name: "Apply changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Retry applying changes", exact: true }).waitFor();
  await eventually(
    async () =>
      Boolean(committedReceipt) &&
      (await page.getByRole("button", { name: "Retry applying changes", exact: true }).isEnabled()),
    "The committed request's failed response should leave an enabled retry",
  );
  assert.equal(
    (await data(client.from("requirement_revisions").select("title").eq("id", content.id).single()))
      .title,
    "Recovered exact retry title",
    "First request committed despite its lost response",
  );
  await page.reload();
  await page.getByRole("button", { name: "Recover draft", exact: true }).click();
  await page.getByRole("button", { name: "Review changes (1)", exact: true }).click();
  const retryReview = page.getByRole("dialog", { name: "Review source changes" });
  await retryReview.getByRole("button", { name: "Retry applying changes", exact: true }).click();
  await retryReview.waitFor({ state: "hidden" });
  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts[1], attempts[0], "Reload recovery retries the original exact request");
  const afterRetry = await data(
    client.from("requirement_revisions").select("title,revision").eq("id", content.id).single(),
  );
  assert.equal(afterRetry.title, "Recovered exact retry title");
  assert.equal(
    afterRetry.revision,
    beforeLostResponse.revision + 1,
    "Retry does not create another revision",
  );
  const afterAudit = await data(
    client.from("activity_events").select("id").eq("tenant_id", tenantId),
  );
  assert.equal(afterAudit.length, beforeAudit.length + 1, "Retry creates exactly one audit event");
  assert.ok(
    afterAudit.some((event) => event.id === committedReceipt.requirements[0].activityEventId),
  );

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1050 });
    await view("Traceability matrix");
    const matrix = page.getByRole("grid", {
      name: "Traceability relationship matrix",
      exact: true,
    });
    await matrix.waitFor();
    await matrix.getByRole("gridcell", { name: /REQ-WB/ }).waitFor();
    await matrix
      .getByRole("gridcell", { name: /Derived from · No explicit system context/ })
      .waitFor();
    await assertFits(width);
    await view("Pivot & chart");
    await page.getByText("Requirements · Count by Requirement", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Table", exact: true }).click();
    const pivot = page.getByRole("table");
    await pivot.getByRole("row", { name: "REQ-WB 1", exact: true }).waitFor();
    await assertFits(width);
    await page.screenshot({
      path: `/tmp/program-assurance-workbook-pivot-${width}.png`,
      fullPage: true,
    });
    await view("Spreadsheet");
  }
  console.log("Traceability matrix and pivot values verified at desktop and mobile widths.");

  await page.setViewportSize({ width: 1440, height: 1050 });
  await sheet("Analysis");
  await editCell("A20", "REQ-WB");
  await editCell("B20", '=CONCAT("Transformed ",Requirements!A2)');
  await page.getByRole("gridcell", { name: /^B20, .*: Transformed REQ-WB$/ }).waitFor();
  await selectCell("A20");
  await page
    .getByRole("grid", { name: "Analysis spreadsheet", exact: true })
    .press("Shift+ArrowRight");
  await action("Transform requirements from selection");
  const transform = page.getByRole("dialog", { name: "Transform requirements", exact: true });
  await transform.getByRole("combobox", { name: "Destination field", exact: true }).click();
  await page.getByRole("option", { name: "Title", exact: true }).click();
  await transform.getByRole("button", { name: "Stage transformation", exact: true }).click();
  const transformReview = page.getByRole("dialog", { name: "Review source changes", exact: true });
  await transformReview.getByText("Transformed REQ-WB", { exact: true }).waitFor();
  assert.equal(
    (await data(client.from("requirement_revisions").select("title").eq("id", content.id).single()))
      .title,
    "Recovered exact retry title",
    "Calculated transformation remains staged until review",
  );
  await transformReview.getByRole("button", { name: "Apply changes", exact: true }).click();
  await transformReview.waitFor({ state: "hidden" });
  const transformed = await data(
    client.from("requirement_revisions").select("title,revision").eq("id", content.id).single(),
  );
  assert.equal(
    transformed.title,
    "Transformed REQ-WB",
    "The reviewed calculated value is stored as source text",
  );
  assert.equal(transformed.revision, afterRetry.revision + 1);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await sheet("Analysis");
  await selectCell("A25");
  await page.getByRole("button", { name: "Copy", exact: true }).focus();
  await page.keyboard.press("Escape");
  await page.mouse.move(650, 105);
  await page.getByRole("tooltip").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "/private/tmp/macro-workbook-final-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Conditional formatting", exact: true }).click();
  const mobileRules = page.getByRole("dialog", { name: "Conditional formatting", exact: true });
  await mobileRules.getByText(/Rule 1: Greater than 5/).waitFor();
  await assertFits(390);
  await page.screenshot({
    path: "/private/tmp/macro-workbook-final-authoring-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await mobileRules
    .locator('[data-slot="dialog-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  assert.deepEqual(errors, [], "No application page errors");
  console.log(
    "PASS: real sheet/cell/header context menus, protected source sheets, persisted comments/dropdowns and sheet identity/order, right-click sizing/hiding/insertion, desktop and 390px unified toolbar/column controls, field filters, reversible analysis column insertion, workbook/matrix/pivot, multiline inline edits and direct Review, choice dismissal/selection, owner labels and filtering, staged requirement/SCTM edits, atomic review/apply, persisted analysis, worker formulas/undo/redo, XLSX export/import, mobile edits, lost-response recovery with one exact retry/revision/audit event, and reviewed formula transformation into a requirement.",
  );
} catch (error) {
  if (page) {
    const details = page.getByRole("button", { name: "Technical details", exact: true });
    if (await details.isVisible()) await details.click();
    await page
      .screenshot({ path: "/tmp/program-assurance-workbook-failure.png", fullPage: true })
      .catch(() => {});
    console.error((await page.locator("body").innerText()).slice(-7000));
    if (errors.length) console.error("Page errors:", errors);
    if (consoleErrors.length) console.error("Console errors:", consoleErrors);
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await workspace.cleanup();
}
