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

export { FORMULA_FUNCTIONS } from "./formula";

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

const CLOCK_WARNING =
  "Clock and random formulas are disabled in reproducible workbooks. Enter a dated input cell instead.";
function inputsFor(workbook: Workbook, warnings: Set<string>): Map<string, string> {
  const inputs = new Map<string, string>();
  workbook.sheets.forEach((sheet, index) => {
    const rows = new Map(sheet.rows.map((row, r) => [row.id, r + 1]));
    const columns = new Map(sheet.columns.map((column, c) => [column.id, c + 1]));
    for (const [rowId, cells] of Object.entries(sheet.cells))
      for (const [columnId, cell] of Object.entries(cells)) {
        if (!cell.input) continue;
        const column = sheet.columns[columns.get(columnId)! - 1]!;
        const literal =
          cell.style?.format === "text" ||
          (sheet.mode === "records" &&
            (cell.input.startsWith("=") ||
              (column.type !== "number" && column.type !== "boolean")));
        let input = literal ? `'${cell.input}` : cell.input;
        if (
          !literal &&
          input.startsWith("=") &&
          /\b(?:NOW|TODAY|RAND|RANDBETWEEN|RANDARRAY)\s*\(/i.test(
            input.replace(/"(?:[^"]|"")*"/g, '""'),
          )
        ) {
          input = "=NA()";
          warnings.add(CLOCK_WARNING);
        }
        inputs.set(`${index}:${rows.get(rowId)!}:${columns.get(columnId)!}`, input);
      }
  });
  return inputs;
}
function engineShape(workbook: Workbook): string {
  return JSON.stringify([
    workbook.id,
    workbook.sheets.map((sheet) => [
      sheet.id,
      sheet.name,
      sheet.rows.map((row) => row.id),
      sheet.columns.map((column) => column.id),
    ]),
  ]);
}
function readEngine(
  model: Model,
  workbook: Workbook,
  warnings: Set<string>,
): CalculationResult["sheets"] {
  const results: CalculationResult["sheets"] = {};
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
                display: displayNumber(value),
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
        if (result.type !== "blank") (sheetResults[rowId] ??= {})[columnId] = result;
      }
  });
  return results;
}
function renderResults(
  workbook: Workbook,
  raw: CalculationResult["sheets"],
  warnings: Set<string>,
): CalculationResult {
  const sheets = structuredClone(raw);
  for (const sheet of workbook.sheets) {
    const values = (sheets[sheet.id] ??= {});
    for (const [rowId, cells] of Object.entries(sheet.cells))
      for (const columnId of Object.keys(cells))
        (values[rowId] ??= {})[columnId] ??= { type: "blank", value: null, display: "" };
    for (const [rowId, cells] of Object.entries(values))
      for (const [columnId, cell] of Object.entries(cells))
        if (cell.type === "number")
          cell.display = displayNumber(cell.value as number, sheet.cells[rowId]?.[columnId]?.style);
  }
  return { revision: workbook.revision, engine: "ironcalc-0.8.4", sheets, warnings: [...warnings] };
}

/** A worker owns one session. Formatting-only revisions reuse values without calling the engine. */
export function createCalculationSession() {
  let model: Model | undefined;
  let shape: string | undefined;
  let inputs = new Map<string, string>();
  let raw: CalculationResult["sheets"] = {};
  let engineWarnings = new Set<string>();
  let closed = false;
  const stats = { modelBuilds: 0, evaluations: 0, changedInputs: 0, presentationOnly: 0 };
  const reset = () => {
    model?.free();
    model = undefined;
    shape = undefined;
    inputs = new Map();
    raw = {};
    engineWarnings = new Set();
  };
  return {
    get statistics() {
      return { ...stats };
    },
    calculate(workbook: Workbook): CalculationResult {
      if (closed) throw new Error("Calculation session is closed.");
      validateWorkbook(workbook);
      const warnings = new Set<string>();
      const nextInputs = inputsFor(workbook, warnings);
      const nextShape = engineShape(workbook);
      try {
        const rebuild = !model || shape !== nextShape;
        if (rebuild) {
          reset();
          model = new Model(workbook.name, "en", "UTC", "en");
          model.pauseEvaluation();
          workbook.sheets.forEach((sheet, index) => {
            if (index) model!.newSheet();
            model!.renameSheet(index, sheet.name);
          });
          shape = nextShape;
          stats.modelBuilds++;
        }
        const changes = [...new Set([...inputs.keys(), ...nextInputs.keys()])].filter(
          (key) => inputs.get(key) !== nextInputs.get(key),
        );
        if (rebuild || changes.length) {
          if (!rebuild) model!.pauseEvaluation();
          for (const key of changes) {
            const [sheet, row, column] = key.split(":").map(Number) as [number, number, number];
            model!.setUserInput(sheet, row, column, nextInputs.get(key) ?? "");
          }
          model!.resumeEvaluation();
          model!.evaluate();
          stats.evaluations++;
          stats.changedInputs += changes.length;
          engineWarnings = new Set();
          raw = readEngine(model!, workbook, engineWarnings);
        } else stats.presentationOnly++;
        inputs = nextInputs;
        for (const warning of engineWarnings) warnings.add(warning);
        return renderResults(workbook, raw, warnings);
      } catch (error) {
        reset();
        throw error;
      }
    },
    dispose() {
      reset();
      closed = true;
    },
  };
}

/** Stateless equivalence/reference path, also useful for independent imports. Initialize WASM first. */
export function calculateWorkbook(workbook: Workbook): CalculationResult {
  const session = createCalculationSession();
  try {
    return session.calculate(workbook);
  } finally {
    session.dispose();
  }
}
