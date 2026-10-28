import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

const baseUrl = process.env.APP_TEST_URL ?? process.env.APP_BASE_URL ?? "http://localhost:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname));
const browserName = process.env.BROWSER ?? "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
assert.ok(browserType, "BROWSER must be chromium, firefox, or webkit");
const browser = await browserType.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route("**/__spreadsheet_worker_check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Spreadsheet worker check</title>",
    }),
  );
  await page.goto(`${baseUrl}/__spreadsheet_worker_check`);
  const result = await page.evaluate(async () => {
    const core = await import("/packages/spreadsheet-core/src/index.ts");
    const { createCalculationClient } =
      await import("/packages/spreadsheet-core/src/worker-client.ts");
    const { createWorkbookFileClient } =
      await import("/packages/spreadsheet-core/src/file-client.ts");
    let workbook = core.createWorkbook("Browser smoke");
    const sheet = workbook.sheets[0];
    workbook = core.applyOperation(workbook, {
      type: "paste",
      sheetId: sheet.id,
      start: { row: 0, column: 0 },
      values: [["2", "3", "=SUM(A1:B1)"]],
    });
    const calculator = createCalculationClient();
    const files = createWorkbookFileClient();
    try {
      const values = await calculator.calculate(workbook);
      const sum = values.sheets[sheet.id][sheet.rows[0].id][sheet.columns[2].id].value;
      workbook = core.applyOperation(workbook, {
        type: "edit",
        sheetId: sheet.id,
        edits: [{ rowId: sheet.rows[0].id, columnId: sheet.columns[0].id, value: "4" }],
      });
      const updated = await calculator.calculate(workbook);
      const deltaSum = updated.sheets[sheet.id][sheet.rows[0].id][sheet.columns[2].id].value;
      workbook = core.applyOperation(workbook, {
        type: "format",
        sheetId: sheet.id,
        range: { start: { row: 0, column: 2 }, end: { row: 0, column: 2 } },
        style: { format: "currency", decimals: 2 },
      });
      const formatted = await calculator.calculate(workbook);
      const formattedDisplay =
        formatted.sheets[sheet.id][sheet.rows[0].id][sheet.columns[2].id].display;
      const cancelled = calculator.calculate(workbook).catch((error) => error.name);
      calculator.cancel();
      const cancellation = await cancelled;
      const recovered = await calculator.calculate(workbook);
      const recoveredSum = recovered.sheets[sheet.id][sheet.rows[0].id][sheet.columns[2].id].value;
      workbook = core.applyOperation(workbook, {
        type: "set-conditional-formats",
        sheetId: sheet.id,
        rules: [
          {
            id: "highlight-sum",
            rowIds: [sheet.rows[0].id],
            columnIds: [sheet.columns[2].id],
            condition: { kind: "number", operator: "gte", value: 6 },
            style: { background: "#FFF0AA" },
          },
        ],
      });
      const current = await calculator.calculate(workbook);
      const bytes = await files.exportXlsx(workbook, current);
      const imported = await files.importXlsx(bytes, "Browser round trip");
      const importedValues = await calculator.calculate(imported.workbook);
      const importedSheet = imported.workbook.sheets[0];
      const roundTrip =
        importedValues.sheets[importedSheet.id][importedSheet.rows[0].id][
          importedSheet.columns[2].id
        ].value;
      return {
        sum,
        deltaSum,
        formattedDisplay,
        cancellation,
        recoveredSum,
        roundTrip,
        conditionalRules: importedSheet.conditionalFormats?.length,
        bytes: bytes.length,
        warnings: imported.warnings,
      };
    } finally {
      calculator.dispose();
      files.dispose();
    }
  });
  assert.equal(result.sum, 5);
  assert.equal(result.deltaSum, 7);
  assert.equal(result.formattedDisplay, "$7.00");
  assert.equal(result.cancellation, "SupersededCalculationError");
  assert.equal(result.recoveredSum, 7);
  assert.equal(result.roundTrip, 7);
  assert.equal(result.conditionalRules, 1);
  assert.ok(result.bytes > 1000);
  assert.ok(result.warnings.length > 0);
  console.log(
    `Spreadsheet browser workers passed (${browserName}): retained deltas, presentation-only number formatting, cancel/recovery, XLSX conditional rule export/import and recalculation.`,
  );
} finally {
  await browser.close();
}
