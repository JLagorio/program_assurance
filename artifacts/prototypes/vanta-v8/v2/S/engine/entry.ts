// Agent S: the SCTM workbook's engine — the repo's own spreadsheet core (packages/spreadsheet-core, MIT/Apache IronCalc 0.8.4),
// bundled for the vanilla prototype. Exposes window.PA_SHEET; the WASM bytes are inlined by build-engine.mjs (window.PA_SHEET_WASM).
import {
  createWorkbook, createSheet, applyOperation, createHistory, validateWorkbook, getSheet, getCell,
  findCells, selectionStatistics, cellAddress, columnName, parseAddress, formulaSuggestions, formulaSignature,
  FORMULA_FUNCTIONS, LIMITS, serializeWorkbook, exportDelimited, parseDelimited, translateFormula, formulaReferences,
} from "@core/index";
import { initializeCalculation, createCalculationSession } from "@core/calculation";

let ready: Promise<boolean> | null = null;
function b64(s: string): Uint8Array {
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
/** Resolves true once IronCalc is instantiated, false when the page cannot run WebAssembly (the caller says so). */
function init(): Promise<boolean> {
  if (ready) return ready;
  const w = (window as unknown as { PA_SHEET_WASM?: string }).PA_SHEET_WASM;
  ready = !w ? Promise.resolve(false) : initializeCalculation(b64(w) as unknown as BufferSource).then(() => true, (e: unknown) => { console.warn("IronCalc did not start:", e); return false; });
  return ready;
}
(window as unknown as { PA_SHEET: unknown }).PA_SHEET = {
  init, createWorkbook, createSheet, applyOperation, createHistory, validateWorkbook, getSheet, getCell,
  findCells, selectionStatistics, cellAddress, columnName, parseAddress, formulaSuggestions, formulaSignature,
  FORMULA_FUNCTIONS, LIMITS, serializeWorkbook, exportDelimited, parseDelimited, translateFormula, formulaReferences,
  createCalculationSession, engine: "IronCalc 0.8.4",
};
