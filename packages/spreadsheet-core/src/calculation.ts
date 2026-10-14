import init, { Model, type InitInput } from "@ironcalc/wasm";
import {
  LIMITS,
  type CalculatedCell,
  type CalculationResult,
  type CellStyle,
  type Workbook,
} from "./types";
import { validateWorkbook } from "./workbook";

let initialization: Promise<unknown> | undefined;
export function initializeCalculation(input?: InitInput): Promise<unknown> {
  initialization ??= init(input ? { module_or_path: input } : undefined).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export const FORMULA_FUNCTIONS = [
  { name: "SUM", signature: "SUM(number1, number2, …)", description: "Add numbers or ranges." },
  {
    name: "AVERAGE",
    signature: "AVERAGE(number1, number2, …)",
    description: "Average numeric values.",
  },
  { name: "COUNT", signature: "COUNT(value1, value2, …)", description: "Count numeric cells." },
  { name: "COUNTA", signature: "COUNTA(value1, value2, …)", description: "Count populated cells." },
  {
    name: "COUNTIF",
    signature: "COUNTIF(range, criteria)",
    description: "Count cells that match a condition.",
  },
  {
    name: "COUNTIFS",
    signature: "COUNTIFS(range1, criteria1, …)",
    description: "Count cells matching several conditions.",
  },
  {
    name: "SUMIF",
    signature: "SUMIF(range, criteria, sum_range)",
    description: "Sum matching values.",
  },
  {
    name: "IF",
    signature: "IF(condition, when_true, when_false)",
    description: "Choose a value based on a condition.",
  },
  {
    name: "IFERROR",
    signature: "IFERROR(value, fallback)",
    description: "Return a fallback for a formula error.",
  },
  {
    name: "XLOOKUP",
    signature: "XLOOKUP(value, lookup_range, return_range)",
    description: "Find a related value.",
  },
  {
    name: "VLOOKUP",
    signature: "VLOOKUP(value, table, column, exact)",
    description: "Look up a value in a table.",
  },
  { name: "ROUND", signature: "ROUND(number, digits)", description: "Round a numeric result." },
  { name: "MIN", signature: "MIN(number1, number2, …)", description: "Find the smallest number." },
  { name: "MAX", signature: "MAX(number1, number2, …)", description: "Find the largest number." },
  { name: "CONCAT", signature: "CONCAT(text1, text2, …)", description: "Join text values." },
] as const;

function displayNumber(value: number, style?: CellStyle): string {
  if (style?.format === "date") {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : String(value);
  }
  if (style?.format === "currency")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: style.decimals ?? 2,
      minimumFractionDigits: style.decimals ?? 2,
    }).format(value);
  if (style?.format === "percent")
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: style.decimals ?? 1,
      minimumFractionDigits: style.decimals ?? 1,
    }).format(value);
  if (style?.format === "number" || style?.decimals !== undefined)
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: style?.decimals ?? 2,
      minimumFractionDigits: style?.decimals ?? 2,
    }).format(value);
  return String(Number(value.toPrecision(15)));
}

