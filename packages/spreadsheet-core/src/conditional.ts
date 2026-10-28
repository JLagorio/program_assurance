import type { CalculatedCell, CellStyle, ConditionalFormatRule, Sheet } from "./types";
import { LIMITS } from "./types";
import { validateStyle } from "./workbook";

/** Bounds and schema validation for JSON and app-authored rules, including source sheets. */
export function validateConditionalFormats(
  rules: unknown,
  sheet: Pick<Sheet, "rows" | "columns">,
): asserts rules is ConditionalFormatRule[] {
  if (!Array.isArray(rules) || rules.length > 100)
    throw new Error("Use at most 100 conditional rules per sheet.");
  const rows = new Set(sheet.rows.map((row) => row.id));
  const columns = new Set(sheet.columns.map((column) => column.id));
  const ids = new Set<string>();
  for (const rule of rules) {
    if (
      !rule ||
      typeof rule !== "object" ||
      typeof rule.id !== "string" ||
      !/^[\w-]{1,160}$/.test(rule.id) ||
      ids.has(rule.id) ||
      Object.keys(rule).some(
        (key) => !["id", "rowIds", "columnIds", "condition", "style"].includes(key),
      )
    )
      throw new Error("Invalid conditional rule identity.");
    ids.add(rule.id);
    for (const [selected, existing] of [
      [rule.rowIds, rows],
      [rule.columnIds, columns],
    ] as const)
      if (
        !Array.isArray(selected) ||
        !selected.length ||
        selected.length > existing.size ||
        new Set(selected).size !== selected.length ||
        selected.some((id: unknown) => typeof id !== "string" || !existing.has(id))
      )
        throw new Error("Conditional rules must target existing row and column identities.");
    if (rule.rowIds.length * rule.columnIds.length > LIMITS.cells)
      throw new Error("Conditional rules support at most 200,000 cells each.");
    const condition = rule.condition;
    if (!condition || typeof condition !== "object")
      throw new Error("Invalid conditional rule condition.");
    const allowed =
      condition.kind === "number"
        ? ["kind", "operator", "value"]
        : condition.kind === "text"
          ? ["kind", "operator", "value", "caseSensitive"]
          : ["kind", "isBlank"];
    if (Object.keys(condition).some((key) => !allowed.includes(key)))
      throw new Error("Unknown conditional rule condition.");
    if (condition.kind === "number") {
      if (
        !["gt", "gte", "lt", "lte", "eq", "neq"].includes(condition.operator) ||
        typeof condition.value !== "number" ||
        !Number.isFinite(condition.value)
      )
        throw new Error("Numeric conditional rules need a finite threshold.");
    } else if (condition.kind === "text") {
      if (
        !["contains", "equals"].includes(condition.operator) ||
        typeof condition.value !== "string" ||
        condition.value.length > LIMITS.inputLength ||
        (condition.caseSensitive !== undefined && typeof condition.caseSensitive !== "boolean")
      )
        throw new Error("Invalid text conditional rule.");
    } else if (condition.kind !== "blank" || typeof condition.isBlank !== "boolean")
      throw new Error("Unsupported conditional rule.");
    validateStyle(rule.style);
    if (rule.style.format !== undefined || rule.style.decimals !== undefined)
      throw new Error("Conditional rules change appearance, not value types.");
  }
}

/** Later matching rules override earlier fields. Errors never match; empty cells may match blank rules. */
export function conditionalCellStyle(
  sheet: Sheet,
  rowId: string,
  columnId: string,
  calculated?: CalculatedCell,
): CellStyle {
  const cell = sheet.cells[rowId]?.[columnId];
  const input = cell?.input ?? "";
  const column = sheet.columns.find((column) => column.id === columnId);
  const literal =
    cell?.style?.format === "text" ||
    (sheet.mode === "records" && column?.type !== "number" && column?.type !== "boolean");
  const rawNumber =
    !literal &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input) &&
    Number.isFinite(Number(input))
      ? Number(input)
      : undefined;
  const value = calculated?.value ?? (calculated?.type === "blank" ? null : (rawNumber ?? input));
  const style: CellStyle = {};
  if (calculated?.type === "error") return style;
  for (const rule of sheet.conditionalFormats ?? []) {
    if (!rule.rowIds.includes(rowId) || !rule.columnIds.includes(columnId)) continue;
    const condition = rule.condition;
    let matches = false;
    if (condition.kind === "blank")
      matches = (value === null || value === "") === condition.isBlank;
    else if (condition.kind === "text") {
      const text = String(value ?? "");
      const left = condition.caseSensitive ? text : text.toLocaleLowerCase("en-US");
      const right = condition.caseSensitive
        ? condition.value
        : condition.value.toLocaleLowerCase("en-US");
      matches = condition.operator === "contains" ? left.includes(right) : left === right;
    } else if (typeof value === "number") {
      const n = condition.value;
      matches = {
        gt: value > n,
        gte: value >= n,
        lt: value < n,
        lte: value <= n,
        eq: value === n,
        neq: value !== n,
      }[condition.operator];
    }
    if (matches) Object.assign(style, rule.style);
  }
  return style;
}

/** Remove deleted identities; insertion does not silently extend a rule onto unrelated records. */
export function normalizeConditionalFormats(sheet: Sheet): void {
  if (!sheet.conditionalFormats) return;
  const rows = new Set(sheet.rows.map((row) => row.id));
  const columns = new Set(sheet.columns.map((column) => column.id));
  sheet.conditionalFormats = sheet.conditionalFormats
    .map((rule) => ({
      ...rule,
      rowIds: rule.rowIds.filter((id) => rows.has(id)),
      columnIds: rule.columnIds.filter((id) => columns.has(id)),
    }))
    .filter((rule) => rule.rowIds.length && rule.columnIds.length);
  if (!sheet.conditionalFormats.length) delete sheet.conditionalFormats;
}
