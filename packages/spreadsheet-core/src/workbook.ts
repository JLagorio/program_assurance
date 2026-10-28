import { normalizeConditionalFormats, validateConditionalFormats } from "./conditional";
import {
  columnName,
  hasUnrewritableReferences,
  normalizeRange,
  rangePositions,
  renameFormulaSheet,
  shiftFormulaAxis,
  translateFormula,
} from "./address";
import {
  LIMITS,
  type Cell,
  type CellEdit,
  type CellRange,
  type CellStyle,
  type CellValidation,
  type Position,
  type Sheet,
  type SheetColumn,
  type Workbook,
  type WorkbookOperation,
} from "./types";

export function newId(prefix = "id"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
const clone = <T>(value: T): T => structuredClone(value);
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;

export function createSheet(
  name = "Sheet 1",
  options: { rows?: number; columns?: number; mode?: Sheet["mode"] } = {},
): Sheet {
  const rows = options.rows ?? 100;
  const columns = options.columns ?? 26;
  checkCount(rows, LIMITS.rows, "rows");
  checkCount(columns, LIMITS.columns, "columns");
  validateSheetName(name);
  return {
    id: newId("sheet"),
    name,
    mode: options.mode ?? "freeform",
    rows: Array.from({ length: rows }, () => ({ id: newId("row") })),
    columns: Array.from({ length: columns }, (_, index) => ({
      id: newId("column"),
      name: columnName(index),
      width: 140,
    })),
    cells: {},
    frozenRows: 0,
    frozenColumns: 0,
  };
}

export function createWorkbook(
  name = "Untitled workbook",
  sheets: Sheet[] = [createSheet()],
): Workbook {
  const workbook: Workbook = {
    version: 1,
    id: newId("workbook"),
    name,
    revision: 0,
    sheets: clone(sheets),
  };
  validateWorkbook(workbook);
  return workbook;
}

export function getSheet(workbook: Workbook, sheetId: string): Sheet {
  const sheet = workbook.sheets.find((item) => item.id === sheetId);
  if (!sheet) throw new Error("This sheet is no longer in the workbook.");
  return sheet;
}

export function getCell(sheet: Sheet, rowId: string, columnId: string): Cell | undefined {
  return sheet.cells[rowId]?.[columnId];
}
export function cellAt(sheet: Sheet, position: Position): Cell | undefined {
  const row = sheet.rows[position.row];
  const column = sheet.columns[position.column];
  return row && column ? getCell(sheet, row.id, column.id) : undefined;
}

function checkCount(count: number, max: number, label: string): void {
  if (!Number.isInteger(count) || count < 1 || count > max)
    throw new Error(`Choose between 1 and ${max.toLocaleString()} ${label}.`);
}

export function validateSheetName(name: string, sheets: Sheet[] = [], ownId?: string): void {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 31 ||
    Array.from(name).some(
      (character) => "\\/?*[]:".includes(character) || character.charCodeAt(0) < 32,
    ) ||
    name.startsWith("'") ||
    name.endsWith("'")
  ) {
    throw new Error("Sheet names need 1–31 characters without : \\ / ? * [ ].");
  }
  if (sheets.some((sheet) => sheet.id !== ownId && sheet.name.toLowerCase() === name.toLowerCase()))
    throw new Error("A sheet already has that name.");
}

