import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import {
  applyOperation,
  createSheet,
  createWorkbook,
  deserializeWorkbook,
  serializeWorkbook,
} from "./workbook";
import { calculateWorkbook, createCalculationSession, initializeCalculation } from "./calculation";
import { applyCalculationDelta, createCalculationDelta } from "./calculation-update";
import { conditionalCellStyle } from "./conditional";
import { findCells, replaceMatches, selectionStatistics } from "./analysis";
import { formulaSignature, formulaSuggestions } from "./formula";
import { formulaReferences } from "./address";
import { exportXlsx, importXlsx } from "./xlsx";
import type { ConditionalCondition, ConditionalFormatRule } from "./types";

beforeAll(async () => {
  const bytes = readFileSync(createRequire(import.meta.url).resolve("@ironcalc/wasm/wasm_bg.wasm"));
  await initializeCalculation(new Uint8Array(bytes).buffer);
});
function fixture() {
  const sheet = createSheet("Analysis", { rows: 6, columns: 5 });
  const workbook = createWorkbook("Checks", [sheet]);
  const rows = sheet.rows.map((row) => row.id),
    columns = sheet.columns.map((column) => column.id);
  return { sheet: workbook.sheets[0]!, workbook, rows, columns };
}

describe("retained calculation", () => {
  it("matches fresh evaluation after edits, cleared spills, text conversions, and structure changes", () => {
    const { sheet, rows, columns } = fixture();
    let workbook = createWorkbook("Retained", [sheet]);
    const session = createCalculationSession();
    const check = () => expect(session.calculate(workbook)).toEqual(calculateWorkbook(workbook));
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: sheet.id,
      start: { row: 0, column: 0 },
      values: [["2", "=A1*3"], ["=SEQUENCE(2,2)"]],
    });
    check();
    workbook = applyOperation(workbook, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: rows[0]!, columnId: columns[0]!, value: "4" }],
    });
    check();
    workbook = applyOperation(workbook, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: rows[1]!, columnId: columns[0]!, value: "" }],
    });
    check();
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
      style: { format: "text" },
    });
    check();
    workbook = applyOperation(workbook, {
      type: "insert-rows",
      sheetId: sheet.id,
      index: 0,
      count: 1,
    });
    check();
    expect(session.statistics.modelBuilds).toBe(2);
    session.dispose();
    expect(() => session.calculate(workbook)).toThrow("closed");
  });
  it("does not evaluate for presentation changes but refreshes numeric display and blank styling", () => {
    const { sheet, rows, columns, workbook: initial } = fixture();
    const session = createCalculationSession();
    let workbook = applyOperation(initial, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: rows[0]!, columnId: columns[0]!, value: "0.125" }],
    });
    session.calculate(workbook);
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range: { start: { row: 0, column: 0 }, end: { row: 1, column: 1 } },
      style: { format: "percent", decimals: 2, bold: true },
    });
    const result = session.calculate(workbook);
    expect(result.sheets[sheet.id]![rows[0]!]![columns[0]!]!.display).toBe("12.50%");
    expect(result.sheets[sheet.id]![rows[1]!]![columns[1]!]!.type).toBe("blank");
    expect(result).toEqual(calculateWorkbook(workbook));
    expect(session.statistics).toEqual({
      modelBuilds: 1,
      evaluations: 1,
      changedInputs: 1,
      presentationOnly: 1,
    });
    session.dispose();
  });
  it("deltas retain metadata and deletions, reject incorrect bases, and fall back for changed axes", () => {
    const { sheet, rows, columns, workbook } = fixture();
    const next = applyOperation(workbook, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: rows[0]!, columnId: columns[0]!, value: "42" }],
    });
    const delta = createCalculationDelta(workbook, next)!;
    expect(delta.sheets[0]!.cells).toHaveLength(1);
    expect(applyCalculationDelta(workbook, delta)).toEqual(next);
    expect(() => applyCalculationDelta({ ...workbook, revision: 99 }, delta)).toThrow();
    const cleared = structuredClone(next);
    delete cleared.sheets[0]!.cells[rows[0]!];
    cleared.revision++;
    expect(applyCalculationDelta(next, createCalculationDelta(next, cleared)!)).toEqual(cleared);
    const inserted = applyOperation(next, {
      type: "insert-columns",
      sheetId: sheet.id,
      index: 0,
      count: 1,
    });
    expect(createCalculationDelta(next, inserted)).toBeUndefined();
  });
});

