import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { calculateWorkbook, initializeCalculation } from "./calculation";
import { applyOperation, createSheet, createWorkbook } from "./workbook";

beforeAll(async () => {
  const buffer = readFileSync(
    createRequire(import.meta.url).resolve("@ironcalc/wasm/wasm_bg.wasm"),
  );
  await initializeCalculation(new Uint8Array(buffer).buffer);
});

describe("upstream IronCalc adapter", () => {
  it("calculates cross-sheet SUMIF/IF/COUNTIF, numeric precision, errors and array spills", () => {
    const source = createSheet("Source", { rows: 5, columns: 4 });
    const analysis = createSheet("Analysis", { rows: 5, columns: 5 });
    let workbook = createWorkbook("Calculation", [source, analysis]);
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: source.id,
      start: { row: 0, column: 0 },
      values: [
        ["open", "2"],
        ["closed", "3"],
        ["open", "5"],
      ],
    });
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: analysis.id,
      start: { row: 0, column: 0 },
      values: [
        [
          '=SUMIF(Source!A1:A3,"open",Source!B1:B3)',
          '=COUNTIF(Source!A1:A3,"open")',
          '=IF(A1=7,"pass","fail")',
        ],
        ["=1/0", "=0.1+0.2"],
        ["=SEQUENCE(2,3)"],
      ],
    });
    const result = calculateWorkbook(workbook);
    const cells = result.sheets[analysis.id]!;
    expect(cells[analysis.rows[0]!.id]![analysis.columns[0]!.id]!.value).toBe(7);
    expect(cells[analysis.rows[0]!.id]![analysis.columns[1]!.id]!.value).toBe(2);
    expect(cells[analysis.rows[0]!.id]![analysis.columns[2]!.id]!.value).toBe("pass");
    expect(cells[analysis.rows[1]!.id]![analysis.columns[0]!.id]!.type).toBe("error");
    expect(cells[analysis.rows[1]!.id]![analysis.columns[1]!.id]!.value).toBeCloseTo(0.3, 14);
    expect(cells[analysis.rows[3]!.id]![analysis.columns[2]!.id]!.value).toBe(6);
  });
  it("keeps source records literal, and disables clock and random formulas explicitly", () => {
    const records = createSheet("Requirements", { rows: 2, columns: 2, mode: "records" });
    records.columns[0]!.type = "text";
    records.columns[1]!.type = "number";
    records.cells[records.rows[0]!.id] = {
      [records.columns[0]!.id]: { input: "=SUM(1,2)" },
      [records.columns[1]!.id]: { input: "12" },
    };
    records.cells[records.rows[1]!.id] = {
      [records.columns[0]!.id]: { input: "" },
      [records.columns[1]!.id]: { input: "0" },
    };
    const analysis = createSheet("Analysis", { rows: 2, columns: 2 });
    analysis.cells[analysis.rows[0]!.id] = {
      [analysis.columns[0]!.id]: { input: "=TODAY()" },
      [analysis.columns[1]!.id]: { input: '=IF(TRUE,"RAND()","other")' },
    };
    const result = calculateWorkbook(createWorkbook("Literal safety", [records, analysis]));
    expect(result.sheets[records.id]![records.rows[0]!.id]![records.columns[0]!.id]!.value).toBe(
      "=SUM(1,2)",
    );
    expect(result.sheets[records.id]![records.rows[0]!.id]![records.columns[1]!.id]!.value).toBe(
      12,
    );
    expect(result.sheets[analysis.id]![analysis.rows[0]!.id]![analysis.columns[0]!.id]!.type).toBe(
      "error",
    );
    expect(result.sheets[analysis.id]![analysis.rows[0]!.id]![analysis.columns[1]!.id]!.value).toBe(
      "RAND()",
    );
    expect(result.warnings.join(" ")).toContain("Clock");
    expect(result.sheets[records.id]![records.rows[1]!.id]![records.columns[0]!.id]).toEqual({
      type: "blank",
      value: null,
      display: "",
    });
    expect(result.sheets[records.id]![records.rows[1]!.id]![records.columns[1]!.id]!.value).toBe(0);
  });
});