export function validateStyle(style: CellStyle): void {
  if (!style || typeof style !== "object" || Array.isArray(style))
    throw new Error("Invalid cell style.");
  const allowed = new Set([
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "fontFamily",
    "fontSize",
    "borderTop",
    "borderRight",
    "borderBottom",
    "borderLeft",
    "color",
    "background",
    "align",
    "verticalAlign",
    "wrap",
    "format",
    "decimals",
  ]);
  if (Object.keys(style).some((key) => !allowed.has(key))) throw new Error("Unknown cell style.");
  for (const flag of [style.bold, style.italic, style.underline, style.strikethrough, style.wrap])
    if (flag !== undefined && typeof flag !== "boolean") throw new Error("Invalid style toggle.");
  for (const color of [style.color, style.background])
    if (color !== undefined && !/^#[\da-f]{6}$/i.test(color))
      throw new Error("Colors must use six-digit hex values.");
  if (
    style.fontFamily !== undefined &&
    (typeof style.fontFamily !== "string" || !/^[\p{L}\p{N} ,_-]{1,80}$/u.test(style.fontFamily))
  )
    throw new Error("Font families must be plain names up to 80 characters.");
  if (
    style.fontSize !== undefined &&
    (!Number.isFinite(style.fontSize) || style.fontSize < 8 || style.fontSize > 72)
  )
    throw new Error("Font sizes must be between 8 and 72 points.");
  for (const border of [style.borderTop, style.borderRight, style.borderBottom, style.borderLeft])
    if (
      border !== undefined &&
      (!isObject(border) ||
        Object.keys(border).some((key) => !["style", "color", "width"].includes(key)) ||
        !["solid", "dashed", "dotted"].includes(String(border.style)) ||
        typeof border.color !== "string" ||
        !/^#[\da-f]{6}$/i.test(border.color) ||
        ![1, 2, 3].includes(Number(border.width)) ||
        typeof border.width !== "number")
    )
      throw new Error("Invalid cell border.");
  if (style.align !== undefined && !["left", "center", "right"].includes(style.align))
    throw new Error("Invalid alignment.");
  if (
    style.verticalAlign !== undefined &&
    !["top", "middle", "bottom"].includes(style.verticalAlign)
  )
    throw new Error("Invalid vertical alignment.");
  if (
    style.format !== undefined &&
    !["general", "number", "currency", "percent", "date", "text"].includes(style.format)
  )
    throw new Error("Invalid number format.");
  if (
    style.decimals !== undefined &&
    (!Number.isInteger(style.decimals) || style.decimals < 0 || style.decimals > 10)
  )
    throw new Error("Decimals must be between 0 and 10.");
}

/** Small literal lists round-trip through Excel's inline validation format. */
export function validateCellValidation(value: unknown): asserts value is CellValidation {
  if (
    !isObject(value) ||
    value["type"] !== "list" ||
    Object.keys(value).some((key) => !["type", "options", "allowBlank"].includes(key)) ||
    !Array.isArray(value["options"]) ||
    !value["options"].length ||
    value["options"].length > 100 ||
    !value["options"].every(
      (option: unknown) =>
        typeof option === "string" &&
        !!option.trim() &&
        !/[",\r\n]/.test(option) &&
        !option.startsWith("="),
    ) ||
    new Set(value["options"]).size !== value["options"].length ||
    value["options"].join(",").length > 250 ||
    (value["allowBlank"] !== undefined && typeof value["allowBlank"] !== "boolean")
  )
    throw new Error(
      "Dropdowns need 1–100 unique choices, up to 250 characters combined, without commas, quotes, newlines or leading =.",
    );
}
function validateDropdownValue(value: string, validation: CellValidation | undefined): void {
  if (
    validation &&
    !(value === "" && validation.allowBlank !== false) &&
    !validation.options.includes(value)
  )
    throw new Error("Choose one of this cell's dropdown choices.");
}
function requireAnalysis(sheet: Sheet): void {
  if (sheet.mode !== "freeform")
    throw new Error(
      "Comments and dropdown rules belong in an analysis sheet. Source fields are managed by their records.",
    );
}
function requireWritableCell(sheet: Sheet, rowId: string, columnId: string): void {
  const row = sheet.rows.find((entry) => entry.id === rowId);
  const column = sheet.columns.find((entry) => entry.id === columnId);
  if (!row || !column) throw new Error("The target cell no longer exists.");
  if (row.readonly || column.readonly) throw new Error("This cell is read only.");
}

/** Shared by typing, paste, fill, and imported edits. Host authorization still applies. */
export function validateValue(value: string, column: SheetColumn, mode: Sheet["mode"]): void {
  if (typeof value !== "string" || value.length > LIMITS.inputLength)
    throw new Error(`Cells support up to ${LIMITS.inputLength.toLocaleString()} characters.`);
  if (column.required && !value.trim()) throw new Error(`${column.name} is required.`);
  if (!value) return;
  if (value.startsWith("=")) {
    if (mode === "records")
      throw new Error(`${column.name} is a record field. Put formulas in an analysis sheet.`);
    return;
  }
  if (
    column.type === "number" &&
    (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ||
      !Number.isFinite(Number(value)))
  )
    throw new Error(`${column.name} must be a number.`);
  if (column.type === "boolean" && !/^(true|false)$/i.test(value))
    throw new Error(`${column.name} must be TRUE or FALSE.`);
  if (column.type === "select" && !column.options?.includes(value))
    throw new Error(`${column.name} must be one of its dropdown choices.`);
  if (column.type === "date") {
    const date = new Date(`${value}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      throw new Error(`${column.name} must be a valid YYYY-MM-DD date.`);
  }
}

function writeCell(sheet: Sheet, rowId: string, columnId: string, cell: Cell): void {
  if (!cell.input && !cell.style && !cell.binding && !cell.comment && !cell.validation) {
    if (sheet.cells[rowId]) {
      delete sheet.cells[rowId]![columnId];
      if (!Object.keys(sheet.cells[rowId]!).length) delete sheet.cells[rowId];
    }
    return;
  }
  (sheet.cells[rowId] ??= {})[columnId] = cell;
}

function editsInto(sheet: Sheet, edits: CellEdit[]): void {
  if (edits.length > LIMITS.edits)
    throw new Error(`Edit at most ${LIMITS.edits.toLocaleString()} cells at once.`);
  const rows = new Map(sheet.rows.map((row) => [row.id, row]));
  const columns = new Map(sheet.columns.map((column) => [column.id, column]));
  const seen = new Set<string>();
  for (const edit of edits) {
    const row = rows.get(edit.rowId);
    const column = columns.get(edit.columnId);
    if (!row || !column) throw new Error("An edited row or column no longer exists.");
    if (column.readonly || row.readonly) throw new Error(`${column.name} is read only.`);
    const key = JSON.stringify([edit.rowId, edit.columnId]);
    if (seen.has(key)) throw new Error("A cell occurs twice in one edit.");
    seen.add(key);
    validateValue(edit.value, column, sheet.mode);
    validateDropdownValue(edit.value, getCell(sheet, edit.rowId, edit.columnId)?.validation);
  }
  for (const edit of edits) {
    const row = rows.get(edit.rowId)!;
    const column = columns.get(edit.columnId)!;
    const binding =
      row.recordId && column.fieldId
        ? {
            recordId: row.recordId,
            fieldId: column.fieldId,
            ...(row.revision ? { revision: row.revision } : {}),
          }
        : undefined;
    writeCell(sheet, edit.rowId, edit.columnId, {
      ...getCell(sheet, edit.rowId, edit.columnId),
      input: edit.value,
      ...(binding ? { binding } : {}),
    });
  }
}

export function applyEdits(
  workbook: Workbook,
  sheetId: string,
  edits: CellEdit[],
  options: { expectedRevision?: number } = {},
): Workbook {
  return applyOperation(workbook, { type: "edit", sheetId, edits }, options);
}

function boundedPositions(sheet: Sheet, range: CellRange): Position[] {
  const normalized = normalizeRange(range);
  if (normalized.end.row >= sheet.rows.length || normalized.end.column >= sheet.columns.length)
    throw new Error("Add rows or columns before editing outside this sheet.");
  return rangePositions(range);
}
function positionedEdit(sheet: Sheet, position: Position, value: string): CellEdit {
  const row = sheet.rows[position.row];
  const column = sheet.columns[position.column];
  if (!row || !column) throw new Error("The target lies outside this sheet.");
  return { rowId: row.id, columnId: column.id, value };
}

function changeFormulas(
  workbook: Workbook,
  transform: (input: string, sheet: Sheet) => string,
): void {
  for (const sheet of workbook.sheets.filter((sheet) => sheet.mode === "freeform"))
    for (const row of Object.values(sheet.cells))
      for (const cell of Object.values(row)) {
        if (cell.input.startsWith("=") && cell.style?.format !== "text")
          cell.input = transform(cell.input, sheet);
      }
}

function availableName(workbook: Workbook, stem: string): string {
  let name = stem.slice(0, 31);
  for (
    let index = 2;
    workbook.sheets.some((sheet) => sheet.name.toLowerCase() === name.toLowerCase());
    index++
  )
    name = `${stem.slice(0, 26)} ${index}`;
  return name;
}

/** One operation is atomic, immutable, revision checked, and one history entry. */
export function applyOperation(
  workbook: Workbook,
  operation: WorkbookOperation,
  options: { expectedRevision?: number } = {},
): Workbook {
  if (options.expectedRevision !== undefined && options.expectedRevision !== workbook.revision)
    throw new Error(
      "The workbook changed. Review the latest version before applying this operation.",
    );
  if (
    [
      "insert-rows",
      "delete-rows",
      "insert-columns",
      "delete-columns",
      "rename-sheet",
      "delete-sheet",
    ].includes(operation.type) &&
    workbook.sheets.some(
      (sheet) =>
        sheet.mode === "freeform" &&
        Object.values(sheet.cells).some((row) =>
          Object.values(row).some(
            (cell) => cell.style?.format !== "text" && hasUnrewritableReferences(cell.input),
          ),
        ),
    )
  )
    throw new Error(
      "Replace INDIRECT, external, structured or 3-D references with direct cell references before changing workbook structure.",
    );
  const next = clone(workbook);
  const sheet = "sheetId" in operation ? getSheet(next, operation.sheetId) : undefined;
  switch (operation.type) {
    case "edit":
      editsInto(sheet!, operation.edits);
      break;
    case "set-conditional-formats": {
      validateConditionalFormats(operation.rules, sheet!);
      if (operation.rules.length) sheet!.conditionalFormats = clone(operation.rules);
      else delete sheet!.conditionalFormats;
      break;
    }
    case "paste-cells": {
      if (!["all", "values", "formatting"].includes(operation.mode))
        throw new Error("Unknown paste mode.");
      if (operation.mode === "formatting" && operation.edits.length)
        throw new Error("Formatting paste cannot change values.");
      if (operation.mode === "values" && operation.styles?.length)
        throw new Error("Values paste cannot replace formatting.");
      const styles = operation.styles ?? [];
      if (styles.length > LIMITS.edits) throw new Error("Paste a smaller formatting range.");
      const seen = new Set<string>();
      for (const edit of styles) {
        const key = JSON.stringify([edit.rowId, edit.columnId]);
        if (seen.has(key)) throw new Error("A style occurs twice in one paste.");
        seen.add(key);
        if (
          !sheet!.rows.some((row) => row.id === edit.rowId) ||
          !sheet!.columns.some((column) => column.id === edit.columnId)
        )
          throw new Error("A pasted cell no longer exists.");
        if (edit.style !== null) {
          validateStyle(edit.style);
          if (
            sheet!.mode === "records" &&
            (edit.style.format !== undefined || edit.style.decimals !== undefined)
          )
            throw new Error("Source field types are managed by their records.");
        }
      }
      const affected = new Set([
        ...seen,
        ...operation.edits.map((edit) => JSON.stringify([edit.rowId, edit.columnId])),
      ]);
      if (affected.size > LIMITS.edits)
        throw new Error("Paste a smaller combined value and formatting range.");
      editsInto(sheet!, operation.edits);
      for (const edit of styles) {
        const cell = getCell(sheet!, edit.rowId, edit.columnId) ?? { input: "" };
        const keepLiteral = operation.mode === "formatting" && cell.style?.format === "text";
        if (edit.style) {
          const replacement = clone(edit.style);
          // Formatting paste must not turn formulas/numbers into literal text.
          if (operation.mode === "formatting" && replacement.format === "text" && !keepLiteral) {
            if (cell.style?.format) replacement.format = cell.style.format;
            else delete replacement.format;
          }
          cell.style = {
            ...replacement,
            ...(keepLiteral ? { format: "text" as const } : {}),
          };
        } else if (keepLiteral) cell.style = { format: "text" };
        else delete cell.style;
        writeCell(sheet!, edit.rowId, edit.columnId, cell);
      }
      break;
    }
    case "paste": {
      const width = Math.max(0, ...operation.values.map((row) => row.length));
      if (!width || !operation.values.length) return workbook;
      if (
        !Number.isInteger(operation.start.row) ||
        !Number.isInteger(operation.start.column) ||
        operation.start.row < 0 ||
        operation.start.column < 0
      )
        throw new Error("Invalid paste location.");
      if (width * operation.values.length > LIMITS.edits) throw new Error("Paste a smaller range.");
      const edits = operation.values.flatMap((row, r) =>
        Array.from({ length: width }, (_, c) =>
          positionedEdit(
            sheet!,
            { row: operation.start.row + r, column: operation.start.column + c },
            row[c] ?? "",
          ),
        ),
      );
      editsInto(sheet!, edits);
      break;
    }
    case "fill": {
      const source = normalizeRange(operation.source);
      boundedPositions(sheet!, source);
      const target = boundedPositions(sheet!, operation.target);
      const sourceSheet = getSheet(workbook, sheet!.id);
      const height = source.end.row - source.start.row + 1;
      const width = source.end.column - source.start.column + 1;
      const copies = target.map((position) => {
        const from = {
          row:
            source.start.row + ((((position.row - source.start.row) % height) + height) % height),
          column:
            source.start.column +
            ((((position.column - source.start.column) % width) + width) % width),
        };
        const original = cellAt(sourceSheet, from);
        let input =
          original?.style?.format === "text"
            ? original.input
            : translateFormula(original?.input ?? "", from, position);
        if (operation.series && width === 1 && height >= 2) {
          const first = cellAt(sourceSheet, source.start)?.input ?? "";
          const second =
            cellAt(sourceSheet, { row: source.start.row + 1, column: source.start.column })
              ?.input ?? "";
          if (
            first.trim() &&
            second.trim() &&
            Number.isFinite(Number(first)) &&
            Number.isFinite(Number(second))
          )
            input = String(
              Number(first) + (Number(second) - Number(first)) * (position.row - source.start.row),
            );
        }
        return { position, original, edit: positionedEdit(sheet!, position, input) };
      });
      editsInto(
        sheet!,
        copies.map((copy) => copy.edit),
      );
      for (const copy of copies)
        if (copy.original?.style) {
          writeCell(sheet!, copy.edit.rowId, copy.edit.columnId, {
            ...(getCell(sheet!, copy.edit.rowId, copy.edit.columnId) ?? { input: copy.edit.value }),
            style: clone(copy.original.style),
          });
        }
      break;
    }
    case "format": {
      validateStyle(operation.style);
      if (
        sheet!.mode === "records" &&
        (operation.style.format !== undefined || operation.style.decimals !== undefined)
      )
        throw new Error(
          "Source field types are managed by their records. Change number formats in an analysis sheet.",
        );
      for (const position of boundedPositions(sheet!, operation.range)) {
        if (
          operation.visibleOnly &&
          (sheet!.rows[position.row]!.hidden || sheet!.columns[position.column]!.hidden)
        )
          continue;
        const edit = positionedEdit(sheet!, position, "");
        const previous = getCell(sheet!, edit.rowId, edit.columnId) ?? { input: "" };
        writeCell(sheet!, edit.rowId, edit.columnId, {
          ...previous,
          style: { ...previous.style, ...operation.style },
        });
      }
      break;
    }
    case "borders": {
      const { preset, border } = operation;
      if (!["all", "outside", "inside", "top", "right", "bottom", "left", "none"].includes(preset))
        throw new Error("Choose a supported border preset.");
      if (border !== undefined) validateStyle({ borderTop: border });
      if (preset !== "none" && border === undefined)
        throw new Error("Choose a border style before applying borders.");
      const positions = boundedPositions(sheet!, operation.range).filter(
        ({ row, column }) =>
          !operation.visibleOnly || (!sheet!.rows[row]!.hidden && !sheet!.columns[column]!.hidden),
      );
      if (!positions.length) break;
      const top = positions[0]!.row;
      const bottom = positions.at(-1)!.row;
      const left = Math.min(...positions.map(({ column }) => column));
      const right = Math.max(...positions.map(({ column }) => column));
      const sides = ["borderTop", "borderRight", "borderBottom", "borderLeft"] as const;
      const replace = ["all", "outside", "inside", "none"].includes(preset);
      for (const position of positions) {
        const edit = positionedEdit(sheet!, position, "");
        const previous = getCell(sheet!, edit.rowId, edit.columnId);
        const style = { ...previous?.style };
        if (replace) for (const side of sides) delete style[side];
        const outer = [
          position.row === top,
          position.column === right,
          position.row === bottom,
          position.column === left,
        ];
        const namedSide = {
          top: "borderTop",
          right: "borderRight",
          bottom: "borderBottom",
          left: "borderLeft",
        } as const;
        sides.forEach((side, index) => {
          const apply =
            preset === "all" ||
            (preset === "outside" && outer[index]) ||
            (preset === "inside" && !outer[index]) ||
            (preset in namedSide &&
              namedSide[preset as keyof typeof namedSide] === side &&
              outer[index]);
          if (apply) style[side] = clone(border!);
        });
        // Border clearing should not materialize empty cells or erase other metadata.
        if (!previous && !Object.keys(style).length) continue;
        const cell: Cell = { ...(previous ?? { input: "" }) };
        if (Object.keys(style).length) cell.style = style;
        else delete cell.style;
        writeCell(sheet!, edit.rowId, edit.columnId, cell);
      }
      break;
    }
    case "set-comment": {
      requireAnalysis(sheet!);
      requireWritableCell(sheet!, operation.rowId, operation.columnId);
      if (
        operation.comment !== null &&
        (typeof operation.comment !== "string" || operation.comment.length > LIMITS.inputLength)
      )
        throw new Error("Comments support up to 10,000 characters.");
      const cell = getCell(sheet!, operation.rowId, operation.columnId) ?? { input: "" };
      if (operation.comment) cell.comment = operation.comment;
      else delete cell.comment;
      writeCell(sheet!, operation.rowId, operation.columnId, cell);
      break;
    }
    case "set-validation": {
      requireAnalysis(sheet!);
      if (operation.validation !== null) validateCellValidation(operation.validation);
      for (const position of boundedPositions(sheet!, operation.range)) {
        const edit = positionedEdit(sheet!, position, "");
        if (sheet!.rows[position.row]!.readonly || sheet!.columns[position.column]!.readonly)
          throw new Error("This cell is read only.");
        const cell = getCell(sheet!, edit.rowId, edit.columnId) ?? { input: "" };
        if (operation.validation) {
          validateDropdownValue(cell.input, operation.validation);
          cell.validation = clone(operation.validation);
        } else delete cell.validation;
        writeCell(sheet!, edit.rowId, edit.columnId, cell);
      }
      break;
    }
    case "clear-formatting": {
      for (const position of boundedPositions(sheet!, operation.range)) {
        if (
          operation.visibleOnly &&
          (sheet!.rows[position.row]!.hidden || sheet!.columns[position.column]!.hidden)
        )
          continue;
        const edit = positionedEdit(sheet!, position, "");
        const cell = getCell(sheet!, edit.rowId, edit.columnId);
        if (cell) {
          // Text is also the imported/source-copy literal type marker. Removing it
          // must not turn a record's formula-shaped prose into executable input.
          if (cell.style?.format === "text") cell.style = { format: "text" };
          else delete cell.style;
          writeCell(sheet!, edit.rowId, edit.columnId, cell);
        }
      }
      break;
    }
    case "set-rows-hidden":
    case "set-columns-hidden": {
      const rows = operation.type === "set-rows-hidden";
      const ids = rows ? operation.rowIds : operation.columnIds;
      const entries = rows ? sheet!.rows : sheet!.columns;
      const selected = new Set(ids);
      const existing = new Set(entries.map((entry) => entry.id));
      if (
        typeof operation.hidden !== "boolean" ||
        !ids.length ||
        selected.size !== ids.length ||
        ids.some((id) => !existing.has(id))
      )
        throw new Error("Choose existing rows or columns to show or hide.");
      for (const entry of entries)
        if (selected.has(entry.id)) {
          if (operation.hidden) entry.hidden = true;
          else delete entry.hidden;
        }
      if (entries.every((entry) => entry.hidden))
        throw new Error("Keep at least one row and column visible.");
      break;
    }
    case "resize-row": {
      const row = sheet!.rows.find((entry) => entry.id === operation.rowId);
      if (
        !row ||
        !Number.isFinite(operation.height) ||
        operation.height < 24 ||
        operation.height > 240
      )
        throw new Error("Row heights must be between 24 and 240 pixels.");
      row.height = operation.height;
      break;
    }
    case "clear": {
      const positions = boundedPositions(sheet!, operation.range);
      const edits = positions.map((position) => positionedEdit(sheet!, position, ""));
      editsInto(sheet!, edits);
      if (operation.formatting)
        for (const edit of edits) {
          const cell = getCell(sheet!, edit.rowId, edit.columnId);
          if (cell) {
            delete cell.style;
            writeCell(sheet!, edit.rowId, edit.columnId, cell);
          }
        }
      break;
    }
    case "add-sheet": {
      const added = operation.sheet
        ? clone(operation.sheet)
        : createSheet(operation.name ?? availableName(next, "Sheet"));
      validateSheetName(added.name, next.sheets);
      next.sheets.push(added);
      break;
    }
    case "rename-sheet": {
      validateSheetName(operation.name, next.sheets, sheet!.id);
      const previous = sheet!.name;
      changeFormulas(next, (input) => renameFormulaSheet(input, previous, operation.name));
      sheet!.name = operation.name;
      break;
    }
    case "delete-sheet": {
      if (next.sheets.length === 1) throw new Error("Keep at least one sheet.");
      next.sheets = next.sheets.filter((entry) => entry.id !== sheet!.id);
      changeFormulas(next, (input) => renameFormulaSheet(input, sheet!.name, null));
      break;
    }
    case "duplicate-sheet": {
      const duplicated = clone(sheet!);
      duplicated.id = newId("sheet");
      duplicated.name = operation.name ?? availableName(next, `${sheet!.name} copy`);
      validateSheetName(duplicated.name, next.sheets);
      // A copy is an independent analysis snapshot, never a second writable record view.
      duplicated.mode = "freeform";
      if (sheet!.mode === "records")
        for (const cells of Object.values(duplicated.cells))
          for (const [columnId, cell] of Object.entries(cells)) {
            const type = sheet!.columns.find((column) => column.id === columnId)?.type;
            if (cell.input.startsWith("=") || (type !== "number" && type !== "boolean"))
              cell.style = { ...cell.style, format: "text" };
          }
      const columns = new Map(duplicated.columns.map((column) => [column.id, newId("column")]));
      const rows = new Map(duplicated.rows.map((row) => [row.id, newId("row")]));
      duplicated.columns = duplicated.columns.map(
        ({ fieldId: _field, readonly: _readonly, ...column }) => ({
          ...column,
          id: columns.get(column.id)!,
        }),
      );
      duplicated.rows = duplicated.rows.map(
        ({ recordId: _recordId, revision: _revision, readonly: _readonly, ...row }) => ({
          ...row,
          id: rows.get(row.id)!,
        }),
      );
      duplicated.cells = Object.fromEntries(
        Object.entries(duplicated.cells).map(([rowId, cells]) => [
          rows.get(rowId)!,
          Object.fromEntries(
            Object.entries(cells).map(([columnId, { binding: _binding, ...cell }]) => [
              columns.get(columnId)!,
              cell,
            ]),
          ),
        ]),
      );
      if (duplicated.conditionalFormats)
        duplicated.conditionalFormats = duplicated.conditionalFormats.map((rule) => ({
          ...rule,
          id: newId("rule"),
          rowIds: rule.rowIds.map((id) => rows.get(id)!),
          columnIds: rule.columnIds.map((id) => columns.get(id)!),
        }));
      next.sheets.push(duplicated);
      break;
    }
    case "move-sheet": {
      if (
        !Number.isInteger(operation.index) ||
        operation.index < 0 ||
        operation.index >= next.sheets.length
      )
        throw new Error("Invalid sheet position.");
      next.sheets = next.sheets.filter((item) => item.id !== sheet!.id);
      next.sheets.splice(operation.index, 0, sheet!);
      break;
    }
    case "insert-rows":
    case "delete-rows":
    case "insert-columns":
    case "delete-columns": {
      if (sheet!.mode === "records")
        throw new Error(
          "Record structure is managed by its source. Duplicate this sheet to restructure an analysis copy.",
        );
      const axis = operation.type.endsWith("rows") ? "row" : "column";
      const remove = operation.type.startsWith("delete");
      const entries = axis === "row" ? sheet!.rows : sheet!.columns;
      checkCount(operation.count, axis === "row" ? LIMITS.rows : LIMITS.columns, axis);
      if (
        !Number.isInteger(operation.index) ||
        operation.index < 0 ||
        operation.index > entries.length ||
        (remove && operation.index + operation.count > entries.length)
      )
        throw new Error("Invalid structural range.");
      if (remove && entries.length <= operation.count)
        throw new Error("Keep at least one row and column.");
      if (
        !remove &&
        entries.length + operation.count > (axis === "row" ? LIMITS.rows : LIMITS.columns)
      )
        throw new Error("The sheet would exceed its size limit.");
      changeFormulas(next, (input, home) =>
        shiftFormulaAxis(
          input,
          home.name,
          sheet!.name,
          axis,
          operation.index,
          operation.count,
          remove,
        ),
      );
      if (axis === "row") {
        const removed = sheet!.rows.splice(
          operation.index,
          remove ? operation.count : 0,
          ...(remove ? [] : Array.from({ length: operation.count }, () => ({ id: newId("row") }))),
        );
        for (const row of removed) delete sheet!.cells[row.id];
        sheet!.frozenRows = Math.min(sheet!.frozenRows, sheet!.rows.length);
      } else {
        const removed = sheet!.columns.splice(
          operation.index,
          remove ? operation.count : 0,
          ...(remove
            ? []
            : Array.from({ length: operation.count }, (_, i) => ({
                id: newId("column"),
                name: columnName(operation.index + i),
                width: 140,
              }))),
        );
        for (const column of removed)
          for (const row of Object.values(sheet!.cells)) delete row[column.id];
        sheet!.frozenColumns = Math.min(sheet!.frozenColumns, sheet!.columns.length);
      }
      break;
    }
    case "freeze": {
      if (
        !Number.isInteger(operation.rows) ||
        !Number.isInteger(operation.columns) ||
        operation.rows < 0 ||
        operation.columns < 0 ||
        operation.rows > sheet!.rows.length ||
        operation.columns > sheet!.columns.length
      )
        throw new Error("Invalid frozen pane size.");
      sheet!.frozenRows = operation.rows;
      sheet!.frozenColumns = operation.columns;
      break;
    }
    case "resize-column": {
      const column = sheet!.columns.find((entry) => entry.id === operation.columnId);
      if (
        !column ||
        !Number.isFinite(operation.width) ||
        operation.width < 48 ||
        operation.width > 640
      )
        throw new Error("Column widths must be between 48 and 640 pixels.");
      column.width = operation.width;
      break;
    }
  }
  for (const target of next.sheets) normalizeConditionalFormats(target);
  next.revision = workbook.revision + 1;
  validateWorkbook(next);
  return next;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[\w-]{1,160}$/.test(value) &&
    !["__proto__", "constructor", "prototype"].includes(value)
  );
}

/** Validate untrusted local files before exposing them as typed workbook state. */
export function validateWorkbook(value: unknown): asserts value is Workbook {
  if (
    !isObject(value) ||
    value["version"] !== 1 ||
    !validId(value["id"]) ||
    typeof value["name"] !== "string" ||
    value["name"].length > 200 ||
    !Number.isSafeInteger(value["revision"]) ||
    Number(value["revision"]) < 0 ||
    !Array.isArray(value["sheets"]) ||
    !value["sheets"].length ||
    value["sheets"].length > LIMITS.sheets
  )
    throw new Error("Invalid workbook snapshot.");
  const ids = new Set<string>();
  const names = new Set<string>();
  let cellCount = 0;
  for (const sheet of value["sheets"]) {
    if (
      !isObject(sheet) ||
      !validId(sheet["id"]) ||
      ids.has(sheet["id"]) ||
      typeof sheet["name"] !== "string" ||
      !["freeform", "records"].includes(String(sheet["mode"])) ||
      !Array.isArray(sheet["rows"]) ||
      !Array.isArray(sheet["columns"]) ||
      !isObject(sheet["cells"])
    )
      throw new Error("Invalid sheet in snapshot.");
    ids.add(sheet["id"]);
    validateSheetName(sheet["name"]);
    if (names.has(sheet["name"].toLowerCase())) throw new Error("Duplicate sheet names.");
    names.add(sheet["name"].toLowerCase());
    checkCount(sheet["rows"].length, LIMITS.rows, "rows");
    checkCount(sheet["columns"].length, LIMITS.columns, "columns");
    const rowIds = new Set<string>();
    const columnIds = new Set<string>();
    for (const row of sheet["rows"]) {
      if (
        !isObject(row) ||
        !validId(row["id"]) ||
        rowIds.has(row["id"]) ||
        (row["recordId"] !== undefined && typeof row["recordId"] !== "string") ||
        (row["revision"] !== undefined && typeof row["revision"] !== "string") ||
        (row["readonly"] !== undefined && typeof row["readonly"] !== "boolean") ||
        (row["hidden"] !== undefined && typeof row["hidden"] !== "boolean") ||
        (row["height"] !== undefined &&
          (typeof row["height"] !== "number" ||
            !Number.isFinite(row["height"]) ||
            row["height"] < 24 ||
            row["height"] > 240))
      )
        throw new Error("Invalid row identity.");
      rowIds.add(row["id"]);
    }
    for (const column of sheet["columns"]) {
      if (
        !isObject(column) ||
        !validId(column["id"]) ||
        columnIds.has(column["id"]) ||
        typeof column["name"] !== "string" ||
        column["name"].length > 200 ||
        (column["fieldId"] !== undefined && typeof column["fieldId"] !== "string") ||
        (column["type"] !== undefined &&
          !["text", "number", "date", "boolean", "select"].includes(String(column["type"]))) ||
        (column["options"] !== undefined &&
          (!Array.isArray(column["options"]) ||
            column["options"].length > 1000 ||
            !column["options"].every(
              (item: unknown) => typeof item === "string" && item.length <= LIMITS.inputLength,
            ))) ||
        (column["readonly"] !== undefined && typeof column["readonly"] !== "boolean") ||
        (column["required"] !== undefined && typeof column["required"] !== "boolean") ||
        (column["hidden"] !== undefined && typeof column["hidden"] !== "boolean") ||
        (column["width"] !== undefined &&
          (typeof column["width"] !== "number" ||
            !Number.isFinite(column["width"]) ||
            column["width"] < 48 ||
            column["width"] > 640))
      )
        throw new Error("Invalid column definition.");
      columnIds.add(column["id"]);
    }
    if (
      sheet["rows"].every((row: { hidden?: boolean }) => row.hidden) ||
      sheet["columns"].every((column: { hidden?: boolean }) => column.hidden)
    )
      throw new Error("Keep at least one row and column visible.");
    if (sheet["conditionalFormats"] !== undefined)
      validateConditionalFormats(sheet["conditionalFormats"], sheet as unknown as Sheet);
    for (const [rowId, cells] of Object.entries(sheet["cells"])) {
      if (!rowIds.has(rowId) || !isObject(cells)) throw new Error("Cell refers to an unknown row.");
      for (const [columnId, cell] of Object.entries(cells)) {
        cellCount++;
        if (cellCount > LIMITS.cells) throw new Error("Workbook has too many populated cells.");
        if (
          !columnIds.has(columnId) ||
          !isObject(cell) ||
          typeof cell["input"] !== "string" ||
          cell["input"].length > LIMITS.inputLength
        )
          throw new Error("Invalid cell source.");
        if (cell["style"] !== undefined) validateStyle(cell["style"] as CellStyle);
        if (
          cell["comment"] !== undefined &&
          (sheet["mode"] !== "freeform" ||
            typeof cell["comment"] !== "string" ||
            cell["comment"].length > LIMITS.inputLength)
        )
          throw new Error("Invalid analysis comment.");
        if (cell["validation"] !== undefined) {
          if (sheet["mode"] !== "freeform")
            throw new Error("Dropdown rules belong in an analysis sheet.");
          validateCellValidation(cell["validation"]);
          validateDropdownValue(cell["input"], cell["validation"]);
        }
        if (
          cell["binding"] !== undefined &&
          (!isObject(cell["binding"]) ||
            typeof cell["binding"]["recordId"] !== "string" ||
            typeof cell["binding"]["fieldId"] !== "string" ||
            (cell["binding"]["revision"] !== undefined &&
              typeof cell["binding"]["revision"] !== "string"))
        )
          throw new Error("Invalid record binding.");
      }
    }
    for (const [key, limit] of [
      ["frozenRows", sheet["rows"].length],
      ["frozenColumns", sheet["columns"].length],
    ] as const)
      if (!Number.isInteger(sheet[key]) || Number(sheet[key]) < 0 || Number(sheet[key]) > limit)
        throw new Error("Invalid frozen pane size.");
  }
}

export function serializeWorkbook(workbook: Workbook): string {
  validateWorkbook(workbook);
  const json = JSON.stringify(workbook);
  if (bytes(json) > LIMITS.snapshotBytes)
    throw new Error("Workbook exceeds the snapshot size limit.");
  return json;
}
export function deserializeWorkbook(json: string): Workbook {
  if (bytes(json) > LIMITS.snapshotBytes)
    throw new Error("Workbook exceeds the snapshot size limit.");
  const value: unknown = JSON.parse(json);
  validateWorkbook(value);
  return value;
}

export function createHistory(initial: Workbook, limit = 40) {
  let current = clone(initial);
  const past: Workbook[] = [];
  const future: Workbook[] = [];
  const trim = () => {
    while (
      past.length > limit ||
      (past.length > 1 && bytes(JSON.stringify(past)) > LIMITS.snapshotBytes)
    )
      past.shift();
  };
  return {
    get current() {
      return current;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    apply(operation: WorkbookOperation): Workbook {
      const next = applyOperation(current, operation);
      if (next === current) return current;
      past.push(current);
      trim();
      future.length = 0;
      current = next;
      return current;
    },
    replace(next: Workbook): Workbook {
      validateWorkbook(next);
      past.push(current);
      trim();
      future.length = 0;
      current = { ...clone(next), revision: current.revision + 1 };
      return current;
    },
    undo(): Workbook {
      const previous = past.pop();
      if (previous) {
        future.push(current);
        current = { ...previous, revision: current.revision + 1 };
      }
      return current;
    },
    redo(): Workbook {
      const next = future.pop();
      if (next) {
        past.push(current);
        current = { ...next, revision: current.revision + 1 };
      }
      return current;
    },
  };
}