describe("atomic rich paste", () => {
  it("uses explicit destination IDs and replaces styles without changing destination notes/validation", () => {
    const { sheet, rows, columns, workbook } = fixture();
    sheet.rows[1]!.hidden = true;
    sheet.cells[rows[2]!] = {
      [columns[2]!]: { input: "old", style: { italic: true }, comment: "keep" },
    };
    const next = applyOperation(workbook, {
      type: "paste-cells",
      sheetId: sheet.id,
      mode: "all",
      edits: [{ rowId: rows[2]!, columnId: columns[2]!, value: "=A1" }],
      styles: [{ rowId: rows[2]!, columnId: columns[2]!, style: { bold: true } }],
    });
    expect(next.sheets[0]!.cells[rows[2]!]![columns[2]!]).toEqual({
      input: "=A1",
      style: { bold: true },
      comment: "keep",
    });
    expect(next.sheets[0]!.cells[rows[1]!]).toBeUndefined();
    expect(workbook.sheets[0]!.cells[rows[2]!]![columns[2]!]!.input).toBe("old");
  });
  it("preserves literal text during formatting-only paste and rejects protected value batches atomically", () => {
    const { sheet, rows, columns, workbook } = fixture();
    sheet.cells[rows[0]!] = {
      [columns[0]!]: { input: "=1+2", style: { format: "text", bold: true } },
    };
    const formatted = applyOperation(workbook, {
      type: "paste-cells",
      sheetId: sheet.id,
      mode: "formatting",
      edits: [],
      styles: [{ rowId: rows[0]!, columnId: columns[0]!, style: null }],
    });
    expect(formatted.sheets[0]!.cells[rows[0]!]![columns[0]!]!.style).toEqual({ format: "text" });
    expect(calculateWorkbook(formatted).sheets[sheet.id]![rows[0]!]![columns[0]!]!.value).toBe(
      "=1+2",
    );
    sheet.columns[1]!.readonly = true;
    expect(() =>
      applyOperation(workbook, {
        type: "paste-cells",
        sheetId: sheet.id,
        mode: "all",
        edits: [
          { rowId: rows[0]!, columnId: columns[0]!, value: "changed" },
          { rowId: rows[0]!, columnId: columns[1]!, value: "blocked" },
        ],
        styles: [{ rowId: rows[0]!, columnId: columns[0]!, style: { italic: true } }],
      }),
    ).toThrow();
    expect(sheet.cells[rows[0]!]![columns[0]!]!.input).toBe("=1+2");
  });
});

describe("paste value interpretation", () => {
  it("applies all-mode literal plans against replacement styles without adding visible quotes", () => {
    const { sheet, rows, columns, workbook } = fixture();
    sheet.cells[rows[0]!] = { [columns[0]!]: { input: "old", style: { format: "text" } } };
    const next = applyOperation(workbook, {
      type: "paste-cells",
      sheetId: sheet.id,
      mode: "all",
      edits: [
        { rowId: rows[0]!, columnId: columns[0]!, value: "=1+2" },
        { rowId: rows[0]!, columnId: columns[1]!, value: "=1+2" },
      ],
      styles: [
        { rowId: rows[0]!, columnId: columns[0]!, style: null },
        { rowId: rows[0]!, columnId: columns[1]!, style: { format: "text" } },
      ],
    });
    const values = calculateWorkbook(next).sheets[sheet.id]![rows[0]!]!;
    expect(values[columns[0]!]!.value).toBe(3);
    expect(values[columns[1]!]!.value).toBe("=1+2");
    const formatted = applyOperation(next, {
      type: "paste-cells",
      sheetId: sheet.id,
      mode: "formatting",
      edits: [],
      styles: [{ rowId: rows[0]!, columnId: columns[0]!, style: { format: "text", italic: true } }],
    });
    expect(calculateWorkbook(formatted).sheets[sheet.id]![rows[0]!]![columns[0]!]!.value).toBe(3);
  });
  it("allows safe source appearance while rejecting copied type overrides and protected values", () => {
    const sheet = createSheet("Source", { rows: 2, columns: 2, mode: "records" });
    sheet.columns[0]!.readonly = true;
    sheet.columns[0]!.type = "text";
    sheet.cells[sheet.rows[0]!.id] = { [sheet.columns[0]!.id]: { input: "=not a formula" } };
    const workbook = createWorkbook("Source", [sheet]);
    const styles = [
      { rowId: sheet.rows[0]!.id, columnId: sheet.columns[0]!.id, style: { bold: true } },
    ];
    const styled = applyOperation(workbook, {
      type: "paste-cells",
      sheetId: sheet.id,
      mode: "formatting",
      edits: [],
      styles,
    });
    expect(styled.sheets[0]!.cells[sheet.rows[0]!.id]![sheet.columns[0]!.id]!.input).toBe(
      "=not a formula",
    );
    expect(() =>
      applyOperation(workbook, {
        type: "paste-cells",
        sheetId: sheet.id,
        mode: "formatting",
        edits: [],
        styles: [{ ...styles[0]!, style: { format: "number" } }],
      }),
    ).toThrow("Source field types");
  });
});

