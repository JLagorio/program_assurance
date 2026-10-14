import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.APP_TEST_URL ?? process.env.APP_BASE_URL ?? "http://localhost:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname));
const browser = await chromium.launch({ headless: true });
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
      const bytes = await files.exportXlsx(workbook, values);
      const imported = await files.importXlsx(bytes, "Browser round trip");
      const importedValues = await calculator.calculate(imported.workbook);
      const importedSheet = imported.workbook.sheets[0];
      const roundTrip =
        importedValues.sheets[importedSheet.id][importedSheet.rows[0].id][
          importedSheet.columns[2].id
        ].value;
      return { sum, roundTrip, bytes: bytes.length, warnings: imported.warnings };
    } finally {
      calculator.dispose();
      files.dispose();
    }
  });
  assert.equal(result.sum, 5);
  assert.equal(result.roundTrip, 5);
  assert.ok(result.bytes > 1000);
  assert.ok(result.warnings.length > 0);
  console.log(
    "Spreadsheet browser workers passed: calculation, XLSX export/import, recalculation.",
  );
} finally {
  await browser.close();
}
