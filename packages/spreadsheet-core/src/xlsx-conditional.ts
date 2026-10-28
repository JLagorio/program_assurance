import type { ConditionalFormattingOptions, ConditionalFormattingRule, Style } from "exceljs";
import { cellAddress as address, parseAddress } from "./address";
import {
  LIMITS,
  type CellStyle,
  type ConditionalCondition,
  type ConditionalFormatRule,
  type Sheet,
} from "./types";

const quoted = (value: string) => `"${value.replaceAll('"', '""')}"`;
const unquote = (value: string) => value.slice(1, -1).replaceAll('""', '"');
const operators = { gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=", neq: "<>" } as const;

function expression(condition: ConditionalCondition, cell: string): string {
  if (condition.kind === "number")
    return `IFERROR(AND(ISNUMBER(${cell}),${cell}${operators[condition.operator]}${condition.value}),FALSE)`;
  if (condition.kind === "blank")
    return `IFERROR(${cell}${condition.isBlank ? "=" : "<>"}"",FALSE)`;
  if (condition.operator === "equals")
    return condition.caseSensitive
      ? `IFERROR(EXACT(${cell},${quoted(condition.value)}),FALSE)`
      : `IFERROR(EXACT(LOWER(${cell}),LOWER(${quoted(condition.value)})),FALSE)`;
  const text = condition.caseSensitive ? condition.value : condition.value.replace(/[~*?]/g, "~$&");
  return `IFERROR(ISNUMBER(${condition.caseSensitive ? "FIND" : "SEARCH"}(${quoted(text)},${cell})),FALSE)`;
}

function parseExpression(formula: string, cell: string): ConditionalCondition | undefined {
  const escaped = cell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const number = new RegExp(
    `^IFERROR\\(AND\\(ISNUMBER\\(${escaped}\\),${escaped}(>=|<=|<>|>|<|=)([-+\\d.eE]+)\\),FALSE\\)$`,
  ).exec(formula);
  if (number && Number.isFinite(Number(number[2])))
    return {
      kind: "number",
      operator: (Object.keys(operators) as (keyof typeof operators)[]).find(
        (key) => operators[key] === number[1],
      )!,
      value: Number(number[2]),
    };
  if (formula === `IFERROR(${cell}="",FALSE)`) return { kind: "blank", isBlank: true };
  if (formula === `IFERROR(${cell}<>"",FALSE)`) return { kind: "blank", isBlank: false };
  const string = '("(?:[^"]|"")*")';
  const contains = new RegExp(
    `^IFERROR\\(ISNUMBER\\((FIND|SEARCH)\\(${string},${escaped}\\)\\),FALSE\\)$`,
  ).exec(formula);
  if (contains) {
    const value = unquote(contains[2]!);
    // SEARCH wildcards have different semantics; accept only escaped literal patterns.
    if (contains[1] === "SEARCH" && /(^|[^~])(?:~~)*[*?]/.test(value)) return undefined;
    return {
      kind: "text",
      operator: "contains",
      value: contains[1] === "SEARCH" ? value.replace(/~([~*?])/g, "$1") : value,
      caseSensitive: contains[1] === "FIND",
    };
  }
  const exact = new RegExp(`^IFERROR\\(EXACT\\(${escaped},${string}\\),FALSE\\)$`).exec(formula);
  if (exact)
    return { kind: "text", operator: "equals", value: unquote(exact[1]!), caseSensitive: true };
  const insensitive = new RegExp(
    `^IFERROR\\(EXACT\\(LOWER\\(${escaped}\\),LOWER\\(${string}\\)\\),FALSE\\)$`,
  ).exec(formula);
  if (insensitive)
    return {
      kind: "text",
      operator: "equals",
      value: unquote(insensitive[1]!),
      caseSensitive: false,
    };
  return undefined;
}

export function conditionalExcelStyle(style: CellStyle): Partial<Style> {
  const result: Partial<Style> = {};
  result.font = {
    ...(style.bold !== undefined ? { bold: style.bold } : {}),
    ...(style.italic !== undefined ? { italic: style.italic } : {}),
    ...(style.underline !== undefined ? { underline: style.underline } : {}),
    ...(style.strikethrough !== undefined ? { strike: style.strikethrough } : {}),
    ...(style.fontFamily ? { name: style.fontFamily } : {}),
    ...(style.fontSize ? { size: style.fontSize } : {}),
    ...(style.color ? { color: { argb: `FF${style.color.slice(1)}` } } : {}),
  };
  if (style.background)
    result.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${style.background.slice(1)}` },
    };
  result.alignment = {
    ...(style.align ? { horizontal: style.align } : {}),
    ...(style.verticalAlign ? { vertical: style.verticalAlign } : {}),
    ...(style.wrap !== undefined ? { wrapText: style.wrap } : {}),
  };
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const border = style[`border${side[0]!.toUpperCase()}${side.slice(1)}` as "borderTop"];
    if (border)
      (result.border ??= {})[side] = {
        style:
          border.style === "dotted"
            ? "dotted"
            : border.style === "dashed"
              ? border.width === 2
                ? "mediumDashed"
                : "dashed"
              : border.width === 3
                ? "thick"
                : border.width === 2
                  ? "medium"
                  : "thin",
        color: { argb: `FF${border.color.slice(1)}` },
      };
  }
  return result;
}

function runs(indices: number[]): [number, number][] {
  const output: [number, number][] = [];
  for (const index of indices) {
    const last = output.at(-1);
    if (last && last[1] === index - 1) last[1] = index;
    else output.push([index, index]);
  }
  return output;
}

export function exportConditionalFormats(sheet: Sheet): ConditionalFormattingOptions[] {
  return (sheet.conditionalFormats ?? []).map((rule, index, rules) => {
    if (
      [rule.style.bold, rule.style.italic, rule.style.underline, rule.style.strikethrough].includes(
        false,
      )
    )
      throw new Error(
        "XLSX cannot preserve conditional rules that clear font emphasis. Save a native workbook snapshot or remove those overrides first.",
      );
    const selectedRows = new Set(rule.rowIds),
      selectedColumns = new Set(rule.columnIds);
    const rows = runs(sheet.rows.flatMap((row, i) => (selectedRows.has(row.id) ? [i] : [])));
    const columns = runs(
      sheet.columns.flatMap((column, i) => (selectedColumns.has(column.id) ? [i] : [])),
    );
    if (rows.length * columns.length > 4096)
      throw new Error("Simplify fragmented conditional formatting ranges before exporting XLSX.");
    const ref = rows
      .flatMap(([r1, r2]) =>
        columns.map(
          ([c1, c2]) => `${address({ row: r1, column: c1 })}:${address({ row: r2, column: c2 })}`,
        ),
      )
      .join(" ");
    return {
      ref,
      rules: [
        {
          type: "expression",
          priority: rules.length - index,
          formulae: [
            expression(rule.condition, address({ row: rows[0]![0], column: columns[0]![0] })),
          ],
          style: conditionalExcelStyle(rule.style),
        },
      ],
    };
  });
}

export function conditionalDimensions(entries: ConditionalFormattingOptions[]): {
  rows: number;
  columns: number;
} {
  let rows = 0,
    columns = 0;
  for (const entry of entries.slice(0, 100))
    for (const part of entry.ref.split(/\s+/).slice(0, 4096)) {
      const end = parseAddress(part.split(":").at(-1) ?? "");
      if (end && end.row < LIMITS.rows && end.column < LIMITS.columns) {
        rows = Math.max(rows, end.row + 1);
        columns = Math.max(columns, end.column + 1);
      }
    }
  return { rows, columns };
}

export function importConditionalFormats(
  entries: ConditionalFormattingOptions[],
  sheet: Sheet,
  readStyle: (style: Partial<Style>) => CellStyle | undefined,
  warnings: Set<string>,
): void {
  const output: (ConditionalFormatRule & { priority: number })[] = [];
  if (entries.length > 100)
    warnings.add("Only the first 100 conditional formatting ranges were considered for import.");
  for (const entry of entries.slice(0, 100)) {
    try {
      const parts = entry.ref.split(/\s+/).filter(Boolean);
      if (parts.length > 4096) throw new Error("range limit");
      const ranges = parts.map((part) => {
        const [start, end = start] = part.split(":");
        const a = parseAddress(start!),
          b = parseAddress(end!);
        if (
          !a ||
          !b ||
          a.row > b.row ||
          a.column > b.column ||
          b.row >= sheet.rows.length ||
          b.column >= sheet.columns.length
        )
          throw new Error("range");
        return { a, b };
      });
      if (!ranges.length) throw new Error("range");
      const rowSet = new Set<number>(),
        columnSet = new Set<number>(),
        covered = new Set<number>();
      let visited = 0;
      for (const { a, b } of ranges) {
        visited += (b.row - a.row + 1) * (b.column - a.column + 1);
        if (visited > LIMITS.cells) throw new Error("scope limit");
        for (let row = a.row; row <= b.row; row++) {
          rowSet.add(row);
          for (let column = a.column; column <= b.column; column++) {
            columnSet.add(column);
            covered.add(row * LIMITS.columns + column);
          }
        }
      }
      // Native scopes are Cartesian sets of row/column identities, not arbitrary unions.
      if (covered.size !== rowSet.size * columnSet.size) throw new Error("scope");
      if (entry.rules.length > 100)
        warnings.add("Only the first 100 rules in an Excel range were considered for import.");
      for (const rule of entry.rules.slice(0, 100)) {
        if (output.length >= 100) {
          warnings.add("Only the first 100 supported conditional formatting rules were imported.");
          break;
        }
        const condition = readCondition(rule, address(ranges[0]!.a));
        if (!condition || ("stopIfTrue" in rule && rule.stopIfTrue)) {
          warnings.add("Unsupported Excel conditional formatting rules were omitted.");
          continue;
        }
        const style = readStyle(rule.style ?? {}) ?? {};
        delete style.format;
        delete style.decimals;
        output.push({
          id: crypto.randomUUID(),
          rowIds: [...rowSet].sort((a, b) => a - b).map((index) => sheet.rows[index]!.id),
          columnIds: [...columnSet].sort((a, b) => a - b).map((index) => sheet.columns[index]!.id),
          condition,
          style,
          priority: rule.priority,
        });
      }
    } catch {
      warnings.add("Unsupported Excel conditional formatting ranges were omitted.");
    }
  }
  const rules = output
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 100)
    .map(({ priority: _priority, ...rule }) => rule);
  if (rules.length) sheet.conditionalFormats = rules;
}

function readCondition(
  rule: ConditionalFormattingRule,
  cell: string,
): ConditionalCondition | undefined {
  if (rule.type === "expression" && typeof rule.formulae?.[0] === "string")
    return parseExpression(rule.formulae[0].replace(/^=/, ""), cell);
  if (rule.type === "cellIs" && rule.formulae?.length === 1) {
    const mapping = {
      greaterThan: "gt",
      greaterThanOrEqual: "gte",
      lessThan: "lt",
      lessThanOrEqual: "lte",
      equal: "eq",
      notEqual: "neq",
    } as const;
    const operator = mapping[rule.operator as keyof typeof mapping];
    const value = Number(rule.formulae[0]);
    if (operator && Number.isFinite(value) && String(rule.formulae[0]).trim() !== "")
      return { kind: "number", operator, value };
  }
  return undefined;
}