describe("safe conditional formatting", () => {
  it("applies typed values in order, normalizes deleted axes, remaps duplicate IDs and round-trips JSON", () => {
    const { sheet, rows, columns, workbook } = fixture();
    const rules: ConditionalFormatRule[] = [
      {
        id: "large",
        rowIds: [rows[0]!, rows[1]!],
        columnIds: [columns[0]!],
        condition: { kind: "number", operator: "gte", value: 5 },
        style: { bold: true, color: "#123456" },
      },
      {
        id: "override",
        rowIds: [rows[0]!],
        columnIds: [columns[0]!],
        condition: { kind: "number", operator: "gt", value: 7 },
        style: { bold: false },
      },
    ];
    let next = applyOperation(workbook, {
      type: "set-conditional-formats",
      sheetId: sheet.id,
      rules,
    });
    expect(
      conditionalCellStyle(next.sheets[0]!, rows[0]!, columns[0]!, {
        type: "number",
        value: 8,
        display: "8",
      }),
    ).toEqual({ bold: false, color: "#123456" });
    expect(
      conditionalCellStyle(next.sheets[0]!, rows[0]!, columns[0]!, {
        type: "text",
        value: "8",
        display: "8",
      }),
    ).toEqual({});
    expect(deserializeWorkbook(serializeWorkbook(next))).toEqual(next);
    next = applyOperation(next, { type: "duplicate-sheet", sheetId: sheet.id, name: "Copy" });
    const copy = next.sheets[1]!;
    expect(copy.conditionalFormats![0]!.rowIds).toEqual(copy.rows.slice(0, 2).map((row) => row.id));
    expect(copy.conditionalFormats![0]!.id).not.toBe("large");
    next = applyOperation(next, { type: "delete-rows", sheetId: sheet.id, index: 0, count: 1 });
    expect(next.sheets[0]!.conditionalFormats).toHaveLength(1);
    expect(next.sheets[0]!.conditionalFormats![0]!.rowIds).toEqual([rows[1]!]);
    expect(() =>
      applyOperation(workbook, {
        type: "set-conditional-formats",
        sheetId: sheet.id,
        rules: [{ ...rules[0]!, style: { format: "text" } as never }],
      }),
    ).toThrow();
  });
  it("round-trips the supported conditional conditions, noncontiguous scopes and visual styles through XLSX", async () => {
    const { sheet, rows, columns, workbook } = fixture();
    const conditions: ConditionalCondition[] = [
      { kind: "number", operator: "gte", value: 4.5 },
      { kind: "text", operator: "contains", value: 'a*?~"b', caseSensitive: false },
      { kind: "text", operator: "contains", value: "Case", caseSensitive: true },
      { kind: "text", operator: "equals", value: 'a"b', caseSensitive: false },
      { kind: "text", operator: "equals", value: "EXACT", caseSensitive: true },
      { kind: "blank", isBlank: true },
      { kind: "blank", isBlank: false },
    ];
    const rules = conditions.map((condition, index) => ({
      id: `rule-${index}`,
      rowIds: [rows[0]!, rows[2]!],
      columnIds: [columns[0]!, columns[2]!],
      condition,
      style: {
        bold: true,
        italic: true,
        color: "#123456",
        background: "#ABCDEF",
        wrap: true,
        verticalAlign: "top" as const,
      },
    }));
    const next = applyOperation(workbook, {
      type: "set-conditional-formats",
      sheetId: sheet.id,
      rules,
    });
    const imported = await importXlsx(await exportXlsx(next));
    expect(imported.warnings.join(" ")).not.toContain("Unsupported Excel conditional");
    const restored = imported.workbook.sheets[0]!;
    expect(restored.conditionalFormats?.map((rule) => rule.condition)).toEqual(conditions);
    expect(restored.conditionalFormats?.map((rule) => rule.style)).toEqual(
      rules.map((rule) => rule.style),
    );
    expect(restored.conditionalFormats?.[0]?.rowIds).toEqual([
      restored.rows[0]!.id,
      restored.rows[2]!.id,
    ]);
  });
});

