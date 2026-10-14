export const LIMITS = {
  sheets: 32,
  rows: 20_000,
  columns: 256,
  cells: 200_000,
  edits: 20_000,
  inputLength: 10_000,
  clipboardBytes: 2_000_000,
  snapshotBytes: 20_000_000,
  xlsxBytes: 10_000_000,
} as const;

export type RecordBinding = { recordId: string; fieldId: string; revision?: string };
export type CellBorder = { style: "solid" | "dashed" | "dotted"; color: string; width: 1 | 2 | 3 };
/** Border presets use the visible selection's outer and shared inner edges. */
export type BorderPreset =
  "all" | "outside" | "inside" | "top" | "right" | "bottom" | "left" | "none";
export type CellValidation = { type: "list"; options: string[]; allowBlank?: boolean };
export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number;
  borderTop?: CellBorder;
  borderRight?: CellBorder;
  borderBottom?: CellBorder;
  borderLeft?: CellBorder;
  color?: string;
  background?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  wrap?: boolean;
  format?: "general" | "number" | "currency" | "percent" | "date" | "text";
  decimals?: number;
};
export type Cell = {
  input: string;
  style?: CellStyle;
  binding?: RecordBinding;
  comment?: string;
  validation?: CellValidation;
};
export type SheetRow = {
  id: string;
  recordId?: string;
  revision?: string;
  readonly?: boolean;
  hidden?: boolean;
  height?: number;
};
export type SheetColumn = {
  id: string;
  name: string;
  fieldId?: string;
  type?: "text" | "number" | "date" | "boolean" | "select";
  options?: string[];
  readonly?: boolean;
  required?: boolean;
  width?: number;
  hidden?: boolean;
};
export type Sheet = {
  id: string;
  name: string;
  mode: "freeform" | "records";
  rows: SheetRow[];
  columns: SheetColumn[];
  cells: Record<string, Record<string, Cell>>;
  frozenRows: number;
  frozenColumns: number;
};
export type Workbook = {
  version: 1;
  id: string;
  name: string;
  revision: number;
  sheets: Sheet[];
};
export type CellEdit = { rowId: string; columnId: string; value: string };
export type Position = { row: number; column: number };
export type CellRange = { start: Position; end: Position };
export type CalculatedCell = {
  type: "blank" | "text" | "number" | "boolean" | "error";
  value: string | number | boolean | null;
  display: string;
  error?: string;
};
export type CalculationResult = {
  revision: number;
  sheets: Record<string, Record<string, Record<string, CalculatedCell>>>;
  engine: "ironcalc-0.8.4";
  warnings: string[];
};
export type WorkbookOperation =
  | { type: "edit"; sheetId: string; edits: CellEdit[] }
  | { type: "paste"; sheetId: string; start: Position; values: string[][] }
  | { type: "fill"; sheetId: string; source: CellRange; target: CellRange; series?: boolean }
  | { type: "format"; sheetId: string; range: CellRange; style: CellStyle; visibleOnly?: boolean }
  | {
      type: "borders";
      sheetId: string;
      range: CellRange;
      /** All/outside/inside/none replace borders; individual sides add an outer edge. */
      preset: BorderPreset;
      /** Required except when clearing borders. */
      border?: CellBorder;
      visibleOnly?: boolean;
    }
  | {
      type: "set-comment";
      sheetId: string;
      rowId: string;
      columnId: string;
      comment: string | null;
    }
  | { type: "set-validation"; sheetId: string; range: CellRange; validation: CellValidation | null }
  | { type: "clear-formatting"; sheetId: string; range: CellRange; visibleOnly?: boolean }
  | { type: "set-rows-hidden"; sheetId: string; rowIds: string[]; hidden: boolean }
  | { type: "set-columns-hidden"; sheetId: string; columnIds: string[]; hidden: boolean }
  | { type: "resize-row"; sheetId: string; rowId: string; height: number }
  | { type: "clear"; sheetId: string; range: CellRange; formatting?: boolean }
  | { type: "add-sheet"; sheet?: Sheet; name?: string }
  | { type: "rename-sheet"; sheetId: string; name: string }
  | { type: "delete-sheet"; sheetId: string }
  | { type: "duplicate-sheet"; sheetId: string; name?: string }
  | { type: "move-sheet"; sheetId: string; index: number }
  | {
      type: "insert-rows" | "delete-rows" | "insert-columns" | "delete-columns";
      sheetId: string;
      index: number;
      count: number;
    }
  | { type: "freeze"; sheetId: string; rows: number; columns: number }
  | { type: "resize-column"; sheetId: string; columnId: string; width: number };