/** Calculation owns no persisted state. Call after WASM initialization, in a worker. */
export function calculateWorkbook(workbook: Workbook): CalculationResult {
  validateWorkbook(workbook);
  const model = new Model(workbook.name, "en", "UTC", "en");
  const warnings = new Set<string>();
  const results: CalculationResult["sheets"] = {};
  try {
    model.pauseEvaluation();
    // Create all sheet identities before parsing any cross-sheet formula.
    workbook.sheets.forEach((sheet, index) => {
      if (index) model.newSheet();
      model.renameSheet(index, sheet.name);
    });
    workbook.sheets.forEach((sheet, index) => {
      const rows = new Map(sheet.rows.map((row, r) => [row.id, r + 1]));
      const columns = new Map(sheet.columns.map((column, c) => [column.id, c + 1]));
      for (const [rowId, cells] of Object.entries(sheet.cells))
        for (const [columnId, cell] of Object.entries(cells)) {
          const column = sheet.columns[columns.get(columnId)! - 1]!;
          const literal =
            cell.style?.format === "text" ||
            (sheet.mode === "records" &&
              (cell.input.startsWith("=") ||
                (column.type !== "number" && column.type !== "boolean")));
          let input = literal && cell.input ? `'${cell.input}` : cell.input;
          // Upstream 0.8.4 has no injected clock/seed. Explicit errors make saved
          // assurance results reproducible rather than silently depending on a viewer.
          if (
            !literal &&
            input.startsWith("=") &&
            /\b(?:NOW|TODAY|RAND|RANDBETWEEN|RANDARRAY)\s*\(/i.test(
              input.replace(/"(?:[^"]|"")*"/g, '""'),
            )
          ) {
            input = "=NA()";
            warnings.add(
              "Clock and random formulas are disabled in reproducible workbooks. Enter a dated input cell instead.",
            );
          }
          model.setUserInput(index, rows.get(rowId)!, columns.get(columnId)!, input);
        }
    });
    model.resumeEvaluation();
    model.evaluate();
    let visited = 0;
    workbook.sheets.forEach((sheet, index) => {
      const sheetResults: CalculationResult["sheets"][string] = {};
      results[sheet.id] = sheetResults;
      const rowIndices = new Map(sheet.rows.map((row, r) => [row.id, r + 1]));
      const columnIndices = new Map(sheet.columns.map((column, c) => [column.id, c + 1]));
      // Inspect existing engine rows by column to include spilled array results.
      const occupied = new Map<number, Set<number>>();
      for (let column = 1; column <= sheet.columns.length; column++) {
        for (const row of model.getRowsWithData(index, column)) {
          if (row <= sheet.rows.length) {
            const set = occupied.get(row) ?? new Set<number>();
            set.add(column);
            occupied.set(row, set);
          }
        }
      }
      // Some engine versions expose array outputs without materialized cells.
      for (const [rowId, cells] of Object.entries(sheet.cells)) {
        const row = rowIndices.get(rowId)!;
        for (const columnId of Object.keys(cells)) {
          const column = columnIndices.get(columnId)!;
          const set = occupied.get(row) ?? new Set<number>();
          set.add(column);
          occupied.set(row, set);
          const structure = model.getCellArrayStructure(index, row, column);
          if (
            typeof structure === "object" &&
            ("DynamicAnchor" in structure || "ArrayAnchor" in structure)
          ) {
            const [width, height] =
              "DynamicAnchor" in structure ? structure.DynamicAnchor : structure.ArrayAnchor;
            if (row + height - 1 > sheet.rows.length || column + width - 1 > sheet.columns.length)
              warnings.add(
                "An array spills beyond this sheet's allocated grid. Add rows or columns to see the full result.",
              );
            if (height * width > LIMITS.cells) {
              warnings.add("An array result exceeds the supported output size.");
              continue;
            }
            for (let r = row; r < Math.min(row + height, sheet.rows.length + 1); r++)
              for (let c = column; c < Math.min(column + width, sheet.columns.length + 1); c++) {
                const target = occupied.get(r) ?? new Set<number>();
                target.add(c);
                occupied.set(r, target);
              }
          }
        }
      }
      for (const [r, columns] of occupied)
        for (const c of columns) {
          if (++visited > LIMITS.cells) throw new Error("Calculation produced too many cells.");
          const rowId = sheet.rows[r - 1]!.id;
          const columnId = sheet.columns[c - 1]!.id;
          const display = model.getFormattedCellValue(index, r, c);
          const type = model.getCellType(index, r, c);
          let result: CalculatedCell;
          // IronCalc's TYPE-compatible API reports empty cells as numeric. Keep
          // the empty formatted value distinct from a genuine numeric zero.
          if (display === "") result = { type: "blank", value: null, display: "" };
          else if (type === 16) {
            result = { type: "error", value: display, display, error: display };
            warnings.add(
              "Some formulas returned errors. Inspect the marked cells before using this result.",
            );
          } else if (type === 4)
            result = { type: "boolean", value: display.toUpperCase() === "TRUE", display };
          else if (type === 1) {
            // The published binding exposes only formatted numbers. Ask it for a
            // precision-preserving scientific representation before UI formatting.
            model.updateRangeStyle(
              { sheet: index, row: r, column: c, width: 1, height: 1 },
              "num_fmt",
              "0.00000000000000E+00",
            );
            const value = Number(model.getFormattedCellValue(index, r, c));
            result = Number.isFinite(value)
              ? {
                  type: "number",
                  value,
                  display: displayNumber(value, sheet.cells[rowId]?.[columnId]?.style),
                }
              : {
                  type: "error",
                  value: "#NUM!",
                  display: "#NUM!",
                  error: "The engine returned an unreadable number.",
                };
          } else
            result = display
              ? { type: "text", value: display, display }
              : { type: "blank", value: null, display: "" };
          (sheetResults[rowId] ??= {})[columnId] = result;
        }
    });
    return {
      revision: workbook.revision,
      engine: "ironcalc-0.8.4",
      sheets: results,
      warnings: [...warnings],
    };
  } finally {
    model.free();
  }
}