describe("conditional XLSX bounds and fidelity", () => {
  it("preserves scoped empty cells beyond the populated extent and rejects lossy false font rules", async () => {
    const sheet = createSheet("Empty scope", { rows: 50, columns: 12 });
    sheet.conditionalFormats = [
      {
        id: "empty",
        rowIds: [sheet.rows[49]!.id],
        columnIds: [sheet.columns[11]!.id],
        condition: { kind: "blank", isBlank: true },
        style: { background: "#ABCDEF" },
      },
    ];
    const workbook = createWorkbook("Empty rules", [sheet]);
    const imported = await importXlsx(await exportXlsx(workbook));
    const restored = imported.workbook.sheets[0]!;
    expect(restored.rows).toHaveLength(50);
    expect(restored.columns).toHaveLength(12);
    expect(restored.conditionalFormats?.[0]?.rowIds).toEqual([restored.rows[49]!.id]);
    workbook.sheets[0]!.conditionalFormats![0]!.style.bold = false;
    await expect(exportXlsx(workbook)).rejects.toThrow("clear font emphasis");
  });
});

describe("workbook search, summaries and formula assistance", () => {
  it("finds literal input in order and replaces all matches atomically without regex replacement expansion", () => {
    const { sheet, rows, columns, workbook } = fixture();
    let next = applyOperation(workbook, {
      type: "paste",
      sheetId: sheet.id,
      start: { row: 0, column: 0 },
      values: [
        ["Risk.* risk.*", "3"],
        ["risk.*", "=1+2"],
      ],
    });
    const found = findCells(next, { query: "risk.*" }).matches;
    expect(found.map((match) => match.address)).toEqual(["A1", "A2"]);
    const replaced = replaceMatches(next, found, "risk.*", "$&\nnew");
    expect(replaced.revision).toBe(next.revision + 1);
    expect(replaced.sheets[0]!.cells[rows[0]!]![columns[0]!]!.input).toBe("$&\nnew $&\nnew");
    next = applyOperation(next, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: rows[1]!, columnId: columns[0]!, value: "changed" }],
    });
    expect(() => replaceMatches(next, found, "risk.*", "gone")).toThrow("Find again");
    const results = calculateWorkbook(next);
    const stats = selectionStatistics(
      next.sheets[0]!,
      rows.slice(0, 2),
      columns.slice(0, 2),
      results,
    );
    expect(stats).toMatchObject({
      cells: 4,
      nonEmpty: 4,
      numbers: 2,
      sum: 6,
      average: 3,
      min: 3,
      max: 3,
      errors: 0,
    });
    expect(() =>
      replaceMatches(
        next,
        findCells(next, { query: "3", searchIn: "display" }, results).matches,
        "3",
        "4",
      ),
    ).toThrow("authored input");
  });
  it("does not suggest inside quoted literals and reports nested signature arguments and reference spans", () => {
    expect(formulaSuggestions("=SU").map((fn) => fn.name)).toEqual(["SUM", "SUMIF"]);
    expect(formulaSuggestions('=IF(A1,"SU')).toEqual([]);
    expect(formulaSignature('=IF(SUM(A1,B1)>0,"a,b",')).toMatchObject({ name: "IF", argument: 2 });
    const input = "=SUM('Risk log'!$B$2:C4,\"A1\",D5)";
    const refs = formulaReferences(input);
    expect(refs.map((ref) => ref.text)).toEqual(["'Risk log'!$B$2:C4", "D5"]);
    expect(refs[0]).toMatchObject({
      sheet: "Risk log",
      range: { start: { row: 1, column: 1 }, end: { row: 3, column: 2 } },
    });
    for (const ref of refs) expect(input.slice(ref.start, ref.end)).toBe(ref.text);
  });
});
